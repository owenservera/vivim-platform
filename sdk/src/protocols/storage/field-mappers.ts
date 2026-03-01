/**
 * Field Mapping Utilities
 * 
 * Provides utilities for mapping between protocol types and database schemas.
 * Supports bidirectional mapping between TypeScript interfaces and DB records.
 */

import {
  VivimMessage,
  ContentBlock,
  ToolCallContentBlock,
  ToolResultContentBlock,
  TextContentBlock,
  MessageRole,
  createTextBlock,
  createToolCallBlock,
  createToolResultBlock,
} from '../chat/types.js';

import type {
  MessageRecord,
  ConversationRecord,
  ToolCallRecord,
  SyncStateRecord,
  SyncDeltaRecord,
  OfflineQueueRecord,
  AttachmentRecord,
  MessagePriority,
  ConversationStatus,
  ToolApprovalStatus,
  QueueStatus,
} from './database-schema.js';

// ============== Message Mappers ==============

/**
 * Map VivimMessage to MessageRecord for database storage
 */
export function messageToRecord(
  message: VivimMessage,
  conversationId: string
): Omit<MessageRecord, 'id'> {
  return {
    conversation_id: conversationId as any,
    type: message.type,
    role: message.role,
    content: JSON.stringify(message.content) as any,
    parent_id: message.parent_id as any,
    user_id: message.metadata?.user_id as any,
    model: message.metadata?.model as any,
    tokens_prompt: message.metadata?.tokens?.prompt as any,
    tokens_completion: message.metadata?.tokens?.completion as any,
    tokens_total: message.metadata?.tokens?.total as any,
    finish_reason: message.metadata?.finish_reason as any,
    provider_data: message.metadata?.provider_data as any,
    metadata: message.metadata as any,
    hidden: false,
    created_at: message.created_at,
    updated_at: message.updated_at || message.created_at,
  };
}

/**
 * Map MessageRecord from database to VivimMessage
 */
export function recordToMessage(record: MessageRecord): VivimMessage {
  const content = JSON.parse(record.content) as ContentBlock[];
  
  return {
    id: record.id,
    type: record.type as any,
    role: record.role as MessageRole,
    content,
    thread_id: record.conversation_id,
    parent_id: record.parent_id || undefined,
    metadata: {
      user_id: record.user_id || undefined,
      model: record.model || undefined,
      tokens: record.tokens_total ? {
        prompt: record.tokens_prompt || undefined,
        completion: record.tokens_completion || undefined,
        total: record.tokens_total,
      } : undefined,
      finish_reason: record.finish_reason as any,
      provider_data: record.provider_data || undefined,
    },
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

// ============== Content Block Mappers ==============

/**
 * Extract tool calls from content blocks
 */
export function contentBlocksToToolCalls(
  blocks: ContentBlock[]
): ToolCallContentBlock[] {
  return blocks.filter(
    (b): b is ToolCallContentBlock => b.type === 'tool_call'
  );
}

/**
 * Extract tool results from content blocks
 */
export function contentBlocksToToolResults(
  blocks: ContentBlock[]
): ToolResultContentBlock[] {
  return blocks.filter(
    (b): b is ToolResultContentBlock => b.type === 'tool_result'
  );
}

/**
 * Extract text from content blocks
 */
export function contentBlocksToText(blocks: ContentBlock[]): string {
  return blocks
    .filter((b): b is TextContentBlock => b.type === 'text')
    .map(b => b.text)
    .join('');
}

// ============== Tool Call Mappers ==============

/**
 * Map ToolCallContentBlock to ToolCallRecord
 */
export function toolCallToRecord(
  toolCall: ToolCallContentBlock,
  messageId: string,
  conversationId: string
): Omit<ToolCallRecord, 'id'> {
  return {
    message_id: messageId as any,
    conversation_id: conversationId as any,
    name: toolCall.name,
    input: JSON.stringify(toolCall.input) as any,
    approval_status: (toolCall.approved || 'pending') as any,
    approved_by: toolCall.approved_by as any,
    approved_at: toolCall.approved_at as any,
    modified_input: toolCall.modified_input ? JSON.stringify(toolCall.modified_input) as any : null,
    result: null,
    is_error: false,
    execution_duration_ms: null,
    created_at: Date.now(),
    completed_at: null,
  };
}

/**
 * Map ToolCallRecord to ToolCallContentBlock
 */
export function recordToToolCall(record: ToolCallRecord): ToolCallContentBlock {
  return {
    type: 'tool_call',
    id: record.id,
    name: record.name,
    input: JSON.parse(record.input),
    approved: record.approval_status as any,
    approved_by: record.approved_by || undefined,
    approved_at: record.approved_at || undefined,
    modified_input: record.modified_input ? JSON.parse(record.modified_input) : undefined,
  };
}

// ============== Conversation Mappers ==============

/**
 * Create ConversationRecord from thread info
 */
export interface ThreadInfo {
  id: string;
  title?: string;
  ownerDid: string;
  systemPrompt?: string;
  model?: string;
  status?: ConversationStatus;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export function threadToConversation(
  thread: ThreadInfo
): Omit<ConversationRecord, 'id'> {
  const now = Date.now();
  return {
    title: thread.title || null,
    owner_did: thread.ownerDid,
    system_prompt: thread.systemPrompt || null,
    model: thread.model || null,
    status: thread.status || 'active',
    metadata: thread.metadata || null,
    tags: thread.tags || [],
    archived: false,
    created_at: now,
    updated_at: now,
    last_message_at: null,
  };
}

// ============== Sync Mappers ==============

/**
 * Create SyncStateRecord
 */
export function createSyncState(
  conversationId: string,
  nodeId: string,
  isPrimary: boolean = false
): SyncStateRecord {
  const now = Date.now();
  return {
    conversation_id: conversationId as any,
    node_id: nodeId,
    is_primary: isPrimary,
    last_sync_timestamp: `${now}:0:${nodeId}`,
    merkle_root: '',
    message_count: 0,
    version: 1,
    updated_at: now,
    synced_at: null,
  };
}

/**
 * Create SyncDeltaRecord from message
 */
export function messageToDelta(
  conversationId: string,
  message: VivimMessage,
  operation: 'create' | 'update' | 'delete',
  nodeId: string,
  previousHash?: string
): Omit<SyncDeltaRecord, 'id'> {
  const now = Date.now();
  const currentHash = hashMessage(message);
  
  return {
    conversation_id: conversationId as any,
    operation: operation as any,
    entity_type: 'message',
    entity_id: message.id as any,
    previous_hash: previousHash || null,
    current_hash: currentHash,
    entity_data: JSON.stringify(message) as any,
    hlc_timestamp: `${now}:0:${nodeId}`,
    node_id: nodeId,
    applied: false,
    created_at: now,
    applied_at: null,
  };
}

// ============== Offline Queue Mappers ==============

/**
 * Add message to offline queue
 */
export function messageToQueueEntry(
  conversationId: string,
  message: VivimMessage,
  priority: MessagePriority = 'normal'
): Omit<OfflineQueueRecord, 'id'> {
  const now = Date.now();
  return {
    conversation_id: conversationId as any,
    message_data: JSON.stringify(message) as any,
    priority: priority as any,
    retry_count: 0,
    max_retries: 3,
    last_error: null,
    status: 'pending' as any,
    created_at: now,
    next_retry_at: null,
    completed_at: null,
  };
}

/**
 * Get message from queue entry
 */
export function queueEntryToMessage(entry: OfflineQueueRecord): VivimMessage {
  return JSON.parse(entry.message_data);
}

// ============== Utility Functions ==============

/**
 * Simple hash function for messages
 */
function hashMessage(message: VivimMessage): string {
  const str = JSON.stringify({
    id: message.id,
    type: message.type,
    role: message.role,
    content: message.content,
  });
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Validate conversation ID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate conversation ID
 */
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Convert timestamp to HLC format
 */
export function toHLCTimestamp(nodeId: string, logical: number = 0): string {
  return `${Date.now()}:${logical}:${nodeId}`;
}

/**
 * Parse HLC timestamp
 */
export function parseHLCTimestamp(hlc: string): {
  wallTime: number;
  logical: number;
  nodeId: string;
} {
  const [wallTime, logical, nodeId] = hlc.split(':');
  return {
    wallTime: parseInt(wallTime, 10),
    logical: parseInt(logical, 10),
    nodeId,
  };
}

// ============== Batch Operations ==============

/**
 * Batch convert messages to records
 */
export function messagesToRecords(
  messages: VivimMessage[],
  conversationId: string
): Array<Omit<MessageRecord, 'id'>> {
  return messages.map(msg => messageToRecord(msg, conversationId));
}

/**
 * Batch convert records to messages
 */
export function recordsToMessages(records: MessageRecord[]): VivimMessage[] {
  return records.map(recordToMessage);
}

/**
 * Extract all tool calls from messages
 */
export function extractAllToolCalls(
  messages: VivimMessage[]
): Array<{ toolCall: ToolCallContentBlock; messageId: string; conversationId: string }> {
  const results: Array<{ toolCall: ToolCallContentBlock; messageId: string; conversationId: string }> = [];
  
  for (const message of messages) {
    const toolCalls = contentBlocksToToolCalls(message.content);
    for (const toolCall of toolCalls) {
      results.push({
        toolCall,
        messageId: message.id,
        conversationId: message.thread_id || '',
      });
    }
  }
  
  return results;
}
