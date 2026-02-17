/**
 * OpenScroll Storage V2 - Main Storage Module with Secure Crypto
 *
 * Unified API for conversation storage:
 * - Content-addressed DAG storage
 * - Cryptographic signing and verification
 * - Fork, edit, and merge operations
 * - P2P sync ready
 * - Mobile optimized (IndexedDB)
 * - Secure key storage using Web Crypto API
 */

import { IndexedDBObjectStore, ConversationStore, SnapshotStore } from './object-store';
import { DAGEngine, ConversationBuilder } from './dag-engine';
import {
  generateSecureIdentity,
  secureRetrievePrivateKey,
  type DID
} from './secure-crypto';
import { asISO8601 } from './types';
import type {
  Hash,
  MessageNode,
  ConversationRoot,
  ConversationSnapshot,
  ContentBlock,
  ConversationExport,
  MerkleProof
} from './types';
import type { Message } from '../../types/conversation';
import { buildMerkleTree } from './merkle';

// ============================================================================
// Storage Configuration
// ============================================================================

export interface StorageConfig {
  dbName?: string;
  enableSync?: boolean;
  autoCompact?: boolean;
  maxCacheSize?: number;
  password?: string; // For secure key storage
}

export interface StorageStats {
  totalConversations: number;
  totalMessages: number;
  totalNodes: number;
  storageSize: number;
}

// ============================================================================
// Main Storage Class
// ============================================================================

export class Storage {
  private objectStore: IndexedDBObjectStore;
  private conversationStore: ConversationStore;
  private snapshotStore: SnapshotStore;
  private dagEngine: DAGEngine;
  private identity!: { did: DID; keyPair: { publicKey: string; secretKey: string } };
  private password?: string;
  private ready: Promise<void>;

  constructor(config?: StorageConfig) {
    this.objectStore = new IndexedDBObjectStore();
    this.conversationStore = new ConversationStore(this.objectStore);
    this.snapshotStore = new SnapshotStore(this.objectStore);
    this.dagEngine = new DAGEngine(this.objectStore);
    this.password = config?.password;

    // Initialize or load identity
    this.ready = this.init();
  }

  /**
   * Initialize storage and identity
   */
  private async init(): Promise<void> {
    await this.objectStore.ready();

    // Try to load existing identity
    const storedIdentity = await this.loadIdentity();

    if (storedIdentity) {
      this.identity = storedIdentity;
    } else {
      // Generate new identity with secure storage
      if (!this.password) {
        throw new Error('Password required to generate new identity');
      }
      
      const newIdentity = await generateSecureIdentity(this.password);
      this.identity = {
        did: newIdentity.did,
        keyPair: {
          publicKey: newIdentity.publicKey,
          secretKey: this.password // Will be used to retrieve actual key later
        }
      };
      
      await this.saveIdentity(this.identity);
    }
  }

  /**
   * Ensure storage is ready
   */
  private async ensureReady(): Promise<void> {
    await this.ready;
  }

  // ========================================================================
  // Identity Management
  // ========================================================================

  /**
   * Get current user's DID
   */
  async getIdentity(): Promise<DID> {
    await this.ensureReady();
    return this.identity.did;
  }

  /**
   * Get public key
   */
  async getPublicKey(): Promise<string> {
    await this.ensureReady();
    return this.identity.keyPair.publicKey;
  }

  /**
   * Get private key (requires password)
   */
  async getPrivateKey(): Promise<Uint8Array> {
    await this.ensureReady();
    
    if (!this.password) {
      throw new Error('Password required to retrieve private key');
    }
    
    const privateKey = await secureRetrievePrivateKey(this.password);
    if (!privateKey) {
      throw new Error('Failed to retrieve private key');
    }
    
    return privateKey;
  }

  /**
   * Save identity to secure storage
   */
  private async saveIdentity(identity: typeof this.identity): Promise<void> {
    try {
      if (this.password) {
        // Store identity reference in localStorage, actual key in secure storage
        localStorage.setItem('openscroll_identity_ref', JSON.stringify({
          did: identity.did,
          publicKey: identity.keyPair.publicKey
        }));
      }
    } catch {
      console.warn('Could not save identity reference to localStorage');
    }
  }

  /**
   * Load identity from secure storage
   */
  private async loadIdentity(): Promise<typeof this.identity | null> {
    try {
      const storedRef = localStorage.getItem('openscroll_identity_ref');
      if (!storedRef || !this.password) return null;

      const refData = JSON.parse(storedRef);
      
      // Retrieve the actual private key using the password
      const privateKey = await secureRetrievePrivateKey(this.password);
      if (!privateKey) {
        return null;
      }
      
      return {
        did: refData.did,
        keyPair: {
          publicKey: refData.publicKey,
          secretKey: this.password // Reference to password for later retrieval
        }
      };
    } catch {
      return null;
    }
  }

  // ========================================================================
  // Conversation Operations
  // ========================================================================

  /**
   * Create a new conversation
   */
  async createConversation(
    title: string,
    metadata?: Record<string, unknown>
  ): Promise<ConversationRoot> {
    await this.ensureReady();

    return this.conversationStore.create(
      title,
      this.identity.did,
      metadata
    );
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(conversationId: Hash): Promise<ConversationRoot | null> {
    await this.ensureReady();
    return this.conversationStore.get(conversationId);
  }

  /**
   * List all conversations
   */
  async listConversations(): Promise<Array<{
    root: ConversationRoot;
    messageCount: number;
    lastMessageAt: string | null;
  }>> {
    await this.ensureReady();

    const metadataList = await this.conversationStore.list();
    const results = [];

    for (const meta of metadataList) {
      const root = await this.conversationStore.get(meta.conversationId);
      if (root) {
        const messages = await this.dagEngine.getConversationMessages(meta.conversationId);
        results.push({
          root,
          messageCount: messages.length,
          lastMessageAt: messages.length > 0
            ? messages[messages.length - 1].timestamp
            : null
        });
      }
    }

    return results;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: Hash): Promise<void> {
    await this.ensureReady();
    return this.conversationStore.delete(conversationId);
  }

  // ========================================================================
  // Message Operations
  // ========================================================================

  /**
   * Append a message to a conversation
   */
  async appendMessage(
    conversationId: Hash,
    role: 'user' | 'assistant' | 'system',
    content: string | ContentBlock[],
    metadata?: Record<string, unknown>
  ): Promise<MessageNode> {
    await this.ensureReady();

    // Get current head
    const snapshot = await this.snapshotStore.getMainBranch(conversationId);
    const head = snapshot?.head || conversationId;

    const contentBlocks = typeof content === 'string'
      ? [{ type: 'text', content }]
      : content;

    // Get private key for signing
    const privateKey = await this.getPrivateKey();

    return this.dagEngine.appendMessage({
      conversationId,
      role,
      content: contentBlocks,
      parentIds: [head],
      metadata,
      secretKey: toBase64(privateKey) // Convert Uint8Array to base64
    });
  }

  /**
   * Get all messages in a conversation
   */
  async getMessages(conversationId: Hash): Promise<MessageNode[]> {
    await this.ensureReady();
    return this.dagEngine.getConversationMessages(conversationId);
  }

  /**
   * Get a single message by hash
   */
  async getMessage(messageHash: Hash): Promise<MessageNode | null> {
    await this.ensureReady();
    const node = await this.objectStore.get(messageHash);

    if (node && node.type === 'message') {
      return node as MessageNode;
    }
    return null;
  }

  /**
   * Edit a message
   */
  async editMessage(
    messageId: Hash,
    newContent: string | ContentBlock[],
    editReason?: string
  ) {
    await this.ensureReady();

    const privateKey = await this.getPrivateKey();
    const contentBlocks = typeof newContent === 'string'
      ? [{ type: 'text', content: newContent }]
      : newContent;

    return this.dagEngine.editMessage({
      messageId,
      newContent: contentBlocks,
      editReason,
      secretKey: toBase64(privateKey)
    });
  }

  // ========================================================================
  // Branching & Merging
  // ========================================================================

  /**
   * Fork a conversation
   */
  async forkConversation(
    conversationId: Hash,
    fromMessageId: Hash,
    branchName: string,
    forkReason?: string
  ) {
    await this.ensureReady();
    
    const privateKey = await this.getPrivateKey();
    return this.dagEngine.forkConversation({
      conversationId,
      fromMessageId,
      branchName,
      forkReason,
      secretKey: toBase64(privateKey)
    });
  }

  /**
   * Merge two branches
   */
  async mergeBranches(
    conversationId: Hash,
    branchHead1: Hash,
    branchHead2: Hash,
    mergeStrategy?: 'recursive' | 'ours' | 'theirs' | 'manual'
  ) {
    await this.ensureReady();
    
    const privateKey = await this.getPrivateKey();
    return this.dagEngine.mergeBranches({
      conversationId,
      branchHead1,
      branchHead2,
      mergeStrategy,
      secretKey: toBase64(privateKey)
    });
  }

  /**
   * List snapshots (branches) for a conversation
   */
  async listSnapshots(conversationId: Hash): Promise<ConversationSnapshot[]> {
    await this.ensureReady();
    return this.snapshotStore.getByConversation(conversationId);
  }

  // ========================================================================
  // Import / Export
  // ========================================================================

  /**
   * Import a conversation from V1 format
   */
  async importFromV1(v1Data: {
    title: string;
    provider: string;
    messages: Array<{ role: string; content: string | unknown[] }>;
  }): Promise<Hash> {
    await this.ensureReady();

    const privateKey = await this.getPrivateKey();
    const builder = new ConversationBuilder(this.dagEngine, toBase64(privateKey));
    return builder.importFromV1(v1Data);
  }

  /**
   * Import from server extraction result (schema-compliant)
   */
  async importFromExtraction(extraction: {
    id?: string;
    provider: string;
    sourceUrl: string;
    title: string;
    createdAt?: string;
    exportedAt?: string;
    messages: Message[];
    metadata?: Record<string, unknown>;
    stats?: {
      totalMessages: number;
      totalWords: number;
      totalCharacters: number;
      totalCodeBlocks?: number;
      totalMermaidDiagrams?: number;
      totalImages?: number;
      firstMessageAt?: string;
      lastMessageAt?: string;
    };
  }): Promise<Hash> {
    await this.ensureReady();

    // Phase 1: Zero-Trust Local Verification (Merkle Witness)
    const verification = await this.dagEngine.validateInboundExtraction(extraction);
    if (!verification.valid) {
       const errorMsg = `BYZANTINE SERVER DETECTION: Intelligence Materialization Aborted. Reasons: ${verification.errors.join(', ')}`;
       console.error(errorMsg);
       throw new Error(errorMsg);
    }

    // Validate required fields
    if (!extraction.title || !extraction.provider || !extraction.messages) {
      throw new Error('Invalid extraction: missing required fields');
    }

    const privateKey = await this.getPrivateKey();
    const builder = new ConversationBuilder(this.dagEngine, toBase64(privateKey));

    // Start conversation with metadata
    await builder.start(extraction.title, {
      provider: extraction.provider,
      sourceUrl: extraction.sourceUrl,
      model: extraction.metadata?.model as string | undefined,
      tags: extraction.metadata?.tags as string[] | undefined,
      exportedAt: extraction.exportedAt || extraction.createdAt,
      stats: extraction.stats
    });

    // Import messages
    for (const msg of extraction.messages) {
      // Normalize content to ContentBlock array
      let contentBlocks: ContentBlock[];

      if (typeof msg.content === 'string') {
        contentBlocks = [{ type: 'text', content: msg.content }];
      } else if (Array.isArray(msg.content)) {
        // Validate and normalize each block
        contentBlocks = msg.content.map((block: any) => {
          const validTypes = ['text', 'code', 'image', 'table', 'quote', 'math', 'divider', 'html', 'mermaid', 'tool_call', 'tool_result'];

          if (!block || typeof block !== 'object') {
            return { type: 'text', content: String(block) } as ContentBlock;
          }

          if (!validTypes.includes(block.type)) {
            return { type: 'text', content: JSON.stringify(block) } as ContentBlock;
          }

          // Force cast to any to handle type union complexities
          const baseBlock: any = {
            type: block.type,
            content: block.content,
            ...(block.language && { language: block.language }),
            ...(block.alt && { alt: block.alt }),
            ...(block.caption && { caption: block.caption }),
            ...(block.url && { url: block.url }),
            ...(block.headers && { headers: block.headers }),
            ...(block.rows && { rows: block.rows }),
            ...(block.tool_call_id && { tool_call_id: block.tool_call_id }),
            ...(block.id && { id: block.id }),
            ...(block.name && { name: block.name }),
            ...(block.args && { args: block.args })
          };

          return baseBlock as ContentBlock;
        });
      } else {
        contentBlocks = [{ type: 'text', content: JSON.stringify(msg.content) }];
      }

      // Add message based on role
      if (msg.role === 'user') {
        await builder.addUserMessage(contentBlocks);
      } else if (msg.role === 'assistant') {
        await builder.addAssistantMessage(contentBlocks, {
          wordCount: msg.wordCount,
          characterCount: msg.characterCount,
          ...msg.metadata
        });
      } else if (msg.role === 'system') {
        // System messages - can add if needed, or skip
        await builder.addAssistantMessage(contentBlocks, {
          systemMessage: true,
          ...msg.metadata
        });
      }
    }

    return builder.getRoot()!.conversationId;
  }

  /**
   * Export a conversation
   */
  async exportConversation(conversationId: Hash): Promise<ConversationExport> {
    await this.ensureReady();

    const root = await this.conversationStore.get(conversationId);
    if (!root) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const messages = await this.dagEngine.getConversationMessages(conversationId);
    const snapshots = await this.snapshotStore.getByConversation(conversationId);

    // Build Merkle tree
    const tree = buildMerkleTree(messages.map(m => m.id));

    return {
      format: 'openscroll-v2-dag',
      version: '2.0.0',
      root,
      nodes: [root, ...messages],
      snapshots,
      merkleRoot: tree.root.hash,
      exportedAt: asISO8601(new Date().toISOString()),
      exporter: this.identity.did
    };
  }

  /**
   * Import an exported conversation
   */
  async importConversation(data: ConversationExport): Promise<Hash> {
    await this.ensureReady();

    // Verify format
    if (data.format !== 'openscroll-v2-dag') {
      throw new Error(`Unsupported format: ${data.format}`);
    }

    // Verify Merkle root
    const messageHashes = data.nodes
      .filter(n => n.type === 'message')
      .map(n => n.id);
    const tree = buildMerkleTree(messageHashes);

    if (tree.root.hash !== data.merkleRoot) {
      throw new Error('Merkle root verification failed');
    }

    // Store all nodes
    for (const node of data.nodes) {
      await this.objectStore.put(node);
    }

    // Store snapshots
    const db = await this.objectStore.ready();
    const tx = db.transaction('snapshots', 'readwrite');
    const store = tx.objectStore('snapshots');

    await new Promise<void>((resolve, reject) => {
      let count = 0;
      if (data.snapshots.length === 0) resolve();

      data.snapshots.forEach(snapshot => {
        const req = store.put(snapshot);
        req.onsuccess = () => {
          count++;
          if (count === data.snapshots.length) resolve();
        };
        req.onerror = () => reject(req.error);
      });
    });

    return data.root.conversationId;
  }

  // ========================================================================
  // Verification
  // ========================================================================

  /**
   * Verify all signatures in a conversation
   */
  async verifyConversation(conversationId: Hash): Promise<{
    valid: boolean;
    nodes: Array<{ hash: Hash; valid: boolean }>;
  }> {
    await this.ensureReady();
    return this.dagEngine.verifyConversation(conversationId);
  }

  /**
   * Generate Merkle proof for a message
   */
  async generateMerkleProof(
    conversationId: Hash,
    messageHash: Hash
  ): Promise<MerkleProof | null> {
    await this.ensureReady();
    return this.dagEngine.generateMerkleProof(conversationId, messageHash);
  }

  /**
   * Verify a Merkle proof
   */
  async verifyMerkleProof(proof: MerkleProof): Promise<boolean> {
    return this.dagEngine.verifyMerkleProof(proof);
  }

  // ========================================================================
  // Search & Query
  // ========================================================================

  /**
   * Search conversations by title
   */
  async searchByTitle(query: string): Promise<ConversationRoot[]> {
    await this.ensureReady();

    const all = await this.conversationStore.list();
    const lowerQuery = query.toLowerCase();

    const promises = all
      .filter(m => m.title.toLowerCase().includes(lowerQuery))
      .map(m => this.conversationStore.get(m.conversationId));

    const results = await Promise.all(promises);
    return results.filter((c): c is ConversationRoot => c !== null);
  }

  /**
   * Get conversations by tag
   */
  async getByTag(tag: string): Promise<ConversationRoot[]> {
    await this.ensureReady();

    const all = await this.conversationStore.list();
    const promises = all
      .filter(m => m.tags.includes(tag))
      .map(m => this.conversationStore.get(m.conversationId));

    const results = await Promise.all(promises);
    return results.filter((c): c is ConversationRoot => c !== null);
  }

  // ========================================================================
  // Statistics
  // ========================================================================

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    await this.ensureReady();

    const conversations = await this.conversationStore.list();
    let totalMessages = 0;

    for (const conv of conversations) {
      const messages = await this.dagEngine.getConversationMessages(conv.conversationId);
      totalMessages += messages.length;
    }

    return {
      totalConversations: conversations.length,
      totalMessages,
      totalNodes: await this.objectStore.getSize(),
      storageSize: await this.calculateStorageSize()
    };
  }

  private async calculateStorageSize(): Promise<number> {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
    } catch (e) {
      console.warn('Failed to calculate storage size', e);
    }
    return 0;
  }

  // ========================================================================
  // Maintenance
  // ========================================================================

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    await this.ensureReady();
    await this.objectStore.clear();
  }

  /**
   * Compact storage (remove orphaned nodes)
   */
  async compact(): Promise<void> {
    await this.ensureReady();

    // Get all conversations
    const conversations = await this.conversationStore.list();

    // Collect all reachable nodes
    const reachable = new Set<Hash>();

    for (const conv of conversations) {
      const nodes = await this.dagEngine.traversalBFS(conv.conversationId);
      for (const node of nodes) {
        reachable.add(node.id);
      }
    }

    // TODO: Remove nodes not in reachable set
    // This requires iterating over all nodes and checking if they're reachable
  }
}

// Helper function to convert Uint8Array to base64
function toBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, arr as unknown as number[]));
}

// ============================================================================
// Factory
// ============================================================================

let defaultStorage: Storage | null = null;

/**
 * Get or create the default storage instance
 */
export function getStorage(config?: StorageConfig): Storage {
  if (!defaultStorage) {
    defaultStorage = new Storage(config);
  }
  return defaultStorage;
}

/**
 * Reset the default storage instance (for testing)
 */
export function resetStorage(): void {
  defaultStorage = null;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick capture: Import from extraction and return conversation ID
 */
export async function quickCapture(extraction: {
  title: string;
  provider: string;
  sourceUrl: string;
  messages: Message[];
}): Promise<Hash> {
  const storage = getStorage();
  return storage.importFromExtraction(extraction);
}

/**
 * Quick export: Export conversation to JSON
 */
export async function quickExport(conversationId: Hash): Promise<ConversationExport> {
  const storage = getStorage();
  return storage.exportConversation(conversationId);
}

/**
 * Quick verify: Verify conversation signatures
 */
export async function quickVerify(conversationId: Hash): Promise<boolean> {
  const storage = getStorage();
  const result = await storage.verifyConversation(conversationId);
  return result.valid;
}