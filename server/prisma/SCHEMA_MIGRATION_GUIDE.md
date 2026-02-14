# OpenScroll Schema Migration Guide

## Overview

This guide explains the transition from the current extraction-focused schema to the extended blueprint-aligned schema.

## Current Schema vs. Extended Schema

### **Current Schema (`schema.prisma`)** - Extraction-Focused ✅
**Purpose:** Store raw conversations and messages from AI providers

**Tables:**
- ✅ `Conversation` - Complete conversations with metadata
- ✅ `Message` - Individual messages with multimodal content parts
- ✅ `CaptureAttempt` - Analytics and retry tracking
- ✅ `ProviderStats` - Aggregated provider metrics

**Strengths:**
- Production-ready for extraction pipeline
- Excellent multimodal content support (JSONB parts)
- Good analytics/debugging capabilities
- Compatible with OpenAI/LangChain formats

**Limitations:**
- No ACU decomposition
- No knowledge graph relationships
- No identity/sharing infrastructure
- No semantic search support
- No P2P foundation

---

### **Extended Schema (`schema-extended.prisma`)** - Blueprint-Aligned 🚀
**Purpose:** Add ACU knowledge graph + P2P sharing while keeping extraction features

**New Tables:**

#### **Identity & User Management**
- 🆕 `User` - DID-based user identity with cryptographic keys
- 🆕 `Device` - Multi-device support with trust management

#### **Atomic Chat Units (ACUs)**
- 🆕 `AtomicChatUnit` - Decomposed knowledge units with:
  - Content hash as ID (SHA3-256)
  - Semantic classification (type, category)
  - Vector embeddings (384-dim for semantic search)
  - Quality metrics (richness, integrity, uniqueness)
  - Sharing policies (self, circle, network)
  - Provenance tracking (links to Message/Conversation)

#### **Knowledge Graph**
- 🆕 `AcuLink` - Relationships between ACUs:
  - Sequential: `next`, `previous`
  - Semantic: `explains`, `answers`, `similar_to`
  - Structural: `parent_of`, `child_of`
  - Evolution: `version_of`, `replaces`

#### **Sharing Infrastructure**
- 🆕 `Circle` - Sharing groups for P2P
- 🆕 `CircleMember` - Circle membership with roles/permissions

#### **Reciprocity Tracking**
- 🆕 `Contribution` - Track what users share
- 🆕 `Consumption` - Track what users receive
- Enables reciprocity score calculation

---

## Migration Strategy

### **Phase 1: Additive Migration (Recommended)** ✅

**Keep both schemas running in parallel:**

1. **Current schema** continues handling extraction
2. **Extended schema** adds ACU processing as a background job

**Benefits:**
- ✅ Zero downtime
- ✅ Backward compatible
- ✅ Gradual rollout
- ✅ Easy rollback

**Steps:**

```bash
# 1. Create new migration
cd apps/server
bunx prisma migrate dev --name add_acu_tables --schema prisma/schema-extended.prisma

# 2. Run migration
bunx prisma migrate deploy

# 3. Generate new Prisma client
bunx prisma generate --schema prisma/schema-extended.prisma
```

**Code Changes:**

```typescript
// apps/server/src/services/acu-processor.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function processConversationToACUs(conversationId) {
  // 1. Fetch conversation and messages
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: true }
  });

  // 2. Call Rust core to decompose into ACUs
  const acus = await rustCore.processCapture(JSON.stringify(conversation));

  // 3. Save ACUs to database
  for (const acu of acus) {
    await prisma.atomicChatUnit.create({
      data: {
        id: acu.id, // Content hash
        authorDid: acu.author_did,
        signature: Buffer.from(acu.signature),
        content: acu.content,
        language: acu.language,
        type: acu.type,
        category: acu.category,
        conversationId: conversation.id,
        messageId: acu.provenance.message_id,
        messageIndex: acu.provenance.message_index,
        provider: conversation.provider,
        model: conversation.model,
        sourceTimestamp: new Date(acu.provenance.source_timestamp),
        createdAt: new Date(),
        indexedAt: new Date()
      }
    });
  }

  // 4. Create ACU links (graph relationships)
  // ... (see blueprint for link creation logic)
}
```

---

### **Phase 2: Full Replacement (Future)**

Once ACU processing is stable, you can:

1. Merge `schema-extended.prisma` → `schema.prisma`
2. Remove old extraction-only code
3. Use ACUs as the primary data model

---

## Key Differences Explained

### **1. Conversation → ACU Decomposition**

**Before (Current):**
```
Conversation
  └── Message (role: assistant)
      └── parts: [
            { type: "text", content: "Here's how to handle errors in Rust:" },
            { type: "code", content: "fn main() { ... }", language: "rust" },
            { type: "text", content: "You should also consider..." }
          ]
```

**After (Extended):**
```
Conversation
  └── Message
      └── ACU #1 (type: statement)
          "Here's how to handle errors in Rust:"
      └── ACU #2 (type: code_snippet, language: rust)
          "fn main() { ... }"
      └── ACU #3 (type: statement)
          "You should also consider..."
      
      Links:
      ACU #1 --[next]--> ACU #2
      ACU #2 --[next]--> ACU #3
      ACU #2 --[explains]--> ACU #1
```

**Benefits:**
- ✅ Granular search (find specific code blocks)
- ✅ Granular sharing (share just the code)
- ✅ Semantic understanding (type classification)
- ✅ Knowledge graph (relationships)

---

### **2. Identity: Email → DID**

**Before (Current):**
```
No user table - conversations are anonymous
```

**After (Extended):**
```
User
  ├── did: "did:key:z6MkhaXg..." (decentralized identifier)
  ├── publicKey: "..." (Ed25519)
  ├── devices: [Device, Device]
  └── conversations: [Conversation, ...]
```

**Benefits:**
- ✅ Self-sovereign identity (no central authority)
- ✅ Multi-device support
- ✅ Cryptographic authentication
- ✅ P2P ready

---

### **3. Sharing: None → Circles + Reciprocity**

**Before (Current):**
```
No sharing infrastructure
```

**After (Extended):**
```
Circle (name: "Rust Community")
  ├── owner: User
  ├── members: [CircleMember, ...]
  └── shared ACUs with policy: "circle"

Reciprocity:
  User A contributes 10 ACUs → score: 1.5
  User B contributes 2 ACUs  → score: 0.3
  
  User B requests ACU from User A:
  → Denied (score 0.3 < required 0.5)
  → Prompt: "Share more to access this content"
```

**Benefits:**
- ✅ Controlled sharing (self, circle, network)
- ✅ Fair access (reciprocity-based)
- ✅ Privacy (granular permissions)
- ✅ Sustainable P2P network

---

## Database Size Estimates

### **Current Schema (1000 conversations)**
- Conversations: ~500 KB
- Messages: ~5 MB
- CaptureAttempts: ~200 KB
- **Total: ~5.7 MB**

### **Extended Schema (1000 conversations → 50K ACUs)**
- Conversations: ~500 KB
- Messages: ~5 MB
- ACUs: ~25 MB (with embeddings: ~75 MB)
- ACU Links: ~5 MB
- Users/Devices/Circles: ~1 MB
- **Total: ~36.5 MB (with embeddings: ~86.5 MB)**

**Growth factor: ~6-15x** (mostly from embeddings)

---

## Performance Considerations

### **Indexes Added**
All critical queries are indexed:
- ✅ ACU by conversation/message
- ✅ ACU by type/category
- ✅ ACU by quality/rediscovery score
- ✅ ACU links by source/target
- ✅ User by DID
- ✅ Circle membership

### **Query Performance**
- Conversation list: **No change** (same table)
- Message view: **No change** (same table)
- ACU search: **New capability** (~50-200ms with indexes)
- Semantic search: **New capability** (~100-500ms with vector index)
- Graph traversal: **New capability** (~10-100ms per hop)

---

## Migration Checklist

### **Before Migration**
- [ ] Backup production database
- [ ] Test migration on staging
- [ ] Review new table structures
- [ ] Plan ACU processing pipeline
- [ ] Estimate storage requirements

### **During Migration**
- [ ] Run `prisma migrate dev` on staging
- [ ] Verify all tables created
- [ ] Test Prisma client generation
- [ ] Run sample ACU processing
- [ ] Check performance

### **After Migration**
- [ ] Monitor database size
- [ ] Monitor query performance
- [ ] Set up ACU background processing
- [ ] Implement embedding generation
- [ ] Add graph relationship detection

---

## Rollback Plan

If issues arise:

```bash
# 1. Revert to previous migration
bunx prisma migrate resolve --rolled-back <migration_name>

# 2. Drop new tables manually (if needed)
psql $DATABASE_URL -c "DROP TABLE IF EXISTS atomic_chat_units CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS acu_links CASCADE;"
# ... etc

# 3. Regenerate Prisma client from original schema
bunx prisma generate --schema prisma/schema.prisma
```

---

## Next Steps

1. **Review extended schema** (`schema-extended.prisma`)
2. **Test locally** with sample data
3. **Implement ACU processor** (Rust core integration)
4. **Add background job** for ACU generation
5. **Build ACU API endpoints** (`/api/v1/acus/*`)
6. **Update PWA** to display ACUs

---

## Questions?

- **Q: Do I need to migrate immediately?**
  - A: No! Current schema works fine. Migrate when ready for ACU features.

- **Q: Can I use both schemas?**
  - A: Yes! They're designed to coexist. ACUs are additive.

- **Q: Will this break existing code?**
  - A: No! All existing tables remain unchanged.

- **Q: How do I generate ACUs from existing conversations?**
  - A: Run a background job that calls Rust core's `process_capture()` for each conversation.

- **Q: What about vector search?**
  - A: Use PostgreSQL's `pgvector` extension or separate LanceDB instance.
