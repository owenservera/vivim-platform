/**
 * Memory Conflict Detection Service
 *
 * Detects and manages contradictory memories in the system.
 * Uses semantic similarity and contradiction patterns to identify conflicts.
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { createLLMService } from '../context/utils/zai-service.js';

export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflictingMemoryIds: string[];
  conflictType: 'contradiction' | 'outdated' | 'duplicate' | 'none';
  confidence: number; // 0-1
  explanation?: string;
  suggestedResolution?: 'merge' | 'archive' | 'keep_newest' | 'manual';
}

export interface MemoryConflict {
  id: string;
  userId: string;
  memoryId1: string;
  memoryId2: string;
  conflictType: 'contradiction' | 'outdated' | 'duplicate';
  confidence: number;
  explanation: string;
  suggestedResolution: 'merge' | 'archive' | 'keep_newest' | 'manual';
  isResolved: boolean;
  resolvedAt?: Date;
  resolutionMethod?: string;
  createdAt: Date;
}

/**
 * Patterns that indicate potential contradictions
 */
const CONTRADICTION_PATTERNS = [
  // Direct negations
  { pattern: /love|hate|like|dislike|enjoy|despise|prefer|avoid/i, type: 'preference' },
  { pattern: /always|never|sometimes|often|rarely/i, type: 'frequency' },
  { pattern: /believe|think|know|doubt|uncertain|sure/i, type: 'belief' },
  { pattern: /want|need|desire|reject|accept|refuse/i, type: 'desire' },
  { pattern: /can|cannot|able|unable|possible|impossible/i, type: 'ability' },
  { pattern: /should|shouldn't|must|mustn't|ought/i, type: 'obligation' },
  { pattern: /true|false|correct|wrong|right|incorrect/i, type: 'fact' },
  { pattern: /yes|no|agree|disagree|accept|reject/i, type: 'affirmation' },
];

/**
 * Negation words that flip sentiment
 */
const NEGATION_WORDS = [
  'not', "n't", 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere',
  'hardly', 'scarcely', 'barely', 'without', 'instead', 'rather',
];

export class ConflictDetectionService {
  private prisma: any;
  private llmService: any;

  constructor() {
    this.prisma = getPrismaClient();
    this.llmService = createLLMService();
  }

  /**
   * Check if a new memory conflicts with existing memories
   */
  async checkForConflicts(
    userId: string,
    newMemoryContent: string,
    newMemoryCategory?: string,
    excludeMemoryId?: string
  ): Promise<ConflictDetectionResult[]> {
    const results: ConflictDetectionResult[] = [];

    try {
      // Step 1: Find semantically similar memories using embedding search
      const similarMemories = await this.findSimilarMemories(userId, newMemoryContent, 10, excludeMemoryId);

      // Step 2: Check each similar memory for contradictions
      for (const memory of similarMemories) {
        const conflict = await this.analyzePairwiseConflict(
          newMemoryContent,
          memory.content,
          newMemoryCategory,
          memory.category
        );

        if (conflict.hasConflict) {
          results.push({
            ...conflict,
            conflictingMemoryIds: [memory.id],
          });
        }
      }

      // Step 3: Also check for pattern-based contradictions
      const patternConflicts = await this.checkPatternContradictions(userId, newMemoryContent, newMemoryCategory, excludeMemoryId);
      results.push(...patternConflicts);

      logger.debug(
        { userId, newMemoryContent: newMemoryContent.substring(0, 50), conflictsFound: results.length },
        'Conflict detection completed'
      );

      return results;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Conflict detection failed');
      return [];
    }
  }

  /**
   * Find memories semantically similar to the given content
   */
  private async findSimilarMemories(
    userId: string,
    content: string,
    limit: number = 10,
    excludeMemoryId?: string
  ): Promise<Array<{ id: string; content: string; category: string; embedding: number[] }>> {
    try {
      // Use raw SQL for vector similarity search
      const query = `
        SELECT id, content, category, embedding,
          1 - (embedding <=> $2::vector) as similarity
        FROM memories
        WHERE userId = $1
          ${excludeMemoryId ? 'AND id != $3' : ''}
          AND "isActive" = true
        ORDER BY embedding <=> $2::vector
        LIMIT $4
      `;

      const params: any[] = [userId, this.generateQueryEmbedding(content)];
      if (excludeMemoryId) {
        params.push(excludeMemoryId);
      }
      params.push(limit);

      const memories = await this.prisma.$queryRawUnsafe(...params);
      return memories.filter((m: any) => m.similarity > 0.6); // Only consider memories with >60% similarity
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to find similar memories');
      return [];
    }
  }

  /**
   * Generate a simple embedding for query (using mock for now)
   * In production, this should use the actual embedding service
   */
  private generateQueryEmbedding(content: string): number[] {
    // Generate a deterministic mock vector based on text content
    const vector: number[] = [];
    let seed = 0;

    for (let i = 0; i < content.length; i++) {
      seed = (seed * 31 + content.charCodeAt(i)) % 1000000;
    }

    for (let i = 0; i < 1536; i++) {
      const value = ((Math.sin(seed + i) * 10000) % 2) - 1;
      vector.push(parseFloat(value.toFixed(6)));
    }

    return vector;
  }

  /**
   * Analyze if two memory contents contradict each other
   */
  private async analyzePairwiseConflict(
    content1: string,
    content2: string,
    category1?: string,
    category2?: string
  ): Promise<ConflictDetectionResult> {
    // Quick heuristic check first
    const heuristicResult = this.heuristicContradictionCheck(content1, content2, category1, category2);
    
    if (heuristicResult.confidence > 0.8) {
      // High confidence from heuristics, no need for LLM
      return heuristicResult;
    }

    // Use LLM for nuanced analysis
    try {
      const llmResult = await this.llmService.chat({
        messages: [
          {
            role: 'system',
            content: `You are a memory conflict detector. Analyze if two statements contradict each other.
Consider:
- Direct contradictions (e.g., "I love coffee" vs "I hate coffee")
- Temporal conflicts (e.g., "I live in NY" vs "I live in LA" - could be moved)
- Context differences (e.g., "I like tea" vs "I like coffee" - not contradictory)

Respond with JSON: { "hasConflict": boolean, "conflictType": "contradiction" | "outdated" | "duplicate" | "none", "confidence": number (0-1), "explanation": string, "suggestedResolution": "merge" | "archive" | "keep_newest" | "manual" }`,
          },
          {
            role: 'user',
            content: `Statement 1: "${content1}"\nStatement 2: "${content2}"\n\nDo these contradict?`,
          },
        ],
        temperature: 0.1,
        maxTokens: 200,
      });

      const parsed = JSON.parse(llmResult.content.trim());
      return {
        hasConflict: parsed.hasConflict || false,
        conflictingMemoryIds: [],
        conflictType: parsed.conflictType || 'none',
        confidence: parsed.confidence || 0.5,
        explanation: parsed.explanation,
        suggestedResolution: parsed.suggestedResolution,
      };
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'LLM conflict analysis failed, using heuristics');
      return heuristicResult;
    }
  }

  /**
   * Quick heuristic-based contradiction check
   */
  private heuristicContradictionCheck(
    content1: string,
    content2: string,
    category1?: string,
    category2?: string
  ): ConflictDetectionResult {
    const lower1 = content1.toLowerCase();
    const lower2 = content2.toLowerCase();

    // Check for same category with contradictory patterns
    if (category1 && category1 === category2) {
      for (const { pattern, type } of CONTRADICTION_PATTERNS) {
        const match1 = pattern.test(lower1);
        const match2 = pattern.test(lower2);

        if (match1 && match2) {
          // Both contain preference/belief/etc. language
          // Check if they have opposite sentiment
          const sentiment1 = this.analyzeSentiment(lower1);
          const sentiment2 = this.analyzeSentiment(lower2);

          if (sentiment1 !== sentiment2) {
            return {
              hasConflict: true,
              conflictingMemoryIds: [],
              conflictType: 'contradiction',
              confidence: 0.7,
              explanation: `Contradictory ${type} detected: "${content1.substring(0, 50)}" vs "${content2.substring(0, 50)}"`,
              suggestedResolution: 'manual',
            };
          }
        }
      }
    }

    // Check for exact duplicates
    if (this.normalizeText(content1) === this.normalizeText(content2)) {
      return {
        hasConflict: true,
        conflictingMemoryIds: [],
        conflictType: 'duplicate',
        confidence: 0.95,
        explanation: 'Exact duplicate detected',
        suggestedResolution: 'merge',
      };
    }

    return {
      hasConflict: false,
      conflictingMemoryIds: [],
      conflictType: 'none',
      confidence: 0.9,
      explanation: 'No contradiction detected',
    };
  }

  /**
   * Simple sentiment analysis (positive/negative)
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['love', 'like', 'enjoy', 'prefer', 'want', 'need', 'good', 'great', 'excellent', 'happy', 'glad'];
    const negativeWords = ['hate', 'dislike', 'despise', 'avoid', 'reject', 'bad', 'terrible', 'awful', 'sad', 'angry'];

    let score = 0;

    const words = text.split(/\s+/);
    for (const word of words) {
      if (positiveWords.includes(word)) score++;
      if (negativeWords.includes(word)) score--;
      
      // Check for negation
      const wordIndex = words.indexOf(word);
      if (wordIndex > 0 && NEGATION_WORDS.some(n => words[wordIndex - 1].includes(n))) {
        score = -score; // Flip sentiment if negated
      }
    }

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Check for pattern-based contradictions in existing memories
   */
  private async checkPatternContradictions(
    userId: string,
    newContent: string,
    newCategory?: string,
    excludeMemoryId?: string
  ): Promise<ConflictDetectionResult[]> {
    const results: ConflictDetectionResult[] = [];

    try {
      // Extract key patterns from new content
      const patterns = CONTRADICTION_PATTERNS.filter(({ pattern }) => pattern.test(newContent));
      
      if (patterns.length === 0) {
        return results;
      }

      // Search for memories with similar patterns but opposite sentiment
      for (const { type } of patterns) {
        const existingMemories = await this.prisma.memory.findMany({
          where: {
            userId,
            category: newCategory,
            id: excludeMemoryId ? { not: excludeMemoryId } : undefined,
            isActive: true,
          },
          take: 20,
        });

        for (const memory of existingMemories) {
          if (patternMatchesType(memory.content, type)) {
            const sentiment1 = this.analyzeSentiment(newContent.toLowerCase());
            const sentiment2 = this.analyzeSentiment(memory.content.toLowerCase());

            if (sentiment1 !== sentiment2) {
              results.push({
                hasConflict: true,
                conflictingMemoryIds: [memory.id],
                conflictType: 'contradiction',
                confidence: 0.6,
                explanation: `Pattern-based contradiction in ${type}: new content vs existing memory`,
                suggestedResolution: 'manual',
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Pattern contradiction check failed');
    }

    return results;
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get all unresolved conflicts for a user
   */
  async getUserConflicts(userId: string): Promise<MemoryConflict[]> {
    try {
      const conflicts = await this.prisma.memoryConflict.findMany({
        where: {
          userId,
          isResolved: false,
        },
        orderBy: { createdAt: 'desc' },
      });
      return conflicts;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to fetch user conflicts');
      return [];
    }
  }

  /**
   * Mark a conflict as resolved
   */
  async resolveConflict(
    conflictId: string,
    resolutionMethod: string,
    resolvedByUserId: string
  ): Promise<void> {
    try {
      await this.prisma.memoryConflict.update({
        where: { id: conflictId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolutionMethod,
        },
      });
      logger.info({ conflictId, resolutionMethod }, 'Conflict resolved');
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to resolve conflict');
      throw error;
    }
  }

  /**
   * Create a new conflict record
   */
  async createConflict(
    userId: string,
    memoryId1: string,
    memoryId2: string,
    conflictType: 'contradiction' | 'outdated' | 'duplicate',
    confidence: number,
    explanation: string,
    suggestedResolution: 'merge' | 'archive' | 'keep_newest' | 'manual'
  ): Promise<MemoryConflict> {
    try {
      const conflict = await this.prisma.memoryConflict.create({
        data: {
          userId,
          memoryId1,
          memoryId2,
          conflictType,
          confidence,
          explanation,
          suggestedResolution,
          isResolved: false,
        },
      });
      logger.info({ conflictId: conflict.id, conflictType }, 'Conflict created');
      return conflict;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to create conflict record');
      throw error;
    }
  }
}

/**
 * Helper to check if content matches a pattern type
 */
function patternMatchesType(content: string, type: string): boolean {
  const pattern = CONTRADICTION_PATTERNS.find(p => p.type === type);
  return pattern ? pattern.pattern.test(content) : false;
}

export const conflictDetectionService = new ConflictDetectionService();
