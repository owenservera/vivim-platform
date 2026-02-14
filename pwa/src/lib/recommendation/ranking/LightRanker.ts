/**
 * Light Ranker
 * Fast heuristic filters to reduce candidates from ~1000 to ~100
 * X Parallel: light_ranker
 */

import type { Candidate, UserPreferences } from '../types';
import { qualityCalculator } from '../scoring/QualityScore';

export interface LightRankerConfig {
  maxCandidates: number;
  minQualityScore: number;
  viewedRecentlyPenalty: number;
}

export class LightRanker {
  private config: LightRankerConfig;

  constructor(config?: Partial<LightRankerConfig>) {
    this.config = {
      maxCandidates: config?.maxCandidates || 100,
      minQualityScore: config?.minQualityScore || 20,
      viewedRecentlyPenalty: config?.viewedRecentlyPenalty || 30
    };
  }

  /**
   * Apply light ranking (fast filters + boosts)
   */
  rank(candidates: Candidate[], userPrefs: UserPreferences): Candidate[] {
    let filtered = candidates;

    // Filter 1: Remove dismissed conversations
    filtered = filtered.filter(c =>
      !userPrefs.dismissed.includes(c.conversation.id)
    );

    // Filter 2: Remove disliked topics
    filtered = filtered.filter(c => {
      const topics = c.conversation.metadata.tags || [];
      return !topics.some(t => userPrefs.dislikedTopics.includes(t));
    });

    // Filter 3: Minimum quality score
    filtered = filtered.filter(c => {
      const quality = c.conversation.qualityScore ||
                     qualityCalculator.calculate(c.conversation);
      return quality >= this.config.minQualityScore;
    });

    // Apply boosts
    filtered = filtered.map(candidate => ({
      ...candidate,
      score: this.applyBoosts(candidate, userPrefs)
    }));

    // Sort by score
    filtered.sort((a, b) => b.score - a.score);

    return filtered.slice(0, this.config.maxCandidates);
  }

  /**
   * Apply heuristic boosts
   */
  private applyBoosts(candidate: Candidate, userPrefs: UserPreferences): number {
    let score = candidate.score;
    const conv = candidate.conversation;

    // Boost: Code blocks
    if (userPrefs.codeBoost && conv.stats.totalCodeBlocks > 0) {
      score += 10 * conv.stats.totalCodeBlocks;
    }

    // Boost: Long-form content
    if (userPrefs.longFormBoost && conv.stats.totalWords > 1000) {
      score += 15;
    }

    // Boost: Recent content
    if (userPrefs.recentBoost) {
      const daysSince = (Date.now() - new Date(conv.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) score += 20;
      else if (daysSince < 30) score += 10;
    }

    // Penalty: Viewed recently
    if (conv.stats.lastViewedAt) {
      const daysSinceView = (Date.now() - new Date(conv.stats.lastViewedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceView < 1) {
        score -= this.config.viewedRecentlyPenalty;
      }
    }

    // Provider boost
    const providerBoost = userPrefs.providerBoost[conv.provider] || 1.0;
    score *= providerBoost;

    return score;
  }
}

// Singleton instance
export const lightRanker = new LightRanker();
