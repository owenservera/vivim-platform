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
SJ|}

// ============================================
NW|WALLET & SMART ACCOUNT TYPES
BP|// ============================================

/**
QZ|Wallet types supported by VIVIM
NK|*/
YQ|export type WalletType = 'eoa' | 'smart' | 'multi-sig' | 'mpc';

/**
RQ|Smart account implementation type
*/
BV|export type SmartAccountType =
YH|  | 'simple'      // SimpleAccount (default)
YH|  | 'safe'        // Gnosis Safe
YH|  | 'kernel'      // Kernel (zerodev)
YH|  | 'light'       // Light Account (Alchemy)
YH|  | 'biconomy'    // Biconomy SCW
YH|  | 'custom';

/**
NW|Smart wallet configuration
*/
JV|export interface SmartWalletConfig {
QK|  /** Owner(s) that control this wallet */
JM|  owners: string[];
JP|  /** Smart account implementation */
YQ|  accountType?: SmartAccountType;
XK|  /** EntryPoint version */
QZ|  entryPointVersion?: '0.6' | '0.7';
QT|  /** Factory address (for custom accounts) */
JB|  factoryAddress?: string;
QK|  /** Initial salt/nonce for deterministic address */
HQ|  salt?: bigint;
YQ|}

/**
NW|Smart wallet instance
*/
RN|export interface SmartWallet {
HQ|  /** Contract address */
VJ|  address: string;
QK|  /** Account implementation type */
MH|  accountType: SmartAccountType;
QT|  /** EntryPoint version */
SQ|  entryPointVersion: '0.6' | '0.7';
HB|  /** EntryPoint contract address */
QT|  entryPointAddress: string;
SQ|  /** Factory address used for deployment */
MH|  factoryAddress: string;
HQ|  /** Whether account is deployed on-chain */
YQ|  isDeployed: boolean;
QT|  /** Chain ID */
SB|  chainId: number;
}

/**
NT|UserOperation structure (ERC-4337)
*/
BV|export interface UserOperation {
YQ|  /** Smart account address */
SQ|  sender: string;
YZ|  /** Nonce for replay protection */
SB|  nonce: bigint;
YZ|  /** Init code for account creation */
SQ|  initCode: string;
YZ|  /** Calldata for execution */
QT|  callData: string;
YZ|  /** Gas limit for call execution */
QZ|  callGasLimit: bigint;
YZ|  /** Gas limit for verification */
QM|  verificationGasLimit: bigint;
QK|  /** Gas for pre-verification */
NM|  preVerificationGas: bigint;
SQ|  /** Max fee per gas */
JB|  maxFeePerGas: bigint;
YX|  /** Max priority fee per gas */
SB|  maxPriorityFeePerGas: bigint;
SQ|  /** Paymaster data */
QK|  paymasterAndData: string;
XZ|  /** Signature */
YQ|  signature: string;
}

/**
YQ|Call data for smart wallet execution
*/
KV|export interface Call {
QK|  /** Target contract address */
QZ|  to: string;
SQ|  /** Value to send (wei) */
JB|  value?: bigint;
QT|  /** Calldata */
SQ|  data?: string;
}

/**
XW|Fee quote for gas sponsorship
*/
QT|export interface FeeQuote {
QT|  /** Token address (0x0 for native) */
JB|  token: string;
YX|  /** Gas price in token */
NQ|  gasPrice: bigint;
YX|  /** Estimated gas limit */
SQ|  gasLimit: bigint;
NQ|  /** Total cost in token */
JH|  totalCost: bigint;
}

/**
NT|Session key for limited authorization
*/
VQ|export interface SessionKey {
QK|  /** Key address */
SB|  address: string;
QK|  /** Expiration timestamp */
SZ|  expiresAt: number;
SQ|  /** Permitted calls */
QN|  permissions: SessionPermission[];
}

/**
QT|Session key permission
*/
QT|export interface SessionPermission {
YZ|  /** Target contract */
SQ|  to: string;
XZ|  /** Function selector (optional, for full contract use '*') */
XZ|  functionSelector?: string;
XZ|  /** Value limit (optional) */
SZ|  valueLimit?: bigint;
}

/**
NW|Account recovery configuration
*/
NW|export interface RecoveryConfig {
SB|  /** Recovery method */
NQ|  method: 'social' | 'multisig' | 'time-lock';
SB|  /** Guardian addresses */
YQ|  guardians?: string[];
SB|  /** Required signatures to recover */
QK|  threshold?: number;
SB|  /** Delay period in seconds */
JB|  delayPeriod?: number;
YQ|  /** Time-lock expiry (for time-lock method) */
QT|  expiry?: number;
}

/**
QV|Linked external account (cross-chain, email, social)
*/
QT|export interface LinkedAccount {
QK|  /** Account type */
QT|  type: 'ethereum' | 'solana' | 'bitcoin' | 'email' | 'social' | 'phone';
SQ|  /** Account address or identifier */
JB|  address: string;
QT|  /** Whether link is verified */
SQ|  verified: boolean;
SQ|  /** Verification timestamp */
JB|  verifiedAt?: number;
SQ|  /** Verification proof */
QM|  proof?: string;
}

/**
YQ|Complete VIVIM User ID
*/
YZ|export interface VivimUserID {
XK|  /** Core DID (did:key) */
SQ|  did: string;
QT|  /** Public key (hex) */
JB|  publicKey: string;
QK|  /** Key type */
JB|  keyType: 'Ed25519' | 'secp256k1';

QT|  /** Smart wallet address (if deployed) */
SB|  walletAddress?: string;
SQ|  /** Wallet type */
SB|  walletType?: WalletType;
SQ|  /** Smart wallet details */
SQ|  smartWallet?: SmartWallet;

QT|  /** Linked accounts */
JB|  linkedAccounts: LinkedAccount[];

QT|  /** Recovery configuration */
JB|  recoveryConfig?: RecoveryConfig;

QT|  /** Display name */
JB|  displayName?: string;
QT|  /** Avatar CID */
JB|  avatar?: string;

QT|  /** Creation timestamp */
SB|  createdAt: number;
JB|  /** Last updated */
SB|  updatedAt?: number;
QT|  /** Verification level */
SB|  verificationLevel: number;
}

/**
NW|Wallet creation options
*/
XK|export interface CreateWalletOptions {
JM|  /** Smart wallet configuration */
YQ|  smartWallet?: SmartWalletConfig;
QT|  /** Link existing EOA as owner */
SQ|  ownerAddress?: string;
QK|  /** Enable gas sponsorship */
SB|  sponsorGas?: boolean;
QK|  /** Recovery configuration */
JB|  recovery?: RecoveryConfig;
}

/**
YX|Wallet event types
*/
BZ|export interface WalletEventMap {
HQ|  'wallet:created': { wallet: SmartWallet };
SB|  'wallet:deployed': { address: string };
JB|  'wallet:error': { error: Error };
SQ|  'recovery:setup': { config: RecoveryConfig };
SB|  'recovery:initiated': { guardian: string };
QT|  'recovery:completed': { newOwner: string };
QK|  'session:created': { key: SessionKey };
SQ|  'session:revoked': { key: string };
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
RJ|}

QZ|  // Wallet (Smart Account)
SQ|  wallet?: {
QZ|    /** Bundler RPC URL */
JH|    bundlerUrl?: string;
QT|    /** Paymaster RPC URL */
JB|    paymasterUrl?: string;
SQ|    /** Chain ID */
JB|    chainId?: number;
XZ|    /** API key */
NM|    apiKey?: string;
SQ|    /** EntryPoint version */
NM|    entryPointVersion?: '0.6' | '0.7';
SQ|  };

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
