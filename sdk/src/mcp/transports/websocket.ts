import { randomUUID } from 'crypto';
import { WebSocket as WS, WebSocketServer, type RawData } from 'ws';
import type { IncomingMessage } from 'node:http';
import { EventEmitter } from 'node:events';
import type {
  WebSocketTransportConfig,
  TransportMessage,
  SendResult,
  TransportConnection,
  TransportStream,
  PeerId,
  ConnectionState,
} from './types.js';
import { BaseTransport, SimpleTransportStream } from './base-transport.js';

/**
 * WebSocket Transport
 * 
 * Implements WebSocket-based transport for P2P communication.
 */
export class WebSocketTransport extends BaseTransport {
  readonly type = 'websocket' as const;
  
  private wsConnections: Map<string, WS> = new Map();
  private server?: WebSocketServer;
  private localWebSocket?: WS;
  private url?: string;
  private secure: boolean;
  private wsFactory?: (url: string) => WS;
  
  constructor(config: WebSocketTransportConfig = {}) {
    super(config);
    this.url = config.url;
    this.secure = config.secure ?? false;
    this.wsFactory = config.wsFactory as any;
  }
  
  async start(): Promise<void> {
    if (this._isActive) return;
    
    this._localPeerId = { id: `ws-${randomUUID()}` };
    
    // If URL is provided, connect as client
    if (this.url) {
      await this.connectAsClient(this.url);
    } else {
      // Otherwise, start as server (for inbound connections)
      await this.startServer();
    }
    
    this._isActive = true;
    this.log('WebSocket transport started');
  }
  
  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = new WebSocketServer({ port: 0 }); // Port 0 = random available port
      
      this.server!.on('connection', (wsConnection, req) => {
        const peerId = this.extractPeerId(req);
        this.handleConnection(peerId, wsConnection as WS);
      });
      
      this.server!.on('error', (error: Error) => {
        this.emitError(error);
        reject(error);
      });
      
      this.server!.on('listening', () => {
        const address = this.server!.address();
        if (address && typeof address === 'object') {
          this.log('WebSocket server listening', { port: (address as any).port });
        }
        resolve();
      });
    });
  }
  
  private async connectAsClient(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let wsConnection: WS;
      
      if (this.wsFactory) {
        wsConnection = this.wsFactory(url);
      } else {
        wsConnection = new WS(url);
      }
      
      wsConnection.on('open', () => {
        this.localWebSocket = wsConnection;
        this._isActive = true;
        resolve();
      });
      
      wsConnection.on('error', (error) => {
        this.emitError(error);
        reject(error);
      });
      
      wsConnection.on('message', (data) => {
        this.handleMessage(data);
      });
      
      wsConnection.on('close', () => {
        this._isActive = false;
        this.emit('disconnection', { peerId: this._localPeerId! });
      });
    });
  }
  
  private extractPeerId(req: IncomingMessage): PeerId {
    // Try to extract peer ID from query params or headers
    const urlObj = new URL(req.url ?? '/', 'http://localhost');
    const peerId = urlObj.searchParams.get('peerId');
    
    return { id: peerId ?? `ws-${randomUUID()}` };
  }
  
  private handleConnection(peerId: PeerId, wsConnection: WS): void {
    this.wsConnections.set(peerId.id, wsConnection);
    
    const connection = new WebSocketConnection(
      peerId,
      wsConnection,
      this
    );
    
    this.registerConnection(connection);
    
    wsConnection.on('message', (data) => {
      this.handleMessage(data, peerId);
    });
    
    wsConnection.on('close', () => {
      this.wsConnections.delete(peerId.id);
      this.unregisterConnection(peerId);
    });
    
    wsConnection.on('error', (error) => {
      this.emitError(error);
    });
  }
  
  private handleMessage(data: RawData, peerId?: PeerId): void {
    try {
      const message: TransportMessage = data instanceof Buffer
                ? JSON.parse(data.toString())
                : typeof data === 'string'
                    ? JSON.parse(data)
                    : JSON.parse(new TextDecoder().decode(data as any));
      
      this.emit('message', { 
        message,
        connection: peerId ? this.connections.get(peerId.id) : undefined,
      });
    } catch (error) {
      this.log('Failed to parse message', error);
    }
  }
  
  async stop(): Promise<void> {
    if (!this._isActive) return;
    
    // Close all WebSocket connections
    for (const wsConnection of this.wsConnections.values()) {
      wsConnection.close();
    }
    this.wsConnections.clear();
    
    // Close local WebSocket
    if (this.localWebSocket) {
      this.localWebSocket.close();
      this.localWebSocket = undefined;
    }
    
    // Close server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
      this.server = undefined;
    }
    
    await this.cleanupConnections();
    
    this._isActive = false;
    this.log('WebSocket transport stopped');
  }
  
  async connect(peerId: PeerId | string): Promise<TransportConnection> {
    const id = typeof peerId === 'string' ? peerId : peerId.id;
    
    let connection = this.connections.get(id) as WebSocketConnection | undefined;
    if (connection) {
      return connection;
    }
    
    // If we have a server, we can't connect to other peers as client
    // This would need a relay or known peer URL
    if (!this.url && !this.server) {
      throw new Error('No peer URL configured - cannot initiate outbound connection');
    }
    
    // For now, throw error - in production, would use peer discovery
    throw new Error('Outbound WebSocket connections require a peer URL');
  }
  
  async disconnect(peerId: PeerId | string): Promise<void> {
    const id = typeof peerId === 'string' ? peerId : peerId.id;
    const wsConnection = this.wsConnections.get(id);
    
    if (wsConnection) {
      wsConnection.close();
      this.wsConnections.delete(id);
      this.unregisterConnection(id);
    }
  }
  
  async send(message: TransportMessage): Promise<SendResult> {
    try {
      const data = JSON.stringify(message);
      
      // Send to all connections (broadcast)
      if (this.wsConnections.size === 0 && this.localWebSocket) {
        this.localWebSocket.send(data);
      } else {
        for (const wsConnection of this.wsConnections.values()) {
          wsConnection.send(data);
        }
      }
      
      return {
        success: true,
        messageId: message.id,
        deliveredAt: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        messageId: message.id,
        error: error as Error,
      };
    }
  }
  
  async broadcast(topic: string, message: TransportMessage): Promise<void> {
    const sendPromises = Array.from(this.wsConnections.values()).map(
      wsConnection => new Promise<void>((resolve) => {
        wsConnection.send(JSON.stringify(message), () => resolve());
      })
    );
    
    await Promise.allSettled(sendPromises);
  }
  
  async createStream(peerId: PeerId | string): Promise<TransportStream> {
    const connection = await this.connect(peerId);
    return connection.createStream();
  }
  
  getConnections(): TransportConnection[] {
    return Array.from(this.connections.values());
  }
}

/**
 * WebSocket Connection
 */
class WebSocketConnection extends EventEmitter implements TransportConnection {
  readonly peerId: PeerId;
  readonly remoteAddress: string;
  readonly localAddress: string;
  private _state: ConnectionState = 'connected';
  private ws: WS;
  private transport: WebSocketTransport;
  private stream?: SimpleTransportStream;
  
  constructor(peerId: PeerId, wsConnection: WS, transport: WebSocketTransport) {
    super();
    this.peerId = peerId;
    this.remoteAddress = `ws://${peerId.id}`;
    this.localAddress = 'ws://local';
    this.ws = wsConnection;
    this.transport = transport;
  }
  
  get state(): ConnectionState {
    return this._state;
  }
  
  async createStream(): Promise<TransportStream> {
    if (!this.stream) {
      this.stream = new SimpleTransportStream({
        id: `ws-stream-${Date.now()}`,
        peerId: this.peerId,
      });
    }
    return this.stream;
  }
  
  async close(): Promise<void> {
    this._state = 'disconnected';
    this.ws.close();
    this.stream?.close();
    this.emit('state', 'disconnected');
  }
  
  setState(state: ConnectionState): void {
    if (this._state !== state) {
      this._state = state;
      this.emit('state', state);
    }
  }
}

/**
 * Create WebSocket transport
 */
export function createWebSocketTransport(
  options?: WebSocketTransportConfig
): WebSocketTransport {
  return new WebSocketTransport(options);
}
