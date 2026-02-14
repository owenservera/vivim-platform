import type { PeerId } from '@libp2p/interface/peer-id';

export interface PeerInfo {
  peerId: string;
  did?: string;
  multiaddrs: string[];
  protocols: string[];
  status: 'connected' | 'disconnected' | 'connecting';
  lastSeen: Date;
  reputation: number;
}

export interface ConnectionState {
  peerId: string;
  transport: 'webrtc' | 'websocket' | 'tcp' | 'quic';
  direction: 'inbound' | 'outbound';
  latency?: number;
  bytesSent: bigint;
  bytesReceived: bigint;
  connectedAt?: Date;
}

export interface Message {
  id: string;
  from: PeerId;
  to?: PeerId;
  topic?: string;
  type: MessageType;
  payload: Uint8Array | string;
  timestamp: Date;
  ttl?: number;
  priority: number;
  signature?: Uint8Array;
}

export type MessageType =
  | 'discovery'
  | 'routing'
  | 'content-request'
  | 'content-response'
  | 'sync-request'
  | 'sync-response'
  | 'pubsub'
  | 'federation'
  | 'ping'
  | 'pong'
  | 'control';

export interface Protocol {
  name: string;
  version: string;
  handlers: ProtocolHandler[];
}

export interface ProtocolHandler {
  onMessage: (msg: Message) => Promise<void>;
  onConnect?: (peerId: PeerId) => Promise<void>;
  onDisconnect?: (peerId: PeerId) => Promise<void>;
}

export interface NetworkEventMap {
  'peer:discover': { peerId: string; multiaddrs: string[] };
  'peer:connect': { peerId: string };
  'peer:disconnect': { peerId: string; reason?: string };
  'message:receive': { message: Message; from: string };
  'message:send': { message: Message; to: string };
  'sync:start': { docId: string; peers: string[] };
  'sync:progress': { docId: string; progress: number };
  'sync:complete': { docId: string };
  'content:available': { contentId: string; providers: string[] };
  'error': { error: Error; context?: string };
}

export type NodeType = 'bootstrap' | 'relay' | 'indexer' | 'storage' | 'edge' | 'client' | 'self-hosted';

export interface NodeCapabilities {
  storage: boolean;
  routing: boolean;
  indexing: boolean;
  p2p: boolean;
  webrtc: boolean;
  relay: boolean;
  caching: boolean;
  signaling: boolean;
}

export interface ContentLocation {
  type: 'pds' | 'p2p' | 'edge';
  url?: string;
  peerId?: string;
  multiaddrs?: string[];
  expiresAt?: Date;
}

export interface SyncState {
  docId: string;
  version: number;
  vectorClock: Record<string, number>;
  status: 'synced' | 'syncing' | 'offline' | 'conflict';
  lastSyncedAt?: Date;
}
