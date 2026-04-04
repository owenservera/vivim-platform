/**
 * Session-End Extractor
 * 
 * Runs comprehensive extraction at conversation session end.
 * Called when:
 * - User explicitly ends conversation
 * - 30 minutes of inactivity
 * - Conversation reaches natural conclusion
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import { Message, ExtractedMemory } from '../../types/corpus';
import { logger } from '../../../lib/logger';

interface LLMService {
  chat: (params: { model: string; messages: any[] }) => Promise<{ content: string }>;
}

interface MemoryService {
  createMemory: (userId: string, input: any) => Promise<any>;
}

interface ConversationIndexBuilder {
  indexConversation: (
    virtualUserId: string,
    conversationId: string,
    messages: Message[]
  ) => Promise<void>;
}

interface ProfileEvolver {
  evolve: (virtualUserId: string) => Promise<void>;
}

export class SessionEndExtractor {
  private prisma: PrismaClient;
  private llmService: LLMService;
  private memoryService: MemoryService;
  private conversationIndexBuilder: ConversationIndexBuilder;
  private profileEvolver: ProfileEvolver;

  constructor(
    prisma: PrismaClient,
    llmService: LLMService,
    memoryService: MemoryService,
    conversationIndexBuilder: ConversationIndexBuilder,
    profileEvolver: ProfileEvolver
  ) {
    this.prisma = prisma;
    this.llmService = llmService;
    this.memoryService = memoryService;
    this.conversationIndexBuilder = conversationIndexBuilder;
    this.profileEvolver = profileEvolver;
  }

  /**
   * Process session end
   */
  async onSessionEnd(
    virtualUserId: string,
    conversationId: string,
    messages: Message[]
  ): Promise<void> {
    logger.info(
      { virtualUserId, conversationId, messageCount: messages.length },
      'Processing session end'
    );

    try {
      // 1. Build conversation index
      await this.conversationIndexBuilder.indexConversation(
        virtualUserId,
        conversationId,
        messages
      );

      // 2. Extract session-level memories
      const sessionMemories = await this.extractSessionMemories(
        virtualUserId,
        messages
      );

      // 3. Store memories
      for (const memory of sessionMemories) {
        await this.storeMemory(virtualUserId, memory, conversationId);
      }

      // 4. Update user profile evolution
      await this.profileEvolver.evolve(virtualUserId);

      // 5. Check for unresolved issues → create follow-up memory
      const unresolvedIssues = await this.detectUnresolvedIssues(messages);
      for (const issue of unresolvedIssues) {
        await this.storeMemory(virtualUserId, {
          content: `Unresolved: ${issue.description}`,
          memoryType: 'GOAL',
          category: 'unresolved_issue',
          importance: 0.85,
          confidence: 0.9,
          tags: ['unresolved', 'follow-up'],
          source: 'session_end',
        }, conversationId);
      }

      // 6. Mark conversation as ended
      await this.prisma.virtualConversation.update({
        where: { id: conversationId },
        data: {
          metadata: {
            endedAt: new Date().toISOString(),
            messageCount: messages.length,
            memoriesExtracted: sessionMemories.length,
            unresolvedIssues: unresolvedIssues.length,
          },
        },
      });

      logger.info(
        { memoriesExtracted: sessionMemories.length, unresolvedIssues: unresolvedIssues.length },
        'Session end processing complete'
      );
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Session end processing failed');
      throw error;
    }
  }

  /**
   * Extract session-level memories
   */
  private async extractSessionMemories(
    virtualUserId: string,
    messages: Message[]
  ): Promise<ExtractedMemory[]> {
    // Get existing memories to avoid duplicates
    const existingMemories = await this.memoryService.searchMemories(virtualUserId, {
      limit: 30,
    });

    const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

    try {
      const response = await this.llmService.chat({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `This conversation has ended. Extract important session-level memories.

Existing knowledge (do NOT duplicate):
${existingMemories.memories?.map((m: any) => `- ${m.content}`).join('\n') || 'None'}

Extract NEW information:
- FACTUAL: New facts learned about the user
- PREFERENCE: Preferences expressed
- GOAL: Goals or intentions stated
- IDENTITY: Role, background, company info
- EPISODIC: Key events from this conversation
- RELATIONSHIP: People or teams mentioned

Return JSON array of:
{ content, memoryType, category, importance (0-1), confidence (0-1), tags: string[] }

Focus on high-value, lasting information. Return empty array if nothing significant.`,
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
        source: 'session_end',
      }));
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Session memory extraction failed');
      return [];
    }
  }

  /**
   * Detect unresolved issues
   */
  private async detectUnresolvedIssues(messages: Message[]): Promise<
    Array<{ description: string; severity: 'low' | 'medium' | 'high' }>
  > {
    const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

    try {
      const response = await this.llmService.chat({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze this conversation for unresolved issues or open questions.

Look for:
- Problems mentioned but not solved
- Questions asked but not fully answered
- Tasks the user said they would do (but haven't completed)
- Follow-ups promised by either party

Return JSON array of:
{ description: string, severity: 'low' | 'medium' | 'high' }

Return empty array if everything was resolved.`,
          },
          {
            role: 'user',
            content: conversationText,
          },
        ],
      });

      return JSON.parse(response.content);
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Unresolved issue detection failed');
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
        'Failed to store session memory'
      );
    }
  }

  /**
   * Detect session end from inactivity
   */
  async detectInactivityEnd(
    conversationId: string,
    lastMessageAt: Date,
    inactivityThresholdMs: number = 30 * 60 * 1000
  ): Promise<boolean> {
    const now = new Date();
    const inactiveDuration = now.getTime() - lastMessageAt.getTime();

    return inactiveDuration > inactivityThresholdMs;
  }
}
