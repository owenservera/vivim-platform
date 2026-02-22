/**
 * Common types for extractors
 */

export interface ContentPart {
  type: 'text' | 'code' | 'image' | 'latex' | 'table' | 'mermaid' | 'tool_call' | 'tool_result';
  content: string | object;
  metadata?: Record<string, unknown>;
  language?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content?: string | ContentPart[];
  parts?: ContentPart[];
  author?: string;
  createdAt?: string | null;
  timestamp?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationStats {
  messageCount?: number;
  totalMessages?: number;
  userMessageCount?: number;
  aiMessageCount?: number;
  totalWords?: number;
  totalCharacters?: number;
  totalCodeBlocks?: number;
  totalMermaidDiagrams?: number;
  totalImages?: number;
  totalTables?: number;
  totalLatexBlocks?: number;
  totalToolCalls?: number;
  firstMessageAt?: string;
  lastMessageAt?: string;
}

export interface Conversation {
  id: string;
  provider: string;
  sourceUrl: string;
  title: string;
  model?: string;
  createdAt: string;
  updatedAt?: string;
  capturedAt?: string;
  exportedAt?: string;
  messages: Message[];
  metadata?: Record<string, unknown>;
  stats?: ConversationStats;
}
