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