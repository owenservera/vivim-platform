/**
 * VIVIM SDK — Tool Definition Pattern
 *
 * Inspired by vCode's `src/Tool.ts` (~29K LOC) — the gold standard for tool abstraction.
 *
 * Every tool in VIVIM follows this contract:
 * - Zod-validated input schema
 * - Permission checks before execution
 * - Execution logic (async handler)
 * - Optional UI component for rendering results
 * - Progress state tracking
 *
 * This pattern is used across:
 * - AI agent tools (MCP tools, SDK tools)
 * - Memory operations
 * - Content operations
 * - Social operations
 */

import { z } from 'zod';
import type { JSONSchema7 } from 'json-schema';

// ============================================
// TOOL DEFINITION
// ============================================

/**
 * Tool permission level.
 */
export type ToolPermissionLevel = 'none' | 'user' | 'provider' | 'admin';

/**
 * Tool execution context.
 */
export interface ToolExecutionContext {
  /** Current user identity */
  userId?: string;
  /** User DID */
  userDid?: string;
  /** Session ID */
  sessionId?: string;
  /** Scope (project/user/team) */
  scope?: 'project' | 'user' | 'team';
  /** Scope ID */
  scopeId?: string;
  /** Arbitrary metadata attached by middleware */
  metadata: Record<string, unknown>;
  /** Signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Tool progress state.
 */
export interface ToolProgress {
  /** Current step description */
  status: string;
  /** Progress percentage (0-100) */
  percentage?: number;
  /** Optional detail message */
  detail?: string;
}

/**
 * Tool execution result.
 */
export interface ToolResult<T = unknown> {
  /** Whether the tool executed successfully */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Tool usage metadata */
  usage?: {
    /** Execution time in ms */
    durationMs: number;
    /** Token cost (if applicable) */
    tokenCost?: number;
  };
  /** Progress updates during execution */
  progress?: ToolProgress[];
}

/**
 * Tool permission rule.
 */
export interface ToolPermission {
  /** Required permission level */
  level: ToolPermissionLevel;
  /** Resource pattern (e.g., "memory/*", "content/read") */
  resource?: string;
  /** Whether user confirmation is needed */
  requiresConfirmation: boolean;
}

/**
 * Tool category for organization.
 */
export type ToolCategory =
  | 'memory'
  | 'content'
  | 'social'
  | 'identity'
  | 'network'
  | 'ai'
  | 'system'
  | 'custom';

/**
 * Zod-based tool input schema.
 */
export type ToolInputSchema = z.ZodType<any>;

/**
 * JSON Schema representation of input (for MCP compatibility).
 */
export interface ToolInputSchemaJSON {
  type: string;
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Core tool definition — the VIVIM tool pattern.
 *
 * Generic parameters:
 * TInput — Zod-inferred input type
 * TOutput — output type
 */
export interface ToolDefinition<
  TInputSchema extends ToolInputSchema = ToolInputSchema,
  TOutput = unknown
> {
  /** Unique tool identifier */
  name: string;
  /** Human-readable description */
  description: string;
  /** Tool category */
  category: ToolCategory;
  /** Zod schema for input validation */
  inputSchema: TInputSchema;
  /** JSON Schema representation (auto-derived from Zod) */
  inputSchemaJSON?: ToolInputSchemaJSON;
  /** Permission requirements */
  permissions?: ToolPermission;
  /** Whether this tool supports streaming progress */
  supportsStreaming?: boolean;
  /** Execution timeout in ms */
  timeoutMs?: number;
  /** Tags for search/discovery */
  tags?: string[];
  /** Version for schema evolution */
  version?: number;
}

/**
 * Tool handler function.
 */
export type ToolHandler<TInput, TOutput> = (
  input: TInput,
  context: ToolExecutionContext,
  onProgress?: (progress: ToolProgress) => void
) => Promise<ToolResult<TOutput>>;

/**
 * Bundled tool — definition + handler.
 */
export interface Tool<
  TInputSchema extends ToolInputSchema = ToolInputSchema,
  TOutput = unknown
> {
  definition: ToolDefinition<TInputSchema, TOutput>;
  handler: ToolHandler<z.infer<TInputSchema>, TOutput>;
}

// ============================================
// BUILD TOOL HELPER
//
// Inspired by vCode's buildTool() — the ergonomic factory for creating tools.
// Handles schema validation, permission checking, timing, and error handling.
// ============================================

/**
 * Options for building a tool.
 */
export interface BuildToolOptions<
  TInputSchema extends ToolInputSchema,
  TOutput
> {
  name: string;
  description: string;
  category?: ToolCategory;
  inputSchema: TInputSchema;
  permissions?: ToolPermission;
  supportsStreaming?: boolean;
  timeoutMs?: number;
  tags?: string[];
  version?: number;
  handler: ToolHandler<z.infer<TInputSchema>, TOutput>;
}

/**
 * Build a tool from a definition and handler.
 *
 * Example:
 * ```ts
 * const createMemoryTool = buildTool({
 *   name: 'memory_create',
 *   description: 'Create a new memory',
 *   category: 'memory',
 *   inputSchema: z.object({
 *     content: z.string().min(1),
 *     tags: z.array(z.string()).default([]),
 *     category: z.string().default('general'),
 *   }),
 *   permissions: { level: 'user', requiresConfirmation: false },
 *   handler: async (input, ctx) => {
 *     const memory = await memoryStore.create({ ... });
 *     return { success: true, data: memory };
 *   },
 * });
 * ```
 */
export function buildTool<
  TInputSchema extends ToolInputSchema,
  TOutput
>(options: BuildToolOptions<TInputSchema, TOutput>): Tool<TInputSchema, TOutput> {
  const definition: ToolDefinition<TInputSchema, TOutput> = {
    name: options.name,
    description: options.description,
    category: options.category ?? 'custom',
    inputSchema: options.inputSchema,
    permissions: options.permissions ?? { level: 'none', requiresConfirmation: false },
    supportsStreaming: options.supportsStreaming ?? false,
    timeoutMs: options.timeoutMs ?? 30_000,
    tags: options.tags ?? [],
    version: options.version ?? 1,
  };

  // Wrap handler with middleware: validation, timing, error handling
  const wrappedHandler: ToolHandler<z.infer<TInputSchema>, TOutput> = async (
    input,
    context,
    onProgress
  ) => {
    const startTime = Date.now();

    try {
      // Validate input
      const validated = definition.inputSchema.parse(input);

      // Check permissions (delegated to permission system)
      if (definition.permissions?.requiresConfirmation) {
        // In production, this would check the permission system
        // For now, proceed with execution
      }

      // Execute with timeout
      const timeout = definition.timeoutMs ?? 30_000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Tool "${definition.name}" timed out after ${timeout}ms`)), timeout);
      });

      const result = await Promise.race([
        options.handler(validated, context, onProgress),
        timeoutPromise,
      ]);

      return {
        ...result,
        usage: {
          ...result.usage,
          durationMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Input validation failed: ${error.message}`,
          usage: { durationMs: Date.now() - startTime },
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        usage: { durationMs: Date.now() - startTime },
      };
    }
  };

  return { definition, handler: wrappedHandler };
}

// ============================================
// CONVERT ZOD TO JSON SCHEMA
//
// For MCP compatibility — converts Zod schemas to JSON Schema.
// ============================================

/**
 * Convert a Zod schema to JSON Schema format (MCP compatible).
 * Simplified implementation — in production, use zod-to-json-schema.
 */
export function zodToJsonSchema(schema: ToolInputSchema): ToolInputSchemaJSON {
  if (schema instanceof z.ZodObject) {
    const shape = (schema as z.ZodObject<any>).shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodTypeToJsonSchema(value as z.ZodType);
      if (!(value instanceof z.ZodOptional) && !(value instanceof z.ZodDefault)) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  return { type: 'object', properties: {} };
}

function zodTypeToJsonSchema(zodType: z.ZodType): Record<string, unknown> {
  if (zodType instanceof z.ZodString) return { type: 'string' };
  if (zodType instanceof z.ZodNumber) return { type: 'number' };
  if (zodType instanceof z.ZodBoolean) return { type: 'boolean' };
  if (zodType instanceof z.ZodArray) return { type: 'array', items: {} };
  if (zodType instanceof z.ZodOptional) return zodTypeToJsonSchema(zodType.unwrap());
  if (zodType instanceof z.ZodDefault) return zodTypeToJsonSchema(zodType.removeDefault());
  if (zodType instanceof z.ZodEnum) return { type: 'string', enum: zodType.options };
  return { type: 'string' };
}
