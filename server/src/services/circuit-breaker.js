/**
 * Circuit Breaker Service
 *
 * Provides fault tolerance for external AI providers (OpenAI, Anthropic, etc.).
 * Prevents cascading failures when a service is down or slow.
 */

import Opossum from 'opossum';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';
import { serverErrorReporter } from '../utils/server-error-reporting.js';

class CircuitBreakerService {
  constructor() {
    this.breakers = new Map();
    this.options = {
      timeout: 30000, // If function takes longer than 30s, trigger failure
      errorThresholdPercentage: 50, // When 50% of requests fail, open circuit
      resetTimeout: 30000, // After 30s, try again (half-open)
    };
  }

  /**
   * Get or create a circuit breaker for a specific provider
   * @param {string} providerName
   * @param {Function} asyncFunction The function to wrap
   */
  getBreaker(providerName, asyncFunction) {
    if (!this.breakers.has(providerName)) {
      const breaker = new Opossum(asyncFunction, {
        ...this.options,
        name: providerName,
      });

      breaker.on('open', () => {
        logger.warn(`Circuit OPEN for ${providerName}`);
        serverErrorReporter.reportWarning(`Circuit breaker OPEN for provider: ${providerName}`, {
          providerName,
        });
      });
      breaker.on('halfOpen', () => logger.info(`Circuit HALF-OPEN for ${providerName}`));
      breaker.on('close', () => logger.info(`Circuit CLOSED for ${providerName}`));
      breaker.on('fallback', () => logger.warn(`Circuit FALLBACK for ${providerName}`));

      this.breakers.set(providerName, breaker);
    }
    return this.breakers.get(providerName);
  }

  /**
   * Execute function through circuit breaker
   * @param {string} providerName
   * @param {Function} asyncFunction
   * @param  {...any} args
   */
  async execute(providerName, asyncFunction, ...args) {
    const breaker = this.getBreaker(providerName, asyncFunction);
    try {
      return await breaker.fire(...args);
    } catch (error) {
      if (error.type === 'OpenCircuitError') {
        throw new Error(
          `Service ${providerName} is currently unavailable due to high failure rates.`
        );
      }
      throw error;
    }
  }
}

export const circuitBreakerService = new CircuitBreakerService();
