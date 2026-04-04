# Tiered Import Service - Implementation Roadmap

**Version:** 1.0  
**Date:** March 17, 2026  
**Status:** Implementation Guide

---

## Overview

This document outlines the remaining implementation steps to complete the tiered import service. The core infrastructure is in place; this guide covers the completion of Tier handlers (ACU Generation, Memory Extraction, Context Enrichment, Index Building) and supporting features.

---

## Current Status

### Completed ✅

- Prisma schema with tier support
- Streaming upload service (disk-based)
- File scanning endpoint
- Tier orchestrator framework
- New API endpoints (scan, start, pause, resume, run-tier)
- Frontend tier selection UI

### In Progress 🔶

- Tier handlers (Tier 1-4)

### Not Started ❌

- WebSocket progress updates
- Production polish

---

## Tier Handlers Implementation

### Tier 1: ACU Generation

**Purpose:** Extract Atomic Chat Units from conversation messages

**File:** `server/src/services/tier-orchestrator.ts`

**Implementation:**

```typescript
private async runTier1(
  conversations: { id: string }[],
  config: Tier1Config,
  jobId: string
): Promise<{ acuGenerated: number }> {
  const prisma = getPrismaClient();
  let acuGenerated = 0;

  for (const conv of conversations) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conv.id },
        include: { messages: true }
      });

      if (!conversation) continue;

      for (const message of conversation.messages) {
        if (message.role === 'system') continue;

        const content = this.extractContent(message.parts);
        if (!content || content.length < config.minContentLength) continue;

        const qualityScore = this.calculateQualityScore(content);
        const acuId = this.generateACUId(conversation.id, message.id, content);

        const existing = await prisma.atomicChatUnit.findUnique({
          where: { id: acuId }
        });

        if (existing) continue;

        await prisma.atomicChatUnit.create({
          data: {
            id: acuId,
            authorDid: conversation.ownerId,
            signature: Buffer.from('import-generated'),
            content: content.substring(0, 10000),
            type: config.extractCode && this.isCode(content) ? 'CODE' : 'TEXT',
            category: this.categorizeACU(content),
            origin: 'import',
            conversationId: conversation.id,
            messageId: message.id,
            messageIndex: message.messageIndex || 0,
            provider: conversation.provider,
            model: conversation.model,
            sourceTimestamp: message.createdAt,
            qualityOverall: qualityScore,
          }
        });

        acuGenerated++;
      }

      await prisma.importedConversation.updateMany({
        where: { conversationId: conv.id },
        data: { state: 'ACU_GENERATED' }
      });

      await this.updateProgress(jobId, 'TIER_1', acuGenerated);
    } catch (err) {
      log.error({ conversationId: conv.id, error: err.message }, 'ACU generation failed');
    }
  }

  return { acuGenerated };
}

private extractContent(parts: any[]): string {
  if (!parts || !Array.isArray(parts)) return '';
  
  return parts
    .filter(p => p.type === 'text')
    .map(p => p.content || '')
    .join(' ')
    .trim();
}

private calculateQualityScore(content: string): number {
  const wordCount = content.split(/\s+/).length;
  const hasCode = /```|function|class|const|let|var/.test(content);
  const hasStructure = content.includes('\n') && (content.includes('-') || content.includes('1.'));

  let score = 0.5;
  if (wordCount > 50) score += 0.1;
  if (wordCount > 100) score += 0.1;
  if (hasCode) score += 0.15;
  if (hasStructure) score += 0.05;

  return Math.min(1.0, score);
}

private generateACUId(conversationId: string, messageId: string, content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256')
    .update(`${conversationId}:${messageId}:${content.substring(0, 100)}`)
    .digest('hex');
}

private categorizeACU(content: string): string {
  if (content.includes('function') || content.includes('class') || content.includes('const ')) {
    return 'technical';
  }
  if (content.includes('step') || content.includes('first') || content.includes('then')) {
    return 'procedural';
  }
  return 'general';
}

private isCode(content: string): boolean {
  return /```|function|class|const |let |var |import |export |def |pub fn/.test(content);
}
```

---

### Tier 2: Memory Extraction

**Purpose:** Convert ACUs to memories with facts, preferences, goals

**Implementation:**

```typescript
private async runTier2(
  conversations: { id: string }[],
  config: Tier2Config,
  jobId: string
): Promise<{ memoriesExtracted: number }> {
  const prisma = getPrismaClient();
  let memoriesExtracted = 0;

  for (const conv of conversations) {
    try {
      const acus = await prisma.atomicChatUnit.findMany({
        where: { conversationId: conv.id }
      });

      for (const acu of acus) {
        const facts = config.extractFacts ? this.extractFacts(acu.content) : [];
        const preferences = config.extractPreferences ? this.extractPreferences(acu.content) : [];
        const goals = config.extractGoals ? this.extractGoals(acu.content) : [];

        for (const fact of facts) {
          await prisma.memory.create({
            data: {
              userId: acu.authorDid,
              content: fact,
              memoryType: 'FACT',
              category: 'knowledge',
              importance: config.depth === 'deep' ? 0.7 : 0.5,
              sourceAcuId: acu.id,
              sourceConversationId: conv.id,
              metadata: { imported: true, importJobId: jobId },
            }
          });
          memoriesExtracted++;
        }

        for (const pref of preferences) {
          await prisma.memory.create({
            data: {
              userId: acu.authorDid,
              content: pref,
              memoryType: 'PREFERENCE',
              category: 'preference',
              importance: 0.6,
              sourceAcuId: acu.id,
              sourceConversationId: conv.id,
              metadata: { imported: true, importJobId: jobId },
            }
          });
          memoriesExtracted++;
        }
      }

      await prisma.importedConversation.updateMany({
        where: { conversationId: conv.id },
        data: { state: 'MEMORY_EXTRACTED' }
      });

      await this.updateProgress(jobId, 'TIER_2', memoriesExtracted);
    } catch (err) {
      log.error({ conversationId: conv.id, error: err.message }, 'Memory extraction failed');
    }
  }

  return { memoriesExtracted };
}

private extractFacts(content: string): string[] {
  const facts: string[] = [];
  const patterns = [
    /(.+?) is a (.+)/gi,
    /(.+?) was (.+)/gi,
    /the (.+?) (.+?)s (.+)/gi,
  ];

  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      facts.push(...matches.slice(0, 3));
    }
  }

  return facts.slice(0, 5);
}

private extractPreferences(content: string): string[] {
  const prefs: string[] = [];
  
  const preferencePatterns = [
    /I prefer (.+)/gi,
    /I like (.+)/gi,
    /my favorite (.+)/gi,
    /I usually (.+)/gi,
  ];

  for (const pattern of preferencePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      prefs.push(...matches);
    }
  }

  return prefs.slice(0, 3);
}

private extractGoals(content: string): string[] {
  const goals: string[] = [];
  
  const goalPatterns = [
    /I want to (.+)/gi,
    /I need to (.+)/gi,
    /I will (.+)/gi,
    /my goal is (.+)/gi,
  ];

  for (const pattern of goalPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      goals.push(...matches);
    }
  }

  return goals.slice(0, 3);
}
```

---

### Tier 3: Context Enrichment

**Purpose:** Update TopicProfiles and EntityProfiles with imported data

**Implementation:**

```typescript
private async runTier3(
  conversations: { id: string }[],
  config: Tier3Config,
  jobId: string
): Promise<{ contextEnriched: number }> {
  const prisma = getPrismaClient();
  let contextEnriched = 0;

  for (const conv of conversations) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conv.id },
        include: {
          messages: true,
          topicConversations: true,
          entityConversations: true,
        }
      });

      if (!conversation) continue;

      const topics = this.extractTopics(conversation);
      const entities = this.extractEntities(conversation);

      if (config.updateTopics) {
        for (const topic of topics) {
          await prisma.topicConversation.upsert({
            where: {
              topicId_conversationId: {
                topicId: topic.id,
                conversationId: conv.id,
              }
            },
            create: {
              topicId: topic.id,
              conversationId: conv.id,
              weight: topic.weight,
            },
            update: {
              weight: config.mergeStrategy === 'aggressive' 
                ? { increment: topic.weight }
                : topic.weight,
            }
          });
          contextEnriched++;
        }
      }

      if (config.updateEntities) {
        for (const entity of entities) {
          await prisma.entityConversation.upsert({
            where: {
              entityId_conversationId: {
                entityId: entity.id,
                conversationId: conv.id,
              }
            },
            create: {
              entityId: entity.id,
              conversationId: conv.id,
              mentions: entity.mentions,
            },
            update: {
              mentions: { increment: entity.mentions },
            }
          });
          contextEnriched++;
        }
      }

      await prisma.importedConversation.updateMany({
        where: { conversationId: conv.id },
        data: { state: 'CONTEXT_ENRICHED' }
      });

      await this.updateProgress(jobId, 'TIER_3', contextEnriched);
    } catch (err) {
      log.error({ conversationId: conv.id, error: err.message }, 'Context enrichment failed');
    }
  }

  return { contextEnriched };
}

private extractTopics(conversation: any): { id: string; weight: number }[] {
  const topics: Map<string, number> = new Map();
  
  const topicKeywords = [
    { keywords: ['react', 'vue', 'angular', 'frontend'], topic: 'web-development' },
    { keywords: ['api', 'rest', 'graphql', 'endpoint'], topic: 'api-design' },
    { keywords: ['database', 'sql', 'postgres', 'mongodb'], topic: 'databases' },
    { keywords: ['auth', 'jwt', 'oauth', 'security'], topic: 'authentication' },
  ];

  const content = conversation.messages
    ?.map((m: any) => this.extractContent(m.parts))
    .join(' ')
    .toLowerCase() || '';

  for (const { keywords, topic } of topicKeywords) {
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        topics.set(topic, (topics.get(topic) || 0) + 1);
      }
    }
  }

  return Array.from(topics.entries()).map(([id, weight]) => ({ id, weight }));
}

private extractEntities(conversation: any): { id: string; mentions: number }[] {
  const entities: Map<string, number> = new Map();
  
  const content = conversation.messages
    ?.map((m: any) => this.extractContent(m.parts))
    .join(' ') || '';

  const entityPattern = /@(\w+)/g;
  let match;
  while ((match = entityPattern.exec(content)) !== null) {
    const entity = match[1];
    entities.set(entity, (entities.get(entity) || 0) + 1);
  }

  return Array.from(entities.entries()).map(([id, mentions]) => ({ id, mentions }));
}
```

---

### Tier 4: Index Building

**Purpose:** Build search indexes and aggregate statistics

**Implementation:**

```typescript
private async runTier4(
  conversations: { id: string }[],
  config: Tier4Config,
  jobId: string
): Promise<{ indexed: number }> {
  const prisma = getPrismaClient();
  let indexed = 0;

  for (const conv of conversations) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conv.id }
      });

      if (!conversation) continue;

      const searchText = [
        conversation.title,
        conversation.model,
        conversation.provider,
      ].filter(Boolean).join(' ');

      await prisma.conversation.update({
        where: { id: conv.id },
        data: {
          metadata: {
            ...(conversation.metadata as object || {}),
            indexedAt: new Date().toISOString(),
            importJobId: jobId,
          }
        }
      });

      indexed++;
    } catch (err) {
      log.error({ conversationId: conv.id, error: err.message }, 'Index building failed');
    }
  }

  await prisma.importJob.update({
    where: { id: jobId },
    data: { status: 'COMPLETED' }
  });

  return { indexed };
}
```

---

## Progress Update Integration

### Add WebSocket Support

Create `server/src/services/import-websocket.ts`:

```typescript
import { Server as SocketServer } from 'socket.io';

export function setupImportWebSocket(io: SocketServer) {
  io.on('connection', (socket) => {
    socket.on('import:subscribe', (jobId: string) => {
      socket.join(`import:${jobId}`);
    });

    socket.on('import:unsubscribe', (jobId: string) => {
      socket.leave(`import:${jobId}`);
    });
  });
}

export function emitImportProgress(
  io: SocketServer,
  jobId: string,
  progress: any
) {
  io.to(`import:${jobId}`).emit('import:progress', {
    jobId,
    ...progress,
    timestamp: new Date().toISOString(),
  });
}
```

### Update Tier Orchestrator

Add WebSocket emission after each progress update:

```typescript
private async updateProgress(
  jobId: string,
  tier: ImportTier,
  tierSpecificProgress: number
): Promise<void> {
  const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  const tierProgress = (job.tierProgress as Record<string, any>) || {};
  const current = tierProgress[tier] || {};
  
  const processed = job.processedConversations;
  const total = job.totalConversations;
  const progress = total > 0 ? Math.round((processed / total) * 100) : 0;

  tierProgress[tier] = {
    ...current,
    status: 'PROCESSING',
    progress,
    conversationsProcessed: processed,
    totalConversations: total,
    tierSpecificProgress,
  };

  await this.prisma.importJob.update({
    where: { id: jobId },
    data: {
      tierProgress: tierProgress as any,
      processedConversations: processed,
    },
  });
}
```

---

## Database Migration

Run Prisma migration to update schema:

```bash
cd server
npx prisma migrate dev --name add_tier_import_fields
```

---

## Testing Checklist

- [ ] Upload 10MB zip file - should scan and show preview
- [ ] Select Tier 0 only - should complete quickly
- [ ] Select all tiers - should process in order
- [ ] Pause during processing - should stop at tier boundary
- [ ] Resume - should continue from where paused
- [ ] Run specific tier after completion
- [ ] Large file (100MB+) - should not cause OOM
- [ ] Check database - conversations stored correctly
- [ ] Check ACUs generated (if tier 1 enabled)
- [ ] Check memories extracted (if tier 2 enabled)

---

## File Structure Summary

```
server/
├── prisma/
│   └── schema.prisma              ✅ Updated
├── src/
│   ├── services/
│   │   ├── import-types.ts        ✅ Created
│   │   ├── streaming-import-service.ts  ✅ Created
│   │   ├── tier-orchestrator.ts  🔶 Updated (need tier handlers)
│   │   └── import-websocket.ts   ❌ Need to create
│   └── routes/
│       └── import.js              ✅ Updated

pwa/
├── src/
│   ├── types/
│   │   └── import.ts             ✅ Created
│   └── pages/
│       └── Import.tsx           ✅ Updated
```

---

## Implementation Priority

| Priority | Task | Estimated Effort |
|----------|------|-----------------|
| P0 | Implement Tier 1 (ACU) | 2 hours |
| P0 | Implement Tier 2 (Memory) | 2 hours |
| P1 | Implement Tier 3 (Context) | 3 hours |
| P1 | Implement Tier 4 (Index) | 1 hour |
| P2 | WebSocket progress | 2 hours |
| P2 | Testing & polish | 4 hours |

**Total Estimated:** ~14 hours
