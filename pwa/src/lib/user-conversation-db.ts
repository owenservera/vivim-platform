/**
 * User Conversation Database Service
 * 
 * Manages a dedicated IndexedDB database for user conversations
 * with optimized indexing and sorting for the home feed.
 */

import { getStorage } from './storage-v2';
import { logger } from './logger';
import type { Conversation } from '../types/conversation';
import type { Hash } from './storage-v2/types';

// Database configuration
const DB_NAME = 'VivimUserConversationsDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  CONVERSATIONS: 'conversations',
  METADATA: 'metadata',
  INDEXES: 'indexes'
} as const;

// Conversation metadata interface
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

// Database interface
export interface UserConversationDB {
  // Initialization
  ready(): Promise<IDBDatabase>;
  
  // Conversation operations
  addConversation(conversation: Conversation): Promise<void>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<void>;
  getConversation(id: string): Promise<Conversation | null>;
  getAllConversations(options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'lastMessageAt';
    sortOrder?: 'asc' | 'desc';
    filter?: {
      pinned?: boolean;
      archived?: boolean;
      tags?: string[];
    };
  }): Promise<Conversation[]>;
  deleteConversation(id: string): Promise<void>;
  
  // Metadata operations
  updateMetadata(id: string, metadata: Partial<ConversationMetadata>): Promise<void>;
  getMetadata(id: string): Promise<ConversationMetadata | null>;
  
  // Utility operations
  getStats(): Promise<{
    total: number;
    pinned: number;
    archived: number;
    lastSync?: string;
  }>;
  clear(): Promise<void>;
  
  // Search operations
  searchByTitle(query: string): Promise<Conversation[]>;
  getByTags(tags: string[]): Promise<Conversation[]>;
}

class UserConversationDBService implements UserConversationDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  /**
   * Initialize the database
   */
  private async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open user conversations database', 
          new Error(request.error?.message || 'Unknown error'));
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('User conversations database opened successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        logger.info(`Upgrading user conversations database from v${event.oldVersion} to v${event.newVersion}`);

        // Create conversations store
        if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
          const conversationStore = db.createObjectStore(STORES.CONVERSATIONS, { keyPath: 'id' });
          
          // Create indexes for efficient querying and sorting
          conversationStore.createIndex('createdAt', 'createdAt', { unique: false });
          conversationStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          conversationStore.createIndex('lastMessageAt', 'lastMessageAt', { unique: false });
          conversationStore.createIndex('isPinned', 'isPinned', { unique: false });
          conversationStore.createIndex('isArchived', 'isArchived', { unique: false });
          conversationStore.createIndex('priority', 'priority', { unique: false });
          
          // Create compound indexes for complex queries
          conversationStore.createIndex('pinned_updated', ['isPinned', 'updatedAt'], { unique: false });
          conversationStore.createIndex('archived_updated', ['isArchived', 'updatedAt'], { unique: false });
          
          logger.debug('Created conversations store with indexes');
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          const metadataStore = db.createObjectStore(STORES.METADATA, { keyPath: 'id' });
          metadataStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          logger.debug('Created metadata store');
        }
      };
    });
  }

  /**
   * Ensure database is ready
   */
  async ready(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }
    return this.initPromise!;
  }

  /**
   * Add a conversation to the database
   */
  async addConversation(conversation: Conversation): Promise<void> {
    const db = await this.ready();
    
    // Prepare conversation with metadata
    const conversationWithMeta = {
      ...conversation,
      isPinned: false,
      isArchived: false,
      priority: 'medium' as const,
      updatedAt: new Date().toISOString(),
      lastMessageAt: conversation.stats?.lastMessageAt || conversation.createdAt
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CONVERSATIONS, STORES.METADATA], 'readwrite');
      
      // Add conversation
      const conversationStore = transaction.objectStore(STORES.CONVERSATIONS);
      const conversationRequest = conversationStore.add(conversationWithMeta);
      
      // Add metadata
      const metadataStore = transaction.objectStore(STORES.METADATA);
      const metadata: ConversationMetadata = {
        id: conversation.id,
        title: conversation.title,
        provider: conversation.provider,
        createdAt: conversation.createdAt,
        updatedAt: conversationWithMeta.updatedAt,
        lastMessageAt: conversationWithMeta.lastMessageAt,
        messageCount: conversation.stats?.totalMessages || 0,
        isPinned: false,
        isArchived: false,
        tags: conversation.metadata?.tags || [],
        priority: 'medium'
      };
      const metadataRequest = metadataStore.add(metadata);

      transaction.oncomplete = () => {
        logger.debug(`Added conversation ${conversation.id} to user database`);
        resolve();
      };

      transaction.onerror = () => {
        logger.error(`Failed to add conversation ${conversation.id}`, 
          new Error(transaction.error?.message || 'Unknown error'));
        reject(new Error(`Failed to add conversation: ${transaction.error?.message}`));
      };
    });
  }

  /**
   * Update a conversation in the database
   */
  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const db = await this.ready();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CONVERSATIONS, 'readwrite');
      const store = transaction.objectStore(STORES.CONVERSATIONS);
      
      // Get existing conversation
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error(`Conversation ${id} not found`));
          return;
        }

        // Update conversation
        const updated = {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString()
        };

        const updateRequest = store.put(updated);
        
        updateRequest.onsuccess = () => {
          logger.debug(`Updated conversation ${id} in user database`);
          resolve();
        };
        
        updateRequest.onerror = () => {
          logger.error(`Failed to update conversation ${id}`, 
            new Error(updateRequest.error?.message || 'Unknown error'));
          reject(new Error(`Failed to update conversation: ${updateRequest.error?.message}`));
        };
      };
      
      getRequest.onerror = () => {
        logger.error(`Failed to get conversation ${id} for update`, 
          new Error(getRequest.error?.message || 'Unknown error'));
        reject(new Error(`Failed to get conversation: ${getRequest.error?.message}`));
      };
    });
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(id: string): Promise<Conversation | null> {
    const db = await this.ready();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CONVERSATIONS, 'readonly');
      const store = transaction.objectStore(STORES.CONVERSATIONS);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        logger.error(`Failed to get conversation ${id}`, 
          new Error(request.error?.message || 'Unknown error'));
        reject(new Error(`Failed to get conversation: ${request.error?.message}`));
      };
    });
  }

  /**
   * Get all conversations with sorting and filtering options
   */
  async getAllConversations(options: {
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'lastMessageAt';
    sortOrder?: 'asc' | 'desc';
    filter?: {
      pinned?: boolean;
      archived?: boolean;
      tags?: string[];
    };
  } = {}): Promise<Conversation[]> {
    const db = await this.ready();
    const {
      limit = 50,
      offset = 0,
      sortBy = 'lastMessageAt',
      sortOrder = 'desc',
      filter = {}
    } = options;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CONVERSATIONS, 'readonly');
      const store = transaction.objectStore(STORES.CONVERSATIONS);
      
      let request: IDBRequest;
      
      // Use appropriate index based on filter
      if (filter.pinned !== undefined) {
        request = store.index('pinned_updated').openCursor(
          IDBKeyRange.only(filter.pinned),
          sortOrder === 'desc' ? 'prev' : 'next'
        );
      } else if (filter.archived !== undefined) {
        request = store.index('archived_updated').openCursor(
          IDBKeyRange.only(filter.archived),
          sortOrder === 'desc' ? 'prev' : 'next'
        );
      } else {
        request = store.index(sortBy).openCursor(
          null,
          sortOrder === 'desc' ? 'prev' : 'next'
        );
      }
      
      const results: Conversation[] = [];
      let count = 0;
      
      request.onsuccess = () => {
        const cursor = request.result;
        
        if (cursor && count < limit + offset) {
          if (count >= offset) {
            results.push(cursor.value);
          }
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => {
        logger.error('Failed to get conversations', 
          new Error(request.error?.message || 'Unknown error'));
        reject(new Error(`Failed to get conversations: ${request.error?.message}`));
      };
    });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    const db = await this.ready();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CONVERSATIONS, STORES.METADATA], 'readwrite');
      
      // Delete from conversations store
      const conversationStore = transaction.objectStore(STORES.CONVERSATIONS);
      const conversationRequest = conversationStore.delete(id);
      
      // Delete from metadata store
      const metadataStore = transaction.objectStore(STORES.METADATA);
      const metadataRequest = metadataStore.delete(id);

      transaction.oncomplete = () => {
        logger.debug(`Deleted conversation ${id} from user database`);
        resolve();
      };

      transaction.onerror = () => {
        logger.error(`Failed to delete conversation ${id}`, 
          new Error(transaction.error?.message || 'Unknown error'));
        reject(new Error(`Failed to delete conversation: ${transaction.error?.message}`));
      };
    });
  }

  /**
   * Update conversation metadata
   */
  async updateMetadata(id: string, metadata: Partial<ConversationMetadata>): Promise<void> {
    const db = await this.ready();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.METADATA, 'readwrite');
      const store = transaction.objectStore(STORES.METADATA);
      
      // Get existing metadata
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error(`Metadata for conversation ${id} not found`));
          return;
        }

        // Update metadata
        const updated = {
          ...existing,
          ...metadata,
          updatedAt: new Date().toISOString()
        };

        const updateRequest = store.put(updated);
        
        updateRequest.onsuccess = () => {
          logger.debug(`Updated metadata for conversation ${id}`);
          resolve();
        };
        
        updateRequest.onerror = () => {
          logger.error(`Failed to update metadata for conversation ${id}`, 
            new Error(updateRequest.error?.message || 'Unknown error'));
          reject(new Error(`Failed to update metadata: ${updateRequest.error?.message}`));
        };
      };
      
      getRequest.onerror = () => {
        logger.error(`Failed to get metadata for conversation ${id}`, 
          new Error(getRequest.error?.message || 'Unknown error'));
        reject(new Error(`Failed to get metadata: ${getRequest.error?.message}`));
      };
    });
  }

  /**
   * Get conversation metadata
   */
  async getMetadata(id: string): Promise<ConversationMetadata | null> {
    const db = await this.ready();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.METADATA, 'readonly');
      const store = transaction.objectStore(STORES.METADATA);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        logger.error(`Failed to get metadata for conversation ${id}`, 
          new Error(request.error?.message || 'Unknown error'));
        reject(new Error(`Failed to get metadata: ${request.error?.message}`));
      };
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    total: number;
    pinned: number;
    archived: number;
    lastSync?: string;
  }> {
    const db = await this.ready();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CONVERSATIONS, 'readonly');
      const store = transaction.objectStore(STORES.CONVERSATIONS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const conversations = request.result;
        const stats = {
          total: conversations.length,
          pinned: conversations.filter((c: any) => c.isPinned).length,
          archived: conversations.filter((c: any) => c.isArchived).length,
          lastSync: conversations.length > 0 
            ? Math.max(...conversations.map((c: any) => new Date(c.updatedAt).getTime()))
            : undefined
        };
        resolve(stats);
      };
      
      request.onerror = () => {
        logger.error('Failed to get database stats', 
          new Error(request.error?.message || 'Unknown error'));
        reject(new Error(`Failed to get stats: ${request.error?.message}`));
      };
    });
  }

  /**
   * Clear all data from the database
   */
  async clear(): Promise<void> {
    const db = await this.ready();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CONVERSATIONS, STORES.METADATA], 'readwrite');
      
      const conversationStore = transaction.objectStore(STORES.CONVERSATIONS);
      conversationStore.clear();
      
      const metadataStore = transaction.objectStore(STORES.METADATA);
      metadataStore.clear();

      transaction.oncomplete = () => {
        logger.info('Cleared user conversation database');
        resolve();
      };

      transaction.onerror = () => {
        logger.error('Failed to clear user conversation database', 
          new Error(transaction.error?.message || 'Unknown error'));
        reject(new Error(`Failed to clear database: ${transaction.error?.message}`));
      };
    });
  }

  /**
   * Search conversations by title
   */
  async searchByTitle(query: string): Promise<Conversation[]> {
    const db = await this.ready();
    const lowerQuery = query.toLowerCase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CONVERSATIONS, 'readonly');
      const store = transaction.objectStore(STORES.CONVERSATIONS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const conversations = request.result;
        const results = conversations.filter((conversation: Conversation) =>
          conversation.title.toLowerCase().includes(lowerQuery)
        );
        resolve(results);
      };
      
      request.onerror = () => {
        logger.error('Failed to search conversations by title', 
          new Error(request.error?.message || 'Unknown error'));
        reject(new Error(`Failed to search: ${request.error?.message}`));
      };
    });
  }

  /**
   * Get conversations by tags
   */
  async getByTags(tags: string[]): Promise<Conversation[]> {
    const db = await this.ready();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CONVERSATIONS, STORES.METADATA], 'readonly');
      const metadataStore = transaction.objectStore(STORES.METADATA);
      const request = metadataStore.index('tags').openCursor(
        IDBKeyRange.only(tags[0]) // Simplified for now - could be enhanced for multiple tags
      );
      
      const conversationIds = new Set<string>();
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          conversationIds.add(cursor.value.id);
          cursor.continue();
        } else {
          // Now get the full conversations
          const conversationStore = transaction.objectStore(STORES.CONVERSATIONS);
          const conversations: Conversation[] = [];
          let pending = 0;
          
          conversationIds.forEach(id => {
            pending++;
            const getRequest = conversationStore.get(id);
            getRequest.onsuccess = () => {
              if (getRequest.result) {
                conversations.push(getRequest.result);
              }
              pending--;
              if (pending === 0) {
                resolve(conversations);
              }
            };
            getRequest.onerror = () => {
              pending--;
              if (pending === 0) {
                resolve(conversations);
              }
            };
          });
          
          if (pending === 0) {
            resolve(conversations);
          }
        }
      };
      
      request.onerror = () => {
        logger.error('Failed to get conversations by tags', 
          new Error(request.error?.message || 'Unknown error'));
        reject(new Error(`Failed to get by tags: ${request.error?.message}`));
      };
    });
  }
}

// Export singleton instance
export const userConversationDB = new UserConversationDBService();