/**
 * OpenScroll Storage V2 - Main Storage Module
 *
 * Unified API for conversation storage:
 * - Content-addressed DAG storage
 * - Cryptographic signing and verification
 * - Fork, edit, and merge operations
 * - P2P sync ready
 * - Mobile optimized (IndexedDB)
 */

import { IndexedDBObjectStore, ConversationStore, SnapshotStore } from './object-store';
import type { ConversationMetadata } from './object-store';
import { DAGEngine, ConversationBuilder } from './dag-engine';
import {
  generateIdentity
} from './crypto';
import { log } from '../logger';
import { asISO8601 } from './types';

// Try to import UnifiedDebugService for centralized error reporting
let unifiedDebugService: any = null;
try {
  unifiedDebugService = require('../unified-debug-service').unifiedDebugService;
} catch (e) {
  // UnifiedDebugService not available yet - that's okay
}
import type {
  Hash,
  MessageNode,
  ConversationRoot,
  ConversationSnapshot,
  ContentBlock,
  DID,
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
  private ready: Promise<void>;
  /** Prevents concurrent rebuild attempts from stacking up */
  private rebuildInProgress: Promise<void> | null = null;

  constructor(_config?: StorageConfig) {
    this.objectStore = new IndexedDBObjectStore();
    this.conversationStore = new ConversationStore(this.objectStore);
    this.snapshotStore = new SnapshotStore(this.objectStore);
    this.dagEngine = new DAGEngine(this.objectStore);

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
      this.identity = generateIdentity();
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
   * Save identity to localStorage
   */
  private async saveIdentity(identity: typeof this.identity): Promise<void> {
    try {
      localStorage.setItem('openscroll_identity', JSON.stringify({
        did: identity.did,
        publicKey: identity.keyPair.publicKey,
        // Never store secret key in plaintext in production
        // Use secure enclave / keychain
        secretKey: identity.keyPair.secretKey
      }));
    } catch {
      console.warn('Could not save identity to localStorage');
    }
  }

  /**
   * Load identity from localStorage
   */
  private async loadIdentity(): Promise<typeof this.identity | null> {
    try {
      const stored = localStorage.getItem('openscroll_identity');
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // VALIDATION: Ensure the secret key is valid (64 bytes = 88 base64 chars)
      // If we have an old truncated key (44 chars) from a previous dev version, 
      // we MUST reset it to prevent RangeErrors in crypto operations.
      if (!data.secretKey || data.secretKey.length < 80) {
        console.warn('Invalid or legacy identity detected, resetting...');
        localStorage.removeItem('openscroll_identity');
        return null;
      }

      return {
        did: data.did,
        keyPair: {
          publicKey: data.publicKey,
          secretKey: data.secretKey
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
   * List all conversations with optional pagination
   * NOTE: This returns LIGHTWEIGHT data - only root metadata, no messages
   * Use getConversation() to load full conversation with messages
   */
  async listConversations(options?: { 
    limit?: number; 
    offset?: number;
  }): Promise<Array<{
    root: ConversationRoot;
    messageCount: number;
    lastMessageAt: string | null;
  }>> {
    const startTime = Date.now();
    const listId = `list_${Date.now()}`;
    const { limit = 100, offset = 0 } = options || {};
    
    log.storage.info(`[${listId}] ========== LIST CONVERSATIONS START (limit=${limit}, offset=${offset}) ==========`);

    try {
      await this.ensureReady();
      log.storage.debug(`[${listId}] Storage ready, fetching conversation list...`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.storage.error(`[${listId}] Storage not ready: ${errorMsg}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }

    try {
      let metadataList = await this.conversationStore.list();
      log.storage.info(`[${listId}] Found ${metadataList.length} conversations in index`);
      
      // If the index is empty, try to rebuild it (only once at a time)
      if (metadataList.length === 0) {
        log.storage.warn(`[${listId}] Conversation index is empty, attempting to rebuild...`);
        
        try {
          // Share a single rebuild promise to prevent concurrent rebuild storms
          if (!this.rebuildInProgress) {
            this.rebuildInProgress = this.rebuildConversationIndex().finally(() => {
              this.rebuildInProgress = null;
            });
          }
          await this.rebuildInProgress;
          
          // Try to get the list again after rebuilding
          metadataList = await this.conversationStore.list();
          log.storage.info(`[${listId}] After rebuild: found ${metadataList.length} conversations in index`);
        } catch (rebuildError) {
          const rebuildErrorMsg = rebuildError instanceof Error ? rebuildError.message : String(rebuildError);
          log.storage.error(`[${listId}] Failed to rebuild conversation index: ${rebuildErrorMsg}`,
            rebuildError instanceof Error ? rebuildError : new Error(String(rebuildError))
          );
          // Continue with empty list rather than throwing
        }
      }
      
      // Apply pagination
      const paginatedMetadata = metadataList.slice(offset, offset + limit);
      log.storage.debug(`[${listId}] Paginated: ${paginatedMetadata.length} conversations (offset=${offset}, limit=${limit})`);
      
      // For each conversation, get the root from OBJECTS store using rootHash
      const results = [];

      for (const meta of paginatedMetadata) {
        try {
          const root = await this.conversationStore.get(meta.rootHash);
          if (root) {
            // Use messageCount from index metadata instead of fetching all messages
            results.push({
              root,
              messageCount: meta.messageCount || 0,
              lastMessageAt: meta.lastMessageAt || null
            });
          }
        } catch (convError) {
          const errorMsg = convError instanceof Error ? convError.message : String(convError);
          log.storage.warn(`[${listId}] Failed to get conversation ${meta.conversationId?.slice(0,10)}: ${errorMsg}`);
        }
      }

      const duration = Date.now() - startTime;
      log.storage.info(`[${listId}] ========== LIST CONVERSATIONS COMPLETE: ${results.length} in ${duration}ms ==========`);
      return results;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.storage.error(`[${listId}] List conversations failed: ${errorMsg}`,
        error instanceof Error ? error : new Error(String(error))
      );
      
      // Report to UnifiedDebugService if available
      if (unifiedDebugService) {
        unifiedDebugService.error('Storage', `List conversations failed: ${errorMsg}`,
          error instanceof Error ? error : new Error(String(error)),
          { listId, duration: Date.now() - startTime }
        );
      }
      
      throw error;
    }
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

    const node = await this.dagEngine.appendMessage({
      conversationId,
      role,
      content: contentBlocks,
      parentIds: [head],
      metadata,
      secretKey: this.identity.keyPair.secretKey
    });

    // Update message count in index
    try {
      const messages = await this.dagEngine.getConversationMessages(conversationId);
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      await this.conversationStore.updateMessageCount(
        conversationId,
        messages.length,
        lastMessage?.timestamp || null
      );
    } catch (e) {
      log.storage.warn('Failed to update message count in index', { error: e });
    }

    return node;
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

    const contentBlocks = typeof newContent === 'string'
      ? [{ type: 'text', content: newContent }]
      : newContent;

    return this.dagEngine.editMessage({
      messageId,
      newContent: contentBlocks,
      editReason,
      secretKey: this.identity.keyPair.secretKey
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
    return this.dagEngine.forkConversation({
      conversationId,
      fromMessageId,
      branchName,
      forkReason,
      secretKey: this.identity.keyPair.secretKey
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
    return this.dagEngine.mergeBranches({
      conversationId,
      branchHead1,
      branchHead2,
      mergeStrategy,
      secretKey: this.identity.keyPair.secretKey
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

    const builder = new ConversationBuilder(this.dagEngine, this.identity.keyPair.secretKey);
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
    log.storage.info(`Starting import from ${extraction.provider} extraction...`, { title: extraction.title });

    // Phase 1: Zero-Trust Local Verification (Merkle Witness)
    log.storage.debug('Phase 1: Validating inbound extraction integrity...');
    const verification = await this.dagEngine.validateInboundExtraction(extraction);
    if (!verification.valid) {
       const errorMsg = `BYZANTINE SERVER DETECTION: Intelligence Materialization Aborted. Reasons: ${verification.errors.join(', ')}`;
       log.storage.error(errorMsg);
       throw new Error(errorMsg);
    }
    log.storage.info('✓ Extraction integrity verified.');

    // Validate required fields
    if (!extraction.title || !extraction.provider || !extraction.messages) {
      const missing = [];
      if (!extraction.title) missing.push('title');
      if (!extraction.provider) missing.push('provider');
      if (!extraction.messages) missing.push('messages');
      const errorMsg = `Invalid extraction: missing required fields: ${missing.join(', ')}`;
      log.storage.error('Import Validation Failed', new Error(errorMsg), extraction);
      throw new Error(errorMsg);
    }

    log.storage.debug('Phase 2: Building DAG structure...');
    const builder = new ConversationBuilder(this.dagEngine, this.identity.keyPair.secretKey);

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
    log.storage.debug(`Phase 3: Importing ${extraction.messages.length} messages...`);
    let msgCount = 0;
    for (const msg of extraction.messages) {
      msgCount++;
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
      
      if (msgCount % 5 === 0) {
        log.storage.debug(`Progress: ${msgCount}/${extraction.messages.length} messages imported.`);
      }
    }

    const root = builder.getRoot()!;
    const conversationId = root.conversationId;
    
    // Phase 4: Indexing
    log.storage.debug('Phase 4: Updating conversation index...');
    await this.conversationStore.updateIndex(root);

    // Update message count in index after bulk import
    const messages = await this.dagEngine.getConversationMessages(conversationId);
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    await this.conversationStore.updateMessageCount(
      conversationId,
      messages.length,
      lastMessage?.timestamp || null
    );
    
    log.storage.info(`✓ Import complete. Conversation ID: ${conversationId.slice(0, 10)}...`);
    return conversationId;
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
      log.storage.warn('Failed to calculate storage size', { error: e });
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

  private getMetadataKey(conversationId: Hash): string {
    return `openscroll_metadata:${conversationId}`;
  }

  async getMetadata(conversationId: Hash): Promise<{
    tags: string[];
    collectionIds: string[];
    isPinned: boolean;
    isArchived: boolean;
    readStatus: 'unread' | 'read' | 'reading';
    priority: 'low' | 'medium' | 'high';
    notes?: string;
    customFields?: Record<string, string>;
  } | null> {
    await this.ensureReady();
    
    try {
      const data = localStorage.getItem(this.getMetadataKey(conversationId));
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async setMetadata(
    conversationId: Hash,
    metadata: {
      tags?: string[];
      collectionIds?: string[];
      isPinned?: boolean;
      isArchived?: boolean;
      readStatus?: 'unread' | 'read' | 'reading';
      priority?: 'low' | 'medium' | 'high';
      notes?: string;
      customFields?: Record<string, string>;
    }
  ): Promise<void> {
    await this.ensureReady();
    
    try {
      const existing = await this.getMetadata(conversationId);
      const updated = { 
        tags: [],
        collectionIds: [],
        isPinned: false,
        isArchived: false,
        readStatus: 'unread' as const,
        priority: 'medium' as const,
        ...existing,
        ...metadata 
      };
      localStorage.setItem(this.getMetadataKey(conversationId), JSON.stringify(updated));
    } catch (error) {
      log.storage.error('Failed to save metadata', new Error(String(error)));
      // conversationId and error context: conversationId = ${conversationId}
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(`openscroll_${key}`);
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(`openscroll_${key}`, value);
  }

  async saveConversation(conversation: ConversationRoot): Promise<void> {
    await this.ensureReady();
    await this.conversationStore.save(conversation);
  }

  /**
   * Rebuild the conversation index from existing conversations
   * This is useful when the index is corrupted or missing
   */
  async rebuildConversationIndex(): Promise<void> {
    const startTime = Date.now();
    const rebuildId = `rebuild_${Date.now()}`;
    
    log.storage.info(`[${rebuildId}] ========== REBUILD CONVERSATION INDEX START ==========`);
    
    try {
      await this.ensureReady();
      
      // Get all conversation roots from the object store.
      // Note: conversation root nodes are stored with type === 'root', NOT 'conversation'.
      const allConversations = await this.objectStore.getByType('root');
      log.storage.info(`[${rebuildId}] Found ${allConversations.length} conversation roots in object store`);
      
      // Get current conversation index
      const currentIndex = await this.conversationStore.list();
      log.storage.info(`[${rebuildId}] Current index has ${currentIndex.length} entries`);
      
      // Create a map of existing index entries for quick lookup
      const indexMap = new Map<string, ConversationMetadata>();
      currentIndex.forEach(meta => {
        indexMap.set(meta.conversationId, meta);
      });
      
      let updatedCount = 0;
      let addedCount = 0;
      
      // Process each conversation root
      for (const node of allConversations) {
        const root = node as ConversationRoot;
        
        try {
          // Check if this conversation is already in the index
          if (!indexMap.has(root.conversationId)) {
            // Add missing conversation to index
            await this.conversationStore.updateIndex(root);
            addedCount++;
            log.storage.debug(`[${rebuildId}] Added missing conversation to index: ${root.title} (${root.conversationId.slice(0, 10)}...)`);
          } else {
            // Update existing index entry
            await this.conversationStore.updateIndex(root);
            updatedCount++;
            log.storage.debug(`[${rebuildId}] Updated existing conversation in index: ${root.title} (${root.conversationId.slice(0, 10)}...)`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          log.storage.error(`[${rebuildId}] Failed to index conversation ${root.conversationId}: ${errorMsg}`,
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
      
      const duration = Date.now() - startTime;
      log.storage.info(`[${rebuildId}] ========== REBUILD CONVERSATION INDEX COMPLETE: ${addedCount} added, ${updatedCount} updated in ${duration}ms ==========`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.storage.error(`[${rebuildId}] Rebuild conversation index failed: ${errorMsg}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
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
