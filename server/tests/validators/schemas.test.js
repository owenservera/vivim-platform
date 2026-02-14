/**
 * Validator Schema Tests
 */

import { describe, it, expect } from 'vitest';
import {
  captureRequestSchema,
  urlSchema,
  providerSchema,
  validateRequest,
} from '../../src/validators/schemas.js';
import { ValidationError } from '../../src/middleware/errorHandler.js';

describe('URL Schema', () => {
  it('should validate valid URLs', () => {
    const result = urlSchema.safeParse('https://claude.ai/share/abc123');
    expect(result.success).toBe(true);
  });

  it('should reject invalid URLs', () => {
    const result = urlSchema.safeParse('not-a-url');
    expect(result.success).toBe(false);
  });

  it('should reject non-HTTP protocols', () => {
    const result = urlSchema.safeParse('ftp://example.com');
    expect(result.success).toBe(false);
  });

  it('should reject empty URLs', () => {
    const result = urlSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('Provider Schema', () => {
  it('should accept valid providers', () => {
    const validProviders = ['claude', 'chatgpt', 'gemini', 'grok', 'deepseek', 'kimi', 'qwen', 'zai'];

    validProviders.forEach((provider) => {
      const result = providerSchema.safeParse(provider);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid providers', () => {
    const result = providerSchema.safeParse('unknown');
    expect(result.success).toBe(false);
  });
});

describe('Capture Request Schema', () => {
  it('should validate valid capture requests', () => {
    const validRequest = {
      url: 'https://claude.ai/share/abc123',
    };

    const result = captureRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('should validate capture requests with options', () => {
    const validRequest = {
      url: 'https://claude.ai/share/abc123',
      options: {
        timeout: 120000,
        richFormatting: true,
        metadataOnly: false,
        provider: 'claude',
      },
    };

    const result = captureRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('should reject requests without URL', () => {
    const invalidRequest = {
      options: {},
    };

    const result = captureRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it('should reject invalid timeout values', () => {
    const invalidRequest = {
      url: 'https://claude.ai/share/abc123',
      options: {
        timeout: 400000, // Exceeds max of 300000
      },
    };

    const result = captureRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it('should reject invalid provider in options', () => {
    const invalidRequest = {
      url: 'https://claude.ai/share/abc123',
      options: {
        provider: 'invalid',
      },
    };

    const result = captureRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });
});

describe('validateRequest', () => {
  it('should return validated data', () => {
    const requestData = {
      url: 'https://claude.ai/share/abc123',
      options: {
        timeout: 120000,
      },
    };

    const result = validateRequest(requestData, captureRequestSchema);

    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('options');
    expect(result.options.timeout).toBe(120000);
  });

  it('should throw ValidationError for invalid data', () => {
    const invalidRequest = {
      url: 'not-a-url',
    };

    expect(() => {
      validateRequest(invalidRequest, captureRequestSchema);
    }).toThrow(ValidationError);
  });

  it('should include validation errors in thrown error', () => {
    const invalidRequest = {
      url: 'not-a-url',
    };

    try {
      validateRequest(invalidRequest, captureRequestSchema);
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toBeDefined();
      expect(error.errors.length).toBeGreaterThan(0);
    }
  });
});
