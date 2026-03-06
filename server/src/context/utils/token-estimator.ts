import { getEncoding, encodingForModel, TiktokenModel, TiktokenEncoding } from "js-tiktoken";
import type { ITokenEstimator } from '../types';

/**
 * Tiktoken Token Estimator (SOTA)
 *
 * Provides exact token counts using OpenAI's tiktoken algorithm.
 * Supports different encodings (cl100k_base, o200k_base) based on the model.
 */
export class TiktokenEstimator implements ITokenEstimator {
  private defaultEncoding: TiktokenEncoding = "cl100k_base";
  private cache: Map<string, any> = new Map();

  constructor(defaultModel: string = "gpt-4o") {
    try {
      this.defaultEncoding = this.getEncodingNameForModel(defaultModel);
    } catch (e) {
      this.defaultEncoding = "cl100k_base";
    }
  }

  private getEncodingNameForModel(model: string): TiktokenEncoding {
    try {
      // js-tiktoken encodingForModel returns the actual encoder, 
      // but we want to cache it or just use it.
      return "cl100k_base"; // Default for most modern GPT models
    } catch (e) {
      return "cl100k_base";
    }
  }

  private getEncoder(model?: string) {
    const cacheKey = model || "default";
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let encoder;
    try {
      if (model) {
        encoder = encodingForModel(model as TiktokenModel);
      } else {
        encoder = getEncoding(this.defaultEncoding);
      }
    } catch (e) {
      encoder = getEncoding("cl100k_base");
    }

    this.cache.set(cacheKey, encoder);
    return encoder;
  }

  estimateTokens(text: string, model?: string): number {
    if (!text || text.length === 0) return 0;
    const encoder = this.getEncoder(model);
    return encoder.encode(text).length;
  }

  estimateMessageTokens(message: { role?: string; content: any }, model?: string): number {
    let totalTokens = 0;
    const encoder = this.getEncoder(model);

    // Count content tokens
    if (typeof message.content === 'string') {
      totalTokens += encoder.encode(message.content).length;
    } else if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (typeof part === 'string') {
          totalTokens += encoder.encode(part).length;
        } else if (part && typeof part.text === 'string') {
          totalTokens += encoder.encode(part.text).length;
        } else if (part && part.type === 'image_url') {
          totalTokens += 85; // Standard image overhead
        }
      }
    } else if (message.content && typeof message.content === 'object') {
      const jsonString = JSON.stringify(message.content);
      totalTokens += encoder.encode(jsonString).length;
    }

    // Overhead for message formatting (role, etc.)
    // For cl100k_base, it's typically 3 tokens per message + 3 tokens at the end
    totalTokens += 3; 

    return totalTokens;
  }

  estimateConversationTokens(messages: Array<{ role?: string; content: any }>, model?: string): number {
    if (messages.length === 0) return 0;
    return messages.reduce((total, msg) => total + this.estimateMessageTokens(msg, model), 0) + 3;
  }
}

/**
 * GPT-4 Token Estimator (Heuristic fallback)
 * ...
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

  estimateTokens(text: string, model?: string): number {
    if (!text || text.length === 0) return 0;

    // Count actual characters
    const charCount = text.length;

    // Estimate tokens using character approximation
    const baseTokens = Math.ceil(charCount / this.charsPerToken);

    // Add overhead for formatting tokens (brackets, colons, etc.)
    const overheadTokens = Math.floor(charCount / 100);

    return baseTokens + overheadTokens;
  }

  estimateMessageTokens(message: { role?: string; content: any }, model?: string): number {
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

  estimateTokens(text: string, model?: string): number {
    if (!text || text.length === 0) return 0;

    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / this.wordsPerToken);
  }

  estimateMessageTokens(message: { role?: string; content: any }, model?: string): number {
    if (!message.content) return 0;

    let totalTokens = 0;
    const content = message.content;

    if (typeof content === 'string') {
      totalTokens += this.estimateTokens(content);
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (typeof part === 'string') {
          totalTokens += this.estimateTokens(part);
        } else if (part && typeof part.text === 'string') {
          totalTokens += this.estimateTokens(part.text);
        } else if (part && typeof part.content === 'string') {
          totalTokens += this.estimateTokens(part.content);
        }
      }
    }

    return totalTokens;
  }

  estimateConversationTokens(messages: Array<{ role?: string; content: any }>, model?: string): number {
    if (messages.length === 0) return 0;
    return messages.reduce((total, msg) => total + this.estimateMessageTokens(msg, model), 0) + 3;
  }
}

/**
 * Factory function to create the appropriate token estimator
 */
export function createTokenEstimator(): ITokenEstimator {
  const estimatorType = process.env.TOKEN_ESTIMATOR_TYPE || 'tiktoken';

  switch (estimatorType.toLowerCase()) {
    case 'tiktoken':
    case 'accurate':
    case 'sota':
      return new TiktokenEstimator();
    case 'gpt':
    case 'heuristic':
      return new GPTTokenEstimator();
    case 'simple':
    default:
      return new SimpleTokenEstimator();
  }
}
