/**
 * Cache Service
 * 
 * Multi-layer caching for corpus context:
 * - L1: Hot cache (in-memory, 15 min TTL)
 * - L2: Warm cache (Redis, 2 hour TTL)
 * - L3: Cold cache (database query cache, 24 hour TTL)
 * 
 * @created March 27, 2026
 */

import { logger } from '../../../lib/logger';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hitCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

export class CorpusCacheService {
  private l1Cache: Map<string, CacheEntry<any>>;
  private l1TTL: number;
  private l2Cache?: any; // Redis client (optional)
  private l2TTL: number;

  constructor(options?: {
    l1TTL?: number;
    l2TTL?: number;
    redisClient?: any;
  }) {
    this.l1Cache = new Map();
    this.l1TTL = options?.l1TTL || 15 * 60 * 1000; // 15 minutes
    this.l2TTL = options?.l2TTL || 2 * 60 * 60 * 1000; // 2 hours
    this.l2Cache = options?.redisClient;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Try L1 (hot cache) first
    const l1Result = this.getL1<T>(key);
    if (l1Result) {
      return l1Result;
    }

    // Try L2 (warm cache)
    if (this.l2Cache) {
      const l2Result = await this.getL2<T>(key);
      if (l2Result) {
        // Promote to L1
        this.setL1(key, l2Result);
        return l2Result;
      }
    }

    // Cache miss
    return null;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T): Promise<void> {
    // Set in L1
    this.setL1(key, value);

    // Set in L2 if available
    if (this.l2Cache) {
      await this.setL2(key, value);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    // Delete from L1
    this.l1Cache.delete(key);

    // Delete from L2 if available
    if (this.l2Cache) {
      await this.l2Cache.del(key);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidate(pattern: string): Promise<void> {
    const keys = Array.from(this.l1Cache.keys()).filter(k => k.startsWith(pattern));
    for (const key of keys) {
      this.l1Cache.delete(key);
    }

    if (this.l2Cache) {
      // Redis pattern deletion
      const keys = await this.l2Cache.keys(`${pattern}*`);
      if (keys.length > 0) {
        await this.l2Cache.del(keys);
      }
    }

    logger.info({ pattern, l1KeysDeleted: keys.length }, 'Cache invalidated');
  }

  /**
   * Get cache statistics
   */
  getStats(): { l1: CacheStats; l2?: CacheStats } {
    const now = Date.now();
    let hits = 0;
    let misses = 0;

    for (const entry of this.l1Cache.values()) {
      if (entry.expiresAt > now) {
        hits += entry.hitCount;
      }
    }

    const stats: { l1: CacheStats; l2?: CacheStats } = {
      l1: {
        hits,
        misses: 0, // Track separately if needed
        size: this.l1Cache.size,
      },
    };

    return stats;
  }

  /**
   * Get from L1 cache
   */
  private getL1<T>(key: string): T | null {
    const entry = this.l1Cache.get(key);
    if (!entry) {
      return null;
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.l1Cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.value as T;
  }

  /**
   * Set in L1 cache
   */
  private setL1<T>(key: string, value: T): void {
    this.l1Cache.set(key, {
      value,
      expiresAt: Date.now() + this.l1TTL,
      hitCount: 0,
    });

    // Cleanup old entries periodically
    if (this.l1Cache.size > 1000) {
      this.cleanupL1();
    }
  }

  /**
   * Get from L2 cache (Redis)
   */
  private async getL2<T>(key: string): Promise<T | null> {
    if (!this.l2Cache) return null;

    try {
      const data = await this.l2Cache.get(key);
      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'L2 cache get failed');
      return null;
    }
  }

  /**
   * Set in L2 cache (Redis)
   */
  private async setL2<T>(key: string, value: T): Promise<void> {
    if (!this.l2Cache) return;

    try {
      const serialized = JSON.stringify(value);
      await this.l2Cache.setex(key, this.l2TTL / 1000, serialized);
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'L2 cache set failed');
    }
  }

  /**
   * Cleanup expired L1 entries
   */
  private cleanupL1(): void {
    const now = Date.now();
    let deleted = 0;

    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.expiresAt < now) {
        this.l1Cache.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      logger.debug({ deleted }, 'L1 cache cleanup complete');
    }
  }
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  /**
   * Query-level cache key
   */
  corpusQuery(tenantId: string, query: string): string {
    const queryHash = hashString(query.toLowerCase().trim());
    return `corpus:${tenantId}:q:${queryHash}`;
  },

  /**
   * Topic-level cache key
   */
  corpusTopic(tenantId: string, topicSlug: string): string {
    return `corpus:${tenantId}:topic:${topicSlug}`;
  },

  /**
   * Identity cache key (per tenant)
   */
  corpusIdentity(tenantId: string): string {
    return `corpus:${tenantId}:identity`;
  },

  /**
   * Context assembly cache key
   */
  corpusContext(tenantId: string, query: string, avatar: string): string {
    const queryHash = hashString(query.toLowerCase().trim());
    return `corpus:${tenantId}:ctx:${queryHash}:${avatar}`;
  },
};

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
