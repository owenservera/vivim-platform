# Conversation History Import System Design

**Version:** 1.0.0  
**Date:** March 5, 2026  
**Status:** Design Specification

---

## Executive Summary

This document specifies a complete system for importing conversation history from external AI platforms (ChatGPT, Claude, Gemini, etc.) via `.zip` export files into the VIVIM personal database. The system includes:

1. **Import Pipeline** - Safe, validated ingestion of conversation data
2. **Transformation Queue** - Prioritized processing pipeline for ACU generation, memory extraction, and context enrichment
3. **Data Architecture** - Schema mappings and storage strategies
4. **Safety Mechanisms** - Rate limiting, validation, and error recovery

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Import Data Formats](#2-import-data-formats)
3. [Database Schema](#3-database-schema)
4. [Transformation Queue Architecture](#4-transformation-queue-architecture)
5. [Data Transformation Pipeline](#5-data-transformation-pipeline)
6. [Safety & Error Handling](#6-safety--error-handling)
7. [API Design](#7-api-design)
8. [Frontend Integration](#8-frontend-integration)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. System Overview

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONVERSATION IMPORT SYSTEM                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │   .zip File  │───►│  Unpack &    │───►│  Validation &            │  │
│  │   (User)     │    │  Parse       │    │  Deduplication           │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘  │
│                                              │                          │
│                                              ▼                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    IMPORT QUEUE (BullMQ/Redis)                    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │  │
│  │  │ Priority   │  │ ACU        │  │ Memory     │  │ Context    │ │  │
│  │  │ Validation │──►│ Generation │──►│ Extraction │──►│ Enrichment │ │  │
│  │  │ Queue      │  │ Queue      │  │ Queue      │  │ Queue      │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              │                          │
│                                              ▼                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     PERSONAL DATABASE (PostgreSQL)                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │  │
│  │  │ Conversation │  │ Message      │  │ AtomicChatUnit (ACU)   │ │  │
│  │  │              │  │              │  │ - Embeddings           │ │  │
│  │  │ - metadata   │  │ - parts      │  │ - Quality scores       │ │  │
│  │  │ - stats      │  │ - content    │  │ - Topic links          │ │  │
│  │  └──────────────┘  └──────────────┘  └────────────────────────┘ │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │  │
│  │  │ Memory       │  │ TopicProfile │  │ EntityProfile          │ │  │
│  │  │ - facts      │  │ - topics     │  │ - people/orgs          │ │  │
│  │  │ - prefs      │  │ - clusters   │  │ - relationships        │ │  │
│  │  └──────────────┘  └──────────────┘  └────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

1. **Local-First**: All data stored on user's device/instance first
2. **Idempotent**: Re-importing same data doesn't create duplicates
3. **Progressive Enhancement**: Basic import → ACU → Memory → Context (async pipeline)
4. **User Control**: Transparent queue status, pause/resume/cancel capability
5. **Graceful Degradation**: System works even if some transformations fail

---

## 2. Import Data Formats

### 2.1 Supported Export Formats

#### 2.1.1 ChatGPT Export Format

```json
{
  "schemaVersion": "v1",
  "provider": "chatgpt",
  "conversationId": "conv_abc123",
  "title": "Conversation Title",
  "createdAt": "2024-01-15T10:30:00Z",
  "model": "gpt-4",
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "Hello, can you help me with Rust?",
      "timestamp": "2024-01-15T10:30:00Z",
      "metadata": {
        "tokens": 12
      }
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "Of course! Rust is a systems programming language..."
        },
        {
          "type": "code",
          "language": "rust",
          "code": "fn main() {\n    println!(\"Hello, world!\");\n}"
        }
      ],
      "timestamp": "2024-01-15T10:30:15Z",
      "metadata": {
        "model": "gpt-4",
        "tokensIn": 12,
        "tokensOut": 156
      }
    }
  ]
}
```

#### 2.1.2 Claude Export Format

```json
{
  "provider": "claude",
  "conversation_id": "claude_conv_xyz",
  "title": "Project Discussion",
  "created_at": "2024-02-20T14:00:00Z",
  "updated_at": "2024-02-20T16:30:00Z",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Let's design a new feature"
        }
      ],
      "timestamp": "2024-02-20T14:00:00Z"
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "Great! Here's my approach..."
        }
      ],
      "timestamp": "2024-02-20T14:00:30Z"
    }
  ]
}
```

#### 2.1.3 Generic OpenScroll V1 Format

```json
{
  "format": "openscroll-v1",
  "version": "1.0",
  "conversation": {
    "id": "uuid",
    "provider": "gemini",
    "sourceUrl": "https://gemini.google.com/share/abc123",
    "title": "Exported Conversation",
    "createdAt": "2024-03-01T09:00:00Z",
    "capturedAt": "2024-03-01T10:00:00Z",
    "metadata": {
      "model": "gemini-pro"
    },
    "messages": [],
    "stats": {
      "totalMessages": 0,
      "totalWords": 0
    }
  }
}
```

### 2.2 ZIP File Structure

```
vivim-import-2024-03-05.zip
├── manifest.json              # Import metadata
├── conversations/
│   ├── conv_001.json         # Individual conversation files
│   ├── conv_002.json
│   └── ...
├── assets/                    # Optional: images, files
│   ├── image_001.png
│   └── ...
└── metadata.json             # Export source info
```

**manifest.json:**
```json
{
  "exportVersion": "1.0",
  "exportedAt": "2024-03-05T12:00:00Z",
  "provider": "chatgpt",
  "conversationCount": 42,
  "totalMessages": 1250,
  "format": "chatgpt-export-v1"
}
```

---

## 3. Database Schema

### 3.1 Import Job Tracking

```prisma
model ImportJob {
  id              String   @id @default(uuid())
  userId          String
  status          ImportJobStatus @default(PENDING)
  sourceProvider  String
  format          String
  fileHash        String   @unique  // SHA-256 of uploaded file
  fileName        String
  fileSize        Int
  totalConversations Int
  processedConversations Int @default(0)
  failedConversations  Int @default(0)
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  metadata        Json     @default("{}")
  errors          Json     @default("[]")
  
  user            User     @relation(fields: [userId], references: [id])
  conversations   ImportedConversation[]
  queueJobs       ImportQueueJob[]

  @@index([userId, status])
  @@index([createdAt])
  @@map("import_jobs")
}

enum ImportJobStatus {
  PENDING
  UPLOADING
  VALIDATING
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

model ImportedConversation {
  id              String   @id @default(uuid())
  importJobId     String
  sourceId        String   // Original conversation ID from export
  sourceUrl       String?
  title           String
  provider        String
  state           ImportConversationState @default(PENDING)
  messageCount    Int      @default(0)
  importedAt      DateTime @default(now())
  metadata        Json     @default("{}")
  errors          Json     @default("[]")
  
  importJob       ImportJob @relation(fields: [importJobId], references: [id])
  conversation    Conversation? @relation(fields: [conversationId], references: [id])
  conversationId  String?  // Link to actual Conversation after processing
  
  @@unique([importJobId, sourceId])
  @@index([importJobId, state])
  @@map("imported_conversations")
}

enum ImportConversationState {
  PENDING
  VALIDATING
  STORED
  ACU_GENERATED
  MEMORY_EXTRACTED
  CONTEXT_ENRICHED
  COMPLETED
  FAILED
}

model ImportQueueJob {
  id              String   @id @default(uuid())
  importJobId     String
  jobType         ImportQueueJobType
  priority        Int      @default(0)
  status          QueueJobStatus @default(PENDING)
  payload         Json
  result          Json?
  error           String?
  retryCount      Int      @default(0)
  maxRetries      Int      @default(3)
  scheduledAt     DateTime @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  
  importJob       ImportJob @relation(fields: [importJobId], references: [id])
  
  @@index([importJobId, status])
  @@index([jobType, status, priority])
  @@index([scheduledAt])
  @@map("import_queue_jobs")
}

enum ImportQueueJobType {
  VALIDATE_CONVERSATION
  STORE_CONVERSATION
  GENERATE_ACUS
  EXTRACT_MEMORIES
  ENRICH_CONTEXT
  BUILD_INDEXES
}

enum QueueJobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  RETRY
}
```

### 3.2 Extended Conversation Schema

The existing `Conversation` and `Message` models in `schema.prisma` already support imported data. Key fields:

```prisma
model Conversation {
  id              String   @id @default(uuid())
  provider        String   // 'chatgpt', 'claude', etc.
  sourceUrl       String   @unique  // Original share URL or import ID
  title           String
  // ... existing fields
  ownerId         String?
  owner           User?    @relation(fields: [ownerId], references: [id])
  messages        Message[]
  acus            AtomicChatUnit[]
  // ... rest of schema
}
```

---

## 4. Transformation Queue Architecture

### 4.1 Queue System Design

We use a **multi-stage priority queue** system with the following characteristics:

- **Queue Backend**: Redis + BullMQ (or in-memory for lightweight deployments)
- **Workers**: Horizontal scaling with concurrency control
- **Priority Levels**: 0 (highest) to 10 (lowest)
- **Rate Limiting**: Per-user, per-provider throttling

### 4.2 Queue Stages

```
┌────────────────────────────────────────────────────────────────────┐
│                     IMPORT QUEUE PIPELINE                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Stage 1: VALIDATION (Priority: 0-1)                               │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ • Schema validation                                         │  │
│  │ • Duplicate detection (content hash)                        │  │
│  │ • Malformed data filtering                                  │  │
│  │ Output: Validated conversation data                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                              ▼                                     │
│  Stage 2: STORAGE (Priority: 2-3)                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ • Store Conversation + Messages                             │  │
│  │ • Generate content hashes                                   │  │
│  │ • Update user statistics                                    │  │
│  │ Output: Stored conversation with DB IDs                     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                              ▼                                     │
│  Stage 3: ACU GENERATION (Priority: 4-5)                           │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ • Extract Atomic Chat Units from messages                   │  │
│  │ • Generate embeddings (async)                               │  │
│  │ • Calculate quality scores                                  │  │
│  │ • Link to topics/entities                                   │  │
│  │ Output: ACUs with embeddings                                │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                              ▼                                     │
│  Stage 4: MEMORY EXTRACTION (Priority: 6-7)                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ • Extract facts, preferences, goals                         │  │
│  │ • Identify identity statements                              │  │
│  │ • Create Memory records                                     │  │
│  │ • Link to source ACUs                                       │  │
│  │ Output: Memory records                                      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                              ▼                                     │
│  Stage 5: CONTEXT ENRICHMENT (Priority: 8-9)                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ • Update TopicProfiles                                      │  │
│  │ • Update EntityProfiles                                     │  │
│  │ • Build context bundles                                     │  │
│  │ • Update search indexes                                     │  │
│  │ Output: Enriched context graph                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                              ▼                                     │
│  Stage 6: INDEXING (Priority: 10)                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ • Full-text search index                                    │  │
│  │ • Vector index updates                                      │  │
│  │ • Statistics aggregation                                    │  │
│  │ Output: Searchable, indexed data                            │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 4.3 Worker Configuration

```typescript
// server/src/workers/import-worker.ts

interface WorkerConfig {
  queueName: string;
  concurrency: number;
  rateLimit?: {
    maxJobs: number;
    duration: number; // ms
  };
}

const WORKER_CONFIGS: Record<ImportQueueJobType, WorkerConfig> = {
  VALIDATE_CONVERSATION: {
    queueName: 'import:validate',
    concurrency: 10,
    rateLimit: { maxJobs: 50, duration: 1000 }
  },
  STORE_CONVERSATION: {
    queueName: 'import:store',
    concurrency: 5,
    rateLimit: { maxJobs: 20, duration: 1000 }
  },
  GENERATE_ACUS: {
    queueName: 'import:acu',
    concurrency: 3,
    rateLimit: { maxJobs: 10, duration: 1000 }
  },
  EXTRACT_MEMORIES: {
    queueName: 'import:memory',
    concurrency: 2,
    rateLimit: { maxJobs: 5, duration: 1000 }
  },
  ENRICH_CONTEXT: {
    queueName: 'import:context',
    concurrency: 2,
    rateLimit: { maxJobs: 5, duration: 1000 }
  },
  BUILD_INDEXES: {
    queueName: 'import:index',
    concurrency: 1,
    rateLimit: { maxJobs: 2, duration: 1000 }
  }
};
```

### 4.4 Queue Job Processor

```typescript
// server/src/services/import-queue-service.ts

import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient } from '../lib/redis.js';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';

export class ImportQueueService {
  private queues: Map<ImportQueueJobType, Queue>;
  private workers: Map<ImportQueueJobType, Worker>;

  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.initializeQueues();
  }

  private initializeQueues() {
    const redis = getRedisClient();

    Object.values(ImportQueueJobType).forEach(jobType => {
      const config = WORKER_CONFIGS[jobType];
      const queue = new Queue(config.queueName, { connection: redis });
      this.queues.set(jobType, queue);

      const worker = new Worker(
        config.queueName,
        async (job: Job) => this.processJob(jobType, job),
        {
          connection: redis,
          concurrency: config.concurrency,
          limiter: config.rateLimit
        }
      );

      worker.on('completed', (job) => {
        logger.info({ jobType, jobId: job.id }, 'Import job completed');
      });

      worker.on('failed', (job, error) => {
        logger.error({ jobType, jobId: job?.id, error }, 'Import job failed');
      });

      this.workers.set(jobType, worker);
    });
  }

  async enqueueImportJob(
    importJobId: string,
    conversationData: any,
    priority: number = 5
  ): Promise<void> {
    // Stage 1: Validation
    await this.queues.get(ImportQueueJobType.VALIDATE_CONVERSATION)!.add(
      'validate',
      { importJobId, conversationData },
      { priority, jobId: `${importJobId}:validate` }
    );
  }

  private async processJob(
    jobType: ImportQueueJobType,
    job: Job
  ): Promise<any> {
    const { importJobId } = job.data;

    // Update job status
    await prisma.importQueueJob.update({
      where: { id: job.id },
      data: {
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    try {
      let result;

      switch (jobType) {
        case ImportQueueJobType.VALIDATE_CONVERSATION:
          result = await this.validateConversation(job.data);
          // Enqueue next stage
          if (result.valid) {
            await this.enqueueStoreJob(importJobId, result.data);
          }
          break;

        case ImportQueueJobType.STORE_CONVERSATION:
          result = await this.storeConversation(job.data);
          await this.enqueueACUJob(importJobId, result.conversationId);
          break;

        case ImportQueueJobType.GENERATE_ACUS:
          result = await this.generateACUs(job.data);
          await this.enqueueMemoryJob(importJobId, result.acuIds);
          break;

        case ImportQueueJobType.EXTRACT_MEMORIES:
          result = await this.extractMemories(job.data);
          await this.enqueueContextJob(importJobId, result.memoryIds);
          break;

        case ImportQueueJobType.ENRICH_CONTEXT:
          result = await this.enrichContext(job.data);
          await this.enqueueIndexJob(importJobId);
          break;

        case ImportQueueJobType.BUILD_INDEXES:
          result = await this.buildIndexes(job.data);
          await this.markImportComplete(importJobId);
          break;
      }

      // Update job status
      await prisma.importQueueJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          result: JSON.stringify(result)
        }
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check retry count
      if (job.attemptsMade < job.opts.attempts!) {
        await prisma.importQueueJob.update({
          where: { id: job.id },
          data: {
            status: 'RETRY',
            retryCount: { increment: 1 },
            error: errorMessage
          }
        });
        throw error; // BullMQ will retry
      }

      // Max retries exceeded
      await prisma.importQueueJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: errorMessage
        }
      });

      throw error;
    }
  }

  // Implementation methods for each stage...
  // (see Section 5 for detailed implementations)
}

export const importQueueService = new ImportQueueService();
```

---

## 5. Data Transformation Pipeline

### 5.1 Stage 1: Validation

```typescript
// server/src/services/import-validation-service.ts

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data: any;
  contentHash: string;
  isDuplicate: boolean;
}

export async function validateConversation(
  data: any,
  userId: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Schema validation
  if (!data.provider || !data.messages || !Array.isArray(data.messages)) {
    errors.push('Invalid conversation format: missing required fields');
    return { valid: false, errors, warnings: [], data: null, contentHash: '', isDuplicate: false };
  }

  // 2. Message validation
  for (const [index, msg] of data.messages.entries()) {
    if (!msg.role || !msg.content) {
      errors.push(`Message ${index}: missing role or content`);
    }
    if (!['user', 'assistant', 'system', 'tool'].includes(msg.role)) {
      warnings.push(`Message ${index}: unknown role '${msg.role}'`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings: [], data: null, contentHash: '', isDuplicate: false };
  }

  // 3. Generate content hash for deduplication
  const contentHash = generateContentHash(data);

  // 4. Check for duplicates
  const existing = await prisma.conversation.findFirst({
    where: {
      ownerId: userId,
      OR: [
        { sourceUrl: data.sourceUrl },
        { contentHash }
      ]
    }
  });

  const isDuplicate = !!existing;

  return {
    valid: true,
    errors,
    warnings,
    data,
    contentHash,
    isDuplicate
  };
}

function generateContentHash(data: any): string {
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(canonical).digest('hex');
}
```

### 5.2 Stage 2: Storage

```typescript
// server/src/services/import-storage-service.ts

export async function storeConversation(
  data: any,
  userId: string,
  contentHash: string
): Promise<{ conversationId: string }> {
  const conversation = await prisma.conversation.create({
    data: {
      provider: data.provider,
      sourceUrl: data.sourceUrl || `import:${Date.now()}`,
      contentHash,
      title: data.title || 'Imported Conversation',
      model: data.model || data.metadata?.model || 'unknown',
      state: 'ACTIVE',
      ownerId: userId,
      createdAt: new Date(data.createdAt || Date.now()),
      capturedAt: new Date(data.capturedAt || Date.now()),
      messageCount: data.messages.length,
      userMessageCount: data.messages.filter((m: any) => m.role === 'user').length,
      aiMessageCount: data.messages.filter((m: any) => m.role === 'assistant').length,
      totalWords: calculateTotalWords(data.messages),
      totalCharacters: calculateTotalCharacters(data.messages),
      totalTokens: calculateTotalTokens(data.messages),
      totalCodeBlocks: countCodeBlocks(data.messages),
      metadata: data.metadata || {},
      tags: data.tags || [],
      messages: {
        create: data.messages.map((msg: any, index: number) => ({
          id: msg.id || `msg_${Date.now()}_${index}`,
          role: msg.role,
          author: msg.author || null,
          parts: normalizeMessageParts(msg.content),
          messageIndex: index,
          createdAt: new Date(msg.timestamp || Date.now()),
          tokenCount: msg.metadata?.tokens || null,
          status: 'completed',
          metadata: msg.metadata || {}
        }))
      }
    }
  });

  return { conversationId: conversation.id };
}

function normalizeMessageParts(content: string | any[]): any[] {
  if (typeof content === 'string') {
    return [{ type: 'text', content }];
  }

  if (Array.isArray(content)) {
    return content.map(part => {
      if (typeof part === 'string') {
        return { type: 'text', content: part };
      }

      // Normalize various part types
      switch (part.type) {
        case 'text':
          return { type: 'text', content: part.text || part.content };
        case 'code':
          return {
            type: 'code',
            content: part.code || part.content,
            language: part.language || 'text'
          };
        case 'image':
          return {
            type: 'image',
            content: part.url || part.src,
            metadata: { alt: part.alt }
          };
        default:
          return { type: 'text', content: JSON.stringify(part) };
      }
    });
  }

  return [{ type: 'text', content: JSON.stringify(content) }];
}
```

### 5.3 Stage 3: ACU Generation

```typescript
// server/src/services/import-acu-service.ts

export async function generateACUs(
  conversationId: string,
  userId: string
): Promise<{ acuIds: string[] }> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { messageIndex: 'asc' } } }
  });

  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  const acuIds: string[] = [];

  for (const message of conversation.messages) {
    // Extract meaningful content blocks as ACUs
    const parts = message.parts as any[];

    for (const part of parts) {
      if (shouldExtractAsACU(part)) {
        const acu = await createACUFromPart(
          part,
          message,
          conversation,
          userId
        );
        acuIds.push(acu.id);
      }
    }
  }

  // Update conversation with ACU count
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      acus: { connect: acuIds.map(id => ({ id })) }
    }
  });

  return { acuIds };
}

function shouldExtractAsACU(part: any): boolean {
  // Only extract high-value content
  if (part.type === 'text') {
    const wordCount = (part.content || '').split(/\s+/).length;
    return wordCount >= 20; // Minimum 20 words
  }

  if (part.type === 'code') {
    return true; // All code is valuable
  }

  return false;
}

async function createACUFromPart(
  part: any,
  message: any,
  conversation: any,
  userId: string
): Promise<any> {
  const content = part.type === 'code'
    ? `Code (${part.language}):\n${part.content}`
    : part.content;

  const contentHash = createHash('sha256')
    .update(content)
    .digest('hex');

  // Check for duplicate ACU
  const existing = await prisma.atomicChatUnit.findUnique({
    where: { id: contentHash }
  });

  if (existing) {
    return existing;
  }

  return prisma.atomicChatUnit.create({
    data: {
      id: contentHash,
      authorDid: userId,
      signature: 'imported', // Placeholder for imported content
      content,
      contentHash,
      type: part.type === 'code' ? 'CODE' : 'TEXT',
      category: categorizeACU(content),
      origin: 'import',
      conversationId: conversation.id,
      messageId: message.id,
      messageIndex: message.messageIndex,
      provider: conversation.provider,
      model: conversation.model,
      sourceTimestamp: message.createdAt,
      state: 'ACTIVE',
      qualityOverall: calculateQualityScore(content),
      metadata: {
        importedFrom: conversation.id,
        messageType: message.role
      }
    }
  });
}

function categorizeACU(content: string): string {
  // Simple heuristic categorization
  if (content.includes('function') || content.includes('class')) {
    return 'technical';
  }
  if (content.includes('step') || content.includes('first') || content.includes('then')) {
    return 'procedural';
  }
  return 'general';
}

function calculateQualityScore(content: string): number {
  const wordCount = content.split(/\s+/).length;
  const hasCode = /```|function|class|const|let|var/.test(content);
  const hasStructure = content.includes('\n') && content.includes('-') || content.includes('1.');

  let score = 0.5;
  if (wordCount > 50) score += 0.1;
  if (wordCount > 100) score += 0.1;
  if (hasCode) score += 0.15;
  if (hasStructure) score += 0.05;

  return Math.min(1.0, score);
}
```

### 5.4 Stage 4: Memory Extraction

```typescript
// server/src/services/import-memory-service.ts

import { acuMemoryPipeline } from './acu-memory-pipeline.js';

export async function extractMemories(
  acuIds: string[],
  userId: string
): Promise<{ memoryIds: string[] }> {
  const memoryIds: string[] = [];

  // Process ACUs in batches
  const BATCH_SIZE = 10;

  for (let i = 0; i < acuIds.length; i += BATCH_SIZE) {
    const batch = acuIds.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(acuId => acuMemoryPipeline.convertACUToMemory(acuId, { force: false }))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        if (result.value.memoryId) {
          memoryIds.push(result.value.memoryId);
        }
      }
    }

    // Rate limiting
    if (i + BATCH_SIZE < acuIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { memoryIds };
}
```

### 5.5 Stage 5: Context Enrichment

```typescript
// server/src/services/import-context-service.ts

import { getContextEventBus } from '../context/context-event-bus.js';

export async function enrichContext(
  memoryIds: string[],
  userId: string
): Promise<{ topicUpdates: number, entityUpdates: number }> {
  const eventBus = getContextEventBus();

  // Emit events to trigger context updates
  for (const memoryId of memoryIds) {
    await eventBus.emit('memory:created', userId, {
      memoryId,
      sourceType: 'import',
      type: 'batch_import'
    });
  }

  // Trigger librarian worker for topic/entity updates
  await eventBus.emit('context:rebuild', userId, {
    reason: 'import_batch',
    memoryIds
  });

  return {
    topicUpdates: memoryIds.length, // Approximate
    entityUpdates: Math.floor(memoryIds.length / 2)
  };
}
```

### 5.6 Stage 6: Indexing

```typescript
// server/src/services/import-index-service.ts

export async function buildIndexes(
  importJobId: string
): Promise<{ indexed: number }> {
  // Update full-text search indexes
  await prisma.$executeRaw`
    UPDATE conversations
    SET search_vector = to_tsvector('english', title || ' ' || COALESCE(metadata->>'description', ''))
    WHERE id IN (
      SELECT "conversationId" FROM "ImportedConversation"
      WHERE "importJobId" = ${importJobId}
      AND "conversationId" IS NOT NULL
    )
  `;

  // Update ACU embeddings (if embedding service available)
  // This is typically done asynchronously by a separate worker

  // Aggregate statistics
  await prisma.$executeRaw`
    UPDATE provider_stats
    SET total_captures = total_captures + 1,
        successful_captures = successful_captures + 1,
        last_capture_at = NOW()
    WHERE provider = 'import'
    ON CONFLICT (provider) DO UPDATE
    SET total_captures = provider_stats.total_captures + 1,
        successful_captures = provider_stats.successful_captures + 1,
        last_capture_at = NOW()
  `;

  return { indexed: 1 };
}
```

---

## 6. Safety & Error Handling

### 6.1 Rate Limiting

```typescript
// server/src/middleware/import-rate-limit.ts

const RATE_LIMITS = {
  // Per-user limits
  USER_CONCURRENT_IMPORTS: 3,
  USER_DAILY_IMPORT_SIZE: 500 * 1024 * 1024, // 500MB/day

  // Per-conversation limits
  MAX_MESSAGES_PER_CONVERSATION: 1000,
  MAX_ACUS_PER_CONVERSATION: 500,

  // Queue rate limits
  QUEUE_RATE_LIMIT: {
    maxJobs: 50,
    duration: 60000 // per minute
  }
};

export function checkImportRateLimit(userId: string): void {
  // Check concurrent imports
  // Check daily quota
  // Throw error if exceeded
}
```

### 6.2 Error Recovery

```typescript
// server/src/services/import-error-handler.ts

export async function handleImportError(
  importJobId: string,
  error: Error,
  stage: string
): Promise<void> {
  const prisma = getPrismaClient();

  // Log error
  await prisma.importJob.update({
    where: { id: importJobId },
    data: {
      errors: {
        push: {
          stage,
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      },
      status: 'FAILED'
    }
  });

  // Notify user (via email, in-app notification, etc.)
  await notifyUserOfImportError(importJobId, error);

  // Cleanup partial data if necessary
  await cleanupPartialImport(importJobId);
}
```

### 6.3 Data Validation Checklist

```typescript
const VALIDATION_CHECKLIST = [
  '✓ Valid JSON structure',
  '✓ Required fields present (provider, messages)',
  '✓ Message roles are valid',
  '✓ Timestamps are parseable',
  '✓ Content is not malicious (XSS, injection)',
  '✓ File size within limits',
  '✓ Not a duplicate (content hash check)',
  '✓ User has quota available'
];
```

---

## 7. API Design

### 7.1 Import Endpoints

```typescript
// server/src/routes/import.ts

import { Router } from 'express';
import { requireAuth } from '../middleware/unified-auth.js';
import { importService } from '../services/import-service.js';

const router = Router();

/**
 * POST /api/v1/import/upload
 * Upload a .zip file for import
 */
router.post('/upload', requireAuth, async (req, res) => {
  const userId = req.userId;
  const file = req.files?.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const importJob = await importService.createImportJob(userId, file);

    res.json({
      success: true,
      importJobId: importJob.id,
      status: importJob.status,
      estimatedProcessingTime: importJob.totalConversations * 2000 // ms
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Upload failed'
    });
  }
});

/**
 * GET /api/v1/import/jobs/:id
 * Get import job status
 */
router.get('/jobs/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const job = await importService.getImportJob(id, userId);

  if (!job) {
    return res.status(404).json({ error: 'Import job not found' });
  }

  res.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      progress: {
        total: job.totalConversations,
        processed: job.processedConversations,
        failed: job.failedConversations,
        percentage: Math.round((job.processedConversations / job.totalConversations) * 100)
      },
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errors: job.errors
    }
  });
});

/**
 * GET /api/v1/import/jobs
 * List all import jobs for user
 */
router.get('/jobs', requireAuth, async (req, res) => {
  const userId = req.userId;
  const jobs = await importService.listImportJobs(userId);

  res.json({
    success: true,
    jobs: jobs.map(job => ({
      id: job.id,
      status: job.status,
      fileName: job.fileName,
      totalConversations: job.totalConversations,
      processedConversations: job.processedConversations,
      createdAt: job.createdAt,
      completedAt: job.completedAt
    }))
  });
});

/**
 * POST /api/v1/import/jobs/:id/cancel
 * Cancel an import job
 */
router.post('/jobs/:id/cancel', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    await importService.cancelImportJob(id, userId);

    res.json({
      success: true,
      message: 'Import job cancelled'
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Cancel failed'
    });
  }
});

/**
 * POST /api/v1/import/jobs/:id/retry
 * Retry failed import job
 */
router.post('/jobs/:id/retry', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const job = await importService.retryImportJob(id, userId);

    res.json({
      success: true,
      importJobId: job.id,
      status: job.status
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Retry failed'
    });
  }
});

export { router as importRouter };
```

### 7.2 WebSocket Events

```typescript
// server/src/websockets/import-events.ts

export function setupImportEvents(io: Server) {
  io.on('connection', (socket) => {
    socket.on('import:subscribe', (importJobId: string) => {
      socket.join(`import:${importJobId}`);
    });

    socket.on('import:unsubscribe', (importJobId: string) => {
      socket.leave(`import:${importJobId}`);
    });
  });
}

// Emit events during import processing
export function emitImportProgress(
  io: Server,
  importJobId: string,
  event: {
    type: 'progress' | 'stage_complete' | 'error' | 'complete';
    data: any;
  }
) {
  io.to(`import:${importJobId}`).emit('import:update', {
    importJobId,
    ...event
  });
}
```

---

## 8. Frontend Integration

### 8.1 Import Page Component

```typescript
// pwa/src/pages/ImportPage.tsx

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importJob, setImportJob] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.zip')) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/v1/import/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    setImportJob(data);
    setStatus('processing');

    // Subscribe to WebSocket updates
    subscribeToImportUpdates(data.importJobId);
  };

  const subscribeToImportUpdates = (importJobId: string) => {
    const socket = getSocket();
    socket.emit('import:subscribe', importJobId);

    socket.on('import:update', (event) => {
      if (event.importJobId === importJobId) {
        handleImportUpdate(event);
      }
    });
  };

  const handleImportUpdate = (event: any) => {
    switch (event.type) {
      case 'progress':
        setProgress(event.data.percentage);
        break;
      case 'complete':
        setStatus('completed');
        break;
      case 'error':
        setStatus('error');
        break;
    }
  };

  return (
    <div className="import-page">
      <h1>Import Conversations</h1>

      {status === 'idle' && (
        <div className="upload-zone">
          <input
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            id="file-input"
          />
          <label htmlFor="file-input" className="drop-zone">
            Drop your .zip file here or click to browse
          </label>

          {file && (
            <div className="file-info">
              <p>Selected: {file.name}</p>
              <button onClick={handleUpload}>Start Import</button>
            </div>
          )}
        </div>
      )}

      {status === 'processing' && importJob && (
        <div className="progress-zone">
          <h2>Importing...</h2>
          <ProgressBar value={progress} />
          <p>{progress}% complete</p>
          <p>
            Processed: {importJob.job?.progress?.processed} / {importJob.job?.progress?.total}
          </p>

          <div className="queue-status">
            <h3>Processing Queue</h3>
            <QueueStatus importJobId={importJob.importJobId} />
          </div>

          <button onClick={() => cancelImport(importJob.importJobId)}>
            Cancel Import
          </button>
        </div>
      )}

      {status === 'completed' && (
        <div className="success-zone">
          <SuccessIcon />
          <h2>Import Complete!</h2>
          <p>Your conversations are being processed in the background.</p>
          <Link to="/conversations">View Conversations</Link>
        </div>
      )}

      {status === 'error' && (
        <div className="error-zone">
          <ErrorIcon />
          <h2>Import Failed</h2>
          <p>Something went wrong. You can retry or contact support.</p>
          <button onClick={() => setStatus('idle')}>Try Again</button>
        </div>
      )}
    </div>
  );
}
```

### 8.2 Queue Status Component

```typescript
// pwa/src/components/QueueStatus.tsx

interface QueueStatusProps {
  importJobId: string;
}

export function QueueStatus({ importJobId }: QueueStatusProps) {
  const [stages, setStages] = useState([
    { name: 'Validation', status: 'pending' },
    { name: 'Storage', status: 'pending' },
    { name: 'ACU Generation', status: 'pending' },
    { name: 'Memory Extraction', status: 'pending' },
    { name: 'Context Enrichment', status: 'pending' },
    { name: 'Indexing', status: 'pending' }
  ]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('import:subscribe', importJobId);

    socket.on('import:update', (event) => {
      if (event.type === 'stage_complete') {
        updateStageStatus(event.data.stage, 'completed');
        updateStageStatus(event.data.nextStage, 'processing');
      }
    });

    return () => {
      socket.emit('import:unsubscribe', importJobId);
    };
  }, [importJobId]);

  const updateStageStatus = (stageName: string, newStatus: string) => {
    setStages(prev => prev.map(stage =>
      stage.name === stageName ? { ...stage, status: newStatus } : stage
    ));
  };

  return (
    <div className="queue-status">
      {stages.map((stage, index) => (
        <div key={stage.name} className={`stage ${stage.status}`}>
          <StageIcon status={stage.status} />
          <span>{stage.name}</span>
          {index < stages.length - 1 && <ArrowDown />}
        </div>
      ))}
    </div>
  );
}
```

---

## 9. Implementation Phases

### Phase 1: Core Import (Week 1-2)

- [ ] Database schema migrations
- [ ] File upload endpoint
- [ ] ZIP parsing service
- [ ] Basic validation
- [ ] Conversation storage

### Phase 2: Queue System (Week 3-4)

- [ ] Redis + BullMQ setup
- [ ] Queue worker implementation
- [ ] Stage 1-3 processors (Validation, Storage, ACU)
- [ ] Progress tracking
- [ ] WebSocket events

### Phase 3: Advanced Transformations (Week 5-6)

- [ ] Memory extraction integration
- [ ] Context enrichment
- [ ] Indexing service
- [ ] Error recovery
- [ ] Retry logic

### Phase 4: Frontend & Polish (Week 7-8)

- [ ] Import page UI
- [ ] Queue status visualization
- [ ] Import history page
- [ ] Notifications
- [ ] Documentation

### Phase 5: Testing & Optimization (Week 9-10)

- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Performance optimization
- [ ] Security audit

---

## Appendix A: Content Hash Algorithm

```typescript
function generateContentHash(conversation: any): string {
  const canonical = {
    provider: conversation.provider,
    messages: conversation.messages.map((m: any) => ({
      role: m.role,
      content: normalizeContent(m.content),
      timestamp: m.timestamp
    }))
  };

  const serialized = JSON.stringify(canonical, Object.keys(canonical).sort());
  return createHash('sha256').update(serialized).digest('hex');
}

function normalizeContent(content: string | any[]): string {
  if (typeof content === 'string') return content.trim().toLowerCase();
  if (Array.isArray(content)) {
    return content
      .map(p => typeof p === 'string' ? p : p.content || '')
      .join(' ')
      .trim()
      .toLowerCase();
  }
  return JSON.stringify(content);
}
```

---

## Appendix B: Sample Import Flow

```
User uploads: chatgpt-export.zip (50 conversations)
│
├─► Upload API validates file (size, type)
│   └─► Creates ImportJob (status: VALIDATING)
│
├─► Validation Worker extracts ZIP
│   ├─► Parses manifest.json
│   ├─► Validates each conversation
│   └─► Updates ImportJob (status: QUEUED, totalConversations: 50)
│
├─► Queue enqueues 50 validation jobs (Priority: 1)
│   │
│   ├─► Job 1: Validate conv_001
│   │   ├─► Schema check ✓
│   │   ├─► Duplicate check ✓
│   │   └─► Enqueue storage job (Priority: 3)
│   │
│   └─► ... (49 more)
│
├─► Storage Workers process conversations
│   ├─► Store Conversation + Messages
│   ├─► Generate hashes
│   └─► Enqueue ACU job (Priority: 5)
│
├─► ACU Workers extract knowledge
│   ├─► Process messages
│   ├─► Create ACUs with embeddings
│   └─► Enqueue memory job (Priority: 7)
│
├─► Memory Workers extract facts
│   ├─► Analyze ACUs
│   ├─► Create Memory records
│   └─► Enqueue context job (Priority: 9)
│
└─► Context Workers enrich graph
    ├─► Update TopicProfiles
    ├─► Update EntityProfiles
    └─► Mark ImportJob COMPLETED

Total estimated time: ~100 seconds (2 sec/conversation average)
```

---

## Appendix C: Redis Queue Configuration

```typescript
// server/src/lib/redis.ts

import { Redis } from 'ioredis';

let redisClient: Redis;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  return redisClient;
}
```

---

## Appendix D: Environment Variables

```bash
# .env.example

# Import Configuration
IMPORT_MAX_FILE_SIZE=104857600        # 100MB
IMPORT_MAX_CONVERSATIONS_PER_JOB=100
IMPORT_DAILY_QUOTA_MB=500

# Queue Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
IMPORT_QUEUE_CONCURRENCY=5
IMPORT_QUEUE_RATE_LIMIT=50            # jobs per minute

# Processing Configuration
ACU_GENERATION_BATCH_SIZE=10
MEMORY_EXTRACTION_BATCH_SIZE=5
EMBEDDING_BATCH_SIZE=20

# Rate Limiting
IMPORT_RATE_LIMIT_WINDOW_MS=60000
IMPORT_RATE_LIMIT_MAX_JOBS=10
```

---

## Appendix E: Testing Checklist

```markdown
## Import System Testing

### Unit Tests
- [ ] ZIP parsing handles valid files
- [ ] ZIP parsing rejects corrupted files
- [ ] Schema validation catches all errors
- [ ] Content hash is deterministic
- [ ] Duplicate detection works correctly

### Integration Tests
- [ ] Full import flow (upload → complete)
- [ ] Queue processing order
- [ ] Error recovery and retries
- [ ] WebSocket event emission
- [ ] Database consistency after import

### Load Tests
- [ ] 100 conversations imported successfully
- [ ] 10 concurrent imports
- [ ] Queue doesn't overflow
- [ ] Memory usage stays bounded

### Security Tests
- [ ] Malicious files rejected
- [ ] XSS in content sanitized
- [ ] SQL injection prevented
- [ ] Rate limiting enforced
- [ ] User isolation verified
```

---

**END OF DOCUMENT**
