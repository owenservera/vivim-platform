/**
 * VIVIM SDK Constants
 */

// Node IDs for built-in nodes
export const BUILTIN_NODES = {
  IDENTITY: '@vivim/node-identity',
  STORAGE: '@vivim/node-storage',
  CONTENT: '@vivim/node-content',
  SOCIAL: '@vivim/node-social',
  AI_CHAT: '@vivim/node-ai-chat',
  MEMORY: '@vivim/node-memory',
  CAPTURE: '@vivim/node-capture',
  ANALYTICS: '@vivim/node-analytics',
} as const;

// Event types
export const SDK_EVENTS = {
  // Identity
  IDENTITY_CREATED: 'identity:created',
  IDENTITY_LOADED: 'identity:loaded',
  IDENTITY_UPDATED: 'identity:updated',
  
  // Nodes
  NODE_LOADED: 'node:loaded',
  NODE_STARTED: 'node:started',
  NODE_STOPPED: 'node:stopped',
  NODE_ERROR: 'node:error',
  
  // Graph
  GRAPH_CHANGED: 'graph:changed',
  GRAPH_VALIDATED: 'graph:validated',
  
  // Network
  NETWORK_CONNECTED: 'network:connected',
  NETWORK_DISCONNECTED: 'network:disconnected',
  NETWORK_ERROR: 'network:error',
  
  // Sync
  SYNC_STARTED: 'sync:started',
  SYNC_PROGRESS: 'sync:progress',
  SYNC_COMPLETED: 'sync:completed',
  SYNC_ERROR: 'sync:error',
} as const;

// Network topics
export const NETWORK_TOPICS = {
  EVENTS_V1: '/vivim/events/v1',
  EVENTS_PUBLIC: '/vivim/events/v1/public',
  SYNC_V1: '/vivim/sync/v1',
  DISCOVERY_V1: '/vivim/discovery/v1',
} as const;

// DHT keys
export const DHT_KEYS = {
  CONTENT_PREFIX: '/vivim/content',
  AUTHORS_PREFIX: '/vivim/authors',
  ENTITIES_PREFIX: '/vivim/entities',
  PROVIDERS_PREFIX: '/vivim/providers',
} as const;

// Default configuration
export const DEFAULT_CONFIG = {
  IDENTITY: {
    AUTO_CREATE: true,
    KEY_TYPE: 'Ed25519' as const,
  },
  NETWORK: {
    ENABLE_P2P: true,
    MIN_CONNECTIONS: 3,
    MAX_CONNECTIONS: 50,
    BOOTSTRAP_TIMEOUT: 30000,
  },
  STORAGE: {
    DEFAULT_LOCATION: 'ipfs' as const,
    ENCRYPTION: true,
  },
  NODES: {
    AUTO_LOAD: true,
  },
  EXTENSIONS: {
    AUTO_LOAD: true,
  },
} as const;

// Error codes
export const ERROR_CODES = {
  IDENTITY_NOT_INITIALIZED: 'IDENTITY_NOT_INITIALIZED',
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  NODE_LOAD_FAILED: 'NODE_LOAD_FAILED',
  NODE_DEPENDENCY_MISSING: 'NODE_DEPENDENCY_MISSING',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  SYNC_ERROR: 'SYNC_ERROR',
} as const;

// Capability IDs
export const CAPABILITIES = {
  IDENTITY_CREATE: 'identity:create',
  IDENTITY_VERIFY: 'identity:verify',
  IDENTITY_SIGN: 'identity:sign',
  
  STORAGE_STORE: 'storage:store',
  STORAGE_RETRIEVE: 'storage:retrieve',
  STORAGE_PIN: 'storage:pin',
  
  CONTENT_CREATE: 'content:create',
  CONTENT_READ: 'content:read',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  CONTENT_SEARCH: 'content:search',
  
  SOCIAL_FOLLOW: 'social:follow',
  SOCIAL_UNFOLLOW: 'social:unfollow',
  SOCIAL_CIRCLE: 'social:circle',
  
  CHAT_CREATE: 'chat:create',
  CHAT_SEND: 'chat:send',
  CHAT_STREAM: 'chat:stream',
  
  MEMORY_CREATE: 'memory:create',
  MEMORY_SEARCH: 'memory:search',
  MEMORY_LINK: 'memory:link',
} as const;

// Version
export const SDK_VERSION = '1.0.0';
