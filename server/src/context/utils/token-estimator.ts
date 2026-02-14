import type { ITokenEstimator } from '../types';

/**
 * GPT-4 Token Estimator
 *
 * More accurate token estimation for OpenAI/GPT models using character-based approximation.
 * Based on OpenAI's documentation: average of 4 characters per token for English text.
 *
 * This provides better accuracy than word-based counting, especially for:
 * - Code with special characters
 * - Technical terminology
 * - Non-English text
 * - Text with punctuation and symbols
 */
export class GPTTokenEstimator implements ITokenEstimator {
  // Average characters per token for English text (OpenAI's estimate)
  private charsPerToken: number;
  // overhead per message for role/content markers
  private messageOverhead: number;

  constructor(charsPerToken: number = 4.0, messageOverhead: number = 4) {
    this.charsPerToken = charsPerToken;
    this.messageOverhead = messageOverhead;
  }

  estimateTokens(text: string): number {
    if (!text || text.length === 0) return 0;

    // Count actual characters
    const charCount = text.length;

    // Estimate tokens using character approximation
    const baseTokens = Math.ceil(charCount / this.charsPerToken);

    // Add overhead for formatting tokens (brackets, colons, etc.)
    const overheadTokens = Math.floor(charCount / 100);

    return baseTokens + overheadTokens;
  }

  estimateMessageTokens(message: { role?: string; content: any }): number {
    let totalTokens = 0;

    // Count content tokens
    if (typeof message.content === 'string') {
      totalTokens += this.estimateTokens(message.content);
    } else if (Array.isArray(message.content)) {
      // Handle multimodal messages (text + images)
      for (const part of message.content) {
        if (typeof part === 'string') {
          totalTokens += this.estimateTokens(part);
        } else if (part && typeof part.text === 'string') {
          totalTokens += this.estimateTokens(part.text);
        } else if (part && part.type === 'image_url') {
          // Image tokens: ~85 tokens per image regardless of resolution
          totalTokens += 85;
        }
      }
    } else if (message.content && typeof message.content === 'object') {
      // Handle object content (might be serialized JSON)
      const jsonString = JSON.stringify(message.content);
      totalTokens += this.estimateTokens(jsonString);
    }

    // Add message overhead (role token + opening/closing brackets)
    totalTokens += this.messageOverhead;

    return totalTokens;
  }

  /**
   * Estimate tokens for a full conversation history
   */
  estimateConversationTokens(messages: Array<{ role?: string; content: any }>): number {
    return messages.reduce((total, msg) => total + this.estimateMessageTokens(msg), 0);
  }
}

/**
 * Simple word-based estimator for backwards compatibility
 * @deprecated Use GPTTokenEstimator for better accuracy
 */
export class SimpleTokenEstimator implements ITokenEstimator {
  private wordsPerToken: number;

  constructor(wordsPerToken: number = 0.75) {
    this.wordsPerToken = wordsPerToken;
  }

  estimateTokens(text: string): number {
    if (!text || text.length === 0) return 0;

    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / this.wordsPerToken);
  }

  estimateMessageTokens(message: { parts: any[] }): number {
    if (!message.parts || message.parts.length === 0) return 0;

    let totalTokens = 0;

    for (const part of message.parts) {
      if (typeof part === 'string') {
        totalTokens += this.estimateTokens(part);
      } else if (part && typeof part.text === 'string') {
        totalTokens += this.estimateTokens(part.text);
      } else if (part && typeof part.content === 'string') {
        totalTokens += this.estimateTokens(part.content);
      }
    }

    return totalTokens;
  }
}

/**
 * Factory function to create the appropriate token estimator
 */
export function createTokenEstimator(): ITokenEstimator {
  const estimatorType = process.env.TOKEN_ESTIMATOR_TYPE || 'gpt';

  switch (estimatorType.toLowerCase()) {
    case 'gpt':
    case 'accurate':
      return new GPTTokenEstimator();
    case 'simple':
    default:
      return new SimpleTokenEstimator();
  }
}
