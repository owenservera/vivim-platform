/**
 * Unified AI Chat Types
 * Comprehensive type definitions for AI chat, streaming, and connection management
 * VIVIM Integration - Foundation Layer
 */

// Re-export shared types from ai.ts
export type {
  AIProviderType,
  AIMessageRole,
  AIMessage,
  AICompletionOptions,
  AICompletionRequest,
  AIUsage,
  AICompletionResponse,
} from './ai';

// Import for use in this file
import type {
  AIMessageRole,
  AIMessage,
  AIProviderType,
  AICompletionOptions,
  AIUsage,
} from './ai';

/**
 * Optional message metadata
 */
export interface AIMessageMetadata {
  model?: string;
  provider?: string;
  tokens?: number;
  finishReason?: string;
}

/**
 * AI Conversation Interface
 */
export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: AIConversationMetadata;
}

/**
 * Conversation metadata
 */
export interface AIConversationMetadata {
  provider?: string;
  model?: string;
  totalTokens?: number;
  isPinned?: boolean;
  isArchived?: boolean;
  tags?: string[];
}

/**
 * Stream State Types
 */
export type StreamState =
  | { status: 'idle' }
  | { status: 'starting' }
  | { status: 'streaming'; chunkCount: number }
  | { status: 'completing' }
  | { status: 'done'; totalChunks: number }
  | { status: 'error'; error: string; retryCount: number }
  | { status: 'aborted' }
  | { status: 'reconnecting'; attempt: number; maxAttempts: number };

/**
 * Connection State Types
 */
export type ConnectionState =
  | { status: 'disconnected'; reason?: 'user' | 'network' | 'timeout' }
  | { status: 'connecting'; attempt: number }
  | { status: 'connected'; latency: number; lastPing?: Date }
  | { status: 'reconnecting'; attempt: number; maxAttempts: number; willRetry: boolean }
  | { status: 'failed'; error: string; canRetry: boolean }
  | { status: 'heartbeat-missed'; missedCount: number }
  | { status: 'degraded'; latency: number; warning: string };

/**
 * Connection Quality Levels
 */
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

/**
 * Connection Configuration
 */
export interface ConnectionConfig {
  // Retry settings
  maxRetries: number;
  baseRetryDelay: number; // ms
  maxRetryDelay: number; // ms
  backoffMultiplier: number;

  // Heartbeat settings
  heartbeatInterval: number; // ms
  heartbeatTimeout: number; // ms
  missedHeartbeatsThreshold: number;

  // Reconnection window
  reconnectWindow: number; // ms
  reconnectableStates: ConnectionState['status'][];

  // Timeouts
  connectionTimeout: number; // ms
  streamTimeout: number; // ms

  // Quality thresholds
  excellentLatency: number; // ms
  goodLatency: number; // ms
  fairLatency: number; // ms
}

/**
 * Default connection configuration
 */
export const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  maxRetries: 5,
  baseRetryDelay: 1000,
  maxRetryDelay: 30000,
  backoffMultiplier: 2,

  heartbeatInterval: 15000,
  heartbeatTimeout: 5000,
  missedHeartbeatsThreshold: 3,

  reconnectWindow: 60000,
  reconnectableStates: ['disconnected', 'reconnecting', 'failed'],

  connectionTimeout: 10000,
  streamTimeout: 60000,

  excellentLatency: 50,
  goodLatency: 150,
  fairLatency: 300,
};

/**
 * Stream Chunk Interface
 */
export interface StreamChunk {
  id: string;
  content: string;
  done: boolean;
  timestamp: Date;
  metadata?: StreamChunkMetadata;
}

/**
 * Stream chunk metadata
 */
export interface StreamChunkMetadata {
  model?: string;
  provider?: string;
  tokens?: number;
}

/**
 * Stream Events
 */
export type StreamEvent =
  | { type: 'chunk'; chunk: StreamChunk }
  | { type: 'start'; timestamp: Date }
  | { type: 'done'; timestamp: Date; totalChunks: number }
  | { type: 'error'; error: string; recoverable: boolean }
  | { type: 'retry'; attempt: number; delay: number }
  | { type: 'abort'; reason: string }
  | { type: 'heartbeat'; timestamp: Date }
  | { type: 'reconnecting'; attempt: number; maxAttempts: number }
  | { type: 'reconnected'; timestamp: Date; attempt: number };

/**
 * AI Completion Request (chat-specific extension)
 */
export interface AIChatCompletionRequest {
  messages: Array<{ role: AIMessageRole; content: string }>;
  provider?: AIProviderType;
  model?: string;
  conversationId?: string;
  options?: AICompletionOptions;
}

/**
 * Conversation Export Format
 */
export interface AIConversationExport {
  version: string;
  exportedAt: Date;
  conversation: AIConversation;
  messages: AIMessage[];
}

/**
 * Migration utilities for legacy data
 */
export namespace AIChatMigration {
  /**
   * Migrate from legacy message format
   */
  export function migrateMessage(legacy: { role: string; content: string }): AIMessage {
    return {
      id: crypto.randomUUID(),
      role: legacy.role as AIMessageRole,
      content: legacy.content,
      createdAt: new Date(),
    };
  }

  /**
   * Migrate conversation from legacy format
   */
  export function migrateConversation(
    legacy: { title?: string; messages: Array<{ role: string; content: string }> }
  ): AIConversation {
    return {
      id: crypto.randomUUID(),
      title: legacy.title || 'Migrated Conversation',
      messages: legacy.messages.map(migrateMessage),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Batch migrate conversations
   */
  export function migrateConversations(
    legacyConversations: Array<{ title?: string; messages: Array<{ role: string; content: string }> }>
  ): AIConversation[] {
    return legacyConversations.map(migrateConversation);
  }
}

/**
 * Connection Quality Utilities
 */
export namespace ConnectionQualityUtils {
  export function getQualityFromLatency(latency: number, config: ConnectionConfig): ConnectionQuality {
    if (latency <= config.excellentLatency) return 'excellent';
    if (latency <= config.goodLatency) return 'good';
    if (latency <= config.fairLatency) return 'fair';
    if (latency <= config.fairLatency * 2) return 'poor';
    return 'critical';
  }

  export function shouldReconnect(state: ConnectionState, config: ConnectionConfig): boolean {
    if (state.status === 'failed') return state.canRetry;
    if (state.status === 'reconnecting') return state.attempt < config.maxRetries;
    return config.reconnectableStates.includes(state.status);
  }

  export function calculateRetryDelay(attempt: number, config: ConnectionConfig): number {
    const delay = config.baseRetryDelay * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxRetryDelay);
  }

  export function getQualityColor(quality: ConnectionQuality): string {
    const colors: Record<ConnectionQuality, string> = {
      excellent: '#10b981',
      good: '#3b82f6',
      fair: '#f59e0b',
      poor: '#f97316',
      critical: '#ef4444',
    };
    return colors[quality];
  }

  export function getQualityLabel(quality: ConnectionQuality): string {
    const labels: Record<ConnectionQuality, string> = {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor',
      critical: 'Critical',
    };
    return labels[quality];
  }
}
