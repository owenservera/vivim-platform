import { PrismaClient } from '@prisma/client';
import { ConversationWindow, CompressionStrategy, ITokenEstimator, ILLMService } from './types';

export interface ConversationContextEngineConfig {
  prisma: PrismaClient;
  tokenEstimator: ITokenEstimator;
  llmService: ILLMService;
}

export class ConversationContextEngine {
  private prisma: PrismaClient;
  private tokenEstimator: ITokenEstimator;
  private llmService: ILLMService;

  constructor(config: ConversationContextEngineConfig) {
    this.prisma = config.prisma;
    this.tokenEstimator = config.tokenEstimator;
    this.llmService = config.llmService;
  }

  async buildConversationContext(
    conversationId: string,
    l4Budget: number,
    l6Budget: number
  ): Promise<ConversationWindow> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { messageIndex: 'asc' } },
        compactions: { orderBy: { fromMessageIndex: 'asc' } }
      }
    });

    if (!conv) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const messages = conv.messages;
    const totalTokens = this.estimateMessagesTokens(messages);
    const totalBudget = l4Budget + l6Budget;
    const compressionRatio = totalTokens / totalBudget;

    if (compressionRatio <= 1.0) {
      return this.strategyFull(messages, l4Budget, l6Budget);
    }

    if (compressionRatio <= 2.5) {
      return this.strategyWindowed(conv, messages, l4Budget, l6Budget);
    }

    if (compressionRatio <= 8.0) {
      return this.strategyCompacted(conv, messages, l4Budget, l6Budget);
    }

    return this.strategyMultiLevel(conv, messages, l4Budget, l6Budget);
  }

  private async strategyFull(
    messages: any[],
    l4Budget: number,
    l6Budget: number
  ): Promise<ConversationWindow> {
    const l6Content = messages.map(m => this.formatMessage(m)).join('\n\n');

    return {
      l4Arc: '',
      l6Messages: l6Content,
      l4TokenCount: 0,
      l6TokenCount: this.tokenEstimator.estimateTokens(l6Content),
      strategy: 'full',
      coverage: {
        totalMessages: messages.length,
        fullMessages: messages.length,
        summarizedMessages: 0,
        droppedMessages: 0
      }
    };
  }

  private async strategyWindowed(
    conv: any,
    messages: any[],
    l4Budget: number,
    l6Budget: number
  ): Promise<ConversationWindow> {
    const recentBudget = Math.floor(l6Budget * 0.7);
    const olderBudget = l6Budget - recentBudget;

    let recentTokens = 0;
    let cutIndex = messages.length;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msgTokens = this.tokenEstimator.estimateMessageTokens(messages[i]);
      if (recentTokens + msgTokens > recentBudget) {
        cutIndex = i + 1;
        break;
      }
      recentTokens += msgTokens;
      if (i === 0) cutIndex = 0;
    }

    const recentMessages = messages.slice(cutIndex);
    const recentContent = recentMessages.map(m => this.formatMessage(m)).join('\n\n');

    const olderMessages = messages.slice(0, cutIndex);
    let olderSummary = '';

    if (olderMessages.length > 0) {
      const existingCompaction = conv.compactions?.find(
        (c: any) => c.fromMessageIndex === 0 && c.toMessageIndex >= cutIndex - 1
      );

      if (existingCompaction && existingCompaction.compactedTokenCount <= olderBudget) {
        olderSummary = existingCompaction.summary;
      } else {
        olderSummary = await this.compactMessages(olderMessages, olderBudget);
        await this.storeCompaction(
          conv.id,
          0,
          cutIndex - 1,
          this.estimateMessagesTokens(olderMessages),
          olderSummary
        );
      }
    }

    const arc = await this.generateLightArc(messages, l4Budget);

    const l6Content = [
      olderSummary ? `[Summary of messages 1-${cutIndex}]\n${olderSummary}` : '',
      `\n[Recent messages]\n`,
      recentContent
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      l4Arc: arc,
      l6Messages: l6Content,
      l4TokenCount: this.tokenEstimator.estimateTokens(arc),
      l6TokenCount: this.tokenEstimator.estimateTokens(l6Content),
      strategy: 'windowed',
      coverage: {
        totalMessages: messages.length,
        fullMessages: recentMessages.length,
        summarizedMessages: olderMessages.length,
        droppedMessages: 0
      }
    };
  }

  private async strategyCompacted(
    conv: any,
    messages: any[],
    l4Budget: number,
    l6Budget: number
  ): Promise<ConversationWindow> {
    const totalMsgs = messages.length;
    const zoneAEnd = Math.floor(totalMsgs * 0.4);
    const zoneBEnd = Math.floor(totalMsgs * 0.75);

    const zoneABudget = Math.floor(l6Budget * 0.1);
    const zoneBBudget = Math.floor(l6Budget * 0.25);
    const zoneCBudget = l6Budget - zoneABudget - zoneBBudget;

    const zoneA = messages.slice(0, zoneAEnd);
    const zoneB = messages.slice(zoneAEnd, zoneBEnd);
    const zoneC = messages.slice(zoneBEnd);

    const [zoneASummary, zoneBContent] = await Promise.all([
      this.compactMessages(zoneA, zoneABudget),
      this.selectKeyMessages(zoneB, zoneBBudget)
    ]);

    const zoneCContent = this.fitMessagesInBudget(zoneC, zoneCBudget);
    const arc = await this.generateRichArc(messages, l4Budget);

    const l6Content = [
      `[Early conversation summary]\n${zoneASummary}`,
      `\n[Key exchanges from middle of conversation]\n${zoneBContent}`,
      `\n[Recent messages]\n${zoneCContent}`
    ].join('\n\n');

    return {
      l4Arc: arc,
      l6Messages: l6Content,
      l4TokenCount: this.tokenEstimator.estimateTokens(arc),
      l6TokenCount: this.tokenEstimator.estimateTokens(l6Content),
      strategy: 'compacted',
      coverage: {
        totalMessages: totalMsgs,
        fullMessages: zoneC.length,
        summarizedMessages: zoneA.length + zoneB.length,
        droppedMessages: 0
      }
    };
  }

  private async strategyMultiLevel(
    conv: any,
    messages: any[],
    l4Budget: number,
    l6Budget: number
  ): Promise<ConversationWindow> {
    const CHUNK_SIZE = 20;
    const totalMsgs = messages.length;

    const chunks: any[][] = [];
    for (let i = 0; i < totalMsgs; i += CHUNK_SIZE) {
      chunks.push(messages.slice(i, Math.min(i + CHUNK_SIZE, totalMsgs)));
    }

    const recentChunk = chunks[chunks.length - 1];
    const recentBudget = Math.floor(l6Budget * 0.7);
    const recentContent = this.fitMessagesInBudget(recentChunk, recentBudget);

    const middleBudget = Math.floor(l6Budget * 0.15);
    let middleContent = '';
    if (chunks.length >= 2) {
      const middleChunks = chunks.slice(Math.max(0, chunks.length - 4), chunks.length - 1);
      const middleMessages = middleChunks.flat();
      middleContent = await this.compactMessages(middleMessages, middleBudget);
    }

    const olderBudget = Math.floor(l6Budget * 0.1);
    let olderContent = '';
    if (chunks.length >= 5) {
      const olderChunks = chunks.slice(0, chunks.length - 4);
      const cachedCompactions = await this.getCachedCompactions(conv.id, 0, olderChunks.flat().length - 1);

      if (cachedCompactions.length > 0) {
        const level1Text = cachedCompactions.map(c => c.summary).join('\n\n');
        if (this.tokenEstimator.estimateTokens(level1Text) <= olderBudget) {
          olderContent = level1Text;
        } else {
          olderContent = await this.compactText(level1Text, olderBudget);
        }
      } else {
        const olderMessages = olderChunks.flat();
        olderContent = await this.compactMessages(olderMessages, olderBudget);
        await this.storeCompaction(
          conv.id,
          0,
          olderMessages.length - 1,
          this.estimateMessagesTokens(olderMessages),
          olderContent
        );
      }
    }

    const ancientBudget = Math.floor(l6Budget * 0.05);
    let ancientContent = '';
    if (chunks.length >= 10) {
      const ancientChunks = chunks.slice(0, Math.floor(chunks.length * 0.3));
      const ancientMessages = ancientChunks.flat();
      ancientContent = await this.compactMessages(ancientMessages, ancientBudget);
    }

    const arc = await this.generateDenseArc(messages, l4Budget);

    const l6Content = [
      ancientContent ? `[Very early conversation — highly compressed]\n${ancientContent}` : '',
      olderContent ? `[Earlier conversation — summarized]\n${olderContent}` : '',
      middleContent ? `[Recent history — summarized]\n${middleContent}` : '',
      `[Current conversation]\n${recentContent}`
    ]
      .filter(Boolean)
      .join('\n\n---\n\n');

    return {
      l4Arc: arc,
      l6Messages: l6Content,
      l4TokenCount: this.tokenEstimator.estimateTokens(arc),
      l6TokenCount: this.tokenEstimator.estimateTokens(l6Content),
      strategy: 'multi_level',
      coverage: {
        totalMessages: totalMsgs,
        fullMessages: recentChunk.length,
        summarizedMessages: totalMsgs - recentChunk.length,
        droppedMessages: 0
      }
    };
  }

  private async compactMessages(messages: any[], targetTokens: number): Promise<string> {
    const messagesText = messages
      .map(m => `[${m.role}${m.author ? ` (${m.author})` : ''}]: ${this.extractText(m.parts)}`)
      .join('\n\n');

    try {
      const response = await this.llmService.chat({
        model: process.env.COMPACTION_MODEL || 'glm-4.7-flash',
        messages: [
          {
            role: 'system',
            content: `Compress this conversation segment into a dense summary.

CONSTRAINTS:
- Maximum ~${targetTokens} tokens (approximately ${Math.floor(targetTokens * 3.5)} characters)
- Preserve: key decisions, technical details, code changes, unresolved questions
- Preserve: the emotional arc and relationship dynamics if relevant
- Use bullet points for facts, prose for narrative flow
- Reference specific message authors when important
- Include exact code snippets only if they're critical artifacts being worked on
- Mark any unresolved questions with [OPEN]

FORMAT:
Start with a 1-sentence overview, then bullet points for key content.`
          },
          { role: 'user', content: messagesText }
        ]
      });

      return response.content;
    } catch (error) {
      console.error('Failed to compact messages:', error);
      return `[Summary unavailable - ${messages.length} messages]`;
    }
  }

  private async compactText(text: string, targetTokens: number): Promise<string> {
    try {
      const response = await this.llmService.chat({
        model: process.env.COMPACTION_MODEL || 'glm-4.7-flash',
        messages: [
          {
            role: 'system',
            content: `Further compress this conversation summary.

CONSTRAINTS:
- Maximum ~${targetTokens} tokens
- Keep only the most critical: decisions, major code artifacts, core questions
- This is a second-level compression — be ruthlessly concise
- Preserve anything marked [OPEN] as it's unresolved`
          },
          { role: 'user', content: text }
        ]
      });

      return response.content;
    } catch (error) {
      console.error('Failed to compact text:', error);
      return text.substring(0, targetTokens * 3);
    }
  }

  private async selectKeyMessages(messages: any[], budget: number): Promise<string> {
    const scored = messages.map((m, i) => ({
      message: m,
      score: this.scoreMessageImportance(m, i, messages.length)
    }));

    scored.sort((a, b) => b.score - a.score);

    let usedTokens = 0;
    const selected: Array<{ message: any; originalIndex: number }> = [];

    for (const { message } of scored) {
      const msgTokens = this.tokenEstimator.estimateMessageTokens(message);
      if (usedTokens + msgTokens > budget) {
        if (budget - usedTokens > 50) {
          selected.push({
            message: this.truncateMessage(message, budget - usedTokens),
            originalIndex: messages.indexOf(message)
          });
        }
        break;
      }
      selected.push({ message, originalIndex: messages.indexOf(message) });
      usedTokens += msgTokens;
    }

    selected.sort((a, b) => a.originalIndex - b.originalIndex);

    const result: string[] = [];
    let lastIdx = -1;

    for (const { message, originalIndex } of selected) {
      if (lastIdx >= 0 && originalIndex - lastIdx > 1) {
        const skipped = originalIndex - lastIdx - 1;
        result.push(`[... ${skipped} messages omitted ...]`);
      }
      result.push(this.formatMessage(message));
      lastIdx = originalIndex;
    }

    return result.join('\n\n');
  }

  private fitMessagesInBudget(messages: any[], budget: number): string {
    let usedTokens = 0;
    const result: string[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const formatted = this.formatMessage(messages[i]);
      const tokens = this.tokenEstimator.estimateTokens(formatted);

      if (usedTokens + tokens > budget) {
        if (i < messages.length - 1) {
          result.unshift(`[... ${i + 1} earlier messages omitted ...]`);
        }
        break;
      }

      result.unshift(formatted);
      usedTokens += tokens;
    }

    return result.join('\n\n');
  }

  private scoreMessageImportance(message: any, index: number, totalCount: number): number {
    let score = 0;
    const text = this.extractText(message.parts);

    score += (index / totalCount) * 20;

    const wordCount = text.split(/\s+/).length;
    score += Math.min(25, Math.log2(wordCount + 1) * 5);

    const codeBlockCount = (text.match(/```/g) || []).length / 2;
    score += codeBlockCount * 15;

    const questionCount = (text.match(/\?/g) || []).length;
    score += Math.min(15, questionCount * 5);

    const decisionPatterns =
      /\b(decided|decision|let's go with|we'll use|agreed|final|conclusion|solution|answer|resolved)\b/gi;
    const decisionCount = (text.match(decisionPatterns) || []).length;
    score += decisionCount * 10;

    const problemPatterns =
      /\b(error|bug|issue|problem|failed|broken|fix|crash|exception|TypeError|undefined)\b/gi;
    const problemCount = (text.match(problemPatterns) || []).length;
    score += Math.min(15, problemCount * 5);

    const listItems = (text.match(/^\s*[-*•]\s/gm) || []).length;
    score += Math.min(10, listItems * 2);

    if (message.role === 'user') score += 5;
    if (index === 0 || index === totalCount - 1) score += 15;

    return score;
  }

  private async generateLightArc(messages: any[], budget: number): Promise<string> {
    return `Conversation with ${messages.length} messages.`;
  }

  private async generateRichArc(messages: any[], budget: number): Promise<string> {
    const userMsgs = messages.filter(m => m.role === 'user').length;
    const assistantMsgs = messages.filter(m => m.role === 'assistant').length;
    return `Conversation: ${messages.length} messages (${userMsgs} user, ${assistantMsgs} assistant)`;
  }

  private async generateDenseArc(messages: any[], budget: number): Promise<string> {
    return this.generateRichArc(messages, budget);
  }

  private async storeCompaction(
    conversationId: string,
    fromIndex: number,
    toIndex: number,
    originalTokens: number,
    summary: string
  ): Promise<void> {
    const compactedTokens = this.tokenEstimator.estimateTokens(summary);

    await this.prisma.conversationCompaction.upsert({
      where: {
        conversationId_fromMessageIndex_toMessageIndex: {
          conversationId,
          fromMessageIndex: fromIndex,
          toMessageIndex: toIndex
        }
      },
      update: {
        summary,
        originalTokenCount: originalTokens,
        compactedTokenCount: compactedTokens,
        compressionRatio: originalTokens / compactedTokens
      },
      create: {
        conversationId,
        fromMessageIndex: fromIndex,
        toMessageIndex: toIndex,
        originalTokenCount: originalTokens,
        compactedTokenCount: compactedTokens,
        summary,
        compressionRatio: originalTokens / compactedTokens
      }
    });
  }

  private async getCachedCompactions(
    conversationId: string,
    fromIndex: number,
    toIndex: number
  ): Promise<any[]> {
    return this.prisma.conversationCompaction.findMany({
      where: {
        conversationId,
        fromMessageIndex: { gte: fromIndex },
        toMessageIndex: { lte: toIndex }
      },
      orderBy: { fromMessageIndex: 'asc' }
    });
  }

  private formatMessage(message: any): string {
    const text = this.extractText(message.parts);
    return `[${message.role}${message.author ? ` (${message.author})` : ''}]: ${text}`;
  }

  private truncateMessage(message: any, maxTokens: number): any {
    const text = this.extractText(message.parts);
    const truncated = text.substring(0, maxTokens * 3);
    return {
      ...message,
      parts: [{ type: 'text', content: truncated + '...' }]
    };
  }

  private extractText(parts: any[]): string {
    if (!Array.isArray(parts)) return String(parts);
    return parts
      .filter((p: any) => p && (p.type === 'text' || p.type === 'code'))
      .map((p: any) => p.content)
      .join(' ');
  }

  private estimateMessagesTokens(messages: any[]): number {
    return messages.reduce((sum, m) => sum + this.tokenEstimator.estimateMessageTokens(m), 0);
  }
}
