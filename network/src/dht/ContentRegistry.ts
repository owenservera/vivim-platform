import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
import type { ContentLocation } from '../types.js';

const log = createModuleLogger('dht:registry');

export interface ContentRef {
  id: string;
  type: 'conversation' | 'acu' | 'circle' | 'profile' | 'media';
  ownerId: string;
  size?: number;
  mimeType?: string;
  encryption?: string;
  createdAt: number;
  updatedAt: number;
}

export class ContentRegistry extends EventEmitter {
  private contentRefs: Map<string, ContentRef> = new Map();
  private ownerIndex: Map<string, Set<string>> = new Map();
  private typeIndex: Map<string, Set<string>> = new Map();

  registerContent(ref: ContentRef): void {
    this.contentRefs.set(ref.id, ref);

    const ownerSet = this.ownerIndex.get(ref.ownerId) || new Set();
    ownerSet.add(ref.id);
    this.ownerIndex.set(ref.ownerId, ownerSet);

    const typeSet = this.typeIndex.get(ref.type) || new Set();
    typeSet.add(ref.id);
    this.typeIndex.set(ref.type, typeSet);

    log.debug({ contentId: ref.id, type: ref.type, ownerId: ref.ownerId }, 'Content registered');
    this.emit('content:registered', ref);
  }

  unregisterContent(contentId: string): void {
    const ref = this.contentRefs.get(contentId);
    if (!ref) return;

    this.contentRefs.delete(contentId);

    const ownerSet = this.ownerIndex.get(ref.ownerId);
    ownerSet?.delete(contentId);

    const typeSet = this.typeIndex.get(ref.type);
    typeSet?.delete(contentId);

    log.debug({ contentId }, 'Content unregistered');
    this.emit('content:unregistered', { contentId, ownerId: ref.ownerId });
  }

  getContent(contentId: string): ContentRef | undefined {
    return this.contentRefs.get(contentId);
  }

  getContentByOwner(ownerId: string): ContentRef[] {
    const ids = this.ownerIndex.get(ownerId) || new Set();
    return Array.from(ids).map((id) => this.contentRefs.get(id)!).filter(Boolean);
  }

  getContentByType(type: string): ContentRef[] {
    const ids = this.typeIndex.get(type) || new Set();
    return Array.from(ids).map((id) => this.contentRefs.get(id)!).filter(Boolean);
  }

  searchContent(query: {
    ownerId?: string;
    type?: string;
    mimeType?: string;
    fromTimestamp?: number;
    toTimestamp?: number;
    limit?: number;
    offset?: number;
  }): ContentRef[] {
    let results = Array.from(this.contentRefs.values());

    if (query.ownerId) {
      results = results.filter((c) => c.ownerId === query.ownerId);
    }
    if (query.type) {
      results = results.filter((c) => c.type === query.type);
    }
    if (query.mimeType) {
      results = results.filter((c) => c.mimeType === query.mimeType);
    }
    if (query.fromTimestamp) {
      results = results.filter((c) => c.createdAt >= query.fromTimestamp!);
    }
    if (query.toTimestamp) {
      results = results.filter((c) => c.createdAt <= query.toTimestamp!);
    }

    results.sort((a, b) => b.updatedAt - a.updatedAt);

    const offset = query.offset || 0;
    const limit = query.limit || 50;
    return results.slice(offset, offset + limit);
  }

  updateContent(contentId: string, updates: Partial<ContentRef>): void {
    const existing = this.contentRefs.get(contentId);
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      this.contentRefs.set(contentId, updated);
      log.debug({ contentId, updates }, 'Content updated');
      this.emit('content:updated', updated);
    }
  }

  exists(contentId: string): boolean {
    return this.contentRefs.has(contentId);
  }

  getCount(): { total: number; byType: Record<string, number>; byOwner: number } {
    const byType: Record<string, number> = {};
    for (const [type, ids] of this.typeIndex) {
      byType[type] = ids.size;
    }
    const ownerCounts = Array.from(this.ownerIndex.values()).map((s) => s.size);
    const byOwner = ownerCounts.length > 0 ? Math.max(...ownerCounts) : 0;

    return {
      total: this.contentRefs.size,
      byType,
      byOwner,
    };
  }

  clear(): void {
    this.contentRefs.clear();
    this.ownerIndex.clear();
    this.typeIndex.clear();
    log.info('Content registry cleared');
  }
}

export const contentRegistry = new ContentRegistry();
