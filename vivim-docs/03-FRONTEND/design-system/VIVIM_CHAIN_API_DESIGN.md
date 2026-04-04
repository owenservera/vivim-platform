# VIVIM Chain API Design

## A Blockchain-Like P2P API for Distributed AI Memory

This document defines a unified API that transforms vivim-app into a blockchain-like distributed system using libp2p, CRDTs, DHT, and signed operations.

---

## 1. Executive Summary

### Vision
Transform vivim into a **Content-Addressed, Signed-Operation Network** where:
- Every operation is a **signed event** (like Nostr)
- Content is addressed by **CID** (like IPFS)
- State is derived from **CRDT operations** (like Ceramic)
- Discovery happens via **DHT** (like libp2p)
- Storage is **user-owned** via DWNs (like Web5)

### Core Principles
1. **Self-Certifying Data**: All data signed by author's DID
2. **Content Addressing**: CIDs for deduplication and verification
3. **Event Sourcing**: State derived from immutable operation log
4. **Gossip Propagation**: Updates spread via GossipSub
5. **Local-First**: Full functionality without network

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VIVIM CHAIN LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Chain     │  │   Block     │  │  Consensus  │  │   State     │   │
│  │   Client    │  │   Builder   │  │   (Gossip)  │  │   Machine   │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
└─────────┼────────────────┼────────────────┼────────────────┼───────────┘
          │                │                │                │
┌─────────┴────────────────┴────────────────┴────────────────┴───────────┐
│                         NETWORK ENGINE LAYER                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │NetworkNode  │  │  DHTService │  │PubSubService│  │KeyManager   │   │
│  │ (libp2p)    │  │ (Kademlia)  │  │ (GossipSub) │  │ (Ed25519)   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │CRDTSync     │  │ContentReg   │  │E2EEncrypt   │  │Federation   │   │
│  │ (Yjs)       │  │ (Registry)  │  │ (Noise)     │  │ (Relay)     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │                │                │                │
┌─────────┴────────────────┴────────────────┴────────────────┴───────────┐
│                          STORAGE LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ DWN Store   │  │ IPFS/Helia  │  │ IndexedDB   │  │  Cache      │   │
│  │ (Private)   │  │ (Public)    │  │ (Local)     │  │ (Memory)    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Data Structures

### 3.1 Chain Event (The "Transaction")

Every operation in VIVIM is a signed event, inspired by Nostr but enriched with CRDT semantics.

```typescript
interface ChainEvent {
  // === Core (Required) ===
  id: string;              // CID of the event (content-addressed)
  type: EventType;         // What kind of operation
  author: string;          // DID of the author
  timestamp: number;       // HLC timestamp (Hybrid Logical Clock)
  
  // === Content ===
  payload: any;            // Operation-specific data
  cid?: string;            // CID of payload if large (stored in IPFS)
  
  // === CRDT Metadata ===
  version: number;         // Lamport clock for this entity
  vectorClock: Record<string, number>;  // Vector clock for causality
  
  // === References ===
  parentId?: string;       // Parent event CID (for threading)
  entityId?: string;       // Entity being modified (conversation, acu, etc.)
  prevVersion?: string;    // CID of previous version (for updates)
  
  // === Authorization ===
  signature: string;       // Ed25519 signature over the hash
  delegation?: string;     // Optional delegated authority (VC)
  
  // === Discovery ===
  tags?: string[];         // Content tags for indexing
  scope: EventScope;       // Who can see this event
}

enum EventType {
  // Identity
  IDENTITY_CREATE = 'identity:create',
  IDENTITY_UPDATE = 'identity:update',
  
  // Content
  CONVERSATION_CREATE = 'conversation:create',
  CONVERSATION_UPDATE = 'conversation:update',
  CONVERSATION_DELETE = 'conversation:delete',
  
  MESSAGE_CREATE = 'message:create',
  MESSAGE_UPDATE = 'message:update',
  
  ACU_CREATE = 'acu:create',
  ACU_DERIVE = 'acu:derive',
  ACU_SHARE = 'acu:share',
  
  // Memory
  MEMORY_CREATE = 'memory:create',
  MEMORY_LINK = 'memory:link',
  MEMORY_MERGE = 'memory:merge',
  
  // Social
  FOLLOW = 'social:follow',
  UNFOLLOW = 'social:unfollow',
  FRIEND_REQUEST = 'social:friend_request',
  FRIEND_ACCEPT = 'social:friend_accept',
  
  CIRCLE_CREATE = 'circle:create',
  CIRCLE_ADD_MEMBER = 'circle:add_member',
  
  // System
  SYNC_REQUEST = 'sync:request',
  SYNC_RESPONSE = 'sync:response',
  ANCHOR = 'system:anchor',      // Anchor to blockchain (optional)
}

enum EventScope {
  PUBLIC = 'public',       // Visible to all
  CIRCLE = 'circle',       // Visible to circle members
  FRIENDS = 'friends',     // Visible to friends
  PRIVATE = 'private',     // Encrypted, only author
  SELF = 'self',           // Never leaves device
}
```

### 3.2 Block (For Batching & Anchoring)

Events are batched into blocks for efficiency and optional blockchain anchoring.

```typescript
interface Block {
  // === Core ===
  id: string;              // CID of the block
  number: number;          // Sequential block number (local)
  timestamp: number;       // HLC timestamp
  
  // === Content ===
  events: string[];        // Ordered list of event CIDs
  merkleRoot: string;      // Merkle root of events
  
  // === Authoring ===
  author: string;          // DID of block author
  signature: string;       // Signature over merkleRoot
  
  // === Chain ===
  prevBlock: string;       // CID of previous block
  anchor?: {               // Optional blockchain anchor
    chain: 'ethereum' | 'bitcoin' | 'solana';
    txHash: string;
    blockNumber: number;
  };
  
  // === Metadata ===
  stats: {
    eventCount: number;
    totalSize: number;
    uniqueAuthors: number;
  };
}
```

### 3.3 Entity State (Derived from Events)

State is derived by replaying events through a CRDT-powered state machine.

```typescript
interface EntityState {
  id: string;
  type: EntityType;
  version: number;
  
  // Current state (CRDT-merged)
  state: any;
  
  // Provenance
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
  
  // Event log
  eventLog: string[];      // CIDs of all events that modified this entity
  
  // Vector clock for this entity
  vectorClock: Record<string, number>;
}

enum EntityType {
  CONVERSATION = 'conversation',
  MESSAGE = 'message',
  ACU = 'acu',
  MEMORY = 'memory',
  CIRCLE = 'circle',
  PROFILE = 'profile',
}
```

---

## 4. API Design

### 4.1 Chain Client API

The main interface for applications to interact with the chain.

```typescript
class VivimChainClient {
  // ============================================
  // IDENTITY
  // ============================================
  
  /**
   * Create or load identity from DID
   */
  async initializeIdentity(options: {
    did?: string;           // Existing DID to load
    seed?: Uint8Array;      // Recovery seed
  }): Promise<Identity>;
  
  /**
   * Get current identity
   */
  getIdentity(): Identity | null;
  
  /**
   * Sign a message with identity key
   */
  sign(data: Uint8Array): Promise<Signature>;
  
  /**
   * Verify a signature
   */
  verify(data: Uint8Array, signature: Signature, author: string): Promise<boolean>;
  
  // ============================================
  // EVENT LIFECYCLE
  // ============================================
  
  /**
   * Create a new event (unsigned)
   */
  createEvent(type: EventType, payload: any, options?: {
    parentId?: string;
    entityId?: string;
    scope?: EventScope;
    tags?: string[];
  }): Promise<ChainEvent>;
  
  /**
   * Sign an event
   */
  signEvent(event: ChainEvent): Promise<ChainEvent>;
  
  /**
   * Submit an event to the network
   */
  submitEvent(event: ChainEvent): Promise<{
    cid: string;
    accepted: boolean;
    errors?: string[];
  }>;
  
  /**
   * Get event by CID
   */
  getEvent(cid: string): Promise<ChainEvent | null>;
  
  /**
   * Query events
   */
  queryEvents(filter: {
    types?: EventType[];
    authors?: string[];
    entityIds?: string[];
    tags?: string[];
    since?: number;
    until?: number;
    limit?: number;
  }): Promise<ChainEvent[]>;
  
  // ============================================
  // ENTITY OPERATIONS
  // ============================================
  
  /**
   * Create a new entity
   */
  createEntity(type: EntityType, data: any, options?: {
    scope?: EventScope;
    tags?: string[];
  }): Promise<{ entityId: string; eventCid: string }>;
  
  /**
   * Update an entity
   */
  updateEntity(entityId: string, updates: any): Promise<{ eventCid: string }>;
  
  /**
   * Delete an entity (soft delete via event)
   */
  deleteEntity(entityId: string): Promise<{ eventCid: string }>;
  
  /**
   * Get entity state
   */
  getEntity(entityId: string): Promise<EntityState | null>;
  
  /**
   * Get entity history (event log)
   */
  getEntityHistory(entityId: string, options?: {
    fromVersion?: number;
    limit?: number;
  }): Promise<ChainEvent[]>;
  
  // ============================================
  // CONTENT-ADDRESSABLE STORAGE
  // ============================================
  
  /**
   * Store content in IPFS
   */
  storeContent(data: Uint8Array | object): Promise<{
    cid: string;
    size: number;
  }>;
  
  /**
   * Retrieve content from IPFS
   */
  getContent(cid: string): Promise<Uint8Array>;
  
  /**
   * Pin content to local storage
   */
  pinContent(cid: string): Promise<void>;
  
  /**
   * Unpin content
   */
  unpinContent(cid: string): Promise<void>;
  
  // ============================================
  // SYNC & DISCOVERY
  // ============================================
  
  /**
   * Sync with network
   */
  sync(options?: {
    entityTypes?: EntityType[];
    since?: number;
  }): Promise<SyncResult>;
  
  /**
   * Subscribe to real-time updates
   */
  subscribe(filter: {
    types?: EventType[];
    authors?: string[];
    entityIds?: string[];
  }, callback: (event: ChainEvent) => void): () => void;
  
  /**
   * Find content providers
   */
  findProviders(cid: string): Promise<ProviderInfo[]>;
  
  /**
   * Announce as content provider
   */
  announceProvider(cid: string): Promise<void>;
  
  // ============================================
  // SOCIAL GRAPH
  // ============================================
  
  /**
   * Follow a user
   */
  follow(did: string): Promise<{ eventCid: string }>;
  
  /**
   * Unfollow a user
   */
  unfollow(did: string): Promise<{ eventCid: string }>;
  
  /**
   * Get followers
   */
  getFollowers(did: string): Promise<string[]>;
  
  /**
   * Get following
   */
  getFollowing(did: string): Promise<string[]>;
  
  /**
   * Get social feed
   */
  getFeed(options?: {
    authors?: string[];
    limit?: number;
    since?: number;
  }): Promise<ChainEvent[]>;
  
  // ============================================
  // CIRCLES & SHARING
  // ============================================
  
  /**
   * Create a circle
   */
  createCircle(name: string, options?: {
    isPublic?: boolean;
    members?: string[];
  }): Promise<{ circleId: string }>;
  
  /**
   * Add member to circle
   */
  addCircleMember(circleId: string, did: string): Promise<void>;
  
  /**
   * Share entity with circle
   */
  shareWithCircle(entityId: string, circleId: string): Promise<void>;
  
  // ============================================
  // NETWORK STATUS
  // ============================================
  
  /**
   * Get network status
   */
  getStatus(): Promise<{
    connected: boolean;
    peerCount: number;
    syncStatus: 'synced' | 'syncing' | 'offline';
    lastBlock: number;
    pendingEvents: number;
  }>;
  
  /**
   * Get connected peers
   */
  getPeers(): Promise<PeerInfo[]>;
  
  /**
   * Connect to specific peer
   */
  connectPeer(multiaddr: string): Promise<void>;
}
```

### 4.2 Event Handlers (Per Type)

```typescript
// Event handlers map event types to state transitions
const eventHandlers: Record<EventType, EventHandler> = {
  // === CONVERSATION ===
  'conversation:create': {
    validate: (event, state) => {
      if (state.exists(event.entityId)) {
        return { valid: false, error: 'Conversation already exists' };
      }
      return { valid: true };
    },
    apply: (event, state) => {
      state.create('conversation', event.entityId, {
        ...event.payload,
        createdBy: event.author,
        createdAt: event.timestamp,
        version: 1,
      });
    },
  },
  
  'conversation:update': {
    validate: (event, state) => {
      const entity = state.get(event.entityId);
      if (!entity) return { valid: false, error: 'Conversation not found' };
      if (entity.vectorClock[event.author] >= event.version) {
        return { valid: false, error: 'Stale update' };
      }
      return { valid: true };
    },
    apply: (event, state) => {
      state.merge(event.entityId, event.payload, event.vectorClock);
    },
  },
  
  // === MESSAGE ===
  'message:create': {
    validate: (event, state) => {
      const conv = state.get(event.payload.conversationId);
      if (!conv) return { valid: false, error: 'Conversation not found' };
      return { valid: true };
    },
    apply: (event, state) => {
      state.create('message', event.entityId, {
        ...event.payload,
        conversationId: event.payload.conversationId,
        author: event.author,
        createdAt: event.timestamp,
      });
    },
  },
  
  // === ACU (Atomic Chat Unit) ===
  'acu:create': {
    validate: (event, state) => {
      // ACUs are immutable - can only be created once
      if (state.exists(event.entityId)) {
        return { valid: false, error: 'ACU already exists' };
      }
      // Verify content hash
      const computedHash = hashContent(event.payload.content);
      if (computedHash !== event.payload.contentHash) {
        return { valid: false, error: 'Content hash mismatch' };
      }
      return { valid: true };
    },
    apply: (event, state) => {
      state.create('acu', event.entityId, {
        ...event.payload,
        author: event.author,
        createdAt: event.timestamp,
        signature: event.signature,
      });
      // Index for discovery
      state.index('acus', event.entityId, {
        author: event.author,
        type: event.payload.type,
        tags: event.tags || [],
      });
    },
  },
  
  'acu:derive': {
    validate: (event, state) => {
      const parentAcu = state.get(event.payload.parentAcuId);
      if (!parentAcu) return { valid: false, error: 'Parent ACU not found' };
      // Verify derivation signature
      return { valid: true };
    },
    apply: (event, state) => {
      state.create('acu', event.entityId, {
        ...event.payload,
        parentId: event.payload.parentAcuId,
        author: event.author,
        createdAt: event.timestamp,
      });
      // Track lineage
      state.addLink(event.payload.parentAcuId, event.entityId, 'derived');
    },
  },
  
  // === MEMORY ===
  'memory:create': {
    validate: (event, state) => {
      return { valid: true };
    },
    apply: (event, state) => {
      state.create('memory', event.entityId, {
        ...event.payload,
        author: event.author,
        createdAt: event.timestamp,
        lineageDepth: 0,
      });
    },
  },
  
  'memory:link': {
    apply: (event, state) => {
      state.addLink(
        event.payload.sourceMemoryId,
        event.payload.targetMemoryId,
        event.payload.relationType,
        { strength: event.payload.strength }
      );
    },
  },
  
  // === SOCIAL ===
  'social:follow': {
    apply: (event, state) => {
      state.addRelation('follows', event.author, event.payload.targetDid, {
        since: event.timestamp,
      });
    },
  },
  
  'social:friend_request': {
    apply: (event, state) => {
      state.create('friendRequest', event.entityId, {
        requester: event.author,
        addressee: event.payload.addressee,
        status: 'pending',
        createdAt: event.timestamp,
      });
    },
  },
  
  'social:friend_accept': {
    apply: (event, state) => {
      // Create bidirectional friend relation
      const request = state.get(event.payload.requestId);
      state.addRelation('friends', request.requester, request.addressee);
      state.addRelation('friends', request.addressee, request.requester);
      state.update(event.payload.requestId, { status: 'accepted' });
    },
  },
};
```

### 4.3 DHT-Based Content Registry

```typescript
// Content is registered in the DHT for discovery
interface ContentRegistryAPI {
  /**
   * Register content in DHT
   */
  register(content: {
    cid: string;
    type: ContentType;
    author: string;
    encryption?: 'none' | 'sealed' | 'encrypted';
    accessControl?: {
      type: 'public' | 'circle' | 'friends' | 'private';
      circleIds?: string[];
    };
  }): Promise<void>;
  
  /**
   * Find content by CID
   */
  resolve(cid: string): Promise<{
    providers: ProviderInfo[];
    metadata: ContentMetadata;
  }>;
  
  /**
   * Query content by author
   */
  queryByAuthor(did: string, options?: {
    types?: ContentType[];
    limit?: number;
  }): Promise<ContentRef[]>;
  
  /**
   * Query content by tags
   */
  queryByTags(tags: string[], options?: {
    match?: 'any' | 'all';
    limit?: number;
  }): Promise<ContentRef[]>;
}

// DHT key structure
const DHT_KEYS = {
  // Content by CID
  content: (cid: string) => `/vivim/content/${cid}`,
  
  // Author's content index
  authorContent: (did: string) => `/vivim/authors/${did}/content`,
  
  // Tag index
  tagIndex: (tag: string) => `/vivim/tags/${tag}`,
  
  // Entity state
  entityState: (entityId: string) => `/vivim/entities/${entityId}`,
  
  // User's follow graph
  following: (did: string) => `/vivim/social/${did}/following`,
  followers: (did: string) => `/vivim/social/${did}/followers`,
};
```

### 4.4 Gossip-Based Sync Protocol

```typescript
// Protocol for propagating events via GossipSub
const SYNC_PROTOCOL = {
  // Topic names
  topics: {
    // Global event stream
    globalEvents: '/vivim/events/v1',
    
    // Per-entity updates
    entityUpdates: (entityId: string) => `/vivim/entity/${entityId}/v1`,
    
    // Per-user events
    userEvents: (did: string) => `/vivim/user/${did}/v1`,
    
    // Circle updates
    circleEvents: (circleId: string) => `/vivim/circle/${circleId}/v1`,
  },
  
  // Message types
  messages: {
    // New event announcement
    EVENT_ANNOUNCE: 'event:announce',
    
    // Request missing events
    SYNC_REQUEST: 'sync:request',
    
    // Response with events
    SYNC_RESPONSE: 'sync:response',
    
    // Vector clock exchange
    VECTOR_CLOCK: 'sync:vclock',
  },
};

// Sync flow
interface SyncProtocol {
  /**
   * Announce new event to network
   */
  announceEvent(event: ChainEvent): Promise<void>;
  
  /**
   * Request sync from peers
   */
  requestSync(peerId: string, vectorClock: VectorClock): Promise<void>;
  
  /**
   * Handle sync request
   */
  handleSyncRequest(peerId: string, request: SyncRequest): Promise<void>;
  
  /**
   * Process incoming event
   */
  processEvent(event: ChainEvent, fromPeer: string): Promise<ProcessResult>;
}
```

---

## 5. Integration with Existing Network Engine

### 5.1 Service Mapping

| Existing Service | Chain API Role | Enhancement Needed |
|-----------------|----------------|-------------------|
| `NetworkNode` | P2P transport | Add event protocol handlers |
| `DHTService` | Content registry | Add CID-based keys |
| `PubSubService` | Event propagation | Add sync topics |
| `CRDTSyncService` | State management | Add event replay |
| `KeyManager` | Identity signing | Add DID support |
| `ContentRegistry` | Local index | Add CID indexing |

### 5.2 New Services Required

```typescript
// New services to implement
interface NewServices {
  // Event storage and retrieval
  EventStore: {
    store(event: ChainEvent): Promise<string>;
    get(cid: string): Promise<ChainEvent | null>;
    query(filter: EventFilter): Promise<ChainEvent[]>;
  };
  
  // Block building and validation
  BlockBuilder: {
    buildBlock(events: ChainEvent[]): Promise<Block>;
    validateBlock(block: Block): Promise<boolean>;
    getBlock(cid: string): Promise<Block | null>;
  };
  
  // State machine
  StateMachine: {
    applyEvent(event: ChainEvent): Promise<void>;
    getState(entityId: string): Promise<EntityState | null>;
    rebuildState(fromEvents: ChainEvent[]): Promise<EntityState>;
  };
  
  // DID integration
  IdentityService: {
    createDID(): Promise<DID>;
    resolveDID(did: string): Promise<DIDDocument>;
    verifyCredential(vc: VerifiableCredential): Promise<boolean>;
  };
  
  // IPFS integration
  ContentService: {
    store(data: any): Promise<string>;  // returns CID
    retrieve(cid: string): Promise<any>;
    pin(cid: string): Promise<void>;
  };
}
```

---

## 6. API Endpoint Mapping

### 6.1 Centralized → P2P Transformation

| Current Endpoint | P2P Equivalent | Notes |
|-----------------|----------------|-------|
| `POST /api/conversations` | `createEntity('conversation', data)` | Event-based creation |
| `GET /api/conversations/:id` | `getEntity(id)` | Local-first, sync if needed |
| `PUT /api/conversations/:id` | `updateEntity(id, updates)` | CRDT merge |
| `DELETE /api/conversations/:id` | `deleteEntity(id)` | Soft delete via event |
| `POST /api/sync/pull` | `sync()` | Pull from DHT + GossipSub |
| `POST /api/sync/push` | `submitEvent()` | Broadcast via GossipSub |
| `GET /api/social/followers` | `getFollowers(did)` | DHT query |
| `POST /api/social/follow` | `follow(did)` | Signed event |
| `GET /api/acus/:id` | `getEntity(id)` + DHT resolve | Content-addressed |
| `POST /api/capture` | Distributed worker protocol | See Section 7 |

---

## 7. Distributed Capture Engine

### 7.1 Capture as P2P Service

```typescript
// Capture requests become events
interface CaptureRequest {
  id: string;
  requester: string;
  url: string;
  options: CaptureOptions;
  reward?: {
    type: 'credit' | 'token';
    amount: number;
  };
}

// Capture providers announce via DHT
interface CaptureProvider {
  peerId: string;
  capabilities: {
    browsers: ('chromium' | 'firefox' | 'webkit')[];
    maxConcurrent: number;
    avgLatency: number;
  };
  pricing?: {
    perCapture: number;
    currency: string;
  };
}

// Protocol
interface CaptureProtocol {
  // Find capture providers
  findProviders(): Promise<CaptureProvider[]>;
  
  // Request capture
  requestCapture(url: string, options: CaptureOptions): Promise<string>; // returns requestId
  
  // Provider accepts request
  acceptCapture(requestId: string): Promise<void>;
  
  // Provider submits result
  submitResult(requestId: string, result: CaptureResult): Promise<void>;
  
  // Requester retrieves result
  getResult(requestId: string): Promise<CaptureResult>;
}
```

---

## 8. Security Model

### 8.1 Event Verification Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Event     │────▶│   Verify    │────▶│   Validate  │────▶│   Apply     │
│   Receipt   │     │   Signature │     │   Schema    │     │   to State  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  Parse event       Check DID           Check event         Apply handler
  from peer         signature           type handler         update state
                    matches author      schema valid         broadcast
```

### 8.2 Authorization Levels

```typescript
// Authorization checks per event type
const authorizationRules: Record<EventType, AuthRule> = {
  'conversation:create': {
    required: ['author'],
    check: (event, context) => {
      return event.author === context.identity.did;
    },
  },
  
  'conversation:update': {
    required: ['author', 'entityOwner'],
    check: (event, context) => {
      const entity = context.state.get(event.entityId);
      return entity && entity.createdBy === event.author;
    },
  },
  
  'acu:share': {
    required: ['author', 'circleMember'],
    check: (event, context) => {
      const circle = context.state.get(event.payload.circleId);
      return circle.members.includes(event.author);
    },
  },
  
  'circle:add_member': {
    required: ['author', 'circleOwner'],
    check: (event, context) => {
      const circle = context.state.get(event.payload.circleId);
      return circle.owner === event.author;
    },
  },
};
```

---

## 9. Implementation Roadmap

### Phase 1: Event Layer (Weeks 1-2)
- [ ] Define `ChainEvent` schema with CID calculation
- [ ] Implement `EventStore` with IndexedDB backend
- [ ] Add Ed25519 signing/verification to `KeyManager`
- [ ] Create `createEvent`, `signEvent`, `submitEvent` methods

### Phase 2: State Machine (Weeks 3-4)
- [ ] Implement `StateMachine` with CRDT merge
- [ ] Port existing Prisma models to entity schemas
- [ ] Build event handlers for core types (conversation, message, acu)
- [ ] Add vector clock tracking

### Phase 3: DHT Integration (Weeks 5-6)
- [ ] Extend `DHTService` with content keys
- [ ] Implement `register()`, `resolve()`, `queryByAuthor()`
- [ ] Add CID-based content addressing
- [ ] Integrate IPFS/Helia for large payloads

### Phase 4: Gossip Sync (Weeks 7-8)
- [ ] Define sync topics in `PubSubService`
- [ ] Implement `announceEvent()`, `requestSync()`
- [ ] Build conflict resolution for concurrent events
- [ ] Add block building for batching

### Phase 5: Identity (Weeks 9-10)
- [ ] Integrate DID creation (did:key, did:web)
- [ ] Add Verifiable Credential support for delegations
- [ ] Implement DID resolution
- [ ] Migrate from OAuth to DID auth

### Phase 6: PWA Integration (Weeks 11-12)
- [ ] Replace `SyncEngine` with `VivimChainClient`
- [ ] Update all API calls to use chain methods
- [ ] Add offline queue for events
- [ ] Implement background sync

---

## 10. Example Usage

```typescript
// Initialize the chain client
const chain = new VivimChainClient();
await chain.initializeIdentity();

// Create a conversation
const { entityId, eventCid } = await chain.createEntity('conversation', {
  title: 'My AI Chat',
  provider: 'openai',
  model: 'gpt-4',
});

// Add a message
await chain.createEntity('message', {
  conversationId: entityId,
  role: 'user',
  content: 'Hello, AI!',
});

// Follow another user
await chain.follow('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK');

// Share a conversation with a circle
await chain.shareWithCircle(entityId, 'circle-123');

// Subscribe to updates
const unsubscribe = chain.subscribe({
  entityIds: [entityId],
}, (event) => {
  console.log('New event:', event);
});

// Sync with network
const result = await chain.sync();
console.log(`Synced ${result.newEvents} new events`);
```

---

## 11. Comparison with Other Systems

| Feature | VIVIM Chain | Ceramic | Nostr | IPFS | Blockchain |
|---------|-------------|---------|-------|------|------------|
| Data Model | Event + CRDT | Stream | Event | Block | Transaction |
| Identity | DID | DID | PubKey | None | Address |
| Consensus | Gossip + CRDT | Gossip | None | None | PoS/PoW |
| Storage | DWN + IPFS | Ceramic Node | Relays | Nodes | Full Nodes |
| Query | GraphQL + DHT | ComposeDB | Filter | None | Indexers |
| Speed | Real-time | Seconds | Real-time | Minutes | Variable |
| Finality | Instant (CRDT) | Minutes | Instant | N/A | Blocks |

---

*This design transforms VIVIM into a fully decentralized, blockchain-like system while maintaining the rich functionality of the existing codebase.*
