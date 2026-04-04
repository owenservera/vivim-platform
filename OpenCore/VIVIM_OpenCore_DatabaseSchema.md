# Open Schema Website Section — Design & Implementation Guide

## Overview

Create a visually striking, interactive section that showcases your open-source data schema as a core differentiator. The section should communicate transparency, technical depth, and trust — making the schema feel like a living, explorable artifact rather than a wall of code.

---

## Section Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER AREA                                                 │
│  "Our Data Schema is Open Source"                           │
│  Subtitle explaining the philosophy                          │
├─────────────────────────────────────────────────────────────┤
│  INTERACTIVE SCHEMA EXPLORER                                 │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │  Domain       │  │  Visual Detail Panel                  │ │
│  │  Category     │  │                                      │ │
│  │  Sidebar      │  │  Shows selected domain's models,    │ │
│  │              │  │  relationships, and field details    │ │
│  │  - Core Data │  │                                      │ │
│  │  - Identity  │  │                                      │ │
│  │  - Social    │  │                                      │ │
│  │  - Memory    │  │                                      │ │
│  │  - Sharing   │  │                                      │ │
│  │  - Context   │  │                                      │ │
│  │  - Moderation│  │                                      │ │
│  │  - Analytics │  │                                      │ │
│  │  - Import    │  │                                      │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  STATS BAR                                                   │
│  42 Models  ·  9 Domains  ·  30+ Enums  ·  100% Open       │
├─────────────────────────────────────────────────────────────┤
│  CTA: "View Full Schema on GitHub"                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Domain Categories & Their Models

Organize the schema into these 9 logical domains. Each domain gets a color accent and icon:

### 1. **Core Data** (Blue accent)
- `Conversation` — Central hub, 30+ fields including rich content stats, rendering support, provider tracking
- `Message` — Individual messages with rich rendering, text styles, custom classes
- `AtomicChatUnit (ACU)` — The fundamental knowledge unit with vector embeddings, quality scores, sharing policies
- `AcuLink` — Weighted graph relationships between ACUs

### 2. **Identity & Auth** (Purple accent)
- `User` — Full identity with DID, cryptographic keys, verification levels, trust scores, AT Protocol support (pdsUrl)
- `Device` — Multi-device support with fingerprinting and trust levels
- `ApiKey` — Scoped API access
- `UserBlock` — Block relationships

### 3. **Social Network** (Green accent)
- `Friend` — Bidirectional connections with request flow (PENDING → ACCEPTED)
- `Follow` — Unidirectional follows with notification preferences
- `Group` — Flexible groups with types (GENERAL, STUDY, PROJECT, COMMUNITY)
- `GroupMember` — Role-based membership (OWNER, ADMIN, MODERATOR, MEMBER)
- `GroupPost` — Content shared within groups
- `Team` — Collaborative workspaces
- `TeamMember` — Team roles with activity tracking
- `TeamChannel` — Sub-channels (PUBLIC, PRIVATE, DIRECT)
- `ChannelMember` — Per-channel notification settings
- `ChannelMessage` — Messages with threading and reactions
- `Circle` / `CircleMember` — Trust circles for sharing scopes

### 4. **Memory System** (Amber/Orange accent)
- `Memory` — Sophisticated memory with types (EPISODIC, SEMANTIC, PROCEDURAL, FACTUAL, PREFERENCE, IDENTITY, RELATIONSHIP, GOAL, PROJECT), importance levels, consolidation tracking, full provenance chain, content fingerprinting, verification status, temporal validity, vector embeddings
- `MemoryConflict` — Contradiction detection between memories
- `MemoryRelationship` — Graph connections between memories
- `MemoryExtractionJob` — Async extraction pipeline
- `MemoryAnalytics` — Per-user memory statistics

### 5. **Context Engine** (Teal accent)
- `TopicProfile` — User expertise tracking per topic with proficiency levels, engagement streaks, compiled context
- `EntityProfile` — People/things tracking with sentiment, mention counts, compiled context
- `ContextBundle` — Pre-compiled context packages with cache metrics
- `ConversationCompaction` — Intelligent summarization with compression ratios
- `UserContextSettings` — Per-user context configuration (token budgets, similarity thresholds, feature flags)
- `ContextRecipe` — Reusable context assembly configurations
- `CustomInstruction` — Scoped user instructions
- `AiPersona` — Custom AI personality definitions
- `UserFact` — Categorized user facts
- `ClientPresence` — Real-time device state and navigation prediction

### 6. **Sharing & Access Control** (Red accent)
- `SharingIntent` — Declarative sharing with types (SHARE, PUBLISH, EMBED, FORK), audience types (PUBLIC, CIRCLE, USERS, LINK), lifecycle states
- `SharingPolicy` — Granular permissions with temporal, geographic, contextual, and collaborative rules
- `ContentStakeholder` — Multi-stakeholder ownership with influence scores
- `ContentAccessGrant` — Scoped access with view limits and expiry
- `ContentAccessLog` — Full audit trail
- `ShareLink` — Shareable links with passwords and usage limits
- `ContentRecord` — Content registry with lifecycle
- `ContentProvider` — Distributed storage tracking

### 7. **Rendering** (Indigo accent)
- `RenderingTemplate` — Reusable display templates per provider/role with conditional rules
- `RenderingCache` — Performance-optimized cached renders with hit tracking
- `MessageStylePreset` — Predefined visual configurations

### 8. **Moderation** (Rose/Pink accent)
- `ContentFlag` — Reports with AI detection confidence, appeal flow
- `ModeratorNote` — Internal/external notes
- `ModerationRule` — Automated rules with conditions and actions
- `UserModerationRecord` — Per-user strike system with warning/ban tracking

### 9. **Analytics & Operations** (Slate accent)
- `AnalyticsEvent` — Event tracking (18 event types)
- `AggregatedMetrics` — Time-series aggregations (HOURLY through YEARLY)
- `Insight` — AI-generated insights with confidence scores
- `FeedImpression` — Feed engagement tracking
- `ProviderStats` — Per-provider capture statistics
- `CaptureAttempt` — Capture pipeline monitoring
- `SyncOperation` / `SyncCursor` — CRDT-based sync with HLC timestamps and vector clocks
- `PeerConnection` — P2P federation
- `ImportJob` / `ImportedConversation` — Tiered import pipeline (5 tiers)
- `FailedJob` — Error recovery
- `SystemCommand` / `SystemAction` — System-level operations

---

## Detailed Component Implementation

### Component 1: Section Container

```tsx
// OpenSchemaSection.tsx
import React, { useState } from 'react';

const DOMAINS = [
  {
    id: 'core',
    label: 'Core Data',
    icon: '◆', // Use actual SVG icons in production
    color: '#3B82F6', // blue-500
    description: 'Conversations, messages, and atomic chat units — the fundamental data layer',
    models: [
      {
        name: 'Conversation',
        fieldCount: 35,
        description: 'Central hub for all chat data with provider tracking, content statistics, and rendering support',
        keyFields: [
          { name: 'id', type: 'UUID', badge: 'PK' },
          { name: 'provider', type: 'String', badge: null },
          { name: 'sourceUrl', type: 'String', badge: 'UNIQUE' },
          { name: 'contentHash', type: 'String', badge: null },
          { name: 'version', type: 'Int', badge: null },
          { name: 'title', type: 'String', badge: null },
          { name: 'model', type: 'String', badge: null },
          { name: 'visibility', type: 'String', badge: null },
          { name: 'messageCount', type: 'Int', badge: 'STAT' },
          { name: 'totalTokens', type: 'Int', badge: 'STAT' },
          { name: 'totalCodeBlocks', type: 'Int', badge: 'STAT' },
          { name: 'totalImages', type: 'Int', badge: 'STAT' },
          { name: 'renderedPreview', type: 'JSONB', badge: null },
          { name: 'tags', type: 'String[]', badge: null },
          { name: 'ownerId', type: 'UUID', badge: 'FK → User' },
        ],
        relations: ['→ Message (1:N)', '→ AtomicChatUnit (1:N)', '→ ContextBundle (1:N)', '→ User (N:1)'],
      },
      {
        name: 'Message',
        fieldCount: 16,
        description: 'Individual messages with rich rendering support, inline styles, and custom display ordering',
        keyFields: [
          { name: 'id', type: 'UUID', badge: 'PK' },
          { name: 'conversationId', type: 'UUID', badge: 'FK' },
          { name: 'role', type: 'String', badge: null },
          { name: 'parts', type: 'JSONB', badge: null },
          { name: 'renderedContent', type: 'JSONB', badge: null },
          { name: 'textStyles', type: 'JSONB', badge: null },
          { name: 'customClasses', type: 'String[]', badge: null },
          { name: 'tokenCount', type: 'Int', badge: null },
          { name: 'messageIndex', type: 'Int', badge: 'IDX' },
        ],
        relations: ['→ Conversation (N:1)', '→ AtomicChatUnit (1:N)'],
      },
      {
        name: 'AtomicChatUnit',
        fieldCount: 42,
        description: 'The fundamental knowledge unit — extracted, signed, embedded, and ready for knowledge graph traversal',
        keyFields: [
          { name: 'id', type: 'String', badge: 'PK' },
          { name: 'authorDid', type: 'String', badge: 'FK → User.did' },
          { name: 'signature', type: 'Bytes', badge: 'CRYPTO' },
          { name: 'content', type: 'String', badge: null },
          { name: 'type', type: 'String', badge: null },
          { name: 'category', type: 'String', badge: null },
          { name: 'embedding', type: 'vector(1536)', badge: 'AI' },
          { name: 'qualityOverall', type: 'Float', badge: 'SCORE' },
          { name: 'sharingPolicy', type: 'String', badge: null },
          { name: 'sharingCircles', type: 'String[]', badge: null },
          { name: 'rediscoveryScore', type: 'Float', badge: 'SCORE' },
        ],
        relations: ['→ User (N:1)', '→ Conversation (N:1)', '→ Message (N:1)', '→ AcuLink (source/target)', '→ self (parent/derivations)'],
      },
      {
        name: 'AcuLink',
        fieldCount: 7,
        description: 'Weighted, typed relationships between atomic chat units forming a knowledge graph',
        keyFields: [
          { name: 'sourceId', type: 'UUID', badge: 'FK' },
          { name: 'targetId', type: 'UUID', badge: 'FK' },
          { name: 'relation', type: 'String', badge: null },
          { name: 'weight', type: 'Float', badge: null },
        ],
        relations: ['→ AtomicChatUnit (source)', '→ AtomicChatUnit (target)'],
      },
    ],
  },
  {
    id: 'identity',
    label: 'Identity & Auth',
    icon: '🔐',
    color: '#8B5CF6', // purple-500
    description: 'Decentralized identity with DIDs, cryptographic verification, and multi-device trust',
    models: [
      {
        name: 'User',
        fieldCount: 38,
        description: 'Full identity with DID-based auth, verification levels, cryptographic keys, and AT Protocol federation support',
        keyFields: [
          { name: 'id', type: 'UUID', badge: 'PK' },
          { name: 'did', type: 'String', badge: 'UNIQUE · DID' },
          { name: 'handle', type: 'String', badge: 'UNIQUE' },
          { name: 'publicKey', type: 'String', badge: 'CRYPTO' },
          { name: 'keyType', type: 'String', badge: null },
          { name: 'verificationLevel', type: 'Int', badge: null },
          { name: 'trustScore', type: 'Float', badge: 'SCORE' },
          { name: 'status', type: 'AccountStatus', badge: 'ENUM' },
          { name: 'mfaEnabled', type: 'Boolean', badge: 'SECURITY' },
          { name: 'pdsUrl', type: 'String', badge: 'AT PROTO' },
          { name: 'privacyPreferences', type: 'JSON', badge: null },
        ],
        relations: ['→ Conversation (1:N)', '→ Device (1:N)', '→ Memory (1:N)', '→ Friend (requester/addressee)', '→ Follow (follower/following)', '→ Group (owner)', '→ Team (owner)', '→ 20+ other relations'],
      },
      {
        name: 'Device',
        fieldCount: 14,
        description: 'Multi-device management with fingerprinting, trust levels, and per-device key pairs',
        keyFields: [
          { name: 'deviceId', type: 'String', badge: 'UNIQUE' },
          { name: 'publicKey', type: 'String', badge: 'CRYPTO' },
          { name: 'fingerprint', type: 'String', badge: null },
          { name: 'isTrusted', type: 'Boolean', badge: null },
          { name: 'platform', type: 'String', badge: null },
        ],
        relations: ['→ User (N:1)'],
      },
      {
        name: 'ApiKey',
        fieldCount: 7,
        description: 'Scoped API access with hashed keys and expiry tracking',
        keyFields: [
          { name: 'keyHash', type: 'String', badge: 'UNIQUE · HASHED' },
          { name: 'name', type: 'String', badge: null },
          { name: 'expiresAt', type: 'DateTime', badge: null },
        ],
        relations: ['→ User (N:1)'],
      },
      {
        name: 'UserBlock',
        fieldCount: 5,
        description: 'Bidirectional block relationships between users',
        keyFields: [
          { name: 'blockerId', type: 'UUID', badge: 'FK' },
          { name: 'blockedId', type: 'UUID', badge: 'FK' },
          { name: 'reason', type: 'String', badge: null },
        ],
        relations: ['→ User (blocker)', '→ User (blocked)'],
      },
    ],
  },
  {
    id: 'social',
    label: 'Social Network',
    icon: '🌐',
    color: '#10B981', // green-500
    description: 'Friends, follows, groups, teams, channels — a complete social graph for AI knowledge sharing',
    models: [
      {
        name: 'Friend',
        fieldCount: 8,
        description: 'Bidirectional friend connections with request lifecycle (PENDING → ACCEPTED/REJECTED/BLOCKED)',
        keyFields: [
          { name: 'requesterId', type: 'UUID', badge: 'FK' },
          { name: 'addresseeId', type: 'UUID', badge: 'FK' },
          { name: 'status', type: 'FriendStatus', badge: 'ENUM' },
          { name: 'message', type: 'String', badge: null },
        ],
        relations: ['→ User (requester)', '→ User (addressee)'],
      },
      {
        name: 'Follow',
        fieldCount: 8,
        description: 'Unidirectional follow with notification and feed preferences',
        keyFields: [
          { name: 'followerId', type: 'UUID', badge: 'FK' },
          { name: 'followingId', type: 'UUID', badge: 'FK' },
          { name: 'status', type: 'FollowStatus', badge: 'ENUM' },
          { name: 'notifyOnPost', type: 'Boolean', badge: null },
        ],
        relations: ['→ User (follower)', '→ User (following)'],
      },
      {
        name: 'Group',
        fieldCount: 14,
        description: 'Flexible groups with types (GENERAL, STUDY, PROJECT, COMMUNITY) and visibility controls',
        keyFields: [
          { name: 'name', type: 'String', badge: null },
          { name: 'type', type: 'GroupType', badge: 'ENUM' },
          { name: 'visibility', type: 'GroupVisibility', badge: 'ENUM' },
          { name: 'memberCount', type: 'Int', badge: 'STAT' },
          { name: 'maxMembers', type: 'Int', badge: null },
        ],
        relations: ['→ User (owner)', '→ GroupMember (1:N)', '→ GroupPost (1:N)'],
      },
      {
        name: 'Team',
        fieldCount: 16,
        description: 'Collaborative workspaces with channels, roles, and guest access',
        keyFields: [
          { name: 'name', type: 'String', badge: null },
          { name: 'type', type: 'TeamType', badge: 'ENUM' },
          { name: 'visibility', type: 'TeamVisibility', badge: 'ENUM' },
          { name: 'memberCount', type: 'Int', badge: 'STAT' },
          { name: 'channelCount', type: 'Int', badge: 'STAT' },
        ],
        relations: ['→ User (owner)', '→ TeamMember (1:N)', '→ TeamChannel (1:N)'],
      },
      {
        name: 'TeamChannel',
        fieldCount: 10,
        description: 'Sub-channels within teams (PUBLIC, PRIVATE, DIRECT) with member and message tracking',
        keyFields: [
          { name: 'name', type: 'String', badge: null },
          { name: 'type', type: 'ChannelType', badge: 'ENUM' },
          { name: 'memberCount', type: 'Int', badge: 'STAT' },
          { name: 'messageCount', type: 'Int', badge: 'STAT' },
        ],
        relations: ['→ Team (N:1)', '→ ChannelMember (1:N)', '→ ChannelMessage (1:N)'],
      },
      {
        name: 'Circle / CircleMember',
        fieldCount: 14,
        description: 'Trust circles for scoped sharing — members with role-based permissions',
        keyFields: [
          { name: 'name', type: 'String', badge: null },
          { name: 'isPublic', type: 'Boolean', badge: null },
          { name: 'role', type: 'String', badge: null },
          { name: 'canShare', type: 'Boolean', badge: null },
        ],
        relations: ['→ User (owner)', '→ CircleMember (1:N)'],
      },
    ],
  },
  {
    id: 'memory',
    label: 'Memory System',
    icon: '🧠',
    color: '#F59E0B', // amber-500
    description: 'Sophisticated memory with types, importance, consolidation, full provenance, and vector search',
    models: [
      {
        name: 'Memory',
        fieldCount: 58,
        description: 'The richest model — episodic/semantic/procedural memories with provenance chains, verification, temporal validity, consolidation status, and vector embeddings',
        keyFields: [
          { name: 'id', type: 'UUID', badge: 'PK' },
          { name: 'content', type: 'String', badge: null },
          { name: 'memoryType', type: 'MemoryType', badge: 'ENUM (10 types)' },
          { name: 'importance', type: 'Float', badge: 'SCORE 0-1' },
          { name: 'relevance', type: 'Float', badge: 'DYNAMIC' },
          { name: 'consolidationStatus', type: 'Status', badge: 'ENUM' },
          { name: 'embedding', type: 'vector(1536)', badge: 'AI' },
          { name: 'provenanceId', type: 'String', badge: 'LINEAGE' },
          { name: 'provider', type: 'String', badge: null },
          { name: 'contentHash', type: 'String', badge: 'DEDUP' },
          { name: 'isVerified', type: 'Boolean', badge: null },
          { name: 'isPinned', type: 'Boolean', badge: null },
          { name: 'lineageDepth', type: 'Int', badge: null },
          { name: 'validFrom/Until', type: 'DateTime', badge: 'TEMPORAL' },
          { name: 'expiresAt', type: 'DateTime', badge: 'TTL' },
          { name: 'accessCount', type: 'Int', badge: 'USAGE' },
        ],
        relations: ['→ User (N:1)', '→ self (parent/children hierarchy)'],
      },
      {
        name: 'MemoryConflict',
        fieldCount: 12,
        description: 'Detected contradictions between memories with confidence scores and suggested resolutions',
        keyFields: [
          { name: 'memoryId1', type: 'UUID', badge: 'FK' },
          { name: 'memoryId2', type: 'UUID', badge: 'FK' },
          { name: 'conflictType', type: 'String', badge: null },
          { name: 'confidence', type: 'Float', badge: 'SCORE' },
          { name: 'suggestedResolution', type: 'String', badge: null },
        ],
        relations: [],
      },
      {
        name: 'MemoryRelationship',
        fieldCount: 7,
        description: 'Graph edges between memories — similar, contradicts, supports, derived_from',
        keyFields: [
          { name: 'sourceMemoryId', type: 'UUID', badge: 'FK' },
          { name: 'targetMemoryId', type: 'UUID', badge: 'FK' },
          { name: 'relationshipType', type: 'String', badge: null },
          { name: 'strength', type: 'Float', badge: 'SCORE' },
        ],
        relations: [],
      },
      {
        name: 'MemoryExtractionJob',
        fieldCount: 12,
        description: 'Async pipeline for extracting memories from conversations',
        keyFields: [
          { name: 'status', type: 'String', badge: 'LIFECYCLE' },
          { name: 'priority', type: 'Int', badge: null },
          { name: 'extractedMemories', type: 'JSON', badge: null },
        ],
        relations: [],
      },
      {
        name: 'MemoryAnalytics',
        fieldCount: 16,
        description: 'Per-user memory statistics — counts by type, importance distribution, consolidation metrics',
        keyFields: [
          { name: 'userId', type: 'UUID', badge: 'UNIQUE' },
          { name: 'totalMemories', type: 'Int', badge: 'STAT' },
          { name: 'memoriesByType', type: 'JSON', badge: null },
          { name: 'criticalCount', type: 'Int', badge: null },
        ],
        relations: [],
      },
    ],
  },
  {
    id: 'context',
    label: 'Context Engine',
    icon: '⚡',
    color: '#14B8A6', // teal-500
    description: 'Topic profiling, entity tracking, context compilation, and real-time presence prediction',
    models: [
      {
        name: 'TopicProfile',
        fieldCount: 26,
        description: 'Per-user topic expertise tracking — proficiency levels, engagement streaks, compiled context with vector embeddings',
        keyFields: [
          { name: 'slug', type: 'String', badge: null },
          { name: 'domain', type: 'String', badge: null },
          { name: 'proficiencyLevel', type: 'String', badge: null },
          { name: 'importanceScore', type: 'Float', badge: 'SCORE' },
          { name: 'engagementStreak', type: 'Int', badge: null },
          { name: 'compiledContext', type: 'String', badge: null },
          { name: 'embedding', type: 'vector(1536)', badge: 'AI' },
        ],
        relations: ['→ User (N:1)', '→ TopicConversation (1:N)', '→ ContextBundle (1:N)'],
      },
      {
        name: 'EntityProfile',
        fieldCount: 20,
        description: 'People, places, things — tracked with sentiment, mentions, compiled context',
        keyFields: [
          { name: 'name', type: 'String', badge: null },
          { name: 'type', type: 'String', badge: null },
          { name: 'sentiment', type: 'Float', badge: 'SCORE' },
          { name: 'mentionCount', type: 'Int', badge: 'STAT' },
          { name: 'embedding', type: 'vector(1536)', badge: 'AI' },
        ],
        relations: ['→ User (N:1)', '→ ContextBundle (1:N)'],
      },
      {
        name: 'ContextBundle',
        fieldCount: 17,
        description: 'Pre-compiled context packages linking topics, entities, conversations, and personas — with cache metrics',
        keyFields: [
          { name: 'bundleType', type: 'String', badge: null },
          { name: 'compiledPrompt', type: 'String', badge: null },
          { name: 'tokenCount', type: 'Int', badge: null },
          { name: 'priority', type: 'Float', badge: 'SCORE' },
          { name: 'hitCount', type: 'Int', badge: 'CACHE' },
          { name: 'missCount', type: 'Int', badge: 'CACHE' },
        ],
        relations: ['→ User (N:1)', '→ TopicProfile (N:1)', '→ EntityProfile (N:1)', '→ Conversation (N:1)', '→ AiPersona (N:1)'],
      },
      {
        name: 'ConversationCompaction',
        fieldCount: 11,
        description: 'Intelligent conversation summarization with compression ratios, key decisions, and code artifacts',
        keyFields: [
          { name: 'summary', type: 'String', badge: null },
          { name: 'compressionRatio', type: 'Float', badge: null },
          { name: 'keyDecisions', type: 'JSON', badge: null },
          { name: 'codeArtifacts', type: 'JSON', badge: null },
        ],
        relations: ['→ Conversation (N:1)'],
      },
      {
        name: 'UserContextSettings',
        fieldCount: 28,
        description: 'Per-user context engine configuration — token budgets, similarity thresholds, feature flags, compression strategies',
        keyFields: [
          { name: 'maxContextTokens', type: 'Int', badge: null },
          { name: 'topicSimilarityThreshold', type: 'Float', badge: null },
          { name: 'memorySimilarityThreshold', type: 'Float', badge: null },
          { name: 'enablePredictions', type: 'Boolean', badge: 'FLAG' },
          { name: 'enableJitRetrieval', type: 'Boolean', badge: 'FLAG' },
        ],
        relations: ['→ User (1:1)'],
      },
      {
        name: 'ClientPresence',
        fieldCount: 16,
        description: 'Real-time device state — active conversation, navigation history, predicted topics/entities, heartbeat',
        keyFields: [
          { name: 'activeConversationId', type: 'String', badge: null },
          { name: 'predictedTopics', type: 'String[]', badge: 'AI' },
          { name: 'predictedEntities', type: 'String[]', badge: 'AI' },
          { name: 'isOnline', type: 'Boolean', badge: null },
        ],
        relations: ['→ User (N:1)'],
      },
      {
        name: 'AiPersona',
        fieldCount: 12,
        description: 'Custom AI personality definitions with triggers, system prompts, and model configuration',
        keyFields: [
          { name: 'name', type: 'String', badge: null },
          { name: 'trigger', type: 'String', badge: 'UNIQUE per user' },
          { name: 'systemPrompt', type: 'String', badge: null },
          { name: 'provider', type: 'String', badge: null },
          { name: 'model', type: 'String', badge: null },
        ],
        relations: ['→ User (N:1)', '→ ContextBundle (1:N)'],
      },
    ],
  },
  {
    id: 'sharing',
    label: 'Sharing & Access',
    icon: '🔗',
    color: '#EF4444', // red-500
    description: 'Declarative sharing intents, granular permissions, multi-stakeholder ownership, and distributed content',
    models: [
      {
        name: 'SharingIntent',
        fieldCount: 24,
        description: 'Declarative sharing — SHARE/PUBLISH/EMBED/FORK with audience targeting, permissions, scheduling, transformations',
        keyFields: [
          { name: 'intentType', type: 'IntentType', badge: 'ENUM' },
          { name: 'contentType', type: 'ContentType', badge: 'ENUM' },
          { name: 'contentScope', type: 'ContentScope', badge: 'ENUM' },
          { name: 'audienceType', type: 'AudienceType', badge: 'ENUM' },
          { name: 'status', type: 'IntentStatus', badge: 'LIFECYCLE' },
          { name: 'permissions', type: 'JSON', badge: null },
        ],
        relations: ['→ ContentRecord (1:N)', '→ ContentAccessGrant (1:N)', '→ ShareLink (1:1)'],
      },
      {
        name: 'SharingPolicy',
        fieldCount: 14,
        description: 'Granular policies with temporal, geographic, contextual, and collaborative permission rules',
        keyFields: [
          { name: 'audience', type: 'JSON', badge: null },
          { name: 'permissions', type: 'JSON', badge: null },
          { name: 'temporal', type: 'JSON', badge: null },
          { name: 'geographic', type: 'JSON', badge: null },
        ],
        relations: ['→ User (N:1)', '→ ContentStakeholder (1:N)'],
      },
      {
        name: 'ContentStakeholder',
        fieldCount: 9,
        description: 'Multi-party ownership — each stakeholder has roles, contributions, privacy settings, and influence scores',
        keyFields: [
          { name: 'role', type: 'String', badge: null },
          { name: 'contribution', type: 'String', badge: null },
          { name: 'influenceScore', type: 'Int', badge: 'SCORE' },
          { name: 'privacySettings', type: 'JSON', badge: null },
        ],
        relations: ['→ SharingPolicy (N:1)', '→ User (N:1)'],
      },
      {
        name: 'ShareLink',
        fieldCount: 10,
        description: 'Shareable links with password protection, usage limits, and expiry',
        keyFields: [
          { name: 'linkCode', type: 'String', badge: 'UNIQUE' },
          { name: 'maxUses', type: 'Int', badge: null },
          { name: 'passwordHash', type: 'String', badge: 'HASHED' },
          { name: 'isActive', type: 'Boolean', badge: null },
        ],
        relations: ['→ SharingIntent (1:1)'],
      },
      {
        name: 'ContentRecord',
        fieldCount: 14,
        description: 'Content registry with content hashing, lifecycle status, and distributed provider tracking',
        keyFields: [
          { name: 'contentHash', type: 'String', badge: null },
          { name: 'contentType', type: 'ContentType', badge: 'ENUM' },
          { name: 'status', type: 'Status', badge: 'LIFECYCLE' },
          { name: 'discoveryMetadata', type: 'JSON', badge: null },
        ],
        relations: ['→ SharingIntent (N:1)', '→ ContentProvider (1:N)'],
      },
      {
        name: 'ContentProvider',
        fieldCount: 13,
        description: 'Distributed storage tracking — which nodes hold replicas of content',
        keyFields: [
          { name: 'nodeId', type: 'String', badge: null },
          { name: 'isOwner', type: 'Boolean', badge: null },
          { name: 'isPrimary', type: 'Boolean', badge: null },
          { name: 'checksum', type: 'String', badge: null },
        ],
        relations: ['→ ContentRecord (N:1)'],
      },
    ],
  },
  {
    id: 'rendering',
    label: 'Rendering',
    icon: '🎨',
    color: '#6366F1', // indigo-500
    description: 'Template-based rendering, caching, and style presets for conversation display',
    models: [
      {
        name: 'RenderingTemplate',
        fieldCount: 16,
        description: 'Reusable styling templates — feed cards, scroll items, conversation views — with conditional application rules',
        keyFields: [
          { name: 'name', type: 'String', badge: 'UNIQUE' },
          { name: 'templateType', type: 'String', badge: null },
          { name: 'styles', type: 'JSONB', badge: null },
          { name: 'layout', type: 'String', badge: null },
          { name: 'conditions', type: 'JSONB', badge: null },
        ],
        relations: [],
      },
      {
        name: 'RenderingCache',
        fieldCount: 14,
        description: 'Performance cache for rendered conversations — tracks hits, render time, content size',
        keyFields: [
          { name: 'conversationId', type: 'UUID', badge: 'UNIQUE FK' },
          { name: 'contentHash', type: 'String', badge: 'INVALIDATION' },
          { name: 'renderedData', type: 'JSONB', badge: null },
          { name: 'renderTimeMs', type: 'Int', badge: 'PERF' },
          { name: 'hits', type: 'Int', badge: 'CACHE' },
        ],
        relations: ['→ Conversation (1:1)'],
      },
      {
        name: 'MessageStylePreset',
        fieldCount: 16,
        description: 'Predefined visual styles — background, border, typography, shadows — with conditional role/provider targeting',
        keyFields: [
          { name: 'name', type: 'String', badge: 'UNIQUE' },
          { name: 'twClasses', type: 'String[]', badge: 'TAILWIND' },
          { name: 'applyToRole', type: 'String', badge: null },
          { name: 'applyToProvider', type: 'String', badge: null },
        ],
        relations: [],
      },
    ],
  },
  {
    id: 'moderation',
    label: 'Moderation',
    icon: '🛡️',
    color: '#F43F5E', // rose-500
    description: 'Content flagging, AI detection, automated rules, strike system, and appeals workflow',
    models: [
      {
        name: 'ContentFlag',
        fieldCount: 22,
        description: 'Content reports with 13 reason types, AI-assisted detection with confidence scores, full appeal lifecycle',
        keyFields: [
          { name: 'contentType', type: 'String', badge: null },
          { name: 'reason', type: 'ModerationReason', badge: 'ENUM (13)' },
          { name: 'status', type: 'ModerationStatus', badge: 'ENUM (8)' },
          { name: 'priority', type: 'Priority', badge: 'ENUM' },
          { name: 'aiDetected', type: 'Boolean', badge: null },
          { name: 'aiConfidence', type: 'Float', badge: 'SCORE' },
        ],
        relations: [],
      },
      {
        name: 'ModerationRule',
        fieldCount: 14,
        description: 'Automated moderation — keyword matching, pattern detection, AI score thresholds with configurable actions',
        keyFields: [
          { name: 'conditionType', type: 'String', badge: null },
          { name: 'condition', type: 'JSON', badge: null },
          { name: 'action', type: 'String', badge: null },
          { name: 'maxStrikes', type: 'Int', badge: null },
        ],
        relations: [],
      },
      {
        name: 'UserModerationRecord',
        fieldCount: 17,
        description: 'Per-user strike system — counts by category, warning/ban status, appeal tracking',
        keyFields: [
          { name: 'userId', type: 'UUID', badge: 'UNIQUE' },
          { name: 'totalStrikes', type: 'Int', badge: null },
          { name: 'isBanned', type: 'Boolean', badge: null },
          { name: 'banExpiresAt', type: 'DateTime', badge: null },
        ],
        relations: [],
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics & Ops',
    icon: '📊',
    color: '#64748B', // slate-500
    description: 'Event tracking, time-series aggregations, sync infrastructure, federation, and import pipelines',
    models: [
      {
        name: 'AnalyticsEvent',
        fieldCount: 8,
        description: 'Event stream with 18 event types — shares, views, clicks, saves, reports',
        keyFields: [
          { name: 'eventType', type: 'AnalyticsEventType', badge: 'ENUM (18)' },
          { name: 'actorDid', type: 'String', badge: null },
          { name: 'eventData', type: 'JSON', badge: null },
          { name: 'isProcessed', type: 'Boolean', badge: null },
        ],
        relations: [],
      },
      {
        name: 'AggregatedMetrics',
        fieldCount: 7,
        description: 'Time-series aggregations — HOURLY through YEARLY for sharing, engagement, reach, and performance',
        keyFields: [
          { name: 'metricType', type: 'MetricType', badge: 'ENUM (4)' },
          { name: 'aggregationType', type: 'AggregationType', badge: 'ENUM (5)' },
          { name: 'metrics', type: 'JSON', badge: null },
        ],
        relations: [],
      },
      {
        name: 'SyncOperation / SyncCursor',
        fieldCount: 22,
        description: 'CRDT-based sync with Hybrid Logical Clock timestamps, vector clocks, and per-device cursors',
        keyFields: [
          { name: 'hlcTimestamp', type: 'String', badge: 'HLC' },
          { name: 'vectorClock', type: 'JSON', badge: 'CRDT' },
          { name: 'operation', type: 'String', badge: null },
          { name: 'payload', type: 'JSON', badge: null },
        ],
        relations: [],
      },
      {
        name: 'ImportJob',
        fieldCount: 20,
        description: 'Tiered import pipeline — 5 progressive tiers from CORE storage through full INDEXING',
        keyFields: [
          { name: 'status', type: 'ImportJobStatus', badge: 'ENUM (9)' },
          { name: 'currentTier', type: 'ImportTier', badge: 'ENUM (5)' },
          { name: 'tierProgress', type: 'JSON', badge: null },
          { name: 'totalConversations', type: 'Int', badge: 'STAT' },
          { name: 'fileHash', type: 'String', badge: 'INTEGRITY' },
        ],
        relations: ['→ User (N:1)', '→ ImportedConversation (1:N)'],
      },
      {
        name: 'PeerConnection',
        fieldCount: 7,
        description: 'P2P federation — bidirectional trust relationships between DIDs',
        keyFields: [
          { name: 'initiatorDid', type: 'String', badge: null },
          { name: 'targetDid', type: 'String', badge: null },
          { name: 'trustLevel', type: 'String', badge: null },
        ],
        relations: [],
      },
      {
        name: 'Insight',
        fieldCount: 10,
        description: 'AI-generated insights — pattern/anomaly detection, recommendations, alerts — with confidence scoring',
        keyFields: [
          { name: 'insightType', type: 'InsightType', badge: 'ENUM (5)' },
          { name: 'title', type: 'String', badge: null },
          { name: 'confidence', type: 'Float', badge: 'SCORE' },
          { name: 'relevanceScore', type: 'Float', badge: 'SCORE' },
        ],
        relations: [],
      },
    ],
  },
];
```

### Component 2: The Interactive Explorer

```tsx
// SchemaExplorer.tsx
export default function SchemaExplorer() {
  const [activeDomain, setActiveDomain] = useState(DOMAINS[0]);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background: subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Open Source Schema
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Every Data Schema.{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Fully Public.
            </span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            We believe your AI conversation data deserves transparency. Our complete data model
            is open source — inspect every table, every relationship, every field.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {[
            { label: 'Models', value: '42+' },
            { label: 'Domains', value: '9' },
            { label: 'Enums', value: '30+' },
            { label: 'Relations', value: '80+' },
            { label: 'Vector Fields', value: '4' },
            { label: 'Open Source', value: '100%' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold font-mono">{stat.value}</div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Explorer: Sidebar + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          
          {/* Domain Sidebar */}
          <div className="space-y-1">
            {DOMAINS.map((domain) => (
              <button
                key={domain.id}
                onClick={() => {
                  setActiveDomain(domain);
                  setExpandedModel(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  activeDomain.id === domain.id
                    ? 'bg-white/10 border border-white/10'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: domain.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{domain.label}</div>
                  <div className="text-xs text-neutral-500">{domain.models.length} models</div>
                </div>
                {activeDomain.id === domain.id && (
                  <span className="text-xs text-neutral-400">▸</span>
                )}
              </button>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {/* Domain Header */}
            <div
              className="px-6 py-5 border-b border-white/10"
              style={{ borderLeftColor: activeDomain.color, borderLeftWidth: 3 }}
            >
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <span>{activeDomain.icon}</span>
                {activeDomain.label}
              </h3>
              <p className="text-sm text-neutral-400 mt-1">{activeDomain.description}</p>
            </div>

            {/* Models List */}
            <div className="divide-y divide-white/5">
              {activeDomain.models.map((model) => (
                <div key={model.name} className="group">
                  {/* Model Header Row */}
                  <button
                    onClick={() => setExpandedModel(
                      expandedModel === model.name ? null : model.name
                    )}
                    className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: activeDomain.color + '15',
                        color: activeDomain.color,
                      }}
                    >
                      {model.fieldCount}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-semibold text-sm">{model.name}</div>
                      <div className="text-xs text-neutral-500 truncate">{model.description}</div>
                    </div>
                    <span
                      className={`text-neutral-500 transition-transform duration-200 ${
                        expandedModel === model.name ? 'rotate-90' : ''
                      }`}
                    >
                      ▸
                    </span>
                  </button>

                  {/* Expanded Model Detail */}
                  {expandedModel === model.name && (
                    <div className="px-6 pb-5 space-y-4">
                      {/* Fields Table */}
                      <div className="rounded-lg border border-white/5 overflow-hidden">
                        <div className="px-4 py-2 bg-white/[0.03] text-xs font-mono text-neutral-500 uppercase tracking-wider flex">
                          <span className="flex-1">Field</span>
                          <span className="w-32">Type</span>
                          <span className="w-40 text-right">Attributes</span>
                        </div>
                        {model.keyFields.map((field) => (
                          <div
                            key={field.name}
                            className="px-4 py-2 flex items-center text-sm border-t border-white/5 hover:bg-white/[0.02]"
                          >
                            <span className="flex-1 font-mono text-neutral-300">{field.name}</span>
                            <span className="w-32 text-neutral-500 font-mono text-xs">{field.type}</span>
                            <span className="w-40 text-right">
                              {field.badge && (
                                <span
                                  className="inline-block px-2 py-0.5 rounded text-xs font-mono"
                                  style={{
                                    backgroundColor: activeDomain.color + '15',
                                    color: activeDomain.color,
                                  }}
                                >
                                  {field.badge}
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                        {model.fieldCount > model.keyFields.length && (
                          <div className="px-4 py-2 text-xs text-neutral-600 font-mono border-t border-white/5">
                            + {model.fieldCount - model.keyFields.length} more fields...
                          </div>
                        )}
                      </div>

                      {/* Relations */}
                      {model.relations.length > 0 && (
                        <div>
                          <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">
                            Relations
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {model.relations.map((rel, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-neutral-400"
                              >
                                {rel}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <a
            href="https://github.com/YOUR_ORG/YOUR_REPO"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            View Full Schema on GitHub
          </a>
          <p className="text-xs text-neutral-600 mt-3 font-mono">
            schema.prisma · PostgreSQL · pgvector · Open Core
          </p>
        </div>
      </div>
    </section>
  );
}
```

---

## Visual Design Specifications

### Color System
- **Background**: Dark (`#0A0A0A` or your site's dark bg)
- **Surface**: `rgba(255,255,255,0.02)` for cards
- **Borders**: `rgba(255,255,255,0.1)`
- **Text Primary**: `#E5E5E5`
- **Text Secondary**: `#737373`
- **Text Muted**: `#525252`
- **Each domain** gets its own accent color as listed above

### Typography
- **Headings**: Your site's heading font, bold
- **Model names**: Monospace font (`font-mono`), semibold
- **Field names**: Monospace, regular weight
- **Descriptions**: Sans-serif, neutral-400/500

### Spacing
- **Section padding**: `py-24`
- **Card inner padding**: `px-6 py-5`
- **Gap between sidebar and detail**: `gap-6`
- **Max width**: `max-w-7xl`

### Interactions
- **Sidebar items**: Hover → `bg-white/5`, Active → `bg-white/10` with border
- **Model rows**: Hover → subtle background shift
- **Expand/collapse**: Smooth rotation of arrow icon, content slides in
- **Badges**: Use domain accent color at 15% opacity for background, full color for text

### Responsive Behavior
- **Desktop** (lg+): Side-by-side layout, sidebar on left
- **Tablet/Mobile**: Stack vertically — domain selector becomes horizontal scrollable pills row, detail panel below

For mobile, convert the sidebar to:
```tsx
{/* Mobile Domain Pills */}
<div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
  {DOMAINS.map((domain) => (
    <button
      key={domain.id}
      onClick={() => setActiveDomain(domain)}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm whitespace-nowrap ${
        activeDomain.id === domain.id
          ? 'bg-white/10 border border-white/10'
          : 'bg-white/5 border border-transparent'
      }`}
    >
      <span className="mr-2">{domain.icon}</span>
      {domain.label}
    </button>
  ))}
</div>
```

---

## Key Design Principles

1. **Not a code dump** — This is an interactive explorer that makes the schema feel approachable and intentional. Users can drill into exactly what they care about.

2. **Domain-driven organization** — The 9 domains tell a story: "We handle your data, identity, social graph, memories, context, sharing, rendering, moderation, and analytics — and it's all transparent."

3. **Progressive disclosure** — Domain list → Model list with counts → Expandable field details. Never overwhelming.

4. **Technical credibility** — Monospace fonts, field types, badges for PK/FK/UNIQUE/ENUM, relationship arrows — these signal engineering rigor.

5. **Badges communicate features** — `AI` for vector embeddings, `CRYPTO` for signatures/keys, `CRDT` for sync, `SCORE` for computed values, `LIFECYCLE` for state machines, `DEDUP` for content hashing.

---

## Enums Reference (for completeness)

Include these as a collapsible section or tooltip content:

| Enum | Values |
|------|--------|
| AccountStatus | ACTIVE, SUSPENDED, BANNED, DELETING, DELETED |
| MemoryType | EPISODIC, SEMANTIC, PROCEDURAL, FACTUAL, PREFERENCE, IDENTITY, RELATIONSHIP, GOAL, PROJECT, CUSTOM |
| MemoryImportance | CRITICAL, HIGH, MEDIUM, LOW, MINIMAL |
| MemoryConsolidationStatus | RAW, CONSOLIDATING, CONSOLIDATED, MERGED, ARCHIVED |
| FriendStatus | PENDING, ACCEPTED, REJECTED, BLOCKED, CANCELLED |
| FollowStatus | PENDING, ACTIVE, BLOCKED |
| GroupType | GENERAL, STUDY, PROJECT, COMMUNITY |
| GroupVisibility | PUBLIC, APPROVAL, PRIVATE |
| GroupMemberRole | OWNER, ADMIN, MODERATOR, MEMBER |
| TeamType | WORK, PROJECT, PERSONAL |
| TeamVisibility | OPEN, INVITE |
| TeamMemberRole | OWNER, ADMIN, MEMBER, GUEST |
| ChannelType | PUBLIC, PRIVATE, DIRECT |
| IntentType | SHARE, PUBLISH, EMBED, FORK |
| ContentType | CONVERSATION, ACU, COLLECTION, NOTEBOOK, MEMORY |
| ContentScope | FULL, PARTIAL, SUMMARY, PREVIEW |
| AudienceType | PUBLIC, CIRCLE, USERS, LINK |
| IntentStatus | DRAFT, PENDING, VALIDATED, ACTIVE, EXPIRED, REVOKED, CANCELLED, ARCHIVED |
| ContentRecordStatus | ACTIVE, EXPIRED, REVOKED, ARCHIVED, CORRUPTED |
| ModerationReason | SPAM, HARASSMENT, HATE_SPEECH, VIOLENCE, SEXUAL, DANGEROUS, MISINFORMATION, PRIVACY, COPYRIGHT, IMPERSONATION, SELF_HARM, UNDERAGE, OTHER |
| ModerationStatus | PENDING, REVIEWING, APPROVED, FLAGGED, REMOVED, WARNED, BANNED, APPEALED |
| ModerationPriority | LOW, MEDIUM, HIGH, CRITICAL |
| AnalyticsEventType | SHARE_CREATED, SHARE_VIEWED, SHARE_ACCEPTED, SHARE_DECLINED, SHARE_REVOKED, SHARE_EXPIRED, LINK_CLICKED, LINK_CREATED, CONTENT_SAVED, CONTENT_FORWARDED, CONTENT_ANNOTATED, SHARE_BLOCKED, SHARE_REPORTED |
| MetricType | SHARING_METRICS, ENGAGEMENT_METRICS, REACH_METRICS, PERFORMANCE_METRICS |
| AggregationType | HOURLY, DAILY, WEEKLY, MONTHLY, YEARLY |
| InsightType | PATTERN_DETECTED, ANOMALY_DETECTED, RECOMMENDATION, TREND_DETECTED, ALERT |
| ImportJobStatus | PENDING, SCANNING, WAITING_FOR_USER, PROCESSING, TIER_COMPLETE, COMPLETED, FAILED, CANCELLED, PAUSED |
| ImportTier | TIER_0_CORE, TIER_1_ACU, TIER_2_MEMORY, TIER_3_CONTEXT, TIER_4_INDEX |
| ImportConversationState | PENDING, VALIDATING, STORED, ACU_GENERATED, MEMORY_EXTRACTED, CONTEXT_ENRICHED, INDEXED, COMPLETED, FAILED |s
