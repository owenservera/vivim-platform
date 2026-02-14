// apps/server/src/ai/providers/base.js

import { logger } from '../../lib/logger.js';
import { AIError, RateLimitError, AuthenticationError } from '../errors.js';

/**
 * Abstract base class for all AI providers
 * All provider implementations must extend this class
 */
export class BaseAIProvider {
  /**
   * @param {string} providerType - Provider type identifier
   * @param {object} config - Provider configuration
   */
  constructor(providerType, config) {
    this.providerType = providerType;
    this.config = config;
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel;
    this.models = config.models;
  }

  /**
   * Must be implemented by each provider
   * @abstract
   */
  async complete(messages, options) {
    throw new Error('complete() must be implemented by subclass');
  }

  /**
   * Must be implemented by each provider
   * @abstract
   */
  async stream(messages, options, onChunk) {
    throw new Error('stream() must be implemented by subclass');
  }

  /**
   * Format request headers
   * Can be overridden by providers
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Transform messages to provider-specific format
   * Can be overridden by providers
   */
  transformMessages(messages) {
    return messages;
  }

  /**
   * Parse provider response to standard format
   * Can be overridden by providers
   */
  parseResponse(response) {
    return {
      content: response.content,
      model: response.model,
      usage: response.usage,
      finishReason: response.finishReason,
    };
  }

  /**
   * Handle provider-specific errors
   */
  handleAPIError(error, response) {
    logger.error({
      provider: this.providerType,
      error: error.message,
      status: response?.status,
    }, 'API request failed');

    if (response?.status === 401 || response?.status === 403) {
      throw new AuthenticationError(
        `Authentication failed for ${this.providerType}. Check API key.`,
        { provider: this.providerType },
      );
    }

    if (response?.status === 429) {
      throw new RateLimitError(
        `Rate limit exceeded for ${this.providerType}`,
        { provider: this.providerType, retryAfter: response.headers?.get('retry-after') },
      );
    }

    throw new AIError(
      `${this.providerType} API error: ${error.message}`,
      { provider: this.providerType, originalError: error },
    );
  }

  /**
   * Check if provider is healthy
   */
  async healthCheck() {
    // Basic health check: try to fetch models or just return true if baseURL is set
    // In a real app, we might want a more robust check
    return !!this.apiKey;
  }
}
