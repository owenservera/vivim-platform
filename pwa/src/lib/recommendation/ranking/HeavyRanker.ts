/**
 * Heavy Ranker
 * Weighted linear model for final ordering
 * X Parallel: heavy_ranker (MaskNet)
 */

import type { Candidate, UserPreferences, RankingFeatures, Conversation } from '../types';
import { qualityCalculator } from '../scoring/QualityScore';
import { DEFAULT_RANK_WEIGHTS } from '../config';
import { daysSince, calculateRecencyScore } from '../utils';

export class HeavyRanker {
  private weights: UserPreferences['rankWeights'];

  constructor() {
    this.weights = { ...DEFAULT_RANK_WEIGHTS };
  }

  /**
   * Apply heavy ranking (final ordering)
   */
  async rank(
    candidates: Candidate[],
    userPrefs: UserPreferences,
    context?: { currentConversation?: Conversation }
  ): Promise<Candidate[]> {
    this.weights = userPrefs.rankWeights || this.weights;

    const scored = candidates.map(candidate => {
      const features = this.extractFeatures(candidate, context);
      const score = this.calculateScore(features, this.weights);

      return {
        ...candidate,
        features,
        score
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  /**
   * Extract ranking features
   */
  private extractFeatures(
    candidate: Candidate,
    context?: { currentConversation?: Conversation }
  ): RankingFeatures {
    const conv = candidate.conversation;

    const quality = conv.qualityScore || qualityCalculator.calculate(conv);
    const recency = calculateRecencyScore(daysSince(conv.createdAt));

    let topicMatch = 0;
    if (context?.currentConversation?.embedding && conv.embedding) {
      topicMatch = this.cosineSimilarity(
        context.currentConversation.embedding,
        conv.embedding
      );
    }

    const interaction = this.normalizeInteraction(conv);

    return {
      quality: quality / 100,
      recency,
      topicMatch,
      interaction,
      codeDensity: conv.stats.totalCodeBlocks / conv.stats.totalMessages,
      structuralDepth: conv.stats.totalMessages
    };
  }

  /**
   * Calculate final score from weighted features
   */
  private calculateScore(
    features: RankingFeatures,
    weights: UserPreferences['rankWeights']
  ): number {
    return (
      (features.quality * weights.quality) +
      (features.recency * weights.recency) +
      (features.topicMatch * weights.topicMatch) +
      (features.interaction * weights.interaction)
    ) * 100;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Normalize interaction signals to 0-1
   */
  private normalizeInteraction(conv: Conversation): number {
    let score = 0;

    if (conv.stats.timesViewed > 0) score += Math.min(0.3, conv.stats.timesViewed * 0.05);
    if (conv.stats.wasExported) score += 0.3;
    if (conv.stats.wasShared) score += 0.3;
    if (conv.stats.hasUserNotes) score += 0.1;

    return Math.min(1, score);
  }
}

// Singleton instance
export const heavyRanker = new HeavyRanker();
