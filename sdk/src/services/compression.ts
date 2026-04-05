/**
 * VIVIM SDK — Context Compression Service
 *
 * Inspired by vCode's `src/services/compact/` pattern (snipCompact.ts, snipProjection.ts).
 *
 * Compresses conversation history to fit more context within LLM token limits.
 * Two strategies:
 * 1. Snip — selective history trimming with projection (remove irrelevant parts)
 * 2. Summary — AI-generated summaries of conversation segments
 *
 * Sovereign memory means efficient memory — compression works with any LLM's context window.
 */

/**
 * Message in a conversation.
 */
export interface CompressedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** Whether this message was summarized rather than preserved verbatim */
  summarized: boolean;
  /** Original token count (estimated) */
  estimatedTokens?: number;
}

/**
 * Compression strategy.
 */
export type CompressionStrategy = 'snip' | 'summary' | 'hybrid';

/**
 * Compression options.
 */
export interface CompressionOptions {
  /** Target token count after compression */
  targetTokens?: number;
  /** Strategy to use */
  strategy?: CompressionStrategy;
  /** Preserve these message indices (e.g., system prompt, key instructions) */
  preserveIndices?: number[];
  /** Maximum tokens for a single message after compression */
  maxMessageTokens?: number;
}

/**
 * Compression result.
 */
export interface CompressionResult {
  /** Compressed messages */
  messages: CompressedMessage[];
  /** Original token count */
  originalTokens: number;
  /** Compressed token count */
  compressedTokens: number;
  /** Compression ratio */
  compressionRatio: number;
  /** Number of messages summarized */
  messagesSummarized: number;
  /** Number of messages removed */
  messagesRemoved: number;
}

/**
 * Summarizer function — provided by the AI layer.
 */
export type SummarizerFn = (
  messages: Array<{ role: string; content: string }>
) => Promise<string>;

/**
 * Context Compression Service.
 */
export class ContextCompressionService {
  private summarizer?: SummarizerFn;

  constructor(options?: { summarizer?: SummarizerFn }) {
    this.summarizer = options?.summarizer;
  }

  /**
   * Set the summarizer function.
   */
  setSummarizer(fn: SummarizerFn): void {
    this.summarizer = fn;
  }

  /**
   * Compress a conversation.
   */
  async compress(
    messages: Array<{ role: string; content: string }>,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const strategy = options.strategy ?? 'snip';
    const targetTokens = options.targetTokens ?? 4000; // Default GPT-3.5 context window reserve

    // Estimate original token count
    const originalTokens = messages.reduce((sum, m) => sum + this.estimateTokens(m.content), 0);

    switch (strategy) {
      case 'snip':
        return this.snipCompress(messages, targetTokens, options);
      case 'summary':
        return this.summaryCompress(messages, targetTokens, options);
      case 'hybrid':
        return this.hybridCompress(messages, targetTokens, options);
      default:
        return this.snipCompress(messages, targetTokens, options);
    }
  }

  /**
   * Snip compression — remove oldest non-preserved messages first.
   * Preserves system messages and explicitly preserved indices.
   */
  private snipCompress(
    messages: Array<{ role: string; content: string }>,
    targetTokens: number,
    options: CompressionOptions
  ): CompressionResult {
    const preserveSet = new Set(options.preserveIndices ?? []);
    const maxMsgTokens = options.maxMessageTokens ?? 1000;
    const originalTokens = messages.reduce((sum, m) => this.estimateTokens(m.content), 0);

    // Always preserve system messages
    const systemIndices = new Set<number>();
    messages.forEach((m, i) => {
      if (m.role === 'system') systemIndices.add(i);
    });

    const mustPreserve = new Set([...systemIndices, ...preserveSet]);

    // Calculate current token usage
    const messageTokens = messages.map(m => this.estimateTokens(m.content));
    let totalTokens = messageTokens.reduce((a, b) => a + b, 0);

    const preservedMessages: Array<{ originalIndex: number; message: CompressedMessage }> = [];
    const trimmableMessages: Array<{ originalIndex: number; message: CompressedMessage }> = [];

    // Categorize messages
    for (let i = 0; i < messages.length; i++) {
      const compressed: CompressedMessage = {
        role: messages[i].role as CompressedMessage['role'],
        content: messages[i].content,
        summarized: false,
        estimatedTokens: messageTokens[i],
      };

      if (mustPreserve.has(i)) {
        preservedMessages.push({ originalIndex: i, message: compressed });
      } else {
        trimmableMessages.push({ originalIndex: i, message: compressed });
      }
    }

    // Calculate preserved token count
    const preservedTokens = preservedMessages.reduce(
      (sum, m) => sum + (m.message.estimatedTokens ?? 0),
      0
    );

    // Available tokens for trimmable messages
    const availableTokens = Math.max(0, targetTokens - preservedTokens);

    // Keep newest trimmable messages first (reverse chronological from end)
    let remainingTokens = availableTokens;
    const keptMessages: Array<{ originalIndex: number; message: CompressedMessage }> = [];
    let messagesRemoved = 0;

    for (let i = trimmableMessages.length - 1; i >= 0; i--) {
      const entry = trimmableMessages[i];
      const tokens = entry.message.estimatedTokens ?? 0;

      if (remainingTokens >= tokens) {
        // Truncate message if it exceeds max
        if (tokens > maxMsgTokens) {
          entry.message.content = this.truncateContent(entry.message.content, maxMsgTokens);
          entry.message.estimatedTokens = maxMsgTokens;
        }
        keptMessages.unshift(entry);
        remainingTokens -= Math.min(tokens, maxMsgTokens);
      } else {
        messagesRemoved++;
      }
    }

    // Combine preserved + kept messages (maintain original order)
    const allMessages = [...preservedMessages, ...keptMessages]
      .sort((a, b) => a.originalIndex - b.originalIndex)
      .map(m => m.message);

    const compressedTokens = allMessages.reduce(
      (sum, m) => sum + (m.estimatedTokens ?? 0),
      0
    );

    return {
      messages: allMessages,
      originalTokens,
      compressedTokens,
      compressionRatio: originalTokens > 0 ? compressedTokens / originalTokens : 1,
      messagesSummarized: 0, // Snip doesn't summarize
      messagesRemoved,
    };
  }

  /**
   * Summary compression — use AI to summarize segments.
   */
  private async summaryCompress(
    messages: Array<{ role: string; content: string }>,
    targetTokens: number,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    const preserveSet = new Set(options.preserveIndices ?? []);
    const originalTokens = messages.reduce((sum, m) => this.estimateTokens(m.content), 0);

    // System messages always preserved
    messages.forEach((m, i) => {
      if (m.role === 'system') preserveSet.add(i);
    });

    let messagesSummarized = 0;
    let messagesRemoved = 0;
    const compressedMessages: CompressedMessage[] = [];
    let totalTokens = 0;

    for (let i = 0; i < messages.length; i++) {
      const estimatedTokens = this.estimateTokens(messages[i].content);

      if (preserveSet.has(i)) {
        // Preserve verbatim
        compressedMessages.push({
          role: messages[i].role as CompressedMessage['role'],
          content: messages[i].content,
          summarized: false,
          estimatedTokens,
        });
        totalTokens += estimatedTokens;
        continue;
      }

      if (!this.summarizer) {
        // No summarizer — fall back to snip behavior
        if (totalTokens + estimatedTokens <= targetTokens) {
          compressedMessages.push({
            role: messages[i].role as CompressedMessage['role'],
            content: messages[i].content,
            summarized: false,
            estimatedTokens,
          });
          totalTokens += estimatedTokens;
        } else {
          messagesRemoved++;
        }
        continue;
      }

      // Try to summarize
      try {
        const summary = await this.summarizer([messages[i]]);
        const summaryTokens = this.estimateTokens(summary);

        compressedMessages.push({
          role: messages[i].role as CompressedMessage['role'],
          content: summary,
          summarized: true,
          estimatedTokens: summaryTokens,
        });
        totalTokens += summaryTokens;
        messagesSummarized++;
      } catch {
        // Summarization failed — include original if space permits
        if (totalTokens + estimatedTokens <= targetTokens) {
          compressedMessages.push({
            role: messages[i].role as CompressedMessage['role'],
            content: messages[i].content,
            summarized: false,
            estimatedTokens,
          });
          totalTokens += estimatedTokens;
        } else {
          messagesRemoved++;
        }
      }
    }

    return {
      messages: compressedMessages,
      originalTokens,
      compressedTokens: totalTokens,
      compressionRatio: originalTokens > 0 ? totalTokens / originalTokens : 1,
      messagesSummarized,
      messagesRemoved,
    };
  }

  /**
   * Hybrid compression — snip first, then summarize the remaining if still over budget.
   */
  private async hybridCompress(
    messages: Array<{ role: string; content: string }>,
    targetTokens: number,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    const originalTokens = messages.reduce((sum, m) => this.estimateTokens(m.content), 0);
    // Phase 1: Snip
    const snipResult = this.snipCompress(messages, targetTokens, options);

    if (snipResult.compressedTokens <= targetTokens) {
      return snipResult; // Already within budget
    }

    // Phase 2: Summarize the non-preserved messages
    const nonSummarized = snipResult.messages.filter(m => !m.summarized);
    if (nonSummarized.length === 0) {
      return snipResult;
    }

    const summarizeInput = nonSummarized.map(m => ({
      role: m.role,
      content: m.content,
    }));

    if (!this.summarizer) {
      return snipResult; // Can't summarize further
    }

    try {
      const summary = await this.summarizer(summarizeInput);
      const summaryTokens = this.estimateTokens(summary);

      const summarizedMessage: CompressedMessage = {
        role: 'system',
        content: `Previous conversation summary:\n${summary}`,
        summarized: true,
        estimatedTokens: summaryTokens,
      };

      // Replace non-summarized messages with summary
      const finalMessages = snipResult.messages
        .filter(m => m.summarized)
        .concat(summarizedMessage)
        .sort((a, b) => {
          // System messages first, then chronological
          if (a.role === 'system' && b.role !== 'system') return -1;
          if (b.role === 'system' && a.role !== 'system') return 1;
          return 0;
        });

      const compressedTokens = finalMessages.reduce(
        (sum, m) => sum + (m.estimatedTokens ?? 0),
        0
      );

      return {
        messages: finalMessages,
        originalTokens,
        compressedTokens,
        compressionRatio: originalTokens > 0 ? compressedTokens / originalTokens : 1,
        messagesSummarized: 1,
        messagesRemoved: snipResult.messagesRemoved,
      };
    } catch {
      return snipResult;
    }
  }

  /**
   * Estimate token count for text (rough: ~4 chars per token for English).
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate content to fit within token budget.
   */
  private truncateContent(content: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (content.length <= maxChars) return content;
    return content.slice(0, maxChars) + '\n\n[...truncated for context management...]';
  }
}
