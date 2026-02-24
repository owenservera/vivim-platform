import type { IEmbeddingService } from '../types';
import { logger } from '../../lib/logger.js';

interface EmbeddingServiceConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  dimensions?: number;
  maxRetries?: number;
  timeout?: number;
}

export class EmbeddingService implements IEmbeddingService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private dimensions: number;
  private maxRetries: number;
  private timeout: number;

  constructor(config: EmbeddingServiceConfig = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    this.model = config.model || process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
    this.baseUrl = config.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.dimensions = config.dimensions || parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10);
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;
  }

  async embed(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return this.getZeroVector(this.dimensions);
    }

    // Skip embedding if no API key is provided, return a mock vector
    if (!this.apiKey || this.apiKey === '') {
      logger.warn(
        { textLength: text.length },
        'No OpenAI API key configured, using mock embeddings'
      );
      return this.generateMockVector(text, this.dimensions);
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: this.model,
          dimensions: this.dimensions,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(
          {
            status: response.status,
            statusText: response.statusText,
            error: errorBody,
          },
          'Embedding API error, falling back to mock'
        );
        return this.generateMockVector(text, this.dimensions);
      }

      const data = await response.json();
      const embedding = data.data?.[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        logger.error({ data }, 'Invalid embedding response from API');
        return this.generateMockVector(text, this.dimensions);
      }

      return embedding;
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        logger.error({ timeout: this.timeout }, 'Embedding request timed out');
      } else {
        logger.error({ error: error.message }, 'Embedding generation failed');
      }
      return this.generateMockVector(text, this.dimensions);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    // Skip embedding if no API key is provided, return mock vectors
    if (!this.apiKey || this.apiKey === '') {
      logger.warn(
        { batchSize: texts.length },
        'No OpenAI API key configured, using mock embeddings'
      );
      return texts.map((text) => this.generateMockVector(text, this.dimensions));
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: texts,
          model: this.model,
          dimensions: this.dimensions,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(
          {
            status: response.status,
            statusText: response.statusText,
            batchSize: texts.length,
            error: errorBody,
          },
          'Batch embedding API error, falling back to mock'
        );
        return texts.map((text) => this.generateMockVector(text, this.dimensions));
      }

      const data = await response.json();
      const embeddings = data.data?.map((item: any) => item.embedding);

      if (!embeddings || !Array.isArray(embeddings) || embeddings.length !== texts.length) {
        logger.error(
          { expected: texts.length, got: embeddings?.length },
          'Invalid batch embedding response'
        );
        return texts.map((text) => this.generateMockVector(text, this.dimensions));
      }

      return embeddings;
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        logger.error(
          { timeout: this.timeout, batchSize: texts.length },
          'Batch embedding request timed out'
        );
      } else {
        logger.error(
          { error: error.message, batchSize: texts.length },
          'Batch embedding generation failed'
        );
      }
      return texts.map((text) => this.generateMockVector(text, this.dimensions));
    }
  }

  private generateMockVector(text: string, dimensions: number): number[] {
    // Generate a deterministic mock vector based on the input text
    // This is for development/testing only - real production should use OpenAI
    const vector: number[] = [];
    let seed = 0;

    // Create a seed based on the text content
    for (let i = 0; i < text.length; i++) {
      seed = (seed * 31 + text.charCodeAt(i)) % 1000000;
    }

    // Generate pseudo-random values based on the seed
    for (let i = 0; i < dimensions; i++) {
      const value = ((Math.sin(seed + i) * 10000) % 2) - 1; // Values between -1 and 1
      vector.push(parseFloat(value.toFixed(6)));
    }

    return vector;
  }

  private getZeroVector(dimensions: number): number[] {
    return new Array(dimensions).fill(0);
  }

  /**
   * Get service configuration for debugging/monitoring
   */
  getConfig(): { model: string; dimensions: number; hasApiKey: boolean } {
    return {
      model: this.model,
      dimensions: this.dimensions,
      hasApiKey: !!this.apiKey && this.apiKey !== '',
    };
  }
}

export class MockEmbeddingService implements IEmbeddingService {
  private dimensions: number;

  constructor(dimensions: number = 384) {
    this.dimensions = dimensions;
  }

  async embed(text: string): Promise<number[]> {
    return this.generatePseudoRandomVector(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.generatePseudoRandomVector(text));
  }

  private generatePseudoRandomVector(text: string): number[] {
    const vector: number[] = [];
    let seed = 0;

    for (let i = 0; i < text.length; i++) {
      seed += text.charCodeAt(i);
    }

    const random = this.seededRandom(seed);

    for (let i = 0; i < this.dimensions; i++) {
      vector.push(random());
    }

    return this.normalize(vector);
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map((val) => val / magnitude);
  }
}
