/**
 * Request/Response Validation Schemas with Zod
 *
 * Type-safe validation for all API endpoints
 */

import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler.js';

// ============================================================================
// INPUT SANITIZATION HELPERS
// ============================================================================

/**
 * Sanitize string input to prevent injection attacks
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
return input;
}

  // Remove null bytes and control characters
  let sanitized = input.replace(/\0/g, '');

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>]/g, '');

  // Trim whitespace
  return sanitized.trim();
}

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'URL must use HTTP or HTTPS protocol')
  .refine((url) => {
    // Additional security check to prevent SSRF attacks
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Block internal/private addresses
      if (hostname === 'localhost' ||
          hostname.startsWith('127.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('172.') ||
          hostname === '::1' ||
          hostname.startsWith('[::1]')) {
        // Allow localhost only in development
        return process.env.NODE_ENV === 'development';
      }
      return true;
    } catch {
      return false;
    }
  }, 'URL points to restricted address (potential SSRF)')
  .transform(sanitizeString);

export const providerSchema = z.enum([
  'claude',
  'chatgpt',
  'gemini',
  'grok',
  'deepseek',
  'kimi',
  'qwen',
  'zai',
]);

export const stringSanitizedSchema = z
  .string()
  .max(1000, 'String exceeds maximum length of 1000 characters')
  .refine(val => !val.includes('<script'), 'Invalid content detected')
  .transform(sanitizeString);

// ============================================================================
// CAPTURE ENDPOINT SCHEMAS
// ============================================================================

export const captureOptionsSchema = z.object({
  timeout: z.number().int().positive().max(300000).default(120000).optional(),
  richFormatting: z.boolean().default(true).optional(),
  metadataOnly: z.boolean().default(false).optional(),
  headless: z.boolean().default(true).optional(),
  provider: providerSchema.optional(),
}).strict(); // Strict mode to prevent additional properties

export const captureRequestSchema = z.object({
  url: urlSchema,
  options: captureOptionsSchema.optional(),
}).strict(); // Strict mode to prevent additional properties

// Response schemas for validation (optional but recommended)
export const messageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.union([z.string(), z.array(z.any())]),
  timestamp: z.string().datetime().nullable(),
});

export const conversationStatsSchema = z.object({
  totalMessages: z.number().int().nonnegative(),
  totalWords: z.number().int().nonnegative(),
  totalCharacters: z.number().int().nonnegative(),
  totalCodeBlocks: z.number().int().nonnegative(),
  totalMermaidDiagrams: z.number().int().nonnegative(),
  totalImages: z.number().int().nonnegative(),
  firstMessageAt: z.string().datetime().nullable(),
  lastMessageAt: z.string().datetime().nullable(),
});

export const conversationMetadataSchema = z.object({
  provider: providerSchema,
  model: z.string().optional(),
});

export const conversationSchema = z.object({
  id: z.string().uuid(),
  provider: providerSchema,
  sourceUrl: urlSchema,
  title: z.string(),
  createdAt: z.string().datetime(),
  exportedAt: z.string().datetime(),
  messages: z.array(messageSchema),
  metadata: conversationMetadataSchema,
  stats: conversationStatsSchema.optional(),
});

export const captureResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  data: conversationSchema.optional(),
  error: z.string().optional(),
});

// ============================================================================
// HEALTH CHECK SCHEMA
// ============================================================================

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('OpenScroll Capture API'),
  version: z.string(),
  timestamp: z.string().datetime(),
  uptime: z.number(),
  environment: z.enum(['development', 'production', 'test']),
});

// ============================================================================
// ERROR RESPONSE SCHEMA
// ============================================================================

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    errors: z.array(z.any()).optional(),
  }),
});

// ============================================================================
// SYNC TICKET SCHEMA
// ============================================================================

export const syncInitSchema = z.object({
  url: urlSchema,
  pqcCiphertext: z.string().optional(),
  pqcPayload: z.string().optional(),
  pqcNonce: z.string().optional(),
}).strict();

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate request body against schema
 * @throws {ValidationError} If validation fails
 */
export function validateRequest(data, schema) {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error && result.error.errors ? result.error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    })) : [];

    throw new ValidationError('Invalid request body', errors);
  }

  return result.data;
}

/**
 * Validate response data against schema
 * @throws {Error} If validation fails
 */
export function validateResponse(data, schema) {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new Error(`Response validation failed: ${result.error.message}`);
  }

  return result.data;
}
