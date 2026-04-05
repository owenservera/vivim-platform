/**
 * VIVIM SDK — Hierarchical Memory System
 *
 * Inspired by the vCode memdir/ pattern, adapted for VIVIM's web/P2P architecture.
 * Three-tier memory hierarchy:
 *   1. Project Memory — scoped to a specific project/workspace
 *   2. User Memory — scoped to the individual user (cross-project)
 *   3. Team Memory — shared across team members (synced via CRDT)
 *
 * All memory is file-based (JSON) for user sovereignty — no vendor lock-in.
 * Users can read, edit, export, and delete their memory files directly.
 */

export { MemoryDirectoryManager, type MemoryScope, type MemoryFileInfo, type MemoryDirectory } from './directory.js';
export { MemoryStore, type MemoryEntry, type MemoryMetadata, type MemoryQuery, type StorageAdapter, NoOpStorageAdapter } from './store.js';
export { MemoryCommands } from './commands.js';
export { MemoryExtractor } from './extractor.js';
export { SessionMemoryManager, type SessionConfig, type SessionMemory } from './session-memory.js';
export { MemoryUsageTracker, type MemoryUsageStats, type MemoryUsageSnapshot } from './usage.js';
export {
  TeamMemorySync,
  type TeamSyncState,
  type SyncDelta,
  type SyncResult,
  type ConflictResolutionStrategy,
} from './team-sync.js';
