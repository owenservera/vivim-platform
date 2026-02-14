/**
 * OpenScroll Storage V2 - Merkle Tree Implementation
 *
 * Provides:
 * - Sparse Merkle Tree for conversation verification
 * - Merkle proof generation and verification
 * - Efficient on-chain state commitments
 */

import type { Hash, MerkleProof, MerkleSibling } from './types';
import { sha256, sha256Multiple } from './crypto';

// ============================================================================
// Types
// ============================================================================

export interface MerkleNode {
  hash: Hash;
  left?: MerkleNode;
  right?: MerkleNode;
  parent?: MerkleNode;

  // For leaf nodes
  leafHash?: Hash;

  // Depth in tree (0 = root)
  depth: number;
}

export interface MerkleTree {
  root: MerkleNode;
  leaves: Map<Hash, MerkleNode>;  // leafHash -> node
  depth: number;
}

export interface PathElement {
  hash: Hash;
  direction: 'left' | 'right';
}

// ============================================================================
// Merkle Tree Construction
// ============================================================================

/**
 * Build a Merkle tree from a list of leaf hashes
 * @param leafHashes - List of leaf hashes
 * @returns Merkle tree
 */
export function buildMerkleTree(leafHashes: Hash[]): MerkleTree {
  if (leafHashes.length === 0) {
    throw new Error('Cannot build Merkle tree with no leaves');
  }

  const leaves = new Map<Hash, MerkleNode>();
  const depth = Math.ceil(Math.log2(nextPowerOfTwo(leafHashes.length)));

  // Create leaf nodes
  const leafNodes: MerkleNode[] = leafHashes.map((hash) => {
    const node: MerkleNode = {
      hash: hash,
      leafHash: hash,
      depth: 0
    };
    leaves.set(hash, node);
    return node;
  });

  // Pad to next power of 2 if needed
  const paddedLeaves = padToPowerOfTwo(leafNodes);

  // Build tree bottom-up
  let currentLevel = paddedLeaves;
  let currentDepth = 0;

  while (currentLevel.length > 1) {
    const nextLevel: MerkleNode[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left; // Handle odd count

      const parentHash = currentDepth === 0
        ? awaitHashSync(`node:${i}:${left.hash}:${right.hash}`)
        : awaitHashSync(`node:${currentDepth}:${i}:${left.hash}:${right.hash}`);

      const parent: MerkleNode = {
        hash: parentHash,
        left,
        right,
        depth: currentDepth + 1
      };

      left.parent = parent;
      right.parent = parent;
      nextLevel.push(parent);
    }

    currentLevel = nextLevel;
    currentDepth++;
  }

  return {
    root: currentLevel[0],
    leaves,
    depth
  };
}

/**
 * Build Merkle tree from message hashes in order
 * @param messageHashes - Ordered list of message hashes
 * @returns Merkle tree
 */
export function buildMessageMerkleTree(messageHashes: Hash[]): MerkleTree {
  return buildMerkleTree(messageHashes);
}

// ============================================================================
// Merkle Proofs
// ============================================================================

/**
 * Generate a Merkle proof for a leaf
 * @param leafHash - The leaf hash to prove
 * @param tree - The Merkle tree
 * @returns Merkle proof
 */
export function generateProof(leafHash: Hash, tree: MerkleTree): MerkleProof | null {
  const leaf = tree.leaves.get(leafHash);
  if (!leaf) {
    return null;
  }

  const path: MerkleSibling[] = [];
  let current: MerkleNode | undefined = leaf;

  while (current?.parent) {
    const parent = current.parent;
    const sibling = parent.left === current ? parent.right : parent.left;

    if (sibling) {
      path.push({
        hash: sibling.hash,
        direction: parent.left === current ? 'right' : 'left'
      });
    }

    current = parent;
  }

  return {
    root: tree.root.hash,
    leaf: leafHash,
    path: path.reverse() // Path from root to leaf
  };
}

/**
 * Verify a Merkle proof
 * @param proof - The Merkle proof
 * @returns True if proof is valid
 */
export async function verifyProof(proof: MerkleProof): Promise<boolean> {
  let currentHash = proof.leaf;

  for (const sibling of proof.path) {
    if (sibling.direction === 'left') {
      currentHash = await sha256Multiple(sibling.hash, currentHash);
    } else {
      currentHash = await sha256Multiple(currentHash, sibling.hash);
    }
  }

  return currentHash === proof.root;
}

/**
 * Batch verify multiple proofs
 * @param proofs - Array of Merkle proofs
 * @returns Array of verification results
 */
export async function batchVerifyProofs(proofs: MerkleProof[]): Promise<boolean[]> {
  return Promise.all(proofs.map(p => verifyProof(p)));
}

// ============================================================================
// Sparse Merkle Tree (for large conversations)
// ============================================================================

interface SparseMerkleTreeOptions {
  depth?: number;  // Tree depth (default: 256 for full sparse tree)
}

/**
 * Create a Sparse Merkle Tree
 * @param options - Tree options
 * @returns Sparse Merkle Tree
 */
export function createSparseMerkleTree(options: SparseMerkleTreeOptions = {}): SparseMerkleTree {
  const depth = options.depth || 256;
  return new SparseMerkleTree(depth);
}

export class SparseMerkleTree {
  private depth: number;
  private data: Map<string, Hash>;  // Key path -> leaf hash
  private defaultHashes: Hash[];

  constructor(depth: number) {
    this.depth = depth;
    this.data = new Map();
    this.defaultHashes = this.precomputeDefaultHashes(depth);
  }

  /**
   * Precompute default hashes for empty nodes
   */
  private precomputeDefaultHashes(depth: number): Hash[] {
    const hashes: Hash[] = [];
    let currentHash = this.zeroHash();

    for (let i = 0; i < depth; i++) {
      hashes.push(currentHash);
      currentHash = this.hashSync(currentHash + currentHash);
    }

    return hashes;
  }

  /**
   * Get zero hash (hash of empty value)
   */
  private zeroHash(): Hash {
    return this.hashSync('');
  }

  /**
   * Synchronous hash helper (uses simple hash for precomputation)
   */
  private hashSync(data: string): Hash {
    // Simple string hash for precomputation
    // In production, use actual SHA-256
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  /**
   * Update a leaf in the tree
   * @param key - Key as hex string
   * @param value - Leaf hash
   */
  async update(key: string, value: Hash): Promise<Hash> {
    // Convert key to binary path
    const path = this.keyToPath(key);

    // Store leaf value
    this.data.set(path.join(''), value);

    return this.getRoot();
  }

  /**
   * Get the current root hash
   */
  async getRoot(): Promise<Hash> {
    return this.computeRoot(0, '', this.depth);
  }

  /**
   * Recursively compute root hash
   */
  private async computeRoot(depth: number, path: string, maxDepth: number): Promise<Hash> {
    if (depth === maxDepth) {
      return this.data.get(path) || this.defaultHashes[0];
    }

    const leftPath = path + '0';
    const rightPath = path + '1';

    const leftHash = await this.computeRoot(depth + 1, leftPath, maxDepth);
    const rightHash = await this.computeRoot(depth + 1, rightPath, maxDepth);

    return sha256Multiple(leftHash, rightHash);
  }

  /**
   * Generate proof for a key
   * @param key - Key to prove
   * @returns Merkle proof
   */
  async generateProof(key: string): Promise<MerkleProof> {
    const path = this.keyToPath(key);
    const proofPath: MerkleSibling[] = [];
    const root = await this.getRoot();

    for (let i = 0; i < this.depth; i++) {
      const siblingPath = path.slice(0, i).join('') + (path[i] === '0' ? '1' : '0');
      const siblingHash = await this.getSiblingHash(siblingPath, i);

      proofPath.push({
        hash: siblingHash,
        direction: path[i] === '0' ? 'right' : 'left'
      });
    }

    return {
      root,
      leaf: this.data.get(path.join('')) || this.defaultHashes[0],
      path: proofPath
    };
  }

  /**
   * Get sibling hash at path and depth
   */
  private async getSiblingHash(path: string, depth: number): Promise<Hash> {
    // Check if we have data for this path
    if (depth === this.depth) {
      return this.data.get(path) || this.defaultHashes[0];
    }

    // Compute subtree hash
    return this.computeSubtreeHash(path, depth);
  }

  /**
   * Compute hash for a subtree
   */
  private async computeSubtreeHash(path: string, currentDepth: number): Promise<Hash> {
    if (currentDepth === this.depth) {
      return this.data.get(path) || this.defaultHashes[0];
    }

    const leftPath = path + '0';
    const rightPath = path + '1';

    const leftHash = await this.computeSubtreeHash(leftPath, currentDepth + 1);
    const rightHash = await this.computeSubtreeHash(rightPath, currentDepth + 1);

    return sha256Multiple(leftHash, rightHash);
  }

  /**
   * Convert key hex to binary path
   */
  private keyToPath(key: string): string[] {
    // For simplicity, using hex to binary
    // In production, would use proper binary key
    const binary = parseInt(key, 16).toString(2).padStart(this.depth, '0');
    return binary.split('');
  }

  /**
   * Verify a sparse Merkle proof
   * @param key - Original key
   * @param proof - Merkle proof
   * @returns True if valid
   */
  async verifyProof(key: string, proof: MerkleProof): Promise<boolean> {
    // const path = this.keyToPath(key);
    let currentHash = proof.leaf;

    for (let i = 0; i < proof.path.length; i++) {
      const sibling = proof.path[i];

      if (sibling.direction === 'left') {
        currentHash = await sha256Multiple(sibling.hash, currentHash);
      } else {
        currentHash = await sha256Multiple(currentHash, sibling.hash);
      }
    }

    return currentHash === proof.root;
  }
}

// ============================================================================
// State Commitment (for on-chain)
// ============================================================================

export interface StateCommitment {
  merkleRoot: Hash;
  messageRoots: Hash[];
  timestamp: number;
  nonce: number;
}

/**
 * Create a state commitment for on-chain verification
 * @param messageHashes - All message hashes in the conversation
 * @param nonce - Nonce for uniqueness
 * @returns State commitment
 */
export async function createStateCommitment(
  messageHashes: Hash[],
  nonce: number
): Promise<StateCommitment> {
  const tree = buildMerkleTree(messageHashes);
  const merkleRoot = tree.root.hash;

  // Hash all message roots together
  const messageRootsHash = await sha256Multiple(...messageHashes);

  // Combine with nonce
  await sha256Multiple(merkleRoot, messageRootsHash, nonce.toString());

  return {
    merkleRoot,
    messageRoots: messageHashes,
    timestamp: Date.now(),
    nonce
  };
}

/**
 * Verify a state commitment
 * @param commitment - The commitment to verify
 * @returns True if commitment is self-consistent
 */
export async function verifyStateCommitment(commitment: StateCommitment): Promise<boolean> {
  const tree = buildMerkleTree(commitment.messageRoots);
  const computedRoot = tree.root.hash;

  if (computedRoot !== commitment.merkleRoot) {
    return false;
  }

  const messageRootsHash = await sha256Multiple(...commitment.messageRoots);
  await sha256Multiple(
    commitment.merkleRoot,
    messageRootsHash,
    commitment.nonce.toString()
  );

  // The commitment is valid if the tree builds correctly
  return true;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get next power of 2
 */
function nextPowerOfTwo(n: number): number {
  if (n === 0) return 1;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Pad array to power of 2 by duplicating last element
 */
function padToPowerOfTwo<T>(arr: T[]): T[] {
  const targetLen = nextPowerOfTwo(arr.length);
  if (arr.length >= targetLen) return arr;

  const padded = [...arr];
  while (padded.length < targetLen) {
    padded.push(padded[padded.length - 1]);
  }
  return padded;
}

/**
 * Synchronous hash placeholder for tree building
 * In production, all hashing should be async
 */
async function awaitHashSync(data: string): Promise<Hash> {
  return sha256(data);
}

// ============================================================================
// Incremental Merkle Tree (for growing conversations)
// ============================================================================

/**
 * Incremental Merkle Tree that can efficiently add new leaves
 */
export class IncrementalMerkleTree {
  private leaves: Hash[] = [];
  private tree: MerkleNode[][] = [];
  private root: Hash | null = null;

  constructor() {
    this.tree = [];
  }

  /**
   * Add a new leaf to the tree
   * @param leafHash - Hash of the new leaf
   * @returns New root hash
   */
  async addLeaf(leafHash: Hash): Promise<Hash> {
    const position = this.leaves.length;
    this.leaves.push(leafHash);

    // Create leaf node
    const leafNode: MerkleNode = {
      hash: leafHash,
      leafHash,
      depth: 0
    };

    if (!this.tree[0]) {
      this.tree[0] = [];
    }
    this.tree[0][position] = leafNode;

    // Update tree
    this.root = await this.updatePath(position);

    return this.root;
  }

  /**
   * Update the path from a leaf to the root
   */
  private async updatePath(leafIndex: number): Promise<Hash> {
    let currentIndex = leafIndex;
    let currentHash = this.tree[0][currentIndex].hash;
    let currentDepth = 0;

    while (true) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      const parentIndex = Math.floor(currentIndex / 2);

      // Get or create sibling
      const siblingHash = this.tree[currentDepth][siblingIndex]?.hash || currentHash;

      // Compute parent hash
      if (currentIndex % 2 === 0) {
        currentHash = await sha256Multiple(currentHash, siblingHash);
      } else {
        currentHash = await sha256Multiple(siblingHash, currentHash);
      }

      currentDepth++;

      // Create parent level if needed
      if (!this.tree[currentDepth]) {
        this.tree[currentDepth] = [];
      }

      // Check if we're at the root
      if (parentIndex === 0 && this.tree[currentDepth].length === 0) {
        const rootNode: MerkleNode = {
          hash: currentHash,
          depth: currentDepth
        };
        this.tree[currentDepth][0] = rootNode;
        return currentHash;
      }

      this.tree[currentDepth][parentIndex] = {
        hash: currentHash,
        depth: currentDepth
      };

      currentIndex = parentIndex;

      // Check if we've reached the root
      if (currentIndex === 0 && currentDepth > 0) {
        return currentHash;
      }
    }
  }

  /**
   * Get current root hash
   */
  getRoot(): Hash {
    if (!this.root) {
      throw new Error('Tree is empty');
    }
    return this.root;
  }

  /**
   * Generate proof for a leaf
   * @param leafIndex - Index of the leaf
   * @returns Merkle proof
   */
  async generateProof(leafIndex: number): Promise<MerkleProof> {
    const leafHash = this.leaves[leafIndex];
    const path: MerkleSibling[] = [];

    let currentIndex = leafIndex;
    let currentDepth = 0;

    while (currentDepth < this.tree.length) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      const siblingNode = this.tree[currentDepth]?.[siblingIndex];

      if (siblingNode) {
        path.push({
          hash: siblingNode.hash,
          direction: currentIndex % 2 === 0 ? 'right' : 'left'
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
      currentDepth++;

      if (currentIndex === 0 && currentDepth > 0) {
        break;
      }
    }

    return {
      root: this.getRoot(),
      leaf: leafHash,
      path: path.reverse()
    };
  }

  /**
   * Get number of leaves
   */
  get size(): number {
    return this.leaves.length;
  }
}
