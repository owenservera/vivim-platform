/**
 * Hybrid Retrieval Service for L5 JIT Knowledge
 *
 * Combines semantic search (Qdrant) with keyword search.
 * Uses Reciprocal Rank Fusion (RRF) to merge result sets.
 */

import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { QdrantVectorStore, getQdrantVectorStore } from './qdrant-vector-store.js';
import { logger } from '../lib/logger.js';

interface SearchResult {
  id: string;
  content: string;
  type: string;
  category: string;
  createdAt: Date;
  similarity: number;
  source: 'semantic' | 'keyword' | 'hybrid';
}

interface HybridRetrievalConfig {
  semanticWeight: number;
  keywordWeight: number;
  maxResults: number;
  similarityThreshold: number;
  useQdrant?: boolean;
}

interface RetrievalResult {
  acus: SearchResult[];
  memories: SearchResult[];
}

export class HybridRetrievalService {
  private prisma: PrismaClient;
  private qdrant: QdrantVectorStore | null = null;
  private config: HybridRetrievalConfig;
  private qdrantAvailable: boolean = false;

  constructor(prisma: PrismaClient, config?: Partial<HybridRetrievalConfig>) {
    this.prisma = prisma;
    this.config = {
      semanticWeight: config?.semanticWeight ?? 0.6,
      keywordWeight: config?.keywordWeight ?? 0.4,
      maxResults: config?.maxResults ?? 10,
      similarityThreshold: config?.similarityThreshold ?? 0.3,
      useQdrant: config?.useQdrant ?? true
    };

    // Try to initialize Qdrant
    if (this.config.useQdrant) {
      this.initializeQdrant();
    }
  }

  private async initializeQdrant(): Promise<void> {
    try {
      this.qdrant = getQdrantVectorStore();
      this.qdrantAvailable = await this.qdrant.initialize();
      if (this.qdrantAvailable) {
        logger.info('Qdrant vector store connected');
      } else {
        logger.warn('Qdrant initialization failed, using fallback');
      }
    } catch (error) {
      logger.warn({ error }, 'Qdrant not available, using PostgreSQL fallback');
      this.qdrantAvailable = false;
    }
  }

  /**
   * Main hybrid retrieval method
   * Combines semantic and keyword search with RRF fusion
   */
  async retrieve(
    userId: string,
    message: string,
    embedding: number[],
    topicSlugs: string[]
  ): Promise<RetrievalResult> {
    const keywords = this.extractKeywords(message);

    // Run semantic and keyword searches in parallel
    const [semanticAcus, keywordAcus, semanticMemories, keywordMemories] = await Promise.all([
      this.semanticSearchACUs(userId, embedding, topicSlugs),
      this.keywordSearchACUs(userId, keywords, topicSlugs),
      this.semanticSearchMemories(userId, embedding),
      this.keywordSearchMemories(userId, keywords)
    ]);

    // Fuse results using RRF
    const fusedAcus = this.fuseResults(semanticAcus, keywordAcus);
    const fusedMemories = this.fuseResults(semanticMemories, keywordMemories);

    return {
      acus: fusedAcus.slice(0, this.config.maxResults),
      memories: fusedMemories.slice(0, this.config.maxResults / 2)
    };
  }

  /**
   * Semantic search using Qdrant or PostgreSQL fallback
   */
  private async semanticSearchACUs(
    userId: string,
    embedding: number[],
    topicSlugs: string[]
  ): Promise<SearchResult[]> {
    // Try Qdrant first if available
    if (this.qdrantAvailable && this.qdrant) {
      const results = await this.qdrant.search(userId, embedding, {
        limit: 20,
        scoreThreshold: this.config.similarityThreshold,
        type: 'acu'
      });

      return results
        .filter(r => !topicSlugs.includes(r.category || ''))
        .map(r => ({ ...r, source: 'semantic' as const }));
    }

    // Fallback to PostgreSQL
    return this.postgresSemanticSearch(userId, embedding, topicSlugs);
  }

  /**
   * PostgreSQL fallback when Qdrant unavailable
   */
  private async postgresSemanticSearch(
    userId: string,
    embedding: number[],
    topicSlugs: string[]
  ): Promise<SearchResult[]> {
    try {
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT
          id,
          content,
          type,
          category,
          "createdAt",
          0.5 as similarity
        FROM atomic_chat_units
        WHERE "authorDid" = ${userId}
          AND state = 'ACTIVE'
          AND embedding IS NOT NULL
          AND array_length(embedding, 1) > 0
        ORDER BY "createdAt" DESC
        LIMIT 20
      `;

      return results
        .filter(r => r.similarity >= this.config.similarityThreshold)
        .map(r => ({
          id: r.id,
          content: r.content,
          type: r.type,
          category: r.category,
          createdAt: r.createdAt,
          similarity: r.similarity,
          source: 'semantic' as const
        }));
    } catch (error) {
      logger.warn({ error }, 'PostgreSQL semantic search failed');
      return this.fallbackSemanticSearch(userId, embedding, topicSlugs);
    }
  }

  /**
   * Fallback when no vector DB is available
   */
  private async fallbackSemanticSearch(
    userId: string,
    embedding: number[],
    topicSlugs: string[]
  ): Promise<SearchResult[]> {
    const acus = await this.prisma.atomicChatUnit.findMany({
      where: {
        authorDid: userId,
        state: 'ACTIVE',
        embedding: { isEmpty: false }
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    return acus
      .filter(acu => !topicSlugs.includes(acu.category || ''))
      .slice(0, 10)
      .map((acu, index) => ({
        id: acu.id,
        content: acu.content,
        type: acu.type,
        category: acu.category,
        createdAt: acu.createdAt,
        similarity: 0.5 + (index * 0.02),
        source: 'semantic' as const
      }));
  }

  /**
   * Semantic search for memories
   */
  private async semanticSearchMemories(
    userId: string,
    embedding: number[]
  ): Promise<SearchResult[]> {
    // Try Qdrant first if available
    if (this.qdrantAvailable && this.qdrant) {
      const results = await this.qdrant.search(userId, embedding, {
        limit: 10,
        scoreThreshold: this.config.similarityThreshold,
        type: 'memory'
      });

      return results.map(r => ({ ...r, source: 'semantic' as const }));
    }

    // Fallback to PostgreSQL
    return this.postgresMemorySearch(userId, embedding);
  }

  /**
   * PostgreSQL memory search fallback
   */
  private async postgresMemorySearch(
    userId: string,
    embedding: number[]
  ): Promise<SearchResult[]> {
    try {
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT
          id,
          content,
          category,
          importance,
          "createdAt",
          0.5 as similarity
        FROM memories
        WHERE "userId" = ${userId}
          AND "isActive" = true
          AND embedding IS NOT NULL
          AND array_length(embedding, 1) > 0
          AND importance < 0.8
        ORDER BY "createdAt" DESC
        LIMIT 10
      `;

      return results
        .filter(r => r.similarity >= this.config.similarityThreshold)
        .map(r => ({
          id: r.id,
          content: r.content,
          type: 'memory' as const,
          category: r.category,
          createdAt: r.createdAt,
          similarity: r.similarity,
          source: 'semantic' as const
        }));
    } catch (error) {
      logger.warn({ error }, 'Memory semantic search failed');
      return [];
    }
  }

  /**
   * Keyword-based search for ACUs
   */
  private async keywordSearchACUs(
    userId: string,
    keywords: string[],
    topicSlugs: string[]
  ): Promise<SearchResult[]> {
    if (keywords.length === 0) {
      return [];
    }

    // Build OR conditions for keyword matching
    const conditions = keywords.map(k => 
      Prisma.sql`LOWER(content) LIKE LOWER(${'%' + k + '%'})`
    );

    const whereClause = Prisma.sql`
      WHERE "authorDid" = (SELECT did FROM users WHERE id = ${userId})
        AND state = 'ACTIVE'
        AND (${Prisma.join(conditions, ' OR ')})
        AND id NOT IN (
          SELECT DISTINCT unnest("relatedAcuIds")::text FROM topic_profiles
          WHERE "userId" = ${userId}
            AND slug = ANY(${topicSlugs}::text[])
        )
    `;

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, content, type, category, "createdAt",
        ${this.calculateKeywordScore(keywords)} as similarity
      FROM atomic_chat_units
      ${whereClause}
      LIMIT 20
    `;

    return results.map(r => ({
      id: r.id,
      content: r.content,
      type: r.type,
      category: r.category,
      createdAt: r.createdAt,
      similarity: Math.min(r.similarity, 1.0),
      source: 'keyword' as const
    }));
  }



  /**
   * Keyword-based search for memories
   */
  private async keywordSearchMemories(
    userId: string,
    keywords: string[]
  ): Promise<SearchResult[]> {
    if (keywords.length === 0) {
      return [];
    }

    const conditions = keywords.map(k => 
      Prisma.sql`LOWER(content) LIKE LOWER(${'%' + k + '%'})`
    );

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT id, content, category, importance, "createdAt",
        ${this.calculateKeywordScore(keywords)} as similarity
      FROM memories
      WHERE "userId" = ${userId}
        AND "isActive" = true
        AND importance < 0.8
        AND (${Prisma.join(conditions, ' OR ')})
      LIMIT 10
    `;

    return results.map(r => ({
      id: r.id,
      content: r.content,
      type: 'memory',
      category: r.category,
      createdAt: r.createdAt,
      similarity: Math.min(r.similarity, 1.0),
      source: 'keyword' as const
    }));
  }

  /**
   * Reciprocal Rank Fusion (RRF) to merge result sets
   * RRF score = 1 / (rank + k), where k = 60 (constant)
   */
  private fuseResults(semantic: SearchResult[], keyword: SearchResult[]): SearchResult[] {
    const k = 60; // RRF constant
    const scoreMap = new Map<string, { result: SearchResult; rrf: number }>();

    // Score semantic results
    semantic.forEach((item, index) => {
      const rrf = 1 / (index + k);
      const combinedScore = (this.config.semanticWeight * rrf) + 
        (this.config.keywordWeight * (item.similarity || 0));
      scoreMap.set(item.id, { result: item, rrf: combinedScore });
    });

    // Score and merge keyword results
    keyword.forEach((item, index) => {
      const rrf = 1 / (index + k);
      const combinedScore = (this.config.keywordWeight * rrf) + 
        (this.config.semanticWeight * (item.similarity || 0));
      
      if (scoreMap.has(item.id)) {
        // Item exists in both - average the scores
        const existing = scoreMap.get(item.id)!;
        existing.rrf = (existing.rrf + combinedScore) / 2;
        existing.result = {
          ...item,
          similarity: (existing.result.similarity + item.similarity) / 2,
          source: 'hybrid'
        };
      } else {
        scoreMap.set(item.id, { result: item, rrf: combinedScore });
      }
    });

    // Sort by combined RRF score and return
    return Array.from(scoreMap.values())
      .sort((a, b) => b.rrf - a.rrf)
      .map(x => x.result);
  }

  /**
   * Extract keywords from message for keyword search
   */
  private extractKeywords(message: string): string[] {
    // Clean and tokenize
    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Remove common stopwords
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'of',
      'for', 'with', 'from', 'this', 'that', 'it', 'are', 'was', 'were',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'what', 'how', 'when',
      'where', 'who', 'whom', 'whose', 'why', 'please', 'thanks', 'thank',
      'hello', 'hi', 'hey', 'there', 'their', 'they', 'you', 'your'
    ]);

    // Count word frequency
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      if (!stopwords.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    // Return top keywords sorted by frequency
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordScore(keywords: string[]): Prisma.Sql {
    // Return SQL that calculates match score based on keyword count
    const cases = keywords.map((k, i) => 
      Prisma.sql`CASE WHEN LOWER(content) LIKE LOWER(${'%' + k + '%'}) THEN ${1 / (i + 1)} ELSE 0 END`
    );
    
    if (cases.length === 0) {
      return Prisma.sql`0`;
    }
    
    return Prisma.sql`(${Prisma.join(cases, ' + ')})`;
  }
}

export default HybridRetrievalService;
