/**
 * VIVIM SDK Protocols Module Exports
 */

// Exit Node Protocol
export {
  ExitNodeService,
  EXIT_NODE_PROTOCOL,
  CLONE_PROTOCOL,
  SYNC_PROTOCOL,
  DEFAULT_EXIT_NODE_CONFIG,
} from './exit-node.js';

export type {
  ExitNodeAdvertisement,
  CloneRegistrationRequest,
  CloneRegistrationResponse,
  StateSnapshot,
  ExitNodeConfig,
  ExitNodeEvents,
  RegisteredClone,
} from './exit-node.js';

// Sync Protocol
export {
  SyncProtocol,
  SYNC_VERSION,
  DEFAULT_SYNC_CONFIG,
} from './sync.js';

export type {
  SyncEndpoints,
  StateUpdate,
  UpdateType,
  SyncStatus,
  SyncConfig,
  SyncEvents,
} from './sync.js';

// Chat Protocol (assistant-ui-VIVIM patterns)
export {
  createMessage,
  extractTextContent,
  extractToolCalls,
  validateMessage,
  serializeMessage,
  deserializeMessage,
} from './chat/index.js';

export type {
  VivimMessage,
  VivimMessageType,
  ContentBlock,
  ContentBlockType,
  BaseContentBlock,
  TextContentBlock,
  ImageContentBlock,
  ToolCallContentBlock,
  ToolResultContentBlock,
  ThinkingContentBlock,
  CodeContentBlock,
  ResourceContentBlock,
  ResourceLinkContentBlock,
  MessageMetadata,
  MessageEnvelopeHeader,
  // MessagePriority, // Use core
  // MessageRole, // Use core
  // MessageDirection, // Use core
  // ToolApprovalStatus, // Use core
} from './chat/index.js';

// Storage Protocol (distributed storage)
export {
  DistributedConversationStorage,
  IPFSStorage,
  createDistributedStorage,
  createIPFSStorage,
} from './storage/index.js';

export type {
  IPFSStorageConfig,
  ACUData,
  QueuedMessage as StorageQueuedMessage,
} from './storage/index.js';

// ActivityPub Protocol (W3C federation standard)
export {
  ActivityPubService,
  ActivityPubHelpers,
  ACTIVITYPUB_CONTEXT,
  createActivityPubService,
} from './activitypub.js';

export type {
  ActivityPubAPI,
  ActivityPubObject,
  ActivityPubActivity,
  ActivityPubActor,
  ActivityPubActorType,
  ActivityPubObjectType,
  ActivityPubActivityType,
  ActivityPubImage,
  ActivityPubTag,
  ActivityPubAttachment,
  ActivityPubCollection,
  ActivityPubCollectionPage,
  ActivityPubInbox,
  ActivityPubOutbox,
  WebFingerResponse,
  WebFingerLink,
} from './activitypub.js';
