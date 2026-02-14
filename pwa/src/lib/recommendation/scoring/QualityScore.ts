/**
 * Quality Score Calculator
 * Adapted from X's TweepCred algorithm
 *
 * Measures conversation value on 0-100 scale
 */

import type { Conversation } from '../types';

export interface QualityWeights {
  contentRichness: number;
  structuralDepth: number;
  interaction: number;
  provider: number;
}

const DEFAULT_WEIGHTS: QualityWeights = {
  contentRichness: 0.40,
  structuralDepth: 0.20,
  interaction: 0.30,
  provider: 0.10
};

class QualityScoreCalculator {
  private weights: QualityWeights;

  constructor(weights?: Partial<QualityWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  /**
   * Calculate overall quality score (0-100)
   */
  calculate(conversation: Conversation): number {
    const contentScore = this.calculateContentRichness(conversation);
    const structureScore = this.calculateStructuralDepth(conversation);
    const interactionScore = this.calculateInteraction(conversation);
    const providerScore = this.calculateProviderBoost(conversation);

    const total =
      (contentScore * this.weights.contentRichness) +
      (structureScore * this.weights.structuralDepth) +
      (interactionScore * this.weights.interaction) +
      (providerScore * this.weights.provider);

    return Math.min(100, Math.max(0, Math.round(total)));
  }

  /**
   * Content Richness: Code blocks, diagrams, word count
   */
  private calculateContentRichness(conversation: Conversation): number {
    const { stats } = conversation;
    let score = 0;

    // Code blocks: +2 points each (max 40 points)
    score += Math.min(40, stats.totalCodeBlocks * 2);

    // Mermaid diagrams: +5 points each (max 25 points)
    score += Math.min(25, stats.totalMermaidDiagrams * 5);

    // Word count: +1 point per 100 words (max 35 points)
    const wordScore = Math.min(35, Math.floor(stats.totalWords / 100));
    score += wordScore;

    return score;
  }

  /**
   * Structural Depth: Message count, topics
   */
  private calculateStructuralDepth(conversation: Conversation): number {
    const { stats, metadata } = conversation;
    let score = 0;

    // Message count: +1 point per message (max 30 points)
    score += Math.min(30, stats.totalMessages);

    // Multiple topics: +10 points
    const hasMultipleTopics = (metadata.tags?.length || 0) >= 3;
    if (hasMultipleTopics) {
      score += 10;
    }

    // Deep conversation: 10+ messages = +10 points
    if (stats.totalMessages >= 10) {
      score += 10;
    }

    return Math.min(50, score);
  }

  /**
   * Interaction: User engagement signals
   */
  private calculateInteraction(conversation: Conversation): number {
    const { stats } = conversation;
    let score = 0;

    // Views: +1 point per view (max 20 points)
    score += Math.min(20, stats.timesViewed);

    // Exported: +10 points
    if (stats.wasExported) {
      score += 10;
    }

    // Shared: +15 points
    if (stats.wasShared) {
      score += 15;
    }

    // User notes: +8 points
    if (stats.hasUserNotes) {
      score += 8;
    }

    return Math.min(50, score);
  }

  /**
   * Provider Boost: User preference weighting
   */
  private calculateProviderBoost(conversation: Conversation): number {
    const boosts: Record<string, number> = {
      'claude': 50,
      'chatgpt': 45,
      'gemini': 40,
      'grok': 35,
      'deepseek': 40,
      'qwen': 35,
      'kimi': 35
    };

    return boosts[conversation.provider] || 30;
  }

  /**
   * Calculate quality band for UI display
   */
  getQualityBand(score: number): 'excellent' | 'good' | 'fair' | 'low' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'low';
  }

  /**
   * Get quality color for UI
   */
  getQualityColor(score: number): string {
    const band = this.getQualityBand(score);
    const colors = {
      excellent: '#10b981',
      good: '#3b82f6',
      fair: '#f59e0b',
      low: '#6b7280'
    };
    return colors[band];
  }

  /**
   * Get detailed breakdown
   */
  getBreakdown(conversation: Conversation): {
    overall: number;
    band: 'excellent' | 'good' | 'fair' | 'low';
    components: {
      contentRichness: number;
      structuralDepth: number;
      interaction: number;
      providerBoost: number;
    };
    color: string;
  } {
    const overall = this.calculate(conversation);
    const band = this.getQualityBand(overall);
    const color = this.getQualityColor(overall);

    return {
      overall,
      band,
      color,
      components: {
        contentRichness: this.calculateContentRichness(conversation),
        structuralDepth: this.calculateStructuralDepth(conversation),
        interaction: this.calculateInteraction(conversation),
        providerBoost: this.calculateProviderBoost(conversation)
      }
    };
  }
}

// Named export for ESM compatibility
export { QualityScoreCalculator };

// Singleton instance
export const qualityCalculator = new QualityScoreCalculator();

// Default export for compatibility
export default QualityScoreCalculator;
