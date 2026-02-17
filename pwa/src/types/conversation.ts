/**
 * OpenScroll Conversation Types
 * Aligned with Prisma schema and storage-v2 types
 */

// Re-export ContentBlock types from storage-v2 for consistency
export type {
  ContentBlock,
  TextBlock,
  CodeBlock,
  ImageBlock,
  MermaidBlock,
  TableBlock,
  MathBlock,
  ToolCallBlock,
  ToolResultBlock,
} from '../lib/storage-v2/types';

/**
 * Union type of all content part types matching Prisma schema
 * "text" | "code" | "image" | "latex" | "table" | "mermaid" | "tool_call" | "tool_result"
 */
export type ContentPart =
  | TextPart
  | CodePart
  | ImagePart
  | LatexPart
  | TablePart
  | MermaidPart
  | ToolCallPart
  | ToolResultPart;

/** Text content part */
export interface TextPart {
  type: 'text';
  content: string;
  metadata?: {
    format?: 'markdown' | 'plain';
  };
}

/** Code content part */
export interface CodePart {
  type: 'code';
  content: string;
  metadata?: {
    language?: string;
    filename?: string;
    highlighted?: boolean;
  };
}

/** Image content part */
export interface ImagePart {
  type: 'image';
  content: string; // URL or base64
  metadata?: {
    alt?: string;
    width?: number;
    height?: number;
    mimeType?: string;
    source?: 'generated' | 'uploaded';
  };
}

/** LaTeX content part */
export interface LatexPart {
  type: 'latex';
  content: string;
  metadata?: {
    display?: 'block' | 'inline';
  };
}

/** Table content part */
export interface TablePart {
  type: 'table';
  content: {
    headers: string[];
    rows: string[][];
  };
  metadata?: {
    format?: 'markdown' | 'html';
  };
}

/** Mermaid diagram content part */
export interface MermaidPart {
  type: 'mermaid';
  content: string;
  metadata?: {
    diagramType?: 'flowchart' | 'sequence' | 'gantt' | 'class' | 'state' | 'er';
  };
}

/** Tool call content part */
export interface ToolCallPart {
  type: 'tool_call';
  content: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

/** Tool result content part */
export interface ToolResultPart {
  type: 'tool_result';
  content: {
    tool_call_id: string;
    result: unknown;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Legacy ContentBlock interface for backward compatibility
 * @deprecated Use ContentPart or ContentBlock from storage-v2
 */
export interface LegacyContentBlock {
  type: 'text' | 'code' | 'image' | 'table' | 'quote' | 'math' | 'divider' | 'html' | 'mermaid';
  content: string | Record<string, unknown>;
  language?: string;
  alt?: string;
  caption?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | ContentBlock[] | ContentPart[];
  timestamp?: string;
  wordCount?: number;
  characterCount?: number;
  attachments?: Attachment[];
  metadata?: MessageMetadata;
  parts?: ContentPart[]; // Prisma-style parts array
}

export interface MessageMetadata {
  model?: string;
  tokens?: number;
  finishReason?: string;
  status?: 'completed' | 'error' | 'cancelled';
  [key: string]: unknown;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'spreadsheet' | 'presentation' | 'other';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
  description?: string;
}

export interface ConversationStats {
  totalMessages: number;
  totalWords: number;
  totalCharacters: number;
  totalCodeBlocks?: number;
  totalMermaidDiagrams?: number;
  totalImages?: number;
  totalTables?: number;
  totalLatexBlocks?: number;
  totalToolCalls?: number;
  firstMessageAt: string;
  lastMessageAt: string;
  durationMs?: number;
}

export interface ConversationMetadata {
  model?: string;
  language?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface Conversation {
  id: string;
  provider: 'chatgpt' | 'claude' | 'gemini' | 'grok' | 'qwen' | 'deepseek' | 'perplexity' | 'zai' | 'kimi' | 'other';
  sourceUrl: string;
  title: string;
  state?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  version?: number;
  ownerId?: string;
  contentHash?: string;
  createdAt: string;
  updatedAt: string;
  capturedAt: string;
  exportedAt?: string; // Deprecated, use capturedAt
  metadata?: ConversationMetadata;
  tags?: string[];
  messages: Message[];
  stats: ConversationStats;
}

export interface CaptureResponse {
  status: 'success' | 'error';
  data?: Conversation;
  message?: string;
}

export interface VivimArtifact {
  '@context': string;
  signature: string;
  author: string;
  content: Conversation;
}
