# Network Orchestration Layer Specification

## Overview

The Network Orchestration Layer is the heart of VIVIM's decentralized content distribution system. It coordinates peer-to-peer communication, content routing, storage, and synchronization across the network. This layer transforms the raw P2P capabilities into an intelligent, self-organizing content delivery network.

## Database Integration

The Network Orchestration Layer integrates with both databases:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  NETWORK ORCHESTRATION LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      ORCHESTRATION CORE                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │  Topology  │  │   Router   │  │  Scheduler │  │   Monitor  │    │   │
│  │  │  Manager   │  │            │  │            │  │            │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│  ┌─────────────────────┬─────────────┴─────────────┬─────────────────────┐ │
│  │                     │                             │                     │ │
│  ▼                     ▼                             ▼                     ▼ │
│  ┌────────────┐    ┌────────────┐              ┌────────────┐    ┌────────────┐
│  │   DHT      │    │  PubSub    │              │   CRDT     │    │  Storage   │
│  │  Service   │    │  Service   │              │   Sync     │    │  Manager   │
│  └────────────┘    └────────────┘              └────────────┘    └────────────┘
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      DATABASE LAYER                                   │   │
│  │  ┌─────────────────────────┐  ┌───────────────────────────────────┐  │   │
│  │  │  ContentRegistry        │  │  UserDatabaseManager              │  │   │
│  │  │  (Master DB metadata)  │  │  (fetches from SQLite)            │  │   │
│  │  └─────────────────────────┘  └───────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Orchestration Core

The Orchestration Core provides high-level coordination:

```typescript
class NetworkOrchestrator {
  // Central coordination
  private topologyManager: TopologyManager;
  private router: ContentRouter;
  private scheduler: TaskScheduler;
  private monitor: NetworkMonitor;
  
  // Core services
  private dhtService: DHTService;
  private pubsubService: PubSubService;
  private crdtSync: CRDTSyncService;
  private storageManager: StorageManager;
  
  // Database access
  private masterDb: PrismaClient;  // PostgreSQL
  private userDbManager: UserDatabaseManager;  // SQLite
  
  // Discovery and connections
  private peerDiscovery: PeerDiscovery;
  private connectionManager: ConnectionManager;
  private contentRegistry: ContentRegistry;
  private federationBridge: FederationBridge;
}
```

### 2. Topology Manager

Manages the network topology and node relationships:

```typescript
class TopologyManager {
  // Track network topology
  private adjacencyList: Map<string, Set<string>>;
  private nodeMetrics: Map<string, NodeMetrics>;
  
  // Topology operations
  async optimizeTopology(): Promise<void>;
  async rebalance(): Promise<void>;
  async handleNodeJoin(nodeId: string): Promise<void>;
  async handleNodeLeave(nodeId: string): Promise<void>;
  
  // Queries
  getOptimalPeers(contentId: string, count: number): Promise<PeerInfo[]>;
  getNearbyNodes(nodeId: string, radius: number): Promise<PeerInfo[]>;
  getReplicationTargets(contentId: string): Promise<PeerInfo[]>;
}
```

**Topology Optimization:**

- Maintains optimal peer connectivity
- Balances load across nodes
- Handles node churn gracefully
- Adapts to network conditions

### 3. Content Router

Routes content requests through the network:

```typescript
class ContentRouter {
  // Routing table
  private routingTable: RoutingTable;
  
  // Route operations
  async routeRequest(request: ContentRequest): Promise<ContentResponse>;
  async findProviders(contentId: string): Promise<ProviderInfo[]>;
  async selectOptimalPath(request: RouteRequest): Promise<RoutePath>;
  
  // Path selection algorithms
  selectByLatency(paths: RoutePath[]): RoutePath;
  selectByBandwidth(paths: RoutePath[]): RoutePath;
  selectByHops(paths: RoutePath[]): RoutePath;
  selectByReputation(paths: RoutePath[]): RoutePath;
}
```

**Routing Strategies:**

| Strategy | Description | Use Case |
|----------|-------------|----------|
| Latency | Lowest latency path | Real-time access |
| Bandwidth | Highest bandwidth path | Large content |
| Hops | Fewest hops path | Local networks |
| Reputation | Highest reputation nodes | Critical content |
| Hybrid | Weighted combination | Default |

### 4. Task Scheduler

Schedules and executes background tasks:

```typescript
class TaskScheduler {
  // Task queues
  private queues: Map<Priority, TaskQueue>;
  
  // Scheduling
  async schedule(task: Task): Promise<string>; // Returns task ID
  async scheduleAt(task: Task, time: Date): Promise<string>;
  async scheduleInterval(task: Task, interval: number): Promise<string>;
  
  // Task execution
  async executeTask(taskId: string): Promise<TaskResult>;
  async cancelTask(taskId: string): Promise<void>;
  
  // Task types
  scheduleReplication(task: ReplicationTask): Promise<void>;
  scheduleCleanup(task: CleanupTask): Promise<void>;
  scheduleSync(task: SyncTask): Promise<void>;
}
```

**Scheduled Tasks:**

- Content replication
- Cache eviction
- DHT maintenance
- Peer health checks
- CRDT synchronization
- Expiration processing

### 5. Network Monitor

Monitors network health and performance:

```typescript
class NetworkMonitor {
  // Metrics collection
  private metrics: MetricsCollector;
  
  // Monitoring
  async getNetworkHealth(): Promise<NetworkHealth>;
  async getNodeHealth(nodeId: string): Promise<NodeHealth>;
  async getContentHealth(contentId: string): Promise<ContentHealth>;
  
  // Alerts
  onNodeDown(callback: (nodeId: string) => void): void;
  onContentUnreachable(callback: (contentId: string) => void): void;
  onNetworkDegraded(callback: () => void): void;
  
  // Health status
  getStatus(): {
    nodeCount: number;
    activeConnections: number;
    contentCount: number;
    averageLatency: number;
    errorRate: number;
  };
}
```

## DHT Service (Distributed Hash Table)

The DHT provides content location discovery:

```typescript
class DHTService {
  // Kademlia DHT implementation
  private localNodeId: string;
  private routingTable: KBuckets;
  
  // Content publishing
  async publish(key: string, value: DHTValue): Promise<void>;
  async publishContent(contentId: string, providers: ProviderInfo[]): Promise<void>;
  
  // Content discovery
  async get(key: string): Promise<DHTValue | null>;
  async getProviders(contentId: string): Promise<ProviderInfo[]>;
  
  // DHT maintenance
  async ping(nodeId: string): Promise<boolean>;
  async findNode(nodeId: string): Promise<PeerInfo>;
  async findProviders(key: string): Promise<PeerInfo[]>;
  
  // Bucket refresh
  async refreshBucket(bucketIndex: number): Promise<void>;
}
```

### Content Record in DHT

```typescript
interface DHTContentRecord {
  contentId: string;           // SHA-256 hash of content
  contentType: string;         // Type identifier
  providers: ProviderInfo[];    // Nodes storing content
  metadata: {
    size: number;
    createdAt: Date;
    expiresAt?: Date;
    replicationFactor: number;
  };
}
```

## PubSub Service

The PubSub service enables real-time messaging:

```typescript
class PubSubService {
  // Topic management
  async createTopic(topic: string, config?: TopicConfig): Promise<void>;
  async deleteTopic(topic: string): Promise<void>;
  async listTopics(): Promise<TopicInfo[]>;
  
  // Subscription
  async subscribe(topic: string, handler: MessageHandler): Promise<string>;
  async unsubscribe(subscriptionId: string): Promise<void>;
  
  // Publishing
  async publish(topic: string, message: PubSubMessage): Promise<void>;
  
  // Topic types
  subscribeToCircle(circleId: string, handler: MessageHandler): Promise<string>;
  subscribeToUser(userDid: string, handler: MessageHandler): Promise<string>;
  subscribeToContent(contentId: string, handler: MessageHandler): Promise<string>;
}
```

### PubSub Topics

| Topic Pattern | Description | Example |
|---------------|-------------|---------|
| `circle:{id}` | Circle notifications | `circle:abc123` |
| `user:{did}` | User notifications | `user:did:vivim:user1` |
| `content:{id}` | Content updates | `content:conv-123` |
| `network:announce` | Network announcements | `network:announce` |
| `discovery:providers` | Provider discovery | `discovery:providers` |

## CRDT Sync Service

The CRDT service provides conflict-free synchronization:

```typescript
class CRDTSyncService {
  // Document management
  async createDocument(docId: string, docType: CRDTType): Promise<CRDTDocument>;
  async joinDocument(docId: string, peerId: string): Promise<void>;
  async leaveDocument(docId: string, peerId: string): Promise<void>;
  
  // Operations
  async applyUpdate(docId: string, update: CRDTOperation): Promise<void>;
  async getState(docId: string): Promise<Uint8Array>;
  async getStateVector(docId: string): Promise<StateVector>;
  
  // Synchronization
  async sync(docId: string, peerId: string): Promise<SyncResult>;
  async handleIncomingUpdate(docId: string, update: CRDTOperation): Promise<void>;
}
```

### CRDT Types

| Type | Use Case | Implementation |
|------|----------|----------------|
| G-Counter | View counts | Grow-only counter |
| LWW-Register | Last-write-wins | Timestamp-based |
| OR-Set | Shared content | Observed-Remove Set |
| RGA | Message ordering | Replicated Growable Array |
| LWW-Map | User profiles | Last-write-wins Map |

## Storage Manager

Manages content storage across the network:

```typescript
class StorageManager {
  // Storage operations
  async store(content: EncryptedContent): Promise<StorageResult>;
  async retrieve(contentId: string): Promise<EncryptedContent | null>;
  async delete(contentId: string): Promise<void>;
  
  // Replication
  async replicate(content: EncryptedContent, targets: PeerInfo[]): Promise<void>;
  async repair(contentId: string): Promise<void>;
  async setReplicationFactor(contentId: string, factor: number): Promise<void>;
  
  // Caching
  async cache(contentId: string, node: PeerInfo): Promise<void>;
  async evict(contentId: string): Promise<void>;
  
  // Pinning
  async pin(contentId: string): Promise<void>;
  async unpin(contentId: string): Promise<void>;
}
```

### Storage Tiers

```
┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE TIERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TIER 0: HOT                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Local device cache (LRU)                                  │  │
│  │ - Most recent content                                     │  │
│  │ - User's own content                                      │  │
│  │ - Pinned content                                          │  │
│  │ Retention: Configurable (default: 7 days)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  TIER 1: WARM                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Peer caches                                               │  │
│  │ - Frequently accessed content                             │  │
│  │ - Popular content (auto-replicated)                      │  │
│  │ Retention: Based on access frequency                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  TIER 2: COLD                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Archive nodes                                             │  │
│  │ - All shared content                                      │  │
│  │ - On-demand retrieval                                     │  │
│  │ Retention: Until content expires or is revoked           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Peer Discovery

Discovers and maintains peer connections:

```typescript
class PeerDiscovery {
  // Discovery methods
  async discoverBootstrap(): Promise<PeerInfo[]>;
  async discoverMDNS(): Promise<PeerInfo[]>;
  async discoverDNS(): Promise<PeerInfo[]>;
  async discoverP2P(): Promise<PeerInfo[]>;
  
  // Peer management
  async connect(peerId: string): Promise<Connection>;
  async disconnect(peerId: string): Promise<void>;
  async getConnection(peerId: string): Promise<Connection | null>;
  
  // Peer filtering
  filterByCapabilities(peers: PeerInfo[], caps: Capability[]): PeerInfo[];
  filterByRegion(peers: PeerInfo[], region: string): PeerInfo[];
  filterByReputation(peers: PeerInfo[], minReputation: number): PeerInfo[];
}
```

### Node Types

| Type | Role | Capabilities |
|------|------|--------------|
| BOOTSTRAP | Initial connection points | Routing only |
| RELAY | Traffic relay | Relay, Routing |
| INDEXER | Content indexing | Indexing, Routing |
| STORAGE | Content storage | Storage, Routing |
| EDGE | End-user nodes | P2P, Caching |
| CLIENT | Light clients | Basic P2P |
| SELF_HOSTED | Self-hosted instances | All capabilities |

## Connection Manager

Manages peer connections:

```typescript
class ConnectionManager {
  // Connection handling
  async createConnection(peerId: string, transport: Transport): Promise<Connection>;
  async closeConnection(peerId: string): Promise<void>;
  
  // Multi-transport
  async addTransport(peerId: string, transport: Transport): Promise<void>;
  async selectTransport(peerId: string): Promise<Transport>;
  
  // Connection pooling
  async getActiveConnections(): Promise<Connection[]>;
  async getConnectionMetrics(peerId: string): Promise<ConnectionMetrics>;
  
  // Resilience
  async reconnect(peerId: string): Promise<void>;
  async handleConnectionFailure(peerId: string, error: Error): Promise<void>;
}
```

### Transport Protocols

| Protocol | Use Case | Latency | Reliability |
|----------|----------|---------|-------------|
| WebRTC | Direct P2P | Low | Medium |
| WebSocket | Persistent | Low | High |
| QUIC | Modern transport | Low | High |
| TCP | Fallback | Medium | High |

## Content Registry

Maintains the registry of all shared content:

```typescript
class ContentRegistry {
  // Registration
  async register(content: SharedContent): Promise<ContentRecord>;
  async update(contentId: string, updates: Partial<ContentRecord>): Promise<void>;
  async deregister(contentId: string): Promise<void>;
  
  // Queries
  async findById(contentId: string): Promise<ContentRecord | null>;
  async findByOwner(ownerDid: string): Promise<ContentRecord[]>;
  async findByAudience(audienceId: string): Promise<ContentRecord[]>;
  async findExpired(): Promise<ContentRecord[]>;
  
  // Statistics
  async getStats(contentId: string): Promise<ContentStats>;
  async getAccessLog(contentId: string): Promise<AccessLogEntry[]>;
}
```

### Content Record

```typescript
interface ContentRecord {
  id: string;
  contentId: string;
  
  // Ownership
  ownerDid: string;
  createdAt: Date;
  
  // Content info
  type: 'conversation' | 'acu' | 'collection';
  size: number;
  hash: string;
  
  // Sharing
  audience: {
    type: 'public' | 'circle' | 'users' | 'link';
    targets: string[];
  };
  permissions: Permissions;
  
  // Temporal
  schedule?: {
    publishAt?: Date;
    expiresAt?: Date;
  };
  
  // Location
  providers: ProviderInfo[];
  replicaCount: number;
  
  // Status
  status: 'active' | 'expired' | 'revoked' | 'archived';
}
```

## Federation Bridge

Enables cross-instance federation:

```typescript
class FederationBridge {
  // Instance discovery
  async discoverInstances(): Promise<InstanceInfo[]>;
  async registerInstance(): Promise<void>;
  
  // Cross-instance sharing
  async shareToInstance(content: SharedContent, instance: string): Promise<void>;
  async fetchFromInstance(contentId: string, instance: string): Promise<SharedContent>;
  
  // Sync
  async syncDirectory(): Promise<void>;
  async resolveConflict(instance: string, contentId: string): Promise<Resolution>;
}
```

## Integration with Publishing Pipeline

```typescript
class NetworkOrchestrator {
  // Database clients
  private masterDb: PrismaClient;
  private userDbManager: UserDatabaseManager;
  
  // Called by Publishing Pipeline
  async distribute(bundle: PublishableBundle): Promise<DistributionResult> {
    // 1. Register content metadata in Master DB
    const record = await this.contentRegistry.register({
      contentId: bundle.metadata.contentId,
      type: bundle.metadata.contentType,
      audience: bundle.metadata.audience,
      ownerDid: bundle.metadata.ownerDid,
      // ...
    });
    
    // 2. Publish to DHT
    await this.dhtService.publishContent(
      bundle.metadata.contentId,
      this.getLocalProviders()
    );
    
    // 3. Notify recipients via PubSub
    await this.notifyRecipients(bundle);
    
    // 4. Replicate to storage nodes
    const targets = await this.topologyManager.getReplicationTargets(
      bundle.metadata.contentId
    );
    await this.storageManager.replicate(bundle, targets);
    
    // 5. Schedule maintenance tasks
    await this.scheduleExpiration(record);
    
    return { success: true, contentId: record.id };
  }
  
  // Fetch content from owner's user database for distribution
  async fetchContentForDistribution(
    contentId: string,
    ownerDid: string
  ): Promise<EncryptedContent> {
    // Get owner's SQLite database
    const userDb = await this.userDbManager.getUserClient(ownerDid);
    
    // Fetch content from user's database
    const contentRecord = await userDb.contentRecord.findUnique({
      where: { contentId }
    });
    
    // Return encrypted content for distribution
    return contentRecord.encryptedContent;
  }
}
```

## Performance Characteristics

### Latency Targets

| Operation | Target | 99th Percentile |
|-----------|--------|-----------------|
| Peer connect | 100ms | 500ms |
| Content lookup | 200ms | 1s |
| Content fetch (local) | 50ms | 200ms |
| Content fetch (network) | 500ms | 2s |
| PubSub delivery | 100ms | 500ms |

### Scalability

| Metric | Target |
|--------|--------|
| Max peers per node | 1000 |
| Max concurrent transfers | 50 |
| Content records per node | 100,000 |
| PubSub messages/sec | 10,000 |

## Conclusion

The Network Orchestration Layer provides the intelligent infrastructure for VIVIM's decentralized content sharing. By combining DHT-based discovery, PubSub-based notifications, CRDT-based synchronization, and intelligent routing, the system enables:

- Efficient content distribution without central servers
- Real-time notifications for share updates
- Conflict-free collaborative editing
- Cross-instance federation
- Self-healing from node failures

This layer transforms raw P2P capabilities into a production-ready content delivery network that honors user sharing intent while maintaining privacy and performance.
