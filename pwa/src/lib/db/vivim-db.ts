import { openDB, type IDBPDatabase } from 'idb';
import { logger } from '../logger';

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  sourceUrl: string;
  state: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  version: number;
  ownerId?: string;
  contentHash?: string;
  createdAt: string;
  updatedAt: string;
  capturedAt: string;
  tags: string[];
  messages: unknown[];
  stats: ConversationStats;
  metadata: Record<string, unknown>;
}

export interface ConversationStats {
  totalMessages: number;
  totalWords: number;
  totalCharacters: number;
  totalCodeBlocks: number;
  totalMermaidDiagrams: number;
  totalImages: number;
  totalTables: number;
  totalLatexBlocks: number;
  totalToolCalls: number;
  firstMessageAt: string;
  lastMessageAt: string;
}

export interface ConversationMetadata {
  id: string;
  title: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface SyncOperation {
  id: string;
  type: 'put' | 'delete';
  storeName: string;
  key: string;
  value?: unknown;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}

export interface DBSchema {
  conversations: {
    key: string;
    value: Conversation;
    indexes: {
      'by-createdAt': string;
      'by-updatedAt': string;
      'by-capturedAt': string;
      'by-provider': string;
      'by-ownerId': string;
    };
  };
  
  conversationMetadata: {
    key: string;
    value: ConversationMetadata;
    indexes: {
      'by-createdAt': string;
      'by-updatedAt': string;
      'by-lastMessageAt': string;
      'by-pinned': number;
      'by-archived': number;
      'by-tags': string[];
    };
  };
  
  syncQueue: {
    key: string;
    value: SyncOperation;
    indexes: {
      'by-status': string;
      'by-timestamp': number;
      'by-storeName': string;
    };
  };
}

// ============================================================================
// Database
// ============================================================================

const DB_NAME = 'VivimDB';
const DB_VERSION = 1;

class VivimDatabase {
  private db: IDBPDatabase | null = null;
  private initPromise: Promise<IDBPDatabase> | null = null;

  async ready(): Promise<IDBPDatabase> {
    if (this.db) {
      return this.db;
    }
    
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    
    return this.initPromise;
  }

  private async init(): Promise<IDBPDatabase> {
    logger.info('DB', 'Initializing Vivim Unified Database...');
    
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, _transaction) {
        // Create conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
          convStore.createIndex('by-createdAt', 'createdAt');
          convStore.createIndex('by-updatedAt', 'updatedAt');
          convStore.createIndex('by-capturedAt', 'capturedAt');
          convStore.createIndex('by-provider', 'provider');
          convStore.createIndex('by-ownerId', 'ownerId');
          logger.info('DB', 'Created conversations store');
        }
        
        // Create conversation metadata store (for home feed optimization)
        if (!db.objectStoreNames.contains('conversationMetadata')) {
          const metaStore = db.createObjectStore('conversationMetadata', { keyPath: 'id' });
          metaStore.createIndex('by-createdAt', 'createdAt');
          metaStore.createIndex('by-updatedAt', 'updatedAt');
          metaStore.createIndex('by-lastMessageAt', 'lastMessageAt');
          metaStore.createIndex('by-pinned', 'isPinned');
          metaStore.createIndex('by-archived', 'isArchived');
          metaStore.createIndex('by-tags', 'tags', { multiEntry: true });
          
          // Compound index for sorted queries
          metaStore.createIndex('by-pinned-updated', ['isPinned', 'updatedAt']);
          metaStore.createIndex('by-archived-updated', ['isArchived', 'updatedAt']);
          logger.info('DB', 'Created conversationMetadata store');
        }
        
        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-status', 'status');
          syncStore.createIndex('by-timestamp', 'timestamp');
          syncStore.createIndex('by-storeName', 'storeName');
          logger.info('DB', 'Created syncQueue store');
        }
      },
      
      blocked() {
        logger.warn('DB', 'Database blocked - please close other tabs');
      },
      
      blocking(event) {
        logger.warn('DB', 'Database blocking - closing');
        event.close();
      },
    });
    
    logger.info('DB', 'Vivim Unified Database initialized');
    return this.db;
  }

  // ========================================================================
  // Conversations
  // ========================================================================

  async getConversation(id: string): Promise<Conversation | undefined> {
    const db = await this.ready();
    return db.get('conversations', id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    const db = await this.ready();
    return db.getAll('conversations');
  }

  async getConversationsByDate(
    sortBy: 'createdAt' | 'updatedAt' | 'capturedAt' = 'capturedAt',
    order: 'asc' | 'desc' = 'desc',
    limit = 50,
    offset = 0
  ): Promise<Conversation[]> {
    const db = await this.ready();
    const index = db.transaction('conversations').store.index(`by-${sortBy}`);
    
    const results: Conversation[] = [];
    let cursor = await index.openCursor(null, order === 'desc' ? 'prev' : 'next');
    
    let count = 0;
    while (cursor && count < limit + offset) {
      if (count >= offset) {
        results.push(cursor.primaryKey as unknown as Conversation);
      }
      count++;
      cursor = await cursor.continue();
    }
    
    return results;
  }

  async putConversation(conversation: Conversation): Promise<string> {
    const db = await this.ready();
    await db.put('conversations', conversation);
    return conversation.id;
  }

  async deleteConversation(id: string): Promise<void> {
    const db = await this.ready();
    await db.delete('conversations', id);
    await db.delete('conversationMetadata', id).catch(err => {
      logger.error({ err, id }, 'Failed to delete conversation metadata');
    });
  }

  // ========================================================================
  // Conversation Metadata (for home feed)
  // ========================================================================

  async getMetadata(id: string): Promise<ConversationMetadata | undefined> {
    const db = await this.ready();
    return db.get('conversationMetadata', id);
  }

  async putMetadata(metadata: ConversationMetadata): Promise<void> {
    const db = await this.ready();
    await db.put('conversationMetadata', metadata);
  }

  async getAllMetadata(): Promise<ConversationMetadata[]> {
    const db = await this.ready();
    return db.getAll('conversationMetadata');
  }

  async getMetadataSorted(
    options: {
      limit?: number;
      offset?: number;
      pinnedFirst?: boolean;
      includeArchived?: boolean;
    } = {}
  ): Promise<ConversationMetadata[]> {
    const db = await this.ready();
    const { limit = 50, offset = 0, pinnedFirst = true, includeArchived = false } = options;
    
    const indexName = pinnedFirst ? 'by-pinned-updated' : 'by-lastMessageAt';
    const index = db.transaction('conversationMetadata').store.index(indexName);
    
    const results: ConversationMetadata[] = [];
    
    if (pinnedFirst) {
      // First get pinned (isPinned = 1 for true in our encoding)
      let cursor = await index.openCursor(IDBKeyRange.only(1), 'prev');
      let count = 0;
      while (cursor && count < limit + offset) {
        if (count >= offset) {
          results.push(cursor.primaryKey as unknown as ConversationMetadata);
        }
        count++;
        cursor = await cursor.continue();
      }
      
      // Then get unpinned
      if (results.length < limit) {
        cursor = await index.openCursor(IDBKeyRange.only(0), 'prev');
        while (cursor && results.length < limit + offset) {
          if (results.length >= offset) {
            const meta = cursor.primaryKey as unknown as ConversationMetadata;
            if (includeArchived || !meta.isArchived) {
              results.push(meta);
            }
          }
          cursor = await cursor.continue();
        }
      }
    } else {
      // Simple lastMessageAt sort
      let cursor = await index.openCursor(null, 'prev');
      let count = 0;
      while (cursor && count < limit + offset) {
        if (count >= offset) {
          const meta = cursor.primaryKey as unknown as ConversationMetadata;
          if (includeArchived || !meta.isArchived) {
            results.push(meta);
          }
        }
        count++;
        cursor = await cursor.continue();
      }
    }
    
    return results;
  }

  async updateMetadata(id: string, updates: Partial<ConversationMetadata>): Promise<void> {
    const db = await this.ready();
    const existing = await db.get('conversationMetadata', id);
    if (existing) {
      await db.put('conversationMetadata', { ...existing, ...updates, updatedAt: new Date().toISOString() });
    }
  }

  async setPinned(id: string, pinned: boolean): Promise<void> {
    await this.updateMetadata(id, { isPinned: pinned });
  }

  async setArchived(id: string, archived: boolean): Promise<void> {
    await this.updateMetadata(id, { isArchived: archived });
  }

  // ========================================================================
  // Sync Queue
  // ========================================================================

  async addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'status' | 'retryCount'>): Promise<void> {
    const db = await this.ready();
    const op: SyncOperation = {
      ...operation,
      id: `${operation.storeName}_${operation.key}_${Date.now()}`,
      status: 'pending',
      retryCount: 0,
    };
    await db.put('syncQueue', op);
  }

  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    const db = await this.ready();
    const index = db.transaction('syncQueue').store.index('by-status');
    return index.getAll('pending') as unknown as SyncOperation[];
  }

  async markSynced(id: string): Promise<void> {
    const db = await this.ready();
    const op = await db.get('syncQueue', id);
    if (op) {
      op.status = 'synced';
      await db.put('syncQueue', op);
    }
  }

  async markFailed(id: string, error: string): Promise<void> {
    const db = await this.ready();
    const op = await db.get('syncQueue', id);
    if (op) {
      op.status = 'failed';
      op.error = error;
      op.retryCount++;
      await db.put('syncQueue', op);
    }
  }

  async clearSynced(): Promise<void> {
    const db = await this.ready();
    const tx = db.transaction('syncQueue', 'readwrite');
    const index = tx.store.index('by-status');
    const synced = await index.getAllKeys('synced');
    for (const key of synced) {
      await tx.store.delete(key);
    }
  }

  // ========================================================================
  // Stats & Maintenance
  // ========================================================================

  async getStats(): Promise<{
    totalConversations: number;
    totalMetadata: number;
    pendingSync: number;
  }> {
    const db = await this.ready();
    
    const convCount = await db.count('conversations');
    const metaCount = await db.count('conversationMetadata');
    
    const syncIndex = db.transaction('syncQueue').store.index('by-status');
    const pendingCount = await syncIndex.count('pending');
    
    return {
      totalConversations: convCount,
      totalMetadata: metaCount,
      pendingSync: pendingCount,
    };
  }

  async clear(): Promise<void> {
    const db = await this.ready();
    await db.clear('conversations');
    await db.clear('conversationMetadata');
    await db.clear('syncQueue');
    logger.info('DB', 'Database cleared');
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// ============================================================================
// Singleton
// ============================================================================

let dbInstance: VivimDatabase | null = null;

export function getVivimDB(): VivimDatabase {
  if (!dbInstance) {
    dbInstance = new VivimDatabase();
  }
  return dbInstance;
}

export async function initVivimDB(): Promise<VivimDatabase> {
  const db = getVivimDB();
  await db.ready();
  return db;
}

// ============================================================================
// Convenience Hook for React
// ============================================================================

export function useVivimDB() {
  return getVivimDB();
}

export { VivimDatabase };
export type { Conversation, ConversationMetadata, SyncOperation };
