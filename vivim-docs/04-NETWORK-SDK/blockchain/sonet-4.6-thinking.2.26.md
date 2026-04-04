

# VIVIM Blockchain Architecture — Complete Design

## Table of Contents
1. [Core Type System](#1-core-type-system)
2. [VivimChainClient](#2-vivimchainclient)
3. [Event Handler Registry](#3-event-handler-registry)
4. [DHT Schema](#4-dht-schema)
5. [GossipSub Sync Protocol](#5-gossipsub-sync-protocol)
6. [Security Model](#6-security-model)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. Core Type System

### 1.1 Primitive Types

```typescript
// chain/src/types/primitives.ts

/** Content Identifier — SHA-256 hash of canonical event bytes */
export type CID = string; // "bafy..." multihash-encoded

/** Decentralized Identifier — derived from Ed25519 public key */
export type DID = `did:key:z${string}`;

/** Ed25519 signature, base64url-encoded */
export type Signature = string;

/** Hybrid Logical Clock timestamp: "physicalMs:logicalCounter:nodeId" */
export type HLCTimestamp = string;

/** Monotonic lamport-style vector clock */
export type VectorClock = Record<DID, number>;

/** Ed25519 public key, base64url-encoded */
export type PublicKey = string;

/** Entity identifier — type-prefixed nanoid */
export type EntityId = string; // "conv_abc123", "acu_def456"
```

### 1.2 Event Types Enum

```typescript
// chain/src/types/events.ts

export enum EventType {
  // Identity
  IDENTITY_CREATE       = 'identity:create',
  IDENTITY_UPDATE       = 'identity:update',

  // Conversations
  CONVERSATION_CREATE   = 'conversation:create',
  CONVERSATION_UPDATE   = 'conversation:update',
  CONVERSATION_DELETE   = 'conversation:delete',

  // Messages
  MESSAGE_CREATE        = 'message:create',

  // Atomic Chat Units
  ACU_CREATE            = 'acu:create',
  ACU_DERIVE            = 'acu:derive',
  ACU_SHARE             = 'acu:share',
  ACU_RATE              = 'acu:rate',

  // Memory Graph
  MEMORY_CREATE         = 'memory:create',
  MEMORY_LINK           = 'memory:link',
  MEMORY_UNLINK         = 'memory:unlink',

  // Social
  SOCIAL_FOLLOW         = 'social:follow',
  SOCIAL_UNFOLLOW       = 'social:unfollow',
  SOCIAL_FRIEND_REQUEST = 'social:friend_request',
  SOCIAL_FRIEND_ACCEPT  = 'social:friend_accept',

  // Circles (groups)
  CIRCLE_CREATE         = 'circle:create',
  CIRCLE_ADD_MEMBER     = 'circle:add_member',
  CIRCLE_REMOVE_MEMBER  = 'circle:remove_member',
  CIRCLE_UPDATE         = 'circle:update',

  // Sync protocol
  SYNC_REQUEST          = 'sync:request',
  SYNC_RESPONSE         = 'sync:response',
  SYNC_VECTOR_EXCHANGE  = 'sync:vector_exchange',
}
```

### 1.3 ChainEvent

```typescript
// chain/src/types/chain-event.ts

import { CID, DID, Signature, HLCTimestamp, VectorClock } from './primitives';
import { EventType } from './events';

/**
 * ChainEvent is the atomic unit of the VIVIM chain.
 * 
 * Design principles:
 * - Content-addressed: `id` is the CID of the canonical serialization
 * - Self-authenticating: `signature` proves authorship
 * - Causally ordered: `vectorClock` + `hlcTimestamp` give total order
 * - Append-only: Events are immutable once signed
 * - Linked: `parentIds` form a DAG, not a linear chain
 */
export interface ChainEvent<T extends EventType = EventType> {
  /** CID computed from hash(canonicalize(event without id/signature)) */
  readonly id: CID;

  /** Schema version for forward compatibility */
  readonly version: 1;

  /** Discriminated event type */
  readonly type: T;

  /** DID of the event author */
  readonly author: DID;

  /** Hybrid Logical Clock timestamp */
  readonly hlcTimestamp: HLCTimestamp;

  /** Vector clock at time of creation */
  readonly vectorClock: VectorClock;

  /** CIDs of causal parent events (DAG links) */
  readonly parentIds: CID[];

  /** Target entity this event mutates (null for entity-creating events) */
  readonly entityId: EntityId | null;

  /** Type-specific payload */
  readonly payload: EventPayloadMap[T];

  /** Ed25519 signature over canonical bytes */
  readonly signature: Signature;

  /** Optional encryption envelope for private content */
  readonly encryption?: EncryptionEnvelope;
}

/** For events that carry encrypted payloads */
export interface EncryptionEnvelope {
  /** Algorithm used */
  algorithm: 'x25519-xsalsa20-poly1305';
  /** Encrypted payload (replaces cleartext payload) */
  ciphertext: string;
  /** Nonce */
  nonce: string;
  /** Per-recipient encrypted symmetric keys */
  recipients: Array<{
    did: DID;
    encryptedKey: string;
  }>;
}
```

### 1.4 Event Payload Map

```typescript
// chain/src/types/payloads.ts

import { CID, DID, EntityId, PublicKey } from './primitives';
import { EventType } from './events';

/**
 * Strongly-typed payload map. Each event type gets its own interface.
 * This is the heart of the schema — every field is intentional.
 */
export interface EventPayloadMap {
  // ─── Identity ──────────────────────────────────────────────
  [EventType.IDENTITY_CREATE]: {
    displayName: string;
    publicKey: PublicKey;
    avatar?: string;
    bio?: string;
    preferences?: Record<string, unknown>;
  };

  [EventType.IDENTITY_UPDATE]: {
    /** Only fields being changed */
    displayName?: string;
    avatar?: string;
    bio?: string;
    preferences?: Record<string, unknown>;
  };

  // ─── Conversations ────────────────────────────────────────
  [EventType.CONVERSATION_CREATE]: {
    title: string;
    provider: 'chatgpt' | 'claude' | 'gemini' | 'local' | string;
    model?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  };

  [EventType.CONVERSATION_UPDATE]: {
    title?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  };

  [EventType.CONVERSATION_DELETE]: {
    /** Tombstone — marks entity as deleted */
    reason?: string;
  };

  // ─── Messages ─────────────────────────────────────────────
  [EventType.MESSAGE_CREATE]: {
    conversationId: EntityId;
    role: 'user' | 'assistant' | 'system';
    content: string;
    /** Position in conversation */
    ordinal: number;
    /** Provider-specific message ID for dedup */
    providerMessageId?: string;
    model?: string;
    tokenCount?: number;
  };

  // ─── ACUs ─────────────────────────────────────────────────
  [EventType.ACU_CREATE]: {
    /** Source conversation */
    sourceConversationId: EntityId;
    /** Source message range */
    sourceMessageIds: EntityId[];
    /** The extracted knowledge */
    content: string;
    /** Structured knowledge type */
    knowledgeType: ACUKnowledgeType;
    /** AI-generated title */
    title: string;
    /** Tags for discovery */
    tags: string[];
    /** Confidence score 0-1 */
    confidence: number;
    /** Extraction method */
    extractionMethod: 'manual' | 'ai_auto' | 'ai_assisted';
    /** Visibility */
    visibility: 'private' | 'circles' | 'public';
  };

  [EventType.ACU_DERIVE]: {
    /** Parent ACU(s) this was derived from */
    parentAcuIds: EntityId[];
    /** Derivation type */
    derivationType: 'synthesis' | 'refinement' | 'contradiction' | 'extension';
    content: string;
    knowledgeType: ACUKnowledgeType;
    title: string;
    tags: string[];
    confidence: number;
    visibility: 'private' | 'circles' | 'public';
  };

  [EventType.ACU_SHARE]: {
    acuId: EntityId;
    /** Share targets */
    targetDids?: DID[];
    targetCircleIds?: EntityId[];
    /** Share as public discovery */
    public: boolean;
  };

  [EventType.ACU_RATE]: {
    acuId: EntityId;
    rating: 1 | 2 | 3 | 4 | 5;
    review?: string;
  };

  // ─── Memory Graph ─────────────────────────────────────────
  [EventType.MEMORY_CREATE]: {
    /** Memory node type */
    nodeType: 'concept' | 'skill' | 'fact' | 'preference' | 'context';
    label: string;
    description?: string;
    /** Connected ACU IDs */
    acuIds: EntityId[];
    /** Embedding vector for similarity search */
    embedding?: number[];
  };

  [EventType.MEMORY_LINK]: {
    sourceId: EntityId;
    targetId: EntityId;
    relationshipType: 'related_to' | 'depends_on' | 'contradicts'
      | 'extends' | 'exemplifies' | 'categorizes';
    weight: number; // 0-1
    bidirectional: boolean;
  };

  [EventType.MEMORY_UNLINK]: {
    sourceId: EntityId;
    targetId: EntityId;
    relationshipType: string;
  };

  // ─── Social ───────────────────────────────────────────────
  [EventType.SOCIAL_FOLLOW]: {
    targetDid: DID;
  };

  [EventType.SOCIAL_UNFOLLOW]: {
    targetDid: DID;
  };

  [EventType.SOCIAL_FRIEND_REQUEST]: {
    targetDid: DID;
    message?: string;
  };

  [EventType.SOCIAL_FRIEND_ACCEPT]: {
    requestEventId: CID;
    requesterDid: DID;
  };

  // ─── Circles ──────────────────────────────────────────────
  [EventType.CIRCLE_CREATE]: {
    name: string;
    description?: string;
    visibility: 'private' | 'invite_only' | 'public';
    initialMembers?: DID[];
  };

  [EventType.CIRCLE_ADD_MEMBER]: {
    circleId: EntityId;
    memberDid: DID;
    role: 'member' | 'moderator' | 'admin';
  };

  [EventType.CIRCLE_REMOVE_MEMBER]: {
    circleId: EntityId;
    memberDid: DID;
    reason?: string;
  };

  [EventType.CIRCLE_UPDATE]: {
    circleId: EntityId;
    name?: string;
    description?: string;
    visibility?: 'private' | 'invite_only' | 'public';
  };

  // ─── Sync Protocol ────────────────────────────────────────
  [EventType.SYNC_REQUEST]: {
    /** Requester's vector clock */
    vectorClock: Record<DID, number>;
    /** Entity IDs they want updates for */
    entityFilter?: EntityId[];
    /** Time range */
    since?: string;
  };

  [EventType.SYNC_RESPONSE]: {
    /** Events the responder has that requester doesn't */
    events: CID[];
    /** Responder's vector clock */
    vectorClock: Record<DID, number>;
  };

  [EventType.SYNC_VECTOR_EXCHANGE]: {
    vectorClock: Record<DID, number>;
    headEvents: CID[];
  };
}

export type ACUKnowledgeType =
  | 'concept'
  | 'procedure'
  | 'decision'
  | 'insight'
  | 'code_pattern'
  | 'architecture'
  | 'debugging'
  | 'best_practice'
  | 'mental_model'
  | 'reference';
```

### 1.5 Entity State

```typescript
// chain/src/types/entity-state.ts

import { CID, DID, EntityId, HLCTimestamp, VectorClock } from './primitives';
import { EventType } from './events';

/**
 * EntityState is the materialized view of an entity,
 * computed by replaying all ChainEvents targeting it.
 * 
 * This is analogous to a Ceramic StreamState — the entity
 * is defined by its event log, and the state is a projection.
 */
export interface EntityState<T = unknown> {
  /** Unique entity identifier */
  id: EntityId;

  /** Entity type derived from creating event */
  type: EntityType;

  /** Current materialized state */
  data: T;

  /** DID of original creator */
  owner: DID;

  /** All DIDs with write access */
  controllers: DID[];

  /** CID of the creation event */
  genesisEventId: CID;

  /** CID of the most recent event */
  headEventId: CID;

  /** All event CIDs in causal order */
  eventLog: CID[];

  /** Current vector clock for this entity */
  vectorClock: VectorClock;

  /** Last update HLC timestamp */
  lastUpdated: HLCTimestamp;

  /** Whether entity has been tombstoned */
  deleted: boolean;

  /** Number of events applied */
  eventCount: number;

  /** Entity-level metadata */
  metadata: EntityMetadata;
}

export enum EntityType {
  IDENTITY      = 'identity',
  CONVERSATION  = 'conversation',
  MESSAGE       = 'message',
  ACU           = 'acu',
  MEMORY_NODE   = 'memory_node',
  MEMORY_LINK   = 'memory_link',
  CIRCLE        = 'circle',
  SOCIAL_GRAPH  = 'social_graph',
}

export interface EntityMetadata {
  /** Visibility level */
  visibility: 'private' | 'circles' | 'public';
  /** Circle IDs that can access this entity */
  circleIds?: EntityId[];
  /** Schema version of the data */
  schemaVersion: number;
  /** Content hash for integrity verification */
  contentHash: CID;
}

/**
 * Typed entity state shortcuts
 */
export type ConversationState = EntityState<{
  title: string;
  provider: string;
  model?: string;
  tags: string[];
  messageCount: number;
  metadata: Record<string, unknown>;
}>;

export type ACUState = EntityState<{
  title: string;
  content: string;
  knowledgeType: string;
  tags: string[];
  confidence: number;
  visibility: string;
  sourceConversationId: EntityId;
  sourceMessageIds: EntityId[];
  parentAcuIds: EntityId[];
  derivationType?: string;
  lineage: LineageInfo;
  ratings: { average: number; count: number };
  shareCount: number;
}>;

export interface LineageInfo {
  /** Root ACU in the derivation chain */
  rootAcuId: EntityId;
  /** Depth in derivation tree */
  depth: number;
  /** All ancestor ACU IDs */
  ancestors: EntityId[];
  /** All descendant ACU IDs */
  descendants: EntityId[];
}

export type MemoryNodeState = EntityState<{
  nodeType: string;
  label: string;
  description?: string;
  acuIds: EntityId[];
  embedding?: number[];
  linkCount: number;
}>;
```

### 1.6 Block Structure

```typescript
// chain/src/types/block.ts

import { CID, DID, HLCTimestamp, Signature } from './primitives';

/**
 * Block is a batch of events, loosely ordered.
 * 
 * VIVIM uses a DAG-of-blocks structure rather than a linear chain.
 * Each node produces blocks locally; blocks reference parent blocks
 * from any node. This gives us:
 * - No consensus bottleneck (each node is authoritative for its own data)
 * - DAG structure for eventual consistency
 * - Batching for efficient sync
 */
export interface Block {
  /** CID of this block */
  id: CID;

  /** Block format version */
  version: 1;

  /** Node that created this block */
  author: DID;

  /** HLC timestamp of block creation */
  hlcTimestamp: HLCTimestamp;

  /** Parent block CIDs (DAG links) */
  parentBlockIds: CID[];

  /** Events contained in this block, in causal order */
  eventIds: CID[];

  /** Number of events */
  eventCount: number;

  /** Merkle root of event CIDs */
  merkleRoot: CID;

  /** Block-level signature */
  signature: Signature;

  /** Block height (max parent height + 1) */
  height: number;
}

/**
 * Local block production config
 */
export interface BlockProductionConfig {
  /** Max events per block */
  maxEventsPerBlock: number; // default: 100
  /** Max time between blocks (ms) */
  maxBlockInterval: number; // default: 30000 (30s)
  /** Min events to trigger block */
  minEventsForBlock: number; // default: 1
}
```

---

## 2. VivimChainClient

```typescript
// chain/src/client/VivimChainClient.ts

import { CID, DID, EntityId, HLCTimestamp, VectorClock, Signature } from '../types/primitives';
import { ChainEvent, EncryptionEnvelope } from '../types/chain-event';
import { EventType } from '../types/events';
import { EventPayloadMap } from '../types/payloads';
import { EntityState, EntityType } from '../types/entity-state';
import { Block, BlockProductionConfig } from '../types/block';

// ─── Dependencies (from existing network/ package) ──────────
import type { NetworkNode } from '@vivim/network';
import type { CRDTSyncService } from '@vivim/network';
import type { DHTService } from '@vivim/network';
import type { PubSubService } from '@vivim/network';
import type { KeyManager } from '@vivim/network';

// ─── Sub-modules ────────────────────────────────────────────
import { EventFactory } from './EventFactory';
import { EventValidator } from './EventValidator';
import { EventHandlerRegistry } from '../handlers/EventHandlerRegistry';
import { EntityStore } from '../storage/EntityStore';
import { EventStore } from '../storage/EventStore';
import { BlockProducer } from './BlockProducer';
import { SyncManager } from '../sync/SyncManager';
import { HLClock } from '../clock/HLClock';
import { QueryEngine } from '../query/QueryEngine';

/**
 * VivimChainClient is the single entry point for all chain operations.
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────┐
 * │                VivimChainClient                  │
 * │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
 * │  │EventFactory│ │Validator │ │  HandlerRegistry │ │
 * │  └──────────┘ └──────────┘ └──────────────────┘ │
 * │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
 * │  │EventStore│ │EntityStore│ │   BlockProducer  │ │
 * │  └──────────┘ └──────────┘ └──────────────────┘ │
 * │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
 * │  │SyncManager│ │  HLCock  │ │   QueryEngine    │ │
 * │  └──────────┘ └──────────┘ └──────────────────┘ │
 * │                     │                            │
 * │  ┌──────────────────┴───────────────────────┐   │
 * │  │         NetworkNode (existing)            │   │
 * │  │  GossipSub · DHT · WebRTC · KeyManager   │   │
 * │  └──────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────┘
 */
export class VivimChainClient {
  // ─── Core modules ─────────────────────────────────────
  private readonly eventFactory: EventFactory;
  private readonly validator: EventValidator;
  private readonly handlers: EventHandlerRegistry;
  private readonly eventStore: EventStore;
  private readonly entityStore: EntityStore;
  private readonly blockProducer: BlockProducer;
  private readonly syncManager: SyncManager;
  private readonly hlc: HLClock;
  private readonly query: QueryEngine;

  // ─── Network (injected from existing package) ─────────
  private readonly network: NetworkNode;
  private readonly keyManager: KeyManager;
  private readonly dht: DHTService;
  private readonly pubsub: PubSubService;

  // ─── State ────────────────────────────────────────────
  private _did: DID | null = null;
  private _initialized = false;
  private readonly _subscriptions = new Map<string, Set<SubscriptionCallback>>();
  private readonly _eventBus = new EventTarget();

  constructor(config: VivimChainConfig) {
    // Wire up existing network components
    this.network = config.networkNode;
    this.keyManager = config.keyManager;
    this.dht = config.dhtService;
    this.pubsub = config.pubsubService;

    // Initialize chain modules
    this.hlc = new HLClock(config.nodeId);
    this.eventStore = new EventStore(config.storage ?? 'indexeddb');
    this.entityStore = new EntityStore(config.storage ?? 'indexeddb');
    this.handlers = new EventHandlerRegistry();
    this.validator = new EventValidator(this.entityStore, this.eventStore);
    this.eventFactory = new EventFactory(this.keyManager, this.hlc);
    this.blockProducer = new BlockProducer(
      this.eventStore,
      this.keyManager,
      config.blockProduction,
    );
    this.syncManager = new SyncManager(
      this.pubsub,
      this.dht,
      this.eventStore,
      this.entityStore,
      this.hlc,
    );
    this.query = new QueryEngine(this.entityStore, this.eventStore);
  }

  // ═══════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════

  /**
   * Initialize or recover identity.
   * 
   * Flow:
   * 1. Check IndexedDB for existing keypair
   * 2. If none, generate Ed25519 keypair via KeyManager
   * 3. Derive DID from public key: did:key:z<multibase(multicodec(pubkey))>
   * 4. Publish identity:create event if new
   * 5. Register DID in DHT
   */
  async initializeIdentity(
    options?: InitializeIdentityOptions
  ): Promise<{ did: DID; isNew: boolean }> {
    // Try to load existing identity
    const existingKey = await this.keyManager.loadKey('vivim-identity');

    if (existingKey) {
      this._did = this.keyManager.deriveDID(existingKey.publicKey);
      this._initialized = true;

      // Re-register in DHT for discoverability
      await this.dht.provide(
        `/vivim/identity/${this._did}`,
        { did: this._did, publicKey: existingKey.publicKey }
      );

      return { did: this._did, isNew: false };
    }

    // Generate new identity
    const keypair = await this.keyManager.generateKey('vivim-identity');
    this._did = this.keyManager.deriveDID(keypair.publicKey);

    // Create identity event
    const event = await this.createEvent(EventType.IDENTITY_CREATE, {
      displayName: options?.displayName ?? `User-${this._did.slice(-8)}`,
      publicKey: keypair.publicKey,
      avatar: options?.avatar,
      bio: options?.bio,
    });

    // Register in DHT
    await this.dht.provide(`/vivim/identity/${this._did}`, {
      did: this._did,
      publicKey: keypair.publicKey,
      genesisEvent: event.id,
    });

    this._initialized = true;
    return { did: this._did, isNew: true };
  }

  get did(): DID {
    if (!this._did) throw new Error('Identity not initialized. Call initializeIdentity() first.');
    return this._did;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  // ═══════════════════════════════════════════════════════
  // EVENT CREATION
  // ═══════════════════════════════════════════════════════

  /**
   * Create a new signed event and process it.
   * 
   * Flow:
   * 1. Validate payload against schema
   * 2. Build event envelope (HLC, vector clock, parents)
   * 3. Compute CID
   * 4. Sign with Ed25519
   * 5. Validate authorization
   * 6. Apply to local state via handler
   * 7. Store event
   * 8. Broadcast via GossipSub
   * 9. Register in DHT
   */
  async createEvent<T extends EventType>(
    type: T,
    payload: EventPayloadMap[T],
    options?: CreateEventOptions
  ): Promise<ChainEvent<T>> {
    this.ensureInitialized();

    // 1. Get causal parents (heads of local DAG)
    const parentIds = await this.eventStore.getHeadEventIds();

    // 2. Tick HLC
    const hlcTimestamp = this.hlc.tick();

    // 3. Get current vector clock and increment our entry
    const vectorClock = await this.eventStore.getCurrentVectorClock();
    vectorClock[this.did] = (vectorClock[this.did] ?? 0) + 1;

    // 4. Build unsigned event
    const unsignedEvent = {
      version: 1 as const,
      type,
      author: this.did,
      hlcTimestamp,
      vectorClock,
      parentIds,
      entityId: options?.entityId ?? null,
      payload,
      encryption: options?.encryption,
    };

    // 5. Compute CID and sign
    const event = await this.eventFactory.finalizeEvent(unsignedEvent);

    // 6. Validate
    const validation = await this.validator.validate(event);
    if (!validation.valid) {
      throw new ChainValidationError(validation.errors);
    }

    // 7. Apply to state
    await this.applyEvent(event);

    // 8. Broadcast
    await this.broadcastEvent(event);

    return event;
  }

  // ═══════════════════════════════════════════════════════
  // ENTITY OPERATIONS (High-level API)
  // ═══════════════════════════════════════════════════════

  /**
   * Create a new entity. Returns entity ID and creation event.
   */
  async createEntity<T extends EventType>(
    type: T,
    data: EventPayloadMap[T],
    options?: CreateEntityOptions
  ): Promise<{ entityId: EntityId; event: ChainEvent<T> }> {
    const entityId = this.generateEntityId(type);
    const event = await this.createEvent(type, data, {
      ...options,
      entityId,
    });
    return { entityId, event };
  }

  /**
   * Update an entity by creating a mutation event.
   * Uses CRDT merge semantics — no locks needed.
   */
  async updateEntity<T extends EventType>(
    entityId: EntityId,
    updateType: T,
    updates: EventPayloadMap[T],
    options?: UpdateEntityOptions
  ): Promise<ChainEvent<T>> {
    // Verify entity exists and we have permission
    const entity = await this.entityStore.get(entityId);
    if (!entity) throw new EntityNotFoundError(entityId);
    if (entity.deleted) throw new EntityDeletedError(entityId);

    return this.createEvent(updateType, updates, {
      ...options,
      entityId,
    });
  }

  /**
   * Get the current state of an entity.
   */
  async getEntity<T = unknown>(entityId: EntityId): Promise<EntityState<T> | null> {
    return this.entityStore.get<T>(entityId);
  }

  /**
   * Get the full event log for an entity.
   */
  async getEntityHistory(entityId: EntityId): Promise<ChainEvent[]> {
    const entity = await this.entityStore.get(entityId);
    if (!entity) return [];
    return this.eventStore.getMany(entity.eventLog);
  }

  // ═══════════════════════════════════════════════════════
  // DOMAIN-SPECIFIC OPERATIONS
  // ═══════════════════════════════════════════════════════

  /** Create a conversation and return its state */
  async createConversation(data: {
    title: string;
    provider: string;
    model?: string;
    tags?: string[];
  }): Promise<{ entityId: EntityId; state: EntityState }> {
    const { entityId, event } = await this.createEntity(
      EventType.CONVERSATION_CREATE,
      { ...data, tags: data.tags ?? [], metadata: {} }
    );
    const state = await this.getEntity(entityId);
    return { entityId, state: state! };
  }

  /** Add a message to a conversation */
  async addMessage(data: {
    conversationId: EntityId;
    role: 'user' | 'assistant' | 'system';
    content: string;
    ordinal: number;
    model?: string;
  }): Promise<{ entityId: EntityId; event: ChainEvent }> {
    return this.createEntity(EventType.MESSAGE_CREATE, data);
  }

  /** Extract an ACU from conversation messages */
  async createACU(data: {
    sourceConversationId: EntityId;
    sourceMessageIds: EntityId[];
    content: string;
    knowledgeType: string;
    title: string;
    tags: string[];
    confidence: number;
    extractionMethod: 'manual' | 'ai_auto' | 'ai_assisted';
    visibility?: 'private' | 'circles' | 'public';
  }): Promise<{ entityId: EntityId; state: EntityState }> {
    const { entityId } = await this.createEntity(EventType.ACU_CREATE, {
      ...data,
      visibility: data.visibility ?? 'private',
      knowledgeType: data.knowledgeType as any,
    });
    const state = await this.getEntity(entityId);
    return { entityId, state: state! };
  }

  /** Derive a new ACU from existing ones */
  async deriveACU(data: {
    parentAcuIds: EntityId[];
    derivationType: 'synthesis' | 'refinement' | 'contradiction' | 'extension';
    content: string;
    knowledgeType: string;
    title: string;
    tags: string[];
    confidence: number;
    visibility?: 'private' | 'circles' | 'public';
  }): Promise<{ entityId: EntityId; state: EntityState }> {
    // Validate parent ACUs exist
    for (const parentId of data.parentAcuIds) {
      const parent = await this.getEntity(parentId);
      if (!parent) throw new EntityNotFoundError(parentId);
    }

    const { entityId } = await this.createEntity(EventType.ACU_DERIVE, {
      ...data,
      visibility: data.visibility ?? 'private',
      knowledgeType: data.knowledgeType as any,
    });
    const state = await this.getEntity(entityId);
    return { entityId, state: state! };
  }

  /** Create a memory node and link it to ACUs */
  async createMemoryNode(data: {
    nodeType: 'concept' | 'skill' | 'fact' | 'preference' | 'context';
    label: string;
    description?: string;
    acuIds: EntityId[];
    embedding?: number[];
  }): Promise<{ entityId: EntityId; state: EntityState }> {
    const { entityId } = await this.createEntity(EventType.MEMORY_CREATE, data);
    const state = await this.getEntity(entityId);
    return { entityId, state: state! };
  }

  /** Link two memory nodes */
  async linkMemoryNodes(data: {
    sourceId: EntityId;
    targetId: EntityId;
    relationshipType: string;
    weight?: number;
    bidirectional?: boolean;
  }): Promise<{ entityId: EntityId; event: ChainEvent }> {
    return this.createEntity(EventType.MEMORY_LINK, {
      sourceId: data.sourceId,
      targetId: data.targetId,
      relationshipType: data.relationshipType as any,
      weight: data.weight ?? 0.5,
      bidirectional: data.bidirectional ?? false,
    });
  }

  // ═══════════════════════════════════════════════════════
  // SYNC
  // ═══════════════════════════════════════════════════════

  /**
   * Start the sync engine.
   * 
   * This:
   * 1. Subscribes to GossipSub topics
   * 2. Starts periodic vector clock exchange
   * 3. Begins DHT content advertisement
   * 4. Processes incoming events
   */
  async startSync(): Promise<void> {
    this.ensureInitialized();

    // Subscribe to global event topic
    await this.pubsub.subscribe(
      TOPICS.GLOBAL_EVENTS,
      this.handleIncomingEvent.bind(this)
    );

    // Subscribe to sync protocol topic
    await this.pubsub.subscribe(
      TOPICS.SYNC_PROTOCOL,
      this.handleSyncMessage.bind(this)
    );

    // Start sync manager
    await this.syncManager.start({
      vectorClockExchangeInterval: 30_000,  // 30s
      dhtAdvertiseInterval: 300_000,         // 5min
      fullSyncInterval: 600_000,             // 10min
    });

    // Announce our presence
    await this.syncManager.announcePresence(this.did);
  }

  /**
   * Stop syncing.
   */
  async stopSync(): Promise<void> {
    await this.pubsub.unsubscribe(TOPICS.GLOBAL_EVENTS);
    await this.pubsub.unsubscribe(TOPICS.SYNC_PROTOCOL);
    await this.syncManager.stop();
  }

  /**
   * Trigger a manual sync with known peers.
   */
  async sync(): Promise<SyncResult> {
    this.ensureInitialized();
    return this.syncManager.syncNow();
  }

  /**
   * Sync a specific entity with the network.
   */
  async syncEntity(entityId: EntityId): Promise<EntityState | null> {
    this.ensureInitialized();

    // Check DHT for latest state
    const dhtResult = await this.dht.findProviders(
      `/vivim/entities/${entityId}`
    );

    if (dhtResult.length > 0) {
      // Request events from providers
      for (const provider of dhtResult) {
        await this.syncManager.requestEntityEvents(entityId, provider.peerId);
      }
    }

    return this.getEntity(entityId);
  }

  // ═══════════════════════════════════════════════════════
  // SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════

  /**
   * Subscribe to real-time updates.
   * 
   * Filters:
   * - By event type: { type: 'acu:create' }
   * - By entity: { entityId: 'acu_abc123' }
   * - By author: { author: 'did:key:z...' }
   * - Combined: { type: 'acu:create', author: 'did:key:z...' }
   */
  subscribe(
    filter: SubscriptionFilter,
    callback: SubscriptionCallback
  ): Unsubscribe {
    const key = this.filterToKey(filter);
    if (!this._subscriptions.has(key)) {
      this._subscriptions.set(key, new Set());
    }
    this._subscriptions.get(key)!.add(callback);

    // Also subscribe to entity-specific GossipSub topic if filtering by entity
    if (filter.entityId) {
      this.pubsub.subscribe(
        `/vivim/entity/${filter.entityId}/v1`,
        (msg) => this.handleIncomingEvent(msg)
      ).catch(console.error);
    }

    return () => {
      this._subscriptions.get(key)?.delete(callback);
      if (this._subscriptions.get(key)?.size === 0) {
        this._subscriptions.delete(key);
      }
    };
  }

  // ═══════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════

  /** Query entities with filters */
  async queryEntities(query: EntityQuery): Promise<EntityState[]> {
    return this.query.queryEntities(query);
  }

  /** Get ACU lineage tree */
  async getACULineage(acuId: EntityId): Promise<LineageTree> {
    return this.query.getACULineage(acuId);
  }

  /** Search ACUs by content similarity */
  async searchACUs(query: string, limit?: number): Promise<ACUSearchResult[]> {
    return this.query.searchACUs(query, limit);
  }

  /** Get the user's memory graph */
  async getMemoryGraph(options?: {
    depth?: number;
    rootNodeId?: EntityId;
  }): Promise<MemoryGraph> {
    return this.query.getMemoryGraph(this.did, options);
  }

  // ═══════════════════════════════════════════════════════
  // INTERNAL METHODS
  // ═══════════════════════════════════════════════════════

  /**
   * Apply an event to local state.
   * This is called for both locally-created and received events.
   */
  private async applyEvent(event: ChainEvent): Promise<void> {
    // 1. Store the event
    await this.eventStore.put(event);

    // 2. Get the handler for this event type
    const handler = this.handlers.getHandler(event.type);

    // 3. Get current entity state (if entity event)
    let currentState: EntityState | null = null;
    if (event.entityId) {
      currentState = await this.entityStore.get(event.entityId);
    }

    // 4. Apply the handler to produce new state
    const newState = await handler.apply(event, currentState);

    // 5. Store updated entity state
    if (newState) {
      await this.entityStore.put(newState);
    }

    // 6. Update vector clock
    await this.eventStore.mergeVectorClock(event.vectorClock);

    // 7. Update HLC
    this.hlc.receive(event.hlcTimestamp);

    // 8. Notify subscribers
    this.notifySubscribers(event, newState);

    // 9. Add to block producer queue
    this.blockProducer.enqueue(event.id);
  }

  /**
   * Handle an incoming event from GossipSub.
   */
  private async handleIncomingEvent(message: any): Promise<void> {
    try {
      const event = this.deserializeEvent(message.data);

      // Deduplicate
      if (await this.eventStore.has(event.id)) return;

      // Validate
      const validation = await this.validator.validate(event);
      if (!validation.valid) {
        console.warn('Rejected invalid event:', event.id, validation.errors);
        return;
      }

      // Verify signature
      const signatureValid = await this.verifyEventSignature(event);
      if (!signatureValid) {
        console.warn('Rejected event with invalid signature:', event.id);
        return;
      }

      // Check if we have all parent events (causal ordering)
      const missingParents = await this.findMissingParents(event);
      if (missingParents.length > 0) {
        // Request missing events before applying
        await this.syncManager.requestEvents(missingParents);
        // Queue this event for later processing
        this.syncManager.queuePendingEvent(event);
        return;
      }

      // Apply
      await this.applyEvent(event);
    } catch (err) {
      console.error('Error handling incoming event:', err);
    }
  }

  /**
   * Handle sync protocol messages.
   */
  private async handleSyncMessage(message: any): Promise<void> {
    const syncEvent = this.deserializeEvent(message.data);

    switch (syncEvent.type) {
      case EventType.SYNC_REQUEST:
        await this.handleSyncRequest(syncEvent);
        break;
      case EventType.SYNC_RESPONSE:
        await this.handleSyncResponse(syncEvent);
        break;
      case EventType.SYNC_VECTOR_EXCHANGE:
        await this.handleVectorExchange(syncEvent);
        break;
    }
  }

  private async handleSyncRequest(event: ChainEvent): Promise<void> {
    const payload = event.payload as EventPayloadMap[EventType.SYNC_REQUEST];
    const ourClock = await this.eventStore.getCurrentVectorClock();

    // Find events we have that requester doesn't
    const missingEvents = await this.eventStore.getEventsSince(
      payload.vectorClock,
      payload.entityFilter
    );

    // Send response
    await this.createEvent(EventType.SYNC_RESPONSE, {
      events: missingEvents.map(e => e.id),
      vectorClock: ourClock,
    });

    // Send actual events via direct GossipSub messages
    for (const evt of missingEvents) {
      await this.broadcastEvent(evt);
    }
  }

  private async handleSyncResponse(event: ChainEvent): Promise<void> {
    // SyncManager handles correlating responses
    await this.syncManager.handleSyncResponse(event);
  }

  private async handleVectorExchange(event: ChainEvent): Promise<void> {
    const payload = event.payload as EventPayloadMap[EventType.SYNC_VECTOR_EXCHANGE];
    const ourClock = await this.eventStore.getCurrentVectorClock();

    // Compare clocks to find what we're missing
    const behind = this.hlc.compareVectorClocks(ourClock, payload.vectorClock);

    if (behind.length > 0) {
      // We're behind — request sync
      await this.createEvent(EventType.SYNC_REQUEST, {
        vectorClock: ourClock,
        since: this.hlc.now(),
      });
    }
  }

  /**
   * Broadcast an event to the network.
   */
  private async broadcastEvent(event: ChainEvent): Promise<void> {
    const data = this.serializeEvent(event);

    // Broadcast to global topic
    await this.pubsub.publish(TOPICS.GLOBAL_EVENTS, data);

    // If entity-specific, broadcast to entity topic
    if (event.entityId) {
      await this.pubsub.publish(
        `/vivim/entity/${event.entityId}/v1`,
        data
      );
    }

    // Register in DHT
    await this.registerInDHT(event);
  }

  /**
   * Register event metadata in DHT for discovery.
   */
  private async registerInDHT(event: ChainEvent): Promise<void> {
    // Register content by CID
    await this.dht.provide(`/vivim/content/${event.id}`, {
      type: event.type,
      author: event.author,
      timestamp: event.hlcTimestamp,
    });

    // Register under author's content index
    await this.dht.provide(`/vivim/authors/${event.author}/content`, {
      eventId: event.id,
      type: event.type,
      timestamp: event.hlcTimestamp,
    });

    // Register entity state
    if (event.entityId) {
      await this.dht.provide(`/vivim/entities/${event.entityId}`, {
        headEvent: event.id,
        author: event.author,
        timestamp: event.hlcTimestamp,
      });
    }
  }

  /**
   * Notify local subscribers of an event.
   */
  private notifySubscribers(
    event: ChainEvent,
    entityState: EntityState | null
  ): void {
    const notification: EventNotification = { event, entityState };

    // Check all subscriptions
    for (const [key, callbacks] of this._subscriptions) {
      const filter = this.keyToFilter(key);
      if (this.matchesFilter(event, filter)) {
        for (const cb of callbacks) {
          try {
            cb(notification);
          } catch (err) {
            console.error('Subscription callback error:', err);
          }
        }
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────

  private ensureInitialized(): void {
    if (!this._initialized) {
      throw new Error('VivimChainClient not initialized. Call initializeIdentity() first.');
    }
  }

  private generateEntityId(type: EventType): EntityId {
    const prefix = EVENT_TYPE_TO_PREFIX[type] ?? 'ent';
    return `${prefix}_${nanoid(21)}`;
  }

  private async verifyEventSignature(event: ChainEvent): Promise<boolean> {
    const publicKey = await this.resolvePublicKey(event.author);
    if (!publicKey) return false;
    return this.keyManager.verify(
      this.getSigningPayload(event),
      event.signature,
      publicKey
    );
  }

  private async resolvePublicKey(did: DID): Promise<string | null> {
    // First check local cache
    const identity = await this.entityStore.getByDID(did);
    if (identity) return (identity.data as any).publicKey;

    // Then check DHT
    const result = await this.dht.findProviders(`/vivim/identity/${did}`);
    if (result.length > 0) return result[0].publicKey;

    return null;
  }

  private getSigningPayload(event: ChainEvent): Uint8Array {
    const { id, signature, ...rest } = event;
    return new TextEncoder().encode(canonicalize(rest));
  }

  private serializeEvent(event: ChainEvent): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(event));
  }

  private deserializeEvent(data: Uint8Array): ChainEvent {
    return JSON.parse(new TextDecoder().decode(data));
  }

  private async findMissingParents(event: ChainEvent): Promise<CID[]> {
    const missing: CID[] = [];
    for (const parentId of event.parentIds) {
      if (!(await this.eventStore.has(parentId))) {
        missing.push(parentId);
      }
    }
    return missing;
  }

  private filterToKey(filter: SubscriptionFilter): string {
    return JSON.stringify(filter);
  }

  private keyToFilter(key: string): SubscriptionFilter {
    return JSON.parse(key);
  }

  private matchesFilter(event: ChainEvent, filter: SubscriptionFilter): boolean {
    if (filter.type && event.type !== filter.type) return false;
    if (filter.entityId && event.entityId !== filter.entityId) return false;
    if (filter.author && event.author !== filter.author) return false;
    if (filter.types && !filter.types.includes(event.type)) return false;
    return true;
  }

  // ═══════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════

  /** Full startup sequence */
  async start(options?: StartOptions): Promise<void> {
    await this.initializeIdentity(options?.identity);
    await this.startSync();
    await this.blockProducer.start();
  }

  /** Graceful shutdown */
  async stop(): Promise<void> {
    await this.blockProducer.stop();
    await this.stopSync();
  }

  /** Export all local data for backup/migration */
  async exportData(): Promise<ExportedData> {
    return {
      events: await this.eventStore.getAll(),
      entities: await this.entityStore.getAll(),
      vectorClock: await this.eventStore.getCurrentVectorClock(),
    };
  }

  /** Import data from backup */
  async importData(data: ExportedData): Promise<void> {
    for (const event of data.events) {
      if (!(await this.eventStore.has(event.id))) {
        await this.applyEvent(event);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════

export interface VivimChainConfig {
  networkNode: NetworkNode;
  keyManager: KeyManager;
  dhtService: DHTService;
  pubsubService: PubSubService;
  nodeId: string;
  storage?: 'indexeddb' | 'memory';
  blockProduction?: Partial<BlockProductionConfig>;
}

export interface InitializeIdentityOptions {
  displayName?: string;
  avatar?: string;
  bio?: string;
}

export interface CreateEventOptions {
  entityId?: EntityId;
  encryption?: EncryptionEnvelope;
}

export interface CreateEntityOptions extends CreateEventOptions {}

export interface UpdateEntityOptions {
  encryption?: EncryptionEnvelope;
}

export interface StartOptions {
  identity?: InitializeIdentityOptions;
}

export interface SubscriptionFilter {
  type?: EventType;
  types?: EventType[];
  entityId?: EntityId;
  author?: DID;
}

export interface EventNotification {
  event: ChainEvent;
  entityState: EntityState | null;
}

export type SubscriptionCallback = (notification: EventNotification) => void;
export type Unsubscribe = () => void;

export interface SyncResult {
  eventsReceived: number;
  eventsSent: number;
  peersContacted: number;
  duration: number;
  errors: string[];
}

export interface ExportedData {
  events: ChainEvent[];
  entities: EntityState[];
  vectorClock: VectorClock;
}

export interface EntityQuery {
  type?: EntityType;
  owner?: DID;
  tags?: string[];
  visibility?: string;
  since?: HLCTimestamp;
  limit?: number;
  offset?: number;
  orderBy?: 'created' | 'updated' | 'relevance';
}

export interface LineageTree {
  root: EntityId;
  nodes: Map<EntityId, { depth: number; children: EntityId[] }>;
  totalDepth: number;
}

export interface ACUSearchResult {
  entityId: EntityId;
  state: EntityState;
  score: number;
}

export interface MemoryGraph {
  nodes: EntityState[];
  edges: Array<{
    sourceId: EntityId;
    targetId: EntityId;
    type: string;
    weight: number;
  }>;
}

const TOPICS = {
  GLOBAL_EVENTS: '/vivim/events/v1',
  SYNC_PROTOCOL: '/vivim/sync/v1',
} as const;

const EVENT_TYPE_TO_PREFIX: Record<string, string> = {
  [EventType.CONVERSATION_CREATE]: 'conv',
  [EventType.MESSAGE_CREATE]: 'msg',
  [EventType.ACU_CREATE]: 'acu',
  [EventType.ACU_DERIVE]: 'acu',
  [EventType.MEMORY_CREATE]: 'mem',
  [EventType.MEMORY_LINK]: 'lnk',
  [EventType.CIRCLE_CREATE]: 'cir',
  [EventType.IDENTITY_CREATE]: 'id',
  [EventType.SOCIAL_FOLLOW]: 'soc',
  [EventType.SOCIAL_FRIEND_REQUEST]: 'soc',
};
```

---

## 3. Event Handler Registry

```typescript
// chain/src/handlers/EventHandlerRegistry.ts

import { ChainEvent } from '../types/chain-event';
import { EventType } from '../types/events';
import { EntityState, EntityType, EntityMetadata } from '../types/entity-state';
import { EntityId, CID, DID } from '../types/primitives';

/**
 * Event handler interface — each event type gets one.
 * Handlers are pure functions: (event, currentState) => newState
 */
export interface EventHandler<T extends EventType = EventType> {
  /** The event type this handler processes */
  readonly eventType: T;

  /** Validate the event payload beyond schema validation */
  validate(event: ChainEvent<T>, currentState: EntityState | null): ValidationResult;

  /** Check authorization */
  authorize(event: ChainEvent<T>, currentState: EntityState | null): AuthorizationResult;

  /** Apply the event to produce new state */
  apply(event: ChainEvent<T>, currentState: EntityState | null): Promise<EntityState | null>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Registry that maps event types to handlers.
 * Handlers are registered at startup and are immutable.
 */
export class EventHandlerRegistry {
  private readonly handlers = new Map<EventType, EventHandler>();

  constructor() {
    this.registerDefaultHandlers();
  }

  register<T extends EventType>(handler: EventHandler<T>): void {
    if (this.handlers.has(handler.eventType)) {
      throw new Error(`Handler already registered for ${handler.eventType}`);
    }
    this.handlers.set(handler.eventType, handler);
  }

  getHandler(type: EventType): EventHandler {
    const handler = this.handlers.get(type);
    if (!handler) {
      throw new Error(`No handler registered for event type: ${type}`);
    }
    return handler;
  }

  private registerDefaultHandlers(): void {
    this.register(new ConversationCreateHandler());
    this.register(new ConversationUpdateHandler());
    this.register(new ConversationDeleteHandler());
    this.register(new MessageCreateHandler());
    this.register(new ACUCreateHandler());
    this.register(new ACUDeriveHandler());
    this.register(new ACUShareHandler());
    this.register(new ACURateHandler());
    this.register(new MemoryCreateHandler());
    this.register(new MemoryLinkHandler());
    this.register(new MemoryUnlinkHandler());
    this.register(new IdentityCreateHandler());
    this.register(new IdentityUpdateHandler());
    this.register(new SocialFollowHandler());
    this.register(new SocialUnfollowHandler());
    this.register(new SocialFriendRequestHandler());
    this.register(new SocialFriendAcceptHandler());
    this.register(new CircleCreateHandler());
    this.register(new CircleAddMemberHandler());
    this.register(new CircleRemoveMemberHandler());
    this.register(new CircleUpdateHandler());
  }
}

// ═══════════════════════════════════════════════════════════
// HANDLER IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════

// ─── Base handler with common logic ─────────────────────

abstract class BaseHandler<T extends EventType> implements EventHandler<T> {
  abstract readonly eventType: T;

  validate(event: ChainEvent<T>, currentState: EntityState | null): ValidationResult {
    return { valid: true, errors: [] };
  }

  authorize(event: ChainEvent<T>, currentState: EntityState | null): AuthorizationResult {
    // Default: only the owner/controllers can modify
    if (currentState && !currentState.controllers.includes(event.author)) {
      return { authorized: false, reason: 'Not a controller of this entity' };
    }
    return { authorized: true };
  }

  abstract apply(
    event: ChainEvent<T>,
    currentState: EntityState | null
  ): Promise<EntityState | null>;

  /** Helper to create initial entity state */
  protected createEntityState(
    event: ChainEvent,
    type: EntityType,
    data: unknown,
    metadata?: Partial<EntityMetadata>
  ): EntityState {
    const entityId = event.entityId!;
    return {
      id: entityId,
      type,
      data,
      owner: event.author,
      controllers: [event.author],
      genesisEventId: event.id,
      headEventId: event.id,
      eventLog: [event.id],
      vectorClock: { ...event.vectorClock },
      lastUpdated: event.hlcTimestamp,
      deleted: false,
      eventCount: 1,
      metadata: {
        visibility: 'private',
        schemaVersion: 1,
        contentHash: event.id,
        ...metadata,
      },
    };
  }

  /** Helper to update entity state with new event */
  protected updateEntityState(
    state: EntityState,
    event: ChainEvent,
    dataUpdater: (data: any) => any
  ): EntityState {
    return {
      ...state,
      data: dataUpdater(state.data),
      headEventId: event.id,
      eventLog: [...state.eventLog, event.id],
      vectorClock: mergeVectorClocks(state.vectorClock, event.vectorClock),
      lastUpdated: event.hlcTimestamp,
      eventCount: state.eventCount + 1,
      metadata: {
        ...state.metadata,
        contentHash: event.id,
      },
    };
  }
}

// ─── Conversation Handlers ──────────────────────────────

class ConversationCreateHandler extends BaseHandler<EventType.CONVERSATION_CREATE> {
  readonly eventType = EventType.CONVERSATION_CREATE;

  validate(event: ChainEvent<EventType.CONVERSATION_CREATE>): ValidationResult {
    const { title, provider } = event.payload;
    const errors: string[] = [];
    if (!title || title.trim().length === 0) errors.push('Title is required');
    if (!provider) errors.push('Provider is required');
    return { valid: errors.length === 0, errors };
  }

  authorize(event: ChainEvent<EventType.CONVERSATION_CREATE>): AuthorizationResult {
    // Anyone can create conversations
    return { authorized: true };
  }

  async apply(event: ChainEvent<EventType.CONVERSATION_CREATE>): Promise<EntityState> {
    return this.createEntityState(event, EntityType.CONVERSATION, {
      title: event.payload.title,
      provider: event.payload.provider,
      model: event.payload.model ?? null,
      tags: event.payload.tags ?? [],
      messageCount: 0,
      metadata: event.payload.metadata ?? {},
    });
  }
}

class ConversationUpdateHandler extends BaseHandler<EventType.CONVERSATION_UPDATE> {
  readonly eventType = EventType.CONVERSATION_UPDATE;

  async apply(
    event: ChainEvent<EventType.CONVERSATION_UPDATE>,
    currentState: EntityState | null
  ): Promise<EntityState> {
    if (!currentState) throw new Error('Cannot update non-existent conversation');

    return this.updateEntityState(currentState, event, (data) => ({
      ...data,
      ...(event.payload.title !== undefined && { title: event.payload.title }),
      ...(event.payload.tags !== undefined && { tags: event.payload.tags }),
      ...(event.payload.metadata !== undefined && {
        metadata: { ...data.metadata, ...event.payload.metadata },
      }),
    }));
  }
}

class ConversationDeleteHandler extends BaseHandler<EventType.CONVERSATION_DELETE> {
  readonly eventType = EventType.CONVERSATION_DELETE;

  async apply(
    event: ChainEvent<EventType.CONVERSATION_DELETE>,
    currentState: EntityState | null
  ): Promise<EntityState> {
    if (!currentState) throw new Error('Cannot delete non-existent conversation');

    return {
      ...this.updateEntityState(currentState, event, (data) => data),
      deleted: true,
    };
  }
}

// ─── Message Handler ────────────────────────────────────

class MessageCreateHandler extends BaseHandler<EventType.MESSAGE_CREATE> {
  readonly eventType = EventType.MESSAGE_CREATE;

  validate(event: ChainEvent<EventType.MESSAGE_CREATE>): ValidationResult {
    const errors: string[] = [];
    if (!event.payload.conversationId) errors.push('conversationId required');
    if (!event.payload.content) errors.push('content required');
    if (!['user', 'assistant', 'system'].includes(event.payload.role)) {
      errors.push('Invalid role');
    }
    return { valid: errors.length === 0, errors };
  }

  async apply(event: ChainEvent<EventType.MESSAGE_CREATE>): Promise<EntityState> {
    return this.createEntityState(event, EntityType.MESSAGE, {
      conversationId: event.payload.conversationId,
      role: event.payload.role,
      content: event.payload.content,
      ordinal: event.payload.ordinal,
      providerMessageId: event.payload.providerMessageId,
      model: event.payload.model,
      tokenCount: event.payload.tokenCount,
    });
  }
}

// ─── ACU Handlers ───────────────────────────────────────

class ACUCreateHandler extends BaseHandler<EventType.ACU_CREATE> {
  readonly eventType = EventType.ACU_CREATE;

  validate(event: ChainEvent<EventType.ACU_CREATE>): ValidationResult {
    const errors: string[] = [];
    if (!event.payload.content) errors.push('content required');
    if (!event.payload.title) errors.push('title required');
    if (!event.payload.sourceConversationId) errors.push('sourceConversationId required');
    if (event.payload.confidence < 0 || event.payload.confidence > 1) {
      errors.push('confidence must be between 0 and 1');
    }
    return { valid: errors.length === 0, errors };
  }

  async apply(event: ChainEvent<EventType.ACU_CREATE>): Promise<EntityState> {
    const entityId = event.entityId!;
    return this.createEntityState(
      event,
      EntityType.ACU,
      {
        title: event.payload.title,
        content: event.payload.content,
        knowledgeType: event.payload.knowledgeType,
        tags: event.payload.tags,
        confidence: event.payload.confidence,
        visibility: event.payload.visibility,
        sourceConversationId: event.payload.sourceConversationId,
        sourceMessageIds: event.payload.sourceMessageIds,
        parentAcuIds: [],
        derivationType: null,
        lineage: {
          rootAcuId: entityId,
          depth: 0,
          ancestors: [],
          descendants: [],
        },
        ratings: { average: 0, count: 0 },
        shareCount: 0,
      },
      { visibility: event.payload.visibility }
    );
  }
}

class ACUDeriveHandler extends BaseHandler<EventType.ACU_DERIVE> {
  readonly eventType = EventType.ACU_DERIVE;

  validate(event: ChainEvent<EventType.ACU_DERIVE>): ValidationResult {
    const errors: string[] = [];
    if (!event.payload.parentAcuIds?.length) errors.push('At least one parent ACU required');
    if (!event.payload.content) errors.push('content required');
    return { valid: errors.length === 0, errors };
  }

  async apply(event: ChainEvent<EventType.ACU_DERIVE>): Promise<EntityState> {
    const entityId = event.entityId!;
    // In a real implementation, we'd look up parent ACU states
    // to build the full lineage. Simplified here.
    return this.createEntityState(
      event,
      EntityType.ACU,
      {
        title: event.payload.title,
        content: event.payload.content,
        knowledgeType: event.payload.knowledgeType,
        tags: event.payload.tags,
        confidence: event.payload.confidence,
        visibility: event.payload.visibility,
        sourceConversationId: null,
        sourceMessageIds: [],
        parentAcuIds: event.payload.parentAcuIds,
        derivationType: event.payload.derivationType,
        lineage: {
          rootAcuId: entityId, // Would be computed from parents
          depth: 1,            // Would be max(parent.depth) + 1
          ancestors: event.payload.parentAcuIds,
          descendants: [],
        },
        ratings: { average: 0, count: 0 },
        shareCount: 0,
      },
      { visibility: event.payload.visibility }
    );
  }
}

class ACUShareHandler extends BaseHandler<EventType.ACU_SHARE> {
  readonly eventType = EventType.ACU_SHARE;

  async apply(
    event: ChainEvent<EventType.ACU_SHARE>,
    currentState: EntityState | null
  ): Promise<EntityState | null> {
    // ACU_SHARE doesn't create a new entity — it modifies the ACU.
    // But we handle it as a standalone event for auditability.
    // The actual ACU state is updated via a separate mechanism
    // (side effect in the handler).
    return null; // No new entity created
  }
}

class ACURateHandler extends BaseHandler<EventType.ACU_RATE> {
  readonly eventType = EventType.ACU_RATE;

  authorize(event: ChainEvent<EventType.ACU_RATE>): AuthorizationResult {
    // Anyone can rate — no need to be controller
    return { authorized: true };
  }

  async apply(
    event: ChainEvent<EventType.ACU_RATE>,
    currentState: EntityState | null
  ): Promise<EntityState | null> {
    // Rating events don't create entities
    return null;
  }
}

// ─── Memory Handlers ────────────────────────────────────

class MemoryCreateHandler extends BaseHandler<EventType.MEMORY_CREATE> {
  readonly eventType = EventType.MEMORY_CREATE;

  async apply(event: ChainEvent<EventType.MEMORY_CREATE>): Promise<EntityState> {
    return this.createEntityState(event, EntityType.MEMORY_NODE, {
      nodeType: event.payload.nodeType,
      label: event.payload.label,
      description: event.payload.description,
      acuIds: event.payload.acuIds,
      embedding: event.payload.embedding,
      linkCount: 0,
    });
  }
}

class MemoryLinkHandler extends BaseHandler<EventType.MEMORY_LINK> {
  readonly eventType = EventType.MEMORY_LINK;

  async apply(event: ChainEvent<EventType.MEMORY_LINK>): Promise<EntityState> {
    return this.createEntityState(event, EntityType.MEMORY_LINK, {
      sourceId: event.payload.sourceId,
      targetId: event.payload.targetId,
      relationshipType: event.payload.relationshipType,
      weight: event.payload.weight,
      bidirectional: event.payload.bidirectional,
    });
  }
}

class MemoryUnlinkHandler extends BaseHandler<EventType.MEMORY_UNLINK> {
  readonly eventType = EventType.MEMORY_UNLINK;

  async apply(
    event: ChainEvent<EventType.MEMORY_UNLINK>,
    currentState: EntityState | null
  ): Promise<EntityState> {
    if (!currentState) throw new Error('Cannot unlink non-existent link');
    return {
      ...this.updateEntityState(currentState, event, (data) => data),
      deleted: true,
    };
  }
}

// ─── Identity Handlers ──────────────────────────────────

class IdentityCreateHandler extends BaseHandler<EventType.IDENTITY_CREATE> {
  readonly eventType = EventType.IDENTITY_CREATE;

  async apply(event: ChainEvent<EventType.IDENTITY_CREATE>): Promise<EntityState> {
    return this.createEntityState(event, EntityType.IDENTITY, {
      displayName: event.payload.displayName,
      publicKey: event.payload.publicKey,
      avatar: event.payload.avatar,
      bio: event.payload.bio,
      preferences: event.payload.preferences ?? {},
    }, { visibility: 'public' });
  }
}

class IdentityUpdateHandler extends BaseHandler<EventType.IDENTITY_UPDATE> {
  readonly eventType = EventType.IDENTITY_UPDATE;

  async apply(
    event: ChainEvent<EventType.IDENTITY_UPDATE>,
    currentState: EntityState | null
  ): Promise<EntityState> {
    if (!currentState) throw new Error('Cannot update non-existent identity');
    return this.updateEntityState(currentState, event, (data) => ({
      ...data,
      ...event.payload,
    }));
  }
}

// ─── Social Handlers ────────────────────────────────────

class SocialFollowHandler extends BaseHandler<EventType.SOCIAL_FOLLOW> {
  readonly eventType = EventType.SOCIAL_FOLLOW;

  async apply(event: ChainEvent<EventType.SOCIAL_FOLLOW>): Promise<EntityState> {
    return this.createEntityState(event, EntityType.SOCIAL_GRAPH, {
      type: 'follow',
      sourceDid: event.author,
      targetDid: event.payload.targetDid,
      active: true,
    });
  }
}

class SocialUnfollowHandler extends BaseHandler<EventType.SOCIAL_UNFOLLOW> {
  readonly eventType = EventType.SOCIAL_UNFOLLOW;

  async apply(
    event: ChainEvent<EventType.SOCIAL_UNFOLLOW>,
    currentState: EntityState | null
  ): Promise<EntityState | null> {
    // Mark the follow relationship as inactive
    if (!currentState) return null;
    return this.updateEntityState(currentState, event, (data) => ({
      ...data,
      active: false,
    }));
  }
}

class SocialFriendRequestHandler extends BaseHandler<EventType.SOCIAL_FRIEND_REQUEST> {
  readonly eventType = EventType.SOCIAL_FRIEND_REQUEST;

  async apply(event: ChainEvent<EventType.SOCIAL_FRIEND_REQUEST>): Promise<EntityState> {
    return this.createEntityState(event, EntityType.SOCIAL_GRAPH, {
      type: 'friend_request',
      sourceDid: event.author,
      targetDid: event.payload.targetDid,
      message: event.payload.message,
      status: 'pending',
    });
  }
}

class SocialFriendAcceptHandler extends BaseHandler<EventType.SOCIAL_FRIEND_ACCEPT> {
  readonly eventType = EventType.SOCIAL_FRIEND_ACCEPT;

  async apply(
    event: ChainEvent<EventType.SOCIAL_FRIEND_ACCEPT>,
    currentState: EntityState | null
  ): Promise<EntityState> {
    if (!currentState) throw new Error('Cannot accept non-existent friend request');
    return this.updateEntityState(currentState, event, (data) => ({
      ...data,
      status: 'accepted',
      acceptedAt: event.hlcTimestamp,
    }));
  }
}

// ─── Circle Handlers ────────────────────────────────────

class CircleCreateHandler extends BaseHandler<EventType.CIRCLE_CREATE> {
  readonly eventType = EventType.CIRCLE_CREATE;

  async apply(event: ChainEvent<EventType.CIRCLE_CREATE>): Promise<EntityState> {
    const members: Record<string, { role: string; joinedAt: string }> = {
      [event.author]: { role: 'admin', joinedAt: event.hlcTimestamp },
    };
    if (event.payload.initialMembers) {
      for (const did of event.payload.initialMembers) {
        members[did] = { role: 'member', joinedAt: event.hlcTimestamp };
      }
    }

    return this.createEntityState(event, EntityType.CIRCLE, {
      name: event.payload.name,
      description: event.payload.description,
      visibility: event.payload.visibility,
      members,
      memberCount: Object.keys(members).length,
    }, { visibility: event.payload.visibility });
  }
}

class CircleAddMemberHandler extends BaseHandler<EventType.CIRCLE_ADD_MEMBER> {
  readonly eventType = EventType.CIRCLE_ADD_MEMBER;

  authorize(
    event: ChainEvent<EventType.CIRCLE_ADD_MEMBER>,
    currentState: EntityState | null
  ): AuthorizationResult {
    if (!currentState) return { authorized: false, reason: 'Circle not found' };
    const data = currentState.data as any;
    const authorRole = data.members[event.author]?.role;
    if (!authorRole || authorRole === 'member') {
      return { authorized: false, reason: 'Only admins/moderators can add members' };
    }
    return { authorized: true };
  }

  async apply(
    event: ChainEvent<EventType.CIRCLE_ADD_MEMBER>,
    currentState: EntityState | null
  ): Promise<EntityState> {
    if (!currentState) throw new Error('Circle not found');
    return this.updateEntityState(currentState, event, (data) => {
      const members = { ...data.members };
      members[event.payload.memberDid] = {
        role: event.payload.role,
        joinedAt: event.hlcTimestamp,
      };
      return {
        ...data,
        members,
        memberCount: Object.keys(members).length,
      };
    });
  }
}

class CircleRemoveMemberHandler extends BaseHandler<EventType.CIRCLE_REMOVE_MEMBER> {
  readonly eventType = EventType.CIRCLE_REMOVE_MEMBER;

  authorize(
    event: ChainEvent<EventType.CIRCLE_REMOVE_MEMBER>,
    currentState: EntityState | null
  ): AuthorizationResult {
    if (!currentState) return { authorized: false, reason: 'Circle not found' };
    const data = currentState.data as any;
    const authorRole = data.members[event.author]?.role;
    // Can remove self, or admin can remove anyone
    if (event.payload.memberDid === event.author) return { authorized: true };
    if (authorRole !== 'admin') {
      return { authorized: false, reason: 'Only admins can remove other members' };
    }
    return { authorized: true };
  }

  async apply(
    event: ChainEvent<EventType.CIRCLE_REMOVE_MEMBER>,
    currentState: EntityState | null
  ): Promise<EntityState> {
    if (!currentState) throw new Error('Circle not found');
    return this.updateEntityState(currentState, event, (data) => {
      const members = { ...data.members };
      delete members[event.payload.memberDid];
      return {
        ...data,
        members,
        memberCount: Object.keys(members).length,
      };
    });
  }
}

class CircleUpdateHandler extends BaseHandler<EventType.CIRCLE_UPDATE> {
  readonly eventType = EventType.CIRCLE_UPDATE;

  authorize(
    event: ChainEvent<EventType.CIRCLE_UPDATE>,
    currentState: EntityState | null
  ): AuthorizationResult {
    if (!currentState) return { authorized: false, reason: 'Circle not found' };
    const data = currentState.data as any;
    const authorRole = data.members[event.author]?.role;
    if (authorRole !== 'admin') {
      return { authorized: false, reason: 'Only admins can update circle settings' };
    }
    return { authorized: true };
  }

  async apply(
    event: ChainEvent<EventType.CIRCLE_UPDATE>,
    currentState: EntityState | null
  ): Promise<EntityState> {
    if (!currentState) throw new Error('Circle not found');
    return this.updateEntityState(currentState, event, (data) => ({
      ...data,
      ...(event.payload.name !== undefined && { name: event.payload.name }),
      ...(event.payload.description !== undefined && { description: event.payload.description }),
      ...(event.payload.visibility !== undefined && { visibility: event.payload.visibility }),
    }));
  }
}

// ─── Utility ────────────────────────────────────────────

function mergeVectorClocks(a: VectorClock, b: VectorClock): VectorClock {
  const merged = { ...a };
  for (const [did, clock] of Object.entries(b)) {
    merged[did] = Math.max(merged[did] ?? 0, clock);
  }
  return merged;
}
```

---

## 4. DHT Schema

```typescript
// chain/src/dht/DHTSchema.ts

/**
 * DHT Key Schema for VIVIM
 * 
 * The DHT is used for DISCOVERY, not storage.
 * Each key maps to lightweight metadata + provider peer IDs.
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ Key Pattern                  │ Purpose                  │
 * ├─────────────────────────────────────────────────────────┤
 * │ /vivim/identity/{did}        │ DID → peer routing       │
 * │ /vivim/content/{cid}         │ Content discovery         │
 * │ /vivim/entities/{id}         │ Entity state providers    │
 * │ /vivim/authors/{did}/content │ Author's content index    │
 * │ /vivim/tags/{tag}            │ Tag-based discovery       │
 * │ /vivim/circles/{id}          │ Circle discovery          │
 * │ /vivim/circles/{id}/content  │ Content shared to circle  │
 * │ /vivim/search/{hash}         │ Searchable content index  │
 * └─────────────────────────────────────────────────────────┘
 */

import { CID, DID, EntityId, HLCTimestamp, PublicKey } from '../types/primitives';

// ═══════════════════════════════════════════════════════════
// DHT KEY BUILDERS
// ═══════════════════════════════════════════════════════════

export const DHTKeys = {
  /** Identity resolution: DID → connection info */
  identity: (did: DID) => `/vivim/identity/${did}`,

  /** Content by CID */
  content: (cid: CID) => `/vivim/content/${cid}`,

  /** Entity state providers */
  entity: (entityId: EntityId) => `/vivim/entities/${entityId}`,

  /** All content by a specific author */
  authorContent: (did: DID) => `/vivim/authors/${did}/content`,

  /** Author's content of a specific type */
  authorContentByType: (did: DID, type: string) =>
    `/vivim/authors/${did}/content/${type}`,

  /** Content tagged with a specific tag */
  tag: (tag: string) => `/vivim/tags/${normalizeTag(tag)}`,

  /** Circle discovery */
  circle: (circleId: EntityId) => `/vivim/circles/${circleId}`,

  /** Content shared to a circle */
  circleContent: (circleId: EntityId) =>
    `/vivim/circles/${circleId}/content`,

  /** Search index entry */
  search: (queryHash: string) => `/vivim/search/${queryHash}`,

  /** ACU lineage root */
  acuLineage: (rootAcuId: EntityId) => `/vivim/lineage/${rootAcuId}`,

  /** Memory graph for a user */
  memoryGraph: (did: DID) => `/vivim/memory/${did}`,
} as const;

// ═══════════════════════════════════════════════════════════
// DHT VALUE TYPES
// ═══════════════════════════════════════════════════════════

export interface DHTIdentityRecord {
  did: DID;
  publicKey: PublicKey;
  genesisEvent: CID;
  /** Multiaddrs for direct connection */
  addresses: string[];
  /** Last seen timestamp */
  lastSeen: HLCTimestamp;
  /** User's display name for search */
  displayName: string;
}

export interface DHTContentRecord {
  cid: CID;
  type: string;
  author: DID;
  timestamp: HLCTimestamp;
  /** Size in bytes */
  size: number;
  /** Whether content is encrypted */
  encrypted: boolean;
}

export interface DHTEntityRecord {
  entityId: EntityId;
  entityType: string;
  owner: DID;
  headEvent: CID;
  eventCount: number;
  lastUpdated: HLCTimestamp;
  /** Visibility for access control */
  visibility: 'private' | 'circles' | 'public';
}

export interface DHTTagRecord {
  tag: string;
  entityId: EntityId;
  entityType: string;
  author: DID;
  timestamp: HLCTimestamp;
}

export interface DHTCircleRecord {
  circleId: EntityId;
  name: string;
  visibility: 'private' | 'invite_only' | 'public';
  memberCount: number;
  owner: DID;
}

// ═══════════════════════════════════════════════════════════
// DHT REGISTRATION SERVICE
// ═══════════════════════════════════════════════════════════

export class DHTRegistrationService {
  constructor(private readonly dht: DHTService) {}

  /** Register/update identity in DHT */
  async registerIdentity(record: DHTIdentityRecord): Promise<void> {
    await this.dht.provide(DHTKeys.identity(record.did), record);
  }

  /** Register content in DHT */
  async registerContent(record: DHTContentRecord): Promise<void> {
    await this.dht.provide(DHTKeys.content(record.cid), record);
    await this.dht.provide(
      DHTKeys.authorContent(record.author),
      record
    );
  }

  /** Register entity in DHT */
  async registerEntity(record: DHTEntityRecord): Promise<void> {
    if (record.visibility === 'public') {
      await this.dht.provide(DHTKeys.entity(record.entityId), record);
    }
  }

  /** Register tags for an entity */
  async registerTags(
    entityId: EntityId,
    entityType: string,
    tags: string[],
    author: DID,
    timestamp: HLCTimestamp
  ): Promise<void> {
    for (const tag of tags) {
      await this.dht.provide(DHTKeys.tag(tag), {
        tag: normalizeTag(tag),
        entityId,
        entityType,
        author,
        timestamp,
      });
    }
  }

  /** Resolve a DID to connection info */
  async resolveIdentity(did: DID): Promise<DHTIdentityRecord | null> {
    const results = await this.dht.findProviders(DHTKeys.identity(did));
    return results.length > 0 ? results[0] as DHTIdentityRecord : null;
  }

  /** Find content by tag */
  async findByTag(tag: string): Promise<DHTTagRecord[]> {
    return this.dht.findProviders(DHTKeys.tag(tag)) as Promise<DHTTagRecord[]>;
  }

  /** Find entity providers */
  async findEntityProviders(entityId: EntityId): Promise<DHTEntityRecord[]> {
    return this.dht.findProviders(
      DHTKeys.entity(entityId)
    ) as Promise<DHTEntityRecord[]>;
  }

  /** Find content by author */
  async findAuthorContent(did: DID): Promise<DHTContentRecord[]> {
    return this.dht.findProviders(
      DHTKeys.authorContent(did)
    ) as Promise<DHTContentRecord[]>;
  }
}

function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/\s+/g, '-');
}
```

---

## 5. GossipSub Sync Protocol

```typescript
// chain/src/sync/SyncManager.ts

import { CID, DID, HLCTimestamp, VectorClock, EntityId } from '../types/primitives';
import { ChainEvent } from '../types/chain-event';
import { EventType } from '../types/events';
import { EntityState } from '../types/entity-state';

/**
 * GossipSub Sync Protocol Specification
 * 
 * ═══════════════════════════════════════════════════════════
 * TOPICS
 * ═══════════════════════════════════════════════════════════
 * 
 * /vivim/events/v1
 *   - All chain events are published here
 *   - Every node subscribes to this topic
 *   - Used for real-time event propagation
 * 
 * /vivim/sync/v1
 *   - Sync protocol messages (request/response/vector exchange)
 *   - Used for catch-up and consistency checks
 * 
 * /vivim/entity/{entityId}/v1
 *   - Entity-specific updates
 *   - Nodes subscribe when actively watching an entity
 *   - Reduces bandwidth for nodes that only care about specific entities
 * 
 * /vivim/circle/{circleId}/v1
 *   - Circle-scoped events
 *   - Only circle members subscribe
 * 
 * /vivim/presence/v1
 *   - Online/offline announcements
 *   - Used for peer discovery
 * 
 * ═══════════════════════════════════════════════════════════
 * SYNC PROTOCOL FLOW
 * ═══════════════════════════════════════════════════════════
 * 
 * 1. BOOTSTRAP SYNC (on startup)
 *    Node A comes online:
 *    a) Publishes presence announcement to /vivim/presence/v1
 *    b) Sends SYNC_VECTOR_EXCHANGE with its vector clock
 *    c) Other nodes compare clocks and respond
 *    d) Missing events are requested and applied
 * 
 * 2. REAL-TIME SYNC (during operation)
 *    Node A creates an event:
 *    a) Event is published to /vivim/events/v1
 *    b) If entity-specific, also published to /vivim/entity/{id}/v1
 *    c) All subscribed nodes receive and apply the event
 * 
 * 3. PERIODIC CONSISTENCY CHECK
 *    Every 30 seconds:
 *    a) Node publishes SYNC_VECTOR_EXCHANGE
 *    b) Other nodes compare and identify gaps
 *    c) Missing events are requested
 * 
 * 4. CONFLICT RESOLUTION
 *    When concurrent events target the same entity:
 *    a) Vector clocks identify concurrent modifications
 *    b) Events are ordered by HLC timestamp
 *    c) CRDT merge rules produce deterministic state
 *    d) "Last-writer-wins" for scalar fields
 *    e) Set union for collection fields (tags, members)
 */

export interface SyncConfig {
  vectorClockExchangeInterval: number;
  dhtAdvertiseInterval: number;
  fullSyncInterval: number;
}

export class SyncManager {
  private running = false;
  private intervals: NodeJS.Timeout[] = [];
  private pendingEvents = new Map<CID, ChainEvent>();
  private peerClocks = new Map<DID, VectorClock>();

  constructor(
    private readonly pubsub: PubSubService,
    private readonly dht: DHTService,
    private readonly eventStore: EventStore,
    private readonly entityStore: EntityStore,
    private readonly hlc: HLClock,
  ) {}

  async start(config: SyncConfig): Promise<void> {
    this.running = true;

    // Periodic vector clock exchange
    this.intervals.push(
      setInterval(
        () => this.exchangeVectorClocks(),
        config.vectorClockExchangeInterval
      )
    );

    // Periodic DHT advertisement
    this.intervals.push(
      setInterval(
        () => this.advertiseInDHT(),
        config.dhtAdvertiseInterval
      )
    );

    // Periodic full sync check
    this.intervals.push(
      setInterval(
        () => this.fullSyncCheck(),
        config.fullSyncInterval
      )
    );

    // Initial sync
    await this.bootstrapSync();
  }

  async stop(): Promise<void> {
    this.running = false;
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals = [];
  }

  /**
   * Bootstrap sync — called when node comes online.
   */
  private async bootstrapSync(): Promise<void> {
    // 1. Announce presence
    await this.announcePresence();

    // 2. Exchange vector clocks
    await this.exchangeVectorClocks();

    // 3. Process any pending events
    await this.processPendingEvents();
  }

  /**
   * Announce our presence to the network.
   */
  async announcePresence(did?: DID): Promise<void> {
    const clock = await this.eventStore.getCurrentVectorClock();
    const heads = await this.eventStore.getHeadEventIds();

    const announcement: PresenceAnnouncement = {
      type: 'presence:announce',
      did: did ?? 'self',
      vectorClock: clock,
      headEvents: heads,
      timestamp: this.hlc.now(),
      capabilities: ['sync-v1', 'events-v1'],
    };

    await this.pubsub.publish(
      '/vivim/presence/v1',
      new TextEncoder().encode(JSON.stringify(announcement))
    );
  }

  /**
   * Exchange vector clocks with peers.
   */
  private async exchangeVectorClocks(): Promise<void> {
    const ourClock = await this.eventStore.getCurrentVectorClock();
    const heads = await this.eventStore.getHeadEventIds();

    await this.pubsub.publish(
      '/vivim/sync/v1',
      new TextEncoder().encode(JSON.stringify({
        type: EventType.SYNC_VECTOR_EXCHANGE,
        vectorClock: ourClock,
        headEvents: heads,
      }))
    );
  }

  /**
   * Perform a manual sync with all known peers.
   */
  async syncNow(): Promise<SyncResult> {
    const startTime = Date.now();
    let eventsReceived = 0;
    let eventsSent = 0;
    let peersContacted = 0;
    const errors: string[] = [];

    const ourClock = await this.eventStore.getCurrentVectorClock();

    // Request sync from all known peers
    for (const [peerDid, peerClock] of this.peerClocks) {
      peersContacted++;
      try {
        // Find what we're missing
        const missing = this.findMissingEntries(ourClock, peerClock);
        if (missing.length > 0) {
          // Request events
          const received = await this.requestEventsFromPeer(peerDid, ourClock);
          eventsReceived += received;
        }

        // Find what they're missing (proactive push)
        const theyMissing = this.findMissingEntries(peerClock, ourClock);
        if (theyMissing.length > 0) {
          const sent = await this.pushEventsToPeer(peerDid, peerClock);
          eventsSent += sent;
        }
      } catch (err) {
        errors.push(`Sync with ${peerDid}: ${(err as Error).message}`);
      }
    }

    return {
      eventsReceived,
      eventsSent,
      peersContacted,
      duration: Date.now() - startTime,
      errors,
    };
  }

  /**
   * Request events for a specific entity from a peer.
   */
  async requestEntityEvents(
    entityId: EntityId,
    peerId: string
  ): Promise<void> {
    const ourClock = await this.eventStore.getCurrentVectorClock();

    await this.pubsub.publish(
      '/vivim/sync/v1',
      new TextEncoder().encode(JSON.stringify({
        type: EventType.SYNC_REQUEST,
        vectorClock: ourClock,
        entityFilter: [entityId],
        targetPeer: peerId,
      }))
    );
  }

  /**
   * Handle incoming sync response.
   */
  async handleSyncResponse(event: ChainEvent): Promise<void> {
    const payload = event.payload as any;

    // Update our knowledge of peer's clock
    this.peerClocks.set(event.author, payload.vectorClock);

    // The actual events will arrive via the events topic
    // We just need to know what to expect
  }

  /**
   * Queue an event that can't be applied yet (missing parents).
   */
  queuePendingEvent(event: ChainEvent): void {
    this.pendingEvents.set(event.id, event);
  }

  /**
   * Request specific missing events from the network.
   */
  async requestEvents(eventIds: CID[]): Promise<void> {
    // Publish a request on the sync topic
    await this.pubsub.publish(
      '/vivim/sync/v1',
      new TextEncoder().encode(JSON.stringify({
        type: 'event_request',
        eventIds,
        requestor: 'self',
      }))
    );

    // Also try DHT
    for (const cid of eventIds) {
      const providers = await this.dht.findProviders(`/vivim/content/${cid}`);
      // Connect to providers and request the event
    }
  }

  /**
   * Process queued events whose parents are now available.
   */
  private async processPendingEvents(): Promise<void> {
    let processed = true;
    while (processed) {
      processed = false;
      for (const [cid, event] of this.pendingEvents) {
        const allParentsPresent = await this.allParentsPresent(event);
        if (allParentsPresent) {
          this.pendingEvents.delete(cid);
          // Re-emit for processing
          // (The client will pick this up and apply it)
          processed = true;
        }
      }
    }
  }

  private async allParentsPresent(event: ChainEvent): Promise<boolean> {
    for (const parentId of event.parentIds) {
      if (!(await this.eventStore.has(parentId))) return false;
    }
    return true;
  }

  /**
   * Find DIDs where peer is ahead of us.
   */
  private findMissingEntries(
    ourClock: VectorClock,
    theirClock: VectorClock
  ): DID[] {
    const missing: DID[] = [];
    for (const [did, theirValue] of Object.entries(theirClock)) {
      const ourValue = ourClock[did] ?? 0;
      if (theirValue > ourValue) {
        missing.push(did as DID);
      }
    }
    return missing;
  }

  private async requestEventsFromPeer(
    peerDid: DID,
    ourClock: VectorClock
  ): Promise<number> {
    // Implementation: send SYNC_REQUEST and wait for events
    return 0;
  }

  private async pushEventsToPeer(
    peerDid: DID,
    theirClock: VectorClock
  ): Promise<number> {
    const events = await this.eventStore.getEventsSince(theirClock);
    for (const event of events) {
      await this.pubsub.publish(
        '/vivim/events/v1',
        new TextEncoder().encode(JSON.stringify(event))
      );
    }
    return events.length;
  }

  private async advertiseInDHT(): Promise<void> {
    // Advertise our entities in DHT for discovery
    const entities = await this.entityStore.getAll();
    for (const entity of entities) {
      if (entity.metadata.visibility === 'public') {
        await this.dht.provide(`/vivim/entities/${entity.id}`, {
          entityId: entity.id,
          entityType: entity.type,
          owner: entity.owner,
          headEvent: entity.headEventId,
          lastUpdated: entity.lastUpdated,
        });
      }
    }
  }

  private async fullSyncCheck(): Promise<void> {
    await this.exchangeVectorClocks();
    await this.processPendingEvents();
  }
}

interface PresenceAnnouncement {
  type: 'presence:announce';
  did: DID | 'self';
  vectorClock: VectorClock;
  headEvents: CID[];
  timestamp: HLCTimestamp;
  capabilities: string[];
}
```

### 5.1 Conflict Resolution Rules

```typescript
// chain/src/sync/ConflictResolver.ts

import { VectorClock, HLCTimestamp, DID } from '../types/primitives';
import { EntityState } from '../types/entity-state';
import { ChainEvent } from '../types/chain-event';

/**
 * Conflict Resolution Strategy
 * 
 * VIVIM uses a multi-layer conflict resolution approach:
 * 
 * Layer 1: Vector Clocks (causality)
 *   - If VC(A) < VC(B), A happened-before B → apply B after A
 *   - If VC(A) || VC(B), they are concurrent → merge
 * 
 * Layer 2: CRDT Merge Rules (per field type)
 *   - Scalars: Last-Writer-Wins (LWW) by HLC timestamp
 *   - Sets (tags, members): Union merge
 *   - Counters (messageCount): Max merge
 *   - Maps (metadata): Recursive LWW per key
 * 
 * Layer 3: Application-level rules
 *   - Deletions always win (tombstone)
 *   - ACU lineage: merge lineage trees
 *   - Circle membership: admin actions win
 */
export class ConflictResolver {
  /**
   * Compare two vector clocks.
   * Returns:
   *   'before' if a happened before b
   *   'after' if a happened after b
   *   'concurrent' if neither
   *   'equal' if identical
   */
  compareVectorClocks(a: VectorClock, b: VectorClock): CausalRelation {
    let aBeforeB = false;
    let bBeforeA = false;

    const allDids = new Set([...Object.keys(a), ...Object.keys(b)]);

    for (const did of allDids) {
      const aVal = a[did] ?? 0;
      const bVal = b[did] ?? 0;

      if (aVal < bVal) aBeforeB = true;
      if (aVal > bVal) bBeforeA = true;
    }

    if (!aBeforeB && !bBeforeA) return 'equal';
    if (aBeforeB && !bBeforeA) return 'before';
    if (!aBeforeB && bBeforeA) return 'after';
    return 'concurrent';
  }

  /**
   * Merge two entity states that diverged concurrently.
   */
  mergeEntityStates(
    stateA: EntityState,
    stateB: EntityState,
    eventsA: ChainEvent[],
    eventsB: ChainEvent[]
  ): EntityState {
    // Determine which state is "newer" by HLC
    const aIsNewer = this.compareHLC(
      stateA.lastUpdated,
      stateB.lastUpdated
    ) >= 0;
    const newer = aIsNewer ? stateA : stateB;
    const older = aIsNewer ? stateB : stateA;

    // Merge vector clocks
    const mergedClock = this.mergeVectorClocks(
      stateA.vectorClock,
      stateB.vectorClock
    );

    // Merge event logs (union, then sort by HLC)
    const allEventIds = new Set([
      ...stateA.eventLog,
      ...stateB.eventLog,
    ]);
    const mergedLog = [...allEventIds]; // Would sort by HLC in practice

    // Merge data using CRDT rules
    const mergedData = this.mergeData(
      stateA.data,
      stateB.data,
      stateA.type,
      newer === stateA ? stateA.lastUpdated : stateB.lastUpdated
    );

    // Tombstone wins
    const deleted = stateA.deleted || stateB.deleted;

    return {
      ...newer,
      data: mergedData,
      vectorClock: mergedClock,
      eventLog: mergedLog,
      headEventId: newer.headEventId,
      lastUpdated: newer.lastUpdated,
      deleted,
      eventCount: mergedLog.length,
      metadata: {
        ...older.metadata,
        ...newer.metadata,
      },
    };
  }

  /**
   * Merge data objects using CRDT rules.
   */
  private mergeData(
    dataA: any,
    dataB: any,
    entityType: string,
    newerTimestamp: HLCTimestamp
  ): any {
    if (!dataA) return dataB;
    if (!dataB) return dataA;

    const merged: any = {};

    const allKeys = new Set([
      ...Object.keys(dataA),
      ...Object.keys(dataB),
    ]);

    for (const key of allKeys) {
      const valA = dataA[key];
      const valB = dataB[key];

      if (valA === undefined) { merged[key] = valB; continue; }
      if (valB === undefined) { merged[key] = valA; continue; }

      // Apply type-specific merge rules
      if (Array.isArray(valA) && Array.isArray(valB)) {
        // Set union for arrays
        merged[key] = [...new Set([...valA, ...valB])];
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        // Max for counters
        if (key.endsWith('Count')) {
          merged[key] = Math.max(valA, valB);
        } else {
          // LWW for other numbers
          merged[key] = this.compareHLC(
            dataA._lastUpdated?.[key] ?? newerTimestamp,
            dataB._lastUpdated?.[key] ?? newerTimestamp
          ) >= 0 ? valA : valB;
        }
      } else if (typeof valA === 'object' && typeof valB === 'object') {
        // Recursive merge for nested objects
        merged[key] = this.mergeData(valA, valB, entityType, newerTimestamp);
      } else {
        // LWW for scalars
        merged[key] = this.compareHLC(
          newerTimestamp,
          newerTimestamp
        ) >= 0 ? valA : valB;
      }
    }

    return merged;
  }

  mergeVectorClocks(a: VectorClock, b: VectorClock): VectorClock {
    const merged = { ...a };
    for (const [did, clock] of Object.entries(b)) {
      merged[did] = Math.max(merged[did] ?? 0, clock);
    }
    return merged;
  }

  /**
   * Compare HLC timestamps.
   * Returns positive if a > b, negative if a < b, 0 if equal.
   */
  compareHLC(a: HLCTimestamp, b: HLCTimestamp): number {
    const [aPhys, aLogical, aNode] = a.split(':');
    const [bPhys, bLogical, bNode] = b.split(':');

    const physDiff = parseInt(aPhys) - parseInt(bPhys);
    if (physDiff !== 0) return physDiff;

    const logicalDiff = parseInt(aLogical) - parseInt(bLogical);
    if (logicalDiff !== 0) return logicalDiff;

    return aNode.localeCompare(bNode);
  }
}

export type CausalRelation = 'before' | 'after' | 'concurrent' | 'equal';
```

---

## 6. Security Model

```typescript
// chain/src/security/SecurityModel.ts

import { DID, EntityId, CID } from '../types/primitives';
import { EventType } from '../types/events';
import { ChainEvent } from '../types/chain-event';
import { EntityState } from '../types/entity-state';

/**
 * VIVIM Security Model
 * 
 * ═══════════════════════════════════════════════════════════
 * AUTHENTICATION
 * ═══════════════════════════════════════════════════════════
 * 
 * Every event is signed with the author's Ed25519 private key.
 * The public key is embedded in the identity:create event and
 * discoverable via DHT at /vivim/identity/{did}.
 * 
 * Verification steps:
 * 1. Extract DID from event.author
 * 2. Resolve public key (local cache → DHT → reject)
 * 3. Verify signature over canonical event bytes
 * 4. Check event.id matches computed CID
 * 
 * ═══════════════════════════════════════════════════════════
 * AUTHORIZATION RULES
 * ═══════════════════════════════════════════════════════════
 */

export interface AuthorizationRule {
  eventType: EventType;
  /** Who can create this event */
  canCreate: AuthCheck;
  /** Additional conditions */
  conditions?: AuthCondition[];
}

export type AuthCheck =
  | 'anyone'           // No restrictions
  | 'entity_owner'     // Must be entity.owner
  | 'entity_controller'// Must be in entity.controllers
  | 'circle_admin'     // Must be admin of the target circle
  | 'circle_moderator' // Must be admin or moderator
  | 'circle_member'    // Must be a member
  | 'self'             // Must target self
  | 'custom';          // Custom function

export interface AuthCondition {
  field: string;
  check: 'exists' | 'not_exists' | 'equals' | 'not_equals' | 'is_member';
  value?: any;
  message: string;
}

/**
 * Complete authorization ruleset
 */
export const AUTHORIZATION_RULES: AuthorizationRule[] = [
  // ─── Identity ──────────────────────────────────────────
  {
    eventType: EventType.IDENTITY_CREATE,
    canCreate: 'anyone',
    conditions: [
      {
        field: 'entityId',
        check: 'not_exists',
        message: 'Identity already exists for this DID',
      },
    ],
  },
  {
    eventType: EventType.IDENTITY_UPDATE,
    canCreate: 'entity_owner',
  },

  // ─── Conversations ────────────────────────────────────
  {
    eventType: EventType.CONVERSATION_CREATE,
    canCreate: 'anyone',
  },
  {
    eventType: EventType.CONVERSATION_UPDATE,
    canCreate: 'entity_owner',
  },
  {
    eventType: EventType.CONVERSATION_DELETE,
    canCreate: 'entity_owner',
  },

  // ─── Messages ─────────────────────────────────────────
  {
    eventType: EventType.MESSAGE_CREATE,
    canCreate: 'anyone', // But must reference own conversation
    conditions: [
      {
        field: 'payload.conversationId',
        check: 'exists',
        message: 'Conversation must exist',
      },
    ],
  },

  // ─── ACUs ─────────────────────────────────────────────
  {
    eventType: EventType.ACU_CREATE,
    canCreate: 'anyone',
    conditions: [
      {
        field: 'payload.sourceConversationId',
        check: 'exists',
        message: 'Source conversation must exist',
      },
    ],
  },
  {
    eventType: EventType.ACU_DERIVE,
    canCreate: 'anyone',
    conditions: [
      {
        field: 'payload.parentAcuIds',
        check: 'exists',
        message: 'Parent ACUs must exist',
      },
    ],
  },
  {
    eventType: EventType.ACU_SHARE,
    canCreate: 'entity_owner', // Can only share your own ACUs
  },
  {
    eventType: EventType.ACU_RATE,
    canCreate: 'anyone', // Anyone can rate public ACUs
  },

  // ─── Memory ───────────────────────────────────────────
  {
    eventType: EventType.MEMORY_CREATE,
    canCreate: 'anyone',
  },
  {
    eventType: EventType.MEMORY_LINK,
    canCreate: 'entity_owner', // Must own at least the source node
  },
  {
    eventType: EventType.MEMORY_UNLINK,
    canCreate: 'entity_owner',
  },

  // ─── Social ───────────────────────────────────────────
  {
    eventType: EventType.SOCIAL_FOLLOW,
    canCreate: 'anyone',
  },
  {
    eventType: EventType.SOCIAL_UNFOLLOW,
    canCreate: 'entity_owner',
  },
  {
    eventType: EventType.SOCIAL_FRIEND_REQUEST,
    canCreate: 'anyone',
  },
  {
    eventType: EventType.SOCIAL_FRIEND_ACCEPT,
    canCreate: 'custom', // Must be the target of the friend request
  },

  // ─── Circles ──────────────────────────────────────────
  {
    eventType: EventType.CIRCLE_CREATE,
    canCreate: 'anyone',
  },
  {
    eventType: EventType.CIRCLE_ADD_MEMBER,
    canCreate: 'circle_moderator',
  },
  {
    eventType: EventType.CIRCLE_REMOVE_MEMBER,
    canCreate: 'circle_admin', // Or self-removal
  },
  {
    eventType: EventType.CIRCLE_UPDATE,
    canCreate: 'circle_admin',
  },
];

/**
 * Authorization enforcement
 */
export class AuthorizationService {
  private rules = new Map<EventType, AuthorizationRule>();

  constructor() {
    for (const rule of AUTHORIZATION_RULES) {
      this.rules.set(rule.eventType, rule);
    }
  }

  async authorize(
    event: ChainEvent,
    entityState: EntityState | null,
    context: AuthContext
  ): Promise<AuthorizationResult> {
    const rule = this.rules.get(event.type);
    if (!rule) {
      return { authorized: false, reason: `No auth rule for ${event.type}` };
    }

    // Check base authorization
    const baseResult = this.checkBaseAuth(rule.canCreate, event, entityState, context);
    if (!baseResult.authorized) return baseResult;

    // Check conditions
    if (rule.conditions) {
      for (const condition of rule.conditions) {
        const condResult = await this.checkCondition(condition, event, entityState, context);
        if (!condResult.authorized) return condResult;
      }
    }

    return { authorized: true };
  }

  private checkBaseAuth(
    check: AuthCheck,
    event: ChainEvent,
    entity: EntityState | null,
    context: AuthContext
  ): AuthorizationResult {
    switch (check) {
      case 'anyone':
        return { authorized: true };

      case 'entity_owner':
        if (!entity) return { authorized: true }; // Creating new entity
        return entity.owner === event.author
          ? { authorized: true }
          : { authorized: false, reason: 'Only entity owner can perform this action' };

      case 'entity_controller':
        if (!entity) return { authorized: true };
        return entity.controllers.includes(event.author)
          ? { authorized: true }
          : { authorized: false, reason: 'Must be entity controller' };

      case 'circle_admin': {
        if (!entity) return { authorized: false, reason: 'Circle not found' };
        const data = entity.data as any;
        const role = data.members?.[event.author]?.role;
        return role === 'admin'
          ? { authorized: true }
          : { authorized: false, reason: 'Must be circle admin' };
      }

      case 'circle_moderator': {
        if (!entity) return { authorized: false, reason: 'Circle not found' };
        const data = entity.data as any;
        const role = data.members?.[event.author]?.role;
        return ['admin', 'moderator'].includes(role)
          ? { authorized: true }
          : { authorized: false, reason: 'Must be circle admin or moderator' };
      }

      case 'circle_member': {
        if (!entity) return { authorized: false, reason: 'Circle not found' };
        const data = entity.data as any;
        return data.members?.[event.author]
          ? { authorized: true }
          : { authorized: false, reason: 'Must be circle member' };
      }

      case 'self':
        return event.entityId === event.author
          ? { authorized: true }
          : { authorized: false, reason: 'Can only modify own data' };

      case 'custom':
        return this.customAuth(event, entity, context);
    }
  }

  private customAuth(
    event: ChainEvent,
    entity: EntityState | null,
    context: AuthContext
  ): AuthorizationResult {
    // Friend accept: must be the target of the request
    if (event.type === EventType.SOCIAL_FRIEND_ACCEPT) {
      if (!entity) return { authorized: false, reason: 'Friend request not found' };
      const data = entity.data as any;
      return data.targetDid === event.author
        ? { authorized: true }
        : { authorized: false, reason: 'Can only accept friend requests sent to you' };
    }

    return { authorized: false, reason: 'Unknown custom auth' };
  }

  private async checkCondition(
    condition: AuthCondition,
    event: ChainEvent,
    entity: EntityState | null,
    context: AuthContext
  ): Promise<AuthorizationResult> {
    const value = this.getNestedValue(event, condition.field);

    switch (condition.check) {
      case 'exists':
        return value != null
          ? { authorized: true }
          : { authorized: false, reason: condition.message };
      case 'not_exists':
        return value == null
          ? { authorized: true }
          : { authorized: false, reason: condition.message };
      case 'equals':
        return value === condition.value
          ? { authorized: true }
          : { authorized: false, reason: condition.message };
      case 'not_equals':
        return value !== condition.value
          ? { authorized: true }
          : { authorized: false, reason: condition.message };
      default:
        return { authorized: true };
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }
}

export interface AuthContext {
  /** Resolver for entity lookups */
  resolveEntity: (id: EntityId) => Promise<EntityState | null>;
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
}

/**
 * ═══════════════════════════════════════════════════════════
 * PRIVACY MODEL
 * ═══════════════════════════════════════════════════════════
 * 
 * Three visibility levels:
 * 
 * 1. PRIVATE (default)
 *    - Stored only locally
 *    - Not broadcast via GossipSub
 *    - Not registered in DHT
 *    - Only synced to user's own devices
 * 
 * 2. CIRCLES
 *    - Encrypted with circle's shared key
 *    - Broadcast to /vivim/circle/{id}/v1 topic
 *    - Only circle members can decrypt
 *    - Registered in DHT under circle's content key
 * 
 * 3. PUBLIC
 *    - Broadcast to /vivim/events/v1
 *    - Registered in DHT for discovery
 *    - Anyone can read
 * 
 * Encryption uses x25519-xsalsa20-poly1305:
 * - Each circle has a shared symmetric key
 * - The symmetric key is encrypted per-member with their x25519 key
 * - Derived from Ed25519 via key conversion
 */
```

---

## 7. Implementation Roadmap

```
═══════════════════════════════════════════════════════════════
PHASE 1: Foundation (Week 1-2)
═══════════════════════════════════════════════════════════════

Files to create:
  packages/chain/
  ├── package.json
  ├── tsconfig.json
  ├── src/
  │   ├── index.ts                          # Public exports
  │   ├── types/
  │   │   ├── primitives.ts                 # CID, DID, etc.
  │   │   ├── events.ts                     # EventType enum
  │   │   ├── chain-event.ts                # ChainEvent interface
  │   │   ├── payloads.ts                   # EventPayloadMap
  │   │   ├── entity-state.ts              # EntityState
  │   │   └── block.ts                      # Block structure
  │   ├── clock/
  │   │   └── HLClock.ts                    # Hybrid Logical Clock
  │   ├── crypto/
  │   │   ├── CIDComputer.ts               # Content addressing
  │   │   ├── EventSigner.ts               # Ed25519 signing
  │   │   └── Canonicalizer.ts             # Deterministic JSON
  │   └── client/
  │       ├── EventFactory.ts              # Event construction
  │       └── EventValidator.ts            # Schema validation

Tasks:
  [ ] Define all TypeScript interfaces
  [ ] Implement HLC (Hybrid Logical Clock)
  [ ] Implement CID computation (multihash)
  [ ] Implement event canonicalization (deterministic JSON)
  [ ] Implement Ed25519 signing/verification
  [ ] Implement EventFactory
  [ ] Implement EventValidator
  [ ] Unit tests for all above

═══════════════════════════════════════════════════════════════
PHASE 2: Storage & State (Week 2-3)
═══════════════════════════════════════════════════════════════

Files to create:
  packages/chain/src/
  ├── storage/
  │   ├── EventStore.ts                    # IndexedDB event storage
  │   ├── EntityStore.ts                   # IndexedDB entity state
  │   ├── IndexedDBAdapter.ts             # Browser storage adapter
  │   └── MemoryAdapter.ts                # In-memory for testing
  ├── handlers/
  │   ├── EventHandlerRegistry.ts         # Handler registration
  │   ├── handlers/
  │   │   ├── ConversationHandlers.ts     # Conversation CRUD
  │   │   ├── MessageHandlers.ts          # Message handlers
  │   │   ├── ACUHandlers.ts              # ACU create/derive/share
  │   │   ├── MemoryHandlers.ts           # Memory graph ops
  │   │   ├── IdentityHandlers.ts         # Identity management
  │   │   ├── SocialHandlers.ts           # Follow/friend
  │   │   └── CircleHandlers.ts           # Circle management
  │   └── index.ts
  └── query/
      └── QueryEngine.ts                  # Entity queries

Tasks:
  [ ] Implement IndexedDB adapter with stores:
      - events: by CID, indexed by author, type, entity, timestamp
      - entities: by EntityId, indexed by type, owner, visibility
      - blocks: by CID, indexed by author, height
      - vector-clocks: singleton
  [ ] Implement all event handlers
  [ ] Implement entity state materialization
  [ ] Implement QueryEngine with filters
  [ ] Integration tests: create events → verify state

═══════════════════════════════════════════════════════════════
PHASE 3: Network Integration (Week 3-4)
═══════════════════════════════════════════════════════════════

Files to create:
  packages/chain/src/
  ├── sync/
  │   ├── SyncManager.ts                  # Sync orchestration
  │   ├── ConflictResolver.ts             # CRDT merge logic
  │   └── PendingEventQueue.ts            # Causal ordering queue
  ├── dht/
  │   ├── DHTSchema.ts                    # Key patterns
  │   └── DHTRegistrationService.ts       # Registration logic
  ├── client/
  │   ├── VivimChainClient.ts             # Main API class
  │   └── BlockProducer.ts                # Local block creation

Files to modify (existing):
  packages/network/src/
  ├── p2p/NetworkNode.ts                   # Add chain-specific topics
  ├── p2p/PubSubService.ts                # Add event serialization
  ├── dht/DHTService.ts                   # Add VIVIM key patterns
  └── index.ts                            # Export new integration points

Tasks:
  [ ] Wire VivimChainClient to existing NetworkNode
  [ ] Implement SyncManager with GossipSub
  [ ] Implement DHT registration and resolution
  [ ] Implement conflict resolution
  [ ] Implement causal ordering (pending event queue)
  [ ] Implement BlockProducer
  [ ] Integration tests: multi-node sync

═══════════════════════════════════════════════════════════════
PHASE 4: Security & Privacy (Week 4-5)
═══════════════════════════════════════════════════════════════

Files to create:
  packages/chain/src/
  ├── security/
  │   ├── SecurityModel.ts                # Auth rules
  │   ├── AuthorizationService.ts         # Auth enforcement
  │   └── EncryptionService.ts            # E2E encryption
  └── privacy/
      ├── VisibilityFilter.ts             # Filter by visibility
      └── CircleKeyManager.ts             # Circle encryption keys

Tasks:
  [ ] Implement authorization service
  [ ] Implement visibility-based event filtering
  [ ] Implement x25519 encryption for circle content
  [ ] Implement circle key distribution
  [ ] Security audit of all event types

═══════════════════════════════════════════════════════════════
PHASE 5: Application Integration (Week 5-6)
═══════════════════════════════════════════════════════════════

Files to modify (existing):
  apps/web/src/
  ├── hooks/
  │   ├── useVivimChain.ts                # React hook for chain client
  │   ├── useEntity.ts                    # Subscribe to entity state
  │   ├── useConversations.ts             # Modify to use chain
  │   └── useACUs.ts                      # Modify to use chain
  ├── stores/
  │   └── chainStore.ts                   # Zustand/Jotai chain state
  └── services/
      └── chainBridge.ts                  # Bridge server API ↔ chain

  server/src/
  ├── services/
  │   └── chainSync.ts                    # Server-side chain node
  └── routes/
      └── chainRoutes.ts                  # REST ↔ chain bridge

Tasks:
  [ ] Create React hooks for chain operations
  [ ] Bridge existing API calls to chain events
  [ ] Implement offline queue (create events while offline)
  [ ] Implement online/offline state transitions
  [ ] Modify conversation import flow to emit chain events
  [ ] Modify ACU extraction to emit chain events
  [ ] End-to-end testing

═══════════════════════════════════════════════════════════════
PHASE 6: Advanced Features (Week 6-8)
═══════════════════════════════════════════════════════════════

  [ ] ACU lineage visualization
  [ ] Memory graph real-time collaboration
  [ ] Circle-scoped knowledge sharing
  [ ] Cross-device sync (same user, multiple browsers)
  [ ] Analytics: contribution metrics, knowledge growth
  [ ] Performance optimization: event batching, lazy loading
  [ ] Migration tool: PostgreSQL data → chain events
```

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         VIVIM Stack                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    React PWA (apps/web)                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │ │
│  │  │useEntity │  │useChain  │  │useACUs   │  │useMemory   │ │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘ │ │
│  └───────┼──────────────┼─────────────┼──────────────┼────────┘ │
│          └──────────────┼─────────────┼──────────────┘          │
│                         ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              VivimChainClient (packages/chain)               │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │ EventFactory  │  │  Handlers    │  │  QueryEngine     │  │ │
│  │  │ (sign, CID)   │  │  (validate,  │  │  (filter, search)│  │ │
│  │  │               │  │   apply)     │  │                  │  │ │
│  │  └──────┬────────┘  └──────┬───────┘  └────────┬─────────┘  │ │
│  │         │                  │                    │            │ │
│  │  ┌──────▼──────────────────▼────────────────────▼─────────┐ │ │
│  │  │              Storage Layer (IndexedDB)                  │ │ │
│  │  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐ │ │ │
│  │  │  │EventStore│  │ EntityStore   │  │  BlockStore      │ │ │ │
│  │  │  └──────────┘  └──────────────┘  └──────────────────┘ │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                           │                                  │ │
│  │  ┌────────────────────────▼───────────────────────────────┐ │ │
│  │  │              Sync Layer                                 │ │ │
│  │  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐ │ │ │
│  │  │  │SyncMgr   │  │ConflictRes.  │  │ PendingQueue     │ │ │ │
│  │  │  └──────────┘  └──────────────┘  └──────────────────┘ │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                              │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │           NetworkNode (packages/network) — EXISTS            │ │
│  │                                                              │ │
│  │  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌────────────┐  │ │
│  │  │ GossipSub │  │  DHT    │  │  WebRTC  │  │ KeyManager │  │ │
│  │  │ (pubsub)  │  │(routing)│  │(transport│  │ (Ed25519)  │  │ │
│  │  └──────────┘  └─────────┘  └──────────┘  └────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                    ┌─────────▼─────────┐                         │
│                    │  P2P Network       │                         │
│                    │  (WebRTC + DHT)    │                         │
│                    └───────────────────┘                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Supporting Modules

### HLClock Implementation

```typescript
// chain/src/clock/HLClock.ts

import { HLCTimestamp, VectorClock, DID } from '../types/primitives';

/**
 * Hybrid Logical Clock
 * 
 * Combines physical time with a logical counter to provide:
 * - Monotonically increasing timestamps
 * - Causal ordering across nodes
 * - Resolution of concurrent events
 * 
 * Format: "physicalMs:logicalCounter:nodeId"
 * Example: "1703980800000:42:did:key:z6Mkf..."
 */
export class HLClock {
  private physicalTime: number = 0;
  private logicalCounter: number = 0;

  constructor(private readonly nodeId: string) {}

  /** Generate a new timestamp (local event) */
  tick(): HLCTimestamp {
    const now = Date.now();
    if (now > this.physicalTime) {
      this.physicalTime = now;
      this.logicalCounter = 0;
    } else {
      this.logicalCounter++;
    }
    return `${this.physicalTime}:${this.logicalCounter}:${this.nodeId}`;
  }

  /** Update clock from received timestamp */
  receive(remoteTimestamp: HLCTimestamp): HLCTimestamp {
    const [remotePhys, remoteLogical] = this.parse(remoteTimestamp);
    const now = Date.now();

    if (now > this.physicalTime && now > remotePhys) {
      this.physicalTime = now;
      this.logicalCounter = 0;
    } else if (remotePhys > this.physicalTime) {
      this.physicalTime = remotePhys;
      this.logicalCounter = remoteLogical + 1;
    } else if (this.physicalTime > remotePhys) {
      this.logicalCounter++;
    } else {
      // Equal physical time
      this.logicalCounter = Math.max(this.logicalCounter, remoteLogical) + 1;
    }

    return `${this.physicalTime}:${this.logicalCounter}:${this.nodeId}`;
  }

  /** Get current timestamp without ticking */
  now(): HLCTimestamp {
    return `${this.physicalTime}:${this.logicalCounter}:${this.nodeId}`;
  }

  /** Compare two HLC timestamps */
  compare(a: HLCTimestamp, b: HLCTimestamp): number {
    const [aPhys, aLogical, aNode] = this.parseAll(a);
    const [bPhys, bLogical, bNode] = this.parseAll(b);

    if (aPhys !== bPhys) return aPhys - bPhys;
    if (aLogical !== bLogical) return aLogical - bLogical;
    return aNode.localeCompare(bNode);
  }

  /** Compare vector clocks and return DIDs where other is ahead */
  compareVectorClocks(
    ours: VectorClock,
    theirs: VectorClock
  ): DID[] {
    const behind: DID[] = [];
    for (const [did, theirVal] of Object.entries(theirs)) {
      if ((ours[did] ?? 0) < theirVal) {
        behind.push(did as DID);
      }
    }
    return behind;
  }

  private parse(ts: HLCTimestamp): [number, number] {
    const parts = ts.split(':');
    return [parseInt(parts[0]), parseInt(parts[1])];
  }

  private parseAll(ts: HLCTimestamp): [number, number, string] {
    const parts = ts.split(':');
    return [parseInt(parts[0]), parseInt(parts[1]), parts.slice(2).join(':')];
  }
}
```

### EventFactory Implementation

```typescript
// chain/src/client/EventFactory.ts

import { ChainEvent } from '../types/chain-event';
import { EventType } from '../types/events';
import { EventPayloadMap } from '../types/payloads';
import { CID, Signature } from '../types/primitives';
import { HLClock } from '../clock/HLClock';

/**
 * EventFactory handles the mechanical parts of event creation:
 * - Canonical serialization
 * - CID computation
 * - Signing
 */
export class EventFactory {
  constructor(
    private readonly keyManager: KeyManager,
    private readonly hlc: HLClock
  ) {}

  /**
   * Takes an unsigned event, computes CID, signs it, returns complete event.
   */
  async finalizeEvent<T extends EventType>(
    unsigned: Omit<ChainEvent<T>, 'id' | 'signature'>
  ): Promise<ChainEvent<T>> {
    // 1. Canonicalize
    const canonical = canonicalize(unsigned);
    const bytes = new TextEncoder().encode(canonical);

    // 2. Compute CID
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = new Uint8Array(hashBuffer);
    const id = `bafy${base32Encode(hashArray)}` as CID;

    // 3. Sign
    const signature = await this.keyManager.sign(
      'vivim-identity',
      bytes
    );

    return {
      ...unsigned,
      id,
      signature,
    } as ChainEvent<T>;
  }
}

/**
 * Deterministic JSON serialization.
 * Keys are sorted alphabetically, no whitespace.
 */
function canonicalize(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj as object).sort();
    const entries = keys
      .filter(k => (obj as any)[k] !== undefined)
      .map(k => `${JSON.stringify(k)}:${canonicalize((obj as any)[k])}`);
    return '{' + entries.join(',') + '}';
  }

  return String(obj);
}

function base32Encode(bytes: Uint8Array): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}
```

---

This completes the full blockchain architecture for VIVIM. The design is:

- **Event-sourced**: Every state change is a signed, immutable event
- **Content-addressed**: Events identified by their CID (hash)
- **Self-authenticating**: Ed25519 signatures prove authorship
- **Causally ordered**: Vector clocks + HLC give total order without consensus
- **CRDT-native**: Conflict resolution is deterministic and automatic
- **Privacy-aware**: Three visibility levels with encryption support
- **Browser-first**: IndexedDB storage, WebRTC transport, no servers required
- **Backwards-compatible**: Integrates with the existing network engine without modifications to its core
