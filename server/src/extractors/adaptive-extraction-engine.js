/**
 * Adaptive Extraction Engine
 * 
 * Implements a strategy pattern for content extraction with fallbacks,
 * success tracking, and self-learning capabilities.
 */

import { logger } from '../lib/logger.js';
import { telemetry } from '../telemetry/telemetry-system.js';

export class AdaptiveExtractionEngine {
  constructor() {
    this.strategies = new Map();
    this.performanceMetrics = new Map();
  }

  /**
   * Register a new extraction strategy for a provider
   * @param {string} provider 
   * @param {string} name 
   * @param {Function} extractorFn 
   */
  registerStrategy(provider, name, extractorFn) {
    if (!this.strategies.has(provider)) {
      this.strategies.set(provider, []);
    }
    this.strategies.get(provider).push({ name, extractorFn });
    
    // Initialize metrics
    const key = `${provider}:${name}`;
    if (!this.performanceMetrics.has(key)) {
      this.performanceMetrics.set(key, { attempts: 0, successes: 0, failures: 0, avgTime: 0 });
    }
  }

  /**
   * Execute extraction using adaptive strategies
   */
  async extract(provider, context, args) {
    const providerStrategies = this.strategies.get(provider);
    if (!providerStrategies || providerStrategies.length === 0) {
      throw new Error(`No extraction strategies found for provider: ${provider}`);
    }

    // Sort strategies by success rate (adaptive ordering)
    const sortedStrategies = [...providerStrategies].sort((a, b) => {
      const statsA = this.performanceMetrics.get(`${provider}:${a.name}`);
      const statsB = this.performanceMetrics.get(`${provider}:${b.name}`);
      const rateA = statsA.attempts > 0 ? statsA.successes / statsA.attempts : 0.5; // default 50%
      const rateB = statsB.attempts > 0 ? statsB.successes / statsB.attempts : 0.5;
      return rateB - rateA;
    });

    let lastError = null;

    for (const strategy of sortedStrategies) {
      const metricKey = `${provider}:${strategy.name}`;
      const stats = this.performanceMetrics.get(metricKey);
      
      try {
        logger.debug(`Attempting extraction using strategy: ${strategy.name}`);
        const start = performance.now();
        stats.attempts++;
        
        const result = await strategy.extractorFn(context, ...args);
        
        // Validation check (basic structure check)
        if (!result || !result.messages || result.messages.length === 0) {
           throw new Error('Strategy yielded empty results');
        }

        // Update success metrics
        stats.successes++;
        const duration = performance.now() - start;
        stats.avgTime = (stats.avgTime * (stats.successes - 1) + duration) / stats.successes;
        
        telemetry.increment('extraction.strategy.success', 1, { provider, strategy: strategy.name });
        
        // Auto-evolve: If a secondary strategy worked when primary failed, the sorting naturally adjusts for next time
        return result;

      } catch (error) {
        stats.failures++;
        lastError = error;
        logger.warn(`Strategy ${strategy.name} failed: ${error.message}. Trying fallback...`);
        telemetry.increment('extraction.strategy.error', 1, { provider, strategy: strategy.name });
      }
    }

    // All strategies failed
    throw new Error(`All adaptive extraction strategies failed for ${provider}. Last error: ${lastError.message}`);
  }

  getMetrics() {
    return Object.fromEntries(this.performanceMetrics);
  }
}

export const adaptiveEngine = new AdaptiveExtractionEngine();
