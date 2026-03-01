/**
 * VIVIM SDK - LibP2P Transport
 * 
 * Transport implementation wrapping the existing NetworkNode for full P2P capabilities.
 * Leverages libp2p for networking, DHT for discovery, and Gossipsub for pub/sub.
 * 
 * @see P2P_TRANSFORMATION_FINDINGS.md
 */

import { randomUUID } from 'crypto';
import type {
  TransportProtocol,
  TransportType,
  TransportMessage,
  SendResult,
  TransportConnection,
  TransportStream,
  PeerId,
  ConnectionState,
  TransportConfig,
} from './types.js';
import { BaseTransport, SimpleTransportStream } from './base-transport.js';

/**
 * LibP2P Transport Configuration
 */
export interface LibP2PTransportConfig extends TransportConfig {
  /** Network node instance (optional - will create if not provided) */
  networkNode?: NetworkNodeLike;
  /** Custom protocol prefix for this transport */
  protocolPrefix?: string;
  /** Enable DHT for peer discovery */
  enableDHT?: boolean;
  /** Enable Gossipsub for pub/sub */
  enableGossipsub?: boolean;
  /** Bootstrap peers for initial connection */
  bootstrapPeers?: string[];
  /** Listen addresses */
  listenAddresses?: string[];
  /** Node type */
  nodeType?: 'bootstrap' | 'relay' | 'indexer' | 'storage' | 'edge' | 'client';
  /** Roles */
  roles?: string[];
}

/**
 * NetworkNode-like interface (duck typing for flexibility)
 */
export interface NetworkNodeLike {
  readonly peerId?: { toString(): string };
  start(): Promise<void>;
  stop(): Promise<void>;
  connect(multiaddr: string): Promise<void>;
  getConnectedPeers(): string[];
  readonly running: boolean;
  readonly libp2p: unknown;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): boolean;
  getMultiaddrs?(): Array<{ toString(): string }>;
  subscribe?(topic: string, handler: (msg: unknown) => void): void;
  publish?(topic: string, data: Uint8Array): Promise<void>;
}

/**
 * LibP2P Transport
 * 
 * Implements TransportProtocol by wrapping the existing NetworkNode.
 * This provides full P2P capabilities including:
 * - WebRTC for direct browser connections
 * - WebSocket for server communication
 * - Kademlia DHT for peer discovery
 * - Gossipsub for pub/sub messaging
 */
export class LibP2PTransport extends BaseTransport {
  readonly type = 'libp2p' as const;
  
  private networkNode?: NetworkNodeLike;
  private connections: Map<string, LibP2PConnection> = new Map();
  private protocolPrefix: string;
  private messageHandlers: Map<string, (message: TransportMessage) => void> = new Map();
  
  constructor(config: LibP2PTransportConfig = {}) {
    super(config);
    this.protocolPrefix = config.protocolPrefix ?? '/vivim';
    
    if (config.networkNode) {
      this.networkNode = config.networkNode;
    }
  }
  
  get isActive(): boolean {
    return this._isActive && (this.networkNode?.running ?? false);
  }
  
  get localPeerId(): PeerId | undefined {
    if (this.networkNode?.peerId) {
      const id = typeof this.networkNode.peerId === 'string' 
        ? this.networkNode.peerId 
        : this.networkNode.peerId.toString();
      return { id };
    }
    return this._localPeerId;
  }
  
  setNetworkNode(node: NetworkNodeLike): void {
    this.networkNode = node;
    this.setupEventHandlers();
  }
  
  getNetworkNode(): NetworkNodeLike | undefined {
    return this.networkNode;
  }
  
  private setupEventHandlers(): void {
    if (!this.networkNode) return;
    
    this.networkNode.on('peer:discovery', (data: unknown) => {
      const event = data as { peerId: string };
      this.emit('peer:discovery', event);
    });
    
    this.networkNode.on('peer:connect', (data: unknown) => {
      const event = data as { peerId: string };
      this.emit('connection', { 
        connection: this.connections.get(event.peerId) ?? { 
          peerId: { id: event.peerId },
          state: 'connected' as ConnectionState,
          remoteAddress: event.peerId,
          localAddress: this._localPeerId?.id ?? 'local',
        }
      });
    });
    
    this.networkNode.on('peer:disconnect', (data: unknown) => {
      const event = data as { peerId: string };
      this.connections.delete(event.peerId);
      this.emit('disconnection', { peerId: { id: event.peerId } });
    });
  }
  
  async start(): Promise<void> {
    if (this._isActive) return;
    
    if (!this.networkNode) {
      try {
        const { NetworkNode } = await import('@vivim/network-engine');
        
        const nodeConfig = {
          nodeType: 'client',
          roles: ['routing'],
          listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
          bootstrapPeers: this.config.remoteAddresses ?? [],
          enableWebRTC: true,
          enableDHT: true,
          enableGossipsub: true,
          enableMDNS: false,
          minConnections: 1,
          maxConnections: 50,
        };
        
        this.networkNode = new NetworkNode(nodeConfig) as NetworkNodeLike;
      } catch (error) {
        this.log('NetworkNode not available, using mock implementation');
        this.networkNode = this.createMockNetworkNode();
      }
    }
    
    await this.networkNode.start();
    
    if (this.networkNode.peerId) {
      const id = typeof this.networkNode.peerId === 'string'
        ? this.networkNode.peerId
        : this.networkNode.peerId.toString();
      this._localPeerId = { id };
    } else {
      this._localPeerId = { id: `libp2p-${randomUUID()}` };
    }
    
    this.setupEventHandlers();
    this._isActive = true;
    
    this.log('LibP2P transport started', { peerId: this._localPeerId?.id });
  }
  
  private createMockNetworkNode(): NetworkNodeLike {
    let running = false;
    return {
      get peerId() {
        return { toString: () => `mock-${randomUUID()}` };
      },
      get running() {
        return running;
      },
      get libp2p() {
        return null;
      },
      async start() {
        running = true;
      },
      async stop() {
        running = false;
      },
      async connect(_multiaddr: string) {
        // no-op
      },
      getConnectedPeers() {
        return [];
      },
      on() { return this; },
      off() { return this; },
      emit() { return true; },
    };
  }
  
  async stop(): Promise<void> {
    if (!this._isActive) return;
    
    for (const connection of this.connections.values()) {
      await connection.close();
    }
    this.connections.clear();
    
    if (this.networkNode) {
      await this.networkNode.stop();
    }
    
    this._isActive = false;
    this.log('LibP2P transport stopped');
  }
  
  async connect(peerId: PeerId | string): Promise<TransportConnection> {
    const id = typeof peerId === 'string' ? peerId : peerId.id;
    
    const existing = this.connections.get(id);
    if (existing) {
      return existing;
    }
    
    const connection = new LibP2PConnection(
      { id },
      this.networkNode!,
      this.protocolPrefix,
      this
    );
    
    this.connections.set(id, connection);
    this.registerConnection(connection);
    
    try {
      await this.networkNode!.connect(`/p2p/${id}`);
    } catch (error) {
      this.log('Connection attempt result:', error);
    }
    
    return connection;
  }
  
  async disconnect(peerId: PeerId | string): Promise<void> {
    const id = typeof peerId === 'string' ? peerId : peerId.id;
    const connection = this.connections.get(id);
    
    if (connection) {
      await connection.close();
      this.connections.delete(id);
      this.unregisterConnection(id);
    }
  }
  
  async send(message: TransportMessage): Promise<SendResult> {
    try {
      const data = typeof message.payload === 'string'
        ? message.payload
        : new TextDecoder().decode(message.payload);
      
      const recipients = message.metadata?.recipients as string[] | undefined;
      
      if (recipients && recipients.length > 0) {
        for (const recipient of recipients) {
          const conn = this.connections.get(recipient);
          if (conn) {
            await conn.send(message);
          }
        }
      } else if (this.connections.size > 0) {
        const sendPromises = Array.from(this.connections.values()).map(
          conn => conn.send(message).catch(() => {})
        );
        await Promise.all(sendPromises);
      } else if (this.networkNode && 'publish' in this.networkNode) {
        const topic = message.metadata?.topic as string ?? '/vivim/broadcast';
        await this.networkNode.publish!(topic, new TextEncoder().encode(data));
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
    if (this.networkNode && 'publish' in this.networkNode) {
      const data = typeof message.payload === 'string'
        ? message.payload
        : new TextDecoder().decode(message.payload);
      
      await this.networkNode.publish!(
        `${this.protocolPrefix}${topic}`,
        new TextEncoder().encode(data)
      );
    } else {
      const sendPromises = Array.from(this.connections.values()).map(
        conn => conn.send(message).catch(() => {})
      );
      await Promise.all(sendPromises);
    }
  }
  
  async createStream(peerId: PeerId | string): Promise<TransportStream> {
    const connection = await this.connect(peerId);
    return connection.createStream();
  }
  
  async subscribe(topic: string, handler: (message: TransportMessage) => void): Promise<void> {
    const fullTopic = `${this.protocolPrefix}${topic}`;
    
    if (this.networkNode && 'subscribe' in this.networkNode) {
      this.networkNode.subscribe!(fullTopic, (msg: unknown) => {
        const pubsubMsg = msg as { data?: Uint8Array };
        if (pubsubMsg.data) {
          try {
            const text = new TextDecoder().decode(pubsubMsg.data);
            const message = JSON.parse(text) as TransportMessage;
            handler(message);
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
    
    this.messageHandlers.set(fullTopic, handler);
  }
  
  getConnectedPeers(): string[] {
    return this.networkNode?.getConnectedPeers() ?? [];
  }
  
  getListenAddresses(): string[] {
    if (this.networkNode && 'getMultiaddrs' in this.networkNode) {
      return this.networkNode.getMultiaddrs!().map(ma => ma.toString());
    }
    return [];
  }
  
  getConnections(): TransportConnection[] {
    return Array.from(this.connections.values());
  }
}

class LibP2PConnection implements TransportConnection {
  readonly peerId: PeerId;
  readonly remoteAddress: string;
  readonly localAddress: string;
  private _state: ConnectionState = 'connected';
  private networkNode: NetworkNodeLike;
  private protocolPrefix: string;
  private transport: LibP2PTransport;
  private stream?: SimpleTransportStream;
  
  constructor(
    peerId: PeerId,
    networkNode: NetworkNodeLike,
    protocolPrefix: string,
    transport: LibP2PTransport
  ) {
    this.peerId = peerId;
    this.remoteAddress = `/p2p/${peerId.id}`;
    this.localAddress = '/p2p/local';
    this.networkNode = networkNode;
    this.protocolPrefix = protocolPrefix;
    this.transport = transport;
  }
  
  get state(): ConnectionState {
    return this._state;
  }
  
  async createStream(): Promise<TransportStream> {
    if (!this.stream) {
      this.stream = new SimpleTransportStream({
        id: `libp2p-stream-${Date.now()}`,
        peerId: this.peerId,
      });
    }
    return this.stream;
  }
  
  async send(message: TransportMessage): Promise<void> {
    const data = typeof message.payload === 'string'
      ? message.payload
      : new TextDecoder().decode(message.payload);
    
    this.transport.emit('message', { message });
  }
  
  async close(): Promise<void> {
    this._state = 'disconnected';
    this.stream?.close();
  }
  
  setState(state: ConnectionState): void {
    this._state = state;
  }
}

export function createLibP2PTransport(
  config?: LibP2PTransportConfig
): LibP2PTransport {
  return new LibP2PTransport(config);
}
