import type { IDBPDatabase, IDBTransactionMode } from 'idb';
import { log } from '../../logger';

export interface QueuedOperation {
  id: string;
  type: 'put' | 'delete' | 'clear';
  storeName: string;
  key?: IDBValidKey;
  value?: unknown;
  timestamp: number;
  retries: number;
  lastError?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface SyncQueueConfig {
  storeName: string;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  syncEndpoint?: string;
}

export class SyncQueue {
  private db: IDBPDatabase;
  private config: SyncQueueConfig;
  private isProcessing = false;
  private processingPromise: Promise<void> | null = null;
  private listeners: Set<(op: QueuedOperation) => void> = new Set();
  private onlineListener: (() => void) | null = null;

  constructor(db: IDBPDatabase, config: SyncQueueConfig) {
    this.db = db;
    this.config = config;
  }

  async initialize(): Promise<void> {
    await this.ensureStoreExists();
    this.setupOnlineListener();
    log.storage.info('SyncQueue initialized');
  }

  private async ensureStoreExists(): Promise<void> {
    const stores = this.db.objectStoreNames;
    if (!stores.contains(this.config.storeName)) {
      // Object stores can only be created during a version upgrade transaction.
      // If the store doesn't exist here, it means the DB schema is out of date.
      log.storage.warn(`SyncQueue store '${this.config.storeName}' not found. Ensure it is defined in the DB schema stores config.`);
    }
  }

  private setupOnlineListener(): void {
    this.onlineListener = () => {
      if (navigator.onLine) {
        log.storage.info('Online - starting sync');
        this.processQueue().catch(err => log.storage.error('Sync failed', err));
      }
    };
    window.addEventListener('online', this.onlineListener);
  }

  async enqueue(operation: Omit<QueuedOperation, 'id' | 'retries' | 'status'>): Promise<string> {
    const id = this.generateId(operation);
    const queuedOp: QueuedOperation = {
      ...operation,
      id,
      retries: 0,
      status: 'pending',
    };

    const tx = this.db.transaction(this.config.storeName, 'readwrite');
    await tx.objectStore(this.config.storeName).put(queuedOp);
    
    log.storage.debug(`Enqueued operation: ${operation.type} on ${operation.storeName}`);
    
    if (navigator.onLine && !this.isProcessing) {
      this.processQueue().catch(err => log.storage.error('Auto-sync failed', err));
    }

    return id;
  }

  private generateId(op: Omit<QueuedOperation, 'id' | 'retries' | 'status'>): string {
    const data = `${op.storeName}-${op.type}-${op.timestamp}-${Math.random()}`;
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  }

  async processQueue(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (this.isProcessing) {
      return { success: false, synced: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      log.storage.info('Offline - queue paused');
      return { success: false, synced: 0, failed: 0 };
    }

    this.isProcessing = true;
    this.processingPromise = this.doProcess();
    
    try {
      return await this.processingPromise;
    } finally {
      this.isProcessing = false;
      this.processingPromise = null;
    }
  }

  private async doProcess(): Promise<{ success: boolean; synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    const pending = await this.getPending();
    
    if (pending.length === 0) {
      return { success: true, synced: 0, failed: 0 };
    }

    const batch = pending.slice(0, this.config.batchSize);

    for (const op of batch) {
      try {
        await this.processOperation(op);
        await this.markCompleted(op.id);
        synced++;
        this.notifyListeners({ ...op, status: 'completed' });
      } catch (error) {
        const err = error instanceof Error ? error.message : String(error);
        
        if (op.retries < this.config.maxRetries) {
          await this.incrementRetry(op.id, err);
          log.storage.warn(`Operation ${op.id} failed, retry ${op.retries + 1}/${this.config.maxRetries}`);
        } else {
          await this.markFailed(op.id, err);
          failed++;
          log.storage.error(`Operation ${op.id} failed permanently`, { error });
        }
        
        this.notifyListeners({ ...op, status: 'failed', lastError: err });
      }
    }

    const remaining = await this.getPending();
    if (remaining.length > 0 && navigator.onLine) {
      setTimeout(() => this.processQueue(), this.config.retryDelay);
    }

    return { success: failed === 0, synced, failed };
  }

  private async processOperation(op: QueuedOperation): Promise<void> {
    const tx = this.db.transaction(op.storeName, 'readwrite');
    const store = tx.objectStore(op.storeName);

    switch (op.type) {
      case 'put':
        if (op.key !== undefined) {
          await store.put(op.value);
        } else {
          await store.add(op.value);
        }
        break;
      case 'delete':
        if (op.key !== undefined) {
          await store.delete(op.key);
        }
        break;
      case 'clear':
        await store.clear();
        break;
    }
  }

  private async getPending(): Promise<QueuedOperation[]> {
    const tx = this.db.transaction(this.config.storeName, 'readonly');
    const store = tx.objectStore(this.config.storeName);
    const all = await store.getAll();
    return all.filter(op => op.status === 'pending' || op.status === 'processing');
  }

  private async markCompleted(id: string): Promise<void> {
    const tx = this.db.transaction(this.config.storeName, 'readwrite');
    const store = tx.objectStore(this.config.storeName);
    const op = await store.get(id);
    if (op) {
      op.status = 'completed';
      await store.put(op);
    }
  }

  private async markFailed(id: string, error: string): Promise<void> {
    const tx = this.db.transaction(this.config.storeName, 'readwrite');
    const store = tx.objectStore(this.config.storeName);
    const op = await store.get(id);
    if (op) {
      op.status = 'failed';
      op.lastError = error;
      await store.put(op);
    }
  }

  private async incrementRetry(id: string, error: string): Promise<void> {
    const tx = this.db.transaction(this.config.storeName, 'readwrite');
    const store = tx.objectStore(this.config.storeName);
    const op = await store.get(id);
    if (op) {
      op.retries++;
      op.status = 'pending';
      op.lastError = error;
      await store.put(op);
    }
  }

  async getStatus(): Promise<{ pending: number; processing: number; completed: number; failed: number }> {
    const tx = this.db.transaction(this.config.storeName, 'readonly');
    const store = tx.objectStore(this.config.storeName);
    const all = await store.getAll();
    
    return {
      pending: all.filter(o => o.status === 'pending').length,
      processing: all.filter(o => o.status === 'processing').length,
      completed: all.filter(o => o.status === 'completed').length,
      failed: all.filter(o => o.status === 'failed').length,
    };
  }

  async clearCompleted(): Promise<number> {
    const tx = this.db.transaction(this.config.storeName, 'readwrite');
    const store = tx.objectStore(this.config.storeName);
    const all = await store.getAll();
    const completed = all.filter(o => o.status === 'completed');
    
    for (const op of completed) {
      await store.delete(op.id);
    }
    
    return completed.length;
  }

  async clearFailed(): Promise<number> {
    const tx = this.db.transaction(this.config.storeName, 'readwrite');
    const store = tx.objectStore(this.config.storeName);
    const all = await store.getAll();
    const failed = all.filter(o => o.status === 'failed');
    
    for (const op of failed) {
      await store.delete(op.id);
    }
    
    return failed.length;
  }

  async retryFailed(): Promise<void> {
    const tx = this.db.transaction(this.config.storeName, 'readwrite');
    const store = tx.objectStore(this.config.storeName);
    const all = await store.getAll();
    const failed = all.filter(o => o.status === 'failed');
    
    for (const op of failed) {
      op.status = 'pending';
      op.retries = 0;
      op.lastError = undefined;
      await store.put(op);
    }
    
    if (failed.length > 0) {
      this.processQueue().catch(err => log.storage.error('Retry failed', err));
    }
  }

  onOperation(listener: (op: QueuedOperation) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(op: QueuedOperation): void {
    this.listeners.forEach(listener => listener(op));
  }

  destroy(): void {
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
    }
    this.listeners.clear();
  }
}
