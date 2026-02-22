import { openDB, type IDBPDatabase, type DBSchema, IDBPTransaction } from 'idb';
import { log } from '../../logger';
import { DataValidator } from './data-validator';
import { IntegrityChecker } from './integrity-checker';
import { SyncQueue, type QueuedOperation } from './sync-queue';
import { ConflictResolver } from './conflict-resolver';

export interface DBManagerConfig {
  dbName: string;
  version: number;
  stores: StoreDefinition[];
  migrations: Migration[];
  enableSync?: boolean;
  enableValidation?: boolean;
  enableIntegrityCheck?: boolean;
}

export interface StoreDefinition {
  name: string;
  keyPath: string;
  indexes: IndexDefinition[];
}

export interface IndexDefinition {
  name: string;
  keyPath: string;
  unique?: boolean;
}

export interface Migration {
  version: number;
  up: (db: IDBPDatabase) => Promise<void>;
  down?: (db: IDBPDatabase) => Promise<void>;
}

export type InitState = 'uninitialized' | 'initializing' | 'ready' | 'error' | 'migrating';

const DB_STATE_KEY = 'vivim_db_state';

export class DatabaseManager {
  private db: IDBPDatabase | null = null;
  private config: DBManagerConfig;
  private initState: InitState = 'uninitialized';
  private initPromise: Promise<void> | null = null;
  private validator: DataValidator;
  private integrityChecker: IntegrityChecker;
  private syncQueue: SyncQueue | null = null;
  private conflictResolver: ConflictResolver;
  private stateListeners: Set<(state: InitState, error?: Error) => void> = new Set();

  constructor(config: DBManagerConfig) {
    this.config = config;
    this.validator = new DataValidator();
    this.integrityChecker = new IntegrityChecker();
    this.conflictResolver = new ConflictResolver();
  }

  async initialize(): Promise<void> {
    if (this.initState === 'ready') return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      this.setState('initializing');

      // Open the database once. The `upgrade` callback handles all schema creation
      // and migrations via IDB's built-in versioning mechanism.
      this.db = await this.openDatabase();
      await this.setStoredVersion(this.config.version);

      if (this.config.enableSync) {
        await this.initSyncQueue();
      }

      if (this.config.enableIntegrityCheck) {
        await this.runIntegrityCheck();
      }

      this.setState('ready');
      log.storage.info(`Database ${this.config.dbName} v${this.config.version} initialized`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setState('error', err);
      log.storage.error('Database initialization failed', err);
      throw err;
    }
  }

  private async openDatabase(): Promise<IDBPDatabase> {
    return openDB(this.config.dbName, this.config.version, {
      upgrade: (db, oldVersion, newVersion, transaction) => {
        this.handleUpgrade(db, oldVersion, newVersion, transaction);
      },
      blocked: () => {
        log.storage.warn('Database blocked - please close other tabs');
      },
      blocking: (event) => {
        event.oldVersion;
        log.storage.warn('Database blocking - closing');
        event.close();
      },
    });
  }

  private handleUpgrade(
    db: IDBPDatabase,
    oldVersion: number,
    _newVersion: number,
    transaction: IDBPTransaction
  ): void {
    for (const store of this.config.stores) {
      if (!db.objectStoreNames.contains(store.name)) {
        const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
        
        for (const index of store.indexes) {
          objectStore.createIndex(index.name, index.keyPath, { unique: index.unique ?? false });
        }
        
        log.storage.debug(`Created store: ${store.name}`);
      }
    }
  }

  private async getStoredVersion(): Promise<number> {
    try {
      const stored = localStorage.getItem(`${DB_STATE_KEY}_${this.config.dbName}`);
      if (stored) {
        const data = JSON.parse(stored);
        return data.version ?? 0;
      }
    } catch (error) {
      log.storage.warn('Failed to read stored DB version', { error });
    }
    return 0;
  }

  private async setStoredVersion(version: number): Promise<void> {
    try {
      localStorage.setItem(
        `${DB_STATE_KEY}_${this.config.dbName}`,
        JSON.stringify({ version, timestamp: Date.now() })
      );
    } catch (error) {
      log.storage.warn('Failed to persist DB version', { error });
    }
  }

  private async runMigrations(fromVersion: number, toVersion: number): Promise<void> {
    // NOTE: Migrations are now handled via the IDB `upgrade` callback in openDatabase().
    // This method is kept for potential future use but is no longer called during init.
    const migrationsToRun = this.config.migrations
      .filter(m => m.version >= fromVersion && m.version <= toVersion)
      .sort((a, b) => a.version - b.version);

    if (!this.db) {
      log.storage.warn('runMigrations called before DB is open - skipping');
      return;
    }

    for (const migration of migrationsToRun) {
      log.storage.info(`Running migration v${migration.version}`);
      await migration.up(this.db);
      await this.setStoredVersion(migration.version);
      log.storage.info(`Migration v${migration.version} completed`);
    }
  }

  private async initSyncQueue(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Verify sync_queue store exists (it must have been created in the upgrade handler)
    if (!this.db.objectStoreNames.contains('sync_queue')) {
      log.storage.warn('sync_queue store not found - sync disabled for this session');
      return;
    }
    
    this.syncQueue = new SyncQueue(this.db, {
      storeName: 'sync_queue',
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 10,
    });
    
    // Don't call initialize() - it tries to createObjectStore outside upgrade transaction
    this.setupSyncQueueListeners();
    log.storage.info('SyncQueue ready');
  }

  private setupSyncQueueListeners(): void {
    if (!this.syncQueue) return;
    // Online sync trigger
    window.addEventListener('online', () => {
      if (this.syncQueue && navigator.onLine) {
        this.syncQueue.processQueue().catch(err => log.storage.error('Online sync failed', err));
      }
    });
  }

  private async runIntegrityCheck(): Promise<void> {
    if (!this.db) return;
    
    const report = await this.integrityChecker.checkDatabase(this.db);
    
    if (!report.isHealthy) {
      log.storage.warn('Integrity issues found', { report });
      
      if (report.corruptedStores.length > 0) {
        await this.handleCorruption(report.corruptedStores);
      }
    }
  }

  private async handleCorruption(storeNames: string[]): Promise<void> {
    for (const storeName of storeNames) {
      log.storage.error(`Clearing corrupted store: ${storeName}`);
      const tx = this.db!.transaction(storeName, 'readwrite');
      await tx.objectStore(storeName).clear();
    }
  }

  private setState(state: InitState, error?: Error): void {
    this.initState = state;
    this.stateListeners.forEach(listener => listener(state, error));
  }

  onStateChange(listener: (state: InitState, error?: Error) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  getState(): InitState {
    return this.initState;
  }

  isReady(): boolean {
    return this.initState === 'ready';
  }

  getDatabase(): IDBPDatabase {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async getStore(storeName: string, mode: IDBTransactionMode = 'readonly') {
    const db = this.getDatabase();
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    return store.getAll() as unknown as T[];
  }

  async getByKey<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const store = await this.getStore(storeName);
    return store.get(key) as unknown as T | undefined;
  }

  async put<T>(storeName: string, value: T): Promise<IDBValidKey> {
    const db = this.getDatabase();
    
    if (this.config.enableValidation) {
      const validation = this.validator.validate(value, storeName);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const key = await store.put(value);
    
    if (this.config.enableSync && this.syncQueue) {
      await this.syncQueue.enqueue({
        type: 'put',
        storeName,
        value,
        key,
        timestamp: Date.now(),
      });
    }
    
    return key;
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = this.getDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).delete(key);

    if (this.config.enableSync && this.syncQueue) {
      await this.syncQueue.enqueue({
        type: 'delete',
        storeName,
        key,
        timestamp: Date.now(),
      });
    }
  }

  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    const store = await this.getStore(storeName);
    const index = store.index(indexName);
    return index.getAll(value) as unknown as T[];
  }

  async count(storeName: string): Promise<number> {
    const store = await this.getStore(storeName);
    return store.count();
  }

  async clear(storeName: string): Promise<void> {
    const db = this.getDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
  }

  async runIntegrityReport() {
    if (!this.db) throw new Error('Database not initialized');
    return this.integrityChecker.checkDatabase(this.db);
  }

  async repair(repairFn: (storeName: string) => Promise<void>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    for (const store of this.config.stores) {
      try {
        await repairFn(store.name);
      } catch (error) {
        log.storage.error(`Repair failed for ${store.name}`, { error });
      }
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.setState('uninitialized');
  }

  async destroy(): Promise<void> {
    await this.close();
    await this.deleteDatabase();
  }

  private async deleteDatabase(): Promise<void> {
    this.db = null;
    this.setState('uninitialized');
    indexedDB.deleteDatabase(this.config.dbName);
    localStorage.removeItem(`${DB_STATE_KEY}_${this.config.dbName}`);
  }

  getSyncQueue(): SyncQueue | null {
    return this.syncQueue;
  }

  async forceSync(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (!this.syncQueue) {
      return { success: true, synced: 0, failed: 0 };
    }
    return this.syncQueue.processQueue();
  }
}

let dbManagerInstance: DatabaseManager | null = null;

export function createDBManager(config: DBManagerConfig): DatabaseManager {
  dbManagerInstance = new DatabaseManager(config);
  return dbManagerInstance;
}

export function getDBManager(): DatabaseManager | null {
  return dbManagerInstance;
}
