/**
 * VIVIM SDK Core Types
 * Fundamental type definitions for the SDK
 */

import type { JSONSchema7 } from 'json-schema';

// ============================================
// IDENTITY TYPES
// ============================================

/**
 * Decentralized Identity
 */
export interface Identity {
  /** Decentralized Identifier (did:key) */
  did: string;
  /** Ed25519 public key (hex) */
  publicKey: string;
  /** Key type */
  keyType: 'Ed25519' | 'secp256k1';
  /** Display name */
  displayName?: string;
  /** Avatar CID */
  avatar?: string;
  /** Creation timestamp */
  createdAt: number;
  /** Verification level */
  verificationLevel: number;
}

/**
 * Identity creation options
 */
export interface CreateIdentityOptions {
  /** Seed for deterministic key generation */
  seed?: Uint8Array;
  /** Display name */
  displayName?: string;
  /** Key type */
  keyType?: 'Ed25519' | 'secp256k1';
}

/**
 * Linked external identity
 */
export interface LinkedIdentity {
  provider: string;
  handle: string;
  verifiedAt: number;
  proof: string;
}

// ============================================
// NODE DEFINITION TYPES
// ============================================

/**
 * API Node Definition
 * The contract that every API node must fulfill
 */
export interface APINodeDefinition<TConfig = unknown> {
  // === Identity ===
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;

  // === Capabilities ===
  capabilities: NodeCapability[];

  // === Dependencies ===
  dependencies: {
    nodes?: string[];
    packages?: string[];
  };

  // === Configuration Schema ===
  configSchema: JSONSchema7;

  // === Events ===
  events: {
    emits: string[];
    listens: string[];
  };

  // === Methods ===
  methods: MethodDefinition[];

  // === Lifecycle ===
  lifecycle: {
    init: string;
    start: string;
    stop: string;
    destroy: string;
  };

  // === Extension Points ===
  extensionPoints?: ExtensionPoint[];

  // === Security ===
  permissions: Permission[];
}

/**
 * Node capability definition
 */
export interface NodeCapability {
  id: string;
  name: string;
  description: string;
  inputSchema?: JSONSchema7;
  outputSchema?: JSONSchema7;
}

/**
 * Method definition
 */
export interface MethodDefinition {
  name: string;
  description: string;
  parameters: JSONSchema7;
  returns: JSONSchema7;
  requiresAuth?: boolean;
  rateLimit?: {
    requests: number;
    window: number;
  };
}

/**
 * Extension point definition
 */
export interface ExtensionPoint {
  id: string;
  name: string;
  description: string;
  interface: string;
}

/**
 * Permission definition
 */
export interface Permission {
  type: 'identity' | 'storage' | 'network' | 'memory' | 'social';
  access: 'read' | 'write' | 'admin';
  scope?: string;
}

// ============================================
// NODE INSTANCE TYPES
// ============================================

/**
 * Node instance info
 */
export interface NodeInfo {
  id: string;
  type: NodeType;
  definition: APINodeDefinition;
  status: NodeStatus;
  loadedAt: number;
}

/**
 * Node types
 */
export type NodeType = 'api' | 'sdk' | 'network' | 'composite';

/**
 * Node status
 */
export type NodeStatus = 'loading' | 'ready' | 'running' | 'stopped' | 'error';

/**
 * Node context provided to nodes
 */
export interface NodeContext {
  /** Get storage for a specific scope */
  getStorage(scope: string): NodeStorage;
  /** Get identity */
  getIdentity(): Identity | null;
  /** Subscribe to events */
  on(event: string, handler: EventHandler): () => void;
  /** Emit event */
  emit(event: string, data: unknown): void;
  /** Get config */
  getConfig(): unknown;
  /** Get another node */
  getNode<T>(nodeId: string): T | null;
  /** Logger */
  log: NodeLogger;
}

/**
 * Node storage interface
 */
export interface NodeStorage {
  get(key: string): Promise<unknown | null>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  query(prefix: string, filter?: Record<string, unknown>): Promise<unknown[]>;
}

/**
 * Event handler type
 */
export type EventHandler = (event: unknown) => void | Promise<void>;

/**
 * Node logger interface
 */
export interface NodeLogger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

// ============================================
// SDK CONFIGURATION TYPES
// ============================================

/**
 * VIVIM SDK Configuration
 */
export interface VivimSDKConfig {
  // Identity
  identity?: {
    did?: string;
    seed?: Uint8Array;
    autoCreate?: boolean;
  };

  // Network
  network?: {
    bootstrapNodes?: string[];
    relays?: string[];
    listenAddresses?: string[];
    enableP2P?: boolean;
  };

  // Storage
  storage?: {
    defaultLocation?: 'local' | 'ipfs' | 'filecoin';
    ipfsGateway?: string;
    encryption?: boolean;
  };

  // Nodes
  nodes?: {
    autoLoad?: boolean;
    registries?: string[];
    trustedPublishers?: string[];
  };

  // Extensions
  extensions?: {
    autoLoad?: boolean;
    directories?: string[];
    registries?: string[];
  };
}

// ============================================
// GRAPH TYPES
// ============================================

/**
 * Network graph edge definition
 */
export interface EdgeDefinition {
  type: 'dependency' | 'data-flow' | 'event' | 'extension';
  direction: 'unidirectional' | 'bidirectional';
  transform?: (data: unknown) => unknown;
  filter?: (data: unknown) => boolean;
}

/**
 * Graph validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  nodeId: string;
  message: string;
  code: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  nodeId: string;
  message: string;
  code: string;
}

// ============================================
// EVENT TYPES
// ============================================

/**
 * SDK Event
 */
export interface SDKEvent {
  type: string;
  source: string;
  timestamp: number;
  payload: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * SDK event map
 */
export interface SDKEventMap {
  'identity:created': { identity: Identity };
  'identity:loaded': { identity: Identity };
  'node:loaded': { node: NodeInfo };
  'node:started': { nodeId: string };
  'node:stopped': { nodeId: string };
  'node:error': { nodeId: string; error: Error };
  'graph:changed': { change: GraphChange };
  'network:connected': { peerId: string };
  'network:disconnected': { peerId: string };
  'sync:started': { entityId: string };
  'sync:completed': { entityId: string };
  'sync:error': { entityId: string; error: Error };
}

/**
 * Graph change type
 */
export type GraphChange = {
  type: 'node-added' | 'node-removed' | 'edge-added' | 'edge-removed';
  nodeId?: string;
  edge?: { from: string; to: string };
};

// ============================================
// UTILITY TYPES
// ============================================

/**
 * JSON Schema type
 */
export type JSONSchema = JSONSchema7;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Event map type helper
 */
export type EventMap = Record<string, unknown>;

/**
 * Typed event emitter
 */
export interface TypedEventEmitter<TEvents extends EventMap> {
  on<K extends keyof TEvents>(event: K, listener: (data: TEvents[K]) => void): this;
  off<K extends keyof TEvents>(event: K, listener: (data: TEvents[K]) => void): this;
  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): boolean;
  once<K extends keyof TEvents>(event: K, listener: (data: TEvents[K]) => void): this;
}
