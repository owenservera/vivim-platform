/**
 * VIVIM Core Database Schema Library
 * 
 * Unified schema definitions for the VIVIM decentralized application platform.
 * This library consolidates schemas from:
 * - PWA (storage-v2, types, stores)
 * - Network (chain, CRDT, types)
 * - Server (Prisma, context)
 * - SDK (core, nodes, apps)
 * 
 * @packageDocumentation
 */

// ============================================================================
// PRIMITIVES & BASE TYPES
// ============================================================================

/** SHA-256 hash as hex string */
export type Hash = string & { readonly __hash: unique symbol };

/** IPFS CID (Content Identifier) - v1 base32 */
export type CID = string & { readonly __cid: unique symbol };

/** Decentralized Identifier (did:key method) */
export type DID = string & { readonly __did: unique symbol };

/** Ed25519 signature as base64 string */
export type Signature = string & { readonly __signature: unique symbol };

/** ISO 8601 timestamp string */
export type Timestamp = string & { readonly __timestamp: unique symbol };

/** Public key base64 */
export type PublicKey = string & { readonly __publicKey: unique symbol };

/** Vector clock for CRDT ordering */
export type VectorClock = Record<string, number>;

// ============================================================================
// IDENTITY & AUTHENTICATION
// ============================================================================

export namespace Identity {
  /** User identity with DID */
  export interface User {
    id: string;
    did: DID;
    publicKey: PublicKey;
    displayName?: string;
    avatar?: string;
    email?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    verificationLevel: number;
    lastActiveAt?: Timestamp;
  }

  /** Linked external identity (OAuth, etc.) */
  export interface LinkedIdentity {
    id: string;
    userId: string;
    provider: string;  // 'github', 'google', 'twitter', etc.
    providerId: string;
    handle: string;
    verifiedAt?: Timestamp;
    proof?: string;
    createdAt: Timestamp;
  }

  /** Device/credential registration */
  export interface Device {
    id: string;
    userId: string;
    deviceId: string;
    publicKey: PublicKey;
    name: string;
    platform: 'ios' | 'android' | 'web' | 'desktop';
    lastSeenAt: Timestamp;
    createdAt: Timestamp;
    revokedAt?: Timestamp;
  }

  /** API Key for programmatic access */
  export interface APIKey {
    id: string;
    userId: string;
    name: string;
    keyHash: string;
    permissions: string[];
    expiresAt?: Timestamp;
    lastUsedAt?: Timestamp;
    createdAt: Timestamp;
    revokedAt?: Timestamp;
  }
}

// ============================================================================
// CONTENT BLOCKS (Unified across Storage V2 & Server)
// ============================================================================

export namespace Content {
  /** Base content block interface */
  export interface BaseBlock {
    type: string;
    metadata?: Record<string, unknown>;
  }

  /** Text content block */
  export interface TextBlock extends BaseBlock {
    type: 'text';
    content: string;
  }

  /** Code content block */
  export interface CodeBlock extends BaseBlock {
    type: 'code';
    content: string;
    language: string;
  }

  /** Image content block */
  export interface ImageBlock extends BaseBlock {
    type: 'image';
    url: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
  }

  /** Mermaid diagram block */
  export interface MermaidBlock extends BaseBlock {
    type: 'mermaid';
    content: string;
  }

  /** Table block */
  export interface TableBlock extends BaseBlock {
    type: 'table';
    headers: string[];
    rows: string[][];
  }

  /** LaTeX math block */
  export interface MathBlock extends BaseBlock {
    type: 'math';
    content: string;
    display?: boolean;
  }

  /** Tool call block */
  export interface ToolCallBlock extends BaseBlock {
    type: 'tool_call';
    name: string;
    args: Record<string, unknown>;
    id: string;
  }

  /** Tool result block */
  export interface ToolResultBlock extends BaseBlock {
    type: 'tool_result';
    tool_call_id: string;
    content: string | unknown;
    isError?: boolean;
  }

  /** Union type for all content blocks */
  export type Block =
    | TextBlock
    | CodeBlock
    | ImageBlock
    | MermaidBlock
    | TableBlock
    | MathBlock
    | ToolCallBlock
    | ToolResultBlock;
}

// ============================================================================
// CONVERSATIONS (DAG-based Storage V2)
// ============================================================================

export namespace Conversation {
  /** Privacy level for conversations */
  export type PrivacyLevel = 'local' | 'shared' | 'public';

  /** Privacy state */
  export interface PrivacyState {
    level: PrivacyLevel;
    updatedAt: Timestamp;
    recipients?: DID[];
    encryptionKey?: string;
    onChainAnchors?: ChainAnchor[];
    allowReshare?: boolean;
    expireAt?: Timestamp;
  }

  /** On-chain anchor record */
  export interface ChainAnchor {
    chainId: string;      // 'ethereum', 'optimism', 'base', etc.
    blockNumber: number;
    transactionHash: string;
    timestamp: number;
    merkleRoot: Hash;
    ipfsCID?: CID;
  }

  /** Node types in conversation DAG */
  export type NodeType = 'message' | 'edit' | 'fork' | 'merge' | 'annotation' | 'root';

  /** Base node in conversation DAG */
  export interface BaseNode {
    id: Hash;
    type: NodeType;
    timestamp: Timestamp;
    author: DID;
    signature: Signature;
  }

  /** Message node */
  export interface MessageNode extends BaseNode {
    type: 'message';
    role: 'user' | 'assistant' | 'system';
    content: Content.Block[];
    parents: Hash[];
    depth: number;
    contentHash: Hash;
    metadata?: MessageMetadata;
  }

  /** Message metadata */
  export interface MessageMetadata {
    model?: string;
    provider?: string;
    tokens?: number;
    finishReason?: string;
    [key: string]: unknown;
  }

  /** Edit node */
  export interface EditNode extends BaseNode {
    type: 'edit';
    edits: Hash;
    content: Content.Block[];
    parents: Hash[];
    depth: number;
    contentHash: Hash;
    editReason?: string;
  }

  /** Fork node */
  export interface ForkNode extends BaseNode {
    type: 'fork';
    forkPoint: Hash;
    branchName: string;
    forkReason?: string;
  }

  /** Merge node */
  export interface MergeNode extends BaseNode {
    type: 'merge';
    sources: Hash[];
    parents: Hash[];
    depth: number;
    mergeStrategy?: 'recursive' | 'ours' | 'theirs' | 'manual';
  }

  /** Annotation node */
  export interface AnnotationNode extends BaseNode {
    type: 'annotation';
    target: Hash;
    annotation: string;
    annotationType?: 'comment' | 'correction' | 'note' | 'warning';
  }

  /** Conversation root */
  export interface Root extends BaseNode {
    type: 'root';
    title: string;
    conversationId: Hash;
    metadata: ConversationMetadata;
    firstMessage?: Hash;
    privacy?: PrivacyState;
  }

  /** Conversation metadata */
  export interface ConversationMetadata {
    provider?: string;
    model?: string;
    sourceUrl?: string;
    tags?: string[];
    language?: string;
    [key: string]: unknown;
  }

  /** Conversation snapshot (named state) */
  export interface Snapshot {
    id: Hash;
    conversationId: Hash;
    name: string;
    head: Hash;
    createdAt: Timestamp;
    author: DID;
    description?: string;
    sequence?: number;
    parentSnapshot?: Hash;
  }

  /** Union type for all conversation nodes */
  export type Node =
    | MessageNode
    | EditNode
    | ForkNode
    | MergeNode
    | AnnotationNode
    | Root;

  /** Conversation index for listing */
  export interface Index {
    conversationId: Hash;
    rootHash: Hash;
    title: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    messageCount: number;
    snapshotCount: number;
    tags: string[];
  }

  /** Message index for search */
  export interface MessageIndex {
    hash: Hash;
    conversationId: Hash;
    role: 'user' | 'assistant' | 'system';
    author: DID;
    timestamp: Timestamp;
    depth: number;
    contentPreview: string;
    hasCode: boolean;
    hasImage: boolean;
  }
}

// ============================================================================
// SOCIAL & GRAPHS
// ============================================================================

export namespace Social {
  /** Friend status */
  export type FriendStatus = 'pending' | 'accepted' | 'rejected' | 'blocked' | 'cancelled';

  /** Friend relationship */
  export interface Friend {
    id: string;
    requesterId: string;
    requesterDid: DID;
    requesterDisplayName?: string;
    requesterAvatarUrl?: string;
    addresseeId: string;
    addresseeDid: DID;
    addresseeDisplayName?: string;
    addresseeAvatarUrl?: string;
    status: FriendStatus;
    message?: string;
    requestedAt: Timestamp;
    respondedAt?: Timestamp;
  }

  /** Follow relationship */
  export type FollowStatus = 'pending' | 'active' | 'blocked';

  /** Follow (unidirectional) */
  export interface Follow {
    id: string;
    followerId: string;
    followerDid: DID;
    followerDisplayName?: string;
    followerAvatarUrl?: string;
    followingId: string;
    followingDid: DID;
    followingDisplayName?: string;
    followingAvatarUrl?: string;
    status: FollowStatus;
    notifyOnPost: boolean;
    showInFeed: boolean;
    createdAt: Timestamp;
  }

  /** Follower stats */
  export interface FollowerStats {
    followerCount: number;
    followingCount: number;
  }
}

// ============================================================================
// GROUPS & CIRCLES
// ============================================================================

export namespace Group {
  /** Group type */
  export type GroupType = 'general' | 'study' | 'project' | 'community';

  /** Group visibility */
  export type GroupVisibility = 'public' | 'approval' | 'private';

  /** Group member role */
  export type MemberRole = 'owner' | 'admin' | 'moderator' | 'member';

  /** Group */
  export interface Group {
    id: string;
    ownerId: string;
    ownerDid: DID;
    name: string;
    description?: string;
    avatarUrl?: string;
    type: GroupType;
    visibility: GroupVisibility;
    allowMemberInvite: boolean;
    allowMemberPost: boolean;
    maxMembers?: number;
    memberCount: number;
    postCount: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }

  /** Group member */
  export interface Member {
    id: string;
    groupId: string;
    userId: string;
    userDid: DID;
    displayName: string;
    avatarUrl?: string;
    role: MemberRole;
    notifyOnPost: boolean;
    showInFeed: boolean;
    joinedAt: Timestamp;
  }

  /** Circle (RBAC group) */
  export interface Circle {
    id: string;
    name: string;
    ownerDid: DID;
    visibility: 'public' | 'private' | 'circle';
    sharingPolicy: 'owner-only' | 'moderators' | 'all-members';
    syncMode: 'manual' | 'realtime' | 'periodic';
    encryption: boolean;
    maxMembers?: number;
    memberCount: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
}

// ============================================================================
// MEMORY & KNOWLEDGE
// ============================================================================

export namespace Memory {
  /** Memory type */
  export type MemoryType = 'fact' | 'conversation' | 'entity' | 'skill' | 'preference';

  /** Memory entry */
  export interface Memory {
    id: string;
    userId: string;
    type: MemoryType;
    content: string;
    importance: number;      // 0-1
    lastAccessedAt?: Timestamp;
    accessCount: number;
    tags: string[];
    links: MemoryLink[];
    metadata?: Record<string, unknown>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }

  /** Memory link (association) */
  export interface MemoryLink {
    targetMemoryId: string;
    relationType: string;   // 'related_to', 'part_of', 'caused_by', etc.
    weight: number;         // 0-1
  }

  /** Memory search query */
  export interface MemoryQuery {
    text?: string;
    types?: MemoryType[];
    tags?: string[];
    minImportance?: number;
    limit?: number;
    offset?: number;
  }

  /** Vector embedding reference */
  export interface EmbeddingRef {
    memoryId: string;
    vectorId: string;
    model: string;
    dimensions: number;
    createdAt: Timestamp;
  }
}

// ============================================================================
// CHAIN & EVENTS (Network Layer)
// ============================================================================

export namespace Chain {
  /** Event types */
  export enum EventType {
    // Identity
    IDENTITY_CREATE = 'identity:create',
    IDENTITY_UPDATE = 'identity:update',
    
    // Conversations
    CONVERSATION_CREATE = 'conversation:create',
    CONVERSATION_UPDATE = 'conversation:update',
    CONVERSATION_DELETE = 'conversation:delete',
    
    // Messages
    MESSAGE_CREATE = 'message:create',
    
    // ACU (Atomic Chat Units)
    ACU_CREATE = 'acu:create',
    ACU_DERIVE = 'acu:derive',
    ACU_SHARE = 'acu:share',
    ACU_RATE = 'acu:rate',
    
    // Memory
    MEMORY_CREATE = 'memory:create',
    MEMORY_LINK = 'memory:link',
    MEMORY_UNLINK = 'memory:unlink',
    
    // Social
    SOCIAL_FOLLOW = 'social:follow',
    SOCIAL_UNFOLLOW = 'social:unfollow',
    SOCIAL_FRIEND_REQUEST = 'social:friend_request',
    SOCIAL_FRIEND_ACCEPT = 'social:friend_accept',
    
    // Circles
    CIRCLE_CREATE = 'circle:create',
    CIRCLE_ADD_MEMBER = 'circle:add_member',
    CIRCLE_REMOVE_MEMBER = 'circle:remove_member',
    CIRCLE_UPDATE = 'circle:update',
    
    // Sync
    SYNC_REQUEST = 'sync:request',
    SYNC_RESPONSE = 'sync:response',
    SYNC_VECTOR_EXCHANGE = 'sync:vector_exchange',
    
    // System
    ANCHOR = 'system:anchor',
  }

  /** Event scope */
  export type EventScope = 'public' | 'circle' | 'friends' | 'private' | 'self';

  /** Chain event */
  export interface Event {
    id: CID;
    type: EventType;
    author: DID;
    timestamp: string;           // HLC timestamp
    payload: unknown;
    cid?: CID;
    version: number;
    vectorClock: VectorClock;
    parentIds: string[];
    entityId?: string;
    signature: Signature;
    delegation?: CID;
    tags?: string[];
    scope: EventScope;
  }

  /** Block in the chain */
  export interface Block {
    id: string;
    number: number;
    timestamp: number;
    events: string[];            // Event CIDs
    merkleRoot: string;
    author: DID;
    signature: Signature;
    prevBlock: string;
    anchor?: {
      chain: string;
      txHash: string;
      blockNumber: number;
    };
  }

  /** Entity state */
  export interface EntityState {
    id: string;
    type: EntityType;
    version: number;
    state: unknown;
    createdBy: DID;
    createdAt: number;
    updatedBy: DID;
    updatedAt: number;
    eventLog: string[];
    vectorClock: VectorClock;
  }

  /** Entity types */
  export type EntityType =
    | 'conversation'
    | 'message'
    | 'acu'
    | 'memory'
    | 'circle'
    | 'profile';
}

// ============================================================================
// ACU (Atomic Chat Units)
// ============================================================================

export namespace ACU {
  /** ACU status */
  export type ACUStatus = 'active' | 'completed' | 'archived' | 'shared';

  /** ACU (Atomic Chat Unit) */
  export interface ACU {
    id: string;
    userId: string;
    title: string;
    description?: string;
    sourceUrl?: string;
    provider?: string;
    model?: string;
    status: ACUStatus;
    tags: string[];
    accessCount: number;
    lastAccessedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }

  /** ACU content segment */
  export interface Segment {
    id: string;
    acuId: string;
    content: string;
    contentType: 'text' | 'code' | 'image' | 'mixed';
    order: number;
    metadata?: Record<string, unknown>;
    createdAt: Timestamp;
  }

  /** ACU rating */
  export interface Rating {
    id: string;
    acuId: string;
    userId: string;
    score: number;              // 1-5
    comment?: string;
    createdAt: Timestamp;
  }
}

// ============================================================================
// NETWORK & PEER
// ============================================================================

export namespace Network {
  /** Peer info */
  export interface PeerInfo {
    peerId: string;
    did?: DID;
    multiaddrs: string[];
    protocols: string[];
    status: 'connected' | 'disconnected' | 'connecting';
    lastSeen: Date;
    reputation: number;
  }

  /** Connection state */
  export interface ConnectionState {
    peerId: string;
    transport: 'webrtc' | 'websocket' | 'tcp' | 'quic';
    direction: 'inbound' | 'outbound';
    latency?: number;
    bytesSent: bigint;
    bytesReceived: bigint;
    connectedAt?: Date;
  }

  /** Message types */
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

  /** Network message */
  export interface Message {
    id: string;
    from: string;
    to?: string;
    topic?: string;
    type: MessageType;
    payload: Uint8Array | string;
    timestamp: Date;
    ttl?: number;
    priority: number;
    signature?: Uint8Array;
  }

  /** Sync state */
  export interface SyncState {
    docId: string;
    version: number;
    vectorClock: VectorClock;
    status: 'synced' | 'syncing' | 'offline' | 'conflict';
    lastSyncedAt?: Date;
  }

  /** Node capabilities */
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

  /** Node type */
  export type NodeType = 'bootstrap' | 'relay' | 'indexer' | 'storage' | 'edge' | 'client' | 'self-hosted';
}

// ============================================================================
// SYNC & REPLICATION
// ============================================================================

export namespace Sync {
  /** Sync message types */
  export type SyncMessageType = 'want' | 'have' | 'get_objects' | 'objects' | 'announce';

  /** Sync message */
  export interface SyncMessage {
    type: SyncMessageType;
    sender?: DID;
    payload: unknown;
  }

  /** Want message */
  export interface WantMessage {
    hashes: Hash[];
  }

  /** Have message */
  export interface HaveMessage {
    conversations: Hash[];
    snapshots: Hash[];
  }

  /** Announce message */
  export interface AnnounceMessage {
    conversationId: Hash;
    head: Hash;
    timestamp: Timestamp;
  }

  /** Sync queue item */
  export interface QueueItem {
    id: string;
    docId: string;
    operation: 'create' | 'update' | 'delete';
    data: unknown;
    timestamp: Timestamp;
    retries: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
  }
}

// ============================================================================
// STORAGE & PERSISTENCE
// ============================================================================

export namespace Storage {
  /** Storage provider */
  export type StorageProvider = 'local' | 'ipfs' | 'filecoin' | 's3';

  /** Storage location */
  export interface StorageLocation {
    provider: StorageProvider;
    bucket?: string;
    path: string;
    encryption: boolean;
    createdAt: Timestamp;
  }

  /** Pin info */
  export interface PinInfo {
    cid: CID;
    pinnedAt: Timestamp;
    size: number;
    provider?: string;
  }

  /** Storage deal */
  export interface Deal {
    dealId: string;
    cid: CID;
    provider: string;
    duration: number;
    price: bigint;
    state: 'proposed' | 'published' | 'active' | 'expired' | 'slashed' | 'completed';
    createdAt: Timestamp;
    expiresAt: Timestamp;
  }
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export namespace Error {
  /** Base error */
  export class VivimError extends Error {
    code: string;
    statusCode?: number;

    constructor(code: string, message: string, statusCode?: number) {
      super(message);
      this.name = 'VivimError';
      this.code = code;
      this.statusCode = statusCode;
    }
  }

  /** Signature verification error */
  export class SignatureError extends VivimError {
    constructor(message: string) {
      super('SIGNATURE_ERROR', message, 401);
      this.name = 'SignatureError';
    }
  }

  /** Not found error */
  export class NotFoundError extends VivimError {
    constructor(message: string) {
      super('NOT_FOUND', message, 404);
      this.name = 'NotFoundError';
    }
  }

  /** Validation error */
  export class ValidationError extends VivimError {
    constructor(message: string) {
      super('VALIDATION_ERROR', message, 400);
      this.name = 'ValidationError';
    }
  }

  /** Storage error */
  export class StorageError extends VivimError {
    constructor(message: string) {
      super('STORAGE_ERROR', message, 500);
      this.name = 'StorageError';
    }
  }

  /** Sync error */
  export class SyncError extends VivimError {
    constructor(message: string) {
      super('SYNC_ERROR', message, 500);
      this.name = 'SyncError';
    }
  }
}

// ============================================================================
// TYPE GUARDS & HELPERS
// ============================================================================

export namespace Guards {
  /** Check if block is text */
  export function isTextBlock(block: Content.Block): block is Content.TextBlock {
    return block.type === 'text';
  }

  /** Check if block is code */
  export function isCodeBlock(block: Content.Block): block is Content.CodeBlock {
    return block.type === 'code';
  }

  /** Check if block is image */
  export function isImageBlock(block: Content.Block): block is Content.ImageBlock {
    return block.type === 'image';
  }

  /** Check if conversation node is message */
  export function isMessageNode(node: Conversation.Node): node is Conversation.MessageNode {
    return node.type === 'message';
  }

  /** Check if conversation node is root */
  export function isConversationRoot(node: Conversation.Node): node is Conversation.Root {
    return node.type === 'root';
  }

  /** Check if conversation node is edit */
  export function isEditNode(node: Conversation.Node): node is Conversation.EditNode {
    return node.type === 'edit';
  }

  /** Check if conversation node is fork */
  export function isForkNode(node: Conversation.Node): node is Conversation.ForkNode {
    return node.type === 'fork';
  }

  /** Check if conversation node is merge */
  export function isMergeNode(node: Conversation.Node): node is Conversation.MergeNode {
    return node.type === 'merge';
  }

  /** Check if conversation node is annotation */
  export function isAnnotationNode(node: Conversation.Node): node is Conversation.AnnotationNode {
    return node.type === 'annotation';
  }
}

// ============================================================================
// TYPE CASTING HELPERS
// ============================================================================

export namespace Cast {
  export function asHash(s: string): Hash {
    return s as Hash;
  }

  export function asDID(s: string): DID {
    return s as DID;
  }

  export function asCID(s: string): CID {
    return s as CID;
  }

  export function asSignature(s: string): Signature {
    return s as Signature;
  }

  export function asTimestamp(s: string): Timestamp {
    return s as Timestamp;
  }

  export function asPublicKey(s: string): PublicKey {
    return s as PublicKey;
  }
}

// ============================================================================
// VERSION & EXPORT
// ============================================================================

export const SCHEMA_VERSION = '1.0.0';
export const SCHEMA_NAME = 'VIVIM Core Database Schema';

export type SchemaVersion = typeof SCHEMA_VERSION;
