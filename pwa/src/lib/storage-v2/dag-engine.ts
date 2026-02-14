/**
 * OpenScroll Storage V2 - DAG Engine
 *
 * Core operations for manipulating the conversation DAG:
 * - Append messages
 * - Fork conversations
 * - Edit messages
 * - Merge branches
 * - Traverse and query
 */

import type {
  Hash,
  Node,
  MessageNode,
  EditNode,
  ForkNode,
  MergeNode,
  ConversationRoot,
  ConversationSnapshot,
  ContentBlock,
  Signature,
  DID,
  ISO8601,
  MerkleProof
} from './types';
import {
  contentHash,
  canonicalizeContent,
  signNode,
  verifyNode,
  publicKeyToDID,
  generateIdentity,
  sha256Multiple,
  getPublicKey
} from './crypto';
import { log } from '../logger';
import { IndexedDBObjectStore, SnapshotStore } from './object-store';
import { buildMerkleTree, generateProof, verifyProof } from './merkle';

// ============================================================================
// Types
// ============================================================================

export interface AppendMessageOptions {
  conversationId: Hash;
  role: 'user' | 'assistant' | 'system';
  content: ContentBlock[];
  parentIds: Hash[];
  metadata?: Record<string, unknown>;
  secretKey: string;
}

export interface ForkConversationOptions {
  conversationId: Hash;
  fromMessageId: Hash;
  branchName: string;
  forkReason?: string;
  secretKey: string;
}

export interface EditMessageOptions {
  messageId: Hash;
  newContent: ContentBlock[];
  editReason?: string;
  secretKey: string;
}

export interface MergeBranchOptions {
  conversationId: Hash;
  branchHead1: Hash;
  branchHead2: Hash;
  mergeStrategy?: 'recursive' | 'ours' | 'theirs' | 'manual';
  secretKey: string;
}

export interface TraversalOptions {
  maxDepth?: number;
  includeEdits?: boolean;
  includeForks?: boolean;
  includeMerges?: boolean;
}

export interface TraversalResult {
  messages: MessageNode[];
  edits: EditNode[];
  forks: ForkNode[];
  merges: MergeNode[];
  path: Hash[];  // Ordered path from root to tip
}

// ============================================================================
// DAG Engine
// ============================================================================

export class DAGEngine {
  private objectStore: IndexedDBObjectStore;
  private snapshotStore: SnapshotStore;

  constructor(objectStore: IndexedDBObjectStore) {
    this.objectStore = objectStore;
    this.snapshotStore = new SnapshotStore(objectStore);
  }

  // ========================================================================
  // Core Operations
  // ========================================================================

  /**
   * Append a new message to a conversation
   * @param options - Append options
   * @returns The new message node
   */
  async appendMessage(options: AppendMessageOptions): Promise<MessageNode> {
    const { conversationId, role, content, parentIds, metadata, secretKey } = options;
    log.dag.info(`Appending ${role} message to conversation ${conversationId.slice(0, 10)}...`);

    // Get parent nodes to compute depth
    const parents = await this.objectStore.getMany(parentIds);
    let maxDepth = 0;

    for (const parent of parents.values()) {
      if (parent && 'depth' in parent) {
        maxDepth = Math.max(maxDepth, (parent as MessageNode).depth);
      }
    }

    // Compute content hash
    const contentHashValue = await contentHash(role, content, new Date().toISOString());

    // Generate ID
    const timestamp = new Date().toISOString() as ISO8601;
    // FIX: Use getPublicKey helper instead of manual slicing
    const author = publicKeyToDID(getPublicKey(secretKey)) as DID;

    const id = (await sha256Multiple(
      author,
      role,
      canonicalizeContent(content),
      timestamp,
      ...parentIds
    )) as Hash;

    log.dag.debug(`Node Generated - ID: ${id.slice(0, 10)}..., Author: ${author.slice(0, 15)}...`);

    // Create message node
    const message: MessageNode = {
      id,
      type: 'message',
      role,
      content,
      parents: parentIds,
      depth: maxDepth + 1,
      timestamp,
      author,
      contentHash: contentHashValue as Hash,
      metadata,
      signature: '' as Signature
    };

    // Sign the node
    message.signature = await signNode(message as any as Record<string, unknown>, secretKey);
    log.dag.debug(`Node Signed. Signature: ${message.signature.slice(0, 20)}...`);

    // Store the node
    await this.objectStore.put(message);
    log.dag.info(`✓ Node Stored: ${id.slice(0, 10)}...`);

    // Update conversation's head if this is the main branch
    await this.updateConversationHead(conversationId, id);

    return message;
  }

  /**
   * Fork a conversation from a specific message
   * @param options - Fork options
   * @returns The new fork node and snapshot
   */
  async forkConversation(options: ForkConversationOptions): Promise<{
    forkNode: ForkNode;
    snapshot: ConversationSnapshot;
  }> {
    const { conversationId, fromMessageId, branchName, forkReason, secretKey } = options;

    // Verify the message exists
    const fromMessage = await this.objectStore.get(fromMessageId);
    if (!fromMessage) {
      throw new Error(`Message ${fromMessageId} not found`);
    }

    // Create fork node
    const timestamp = new Date().toISOString() as ISO8601;
    const author = publicKeyToDID(getPublicKey(secretKey)) as DID;
    const id = (await sha256Multiple('fork', fromMessageId, branchName, timestamp)) as Hash;

    const forkNode: ForkNode = {
      id,
      type: 'fork',
      forkPoint: fromMessageId,
      branchName,
      forkReason,
      timestamp,
      author,
      signature: '' as Signature
    };

    forkNode.signature = await signNode(forkNode as any as Record<string, unknown>, secretKey);

    // Store fork node
    await this.objectStore.put(forkNode);

    // Create snapshot for the new branch
    const snapshot = await this.snapshotStore.create(
      conversationId,
      branchName,
      forkNode.id,
      author,
      `Forked from ${fromMessageId}`
    );

    return { forkNode, snapshot };
  }

  /**
   * Edit an existing message (creates new version)
   * @param options - Edit options
   * @returns The new edit node
   */
  async editMessage(options: EditMessageOptions): Promise<EditNode> {
    const { messageId, newContent, editReason, secretKey } = options;

    // Get original message
    const original = await this.objectStore.get(messageId);
    if (!original || original.type !== 'message') {
      throw new Error(`Message ${messageId} not found or not a message node`);
    }

    const originalMessage = original as MessageNode;

    // Compute new content hash
    const contentHashValue = (await contentHash(
      originalMessage.role,
      newContent,
      new Date().toISOString()
    )) as Hash;

    // Create edit node
    const timestamp = new Date().toISOString() as ISO8601;
    const author = publicKeyToDID(getPublicKey(secretKey)) as DID;
    const id = (await sha256Multiple('edit', messageId, contentHashValue, timestamp)) as Hash;

    const editNode: EditNode = {
      id,
      type: 'edit',
      edits: messageId,
      content: newContent,
      parents: originalMessage.parents,
      depth: originalMessage.depth,
      contentHash: contentHashValue,
      editReason,
      timestamp,
      author,
      signature: '' as Signature
    };

    editNode.signature = await signNode(editNode as any as Record<string, unknown>, secretKey);

    // Store edit node
    await this.objectStore.put(editNode);

    return editNode;
  }

  /**
   * Merge two branches
   * @param options - Merge options
   * @returns The merge node
   */
  async mergeBranches(options: MergeBranchOptions): Promise<MergeNode> {
    const { conversationId, branchHead1, branchHead2, mergeStrategy, secretKey } = options;

    // Find lowest common ancestor
    await this.findCommonAncestor(branchHead1, branchHead2);

    // Get both head nodes
    const head1 = await this.objectStore.get(branchHead1);
    const head2 = await this.objectStore.get(branchHead2);

    if (!head1 || !head2) {
      throw new Error('One or both branch heads not found');
    }

    // Determine depth
    const depth1 = 'depth' in head1 ? head1.depth : 0;
    const depth2 = 'depth' in head2 ? head2.depth : 0;
    const depth = Math.max(depth1, depth2) + 1;

    // Create merge node
    const timestamp = new Date().toISOString() as ISO8601;
    const author = publicKeyToDID(getPublicKey(secretKey)) as DID;
    const id = (await sha256Multiple('merge', branchHead1, branchHead2, timestamp)) as Hash;

    const mergeNode: MergeNode = {
      id,
      type: 'merge',
      sources: [branchHead1, branchHead2],
      parents: [branchHead1, branchHead2],
      depth,
      mergeStrategy,
      timestamp,
      author,
      signature: '' as Signature
    };

    mergeNode.signature = await signNode(mergeNode as any as Record<string, unknown>, secretKey);

    // Store merge node
    await this.objectStore.put(mergeNode);

    // Update main branch head
    await this.updateConversationHead(conversationId, mergeNode.id);

    return mergeNode;
  }

  // ========================================================================
  // Traversal & Query
  // ========================================================================

  /**
   * Traverse from a node back to the root
   * @param startHash - Starting node hash
   * @param options - Traversal options
   * @returns Traversal result
   */
  async traverse(
    startHash: Hash,
    options: TraversalOptions = {}
  ): Promise<TraversalResult> {
    const {
      maxDepth = Infinity,
      includeEdits = true,
      includeForks = true,
      includeMerges = true
    } = options;

    const messages: MessageNode[] = [];
    const edits: EditNode[] = [];
    const forks: ForkNode[] = [];
    const merges: MergeNode[] = [];
    const path: Hash[] = [];
    const visited = new Set<Hash>();

    let current = await this.objectStore.get(startHash);

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.push(current.id);

      switch (current.type) {
        case 'message':
          messages.push(current as MessageNode);
          break;
        case 'edit':
          if (includeEdits) edits.push(current as EditNode);
          break;
        case 'fork':
          if (includeForks) forks.push(current as ForkNode);
          break;
        case 'merge':
          if (includeMerges) merges.push(current as MergeNode);
          break;
      }

      // Check depth limit
      if ('depth' in current && (current as any).depth >= maxDepth) {
        break;
      }

      // Get parents (follow first parent for main path)
      const parents = (current as any).parents || [];
      if (parents.length === 0) {
        break;
      }

      // Get first parent for main traversal
      current = await this.objectStore.get(parents[0]);
    }

    return {
      messages: messages.reverse(),
      edits: edits.reverse(),
      forks: forks.reverse(),
      merges: merges.reverse(),
      path: path.reverse()
    };
  }

  /**
   * Get all messages in a conversation
   * @param conversationId - Conversation ID
   * @returns Array of messages in order
   */
  async getConversationMessages(conversationId: Hash): Promise<MessageNode[]> {
    console.debug(`[DAG] Retrieving messages for conversation ${conversationId.slice(0, 10)}...`);
    
    // 1. Get the main snapshot to find the head
    const snapshot = await this.snapshotStore.getMainBranch(conversationId);
    
    if (!snapshot) {
      console.warn(`[DAG] No main snapshot found for conversation ${conversationId.slice(0, 10)}. Fallback to root.`);
      const root = await this.objectStore.get(conversationId);
      if (!root || root.type !== 'root') return [];
      // If only root exists, there are no messages
      return [];
    }

    console.debug(`[DAG] Found head: ${snapshot.head.slice(0, 10)}...`);

    // 2. Traverse backward from head to root
    const result = await this.traverse(snapshot.head);
    console.debug(`[DAG] Traversal complete. Found ${result.messages.length} messages.`);
    
    return result.messages;
  }

  /**
   * Breadth-first traversal from root
   * @param startHash - Starting node hash
   * @returns All reachable nodes
   */
  async traversalBFS(startHash: Hash): Promise<Node[]> {
    const visited = new Set<Hash>();
    const queue: Hash[] = [startHash];
    const nodes: Node[] = [];

    while (queue.length > 0) {
      const hash = queue.shift()!;

      if (visited.has(hash)) continue;
      visited.add(hash);

      const node = await this.objectStore.get(hash);
      if (!node) continue;

      nodes.push(node);

      // Add children (inverse of parents)
      // This requires an index; for now, use parents as forward links
      // since we store DAG in reverse (message points to previous)
      const parents = (node as any).parents;
      if (parents) {
        for (const parentHash of parents) {
          if (!visited.has(parentHash)) {
            queue.push(parentHash as Hash);
          }
        }
      }
    }

    return nodes;
  }

  /**
   * Get children of a node (nodes that have this node as parent)
   * @param parentHash - Parent node hash
   * @returns Child nodes
   */
  async getChildren(): Promise<Node[]> {
    // This requires a reverse index
    // For now, return empty array
    // In production, would use an index store
    return [];
  }

  // ========================================================================
  // Analysis & Verification
  // ========================================================================
  
  /**
   * ZERO-TRUST WITNESS: Validate extracted data before storage
   * Re-calculates all deterministic hashes locally to detect server-side tampering.
   */
  async validateInboundExtraction(extraction: {
    messages: Array<{
      role: string;
      content: any;
      timestamp?: string;
      id?: string;
      contentHash?: string;
    }>;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    for (let i = 0; i < extraction.messages.length; i++) {
       const msg = extraction.messages[i];
       const role = msg.role;
       // MATCH SERVER LOGIC: The server normalizes content into an array of objects
       // We must replicate that exact structure before hashing
       const rawContent = msg.content || (msg as any).parts;
       const content = Array.isArray(rawContent) 
          ? rawContent 
          : [{ type: 'text', content: String(rawContent || '') }];

       // Use message's existing timestamp if available, fallback to extraction time or now
       const timestamp = msg.timestamp || (extraction as any).createdAt || new Date().toISOString();
       
       // 1. Re-calculate Content Hash using exactly the same logic as the server
       const localContentHash = await contentHash(role, content, timestamp);
       
       if (msg.contentHash && msg.contentHash !== localContentHash) {
          const { canonicalizeContent } = await import('./crypto');
          console.error(`[DAG] Hash Mismatch Debug for Message [${i}]:`);
          console.error(`- Server Hash: ${msg.contentHash}`);
          console.error(`- Client Hash: ${localContentHash}`);
          console.error(`- Role: '${role}'`);
          console.error(`- Timestamp: '${timestamp}'`);
          console.error(`- Canonical Content: ${canonicalizeContent(content)}`);
          
          errors.push(`Message [${i}] Content Hash Mismatch: Engine=${msg.contentHash}, Witness=${localContentHash}`);
       }

       // 2. verify Merkle integrity if possible (future: check against server-provided Merkle root)
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Find the lowest common ancestor of two nodes
   * @param hash1 - First node hash
   * @param hash2 - Second node hash
   * @returns LCA hash or null
   */
  async findCommonAncestor(hash1: Hash, hash2: Hash): Promise<Hash | null> {
    const ancestors1 = new Set<Hash>();
    let current = await this.objectStore.get(hash1);

    while (current) {
      ancestors1.add(current.id);
      const parents = (current as any).parents;
      if (parents && parents.length > 0) {
        current = await this.objectStore.get(parents[0]);
      } else {
        break;
      }
    }

    current = await this.objectStore.get(hash2);
    while (current) {
      if (ancestors1.has(current.id)) {
        return current.id;
      }
      const parents = (current as any).parents;
      if (parents && parents.length > 0) {
        current = await this.objectStore.get(parents[0]);
      } else {
        break;
      }
    }

    return null;
  }

  /**
   * Verify all signatures in a conversation
   * @param conversationId - Conversation ID
   * @returns Verification results
   */
  async verifyConversation(conversationId: Hash): Promise<{
    valid: boolean;
    nodes: { hash: Hash; valid: boolean }[];
  }> {
    const nodes = await this.traversalBFS(conversationId);
    const results = await Promise.all(
      nodes.map(async node => ({
        hash: node.id,
        valid: await verifyNode(node as any as Record<string, unknown>)
      }))
    );

    const allValid = results.every(r => r.valid);

    return {
      valid: allValid,
      nodes: results
    };
  }

  /**
   * Generate Merkle proof for a message
   * @param conversationId - Conversation ID
   * @param messageHash - Message hash
   * @returns Merkle proof or null
   */
  async generateMerkleProof(
    conversationId: Hash,
    messageHash: Hash
  ): Promise<MerkleProof | null> {
    const messages = await this.getConversationMessages(conversationId);
    const messageHashes = messages.map(m => m.id);

    const tree = buildMerkleTree(messageHashes);
    return generateProof(messageHash, tree);
  }

  /**
   * Verify a Merkle proof
   * @param proof - Merkle proof
   * @returns True if valid
   */
  async verifyMerkleProof(proof: MerkleProof): Promise<boolean> {
    return verifyProof(proof);
  }

  // ========================================================================
  // Private Helpers
  // ========================================================================

  /**
   * Update conversation head in index
   */
  private async updateConversationHead(conversationId: Hash, newHead: Hash): Promise<void> {
    // Update the main snapshot
    const mainSnapshot = await this.snapshotStore.getMainBranch(conversationId);

    if (mainSnapshot) {
      const db = await this.objectStore.ready();
      const tx = db.transaction('snapshots', 'readwrite');
      const store = tx.objectStore('snapshots');

      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          ...mainSnapshot,
          head: newHead
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

// ============================================================================
// Conversation Builder (Helper for creating conversations)
// ============================================================================

export class ConversationBuilder {
  private engine: DAGEngine;
  private root: ConversationRoot | null = null;
  private secretKey: string;
  private did: string;
  private currentHead: Hash | null = null;

  constructor(engine: DAGEngine, secretKey?: string) {
    this.engine = engine;
    log.storage.info('Initializing ConversationBuilder...');
    if (secretKey) {
      this.secretKey = secretKey;
      this.did = publicKeyToDID(getPublicKey(secretKey));
      log.storage.debug(`Using existing identity: ${this.did.slice(0, 15)}...`);
    } else {
      const identity = generateIdentity();
      this.secretKey = identity.keyPair.secretKey;
      this.did = identity.did;
      log.storage.debug(`Generated new identity: ${this.did.slice(0, 15)}...`);
    }
  }

  /**
   * Start a new conversation
   */
  async start(title: string, metadata?: Record<string, unknown>): Promise<ConversationBuilder> {
    const { sha256 } = await import('./crypto');
    log.storage.info(`Starting conversation: "${title}"`);

    const conversationId = (await sha256(`${title}:${Date.now()}:${this.did}`)) as Hash;
    log.storage.debug(`Root ID: ${conversationId.slice(0, 10)}...`);

    this.root = {
      id: conversationId,
      type: 'root',
      timestamp: new Date().toISOString() as ISO8601,
      author: this.did as DID,
      signature: '' as Signature,
      title,
      conversationId,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString()
      }
    };

    log.storage.debug('Signing root node...');
    this.root.signature = await signNode(this.root as any as Record<string, unknown>, this.secretKey);
    await (this.engine as any)['objectStore'].put(this.root);
    log.storage.info(`✓ Root Stored: ${conversationId.slice(0, 10)}...`);

    // Create main snapshot
    const snapshotStore = new SnapshotStore((this.engine as any)['objectStore']);
    await snapshotStore.create(
      conversationId,
      'main',
      conversationId,  // Points to root initially
      this.did as DID
    );
    log.storage.debug('Main snapshot created.');

    return this;
  }

  /**
   * Add a user message
   */
  async addUserMessage(content: string | ContentBlock[]): Promise<Hash> {
    if (!this.root) throw new Error('Conversation not started');
    log.dag.info('Adding user message...');

    const contentBlocks = (typeof content === 'string'
      ? [{ type: 'text', content }]
      : content) as ContentBlock[];

    const parentIds = this.currentHead ? [this.currentHead] : [this.root.id];

    const message = await this.engine.appendMessage({
      conversationId: this.root.conversationId,
      role: 'user',
      content: contentBlocks,
      parentIds,
      secretKey: this.secretKey
    });

    this.currentHead = message.id;
    return message.id;
  }

  /**
   * Add an assistant message
   */
  async addAssistantMessage(
    content: string | ContentBlock[],
    metadata?: Record<string, unknown>
  ): Promise<Hash> {
    if (!this.root) throw new Error('Conversation not started');
    log.dag.info('Adding assistant message...');

    const contentBlocks = (typeof content === 'string'
      ? [{ type: 'text', content }]
      : content) as ContentBlock[];

    const parentIds = this.currentHead ? [this.currentHead] : [this.root.id];

    const message = await this.engine.appendMessage({
      conversationId: this.root.conversationId,
      role: 'assistant',
      content: contentBlocks,
      parentIds,
      metadata,
      secretKey: this.secretKey
    });

    this.currentHead = message.id;
    return message.id;
  }

  /**
   * Get the conversation root
   */
  getRoot(): ConversationRoot | null {
    return this.root;
  }

  /**
   * Get the current head
   */
  getHead(): Hash | null {
    return this.currentHead;
  }

  /**
   * Import from V1 format
   */
  async importFromV1(v1Data: {
    title: string;
    provider: string;
    messages: Array<{ role: string; content: string | unknown[] }>;
  }): Promise<Hash> {
    await this.start(v1Data.title, { provider: v1Data.provider });

    for (const msg of v1Data.messages) {
      const content = (typeof msg.content === 'string'
        ? [{ type: 'text', content: msg.content }]
        : msg.content) as ContentBlock[];

      if (msg.role === 'user') {
        await this.addUserMessage(content);
      } else if (msg.role === 'assistant') {
        await this.addAssistantMessage(content);
      }
    }

    return this.root!.conversationId;
  }
}
