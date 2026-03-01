/**
 * VIVIM Chat Protocol Types
 * 
 * Formalized communication protocol types based on assistant-ui patterns.
 * Provides standardized message types, content blocks, and tooling for AI chat.
 * 
 * @see https://github.com/owenservera/assistant-ui-VIVIM
 * @see https://github.com/owenservera/tool-ui-VIVIM
 */

import { z } from 'zod';

/**
 * Protocol version
 */
export const PROTOCOL_VERSION = '1.0.0';

/**
 * VIVIM Message Types
 * Formalized nomenclature for all message types in the VIVIM protocol
 */
export type VivimMessageType = 
  | 'vivim.user.message'
  | 'vivim.assistant.message'
  | 'vivim.system.message'
  | 'vivim.tool.call'
  | 'vivim.tool.result'
  | 'vivim.tool.approval_request'
  | 'vivim.tool.approval_granted'
  | 'vivim.tool.approval_denied'
  | 'vivim.context.update'
  | 'vivim.stream.chunk'
  | 'vivim.stream.start'
  | 'vivim.stream.complete'
  | 'vivim.stream.error'
  | 'vivim.attachment'
  | 'vivim.feedback'
  | 'vivim.quota';

/**
 * Message role types (compatible with assistant-ui)
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Message priority levels
 */
export type MessagePriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

/**
 * Message direction
 */
export type MessageDirection = 'inbound' | 'outbound' | 'internal';

/**
 * Tool call approval status
 */
export type ToolApprovalStatus = 'pending' | 'approved' | 'denied' | 'modified';

/**
 * Content Block Types
 * Based on assistant-ui content block pattern
 */
export type ContentBlockType = 
  | 'text'
  | 'image'
  | 'tool_call'
  | 'tool_result'
  | 'thinking'
  | 'code'
  | 'resource'
  | 'resource_link';

/**
 * Base content block interface
 */
export interface BaseContentBlock {
  type: ContentBlockType;
}

/**
 * Text content block
 */
export interface TextContentBlock extends BaseContentBlock {
  type: 'text';
  text: string;
  annotations?: TextAnnotation[];
}

/**
 * Text annotation for highlighting, links, etc.
 */
export interface TextAnnotation {
  type: 'url' | 'citation' | 'mention' | 'code' | 'bold' | 'italic';
  start: number;
  end: number;
  data?: Record<string, unknown>;
}

/**
 * Image content block
 */
export interface ImageContentBlock extends BaseContentBlock {
  type: 'image';
  source: {
    type: 'base64' | 'url' | 'tensor';
    media_type: string;
    data?: string;
  };
  alt?: string;
}

/**
 * Tool call content block
 */
export interface ToolCallContentBlock extends BaseContentBlock {
  type: 'tool_call';
  id: string;
  name: string;
  input: Record<string, unknown>;
  approved?: ToolApprovalStatus;
  approved_by?: string;
  approved_at?: number;
  modified_input?: Record<string, unknown>;
}

/**
 * Tool result content block
 */
export interface ToolResultContentBlock extends BaseContentBlock {
  type: 'tool_result';
  tool_call_id: string;
  result: unknown;
  is_error?: boolean;
}

/**
 * Thinking content block (for reasoning models)
 */
export interface ThinkingContentBlock extends BaseContentBlock {
  type: 'thinking';
  thinking: string;
}

/**
 * Code content block
 */
export interface CodeContentBlock extends BaseContentBlock {
  type: 'code';
  code: string;
  language?: string;
  filename?: string;
}

/**
 * Resource content block
 */
export interface ResourceContentBlock extends BaseContentBlock {
  type: 'resource';
  resource: {
    type: 'file' | 'database' | 'api';
    id: string;
    name: string;
    description?: string;
  };
}

/**
 * Resource link content block
 */
export interface ResourceLinkContentBlock extends BaseContentBlock {
  type: 'resource_link';
  resource_id: string;
  url: string;
  title?: string;
}

/**
 * Union of all content block types
 */
export type ContentBlock = 
  | TextContentBlock 
  | ImageContentBlock 
  | ToolCallContentBlock 
  | ToolResultContentBlock 
  | ThinkingContentBlock 
  | CodeContentBlock
  | ResourceContentBlock
  | ResourceLinkContentBlock;

/**
 * VIVIM Message
 * Core message interface compatible with assistant-ui
 */
export interface VivimMessage {
  id: string;
  type: VivimMessageType;
  role: MessageRole;
  content: ContentBlock[];
  thread_id?: string;
  parent_id?: string;
  tool_calls?: ToolCallContentBlock[];
  tool_call_id?: string;
  metadata?: MessageMetadata;
  created_at: number;
  updated_at?: number;
}

/**
 * Message metadata
 */
export interface MessageMetadata {
  user_id?: string;
  model?: string;
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
  provider_data?: Record<string, unknown>;
}

/**
 * Message envelope header
 */
export interface MessageEnvelopeHeader {
  id: string;
  type: VivimMessageType;
  version: string;
  timestamp: number;
  priority: MessagePriority;
  direction: MessageDirection;
  source_node: string;
  target_node?: string;
  correlation_id?: string;
  reply_to?: string;
  ttl?: number;
  flags: MessageFlags;
}

/**
 * Message flags
 */
export interface MessageFlags {
  encrypted: boolean;
  signed: boolean;
  verified: boolean;
  compressed: boolean;
  idempotent: boolean;
  stream: boolean;
  requires_approval?: boolean;
}

/**
 * Message envelope
 */
export interface MessageEnvelope<T = unknown> {
  header: MessageEnvelopeHeader;
  payload: T;
  signature?: string;
}

// ============== Validation Schemas ==============

/**
 * Text content block schema
 */
export const TextContentBlockSchema: z.ZodSchema<TextContentBlock> = z.object({
  type: z.literal('text'),
  text: z.string(),
  annotations: z.array(z.object({
    type: z.enum(['url', 'citation', 'mention', 'code', 'bold', 'italic']),
    start: z.number(),
    end: z.number(),
    data: z.record(z.unknown()).optional(),
  })).optional(),
}) as unknown as z.ZodSchema<TextContentBlock>;

/**
 * Image content block schema
 */
export const ImageContentBlockSchema: z.ZodSchema<ImageContentBlock> = z.object({
  type: z.literal('image'),
  source: z.object({
    type: z.enum(['base64', 'url', 'tensor']),
    media_type: z.string(),
    data: z.string().optional(),
  }),
  alt: z.string().optional(),
}) as unknown as z.ZodSchema<ImageContentBlock>;

/**
 * Tool call content block schema
 */
export const ToolCallContentBlockSchema: z.ZodSchema<ToolCallContentBlock> = z.object({
  type: z.literal('tool_call'),
  id: z.string(),
  name: z.string(),
  input: z.record(z.unknown()),
  approved: z.enum(['pending', 'approved', 'denied', 'modified']).optional(),
  approved_by: z.string().optional(),
  approved_at: z.number().optional(),
  modified_input: z.record(z.unknown()).optional(),
}) as unknown as z.ZodSchema<ToolCallContentBlock>;

/**
 * Tool result content block schema
 */
export const ToolResultContentBlockSchema: z.ZodSchema<ToolResultContentBlock> = z.object({
  type: z.literal('tool_result'),
  tool_call_id: z.string(),
  result: z.unknown(),
  is_error: z.boolean().optional(),
}) as unknown as z.ZodSchema<ToolResultContentBlock>;

/**
 * Thinking content block schema
 */
export const ThinkingContentBlockSchema: z.ZodSchema<ThinkingContentBlock> = z.object({
  type: z.literal('thinking'),
  thinking: z.string(),
}) as unknown as z.ZodSchema<ThinkingContentBlock>;

/**
 * Code content block schema
 */
export const CodeContentBlockSchema: z.ZodSchema<CodeContentBlock> = z.object({
  type: z.literal('code'),
  code: z.string(),
  language: z.string().optional(),
  filename: z.string().optional(),
}) as unknown as z.ZodSchema<CodeContentBlock>;

/**
 * Content block union schema
 */
export const ContentBlockSchema: z.ZodSchema<ContentBlock> = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string(), annotations: z.array(z.object({
    type: z.enum(['url', 'citation', 'mention', 'code', 'bold', 'italic']),
    start: z.number(),
    end: z.number(),
    data: z.record(z.unknown()).optional(),
  })).optional() }),
  z.object({ type: z.literal('image'), source: z.object({
    type: z.enum(['base64', 'url', 'tensor']),
    media_type: z.string(),
    data: z.string().optional(),
  }), alt: z.string().optional() }),
  z.object({ type: z.literal('tool_call'), id: z.string(), name: z.string(), input: z.record(z.unknown()), approved: z.enum(['pending', 'approved', 'denied', 'modified']).optional(), approved_by: z.string().optional(), approved_at: z.number().optional(), modified_input: z.record(z.unknown()).optional() }),
  z.object({ type: z.literal('tool_result'), tool_call_id: z.string(), result: z.unknown(), is_error: z.boolean().optional() }),
  z.object({ type: z.literal('thinking'), thinking: z.string() }),
  z.object({ type: z.literal('code'), code: z.string(), language: z.string().optional(), filename: z.string().optional() }),
  z.object({ type: z.literal('resource'), resource: z.object({
    type: z.enum(['file', 'database', 'api']),
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
  }) }),
  z.object({ type: z.literal('resource_link'), resource_id: z.string(), url: z.string(), title: z.string().optional() }),
]) as unknown as z.ZodSchema<ContentBlock>;

/**
 * Message metadata schema
 */
export const MessageMetadataSchema: z.ZodSchema<MessageMetadata> = z.object({
  user_id: z.string().optional(),
  model: z.string().optional(),
  tokens: z.object({
    prompt: z.number().optional(),
    completion: z.number().optional(),
    total: z.number().optional(),
  }).optional(),
  finish_reason: z.enum(['stop', 'length', 'tool_calls', 'content_filter', 'error']).optional(),
  provider_data: z.record(z.unknown()).optional(),
});

/**
 * VIVIM message schema
 */
export const VivimMessageSchema: z.ZodSchema<VivimMessage> = z.object({
  id: z.string(),
  type: z.string(),
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.array(ContentBlockSchema),
  thread_id: z.string().optional(),
  parent_id: z.string().optional(),
  tool_calls: z.array(ToolCallContentBlockSchema).optional(),
  tool_call_id: z.string().optional(),
  metadata: MessageMetadataSchema.optional(),
  created_at: z.number(),
  updated_at: z.number().optional(),
}) as unknown as z.ZodSchema<VivimMessage>;

// ============== Utility Functions ==============

/**
 * Create a text content block
 */
export function createTextBlock(text: string, annotations?: TextAnnotation[]): TextContentBlock {
  return { type: 'text', text, annotations };
}

/**
 * Create a tool call content block
 */
export function createToolCallBlock(
  id: string, 
  name: string, 
  input: Record<string, unknown>
): ToolCallContentBlock {
  return { type: 'tool_call', id, name, input };
}

/**
 * Create a tool result content block
 */
export function createToolResultBlock(
  toolCallId: string, 
  result: unknown, 
  isError?: boolean
): ToolResultContentBlock {
  return { type: 'tool_result', tool_call_id: toolCallId, result, is_error: isError };
}

/**
 * Create a code content block
 */
export function createCodeBlock(code: string, language?: string, filename?: string): CodeContentBlock {
  return { type: 'code', code, language, filename };
}

/**
 * Create a thinking content block
 */
export function createThinkingBlock(thinking: string): ThinkingContentBlock {
  return { type: 'thinking', thinking };
}

/**
 * Extract text content from message
 */
export function extractTextContent(message: VivimMessage): string {
  return message.content
    .filter((block): block is TextContentBlock => block.type === 'text')
    .map(block => block.text)
    .join('');
}

/**
 * Extract tool calls from message
 */
export function extractToolCalls(message: VivimMessage): ToolCallContentBlock[] {
  return message.tool_calls || message.content.filter(
    (block): block is ToolCallContentBlock => block.type === 'tool_call'
  );
}

/**
 * Check if message requires approval
 */
export function requiresApproval(message: VivimMessage): boolean {
  const toolCalls = extractToolCalls(message);
  return toolCalls.some(call => call.approved === 'pending');
}

/**
 * Create a VIVIM message
 */
export function createMessage(
  role: MessageRole,
  content: ContentBlock[],
  options: Partial<VivimMessage> = {}
): VivimMessage {
  const id = options.id || generateMessageId();
  const now = Date.now();
  
  return {
    id,
    type: roleToMessageType(role),
    role,
    content,
    thread_id: options.thread_id,
    parent_id: options.parent_id,
    tool_calls: options.tool_calls,
    tool_call_id: options.tool_call_id,
    metadata: options.metadata,
    created_at: options.created_at || now,
    updated_at: options.updated_at,
  };
}

/**
 * Convert role to message type
 */
function roleToMessageType(role: MessageRole): VivimMessageType {
  switch (role) {
    case 'user': return 'vivim.user.message';
    case 'assistant': return 'vivim.assistant.message';
    case 'system': return 'vivim.system.message';
    case 'tool': return 'vivim.tool.result';
    default: return 'vivim.user.message';
  }
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Serialize message to JSON
 */
export function serializeMessage(message: VivimMessage): string {
  return JSON.stringify(message);
}

/**
 * Deserialize message from JSON
 */
export function deserializeMessage(json: string): VivimMessage {
  return JSON.parse(json) as VivimMessage;
}

/**
 * Validate message
 */
export function validateMessage(message: unknown): { valid: boolean; errors: string[] } {
  const result = VivimMessageSchema.safeParse(message);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}
