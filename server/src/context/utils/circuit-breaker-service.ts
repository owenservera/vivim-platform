import CircuitBreaker from 'opossum';
import type { IEmbeddingService } from '../types';
import { logger } from '../../lib/logger.js';

/**
 * Circuit Breaker Decorator for Embedding Services
 *
 * Uses opossum to protect against cascading failures when embedding APIs are down.
 * Provides fallback to mock vectors when the circuit is open or requests fail.
 */
export class CircuitBreakerEmbeddingService implements IEmbeddingService {
  private service: IEmbeddingService;
  private breaker: CircuitBreaker<[string], number[]>;
  private batchBreaker: CircuitBreaker<[string[]], number[][]>;

  constructor(service: IEmbeddingService, options: CircuitBreaker.Options = {}) {
    this.service = service;

    const defaultOptions: CircuitBreaker.Options = {
      timeout: 30000, // 30 seconds
      errorThresholdPercentage: 50, // 50% failure rate opens the circuit
      resetTimeout: 30000, // Wait 30 seconds before trying again
      ...options,
    };

    this.breaker = new CircuitBreaker(this.service.embed.bind(this.service), defaultOptions);
    this.batchBreaker = new CircuitBreaker(
      this.service.embedBatch.bind(this.service),
      defaultOptions
    );

    this.setupEvents();
  }

  private setupEvents() {
    this.breaker.on('open', () => {
      logger.warn('Embedding circuit breaker OPENed');
    });

    this.breaker.on('halfOpen', () => {
      logger.info('Embedding circuit breaker HALF-OPENed');
    });

    this.breaker.on('close', () => {
      logger.info('Embedding circuit breaker CLOSED');
    });

    this.breaker.on('fallback', (result) => {
      logger.debug('Embedding circuit breaker using FALLBACK');
    });
  }

  async embed(text: string): Promise<number[]> {
    try {
      return await this.breaker.fire(text);
    } catch (error) {
      // Fallback is already handled by the underlying service in most cases (Mock)
      // but we ensure we return a safe value here if something really goes wrong
      logger.error({ error: (error as Error).message }, 'Circuit breaker embedding failed');
      return this.generateFallbackVector(text, 1536);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      return await this.batchBreaker.fire(texts);
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Circuit breaker batch embedding failed');
      return texts.map((t) => this.generateFallbackVector(t, 1536));
    }
  }

  private generateFallbackVector(text: string, dimensions: number): number[] {
    // Deterministic fallback if everything else fails
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
}
