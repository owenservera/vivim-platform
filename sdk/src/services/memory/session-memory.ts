/**
 * Session Memory Manager
 *
 * Inspired by vCode's `src/services/SessionMemory/` pattern.
 * Manages per-session context that persists across turns but is scoped
 * to a specific conversation session.
 *
 * Use cases:
 * - Conversation-specific facts that shouldn't pollute global memory
 * - Session preferences (tone, detail level, format)
 * - Temporary context that expires when the session ends
 * - Session export/import for portability
 */

import type { MemoryEntry, MemoryMetadata, MemoryQuery } from './store.js';
import type { MemoryStore } from './store.js';

export interface SessionConfig {
  /** Session identifier (conversation ID) */
  sessionId: string;
  /** Session title */
  title?: string;
  /** Created timestamp */
  createdAt: number;
  /** Last active timestamp */
  lastActiveAt: number;
  /** Session-specific preferences */
  preferences?: Record<string, unknown>;
  /** Tags for the session */
  tags?: string[];
}

export interface SessionMemory {
  config: SessionConfig;
  memories: MemoryEntry[];
}

/**
 * Session Memory Manager — handles per-session memory scopes.
 *
 * Sessions are isolated from project/user/team memory but can
 * promote memories to those scopes when explicitly requested.
 */
export class SessionMemoryManager {
  private sessions: Map<string, SessionMemory> = new Map();

  constructor(
    private store: MemoryStore,
    private maxSizePerSession = 100 // max memories per session
  ) {}

  /**
   * Get or create a session.
   */
  getOrCreateSession(sessionId: string, options?: { title?: string }): SessionMemory {
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.config.lastActiveAt = Date.now();
      return session;
    }

    const config: SessionConfig = {
      sessionId,
      title: options?.title,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      preferences: {},
      tags: [],
    };

    const session: SessionMemory = { config, memories: [] };
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get an existing session.
   */
  getSession(sessionId: string): SessionMemory | null {
    return this.sessions.get(sessionId) ?? null;
  }

  /**
   * Add a memory to a session.
   */
  async addMemory(
    sessionId: string,
    content: string,
    options: {
      tags?: string[];
      category?: string;
      structured?: Record<string, unknown>;
      /** Promote to project scope immediately */
      promoteToProject?: boolean;
    } = {}
  ): Promise<MemoryEntry | null> {
    const session = this.getOrCreateSession(sessionId);

    // Enforce size limit
    if (session.memories.length >= this.maxSizePerSession) {
      // Remove oldest memory
      session.memories.sort((a, b) => a.meta.createdAt - b.meta.createdAt);
      const oldest = session.memories.shift();
      if (oldest) {
        await this.store.delete('project', oldest.meta.id);
      }
    }

    // Add to store (scoped to project, but tagged with session)
    const tags = [...(options.tags ?? []), `session:${sessionId}`];
    const entry = await this.store.create({
      meta: {
        id: `sess_${sessionId.slice(0, 8)}_${Date.now()}`,
        scope: 'project',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        tags,
        category: options.category ?? 'session',
        sourceId: sessionId,
        contentSize: content.length,
      },
      content,
      structured: options.structured,
    });

    session.memories.push(entry);
    session.config.lastActiveAt = Date.now();

    return entry;
  }

  /**
   * Get all memories for a session.
   */
  getSessionMemories(sessionId: string): MemoryEntry[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return [...session.memories];
  }

  /**
   * Get session memories as a query result.
   */
  async getSessionMemoriesAsQuery(sessionId: string, query?: Partial<MemoryQuery>): Promise<MemoryEntry[]> {
    return this.store.list({
      ...query,
      sourceId: sessionId,
    });
  }

  /**
   * Remove a memory from a session.
   */
  async removeMemory(sessionId: string, memoryId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const index = session.memories.findIndex(m => m.meta.id === memoryId);
    if (index === -1) return false;

    session.memories.splice(index, 1);
    return this.store.delete('project', memoryId);
  }

  /**
   * Promote a session memory to user or team scope.
   */
  async promoteMemory(
    sessionId: string,
    memoryId: string,
    targetScope: 'user' | 'team'
  ): Promise<MemoryEntry | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const memory = session.memories.find(m => m.meta.id === memoryId);
    if (!memory) return null;

    // Create in target scope
    const promoted = await this.store.create({
      meta: {
        ...memory.meta,
        id: `${targetScope}_${Date.now()}`,
        scope: targetScope,
        tags: [...memory.meta.tags, `promoted-from:${sessionId}`],
        updatedAt: Date.now(),
        version: 1,
      },
      content: memory.content,
      structured: memory.structured,
    });

    return promoted;
  }

  /**
   * Update session configuration.
   */
  updateSessionConfig(
    sessionId: string,
    updates: Partial<Pick<SessionConfig, 'title' | 'preferences' | 'tags'>>
  ): SessionConfig | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.config = { ...session.config, ...updates };
    return session.config;
  }

  /**
   * List all active sessions.
   */
  listSessions(): SessionConfig[] {
    return Array.from(this.sessions.values()).map(s => s.config);
  }

  /**
   * Close/end a session.
   */
  closeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Export a session as a portable JSON blob.
   */
  exportSession(sessionId: string): SessionMemory | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      config: { ...session.config },
      memories: [...session.memories],
    };
  }

  /**
   * Import a session from an exported blob.
   */
  async importSession(data: SessionMemory): Promise<string> {
    const sessionId = data.config.sessionId;
    this.sessions.set(sessionId, {
      config: { ...data.config, lastActiveAt: Date.now() },
      memories: [...data.memories],
    });

    return sessionId;
  }

  /**
   * Get session statistics.
   */
  getSessionStats(sessionId: string): {
    memoryCount: number;
    totalContentSize: number;
    age: number;
    lastActive: number;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const totalContentSize = session.memories.reduce((sum, m) => sum + m.meta.contentSize, 0);

    return {
      memoryCount: session.memories.length,
      totalContentSize,
      age: Date.now() - session.config.createdAt,
      lastActive: session.config.lastActiveAt,
    };
  }

  /**
   * Clear all sessions (in-memory only, doesn't delete stored memories).
   */
  clearSessions(): void {
    this.sessions.clear();
  }
}
