/**
 * TypeScript types for OpenScroll database schema
 * Auto-generated from Prisma schema
 * 
 * These types represent the structure of conversations and messages
 * as stored in the database and used throughout the application.
 */

// ============================================================================
// CONTENT PART TYPES
// ============================================================================

export type ContentPartType = 
  | 'text'
  | 'code'
  | 'image'
  | 'latex'
  | 'table'
  | 'mermaid'
  | 'tool_call'
  | 'tool_result';

export interface BaseContentPart {
  type: ContentPartType;
  metadata?: Record<string, any>;
}

export interface TextPart extends BaseContentPart {
  type: 'text';
  content: string;
  metadata?: {
    format?: 'markdown' | 'plain';
    [key: string]: any;
  };
}

export interface CodePart extends BaseContentPart {
  type: 'code';
  content: string;
  metadata?: {
    language?: string;
    filename?: string;
    highlighted?: boolean;
    [key: string]: any;
  };
}

export interface ImagePart extends BaseContentPart {
  type: 'image';
  content: string; // URL or base64
  metadata?: {
    alt?: string;
    width?: number;
    height?: number;
    mimeType?: string;
    source?: 'generated' | 'uploaded' | 'url';
    [key: string]: any;
  };
}

export interface LatexPart extends BaseContentPart {
  type: 'latex';
  content: string;
  metadata?: {
    display?: 'block' | 'inline';
    [key: string]: any;
  };
}

export interface TablePart extends BaseContentPart {
  type: 'table';
  content: {
    headers: string[];
    rows: string[][];
  };
  metadata?: {
    format?: 'markdown' | 'html';
    [key: string]: any;
  };
}

export interface MermaidPart extends BaseContentPart {
  type: 'mermaid';
  content: string;
  metadata?: {
    diagramType?: 'flowchart' | 'sequence' | 'gantt' | 'class' | 'state' | 'er' | 'pie';
    [key: string]: any;
  };
}

export interface ToolCallPart extends BaseContentPart {
  type: 'tool_call';
  content: {
    id: string;
    name: string;
    arguments: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface ToolResultPart extends BaseContentPart {
  type: 'tool_result';
  content: {
    tool_call_id: string;
    result: any;
  };
  metadata?: {
    success?: boolean;
    error?: string;
    [key: string]: any;
  };
}

export type ContentPart =
  | TextPart
  | CodePart
  | ImagePart
  | LatexPart
  | TablePart
  | MermaidPart
  | ToolCallPart
  | ToolResultPart;

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';
export type MessageStatus = 'completed' | 'error' | 'cancelled';
export type FinishReason = 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  author?: string | null;
  parts: ContentPart[];
  createdAt: Date;
  messageIndex: number;
  status: MessageStatus;
  finishReason?: FinishReason | null;
  tokenCount?: number | null;
  metadata: Record<string, any>;
}

export interface MessageCreateInput {
  conversationId: string;
  role: MessageRole;
  author?: string;
  parts: ContentPart[];
  createdAt: Date;
  messageIndex: number;
  status?: MessageStatus;
  finishReason?: FinishReason;
  tokenCount?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

export type Provider = 'gemini' | 'chatgpt' | 'claude' | 'other';

export interface Conversation {
  id: string;
  provider: Provider | string;
  sourceUrl: string;
  title: string;
  model?: string | null;
  createdAt: Date;
  updatedAt: Date;
  capturedAt: Date;
  
  // Statistics
  messageCount: number;
  userMessageCount: number;
  aiMessageCount: number;
  totalWords: number;
  totalCharacters: number;
  totalTokens?: number | null;
  
  // Rich content counts
  totalCodeBlocks: number;
  totalImages: number;
  totalTables: number;
  totalLatexBlocks: number;
  totalMermaidDiagrams: number;
  totalToolCalls: number;
  
  metadata: Record<string, any>;
  
  // Relations (when included)
  messages?: Message[];
}

export interface ConversationCreateInput {
  provider: Provider | string;
  sourceUrl: string;
  title: string;
  model?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// ============================================================================
// CAPTURE ATTEMPT TYPES
// ============================================================================

export type CaptureStatus = 'success' | 'failed' | 'timeout' | 'invalid_url';

export interface CaptureAttempt {
  id: string;
  sourceUrl: string;
  provider?: string | null;
  status: CaptureStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
  errorStack?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
  duration?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  conversationId?: string | null;
  retryCount: number;
  retryOf?: string | null;
  createdAt: Date;
}

export interface CaptureAttemptCreateInput {
  sourceUrl: string;
  provider?: string;
  status: CaptureStatus;
  errorCode?: string;
  errorMessage?: string;
  errorStack?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
  conversationId?: string;
  retryCount?: number;
  retryOf?: string;
}

// ============================================================================
// PROVIDER STATS TYPES
// ============================================================================

export interface ProviderStats {
  id: string;
  provider: string;
  totalCaptures: number;
  successfulCaptures: number;
  failedCaptures: number;
  avgDuration?: number | null;
  avgMessageCount?: number | null;
  avgTokenCount?: number | null;
  totalMessages: number;
  totalCodeBlocks: number;
  totalImages: number;
  totalToolCalls: number;
  lastCaptureAt?: Date | null;
  updatedAt: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Statistics computed from messages
 */
export interface ConversationStats {
  messageCount: number;
  userMessageCount: number;
  aiMessageCount: number;
  totalWords: number;
  totalCharacters: number;
  totalTokens: number;
  totalCodeBlocks: number;
  totalImages: number;
  totalTables: number;
  totalLatexBlocks: number;
  totalMermaidDiagrams: number;
  totalToolCalls: number;
}

/**
 * Helper to count content parts by type
 */
export function countPartsByType(parts: ContentPart[]): Record<ContentPartType, number> {
  const counts: Record<string, number> = {};
  
  for (const part of parts) {
    counts[part.type] = (counts[part.type] || 0) + 1;
  }
  
  return counts as Record<ContentPartType, number>;
}

/**
 * Helper to compute conversation statistics from messages
 */
export function computeConversationStats(messages: Message[]): ConversationStats {
  const stats: ConversationStats = {
    messageCount: messages.length,
    userMessageCount: 0,
    aiMessageCount: 0,
    totalWords: 0,
    totalCharacters: 0,
    totalTokens: 0,
    totalCodeBlocks: 0,
    totalImages: 0,
    totalTables: 0,
    totalLatexBlocks: 0,
    totalMermaidDiagrams: 0,
    totalToolCalls: 0,
  };
  
  for (const message of messages) {
    // Count by role
    if (message.role === 'user') stats.userMessageCount++;
    if (message.role === 'assistant') stats.aiMessageCount++;
    
    // Count tokens
    if (message.tokenCount) {
      stats.totalTokens += message.tokenCount;
    }
    
    // Count content types
    for (const part of message.parts) {
      if (part.type === 'text') {
        const text = part.content as string;
        stats.totalWords += text.split(/\s+/).length;
        stats.totalCharacters += text.length;
      } else if (part.type === 'code') {
        stats.totalCodeBlocks++;
      } else if (part.type === 'image') {
        stats.totalImages++;
      } else if (part.type === 'table') {
        stats.totalTables++;
      } else if (part.type === 'latex') {
        stats.totalLatexBlocks++;
      } else if (part.type === 'mermaid') {
        stats.totalMermaidDiagrams++;
      } else if (part.type === 'tool_call') {
        stats.totalToolCalls++;
      }
    }
  }
  
  return stats;
}

/**
 * Type guard to check if a part is a specific type
 */
export function isTextPart(part: ContentPart): part is TextPart {
  return part.type === 'text';
}

export function isCodePart(part: ContentPart): part is CodePart {
  return part.type === 'code';
}

export function isImagePart(part: ContentPart): part is ImagePart {
  return part.type === 'image';
}

export function isLatexPart(part: ContentPart): part is LatexPart {
  return part.type === 'latex';
}

export function isTablePart(part: ContentPart): part is TablePart {
  return part.type === 'table';
}

export function isMermaidPart(part: ContentPart): part is MermaidPart {
  return part.type === 'mermaid';
}

export function isToolCallPart(part: ContentPart): part is ToolCallPart {
  return part.type === 'tool_call';
}

export function isToolResultPart(part: ContentPart): part is ToolResultPart {
  return part.type === 'tool_result';
}
