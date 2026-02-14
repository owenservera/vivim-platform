/**
 * OpenScroll Storage V2 - Core Types
 *
 * Content-addressed, cryptographically signed, DAG-based conversation storage.
 */

// ============================================================================
// Primitives
// ============================================================================

/** SHA-256 hash as hex string */
export type Hash = string & { readonly __hash: unique symbol };

/** IPFS CID (Content Identifier) - v1 base32 */
export type IPFS_CID = string & { readonly __cid: unique symbol };

/** Decentralized Identifier (did:key method) */
export type DID = string & { readonly __did: unique symbol };

/** Ed25519 signature as base64 string */
export type Signature = string & { readonly __signature: unique symbol };

/** ISO 8601 timestamp string */
export type ISO8601 = string & { readonly __timestamp: unique symbol };

/** Public key base64 */
export type PublicKey = string & { readonly __publicKey: unique symbol };

// ============================================================================
// Privacy States
// ============================================================================

/** Privacy level for conversations and messages */
export type PrivacyLevel = 'local' | 'shared' | 'public';

/**
 * LOCAL: Only on user's device, encrypted at rest
 * SHARED: Encrypted for specific recipients
 * PUBLIC: Published on-chain, permanent
 */
export interface PrivacyState {
  level: PrivacyLevel;
  updatedAt: ISO8601;

  // For SHARED
  recipients?: DID[];
  encryptionKey?: string;  // Encrypted symmetric key (per recipient)

  // For PUBLIC
  onChainAnchors?: OnChainAnchor[];

  // Flags
  allowReshare?: boolean;
  expireAt?: ISO8601;
}

/**
 * On-chain anchor record (for public content)
 */
export interface OnChainAnchor {
  chainId: string;        // 'ethereum', 'optimism', 'base', etc.
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  merkleRoot: Hash;
  ipfsCID?: IPFS_CID;
}

/**
 * Shared envelope for encrypted content
 */
export interface SharedEnvelope {
  contentHash: Hash;      // Public (for verification without decryption)
  recipients: Record<DID, string>;  // DID -> encrypted symmetric key
  ciphertext: string;     // Base64 encrypted content
  nonce: string;          // Base64 nonce
  authorDID: DID;
  signature: Signature;   // Signs the envelope
  createdAt: ISO8601;
  allowReshare?: boolean;
  expireAt?: ISO8601;
}

/**
 * Publish options for making content public
 */
export interface PublishOptions {
  includeMainBranch?: boolean;
  includeForks?: boolean;      // Array of branch names, or true for all
  includeEdits?: boolean;
  includeMetadata?: boolean;
  chain?: string;              // 'optimism' | 'ethereum' | 'base' | 'arbitrum'
  ipfsUpload?: boolean;        // Upload full content to IPFS
}

// ============================================================================
// Content Blocks
// ============================================================================

export type ContentBlock =
  | TextBlock
  | CodeBlock
  | ImageBlock
  | MermaidBlock
  | TableBlock
  | MathBlock
  | ToolCallBlock
  | ToolResultBlock;

export interface TextBlock {
  type: 'text';
  content: string;
}

export interface CodeBlock {
  type: 'code';
  content: string;
  language: string;
}

export interface ImageBlock {
  type: 'image';
  url: string;           // data URI, IPFS CID, or HTTP(S) URL
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface MermaidBlock {
  type: 'mermaid';
  content: string;       // Mermaid diagram source
}

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface MathBlock {
  type: 'math';
  content: string;       // LaTeX expression
  display?: boolean;     // true for block math, false for inline
}

export interface ToolCallBlock {
  type: 'tool_call';
  name: string;
  args: Record<string, unknown>;
  id: string;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_call_id: string;
  content: string | unknown;
  isError?: boolean;
}

// ============================================================================
// Node Types
// ============================================================================

export type NodeType = 'message' | 'edit' | 'fork' | 'merge' | 'annotation' | 'root';

export interface BaseNode {
  id: Hash;
  type: NodeType;
  timestamp: ISO8601;
  author: DID;
  signature: Signature;
}

// ============================================================================
// Message Node
// ============================================================================

export interface MessageNode extends BaseNode {
  type: 'message';

  // Content
  role: 'user' | 'assistant' | 'system';
  content: ContentBlock[];

  // DAG Structure
  parents: Hash[];       // Previous message(s) this responds to
  depth: number;         // Distance from root (for ordering)

  // Content hash (for diff, excludes metadata)
  contentHash: Hash;

  // Optional metadata
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  model?: string;
  provider?: string;
  tokens?: number;
  finishReason?: string;
  [key: string]: unknown;
}

// ============================================================================
// Edit Node
// ============================================================================

export interface EditNode extends BaseNode {
  type: 'edit';

  // Points to the message being edited
  edits: Hash;           // Original message hash

  // New content
  content: ContentBlock[];

  // Preserve original structure
  parents: Hash[];
  depth: number;
  contentHash: Hash;

  editReason?: string;
}

// ============================================================================
// Fork Node
// ============================================================================

export interface ForkNode extends BaseNode {
  type: 'fork';

  // The message being forked from
  forkPoint: Hash;

  // Name for this fork
  branchName: string;

  // Metadata about the fork
  forkReason?: string;
}

// ============================================================================
// Merge Node
// ============================================================================

export interface MergeNode extends BaseNode {
  type: 'merge';

  // The heads being merged
  sources: Hash[];

  // Result becomes parent to next messages
  parents: Hash[];
  depth: number;

  mergeStrategy?: 'recursive' | 'ours' | 'theirs' | 'manual';
}

// ============================================================================
// Annotation Node
// ============================================================================

export interface AnnotationNode extends BaseNode {
  type: 'annotation';

  // The node being annotated
  target: Hash;

  // Annotation content
  annotation: string;
  annotationType?: 'comment' | 'correction' | 'note' | 'warning';
}

// ============================================================================
// Conversation Root
// ============================================================================

export interface ConversationRoot extends BaseNode {
  type: 'root';

  // Identity
  title: string;
  conversationId: Hash;  // Stable ID for this conversation

  // Metadata
  metadata: ConversationMetadata;

  // Initial state
  firstMessage?: Hash;   // Pointer to first message

  // Privacy (default: local)
  privacy?: PrivacyState;
}

export interface ConversationMetadata {
  provider?: string;
  model?: string;
  sourceUrl?: string;
  tags?: string[];
  language?: string;
  [key: string]: unknown;
}

// ============================================================================
// Snapshot (Named State)
// ============================================================================

export interface ConversationSnapshot {
  id: Hash;
  conversationId: Hash;

  // Branch name (like Git)
  name: string;          // e.g., "main", "feature-branch"

  // Current tip
  head: Hash;

  // Metadata
  createdAt: ISO8601;
  author: DID;
  description?: string;

  // For ordering snapshots
  sequence?: number;
  parentSnapshot?: Hash;  // For branch history
}

// ============================================================================
// Merkle Proof
// ============================================================================

export interface MerkleProof {
  root: Hash;            // Root hash of the conversation
  leaf: Hash;            // The message being proved
  path: MerkleSibling[]; // Path from leaf to root
}

export interface MerkleSibling {
  hash: Hash;
  direction: 'left' | 'right';
}

// ============================================================================
// Union Type for All Nodes
// ============================================================================

export type Node =
  | MessageNode
  | EditNode
  | ForkNode
  | MergeNode
  | AnnotationNode
  | ConversationRoot;

// ============================================================================
// Store Types
// ============================================================================

export interface ObjectStore {
  put(node: Node): Promise<Hash>;
  get(hash: Hash): Promise<Node | null>;
  has(hash: Hash): Promise<boolean>;
  delete(hash: Hash): Promise<void>;
  batch(operations: BatchOperation[]): Promise<void>;
  ready(): Promise<unknown>;
}

export type BatchOperation =
  | { type: 'put'; node: Node }
  | { type: 'delete'; hash: Hash };

export function asHash(s: string): Hash {
  return s as Hash;
}

export function asDID(s: string): DID {
  return s as DID;
}

export function asSignature(s: string): Signature {
  return s as Signature;
}

export function asISO8601(s: string): ISO8601 {
  return s as ISO8601;
}

export function asPublicKey(s: string): PublicKey {
  return s as PublicKey;
}

// ============================================================================
// Index Types
// ============================================================================

export interface ConversationIndex {
  conversationId: Hash;
  rootHash: Hash;
  title: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
  messageCount: number;
  snapshotCount: number;
  tags: string[];
}

export interface MessageIndex {
  hash: Hash;
  conversationId: Hash;
  role: 'user' | 'assistant' | 'system';
  author: DID;
  timestamp: ISO8601;
  depth: number;
  contentPreview: string;  // First 200 chars
  hasCode: boolean;
  hasImage: boolean;
}

export interface AuthorIndex {
  did: DID;
  conversationCount: number;
  messageCount: number;
  firstSeen: ISO8601;
  lastActive: ISO8601;
}

// ============================================================================
// Sync Types
// ============================================================================

export interface SyncMessage {
  type: 'want' | 'have' | 'get_objects' | 'objects' | 'announce';
  sender?: DID;
  payload: unknown;
}

export interface WantMessage {
  hashes: Hash[];
}

export interface HaveMessage {
  conversations: Hash[];  // Conversation root hashes
  snapshots: Hash[];
}

export interface GetObjectsMessage {
  hashes: Hash[];
}

export interface ObjectsMessage {
  objects: Node[];
}

export interface AnnounceMessage {
  conversationId: Hash;
  head: Hash;
  timestamp: ISO8601;
}

// ============================================================================
// On-Chain Types
// ============================================================================

export interface OnChainAnchor {
  conversationRoot: Hash;   // Merkle root of conversation
  timestamp: number;        // Unix timestamp
  previousRoot?: Hash;      // Chain to previous state
  metadata?: {
    messageCount: number;
    totalSize: number;
    provider?: string;
  };
}

export interface StateCommitment {
  merkleRoot: Hash;
  messageRoots: Hash[];     // All message node hashes
  signature: Signature;     // Author signature of commitment
  nonce: number;            // For replay protection
}

// ============================================================================
// Import/Export Types
// ============================================================================

export interface ConversationExport {
  format: 'openscroll-v2-dag';
  version: string;

  // Root node
  root: ConversationRoot;

  // All nodes in topological order
  nodes: Node[];

  // Snapshots
  snapshots: ConversationSnapshot[];

  // Merkle root for verification
  merkleRoot: Hash;

  // Export metadata
  exportedAt: ISO8601;
  exporter: DID;
}

export interface LegacyConversationImport {
  format: 'openscroll-v1' | 'chatgpt' | 'claude' | 'gemini';
  data: unknown;
}

// ============================================================================
// Error Types
// ============================================================================

export class StorageError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
  }
}

export class SignatureError extends StorageError {
  constructor(message: string) {
    super('SIGNATURE_ERROR', message);
    this.name = 'SignatureError';
  }
}

export class NotFoundError extends StorageError {
  constructor(message: string) {
    super('NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends StorageError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class MerkleProofError extends StorageError {
  constructor(message: string) {
    super('MERKLE_PROOF_ERROR', message);
    this.name = 'MerkleProofError';
  }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isMessageNode(node: Node): node is MessageNode {
  return node.type === 'message';
}

export function isEditNode(node: Node): node is EditNode {
  return node.type === 'edit';
}

export function isForkNode(node: Node): node is ForkNode {
  return node.type === 'fork';
}

export function isMergeNode(node: Node): node is MergeNode {
  return node.type === 'merge';
}

export function isAnnotationNode(node: Node): node is AnnotationNode {
  return node.type === 'annotation';
}

export function isConversationRoot(node: Node): node is ConversationRoot {
  return node.type === 'root';
}

export function isTextBlock(block: ContentBlock): block is TextBlock {
  return block.type === 'text';
}

export function isCodeBlock(block: ContentBlock): block is CodeBlock {
  return block.type === 'code';
}

export function isImageBlock(block: ContentBlock): block is ImageBlock {
  return block.type === 'image';
}

export function isToolCallBlock(block: ContentBlock): block is ToolCallBlock {
  return block.type === 'tool_call';
}
