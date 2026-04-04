/**
 * Semantic Search
 * 
 * Vector similarity search using pgvector.
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import { ScoredCorpusChunk } from '../../../types/corpus';
import { logger } from '../../../lib/logger';

interface SemanticSearchParams {
  tenantId: string;
  queryEmbedding: number[];
  maxResults?: number;
  topicSlugs?: string[];
  contentTypes?: string[];
  minSimilarity?: number;
}

export class SemanticSearch {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Search corpus chunks using vector similarity
   */
  async search(params: SemanticSearchParams): Promise<ScoredCorpusChunk[]> {
    const {
      tenantId,
      queryEmbedding,
      maxResults = 15,
      topicSlugs,
      contentTypes,
      minSimilarity = 0.3,
    } = params;

    try {
      // Build WHERE clause for filters
      const topicFilter = topicSlugs && topicSlugs.length > 0
        ? `AND c."topicSlug" = ANY(ARRAY[${topicSlugs.map(s => `'${s}'`).join(',')}])`
        : '';

      const contentTypeFilter = contentTypes && contentTypes.length > 0
        ? `AND c."contentType" = ANY(ARRAY[${contentTypes.map(t => `'${t}'`).join(',')}])`
        : '';

      // Execute vector similarity search
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
          c."retrievalCount",
          c."createdAt",
          c."updatedAt",
          1 - (c."embedding" <=> ${queryEmbedding}::vector) as similarity
        FROM "corpus_chunks" c
        WHERE c."tenantId" = ${tenantId}
          AND c."isActive" = true
          AND c."embedding" IS NOT NULL
          AND array_length(c."embedding", 1) > 0
          ${this.prisma.sql.raw(topicFilter)}
          ${this.prisma.sql.raw(contentTypeFilter)}
        ORDER BY c."embedding" <=> ${queryEmbedding}::vector
        LIMIT ${maxResults}
      `;

      // Filter by minimum similarity and format results
      return results
        .filter((r: any) => r.similarity >= minSimilarity)
        .map((r: any) => ({
          chunk: {
            ...r,
            embedding: null,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
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
      logger.error({ error: (error as Error).message }, 'Semantic search failed');
      return [];
    }
  }

  /**
   * Search within a specific topic
   */
  async searchByTopic(
    tenantId: string,
    topicSlug: string,
    queryEmbedding: number[],
    maxResults: number = 10
  ): Promise<ScoredCorpusChunk[]> {
    return this.search({
      tenantId,
      queryEmbedding,
      maxResults,
      topicSlugs: [topicSlug],
    });
  }

  /**
   * Find similar chunks to a given chunk
   */
  async findSimilar(
    tenantId: string,
    chunkId: string,
    maxResults: number = 5
  ): Promise<ScoredCorpusChunk[]> {
    try {
      // Get the source chunk's embedding
      const sourceChunk = await this.prisma.corpusChunk.findUnique({
        where: { id: chunkId },
        select: { embedding: true, tenantId: true },
      });

      if (!sourceChunk?.embedding) {
        return [];
      }

      // Find similar chunks
      return this.search({
        tenantId: sourceChunk.tenantId,
        queryEmbedding: sourceChunk.embedding,
        maxResults: maxResults + 1, // +1 to exclude the source chunk itself
      });
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Find similar failed');
      return [];
    }
  }
}
