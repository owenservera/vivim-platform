

## Missing: `url` in `datasource db`

The `datasource` block requires a `url` property — without it, Prisma can't connect to the database (for migrations, introspection, or queries):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ← this is missing
}
```

Even when using `driverAdapters` (which lets you provide a programmatic connection at runtime), Prisma **still** requires `url` for:
- `prisma migrate dev / deploy`
- `prisma db push`
- `prisma introspect`
- Schema validation (`prisma validate`)

---

### Minor secondary consideration

If you intend to do **vector similarity search** on `AtomicChatUnit.embedding`, storing it as `Float[]` works for persistence but won't give you vector indexes (HNSW/IVFFlat). You'd want to add `pgvector` via a raw migration:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE atomic_chat_units
  ADD COLUMN embedding_vec vector(384)
  GENERATED ALWAYS AS (embedding::vector(384)) STORED;
CREATE INDEX ON atomic_chat_units
  USING hnsw (embedding_vec vector_cosine_ops);
```

But the **blocking issue** is just the missing `url`.

Looking at this schema carefully, I can identify several things that are missing:

## 1. **`url` field on the datasource**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // THIS IS MISSING
}
```

This is the most critical missing piece — Prisma **will not work** without a connection URL.

## 2. **Relation mismatch on `AtomicChatUnit.author`**

The `author` field references `User.did`:
```prisma
authorDid   String
author      User @relation(fields: [authorDid], references: [did])
```

But `User` has `id` as `@id` and `did` as `@unique`. While this works, the `User` model has `acus AtomicChatUnit[]` — this is fine, but make sure you intended the foreign key to be on `did` rather than `id`.

## 3. **Missing `pgvector` extension for embeddings**

You store embeddings as `Float[]` (a plain Postgres array), but you have no way to do **vector similarity search**. You're missing:

```prisma
generator client {
  previewFeatures = ["driverAdapters", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}
```

And ideally the field should use `Unsupported("vector(384)")` instead of `Float[]` to leverage `pgvector` indexes (IVFFlat/HNSW).

## 4. **Missing referenced tables from the materialized view comments**

The SQL view references `contributions` and `consumptions` tables that **don't exist** in the schema:

```sql
-- These tables are referenced but never defined:
-- LEFT JOIN contributions contrib ON u.did = contrib."contributorDid"
-- LEFT JOIN consumptions consum ON u.did = consum."consumerDid"
```

You need:

```prisma
model Contribution {
  id              String   @id @default(uuid())
  contributorDid  String
  acuId           String?
  quality         Float?
  createdAt       DateTime @default(now()) @db.Timestamptz

  @@index([contributorDid])
  @@map("contributions")
}

model Consumption {
  id            String   @id @default(uuid())
  consumerDid   String
  acuId         String?
  createdAt     DateTime @default(now()) @db.Timestamptz

  @@index([consumerDid])
  @@map("consumptions")
}
```

## 5. **No `@@index` on `embedding` field**

Even with `Float[]`, there's no index for vector search. You'd need a raw migration for an HNSW or IVFFlat index.

## 6. **`SyncCursor.deviceDid` has no relation**

It stores a DID string but has no `@relation` to `Device`. The `Device` model uses `deviceId` not a DID. There's a conceptual gap — is `deviceDid` a device identifier or a user DID?

## 7. **`PeerConnection` has no relations**

The comment acknowledges this, but for a non-POC schema, both `initiatorDid` and `targetDid` should relate to `User.did`.

## Summary of what's missing (ranked by severity):

| # | Missing Item | Severity |
|---|---|---|
| 1 | `url` on datasource | **Fatal** |
| 2 | `contributions` / `consumptions` tables | **Broken views** |
| 3 | pgvector extension for semantic search | **Feature gap** |
| 4 | Vector similarity index on embeddings | **Performance** |
| 5 | `SyncCursor.deviceDid` relation clarity | **Design gap** |
| 6 | `PeerConnection` relations to User | **Loose coupling** |

The **datasource URL** is the showstopper — nothing runs without it.

//


# Dynamic ACU Creation

## The Core Problem

Right now, ACUs are only born from **extraction** (parsing existing conversations). You want users to create them **directly** — as standalone thoughts, notes, annotations, remixes.

## Schema Changes

```prisma
model AtomicChatUnit {
  id          String   @id // Content hash (SHA3-256)
  
  // Authorship
  authorDid   String
  author      User @relation(fields: [authorDid], references: [did])
  signature   Bytes    // Ed25519 signature
  
  // Content
  content     String   @db.Text
  language    String?
  
  // Semantic Classification
  type        String   // ADD NEW TYPES: "note", "thought", "annotation", "remix", "bookmark"
  category    String
  
  // ============================================================
  // CHANGE: Make provenance OPTIONAL (not all ACUs come from chats)
  // ============================================================
  origin          String   @default("extraction") // "extraction", "manual", "remix", "import", "voice"
  
  conversationId  String?  // NOW NULLABLE
  conversation    Conversation? @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  messageId       String?  // NOW NULLABLE
  message         Message? @relation(fields: [messageId], references: [id], onDelete: Cascade)
  messageIndex    Int?     // NOW NULLABLE
  provider        String?  // NOW NULLABLE
  model           String?
  sourceTimestamp  DateTime? @db.Timestamptz // NOW NULLABLE
  
  // NEW: For remix/annotation - what ACU inspired this one?
  parentId        String?
  parent          AtomicChatUnit? @relation("AcuDerivations", fields: [parentId], references: [id])
  derivations     AtomicChatUnit[] @relation("AcuDerivations")
  
  // NEW: Notebooks/Collections
  notebooks       NotebookEntry[]
  
  // ... rest of existing fields stay the same
  
  embedding        Float[]
  embeddingModel   String?
  extractorVersion String?
  parserVersion    String?
  state            String   @default("ACTIVE")
  securityLevel    Int      @default(0)
  isPersonal       Boolean  @default(false)
  level            Int      @default(4)
  contentType      String   @default("text")
  qualityOverall        Float?
  contentRichness       Float?
  structuralIntegrity   Float?
  uniqueness            Float?
  viewCount     Int @default(0)
  shareCount    Int @default(0)
  quoteCount    Int @default(0)
  rediscoveryScore Float?
  sharingPolicy String @default("self")
  sharingCircles String[]
  canView       Boolean @default(true)
  canAnnotate   Boolean @default(false)
  canRemix      Boolean @default(false)
  canReshare    Boolean @default(false)
  expiresAt     DateTime? @db.Timestamptz
  createdAt     DateTime @default(now()) @db.Timestamptz
  indexedAt     DateTime @default(now()) @db.Timestamptz
  linksFrom     AcuLink[] @relation("SourceAcu")
  linksTo       AcuLink[] @relation("TargetAcu")
  metadata      Json @default("{}")
  tags          String[]
  
  @@index([origin])
  @@index([parentId])
  @@index([conversationId])
  @@index([messageId])
  @@index([authorDid])
  @@index([type])
  @@index([category])
  @@index([qualityOverall(sort: Desc)])
  @@index([rediscoveryScore(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@index([sharingPolicy])
  @@index([tags])
  @@map("atomic_chat_units")
}

// NEW: Organize ACUs into collections
model Notebook {
  id          String   @id @default(uuid())
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  
  name        String
  description String?  @db.Text
  icon        String?  // Emoji or Lucide icon
  color       String?  // Hex color
  isDefault   Boolean  @default(false) // "Inbox" notebook
  
  entries     NotebookEntry[]
  
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz
  
  @@index([ownerId])
  @@map("notebooks")
}

model NotebookEntry {
  id          String   @id @default(uuid())
  notebookId  String
  notebook    Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)
  acuId       String
  acu         AtomicChatUnit @relation(fields: [acuId], references: [id], onDelete: Cascade)
  
  sortOrder   Int      @default(0)
  addedAt     DateTime @default(now()) @db.Timestamptz
  
  @@unique([notebookId, acuId])
  @@index([notebookId, sortOrder])
  @@map("notebook_entries")
}
```

Add to User model:
```prisma
model User {
  // ... existing fields ...
  notebooks   Notebook[]
}
```

---

## The ACU Service

```typescript
// src/services/acu-service.ts

import { createHash } from "crypto";
import { sign } from "@noble/ed25519";
import { prisma } from "../db";

// ============================================================
// Types
// ============================================================

interface CreateAcuInput {
  content: string;
  type: AcuType;
  category: AcuCategory;
  origin: AcuOrigin;

  // Optional provenance (for extraction origin)
  conversationId?: string;
  messageId?: string;
  messageIndex?: int;
  provider?: string;
  model?: string;
  sourceTimestamp?: Date;

  // Optional derivation
  parentId?: string;

  // Classification
  language?: string;
  contentType?: string;
  tags?: string[];
  level?: number;

  // Security
  securityLevel?: number;
  isPersonal?: boolean;

  // Sharing
  sharingPolicy?: "self" | "circle" | "network";
  sharingCircles?: string[];

  // Metadata
  metadata?: Record<string, unknown>;
}

type AcuType =
  | "statement"
  | "question"
  | "answer"
  | "code_snippet"
  | "note" // NEW
  | "thought" // NEW
  | "annotation" // NEW
  | "remix" // NEW
  | "bookmark"; // NEW

type AcuCategory =
  | "technical"
  | "conceptual"
  | "procedural"
  | "personal"
  | "creative"; // NEW

type AcuOrigin =
  | "extraction"
  | "manual"
  | "remix"
  | "import"
  | "voice"
  | "quick_capture";

// ============================================================
// Content Hashing (Deterministic ID)
// ============================================================

function computeAcuId(authorDid: string, content: string): string {
  const canonical = JSON.stringify({
    author: authorDid,
    content: content.trim(),
  });

  return createHash("sha3-256").update(canonical).digest("hex");
}

// ============================================================
// Signing
// ============================================================

async function signAcu(
  content: string,
  privateKey: Uint8Array
): Promise<Uint8Array> {
  const contentBytes = new TextEncoder().encode(content);
  return await sign(contentBytes, privateKey);
}

// ============================================================
// Embedding Generation
// ============================================================

async function generateEmbedding(content: string): Promise<{
  embedding: number[];
  model: string;
}> {
  // Option 1: Local model (Bun-native, no network)
  // Using transformers.js or ONNX runtime
  const { pipeline } = await import("@xenova/transformers");
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );
  const output = await embedder(content, {
    pooling: "mean",
    normalize: true,
  });

  return {
    embedding: Array.from(output.data),
    model: "all-MiniLM-L6-v2",
  };
}

// ============================================================
// Quality Scoring
// ============================================================

function scoreQuality(content: string, type: AcuType): {
  qualityOverall: number;
  contentRichness: number;
  structuralIntegrity: number;
  uniqueness: number;
} {
  const words = content.split(/\s+/).length;

  // Content Richness: longer, more detailed = richer
  const contentRichness = Math.min(100, Math.log2(words + 1) * 15);

  // Structural Integrity: has clear structure?
  const hasCodeBlock = /```[\s\S]*```/.test(content);
  const hasList = /^[\s]*[-*•]\s/m.test(content);
  const hasSentenceEnd = /[.!?]/.test(content);
  const structuralIntegrity =
    (hasSentenceEnd ? 40 : 0) +
    (hasCodeBlock ? 30 : 0) +
    (hasList ? 20 : 0) +
    (words > 5 ? 10 : 0);

  // Uniqueness: placeholder (real uniqueness requires comparing embeddings)
  const uniqueness = 70; // Default, updated async later

  const qualityOverall =
    contentRichness * 0.4 +
    structuralIntegrity * 0.3 +
    uniqueness * 0.3;

  return {
    qualityOverall,
    contentRichness,
    structuralIntegrity,
    uniqueness,
  };
}

// ============================================================
// AUTO-LINKING: Find related ACUs
// ============================================================

async function autoLink(
  acuId: string,
  embedding: number[],
  authorDid: string,
  parentId?: string
): Promise<void> {
  const links: Array<{
    sourceId: string;
    targetId: string;
    relation: string;
    weight: number;
  }> = [];

  // 1. Link to parent (if remix/annotation)
  if (parentId) {
    links.push({
      sourceId: acuId,
      targetId: parentId,
      relation: "derived_from",
      weight: 1.0,
    });
  }

  // 2. Find semantically similar ACUs using cosine similarity
  //    Raw SQL because Prisma doesn't support vector ops natively
  const similar = await prisma.$queryRaw<
    Array<{ id: string; similarity: number }>
  >`
    SELECT 
      id,
      1 - (
        embedding <=> ${embedding}::float[]
      ) as similarity
    FROM atomic_chat_units
    WHERE id != ${acuId}
      AND "authorDid" = ${authorDid}
      AND embedding IS NOT NULL
      AND state = 'ACTIVE'
    ORDER BY embedding <=> ${embedding}::float[]
    LIMIT 5
  `;

  for (const match of similar) {
    if (match.similarity > 0.7) {
      links.push({
        sourceId: acuId,
        targetId: match.id,
        relation: "similar_to",
        weight: match.similarity,
      });
    }
  }

  // 3. Batch create links
  if (links.length > 0) {
    await prisma.acuLink.createMany({
      data: links.map((link) => ({
        ...link,
        createdByDid: authorDid,
      })),
      skipDuplicates: true,
    });
  }
}

// ============================================================
// MAIN: Create ACU
// ============================================================

export async function createAcu(
  authorDid: string,
  privateKey: Uint8Array,
  input: CreateAcuInput
) {
  // 1. Compute deterministic ID
  const id = computeAcuId(authorDid, input.content);

  // 2. Check for duplicates (idempotent)
  const existing = await prisma.atomicChatUnit.findUnique({
    where: { id },
  });

  if (existing) {
    return { acu: existing, created: false, reason: "duplicate" };
  }

  // 3. Sign the content
  const signature = await signAcu(input.content, privateKey);

  // 4. Generate embedding
  const { embedding, model: embeddingModel } = await generateEmbedding(
    input.content
  );

  // 5. Score quality
  const quality = scoreQuality(input.content, input.type);

  // 6. Create the ACU
  const acu = await prisma.atomicChatUnit.create({
    data: {
      id,
      authorDid,
      signature: Buffer.from(signature),

      content: input.content.trim(),
      language: input.language,

      type: input.type,
      category: input.category,
      origin: input.origin,

      // Provenance (nullable for manual creation)
      conversationId: input.conversationId ?? null,
      messageId: input.messageId ?? null,
      messageIndex: input.messageIndex ?? null,
      provider: input.provider ?? null,
      model: input.model ?? null,
      sourceTimestamp: input.sourceTimestamp ?? null,

      // Derivation
      parentId: input.parentId ?? null,

      // Embedding
      embedding,
      embeddingModel,

      // Quality
      ...quality,

      // Classification
      contentType: input.contentType ?? "text",
      level: input.level ?? 4,
      tags: input.tags ?? [],

      // Security
      securityLevel: input.securityLevel ?? 0,
      isPersonal: input.isPersonal ?? false,

      // Sharing
      sharingPolicy: input.sharingPolicy ?? "self",
      sharingCircles: input.sharingCircles ?? [],

      // Metadata
      metadata: input.metadata ?? {},
    },
  });

  // 7. Auto-link (async, don't block response)
  autoLink(id, embedding, authorDid, input.parentId).catch(console.error);

  return { acu, created: true };
}

// ============================================================
// QUICK CAPTURE: Minimal friction creation
// ============================================================

export async function quickCapture(
  authorDid: string,
  privateKey: Uint8Array,
  content: string,
  tags?: string[]
) {
  // Auto-classify the content
  const type = inferType(content);
  const category = inferCategory(content);

  return createAcu(authorDid, privateKey, {
    content,
    type,
    category,
    origin: "quick_capture",
    tags,
    level: 5, // Atomic level
  });
}

function inferType(content: string): AcuType {
  if (content.includes("```")) return "code_snippet";
  if (content.endsWith("?")) return "question";
  if (content.length < 140) return "thought";
  return "note";
}

function inferCategory(content: string): AcuCategory {
  const techKeywords =
    /\b(function|class|api|database|server|code|bug|deploy|git)\b/i;
  if (techKeywords.test(content)) return "technical";
  return "conceptual";
}
```

---

## API Routes (Bun + Hono)

```typescript
// src/routes/acu-routes.ts

import { Hono } from "hono";
import { createAcu, quickCapture } from "../services/acu-service";
import { authMiddleware } from "../middleware/auth";

const acuRoutes = new Hono();

// Full ACU creation
acuRoutes.post("/acus", authMiddleware, async (c) => {
  const user = c.get("user"); // From auth middleware
  const body = await c.req.json();

  const result = await createAcu(user.did, user.privateKey, {
    content: body.content,
    type: body.type ?? "note",
    category: body.category ?? "conceptual",
    origin: body.origin ?? "manual",
    parentId: body.parentId,
    tags: body.tags,
    language: body.language,
    contentType: body.contentType,
    securityLevel: body.securityLevel,
    isPersonal: body.isPersonal,
    sharingPolicy: body.sharingPolicy,
    metadata: body.metadata,
  });

  return c.json(result, result.created ? 201 : 200);
});

// Quick capture — minimal friction
acuRoutes.post("/acus/quick", authMiddleware, async (c) => {
  const user = c.get("user");
  const { content, tags } = await c.req.json();

  if (!content?.trim()) {
    return c.json({ error: "Content required" }, 400);
  }

  const result = await quickCapture(user.did, user.privateKey, content, tags);
  return c.json(result, 201);
});

// Remix an existing ACU
acuRoutes.post("/acus/:id/remix", authMiddleware, async (c) => {
  const user = c.get("user");
  const parentId = c.req.param("id");
  const { content, tags } = await c.req.json();

  const result = await createAcu(user.did, user.privateKey, {
    content,
    type: "remix",
    category: "conceptual",
    origin: "remix",
    parentId,
    tags,
  });

  // Increment parent's quote count
  await prisma.atomicChatUnit.update({
    where: { id: parentId },
    data: { quoteCount: { increment: 1 } },
  });

  return c.json(result, 201);
});

// Annotate an existing ACU
acuRoutes.post("/acus/:id/annotate", authMiddleware, async (c) => {
  const user = c.get("user");
  const parentId = c.req.param("id");
  const { content } = await c.req.json();

  const result = await createAcu(user.did, user.privateKey, {
    content,
    type: "annotation",
    category: "conceptual",
    origin: "manual",
    parentId,
  });

  return c.json(result, 201);
});

export { acuRoutes };
```

---

## The Flow Visualized

```
┌──────────────────────────────────────────────────────┐
│                   USER INPUT                          │
├──────────────┬──────────────┬────────────────────────┤
│ Quick        │ Full Form    │ Remix/Annotate         │
│ Capture      │ Creation     │ Existing ACU           │
│              │              │                        │
│ "Redis is    │ Type: note   │ Parent: acu_abc123     │
│  faster      │ Category:    │ "Actually, Redis       │
│  than        │  technical   │  uses epoll not        │
│  Postgres    │ Tags: [db]   │  select..."            │
│  for cache"  │              │                        │
└──────┬───────┴──────┬───────┴──────────┬─────────────┘
       │              │                  │
       ▼              ▼                  ▼
┌──────────────────────────────────────────────────────┐
│              ACU SERVICE                              │
│                                                      │
│  1. computeAcuId(did, content) → SHA3-256 hash       │
│  2. Check duplicate (idempotent)                     │
│  3. Sign content with Ed25519                        │
│  4. Generate embedding (384-dim vector)              │
│  5. Score quality (richness, structure, uniqueness)   │
│  6. Infer type/category (if quick capture)           │
│  7. Write to DB                                      │
│  8. Auto-link (async background)                     │
│     ├─ Link to parent (if remix/annotation)          │
│     ├─ Find similar ACUs via cosine similarity       │
│     └─ Create AcuLink records                        │
└──────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│              KNOWLEDGE GRAPH                          │
│                                                      │
│   [thought_1]──similar_to──▶[note_7]                 │
│       │                        │                     │
│   derived_from             explains                  │
│       │                        │                     │
│       ▼                        ▼                     │
│   [extracted_acu_42]      [code_snippet_3]           │
│                                                      │
│   Every ACU is a node. Every link is an edge.        │
│   Origin doesn't matter. Knowledge connects.         │
└──────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Why |
|---|---|
| **Nullable provenance** | Manual ACUs have no conversation/message source |
| **`origin` field** | Distinguish how an ACU was born without changing its structure |
| **`parentId` self-relation** | Remixes and annotations trace back to their source |
| **Content-hash ID** | Same author + same content = same ACU (deduplication built in) |
| **Async auto-linking** | Don't block the user while finding semantic neighbors |
| **`quickCapture` with auto-classification** | Lowest friction path — just type and go |
| **Notebooks** | Users need to organize ACUs beyond just tags |

The ACU doesn't care whether it was extracted from a ChatGPT conversation or typed in at 3am. **It's all knowledge. It all connects.**

