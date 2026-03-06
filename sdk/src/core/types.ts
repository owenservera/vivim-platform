/**
 * VIVIM SDK Core Types
 * Fundamental type definitions for the SDK
 */

import type { JSONSchema7 } from 'json-schema';
import type { 
  Memory as MemoryType, 
  Conversation as ConversationNamespace, 
  Group as GroupNamespace 
} from './db-schema.js';
import type { ContentObject as ContentObjectType } from '../nodes/content-node.js';

// Re-export common types for convenience
export type Memory = MemoryType.Memory;
export type Conversation = ConversationNamespace.Index;
export type Circle = GroupNamespace.Circle;
export type ContentObject = ContentObjectType;

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
// WALLET & SMART ACCOUNT TYPES
// ============================================

/**
Wallet types supported by VIVIM
*/
export type WalletType = 'eoa' | 'smart' | 'multi-sig' | 'mpc';

/**
Smart account implementation type
*/
export type SmartAccountType =
  | 'simple'      // SimpleAccount (default)
  | 'safe'        // Gnosis Safe
  | 'kernel'      // Kernel (zerodev)
  | 'light'       // Light Account (Alchemy)
  | 'biconomy'    // Biconomy SCW
  | 'custom';

/**
Smart wallet configuration
*/
export interface SmartWalletConfig {
  /** Owner(s) that control this wallet */
  owners: string[];
  /** Smart account implementation */
  accountType?: SmartAccountType;
  /** EntryPoint version */
  entryPointVersion?: '0.6' | '0.7';
  /** Factory address (for custom accounts) */
  factoryAddress?: string;
  /** Initial salt/nonce for deterministic address */
  salt?: bigint;
}

/**
Smart wallet instance
*/
export interface SmartWallet {
  /** Contract address */
  address: string;
  /** Account implementation type */
  accountType: SmartAccountType;
  /** EntryPoint version */
  entryPointVersion: '0.6' | '0.7';
  /** EntryPoint contract address */
  entryPointAddress: string;
  /** Factory address used for deployment */
  factoryAddress: string;
  /** Whether account is deployed on-chain */
  isDeployed: boolean;
  /** Chain ID */
  chainId: number;
}

/**
UserOperation structure (ERC-4337)
*/
export interface UserOperation {
  /** Smart account address */
  sender: string;
  /** Nonce for replay protection */
  nonce: bigint;
  /** Init code for account creation */
  initCode: string;
  /** Calldata for execution */
  callData: string;
  /** Gas limit for call execution */
  callGasLimit: bigint;
  /** Gas limit for verification */
  verificationGasLimit: bigint;
  /** Gas for pre-verification */
  preVerificationGas: bigint;
  /** Max fee per gas */
  maxFeePerGas: bigint;
  /** Max priority fee per gas */
  maxPriorityFeePerGas: bigint;
  /** Paymaster data */
  paymasterAndData: string;
  /** Signature */
  signature: string;
}

/**
Call data for smart wallet execution
*/
export interface Call {
  /** Target contract address */
  to: string;
  /** Value to send (wei) */
  value?: bigint;
  /** Calldata */
  data?: string;
}

/**
Fee quote for gas sponsorship
*/
export interface FeeQuote {
  /** Token address (0x0 for native) */
  token: string;
  /** Gas price in token */
  gasPrice: bigint;
  /** Estimated gas limit */
  gasLimit: bigint;
  /** Total cost in token */
  totalCost: bigint;
}

/**
Session key for limited authorization
*/
export interface SessionKey {
  /** Key address */
  address: string;
  /** Expiration timestamp */
  expiresAt: number;
  /** Permitted calls */
  permissions: SessionPermission[];
}

/**
Session key permission
*/
export interface SessionPermission {
  /** Target contract */
  to: string;
  /** Function selector (optional, for full contract use '*') */
  functionSelector?: string;
  /** Value limit (optional) */
  valueLimit?: bigint;
}

/**
Account recovery configuration
*/
export interface RecoveryConfig {
  /** Recovery method */
  method: 'social' | 'multisig' | 'time-lock';
  /** Guardian addresses */
  guardians?: string[];
  /** Required signatures to recover */
  threshold?: number;
  /** Delay period in seconds */
  delayPeriod?: number;
  /** Time-lock expiry (for time-lock method) */
  expiry?: number;
}

/**
Linked external account (cross-chain, email, social)
*/
export interface LinkedAccount {
  /** Account type */
  type: 'ethereum' | 'solana' | 'bitcoin' | 'email' | 'social' | 'phone';
  /** Account address or identifier */
  address: string;
  /** Whether link is verified */
  verified: boolean;
  /** Verification timestamp */
  verifiedAt?: number;
  /** Verification proof */
  proof?: string;
}

/**
Complete VIVIM User ID
*/
export interface VivimUserID {
  /** Core DID (did:key) */
  did: string;
  /** Public key (hex) */
  publicKey: string;
  /** Key type */
  keyType: 'Ed25519' | 'secp256k1';

  /** Smart wallet address (if deployed) */
  walletAddress?: string;
  /** Wallet type */
  walletType?: WalletType;
  /** Smart wallet details */
  smartWallet?: SmartWallet;

  /** Linked accounts */
  linkedAccounts: LinkedAccount[];

  /** Recovery configuration */
  recoveryConfig?: RecoveryConfig;

  /** Display name */
  displayName?: string;
  /** Avatar CID */
  avatar?: string;

  /** Creation timestamp */
  createdAt: number;
  /** Last updated */
  updatedAt?: number;
  /** Verification level */
  verificationLevel: number;
}

/**
Wallet creation options
*/
export interface CreateWalletOptions {
  /** Smart wallet configuration */
  smartWallet?: SmartWalletConfig;
  /** Link existing EOA as owner */
  ownerAddress?: string;
  /** Enable gas sponsorship */
  sponsorGas?: boolean;
  /** Recovery configuration */
  recovery?: RecoveryConfig;
}

/**
Wallet event types
*/
export interface WalletEventMap {
  [key: string]: unknown;
  'wallet:created': { wallet: SmartWallet };
  'wallet:deployed': { address: string };
  'wallet:error': { error: Error };
  'recovery:setup': { config: RecoveryConfig };
  'recovery:initiated': { guardian: string };
  'recovery:completed': { newOwner: string };
  'session:created': { key: SessionKey };
  'session:revoked': { key: string };
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

  // Wallet (Smart Account)
  wallet?: {
    /** Bundler RPC URL */
    bundlerUrl?: string;
    /** Paymaster RPC URL */
    paymasterUrl?: string;
    /** Chain ID */
    chainId?: number;
    /** API key */
    apiKey?: string;
    /** EntryPoint version */
    entryPointVersion?: '0.6' | '0.7';
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
  [key: string]: unknown;
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
  removeAllListeners<K extends keyof TEvents>(event?: K): this;
}
