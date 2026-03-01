/**
 * VIVIM SDK - Core Transport Layer Types
 * 
 * Defines the core transport interfaces following the VIVIM protocol stack.
 * @see docs/SOCIAL_TRANSPORT_LAYER.md
 */

import type { EventEmitter } from 'events';

/**
 * Transport types supported by VIVIM
 */
export type TransportType = 'websocket' | 'webrtc' | 'http' | 'https' | 'libp2p' | 'tor' | 'stdio' | 'streamable';

/**
 * Connection states
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';

/**
 * Peer identification
 */
export interface PeerId {
  readonly id: string;
  readonly publicKey?: Uint8Array;
}

/**
 * Transport message envelope
 */
export interface TransportMessage {
  id: string;
  type: string;
  payload: Uint8Array | string;
  metadata?: Record<string, unknown>;
  timestamp: number;
  ttl?: number;
}

/**
 * Send result
 */
export interface SendResult {
  success: boolean;
  messageId: string;
  error?: Error;
  deliveredAt?: number;
}

/**
 * Transport preferences for selecting best transport
 */
export interface TransportPreferences {
  protocols?: TransportType[];
  latency?: number;
  bandwidth?: number;
  reliability?: number;
  encryption?: boolean;
  anonymity?: boolean;
}

/**
 * Stream for bidirectional communication
 */
export interface TransportStream {
  readonly id: string;
  readonly peerId: PeerId;
  read(): Promise<TransportMessage | null>;
  write(message: TransportMessage): Promise<void>;
  close(): Promise<void>;
}

/**
 * Connection to a peer
 */
export interface TransportConnection {
  readonly peerId: PeerId;
  readonly state: ConnectionState;
  readonly remoteAddress: string;
  readonly localAddress: string;
  createStream(): Promise<TransportStream>;
  close(): Promise<void>;
}

/**
 * Core Transport Protocol Interface
 * 
 * All transport implementations must conform to this interface.
 */
export interface TransportProtocol extends EventEmitter {
  /** Unique transport identifier */
  readonly type: TransportType;
  
  /** Whether transport is currently active */
  readonly isActive: boolean;
  
  /** Local peer ID if available */
  readonly localPeerId?: PeerId;
  
  // ============== Connection Management ==============
  
  /**
   * Connect to a peer
   */
  connect(peerId: PeerId | string): Promise<TransportConnection>;
  
  /**
   * Disconnect from a peer
   */
  disconnect(peerId: PeerId | string): Promise<void>;
  
  /**
   * Get connection state for a peer
   */
  getConnectionState(peerId: PeerId | string): ConnectionState;
  
  /**
   * Get all active connections
   */
  getConnections(): TransportConnection[];
  
  // ============== Message Delivery ==============
  
  /**
   * Send a message to a specific peer
   */
  send(message: TransportMessage): Promise<SendResult>;
  
  /**
   * Broadcast a message to all connected peers or a topic
   */
  broadcast(topic: string, message: TransportMessage): Promise<void>;
  
  // ============== Stream Management ==============
  
  /**
   * Create a new stream to a peer
   */
  createStream(peerId: PeerId | string): Promise<TransportStream>;
  
  // ============== Lifecycle ==============
  
  /**
   * Start the transport
   */
  start(): Promise<void>;
  
  /**
   * Stop the transport
   */
  stop(): Promise<void>;
}

/**
 * Events emitted by TransportProtocol
 */
export interface TransportEvents {
  'connection': { connection: TransportConnection };
  'disconnection': { peerId: PeerId; reason?: string };
  'message': { message: TransportMessage; connection?: TransportConnection };
  'error': { error: Error };
  'stateChanged': { peerId: PeerId; state: ConnectionState };
}

/**
 * Transport factory function type
 */
export type TransportFactory = (config?: TransportConfig) => TransportProtocol;

/**
 * Transport configuration
 */
export interface TransportConfig {
  /** Enable debugging */
  debug?: boolean;
  /** Message timeout in ms */
  timeout?: number;
  /** Retry attempts */
  retryAttempts?: number;
  /** Retry delay in ms */
  retryDelay?: number;
}

/**
 * Base transport configuration
 */
export interface BaseTransportConfig extends TransportConfig {
  /** Local address to bind to */
  localAddress?: string;
  /** Remote addresses to connect to */
  remoteAddresses?: string[];
}

/**
 * WebSocket transport configuration
 */
export interface WebSocketTransportConfig extends BaseTransportConfig {
  /** WebSocket URL or addresses */
  url?: string;
  /** Whether to use secure WebSocket */
  secure?: boolean;
  /** Custom WebSocket factory */
  wsFactory?: (url: string) => WebSocket;
}

/**
 * HTTP transport configuration
 */
export interface HTTPTransportConfig extends BaseTransportConfig {
  /** HTTP server port */
  port?: number;
  /** HTTP server host */
  host?: string;
  /** Base URL for requests */
  baseUrl?: string;
  /** Request timeout */
  requestTimeout?: number;
  /** Maximum concurrent requests */
  maxConcurrent?: number;
}

/**
 * Streamable transport configuration  
 */
export interface StreamableTransportConfig extends BaseTransportConfig {
  /** Stream encoding */
  encoding?: 'json' | 'binary';
  /** Maximum frame size */
  maxFrameSize?: number;
  /** Ping interval in ms */
  pingInterval?: number;
}

/**
 * Multi-transport configuration
 */
export interface MultiTransportConfig extends TransportConfig {
  /** Transports to use */
  transports: TransportProtocol[];
  /** Default transport preference order */
  preferenceOrder?: TransportType[];
  /** Enable automatic fallback */
  autoFallback?: boolean;
  /** Fallback timeout in ms */
  fallbackTimeout?: number;
}

/**
 * Multi-transport configuration
 */
export interface MultiTransportConfig extends TransportConfig {
  /** Transports to use */
  transports: TransportProtocol[];
  /** Default transport preference order */
  preferenceOrder?: TransportType[];
  /** Enable automatic fallback */
  autoFallback?: boolean;
  /** Fallback timeout in ms */
  fallbackTimeout?: number;
}

/**
 * LibP2P transport configuration
 */
export interface LibP2PTransportConfig extends TransportConfig {
  /** Network node instance */
  networkNode?: unknown;
  /** Custom protocol prefix */
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