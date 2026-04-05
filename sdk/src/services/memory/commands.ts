/**
 * Memory Commands — CRUD operations on memories
 *
 * Ported from vCode's /memory command pattern, adapted for VIVIM's web API.
 * Provides user-facing operations: create, read, update, delete, search, list, export, import.
 */

import type { MemoryStore, MemoryEntry, MemoryMetadata, MemoryQuery } from './store.js';
import type { MemoryScope } from './directory.js';

export interface CreateMemoryInput {
  content: string;
  scope?: MemoryScope;
  tags?: string[];
  category?: string;
  sourceId?: string;
  provider?: string;
  structured?: Record<string, unknown>;
}

export interface UpdateMemoryInput {
  id: string;
  scope: MemoryScope;
  content?: string;
  tags?: string[];
  category?: string;
  structured?: Record<string, unknown>;
}

/**
 * High-level memory commands — the interface used by the rest of the SDK.
 */
export class MemoryCommands {
  constructor(private store: MemoryStore) {}

  /**
   * Add a new memory.
   */
  async add(input: CreateMemoryInput): Promise<MemoryEntry> {
    const scope = input.scope ?? 'project';
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const metadata: MemoryMetadata = {
      id,
      scope,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      tags: input.tags ?? [],
      category: input.category ?? 'general',
      sourceId: input.sourceId,
      provider: input.provider,
      contentSize: input.content.length,
    };

    return this.store.create({
      meta: metadata,
      content: input.content,
      structured: input.structured,
    });
  }

  /**
   * Get a specific memory.
   */
  async get(scope: MemoryScope, id: string): Promise<MemoryEntry | null> {
    return this.store.get(scope, id);
  }

  /**
   * Update a memory.
   */
  async update(input: UpdateMemoryInput): Promise<MemoryEntry | null> {
    const updates: Parameters<MemoryStore['update']>[2] = {};
    if (input.content !== undefined) updates.content = input.content;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.category !== undefined) updates.category = input.category;
    if (input.structured !== undefined) updates.structured = input.structured;

    return this.store.update(input.scope, input.id, updates);
  }

  /**
   * Delete a memory.
   */
  async delete(scope: MemoryScope, id: string): Promise<boolean> {
    return this.store.delete(scope, id);
  }

  /**
   * List memories with optional filtering.
   */
  async list(query: MemoryQuery = {}): Promise<MemoryEntry[]> {
    return this.store.list(query);
  }

  /**
   * Search memories by text.
   */
  async search(text: string, options?: { limit?: number; scopes?: MemoryScope[] }): Promise<MemoryEntry[]> {
    return this.store.search(text, options);
  }

  /**
   * Get total memory count.
   */
  count(scope?: MemoryScope): number {
    return this.store.count(scope);
  }

  /**
   * Export all memories as portable JSON.
   */
  exportAll(): Record<MemoryScope, MemoryEntry[]> {
    return this.store.exportAll();
  }

  /**
   * Import memories from portable JSON.
   */
  async importAll(data: Record<MemoryScope, MemoryEntry[]>): Promise<number> {
    return this.store.importAll(data);
  }

  /**
   * Clear all memories (nuclear option — supports "right to forget").
   */
  async clear(scope?: MemoryScope): Promise<void> {
    return this.store.clear(scope);
  }
}
