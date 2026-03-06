/**
 * VIVIM SDK - Base Transport Implementation
 * 
 * Abstract base class for transport implementations
 */

import { EventEmitter } from 'events';
import type {
  TransportProtocol,
  TransportType,
  TransportMessage,
  TransportConnection,
  TransportStream,
  TransportEvents,
  TransportConfig,
  PeerId,
  ConnectionState,
  SendResult,
} from './types.js';

/**
 * Abstract base transport class
 * 
 * Provides common functionality for all transport implementations.
 */
export abstract class BaseTransport extends EventEmitter implements TransportProtocol {
  abstract readonly type: TransportType;
  
  protected _isActive = false;
  protected _localPeerId?: PeerId;
  protected config: TransportConfig;
  
  protected connections: Map<string, TransportConnection> = new Map();
  
  constructor(config: TransportConfig = {}) {
    super();
    this.config = {
      timeout: config.timeout ?? 30000,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      debug: config.debug ?? false,
    };
  }
  
  get isActive(): boolean {
    return this._isActive;
  }
  
  get localPeerId(): PeerId | undefined {
    return this._localPeerId;
  }
  
  // ============== Connection Management ==============
  
  abstract connect(peerId: PeerId | string): Promise<TransportConnection>;
  abstract disconnect(peerId: PeerId | string): Promise<void>;
  
  getConnectionState(peerId: PeerId | string): ConnectionState {
    const id = typeof peerId === 'string' ? peerId : peerId.id;
    const connection = this.connections.get(id);
    return connection?.state ?? 'disconnected';
  }
  
  getConnections(): TransportConnection[] {
    return Array.from(this.connections.values());
  }
  
  /**
   * Register a connection (internal use)
   */
  protected registerConnection(connection: TransportConnection): void {
    const id = typeof connection.peerId === 'string' 
      ? connection.peerId 
      : connection.peerId.id;
    this.connections.set(id, connection);
    
    connection.on('close', () => {
      this.connections.delete(id);
      this.emit('disconnection', { peerId: connection.peerId });
    });
    
    this.emit('connection', { connection });
  }
  
  /**
   * Unregister a connection (internal use)
   */
  protected unregisterConnection(peerId: PeerId | string): void {
    const id = typeof peerId === 'string' ? peerId : peerId.id;
    this.connections.delete(id);
  }
  
  // ============== Message Delivery ==============
  
  abstract send(message: TransportMessage): Promise<SendResult>;
  abstract broadcast(topic: string, message: TransportMessage): Promise<void>;
  
  // ============== Stream Management ==============
  
  abstract createStream(peerId: PeerId | string): Promise<TransportStream>;
  
  // ============== Lifecycle ==============
  
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  
  /**
   * Clean up all connections
   */
  protected async cleanupConnections(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(
      peerId => this.disconnect(peerId).catch(() => {})
    );
    await Promise.all(disconnectPromises);
    this.connections.clear();
  }
  
  /**
   * Log debug message if debug is enabled
   */
  protected log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[${this.type}] ${message}`, ...args);
    }
  }
  
  /**
   * Emit error safely
   */
  protected emitError(error: Error): void {
    this.emit('error', { error });
  }
}

/**
 * Simple in-memory transport connection
 */
export class InMemoryConnection extends EventEmitter implements TransportConnection {
  readonly peerId: PeerId;
  readonly remoteAddress: string;
  readonly localAddress: string;
  private _state: ConnectionState = 'connected';
  private stream?: TransportStream;
  
  constructor(peerId: PeerId, localAddress = 'memory://', remoteAddress = 'memory://') {
    super();
    this.peerId = peerId;
    this.localAddress = localAddress;
    this.remoteAddress = remoteAddress;
  }
  
  get state(): ConnectionState {
    return this._state;
  }
  
  async createStream(): Promise<TransportStream> {
    if (!this.stream) {
      this.stream = new SimpleTransportStream({
        id: `stream-${Date.now()}`,
        peerId: this.peerId,
      });
    }
    return this.stream;
  }
  
  async close(): Promise<void> {
    this._state = 'disconnected';
    this.stream?.close();
    this.emit('close');
  }
  
  setState(state: ConnectionState): void {
    this._state = state;
    this.emit('stateChanged', state);
  }
}

/**
 * Simple transport stream implementation
 */
export class SimpleTransportStream extends EventEmitter implements TransportStream {
  readonly id: string;
  readonly peerId: PeerId;
  private _closed = false;
  private messageQueue: TransportMessage[] = [];
  private resolvers: ((msg: TransportMessage | null) => void)[] = [];
  
  constructor(options: { id: string; peerId: PeerId }) {
    super();
    this.id = options.id;
    this.peerId = options.peerId;
  }
  
  async read(): Promise<TransportMessage | null> {
    if (this._closed) return null;
    
    if (this.messageQueue.length > 0) {
      return this.messageQueue.shift()!;
    }
    
    return new Promise<TransportMessage | null>((resolve) => {
      this.resolvers.push(resolve);
    });
  }
  
  async write(message: TransportMessage): Promise<void> {
    if (this._closed) {
      throw new Error('Stream is closed');
    }
    
    this.emit('data', message);
    
    const resolver = this.resolvers.shift();
    if (resolver) {
      resolver(message);
    } else {
      this.messageQueue.push(message);
    }
  }
  
  async close(): Promise<void> {
    this._closed = true;
    // Resolve any pending readers with null
    for (const resolver of this.resolvers) {
      resolver(null);
    }
    this.resolvers = [];
  }
}

/**
 * Helper to create a peer ID from string
 */
export function createPeerId(id: string): PeerId {
  return { id };
}

/**
 * Helper to create a transport message
 */
export function createTransportMessage(
  type: string,
  payload: Uint8Array | string,
  metadata?: Record<string, unknown>
): TransportMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type,
    payload,
    metadata,
    timestamp: Date.now(),
  };
}

/**
 * Helper to serialize transport message
 */
export function serializeMessage(message: any): string {
  return JSON.stringify(message);
}

/**
 * Helper to deserialize transport message
 */
export function deserializeMessage(data: string): TransportMessage {
  return JSON.parse(data) as TransportMessage;
}
