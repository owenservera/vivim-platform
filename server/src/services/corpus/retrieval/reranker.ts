/**
 * Corpus Reranker
 * 
 * Re-ranks retrieved chunks using cross-encoder approach and diversity filtering.
 * 
 * @created March 27, 2026
 */

import { ScoredCorpusChunk } from '../../../types/corpus';
import { logger } from '../../../lib/logger';

interface RerankerConfig {
  useCrossEncoder?: boolean;
  crossEncoderModel?: string;
  diversityThreshold?: number;
}

export class CorpusReranker {
  private config: Required<RerankerConfig>;

  constructor(config?: RerankerConfig) {
    this.config = {
      useCrossEncoder: false, // Disabled by default - requires external model
      crossEncoderModel: 'cross-encoder/ms-marco-MiniLM-L-6-v2',
      diversityThreshold: 0.85,
      ...config,
    };
  }

  /**
   * Re-rank chunks by query relevance
   */
  async rerank(
    query: string,
    chunks: ScoredCorpusChunk[],
    options: { topK: number }
  ): Promise<ScoredCorpusChunk[]> {
    logger.debug({ queryLength: query.length, inputChunks: chunks.length }, 'Starting re-ranking');

    let ranked = [...chunks];

    // Step 1: Apply cross-encoder scoring if enabled
    if (this.config.useCrossEncoder) {
      ranked = await this.applyCrossEncoder(query, ranked);
    }

    // Step 2: Apply diversity filter
    ranked = this.applyDiversityFilter(ranked);

    // Step 3: Apply MMR (Maximal Marginal Relevance) if needed
    if (this.shouldApplyMMR(query, ranked)) {
      ranked = this.applyMMR(query, ranked, options.topK);
    }

    // Step 4: Take top K
    const result = ranked.slice(0, options.topK);

    logger.info({ outputChunks: result.length }, 'Re-ranking complete');

    return result;
  }

  /**
   * Apply cross-encoder re-ranking
   */
  private async applyCrossEncoder(
    query: string,
    chunks: ScoredCorpusChunk[]
  ): Promise<ScoredCorpusChunk[]> {
    // Note: Full cross-encoder implementation requires external model
    // This is a placeholder for the actual implementation

    try {
      // In production, this would call a cross-encoder model:
      // const scores = await crossEncoder.predict(
      //   chunks.map(c => [query, c.chunk.content])
      // );

      // For now, use a simple heuristic boost for longer, more detailed content
      const reranked = chunks.map(chunk => {
        const contentLength = chunk.chunk.content.length;
        const hasCode = chunk.chunk.contentType === 'code';
        const hasSummary = !!chunk.chunk.summary;

        // Simple heuristic score
        const heuristicBoost = (
          (contentLength > 200 ? 0.1 : 0) +
          (hasSummary ? 0.1 : 0) +
          (hasCode ? 0.05 : 0)
        );

        return {
          ...chunk,
          scores: {
            ...chunk.scores,
            combined: chunk.scores.combined + heuristicBoost,
          },
        };
      });

      return reranked.sort((a, b) => b.scores.combined - a.scores.combined);
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Cross-encoder failed, using original scores');
      return chunks;
    }
  }

  /**
   * Apply diversity filter to avoid redundant results
   */
  private applyDiversityFilter(chunks: ScoredCorpusChunk[]): ScoredCorpusChunk[] {
    const selected: ScoredCorpusChunk[] = [];
    const selectedSignatures = new Set<string>();

    for (const chunk of chunks) {
      const signature = this.getChunkSignature(chunk);

      // Check if this chunk is too similar to already selected chunks
      const isDuplicate = selectedSignatures.has(signature);

      if (!isDuplicate) {
        selected.push(chunk);
        selectedSignatures.add(signature);
      }
    }

    return selected;
  }

  /**
   * Get chunk signature for deduplication
   */
  private getChunkSignature(chunk: ScoredCorpusChunk): string {
    // Use document + section path as signature
    return `${chunk.chunk.documentId}:${chunk.chunk.sectionPath.join('>')}`;
  }

  /**
   * Apply MMR (Maximal Marginal Relevance)
   */
  private applyMMR(
    query: string,
    chunks: ScoredCorpusChunk[],
    topK: number
  ): ScoredCorpusChunk[] {
    const lambda = 0.7; // Balance between relevance and diversity
    const selected: ScoredCorpusChunk[] = [];
    const remaining = [...chunks];

    // Select first chunk (highest relevance)
    if (remaining.length > 0) {
      selected.push(remaining.shift()!);
    }

    // Select remaining chunks using MMR
    while (selected.length < topK && remaining.length > 0) {
      let bestChunk: ScoredCorpusChunk | null = null;
      let bestScore = -Infinity;

      for (const chunk of remaining) {
        const relevanceScore = chunk.scores.combined;
        const diversityScore = this.getMinSimilarity(chunk, selected);

        const mmrScore = lambda * relevanceScore - (1 - lambda) * diversityScore;

        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestChunk = chunk;
        }
      }

      if (bestChunk) {
        selected.push(bestChunk);
        const index = remaining.indexOf(bestChunk);
        remaining.splice(index, 1);
      }
    }

    return selected;
  }

  /**
   * Get minimum similarity to already selected chunks
   */
  private getMinSimilarity(
    chunk: ScoredCorpusChunk,
    selected: ScoredCorpusChunk[]
  ): number {
    if (selected.length === 0) return 0;

    let minSim = Infinity;

    for (const selectedChunk of selected) {
      const sim = this.calculateSimilarity(chunk, selectedChunk);
      if (sim < minSim) {
        minSim = sim;
      }
    }

    return minSim === Infinity ? 0 : minSim;
  }

  /**
   * Calculate similarity between two chunks
   */
  private calculateSimilarity(
    chunk1: ScoredCorpusChunk,
    chunk2: ScoredCorpusChunk
  ): number {
    // Simple Jaccard similarity on keywords
    const keywords1 = new Set(chunk1.chunk.keywords);
    const keywords2 = new Set(chunk2.chunk.keywords);

    const intersection = [...keywords1].filter(k => keywords2.has(k)).length;
    const union = new Set([...keywords1, ...keywords2]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Check if MMR should be applied
   */
  private shouldApplyMMR(query: string, chunks: ScoredCorpusChunk[]): boolean {
    // Apply MMR if we have many similar chunks
    if (chunks.length < 5) return false;

    // Check keyword diversity
    const allKeywords = new Set<string>();
    for (const chunk of chunks) {
      for (const keyword of chunk.chunk.keywords) {
        allKeywords.add(keyword);
      }
    }

    // If keyword diversity is low, apply MMR
    const avgKeywordsPerChunk = allKeywords.size / chunks.length;
    return avgKeywordsPerChunk < 3;
  }
}
