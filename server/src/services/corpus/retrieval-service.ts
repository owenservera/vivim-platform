/**
 * Corpus Retrieval Service
 * 
 * Multi-path retrieval with:
 * 1. Semantic search (vector similarity)
 * 2. Keyword search (BM25/PostgreSQL full-text)
 * 3. Q&A matching
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import {
  CorpusRetrievalParams,
  CorpusRetrievalResult,
  ScoredCorpusChunk,
  Citation,
  ConfidenceAssessment,
} from '../../types/corpus';
import { logger } from '../../lib/logger';

interface CorpusRetrievalServiceConfig {
  prisma: PrismaClient;
  embeddingService: {
    embed: (text: string) => Promise<number[]>;
  };
}

export class CorpusRetrievalService {
  private prisma: PrismaClient;
  private embeddingService: CorpusRetrievalServiceConfig['embeddingService'];

  constructor(config: CorpusRetrievalServiceConfig) {
    this.prisma = config.prisma;
    this.embeddingService = config.embeddingService;
  }

  /**
   * Retrieve relevant corpus chunks for a query
   */
  async retrieve(params: CorpusRetrievalParams): Promise<CorpusRetrievalResult> {
    const startTime = Date.now();
    logger.info({ query: params.query.substring(0, 50) }, 'Starting corpus retrieval');

    try {
      // Multi-path retrieval
      const [semanticResults, keywordResults, qaResults] = await Promise.all([
        this.semanticSearch(params),
        this.keywordSearch(params),
        this.qaMatch(params),
      ]);

      // Merge and score results
      const merged = this.mergeAndScoreResults(semanticResults, keywordResults, qaResults);

      // Re-rank with diversity
      const reranked = this.applyDiversityFilter(merged, params.finalResults || 5);

      // Parent expansion for short chunks
      const expanded = await this.expandWithParentContext(reranked);

      // Generate citations
      const citations = this.generateCitations(expanded);

      // Assess confidence
      const confidence = this.assessConfidence(expanded, params.query);

      const retrievalTimeMs = Date.now() - startTime;
      logger.info(
        { retrievalTimeMs, candidates: merged.length, final: expanded.length, confidence },
        'Retrieval complete'
      );

      return {
        chunks: expanded,
        totalCandidates: merged.length,
        retrievalTimeMs,
        confidence,
        fallbackSuggestions: confidence < 0.4 ? this.generateFallbackSuggestions(params.query) : undefined,
        citations,
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Retrieval failed');
      throw error;
    }
  }

  /**
   * Semantic search using vector similarity
   */
  private async semanticSearch(params: CorpusRetrievalParams): Promise<ScoredCorpusChunk[]> {
    try {
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT
          c.id,
          c."tenantId",
          c."documentId",
          c.content,
          c.summary,
          c."parentChunkId",
          c."chunkIndex",
          c."totalChunks",
          c."sectionPath",
          c."headingLevel",
          c."contentType",
          c."embedding",
          c."keywords",
          c."topicSlug",
          c.difficulty,
          c."generatedQuestions",
          c."generatedAnswer",
          c."freshnessScore",
          c."qualityScore",
          c."retrievalCount",
          c."createdAt",
          c."updatedAt",
          1 - (c."embedding" <=> ${params.queryEmbedding}::vector) as similarity
        FROM "corpus_chunks" c
        WHERE c."tenantId" = ${params.tenantId}
          AND c."isActive" = true
          AND c."embedding" IS NOT NULL
          AND array_length(c."embedding", 1) > 0
        ORDER BY c."embedding" <=> ${params.queryEmbedding}::vector
        LIMIT ${params.maxResults || 15}
      `;

      return results.map(r => ({
        chunk: {
          ...r,
          embedding: null, // Don't return embedding in results
        },
        scores: {
          semantic: r.similarity,
          keyword: 0,
          qaMatch: 0,
          freshness: r.freshnessScore,
          topicAlign: 0,
          quality: r.qualityScore,
          combined: r.similarity,
        },
      }));
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Semantic search failed');
      return [];
    }
  }

  /**
   * Keyword search using PostgreSQL full-text search
   */
  private async keywordSearch(params: CorpusRetrievalParams): Promise<ScoredCorpusChunk[]> {
    try {
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT
          c.id,
          c."tenantId",
          c."documentId",
          c.content,
          c.summary,
          c."parentChunkId",
          c."chunkIndex",
          c."totalChunks",
          c."sectionPath",
          c."headingLevel",
          c."contentType",
          c."keywords",
          c."topicSlug",
          c.difficulty,
          c."generatedQuestions",
          c."generatedAnswer",
          c."freshnessScore",
          c."qualityScore",
          ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${params.query})) as rank
        FROM "corpus_chunks" c
        WHERE c."tenantId" = ${params.tenantId}
          AND c."isActive" = true
          AND to_tsvector('english', c.content) @@ plainto_tsquery('english', ${params.query})
        ORDER BY rank DESC
        LIMIT ${params.maxResults || 15}
      `;

      return results.map(r => ({
        chunk: {
          ...r,
          embedding: null,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        },
        scores: {
          semantic: 0,
          keyword: r.rank,
          qaMatch: 0,
          freshness: r.freshnessScore,
          topicAlign: 0,
          quality: r.qualityScore,
          combined: r.rank,
        },
      }));
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Keyword search failed');
      return [];
    }
  }

  /**
   * Q&A pair matching
   */
  private async qaMatch(params: CorpusRetrievalParams): Promise<ScoredCorpusChunk[]> {
    try {
      // Search FAQ pairs by question embedding
      const faqResults = await this.prisma.$queryRaw<any[]>`
        SELECT
          f.id,
          f."sourceChunkId",
          f.question,
          f.answer,
          1 - (f."questionEmbedding" <=> ${params.queryEmbedding}::vector) as similarity
        FROM "corpus_faqs" f
        WHERE f."tenantId" = ${params.tenantId}
          AND f."isActive" = true
          AND f."questionEmbedding" IS NOT NULL
        ORDER BY f."questionEmbedding" <=> ${params.queryEmbedding}::vector
        LIMIT 10
      `;

      if (faqResults.length === 0) return [];

      // Get associated chunks
      const chunkIds = faqResults.map((f: any) => f.sourceChunkId).filter(Boolean);
      if (chunkIds.length === 0) return [];

      const chunks = await this.prisma.corpusChunk.findMany({
        where: {
          id: { in: chunkIds },
          tenantId: params.tenantId,
          isActive: true,
        },
      });

      return chunks.map(chunk => ({
        chunk: {
          ...chunk,
          embedding: null,
        },
        scores: {
          semantic: 0,
          keyword: 0,
          qaMatch: faqResults.find((f: any) => f.sourceChunkId === chunk.id)?.similarity || 0,
          freshness: chunk.freshnessScore,
          topicAlign: 0,
          quality: chunk.qualityScore,
          combined: faqResults.find((f: any) => f.sourceChunkId === chunk.id)?.similarity || 0,
        },
      }));
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Q&A matching failed');
      return [];
    }
  }

  /**
   * Merge results from multiple retrieval paths
   */
  private mergeAndScoreResults(
    semantic: ScoredCorpusChunk[],
    keyword: ScoredCorpusChunk[],
    qa: ScoredCorpusChunk[]
  ): ScoredCorpusChunk[] {
    const chunkMap = new Map<string, ScoredCorpusChunk>();

    // Add all results, merging scores for duplicates
    for (const result of [...semantic, ...keyword, ...qa]) {
      const key = result.chunk.id;

      if (chunkMap.has(key)) {
        const existing = chunkMap.get(key)!;
        existing.scores.semantic = Math.max(existing.scores.semantic, result.scores.semantic);
        existing.scores.keyword = Math.max(existing.scores.keyword, result.scores.keyword);
        existing.scores.qaMatch = Math.max(existing.scores.qaMatch, result.scores.qaMatch);
        existing.scores.combined = this.computeCombinedScore(existing.scores);
      } else {
        result.scores.combined = this.computeCombinedScore(result.scores);
        chunkMap.set(key, result);
      }
    }

    // Sort by combined score
    return Array.from(chunkMap.values())
      .sort((a, b) => b.scores.combined - a.scores.combined);
  }

  /**
   * Compute combined score from individual scores
   */
  private computeCombinedScore(scores: {
    semantic: number;
    keyword: number;
    qaMatch: number;
    freshness: number;
    topicAlign: number;
    quality: number;
  }): number {
    const weights = {
      semantic: 0.35,
      keyword: 0.15,
      qaMatch: 0.25,
      freshness: 0.10,
      topicAlign: 0.08,
      quality: 0.07,
    };

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
   * Apply diversity filter to avoid redundant results
   */
  private applyDiversityFilter(
    results: ScoredCorpusChunk[],
    topK: number
  ): ScoredCorpusChunk[] {
    const selected: ScoredCorpusChunk[] = [];
    const selectedDocs = new Set<string>();

    for (const result of results) {
      if (selected.length >= topK) break;

      // Prefer chunks from different documents
      if (!selectedDocs.has(result.chunk.documentId) || selected.length < 2) {
        selected.push(result);
        selectedDocs.add(result.chunk.documentId);
      }
    }

    // Fill remaining slots if we have room
    if (selected.length < topK) {
      for (const result of results) {
        if (selected.length >= topK) break;
        if (!selected.includes(result)) {
          selected.push(result);
        }
      }
    }

    return selected;
  }

  /**
   * Expand chunks with parent context if needed
   */
  private async expandWithParentContext(
    results: ScoredCorpusChunk[]
  ): Promise<ScoredCorpusChunk[]> {
    const expanded: ScoredCorpusChunk[] = [];

    for (const result of results) {
      const needsExpansion = (
        result.chunk.content.split(/\s+/).length < 150 ||
        result.chunk.contentType === 'code' ||
        result.chunk.content.includes('see above') ||
        result.chunk.content.includes('as mentioned')
      );

      if (needsExpansion && result.chunk.parentChunkId) {
        const parent = await this.prisma.corpusChunk.findUnique({
          where: { id: result.chunk.parentChunkId },
          select: { summary: true },
        });

        if (parent?.summary) {
          expanded.push({
            ...result,
            parentContext: parent.summary,
          });
          continue;
        }
      }

      expanded.push(result);
    }

    return expanded;
  }

  /**
   * Generate citations from results
   */
  private generateCitations(results: ScoredCorpusChunk[]): Citation[] {
    return results.map(r => ({
      chunkId: r.chunk.id,
      documentTitle: r.chunk.documentId, // Would need document lookup for actual title
      sectionPath: r.chunk.sectionPath,
      url: undefined, // Would need document lookup
      version: '1.0.0', // Would need version lookup
      relevanceScore: r.scores.combined,
    }));
  }

  /**
   * Assess retrieval confidence
   */
  private assessConfidence(results: ScoredCorpusChunk[], query: string): number {
    if (results.length === 0) return 0;

    const topScore = results[0].scores.combined;
    const avgScore = results.reduce((sum, r) => sum + r.scores.combined, 0) / results.length;

    // Weight top result heavily
    return topScore * 0.7 + avgScore * 0.3;
  }

  /**
   * Generate fallback suggestions for low confidence queries
   */
  private generateFallbackSuggestions(query: string): string[] {
    // Extract keywords and suggest related topics
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return keywords.slice(0, 3).map(k => `Try searching for "${k}"`);
  }
}
