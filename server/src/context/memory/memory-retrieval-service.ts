/**
 * Memory Retrieval Service
 *
 * Intelligent memory retrieval system using hybrid search (semantic + keyword).
 * Provides contextual relevance scoring and integrates with the context engine.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
  MemoryRetrievalOptions,
  MemoryRetrievalResult,
  IEmbeddingService,
  estimateTokensForMemories,
} from './memory-types';
import { logger } from '../../lib/logger.js';

export interface MemoryRetrievalConfig {
  prisma: PrismaClient;
  embeddingService?: IEmbeddingService;
  semanticWeight?: number;
  keywordWeight?: number;
  defaultSimilarityThreshold?: number;
}

interface SearchResult {
  id: string;
  content: string;
  summary?: string | null;
  memoryType: string;
  category: string;
  importance: number;
  relevance: number;
  sourceConversationIds: string[];
  similarity: number;
  source: 'semantic' | 'keyword' | 'hybrid';
}

export class MemoryRetrievalService {
  private prisma: PrismaClient;
  private embeddingService?: IEmbeddingService;
  private semanticWeight: number;
  private keywordWeight: number;
  private defaultSimilarityThreshold: number;

  constructor(config: MemoryRetrievalConfig) {
    this.prisma = config.prisma;
    this.embeddingService = config.embeddingService;
    this.semanticWeight = config.semanticWeight ?? 0.6;
    this.keywordWeight = config.keywordWeight ?? 0.4;
    this.defaultSimilarityThreshold = config.defaultSimilarityThreshold ?? 0.3;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Retrieve memories with hybrid search (semantic + keyword)
   */
  async retrieve(
    userId: string,
    contextMessage: string,
    options: MemoryRetrievalOptions = {}
  ): Promise<MemoryRetrievalResult> {
    const {
      maxTokens = 2000,
      minImportance = 0.3,
      preferredTypes,
      requiredTypes,
      excludedTypes,
      tags,
      excludeTags,
      timeRange,
      includePinned = true,
    } = options;

    // Extract keywords from context message
    const keywords = this.extractKeywords(contextMessage);

    // Build base where clause
    const baseWhere: Prisma.MemoryWhereInput = {
      userId,
      isActive: true,
      isArchived: false,
      importance: { gte: minImportance },
    };

    // Apply type filters
    if (requiredTypes && requiredTypes.length > 0) {
      baseWhere.memoryType = { in: requiredTypes };
    } else if (preferredTypes && preferredTypes.length > 0) {
      baseWhere.memoryType = { in: preferredTypes };
    }

    if (excludedTypes && excludedTypes.length > 0) {
      baseWhere.NOT = { memoryType: { in: excludedTypes } };
    }

    // Tag filters
    if (tags && tags.length > 0) {
      baseWhere.tags = { hasSome: tags };
    }
    if (excludeTags && excludeTags.length > 0) {
      baseWhere.NOT = { ...baseWhere.NOT, tags: { hasSome: excludeTags } };
    }

    // Time range
    if (timeRange) {
      baseWhere.occurredAt = {};
      if (timeRange.after) baseWhere.occurredAt.gte = timeRange.after;
      if (timeRange.before) baseWhere.occurredAt.lte = timeRange.before;
    }

    // Get embedding for context message
    let embedding: number[] = [];
    if (this.embeddingService) {
      try {
        embedding = await this.embeddingService.embed(contextMessage);
      } catch (error) {
        logger.warn({ error }, 'Failed to embed context message');
      }
    }

    // Perform parallel searches
    const [semanticResults, keywordResults, pinnedResults] = await Promise.all([
      // Semantic search (if we have embedding)
      embedding.length > 0 ? this.semanticSearch(baseWhere, embedding) : Promise.resolve([]),

      // Keyword search
      keywords.length > 0 ? this.keywordSearch(baseWhere, keywords) : Promise.resolve([]),

      // Pinned memories (always included)
      includePinned ? this.getPinnedMemories(baseWhere) : Promise.resolve([]),
    ]);

    // Fuse results using Reciprocal Rank Fusion
    const fusedResults = this.fuseResults(semanticResults, keywordResults);

    // Combine with pinned, prioritizing them
    const allResults = [...pinnedResults, ...fusedResults];

    // Remove duplicates
    const uniqueResults = this.deduplicateResults(allResults);

    // Fit to token budget
    const finalMemories = this.fitToTokenBudget(uniqueResults, maxTokens);

    // Update access stats
    if (finalMemories.length > 0) {
      await this.updateAccessStats(
        userId,
        finalMemories.map((m) => m.id)
      );
    }

    return this.formatRetrievalResult(finalMemories, maxTokens);
  }

  /**
   * Retrieve memories for identity context (critical + high importance)
   */
  async retrieveIdentityContext(
    userId: string,
    maxTokens: number = 500
  ): Promise<MemoryRetrievalResult> {
    return this.retrieve(userId, '', {
      maxTokens,
      minImportance: 0.8,
      requiredTypes: ['IDENTITY', 'FACTUAL'],
      includePinned: true,
    });
  }

  /**
   * Retrieve memories for preference context
   */
  async retrievePreferenceContext(
    userId: string,
    maxTokens: number = 300
  ): Promise<MemoryRetrievalResult> {
    return this.retrieve(userId, '', {
      maxTokens,
      minImportance: 0.6,
      requiredTypes: ['PREFERENCE', 'PROCEDURAL'],
      includePinned: true,
    });
  }

  /**
   * Retrieve memories relevant to a specific topic
   */
  async retrieveForTopic(
    userId: string,
    topic: string,
    maxTokens: number = 1000
  ): Promise<MemoryRetrievalResult> {
    return this.retrieve(userId, topic, {
      maxTokens,
      minImportance: 0.4,
      tags: [topic.toLowerCase()],
      includePinned: true,
    });
  }

  /**
   * Find similar memories to a given content
   */
  async findSimilarMemories(
    userId: string,
    content: string,
    limit: number = 5
  ): Promise<
    Array<{
      id: string;
      content: string;
      similarity: number;
    }>
  > {
    let embedding: number[] = [];

    if (this.embeddingService) {
      try {
        embedding = await this.embeddingService.embed(content);
      } catch (error) {
        logger.warn({ error }, 'Failed to embed content for similarity search');
        return [];
      }
    }

    if (embedding.length === 0) {
      // Fallback to keyword search
      const keywords = this.extractKeywords(content);
      const results = await this.keywordSearch(
        { userId, isActive: true, isArchived: false },
        keywords.slice(0, 5)
      );
      return results.slice(0, limit).map((r) => ({
        id: r.id,
        content: r.content,
        similarity: r.similarity,
      }));
    }

    // Semantic similarity search
    const results = await this.semanticSearch(
      { userId, isActive: true, isArchived: false },
      embedding,
      limit
    );

    return results.map((r) => ({
      id: r.id,
      content: r.content,
      similarity: r.similarity,
    }));
  }

  // ============================================================================
  // SEARCH IMPLEMENTATIONS
  // ============================================================================

  private async semanticSearch(
    where: Prisma.MemoryWhereInput,
    embedding: number[],
    limit: number = 50
  ): Promise<SearchResult[]> {
    // Try vector search if pgvector is available
    try {
      const results = await this.prisma.$queryRaw<
        Array<{
          id: string;
          content: string;
          summary: string | null;
          memorytype: string;
          category: string;
          importance: number;
          relevance: number;
          sourceconversationids: string[];
          similarity: number;
        }>
      >`
        SELECT 
          id, 
          content, 
          "summary", 
          "memoryType", as "memorytype",
          category, 
          importance, 
          relevance,
          "sourceConversationIds" as "sourceconversationids",
          1 - (embedding <=> ${embedding}::vector) as similarity
        FROM memories
        WHERE ${Prisma.join(this.buildWhereClause(where), ' AND ')}
          AND embedding IS NOT NULL
          AND array_length(embedding, 1) > 0
        ORDER BY embedding <=> ${embedding}::vector
        LIMIT ${limit}
      `;

      return results.map((r) => ({
        id: r.id,
        content: r.content,
        summary: r.summary,
        memoryType: r.memorytype,
        category: r.category,
        importance: Number(r.importance),
        relevance: Number(r.relevance),
        sourceConversationIds: r.sourceconversationids || [],
        similarity: Number(r.similarity),
        source: 'semantic' as const,
      }));
    } catch (error) {
      // Fallback: simple relevance-based search
      logger.warn({ error }, 'Vector search failed, using fallback');
      return this.fallbackSearch(where, limit);
    }
  }

  private async keywordSearch(
    where: Prisma.MemoryWhereInput,
    keywords: string[]
  ): Promise<SearchResult[]> {
    if (keywords.length === 0) return [];

    try {
      // Build keyword conditions
      const keywordConditions = keywords.map(
        (k) => Prisma.sql`LOWER(content) LIKE LOWER(${'%' + k + '%'})`
      );

      const results = await this.prisma.$queryRaw<
        Array<{
          id: string;
          content: string;
          summary: string | null;
          memorytype: string;
          category: string;
          importance: number;
          relevance: number;
          sourceconversationids: string[];
          match_count: number;
        }>
      >`
        SELECT 
          id, 
          content, 
          "summary", 
          "memoryType" as "memorytype",
          category, 
          importance, 
          relevance,
          "sourceConversationIds" as "sourceconversationids",
          ${this.calculateKeywordScore(keywords)} as match_count
        FROM memories
        WHERE ${Prisma.join(this.buildWhereClause(where), ' AND ')}
          AND (${Prisma.join(keywordConditions, ' OR ')})
        ORDER BY match_count DESC, importance DESC
        LIMIT 50
      `;

      // Normalize scores
      const maxMatch = Math.max(...results.map((r) => Number(r.match_count)), 1);

      return results.map((r) => ({
        id: r.id,
        content: r.content,
        summary: r.summary,
        memoryType: r.memorytype,
        category: r.category,
        importance: Number(r.importance),
        relevance: Number(r.relevance),
        sourceConversationIds: r.sourceconversationids || [],
        similarity: Number(r.match_count) / maxMatch,
        source: 'keyword' as const,
      }));
    } catch (error) {
      logger.warn({ error }, 'Keyword search failed');
      return [];
    }
  }

  private async fallbackSearch(
    where: Prisma.MemoryWhereInput,
    limit: number = 50
  ): Promise<SearchResult[]> {
    const memories = await this.prisma.memory.findMany({
      where,
      orderBy: [{ relevance: 'desc' }, { importance: 'desc' }],
      take: limit,
    });

    return memories.map((m) => ({
      id: m.id,
      content: m.content,
      summary: m.summary,
      memoryType: m.memoryType,
      category: m.category,
      importance: m.importance,
      relevance: m.relevance,
      sourceConversationIds: m.sourceConversationIds,
      similarity: m.relevance,
      source: 'semantic' as const,
    }));
  }

  private async getPinnedMemories(where: Prisma.MemoryWhereInput): Promise<SearchResult[]> {
    const memories = await this.prisma.memory.findMany({
      where: { ...where, isPinned: true },
      orderBy: { importance: 'desc' },
    });

    return memories.map((m) => ({
      id: m.id,
      content: m.content,
      summary: m.summary,
      memoryType: m.memoryType,
      category: m.category,
      importance: m.importance,
      relevance: m.relevance,
      sourceConversationIds: m.sourceConversationIds,
      similarity: 1.0, // Pinned always highest
      source: 'semantic' as const,
    }));
  }

  // ============================================================================
  // RESULT FUSION & PROCESSING
  // ============================================================================

  private fuseResults(semantic: SearchResult[], keyword: SearchResult[]): SearchResult[] {
    const k = 60; // RRF constant
    const scoreMap = new Map<string, { result: SearchResult; rrf: number }>();

    // Process semantic results
    semantic.forEach((item, index) => {
      const rrf = 1 / (index + k);
      const combinedScore = this.semanticWeight * rrf + this.keywordWeight * (item.similarity || 0);
      scoreMap.set(item.id, { result: item, rrf: combinedScore });
    });

    // Process keyword results
    keyword.forEach((item, index) => {
      const rrf = 1 / (index + k);
      const combinedScore = this.keywordWeight * rrf + this.semanticWeight * (item.similarity || 0);

      if (scoreMap.has(item.id)) {
        const existing = scoreMap.get(item.id)!;
        existing.rrf = (existing.rrf + combinedScore) / 2;
        existing.result = {
          ...item,
          similarity: (existing.result.similarity + item.similarity) / 2,
          source: 'hybrid',
        };
      } else {
        scoreMap.set(item.id, { result: item, rrf: combinedScore });
      }
    });

    // Sort by combined score
    return Array.from(scoreMap.values())
      .sort((a, b) => b.rrf - a.rrf)
      .map((x) => x.result);
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }

  private fitToTokenBudget(memories: SearchResult[], maxTokens: number): SearchResult[] {
    let usedTokens = 0;
    const result: SearchResult[] = [];

    for (const memory of memories) {
      const text = memory.summary || memory.content;
      const tokens = Math.ceil(text.length / 4);

      if (usedTokens + tokens <= maxTokens) {
        result.push(memory);
        usedTokens += tokens;
      } else if (result.length > 0 && memory.source !== 'semantic') {
        // Try to fit truncated version
        const remaining = maxTokens - usedTokens;
        if (remaining > 50) {
          result.push({
            ...memory,
            content: text.substring(0, remaining * 4) + '...',
          });
        }
        break;
      } else {
        break;
      }
    }

    return result;
  }

  private formatRetrievalResult(
    memories: SearchResult[],
    maxTokens: number
  ): MemoryRetrievalResult {
    const totalTokens = memories.reduce((sum, m) => {
      const text = m.summary || m.content;
      return sum + Math.ceil(text.length / 4);
    }, 0);

    return {
      content: memories.map((m) => m.summary || m.content).join('\n\n---\n\n'),
      memories: memories.map((m) => ({
        id: m.id,
        content: m.content,
        summary: m.summary || undefined,
        memoryType: m.memoryType,
        category: m.category,
        importance: m.importance,
        relevance: m.relevance,
        sourceConversationIds: m.sourceConversationIds,
      })),
      totalTokens,
      usedTokenBudget: Math.min(totalTokens, maxTokens),
    };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private extractKeywords(message: string): string[] {
    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const stopwords = new Set([
      'the',
      'is',
      'at',
      'which',
      'on',
      'and',
      'a',
      'an',
      'in',
      'to',
      'of',
      'for',
      'with',
      'from',
      'this',
      'that',
      'it',
      'are',
      'was',
      'were',
      'be',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'what',
      'how',
      'when',
      'where',
      'who',
      'whom',
      'whose',
      'why',
      'please',
      'thanks',
      'thank',
      'hello',
      'hi',
      'hey',
      'there',
      'their',
      'they',
      'you',
      'your',
      'about',
      'would',
      'could',
      'should',
      'just',
      'like',
      'really',
    ]);

    const wordCounts = new Map<string, number>();
    for (const word of words) {
      if (!stopwords.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private buildWhereClause(where: Prisma.MemoryWhereInput): Prisma.Sql[] {
    const clauses: Prisma.Sql[] = [];

    if (where.userId) {
      clauses.push(Prisma.sql`"userId" = ${where.userId}`);
    }
    if (where.isActive !== undefined) {
      clauses.push(Prisma.sql`"isActive" = ${where.isActive}`);
    }
    if (where.isArchived !== undefined) {
      clauses.push(Prisma.sql`"isArchived" = ${where.isArchived}`);
    }
    if (where.importance) {
      const imp = where.importance as { gte?: number; lte?: number };
      if (imp.gte !== undefined) {
        clauses.push(Prisma.sql`importance >= ${imp.gte}`);
      }
      if (imp.lte !== undefined) {
        clauses.push(Prisma.sql`importance <= ${imp.lte}`);
      }
    }
    if (where.memoryType) {
      const mtObj = where.memoryType as Record<string, unknown>;
      if ('in' in mtObj && Array.isArray(mtObj.in)) {
        const types = mtObj.in as string[];
        clauses.push(
          Prisma.sql`"memoryType" IN (${Prisma.join(
            types.map((s) => Prisma.sql`${s}`),
            ', '
          )})`
        );
      }
    }
    if (where.category) {
      const catObj = where.category as Record<string, unknown>;
      if ('in' in catObj && Array.isArray(catObj.in)) {
        const cats = catObj.in as string[];
        clauses.push(
          Prisma.sql`category IN (${Prisma.join(
            cats.map((s) => Prisma.sql`${s}`),
            ', '
          )})`
        );
      }
    }

    return clauses;
  }

  private calculateKeywordScore(keywords: string[]): Prisma.Sql {
    if (keywords.length === 0) {
      return Prisma.sql`0`;
    }

    const cases = keywords.map(
      (k, i) =>
        Prisma.sql`CASE WHEN LOWER(content) LIKE LOWER(${'%' + k + '%'}) THEN ${1 / (i + 1)} ELSE 0 END`
    );

    return Prisma.sql`(${Prisma.join(cases, ' + ')})`;
  }

  private async updateAccessStats(userId: string, memoryIds: string[]): Promise<void> {
    if (memoryIds.length === 0) return;

    await this.prisma.memory.updateMany({
      where: { id: { in: memoryIds }, userId },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });
  }
}

export default MemoryRetrievalService;
