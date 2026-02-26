/**
 * VIVIM Storage V2 - Barrel Export
 *
 * Next-generation storage for VIVIM conversations:
 * - Content-addressed DAG
 * - Cryptographic signatures
 * - P2P native
 * - Mobile optimized
 *
 * (0,0) FALLBACK: The ultimate last-resort verification.
 * Mode 0 = PRIVATE, Mode 1 = OPEN.
 * Embedded math. No dependencies. Works forever.
 */

// ========================================================================
// Core API
// ========================================================================

export {
  Storage,
  getStorage,
  resetStorage,
  quickCapture,
  quickExport,
  quickVerify
} from './storage';

export type { StorageConfig, StorageStats } from './storage';

// ========================================================================
// DAG Engine
// ========================================================================

export {
  DAGEngine,
  ConversationBuilder
} from './dag-engine';

export type {
  AppendMessageOptions,
  ForkConversationOptions,
  EditMessageOptions,
  MergeBranchOptions,
  TraversalOptions,
  TraversalResult
} from './dag-engine';

// ========================================================================
// Object Store
// ========================================================================

export {
  IndexedDBObjectStore,
  ConversationStore,
  SnapshotStore
} from './object-store';

export type { ConversationMetadata } from './object-store';

// ========================================================================
// Types
// ========================================================================

export type {
  // Primitives
  Hash,
  IPFS_CID,
  DID,
  Signature,
  ISO8601,
  PublicKey,

  // Content Blocks
  ContentBlock,
  TextBlock,
  CodeBlock,
  ImageBlock,
  MermaidBlock,
  TableBlock,
  MathBlock,
  ToolCallBlock,
  ToolResultBlock,

  // Nodes
  Node,
  BaseNode,
  MessageNode,
  EditNode,
  ForkNode,
  MergeNode,
  AnnotationNode,
  ConversationRoot,
  MessageMetadata,
  ConversationMetadata,

  // Snapshots
  ConversationSnapshot,

  // Merkle
  MerkleProof,
  MerkleSibling,

  // Store
  ObjectStore,
  BatchOperation,

  // Index
  ConversationIndex,
  MessageIndex,
  AuthorIndex,

  // Sync
  SyncMessage,
  WantMessage,
  HaveMessage,
  GetObjectsMessage,
  ObjectsMessage,
  AnnounceMessage,

  // On-Chain
  OnChainAnchor,
  StateCommitment,

  // Import/Export
  ConversationExport,
  LegacyConversationImport,

  // Errors
  StorageError,
  SignatureError,
  NotFoundError,
  ValidationError,
  MerkleProofError
} from './types';

// ========================================================================
// Crypto
// ========================================================================

export {
  // Hashing
  sha256,
  sha256Multiple,
  contentHash,
  canonicalizeContent,

  // Key management
  generateKeyPair,
  generateKeyPairFromSeed,
  getPublicKey,
  generateIdentity,

  // Signing
  sign,
  signNode,
  verify,
  verifyNode,

  // DID
  publicKeyToDID,
  didToPublicKey,

  // Symmetric encryption
  generateSymmetricKey,
  symmetricEncrypt,
  symmetricDecrypt,

  // Asymmetric encryption
  encryptKeyForRecipient,
  decryptKeyFromSender,

  // Key conversion
  ed25519ToX25519PublicKey,
  ed25519ToX25519SecretKey,

  // Utilities
  encodeUTF8,
  decodeUTF8,
  toBase64,
  fromBase64,
  toHex,
  fromHex
} from './crypto';

// ========================================================================
// Merkle Tree
// ========================================================================

export {
  buildMerkleTree,
  generateProof,
  verifyProof,
  batchVerifyProofs,
  createSparseMerkleTree,
  SparseMerkleTree,
  createStateCommitment,
  verifyStateCommitment,
  IncrementalMerkleTree
} from './merkle';

export type {
  MerkleNode,
  MerkleTree,
  PathElement
} from './merkle';

// ========================================================================
// (0,0) Fallback - The Ultimate Last Resort
// ========================================================================

export {
  generateFallback00,
  downloadFallback,
  parseFallback00
} from './fallback-00';

export type { FallbackData } from './fallback-00';

/**
 * (0,0) GUARANTEE:
 *
 * This fallback code:
 * - Has MODE=0 (private) or MODE=1 (open)
 * - Contains embedded SHA-256 math (150 lines)
 * - Contains Ed25519 verify math
 * - Requires NO external dependencies
 * - Works in ANY browser, FOREVER
 *
 * If the platform dies, the company closes, the servers go down:
 * - The fallback HTML file still works
 * - Just open it in a browser
 * - Verification runs automatically
 * - From (0,0), forever
 */
