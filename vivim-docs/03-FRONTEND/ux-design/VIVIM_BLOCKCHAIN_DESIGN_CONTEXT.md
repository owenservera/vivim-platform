# VIVIM Custom Blockchain Design Context

## Complete Context Document for AI Session Handoff

This document contains ALL context needed for a new AI session to design and implement a custom blockchain for VIVIM - a distributed AI memory platform.

---

# PART 1: PROJECT OVERVIEW

## 1.1 What is VIVIM?

VIVIM is a "Personal AI Memory Platform" - an application that:
- Captures AI conversations from multiple providers (ChatGPT, Claude, Gemini, etc.)
- Extracts "Atomic Chat Units" (ACUs) - reusable knowledge fragments
- Builds a personal knowledge graph/memory system
- Enables social sharing of AI-derived insights
- Runs as a PWA (Progressive Web App) with a Node.js server backend

## 1.2 Current Architecture

```
vivim-app/
├── pwa/              # React 19 PWA frontend (Vite, Tailwind, shadcn)
├── server/           # Express.js API server (Prisma, PostgreSQL)
├── network/          # P2P network engine (libp2p, Yjs, DHT) - EXISTS!
├── admin-panel/      # Admin dashboard
├── common/           # Shared utilities (error handling)
└── vivim.docs.context/  # Documentation
```

## 1.3 Technology Stack

### PWA (`pwa/package.json`)
- React 19, React Router 7
- Vite 7, Tailwind 4
- TanStack Query, Zustand
- Yjs (CRDT), Dexie (IndexedDB)
- Socket.io-client (currently centralized)
- **Already has**: `@vivim/network-engine: workspace:*`

### Server (`server/package.json`)
- Express.js, Prisma ORM
- PostgreSQL with pgvector extension
- Playwright (for web scraping/capture)
- JWT authentication, Socket.io

### Network Engine (`network/package.json`) - CRITICAL
```json
{
  "dependencies": {
    "libp2p": "^1.0.0",
    "@libp2p/webrtc": "^6.0.0",
    "@libp2p/websockets": "^10.0.0",
    "@libp2p/kad-dht": "^16.0.0",
    "@libp2p/gossipsub": "^15.0.0",
    "@libp2p/bootstrap": "^12.0.0",
    "@libp2p/noise": "^1.0.0",
    "yjs": "^13.6.0",
    "y-webrtc": "^10.3.0",
    "y-websocket": "^1.5.0"
  }
}
```

---

# PART 2: EXISTING NETWORK ENGINE

## 2.1 Exports (`network/src/index.ts`)

The network engine already exports:

```typescript
// P2P Networking
export { NetworkNode } from './p2p/NetworkNode.js';
export { ConnectionManager } from './p2p/ConnectionManager.js';
export { PeerDiscovery } from './p2p/PeerDiscovery.js';

// CRDT Synchronization
export { CRDTSyncService } from './crdt/CRDTSyncService.js';
export { VectorClock } from './crdt/VectorClock.js';
export { ConversationCRDT } from './crdt/ConversationCRDT.js';
export { CircleCRDT } from './crdt/CircleCRDT.js';
export { FriendCRDT, FollowCRDT } from './crdt/FriendCRDT.js';
export { GroupCRDT, TeamCRDT } from './crdt/GroupCRDT.js';

// Content Discovery (DHT)
export { DHTService } from './dht/DHTService.js';
export { ContentRegistry } from './dht/ContentRegistry.js';

// Pub/Sub
export { PubSubService } from './pubsub/PubSubService.js';
export { TopicManager } from './pubsub/TopicManager.js';

// Federation
export { FederationClient } from './federation/FederationClient.js';
export { FederationServer } from './federation/FederationServer.js';

// Security
export { E2EEncryption } from './security/E2EEncryption.js';
export { KeyManager } from './security/KeyManager.js';
export { CapabilityManager } from './security/CapabilityManager.js';
```

## 2.2 NetworkNode Details (`network/src/p2p/NetworkNode.ts`)

```typescript
interface NetworkNodeConfig {
  peerId?: PeerId;
  privateKey?: Uint8Array;
  nodeType: 'bootstrap' | 'relay' | 'indexer' | 'storage' | 'edge' | 'client';
  roles: string[];
  listenAddresses: string[];
  bootstrapPeers: string[];
  enableWebRTC: boolean;
  enableDHT: boolean;
  enableGossipsub: boolean;
  minConnections: number;
  maxConnections: number;
}

class NetworkNode extends EventEmitter {
  async start(): Promise<void>;
  async stop(): Promise<void>;
  getNodeInfo(): NetworkNodeInfo;
  async connect(multiaddr: string): Promise<void>;
  getConnectedPeers(): string[];
  get running(): boolean;
  get libp2p(): Libp2p | null;
}
```

**Already configured with:**
- WebRTC transport for browser P2P
- WebSocket transport for browser-to-server
- Noise encryption (end-to-end)
- Yamux/Mplex stream multiplexers
- Kademlia DHT for content routing
- GossipSub for pub/sub messaging
- Bootstrap peer discovery

## 2.3 CRDTSyncService (`network/src/crdt/CRDTSyncService.ts`)

```typescript
interface CRDTSyncConfig {
  docId: string;
  docType: 'conversation' | 'circle' | 'profile' | 'settings';
  signalingServers?: string[];
  websocketUrl?: string;
  p2pEnabled?: boolean;
}

class CRDTSyncService extends EventEmitter {
  async createDocument(config: CRDTSyncConfig): Promise<Y.Doc>;
  getDocument(docId: string): Y.Doc | undefined;
  getSyncState(docId: string): SyncState | undefined;
  async encodeStateAsUpdate(docId: string): Promise<Uint8Array>;
  async applyUpdate(docId: string, update: Uint8Array): Promise<void>;
  getConnectedPeers(docId: string): string[];
  destroyDocument(docId: string): void;
}
```

## 2.4 Libp2pYjsProvider (`network/src/crdt/Libp2pYjsProvider.ts`)

**CRITICAL**: This already enables truly decentralized Yjs sync without signaling servers!

```typescript
class Libp2pYjsProvider extends EventEmitter {
  constructor(config: {
    roomName: string;
    doc: Y.Doc;
    node: NetworkNode;
  });
  
  // Uses GossipSub topics for Yjs update propagation
  // Topic format: `vivim-sync-v1-${roomName}`
  
  destroy(): void;
}
```

## 2.5 DHTService (`network/src/dht/DHTService.ts`)

```typescript
class DHTService extends EventEmitter {
  async initialize(libp2pNode: any): Promise<void>;
  
  // Publish content to DHT
  async publishContent(contentId: string, contentType: string, location?: ContentLocation): Promise<void>;
  
  // Find content by ID
  async findContent(contentId: string): Promise<ContentLocation[]>;
  
  // Announce as content provider
  async provideContent(contentId: string, location: ContentLocation): Promise<void>;
  
  // Find providers for content
  async findProviders(contentId: string, limit?: number): Promise<ContentLocation[]>;
  
  // Current DHT key structure
  // `/vivim/content/${contentId}` -> JSON { contentId, contentType, location, timestamp }
}

interface ContentLocation {
  type: 'pds' | 'p2p' | 'edge';
  url?: string;
  peerId?: string;
  multiaddrs?: string[];
  expiresAt?: Date;
}
```

## 2.6 KeyManager (`network/src/security/KeyManager.ts`)

```typescript
interface KeyRecord {
  id: string;
  type: 'encryption' | 'signing' | 'identity';
  publicKey: Uint8Array;
  privateKey?: Uint8Array;
  createdAt: number;
  expiresAt?: number;
}

class KeyManager extends EventEmitter {
  generateKey(type: KeyRecord['type']): KeyRecord;
  importKey(id: string, type: KeyRecord['type'], publicKey: Uint8Array, privateKey?: Uint8Array): KeyRecord;
  getKey(id: string): KeyRecord | undefined;
  getActiveKey(): KeyRecord | undefined;
  setActiveKey(id: string): void;
  getEncryption(): E2EEncryption;
  exportPublicKey(id: string): string | undefined;
}
```

## 2.7 PubSubService (`network/src/pubsub/PubSubService.ts`)

```typescript
class PubSubService extends EventEmitter {
  async initialize(libp2pNode: any): Promise<void>;
  
  // Topic management
  async subscribe(topic: string, peerId?: string): Promise<void>;
  async unsubscribe(topic: string, peerId?: string): Promise<void>;
  
  // Publishing
  async publish(topic: string, message: Message): Promise<void>;
  async publishToTopic(topic: string, data: Uint8Array | string): Promise<void>;
  
  // Queries
  getSubscriptions(peerId?: string): string[];
  getSubscriberCount(topic: string): number;
  getMeshPeers(topic: string): string[];
  
  // Topics are normalized to `/vivim/${topic}`
}
```

---

# PART 3: DATA MODELS

## 3.1 Core Entities (from `server/prisma/schema.prisma`)

### User
```prisma
model User {
  id                  String   @id @default(uuid())
  did                 String   @unique          // ALREADY HAS DID!
  handle              String?  @unique
  displayName         String?
  email               String?  @unique
  
  // Cryptographic keys
  publicKey           String
  keyType             String   @default("Ed25519")
  
  // Trust & verification
  verificationLevel   Int      @default(0)
  trustScore          Float    @default(50)
  
  // Federated hosting (Bluesky-style)
  pdsUrl              String?
  
  // Relations
  conversations       Conversation[]
  acus                AtomicChatUnit[]
  memories            Memory[]
  circlesOwned        Circle[]
  circleMemberships   CircleMember[]
  friendsRequested    Friend[]
  friendsReceived     Friend[]
  followers           Follow[]
  following           Follow[]
}
```

### AtomicChatUnit (ACU) - The Core Knowledge Unit
```prisma
model AtomicChatUnit {
  id              String   @id                    // CID-ready
  authorDid       String                           // Already references DID
  signature       Bytes                            // Already has signature!
  content         String
  contentHash     String?
  version         Int      @default(1)
  
  type            String                           // 'insight', 'code', 'concept', etc.
  category        String
  origin          String   @default("extraction")
  
  // CRDT fields
  embedding       Float[]
  embeddingModel  String?
  
  // Lineage
  parentId        String?                          // For derived ACUs
  derivations     AtomicChatUnit[]                 // Children
  
  // Sharing
  sharingPolicy   String   @default("self")
  sharingCircles  String[]
  
  // Relations
  conversation    Conversation?
  message         Message?
  author          User     @relation(fields: [authorDid], references: [did])
}
```

### Conversation
```prisma
model Conversation {
  id              String   @id @default(uuid())
  provider        String                          // 'openai', 'anthropic', etc.
  sourceUrl       String   @unique
  contentHash     String?
  version         Int      @default(1)
  title           String
  
  // Stats
  messageCount    Int      @default(0)
  totalTokens     Int?
  
  // Ownership
  ownerId         String?
  owner           User?
  messages        Message[]
  acus            AtomicChatUnit[]
}
```

### Memory (Personal Knowledge)
```prisma
model Memory {
  id              String   @id @default(uuid())
  userId          String
  
  // Content
  content         String
  summary         String?
  
  // Provenance (for lineage tracking)
  provenanceId    String?
  provider        String?
  sourceUrl       String?
  
  // Lineage
  lineageDepth    Int      @default(0)
  lineageParentId String?
  derivedFromIds  String[]  @default([])
  version         Int      @default(1)
  
  // Content fingerprinting
  contentHash     String?
  contentVersion  Int      @default(1)
  
  // Categorization
  memoryType      MemoryType @default(EPISODIC)
  category        String
  tags            String[]  @default([])
  
  // Embeddings
  embedding       Float[]
  embeddingModel  String?
  
  // Consolidation
  consolidationStatus MemoryConsolidationStatus @default(RAW)
}

enum MemoryType {
  EPISODIC      // Events, conversations
  SEMANTIC      // Facts, knowledge
  PROCEDURAL    // How-to
  FACTUAL       // User facts
  PREFERENCE    // Preferences
  IDENTITY      // Bio, role
  RELATIONSHIP  // People info
  GOAL          // Plans
  PROJECT       // Project knowledge
}
```

### SyncOperation (Already CRDT-aware!)
```prisma
model SyncOperation {
  id           String   @id @default(uuid())
  authorDid    String
  deviceDid    String
  tableName    String
  recordId     String
  entityType   String?
  entityId     String?
  operation    String                    // INSERT, UPDATE, DELETE
  payload      Json
  hlcTimestamp String                   // Hybrid Logical Clock!
  vectorClock  Json   @default("{}")    // Vector Clock!
  isProcessed  Boolean @default(false)
  createdAt    DateTime @default(now())
  appliedAt    DateTime?
}
```

### Social Graph
```prisma
model Friend {
  requesterId  String
  addresseeId  String
  status       FriendStatus @default(PENDING)
  requestedAt  DateTime
  respondedAt  DateTime?
}

model Follow {
  followerId   String
  followingId  String
  status       FollowStatus @default(ACTIVE)
  createdAt    DateTime
}

model Circle {
  id          String
  ownerId     String
  name        String
  isPublic    Boolean @default(false)
  members     CircleMember[]
}

model CircleMember {
  circleId    String
  userId      String
  role        String @default("member")
  joinedAt    DateTime
}
```

### Sharing & Access Control
```prisma
model SharingPolicy {
  id          String
  contentId   String @unique
  contentType String
  ownerId     String
  audience    Json
  permissions Json
  status      String @default("active")
}

model SharingIntent {
  id              String
  version         Int @default(1)
  intentType      IntentType        // SHARE, PUBLISH, EMBED, FORK
  actorDid        String
  contentType     ContentType       // CONVERSATION, ACU, MEMORY
  contentIds      String[]
  audienceType    AudienceType      // PUBLIC, CIRCLE, USERS, LINK
  circleIds       String[]
}
```

---

# PART 4: CURRENT API PATTERNS

## 4.1 Server Routes (42 route files)

Located in `server/src/routes/`:

| Category | Routes | Purpose |
|----------|--------|---------|
| **Core** | `core.js`, `conversations.js` | CRUD operations |
| **AI** | `ai.js`, `ai-chat.js`, `ai-settings.js` | AI interactions |
| **Capture** | `capture.js` | Web scraping with Playwright |
| **Context** | `context.js`, `context-v2.js`, `context-engine.ts` | Context management |
| **Memory** | `memory.ts`, `memory-search.js` | Memory CRUD/search |
| **Social** | `social.ts`, `circles.js` | Social graph |
| **Sharing** | `sharing.js`, `portability.js` | Access control |
| **Sync** | `sync.js` | Delta sync (HLC + Vector Clocks) |
| **Identity** | `identity.js`, `identity-v2.js`, `auth.js` | Authentication |
| **Admin** | `admin/*.js` | System management |

## 4.2 Sync Protocol (Current - `server/src/routes/sync.js`)

```javascript
// PULL - Get changes since last sync
GET /api/sync/pull?deviceId=xxx&lastSyncId=yyy

// Response:
{
  syncId: "new-cursor",
  operations: [
    {
      id: "op-uuid",
      entityType: "conversation",
      entityId: "conv-uuid",
      operation: "INSERT",
      payload: { /* entity data */ },
      hlcTimestamp: "2026-02-26T10:30:00.123Z",
      vectorClock: { "device-A": 5, "device-B": 3 }
    }
  ],
  hasMore: false
}

// PUSH - Submit local changes
POST /api/sync/push
{
  deviceId: "device-uuid",
  lastSyncId: "last-cursor",
  operations: [
    {
      id: "op-uuid",
      entityType: "message",
      entityId: "msg-uuid",
      operation: "INSERT",
      payload: { /* message data */ },
      hlcTimestamp: "2026-02-26T10:31:00.456Z",
      vectorClock: { "device-A": 6 }
    }
  ]
}
```

## 4.3 PWA Communication (`pwa/src/lib/`)

Current patterns:
- `api.ts` - REST API calls
- `sync-engine.ts` - Socket.io based sync
- `webrtc-manager.ts` - WebRTC with Socket.io signaling
- `p2p-placeholder-service.ts` - Empty placeholder for P2P

**Key insight**: The PWA already has `@vivim/network-engine` as dependency but doesn't use it!

---

# PART 5: BLOCKCHAIN DESIGN REQUIREMENTS

## 5.1 Design Goals

1. **Minimal Servers**: Reduce dependency on central PostgreSQL server
2. **Self-Certifying Data**: All data signed by author's DID
3. **Content Addressing**: CIDs for deduplication
4. **Event Sourcing**: State derived from immutable operation log
5. **Gossip Propagation**: Updates spread via GossipSub
6. **Local-First**: Full functionality offline

## 5.2 Inspiration Sources

### Ceramic Network
- **Streams**: Append-only log of signed commits
- **Model Catalog**: Shared data models for composability
- **ComposeDB**: GraphQL queries over P2P data
- **Anchoring**: Periodic blockchain anchors for time

### Nostr Protocol
- **Events**: Everything is a signed JSON object
- **Relays**: Dumb servers that store/forward events
- **Filters**: Query language for subscriptions
- **Kinds**: Event types (1=text note, 0=profile, etc.)

```json
// Nostr Event Structure
{
  "id": "<sha256 of serialized event>",
  "pubkey": "<32-byte hex>",
  "created_at": 1234567890,
  "kind": 1,
  "tags": [["p", "pubkey"], ["e", "event-id"]],
  "content": "Hello world",
  "sig": "<64-byte signature>"
}
```

### IPFS/IPLD
- **CIDs**: Content identifiers (hash-based addresses)
- **Merkle DAG**: Linked data structures
- **Helia**: JavaScript implementation for browsers

### Web5/DWN
- **Records**: User-owned data with protocol definitions
- **DID Auth**: Authorization via Decentralized Identifiers
- **Sync**: Automatic cross-device synchronization

---

# PART 6: PROPOSED CHAIN API

## 6.1 Core Event Structure

```typescript
interface ChainEvent {
  // Core
  id: string;                    // CID of the event
  type: EventType;               // Operation type
  author: string;                // DID of author
  timestamp: number;             // HLC timestamp
  
  // Content
  payload: any;                  // Type-specific data
  cid?: string;                  // CID of payload if large
  
  // CRDT
  version: number;               // Lamport clock
  vectorClock: Record<string, number>;
  
  // References
  parentId?: string;             // Parent event
  entityId?: string;             // Entity being modified
  prevVersion?: string;          // Previous version CID
  
  // Auth
  signature: string;             // Ed25519 signature
  
  // Discovery
  tags?: string[];
  scope: EventScope;
}
```

## 6.2 Event Types

```typescript
enum EventType {
  // Identity
  IDENTITY_CREATE = 'identity:create',
  IDENTITY_UPDATE = 'identity:update',
  
  // Content
  CONVERSATION_CREATE = 'conversation:create',
  CONVERSATION_UPDATE = 'conversation:update',
  MESSAGE_CREATE = 'message:create',
  ACU_CREATE = 'acu:create',
  ACU_DERIVE = 'acu:derive',
  
  // Memory
  MEMORY_CREATE = 'memory:create',
  MEMORY_LINK = 'memory:link',
  
  // Social
  FOLLOW = 'social:follow',
  FRIEND_REQUEST = 'social:friend_request',
  CIRCLE_CREATE = 'circle:create',
  CIRCLE_ADD_MEMBER = 'circle:add_member',
  
  // System
  SYNC_REQUEST = 'sync:request',
  ANCHOR = 'system:anchor',
}
```

## 6.3 Client API Surface

```typescript
class VivimChainClient {
  // Identity
  initializeIdentity(options?: { did?, seed? }): Promise<Identity>;
  sign(data: Uint8Array): Promise<Signature>;
  verify(data, signature, author): Promise<boolean>;
  
  // Events
  createEvent(type, payload, options?): Promise<ChainEvent>;
  signEvent(event): Promise<ChainEvent>;
  submitEvent(event): Promise<{ cid, accepted }>;
  getEvent(cid): Promise<ChainEvent | null>;
  queryEvents(filter): Promise<ChainEvent[]>;
  
  // Entities
  createEntity(type, data, options?): Promise<{ entityId, eventCid }>;
  updateEntity(entityId, updates): Promise<{ eventCid }>;
  deleteEntity(entityId): Promise<{ eventCid }>;
  getEntity(entityId): Promise<EntityState | null>;
  
  // Content
  storeContent(data): Promise<{ cid, size }>;
  getContent(cid): Promise<Uint8Array>;
  pinContent(cid): Promise<void>;
  
  // Sync
  sync(options?): Promise<SyncResult>;
  subscribe(filter, callback): () => void;
  
  // Social
  follow(did): Promise<{ eventCid }>;
  getFollowers(did): Promise<string[]>;
  createCircle(name, options?): Promise<{ circleId }>;
  shareWithCircle(entityId, circleId): Promise<void>;
}
```

---

# PART 7: IMPLEMENTATION APPROACH

## 7.1 What Already Exists

| Component | Status | Location |
|-----------|--------|----------|
| libp2p node | ✅ Ready | `network/src/p2p/NetworkNode.ts` |
| DHT service | ✅ Ready | `network/src/dht/DHTService.ts` |
| Pub/Sub | ✅ Ready | `network/src/pubsub/PubSubService.ts` |
| CRDT sync | ✅ Ready | `network/src/crdt/CRDTSyncService.ts` |
| Key management | ✅ Ready | `network/src/security/KeyManager.ts` |
| DID field | ✅ In schema | `User.did` in Prisma |
| Signatures | ✅ In schema | `AtomicChatUnit.signature` |
| HLC + Vector Clocks | ✅ In schema | `SyncOperation` model |

## 7.2 What Needs to be Built

1. **Event Layer**
   - `ChainEvent` type definition
   - CID calculation (sha256 + multibase)
   - Event signing/verification
   - `EventStore` with IndexedDB

2. **State Machine**
   - Event handlers per type
   - CRDT merge logic
   - State persistence
   - Query layer

3. **Block Builder**
   - Event batching
   - Merkle tree construction
   - Optional blockchain anchoring

4. **DID Integration**
   - `did:key` generation
   - DID document management
   - Verifiable Credentials (optional)

5. **IPFS/Helia**
   - Content storage
   - CID-based retrieval
   - Pinning

6. **PWA Integration**
   - Replace `SyncEngine` with `VivimChainClient`
   - Update API calls to use chain methods
   - Background sync worker

## 7.3 Integration Points

### PWA Entry Point
```typescript
// pwa/src/lib/chain-client.ts (NEW)
import { VivimChainClient } from '@vivim/network-engine';

export const chainClient = new VivimChainClient();

// In app initialization
await chainClient.initializeIdentity();
await chainClient.sync();
```

### Network Engine Extension
```typescript
// network/src/chain/index.ts (NEW)
export { VivimChainClient } from './ChainClient.js';
export { EventStore } from './EventStore.js';
export { StateMachine } from './StateMachine.js';
export { BlockBuilder } from './BlockBuilder.js';
export type { ChainEvent, EntityState, EventType } from './types.js';
```

---

# PART 8: DESIGN PROMPT FOR AI

## Complete Prompt for New Session

```
Design a custom blockchain for VIVIM, a distributed AI memory platform.

## CONTEXT

VIVIM captures AI conversations and extracts knowledge units (ACUs). We need to transform it from a centralized server architecture to a blockchain-like P2P system.

## WHAT EXISTS

1. **Network Engine** (`network/` package):
   - Full libp2p implementation with WebRTC, DHT, GossipSub
   - CRDTSyncService using Yjs
   - Libp2pYjsProvider for serverless sync
   - KeyManager with Ed25519 keys
   - DHTService for content routing
   - PubSubService with topic management

2. **Data Models** (Prisma schema):
   - User with DID field and publicKey
   - AtomicChatUnit with signature field
   - SyncOperation with HLC timestamp and vector clocks
   - Memory with lineage tracking
   - Social graph (Friends, Follows, Circles)

3. **Patterns to Follow**:
   - Nostr: Signed events with kind/types
   - Ceramic: Stream-based data with composability
   - IPFS: Content-addressed storage with CIDs
   - Web5: DID-based authorization

## REQUIREMENTS

1. **ChainEvent**: Every operation as a signed, content-addressed event
2. **StateMachine**: CRDT-powered state derivation from event log
3. **DHT Registry**: Content discovery via Kademlia
4. **Gossip Sync**: Event propagation via GossipSub
5. **DID Identity**: Replace OAuth with decentralized identifiers

## DELIVERABLES NEEDED

1. Complete `ChainEvent` type definition with all event types
2. `VivimChainClient` class with full API
3. Event handlers for each entity type
4. DHT key structure for content registry
5. Sync protocol over GossipSub
6. Security model and authorization rules
7. Migration plan from current sync.js

## CONSTRAINTS

- Must work in browser (WebRTC, IndexedDB)
- Must work offline (local-first)
- Must integrate with existing network engine
- Must support existing social graph (friends, circles)
- Must maintain ACU lineage and provenance

## FILES TO REFERENCE

- `network/src/p2p/NetworkNode.ts` - libp2p node
- `network/src/crdt/CRDTSyncService.ts` - Yjs sync
- `network/src/dht/DHTService.ts` - Content routing
- `network/src/security/KeyManager.ts` - Key management
- `server/prisma/schema.prisma` - All data models
- `server/src/routes/sync.js` - Current sync protocol
- `VIVIM_CHAIN_API_DESIGN.md` - Preliminary design

Please design the complete blockchain architecture with implementation details.
```

---

# PART 9: KEY FILES TO READ

## Essential Files for Context

```
# Network Engine Core
network/src/index.ts                    # All exports
network/src/p2p/NetworkNode.ts          # libp2p node config
network/src/crdt/CRDTSyncService.ts     # Yjs integration
network/src/crdt/Libp2pYjsProvider.ts   # GossipSub for Yjs
network/src/dht/DHTService.ts           # Content routing
network/src/dht/ContentRegistry.ts      # Local registry
network/src/security/KeyManager.ts      # Key management
network/src/pubsub/PubSubService.ts     # Topic messaging
network/src/types.ts                    # Core types

# Data Models
server/prisma/schema.prisma             # All 50+ models

# Current Sync
server/src/routes/sync.js               # Delta sync with HLC/VC

# PWA Integration Points
pwa/src/lib/sync-engine.ts              # Current Socket.io sync
pwa/src/lib/webrtc-manager.ts           # Current WebRTC
pwa/src/lib/p2p-placeholder-service.ts  # Empty P2P placeholder
pwa/package.json                        # Dependencies

# Design Documents
P2P_TRANSFORMATION_FINDINGS.md          # Research findings
VIVIM_CHAIN_API_DESIGN.md               # API design
```

---

# PART 10: IMPLEMENTATION CHECKLIST

## Phase 1: Event Layer
- [ ] Define `ChainEvent` interface
- [ ] Implement CID calculation (multihash + multibase)
- [ ] Add event signing to KeyManager
- [ ] Create EventStore with IndexedDB
- [ ] Build event query layer

## Phase 2: State Machine
- [ ] Define `EntityState` interface
- [ ] Implement event handlers per type
- [ ] Build CRDT merge logic
- [ ] Create state persistence layer
- [ ] Add state query API

## Phase 3: DHT Integration
- [ ] Define DHT key schema
- [ ] Implement content registration
- [ ] Build provider announcement
- [ ] Add content resolution
- [ ] Create index structures

## Phase 4: Gossip Sync
- [ ] Define sync topics
- [ ] Implement event announcement
- [ ] Build sync request/response
- [ ] Add conflict resolution
- [ ] Create block builder

## Phase 5: Identity
- [ ] Implement did:key generation
- [ ] Add DID document resolution
- [ ] Create auth flow
- [ ] Migrate from OAuth

## Phase 6: Integration
- [ ] Create VivimChainClient
- [ ] Update PWA to use chain
- [ ] Add offline queue
- [ ] Build background sync

---

*This document provides complete context for designing and implementing a custom blockchain for VIVIM.*



---

# PART 11: DISTRIBUTED STORAGE LAYER

## 11.1 Instagram-Scale Distributed Storage

The blockchain must support Instagram-like content at scale:
- Images, videos, audio stored permanently on IPFS
- Content addressed by CID (content-addressed)
- On-chain references for discoverability
- Storage deals with providers for persistence
- Economic incentives via tokens/credits

## 11.2 Storage Tiers

| Tier | Technology | Latency | Persistence | Cost |
|------|------------|----------|-------------|------|
| Hot | IndexedDB + DWN | <50ms | User-controlled | Free |
| Warm | IPFS (Pinned) | 100ms-2s | Until unpinned | Provider |
| Cold | Filecoin/Arweave | Minutes+ | Contract-based | FIL/AR |
| On-Chain | Smart Contract | Block time | Indefinite | Gas |

## 11.3 Key Components

```typescript
// Content Object
interface ContentObject {
  cid: string;              // IPFS CID
  type: ContentType;        // post, image, video, audio, etc.
  author: string;           // DID
  signature: string;        // Ed25519 signature
  visibility: 'public' | 'circle' | 'friends' | 'private';
  storage: StorageInfo;
}

// Storage Deal
interface StorageDeal {
  dealId: string;
  cid: string;
  provider: string;
  duration: number;
  price: bigint;
  state: DealState;
  chainRef: {
    chain: 'filecoin' | 'arweave' | 'polygon';
    txHash: string;
  };
}
```

## 11.4 Content Client API

```typescript
class DistributedContentClient {
  // Creation
  createContent(options): Promise<ContentObject>;
  uploadMedia(file, options): Promise<{ cid, thumbnails, transcoded }>;
  
  // Storage
  pinContent(cid): Promise<void>;
  createStorageDeal(cid, options): Promise<StorageDeal>;
  getStorageStatus(cid): Promise<StorageStatus>;
  
  // Retrieval
  getContent(cid): Promise<ContentObject>;
  getMediaStream(cid): Promise<ReadableStream>;
  
  // Discovery
  getFeed(options): Promise<ContentObject[]>;
  searchContent(query): Promise<ContentObject[]>;
  
  // Interactions
  likeContent(cid): Promise<void>;
  comment(cid, text): Promise<ContentObject>;
  shareContent(cid, options): Promise<ContentObject>;
}
```

---

# PART 12: AI INTERACTION LAYER (assistant-ui + tool-ui)

## 12.1 Repository References

Two key UI libraries:

### assistant-ui-VIVIM
- **URL**: https://github.com/owenservera/assistant-ui-VIVIM
- **Purpose**: React components for AI chat interfaces
- **Key Components**: Thread, MessageList, Composer, Attachment, ToolFallback, Markdown
- **Features**: Streaming, auto-scroll, accessibility, tool rendering

### tool-ui-VIVIM
- **URL**: https://github.com/owenservera/tool-ui-VIVIM
- **Purpose**: UI components for rendering tool calls
- **Key Components**: ApprovalCard, OptionList, QuestionFlow, DataTable, Chart, ImageGallery, Video, Plan
- **Features**: Zod schemas, presets, interactive tool rendering

## 12.2 Integration Architecture

```
assistant-ui-VIVIM          tool-ui-VIVIM
        │                         │
        ▼                         ▼
┌───────────────────────────────────────────┐
│           VIVIM RUNTIME ADAPTER           │
│  ┌─────────────┐  ┌─────────────┐        │
│  │ChatRuntime  │  │ToolRegistry │        │
│  └──────┬──────┘  └──────┬──────┘        │
│         │                │               │
└─────────┼────────────────┼───────────────┘
          │                │
          ▼                ▼
┌───────────────────────────────────────────┐
│            VIVIM CHAIN CLIENT             │
│  ┌─────────────┐  ┌─────────────┐        │
│  │ChainClient  │  │ContentClient│        │
│  └─────────────┘  └─────────────┘        │
└───────────────────────────────────────────┘
```

## 12.3 Chat Runtime Adapter

```typescript
class VivimChatRuntime implements AssistantRuntime {
  // Thread Management
  get thread(): ThreadRuntime;
  newThread(): Promise<void>;
  switchToThread(threadId: string): Promise<void>;
  listThreads(): Promise<ThreadInfo[]>;
  
  // Messages
  sendMessage(content: string, attachments?: Attachment[]): Promise<void>;
  
  // Context
  buildContext(query: string): Promise<Context>;
  extractKnowledge(userMessage, assistantMessage): Promise<void>;
  
  // Subscriptions
  subscribe(callback): () => void;
}
```

## 12.4 Tool Registry (Blockchain Tools)

```typescript
class VivimToolRegistry {
  // Default tools for AI:
  
  // Storage
  'store_content'        // Store content on distributed network
  'search_content'       // Search content on network
  'create_storage_deal'  // Create Filecoin deal
  
  // Social
  'follow_user'          // Follow a user
  'create_circle'        // Create sharing circle
  
  // Memory
  'save_memory'          // Save to distributed memory
  'recall_memories'      // Recall from memory
  
  // Content
  'like_content'         // Like content
  'comment_on_content'   // Comment
  'capture_url'          // Capture URL via distributed workers
}
```

## 12.5 Tool UI Component Mappings

| Tool Result | tool-ui Component |
|------------|-------------------|
| StorageReceipt | OrderSummary |
| StorageDealCard | OrderSummary |
| SearchResults | DataTable |
| FollowReceipt | MessageDraft |
| MemoryList | OptionList |
| CaptureResultCard | LinkPreview |
| ImageGallery | ImageGallery |
| VideoPlayer | Video |

---

# PART 13: FILES TO REFERENCE

## Additional Design Documents

1. `VIVIM_CHAIN_API_DESIGN.md` - Complete blockchain API design
2. `VIVIM_DISTRIBUTED_STORAGE_AI_LAYER.md` - Storage + AI layer design
3. `P2P_TRANSFORMATION_FINDINGS.md` - Research findings
4. `BLOCKCHAIN_DESIGN_PROMPT.md` - Quick start prompt

## External Repositories

1. https://github.com/owenservera/assistant-ui-VIVIM
2. https://github.com/owenservera/tool-ui-VIVIM

---

*Extended with distributed storage and AI interaction layer context.*