/**
 * Realtime Memory Extractor
 * 
 * Extracts memories in real-time during conversation.
 * Two modes:
 * 1. Quick signal extraction (no LLM) - pattern-based
 * 2. Deep extraction (LLM) - comprehensive analysis
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import { ExtractedMemory, Message } from '../../types/corpus';
import { logger } from '../../../lib/logger';

interface LLMService {
  chat: (params: { model: string; messages: any[] }) => Promise<{ content: string }>;
}

interface MemoryService {
  createMemory: (userId: string, input: any) => Promise<any>;
  searchMemories: (userId: string, input: any) => Promise<any>;
}

export class RealtimeMemoryExtractor {
  private prisma: PrismaClient;
  private llmService: LLMService;
  private memoryService: MemoryService;

  private messageBuffer: Message[] = [];
  private extractionThreshold = 3; // Extract every N messages

  constructor(
    prisma: PrismaClient,
    llmService: LLMService,
    memoryService: MemoryService
  ) {
    this.prisma = prisma;
    this.llmService = llmService;
    this.memoryService = memoryService;
  }

  /**
   * Process message and extract memories
   */
  async onMessage(
    virtualUserId: string,
    message: Message,
    conversationId: string
  ): Promise<ExtractedMemory[]> {
    this.messageBuffer.push(message);

    // Quick signal extraction (no LLM call needed)
    const quickExtractions = this.quickSignalExtraction(message);

    // Store quick extractions immediately
    for (const extraction of quickExtractions) {
      await this.storeMemory(virtualUserId, extraction, conversationId);
    }

    // Deep extraction every N messages (LLM call)
    let deepExtractions: ExtractedMemory[] = [];
    if (this.messageBuffer.length >= this.extractionThreshold) {
      deepExtractions = await this.deepExtraction(
        virtualUserId,
        this.messageBuffer,
        conversationId
      );

      // Store deep extractions
      for (const extraction of deepExtractions) {
        await this.storeMemory(virtualUserId, extraction, conversationId);
      }

      this.messageBuffer = [];
    }

    return [...quickExtractions, ...deepExtractions];
  }

  /**
   * Quick pattern-based extraction (no LLM)
   */
  quickSignalExtraction(message: Message): ExtractedMemory[] {
    const extractions: ExtractedMemory[] = [];
    const text = message.content;
    const isUser = message.role === 'user';

    if (!isUser) return extractions; // Only extract from user messages

    // Plan mention detection
    const planMatch = text.match(
      /\b(free|starter|team|enterprise|pro|business)\s*(plan|tier|subscription)\b/i
    );
    if (planMatch) {
      extractions.push({
        content: `User appears to be on the ${planMatch[1]} plan`,
        memoryType: 'FACTUAL',
        category: 'account',
        importance: 0.9,
        confidence: 0.7,
        source: 'quick_signal',
        tags: ['plan', 'account'],
      });
    }

    // Role detection
    const roleMatch = text.match(
      /\b(i am|i'm|i work as|my role is)\s+(?:a|an|the)?\s*(\w+(?:\s+\w+)?)\b/i
    );
    if (roleMatch) {
      extractions.push({
        content: `User's role: ${roleMatch[2]}`,
        memoryType: 'IDENTITY',
        category: 'role',
        importance: 0.85,
        confidence: 0.75,
        source: 'quick_signal',
        tags: ['role', 'identity'],
      });
    }

    // Team size detection
    const teamMatch = text.match(
      /\b(\d+)\s*(team members|people|developers|engineers|users|seats)\b/i
    );
    if (teamMatch) {
      extractions.push({
        content: `User has a team of ${teamMatch[1]} ${teamMatch[2]}`,
        memoryType: 'FACTUAL',
        category: 'team',
        importance: 0.8,
        confidence: 0.8,
        source: 'quick_signal',
        tags: ['team', 'size'],
      });
    }

    // Preference detection
    const preferencePatterns = [
      { pattern: /\b(i prefer|i like|i want|i need)\b(.{5,80})/i, type: 'PREFERENCE' },
      { pattern: /\b(don't|do not|hate|dislike)\b(.{5,80})/i, type: 'PREFERENCE' },
    ];

    for (const { pattern, type } of preferencePatterns) {
      const match = text.match(pattern);
      if (match) {
        extractions.push({
          content: match[0],
          memoryType: type as any,
          category: 'preference',
          importance: 0.7,
          confidence: 0.8,
          source: 'quick_signal',
          tags: ['preference'],
        });
      }
    }

    // Goal detection
    const goalMatch = text.match(
      /\b(i want to|i need to|i'm trying to|i hope to)\b(.{5,100})/i
    );
    if (goalMatch) {
      extractions.push({
        content: `User goal: ${goalMatch[2].trim()}`,
        memoryType: 'GOAL',
        category: 'objective',
        importance: 0.75,
        confidence: 0.7,
        source: 'quick_signal',
        tags: ['goal'],
      });
    }

    return extractions;
  }

  /**
   * Deep LLM-based extraction
   */
  private async deepExtraction(
    virtualUserId: string,
    messages: Message[],
    conversationId: string
  ): Promise<ExtractedMemory[]> {
    // Get existing memories to avoid duplicates
    const existingMemories = await this.memoryService.searchMemories(virtualUserId, {
      limit: 20,
    });

    const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

    try {
      const response = await this.llmService.chat({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract important memories from the recent messages.
Consider what we already know about the user.

Existing knowledge (do NOT duplicate these):
${existingMemories.memories?.map((m: any) => `- ${m.content}`).join('\n') || 'None'}

Extract NEW information only. Types:
- FACTUAL: facts about them
- PREFERENCE: likes/dislikes
- GOAL: what they want to achieve
- IDENTITY: role, background
- EPISODIC: what happened in this conversation

Return JSON array of:
{ content, memoryType, category, importance (0-1), confidence (0-1), tags: string[] }

Return empty array if nothing new to extract.`,
          },
          {
            role: 'user',
            content: conversationText,
          },
        ],
      });

      const extracted: ExtractedMemory[] = JSON.parse(response.content);

      // Add source metadata
      return extracted.map((e) => ({
        ...e,
        source: 'deep_extraction',
      }));
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Deep extraction failed');
      return [];
    }
  }

  /**
   * Store memory in database
   */
  private async storeMemory(
    virtualUserId: string,
    extraction: ExtractedMemory,
    conversationId: string
  ): Promise<void> {
    try {
      await this.memoryService.createMemory(virtualUserId, {
        content: extraction.content,
        memoryType: extraction.memoryType,
        category: extraction.category,
        importance: extraction.importance,
        tags: extraction.tags || [],
        sourceConversationIds: [conversationId],
        metadata: {
          extractionMethod: extraction.source,
          confidence: extraction.confidence,
        },
      });
    } catch (error) {
      logger.warn(
        { error: (error as Error).message, content: extraction.content },
        'Failed to store memory'
      );
    }
  }

  /**
   * Flush remaining buffer
   */
  async flushBuffer(virtualUserId: string, conversationId: string): Promise<void> {
    if (this.messageBuffer.length === 0) return;

    logger.debug(
      { bufferSize: this.messageBuffer.length },
      'Flushing remaining message buffer'
    );

    const extractions = await this.deepExtraction(
      virtualUserId,
      this.messageBuffer,
      conversationId
    );

    for (const extraction of extractions) {
      await this.storeMemory(virtualUserId, extraction, conversationId);
    }

    this.messageBuffer = [];
  }
}
