

# Dynamic Context Pipeline — Layered, Pre-Generated, Bespoke

## The Core Concept: Context as a Cache Hierarchy

Think of it like CPU cache levels. Each layer has different latency, specificity, and refresh rates:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FINAL CONTEXT WINDOW (~12K tokens)               │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ L0  IDENTITY CORE                        ~300t  │ always     │  │
│  │     "Senior TS dev, building OpenScroll"         │ static     │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ L1  GLOBAL INSTRUCTIONS                  ~500t  │ always     │  │
│  │     "Concise, code-first, no hand-holding"      │ per-user   │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ L2  TOPIC CONTEXT                       ~1500t  │ pre-built  │  │
│  │     Deep knowledge about Prisma/P2P/CRDTs       │ swapped in │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ L3  RELATIONSHIP CONTEXT                ~1000t  │ pre-built  │  │
│  │     History with this person/entity/project      │ swapped in │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ L4  CONVERSATION THREAD                 ~2000t  │ dynamic    │  │
│  │     This conversation's arc, decisions, open Qs  │ per-convo  │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ L5  JUST-IN-TIME RETRIEVAL              ~2500t  │ real-time  │  │
│  │     ACUs/memories matching THIS message          │ per-msg    │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ L6  MESSAGE HISTORY                     ~3500t  │ sliding    │  │
│  │     Recent messages from this conversation       │ window     │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ L7  USER MESSAGE                         ~500t  │ instant    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Schema Additions

### Topic Profiles — What the User Engages With

```prisma
model TopicProfile {
  id          String   @id @default(uuid())
  userId      String
  
  // Topic Identity
  slug        String   // "prisma-orm", "distributed-systems", "typescript"
  label       String   // "Prisma ORM"
  aliases     String[] // ["prisma", "prisma.io", "prisma client"]
  
  // Hierarchical taxonomy
  parentSlug  String?  // "prisma-orm" → parent: "databases"
  domain      String   // "engineering", "personal", "creative", "business"
  
  // Engagement Metrics (auto-computed)
  totalConversations   Int      @default(0)
  totalAcus            Int      @default(0)
  totalMessages        Int      @default(0)
  totalTokensSpent     Int      @default(0)
  avgSessionDepth      Float    @default(0) // Avg messages per conversation on this topic
  
  // Temporal patterns
  firstEngagedAt       DateTime @db.Timestamptz
  lastEngagedAt        DateTime @db.Timestamptz
  engagementStreak     Int      @default(0)  // Consecutive days
  peakHour             Int?     // 0-23, when they usually discuss this
  
  // Skill/Knowledge level (inferred)
  proficiencyLevel     String   @default("unknown") 
  // "beginner", "intermediate", "advanced", "expert", "unknown"
  proficiencySignals   Json     @default("[]")
  // [{"signal": "asked basic question about joins", "date": "...", "direction": "down"},
  //  {"signal": "explained CRDTs to the AI", "date": "...", "direction": "up"}]
  
  // Importance Score (composite)
  importanceScore      Float    @default(0.5) // 0-1, drives pre-generation priority
  
  // Pre-built context (the compiled artifact)
  compiledContext      String?  @db.Text  // Ready-to-inject text block
  compiledAt           DateTime? @db.Timestamptz
  compiledTokenCount   Int?
  contextVersion       Int      @default(0) // Bumped on recompile
  isDirty              Boolean  @default(true) // Needs recompile
  
  // Embedding (for matching incoming messages to topics)
  embedding            Float[]
  embeddingModel       String?
  
  // Timestamps
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Linked entities
  relatedMemoryIds     String[] // Memory IDs relevant to this topic
  relatedAcuIds        String[] // Top ACU IDs for this topic
  conversations        TopicConversation[]
  
  @@unique([userId, slug])
  @@index([userId, importanceScore(sort: Desc)])
  @@index([userId, lastEngagedAt(sort: Desc)])
  @@index([userId, isDirty])
  @@index([domain])
  @@map("topic_profiles")
}

// Junction: which conversations belong to which topics
model TopicConversation {
  id              String   @id @default(uuid())
  topicId         String
  topic           TopicProfile @relation(fields: [topicId], references: [id], onDelete: Cascade)
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  relevanceScore  Float    @default(0.5) // How central this topic is to the conversation
  
  @@unique([topicId, conversationId])
  @@index([topicId])
  @@index([conversationId])
  @@map("topic_conversations")
}
```

### Entity Profiles — People, Projects, Tools the User Interacts With/About

```prisma
model EntityProfile {
  id          String   @id @default(uuid())
  userId      String
  
  // Entity Identity
  name        String   // "Sarah", "OpenScroll", "Vercel"
  type        String   // "person", "project", "organization", "tool", "concept"
  aliases     String[] // ["@sarah", "Sarah Chen", "my cofounder"]
  
  // Relationship to user
  relationship String?  // "cofounder", "manager", "client", "friend", "self"
  sentiment    Float    @default(0.0) // -1.0 to 1.0, inferred from conversations
  
  // Known facts about this entity (structured)
  facts        Json     @default("[]")
  // [{"fact": "Works at Google", "confidence": 0.9, "source": "conv:uuid"},
  //  {"fact": "Expert in Rust", "confidence": 0.7, "source": "conv:uuid"}]
  
  // Engagement metrics
  mentionCount         Int      @default(0)
  conversationCount    Int      @default(0)
  lastMentionedAt      DateTime? @db.Timestamptz
  firstMentionedAt     DateTime? @db.Timestamptz
  
  // Pre-built context
  compiledContext      String?  @db.Text
  compiledAt           DateTime? @db.Timestamptz
  compiledTokenCount   Int?
  contextVersion       Int      @default(0)
  isDirty              Boolean  @default(true)
  
  // Embedding
  embedding            Float[]
  embeddingModel       String?
  
  // Importance
  importanceScore      Float    @default(0.5)
  
  // Timestamps
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, name, type])
  @@index([userId, importanceScore(sort: Desc)])
  @@index([userId, type])
  @@index([userId, lastMentionedAt(sort: Desc)])
  @@map("entity_profiles")
}
```

### Pre-Built Context Bundles — The Cache

```prisma
model ContextBundle {
  id          String   @id @default(uuid())
  userId      String
  
  // What this bundle is FOR
  bundleType  String
  // "identity_core"     - L0, one per user
  // "global_prefs"      - L1, one per user  
  // "topic"             - L2, one per topic
  // "entity"            - L3, one per entity
  // "conversation"      - L4, one per active conversation
  // "composite"         - Pre-merged bundle for predicted interaction
  
  // Reference to what generated this bundle
  topicProfileId    String?
  entityProfileId   String?
  conversationId    String?
  personaId         String?
  
  // The compiled artifact
  compiledPrompt    String   @db.Text  // Ready-to-inject text
  tokenCount        Int
  
  // Composition metadata — what went into this bundle
  composition       Json     @default("{}")
  // { "memoryIds": [...], "acuIds": [...], "instructionIds": [...] }
  // Used for cache invalidation: if any source changes, bundle is dirty
  
  // Cache control
  version           Int      @default(1)
  isDirty           Boolean  @default(false)
  priority          Float    @default(0.5) // Higher = keep warm, recompile faster
  
  // Staleness tracking
  compiledAt        DateTime @default(now()) @db.Timestamptz
  expiresAt         DateTime? @db.Timestamptz // Hard TTL
  lastUsedAt        DateTime @default(now()) @db.Timestamptz
  useCount          Int      @default(0)
  
  // Hit tracking (for optimizing what to pre-generate)
  hitCount          Int      @default(0)  // Times this bundle was actually used
  missCount         Int      @default(0)  // Times we needed it but it was stale/missing
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, bundleType, topicProfileId, entityProfileId, conversationId, personaId])
  @@index([userId, bundleType])
  @@index([userId, priority(sort: Desc)])
  @@index([userId, isDirty])
  @@index([expiresAt])
  @@map("context_bundles")
}
```

### Client Presence Signal — What's Active on the User's Screen

```prisma
model ClientPresence {
  id              String   @id @default(uuid())
  userId          String
  deviceId        String
  
  // What's currently active/visible
  activeConversationId    String?  // Currently open conversation
  visibleConversationIds  String[] // In sidebar / recently viewed
  activeNotebookId        String?
  activePersonaId         String?
  
  // Navigation signal
  lastNavigationPath      String?  // "/chat/uuid", "/notebooks/uuid"
  navigationHistory       Json     @default("[]") // Last 10 paths with timestamps
  
  // Temporal context
  localTime               DateTime? @db.Timestamptz // User's local time
  sessionStartedAt        DateTime @default(now()) @db.Timestamptz
  idleSince               DateTime? @db.Timestamptz
  
  // Predicted next actions (computed)
  predictedTopics         String[] // Topic slugs likely to come up
  predictedEntities       String[] // Entity names likely to be discussed
  
  // Heartbeat
  lastHeartbeatAt         DateTime @default(now()) @db.Timestamptz
  isOnline                Boolean  @default(true)
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, deviceId])
  @@index([userId, isOnline])
  @@index([lastHeartbeatAt])
  @@map("client_presence")
}
```

Add all new relations to User:

```prisma
model User {
  // ... existing fields ...
  
  topicProfiles       TopicProfile[]
  entityProfiles      EntityProfile[]
  contextBundles      ContextBundle[]
  clientPresence      ClientPresence[]
}

model Conversation {
  // ... existing fields ...
  topicLinks          TopicConversation[]
}
```

---

## The Pre-Generation Engine

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (User's App)                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Presence Reporter (WebSocket / periodic POST)                      │    │
│  │                                                                     │    │
│  │  Sends: activeConversationId, visibleConversations, localTime,     │    │
│  │         navigation events, idle state                               │    │
│  └────────────────────────────────┬────────────────────────────────────┘    │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CONTEXT ORCHESTRATOR (Server)                         │
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Presence    │  │  Prediction  │  │  Bundle      │  │  Bundle      │   │
│  │  Ingester    │→ │  Engine      │→ │  Compiler    │→ │  Cache       │   │
│  │             │  │              │  │              │  │              │   │
│  │  Tracks     │  │  Scores      │  │  Builds      │  │  Stores      │   │
│  │  what user  │  │  likely next │  │  context     │  │  ready-to-   │   │
│  │  is doing   │  │  interactions│  │  bundles     │  │  use blocks  │   │
│  └─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  INVALIDATION WATCHER                                               │   │
│  │  Listens to: new memories, new ACUs, new conversations, fact edits │   │
│  │  Marks affected bundles as dirty → triggers recompile              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Prediction Engine — What Contexts to Pre-Build

```typescript
// prediction-engine.ts

interface PredictedInteraction {
  type: 'continue_conversation' | 'new_on_topic' | 'entity_related' | 'cold_start';
  conversationId?: string;
  topicSlug?: string;
  entityId?: string;
  personaId?: string;
  probability: number;     // 0-1
  requiredBundles: string[]; // Bundle types needed
}

class PredictionEngine {
  
  /**
   * Given what the user is currently doing, predict their 
   * most likely next interactions and pre-build contexts for them.
   */
  async predictNextInteractions(
    userId: string,
    presence: ClientPresence
  ): Promise<PredictedInteraction[]> {
    
    const predictions: PredictedInteraction[] = [];
    
    // ═══════════════════════════════════════════════════════
    // SIGNAL 1: Active conversation continuation (highest prob)
    // ═══════════════════════════════════════════════════════
    if (presence.activeConversationId) {
      const conv = await prisma.conversation.findUnique({
        where: { id: presence.activeConversationId },
        include: { 
          topicLinks: { include: { topic: true } },
          messages: { orderBy: { messageIndex: 'desc' }, take: 1 }
        }
      });
      
      if (conv) {
        predictions.push({
          type: 'continue_conversation',
          conversationId: conv.id,
          topicSlug: conv.topicLinks[0]?.topic.slug,
          probability: 0.85,
          requiredBundles: ['conversation', 'topic']
        });
      }
    }
    
    // ═══════════════════════════════════════════════════════
    // SIGNAL 2: Visible sidebar conversations (medium prob)
    // ═══════════════════════════════════════════════════════
    for (const convId of presence.visibleConversationIds.slice(0, 3)) {
      if (convId === presence.activeConversationId) continue;
      
      predictions.push({
        type: 'continue_conversation',
        conversationId: convId,
        probability: 0.3,
        requiredBundles: ['conversation']
      });
    }
    
    // ═══════════════════════════════════════════════════════
    // SIGNAL 3: Time-of-day topic patterns
    // ═══════════════════════════════════════════════════════
    const localHour = presence.localTime?.getHours() ?? new Date().getHours();
    
    const timeBasedTopics = await prisma.topicProfile.findMany({
      where: {
        userId,
        peakHour: localHour,
        importanceScore: { gte: 0.4 }
      },
      orderBy: { importanceScore: 'desc' },
      take: 3
    });
    
    for (const topic of timeBasedTopics) {
      predictions.push({
        type: 'new_on_topic',
        topicSlug: topic.slug,
        probability: 0.2 * topic.importanceScore,
        requiredBundles: ['topic']
      });
    }
    
    // ═══════════════════════════════════════════════════════
    // SIGNAL 4: Hot topics (recently & frequently engaged)
    // ═══════════════════════════════════════════════════════
    const hotTopics = await prisma.topicProfile.findMany({
      where: {
        userId,
        lastEngagedAt: { 
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Last 48h
        }
      },
      orderBy: [
        { engagementStreak: 'desc' },
        { importanceScore: 'desc' }
      ],
      take: 5
    });
    
    for (const topic of hotTopics) {
      if (!predictions.find(p => p.topicSlug === topic.slug)) {
        predictions.push({
          type: 'new_on_topic',
          topicSlug: topic.slug,
          probability: 0.15 * topic.importanceScore,
          requiredBundles: ['topic']
        });
      }
    }
    
    // ═══════════════════════════════════════════════════════
    // SIGNAL 5: Active entities (people/projects mentioned recently)
    // ═══════════════════════════════════════════════════════
    const hotEntities = await prisma.entityProfile.findMany({
      where: {
        userId,
        lastMentionedAt: { 
          gte: new Date(Date.now() - 72 * 60 * 60 * 1000)
        }
      },
      orderBy: { importanceScore: 'desc' },
      take: 5
    });
    
    for (const entity of hotEntities) {
      predictions.push({
        type: 'entity_related',
        entityId: entity.id,
        probability: 0.1 * entity.importanceScore,
        requiredBundles: ['entity']
      });
    }
    
    // ═══════════════════════════════════════════════════════
    // SIGNAL 6: Navigation pattern analysis
    // ═══════════════════════════════════════════════════════
    const navHistory = presence.navigationHistory as Array<{
      path: string; 
      timestamp: string;
    }>;
    
    if (navHistory.length >= 3) {
      // Detect patterns like: user keeps bouncing between 
      // notebook and chat → they're researching something
      const recentPaths = navHistory.slice(-5).map(n => n.path);
      const isResearching = recentPaths.some(p => p.includes('/notebook')) && 
                            recentPaths.some(p => p.includes('/chat'));
      
      if (isResearching) {
        // Boost knowledge retrieval depth for next interaction
        predictions.forEach(p => {
          if (p.requiredBundles) {
            p.requiredBundles.push('deep_knowledge');
          }
        });
      }
    }
    
    // Sort by probability and return top N
    return predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 8);
  }
}
```

### The Bundle Compiler — Building Context Blocks

```typescript
// bundle-compiler.ts

class BundleCompiler {
  
  // ═══════════════════════════════════════════════════════
  // L0: Identity Core — WHO is this user
  // Recompiled: rarely (on profile change, major new facts)
  // ═══════════════════════════════════════════════════════
  async compileIdentityCore(userId: string): Promise<CompiledBundle> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    const coreMemories = await prisma.memory.findMany({
      where: {
        userId,
        isActive: true,
        category: { in: ['biography', 'identity', 'role'] },
        importance: { gte: 0.8 }
      },
      orderBy: { importance: 'desc' },
      take: 15
    });
    
    const compiled = [
      `## About This User`,
      ...coreMemories.map(m => `- ${m.content}`)
    ].join('\n');
    
    return this.storeBundle(userId, 'identity_core', compiled, {
      memoryIds: coreMemories.map(m => m.id)
    });
  }

  // ═══════════════════════════════════════════════════════
  // L1: Global Preferences — HOW to respond
  // Recompiled: when instructions change
  // ═══════════════════════════════════════════════════════
  async compileGlobalPrefs(userId: string): Promise<CompiledBundle> {
    const instructions = await prisma.customInstruction.findMany({
      where: { userId, isActive: true, scope: 'global' },
      orderBy: { priority: 'desc' }
    });
    
    const prefMemories = await prisma.memory.findMany({
      where: {
        userId,
        isActive: true,
        category: 'preference',
        importance: { gte: 0.6 }
      },
      orderBy: { importance: 'desc' },
      take: 10
    });
    
    const compiled = [
      `## Response Guidelines`,
      ...instructions.map(i => `- ${i.content}`),
      ``,
      `## Known Preferences`,
      ...prefMemories.map(m => `- ${m.content}`)
    ].join('\n');
    
    return this.storeBundle(userId, 'global_prefs', compiled, {
      instructionIds: instructions.map(i => i.id),
      memoryIds: prefMemories.map(m => m.id)
    });
  }

  // ═══════════════════════════════════════════════════════
  // L2: Topic Context — deep context for a specific topic
  // Recompiled: when new conversations/ACUs on this topic
  // ═══════════════════════════════════════════════════════
  async compileTopicContext(
    userId: string, 
    topicSlug: string
  ): Promise<CompiledBundle> {
    
    const topic = await prisma.topicProfile.findUnique({
      where: { userId_slug: { userId, slug: topicSlug } },
      include: {
        conversations: {
          include: { conversation: true },
          orderBy: { relevanceScore: 'desc' },
          take: 10
        }
      }
    });
    
    if (!topic) throw new Error(`Topic ${topicSlug} not found`);
    
    // Get topic-specific memories
    const topicMemories = await prisma.memory.findMany({
      where: {
        userId,
        isActive: true,
        id: { in: topic.relatedMemoryIds }
      },
      orderBy: { importance: 'desc' }
    });
    
    // Get topic-scoped custom instructions
    const topicInstructions = await prisma.customInstruction.findMany({
      where: {
        userId,
        isActive: true,
        scope: 'topic',
        topicTags: { hasSome: [topicSlug, ...topic.aliases] }
      }
    });
    
    // Get top ACUs for this topic (semantic search using topic embedding)
    const topAcus = await prisma.$queryRaw<Array<any>>`
      SELECT content, type, "createdAt",
        1 - (embedding <=> ${topic.embedding}::vector) as similarity
      FROM atomic_chat_units
      WHERE "authorDid" = (SELECT did FROM users WHERE id = ${userId})
        AND state = 'ACTIVE'
        AND 1 - (embedding <=> ${topic.embedding}::vector) > 0.4
      ORDER BY embedding <=> ${topic.embedding}::vector
      LIMIT 20
    `;
    
    // Get conversation summaries (not full messages, just the arc)
    const conversationSummaries = await this.summarizeConversations(
      topic.conversations.map(tc => tc.conversation)
    );
    
    const compiled = [
      `## Topic Context: ${topic.label}`,
      `User's level: ${topic.proficiencyLevel}`,
      `Engagement: ${topic.totalConversations} conversations, ` +
        `last engaged ${this.timeAgo(topic.lastEngagedAt)}`,
      ``,
      ...(topicInstructions.length > 0 ? [
        `### Topic-Specific Instructions`,
        ...topicInstructions.map(i => `- ${i.content}`),
        ``
      ] : []),
      ...(topicMemories.length > 0 ? [
        `### What You Know (${topic.label})`,
        ...topicMemories.map(m => `- ${m.content}`),
        ``
      ] : []),
      ...(conversationSummaries.length > 0 ? [
        `### Previous Discussions`,
        ...conversationSummaries.map(s => `- ${s}`),
        ``
      ] : []),
      ...(topAcus.length > 0 ? [
        `### Key Knowledge Points`,
        ...topAcus.slice(0, 10).map((a: any) => `- ${a.content}`),
      ] : [])
    ].join('\n');
    
    // Update the TopicProfile's compiled context too
    await prisma.topicProfile.update({
      where: { id: topic.id },
      data: { 
        compiledContext: compiled,
        compiledAt: new Date(),
        compiledTokenCount: this.estimateTokens(compiled),
        isDirty: false,
        contextVersion: { increment: 1 }
      }
    });
    
    return this.storeBundle(userId, 'topic', compiled, {
      memoryIds: topicMemories.map(m => m.id),
      acuIds: topAcus.map((a: any) => a.id),
      instructionIds: topicInstructions.map(i => i.id),
    }, topic.id);
  }

  // ═══════════════════════════════════════════════════════
  // L3: Entity/Relationship Context
  // ═══════════════════════════════════════════════════════
  async compileEntityContext(
    userId: string, 
    entityId: string
  ): Promise<CompiledBundle> {
    
    const entity = await prisma.entityProfile.findUnique({
      where: { id: entityId }
    });
    
    if (!entity) throw new Error(`Entity ${entityId} not found`);
    
    const facts = entity.facts as Array<{
      fact: string; 
      confidence: number;
    }>;
    
    // Find conversations mentioning this entity
    const relatedAcus = await prisma.$queryRaw<Array<any>>`
      SELECT content, type, "createdAt",
        1 - (embedding <=> ${entity.embedding}::vector) as similarity
      FROM atomic_chat_units
      WHERE "authorDid" = (SELECT did FROM users WHERE id = ${userId})
        AND state = 'ACTIVE'
        AND 1 - (embedding <=> ${entity.embedding}::vector) > 0.45
      ORDER BY embedding <=> ${entity.embedding}::vector
      LIMIT 15
    `;
    
    const compiled = [
      `## Context: ${entity.name} (${entity.type})`,
      entity.relationship ? `Relationship: ${entity.relationship}` : '',
      ``,
      `### Known Facts`,
      ...facts
        .filter(f => f.confidence > 0.5)
        .map(f => `- ${f.fact}`),
      ``,
      ...(relatedAcus.length > 0 ? [
        `### Relevant History`,
        ...relatedAcus.slice(0, 8).map((a: any) => `- ${a.content}`)
      ] : [])
    ].filter(Boolean).join('\n');
    
    return this.storeBundle(userId, 'entity', compiled, {
      acuIds: relatedAcus.map((a: any) => a.id)
    }, undefined, entityId);
  }

  // ═══════════════════════════════════════════════════════
  // L4: Conversation Thread Context
  // The "arc" of this specific conversation
  // ═══════════════════════════════════════════════════════
  async compileConversationContext(
    userId: string, 
    conversationId: string
  ): Promise<CompiledBundle> {
    
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { messageIndex: 'asc' } },
        topicLinks: { include: { topic: true } }
      }
    });
    
    if (!conv) throw new Error(`Conversation ${conversationId} not found`);
    
    // For long conversations, we need to summarize the history
    // rather than including all messages
    const summary = await this.generateConversationArc(conv);
    
    const compiled = [
      `## Current Conversation Context`,
      `Title: ${conv.title}`,
      `Started: ${this.timeAgo(conv.createdAt)}`,
      `Messages so far: ${conv.messageCount}`,
      conv.topicLinks.length > 0 
        ? `Topics: ${conv.topicLinks.map(tl => tl.topic.label).join(', ')}`
        : '',
      ``,
      `### Conversation Arc`,
      summary.arc,
      ``,
      ...(summary.openQuestions.length > 0 ? [
        `### Unresolved Questions`,
        ...summary.openQuestions.map(q => `- ${q}`),
        ``
      ] : []),
      ...(summary.decisions.length > 0 ? [
        `### Decisions Made`,
        ...summary.decisions.map(d => `- ${d}`),
      ] : []),
      ...(summary.currentFocus ? [
        ``,
        `### Current Focus`,
        summary.currentFocus
      ] : [])
    ].filter(Boolean).join('\n');
    
    return this.storeBundle(userId, 'conversation', compiled, {}, 
      undefined, undefined, conversationId);
  }

  // ═══════════════════════════════════════════════════════
  // Conversation Arc Generator (uses LLM for compression)
  // ═══════════════════════════════════════════════════════
  private async generateConversationArc(conv: any): Promise<{
    arc: string;
    openQuestions: string[];
    decisions: string[];
    currentFocus: string | null;
  }> {
    // For short conversations, just summarize directly
    if (conv.messages.length <= 6) {
      return {
        arc: conv.messages
          .map((m: any) => `${m.role}: ${this.truncate(this.extractText(m.parts), 100)}`)
          .join('\n'),
        openQuestions: [],
        decisions: [],
        currentFocus: null
      };
    }
    
    // For longer conversations, use LLM to extract the arc
    const messagesText = conv.messages
      .map((m: any) => `[${m.role}]: ${this.extractText(m.parts)}`)
      .join('\n\n');
    
    const response = await llm.chat({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `Analyze this conversation and extract its arc. Return JSON:
{
  "arc": "2-3 sentence summary of how the conversation progressed",
  "openQuestions": ["questions raised but not yet answered"],
  "decisions": ["concrete decisions or conclusions reached"],
  "currentFocus": "what the conversation is currently about (last few messages)"
}
Be concise. This will be injected into a future prompt as context.`
      }, {
        role: 'user',
        content: messagesText
      }],
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.content);
  }

  // ═══════════════════════════════════════════════════════
  // Bundle Storage
  // ═══════════════════════════════════════════════════════
  private async storeBundle(
    userId: string,
    bundleType: string,
    compiled: string,
    composition: Record<string, string[]>,
    topicProfileId?: string,
    entityProfileId?: string,
    conversationId?: string
  ): Promise<CompiledBundle> {
    
    return prisma.contextBundle.upsert({
      where: {
        userId_bundleType_topicProfileId_entityProfileId_conversationId_personaId: {
          userId,
          bundleType,
          topicProfileId: topicProfileId ?? null,
          entityProfileId: entityProfileId ?? null,
          conversationId: conversationId ?? null,
          personaId: null
        }
      },
      update: {
        compiledPrompt: compiled,
        tokenCount: this.estimateTokens(compiled),
        composition,
        isDirty: false,
        version: { increment: 1 },
        compiledAt: new Date()
      },
      create: {
        userId,
        bundleType,
        compiledPrompt: compiled,
        tokenCount: this.estimateTokens(compiled),
        composition,
        topicProfileId,
        entityProfileId,
        conversationId,
      }
    });
  }
}
```

### The Pre-Generation Worker — Background Process

```typescript
// context-warmup.ts
// Runs on: presence update, post-conversation, periodic timer

class ContextWarmupWorker {
  
  /**
   * Main entry point — called when client sends presence update
   */
  async onPresenceUpdate(userId: string, presence: ClientPresence) {
    const predictor = new PredictionEngine();
    const compiler = new BundleCompiler();
    
    // 1. Predict likely next interactions
    const predictions = await predictor.predictNextInteractions(userId, presence);
    
    // 2. Ensure L0 and L1 are fresh (always needed)
    await this.ensureFresh(userId, 'identity_core', 
      () => compiler.compileIdentityCore(userId));
    await this.ensureFresh(userId, 'global_prefs', 
      () => compiler.compileGlobalPrefs(userId));
    
    // 3. Pre-build bundles for predicted interactions
    for (const prediction of predictions) {
      if (prediction.probability < 0.1) continue; // Not worth pre-building
      
      try {
        if (prediction.conversationId) {
          await this.ensureFresh(
            userId, 'conversation',
            () => compiler.compileConversationContext(userId, prediction.conversationId!),
            prediction.conversationId
          );
        }
        
        if (prediction.topicSlug) {
          await this.ensureFresh(
            userId, 'topic',
            () => compiler.compileTopicContext(userId, prediction.topicSlug!),
            prediction.topicSlug
          );
        }
        
        if (prediction.entityId) {
          await this.ensureFresh(
            userId, 'entity',
            () => compiler.compileEntityContext(userId, prediction.entityId!),
            prediction.entityId
          );
        }
      } catch (e) {
        console.error(`Failed to pre-build bundle for prediction`, prediction, e);
      }
    }
    
    // 4. Store predictions for later use by the assembler
    await prisma.clientPresence.update({
      where: { userId_deviceId: { userId, deviceId: presence.deviceId } },
      data: {
        predictedTopics: predictions
          .filter(p => p.topicSlug)
          .map(p => p.topicSlug!),
        predictedEntities: predictions
          .filter(p => p.entityId)
          .map(p => p.entityId!)
      }
    });
  }

  /**
   * Check if a bundle exists and is fresh; if not, recompile
   */
  private async ensureFresh(
    userId: string,
    bundleType: string,
    compileFn: () => Promise<any>,
    referenceId?: string
  ) {
    const existing = await prisma.contextBundle.findFirst({
      where: {
        userId,
        bundleType,
        OR: [
          { topicProfileId: referenceId },
          { entityProfileId: referenceId },
          { conversationId: referenceId },
          // For identity_core/global_prefs, referenceId is undefined
          ...(referenceId ? [] : [{
            topicProfileId: null,
            entityProfileId: null,
            conversationId: null
          }])
        ]
      }
    });
    
    const needsRecompile = !existing || 
      existing.isDirty || 
      (existing.expiresAt && existing.expiresAt < new Date()) ||
      (Date.now() - existing.compiledAt.getTime() > this.getTTL(bundleType));
    
    if (needsRecompile) {
      await compileFn();
    }
  }

  private getTTL(bundleType: string): number {
    const ttls: Record<string, number> = {
      'identity_core': 24 * 60 * 60 * 1000,  // 24 hours
      'global_prefs': 12 * 60 * 60 * 1000,   // 12 hours
      'topic': 4 * 60 * 60 * 1000,            // 4 hours
      'entity': 6 * 60 * 60 * 1000,           // 6 hours
      'conversation': 30 * 60 * 1000,          // 30 minutes (conversations move fast)
    };
    return ttls[bundleType] ?? 60 * 60 * 1000;
  }
}
```

---

## The Runtime Assembler — Putting It All Together

This replaces the simpler assembler from before. It **grabs pre-built bundles and only does real-time work for L5**:

```typescript
// context-assembler-v2.ts

class DynamicContextAssembler {
  
  async assemble(params: {
    userId: string;
    conversationId: string;
    userMessage: string;
    personaId?: string;
    deviceId?: string;
  }): Promise<AssembledContext> {
    
    const startTime = Date.now();
    
    // ═══════════════════════════════════════════════════════
    // STEP 1: Detect what this message is about
    // (Fast — embedding + topic match, ~20ms)
    // ═══════════════════════════════════════════════════════
    const messageEmbedding = await this.embed(params.userMessage);
    const detectedContext = await this.detectMessageContext(
      params.userId, 
      params.userMessage, 
      messageEmbedding,
      params.conversationId
    );
    
    // ═══════════════════════════════════════════════════════
    // STEP 2: Grab pre-built bundles (cache hits, ~5ms each)
    // ═══════════════════════════════════════════════════════
    const bundles = await this.gatherBundles(
      params.userId,
      detectedContext,
      params.conversationId,
      params.personaId
    );
    
    // ═══════════════════════════════════════════════════════
    // STEP 3: Real-time L5 retrieval (only thing that must
    // happen at request time, ~50-100ms)
    // ═══════════════════════════════════════════════════════
    const jitKnowledge = await this.justInTimeRetrieval(
      params.userId,
      params.userMessage,
      messageEmbedding,
      detectedContext
    );
    
    // ═══════════════════════════════════════════════════════
    // STEP 4: Compile final prompt within token budget
    // ═══════════════════════════════════════════════════════
    const budget = this.computeBudget(bundles, jitKnowledge);
    const systemPrompt = this.compilePrompt(bundles, jitKnowledge, budget);
    
    // ═══════════════════════════════════════════════════════
    // STEP 5: Track bundle usage (for optimization)
    // ═══════════════════════════════════════════════════════
    this.trackUsage(bundles);
    
    console.log(`Context assembled in ${Date.now() - startTime}ms`);
    console.log(`Bundles used: ${bundles.map(b => b.bundleType).join(', ')}`);
    console.log(`Total tokens: ${budget.totalUsed}/${budget.totalAvailable}`);
    
    return { systemPrompt, budget };
  }

  // ═══════════════════════════════════════════════════════
  // Context Detection — what is this message about?
  // ═══════════════════════════════════════════════════════
  private async detectMessageContext(
    userId: string,
    message: string,
    embedding: Float[],
    conversationId: string
  ): Promise<DetectedContext> {
    
    // Match against topic profiles (vector similarity)
    const matchedTopics = await prisma.$queryRaw<Array<{
      id: string;
      slug: string;
      label: string;
      similarity: number;
    }>>`
      SELECT id, slug, label,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM topic_profiles
      WHERE "userId" = ${userId}
        AND 1 - (embedding <=> ${embedding}::vector) > 0.35
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT 3
    `;
    
    // Match against entity profiles
    const matchedEntities = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      type: string;
      similarity: number;
    }>>`
      SELECT id, name, type,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM entity_profiles
      WHERE "userId" = ${userId}
        AND 1 - (embedding <=> ${embedding}::vector) > 0.4
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT 3
    `;
    
    // Also check for explicit entity mentions (string matching for speed)
    const allEntities = await prisma.entityProfile.findMany({
      where: { userId },
      select: { id: true, name: true, aliases: true, type: true }
    });
    
    const mentionedEntities = allEntities.filter(e => {
      const names = [e.name.toLowerCase(), ...e.aliases.map(a => a.toLowerCase())];
      const msgLower = message.toLowerCase();
      return names.some(n => msgLower.includes(n));
    });
    
    // Merge semantic + explicit matches
    const entities = this.mergeEntityMatches(matchedEntities, mentionedEntities);
    
    // Get conversation's existing topic links
    const convTopics = await prisma.topicConversation.findMany({
      where: { conversationId },
      include: { topic: true }
    });
    
    return {
      topics: [
        ...convTopics.map(ct => ({ 
          slug: ct.topic.slug, 
          profileId: ct.topic.id,
          source: 'conversation_history' as const,
          confidence: ct.relevanceScore 
        })),
        ...matchedTopics.map(t => ({ 
          slug: t.slug, 
          profileId: t.id,
          source: 'semantic_match' as const,
          confidence: t.similarity 
        }))
      ],
      entities,
      isNewTopic: matchedTopics.length === 0 && convTopics.length === 0,
      isContinuation: convTopics.length > 0,
    };
  }

  // ═══════════════════════════════════════════════════════
  // Bundle Gathering — grab what's pre-built
  // ═══════════════════════════════════════════════════════
  private async gatherBundles(
    userId: string,
    context: DetectedContext,
    conversationId: string,
    personaId?: string
  ): Promise<ContextBundle[]> {
    
    const bundles: ContextBundle[] = [];
    
    // L0: Identity Core (always)
    const identity = await this.getBundle(userId, 'identity_core');
    if (identity) bundles.push(identity);
    
    // L1: Global Prefs (always)
    const prefs = await this.getBundle(userId, 'global_prefs');
    if (prefs) bundles.push(prefs);
    
    // L2: Topic Context (if topic detected)
    if (context.topics.length > 0) {
      // Get the most relevant topic's bundle
      const primaryTopic = context.topics
        .sort((a, b) => b.confidence - a.confidence)[0];
      
      const topicBundle = await prisma.contextBundle.findFirst({
        where: {
          userId,
          bundleType: 'topic',
          topicProfileId: primaryTopic.profileId,
          isDirty: false
        }
      });
      
      if (topicBundle) {
        bundles.push(topicBundle);
      } else {
        // Cache miss — compile on-the-fly (slower but correct)
        const compiler = new BundleCompiler();
        const freshBundle = await compiler.compileTopicContext(
          userId, primaryTopic.slug
        );
        bundles.push(freshBundle);
        
        // Track the miss for optimization
        this.recordCacheMiss('topic', primaryTopic.slug);
      }
      
      // Secondary topic (if budget allows, lower priority)
      if (context.topics.length > 1) {
        const secondaryTopic = context.topics[1];
        const secondaryBundle = await prisma.contextBundle.findFirst({
          where: {
            userId,
            bundleType: 'topic',
            topicProfileId: secondaryTopic.profileId,
            isDirty: false
          }
        });
        if (secondaryBundle) bundles.push(secondaryBundle);
      }
    }
    
    // L3: Entity Context (if entities detected)
    for (const entity of context.entities.slice(0, 2)) {
      const entityBundle = await prisma.contextBundle.findFirst({
        where: {
          userId,
          bundleType: 'entity',
          entityProfileId: entity.id,
          isDirty: false
        }
      });
      if (entityBundle) bundles.push(entityBundle);
    }
    
    // L4: Conversation Context (if continuing)
    if (context.isContinuation) {
      const convBundle = await prisma.contextBundle.findFirst({
        where: {
          userId,
          bundleType: 'conversation',
          conversationId,
          isDirty: false
        }
      });
      if (convBundle) bundles.push(convBundle);
    }
    
    return bundles;
  }

  // ═══════════════════════════════════════════════════════
  // L5: Just-In-Time Retrieval — the only real-time work
  // ═══════════════════════════════════════════════════════
  private async justInTimeRetrieval(
    userId: string,
    message: string,
    embedding: Float[],
    context: DetectedContext
  ): Promise<JITKnowledge> {
    
    // Parallel retrieval for speed
    const [semanticAcus, semanticMemories] = await Promise.all([
      // ACUs semantically similar to the message
      prisma.$queryRaw<Array<any>>`
        SELECT id, content, type, category, "createdAt",
          1 - (embedding <=> ${embedding}::vector) as similarity
        FROM atomic_chat_units
        WHERE "authorDid" = (SELECT did FROM users WHERE id = ${userId})
          AND state = 'ACTIVE'
          AND 1 - (embedding <=> ${embedding}::vector) > 0.35
          -- Exclude ACUs already covered by topic bundles
          ${context.topics.length > 0 ? Prisma.sql`
            AND id NOT IN (
              SELECT unnest("relatedAcuIds") 
              FROM topic_profiles 
              WHERE "userId" = ${userId} 
                AND slug IN (${Prisma.join(context.topics.map(t => t.slug))})
            )
          ` : Prisma.empty}
        ORDER BY embedding <=> ${embedding}::vector
        LIMIT 10
      `,
      
      // Memories semantically similar but not already in bundles
      prisma.$queryRaw<Array<any>>`
        SELECT id, content, category, importance,
          1 - (embedding <=> ${embedding}::vector) as similarity
        FROM memories
        WHERE "userId" = ${userId}
          AND "isActive" = true
          AND importance < 0.8  -- High importance ones already in L0/L1
          AND 1 - (embedding <=> ${embedding}::vector) > 0.4
        ORDER BY embedding <=> ${embedding}::vector
        LIMIT 8
      `
    ]);
    
    return { acus: semanticAcus, memories: semanticMemories };
  }

  // ═══════════════════════════════════════════════════════
  // Final Prompt Compilation — Tetris into token budget
  // ═══════════════════════════════════════════════════════
  private compilePrompt(
    bundles: ContextBundle[],
    jit: JITKnowledge,
    budget: TokenBudget
  ): string {
    
    const sections: Array<{ content: string; priority: number; tokens: number }> = [];
    
    // Add bundles with priority ordering
    const priorityMap: Record<string, number> = {
      'identity_core': 100,
      'global_prefs': 95,
      'conversation': 90,  // Current conversation context is critical
      'topic': 80,
      'entity': 70,
    };
    
    for (const bundle of bundles) {
      sections.push({
        content: bundle.compiledPrompt,
        priority: priorityMap[bundle.bundleType] ?? 50,
        tokens: bundle.tokenCount
      });
    }
    
    // Add JIT knowledge
    if (jit.memories.length > 0) {
      const memBlock = [
        `## Additionally Relevant Context`,
        ...jit.memories.map((m: any) => `- [${m.category}] ${m.content}`)
      ].join('\n');
      sections.push({ 
        content: memBlock, 
        priority: 60, 
        tokens: this.estimateTokens(memBlock) 
      });
    }
    
    if (jit.acus.length > 0) {
      const acuBlock = [
        `## Related Knowledge`,
        ...jit.acus.map((a: any) => `- ${a.content}`)
      ].join('\n');
      sections.push({ 
        content: acuBlock, 
        priority: 55, 
        tokens: this.estimateTokens(acuBlock) 
      });
    }
    
    // Sort by priority and fit within budget
    sections.sort((a, b) => b.priority - a.priority);
    
    let totalTokens = 0;
    const included: string[] = [];
    
    for (const section of sections) {
      if (totalTokens + section.tokens > budget.systemPromptMax) {
        // Try to truncate rather than skip entirely
        const remaining = budget.systemPromptMax - totalTokens;
        if (remaining > 100) {
          included.push(this.truncateToTokens(section.content, remaining));
          totalTokens += remaining;
        }
        break;
      }
      included.push(section.content);
      totalTokens += section.tokens;
    }
    
    return included.join('\n\n---\n\n');
  }
}
```

---

## The Invalidation System — Keeping Bundles Fresh

```typescript
// invalidation-watcher.ts

class InvalidationWatcher {
  
  /**
   * Called after memory extraction, ACU creation, 
   * instruction changes, etc.
   */
  async onMemoryCreated(memory: Memory) {
    // Find which bundles this memory affects
    
    // Always dirty identity_core if it's a core fact
    if (['biography', 'identity', 'role'].includes(memory.category) 
        && memory.importance >= 0.8) {
      await this.markDirty(memory.userId, 'identity_core');
    }
    
    // Always dirty global_prefs if it's a preference
    if (memory.category === 'preference' && memory.importance >= 0.6) {
      await this.markDirty(memory.userId, 'global_prefs');
    }
    
    // Find topic bundles that reference this memory
    const affectedTopics = await prisma.topicProfile.findMany({
      where: {
        userId: memory.userId,
        relatedMemoryIds: { has: memory.id }
      }
    });
    
    for (const topic of affectedTopics) {
      await this.markDirty(memory.userId, 'topic', topic.id);
    }
  }
  
  async onAcuCreated(acu: AtomicChatUnit) {
    // Find topic profiles where this ACU is semantically relevant
    const matchedTopics = await prisma.$queryRaw<Array<any>>`
      SELECT id, slug FROM topic_profiles
      WHERE "userId" = (SELECT id FROM users WHERE did = ${acu.authorDid})
        AND 1 - (embedding <=> ${acu.embedding}::vector) > 0.5
    `;
    
    for (const topic of matchedTopics) {
      await this.markDirty(acu.authorDid, 'topic', topic.id);
      
      // Also add this ACU to the topic's related ACUs
      await prisma.topicProfile.update({
        where: { id: topic.id },
        data: {
          relatedAcuIds: { push: acu.id },
          totalAcus: { increment: 1 },
          isDirty: true
        }
      });
    }
  }
  
  async onConversationMessage(conversationId: string, userId: string) {
    // Conversation bundles go stale on every message
    await this.markDirty(userId, 'conversation', undefined, undefined, conversationId);
  }
  
  async onInstructionChanged(userId: string) {
    await this.markDirty(userId, 'global_prefs');
    // Topic-scoped instructions also dirty those topic bundles
    // ... (similar pattern)
  }
  
  private async markDirty(
    userId: string, 
    bundleType: string,
    topicProfileId?: string,
    entityProfileId?: string,
    conversationId?: string
  ) {
    await prisma.contextBundle.updateMany({
      where: {
        userId,
        bundleType,
        ...(topicProfileId ? { topicProfileId } : {}),
        ...(entityProfileId ? { entityProfileId } : {}),
        ...(conversationId ? { conversationId } : {})
      },
      data: { isDirty: true }
    });
  }
}
```

---

## The Topic & Entity Detection Pipeline

This runs **post-conversation** to keep profiles up to date:

```typescript
// profile-updater.ts

class ProfileUpdater {
  
  /**
   * After each conversation turn, detect and update topic/entity profiles
   */
  async updateFromConversation(
    userId: string,
    conversationId: string,
    userMessage: string,
    aiResponse: string
  ) {
    // Use LLM to extract topics and entities
    const extraction = await this.extractTopicsAndEntities(
      userMessage, aiResponse
    );
    
    // ── Update Topic Profiles ──
    for (const topic of extraction.topics) {
      await prisma.topicProfile.upsert({
        where: { userId_slug: { userId, slug: topic.slug } },
        update: {
          totalConversations: { increment: 1 },
          totalMessages: { increment: 2 },
          lastEngagedAt: new Date(),
          isDirty: true,
          importanceScore: topic.importance,
          ...(topic.proficiencySignal ? {
            proficiencySignals: {
              // Append new signal
              push: topic.proficiencySignal
            }
          } : {})
        },
        create: {
          userId,
          slug: topic.slug,
          label: topic.label,
          aliases: topic.aliases ?? [],
          domain: topic.domain,
          firstEngagedAt: new Date(),
          lastEngagedAt: new Date(),
          totalConversations: 1,
          totalMessages: 2,
          importanceScore: topic.importance,
          embedding: await this.embed(topic.label + ' ' + topic.description),
          isDirty: true,
          proficiencyLevel: 'unknown',
        }
      });
      
      // Link conversation to topic
      await prisma.topicConversation.upsert({
        where: { 
          topicId_conversationId: {
            topicId: (await prisma.topicProfile.findUnique({ 
              where: { userId_slug: { userId, slug: topic.slug } } 
            }))!.id,
            conversationId
          }
        },
        update: { relevanceScore: topic.relevance },
        create: {
          topicId: (await prisma.topicProfile.findUnique({ 
            where: { userId_slug: { userId, slug: topic.slug } } 
          }))!.id,
          conversationId,
          relevanceScore: topic.relevance
        }
      });
    }
    
    // ── Update Entity Profiles ──
    for (const entity of extraction.entities) {
      await prisma.entityProfile.upsert({
        where: {
          userId_name_type: { userId, name: entity.name, type: entity.type }
        },
        update: {
          mentionCount: { increment: 1 },
          lastMentionedAt: new Date(),
          isDirty: true,
          ...(entity.newFacts.length > 0 ? {
            facts: {
              // Merge new facts with existing
              // (handled in application logic)
            }
          } : {})
        },
        create: {
          userId,
          name: entity.name,
          type: entity.type,
          aliases: entity.aliases ?? [],
          relationship: entity.relationship,
          facts: entity.newFacts.map(f => ({ 
            fact: f, 
            confidence: 0.7, 
            source: `conv:${conversationId}` 
          })),
          mentionCount: 1,
          firstMentionedAt: new Date(),
          lastMentionedAt: new Date(),
          embedding: await this.embed(entity.name + ' ' + entity.type),
          importanceScore: entity.importance,
          isDirty: true,
        }
      });
    }
  }

  private async extractTopicsAndEntities(
    userMessage: string, 
    aiResponse: string
  ) {
    const response = await llm.chat({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `Extract topics and entities from this conversation turn.

Return JSON:
{
  "topics": [{
    "slug": "prisma-orm",
    "label": "Prisma ORM",
    "aliases": ["prisma"],
    "domain": "engineering",
    "description": "Database ORM for TypeScript",
    "importance": 0.8,
    "relevance": 0.9,
    "proficiencySignal": {"signal": "asked advanced question about raw queries", "direction": "up"} 
  }],
  "entities": [{
    "name": "Sarah",
    "type": "person",
    "aliases": ["@sarah"],
    "relationship": "cofounder",
    "importance": 0.7,
    "newFacts": ["Working on the auth system this week"]
  }]
}

Rules:
- slug should be lowercase-hyphenated
- domain: "engineering", "personal", "creative", "business", "health", "finance"
- Only include proficiencySignal if there's a clear signal of skill level
- Be conservative with entities — only extract clearly referenced ones`
      }, {
        role: 'user',
        content: `User: "${userMessage}"\n\nAI: "${aiResponse}"`
      }],
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.content);
  }
}
```

---

## Client-Side Presence Reporter

```typescript
// client: presence-reporter.ts

class PresenceReporter {
  private interval: Timer | null = null;
  private lastReport: ClientPresencePayload | null = null;
  
  start() {
    // Report immediately on meaningful events
    this.reportOnNavigate();
    this.reportOnConversationSwitch();
    
    // Heartbeat every 30 seconds
    this.interval = setInterval(() => this.report(), 30_000);
  }
  
  private async report() {
    const payload: ClientPresencePayload = {
      deviceId: getDeviceId(),
      activeConversationId: store.chat.activeConversationId,
      visibleConversationIds: store.sidebar.visibleConversationIds,
      activeNotebookId: store.notebook.activeId,
      activePersonaId: store.chat.activePersonaId,
      lastNavigationPath: router.currentRoute.path,
      navigationHistory: router.history.slice(-10),
      localTime: new Date().toISOString(),
    };
    
    // Only send if something changed
    if (this.hasChanged(payload)) {
      await api.post('/api/presence', payload);
      this.lastReport = payload;
    }
  }
  
  private hasChanged(payload: ClientPresencePayload): boolean {
    if (!this.lastReport) return true;
    return payload.activeConversationId !== this.lastReport.activeConversationId
      || payload.activePersonaId !== this.lastReport.activePersonaId
      || payload.lastNavigationPath !== this.lastReport.lastNavigationPath;
  }
}
```

---

## Performance Characteristics

```
┌──────────────────────────────────────────────────────────────────────┐
│                     LATENCY BREAKDOWN                                │
│                                                                      │
│  WITHOUT pre-generation (naive approach):                           │
│  ├── Embed user message .................... 30ms                    │
│  ├── Retrieve memories (semantic) .......... 50ms                   │
│  ├── Retrieve ACUs (semantic) .............. 50ms                   │
│  ├── Load custom instructions .............. 10ms                   │
│  ├── Summarize conversation arc (LLM!) ..... 800ms  ← SLOW         │
│  ├── Compile topic context (LLM!) .......... 600ms  ← SLOW         │
│  └── Assemble prompt ...................... 5ms                     │
│  TOTAL: ~1500ms before LLM call even starts                        │
│                                                                      │
│  WITH pre-generation (this design):                                 │
│  ├── Embed user message .................... 30ms                   │
│  ├── Detect topics/entities (vector) ....... 15ms                   │
│  ├── Fetch pre-built bundles (DB reads) .... 10ms  ← CACHED        │
│  ├── L5 JIT retrieval (semantic) ........... 50ms  ← Only new work │
│  └── Assemble prompt ...................... 5ms                     │
│  TOTAL: ~110ms — 13x faster                                        │
│                                                                      │
│  Cache miss (bundle dirty/missing):                                 │
│  └── Compile on-the-fly ................... +300-800ms              │
│      (but this happens in background next time)                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Summary: The Full Data Flow

```
User opens app
    │
    ├── Presence Reporter starts sending signals
    │       │
    │       ▼
    │   Prediction Engine scores likely next interactions
    │       │
    │       ▼
    │   Bundle Compiler pre-builds L2/L3/L4 for top predictions
    │       │
    │       ▼
    │   Bundles cached in context_bundles table
    │
User sends message
    │
    ├── Detect: topics, entities, conversation state (~15ms)
    ├── Fetch: pre-built bundles L0-L4 (~10ms, cache hits)
    ├── Retrieve: L5 JIT knowledge (~50ms, only novel work)
    ├── Compile: final system prompt (Tetris into budget)
    ├── Call LLM with fully assembled context
    │
    ▼
AI responds with full awareness of:
    ✓ Who the user is (L0)
    ✓ How they want responses (L1)
    ✓ Deep topic expertise history (L2)
    ✓ People/projects being discussed (L3)
    ✓ This conversation's arc and decisions (L4)
    ✓ Semantically relevant knowledge (L5)
    ✓ Recent message history (L6)
    │
    ▼
Post-response pipeline (async):
    ├── Extract new memories
    ├── Update topic profiles
    ├── Update entity profiles
    ├── Invalidate affected bundles
    └── Generate ACUs for knowledge graph
```

The user experiences an AI that "just knows" — but underneath it's a carefully orchestrated caching and retrieval system where the expensive work happened before they even typed.
