import EventEmitter from 'eventemitter3';
import type {
  Hash,
  Node,
  ObjectStore,
  BatchOperation,
  ConversationRoot,
  ConversationSnapshot,
  ISO8601,
  Signature,
  DID
} from './types';
import { log } from '../logger';

// ============================================================================
// Database Configuration
// ============================================================================

const DB_NAME = 'OpenScrollV2';
const DB_VERSION = 2;

const STORES = {
  OBJECTS: 'objects',           // All nodes by hash
  CONVERSATIONS: 'conversations', // Conversation metadata index
  SNAPSHOTS: 'snapshots',       // Named snapshots
  INDEX_MESSAGES: 'idx_messages',            // Message index
  INDEX_AUTHORS: 'idx_authors',              // Author index
  PENDING_SYNC: 'pending_sync'               // Objects to sync
} as const;

// ============================================================================
// IndexedDB Object Store Implementation
// ============================================================================

export class IndexedDBObjectStore extends EventEmitter implements ObjectStore {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    super();
    this.initPromise = this.init();
  }

  /**
   * Initialize the database
   */
  private async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Objects store - all nodes indexed by hash
        if (!db.objectStoreNames.contains(STORES.OBJECTS)) {
          const objectStore = db.createObjectStore(STORES.OBJECTS, { keyPath: 'id' });
          objectStore.createIndex('type', 'type', { unique: false });
          objectStore.createIndex('author', 'author', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Conversations store - metadata index
        if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
          const convStore = db.createObjectStore(STORES.CONVERSATIONS, { keyPath: 'conversationId' });
          convStore.createIndex('author', 'author', { unique: false });
          convStore.createIndex('createdAt', 'createdAt', { unique: false });
          convStore.createIndex('title', 'title', { unique: false });
          convStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Snapshots store
        if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
          const snapStore = db.createObjectStore(STORES.SNAPSHOTS, { keyPath: 'id' });
          snapStore.createIndex('conversationId', 'conversationId', { unique: false });
          snapStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.INDEX_MESSAGES)) {
          const idxMsg = db.createObjectStore(STORES.INDEX_MESSAGES, { keyPath: 'hash' });
          idxMsg.createIndex('conversationId', 'conversationId', { unique: false });
          idxMsg.createIndex('author', 'author', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.INDEX_AUTHORS)) {
          db.createObjectStore(STORES.INDEX_AUTHORS, { keyPath: 'did' });
        }

        // Pending sync store
        if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
          const syncStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'hash' });
          syncStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure database is ready
   */
  async ready(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) {
      this.db = await this.initPromise;
      return this.db!;
    }
    return this.init();
  }

  /**
   * Store a node
   */
  async put(node: Node): Promise<Hash> {
    const db = await this.ready();
    const tx = db.transaction(STORES.OBJECTS, 'readwrite');
    const store = tx.objectStore(STORES.OBJECTS);

    return new Promise((resolve, reject) => {
      const request = store.put(node);
      request.onsuccess = () => {
        log.storage.debug(`IDB_PUT [objects]: ${node.id.slice(0, 10)}... (${node.type})`);
        this.emit('change', { type: 'put', store: STORES.OBJECTS, key: node.id, value: node });
        resolve(node.id as Hash);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a node by hash
   */
  async get(hash: Hash): Promise<Node | null> {
    const db = await this.ready();
    const tx = db.transaction(STORES.OBJECTS, 'readonly');
    const store = tx.objectStore(STORES.OBJECTS);

    return new Promise((resolve, reject) => {
      const request = store.get(hash);
      request.onsuccess = () => {
        const result = request.result || null;
        if (result) {
          log.storage.debug(`IDB_GET [objects]: ${hash.slice(0, 10)}... (HIT: ${result.type})`);
        } else {
          log.storage.debug(`IDB_GET [objects]: ${hash.slice(0, 10)}... (MISS)`);
        }
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if a node exists
   */
  async has(hash: Hash): Promise<boolean> {
    const node = await this.get(hash);
    return node !== null;
  }

  /**
   * Delete a node
   */
  async delete(hash: Hash): Promise<void> {
    const db = await this.ready();
    const tx = db.transaction(STORES.OBJECTS, 'readwrite');
    const store = tx.objectStore(STORES.OBJECTS);

    return new Promise((resolve, reject) => {
      const request = store.delete(hash);
      request.onsuccess = () => {
        this.emit('change', { type: 'delete', store: STORES.OBJECTS, key: hash });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Execute batch operations atomically
   */
  async batch(operations: BatchOperation[]): Promise<void> {
    const db = await this.ready();
    const tx = db.transaction(STORES.OBJECTS, 'readwrite');
    const store = tx.objectStore(STORES.OBJECTS);

    return new Promise((resolve, reject) => {
      for (const op of operations) {
        if (op.type === 'put') {
          store.put(op.node);
        } else if (op.type === 'delete') {
          store.delete(op.hash);
        }
      }

      tx.oncomplete = () => {
        this.emit('change', { type: 'batch', store: STORES.OBJECTS, operations });
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get multiple nodes by hash
   */
  async getMany(hashes: Hash[]): Promise<Map<Hash, Node>> {
    const db = await this.ready();
    const tx = db.transaction(STORES.OBJECTS, 'readonly');
    const store = tx.objectStore(STORES.OBJECTS);

    const results = new Map<Hash, Node>();

    await Promise.all(hashes.map(hash =>
      new Promise<void>((resolve, reject) => {
        const request = store.get(hash);
        request.onsuccess = () => {
          if (request.result) {
            results.set(hash, request.result);
          }
          resolve();
        };
        request.onerror = () => reject(request.error);
      })
    ));

    return results;
  }

  /**
   * Query nodes by type
   */
  async getByType(type: Node['type']): Promise<Node[]> {
    const db = await this.ready();
    const tx = db.transaction(STORES.OBJECTS, 'readonly');
    const store = tx.objectStore(STORES.OBJECTS);
    const index = store.index('type');

    return new Promise((resolve, reject) => {
      const request = index.getAll(type);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query nodes by author
   */
  async getByAuthor(authorDID: string): Promise<Node[]> {
    const db = await this.ready();
    const tx = db.transaction(STORES.OBJECTS, 'readonly');
    const store = tx.objectStore(STORES.OBJECTS);
    const index = store.index('author');

    return new Promise((resolve, reject) => {
      const request = index.getAll(authorDID);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    const db = await this.ready();

    // Clear all object stores
    for (const storeName of Object.values(STORES)) {
      const tx = db.transaction(storeName, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = tx.objectStore(storeName).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  /**
   * Get database size estimate
   */
  async getSize(): Promise<number> {
    // Estimate based on object count
    const db = await this.ready();
    const tx = db.transaction(STORES.OBJECTS, 'readonly');
    const store = tx.objectStore(STORES.OBJECTS);

    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// ============================================================================
// Conversation Store
// ============================================================================

export interface ConversationMetadata {
  conversationId: Hash;
  rootHash: Hash;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  snapshotCount: number;
  tags: string[];
  author: string;
}

export class ConversationStore {
  private objectStore: ObjectStore;

  constructor(objectStore: ObjectStore) {
    this.objectStore = objectStore;
  }

  /**
   * Create a new conversation
   */
  async create(
    title: string,
    author: string,
    metadata?: Record<string, unknown>
  ): Promise<ConversationRoot> {
    const { sha256 } = await import('./crypto');

    const conversationId = await sha256(`${title}:${Date.now()}:${author}`) as Hash;

    const root: ConversationRoot = {
      id: conversationId,
      type: 'root',
      timestamp: new Date().toISOString() as ISO8601,
      author: author as DID,
      signature: '' as Signature, // Will be set by caller
      title,
      conversationId,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString() as ISO8601
      }
    };

    await this.objectStore.put(root);

    // Update index
    await this.updateIndex(root);

    return root;
  }

  /**
   * Get a conversation by ID
   */
  async get(conversationId: Hash): Promise<ConversationRoot | null> {
    // The source of truth for the root node is the OBJECTS store
    const node = await this.objectStore.get(conversationId);
    if (node && node.type === 'root') {
      return node as ConversationRoot;
    }
    
    // Fallback: If not found in objects, the ID might be wrong or it's a legacy conversation
    return null;
  }

  /**
   * List all conversations
   */
  async list(): Promise<ConversationMetadata[]> {
    const db = await (this.objectStore as any).ready();
    const tx = db.transaction(STORES.CONVERSATIONS, 'readonly');
    const store = tx.objectStore(STORES.CONVERSATIONS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result;
        console.log(`[ConversationStore.list()] Retrieved ${result.length} conversations from IndexedDB.`, result);
        log.storage.debug(`IDB_LIST [conversations]: Found ${result.length} entries.`);
        resolve(result);
      };
      request.onerror = () => {
        console.error(`[ConversationStore.list()] Failed to retrieve conversations from IndexedDB.`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update conversation index
   */
  async updateIndex(root: ConversationRoot): Promise<void> {
    const db = await (this.objectStore as any).ready();
    const tx = db.transaction(STORES.CONVERSATIONS, 'readwrite');
    const store = tx.objectStore(STORES.CONVERSATIONS);

    const index: ConversationMetadata = {
      conversationId: root.conversationId,
      rootHash: root.id,
      title: root.title,
      createdAt: root.metadata.createdAt as string || root.timestamp,
      updatedAt: root.timestamp,
      messageCount: 0, // Updated dynamically by service
      snapshotCount: 0,
      tags: root.metadata.tags as string[] || [],
      author: root.author
    };

    return new Promise((resolve, reject) => {
      const request = store.put(index);
      request.onsuccess = () => {
        console.log(`[ConversationStore.updateIndex()] Successfully indexed conversation: ${root.title} (${root.conversationId.slice(0, 10)}...)`);
        log.storage.debug(`IDB_PUT [conversations]: Indexed ${root.conversationId.slice(0, 10)}...`);
        resolve();
      };
      request.onerror = () => {
        console.error(`[ConversationStore.updateIndex()] Failed to index conversation: ${root.title}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a conversation
   */
  async delete(conversationId: Hash): Promise<void> {
    const db = await (this.objectStore as any).ready();
    const tx = db.transaction([STORES.OBJECTS, STORES.CONVERSATIONS], 'readwrite');

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);

      // Delete root and index entry
      tx.objectStore(STORES.OBJECTS).delete(conversationId);
      tx.objectStore(STORES.CONVERSATIONS).delete(conversationId);
    });
  }

  async save(root: ConversationRoot): Promise<void> {
    const db = await (this.objectStore as any).ready();
    const tx = db.transaction([STORES.OBJECTS, STORES.CONVERSATIONS], 'readwrite');

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);

      tx.objectStore(STORES.OBJECTS).put(root);
      
      const index: ConversationMetadata = {
        conversationId: root.conversationId,
        rootHash: root.id,
        title: root.title,
        createdAt: root.metadata.createdAt as string || root.timestamp,
        updatedAt: root.timestamp,
        messageCount: 0,
        snapshotCount: 0,
        tags: root.metadata.tags as string[] || [],
        author: root.author
      };
      tx.objectStore(STORES.CONVERSATIONS).put(index);
    });
    
    log.storage.debug(`IDB_SAVE [conversation]: Saved ${root.conversationId.slice(0, 10)}...`);
  }
}

// ============================================================================
// Snapshot Store
// ============================================================================

export class SnapshotStore {
  private objectStore: ObjectStore;

  constructor(objectStore: ObjectStore) {
    this.objectStore = objectStore;
  }

  /**
   * Create a snapshot
   */
  async create(
    conversationId: Hash,
    name: string,
    head: Hash,
    author: string,
    description?: string
  ): Promise<ConversationSnapshot> {
    const { sha256 } = await import('./crypto');

    const id = await sha256(`${conversationId}:${name}:${Date.now()}`) as Hash;

    const snapshot: ConversationSnapshot = {
      id,
      conversationId,
      name,
      head,
      createdAt: new Date().toISOString() as ISO8601,
      author: author as DID,
      description
    };

    const db = await (this.objectStore as any).ready();
    const tx = db.transaction(STORES.SNAPSHOTS, 'readwrite');
    const store = tx.objectStore(STORES.SNAPSHOTS);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(snapshot);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return snapshot;
  }

  /**
   * Get a snapshot
   */
  async get(snapshotId: Hash): Promise<ConversationSnapshot | null> {
    const db = await (this.objectStore as any).ready();
    const tx = db.transaction(STORES.SNAPSHOTS, 'readonly');
    const store = tx.objectStore(STORES.SNAPSHOTS);

    return new Promise((resolve, reject) => {
      const request = store.get(snapshotId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get snapshots for a conversation
   */
  async getByConversation(conversationId: Hash): Promise<ConversationSnapshot[]> {
    const db = await (this.objectStore as any).ready();
    const tx = db.transaction(STORES.SNAPSHOTS, 'readonly');
    const store = tx.objectStore(STORES.SNAPSHOTS);
    const index = store.index('conversationId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(conversationId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get the main branch (usually named 'main' or 'master')
   */
  async getMainBranch(conversationId: Hash): Promise<ConversationSnapshot | null> {
    const snapshots = await this.getByConversation(conversationId);
    return snapshots.find(s => s.name === 'main' || s.name === 'master') || null;
  }
}
