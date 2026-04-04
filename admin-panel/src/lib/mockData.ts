import type { NetworkNode, NodeConnection, NetworkMetric, DatabaseTable, DataFlow, CRDTDocument, LogEntry, PubSubTopic, SystemStats, UserStats, ConversationStats, StorageStats, ContentRecord } from '../types'

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const randBool = (prob = 0.5) => Math.random() < prob;

function generateNodeId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return 'Qm' + Array.from({ length: 40 }, () => chars[rand(0, chars.length - 1)]).join('');
}

export const mockNetworkNodes: NetworkNode[] = [
  {
    id: '1',
    nodeId: 'QmBootstrap1...',
    type: 'BOOTSTRAP',
    status: 'ACTIVE',
    region: 'US-East',
    latency: 12,
    reputation: 98,
    multiaddrs: ['/ip4/1.2.3.4/tcp/4001', '/dns4/node1.vivim.io/tcp/4001'],
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: '2',
    nodeId: 'QmRelay1...',
    type: 'RELAY',
    status: 'ACTIVE',
    region: 'EU-West',
    latency: 45,
    reputation: 95,
    multiaddrs: ['/ip4/2.3.4.5/tcp/4001'],
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: '3',
    nodeId: 'QmIndexer1...',
    type: 'INDEXER',
    status: 'ACTIVE',
    region: 'US-West',
    latency: 28,
    reputation: 92,
    multiaddrs: ['/ip4/3.4.5.6/tcp/4001'],
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: '4',
    nodeId: 'QmStorage1...',
    type: 'STORAGE',
    status: 'DEGRADED',
    region: 'Asia-Pacific',
    latency: 120,
    reputation: 78,
    multiaddrs: ['/ip4/4.5.6.7/tcp/4001'],
    lastSeenAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: '5',
    nodeId: 'QmEdge1...',
    type: 'EDGE',
    status: 'ACTIVE',
    region: 'US-East',
    latency: 8,
    reputation: 99,
    multiaddrs: ['/ip4/5.6.7.8/tcp/4001', '/webrtc/p2p/QmEdge1'],
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: '6',
    nodeId: 'QmClient1...',
    type: 'CLIENT',
    status: 'OFFLINE',
    region: 'EU-Central',
    latency: undefined,
    reputation: 65,
    multiaddrs: ['/ip4/6.7.8.9/tcp/4001'],
    lastSeenAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '7',
    nodeId: 'QmSelfHosted1...',
    type: 'SELF_HOSTED',
    status: 'ACTIVE',
    region: 'US-West',
    latency: 15,
    reputation: 88,
    multiaddrs: ['/ip4/7.8.9.10/tcp/4001'],
    lastSeenAt: new Date().toISOString(),
  },
]

export const mockConnections: NodeConnection[] = [
  {
    id: '1',
    sourceNodeId: '1',
    targetNodeId: '2',
    transport: 'websocket',
    direction: 'BIDIRECTIONAL',
    status: 'CONNECTED',
    latency: 45,
    bytesSent: 15234567,
    bytesRecv: 23456789,
  },
  {
    id: '2',
    sourceNodeId: '1',
    targetNodeId: '3',
    transport: 'tcp',
    direction: 'BIDIRECTIONAL',
    status: 'CONNECTED',
    latency: 28,
    bytesSent: 8765432,
    bytesRecv: 12345678,
  },
  {
    id: '3',
    sourceNodeId: '2',
    targetNodeId: '4',
    transport: 'webrtc',
    direction: 'OUTBOUND',
    status: 'CONNECTED',
    latency: 120,
    bytesSent: 234567,
    bytesRecv: 345678,
  },
  {
    id: '4',
    sourceNodeId: '3',
    targetNodeId: '5',
    transport: 'websocket',
    direction: 'INBOUND',
    status: 'CONNECTED',
    latency: 8,
    bytesSent: 45678901,
    bytesRecv: 56789012,
  },
  {
    id: '5',
    sourceNodeId: '5',
    targetNodeId: '7',
    transport: 'tcp',
    direction: 'BIDIRECTIONAL',
    status: 'CONNECTING',
    latency: undefined,
    bytesSent: 0,
    bytesRecv: 0,
  },
]

export const mockMetrics: NetworkMetric[] = Array.from({ length: 30 }, (_, i) => ({
  timestamp: new Date(Date.now() - (29 - i) * 60000).toISOString(),
  peerCount: 7 + Math.floor(Math.random() * 3),
  connectionCount: 4 + Math.floor(Math.random() * 3),
  bandwidthIn: 1000000 + Math.random() * 2000000,
  bandwidthOut: 800000 + Math.random() * 1500000,
  latencyAvg: 20 + Math.random() * 40,
  dhtLookupTime: 10 + Math.random() * 30,
  messageQueueSize: Math.floor(Math.random() * 100),
  cacheHitRate: 0.7 + Math.random() * 0.25,
  errorRate: Math.random() * 0.05,
}))

export const mockDatabaseTables: DatabaseTable[] = [
  { name: 'network_nodes', schema: 'public', rowCount: 1247, size: '2.4 MB' },
  { name: 'node_connections', schema: 'public', rowCount: 3892, size: '1.8 MB' },
  { name: 'content_records', schema: 'public', rowCount: 45892, size: '15.2 MB' },
  { name: 'content_providers', schema: 'public', rowCount: 89234, size: '8.9 MB' },
  { name: 'routing_entries', schema: 'public', rowCount: 156789, size: '22.1 MB' },
  { name: 'stored_content', schema: 'public', rowCount: 23456, size: '45.7 MB' },
  { name: 'pubsub_topics', schema: 'public', rowCount: 456, size: '0.3 MB' },
  { name: 'topic_subscriptions', schema: 'public', rowCount: 8934, size: '1.2 MB' },
  { name: 'crdt_documents', schema: 'public', rowCount: 12456, size: '8.4 MB' },
  { name: 'crdt_peers', schema: 'public', rowCount: 34567, size: '4.2 MB' },
  { name: 'federation_instances', schema: 'public', rowCount: 23, size: '0.1 MB' },
  { name: 'federation_bridges', schema: 'public', rowCount: 67, size: '0.2 MB' },
  { name: 'network_messages', schema: 'public', rowCount: 567893, size: '89.4 MB' },
  { name: 'network_metrics', schema: 'public', rowCount: 1234567, size: '156.8 MB' },
  { name: 'network_user_references', schema: 'public', rowCount: 8934, size: '1.1 MB' },
  { name: 'network_circle_references', schema: 'public', rowCount: 2345, size: '0.4 MB' },
]

export const mockQueryResult = {
  columns: ['id', 'node_id', 'type', 'status', 'region', 'latency', 'reputation', 'created_at'],
  rows: [
    { id: '1', node_id: 'QmBootstrap1...', type: 'BOOTSTRAP', status: 'ACTIVE', region: 'US-East', latency: 12, reputation: 98, created_at: '2024-01-15' },
    { id: '2', node_id: 'QmRelay1...', type: 'RELAY', status: 'ACTIVE', region: 'EU-West', latency: 45, reputation: 95, created_at: '2024-01-16' },
    { id: '3', node_id: 'QmIndexer1...', type: 'INDEXER', status: 'ACTIVE', region: 'US-West', latency: 28, reputation: 92, created_at: '2024-01-17' },
    { id: '4', node_id: 'QmStorage1...', type: 'STORAGE', status: 'DEGRADED', region: 'Asia-Pacific', latency: 120, reputation: 78, created_at: '2024-01-18' },
    { id: '5', node_id: 'QmEdge1...', type: 'EDGE', status: 'ACTIVE', region: 'US-East', latency: 8, reputation: 99, created_at: '2024-01-19' },
  ],
  rowCount: 5,
  executionTime: 23,
}

export const mockDataFlows: DataFlow[] = [
  { id: '1', type: 'DHT', source: 'Node-1', target: 'Node-3', status: 'active', messagesPerSecond: 145, bytesPerSecond: 23456 },
  { id: '2', type: 'DHT', source: 'Node-2', target: 'Node-4', status: 'active', messagesPerSecond: 89, bytesPerSecond: 12345 },
  { id: '3', type: 'PUBSUB', source: 'Topic:general', target: 'Node-1', status: 'active', messagesPerSecond: 234, bytesPerSecond: 45678 },
  { id: '4', type: 'PUBSUB', source: 'Topic:circle:123', target: 'Node-2', status: 'active', messagesPerSecond: 67, bytesPerSecond: 8901 },
  { id: '5', type: 'PUBSUB', source: 'Topic:user:456', target: 'Node-5', status: 'pending', messagesPerSecond: 0, bytesPerSecond: 0 },
  { id: '6', type: 'CRDT', source: 'Doc:conv:001', target: 'Node-1', status: 'active', messagesPerSecond: 12, bytesPerSecond: 3456 },
  { id: '7', type: 'CRDT', source: 'Doc:circle:002', target: 'Node-2', status: 'active', messagesPerSecond: 8, bytesPerSecond: 2345 },
  { id: '8', type: 'CRDT', source: 'Doc:profile:003', target: 'Node-3', status: 'error', messagesPerSecond: 0, bytesPerSecond: 0 },
  { id: '9', type: 'FEDERATION', source: 'Instance:A', target: 'Instance:B', status: 'active', messagesPerSecond: 5, bytesPerSecond: 1234 },
  { id: '10', type: 'FEDERATION', source: 'Instance:A', target: 'Instance:C', status: 'active', messagesPerSecond: 3, bytesPerSecond: 567 },
]

export const mockCrdtDocuments: CRDTDocument[] = [
  { id: '1', docId: 'doc:conv:001', docType: 'conversation', entityType: 'conversation', entityId: 'conv-001', version: 1456, syncStatus: 'SYNCED', activePeers: 3, lastSyncedAt: new Date().toISOString() },
  { id: '2', docId: 'doc:circle:002', docType: 'circle', entityType: 'circle', entityId: 'circle-002', version: 892, syncStatus: 'SYNCED', activePeers: 5, lastSyncedAt: new Date().toISOString() },
  { id: '3', docId: 'doc:profile:003', docType: 'profile', entityType: 'user', entityId: 'user-003', version: 45, syncStatus: 'SYNCING', activePeers: 1, lastSyncedAt: new Date(Date.now() - 60000).toISOString() },
  { id: '4', docId: 'doc:conv:004', docType: 'conversation', entityType: 'conversation', entityId: 'conv-004', version: 2341, syncStatus: 'CONFLICT', activePeers: 2, lastSyncedAt: new Date(Date.now() - 120000).toISOString() },
  { id: '5', docId: 'doc:circle:005', docType: 'circle', entityType: 'circle', entityId: 'circle-005', version: 567, syncStatus: 'OFFLINE', activePeers: 0 },
]

export const mockPubSubTopics: PubSubTopic[] = [
  { id: '1', topic: 'general', type: 'GENERAL', subscriberCount: 45, messageCount: 123456 },
  { id: '2', topic: 'circle:123', type: 'CIRCLE', subscriberCount: 12, messageCount: 34567 },
  { id: '3', topic: 'circle:456', type: 'CIRCLE', subscriberCount: 8, messageCount: 23456 },
  { id: '4', topic: 'user:789', type: 'USER', subscriberCount: 3, messageCount: 5678 },
  { id: '5', topic: 'system:notifications', type: 'SYSTEM', subscriberCount: 89, messageCount: 234567 },
  { id: '6', topic: 'discovery:peers', type: 'DISCOVERY', subscriberCount: 34, messageCount: 890123 },
]

export const mockLogs: LogEntry[] = [
  { id: '1', timestamp: new Date().toISOString(), level: 'info', source: 'Network', message: 'New peer connected: QmEdge1...' },
  { id: '2', timestamp: new Date(Date.now() - 5000).toISOString(), level: 'debug', source: 'DHT', message: 'Routing table updated: 45 entries' },
  { id: '3', timestamp: new Date(Date.now() - 15000).toISOString(), level: 'info', source: 'CRDT', message: 'Document synced: doc:conv:001' },
  { id: '4', timestamp: new Date(Date.now() - 30000).toISOString(), level: 'warn', source: 'Network', message: 'High latency detected: Node-4 (120ms)' },
  { id: '5', timestamp: new Date(Date.now() - 45000).toISOString(), level: 'info', source: 'PubSub', message: 'New subscription: user:789 -> Topic:general' },
  { id: '6', timestamp: new Date(Date.now() - 60000).toISOString(), level: 'error', source: 'Federation', message: 'Connection failed to Instance:C' },
  { id: '7', timestamp: new Date(Date.now() - 90000).toISOString(), level: 'debug', source: 'Storage', message: 'Content pinned: content:abc123' },
  { id: '8', timestamp: new Date(Date.now() - 120000).toISOString(), level: 'info', source: 'Network', message: 'Peer disconnected: QmClient1...' },
]

export const mockSystemStats: SystemStats = {
  cpu: {
    usage: randFloat(15, 85),
    cores: rand(4, 32),
  },
  memory: {
    total: rand(8, 128) * 1024 * 1024 * 1024,
    used: rand(2, 64) * 1024 * 1024 * 1024,
    free: 0,
    usage: randFloat(20, 80),
  },
  disk: {
    total: rand(256, 2048) * 1024 * 1024 * 1024,
    used: rand(50, 500) * 1024 * 1024 * 1024,
    free: 0,
    usage: randFloat(20, 60),
  },
  uptime: rand(86400, 2592000),
  loadAverage: [randFloat(0.5, 4), randFloat(0.3, 3), randFloat(0.2, 2)],
  timestamp: new Date().toISOString(),
}

export const mockUserStats: UserStats = {
  totalUsers: rand(1000, 50000),
  activeUsers: rand(200, 5000),
  newUsersToday: rand(5, 100),
  newUsersThisWeek: rand(50, 500),
  newUsersThisMonth: rand(200, 2000),
  topUsersByActivity: Array.from({ length: 10 }, (_, i) => ({
    id: `user-${i + 1}`,
    name: ['Alex Chen', 'Jordan Lee', 'Sarah Kim', 'Marcus Johnson', 'Priya Sharma', 'David Chen', 'Emma Wilson', 'Liam O\'Brien', 'Sofia Martinez', 'Noah Park'][i],
    activityScore: rand(80, 100),
    lastActive: new Date(Date.now() - rand(60000, 86400000)).toISOString(),
  })),
}

export const mockConversationStats: ConversationStats = {
  totalConversations: rand(5000, 100000),
  activeConversations: rand(100, 1000),
  conversationsToday: rand(50, 500),
  conversationsThisWeek: rand(500, 5000),
  conversationsThisMonth: rand(2000, 20000),
  averageMessagesPerConversation: randFloat(5, 20),
  topConversationsByActivity: Array.from({ length: 5 }, (_, i) => ({
    id: `conv-${i + 1}`,
    title: ['React Hooks Deep Dive', 'TypeScript Generics', 'System Design Patterns', 'PostgreSQL Optimization', 'AI Agent Architecture'][i],
    messageCount: rand(50, 500),
    lastActivity: new Date(Date.now() - rand(60000, 3600000)).toISOString(),
  })),
}

export const mockStorageStats: StorageStats = {
  totalSize: rand(100, 1000) * 1024 * 1024 * 1024,
  usedSize: rand(20, 400) * 1024 * 1024 * 1024,
  freeSize: 0,
  usage: randFloat(20, 60),
  conversations: rand(5000, 50000),
  messages: rand(50000, 500000),
  attachments: rand(1000, 10000),
  indexes: rand(100, 1000),
}

export const mockContentRecords: ContentRecord[] = Array.from({ length: 20 }, (_, i) => ({
  id: `content-${i + 1}`,
  contentId: generateNodeId(),
  contentType: ['conversation', 'acu', 'memory', 'notebook'][i % 4],
  size: rand(1024, 1024 * 1024 * 10),
  providers: rand(1, 10),
  createdAt: new Date(Date.now() - rand(86400000, 2592000000)).toISOString(),
}))
