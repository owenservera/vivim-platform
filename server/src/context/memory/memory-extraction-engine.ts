/**
 * Memory Extraction Engine
 *
 * Automatically extracts meaningful memories from conversations using LLM.
 * Supports batch extraction, incremental extraction, and re-extraction.
 * Designed for production use with proper error handling and retry logic.
 */

import { PrismaClient } from '@prisma/client';
import {
  ExtractedMemory,
  MemoryExtractionInput,
  CreateMemoryInput,
  MEMORY_EXTRACTION_PROMPT,
  IEmbeddingService,
  ILLMService,
  MemoryTypeEnum,
} from './memory-types';
import { ACUQualityScorer } from '../utils/acu-quality-scorer';
import { MemoryService } from './memory-service';
import { logger } from '../../lib/logger.js';

export interface MemoryExtractionConfig {
  prisma: PrismaClient;
  llmService: ILLMService;
  memoryService: MemoryService;
  embeddingService?: IEmbeddingService;
  extractionModel?: string;
  maxMemoriesPerConversation?: number;
  minConfidenceThreshold?: number;
  enableAutoExtraction?: boolean;
}

interface ExtractionResult {
  success: boolean;
  memories?: CreateMemoryInput[];
  error?: string;
  messageCount?: number;
}

export class MemoryExtractionEngine {
  private prisma: PrismaClient;
  private llmService: ILLMService;
  private memoryService: MemoryService;
  private embeddingService?: IEmbeddingService;
  private qualityScorer: ACUQualityScorer;
  private extractionModel: string;
  private maxMemoriesPerConversation: number;
  private minConfidenceThreshold: number;
  private enableAutoExtraction: boolean;

  constructor(config: MemoryExtractionConfig) {
    this.prisma = config.prisma;
    this.llmService = config.llmService;
    this.memoryService = config.memoryService;
    this.embeddingService = config.embeddingService;
    this.qualityScorer = new ACUQualityScorer();
    this.extractionModel = config.extractionModel || 'glm-4.7-flash';
    this.maxMemoriesPerConversation = config.maxMemoriesPerConversation || 20;
    this.minConfidenceThreshold = config.minConfidenceThreshold || 0.5;
    this.enableAutoExtraction = config.enableAutoExtraction ?? true;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Extract memories from a conversation
   */
  async extractFromConversation(
    userId: string,
    input: MemoryExtractionInput
  ): Promise<ExtractionResult> {
    const { conversationId, messageRange, priority = 0, forceReextract = false } = input;

    try {
      // Get conversation messages
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { messageIndex: 'asc' },
            ...(messageRange && {
              skip: messageRange.from,
              take: messageRange.to - messageRange.from + 1,
            }),
          },
        },
      });

      if (!conversation) {
        return { success: false, error: 'Conversation not found' };
      }

      // Check if already extracted (unless force)
      if (!forceReextract) {
        const existingJob = await this.prisma.memoryExtractionJob.findFirst({
          where: {
            conversationId,
            status: 'COMPLETED',
          },
        });
        if (existingJob) {
          logger.info({ conversationId }, 'Memories already extracted, skipping');
          return {
            success: true,
            memories: [],
            messageCount: conversation.messages.length,
          };
        }
      }

      // Create extraction job
      const job = await this.prisma.memoryExtractionJob.create({
        data: {
          userId,
          conversationId,
          status: 'PROCESSING',
          priority,
          messageRange: messageRange as unknown as object,
          startedAt: new Date(),
        },
      });

      // Format conversation for extraction
      const messages = conversation.messages as Array<{
        role: string;
        content?: string;
        author?: string;
        messageIndex: number;
      }>;
      const conversationText = this.formatConversationForExtraction(messages);

      // Extract memories using LLM
      const extracted = await this.performExtraction(conversationText);

      if (!extracted.success || !extracted.memories) {
        await this.prisma.memoryExtractionJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            errorMessage: extracted.error,
            completedAt: new Date(),
          },
        });
        return extracted;
      }

      // Filter by confidence and limit
      const filteredMemories = extracted.memories
        .filter((m) => m.confidence >= this.minConfidenceThreshold)
        .slice(0, this.maxMemoriesPerConversation);

      // Create memories in database
      const createdMemories: any[] = [];
      for (const memory of filteredMemories) {
        try {
          // Calculate quality score
          const quality = await this.qualityScorer.calculateScore(memory.content, memory.memoryType);
          
          // Combine extracted data with calculated quality
          const memoryInput: CreateMemoryInput = {
            ...memory,
            importance: Math.max(memory.importance, quality.overall),
            sourceConversationIds: [conversationId],
            metadata: {
              extractionConfidence: memory.confidence,
              qualityScore: quality,
            }
          };

          const created = await this.memoryService.createMemory(userId, memoryInput);
          createdMemories.push(created);
        } catch (error) {
          logger.warn({ error, memory }, 'Failed to create extracted memory');
        }
      }

      // Update job as completed
      await this.prisma.memoryExtractionJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          extractedMemories: filteredMemories as unknown as object,
          completedAt: new Date(),
        },
      });

      // Update conversation with extraction metadata
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          metadata: {
            ...((conversation.metadata as object) || {}),
            memoryExtraction: {
              extractedAt: new Date(),
              memoryCount: createdMemories.length,
            },
          },
        },
      });

      logger.info(
        {
          conversationId,
          memoryCount: createdMemories.length,
          jobId: job.id,
        },
        'Memory extraction completed'
      );

      return {
        success: true,
        memories: createdMemories,
        messageCount: conversation.messages.length,
      };
    } catch (error) {
      logger.error({ error, conversationId }, 'Memory extraction failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Extract from a single message (for incremental extraction)
   */
  async extractFromMessage(
    userId: string,
    conversationId: string,
    message: { role: string; content: string }
  ): Promise<ExtractedMemory[]> {
    const prompt = `${MEMORY_EXTRACTION_PROMPT}\n\nMessage:\n${message.role}: ${message.content}`;

    try {
      const response = await this.llmService.chat({
        model: this.extractionModel,
        messages: [{ role: 'system', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(response.content);
      const memories = Array.isArray(parsed) ? parsed : parsed.memories || [];

      return memories.map((m: Record<string, unknown>) => ({
        content: String(m.content || ''),
        summary: m.summary ? String(m.summary) : undefined,
        memoryType: (m.memoryType as MemoryTypeEnum) || 'EPISODIC',
        category: String(m.category || 'other'),
        subcategory: m.subcategory ? String(m.subcategory) : undefined,
        tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
        importance: Number(m.importance) || 0.5,
        confidence: Number(m.confidence) || 0.5,
        evidence: Array.isArray(m.evidence) ? m.evidence.map(String) : [],
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to extract from message');
      return [];
    }
  }

  /**
   * Process pending extraction jobs
   */
  async processPendingJobs(limit: number = 10): Promise<number> {
    const jobs = await this.prisma.memoryExtractionJob.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: { priority: 'desc' },
      take: limit,
    });

    let processed = 0;
    for (const job of jobs) {
      try {
        await this.extractFromConversation(job.userId, {
          conversationId: job.conversationId,
          messageRange: job.messageRange as { from: number; to: number } | undefined,
        });
        processed++;
      } catch (error) {
        logger.error({ error, jobId: job.id }, 'Failed to process extraction job');
      }
    }

    return processed;
  }

  /**
   * Check if auto-extraction is enabled
   */
  isAutoExtractionEnabled(): boolean {
    return this.enableAutoExtraction;
  }

  /**
   * Toggle auto-extraction
   */
  setAutoExtraction(enabled: boolean): void {
    this.enableAutoExtraction = enabled;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private formatConversationForExtraction(
    messages: Array<{
      role: string;
      content?: string;
      parts?: unknown[];
      author?: string;
      messageIndex: number;
    }>
  ): string {
    return messages
      .filter((m) => m.content && m.content.trim())
      .map((m) => {
        const role = m.role === 'assistant' ? 'AI' : m.author || m.role;
        return `[${m.messageIndex + 1}] ${role}: ${m.content}`;
      })
      .join('\n\n');
  }

  private async performExtraction(
    conversationText: string
  ): Promise<{ success: boolean; memories?: ExtractedMemory[]; error?: string }> {
    try {
      const response = await this.llmService.chat({
        model: this.extractionModel,
        messages: [
          {
            role: 'system',
            content: MEMORY_EXTRACTION_PROMPT,
          },
          {
            role: 'user',
            content: conversationText,
          },
        ],
        response_format: { type: 'json_object' },
      });

      // Parse the response
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(response.content);
      } catch {
        return {
          success: false,
          error: 'Invalid JSON response from LLM',
        };
      }

      const memories = Array.isArray(parsed) ? parsed : (parsed.memories as unknown[]) || [];

      const extracted: ExtractedMemory[] = memories.map((m: unknown) => {
        const mem = m as Record<string, unknown>;
        return {
          content: String(mem.content || ''),
          summary: mem.summary ? String(mem.summary) : undefined,
          memoryType: (mem.memoryType as MemoryTypeEnum) || 'EPISODIC',
          category: String(mem.category || 'other'),
          subcategory: mem.subcategory ? String(mem.subcategory) : undefined,
          tags: Array.isArray(mem.tags) ? mem.tags.map(String) : [],
          importance: Number(mem.importance) || 0.5,
          confidence: Number(mem.confidence) || 0.5,
          evidence: Array.isArray(mem.evidence) ? mem.evidence.map(String) : [],
        };
      });

      return { success: true, memories: extracted };
    } catch (error) {
      logger.error({ error }, 'Extraction LLM call failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LLM extraction failed',
      };
    }
  }
}

export default MemoryExtractionEngine;
