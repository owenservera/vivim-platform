/**
 * Memory Usage Tracker
 *
 * Inspired by vCode's `src/hooks/useMemoryUsage.ts` pattern.
 * Tracks memory size, quota, growth over time — giving users
 * visibility into their AI knowledge base.
 *
 * User control = user visibility.
 */

export interface MemoryUsageStats {
  /** Total number of memories */
  totalMemories: number;
  /** Memories by scope */
  byScope: Record<'project' | 'user' | 'team', number>;
  /** Total content size in characters */
  totalSize: number;
  /** Estimated token count (rough: chars / 4) */
  estimatedTokens: number;
  /** Memories created in last 24h */
  recentCount: number;
  /** Growth rate (memories per day, last 7 days) */
  growthRate: number;
  /** Oldest memory age in days */
  oldestMemoryAge: number;
  /** Most common tags */
  topTags: Array<{ tag: string; count: number }>;
  /** Category distribution */
  byCategory: Record<string, number>;
  /** Type distribution */
  byType: Record<string, number>;
  /** Quota usage (if quota is set) */
  quota?: {
    max: number;
    used: number;
    percentage: number;
    remaining: number;
  };
}

export interface MemoryUsageSnapshot {
  timestamp: number;
  totalMemories: number;
  totalSize: number;
}

/**
 * Memory Usage Tracker — monitors memory growth and provides stats.
 */
export class MemoryUsageTracker {
  private history: MemoryUsageSnapshot[] = [];
  private quota?: number; // max memories allowed

  /**
   * Set the memory quota.
   */
  setQuota(max: number): void {
    this.quota = max;
  }

  /**
   * Record a usage snapshot.
   */
  recordSnapshot(stats: { totalMemories: number; totalSize: number }): void {
    this.history.push({
      timestamp: Date.now(),
      totalMemories: stats.totalMemories,
      totalSize: stats.totalSize,
    });

    // Keep only last 30 days of history
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.history = this.history.filter(s => s.timestamp > thirtyDaysAgo);
  }

  /**
   * Get current usage statistics.
   */
  getStats(options: {
    totalMemories: number;
    byScope: Record<'project' | 'user' | 'team', number>;
    memories?: Array<{
      meta: {
        tags: string[];
        category: string;
        contentSize: number;
        createdAt: number;
      };
      content: string;
    }>;
  }): MemoryUsageStats {
    const totalSize = options.memories?.reduce((sum, m) => sum + m.meta.contentSize, 0) ?? 0;
    const estimatedTokens = Math.round(totalSize / 4); // Rough estimate

    // Recent count (last 24h)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentCount = options.memories?.filter(m => m.meta.createdAt > oneDayAgo).length ?? 0;

    // Growth rate (memories per day, last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentHistory = this.history.filter(s => s.timestamp > sevenDaysAgo);
    let growthRate = 0;
    if (recentHistory.length >= 2) {
      const first = recentHistory[0];
      const last = recentHistory[recentHistory.length - 1];
      const daysDiff = (last.timestamp - first.timestamp) / (24 * 60 * 60 * 1000);
      growthRate = daysDiff > 0 ? (last.totalMemories - first.totalMemories) / daysDiff : 0;
    }

    // Oldest memory age
    let oldestMemoryAge = 0;
    if (options.memories && options.memories.length > 0) {
      const oldest = Math.min(...options.memories.map(m => m.meta.createdAt));
      oldestMemoryAge = Math.round((Date.now() - oldest) / (24 * 60 * 60 * 1000));
    }

    // Top tags
    const tagCounts: Record<string, number> = {};
    options.memories?.forEach(m => {
      for (const tag of m.meta.tags) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    });
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Category distribution
    const byCategory: Record<string, number> = {};
    options.memories?.forEach(m => {
      byCategory[m.meta.category] = (byCategory[m.meta.category] ?? 0) + 1;
    });

    // Type distribution (from tags that match memory types)
    const memoryTypes = ['fact', 'preference', 'convention', 'instruction', 'context', 'relationship', 'goal'];
    const byType: Record<string, number> = {};
    options.memories?.forEach(m => {
      for (const tag of m.meta.tags) {
        if (memoryTypes.includes(tag)) {
          byType[tag] = (byType[tag] ?? 0) + 1;
        }
      }
    });

    // Quota
    let quota: MemoryUsageStats['quota'];
    if (this.quota) {
      quota = {
        max: this.quota,
        used: options.totalMemories,
        percentage: Math.round((options.totalMemories / this.quota) * 100),
        remaining: Math.max(0, this.quota - options.totalMemories),
      };
    }

    return {
      totalMemories: options.totalMemories,
      byScope: options.byScope,
      totalSize,
      estimatedTokens,
      recentCount,
      growthRate: Math.round(growthRate * 100) / 100,
      oldestMemoryAge,
      topTags,
      byCategory,
      byType,
      quota,
    };
  }

  /**
   * Get growth history.
   */
  getHistory(): MemoryUsageSnapshot[] {
    return [...this.history];
  }

  /**
   * Clear history.
   */
  clearHistory(): void {
    this.history = [];
  }
}
