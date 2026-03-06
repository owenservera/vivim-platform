import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { BaseTransport, createPeerId, SimpleTransportStream } from './base-transport.js';
import type { JSONRPCRequest, JSONRPCResponse, JSONRPCNotification } from '../types.js';
import type {
  StreamableTransportConfig,
  TransportMessage,
  SendResult,
  TransportConnection,
  TransportStream,
  PeerId,
  ConnectionState,
} from './types.js';

/**
 * Streamable Transport for MCP
 * 
 * Implements the streamable HTTP transport for Model Context Protocol.
 * This is the recommended transport for MCP as it supports:
 * - Bidirectional streaming
 * - Efficient message multiplexing
 * - Session management
 */
export class StreamableTransport extends BaseTransport {
  readonly type = 'streamable' as const;
  
  private sessions: Map<string, StreamSession> = new Map();
  private currentSession?: StreamSession;
  private messageHandler?: (message: JSONRPCRequest) => void;
  
  private encoding: 'json' | 'binary';
  private maxFrameSize: number;
  private pingInterval: number;
  
  constructor(config: StreamableTransportConfig = {}) {
    super(config);
    this.encoding = config.encoding ?? 'json';
    this.maxFrameSize = config.maxFrameSize ?? 1024 * 1024; // 1MB default
    this.pingInterval = config.pingInterval ?? 30000;
  }
  
  /**
   * Set message handler for incoming requests
   */
  onMessage(handler: (message: JSONRPCRequest) => void): void {
    this.messageHandler = handler;
  }
  
  /**
   * Get or create a session
   */
  getSession(sessionId?: string): StreamSession {
    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }
    
    const newSession = new StreamSession({
      id: sessionId ?? randomUUID(),
      encoding: this.encoding,
      maxFrameSize: this.maxFrameSize,
      pingInterval: this.pingInterval,
    });
    
    newSession.on('message', (message) => {
      if (this.messageHandler) {
        this.messageHandler(message);
      }
    });
    
    newSession.on('error', (error) => {
      this.emitError(error);
    });
    
    this.sessions.set(newSession.id, newSession);
    return newSession;
  }
  
  async start(): Promise<void> {
    if (this._isActive) return;
    
    this._localPeerId = { id: `streamable-${randomUUID()}` };
    this._isActive = true;
    
    this.log('Streamable transport started');
  }
  
  async stop(): Promise<void> {
    if (!this._isActive) return;
    
    // Close all sessions
    for (const session of this.sessions.values()) {
      await session.close();
    }
    this.sessions.clear();
    
    this._isActive = false;
    this.log('Streamable transport stopped');
  }
  
  async connect(peerId: PeerId | string): Promise<TransportConnection> {
    const id = typeof peerId === 'string' ? peerId : peerId.id;
    
    // For streamable transport, we create a virtual connection
    const connection = new StreamableConnection(
      { id },
      this.getSession()
    );
    
    this.registerConnection(connection);
    return connection;
  }
  
  async disconnect(peerId: PeerId | string): Promise<void> {
    const id = typeof peerId === 'string' ? peerId : peerId.id;
    this.unregisterConnection(id);
  }
  
  // @ts-ignore - Dual transport implementation
  async send(message: TransportMessage | JSONRPCResponse | JSONRPCNotification): Promise<SendResult | void> {
    try {
      const session = this.currentSession ?? Array.from(this.sessions.values())[0];
      
      if (!session) {
        if ('jsonrpc' in message) return;
        return {
          success: false,
          messageId: (message as TransportMessage).id,
          error: new Error('No active session'),
        };
      }
      
      const isJsonRpc = 'jsonrpc' in message;
      const jsonRpc = isJsonRpc ? (message as any) : this.messageToJSONRPC(message as TransportMessage);
      await session.send(jsonRpc);
      
      if (isJsonRpc) return;
      return {
        success: true,
        messageId: (message as TransportMessage).id,
        deliveredAt: Date.now(),
      };
    } catch (error) {
      if ('jsonrpc' in message) return;
      return {
        success: false,
        messageId: (message as TransportMessage).id,
        error: error as Error,
      };
    }
  }
  
  private messageToJSONRPC(message: TransportMessage): JSONRPCRequest | JSONRPCNotification {
    const payload = typeof message.payload === 'string' 
      ? JSON.parse(message.payload)
      : message.payload;
    
    if (message.metadata?.id) {
      return {
        jsonrpc: '2.0',
        id: message.metadata.id as string | number | null,
        method: message.type,
        params: payload as Record<string, unknown>,
      };
    }
    
    return {
      jsonrpc: '2.0',
      method: message.type,
      params: payload as Record<string, unknown>,
    };
  }
  
  async broadcast(topic: string, message: TransportMessage): Promise<void> {
    const sendPromises = Array.from(this.sessions.values()).map(
      session => session.send(this.messageToJSONRPC(message)).catch(() => {})
    );
    
    await Promise.allSettled(sendPromises);
  }
  
  async createStream(peerId: PeerId | string): Promise<TransportStream> {
    const session = this.getSession();
    return session.createStream();
  }
  
  getConnections(): TransportConnection[] {
    return [];
  }
  
  /**
   * Set the current active session
   */
  setCurrentSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.currentSession = session;
    }
  }
}

/**
 * Stream Session - manages a streamable connection
 */
export class StreamSession extends EventEmitter {
  readonly id: string;
  readonly encoding: 'json' | 'binary';
  readonly maxFrameSize: number;
  readonly pingInterval: number;
  
  private _active = true;
  private streams: Map<string, SimpleTransportStream> = new Map();
  private messageBuffer: string = '';
  private pingTimer?: ReturnType<typeof setInterval>;
  
  constructor(options: {
    id: string;
    encoding: 'json' | 'binary';
    maxFrameSize: number;
    pingInterval: number;
  }) {
    super();
    this.id = options.id;
    this.encoding = options.encoding;
    this.maxFrameSize = options.maxFrameSize;
    this.pingInterval = options.pingInterval;
    
    // Start ping interval
    this.startPing();
  }
  
  get active(): boolean {
    return this._active;
  }
  
  /**
   * Send a JSON-RPC message
   */
  async send(message: JSONRPCRequest | JSONRPCNotification | JSONRPCResponse): Promise<void> {
    if (!this._active) {
      throw new Error('Session is closed');
    }
    
    const data = JSON.stringify(message);
    
    // Format: JSON-LD style with length prefix
    const frame = `${data.length}\n${data}`;
    
    // In a real implementation, this would send over a stream
    // For now, we just emit the event
    this.emit('send', frame);
  }
  
  /**
   * Handle incoming data
   */
  handleData(data: string): void {
    this.messageBuffer += data;
    
    // Process complete messages (newline-separated)
    const lines = this.messageBuffer.split('\n');
    this.messageBuffer = lines.pop() ?? '';
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const message = JSON.parse(line);
        
        // Handle different message types
        if ('method' in message) {
          this.emit('message', message as JSONRPCRequest);
        } else if ('result' in message || 'error' in message) {
          this.emit('response', message as JSONRPCResponse);
        }
      } catch {
        // Ignore parse errors for incomplete messages
      }
    }
  }
  
  /**
   * Create a new stream within this session
   */
  createStream(): SimpleTransportStream {
    const stream = new SimpleTransportStream({
      id: `session-stream-${Date.now()}`,
      peerId: { id: this.id },
    });
    
    this.streams.set(stream.id, stream);
    
    stream.on('close', () => {
      this.streams.delete(stream.id);
    });
    
    return stream;
  }
  
  /**
   * Close the session
   */
  async close(): Promise<void> {
    this._active = false;
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    
    // Close all streams
    for (const stream of this.streams.values()) {
      await stream.close();
    }
    this.streams.clear();
    
    this.emit('close');
  }
  
  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this._active) {
        this.send({
          jsonrpc: '2.0',
          method: '/ping',
        }).catch(() => {});
      }
    }, this.pingInterval);
  }
}

/**
 * Streamable Connection
 */
class StreamableConnection extends EventEmitter implements TransportConnection {
  readonly peerId: PeerId;
  readonly remoteAddress: string;
  readonly localAddress: string;
  private _state: ConnectionState = 'connected';
  private session: StreamSession;
  private stream?: SimpleTransportStream;
  
  constructor(peerId: PeerId, session: StreamSession) {
    super();
    this.peerId = peerId;
    this.remoteAddress = `streamable://${session.id}`;
    this.localAddress = 'streamable://local';
    this.session = session;
  }
  
  get state(): ConnectionState {
    return this._state;
  }
  
  async createStream(): Promise<TransportStream> {
    if (!this.stream) {
      this.stream = this.session.createStream();
    }
    return this.stream;
  }
  
  async close(): Promise<void> {
    this._state = 'disconnected';
    this.stream?.close();
    this.emit('close');
  }
}

/**
 * Create Streamable transport
 */
export function createStreamableTransport(
  onMessage: (message: JSONRPCRequest) => void,
  options?: StreamableTransportConfig
): StreamableTransport {
  const transport = new StreamableTransport(options);
  transport.onMessage(onMessage);
  return transport;
}
