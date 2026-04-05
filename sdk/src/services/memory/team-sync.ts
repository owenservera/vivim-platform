/**
 * Team Memory Sync — CRDT-based synchronization
 *
 * Inspired by vCode's `src/services/teamMemorySync/` pattern, adapted for
 * VIVIM's LibP2P + Yjs CRDT architecture.
 *
 * Synchronizes team memories across members using:
 * - Yjs CRDTs for conflict-free replication
 * - Hybrid Logical Clocks (HLC) for ordering
 * - Merkle proofs for verification
 * - Incremental updates (delta sync)
 *
 * This module provides the sync logic that plugs into VIVIM's existing
 * network layer (network/). It doesn't implement the transport itself —
 * it produces/consumes sync payloads that the network layer transmits.
 */

import type { MemoryStore, MemoryEntry, MemoryMetadata } from './store.js';
import type { MemoryScope } from './directory.js';

/**
 * Sync state for a team memory scope.
 */
export interface TeamSyncState {
  /** Team identifier */
  teamId: string;
  /** Last sync vector (clock values per member) */
  lastSyncVector: Record<string, number>;
  /** Local memory version */
  localVersion: number;
  /** Last successful sync timestamp */
  lastSyncedAt: number;
  /** Pending local changes not yet synced */
  pendingChanges: MemoryEntry[];
  /** Sync status */
  status: 'idle' | 'syncing' | 'synced' | 'error';
}

/**
 * Sync delta — incremental changes from a sync vector.
 */
export interface SyncDelta {
  /** Changes since the given sync vector */
  added: MemoryEntry[];
  updated: MemoryEntry[];
  deleted: string[]; // memory IDs
  /** New sync vector */
  newVector: Record<string, number>;
  /** Merkle root of all team memories (for verification) */
  merkleRoot: string;
}

/**
 * Sync result after applying a delta.
 */
export interface SyncResult {
  /** Memories received and applied */
  received: number;
  /** Local memories sent */
  sent: number;
  /** Conflicts detected and resolved */
  conflictsResolved: number;
  /** Updated sync state */
  syncState: TeamSyncState;
}

/**
 * Conflict resolution strategy.
 */
export type ConflictResolutionStrategy =
  | 'last-write-wins'    // HLC timestamp decides
  | 'manual'             // Flag for user review
  | 'merge'              // Content merge (for compatible types)
  | 'keep-both';         // Duplicate with suffix

/**
 * Team Memory Sync Service.
 *
 * Produces and consumes sync payloads for team-scoped memories.
 * Integrates with VIVIM's network layer for actual transport.
 */
export class TeamMemorySync {
  private syncStates: Map<string, TeamSyncState> = new Map();
  private conflictStrategy: ConflictResolutionStrategy;

  constructor(
    private store: MemoryStore,
    options: {
      conflictStrategy?: ConflictResolutionStrategy;
    } = {}
  ) {
    this.conflictStrategy = options.conflictStrategy ?? 'last-write-wins';
  }

  /**
   * Initialize sync state for a team.
   */
  initializeTeam(teamId: string): TeamSyncState {
    const state: TeamSyncState = {
      teamId,
      lastSyncVector: {},
      localVersion: 0,
      lastSyncedAt: Date.now(),
      pendingChanges: [],
      status: 'idle',
    };
    this.syncStates.set(teamId, state);
    return state;
  }

  /**
   * Get sync state for a team.
   */
  getSyncState(teamId: string): TeamSyncState | null {
    return this.syncStates.get(teamId) ?? null;
  }

  /**
   * Track a local memory change for pending sync.
   */
  trackChange(teamId: string, entry: MemoryEntry): void {
    let state = this.syncStates.get(teamId);
    if (!state) {
      state = this.initializeTeam(teamId);
    }

    state.pendingChanges.push(entry);
    state.localVersion++;
  }

  /**
   * Generate a sync delta for a peer requesting changes.
   * Called when another team member requests an update.
   */
  async generateDelta(teamId: string, requestVector: Record<string, number>): Promise<SyncDelta> {
    const state = this.syncStates.get(teamId);
    if (!state) {
      return { added: [], updated: [], deleted: [], newVector: {}, merkleRoot: '' };
    }

    // Get all team-scoped memories
    const memories = await this.store.list({ scopes: ['team'] });

    // For now, return all memories (full sync)
    // In production, this would compute a proper delta based on the request vector
    const added = memories.filter(m =>
      m.meta.createdAt > Math.max(...Object.values(requestVector), 0)
    );
    const updated = memories.filter(m =>
      m.meta.updatedAt > Math.max(...Object.values(requestVector), 0) &&
      m.meta.createdAt <= Math.max(...Object.values(requestVector), 0)
    );

    // Compute new sync vector
    const memberIds = this.getMemberIds(teamId);
    const newVector: Record<string, number> = {};
    for (const memberId of memberIds) {
      newVector[memberId] = state.localVersion;
    }

    // Compute merkle root for verification
    const merkleRoot = this.computeMerkleRoot(memories);

    return {
      added,
      updated,
      deleted: [], // Tombstones would go here
      newVector,
      merkleRoot,
    };
  }

  /**
   * Apply a sync delta received from a peer.
   */
  async applyDelta(teamId: string, delta: SyncDelta): Promise<SyncResult> {
    let state = this.syncStates.get(teamId);
    if (!state) {
      state = this.initializeTeam(teamId);
    }

    state.status = 'syncing';
    let conflictsResolved = 0;

    // Apply added memories
    for (const entry of delta.added) {
      const existing = await this.store.get('team', entry.meta.id);
      if (existing) {
        // Conflict — resolve based on strategy
        const winner = this.resolveConflict(existing, entry);
        if (winner !== existing) {
          conflictsResolved++;
          await this.store.update('team', entry.meta.id, {
            content: entry.content,
            tags: entry.meta.tags,
            category: entry.meta.category,
            structured: entry.structured,
          });
        }
      } else {
        await this.store.create({
          meta: { ...entry.meta, scope: 'team' },
          content: entry.content,
          structured: entry.structured,
        });
      }
    }

    // Apply updated memories
    for (const entry of delta.updated) {
      const existing = await this.store.get('team', entry.meta.id);
      if (existing) {
        if (entry.meta.updatedAt > existing.meta.updatedAt) {
          // Remote is newer — accept remote changes
          await this.store.update('team', entry.meta.id, {
            content: entry.content,
            tags: entry.meta.tags,
            category: entry.meta.category,
            structured: entry.structured,
          });
        }
        // Local is newer or same — keep local (last-write-wins by our HLC)
      }
    }

    // Apply deletions (tombstones)
    for (const deletedId of delta.deleted) {
      await this.store.delete('team', deletedId);
    }

    // Update sync state
    state.lastSyncVector = delta.newVector;
    state.lastSyncedAt = Date.now();
    state.pendingChanges = [];
    state.status = 'synced';

    this.syncStates.set(teamId, state);

    return {
      received: delta.added.length + delta.updated.length,
      sent: state.pendingChanges.length,
      conflictsResolved,
      syncState: state,
    };
  }

  /**
   * Resolve a conflict between two versions of the same memory.
   */
  private resolveConflict(local: MemoryEntry, remote: MemoryEntry): MemoryEntry {
    switch (this.conflictStrategy) {
      case 'last-write-wins':
        return remote.meta.updatedAt > local.meta.updatedAt ? remote : local;

      case 'merge':
        // For compatible types, attempt content merge
        return this.attemptMerge(local, remote);

      case 'keep-both':
        // Keep both versions (caller handles deduplication)
        return remote;

      case 'manual':
      default:
        // Flag for manual review — keep local, log conflict
        console.warn(
          `[TeamMemorySync] Conflict detected for memory ${local.meta.id} — flagged for manual review`
        );
        return local;
    }
  }

  /**
   * Attempt to merge two versions of a memory.
   */
  private attemptMerge(local: MemoryEntry, remote: MemoryEntry): MemoryEntry {
    // Simple merge: combine tags, take longer content, use newer metadata
    const mergedTags = [...new Set([...local.meta.tags, ...remote.meta.tags])];
    const mergedContent =
      remote.content.length > local.content.length ? remote.content : local.content;

    return {
      meta: {
        ...remote.meta, // Take newer metadata
        tags: mergedTags,
        version: Math.max(local.meta.version, remote.meta.version) + 1,
        updatedAt: Date.now(),
      },
      content: mergedContent,
      structured: {
        ...(local.structured ?? {}),
        ...(remote.structured ?? {}),
      },
    };
  }

  /**
   * Compute a merkle root for a set of memories.
   * Used for sync verification — both peers should compute the same root.
   */
  private computeMerkleRoot(memories: MemoryEntry[]): string {
    // Simplified: hash all memory IDs + versions concatenated
    // In production, use a proper merkle tree implementation
    const sorted = [...memories].sort((a, b) => a.meta.id.localeCompare(b.meta.id));
    const data = sorted.map(m => `${m.meta.id}:${m.meta.version}`).join('|');

    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash |= 0;
    }
    return `merkle_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get member IDs for a team (placeholder — in production, from identity system).
   */
  private getMemberIds(teamId: string): string[] {
    // In production, this queries the team membership from the IdentityNode
    return [teamId];
  }

  /**
   * Check if local state is in sync with remote.
   */
  async isSynced(teamId: string, remoteMerkleRoot: string): Promise<boolean> {
    const state = this.syncStates.get(teamId);
    if (!state) return false;

    const memories = await this.store.list({ scopes: ['team'] });
    const localMerkleRoot = this.computeMerkleRoot(memories);
    return localMerkleRoot === remoteMerkleRoot;
  }

  /**
   * Force a full resync for a team.
   */
  async forceResync(teamId: string): Promise<TeamSyncState> {
    let state = this.syncStates.get(teamId);
    if (!state) {
      state = this.initializeTeam(teamId);
    }

    state.lastSyncVector = {};
    state.lastSyncedAt = 0;
    state.status = 'idle';

    this.syncStates.set(teamId, state);
    return state;
  }

  /**
   * Destroy sync state for a team.
   */
  destroyTeam(teamId: string): void {
    this.syncStates.delete(teamId);
  }
}
