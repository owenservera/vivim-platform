/**
 * VIVIM SDK Database Schema
 * 
 * Comprehensive database schema with field mappings for the communication protocol.
 */

import { z } from 'zod';

// ============== Base Types ==============

export type UUID = string;
export type Timestamp = number;
export type DateTimeString = string;

// ============== Conversation Schema ==============

export interface ConversationRecord {
  id: UUID;
  title: string | null;
  owner_did: string;
  system_prompt: string | null;
  model: string | null;
  status: ConversationStatus;
  metadata: Record<string, unknown> | null;
  tags: string[];
  archived: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  last_message_at: Timestamp | null;
}

export type ConversationStatus = 'active' | 'paused' | 'completed' | 'archived';

export const ConversationRecordSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  owner_did: z.string(),
  system_prompt: z.string().nullable(),
  model: z.string().nullable(),
  status: z.enum(['active', 'paused', 'completed', 'archived']),
  metadata: z.record(z.unknown()).nullable(),
  tags: z.array(z.string()),
  archived: z.boolean(),
  created_at: z.number(),
  updated_at: z.number(),
  last_message_at: z.number().nullable(),
});

// ============== Message Schema ==============

export interface MessageRecord {
  id: UUID;
  conversation_id: UUID;
  type: string;
  role: MessageRole;
  content: string;
  parent_id: UUID | null;
  user_id: string | null;
  model: string | null;
  tokens_prompt: number | null;
  tokens_completion: number | null;
  tokens_total: number | null;
  finish_reason: string | null;
  provider_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  hidden: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export const MessageRecordSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  type: z.string(),
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  parent_id: z.string().nullable(),
  user_id: z.string().nullable(),
  model: z.string().nullable(),
  tokens_prompt: z.number().nullable(),
  tokens_completion: z.number().nullable(),
  tokens_total: z.number().nullable(),
  finish_reason: z.string().nullable(),
  provider_data: z.record(z.unknown()).nullable(),
  metadata: z.record(z.unknown()).nullable(),
  hidden: z.boolean(),
  created_at: z.number(),
  updated_at: z.number(),
});

// ============== Tool Call Schema ==============

export interface ToolCallRecord {
  id: UUID;
  message_id: UUID;
  conversation_id: UUID;
  name: string;
  input: string;
  approval_status: ToolApprovalStatus;
  approved_by: string | null;
  approved_at: Timestamp | null;
  modified_input: string | null;
  result: string | null;
  is_error: boolean;
  execution_duration_ms: number | null;
  created_at: Timestamp;
  completed_at: Timestamp | null;
}

export type ToolApprovalStatus = 'pending' | 'approved' | 'denied' | 'modified' | 'expired';

export const ToolCallRecordSchema = z.object({
  id: z.string(),
  message_id: z.string(),
  conversation_id: z.string(),
  name: z.string(),
  input: z.string(),
  approval_status: z.enum(['pending', 'approved', 'denied', 'modified', 'expired']),
  approved_by: z.string().nullable(),
  approved_at: z.number().nullable(),
  modified_input: z.string().nullable(),
  result: z.string().nullable(),
  is_error: z.boolean(),
  execution_duration_ms: z.number().nullable(),
  created_at: z.number(),
  completed_at: z.number().nullable(),
});

// ============== Attachment Schema ==============

export interface AttachmentRecord {
  id: UUID;
  message_id: UUID;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_uri: string;
  storage_provider: StorageProvider;
  content_hash: string | null;
  thumbnail_uri: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Timestamp;
}

export type StorageProvider = 'local' | 's3' | 'gcs' | 'ipfs' | 'arweave';

export const AttachmentRecordSchema = z.object({
  id: z.string(),
  message_id: z.string(),
  filename: z.string(),
  mime_type: z.string(),
  size_bytes: z.number(),
  storage_uri: z.string(),
  storage_provider: z.enum(['local', 's3', 'gcs', 'ipfs', 'arweave']),
  content_hash: z.string().nullable(),
  thumbnail_uri: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  created_at: z.number(),
});

// ============== Sync Schema ==============

export interface SyncStateRecord {
  conversation_id: UUID;
  node_id: string;
  is_primary: boolean;
  last_sync_timestamp: string;
  merkle_root: string;
  message_count: number;
  version: number;
  updated_at: Timestamp;
  synced_at: Timestamp | null;
}

export const SyncStateRecordSchema = z.object({
  conversation_id: z.string(),
  node_id: z.string(),
  is_primary: z.boolean(),
  last_sync_timestamp: z.string(),
  merkle_root: z.string(),
  message_count: z.number(),
  version: z.number(),
  updated_at: z.number(),
  synced_at: z.number().nullable(),
});

export interface SyncDeltaRecord {
  id: UUID;
  conversation_id: UUID;
  operation: SyncOperation;
  entity_type: string;
  entity_id: UUID;
  previous_hash: string | null;
  current_hash: string;
  entity_data: string;
  hlc_timestamp: string;
  node_id: string;
  applied: boolean;
  created_at: Timestamp;
  applied_at: Timestamp | null;
}

export type SyncOperation = 'create' | 'update' | 'delete';

export const SyncDeltaRecordSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  operation: z.enum(['create', 'update', 'delete']),
  entity_type: z.string(),
  entity_id: z.string(),
  previous_hash: z.string().nullable(),
  current_hash: z.string(),
  entity_data: z.string(),
  hlc_timestamp: z.string(),
  node_id: z.string(),
  applied: z.boolean(),
  created_at: z.number(),
  applied_at: z.number().nullable(),
});

// ============== Offline Queue Schema ==============

export interface OfflineQueueRecord {
  id: UUID;
  conversation_id: UUID;
  message_data: string;
  priority: MessagePriority;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  status: QueueStatus;
  created_at: Timestamp;
  next_retry_at: Timestamp | null;
  completed_at: Timestamp | null;
}

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type MessagePriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

export const OfflineQueueRecordSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  message_data: z.string(),
  priority: z.enum(['critical', 'high', 'normal', 'low', 'background']),
  retry_count: z.number(),
  max_retries: z.number(),
  last_error: z.string().nullable(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  created_at: z.number(),
  next_retry_at: z.number().nullable(),
  completed_at: z.number().nullable(),
});

// ============== Index Definitions ==============

export const DatabaseIndexes = {
  conversation_owner: { table: 'conversations', columns: ['owner_did'], unique: false },
  conversation_status: { table: 'conversations', columns: ['status', 'archived'], unique: false },
  message_conversation: { table: 'messages', columns: ['conversation_id', 'created_at'], unique: false },
  message_parent: { table: 'messages', columns: ['parent_id'], unique: false },
  tool_call_message: { table: 'tool_calls', columns: ['message_id'], unique: false },
  tool_call_approval: { table: 'tool_calls', columns: ['approval_status', 'created_at'], unique: false },
  sync_conversation: { table: 'sync_state', columns: ['conversation_id'], unique: true },
  sync_delta_conversation: { table: 'sync_deltas', columns: ['conversation_id', 'hlc_timestamp'], unique: false },
  queue_status: { table: 'offline_queue', columns: ['status', 'priority'], unique: false },
} as const;

// ============== Field Mappings ==============

export const FieldMappings = {
  message: {
    id: { db: 'id', type: 'UUID', required: true },
    type: { db: 'type', type: 'string', required: true, source: 'protocol.vivim.*' },
    role: { db: 'role', type: 'enum', required: true, source: 'protocol.role' },
    content: { db: 'content', type: 'JSON', required: true, source: 'protocol.content_block[]' },
    thread_id: { db: 'conversation_id', type: 'UUID', required: true, source: 'protocol.thread_id' },
    'metadata.user_id': { db: 'user_id', type: 'string', required: false },
    'metadata.model': { db: 'model', type: 'string', required: false },
    'metadata.tokens.total': { db: 'tokens_total', type: 'number', required: false },
  },
  toolCall: {
    id: { db: 'id', type: 'UUID', required: true },
    name: { db: 'name', type: 'string', required: true, source: 'tool-ui.name' },
    input: { db: 'input', type: 'JSON', required: true, source: 'tool-ui.input' },
    approved: { db: 'approval_status', type: 'enum', required: false, source: 'protocol.approval' },
    result: { db: 'result', type: 'JSON', required: false, source: 'tool-ui.result' },
  },
  sync: {
    conversation_id: { db: 'conversation_id', type: 'UUID', required: true },
    node_id: { db: 'node_id', type: 'string', required: true },
    merkle_root: { db: 'merkle_root', type: 'string', required: true, source: 'protocol.merkle' },
  },
} as const;

// ============== SQL Schema Generation ==============

export function generateSQLSchema(): string {
  return `
-- VIVIM SDK Database Schema

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY,
  title TEXT,
  owner_did VARCHAR(255) NOT NULL,
  system_prompt TEXT,
  model VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB,
  tags TEXT[] DEFAULT '{}',
  archived BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  last_message_at BIGINT
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  type VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  parent_id UUID,
  user_id VARCHAR(255),
  model VARCHAR(255),
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  tokens_total INTEGER,
  finish_reason VARCHAR(50),
  provider_data JSONB,
  metadata JSONB,
  hidden BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS tool_calls (
  id UUID PRIMARY KEY,
  message_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  input JSONB NOT NULL,
  approval_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  approved_by VARCHAR(255),
  approved_at BIGINT,
  modified_input JSONB,
  result JSONB,
  is_error BOOLEAN DEFAULT FALSE,
  execution_duration_ms INTEGER,
  created_at BIGINT NOT NULL,
  completed_at BIGINT
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY,
  message_id UUID NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_uri TEXT NOT NULL,
  storage_provider VARCHAR(50) NOT NULL,
  content_hash VARCHAR(255),
  thumbnail_uri TEXT,
  metadata JSONB,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_state (
  conversation_id UUID PRIMARY KEY,
  node_id VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  last_sync_timestamp VARCHAR(100) NOT NULL,
  merkle_root VARCHAR(255) NOT NULL,
  message_count INTEGER DEFAULT 0,
  version BIGINT DEFAULT 1,
  updated_at BIGINT NOT NULL,
  synced_at BIGINT
);

CREATE TABLE IF NOT EXISTS sync_deltas (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  operation VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  previous_hash VARCHAR(255),
  current_hash VARCHAR(255) NOT NULL,
  entity_data JSONB NOT NULL,
  hlc_timestamp VARCHAR(100) NOT NULL,
  node_id VARCHAR(255) NOT NULL,
  applied BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL,
  applied_at BIGINT
);

CREATE TABLE IF NOT EXISTS offline_queue (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  message_data JSONB NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'normal',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at BIGINT NOT NULL,
  next_retry_at BIGINT,
  completed_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_did);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tool_calls_message ON tool_calls(message_id);
CREATE INDEX IF NOT EXISTS idx_sync_deltas_conversation ON sync_deltas(conversation_id, hlc_timestamp);
`;
}
