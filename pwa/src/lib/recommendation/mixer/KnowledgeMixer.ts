/**
 * Knowledge Mixer
 * Central orchestrator for recommendation pipeline
 * X Parallel: home-mixer (Product Mixer)
 */

import type { Conversation, UserPreferences, RecommendationItem } from '../types';
import { rediscoverySource } from '../sources/RediscoverySource';
import { lightRanker } from '../ranking/LightRanker';
import { heavyRanker } from '../ranking/HeavyRanker';
import { VisibilityFilters } from '../filters/VisibilityFilters';

export interface MixerConfig {
  candidatesPerSource: number;
  lightRankLimit: number;
  heavyRankLimit: number;
  finalFeedSize: number;
}

export class KnowledgeMixer {
  private config: MixerConfig;
  private filters: VisibilityFilters;

  constructor(config?: Partial<MixerConfig>) {
    this.config = {
      candidatesPerSource: config?.candidatesPerSource || 20,
      lightRankLimit: config?.lightRankLimit || 100,
      heavyRankLimit: config?.heavyRankLimit || 50,
      finalFeedSize: config?.finalFeedSize || 20
    };

    this.filters = new VisibilityFilters();
  }

  /**
   * Generate "For You" feed
   */
  async generateFeed(
    conversations: Conversation[],
    userPrefs: UserPreferences,
    context?: {
      currentConversation?: Conversation;
      searchQuery?: string;
    }
  ): Promise<RecommendationItem[]> {
    console.log('[KnowledgeMixer] Generating feed...');

    // Step 1: Fetch candidates from sources
    const rediscovery = await rediscoverySource.fetch(this.config.candidatesPerSource);

    const allCandidates = [...rediscovery];
    console.log(`[KnowledgeMixer] Fetched ${allCandidates.length} candidates`);

    // Step 2: Light ranker
    const lightRanked = lightRanker.rank(allCandidates, userPrefs);
    console.log(`[KnowledgeMixer] Light ranker: ${lightRanked.length} candidates`);

    // Step 3: Heavy ranker
    const heavyRanked = await heavyRanker.rank(lightRanked, userPrefs, context);
    console.log(`[KnowledgeMixer] Heavy ranker: ${heavyRanked.length} candidates`);

    // Step 4: Visibility filters
    const final = this.filters.apply(heavyRanked);
    console.log(`[KnowledgeMixer] Final feed: ${final.length} candidates`);

    // Convert to RecommendationItem format
    return final.slice(0, this.config.finalFeedSize).map(candidate => ({
      conversation: candidate.conversation,
      score: candidate.score,
      reason: candidate.reason || { icon: 'zap', text: 'Recommended for you' },
      source: candidate.source,
      featureContributions: this.formatContributions(candidate.features)
    }));
  }

  /**
   * Format feature contributions for explainability
   */
  private formatContributions(features: Record<string, number>): Record<string, number> {
    return {
      quality: Math.round(features.quality * 100),
      recency: Math.round(features.recency * 100),
      topicMatch: Math.round(features.topicMatch * 100),
      interaction: Math.round(features.interaction * 100)
    };
  }
}

// Singleton instance
export const knowledgeMixer = new KnowledgeMixer();
