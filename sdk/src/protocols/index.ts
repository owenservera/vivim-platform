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
