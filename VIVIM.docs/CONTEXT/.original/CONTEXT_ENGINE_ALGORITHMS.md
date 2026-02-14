# Context Engine Core Algorithms Implementation Guide

**Document Version:** 1.0.0
**Date:** February 11, 2026
**Related:** `IMPLEMENTATION_GUIDE_MASTER.md`, `DATABASE_SCHEMA_IMPLEMENTATION.md`

---

## Table of Contents

1. [Algorithm Overview](#algorithm-overview)
2. [Budget Algorithm](#budget-algorithm)
3. [Progressive Compaction](#progressive-compaction)
4. [Conversation Context Engine](#conversation-context-engine)
5. [Token Estimation](#token-estimation)
6. [Prediction Engine](#prediction-engine)
7. [Performance Optimization](#performance-optimization)

---

## Algorithm Overview

### The Core Problem

A user's context window (12,000 tokens) is a **scarce resource** that must be shared across:

1. **Identity** (Who they are)
2. **Preferences** (How AI should behave)
3. **Topic Knowledge** (Deep domain expertise)
4. **Entity Knowledge** (People, projects, tools)
5. **Conversation History** (What we're discussing)
6. **Real-time Retrieval** (Just-in-time matches)
7. **User's Message** (Current input)

Traditional RAG systems use **fixed ratios** (e.g., 30% for retrieval, 30% for history). This fails when:
- Topic knowledge is dense (needs more budget)
- Conversation is long (history explodes)
- User wants deep knowledge (not just recent messages)

### The OpenScroll Solution: **Dynamic Negotiation**

Treat token allocation as a **constraint satisfaction problem** where:
- Each layer declares: `minTokens`, `idealTokens`, `maxTokens`, `priority`, `elasticity`
- Budget Algorithm negotiates: allocate as much as possible, respect constraints
- Result: **Optimal coverage given constraints**

---

## Budget Algorithm

### Interface Definitions

```typescript
interface LayerBudget {
  layer: string;           // Layer identifier (e.g., 'L2_topic')
  minTokens: number;        // Hard floor - below this, don't include at all
  idealTokens: number;      // What we'd like to have
  maxTokens: number;        // Hard ceiling - never exceed
  priority: number;         // 0-100, for conflict resolution
  allocated: number;        // Final allocation after negotiation
  elasticity: number;       // 0-1, how willing this layer is to shrink
}

interface BudgetInput {
  totalBudget: number;                    // User's maxContextTokens setting (default 12,000)
  conversationMessageCount: number;       // How many messages in current conversation
  conversationTotalTokens: number;        // Raw token count of all messages
  userMessageTokens: number;              // Current message size
  detectedTopicCount: number;             // Topics found in current context
  detectedEntityCount: number;            // Entities found in current context
  hasActiveConversation: boolean;         // Is user continuing existing chat?
  knowledgeDepth: 'minimal' | 'standard' | 'deep';  // User preference
  prioritizeHistory: boolean;             // User wants history prioritized?
  availableBundles: Map<string, number>;  // bundleType → actual token count (for JIT calculation)
}
```

### The Master Algorithm (4-Phase Negotiation)

#### Phase 1: Compute Layer Parameters (Situational)

```typescript
private computeLayerParams(input: BudgetInput): Map<string, LayerBudget> {
  const B = input.totalBudget;
  const layers = new Map<string, LayerBudget>();

  // Depth multiplier (user setting)
  const depthMultiplier = {
    'minimal': 0.5,
    'standard': 1.0,
    'deep': 1.5
  }[input.knowledgeDepth];

  // Conversation pressure: how much history "wants" budget
  const conversationPressure = Math.min(1.0,
    input.conversationTotalTokens / (B * 0.7)
  );

  // Interaction type classification
  const isKnowledgeHeavy = input.detectedTopicCount >= 2 ||
                          input.knowledgeDepth === 'deep';
  const isDialogueHeavy = input.conversationMessageCount > 20 &&
                          input.prioritizeHistory;

  // ═══════════════════════════════════════════════
  // L0: Identity Core (fixed, non-negotiable)
  // ═══════════════════════════════════════════════
  layers.set('L0_identity', {
    layer: 'L0_identity',
    minTokens: 150,
    idealTokens: Math.min(400, Math.floor(B * 0.02)),
    maxTokens: 500,
    priority: 100,  // Never cut
    allocated: 0,
    elasticity: 0.0  // Rigid
  });

  // ═══════════════════════════════════════════════
  // L1: Global Preferences (fixed, high priority)
  // ═══════════════════════════════════════════════
  layers.set('L1_global_prefs', {
    layer: 'L1_global_prefs',
    minTokens: 100,
    idealTokens: Math.min(600, Math.floor(B * 0.03)),
    maxTokens: 800,
    priority: 95,
    allocated: 0,
    elasticity: 0.1  // Slightly flexible
  });

  // ═══════════════════════════════════════════════
  // L2: Topic Context (elastic, scales with topics)
  // ═══════════════════════════════════════════════
  const topicCountFactor = Math.min(2.0,
    1.0 + (input.detectedTopicCount - 1) * 0.3
  );
  const base = B * 0.12;  // 12% base allocation
  const adjusted = base * depthMultiplier * topicCountFactor;
  const pressured = adjusted * (1 - conversationPressure * 0.4);  // Shrink when history heavy

  layers.set('L2_topic', {
    layer: 'L2_topic',
    minTokens: input.detectedTopicCount > 0 ? 300 : 0,
    idealTokens: Math.floor(Math.max(0, pressured)),
    maxTokens: Math.floor(B * 0.25),  // Max 25% of budget
    priority: isKnowledgeHeavy ? 85 : 70,  // Higher priority in knowledge mode
    allocated: 0,
    elasticity: 0.6  // Fairly flexible
  });

  // ═══════════════════════════════════════════════
  // L3: Entity Context (highly elastic, smaller than topics)
  // ═══════════════════════════════════════════════
  const entityCountFactor = Math.min(2.0,
    1.0 + (input.detectedEntityCount - 1) * 0.4
  );
  const entityBase = B * 0.06;  // 6% base allocation
  const entityAdjusted = entityBase * entityCountFactor;
  const perEntityCap = 400;  // Don't exceed 400 tokens per entity
  const entityCapped = Math.min(entityAdjusted,
    input.detectedEntityCount * perEntityCap
  );

  layers.set('L3_entity', {
    layer: 'L3_entity',
    minTokens: input.detectedEntityCount > 0 ? 150 : 0,
    idealTokens: Math.floor(Math.max(0, entityCapped)),
    maxTokens: Math.floor(B * 0.12),  // Max 12% of budget
    priority: 65,  // Lower priority than topics
    allocated: 0,
    elasticity: 0.7  // Very flexible - can be cut
  });

  // ═══════════════════════════════════════════════
  // L4: Conversation Arc (moderately elastic)
  // ═════════════════════════════════════════════
  const msgCount = input.conversationMessageCount;
  const logScale = Math.log2(Math.max(1, msgCount) + 1);
  const arcBase = 150;
  const arcIdeal = Math.floor(arcBase * logScale * depthMultiplier);

  layers.set('L4_conversation', {
    layer: 'L4_conversation',
    minTokens: input.hasActiveConversation ? 200 : 0,
    idealTokens: Math.min(arcIdeal, Math.floor(B * 0.15)),  // Max 15% of budget
    maxTokens: Math.floor(B * 0.20),  // Max 20% of budget
    priority: input.hasActiveConversation ? 88 : 30,  // High if continuing
    allocated: 0,
    elasticity: 0.3  // Somewhat rigid
  });

  // ═══════════════════════════════════════════════
  // L5: JIT Retrieval (moderately elastic)
  // ═════════════════════════════════════════════
  const topicBundleTokens = input.availableBundles.get('topic') ?? 0;
  const coverageFactor = 1.0 - Math.min(1.0,
    topicBundleTokens / (B * 0.15)
  );
  const jitBase = B * 0.10;  // 10% base allocation
  const jitAdjusted = jitBase * Math.max(0.3, coverageFactor) * depthMultiplier;

  layers.set('L5_jit', {
    layer: 'L5_jit',
    minTokens: 200,
    idealTokens: Math.floor(jitAdjusted),
    maxTokens: Math.floor(B * 0.18),  // Max 18% of budget
    priority: 75,
    allocated: 0,
    elasticity: 0.5
  });

  // ═══════════════════════════════════════════════
  // L6: Message History (elasticity varies by conversation size)
  // ═════════════════════════════════════════════
  const totalConvTokens = input.conversationTotalTokens;
  let idealRatio: number;

  if (totalConvTokens <= 3000) {
    // Small: include everything
    idealRatio = Math.min(1.0, totalConvTokens / B);
  } else if (totalConvTokens <= 10000) {
    // Medium: 35%
    idealRatio = 0.35;
  } else if (totalConvTokens <= 50000) {
    // Large: 30%
    idealRatio = 0.30;
  } else {
    // Huge: 25%
    idealRatio = 0.25;
  }

  const historyBoost = input.prioritizeHistory ? 1.3 : 1.0;
  const dialogueBoost = isDialogueHeavy ? 1.2 : 1.0;
  const historyIdeal = Math.floor(B * idealRatio * historyBoost * dialogueBoost);

  layers.set('L6_message_history', {
    layer: 'L6_message_history',
    minTokens: input.hasActiveConversation ? 500 : 0,
    idealTokens: Math.min(historyIdeal, totalConvTokens),
    maxTokens: Math.floor(B * 0.60),  // Cap at 60% even in extreme cases
    priority: isDialogueHeavy ? 90 : 80,
    allocated: 0,
    elasticity: 0.4
  });

  // ═══════════════════════════════════════════════
  // L7: User Message (non-negotiable)
  // ═════════════════════════════════════════════
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
```

#### Phase 2: Allocate Non-Negotiable Layers

```typescript
// Allocate L0, L1, L7 first (they're fixed)
let remaining = input.totalBudget;

// L0 (Identity)
const l0 = layers.get('L0_identity')!;
l0.allocated = Math.min(l0.idealTokens, l0.maxTokens);
remaining -= l0.allocated;

// L1 (Global Prefs)
const l1 = layers.get('L1_global_prefs')!;
l1.allocated = Math.min(l1.idealTokens, l1.maxTokens);
remaining -= l1.allocated;

// L7 (User Message)
const l7 = layers.get('L7_user_message')!;
l7.allocated = input.userMessageTokens;  // Fixed by input
remaining -= l7.allocated;
```

#### Phase 3: Allocate Elastic Layers (L2-L6)

```typescript
private allocateElasticLayers(
  layers: Map<string, LayerBudget>,
  elasticKeys: string[],
  remaining: number
): void {

  // First pass: give everyone their minimum
  for (const key of elasticKeys) {
    const layer = layers.get(key)!;
    layer.allocated = layer.minTokens;
    remaining -= layer.minTokens;
  }

  // If minimums already exceed budget, we must cut
  if (remaining < 0) {
    this.cutToFit(layers, elasticKeys, remaining);
    return;
  }

  // Second pass: distribute remaining by priority-weighted ideal
  const totalIdealRemaining = elasticKeys.reduce((sum, key) => {
    const layer = layers.get(key)!;
    return sum + Math.max(0, layer.idealTokens - layer.minTokens);
  }, 0);

  if (totalIdealRemaining > 0) {
    for (const key of elasticKeys) {
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

      if (remaining <= 0) break;
    }
  }

  // Third pass: distribute leftovers to highest priority layers
  if (remaining > 0) {
    const sortedByPriority = elasticKeys
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
}

// Cut from lowest priority when budget is exceeded
private cutToFit(
  layers: Map<string, LayerBudget>,
  elasticKeys: string[],
  deficit: number  // negative number
): void {

  const sorted = elasticKeys
    .map(key => ({ key, layer: layers.get(key)! }))
    .sort((a, b) => a.layer.priority - b.layer.priority);

  let remaining = Math.abs(deficit);

  for (const { key, layer } of sorted) {
    if (remaining <= 0) break;

    const canCut = layer.allocated - 0;  // Can cut to zero
    const willCut = Math.min(remaining, canCut);

    layer.allocated -= willCut;
    remaining -= willCut;
  }
}
```

### Budget Result Structure

```typescript
interface BudgetResult {
  layers: Map<string, LayerBudget>;
  totalAvailable: number;
  totalAllocated: number;
  totalUsed: number;
  shortBy: number;  // Amount under budget (should be 0 if algorithm works)
  allocationSummary: {
    identity: number;
    globalPrefs: number;
    topics: number;
    entities: number;
    conversation: number;
    jit: number;
    history: number;
    userMessage: number;
  };
}
```

---

## Progressive Compaction

### Problem Statement

A conversation with **200 messages at 40,000 tokens** cannot fit in a **12,000 token window**.

### Solution: Multi-Zone Strategies

#### Strategy Selection Algorithm

```typescript
enum CompactionStrategy {
  FULL = 'full',              // Everything fits (<3K tokens)
  WINDOWED = 'windowed',        // Recent full, older summarized (3K-10K)
  COMPACTED = 'compacted',       // Multi-zone with compression (10K-50K)
  MULTI_LEVEL = 'multi_level'     // Hierarchical summaries (50K+)
}

function selectStrategy(
  totalTokens: number,
  totalBudget: number
): CompactionStrategy {

  const compressionRatio = totalTokens / totalBudget;

  if (compressionRatio <= 1.0) return CompactionStrategy.FULL;
  if (compressionRatio <= 2.5) return CompactionStrategy.WINDOWED;
  if (compressionRatio <= 8.0) return CompactionStrategy.COMPACTED;
  return CompactionStrategy.MULTI_LEVEL;
}
```

#### Strategy 1: FULL (No Compression)

**When**: Conversation fits entirely within budget

**Algorithm**:
1. Include all messages verbatim
2. No L4 conversation arc needed (all context present)

```typescript
async strategyFull(
  messages: Message[],
  l4Budget: number,
  l6Budget: number
): Promise<ConversationWindow> {

  const l6Content = messages.map(m =>
    this.formatMessage(m)
  ).join('\n\n');

  return {
    l4Arc: '',
    l6Messages: l6Content,
    l4TokenCount: 0,
    l6TokenCount: this.estimateTokens(l6Content),
    strategy: CompactionStrategy.FULL,
    coverage: {
      totalMessages: messages.length,
      fullMessages: messages.length,
      summarizedMessages: 0,
      droppedMessages: 0
    }
  };
}
```

#### Strategy 2: WINDOWED (Recent + Summary)

**When**: Conversation is 2.5x larger than budget

**Algorithm**:
1. Allocate 70% of L6 budget to recent messages (from end)
2. Allocate 30% to older message summaries
3. L4 gets lightweight arc

```typescript
async strategyWindowed(
  conv: any,
  messages: Message[],
  l4Budget: number,
  l6Budget: number
): Promise<ConversationWindow> {

  const recentBudget = Math.floor(l6Budget * 0.70);
  const olderBudget = l6Budget - recentBudget;

  // Find cut point: work backwards until we fill recent budget
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

  // Older messages: check cache or generate summary
  const olderMessages = messages.slice(0, cutIndex);
  let olderSummary = '';

  if (olderMessages.length > 0) {
    const existingCompaction = conv.compactions?.find(
      (c: any) => c.fromMessageIndex === 0 &&
                   c.toMessageIndex >= cutIndex - 1
    );

    if (existingCompaction &&
        existingCompaction.compressedTokenCount <= olderBudget) {
      olderSummary = existingCompaction.summary;
    } else {
      olderSummary = await this.compactMessages(olderMessages, olderBudget);

      // Cache for future
      await this.storeCompaction(
        conv.id, 0, cutIndex - 1,
        this.estimateMessagesTokens(olderMessages),
        olderSummary
      );
    }
  }

  // L4: Lightweight arc
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
    strategy: CompactionStrategy.WINDOWED,
    coverage: {
      totalMessages: messages.length,
      fullMessages: recentMessages.length,
      summarizedMessages: olderMessages.length,
      droppedMessages: 0
    }
  };
}
```

#### Strategy 3: COMPACTED (Multi-Zone)

**When**: Conversation is 5-8x larger than budget

**Algorithm**:
- **Zone A (oldest 40%)**: Heavy summary → ~10% of budget
- **Zone B (middle 35%)**: Key messages only → ~25% of budget
- **Zone C (recent 25%)**: Full messages → ~65% of budget

```typescript
async strategyCompacted(
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

  // Zone B: Select key messages (heuristic scoring)
  const zoneBContent = await this.selectKeyMessages(zoneB, zoneBBudget);

  // Zone C: Full messages, truncate if needed
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
    strategy: CompactionStrategy.COMPACTED,
    coverage: {
      totalMessages: totalMsgs,
      fullMessages: zoneC.length,
      summarizedMessages: zoneA.length + zoneB.length,
      droppedMessages: 0
    }
  };
}
```

#### Strategy 4: MULTI-LEVEL (Hierarchical)

**When**: Conversation is 8x+ larger than budget

**Algorithm**:
1. Divide into chunks of ~20 messages
2. Each chunk gets Level-1 compaction (cached)
3. Groups of 5 Level-1 compactions get Level-2 compaction
4. Most recent chunk: full messages

```typescript
async strategyMultiLevel(
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

    // Check for cached Level-2 compactions
    const cachedCompactions = await this.getCachedCompactions(
      conv.id,
      0,
      olderChunks.flat().length - 1
    );

    if (cachedCompactions.length > 0) {
      // Re-compact cached Level-2 (Level-3)
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

      // Cache as Level-2
      await this.storeCompaction(
        conv.id, 0, olderMessages.length - 1,
        this.estimateMessagesTokens(olderMessages),
        olderContent,
        2  // compactionLevel
      );
    }
  }

  // Very old: Level 3 (if extremely long, 500+ messages)
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
    strategy: CompactionStrategy.MULTI_LEVEL,
    coverage: {
      totalMessages: totalMsgs,
      fullMessages: recentChunk.length,
      summarizedMessages: totalMsgs - recentChunk.length,
      droppedMessages: 0
    }
  };
}
```

### Message Compaction (LLM-Based)

```typescript
async compactMessages(
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
- Preserve: emotional arc and relationship dynamics if relevant
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
```

### Key Message Selection (Heuristic)

```typescript
async selectKeyMessages(
  messages: Message[],
  budget: number
): Promise<string> {

  // Score each message by importance heuristics
  const scored = messages.map((m, i) => ({
    message: m,
    score: this.scoreMessageImportance(m, i, messages.length)
  }));

  // Sort by importance, take from top until budget exhausted
  scored.sort((a, b) => b.score - a.score);

  let usedTokens = 0;
  const selected: Array<{ message: Message; originalIndex: number }> = [];

  for (const { message, score } of scored) {
    const msgTokens = this.estimateMessageTokens(message);
    if (usedTokens + msgTokens > budget) {
      // Try truncated version if budget allows
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

// Message importance scoring (no LLM call - instant)
scoreMessageImportance(
  message: Message,
  index: number,
  totalCount: number
): number {

  let score = 0;
  const text = this.extractText(message.parts);

  // Recency bias (but not too strong)
  score += (index / totalCount) * 20;

  // Length suggests substance
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

  // User messages slightly more important
  if (message.role === 'user') score += 5;

  // First and last messages are important
  if (index === 0 || index === totalCount - 1) score += 15;

  return score;
}
```

---

## Conversation Context Engine

### Purpose: L4 Generation (Conversation Arc)

The L4 layer is the **narrative thread** of the conversation:
- What decisions have been made
- What questions remain open
- What is the current focus
- Key topics being discussed

### Arc Generation

```typescript
async generateConversationArc(
  conv: any
): Promise<{
  arc: string;
  openQuestions: string[];
  decisions: string[];
  currentFocus: string | null;
}> {

  // For short conversations, just return formatted messages
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

  // For longer conversations, use LLM to extract arc
  const messagesText = conv.messages
    .map((m: any) => `[${m.role}]: ${this.extractText(m.parts)}`)
    .join('\n\n');

  const response = await llm.chat({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: `Analyze this conversation and extract its arc. Return JSON:
{
  "arc": "2-3 sentence summary of how conversation progressed",
  "openQuestions": ["questions raised but not yet answered"],
  "decisions": ["concrete decisions or conclusions reached"],
  "currentFocus": "what conversation is currently about (last few messages)"
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
```

### Arc Integration into Prompt

```typescript
// In DynamicContextAssembler.compilePrompt()

const conversationContext = bundles.find(b => b.bundleType === 'conversation');
const l4Arc = conversationContext?.compiledPrompt || '';

const finalPrompt = [
  l0Context,     // Identity
  l1Context,     // Global prefs
  l2Context,     // Topic knowledge
  l3Context,     // Entity knowledge
  `\n## Current Conversation\n`,
  l4Arc,         // Conversation arc
  `\n\n## Recent Messages\n`,
  l6Messages,     // Message history
  `\n\n## Just-In-Time Knowledge\n`,
  l5Jit,         // Real-time retrieval
  `\n\n## User Message\n`,
  l7UserMessage
].filter(Boolean).join('\n\n');
```

---

## Token Estimation

### Current Implementation: SimpleTokenEstimator

```typescript
class SimpleTokenEstimator {
  estimate(text: string): number {
    const words = text.split(/\s+/).length;
    return Math.ceil(words / 0.75);  // ~1.3 tokens per word
  }
}
```

**Problem**: Inaccurate. Code and emojis throw off estimates significantly.

### Future Implementation: js-tiktoken (BPE)

```typescript
import { Tiktoken } from 'js-tiktoken/lite';

class BPETokenEstimator {
  private encoder: Tiktoken;

  constructor() {
    this.encoder = new Tiktoken({
      encoding: 'cl100k_base'  // Or 'cl100k_im' for improved version
    });
  }

  estimate(text: string): number {
    const tokens = this.encoder.encode(text);
    return tokens.length;
  }

  estimateMessageTokens(message: Message): number {
    const text = this.extractText(message.parts);
    return this.estimate(text);
  }

  estimateMessagesTokens(messages: Message[]): number {
    return messages.reduce((sum, m) => sum + this.estimateMessageTokens(m), 0);
  }
}
```

**Migration Path**:

```typescript
// server/src/token/token-estimator.ts

class TokenEstimator {
  private bpeEstimator: BPETokenEstimator | null = null;
  private simpleEstimator: SimpleTokenEstimator;

  constructor() {
    this.simpleEstimator = new SimpleTokenEstimator();
    // Lazy load BPE for dev (no external dependency needed)
  }

  async estimate(text: string): Promise<number> {
    if (this.bpeEstimator) {
      return this.bpeEstimator.estimate(text);
    }
    return this.simpleEstimator.estimate(text);
  }

  async loadBPEIfAvailable(): Promise<void> {
    try {
      const { Tiktoken } = await import('js-tiktoken/lite');
      this.bpeEstimator = new BPETokenEstimator(new Tiktoken());
    } catch (e) {
      console.warn('BPE estimator not available, using simple fallback');
    }
  }
}
```

---

## Prediction Engine

### Purpose: Proactive Warmup

Anticipate user's next actions to pre-generate context bundles.

### Input: Client Presence

```typescript
interface ClientPresence {
  activeConversationId: string | null;
  visibleConversationIds: string[];
  activeNotebookId: string | null;
  activePersonaId: string | null;
  lastNavigationPath: string | null;
  navigationHistory: NavigationEvent[];
  localTime: Date | null;
  sessionStartedAt: Date;
  idleSince: Date | null;
}
```

### Prediction Signals

| Signal | Probability | Required Bundles |
|--------|-------------|------------------|
| **Continue active conversation** | 0.85 | conversation, topic |
| **Visible sidebar conversation** | 0.30 | conversation |
| **Time-of-day topic** | 0.15-0.30 | topic |
| **Recent high-engagement topic** | 0.15-0.40 | topic |
| **Hot entity (mentioned in 72h)** | 0.10-0.25 | entity |
| **Navigation pattern research mode** | Boost all | +deep_knowledge |

### Prediction Algorithm

```typescript
async predictNextInteractions(
  userId: string,
  presence: ClientPresence
): Promise<PredictedInteraction[]> {

  const predictions: PredictedInteraction[] = [];

  // ═════════════════════════════════════════════
  // SIGNAL 1: Active conversation continuation (highest priority)
  // ═════════════════════════════════════════════
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

  // ═════════════════════════════════════════════
  // SIGNAL 2: Visible sidebar conversations (medium priority)
  // ═════════════════════════════════════════════
  for (const convId of presence.visibleConversationIds.slice(0, 3)) {
    if (convId === presence.activeConversationId) continue;

    predictions.push({
      type: 'continue_conversation',
      conversationId: convId,
      probability: 0.30,
      requiredBundles: ['conversation']
    });
  }

  // ═════════════════════════════════════════════
  // SIGNAL 3: Time-of-day topic patterns
  // ═════════════════════════════════════════════
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

  // ═════════════════════════════════════════════
  // SIGNAL 4: Hot topics (recent + high engagement)
  // ═══════════════════════════════════════════
  const hotTopics = await prisma.topicProfile.findMany({
    where: {
      userId,
      lastEngagedAt: {
        gte: new Date(Date.now() - 48 * 60 * 60 * 1000)
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

  // ═════════════════════════════════════════════
  // SIGNAL 5: Hot entities (mentioned in 72h)
  // ═══════════════════════════════════════════
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

  // ═════════════════════════════════════════════
  // SIGNAL 6: Navigation pattern detection
  // ═══════════════════════════════════════════
  const navHistory = presence.navigationHistory || [];

  if (navHistory.length >= 3) {
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
```

---

## Performance Optimization

### 1. Vector Search Optimization

```typescript
// Use similarity threshold to reduce post-filtering
async function findSimilarACUsOptimized(
  userId: string,
  queryEmbedding: number[],
  threshold: number = 0.45  // Higher threshold = fewer results
): Promise<ACU[]> {

  return await prisma.$queryRaw<ACU[]>`
    SELECT id, content, type, "createdAt",
      1 - (embedding <=> ${queryEmbedding}::vector) as similarity
    FROM atomic_chat_units
    WHERE "authorDid" = (SELECT did FROM users WHERE id = ${userId})
      AND state = 'ACTIVE'
      AND 1 - (embedding <=> ${queryEmbedding}::vector) > ${threshold}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 20
  `;
}
```

### 2. Batch Embedding Generation

```typescript
// Generate embeddings in batches of 100 instead of 1-by-1
async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const batchSize = 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, Math.min(i + batchSize, texts.length));

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch
    });

    results.push(...response.data.map(d => d.embedding));

    // Small delay to avoid rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
```

### 3. Parallel Bundle Compilation

```typescript
// Compile multiple bundles in parallel (limited by concurrency)
async function warmupBundlesParallel(
  predictions: PredictedInteraction[],
  concurrency: number = 3
): Promise<void> {

  const compiler = new BundleCompiler();

  for (let i = 0; i < predictions.length; i += concurrency) {
    const batch = predictions.slice(i, i + concurrency);

    await Promise.allSettled(
      batch.map(async (prediction) => {
        try {
          if (prediction.conversationId) {
            await compiler.compileConversationContext(userId, prediction.conversationId);
          } else if (prediction.topicSlug) {
            await compiler.compileTopicContext(userId, prediction.topicSlug);
          } else if (prediction.entityId) {
            await compiler.compileEntityContext(userId, prediction.entityId);
          }
        } catch (e) {
          console.error(`Failed to compile bundle for`, prediction, e);
        }
      })
    );
  }
}
```

### 4. Memoization of LLM Calls

```typescript
class CompactionMemoizer {
  private cache = new Map<string, { result: string, timestamp: number }>();
  private ttl = 30 * 60 * 1000;  // 30 minutes

  async compactMessages(
    messages: Message[],
    targetTokens: number
  ): Promise<string> {

    const key = this.getCacheKey(messages, targetTokens);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.result;
    }

    const result = await this.compactMessagesInternal(messages, targetTokens);
    this.cache.set(key, { result, timestamp: Date.now() });

    return result;
  }

  private getCacheKey(messages: Message[], targetTokens: number): string {
    const ids = messages.map(m => m.id).join(',');
    return `${ids}_${targetTokens}`;
  }
}
```

---

**Document End**

Refer to `IMPLEMENTATION_GUIDE_MASTER.md` for overview and other implementation documents.
