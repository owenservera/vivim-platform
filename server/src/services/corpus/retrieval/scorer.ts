/**
 * Corpus Scorer
 * 
 * Multi-path scoring formula for ranking corpus chunks.
 * Combines semantic, keyword, Q&A match, freshness, and quality scores.
 * 
 * @created March 27, 2026
 */

import { ScoredCorpusChunk } from '../../../types/corpus';

interface ScoringWeights {
  semantic: number;
  keyword: number;
  qaMatch: number;
  freshness: number;
  topicAlign: number;
  quality: number;
}

interface ScoringParams {
  freshnessBias?: number;  // 0.0-1.0, prefer newer content
  userDifficulty?: string; // beginner, intermediate, advanced
}

export class CorpusScorer {
  private defaultWeights: ScoringWeights = {
    semantic: 0.35,
    keyword: 0.15,
    qaMatch: 0.25,
    freshness: 0.10,
    topicAlign: 0.08,
    quality: 0.07,
  };

  /**
   * Score a single chunk
   */
  score(chunk: ScoredCorpusChunk, params: ScoringParams = {}): number {
    const weights = this.getWeights(params);
    const scores = chunk.scores;

    return (
      scores.semantic * weights.semantic +
      scores.keyword * weights.keyword +
      scores.qaMatch * weights.qaMatch +
      scores.freshness * weights.freshness +
      scores.topicAlign * weights.topicAlign +
      scores.quality * weights.quality
    );
  }

  /**
   * Score and rank multiple chunks
   */
  scoreAndRank(chunks: ScoredCorpusChunk[], params: ScoringParams = {}): ScoredCorpusChunk[] {
    return chunks
      .map(chunk => ({
        ...chunk,
        scores: {
          ...chunk.scores,
          combined: this.score(chunk, params),
        },
      }))
      .sort((a, b) => b.scores.combined - a.scores.combined);
  }

  /**
   * Get weights adjusted for params
   */
  private getWeights(params: ScoringParams): ScoringWeights {
    const weights = { ...this.defaultWeights };

    // Adjust for freshness bias
    if (params.freshnessBias !== undefined && params.freshnessBias > 0.5) {
      const adjustment = Math.min(0.1, (params.freshnessBias - 0.5) * 0.2);
      weights.freshness += adjustment;
      weights.semantic -= adjustment;
    }

    // Adjust for user expertise
    if (params.userDifficulty === 'advanced') {
      // Advanced users prefer quality over keyword matches
      weights.quality += 0.05;
      weights.keyword -= 0.05;
    } else if (params.userDifficulty === 'beginner') {
      // Beginners benefit more from keyword matches
      weights.keyword += 0.05;
      weights.quality -= 0.05;
    }

    // Ensure weights sum to 1.0
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(total - 1.0) > 0.001) {
      // Normalize
      for (const key of Object.keys(weights) as (keyof ScoringWeights)[]) {
        weights[key] /= total;
      }
    }

    return weights;
  }

  /**
   * Recalculate combined score with custom weights
   */
  recalculateCombinedScore(
    scores: {
      semantic: number;
      keyword: number;
      qaMatch: number;
      freshness: number;
      topicAlign: number;
      quality: number;
    },
    customWeights?: Partial<ScoringWeights>
  ): number {
    const weights = customWeights
      ? { ...this.defaultWeights, ...customWeights }
      : this.defaultWeights;

    return (
      scores.semantic * weights.semantic +
      scores.keyword * weights.keyword +
      scores.qaMatch * weights.qaMatch +
      scores.freshness * weights.freshness +
      scores.topicAlign * weights.topicAlign +
      scores.quality * weights.quality
    );
  }

  /**
   * Boost score for specific criteria
   */
  applyBoost(chunk: ScoredCorpusChunk, boosts: ScoreBoosts): ScoredCorpusChunk {
    let boostMultiplier = 1.0;

    if (boosts.isRecent) {
      boostMultiplier += 0.1;
    }

    if (boosts.isHighQuality) {
      boostMultiplier += 0.15;
    }

    if (boosts.matchesUserLevel) {
      boostMultiplier += 0.1;
    }

    if (boosts.isFromPreferredSource) {
      boostMultiplier += 0.2;
    }

    return {
      ...chunk,
      scores: {
        ...chunk.scores,
        combined: chunk.scores.combined * boostMultiplier,
      },
    };
  }
}

export interface ScoreBoosts {
  isRecent?: boolean;
  isHighQuality?: boolean;
  matchesUserLevel?: boolean;
  isFromPreferredSource?: boolean;
}
