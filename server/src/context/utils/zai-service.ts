/**
 * Z.AI API Service
 *
 * Integration with Z.AI API using glm-4.7-flash model.
 * Replaces OpenAI API for all AI operations.
 */

import CircuitBreaker from 'opossum';
import type { IEmbeddingService, ILLMService } from '../types';
import { logger } from '../../lib/logger.js';

interface ZAIConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionParams {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ZAILLMService implements ILLMService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config: ZAIConfig = {}) {
    this.apiKey = config.apiKey || process.env.ZAI_API_KEY || '';
    this.baseUrl =
      config.baseUrl || process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4';
    this.model = config.model || process.env.ZAI_MODEL || 'glm-4.7-flash';
    this.timeout = config.timeout || 60000; // 60 seconds for chat completions
    this.maxRetries = config.maxRetries || 3;
  }

  async chat(
    params: ChatCompletionParams
  ): Promise<{
    content: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    if (!this.apiKey || this.apiKey === '') {
      throw new Error('Z.AI API key not configured. Set ZAI_API_KEY environment variable.');
    }

    const messages = params.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const body: any = {
      model: this.model,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 4096,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          logger.error(
            {
              status: response.status,
              statusText: response.statusText,
              error: errorBody,
              attempt: attempt + 1,
            },
            'Z.AI API error'
          );

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Z.AI API error: ${response.status} ${response.statusText}`);
          }

          lastError = new Error(`Z.AI API error: ${response.status}`);
          continue;
        }

        const data: ChatCompletionResponse = await response.json();
        const choice = data.choices?.[0];

        if (!choice) {
          throw new Error('No completion choice returned from Z.AI API');
        }

        logger.debug(
          {
            model: this.model,
            promptTokens: data.usage?.prompt_tokens,
            completionTokens: data.usage?.completion_tokens,
            totalTokens: data.usage?.total_tokens,
          },
          'Z.AI chat completion successful'
        );

        return {
          content: choice.message.content,
          usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0,
          },
        };
      } catch (error: any) {
        lastError = error;

        if (error.name === 'TimeoutError') {
          logger.warn(
            { attempt: attempt + 1, maxRetries: this.maxRetries },
            'Z.AI request timeout'
          );
        } else {
          logger.error({ error: error.message, attempt: attempt + 1 }, 'Z.AI request failed');
        }

        // Don't retry on the last attempt
        if (attempt >= this.maxRetries - 1) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    throw lastError || new Error('Z.AI request failed after all retries');
  }

  /**
   * Stream chat completion
   */
  async *chatStream(params: ChatCompletionParams): AsyncGenerator<string> {
    if (!this.apiKey || this.apiKey === '') {
      throw new Error('Z.AI API key not configured. Set ZAI_API_KEY environment variable.');
    }

    const messages = params.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const body = {
      model: this.model,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 4096,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Z.AI API error: ${response.status} ${response.statusText}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response stream');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }
  }

  /**
   * Get service configuration for debugging
   */
  getConfig(): { model: string; baseUrl: string; hasApiKey: boolean } {
    return {
      model: this.model,
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey && this.apiKey !== '',
    };
  }
}

/**
 * Z.AI Embedding Service using chat model
 *
 * Note: Z.AI's glm-4.7-flash is a chat model, not an embedding model.
 * For semantic similarity, we use the chat model with a specialized prompt.
 */

interface EmbeddingConfig extends ZAIConfig {
  embeddingDimensions?: number;
}

export class ZAIEmbeddingService implements IEmbeddingService {
  private llm: ZAILLMService;
  private dimensions: number;

  constructor(config: EmbeddingConfig = {}) {
    this.llm = new ZAILLMService({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      timeout: config.timeout,
    });
    this.dimensions =
      config.embeddingDimensions || parseInt(process.env.ZAI_EMBEDDING_DIMENSIONS || '1536', 10);
  }

  async embed(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return this.getZeroVector(this.dimensions);
    }

    try {
      // Use the LLM to generate a semantic embedding via chat
      const response = await this.llm.chat({
        messages: [
          {
            role: 'system',
            content: `You are a semantic embedding generator. Convert the following text into a ${this.dimensions}-dimensional vector representation. 
            
Return ONLY a JSON array of ${this.dimensions} numbers between -1 and 1.
The numbers should represent the semantic meaning of the input text.
Do not include any explanation or markdown formatting.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.1,
        maxTokens: this.dimensions * 2,
      });

      // Parse the response as JSON
      const embedding = this.parseEmbeddingResponse(response.content);
      return embedding;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Z.AI embedding generation failed');
      return this.generateMockVector(text, this.dimensions);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    // Process in smaller batches to avoid hitting token limits
    const batchSize = 5;
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(batch.map((text) => this.embed(text)));
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  private parseEmbeddingResponse(content: string): number[] {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleaned = content.trim();

      // Handle various markdown code block formats
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }

      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }

      cleaned = cleaned.trim();

      // Try to extract just the array if response contains extra text
      const arrayMatch = cleaned.match(/\[-?[\d.,\s-]+\]/);
      if (arrayMatch) {
        cleaned = arrayMatch[0];
      }

      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        // Validate and normalize the embedding
        return parsed.slice(0, this.dimensions).map((val: any) => {
          const num = parseFloat(val);
          return isNaN(num) ? 0 : Math.max(-1, Math.min(1, num));
        });
      }

      throw new Error('Parsed response is not an array');
    } catch (error) {
      logger.warn(
        { contentPreview: content.slice(0, 150) },
        'Failed to parse embedding response, using mock'
      );
      throw error;
    }
  }

  private generateMockVector(text: string, dimensions: number): number[] {
    // Generate a deterministic mock vector based on text content
    const vector: number[] = [];
    let seed = 0;

    for (let i = 0; i < text.length; i++) {
      seed = (seed * 31 + text.charCodeAt(i)) % 1000000;
    }

    for (let i = 0; i < dimensions; i++) {
      const value = ((Math.sin(seed + i) * 10000) % 2) - 1;
      vector.push(parseFloat(value.toFixed(6)));
    }

    return vector;
  }

  private getZeroVector(dimensions: number): number[] {
    return new Array(dimensions).fill(0);
  }

  getConfig(): { model: string; dimensions: number; hasApiKey: boolean } {
    return {
      ...this.llm.getConfig(),
      dimensions: this.dimensions,
    };
  }
}

import { CircuitBreakerEmbeddingService } from './circuit-breaker-service';

/**
 * Circuit Breaker Decorator for LLM Services
 *
 * Uses opossum to protect against cascading failures when LLM APIs are down.
 * Provides fallback responses when the circuit is open or requests fail.
 */
export class CircuitBreakerLLMService implements ILLMService {
  private service: ILLMService;
  private breaker: CircuitBreaker;

  constructor(service: ILLMService, options: CircuitBreaker.Options = {}) {
    this.service = service;

    const defaultOptions: CircuitBreaker.Options = {
      timeout: 30000, // 30 seconds
      errorThresholdPercentage: 50, // 50% failure rate opens the circuit
      resetTimeout: 30000, // Wait 30 seconds before trying again
      ...options,
    };

    this.breaker = new CircuitBreaker(this.service.chat.bind(this.service), defaultOptions);
    this.setupEvents();
  }

  private setupEvents() {
    this.breaker.on('open', () => {
      logger.warn('LLM circuit breaker OPENed - requests will use fallback');
    });

    this.breaker.on('halfOpen', () => {
      logger.info('LLM circuit breaker HALF-OPENed - testing recovery');
    });

    this.breaker.on('close', () => {
      logger.info('LLM circuit breaker CLOSED - service recovered');
    });

    this.breaker.on('fallback', (result) => {
      logger.debug('LLM circuit breaker using FALLBACK response');
    });

    this.breaker.on('reject', () => {
      logger.error('LLM circuit breaker REJECTED request - circuit is open');
    });
  }

  async chat(
    params: any
  ): Promise<{
    content: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    try {
      return await this.breaker.fire(params);
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'LLM circuit breaker failed');
      // Return a safe fallback response
      return this.generateFallbackResponse(params);
    }
  }

  async *chatStream(params: any): AsyncGenerator<string> {
    // For streaming, we can't use the circuit breaker directly
    // Instead, we'll wrap the underlying service call
    try {
      yield* this.service.chatStream(params);
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'LLM streaming failed');
      // Yield a fallback message
      yield '[Service temporarily unavailable. Please try again shortly.]';
    }
  }

  private generateFallbackResponse(params: any): {
    content: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  } {
    // Intelligent fallback based on the request context
    const messages = params.messages || [];
    const lastUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .slice(-1)[0]?.content || '';

    // Provide context-aware fallback
    let fallbackContent =
      'I apologize, but I am experiencing a temporary service interruption. ';
    
    if (lastUserMessage.toLowerCase().includes('hello') || lastUserMessage.toLowerCase().includes('hi')) {
      fallbackContent += 'Hello! How can I assist you today?';
    } else if (lastUserMessage.toLowerCase().includes('thank')) {
      fallbackContent += 'You are welcome! Is there anything else I can help you with?';
    } else if (lastUserMessage.includes('?')) {
      fallbackContent += 
        'Your question is important. Please try again in a moment, or rephrase your query.';
    } else {
      fallbackContent += 
        'Please try your request again shortly, or check if there are any known service issues.';
    }

    return {
      content: fallbackContent,
      usage: {
        promptTokens: 0,
        completionTokens: fallbackContent.split(' ').length,
        totalTokens: 0,
      },
    };
  }

  getConfig(): { model: string; baseUrl: string; hasApiKey: boolean } {
    return this.service.getConfig();
  }
}

/**
 * Factory function to create the appropriate embedding service based on configuration
 */
export function createEmbeddingService(): IEmbeddingService {
  const zaiApiKey = process.env.ZAI_API_KEY;
  let service: IEmbeddingService;

  if (zaiApiKey && zaiApiKey !== '') {
    logger.info('Using Z.AI embedding service with glm-4.7-flash');
    service = new ZAIEmbeddingService();
  } else {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey && openaiApiKey !== '') {
      logger.info('Using OpenAI embedding service');
      const { EmbeddingService } = require('./embedding-service');
      service = new EmbeddingService();
    } else {
      logger.warn('No API key configured, using mock embeddings');
      const { MockEmbeddingService } = require('./embedding-service');
      service = new MockEmbeddingService(1536);
    }
  }

  // Wrap in circuit breaker if configured (default on)
  const enableCircuitBreaker = process.env.ENABLE_EMBEDDING_CIRCUIT_BREAKER !== 'false';
  if (enableCircuitBreaker) {
    return new CircuitBreakerEmbeddingService(service);
  }
  
  return service;
}

/**
 * Factory function to create the appropriate LLM service based on configuration
 */
export function createLLMService(): ILLMService {
  const zaiApiKey = process.env.ZAI_API_KEY;

  let service: ILLMService;

  if (zaiApiKey && zaiApiKey !== '') {
    logger.info('Using Z.AI LLM service with glm-4.7-flash');
    service = new ZAILLMService();
  } else {
    throw new Error('Z.AI API key not configured. Set ZAI_API_KEY environment variable.');
  }

  // Wrap in circuit breaker if configured (default on)
  const enableCircuitBreaker = process.env.ENABLE_LLM_CIRCUIT_BREAKER !== 'false';
  if (enableCircuitBreaker) {
    return new CircuitBreakerLLMService(service);
  }

  return service;
}
