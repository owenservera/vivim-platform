export { DatabaseManager, createDBManager, getDBManager } from './database-manager';
export type { DBManagerConfig, StoreDefinition, IndexDefinition, Migration, InitState } from './database-manager';
export { SyncQueue } from './sync-queue';
export type { QueuedOperation, SyncQueueConfig } from './sync-queue';
export { DataValidator } from './data-validator';
export type { ValidationResult, ValidationError, SchemaDefinition, SchemaProperty } from './data-validator';
export { IntegrityChecker } from './integrity-checker';
export type { IntegrityReport, StoreReport, StoreIssue } from './integrity-checker';
export { ConflictResolver } from './conflict-resolver';
export type { ConflictResolution, ConflictStrategy, ConflictRecord, EntityVersion } from './conflict-resolver';
export {
  UnifiedDatabase,
  createUnifiedDB,
  getUnifiedDB,
  initUnifiedDB,
  runDBTests,
  verifySyncWorking,
  testOfflineQueue,
} from './unified-db';
export type { UnifiedDBConfig, DBStatus } from './unified-db';
export { initializeTestDB, getUnifiedDB as getTestDB } from './test-utils';
