/**
 * BYOK (Bring Your Own Key) Types
 * 
 * Defines the data structures for managing API keys and BYOK chat functionality
 */

// ============================================================================
// Provider Types
// ============================================================================

export type BYOKProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'google' 
  | 'xai' 
  | 'mistral';

export interface ProviderModel {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPer1k: number;  // USD per 1K tokens
  outputCostPer1k: number; // USD per 1K tokens
}

export interface ProviderConfig {
  id: BYOKProvider;
  name: string;
  displayName: string;
  models: ProviderModel[];
  baseUrl: string;
  docsUrl: string;
  keyFormat: {
    pattern: RegExp;
    placeholder: string;
    example: string;
  };
  features: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
  };
  color: string;
  logo: string;
}

// ============================================================================
// API Key Types
// ============================================================================

export interface StoredKey {
  provider: BYOKProvider;
  encryptedKey: string;      // AES-256-GCM encrypted
  keyPrefix: string;         // First 4 chars for display
  createdAt: Date;
  lastUsed: Date | null;
  isValid: boolean;
  validationError?: string;
}

export interface KeyValidationResult {
  valid: boolean;
  provider: BYOKProvider;
  error?: string;
  models?: string[];
}

// ============================================================================
// Chat Types
// ============================================================================

export interface BYOKMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: MessagePart[];
  createdAt: Date;
}

export interface MessagePart {
  type: 'text' | 'code' | 'image' | 'tool_call';
  content: string;
  language?: string;      // For code
  mimeType?: string;      // For image
}

export interface BYOKConversation {
  id: string;
  provider: BYOKProvider;
  model: string;
  title: string;
  messages: BYOKMessage[];
  createdAt: Date;
  updatedAt: Date;
  settings: ChatSettings;
}

export interface ChatSettings {
  temperature: number;
  maxTokens: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface StreamingChunk {
  id: string;
  type: 'content' | 'done' | 'error';
  content?: string;
  delta?: string;
  done?: boolean;
  error?: string;
}

export interface UsageStats {
  provider: BYOKProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: Date;
}

export interface ProviderUsage {
  provider: BYOKProvider;
  totalTokens: number;
  totalCost: number;
  dailyUsage: Map<string, number>;  // date -> cost
  monthlyLimit?: number;
  currentMonthCost: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamEvent {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }[];
}

// ============================================================================
// Error Types
// ============================================================================

export class BYOKError extends Error {
  code: string;
  provider?: BYOKProvider;
  
  constructor(message: string, code: string, provider?: BYOKProvider) {
    super(message);
    this.name = 'BYOKError';
    this.code = code;
    this.provider = provider;
  }
}

export const BYOK_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMITED: 'RATE_LIMITED',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  INSUFFICIENT_QUOTA: 'INSUFFICIENT_QUOTA',
  STREAM_ABORTED: 'STREAM_ABORTED',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  KEY_NOT_FOUND: 'KEY_NOT_FOUND',
} as const;
