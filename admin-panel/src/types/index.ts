export interface DatabaseTable {
  name: string;
  schema: string;
  rowCount: number;
  size: string;
}

export interface DatabaseRow {
  [key: string]: unknown;
}

export interface QueryResult {
  columns: string[];
  rows: DatabaseRow[];
  rowCount: number;
  executionTime: number;
}

export interface NetworkNode {
  id: string;
  nodeId: string;
  type: 'BOOTSTRAP' | 'RELAY' | 'INDEXER' | 'STORAGE' | 'EDGE' | 'CLIENT' | 'SELF_HOSTED';
  status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE' | 'BANNED';
  latency?: number;
  reputation: number;
  multiaddrs: string[];
  lastSeenAt: string;
}

export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  transport: string;
  direction: 'OUTBOUND' | 'INBOUND' | 'BIDIRECTIONAL';
  status: 'PENDING' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED';
  latency?: number;
  bytesSent: number;
  bytesRecv: number;
}

export interface NetworkMetric {
  timestamp: string;
  peerCount: number;
  connectionCount: number;
  bandwidthIn: number;
  bandwidthOut: number;
  latencyAvg: number;
  dhtLookupTime: number;
  messageQueueSize: number;
  cacheHitRate: number;
  errorRate: number;
}

export interface ContentRecord {
  id: string;
  contentId: string;
  contentType: string;
  size: number;
  providers: number;
  createdAt: string;
}

export interface PubSubTopic {
  id: string;
  topic: string;
  type: 'GENERAL' | 'CIRCLE' | 'USER' | 'SYSTEM' | 'DISCOVERY';
  subscriberCount: number;
  messageCount: number;
}

export interface CRDTDocument {
  id: string;
  docId: string;
  docType: string;
  entityType: string;
  entityId: string;
  version: number;
  syncStatus: 'SYNCED' | 'SYNCING' | 'CONFLICT' | 'OFFLINE' | 'ERROR';
  activePeers: number;
  lastSyncedAt?: string;
}

export interface DataFlow {
  id: string;
  type: 'DHT' | 'PUBSUB' | 'CRDT' | 'FEDERATION';
  source: string;
  target: string;
  status: 'active' | 'pending' | 'error';
  messagesPerSecond: number;
  bytesPerSecond: number;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  category: 'NETWORK' | 'DATABASE' | 'SYNC' | 'FEDERATION' | 'SYSTEM';
  icon: string;
  handler: () => Promise<void>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  uptime: number;
  loadAverage: number[];
  timestamp: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  topUsersByActivity: Array<{
    id: string;
    name: string;
    activityScore: number;
    lastActive: string;
  }>;
}

export interface ConversationStats {
  totalConversations: number;
  activeConversations: number;
  conversationsToday: number;
  conversationsThisWeek: number;
  conversationsThisMonth: number;
  averageMessagesPerConversation: number;
  topConversationsByActivity: Array<{
    id: string;
    title: string;
    messageCount: number;
    lastActivity: string;
  }>;
}

export interface StorageStats {
  totalSize: number;
  usedSize: number;
  freeSize: number;
  usage: number;
  conversations: number;
  messages: number;
  attachments: number;
  indexes: number;
}
