/**
 * Rediscovery Source
 * Surfaces conversations at optimal intervals
 * X Parallel: search-index (In-Network)
 */

import type { Conversation, Candidate } from '../types';
import { getStorage } from '../../storage-v2';

export interface RediscoveryConfig {
  intervals: string[];
  limitPerInterval: number;
}

const DEFAULT_INTERVALS = [
  'P1D',   // 1 day ago
  'P1W',   // 1 week ago
  'P1M',   // 1 month ago
  'P3M',   // 3 months ago
  'P1Y'    // 1 year ago
];

export class RediscoverySource {
  private config: RediscoveryConfig;

  constructor(config?: Partial<RediscoveryConfig>) {
    this.config = {
      intervals: config?.intervals || DEFAULT_INTERVALS,
      limitPerInterval: config?.limitPerInterval || 5
    };
  }

  /**
   * Fetch candidates from time-based intervals
   */
  async fetch(limit = 20): Promise<Candidate[]> {
    try {
      const storage = await getStorage();
      const candidates: Candidate[] = [];
      const now = new Date();

      for (const interval of this.config.intervals) {
        const endDate = new Date(now);
        const startDate = new Date(now);

        const hoursAgo = this.parseDuration(interval);
        startDate.setHours(startDate.getHours() - hoursAgo);

        // Fetch conversations
        const conversations = await storage.listConversations({
          filter: {
            privacy: ['local', 'shared']
          },
          sortBy: 'createdAt',
          order: 'desc',
          limit: this.config.limitPerInterval * 2
        });

        // Filter to interval
        const inInterval = conversations.filter((c: Conversation) => {
          const created = new Date(c.createdAt);
          return created >= startDate && created <= endDate;
        });

        // Convert to candidates
        for (const conv of inInterval.slice(0, this.config.limitPerInterval)) {
          const reason = this.getReason(interval);
          candidates.push({
            conversation: conv,
            source: 'rediscovery',
            score: this.calculateRediscoveryScore(conv, interval),
            features: {},
            reason
          });
        }
      }

      // Sort by score and return top N
      candidates.sort((a, b) => b.score - a.score);
      return candidates.slice(0, limit);
    } catch (error) {
      console.error('[RediscoverySource] Error fetching candidates:', error);
      return [];
    }
  }

  /**
   * Calculate rediscovery score
   */
  private calculateRediscoveryScore(
    conversation: Conversation,
    interval: string
  ): number {
    let score = 50; // Base score

    // Boost based on interval
    const intervalBoost: Record<string, number> = {
      'P1D': 20,
      'P1W': 25,
      'P1M': 30,
      'P3M': 20,
      'P1Y': 15
    };
    score += intervalBoost[interval] || 10;

    // Quality boost
    if (conversation.qualityScore) {
      score += conversation.qualityScore * 0.3;
    }

    // View decay
    if (conversation.stats.lastViewedAt) {
      const lastViewed = new Date(conversation.stats.lastViewedAt);
      const daysSinceView = (Date.now() - lastViewed.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceView < 1) {
        score -= 30;
      } else if (daysSinceView < 7) {
        score -= 15;
      }
    }

    return score;
  }

  /**
   * Parse ISO8601 duration to hours
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/P(\d+D)?T?(\d+H)?(\d+M)?/);
    if (!match) return 24;

    let hours = 0;
    if (match[1]) hours += parseInt(match[1]) * 24;
    if (match[2]) hours += parseInt(match[2]) || 0;
    if (match[3]) hours += (parseInt(match[3]) || 0) / 60;

    return hours;
  }

  /**
   * Get human-readable reason with Feather Icon
   */
  private getReason(interval: string): { icon: string; text: string } {
    const reasons: Record<string, { icon: string; text: string }> = {
      'P1D': { icon: 'clock', text: 'From yesterday' },
      'P1W': { icon: 'calendar', text: 'From 1 week ago' },
      'P1M': { icon: 'calendar', text: 'From 1 month ago' },
      'P3M': { icon: 'archive', text: 'From 3 months ago' },
      'P1Y': { icon: 'clock', text: 'From 1 year ago' }
    };
    return reasons[interval] || { icon: 'clock', text: 'From the past' };
  }
}

// Singleton instance
export const rediscoverySource = new RediscoverySource();
