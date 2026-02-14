# Schema Comparison: Current vs Extended

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CURRENT SCHEMA (Extraction)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐       │
│   │ Conversation │◄────────│   Message    │         │CaptureAttempt│       │
│   ├──────────────┤  1:N    ├──────────────┤         ├──────────────┤       │
│   │ id           │         │ id           │         │ sourceUrl    │       │
│   │ provider     │         │ role         │         │ status       │       │
│   │ sourceUrl    │         │ author       │         │ duration     │       │
│   │ title        │         │ parts (JSONB)│         │ errorMessage │       │
│   │ model        │         │ messageIndex │         └──────────────┘       │
│   │ createdAt    │         │ createdAt    │                                │
│   │ messageCount │         └──────────────┘         ┌──────────────┐       │
│   │ totalWords   │                                  │ProviderStats │       │
│   │ totalTokens  │                                  ├──────────────┤       │
│   └──────────────┘                                  │ provider     │       │
│                                                      │ totalCaptures│       │
│                                                      │ avgDuration  │       │
│   ✅ Great for extraction                           └──────────────┘       │
│   ❌ No ACU decomposition                                                   │
│   ❌ No knowledge graph                                                     │
│   ❌ No identity/sharing                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXTENDED SCHEMA (Blueprint-Aligned)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      EXTRACTION LAYER (Unchanged)                       │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │   ┌──────────────┐         ┌──────────────┐                            │ │
│  │   │ Conversation │◄────────│   Message    │                            │ │
│  │   ├──────────────┤  1:N    ├──────────────┤                            │ │
│  │   │ id           │         │ id           │                            │ │
│  │   │ provider     │         │ role         │                            │ │
│  │   │ sourceUrl    │         │ parts (JSONB)│                            │ │
│  │   │ ownerId ────────┐      └──────┬───────┘                            │ │
│  │   └──────┬───────┘  │             │                                    │ │
│  │          │          │             │                                    │ │
│  └──────────┼──────────┼─────────────┼────────────────────────────────────┘ │
│             │          │             │                                      │
│  ┌──────────┼──────────┼─────────────┼────────────────────────────────────┐ │
│  │          │          │             │  ACU LAYER (New)                   │ │
│  ├──────────┼──────────┼─────────────┼────────────────────────────────────┤ │
│  │          │          │             │                                    │ │
│  │          │          │             ▼                                    │ │
│  │          │          │      ┌──────────────────┐                        │ │
│  │          │          │      │ AtomicChatUnit   │                        │ │
│  │          │          │      ├──────────────────┤                        │ │
│  │          │          │      │ id (hash)        │                        │ │
│  │          │          │      │ authorDid ───────┼──┐                     │ │
│  │          │          │      │ content          │  │                     │ │
│  │          │          └──────┤ conversationId   │  │                     │ │
│  │          │                 ├─ messageId       │  │                     │ │
│  │          │                 │ type             │  │                     │ │
│  │          │                 │ category         │  │                     │ │
│  │          │                 │ embedding[]      │  │                     │ │
│  │          │                 │ qualityOverall   │  │                     │ │
│  │          │                 │ sharingPolicy    │  │                     │ │
│  │          │                 └────┬─────────────┘  │                     │ │
│  │          │                      │                │                     │ │
│  │          │                      ▼                │                     │ │
│  │          │               ┌──────────────┐        │                     │ │
│  │          │               │   AcuLink    │        │                     │ │
│  │          │               ├──────────────┤        │                     │ │
│  │          │               │ sourceId     │        │                     │ │
│  │          │               │ targetId     │        │                     │ │
│  │          │               │ relation     │        │                     │ │
│  │          │               │ weight       │        │                     │ │
│  │          │               └──────────────┘        │                     │ │
│  │          │                                       │                     │ │
│  └──────────┼───────────────────────────────────────┼─────────────────────┘ │
│             │                                       │                       │
│  ┌──────────┼───────────────────────────────────────┼─────────────────────┐ │
│  │          │          IDENTITY LAYER (New)         │                     │ │
│  ├──────────┼───────────────────────────────────────┼─────────────────────┤ │
│  │          │                                       │                     │ │
│  │          ▼                                       │                     │ │
│  │   ┌─────────────┐                               │                     │ │
│  │   │    User     │◄──────────────────────────────┘                     │ │
│  │   ├─────────────┤                                                     │ │
│  │   │ id          │                                                     │ │
│  │   │ did         │                                                     │ │
│  │   │ publicKey   │                                                     │ │
│  │   └──┬──────────┘                                                     │ │
│  │      │ 1:N                                                            │ │
│  │      ▼                                                                │ │
│  │   ┌─────────────┐                                                     │ │
│  │   │   Device    │                                                     │ │
│  │   ├─────────────┤                                                     │ │
│  │   │ deviceId    │                                                     │ │
│  │   │ deviceName  │                                                     │ │
│  │   │ platform    │                                                     │ │
│  │   │ isTrusted   │                                                     │ │
│  │   └─────────────┘                                                     │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      SHARING LAYER (New)                               │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │   ┌─────────────┐         ┌──────────────┐                            │ │
│  │   │   Circle    │◄────────│CircleMember  │                            │ │
│  │   ├─────────────┤  1:N    ├──────────────┤                            │ │
│  │   │ id          │         │ circleId     │                            │ │
│  │   │ name        │         │ userId       │                            │ │
│  │   │ ownerId     │         │ role         │                            │ │
│  │   │ isPublic    │         │ canShare     │                            │ │
│  │   └─────────────┘         └──────────────┘                            │ │
│  │                                                                         │ │
│  │   ┌──────────────┐        ┌──────────────┐                            │ │
│  │   │Contribution  │        │ Consumption  │                            │ │
│  │   ├──────────────┤        ├──────────────┤                            │ │
│  │   │contributorDid│        │ consumerDid  │                            │ │
│  │   │ acuId        │        │ acuId        │                            │ │
│  │   │ quality      │        │ providerDid  │                            │ │
│  │   └──────────────┘        └──────────────┘                            │ │
│  │                                                                         │ │
│  │   Reciprocity Score = Contributions / Consumptions                     │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ✅ Keeps all extraction features                                           │
│  ✅ Adds ACU knowledge graph                                                │
│  ✅ Adds identity & multi-device                                            │
│  ✅ Adds sharing & reciprocity                                              │
│  ✅ Backward compatible                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Comparison

### Current Flow (Extraction Only)
```
1. User submits URL
   ↓
2. Extractor fetches conversation
   ↓
3. Parse into Conversation + Messages
   ↓
4. Save to database
   ↓
5. Display in UI
```

### Extended Flow (Extraction + ACU Processing)
```
1. User submits URL
   ↓
2. Extractor fetches conversation
   ↓
3. Parse into Conversation + Messages
   ↓
4. Save to database
   ↓
5. [NEW] Background job: Process to ACUs
   ├─ Call Rust core parser
   ├─ Generate embeddings
   ├─ Calculate quality scores
   ├─ Detect relationships (links)
   └─ Save ACUs + AcuLinks
   ↓
6. Display in UI (with ACU features)
   ├─ Semantic search
   ├─ Knowledge graph
   └─ Granular sharing
```

## Feature Comparison Table

| Feature | Current Schema | Extended Schema |
|---------|---------------|-----------------|
| **Capture conversations** | ✅ | ✅ |
| **Store messages** | ✅ | ✅ |
| **Multimodal content** | ✅ (JSONB parts) | ✅ (JSONB parts) |
| **Provider analytics** | ✅ | ✅ |
| **ACU decomposition** | ❌ | ✅ |
| **Semantic search** | ❌ | ✅ (embeddings) |
| **Knowledge graph** | ❌ | ✅ (AcuLinks) |
| **Quality scoring** | ❌ | ✅ |
| **User identity (DID)** | ❌ | ✅ |
| **Multi-device** | ❌ | ✅ |
| **Sharing circles** | ❌ | ✅ |
| **Reciprocity** | ❌ | ✅ |
| **P2P foundation** | ❌ | ✅ |

## Storage Comparison (1000 conversations)

```
Current Schema:
┌────────────────────┬──────────┐
│ Table              │ Size     │
├────────────────────┼──────────┤
│ Conversations      │ 500 KB   │
│ Messages           │ 5 MB     │
│ CaptureAttempts    │ 200 KB   │
│ ProviderStats      │ 10 KB    │
├────────────────────┼──────────┤
│ TOTAL              │ ~5.7 MB  │
└────────────────────┴──────────┘

Extended Schema:
┌────────────────────┬──────────┐
│ Table              │ Size     │
├────────────────────┼──────────┤
│ Conversations      │ 500 KB   │
│ Messages           │ 5 MB     │
│ CaptureAttempts    │ 200 KB   │
│ ProviderStats      │ 10 KB    │
│ ─────────────────  │ ──────── │
│ AtomicChatUnits    │ 25 MB    │
│ + Embeddings       │ +50 MB   │
│ AcuLinks           │ 5 MB     │
│ Users              │ 500 KB   │
│ Devices            │ 200 KB   │
│ Circles            │ 100 KB   │
│ Contributions      │ 2 MB     │
│ Consumptions       │ 2 MB     │
├────────────────────┼──────────┤
│ TOTAL (no embed)   │ ~36 MB   │
│ TOTAL (w/ embed)   │ ~86 MB   │
└────────────────────┴──────────┘

Growth: 6-15x (mostly embeddings)
```

## Query Performance Comparison

| Query | Current | Extended | Notes |
|-------|---------|----------|-------|
| List conversations | 10-50ms | 10-50ms | No change |
| View conversation | 20-100ms | 20-100ms | No change |
| Search by text | 100-500ms | 50-200ms | Better with FTS |
| **Semantic search** | ❌ | 100-500ms | New capability |
| **Find related ACUs** | ❌ | 50-200ms | New capability |
| **Graph traversal** | ❌ | 10-100ms/hop | New capability |
| **User reciprocity** | ❌ | 50-150ms | New capability |

## Recommended Migration Path

```
Phase 1: Add Tables (Week 1)
├─ Run migration to add new tables
├─ No code changes needed
└─ Zero impact on existing features

Phase 2: ACU Processing (Week 2-3)
├─ Implement background job
├─ Process existing conversations
└─ Test ACU generation

Phase 3: ACU APIs (Week 4)
├─ Build /api/v1/acus/* endpoints
├─ Add semantic search
└─ Add graph queries

Phase 4: UI Integration (Week 5-6)
├─ Update PWA to show ACUs
├─ Add ACU viewer
└─ Add sharing UI

Phase 5: P2P Foundation (Week 7+)
├─ Implement identity service
├─ Add circle management
└─ Enable P2P sharing
```

## Summary

**Current Schema:**
- ✅ Production-ready for extraction
- ✅ Great for storing conversations
- ❌ Limited to raw data storage

**Extended Schema:**
- ✅ Everything from current schema
- ✅ ACU knowledge graph
- ✅ Semantic search
- ✅ Identity & sharing
- ✅ P2P foundation
- ✅ Backward compatible
- ⚠️ Requires more storage (6-15x)
- ⚠️ Requires background processing

**Recommendation:**
Migrate incrementally. Keep current schema for extraction, add ACU processing as a background job. This gives you the best of both worlds with minimal risk.
