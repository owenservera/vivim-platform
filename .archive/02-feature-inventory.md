# DOCUMENT 2: FEATURE INVENTORY

## Core Feature Categories

### 1. Conversation Import System (Provider-Agnostic)

**Feature Name**: Conversation Capture Pipeline

**Status**: LIVE (with known limitations)

**Description**: System for importing conversations from external AI provider platforms via web scraping. Uses Playwright with stealth plugins to extract conversation data from provider websites.

**Implementation**:
- Capture routes at `server/src/routes/capture.js`
- Provider-specific extractors in `server/src/extractors/`
- Supported providers: ChatGPT, Claude, Gemini, Grok, DeepSeek, Kimi, Qwen, Mistral, ZAI
- Extraction uses HTML parsing with Cheerio and Playwright
- ACU generation happens asynchronously after capture

**Known Limitations**:
- API key auth only - no user identity attached during capture (ownerId not set)
- Single global PrismaClient - no per-user database isolation
- No retry logic for failed captures visible
- Provider websites may block scraping

**Edge Cases**:
- Rate limiting from providers
- CAPTCHA/challenge pages
- Session expiration mid-capture
- Malformed HTML responses

---

**Feature Name**: Share Link Ingestion

**Status**: DESIGNED

**Description**: System for ingesting conversations via shareable links. Users can share their conversation links and recipients can import them.

**Implementation**:
- Share link models: ShareLink, SharingIntent
- Link validation service
- OpenGraph/meta tag parsing for link previews

**Known Limitations**: Not fully implemented in current schema

---

### 2. Data Ownership Model

**Feature Name**: User Data Sovereignty

**Status**: DESIGNED (not fully implemented)

**Description**: Users should own and control their imported data with full portability. Target architecture is per-user isolated SQLite databases.

**Implementation**:
- Prisma schema has userId foreign keys on all user data
- Privacy preferences stored per user
- Export capabilities designed but not fully visible

**Known Limitations**:
- Current: Single shared PostgreSQL database
- Target: Per-user databases NOT YET IMPLEMENTED
- No data export/portability UI visible

**Edge Cases**:
- Data migration between users
- GDPR deletion compliance needs work

---

**Feature Name**: Memory System

**Status**: IN PROGRESS

**Description**: Enhanced memory system that extracts and stores memories from conversations with importance scoring, consolidation, and relationship tracking.

**Implementation**:
- Memory model with types: EPISODIC, SEMANTIC, PROCEDURAL, FACTUAL, PREFERENCE, IDENTITY, RELATIONSHIP, GOAL, PROJECT, CUSTOM
- Memory consolidation status: RAW, CONSOLIDATING, CONSOLIDATED, MERGED, ARCHIVED
- Importance levels: CRITICAL, HIGH, MEDIUM, LOW, MINIMAL
- Memory relationships graph (similar, contradicts, supports, related_to, derived_from)
- Memory extraction async jobs

**Known Limitations**:
- Extraction pipeline in development
- Consolidation logic not fully visible

---

### 3. Sharing System

**Feature Name**: Atomic Chat Unit Sharing

**Status**: LIVE

**Description**: System for sharing individual ACUs or collections with permissions.

**Implementation**:
- SharingIntent model with intent types: SHARE, PUBLISH, EMBED, FORK
- Content types: CONVERSATION, ACU, COLLECTION, NOTEBOOK, MEMORY
- Audience types: PUBLIC, CIRCLE, USERS, LINK
- Permissions model with granular access levels
- Share links with optional password protection and expiration

**Known Limitations**:
- Sharing policy enforcement not fully visible in code
- Link sharing needs recipient acceptance flow

---

**Feature Name**: Permission Model

**Status**: IN PROGRESS

**Description**: Granular permissions for shared content including view, annotate, remix, and reshare rights.

**Implementation**:
- ContentAccessGrant model with access levels
- SharingPolicy with temporal, geographic, contextual constraints
- ContentStakeholder model for collaborative content

**Known Limitations**:
- Not all permission types implemented

---

### 4. Chat Forking / Threading / Muxing

**Feature Name**: ACU Derivations (Forking)

**Status**: LIVE

**Description**: Atomic Chat Units can be forked/derived from parent ACUs creating a lineage.

**Implementation**:
- AtomicChatUnit has `parentId` foreign key for derivations
- `derivations` relation for child ACUs
- Lineage tracking in Memory model (`lineageDepth`, `lineageParentId`)

**Known Limitations**:
- UI for forking may be limited
- Fork merge/resolution not visible

---

**Feature Name**: Threading / Muxing

**Status**: DESIGNED

**Description**: Ability to insert into and continue shared threads.

**Implementation**:
- RemuxDialog component exists in PWA
- "Remux" terminology used
- AcuLink model for connecting ACUs with relationships

**Known Limitations**:
- Implementation incomplete

---

### 5. The 8-Layer Context Engine

The Context Engine is a sophisticated system for assembling AI context from multiple sources. Note: Documentation references "8 layers" but implementation shows the following bundle types:

**Layer Status**: IN PROGRESS

#### Layer 0: Identity Core (`identity_core`)
**Description**: User's fundamental identity information - who they are, their role, background.

**Current Implementation**:
- UserFact model stores facts about user
- Identity profiles compilation
- CustomInstruction model for explicit identity instructions

**Tooling State**: Basic - stored in database, compiled on demand

---

#### Layer 1: Global Preferences (`global_prefs`)
**Description**: User's global AI preferences and settings.

**Current Implementation**:
- UserContextSettings model with maxContextTokens, responseStyle, memoryThreshold, etc.
- PrivacyPreferences JSON field
- Settings JSON field

**Tooling State**: Settings UI exists in PWA

---

#### Layer 2: Topic Context (`topic`)
**Description**: Learned information about topics the user has engaged with.

**Current Implementation**:
- TopicProfile model with:
  - slug, label, aliases
  - totalConversations, totalAcus, totalMessages, totalTokensSpent
  - avgSessionDepth, engagementStreak
  - proficiencyLevel, importanceScore
  - compiledContext with token count
  - Embeddings for semantic matching

**Tooling State**: Topic profiles compiled but UI limited

---

#### Layer 3: Entity Context (`entity`)
**Description**: Information about entities (people, companies, concepts) the user has discussed.

**Current Implementation**:
- EntityProfile model with:
  - name, type, aliases, relationship
  - sentiment, facts, mentionCount
  - compiledContext
  - Embeddings for semantic matching

**Tooling State**: Entity extraction in progress

---

#### Layer 4: Conversation Context (`conversation`)
**Description**: Current and recent conversation state.

**Current Implementation**:
- ConversationCompaction model for summarizing long conversations
- ConversationArc with openQuestions, decisions, currentFocus
- Message history with role, content, metadata

**Tooling State**: Basic compaction exists

---

#### Layer 5: Persona Context
**Description**: Custom AI personas the user has created.

**Current Implementation**:
- AiPersona model with:
  - name, description, trigger
  - systemPrompt, provider, model, temperature
  - includeOwnerContext flag

**Tooling State**: Persona creation UI exists

---

#### Layer 6: Message Context
**Description**: Recent messages in current conversation.

**Current Implementation**:
- Message model with role, parts, contentHash
- Compression strategies: full, windowed, compacted, multi_level

**Tooling State**: Basic implementation

---

#### Layer 7: JIT Knowledge
**Description**: Just-in-time knowledge retrieval from ACUs and memories.

**Current Implementation**:
- Similarity-based retrieval
- Embedding search across ACUs and memories

**Tooling State**: Basic retrieval, ranking in development

---

### Context Engine Assembly Process

**Implementation**:
- ContextAssembler service compiles bundles
- BudgetInput calculates token allocation per layer
- LayerBudget with minTokens, idealTokens, maxTokens, elasticity
- ConversationWindow with compression strategies
- Detected topics and entities from message analysis

**Tooling State**: 
- ContextCockpitPage UI exists in PWA for visualization
- ContextRecipesPage for customization

---

## Additional Features

### Social Features

| Feature | Status | Notes |
|---------|--------|-------|
| Circles | LIVE | Grouping users with membership roles |
| Groups | LIVE | Flexible collections (study, project, community) |
| Teams | LIVE | Collaborative work groups with channels |
| Friends | IN PROGRESS | Bidirectional social connection |
| Follows | IN PROGRESS | One-way social connection |

### Notebook System
- **Status**: LIVE
- Users can organize ACUs into notebooks
- NotebookEntry links ACUs to notebooks

### Moderation System
- **Status**: IN PROGRESS
- ContentFlag for reporting
- ModerationRule for automated moderation
- UserModerationRecord for strike tracking

### Analytics & Insights
- **Status**: IN PROGRESS
- AggregatedMetrics with various aggregation types
- Insight model for AI-generated recommendations

---

## Feature Gaps Summary

1. **User Isolation**: Not yet per-user databases
2. **Sharing UX**: Permission enforcement incomplete
3. **Forking UI**: Basic support only
4. **Context Engine**: Layers 5-7 need development
5. **P2P Features**: CRDT sync infrastructure exists but P2P not fully live
6. **Data Export**: Portability features incomplete
