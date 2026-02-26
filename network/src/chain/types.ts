/**
 * VIVIM Chain Core Types
 * Defines the fundamental data structures for the custom blockchain.
 */

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
  
  // Anchor
  ANCHOR                = 'system:anchor',
}

export enum EventScope {
  PUBLIC = 'public',
  CIRCLE = 'circle',
  FRIENDS = 'friends',
  PRIVATE = 'private',
  SELF = 'self',
}

export interface ChainEvent {
  // Core
  id: string;              // CID of the event
  type: EventType;
  author: string;          // DID of the author
  timestamp: string;       // HLC timestamp: "physicalMs:logicalCounter:nodeId"
  
  // Content
  payload: any;
  cid?: string;            // CID of payload if stored separately
  
  // CRDT
  version: number;
  vectorClock: Record<string, number>;
  
  // References
  parentIds: string[];     // CIDs of causal parent events (DAG links)
  entityId?: string;
  prevVersion?: string;
  
  // Auth
  signature: string;
  delegation?: string;     // Verifiable Credential CID
  
  // Discovery
  tags?: string[];
  scope: EventScope;
}

export interface Block {
  id: string;
  number: number;
  timestamp: number;
  events: string[];        // Event CIDs
  merkleRoot: string;
  author: string;
  signature: string;
  prevBlock: string;
  anchor?: {
    chain: string;
    txHash: string;
    blockNumber: number;
  };
}

export enum EntityType {
  CONVERSATION = 'conversation',
  MESSAGE = 'message',
  ACU = 'acu',
  MEMORY = 'memory',
  CIRCLE = 'circle',
  PROFILE = 'profile',
}

export interface EntityState {
  id: string;
  type: EntityType;
  version: number;
  state: any;
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
  eventLog: string[];      // Event CIDs
  vectorClock: Record<string, number>;
}
