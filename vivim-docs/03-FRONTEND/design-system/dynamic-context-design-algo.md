

# Dynamic Context Pipeline — Token Budget Algorithms

## The Core Problem

You have a user-configurable context window (up to 50K tokens) that must be shared between:
1. The system prompt layers (L0–L5)
2. The conversation history (L6) — which might itself be massive
3. The user's current message (L7)

The key tension: **a fresh session continuing a 200-message conversation** needs both deep conversation context AND the rich knowledge layers. They compete for the same budget.

---

## Schema Additions (to your existing schema)

```prisma
// ============================================================================
// CONTEXT PIPELINE — Dynamic Budget & Topic/Entity Profiles
// ============================================================================

model TopicProfile {
  id          String   @id @default(uuid())
  userId      String
  
  // Topic Identity
  slug        String   // "prisma-orm", "distributed-systems"
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
  avgSessionDepth      Float    @default(0)
  
  // Temporal patterns
  firstEngagedAt       DateTime @db.Timestamptz
  lastEngagedAt        DateTime @db.Timestamptz
  engagementStreak     Int      @default(0)
  peakHour             Int?     // 0-23
  
  // Skill/Knowledge level (inferred)
  proficiencyLevel     String   @default("unknown")
  proficiencySignals   Json     @default("[]")
  
  // Importance Score (composite)
  importanceScore      Float    @default(0.5) // 0-1
  
  // Pre-built context
  compiledContext      String?  @db.Text
  compiledAt           DateTime? @db.Timestamptz
  compiledTokenCount   Int?
  contextVersion       Int      @default(0)
  isDirty              Boolean  @default(true)
  
  // Embedding
  embedding            Float[]
  embeddingModel       String?
  
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  relatedMemoryIds     String[]
  relatedAcuIds        String[]
  conversations        TopicConversation[]
  contextBundles       ContextBundle[] @relation("TopicBundles")
  
  @@unique([userId, slug])
  @@index([userId, importanceScore(sort: Desc)])
  @@index([userId, lastEngagedAt(sort: Desc)])
  @@index([userId, isDirty])
  @@index([domain])
  @@map("topic_profiles")
}

model TopicConversation {
  id              String   @id @default(uuid())
  topicId         String
  topic           TopicProfile @relation(fields: [topicId], references: [id], onDelete: Cascade)
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  relevanceScore  Float    @default(0.5)
  
  @@unique([topicId, conversationId])
  @@index([topicId])
  @@index([conversationId])
  @@map("topic_conversations")
}

model EntityProfile {
  id          String   @id @default(uuid())
  userId      String
  
  name        String   // "Sarah", "OpenScroll", "Vercel"
  type        String   // "person", "project", "organization", "tool", "concept"
  aliases     String[] // ["@sarah", "Sarah Chen", "my cofounder"]
  
  relationship String? // "cofounder", "manager", "client", "friend"
  sentiment    Float   @default(0.0) // -1.0 to 1.0
  
  facts        Json    @default("[]")
  
  mentionCount         Int      @default(0)
  conversationCount    Int      @default(0)
  lastMentionedAt      DateTime? @db.Timestamptz
  firstMentionedAt     DateTime? @db.Timestamptz
  
  compiledContext      String?  @db.Text
  compiledAt           DateTime? @db.Timestamptz
  compiledTokenCount   Int?
  contextVersion       Int      @default(0)
  isDirty              Boolean  @default(true)
  
  embedding            Float[]
  embeddingModel       String?
  
  importanceScore      Float    @default(0.5)
  
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  contextBundles       ContextBundle[] @relation("EntityBundles")
  
  @@unique([userId, name, type])
  @@index([userId, importanceScore(sort: Desc)])
  @@index([userId, type])
  @@index([userId, lastMentionedAt(sort: Desc)])
  @@map("entity_profiles")
}

model ContextBundle {
  id          String   @id @default(uuid())
  userId      String
  
  bundleType  String   // "identity_core", "global_prefs", "topic", "entity", "conversation", "composite"
  
  topicProfileId    String?
  topicProfile      TopicProfile? @relation("TopicBundles", fields: [topicProfileId], references: [id], onDelete: Cascade)
  entityProfileId   String?
  entityProfile     EntityProfile? @relation("EntityBundles", fields: [entityProfileId], references: [id], onDelete: Cascade)
  conversationId    String?
  conversation      Conversation? @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  personaId         String?
  persona           AiPersona? @relation(fields: [personaId], references: [id], onDelete: Cascade)
  
  compiledPrompt    String   @db.Text
  tokenCount        Int
  
  composition       Json     @default("{}")
  
  version           Int      @default(1)
  isDirty           Boolean  @default(false)
  priority          Float    @default(0.5)
  
  compiledAt        DateTime @default(now()) @db.Timestamptz
  expiresAt         DateTime? @db.Timestamptz
  lastUsedAt        DateTime @default(now()) @db.Timestamptz
  useCount          Int      @default(0)
  
  hitCount          Int      @default(0)
  missCount         Int      @default(0)
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, bundleType])
  @@index([userId, priority(sort: Desc)])
  @@index([userId, isDirty])
  @@index([expiresAt])
  @@map("context_bundles")
}

model ConversationCompaction {
  id              String   @id @default(uuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  // What range of messages this compaction covers
  fromMessageIndex  Int
  toMessageIndex    Int
  originalTokenCount Int   // How many tokens the raw messages were
  compactedTokenCount Int  // How many tokens the summary is
  
  // The compacted content
  summary           String @db.Text  // Dense summary of this message range
  keyDecisions      Json   @default("[]")  // Extracted decisions
  openQuestions     Json   @default("[]")  // Unresolved questions at this point
  codeArtifacts     Json   @default("[]")  // Code blocks that were produced/modified
  
  // Compression metadata
  compressionRatio  Float  // originalTokenCount / compactedTokenCount
  compactionLevel   Int    @default(1) // 1 = first pass, 2 = re-compacted, etc.
  
  createdAt   DateTime @default(now()) @db.Timestamptz
  
  @@unique([conversationId, fromMessageIndex, toMessageIndex])
  @@index([conversationId, fromMessageIndex])
  @@map("conversation_compactions")
}

model ClientPresence {
  id              String   @id @default(uuid())
  userId          String
  deviceId        String
  
  activeConversationId    String?
  visibleConversationIds  String[]
  activeNotebookId        String?
  activePersonaId         String?
  
  lastNavigationPath      String?
  navigationHistory       Json     @default("[]")
  
  localTime               DateTime? @db.Timestamptz
  sessionStartedAt        DateTime @default(now()) @db.Timestamptz
  idleSince               DateTime? @db.Timestamptz
  
  predictedTopics         String[]
  predictedEntities       String[]
  
  lastHeartbeatAt         DateTime @default(now()) @db.Timestamptz
  isOnline                Boolean  @default(true)
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, deviceId])
  @@index([userId, isOnline])
  @@index([lastHeartbeatAt])
  @@map("client_presence")
}

// Add to existing User model:
// topicProfiles       TopicProfile[]
// entityProfiles      EntityProfile[]
// contextBundles      ContextBundle[]
// clientPresence      ClientPresence[]

// Add to existing Conversation model:
// topicLinks          TopicConversation[]
// compactions         ConversationCompaction[]
// contextBundles      ContextBundle[]

// Add to existing AiPersona model:
// contextBundles      ContextBundle[]
```

---

## The Budget Algorithm

### User Setting

```typescript
interface UserContextSettings {
  // User-configurable (exposed in settings UI)
  maxContextTokens: number;       // 4096 - 50000, default 12000
  
  // Advanced (optional toggles)
  prioritizeConversationHistory: boolean;  // default: true for continuing convos
  knowledgeDepth: 'minimal' | 'standard' | 'deep';  // default: 'standard'
  includeEntityContext: boolean;   // default: true
}
```

### The Master Budget Algorithm

The key insight: **the budget isn't static ratios—it's a constraint satisfaction problem** where layer sizes adapt based on what's actually available and what the conversation demands.

```typescript
// budget-algorithm.ts

interface LayerBudget {
  layer: string;
  minTokens: number;      // Hard floor — below this, don't include at all
  idealTokens: number;    // What we'd like
  maxTokens: number;      // Hard ceiling — never exceed
  priority: number;       // 0-100, for allocation conflicts
  allocated: number;      // Final allocation after algorithm runs
  elasticity: number;     // 0-1, how willing this layer is to shrink
}

interface BudgetInput {
  totalBudget: number;                    // User's maxContextTokens setting
  conversationMessageCount: number;       // How many messages in the conversation
  conversationTotalTokens: number;        // Raw token count of all messages
  userMessageTokens: number;              // Current message size
  detectedTopicCount: number;             // How many topics were detected
  detectedEntityCount: number;            // How many entities were detected
  hasActiveConversation: boolean;         // Is this continuing a conversation?
  knowledgeDepth: 'minimal' | 'standard' | 'deep';
  prioritizeHistory: boolean;
  availableBundles: Map<string, number>;  // bundleType -> actual token count
}

class BudgetAlgorithm {

  /**
   * THE CORE ALGORITHM
   * 
   * Phase 1: Compute ideal sizes based on conversation state
   * Phase 2: Apply constraints (min/max)
   * Phase 3: Distribute remaining budget by priority × elasticity
   * Phase 4: Handle overflow (conversation too large)
   */
  computeBudget(input: BudgetInput): Map<string, LayerBudget> {
    
    // ═══════════════════════════════════════════════════════════
    // PHASE 1: Determine layer parameters based on situation
    // ═══════════════════════════════════════════════════════════
    
    const layers = this.computeLayerParams(input);
    
    // ═══════════════════════════════════════════════════════════
    // PHASE 2: Guaranteed allocations (hard minimums)
    // ═══════════════════════════════════════════════════════════
    
    let remaining = input.totalBudget;
    
    // L7 (user message) is non-negotiable
    const l7 = layers.get('L7_user_message')!;
    l7.allocated = input.userMessageTokens;
    remaining -= l7.allocated;
    
    // L0 (identity) is non-negotiable
    const l0 = layers.get('L0_identity')!;
    l0.allocated = Math.min(l0.idealTokens, l0.maxTokens);
    remaining -= l0.allocated;
    
    // L1 (global prefs) is non-negotiable
    const l1 = layers.get('L1_global_prefs')!;
    l1.allocated = Math.min(l1.idealTokens, l1.maxTokens);
    remaining -= l1.allocated;
    
    // ═══════════════════════════════════════════════════════════
    // PHASE 3: Elastic allocation for L2-L6
    // ═══════════════════════════════════════════════════════════
    
    const elasticLayers = ['L2_topic', 'L3_entity', 'L4_conversation', 
                           'L5_jit', 'L6_message_history'];
    
    // First pass: give everyone their minimum
    for (const key of elasticLayers) {
      const layer = layers.get(key)!;
      layer.allocated = layer.minTokens;
      remaining -= layer.minTokens;
    }
    
    // If we're already over budget after minimums, we need to cut
    if (remaining < 0) {
      this.cutToFit(layers, elasticLayers, remaining);
      return layers;
    }
    
    // Second pass: distribute remaining by priority-weighted ideal
    const totalIdealRemaining = elasticLayers.reduce((sum, key) => {
      const layer = layers.get(key)!;
      return sum + Math.max(0, layer.idealTokens - layer.minTokens);
    }, 0);
    
    if (totalIdealRemaining > 0) {
      for (const key of elasticLayers) {
        const layer = layers.get(key)!;
        const idealDelta = Math.max(0, layer.idealTokens - layer.minTokens);
        const weight = (idealDelta / totalIdealRemaining) * (layer.priority / 100);
        
        const additionalAllocation = Math.min(
          Math.floor(remaining * weight),
          layer.maxTokens - layer.allocated,
          idealDelta
        );
        
        layer.allocated += additionalAllocation;
        remaining -= additionalAllocation;
      }
    }
    
    // Third pass: if there's still budget left, distribute to highest priority
    // layers that haven't hit their max
    if (remaining > 0) {
      const sortedByPriority = elasticLayers
        .map(key => ({ key, layer: layers.get(key)! }))
        .filter(({ layer }) => layer.allocated < layer.maxTokens)
        .sort((a, b) => b.layer.priority - a.layer.priority);
      
      for (const { key, layer } of sortedByPriority) {
        if (remaining <= 0) break;
        const canTake = Math.min(remaining, layer.maxTokens - layer.allocated);
        layer.allocated += canTake;
        remaining -= canTake;
      }
    }
    
    return layers;
  }

  /**
   * PHASE 1 DETAIL: Layer parameters are SITUATION-DEPENDENT
   * 
   * This is where the "bespoke" comes in — the algorithm adapts
   * to the conversation's actual state.
   */
  private computeLayerParams(input: BudgetInput): Map<string, LayerBudget> {
    const B = input.totalBudget;
    const layers = new Map<string, LayerBudget>();
    
    // ── Depth multiplier from user setting ──
    const depthMultiplier = {
      'minimal': 0.5,
      'standard': 1.0,
      'deep': 1.5
    }[input.knowledgeDepth];
    
    // ── Conversation pressure: how much of the budget the
    //    conversation history "wants" to consume ──
    const conversationPressure = Math.min(1.0, 
      input.conversationTotalTokens / (B * 0.7)
    );
    
    // ── Is this a knowledge-heavy or dialogue-heavy interaction? ──
    const isKnowledgeHeavy = input.detectedTopicCount >= 2 || 
                             input.knowledgeDepth === 'deep';
    const isDialogueHeavy = input.conversationMessageCount > 20 && 
                            input.prioritizeHistory;
    
    // ════════════════════════════════════════════════════════
    // L0: Identity Core
    // Fixed size, always present. Scales slightly with total budget.
    // ════════════════════════════════════════════════════════
    layers.set('L0_identity', {
      layer: 'L0_identity',
      minTokens: 150,
      idealTokens: Math.min(400, Math.floor(B * 0.02)),
      maxTokens: 500,
      priority: 100,  // Never cut
      allocated: 0,
      elasticity: 0.0  // Rigid
    });
    
    // ════════════════════════════════════════════════════════
    // L1: Global Preferences
    // Fixed size, always present.
    // ════════════════════════════════════════════════════════
    layers.set('L1_global_prefs', {
      layer: 'L1_global_prefs',
      minTokens: 100,
      idealTokens: Math.min(600, Math.floor(B * 0.03)),
      maxTokens: 800,
      priority: 95,
      allocated: 0,
      elasticity: 0.1
    });
    
    // ════════════════════════════════════════════════════════
    // L2: Topic Context
    // Scales with: number of topics, depth setting, budget size
    // Shrinks under: conversation pressure
    // 
    // ALGORITHM: 
    //   base = B * 0.12 (12% of budget)
    //   adjusted = base * depthMultiplier * topicCountFactor
    //   pressured = adjusted * (1 - conversationPressure * 0.5)
    // ════════════════════════════════════════════════════════
    {
      const topicCountFactor = Math.min(2.0, 
        1.0 + (input.detectedTopicCount - 1) * 0.3
      );
      const base = B * 0.12;
      const adjusted = base * depthMultiplier * topicCountFactor;
      const pressured = adjusted * (1 - conversationPressure * 0.4);
      
      layers.set('L2_topic', {
        layer: 'L2_topic',
        minTokens: input.detectedTopicCount > 0 ? 300 : 0,
        idealTokens: Math.floor(Math.max(0, pressured)),
        maxTokens: Math.floor(B * 0.25),  // Never more than 25% of budget
        priority: isKnowledgeHeavy ? 85 : 70,
        allocated: 0,
        elasticity: 0.6  // Fairly flexible
      });
    }
    
    // ════════════════════════════════════════════════════════
    // L3: Entity/Relationship Context
    // Scales with: number of entities, entity importance
    // Smaller than topic context — entities are summaries
    // 
    // ALGORITHM:
    //   base = B * 0.06
    //   adjusted = base * entityCountFactor
    //   capped per entity at 400 tokens
    // ════════════════════════════════════════════════════════
    {
      const entityCountFactor = Math.min(2.0, 
        1.0 + (input.detectedEntityCount - 1) * 0.4
      );
      const base = B * 0.06;
      const adjusted = base * entityCountFactor;
      const perEntityCap = 400;
      const entityCapped = Math.min(adjusted, 
        input.detectedEntityCount * perEntityCap
      );
      
      layers.set('L3_entity', {
        layer: 'L3_entity',
        minTokens: input.detectedEntityCount > 0 ? 150 : 0,
        idealTokens: Math.floor(Math.max(0, entityCapped)),
        maxTokens: Math.floor(B * 0.12),
        priority: 65,
        allocated: 0,
        elasticity: 0.7  // Very flexible — can be cut
      });
    }
    
    // ════════════════════════════════════════════════════════
    // L4: Conversation Thread (arc, decisions, open Qs)
    // This is the COMPRESSED summary of the conversation.
    // Critical for long conversations with a fresh session.
    // 
    // ALGORITHM:
    //   Scales logarithmically with conversation length.
    //   Short conv (< 10 msgs): ~200 tokens
    //   Medium conv (10-50 msgs): ~500-1000 tokens
    //   Long conv (50-200 msgs): ~1000-2000 tokens
    //   Very long conv (200+): ~2000-3000 tokens
    //   
    //   formula: base * log2(messageCount + 1) * depthMultiplier
    // ════════════════════════════════════════════════════════
    {
      const msgCount = input.conversationMessageCount;
      const logScale = Math.log2(Math.max(1, msgCount) + 1);
      const base = 150;
      const ideal = Math.floor(base * logScale * depthMultiplier);
      
      layers.set('L4_conversation', {
        layer: 'L4_conversation',
        minTokens: input.hasActiveConversation ? 200 : 0,
        idealTokens: Math.min(ideal, Math.floor(B * 0.15)),
        maxTokens: Math.floor(B * 0.20),
        priority: input.hasActiveConversation ? 88 : 30,
        allocated: 0,
        elasticity: 0.3  // Somewhat rigid for continuing convos
      });
    }
    
    // ════════════════════════════════════════════════════════
    // L5: Just-In-Time Retrieval
    // The "surprise" layer — things the pre-built context missed.
    // Scales with budget but inversely with topic coverage.
    // 
    // ALGORITHM:
    //   If topic bundles are rich (high coverage), JIT shrinks.
    //   If no topics detected (cold start), JIT grows.
    //   
    //   base = B * 0.10
    //   coverage_factor = 1.0 - (topicBundleTokens / (B * 0.15))
    //   adjusted = base * max(0.3, coverage_factor) * depthMultiplier
    // ════════════════════════════════════════════════════════
    {
      const topicBundleTokens = input.availableBundles.get('topic') ?? 0;
      const coverageFactor = 1.0 - Math.min(1.0, 
        topicBundleTokens / (B * 0.15)
      );
      const base = B * 0.10;
      const adjusted = base * Math.max(0.3, coverageFactor) * depthMultiplier;
      
      layers.set('L5_jit', {
        layer: 'L5_jit',
        minTokens: 200,
        idealTokens: Math.floor(adjusted),
        maxTokens: Math.floor(B * 0.18),
        priority: 75,
        allocated: 0,
        elasticity: 0.5
      });
    }
    
    // ════════════════════════════════════════════════════════
    // L6: Message History (raw recent messages)
    // The sliding window of actual conversation messages.
    // 
    // THIS IS THE BIG ONE for fresh sessions on long convos.
    // 
    // ALGORITHM:
    //   Strategy depends on conversation size:
    //   
    //   SMALL (< 3K tokens total): Include everything.
    //     ideal = conversationTotalTokens
    //   
    //   MEDIUM (3K-10K tokens): Include recent, summarize old.
    //     ideal = B * 0.35 (standard)
    //     The L4 conversation arc handles the rest.
    //   
    //   LARGE (10K-50K tokens): Aggressive windowing.
    //     ideal = B * 0.30
    //     L4 must carry the weight with compactions.
    //   
    //   HUGE (50K+ tokens): Maximum compression.
    //     ideal = B * 0.25
    //     L4 uses multi-level compaction.
    //   
    //   If prioritizeHistory is true, boost by 1.3x.
    // ════════════════════════════════════════════════════════
    {
      const totalConvTokens = input.conversationTotalTokens;
      let idealRatio: number;
      
      if (totalConvTokens <= 3000) {
        // Small conversation: include everything
        idealRatio = Math.min(1.0, totalConvTokens / B);
      } else if (totalConvTokens <= 10000) {
        idealRatio = 0.35;
      } else if (totalConvTokens <= 50000) {
        idealRatio = 0.30;
      } else {
        idealRatio = 0.25;
      }
      
      const historyBoost = input.prioritizeHistory ? 1.3 : 1.0;
      const dialogueBoost = isDialogueHeavy ? 1.2 : 1.0;
      const ideal = Math.floor(B * idealRatio * historyBoost * dialogueBoost);
      
      layers.set('L6_message_history', {
        layer: 'L6_message_history',
        minTokens: input.hasActiveConversation ? 500 : 0,
        idealTokens: Math.min(ideal, totalConvTokens),
        maxTokens: Math.floor(B * 0.60),  // Cap at 60% even in extreme cases
        priority: isDialogueHeavy ? 90 : 80,
        allocated: 0,
        elasticity: 0.4
      });
    }
    
    // ════════════════════════════════════════════════════════
    // L7: User Message (non-negotiable)
    // ════════════════════════════════════════════════════════
    layers.set('L7_user_message', {
      layer: 'L7_user_message',
      minTokens: input.userMessageTokens,
      idealTokens: input.userMessageTokens,
      maxTokens: input.userMessageTokens,
      priority: 100,
      allocated: 0,
      elasticity: 0.0
    });
    
    return layers;
  }

  /**
   * When minimums exceed the budget, cut the lowest priority
   * elastic layers first.
   */
  private cutToFit(
    layers: Map<string, LayerBudget>,
    elasticKeys: string[],
    deficit: number  // negative number
  ): void {
    // Sort by priority ascending (cut lowest priority first)
    const sorted = elasticKeys
      .map(key => ({ key, layer: layers.get(key)! }))
      .sort((a, b) => a.layer.priority - b.layer.priority);
    
    let remaining = Math.abs(deficit);
    
    for (const { key, layer } of sorted) {
      if (remaining <= 0) break;
      
      // How much can we cut from this layer?
      const canCut = layer.allocated - 0;  // Can cut to zero
      const willCut = Math.min(remaining, canCut);
      
      layer.allocated -= willCut;
      remaining -= willCut;
    }
  }
}
```

---

## The Conversation Context Determination System

This handles the critical problem: **a 200-message conversation that's 80K tokens can't fit in a 50K window**.

### Strategy: Progressive Compaction

```
Conversation: 200 messages, 80K tokens
Budget for L6: 12K tokens

We need a representation strategy:

┌─────────────────────────────────────────────────────────────┐
│               CONVERSATION CONTEXT STRATEGY                  │
│                                                               │
│  Messages 1-50:    ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                    Compacted to Level 2 summary (~500t)      │
│                                                               │
│  Messages 51-120:  ████████████████░░░░░░░░░░░░░░░░░░░░░░░ │
│                    Compacted to Level 1 summary (~1500t)     │
│                                                               │
│  Messages 121-180: ██████████████████████████░░░░░░░░░░░░░░ │
│                    Key messages included, gaps summarized     │
│                    (~3000t)                                    │
│                                                               │
│  Messages 181-200: ████████████████████████████████████████ │
│                    Full messages, no compression (~7000t)     │
│                                                               │
│  TOTAL: ~12,000 tokens for 80K original                      │
│  L4 conversation arc: ~1500t (decisions, open Qs, focus)     │
│  Effective coverage: ~95% of important context preserved     │
└─────────────────────────────────────────────────────────────┘
```

```typescript
// conversation-context-engine.ts

interface ConversationWindow {
  // The structured output that goes into L4 + L6
  l4Arc: string;          // Conversation arc (goes into L4 budget)
  l6Messages: string;     // Message history (goes into L6 budget)
  l4TokenCount: number;
  l6TokenCount: number;
  
  // Metadata about what was included
  strategy: 'full' | 'windowed' | 'compacted' | 'multi_level';
  coverage: {
    totalMessages: number;
    fullMessages: number;
    summarizedMessages: number;
    droppedMessages: number;
  };
}

class ConversationContextEngine {

  /**
   * Given a conversation and token budgets for L4 and L6,
   * produce the best possible representation.
   */
  async buildConversationContext(
    conversationId: string,
    l4Budget: number,    // Tokens available for conversation arc
    l6Budget: number,    // Tokens available for message history
  ): Promise<ConversationWindow> {
    
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { messageIndex: 'asc' } },
        compactions: { orderBy: { fromMessageIndex: 'asc' } }
      }
    });
    
    if (!conv) throw new Error(`Conversation ${conversationId} not found`);
    
    const messages = conv.messages;
    const totalTokens = this.estimateMessagesTokens(messages);
    const totalBudget = l4Budget + l6Budget;
    
    // ═══════════════════════════════════════════════════════
    // STRATEGY SELECTION based on compression ratio needed
    // ═══════════════════════════════════════════════════════
    const compressionRatio = totalTokens / totalBudget;
    
    if (compressionRatio <= 1.0) {
      // Everything fits! No compression needed.
      return this.strategyFull(messages, l4Budget, l6Budget);
    }
    
    if (compressionRatio <= 2.5) {
      // Mild compression: window recent, summarize the rest
      return this.strategyWindowed(conv, messages, l4Budget, l6Budget);
    }
    
    if (compressionRatio <= 8.0) {
      // Moderate compression: multi-zone with compaction
      return this.strategyCompacted(conv, messages, l4Budget, l6Budget);
    }
    
    // Heavy compression: multi-level compaction
    return this.strategyMultiLevel(conv, messages, l4Budget, l6Budget);
  }

  // ═══════════════════════════════════════════════════════════
  // STRATEGY: FULL — Everything fits, just format it
  // Compression ratio: < 1.0
  // ═══════════════════════════════════════════════════════════
  private async strategyFull(
    messages: Message[], 
    l4Budget: number, 
    l6Budget: number
  ): Promise<ConversationWindow> {
    
    const l6Content = messages.map(m => 
      this.formatMessage(m)
    ).join('\n\n');
    
    return {
      l4Arc: '', // Not needed — all messages are present
      l6Messages: l6Content,
      l4TokenCount: 0,
      l6TokenCount: this.estimateTokens(l6Content),
      strategy: 'full',
      coverage: {
        totalMessages: messages.length,
        fullMessages: messages.length,
        summarizedMessages: 0,
        droppedMessages: 0
      }
    };
  }

  // ═══════════════════════════════════════════════════════════
  // STRATEGY: WINDOWED — Recent messages full, older summarized
  // Compression ratio: 1.0 - 2.5
  // 
  // Algorithm:
  //   1. Reserve 70% of L6 for recent messages (from the end)
  //   2. Use remaining 30% of L6 for older message summaries
  //   3. L4 gets a lightweight arc
  //   4. Find the "cut point" where we switch from full to summary
  // ═══════════════════════════════════════════════════════════
  private async strategyWindowed(
    conv: any,
    messages: Message[],
    l4Budget: number,
    l6Budget: number
  ): Promise<ConversationWindow> {
    
    const recentBudget = Math.floor(l6Budget * 0.70);
    const olderBudget = l6Budget - recentBudget;
    
    // Find cut point: work backwards from the end until we
    // fill the recent budget
    let recentTokens = 0;
    let cutIndex = messages.length;
    
    for (let i = messages.length - 1; i >= 0; i--) {
      const msgTokens = this.estimateMessageTokens(messages[i]);
      if (recentTokens + msgTokens > recentBudget) {
        cutIndex = i + 1;
        break;
      }
      recentTokens += msgTokens;
      if (i === 0) cutIndex = 0;
    }
    
    // Recent messages: full content
    const recentMessages = messages.slice(cutIndex);
    const recentContent = recentMessages.map(m => 
      this.formatMessage(m)
    ).join('\n\n');
    
    // Older messages: summarized
    const olderMessages = messages.slice(0, cutIndex);
    let olderSummary = '';
    
    if (olderMessages.length > 0) {
      // Check if we have a cached compaction
      const existingCompaction = conv.compactions?.find(
        (c: any) => c.fromMessageIndex === 0 && 
                     c.toMessageIndex >= cutIndex - 1
      );
      
      if (existingCompaction && 
          existingCompaction.compactedTokenCount <= olderBudget) {
        olderSummary = existingCompaction.summary;
      } else {
        // Generate a new compaction
        olderSummary = await this.compactMessages(
          olderMessages, olderBudget
        );
        
        // Cache it
        await this.storeCompaction(
          conv.id, 0, cutIndex - 1, 
          this.estimateMessagesTokens(olderMessages),
          olderSummary
        );
      }
    }
    
    // L4: Lightweight arc (since we have most messages)
    const arc = await this.generateLightArc(messages, l4Budget);
    
    const l6Content = [
      olderSummary ? `[Summary of messages 1-${cutIndex}]\n${olderSummary}` : '',
      `\n[Recent messages]\n`,
      recentContent
    ].filter(Boolean).join('\n\n');
    
    return {
      l4Arc: arc,
      l6Messages: l6Content,
      l4TokenCount: this.estimateTokens(arc),
      l6TokenCount: this.estimateTokens(l6Content),
      strategy: 'windowed',
      coverage: {
        totalMessages: messages.length,
        fullMessages: recentMessages.length,
        summarizedMessages: olderMessages.length,
        droppedMessages: 0
      }
    };
  }

  // ═══════════════════════════════════════════════════════════
  // STRATEGY: COMPACTED — Multi-zone with progressive detail
  // Compression ratio: 2.5 - 8.0
  // 
  // Algorithm: Three zones with different compression levels
  //
  //   Zone A (oldest 40%):  Heavy summary     → ~10% of budget
  //   Zone B (middle 35%):  Key messages only  → ~25% of budget
  //   Zone C (recent 25%):  Full messages      → ~65% of budget
  //
  //   L4 carries a richer arc since less raw content is visible
  // ═══════════════════════════════════════════════════════════
  private async strategyCompacted(
    conv: any,
    messages: Message[],
    l4Budget: number,
    l6Budget: number
  ): Promise<ConversationWindow> {
    
    const totalMsgs = messages.length;
    
    // Zone boundaries
    const zoneAEnd = Math.floor(totalMsgs * 0.40);
    const zoneBEnd = Math.floor(totalMsgs * 0.75);
    
    // Budget distribution
    const zoneABudget = Math.floor(l6Budget * 0.10);
    const zoneBBudget = Math.floor(l6Budget * 0.25);
    const zoneCBudget = l6Budget - zoneABudget - zoneBBudget;
    
    const zoneA = messages.slice(0, zoneAEnd);
    const zoneB = messages.slice(zoneAEnd, zoneBEnd);
    const zoneC = messages.slice(zoneBEnd);
    
    // Zone A: Heavy compaction
    const zoneASummary = await this.compactMessages(zoneA, zoneABudget);
    
    // Zone B: Select key messages + bridge summaries
    const zoneBContent = await this.selectKeyMessages(
      zoneB, zoneBBudget
    );
    
    // Zone C: Full messages, truncate from the start if needed
    const zoneCContent = this.fitMessagesInBudget(zoneC, zoneCBudget);
    
    // L4: Rich arc (we're hiding a lot of content)
    const arc = await this.generateRichArc(messages, l4Budget);
    
    const l6Content = [
      `[Early conversation summary]\n${zoneASummary}`,
      `\n[Key exchanges from middle of conversation]\n${zoneBContent}`,
      `\n[Recent messages]\n${zoneCContent}`
    ].join('\n\n');
    
    return {
      l4Arc: arc,
      l6Messages: l6Content,
      l4TokenCount: this.estimateTokens(arc),
      l6TokenCount: this.estimateTokens(l6Content),
      strategy: 'compacted',
      coverage: {
        totalMessages: totalMsgs,
        fullMessages: zoneC.length,
        summarizedMessages: zoneA.length + zoneB.length,
        droppedMessages: 0
      }
    };
  }

  // ═══════════════════════════════════════════════════════════
  // STRATEGY: MULTI-LEVEL — For very long conversations
  // Compression ratio: > 8.0
  // 
  // Algorithm: Hierarchical compaction with cached layers
  //
  //   1. Divide conversation into chunks of ~20 messages
  //   2. Each chunk gets a Level-1 compaction (cached)
  //   3. Groups of 5 Level-1 compactions get a Level-2 compaction
  //   4. Oldest Level-2 compactions get Level-3 compaction
  //   5. Most recent chunk: full messages
  //
  //   Budget distribution:
  //     Level 3 (oldest):    5% of L6
  //     Level 2:             10% of L6  
  //     Level 1 (middle):    15% of L6
  //     Full (recent):       70% of L6
  //
  //   L4 carries a very dense, structured arc
  // ═══════════════════════════════════════════════════════════
  private async strategyMultiLevel(
    conv: any,
    messages: Message[],
    l4Budget: number,
    l6Budget: number
  ): Promise<ConversationWindow> {
    
    const CHUNK_SIZE = 20;
    const totalMsgs = messages.length;
    
    // Divide into chunks
    const chunks: Message[][] = [];
    for (let i = 0; i < totalMsgs; i += CHUNK_SIZE) {
      chunks.push(messages.slice(i, Math.min(i + CHUNK_SIZE, totalMsgs)));
    }
    
    // Recent chunk: always full
    const recentChunk = chunks[chunks.length - 1];
    const recentBudget = Math.floor(l6Budget * 0.70);
    const recentContent = this.fitMessagesInBudget(recentChunk, recentBudget);
    
    // Second-most-recent chunk: Level 1 compaction
    let middleContent = '';
    const middleBudget = Math.floor(l6Budget * 0.15);
    if (chunks.length >= 2) {
      const middleChunks = chunks.slice(
        Math.max(0, chunks.length - 4), 
        chunks.length - 1
      );
      const middleMessages = middleChunks.flat();
      middleContent = await this.compactMessages(middleMessages, middleBudget);
    }
    
    // All older chunks: Level 2+ compaction
    let olderContent = '';
    const olderBudget = Math.floor(l6Budget * 0.10);
    if (chunks.length >= 5) {
      const olderChunks = chunks.slice(0, chunks.length - 4);
      
      // Check for cached compactions
      const cachedCompactions = await this.getCachedCompactions(
        conv.id, 
        0, 
        olderChunks.flat().length - 1
      );
      
      if (cachedCompactions.length > 0) {
        // Re-compact the cached compactions (Level 2)
        const level1Text = cachedCompactions.map(c => c.summary).join('\n\n');
        if (this.estimateTokens(level1Text) <= olderBudget) {
          olderContent = level1Text;
        } else {
          olderContent = await this.compactText(level1Text, olderBudget);
        }
      } else {
        // Generate fresh compaction
        const olderMessages = olderChunks.flat();
        olderContent = await this.compactMessages(olderMessages, olderBudget);
        
        // Cache it
        await this.storeCompaction(
          conv.id, 0, olderMessages.length - 1,
          this.estimateMessagesTokens(olderMessages),
          olderContent
        );
      }
    }
    
    // Very old: Level 3 (if conversation is extremely long, 500+ messages)
    let ancientContent = '';
    const ancientBudget = Math.floor(l6Budget * 0.05);
    if (chunks.length >= 10) {
      const ancientChunks = chunks.slice(0, Math.floor(chunks.length * 0.3));
      const ancientMessages = ancientChunks.flat();
      ancientContent = await this.compactMessages(ancientMessages, ancientBudget);
    }
    
    // L4: Dense structured arc
    const arc = await this.generateDenseArc(messages, l4Budget);
    
    const l6Content = [
      ancientContent ? `[Very early conversation — highly compressed]\n${ancientContent}` : '',
      olderContent ? `[Earlier conversation — summarized]\n${olderContent}` : '',
      middleContent ? `[Recent history — summarized]\n${middleContent}` : '',
      `[Current conversation]\n${recentContent}`
    ].filter(Boolean).join('\n\n---\n\n');
    
    return {
      l4Arc: arc,
      l6Messages: l6Content,
      l4TokenCount: this.estimateTokens(arc),
      l6TokenCount: this.estimateTokens(l6Content),
      strategy: 'multi_level',
      coverage: {
        totalMessages: totalMsgs,
        fullMessages: recentChunk.length,
        summarizedMessages: totalMsgs - recentChunk.length,
        droppedMessages: 0
      }
    };
  }

  // ═══════════════════════════════════════════════════════════
  // COMPACTION HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Compress a set of messages into a summary within a token budget.
   * Uses LLM for intelligent compression.
   */
  private async compactMessages(
    messages: Message[], 
    targetTokens: number
  ): Promise<string> {
    
    const messagesText = messages.map(m => 
      `[${m.role}${m.author ? ` (${m.author})` : ''}]: ${this.extractText(m.parts)}`
    ).join('\n\n');
    
    const response = await llm.chat({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `Compress this conversation segment into a dense summary.

CONSTRAINTS:
- Maximum ~${targetTokens} tokens (approximately ${Math.floor(targetTokens * 3.5)} characters)
- Preserve: key decisions, technical details, code changes, unresolved questions
- Preserve: the emotional arc and relationship dynamics if relevant
- Use bullet points for facts, prose for narrative flow
- Reference specific message authors when important
- Include exact code snippets only if they're critical artifacts being worked on
- Mark any unresolved questions with [OPEN]

FORMAT:
Start with a 1-sentence overview, then bullet points for key content.`
      }, {
        role: 'user',
        content: messagesText
      }]
    });
    
    return response.content;
  }

  /**
   * Re-compress already-compressed text (Level 2+ compaction)
   */
  private async compactText(
    text: string, 
    targetTokens: number
  ): Promise<string> {
    const response = await llm.chat({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `Further compress this conversation summary.

CONSTRAINTS:
- Maximum ~${targetTokens} tokens
- Keep only the most critical: decisions, major code artifacts, core questions
- This is a second-level compression — be ruthlessly concise
- Preserve anything marked [OPEN] as it's unresolved`
      }, {
        role: 'user',
        content: text
      }]
    });
    
    return response.content;
  }

  /**
   * Select the most important messages from a range.
   * Uses heuristics rather than LLM for speed.
   */
  private async selectKeyMessages(
    messages: Message[], 
    budget: number
  ): Promise<string> {
    
    // Score each message by importance heuristics
    const scored = messages.map((m, i) => ({
      message: m,
      score: this.scoreMessageImportance(m, i, messages.length)
    }));
    
    // Sort by importance, take from the top until budget exhausted
    scored.sort((a, b) => b.score - a.score);
    
    let usedTokens = 0;
    const selected: Array<{ message: Message; originalIndex: number }> = [];
    
    for (const { message, score } of scored) {
      const msgTokens = this.estimateMessageTokens(message);
      if (usedTokens + msgTokens > budget) {
        // Try a truncated version
        if (budget - usedTokens > 50) {
          selected.push({ 
            message: this.truncateMessage(message, budget - usedTokens),
            originalIndex: messages.indexOf(message)
          });
        }
        break;
      }
      selected.push({ 
        message, 
        originalIndex: messages.indexOf(message) 
      });
      usedTokens += msgTokens;
    }
    
    // Re-sort by original position for readability
    selected.sort((a, b) => a.originalIndex - b.originalIndex);
    
    // Add gap markers
    const result: string[] = [];
    let lastIdx = -1;
    
    for (const { message, originalIndex } of selected) {
      if (lastIdx >= 0 && originalIndex - lastIdx > 1) {
        const skipped = originalIndex - lastIdx - 1;
        result.push(`[... ${skipped} messages omitted ...]`);
      }
      result.push(this.formatMessage(message));
      lastIdx = originalIndex;
    }
    
    return result.join('\n\n');
  }

  /**
   * Score a message's importance using fast heuristics.
   * No LLM call — this must be instant.
   */
  private scoreMessageImportance(
    message: Message, 
    index: number, 
    totalCount: number
  ): number {
    let score = 0;
    const text = this.extractText(message.parts);
    
    // Recency bias (but not too strong — we want key moments, not just recent)
    score += (index / totalCount) * 20;
    
    // Length suggests substance (but diminishing returns)
    const wordCount = text.split(/\s+/).length;
    score += Math.min(25, Math.log2(wordCount + 1) * 5);
    
    // Code blocks are often critical
    const codeBlockCount = (text.match(/```/g) || []).length / 2;
    score += codeBlockCount * 15;
    
    // Questions are often pivotal
    const questionCount = (text.match(/\?/g) || []).length;
    score += Math.min(15, questionCount * 5);
    
    // Decision language
    const decisionPatterns = /\b(decided|decision|let's go with|we'll use|agreed|final|conclusion|solution|answer|resolved)\b/gi;
    const decisionCount = (text.match(decisionPatterns) || []).length;
    score += decisionCount * 10;
    
    // Problem/error language (important to preserve)
    const problemPatterns = /\b(error|bug|issue|problem|failed|broken|fix|crash|exception|TypeError|undefined)\b/gi;
    const problemCount = (text.match(problemPatterns) || []).length;
    score += Math.min(15, problemCount * 5);
    
    // Lists/structured content
    const listItems = (text.match(/^\s*[-*•]\s/gm) || []).length;
    score += Math.min(10, listItems * 2);
    
    // User messages slightly more important (they set context)
    if (message.role === 'user') score += 5;
    
    // First and last messages of conversation are important
    if (index === 0 || index === totalCount - 1) score += 15;
    
    return score;
  }

  /**
   * Fit messages into a token budget, cutting from the oldest.
   */
  private fitMessagesInBudget(messages: Message[], budget: number): string {
    let usedTokens = 0;
    const result: string[] = [];
    
    // Work backwards (most recent first)
    for (let i = messages.length - 1; i >= 0; i--) {
      const formatted = this.formatMessage(messages[i]);
      const tokens = this.estimateTokens(formatted);
      
      if (usedTokens + tokens > budget) {
        if (i < messages.length - 1) {
          result.unshift(`[... ${i + 1} earlier messages omitted ...]`);
        }
        break;
      }
      
      result.unshift(formatted);
      usedTokens += tokens;
    }
    
    return result.join('\n\n');
  }

  // ═══════════════════════════════════════════════════════════
  // ARC GENERATORS — Different density levels for L4
  // ═══════════════════════════════════════════════════════════

  private async generateLightArc(
    messages: Message[], 
    budget: number
  ): Promise<string> {
    if (budget < 100) return '';
    
    // Light arc: just decisions and open questions
    return this.llmArc(messages, budget, 'light');
  }

  private async generateRichArc(
    messages: Message[], 
    budget: number
  ): Promise<string> {
    return this.llmArc(messages, budget, 'rich');
  }

  private async generateDenseArc(
    messages: Message[], 
    budget: number
  ): Promise<string> {
    return this.llmArc(messages, budget, 'dense');
  }

  private async llmArc(
    messages: Message[], 
    budget: number, 
    density: 'light' | 'rich' | 'dense'
  ): Promise<string> {
    
    const densityInstructions = {
      'light': `Extract only: 
- 1-sentence conversation summary
- Unresolved questions (prefix with [OPEN])
- Key decisions made
Maximum ~${budget} tokens.`,
      
      'rich': `Extract a structured arc:
- 2-3 sentence narrative of how the conversation evolved
- All decisions and conclusions reached
- All unresolved questions (prefix with [OPEN])  
- Current focus/topic of the most recent messages
- Any code artifacts being actively worked on (names only, not content)
Maximum ~${budget} tokens.`,
      
      'dense': `Extract a comprehensive structured arc. This is the PRIMARY 
context for understanding this conversation since most raw messages are compressed.

Include:
- Narrative arc: how the conversation evolved, topic transitions, pivots
- ALL decisions and conclusions with brief rationale
- ALL unresolved questions and blockers (prefix with [OPEN])
- Current active focus and what the user seems to need next
- Key code artifacts: file names, function names, architectural patterns discussed
- Any emotional context: frustration, excitement, confusion
- Relationship dynamics: who asked for what, who helped with what
Maximum ~${budget} tokens.`
    };
    
    // For very long conversations, we can't send all messages to the arc generator.
    // Sample strategically.
    let messagesText: string;
    
    if (messages.length <= 40) {
      messagesText = messages.map(m => 
        `[${m.role}]: ${this.extractText(m.parts)}`
      ).join('\n\n');
    } else {
      // Sample: first 5, evenly spaced middle, last 15
      const first = messages.slice(0, 5);
      const last = messages.slice(-15);
      const middleCount = Math.min(20, messages.length - 20);
      const middleStep = Math.floor((messages.length - 20) / middleCount);
      const middle: Message[] = [];
      for (let i = 5; i < messages.length - 15 && middle.length < middleCount; i += middleStep) {
        middle.push(messages[i]);
      }
      
      const sampled = [...first, ...middle, ...last];
      messagesText = sampled.map((m, i) => {
        const idx = messages.indexOf(m);
        return `[msg ${idx + 1}/${messages.length}, ${m.role}]: ${this.extractText(m.parts)}`;
      }).join('\n\n');
    }
    
    const response = await llm.chat({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: densityInstructions[density]
      }, {
        role: 'user',
        content: messagesText
      }]
    });
    
    return response.content;
  }

  // ═══════════════════════════════════════════════════════════
  // CACHING
  // ═══════════════════════════════════════════════════════════

  private async storeCompaction(
    conversationId: string,
    fromIndex: number,
    toIndex: number,
    originalTokens: number,
    summary: string
  ): Promise<void> {
    const compactedTokens = this.estimateTokens(summary);
    
    await prisma.conversationCompaction.upsert({
      where: {
        conversationId_fromMessageIndex_toMessageIndex: {
          conversationId,
          fromMessageIndex: fromIndex,
          toMessageIndex: toIndex
        }
      },
      update: {
        summary,
        compactedTokenCount: compactedTokens,
        compressionRatio: originalTokens / compactedTokens,
      },
      create: {
        conversationId,
        fromMessageIndex: fromIndex,
        toMessageIndex: toIndex,
        originalTokenCount: originalTokens,
        compactedTokenCount: compactedTokens,
        summary,
        compressionRatio: originalTokens / compactedTokens,
      }
    });
  }

  private async getCachedCompactions(
    conversationId: string,
    fromIndex: number,
    toIndex: number
  ): Promise<ConversationCompaction[]> {
    return prisma.conversationCompaction.findMany({
      where: {
        conversationId,
        fromMessageIndex: { gte: fromIndex },
        toMessageIndex: { lte: toIndex }
      },
      orderBy: { fromMessageIndex: 'asc' }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  private formatMessage(m: Message): string {
    const author = m.author ? ` (${m.author})` : '';
    return `[${m.role}${author}]: ${this.extractText(m.parts)}`;
  }

  private extractText(parts: any): string {
    if (typeof parts === 'string') return parts;
    if (Array.isArray(parts)) {
      return parts
        .filter((p: any) => p.type === 'text' || typeof p === 'string')
        .map((p: any) => typeof p === 'string' ? p : p.text || p.content || '')
        .join('\n');
    }
    return JSON.stringify(parts);
  }

  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  private estimateMessageTokens(m: Message): number {
    return this.estimateTokens(this.formatMessage(m));
  }

  private estimateMessagesTokens(messages: Message[]): number {
    return messages.reduce((sum, m) => sum + this.estimateMessageTokens(m), 0);
  }

  private truncateMessage(m: Message, maxTokens: number): Message {
    const text = this.extractText(m.parts);
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return m;
    
    return {
      ...m,
      parts: [{ type: 'text', text: text.slice(0, maxChars) + '... [truncated]' }]
    } as Message;
  }
}
```

---

## The Complete Assembler — Tying It All Together

```typescript
// context-assembler-final.ts

class DynamicContextAssembler {
  
  private budgetAlgorithm = new BudgetAlgorithm();
  private conversationEngine = new ConversationContextEngine();
  private bundleCompiler = new BundleCompiler();

  async assemble(params: {
    userId: string;
    conversationId: string;
    userMessage: string;
    personaId?: string;
    deviceId?: string;
  }): Promise<AssembledContext> {
    
    const startTime = Date.now();
    
    // ═══════════════════════════════════════════════════════
    // STEP 0: Load user settings and conversation metadata
    // ═══════════════════════════════════════════════════════
    const [userSettings, conversationMeta] = await Promise.all([
      this.getUserSettings(params.userId),
      this.getConversationMeta(params.conversationId)
    ]);
    
    // ═══════════════════════════════════════════════════════
    // STEP 1: Detect what this message is about (fast)
    // ═══════════════════════════════════════════════════════
    const messageEmbedding = await this.embed(params.userMessage);
    const detectedContext = await this.detectMessageContext(
      params.userId, params.userMessage, messageEmbedding, params.conversationId
    );
    
    // ═══════════════════════════════════════════════════════
    // STEP 2: Compute the dynamic budget
    // ═══════════════════════════════════════════════════════
    const availableBundles = await this.getAvailableBundleSizes(
      params.userId, detectedContext
    );
    
    const budget = this.budgetAlgorithm.computeBudget({
      totalBudget: userSettings.maxContextTokens,
      conversationMessageCount: conversationMeta.messageCount,
      conversationTotalTokens: conversationMeta.totalTokens ?? 
        conversationMeta.totalCharacters / 4,
      userMessageTokens: Math.ceil(params.userMessage.length / 4),
      detectedTopicCount: detectedContext.topics.length,
      detectedEntityCount: detectedContext.entities.length,
      hasActiveConversation: conversationMeta.messageCount > 0,
      knowledgeDepth: userSettings.knowledgeDepth ?? 'standard',
      prioritizeHistory: userSettings.prioritizeConversationHistory ?? true,
      availableBundles
    });
    
    // ═══════════════════════════════════════════════════════
    // STEP 3: Fetch/build each layer within its budget
    // ═══════════════════════════════════════════════════════
    
    const l0Budget = budget.get('L0_identity')!.allocated;
    const l1Budget = budget.get('L1_global_prefs')!.allocated;
    const l2Budget = budget.get('L2_topic')!.allocated;
    const l3Budget = budget.get('L3_entity')!.allocated;
    const l4Budget = budget.get('L4_conversation')!.allocated;
    const l5Budget = budget.get('L5_jit')!.allocated;
    const l6Budget = budget.get('L6_message_history')!.allocated;
    
    // Parallel fetch of pre-built bundles
    const [l0, l1, l2, l3] = await Promise.all([
      this.getOrBuildBundle(params.userId, 'identity_core', l0Budget),
      this.getOrBuildBundle(params.userId, 'global_prefs', l1Budget),
      l2Budget > 0 ? this.getTopicBundles(
        params.userId, detectedContext.topics, l2Budget
      ) : '',
      l3Budget > 0 ? this.getEntityBundles(
        params.userId, detectedContext.entities, l3Budget
      ) : ''
    ]);
    
    // Conversation context (L4 + L6 are computed together)
    const conversationContext = conversationMeta.messageCount > 0
      ? await this.conversationEngine.buildConversationContext(
          params.conversationId, l4Budget, l6Budget
        )
      : { l4Arc: '', l6Messages: '', l4TokenCount: 0, l6TokenCount: 0,
          strategy: 'full' as const, coverage: { 
            totalMessages: 0, fullMessages: 0, 
            summarizedMessages: 0, droppedMessages: 0 
          }};
    
    // JIT retrieval (L5)
    const l5 = await this.justInTimeRetrieval(
      params.userId, params.userMessage, messageEmbedding, 
      detectedContext, l5Budget
    );
    
    // ═══════════════════════════════════════════════════════
    // STEP 4: Assemble final system prompt
    // ═══════════════════════════════════════════════════════
    const sections: string[] = [];
    
    if (l0) sections.push(l0);
    if (l1) sections.push(l1);
    if (l2) sections.push(l2);
    if (l3) sections.push(l3);
    if (conversationContext.l4Arc) sections.push(conversationContext.l4Arc);
    if (l5) sections.push(l5);
    
    const systemPrompt = sections.join('\n\n---\n\n');
    
    // ═══════════════════════════════════════════════════════
    // STEP 5: Build the messages array
    // ═══════════════════════════════════════════════════════
    // The system prompt goes into the system message.
    // L6 (message history) goes into the messages array.
    // L7 (user message) is the final user message.
    
    const messagesForLLM = [
      { role: 'system' as const, content: systemPrompt },
      // L6: Conversation history (may include compacted summaries)
      ...(conversationContext.l6Messages 
        ? [{ role: 'user' as const, content: `[Conversation context]\n${conversationContext.l6Messages}` }]
        : []),
      // L7: Current user message
      { role: 'user' as const, content: params.userMessage }
    ];
    
    // ═══════════════════════════════════════════════════════
    // STEP 6: Log and return
    // ═══════════════════════════════════════════════════════
    const totalTokens = Array.from(budget.values())
      .reduce((sum, l) => sum + l.allocated, 0);
    
    console.log(`Context assembled in ${Date.now() - startTime}ms`);
    console.log(`Budget: ${totalTokens}/${userSettings.maxContextTokens}`);
    console.log(`Strategy: ${conversationContext.strategy}`);
    console.log(`Layers: ${Array.from(budget.entries())
      .map(([k, v]) => `${k}:${v.allocated}t`)
      .join(', ')}`);
    
    if (conversationContext.coverage) {
      console.log(`Conversation: ${conversationContext.coverage.fullMessages} full, ` +
        `${conversationContext.coverage.summarizedMessages} summarized of ` +
        `${conversationContext.coverage.totalMessages} total`);
    }
    
    return {
      systemPrompt,
      messages: messagesForLLM,
      budget: Object.fromEntries(budget),
      metadata: {
        assemblyTimeMs: Date.now() - startTime,
        conversationStrategy: conversationContext.strategy,
        detectedTopics: detectedContext.topics.map(t => t.slug),
        detectedEntities: detectedContext.entities.map(e => e.name),
        totalTokens,
      }
    };
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER: Get topic bundles within budget
  // Distributes budget across multiple topics
  // ═══════════════════════════════════════════════════════════
  private async getTopicBundles(
    userId: string,
    topics: DetectedTopic[],
    totalBudget: number
  ): Promise<string> {
    if (topics.length === 0) return '';
    
    // Sort by confidence
    const sorted = [...topics].sort((a, b) => b.confidence - a.confidence);
    
    // Primary topic gets 70% of budget, secondary gets 30%
    const primary = sorted[0];
    const primaryBudget = sorted.length > 1 
      ? Math.floor(totalBudget * 0.7) 
      : totalBudget;
    
    const results: string[] = [];
    
    // Primary topic
    const primaryBundle = await this.getOrBuildTopicBundle(
      userId, primary.profileId, primary.slug, primaryBudget
    );
    if (primaryBundle) results.push(primaryBundle);
    
    // Secondary topic
    if (sorted.length > 1) {
      const secondary = sorted[1];
      const secondaryBudget = totalBudget - primaryBudget;
      const secondaryBundle = await this.getOrBuildTopicBundle(
        userId, secondary.profileId, secondary.slug, secondaryBudget
      );
      if (secondaryBundle) results.push(secondaryBundle);
    }
    
    return results.join('\n\n');
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER: Get entity bundles within budget
  // Each entity gets equal share
  // ═══════════════════════════════════════════════════════════
  private async getEntityBundles(
    userId: string,
    entities: DetectedEntity[],
    totalBudget: number
  ): Promise<string> {
    if (entities.length === 0) return '';
    
    const perEntityBudget = Math.floor(totalBudget / entities.length);
    const results: string[] = [];
    
    for (const entity of entities.slice(0, 3)) { // Max 3 entities
      const bundle = await prisma.contextBundle.findFirst({
        where: {
          userId,
          bundleType: 'entity',
          entityProfileId: entity.id,
          isDirty: false
        }
      });
      
      if (bundle) {
        if (bundle.tokenCount <= perEntityBudget) {
          results.push(bundle.compiledPrompt);
        } else {
          // Truncate to fit
          results.push(this.truncateToTokens(
            bundle.compiledPrompt, perEntityBudget
          ));
        }
      }
    }
    
    return results.join('\n\n');
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER: JIT retrieval within budget
  // ═══════════════════════════════════════════════════════════
  private async justInTimeRetrieval(
    userId: string,
    message: string,
    embedding: number[],
    context: DetectedContext,
    budget: number
  ): Promise<string> {
    if (budget < 100) return '';
    
    // Split budget: 60% for ACUs, 40% for memories
    const acuBudget = Math.floor(budget * 0.6);
    const memBudget = budget - acuBudget;
    
    const [acus, memories] = await Promise.all([
      this.retrieveAcus(userId, embedding, context, acuBudget),
      this.retrieveMemories(userId, embedding, memBudget)
    ]);
    
    const sections: string[] = [];
    
    if (memories.length > 0) {
      sections.push(
        `## Relevant Context\n` +
        memories.map(m => `- [${m.category}] ${m.content}`).join('\n')
      );
    }
    
    if (acus.length > 0) {
      sections.push(
        `## Related Knowledge\n` +
        acus.map(a => `- ${a.content}`).join('\n')
      );
    }
    
    return sections.join('\n\n');
  }

  private truncateToTokens(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars - 20) + '\n[... truncated]';
  }
}
```

---

## Budget Visualization (for debugging / user transparency)

```
Example: 50K budget, 300-message conversation (120K tokens), 
         2 topics detected, 1 entity, depth=standard

┌─────────────────────────────────────────────────────────────┐
│ CONTEXT BUDGET ALLOCATION                      50,000 tokens│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ L0 Identity      ████░░░░░░░░░░░░░░░░░░░░░░░░░░░  350t (1%)│
│ L1 Preferences   █████░░░░░░░░░░░░░░░░░░░░░░░░░░  500t (1%)│
│ L2 Topics        █████████████████░░░░░░░░░░░░░░  4200t (8%)│
│ L3 Entities      ████████░░░░░░░░░░░░░░░░░░░░░░░  400t (1%)│
│ L4 Conv Arc      ████████████████████░░░░░░░░░░░  2800t (6%)│
│ L5 JIT           ████████████████████░░░░░░░░░░░  3500t (7%)│
│ L6 History       ██████████████████████████████  37750t(76%)│
│ L7 Message       ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  500t (1%)│
│                                                             │
│ Conversation Strategy: multi_level                          │
│   Level 3 (msgs 1-90):    ~1800t compressed                │
│   Level 2 (msgs 91-200):  ~3800t compressed                │  
│   Level 1 (msgs 201-270): ~5600t compressed                │
│   Full (msgs 271-300):    ~26500t raw                       │
│                                                             │
│ Assembly time: 145ms                                        │
│ Cache hits: L0 L1 L2(primary) L3                           │
│ Cache misses: L2(secondary) — compiled on-the-fly          │
└─────────────────────────────────────────────────────────────┘
```

The algorithms ensure that no matter the conversation size, the user's configured budget is respected, the most important content is preserved, and the assembly is fast because most layers are pre-built and cached.
