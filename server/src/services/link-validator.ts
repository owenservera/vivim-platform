/**
 * Link Validator Service
 * Validates and normalizes AI chat share URLs
 * Part of the Iterative Improvement System
 */

import { logger } from '../lib/logger.js';

/**
 * Validation result for a URL
 */
export interface LinkValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  provider: string | null;
  errors: string[];
  warnings: string[];
  metadata: {
    originalUrl: string;
    urlHash: string;
    shareId: string | null;
    queryParams: Record<string, string>;
  };
}

/**
 * Provider URL pattern definitions
 */
interface ProviderPattern {
  name: string;
  patterns: RegExp[];
  shareIdExtractor: (url: URL) => string | null;
  supported: boolean;
}

/**
 * Link Validator class
 * Validates AI chat share URLs and extracts metadata
 */
export class LinkValidator {
  private readonly providers: ProviderPattern[] = [
    {
      name: 'chatgpt',
      patterns: [
        /^https:\/\/chatgpt\.com\/share\/[a-zA-Z0-9-]+$/i,
        /^https:\/\/chat\.openai\.com\/share\/[a-zA-Z0-9-]+$/i,
      ],
      shareIdExtractor: (url) => {
        const match = url.pathname.match(/\/share\/([a-zA-Z0-9-]+)/i);
        return match ? match[1] : null;
      },
      supported: true,
    },
    {
      name: 'claude',
      patterns: [
        /^https:\/\/claude\.ai\/share\/[a-zA-Z0-9-]+$/i,
        /^https:\/\/anthropic\.com\/share\/[a-zA-Z0-9-]+$/i,
      ],
      shareIdExtractor: (url) => {
        const match = url.pathname.match(/\/share\/([a-zA-Z0-9-]+)/i);
        return match ? match[1] : null;
      },
      supported: true,
    },
    {
      name: 'gemini',
      patterns: [
        /^https:\/\/gemini\.google\.com\/share\/[a-zA-Z0-9]+$/i,
        /^https:\/\/bard\.google\.com\/share\/[a-zA-Z0-9]+$/i,
      ],
      shareIdExtractor: (url) => {
        const match = url.pathname.match(/\/share\/([a-zA-Z0-9]+)/i);
        return match ? match[1] : null;
      },
      supported: true,
    },
    {
      name: 'qwen',
      patterns: [
        /^https:\/\/chat\.qwen\.ai\/s\/[a-zA-Z0-9-]+$/i,
        /^https:\/\/qwen\.ai\/share\/[a-zA-Z0-9-]+$/i,
      ],
      shareIdExtractor: (url) => {
        const match = url.pathname.match(/\/(?:s|share)\/([a-zA-Z0-9-]+)/i);
        return match ? match[1] : null;
      },
      supported: true,
    },
    {
      name: 'deepseek',
      patterns: [/^https:\/\/chat\.deepseek\.com\/share\/[a-zA-Z0-9]+$/i],
      shareIdExtractor: (url) => {
        const match = url.pathname.match(/\/share\/([a-zA-Z0-9]+)/i);
        return match ? match[1] : null;
      },
      supported: true,
    },
    {
      name: 'kimi',
      patterns: [
        /^https:\/\/www\.kimi\.com\/share\/[a-zA-Z0-9-]+$/i,
        /^https:\/\/kimi\.com\/share\/[a-zA-Z0-9-]+$/i,
      ],
      shareIdExtractor: (url) => {
        const match = url.pathname.match(/\/share\/([a-zA-Z0-9-]+)/i);
        return match ? match[1] : null;
      },
      supported: true,
    },
    {
      name: 'zai',
      patterns: [
        /^https:\/\/chat\.z\.ai\/s\/[a-zA-Z0-9-]+$/i,
        /^https:\/\/z\.ai\/share\/[a-zA-Z0-9-]+$/i,
      ],
      shareIdExtractor: (url) => {
        const match = url.pathname.match(/\/(?:s|share)\/([a-zA-Z0-9-]+)/i);
        return match ? match[1] : null;
      },
      supported: true,
    },
    {
      name: 'grok',
      patterns: [
        /^https:\/\/grok\.com\/share\/[a-zA-Z0-9_-]+$/i,
        /^https:\/\/x\.com\/i\/grok\/share\/[a-zA-Z0-9_-]+$/i,
      ],
      shareIdExtractor: (url) => {
        const match = url.pathname.match(/\/share\/([a-zA-Z0-9_-]+)/i);
        return match ? match[1] : null;
      },
      supported: true,
    },
    {
      name: 'mistral',
      patterns: [
        /^https:\/\/chat\.mistral\.ai\/share\/[a-zA-Z0-9-]+$/i,
        /^https:\/\/mistral\.ai\/share\/[a-zA-Z0-9-]+$/i,
      ],
      shareIdExtractor: (url) => {
        const match = url.pathname.match(/\/share\/([a-zA-Z0-9-]+)/i);
        return match ? match[1] : null;
      },
      supported: true,
    },
    {
      name: 'perplexity',
      patterns: [/^https:\/\/www\.perplexity\.ai\/search\/[a-zA-Z0-9-]+$/i],
      shareIdExtractor: (url) => {
        const match = url.pathname.match(/\/search\/([a-zA-Z0-9-]+)/i);
        return match ? match[1] : null;
      },
      supported: false, // Not yet implemented
    },
  ];

  /**
   * Validate and normalize a URL
   */
  validate(rawUrl: string): LinkValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Step 1: Basic sanitization
    let sanitizedUrl = rawUrl.trim();

    // Remove trailing whitespace and common punctuation
    sanitizedUrl = sanitizedUrl.replace(/[\s.,;!?]+$/, '');

    // Step 2: URL parsing
    let url: URL;
    try {
      url = new URL(sanitizedUrl);
    } catch (error) {
      errors.push(
        `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return {
        isValid: false,
        normalizedUrl: sanitizedUrl,
        provider: null,
        errors,
        warnings,
        metadata: {
          originalUrl: rawUrl,
          urlHash: this.hashUrl(rawUrl),
          shareId: null,
          queryParams: {},
        },
      };
    }

    // Step 3: Security checks
    if (url.protocol !== 'https:') {
      warnings.push('URL does not use HTTPS protocol');
    }

    // Step 4: Extract query parameters
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Step 5: Check for fragment identifiers (usually not needed)
    if (url.hash) {
      warnings.push(`URL contains fragment identifier: ${url.hash}`);
    }

    // Step 6: Provider detection
    let matchedProvider: ProviderPattern | null = null;
    let shareId: string | null = null;

    // Create normalized URL without query params and hash for matching
    const normalizedForMatching = `${url.protocol}//${url.hostname}${url.pathname}`;

    for (const provider of this.providers) {
      for (const pattern of provider.patterns) {
        if (pattern.test(normalizedForMatching)) {
          matchedProvider = provider;
          shareId = provider.shareIdExtractor(url);
          break;
        }
      }
      if (matchedProvider) break;
    }

    // Step 7: Build normalized URL (clean params that don't affect content)
    const normalizedUrl = this.buildNormalizedUrl(url, matchedProvider);

    // Step 8: Generate result
    if (!matchedProvider) {
      errors.push('URL does not match any known AI chat provider pattern');
    } else if (!matchedProvider.supported) {
      warnings.push(`Provider '${matchedProvider.name}' is detected but not yet supported`);
    }

    return {
      isValid: errors.length === 0 && matchedProvider !== null && matchedProvider.supported,
      normalizedUrl,
      provider: matchedProvider?.name || null,
      errors,
      warnings,
      metadata: {
        originalUrl: rawUrl,
        urlHash: this.hashUrl(rawUrl),
        shareId,
        queryParams,
      },
    };
  }

  /**
   * Validate multiple URLs at once
   */
  validateBatch(urls: string[]): LinkValidationResult[] {
    return urls.map((url) => this.validate(url));
  }

  /**
   * Get list of supported providers
   */
  getSupportedProviders(): string[] {
    return this.providers.filter((p) => p.supported).map((p) => p.name);
  }

  /**
   * Get list of detected but unsupported providers
   */
  getUnsupportedProviders(): string[] {
    return this.providers.filter((p) => !p.supported).map((p) => p.name);
  }

  /**
   * Build normalized URL
   * Removes unnecessary query parameters while preserving essential ones
   */
  private buildNormalizedUrl(url: URL, provider: ProviderPattern | null): string {
    // Keep only essential query parameters
    const essentialParams = ['fev']; // Qwen version param
    const cleanParams = new URLSearchParams();

    url.searchParams.forEach((value, key) => {
      if (essentialParams.includes(key)) {
        cleanParams.append(key, value);
      }
    });

    const queryString = cleanParams.toString();
    return `${url.protocol}//${url.hostname}${url.pathname}${queryString ? '?' + queryString : ''}`;
  }

  /**
   * Create a hash of the URL for deduplication
   */
  private hashUrl(url: string): string {
    // Simple hash for now - could use crypto in production
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

// Singleton instance
export const linkValidator = new LinkValidator();

// Convenience function
export function validateUrl(url: string): LinkValidationResult {
  return linkValidator.validate(url);
}

export function validateUrls(urls: string[]): LinkValidationResult[] {
  return linkValidator.validateBatch(urls);
}

export default linkValidator;
