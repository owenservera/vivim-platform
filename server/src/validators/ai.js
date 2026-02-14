// apps/server/src/validators/ai.js
// ═══════════════════════════════════════════════════════════════════════════
// AI REQUEST VALIDATORS - Zod schemas for all AI endpoints
// ═══════════════════════════════════════════════════════════════════════════

import { z } from 'zod';

// Valid providers
const providerEnum = z.enum([
  'openai', 'xai', 'anthropic', 'gemini',
  'qwen', 'moonshot', 'minimax', 'zai',
]);

// Valid agent modes
const agentModeEnum = z.enum([
  'single-shot', 'multi-step', 'researcher', 'conversational',
]);

// Valid tool sets
const toolSetEnum = z.enum([
  'full', 'second-brain', 'social', 'minimal', 'none',
]);

// Valid personas
const personaEnum = z.enum([
  'default', 'researcher', 'creative', 'coder', 'coach',
]);

/**
 * Message schema
 */
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string().min(1),
});

/**
 * AI completion request schema (basic)
 */
export const aiCompletionSchema = z.object({
  messages: z.array(messageSchema).min(1).max(100),
  provider: providerEnum.optional(),
  model: z.string().optional(),
  conversationId: z.string().optional(),
  options: z.object({
    maxTokens: z.number().int().min(1).max(128000).optional(),
    temperature: z.number().min(0).max(2).optional(),
  }).optional(),
});

/**
 * AI stream request schema
 */
export const aiStreamSchema = z.object({
  messages: z.array(messageSchema).min(1).max(100),
  provider: providerEnum.optional(),
  model: z.string().optional(),
  conversationId: z.string().optional(),
  options: z.object({
    maxTokens: z.number().int().min(1).max(128000).optional(),
    temperature: z.number().min(0).max(2).optional(),
  }).optional(),
});

/**
 * Agent request schema - for multi-step tool-using AI
 */
export const agentRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(100),
  provider: providerEnum.optional(),
  model: z.string().optional(),
  conversationId: z.string().optional(),
  mode: agentModeEnum.optional().default('multi-step'),
  personaId: personaEnum.optional().default('default'),
  toolSet: toolSetEnum.optional().default('full'),
  maxSteps: z.number().int().min(1).max(20).optional().default(8),
  enableSocial: z.boolean().optional().default(true),
  customInstructions: z.string().max(2000).optional(),
  options: z.object({
    maxTokens: z.number().int().min(1).max(128000).optional(),
    temperature: z.number().min(0).max(2).optional(),
  }).optional(),
});

/**
 * Structured output request schema
 */
export const structuredOutputSchema = z.object({
  prompt: z.string().min(1).max(10000).optional(),
  messages: z.array(messageSchema).max(50).optional(),
  provider: providerEnum.optional(),
  model: z.string().optional(),
  schema: z.record(z.any()).describe('JSON Schema or serialized Zod schema for the output'),
  toolSet: toolSetEnum.optional().default('minimal'),
  maxSteps: z.number().int().min(1).max(10).optional().default(5),
}).refine(data => data.prompt || data.messages, {
  message: 'Either prompt or messages must be provided',
});

/**
 * Fresh chat message schema
 */
export const freshChatSchema = z.object({
  message: z.string().min(1).max(10000),
  provider: providerEnum.optional(),
  model: z.string().optional(),
  personaId: personaEnum.optional().default('default'),
  options: z.object({
    maxTokens: z.number().int().min(1).max(128000).optional(),
    temperature: z.number().min(0).max(2).optional(),
  }).optional(),
});

/**
 * AI settings update schema
 */
export const aiSettingsSchema = z.object({
  defaultProvider: providerEnum.optional(),
  defaultModel: z.string().optional(),
  defaultPersona: personaEnum.optional(),
  customInstructions: z.string().max(2000).optional(),
  enableTools: z.boolean().optional(),
  enableSocial: z.boolean().optional(),
  maxSteps: z.number().int().min(1).max(20).optional(),
  preferredToolSet: toolSetEnum.optional(),
  apiKeys: z.record(providerEnum, z.string()).optional(),
});

/**
 * Custom persona creation schema
 */
export const customPersonaSchema = z.object({
  id: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/, 'Must be lowercase alphanumeric with hyphens'),
  name: z.string().min(2).max(50),
  emoji: z.string().max(4).optional().default('🤖'),
  description: z.string().max(200).optional(),
  systemPrompt: z.string().min(20).max(5000),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  traits: z.array(z.string().max(20)).max(5).optional().default([]),
});
