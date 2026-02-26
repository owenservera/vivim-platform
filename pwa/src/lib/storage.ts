/**
 * VIVIM Storage - Simplified Working Version
 *
 * Single-user private storage using IndexedDB.
 * This is the working version for Phase 0.
 * Will be upgraded to full DAG/CRDT system later.
 */

import { openDB, type IDBPDatabase } from 'idb';

// ============================================================================
// Types
// ============================================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp?: string;
}

export interface ContentBlock {
  type: 'text' | 'code' | 'image' | 'mermaid';
  content: string;
  language?: string;
  alt?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  exportedAt: string;
  sourceUrl: string;
  provider: string;
  messages: Message[];
  stats: {
    totalMessages: number;
    totalWords: number;
    totalCharacters: number;
    totalCodeBlocks: number;
  };
}

export interface CaptureResult {
  id: string;
  title: string;
  provider: string;
  sourceUrl: string;
  createdAt: string;
  exportedAt: string;
  messages: Message[];
  stats: Conversation['stats'];
}

// ============================================================================
// IndexedDB Storage
// ============================================================================

const DB_NAME = 'VIVIMDB';
const DB_VERSION = 1;
const STORE_NAME = 'conversations';

export class ConversationStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db: IDBPDatabase) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, {
              keyPath: 'id',
              autoIncrement: false
            });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        }
      }) as unknown as IDBDatabase;
    })() as unknown as Promise<void>;

    return this.initPromise;
  }

  async saveConversation(data: CaptureResult): Promise<void> {
    await this.init();
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).put(data);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    await this.init();
    const tx = this.db.transaction(STORE_NAME, 'readonly');
    return (await tx.objectStore(STORE_NAME).get(id)) as Conversation;
  }

  async listConversations(): Promise<Conversation[]> {
    await this.init();
    const tx = this.db.transaction(STORE_NAME, 'readonly');
    return (await tx.objectStore(STORE_NAME).getAll()) as Conversation[];
  }

  async deleteConversation(id: string): Promise<void> {
    await this.init();
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).delete(id);
  }

  async getStats(): Promise<{ total: number; totalMessages: number }> {
    await this.init();
    const conversations = await this.listConversations();
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    return { total: conversations.length, totalMessages };
  }
}

// Singleton instance
const storageInstance = new ConversationStorage();

// Convenience functions
export async function saveConversation(data: CaptureResult): Promise<void> {
  await storageInstance.saveConversation(data);
}

export async function getConversation(id: string): Promise<Conversation | null> {
  return await storageInstance.getConversation(id);
}

export async function listConversations(): Promise<Conversation[]> {
  return await storageInstance.listConversations();
}

export async function deleteConversation(id: string): Promise<void> {
  await storageInstance.deleteConversation(id);
}

export async function getStorageStats(): Promise<{ total: number; totalMessages: number }> {
  return await storageInstance.getStats();
}
