/**
 * VIVIM SDK Core Module Exports
 */

// Main SDK class
export { VivimSDK } from './sdk.js';

// Types
export type {
  Identity,
  CreateIdentityOptions,
  LinkedIdentity,
  APINodeDefinition,
  NodeCapability,
  MethodDefinition,
  ExtensionPoint,
  Permission,
  NodeInfo,
  NodeType,
  NodeStatus,
  NodeContext,
  NodeStorage,
  NodeLogger,
  VivimSDKConfig,
  EdgeDefinition,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SDKEvent,
  SDKEventMap,
  JSONSchema,
  DeepPartial,
  EventMap,
  TypedEventEmitter,
  EventHandler,
} from './types.js';

// Constants
export {
  BUILTIN_NODES,
  SDK_EVENTS,
  NETWORK_TOPICS,
  DHT_KEYS,
  DEFAULT_CONFIG,
  ERROR_CODES,
  CAPABILITIES,
  SDK_VERSION,
} from './constants.js';


// Communication Protocol
export {
  CommunicationProtocol,
  createCommunicationProtocol,
  serializeEnvelope,
  deserializeEnvelope,
  PROTOCOL_VERSION,
} from './communication.js';

export type {
  MessagePriority,
  MessageDirection,
  MessageHeader,
  MessageFlags,
  MessageEnvelope,
  CommunicationEventType,
  CommunicationEvent,
  NodeMetrics,
  CommunicationState,
  CommunicationHookType,
  CommunicationHook,
  MiddlewareStage,
  Middleware,
  ProtocolCapability,
  EvolutionEvent,
} from './communication.js';

// Anchor Protocol
export {
  AnchorProtocol,
  TrustLevel,
  DEFAULT_ANCHOR_CONFIG,
} from './anchor.js';

export type {
  AnchorConfig,
  AnchorState,
  AnchorEvents,
  TrustProof,
  ProofType,
  StateManifest,
  ContentManifest,
} from './anchor.js';

// L0 Core Storage
export {
  L0StorageManager,
  createL0StorageManager,
  L0_DOCUMENT_TYPES,
} from './l0-storage.js';

export type {
  L0StorageEntry,
  RoadmapContent,
  RoadmapPhase,
  Deliverable,
  ArchitectureOverview,
  Layer,
  Component,
  ChainOfTrustSpec,
  TrustLevelSpec,
  ContributingGuide,
  Reference,
} from './l0-storage.js';

// Core Database Schema
export {
  SCHEMA_VERSION,
  SCHEMA_NAME,
} from './db-schema.js';

export type {
  Hash,
  DID,
  CID,
  Signature,
  Timestamp,
  VectorClock,
  // Identity
  Identity as IdentityTypes,
  // Content
  Content as ContentTypes,
  // Conversation
  Conversation as ConversationTypes,
  // Social
  Social as SocialTypes,
  // Group
  Group as GroupTypes,
  // Memory
  Memory as MemoryTypes,
  // Chain
  Chain as ChainTypes,
  // ACU
  ACU as ACUTypes,
  // Network
  Network as NetworkTypes,
  // Storage
  Storage as StorageTypes,
  // Error
  Error as ErrorTypes,
} from './db-schema.js';

export { Guards, Cast } from './db-schema.js';

// CRDT Schema
export {
  CRDT_SCHEMA_VERSION,
  CRDTDocumentManager,
} from './crdt-schema.js';

// Database
export {
  CoreDatabase,
  createDatabase,
  DatabaseConfig,
  DEFAULT_DATABASE_CONFIG,
  // Stores
  IdentityStore,
  ConversationStore,
  SocialStore,
  GroupStore,
  MemoryStore,
  ChainStore,
} from './database.js';