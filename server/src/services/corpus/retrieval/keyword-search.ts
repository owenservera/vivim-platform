/**
 * Keyword Search
 * 
 * Full-text search using PostgreSQL tsvector/tsquery with BM25-like ranking.
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import { ScoredCorpusChunk } from '../../../types/corpus';
import { logger } from '../../../lib/logger';

interface KeywordSearchParams {
  tenantId: string;
  query: string;
  maxResults?: number;
  topicSlugs?: string[];
  contentTypes?: string[];
}

export class KeywordSearch {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Search corpus chunks using full-text search
   */
  async search(params: KeywordSearchParams): Promise<ScoredCorpusChunk[]> {
    const {
      tenantId,
      query,
      maxResults = 15,
      topicSlugs,
      contentTypes,
    } = params;

    try {
      // Build WHERE clause for filters
      const topicFilter = topicSlugs && topicSlugs.length > 0
        ? `AND c."topicSlug" = ANY(ARRAY[${topicSlugs.map(s => `'${s}'`).join(',')}])`
        : '';

      const contentTypeFilter = contentTypes && contentTypes.length > 0
        ? `AND c."contentType" = ANY(ARRAY[${contentTypes.map(t => `'${t}'`).join(',')}])`
        : '';

      // Execute full-text search with ts_rank
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
          ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${query})) as rank,
          ts_headline('english', c.content, plainto_tsquery('english', ${query}), 'MaxFragments=2, MaxWords=50, MinWords=25') as headline
        FROM "corpus_chunks" c
        WHERE c."tenantId" = ${tenantId}
          AND c."isActive" = true
          AND to_tsvector('english', c.content) @@ plainto_tsquery('english', ${query})
          ${this.prisma.sql.raw(topicFilter)}
          ${this.prisma.sql.raw(contentTypeFilter)}
        ORDER BY rank DESC
        LIMIT ${maxResults}
      `;

      // Format results
      return results.map((r: any) => ({
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
      logger.error({ error: (error as Error).message }, 'Keyword search failed');
      return [];
    }
  }

  /**
   * Search with phrase matching
   */
  async searchPhrase(
    tenantId: string,
    phrase: string,
    maxResults: number = 10
  ): Promise<ScoredCorpusChunk[]> {
    try {
      // Use phraseto_tsquery for exact phrase matching
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT
          c.id,
          c."tenantId",
          c."documentId",
          c.content,
          c.summary,
          ts_rank(to_tsvector('english', c.content), phraseto_tsquery('english', ${phrase})) as rank
        FROM "corpus_chunks" c
        WHERE c."tenantId" = ${tenantId}
          AND c."isActive" = true
          AND to_tsvector('english', c.content) @@ phraseto_tsquery('english', ${phrase})
        ORDER BY rank DESC
        LIMIT ${maxResults}
      `;

      return results.map((r: any) => ({
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
      logger.error({ error: (error as Error).message }, 'Phrase search failed');
      return [];
    }
  }

  /**
   * Search with wildcard matching
   */
  async searchWildcard(
    tenantId: string,
    query: string,
    maxResults: number = 10
  ): Promise<ScoredCorpusChunk[]> {
    try {
      // Use websearch_to_tsquery for more flexible matching
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT
          c.id,
          c."tenantId",
          c."documentId",
          c.content,
          c.summary,
          ts_rank(to_tsvector('english', c.content), websearch_to_tsquery('english', ${query})) as rank
        FROM "corpus_chunks" c
        WHERE c."tenantId" = ${tenantId}
          AND c."isActive" = true
          AND to_tsvector('english', c.content) @@ websearch_to_tsquery('english', ${query})
        ORDER BY rank DESC
        LIMIT ${maxResults}
      `;

      return results.map((r: any) => ({
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
      logger.error({ error: (error as Error).message }, 'Wildcard search failed');
      return [];
    }
  }
}
