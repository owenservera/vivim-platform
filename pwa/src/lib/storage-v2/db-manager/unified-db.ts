import { DatabaseManager, type DBManagerConfig, type StoreDefinition, type Migration } from './database-manager';
import { type SyncQueueConfig } from './sync-queue';
import { DataValidator, type ValidationResult, type SchemaDefinition } from './data-validator';
import { IntegrityChecker, type IntegrityReport } from './integrity-checker';
import { ConflictResolver, type ConflictResolution, type ConflictStrategy, type ConflictRecord } from './conflict-resolver';
import { log } from '../../logger';

const DEFAULT_STORES: StoreDefinition[] = [
  {
    name: 'conversations',
    keyPath: 'id',
    indexes: [
      { name: 'createdAt', keyPath: 'createdAt' },
      { name: 'updatedAt', keyPath: 'updatedAt' },
      { name: 'author', keyPath: 'author' },
    ],
  },
  {
    name: 'messages',
    keyPath: 'id',
    indexes: [
      { name: 'conversationId', keyPath: 'conversationId' },
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'role', keyPath: 'role' },
    ],
  },
  {
    name: 'objects',
    keyPath: 'id',
    indexes: [
      { name: 'type', keyPath: 'type' },
      { name: 'author', keyPath: 'author' },
      { name: 'timestamp', keyPath: 'timestamp' },
    ],
  },
  {
    name: 'snapshots',
    keyPath: 'id',
    indexes: [
      { name: 'conversationId', keyPath: 'conversationId' },
      { name: 'name', keyPath: 'name' },
    ],
  },
  {
    name: 'sync_queue',
    keyPath: 'id',
    indexes: [
      { name: 'status', keyPath: 'status' },
      { name: 'timestamp', keyPath: 'timestamp' },
    ],
  },
];

const DEFAULT_MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: async (_db) => {
      log.storage.info('Running initial migration v1');
    },
  },
];

export interface UnifiedDBConfig {
  dbName?: string;
  version?: number;
  stores?: StoreDefinition[];
  migrations?: Migration[];
  enableValidation?: boolean;
  enableIntegrityCheck?: boolean;
  enableSync?: boolean;
  syncConfig?: Partial<SyncQueueConfig>;
}

export interface DBStatus {
  state: string;
  isReady: boolean;
  isOnline: boolean;
  pendingOperations: number;
  lastSyncAt: string | null;
  integrityReport: IntegrityReport | null;
}

class UnifiedDatabase {
  private manager: DatabaseManager | null = null;
  private validator: DataValidator;
  private integrityChecker: IntegrityChecker;
  private conflictResolver: ConflictResolver;
  private config: UnifiedDBConfig;
  private initialized = false;

  constructor(config: UnifiedDBConfig = {}) {
    this.config = {
      // Use 'VivimSync' — NOT 'VivimDB'. The main object-store.ts opens
      // 'VivimDB' at version 3. Opening the same DB at version 1 causes
      // IDB to permanently block the request, leading to the 15s timeout.
      dbName: 'VivimSync',
      version: 2,
      stores: DEFAULT_STORES,
      migrations: DEFAULT_MIGRATIONS,
      enableValidation: true,
      enableIntegrityCheck: false, // integrity check is expensive; keep disabled by default
      enableSync: false, // sync enabled per-call when needed
      ...config,
    };

    this.validator = new DataValidator();
    this.integrityChecker = new IntegrityChecker();
    this.conflictResolver = new ConflictResolver();
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    const managerConfig: DBManagerConfig = {
      dbName: this.config.dbName!,
      version: this.config.version!,
      stores: this.config.stores!,
      migrations: this.config.migrations!,
      enableValidation: this.config.enableValidation,
      enableIntegrityCheck: this.config.enableIntegrityCheck,
      enableSync: this.config.enableSync,
    };

    this.manager = new DatabaseManager(managerConfig);
    await this.manager.initialize();
    this.initialized = true;

    log.storage.info(`UnifiedDatabase initialized: ${this.config.dbName}`);
  }

  async ready(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  async put<T>(storeName: string, value: T): Promise<IDBValidKey> {
    await this.ready();
    return this.manager!.put(storeName, value);
  }


  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    await this.ready();
    return this.manager!.getByKey<T>(storeName, key);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    await this.ready();
    return this.manager!.getAll<T>(storeName);
  }

  async getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
    await this.ready();
    return this.manager!.getByIndex<T>(storeName, indexName, value);
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    await this.ready();
    return this.manager!.delete(storeName, key);
  }

  async count(storeName: string): Promise<number> {
    await this.ready();
    return this.manager!.count(storeName);
  }

  async clear(storeName: string): Promise<void> {
    await this.ready();
    return this.manager!.clear(storeName);
  }

  validate(data: unknown, schemaName: string): ValidationResult {
    return this.validator.validate(data, schemaName);
  }

  sanitize<T extends Record<string, unknown>>(data: T, schemaName: string): T {
    return this.validator.sanitize(data, schemaName);
  }

  async runIntegrityCheck(): Promise<IntegrityReport> {
    await this.ready();
    return this.manager!.runIntegrityReport();
  }

  detectConflict(
    local: { data: unknown; timestamp: number; version: number },
    remote: { data: unknown; timestamp: number; version: number },
    entityType: string,
    entityId: string
  ): ConflictRecord | null {
    return this.conflictResolver.detectConflict(
      { ...local, source: 'local' },
      { ...remote, source: 'remote' },
      entityType,
      entityId
    );
  }

  resolve(conflict: ConflictRecord, strategy?: ConflictStrategy): ConflictResolution {
    return this.conflictResolver.resolve(conflict, strategy);
  }

  setManualResolution(
    entityType: string,
    entityId: string,
    resolution: ConflictResolution
  ): void {
    this.conflictResolver.setManualResolution(entityType, entityId, resolution);
  }

  async sync(): Promise<{ success: boolean; synced: number; failed: number }> {
    await this.ready();
    return this.manager!.forceSync();
  }

  async getStatus(): Promise<DBStatus> {
    const state = this.manager?.getState() || 'uninitialized';
    const queue = this.manager?.getSyncQueue();
    const queueStatus = queue ? await queue.getStatus() : null;

    return {
      state,
      isReady: state === 'ready',
      isOnline: navigator.onLine,
      pendingOperations: queueStatus?.pending || 0,
      lastSyncAt: null,
      integrityReport: null,
    };
  }

  async close(): Promise<void> {
    if (this.manager) {
      await this.manager.close();
      this.initialized = false;
    }
  }

  async destroy(): Promise<void> {
    if (this.manager) {
      await this.manager.destroy();
      this.initialized = false;
    }
  }

  getValidator(): DataValidator {
    return this.validator;
  }

  getIntegrityChecker(): IntegrityChecker {
    return this.integrityChecker;
  }

  getConflictResolver(): ConflictResolver {
    return this.conflictResolver;
  }

  isReady(): boolean {
    return this.initialized && this.manager?.isReady() === true;
  }
}

let dbInstance: UnifiedDatabase | null = null;
let dbInitializing: Promise<UnifiedDatabase> | null = null;

export function createUnifiedDB(config?: UnifiedDBConfig): UnifiedDatabase {
  dbInstance = new UnifiedDatabase(config);
  dbInitializing = null; // reset init promise when creating fresh instance
  return dbInstance;
}

export function getUnifiedDB(): UnifiedDatabase | null {
  return dbInstance;
}

export async function initUnifiedDB(config?: UnifiedDBConfig): Promise<UnifiedDatabase> {
  // Reuse existing promise if already initializing
  if (dbInitializing) return dbInitializing;
  
  // Reuse existing instance if already initialized
  if (dbInstance && dbInstance.isReady()) return dbInstance;

  dbInitializing = (async () => {
    const db = dbInstance ?? createUnifiedDB(config);
    await db.init();
    return db;
  })();

  try {
    return await dbInitializing;
  } finally {
    dbInitializing = null;
  }
}

export type { ValidationResult, SchemaDefinition, IntegrityReport, ConflictResolution, ConflictRecord };
