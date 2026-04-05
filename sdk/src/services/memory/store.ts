/**
 * Memory Store — Core persistence layer
 *
 * Stores memories as typed JSON entries across three scopes:
 * project, user, team.
 *
 * In production, this delegates to environment-specific storage:
 * - Node.js/Bun: filesystem (JSON files)
 * - Browser: IndexedDB
 * - PWA: IndexedDB + server sync
 *
 * For now, implements an in-memory store with file export capability
 * that mirrors the vCode memdir/ file-based pattern.
 */

import type { MemoryScope, MemoryDirectoryManager } from './directory.js';

export interface MemoryMetadata {
  id: string;
  scope: MemoryScope;
  createdAt: number;
  updatedAt: number;
  version: number;
  tags: string[];
  category: string;
  /** Source reference (e.g., conversation ID) */
  sourceId?: string;
  /** LLM provider that generated this memory */
  provider?: string;
  /** Content hash for deduplication */
  contentHash?: string;
  /** Size in characters (proxy for token count) */
  contentSize: number;
}

export interface MemoryEntry {
  meta: MemoryMetadata;
  content: string;
  /** Optional structured data extracted from content */
  structured?: Record<string, unknown>;
}

export interface MemoryQuery {
  /** Free-text search across content */
  text?: string;
  /** Filter by memory scope */
  scopes?: MemoryScope[];
  /** Filter by tags (AND match) */
  tags?: string[];
  /** Filter by category */
  categories?: string[];
  /** Filter by source ID */
  sourceId?: string;
  /** Date range filter */
  dateRange?: { from: number; to: number };
  /** Maximum results */
  limit?: number;
  /** Sort order */
  sortBy?: 'createdAt' | 'updatedAt' | 'relevance';
  sortDir?: 'asc' | 'desc';
}

/**
 * In-memory store with file export capability.
 * Acts as the bridge between the hierarchical directory structure
 * and actual persistence (IndexedDB in browser, filesystem in Node).
 */
export class MemoryStore {
  private stores: Record<MemoryScope, Map<string, MemoryEntry>> = {
    project: new Map(),
    user: new Map(),
    team: new Map(),
  };

  constructor(
    private dirManager: MemoryDirectoryManager,
    private storageAdapter?: StorageAdapter
  ) {}

  /**
   * Initialize the store — load from storage adapter if available.
   */
  async initialize(): Promise<void> {
    if (!this.storageAdapter) return;

    for (const scope of ['project', 'user', 'team'] as MemoryScope[]) {
      const dir = this.dirManager.getDirectory(scope);
      const entries = await this.storageAdapter.loadScope(dir);
      if (entries) {
        for (const entry of entries) {
          this.stores[scope].set(entry.meta.id, entry);
        }
      }
    }
  }

  // ============================================
  // CRUD Operations
  // ============================================

  /**
   * Create a new memory entry.
   */
  async create(entry: MemoryEntry): Promise<MemoryEntry> {
    this.stores[entry.meta.scope].set(entry.meta.id, entry);
    await this.persist(entry.meta.scope, entry.meta.id);
    return entry;
  }

  /**
   * Get a memory entry by ID and scope.
   */
  async get(scope: MemoryScope, id: string): Promise<MemoryEntry | null> {
    return this.stores[scope].get(id) ?? null;
  }

  /**
   * Update an existing memory entry.
   */
  async update(
    scope: MemoryScope,
    id: string,
    updates: Partial<Pick<MemoryEntry, 'content' | 'structured'>> & Partial<Pick<MemoryMetadata, 'tags' | 'category'>>
  ): Promise<MemoryEntry | null> {
    const existing = this.stores[scope].get(id);
    if (!existing) return null;

    const updated: MemoryEntry = {
      ...existing,
      ...updates,
      meta: {
        ...existing.meta,
        ...updates,
        updatedAt: Date.now(),
        version: existing.meta.version + 1,
        contentSize: (updates.content ?? existing.content).length,
      },
    };

    this.stores[scope].set(id, updated);
    await this.persist(scope, id);
    return updated;
  }

  /**
   * Delete a memory entry.
   */
  async delete(scope: MemoryScope, id: string): Promise<boolean> {
    const existed = this.stores[scope].delete(id);
    if (existed) {
      await this.destroy(scope, id);
    }
    return existed;
  }

  /**
   * List memories across all scopes, with optional filtering.
   */
  async list(query: MemoryQuery = {}): Promise<MemoryEntry[]> {
    let results: MemoryEntry[] = [];

    const scopes = query.scopes ?? ['project', 'user', 'team'];
    for (const scope of scopes) {
      results.push(...this.stores[scope].values());
    }

    // Apply filters
    if (query.tags && query.tags.length > 0) {
      results = results.filter(m =>
        query.tags!.every(tag => m.meta.tags.includes(tag))
      );
    }

    if (query.categories && query.categories.length > 0) {
      results = results.filter(m =>
        query.categories!.includes(m.meta.category)
      );
    }

    if (query.sourceId) {
      results = results.filter(m => m.meta.sourceId === query.sourceId);
    }

    if (query.text) {
      const text = query.text.toLowerCase();
      results = results.filter(m =>
        m.content.toLowerCase().includes(text) ||
        m.meta.tags.some(t => t.toLowerCase().includes(text)) ||
        m.meta.category.toLowerCase().includes(text)
      );
    }

    if (query.dateRange) {
      results = results.filter(m =>
        m.meta.createdAt >= query.dateRange!.from &&
        m.meta.createdAt <= query.dateRange!.to
      );
    }

    // Sort
    const sortBy = query.sortBy ?? 'updatedAt';
    const sortDir = query.sortDir ?? 'desc';

    results.sort((a, b) => {
      const aVal = sortBy === 'createdAt' ? a.meta.createdAt : a.meta.updatedAt;
      const bVal = sortBy === 'createdAt' ? b.meta.createdAt : b.meta.updatedAt;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Search memories by text across all scopes.
   */
  async search(text: string, options?: { limit?: number; scopes?: MemoryScope[] }): Promise<MemoryEntry[]> {
    return this.list({ text, limit: options?.limit, scopes: options?.scopes });
  }

  /**
   * Get all memory IDs for a scope.
   */
  getIds(scope: MemoryScope): string[] {
    return Array.from(this.stores[scope].keys());
  }

  /**
   * Get memory count for a scope.
   */
  count(scope?: MemoryScope): number {
    if (scope) return this.stores[scope].size;
    return this.stores.project.size + this.stores.user.size + this.stores.team.size;
  }

  /**
   * Clear all memories for a scope.
   */
  async clear(scope?: MemoryScope): Promise<void> {
    if (scope) {
      this.stores[scope].clear();
      await this.storageAdapter?.clearScope(this.dirManager.getDirectory(scope));
    } else {
      for (const s of ['project', 'user', 'team'] as MemoryScope[]) {
        this.stores[s].clear();
        await this.storageAdapter?.clearScope(this.dirManager.getDirectory(s));
      }
    }
  }

  // ============================================
  // Persistence
  // ============================================

  private async persist(scope: MemoryScope, id: string): Promise<void> {
    if (!this.storageAdapter) return;
    const entry = this.stores[scope].get(id);
    if (!entry) return;

    const dir = this.dirManager.getDirectory(scope);
    await this.storageAdapter.saveEntry(dir, entry);
  }

  private async destroy(scope: MemoryScope, id: string): Promise<void> {
    if (!this.storageAdapter) return;
    const dir = this.dirManager.getDirectory(scope);
    await this.storageAdapter.deleteEntry(dir, id);
  }

  /**
   * Export all memories as a portable JSON blob.
   * Core to VIVIM's "own your data" mission.
   */
  exportAll(): Record<MemoryScope, MemoryEntry[]> {
    const result: Record<MemoryScope, MemoryEntry[]> = {
      project: Array.from(this.stores.project.values()),
      user: Array.from(this.stores.user.values()),
      team: Array.from(this.stores.team.values()),
    };
    return result;
  }

  /**
   * Import memories from a portable JSON blob.
   */
  async importAll(data: Record<MemoryScope, MemoryEntry[]>): Promise<number> {
    let count = 0;
    for (const scope of ['project', 'user', 'team'] as MemoryScope[]) {
      for (const entry of data[scope] ?? []) {
        await this.create(entry);
        count++;
      }
    }
    return count;
  }
}

/**
 * Storage adapter interface — implemented by environment-specific modules.
 */
export interface StorageAdapter {
  /** Load all entries for a scope */
  loadScope(dir: { scope: MemoryScope; rootPath: string; memoriesPath: string; indexPath: string }): Promise<MemoryEntry[] | null>;
  /** Save a single entry */
  saveEntry(dir: { scope: MemoryScope; rootPath: string; memoriesPath: string; indexPath: string }, entry: MemoryEntry): Promise<void>;
  /** Delete a single entry */
  deleteEntry(dir: { scope: MemoryScope; rootPath: string; memoriesPath: string; indexPath: string }, id: string): Promise<void>;
  /** Clear all entries for a scope */
  clearScope(dir: { scope: MemoryScope; rootPath: string; memoriesPath: string; indexPath: string }): Promise<void>;
}

/**
 * No-op storage adapter (in-memory only).
 */
export class NoOpStorageAdapter implements StorageAdapter {
  async loadScope(): Promise<MemoryEntry[] | null> { return null; }
  async saveEntry(): Promise<void> {}
  async deleteEntry(): Promise<void> {}
  async clearScope(): Promise<void> {}
}
