# Architecture Design: Local-First P2P Knowledge Network

## The Core Insight

You're building something that has three distinct "zones" of data, and the entire architecture flows from understanding this:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S DEVICE                            │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  PRIVATE     │  │  SHARED      │  │  RECEIVED              │ │
│  │  (never      │  │  (replicated │  │  (pulled from          │ │
│  │   leaves)    │  │   outward)   │  │   others)              │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│         │                │                     ▲                │
│         │          ┌─────┴─────┐               │                │
│         │          │ SYNC      │               │                │
│         │          │ ENGINE    │───────────────┘                │
│         │          └─────┬─────┘                                │
└─────────│────────────────│──────────────────────────────────────┘
          │                │
          ✕          ┌─────┴─────────────────────────┐
       (blocked)     │  RELAY NETWORK                 │
                     │  (thin, dumb, replaceable)     │
                     │                                │
                     │  • Mailbox (store-and-forward) │
                     │  • Discovery (who has what)    │
                     │  • NO decryption capability    │
                     └────────────────────────────────┘
```

## Part 1: The Sharing Model — Getting the Semantics Right

Before touching the database, let's nail down what sharing actually means in your system.

### The Immutability Rule

You said: **"once shared globally cannot be unshared."** This is a critical design decision that simplifies everything. It means:

1. **Sharing is a one-way ratchet** — you can widen access, never narrow it
2. **Global shares are permanent** — they become part of the public knowledge commons
3. **Circle shares can expand** — you can add circles, never remove them
4. **The content itself is immutable once shared** — you can create a new version, but the shared one is out there

This maps perfectly to a **content-addressed, append-only log** model.

### Sharing Policy Hierarchy

```
SELF (private, local only)
  │
  ▼
CIRCLES (specific named groups)
  │
  ▼
NETWORK (anyone you're connected to, 1 hop)
  │
  ▼
GLOBAL (permanent, irrevocable, public commons)
```

Each level is a strict superset. Once you go up, you can't come back down.

### Permission Capabilities (per-share-grant)

```
VIEW        → can read the ACU content
ANNOTATE    → can attach annotations (but cannot modify original)
REMIX       → can create derivative ACUs that link back
RESHARE     → can share to their own circles (viral spread)
```

## Part 2: The Database Architecture

Here's the key realization: **you don't need one database schema. You need two schemas that sync.**

### Schema 1: Local Database (on each user's device)

This is the user's sovereign data store. It contains EVERYTHING the user has — their private data, their shared data, and data they've received from others.

### Schema 2: Relay Database (on the thin server)

This is a **mailbox and discovery index**. It holds encrypted envelopes, share manifests, and enough metadata for routing. It **cannot read content**.

---

## The Complete Prisma Schema

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// IDENTITY & DEVICES
// ============================================================================

model User {
  id        String @id @default(uuid())
  did       String @unique // did:key:z6Mk... — self-sovereign identity
  
  // Profile (user-controlled, signed)
  displayName String?
  bio         String?
  avatarUrl   String?
  email       String? @unique
  
  // Cryptographic identity
  publicKey           String  // Ed25519 public key (for signatures)
  publicEncryptionKey String? // X25519 public key (for encryption)
  encryptedPrivateKey String? // Encrypted with device key, stored for backup
  
  // Key rotation support
  keyVersion    Int      @default(1)
  previousKeys  Json     @default("[]") // Array of {publicKey, retiredAt, version}
  
  // Local state
  createdAt  DateTime @default(now()) @db.Timestamptz(6)
  updatedAt  DateTime @updatedAt @db.Timestamptz(6)
  lastSeenAt DateTime @default(now()) @db.Timestamptz(6)
  settings   Json     @default("{}")
  
  // Relations
  conversations Conversation[]
  acus          AtomicChatUnit[]
  devices       Device[]
  circlesOwned  Circle[]       @relation("CircleOwner")
  memberships   CircleMember[]
  
  // Sharing relations
  shareGrantsGiven    ShareGrant[]    @relation("Grantor")
  shareGrantsReceived ShareGrant[]    @relation("Grantee")
  
  // Sync
  syncCursors SyncCursor[]
  
  // Peer connections
  connectionsInitiated PeerConnection[] @relation("ConnectionInitiator")
  connectionsReceived  PeerConnection[] @relation("ConnectionTarget")
  
  @@index([did])
  @@index([email])
  @@map("users")
}

model Device {
  id          String  @id @default(uuid())
  userId      String
  deviceId    String  @unique // Deterministic from device fingerprint
  deviceName  String
  deviceType  String  // "browser", "desktop", "mobile"
  platform    String  // "chrome-extension", "firefox-extension", "electron", etc.
  fingerprint String?
  
  // Per-device keys (device can sign on behalf of user)
  publicKey  String
  isActive   Boolean @default(true)
  isTrusted  Boolean @default(false) // Requires explicit approval from another trusted device
  trustChain Json    @default("[]")  // Chain of trust: which device approved this one
  
  // Sync state for this device
  lastSyncAt    DateTime? @db.Timestamptz(6)
  syncState     Json      @default("{}") // HLC vector clock state
  pendingOps    Int       @default(0)
  
  createdAt  DateTime @default(now()) @db.Timestamptz(6)
  updatedAt  DateTime @updatedAt @db.Timestamptz(6)
  lastSeenAt DateTime @default(now()) @db.Timestamptz(6)
  metadata   Json     @default("{}")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([userId, isActive])
  @@map("devices")
}

// ============================================================================
// CORE CONTENT (Local-First)
// ============================================================================

model Conversation {
  id        String @id @default(uuid())
  ownerId   String
  
  // Source info
  provider  String
  sourceUrl String @unique
  title     String
  model     String?
  
  // Timestamps
  createdAt  DateTime @db.Timestamptz(6)
  updatedAt  DateTime @db.Timestamptz(6)
  capturedAt DateTime @default(now()) @db.Timestamptz(6)
  
  // Stats (denormalized for performance)
  messageCount         Int @default(0)
  userMessageCount     Int @default(0)
  aiMessageCount       Int @default(0)
  totalWords           Int @default(0)
  totalCharacters      Int @default(0)
  totalTokens          Int?
  totalCodeBlocks      Int @default(0)
  totalImages          Int @default(0)
  totalTables          Int @default(0)
  totalLatexBlocks     Int @default(0)
  totalMermaidDiagrams Int @default(0)
  totalToolCalls       Int @default(0)
  
  metadata Json @default("{}")
  
  // Relations
  owner    User      @relation(fields: [ownerId], references: [id])
  messages Message[]
  acus     AtomicChatUnit[]
  
  @@index([provider])
  @@index([capturedAt(sort: Desc)])
  @@index([provider, capturedAt(sort: Desc)])
  @@index([sourceUrl])
  @@index([createdAt(sort: Desc)])
  @@index([ownerId])
  @@map("conversations")
}

model Message {
  id             String @id @default(uuid())
  conversationId String
  
  role         String  // "user", "assistant", "system", "tool"
  author       String? // For multi-agent conversations
  parts        Json    // Content parts array
  messageIndex Int
  
  status       String  @default("completed")
  finishReason String?
  tokenCount   Int?
  
  createdAt DateTime @db.Timestamptz(6)
  metadata  Json     @default("{}")
  
  conversation Conversation   @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  acus         AtomicChatUnit[]
  
  @@index([conversationId, messageIndex])
  @@index([conversationId, createdAt])
  @@index([role])
  @@map("messages")
}

// ============================================================================
// ATOMIC CHAT UNITS — The Core Shareable Unit
// ============================================================================

model AtomicChatUnit {
  id String @id // Content-addressed: hash(authorDid + content + sourceTimestamp)
  
  // === AUTHORSHIP (immutable, signed) ===
  authorDid String
  signature Bytes  // Ed25519 signature over {id, content, type, sourceTimestamp}
  
  // === CONTENT (immutable once created) ===
  content  String
  language String?
  type     String  // "insight", "code", "explanation", "question", "decision", etc.
  category String  // User-defined or auto-categorized
  
  // === PROVENANCE (immutable) ===
  conversationId String
  messageId      String
  messageIndex   Int
  provider       String
  model          String?
  sourceTimestamp DateTime @db.Timestamptz(6)
  
  // === EMBEDDINGS (can be recomputed) ===
  embedding      Float[]
  embeddingModel String?
  
  // === QUALITY METRICS (can be updated locally) ===
  extractorVersion    String?
  parserVersion       String?
  qualityOverall      Float?
  contentRichness     Float?
  structuralIntegrity Float?
  uniqueness          Float?
  
  // === ENGAGEMENT (local counters, not synced directly) ===
  viewCount        Int    @default(0)
  shareCount       Int    @default(0)
  quoteCount       Int    @default(0)
  rediscoveryScore Float?
  
  // === SHARING POLICY (the ratchet — see ShareGrant for fine-grained) ===
  // This is the HIGH WATER MARK — once raised, never lowered
  sharingPolicy String @default("self") // "self" | "circles" | "network" | "global"
  
  // Timestamps
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  indexedAt DateTime @default(now()) @db.Timestamptz(6)
  
  metadata Json @default("{}")
  
  // Relations
  author       User         @relation(fields: [authorDid], references: [did])
  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  message      Message      @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  // Links to other ACUs (knowledge graph)
  linksFrom AcuLink[] @relation("SourceAcu")
  linksTo   AcuLink[] @relation("TargetAcu")
  
  // Fine-grained share grants
  shareGrants ShareGrant[]
  
  // Share history (immutable log)
  shareHistory ShareEvent[]
  
  // Annotations from others
  annotations Annotation[]
  
  @@index([conversationId])
  @@index([messageId])
  @@index([authorDid])
  @@index([type])
  @@index([category])
  @@index([sharingPolicy])
  @@index([qualityOverall(sort: Desc)])
  @@index([rediscoveryScore(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@map("atomic_chat_units")
}

model AcuLink {
  id       String @id @default(uuid())
  sourceId String
  targetId String
  relation String // "derived_from", "contradicts", "extends", "references", etc.
  weight   Float  @default(1.0)
  
  // Who created this link (for P2P attribution)
  createdByDid String?
  
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  metadata  Json     @default("{}")
  
  source AtomicChatUnit @relation("SourceAcu", fields: [sourceId], references: [id], onDelete: Cascade)
  target AtomicChatUnit @relation("TargetAcu", fields: [targetId], references: [id], onDelete: Cascade)
  
  @@unique([sourceId, targetId, relation])
  @@index([sourceId])
  @@index([targetId])
  @@index([relation])
  @@map("acu_links")
}

// ============================================================================
// SHARING & PERMISSIONS — The Heart of the Social Layer
// ============================================================================

// ShareGrant: A specific permission grant from author to grantee (or circle or global)
// These are APPEND-ONLY. You never delete a share grant. You can only add more.
model ShareGrant {
  id    String @id @default(uuid())
  acuId String
  
  // WHO is granting
  grantorDid String
  
  // WHO is receiving (one of these will be set)
  granteeDid String? // Specific user
  circleId   String? // Entire circle
  isGlobal   Boolean @default(false) // Public commons — permanent
  
  // WHAT permissions
  canView     Boolean @default(true)
  canAnnotate Boolean @default(false)
  canRemix    Boolean @default(false) // Can create derivative works
  canReshare  Boolean @default(false) // Can share to their circles
  
  // WHEN
  grantedAt DateTime  @default(now()) @db.Timestamptz(6)
  expiresAt DateTime? @db.Timestamptz(6) // null = permanent (global is always null)
  
  // Cryptographic proof
  grantSignature Bytes?  // Grantor's signature over this grant
  encryptedKey   String? // Content encryption key, encrypted for grantee's public key
  
  // For revoking circle/individual grants (NOT global — those are permanent)
  // Note: revocation only prevents FUTURE access. 
  // Recipients may have cached content. This is by design.
  revokedAt    DateTime? @db.Timestamptz(6)
  revokeReason String?
  
  metadata Json @default("{}")
  
  acu     AtomicChatUnit @relation(fields: [acuId], references: [id], onDelete: Cascade)
  grantor User           @relation("Grantor", fields: [grantorDid], references: [did])
  grantee User?          @relation("Grantee", fields: [granteeDid], references: [did])
  circle  Circle?        @relation(fields: [circleId], references: [id])
  
  @@index([acuId])
  @@index([grantorDid])
  @@index([granteeDid])
  @@index([circleId])
  @@index([isGlobal])
  @@index([acuId, granteeDid])
  @@index([acuId, circleId])
  @@index([acuId, isGlobal])
  @@index([revokedAt])
  @@map("share_grants")
}

// ShareEvent: Immutable audit log of all sharing actions
// This is the "blockchain-lite" — an append-only log that can be verified
model ShareEvent {
  id    String @id @default(uuid())
  acuId String
  
  // What happened
  eventType String // "shared", "reshared", "permission_upgraded", "revoked", "global_published"
  
  // Who did it
  actorDid String
  
  // Details
  targetDid    String? // If shared to specific user
  targetCircle String? // If shared to circle
  isGlobal     Boolean @default(false)
  
  // Permissions at time of event
  permissions Json @default("{}") // {canView, canAnnotate, canRemix, canReshare}
  
  // Immutability proof
  signature     Bytes?  // Actor's signature over this event
  previousEvent String? // Hash of previous event for this ACU (chain)
  eventHash     String? // Hash of this event's content
  
  // Monotonic timestamp (Hybrid Logical Clock)
  hlcTimestamp String // HLC string for causal ordering
  
  timestamp DateTime @default(now()) @db.Timestamptz(6)
  metadata  Json     @default("{}")
  
  acu AtomicChatUnit @relation(fields: [acuId], references: [id], onDelete: Cascade)
  
  @@index([acuId, timestamp])
  @@index([actorDid])
  @@index([eventType])
  @@index([timestamp(sort: Desc)])
  @@index([acuId, hlcTimestamp])
  @@map("share_events")
}

// ============================================================================
// CIRCLES — Social Groups with Access Control
// ============================================================================

model Circle {
  id      String @id @default(uuid())
  ownerId String
  
  name        String
  description String?
  isPublic    Boolean @default(false) // Discoverable vs. invite-only
  
  // Circle-level encryption key (encrypted per-member)
  circleKeyId String? // Reference to which key version
  
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @db.Timestamptz(6)
  metadata  Json     @default("{}")
  
  owner       User           @relation("CircleOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     CircleMember[]
  shareGrants ShareGrant[]
  invites     CircleInvite[]
  
  @@index([ownerId])
  @@index([isPublic])
  @@map("circles")
}

model CircleMember {
  id       String @id @default(uuid())
  circleId String
  userId   String
  
  role      String  @default("member") // "owner", "admin", "member", "readonly"
  canInvite Boolean @default(false)
  canShare  Boolean @default(true)     // Can share their own ACUs to this circle
  
  // Encrypted circle key for this member
  encryptedCircleKey String? // Circle key encrypted with member's public key
  
  joinedAt DateTime @default(now()) @db.Timestamptz(6)
  
  circle Circle @relation(fields: [circleId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([circleId, userId])
  @@index([circleId])
  @@index([userId])
  @@map("circle_members")
}

model CircleInvite {
  id       String @id @default(uuid())
  circleId String
  
  inviterDid  String
  inviteeDid  String? // null = open invite link
  inviteToken String  @unique // Random token for invite links
  
  role      String  @default("member")
  canInvite Boolean @default(false)
  canShare  Boolean @default(true)
  
  maxUses  Int? // null = unlimited
  useCount Int  @default(0)
  
  expiresAt DateTime? @db.Timestamptz(6)
  
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  
  circle Circle @relation(fields: [circleId], references: [id], onDelete: Cascade)
  
  @@index([circleId])
  @@index([inviteToken])
  @@index([inviteeDid])
  @@map("circle_invites")
}

// ============================================================================
// ANNOTATIONS — Others' contributions to your shared ACUs
// ============================================================================

model Annotation {
  id    String @id @default(uuid())
  acuId String
  
  authorDid String
  type      String // "comment", "tag", "rating", "correction", "question"
  content   String
  
  // Annotations are also signed
  signature Bytes?
  
  // Visibility follows the ACU's sharing policy by default
  // But can be restricted further
  visibility String @default("inherit") // "inherit", "self", "circles", "global"
  
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @db.Timestamptz(6)
  metadata  Json     @default("{}")
  
  acu AtomicChatUnit @relation(fields: [acuId], references: [id], onDelete: Cascade)
  
  @@index([acuId])
  @@index([authorDid])
  @@index([type])
  @@index([createdAt(sort: Desc)])
  @@map("annotations")
}

// ============================================================================
// PEER-TO-PEER CONNECTIONS
// ============================================================================

model PeerConnection {
  id String @id @default(uuid())
  
  initiatorDid String
  targetDid    String
  
  // Connection state
  status String @default("pending") // "pending", "accepted", "blocked"
  
  // What each party shares by default with the other
  // These are defaults — individual ACU grants override
  defaultSharePolicy Json @default("{\"canView\": true, \"canAnnotate\": false, \"canRemix\": false, \"canReshare\": false}")
  
  // Trust level affects what gets auto-synced
  trustLevel String @default("acquaintance") // "acquaintance", "trusted", "close"
  
  // Connection proof
  initiatorSignature Bytes? // Initiator signs the connection request
  targetSignature    Bytes? // Target signs the acceptance
  
  createdAt  DateTime  @default(now()) @db.Timestamptz(6)
  acceptedAt DateTime? @db.Timestamptz(6)
  updatedAt  DateTime  @updatedAt @db.Timestamptz(6)
  metadata   Json      @default("{}")
  
  initiator User @relation("ConnectionInitiator", fields: [initiatorDid], references: [did])
  target    User @relation("ConnectionTarget", fields: [targetDid], references: [did])
  
  @@unique([initiatorDid, targetDid])
  @@index([initiatorDid])
  @@index([targetDid])
  @@index([status])
  @@map("peer_connections")
}

// ============================================================================
// SYNC INFRASTRUCTURE
// ============================================================================

// SyncCursor: Tracks what this device has synced from each peer
model SyncCursor {
  id     String @id @default(uuid())
  userId String // This user (local)
  
  // What we're syncing with
  peerDid   String? // Another user
  circleId  String? // A circle
  isGlobal  Boolean @default(false) // Global feed
  
  // Cursor position
  lastSyncedAt    DateTime? @db.Timestamptz(6)
  lastHlc         String?   // Last Hybrid Logical Clock value processed
  lastEventId     String?   // Last event ID processed
  
  // Sync health
  consecutiveFailures Int      @default(0)
  lastError           String?
  lastAttemptAt       DateTime? @db.Timestamptz(6)
  
  updatedAt DateTime @updatedAt @db.Timestamptz(6)
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, peerDid])
  @@unique([userId, circleId])
  @@index([userId])
  @@index([peerDid])
  @@map("sync_cursors")
}

// SyncOperation: The operation log for CRDT-style sync
// This is the fundamental unit of replication
model SyncOperation {
  id String @id @default(uuid())
  
  // Causal ordering
  hlcTimestamp String // Hybrid Logical Clock — globally unique, causally ordered
  
  // What changed
  entityType String // "acu", "share_grant", "share_event", "annotation", "acu_link", "circle", "connection"
  entityId   String
  operation  String // "create", "update", "delete"
  
  // The actual data (encrypted if not global)
  payload          Json   // The operation payload
  encryptedPayload String? // If content needs encryption
  
  // Who made this change
  authorDid String
  signature Bytes? // Author's signature over {hlcTimestamp, entityType, entityId, operation, payload}
  
  // Sync metadata
  originDeviceId String? // Which device created this op
  
  // Processing state (local only, not synced)
  appliedAt   DateTime? @db.Timestamptz(6)
  isProcessed Boolean   @default(false)
  
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  
  @@index([hlcTimestamp])
  @@index([entityType, entityId])
  @@index([authorDid])
  @@index([isProcessed])
  @@index([createdAt(sort: Desc)])
  @@index([authorDid, hlcTimestamp])
  @@map("sync_operations")
}

// ============================================================================
// RELAY / MAILBOX (for when peers are offline)
// ============================================================================

// Envelope: An encrypted message waiting for a recipient
// This is what sits on the relay server
model Envelope {
  id String @id @default(uuid())
  
  // Routing (visible to relay)
  senderDid    String
  recipientDid String
  
  // Content (opaque to relay)
  encryptedPayload String // Encrypted with recipient's public key
  payloadType      String // "sync_ops", "share_grant", "circle_invite", "connection_request"
  payloadSize      Int    // Bytes, for quota enforcement
  
  // Delivery state
  deliveredAt DateTime? @db.Timestamptz(6)
  expiresAt   DateTime  @db.Timestamptz(6) // Auto-delete after expiry
  
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  
  @@index([recipientDid, deliveredAt])
  @@index([senderDid])
  @@index([expiresAt])
  @@index([recipientDid, createdAt])
  @@map("envelopes")
}

// ============================================================================
// DISCOVERY INDEX (minimal metadata for finding content)
// ============================================================================

// PublishedAcuIndex: Public index of globally shared ACUs
// This is what the relay/discovery server indexes
// Contains NO full content — just enough to search and route
model PublishedAcuIndex {
  id String @id // Same as ACU id
  
  authorDid  String
  type       String
  category   String
  language   String?
  
  // Searchable summary (NOT the full content)
  titleOrExcerpt String  // First 200 chars or extracted title
  tags           String[] // Auto-extracted or user-defined
  
  // Quality signals
  qualityOverall Float?
  shareCount     Int    @default(0)
  annotationCount Int   @default(0)
  
  // Embedding for semantic search (can be computed server-side from excerpt)
  embedding      Float[]
  embeddingModel String?
  
  // Where to get the full content
  authorRelayUrl String? // Which relay has this author's mailbox
  
  // Verification
  signature Bytes? // Author's signature — proves authenticity
  
  publishedAt DateTime @default(now()) @db.Timestamptz(6)
  
  @@index([authorDid])
  @@index([type])
  @@index([category])
  @@index([publishedAt(sort: Desc)])
  @@index([qualityOverall(sort: Desc)])
  @@map("published_acu_index")
}

// ============================================================================
// CONTRIBUTION TRACKING (for future reciprocity / reputation)
// ============================================================================

model Contribution {
  id             String   @id @default(uuid())
  contributorDid String
  acuId          String
  recipientDids  String[]
  quality        Float    @default(1.0)
  
  // What kind of contribution
  type String @default("share") // "share", "annotate", "remix", "curate"
  
  timestamp DateTime @default(now()) @db.Timestamptz(6)
  metadata  Json     @default("{}")
  
  @@index([contributorDid])
  @@index([acuId])
  @@index([type])
  @@index([timestamp(sort: Desc)])
  @@map("contributions")
}

model Consumption {
  id          String @id @default(uuid())
  consumerDid String
  acuId       String
  providerDid String
  
  // What they did with it
  action String @default("view") // "view", "save", "remix", "reshare"
  
  timestamp DateTime @default(now()) @db.Timestamptz(6)
  metadata  Json     @default("{}")
  
  @@index([consumerDid])
  @@index([acuId])
  @@index([providerDid])
  @@index([action])
  @@index([timestamp(sort: Desc)])
  @@map("consumptions")
}

// ============================================================================
// OPERATIONAL (kept from your original, local only)
// ============================================================================

model CaptureAttempt {
  id             String    @id @default(uuid())
  sourceUrl      String
  provider       String?
  status         String
  errorCode      String?
  errorMessage   String?
  errorStack     String?
  startedAt      DateTime  @db.Timestamptz(6)
  completedAt    DateTime? @db.Timestamptz(6)
  duration       Int?
  ipAddress      String?
  userAgent      String?
  conversationId String?
  retryCount     Int       @default(0)
  retryOf        String?
  createdAt      DateTime  @default(now()) @db.Timestamptz(6)
  
  @@index([sourceUrl])
  @@index([status])
  @@index([createdAt(sort: Desc)])
  @@index([ipAddress, createdAt(sort: Desc)])
  @@index([conversationId])
  @@map("capture_attempts")
}

model ProviderStats {
  id                 String    @id @default(uuid())
  provider           String    @unique
  totalCaptures      Int       @default(0)
  successfulCaptures Int       @default(0)
  failedCaptures     Int       @default(0)
  avgDuration        Float?
  avgMessageCount    Float?
  avgTokenCount      Float?
  totalMessages      Int       @default(0)
  totalCodeBlocks    Int       @default(0)
  totalImages        Int       @default(0)
  totalToolCalls     Int       @default(0)
  lastCaptureAt      DateTime? @db.Timestamptz(6)
  updatedAt          DateTime  @updatedAt @db.Timestamptz(6)
  
  @@map("provider_stats")
}
```

## Part 3: How the Sync Protocol Works

This is where the magic happens. The database schema above supports a specific sync protocol:

### The Hybrid Logical Clock (HLC)

Every mutation generates a SyncOperation with an HLC timestamp. HLC gives you:
- **Causal ordering** without a central clock
- **Globally unique** timestamps (wall clock + logical counter + node ID)
- **Monotonic** — always moves forward

```typescript
// HLC format: "2024-01-15T10:30:00.000Z-0001-deviceId123"
//              |--- wall clock ---|  |cnt| |-- node --|

class HLC {
  wallMs: number;
  counter: number;
  nodeId: string;
  
  // On local event:
  tick(): string {
    const now = Date.now();
    if (now > this.wallMs) {
      this.wallMs = now;
      this.counter = 0;
    } else {
      this.counter++;
    }
    return this.toString();
  }
  
  // On receiving remote event:
  receive(remoteHlc: string): string {
    const remote = HLC.parse(remoteHlc);
    const now = Date.now();
    
    if (now > this.wallMs && now > remote.wallMs) {
      this.wallMs = now;
      this.counter = 0;
    } else if (this.wallMs === remote.wallMs) {
      this.counter = Math.max(this.counter, remote.counter) + 1;
    } else if (remote.wallMs > this.wallMs) {
      this.wallMs = remote.wallMs;
      this.counter = remote.counter + 1;
    } else {
      this.counter++;
    }
    return this.toString();
  }
}
```

### The Sync Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│ Device A │                    │  Relay   │                    │ Device B │
│ (Alice)  │                    │  Server  │                    │  (Bob)   │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │  1. Alice shares ACU          │                               │
     │  with Bob's circle            │                               │
     │                               │                               │
     │  CREATE SyncOperation{        │                               │
     │    hlc: "...-alice-dev1",     │                               │
     │    entityType: "share_grant", │                               │
     │    payload: {...},            │                               │
     │    signature: sign(...)       │                               │
     │  }                            │                               │
     │                               │                               │
     │  2. Push encrypted envelope   │                               │
     │──────────────────────────────>│                               │
     │  Envelope{                    │                               │
     │    recipientDid: bob.did,     │  3. Store in mailbox          │
     │    encryptedPayload: enc(...) │──────┐                        │
     │  }                            │      │                        │
     │                               │<─────┘                        │
     │                               │                               │
     │                               │  4. Bob comes online          │
     │                               │<──────────────────────────────│
     │                               │  "Any mail for me?"           │
     │                               │                               │
     │                               │  5. Deliver envelopes         │
     │                               │──────────────────────────────>│
     │                               │                               │
     │                               │  6. Bob decrypts, verifies    │
     │                               │     signature, applies ops    │
     │                               │                               │
     │                               │  7. Bob ACKs receipt          │
     │                               │<──────────────────────────────│
     │                               │     (envelope deleted)        │
     │                               │                               │
```

### Direct P2P Sync (when both online)

```
┌──────────┐                                         ┌──────────┐
│ Device A │                                         │ Device B │
│ (Alice)  │                                         │  (Bob)   │
└────┬─────┘                                         └────┬─────┘
     │                                                    │
     │  1. WebRTC connection established                  │
     │<──────────────────────────────────────────────────>│
     │                                                    │
     │  2. Exchange sync cursors                          │
     │  "My last HLC from you: 2024-01-15-0042-bob"      │
     │──────────────────────────────────────────────────>│
     │                                                    │
     │  "My last HLC from you: 2024-01-14-0099-alice"    │
     │<──────────────────────────────────────────────────│
     │                                                    │
     │  3. Exchange ops since cursor                      │
     │  [SyncOp, SyncOp, SyncOp, ...]                   │
     │<─────────────────────────────────────────────────>│
     │                                                    │
     │  4. Both apply ops, update cursors                 │
     │                                                    │
```

## Part 4: The Permission Resolution Algorithm

This is critical. When Device B receives an ACU, how does it know it's allowed to see it?

```typescript
interface AccessDecision {
  canView: boolean;
  canAnnotate: boolean;
  canRemix: boolean;
  canReshare: boolean;
  reason: string;
}

function resolveAccess(
  acu: AtomicChatUnit,
  requestorDid: string,
  shareGrants: ShareGrant[],
  circles: Circle[],
  connections: PeerConnection[]
): AccessDecision {
  
  // 1. Owner always has full access
  if (acu.authorDid === requestorDid) {
    return { canView: true, canAnnotate: true, canRemix: true, canReshare: true, reason: "owner" };
  }
  
  // 2. Global ACUs — everyone can view (permanent, irrevocable)
  if (acu.sharingPolicy === "global") {
    // Find the global grant to get specific permissions
    const globalGrant = shareGrants.find(g => g.isGlobal && !g.revokedAt);
    return {
      canView: true, // Always true for global
      canAnnotate: globalGrant?.canAnnotate ?? false,
      canRemix: globalGrant?.canRemix ?? false,
      canReshare: globalGrant?.canReshare ?? false,
      reason: "global"
    };
  }
  
  // 3. Direct user grants (most specific, highest priority)
  const directGrants = shareGrants.filter(g => 
    g.granteeDid === requestorDid && 
    !g.revokedAt &&
    (!g.expiresAt || g.expiresAt > new Date())
  );
  
  if (directGrants.length > 0) {
    // Merge permissions (union — most permissive wins)
    return mergeGrants(directGrants, "direct_grant");
  }
  
  // 4. Circle grants
  const requestorCircleIds = circles
    .filter(c => c.members.some(m => m.userId === requestorDid))
    .map(c => c.id);
  
  const circleGrants = shareGrants.filter(g =>
    g.circleId && 
    requestorCircleIds.includes(g.circleId) &&
    !g.revokedAt &&
    (!g.expiresAt || g.expiresAt > new Date())
  );
  
  if (circleGrants.length > 0) {
    return mergeGrants(circleGrants, "circle_grant");
  }
  
  // 5. Network-level (1-hop connections)
  if (acu.sharingPolicy === "network") {
    const isConnected = connections.some(c =>
      c.status === "accepted" && 
      (c.initiatorDid === requestorDid || c.targetDid === requestorDid)
    );
    
    if (isConnected) {
      return {
        canView: true,
        canAnnotate: false,
        canRemix: false,
        canReshare: false,
        reason: "network_connection"
      };
    }
  }
  
  // 6. No access
  return { canView: false, canAnnotate: false, canRemix: false, canReshare: false, reason: "denied" };
}

function mergeGrants(grants: ShareGrant[], reason: string): AccessDecision {
  return {
    canView:     grants.some(g => g.canView),
    canAnnotate: grants.some(g => g.canAnnotate),
    canRemix:    grants.some(g => g.canRemix),
    canReshare:  grants.some(g => g.canReshare),
    reason
  };
}
```

## Part 5: The Sharing Ratchet Implementation

```typescript
async function shareAcu(
  acu: AtomicChatUnit,
  newPolicy: "self" | "circles" | "network" | "global",
  target?: { circleId?: string; userDid?: string },
  permissions: { canAnnotate?: boolean; canRemix?: boolean; canReshare?: boolean } = {}
): Promise<ShareGrant> {
  
  const policyOrder = { self: 0, circles: 1, network: 2, global: 3 };
  
  // THE RATCHET: Cannot lower sharing policy
  if (policyOrder[newPolicy] < policyOrder[acu.sharingPolicy as keyof typeof policyOrder]) {
    throw new Error(
      `Cannot lower sharing policy from '${acu.sharingPolicy}' to '${newPolicy}'. ` +
      `Sharing is a one-way ratchet.`
    );
  }
  
  // GLOBAL IS PERMANENT
  if (newPolicy === "global") {
    // Require explicit confirmation (UI should double-confirm)
    // Once global, the ACU and this grant can NEVER be revoked
  }
  
  // Update the ACU's high water mark
  if (policyOrder[newPolicy] > policyOrder[acu.sharingPolicy as keyof typeof policyOrder]) {
    await db.atomicChatUnit.update({
      where: { id: acu.id },
      data: { sharingPolicy: newPolicy }
    });
  }
  
  // Create the share grant
  const grant = await db.shareGrant.create({
    data: {
      acuId: acu.id,
      grantorDid: acu.authorDid,
      granteeDid: target?.userDid,
      circleId: target?.circleId,
      isGlobal: newPolicy === "global",
      canView: true,
      canAnnotate: permissions.canAnnotate ?? false,
      canRemix: permissions.canRemix ?? false,
      canReshare: permissions.canReshare ?? false,
      expiresAt: newPolicy === "global" ? null : undefined, // Global never expires
      grantSignature: sign(/* ... */),
      encryptedKey: newPolicy === "global" ? null : encryptContentKey(/* ... */),
    }
  });
  
  // Create immutable share event
  const hlc = clock.tick();
  await db.shareEvent.create({
    data: {
      acuId: acu.id,
      eventType: newPolicy === "global" ? "global_published" : "shared",
      actorDid: acu.authorDid,
      targetDid: target?.userDid,
      targetCircle: target?.circleId,
      isGlobal: newPolicy === "global",
      permissions: {
        canView: true,
        canAnnotate: permissions.canAnnotate ?? false,
        canRemix: permissions.canRemix ?? false,
        canReshare: permissions.canReshare ?? false,
      },
      hlcTimestamp: hlc,
      signature: sign(/* ... */),
    }
  });
  
  // Create sync operation for replication
  await db.syncOperation.create({
    data: {
      hlcTimestamp: hlc,
      entityType: "share_grant",
      entityId: grant.id,
      operation: "create",
      payload: grant,
      authorDid: acu.authorDid,
      signature: sign(/* ... */),
    }
  });
  
  // If global, also publish to discovery index
  if (newPolicy === "global") {
    await publishToGlobalIndex(acu);
  }
  
  return grant;
}
```

## Part 6: What Runs Where

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOCAL DB (PostgreSQL/SQLite)                     │
│                                                                         │
│  Tables:                                                                │
│  ✅ User (own identity only)                                           │
│  ✅ Device (own devices)                                               │
│  ✅ Conversation (own conversations)                                    │
│  ✅ Message (own messages)                                              │
│  ✅ AtomicChatUnit (own + received)                                    │
│  ✅ AcuLink (own + received)                                           │
│  ✅ ShareGrant (own grants given + grants received)                    │
│  ✅ ShareEvent (full log for own ACUs + events involving me)           │
│  ✅ Circle (circles I own or am member of)                             │
│  ✅ CircleMember (membership data for my circles)                      │
│  ✅ Annotation (on my ACUs + my annotations on others')               │
│  ✅ PeerConnection (my connections)                                     │
│  ✅ SyncCursor (my sync state with each peer)                          │
│  ✅ SyncOperation (pending + recent ops)                                │
│  ✅ CaptureAttempt (local only)                                        │
│  ✅ ProviderStats (local only)                                         │
│  ✅ Contribution (local tracking)                                       │
│  ✅ Consumption (local tracking)                                        │
│                                                                         │
│  NOT stored locally:                                                    │
│  ❌ Other users' private ACUs                                          │
│  ❌ Envelopes (that's the relay's job)                                 │
│  ❌ PublishedAcuIndex (that's the discovery server)                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                   RELAY SERVER DB (PostgreSQL, minimal)                  │
│                                                                         │
│  Tables:                                                                │
│  ✅ Envelope (encrypted mailboxes — store and forward)                 │
│  ✅ PublishedAcuIndex (global discovery — search/browse)               │
│  ✅ User (just DID + publicKey + relayUrl — for routing)               │
│                                                                         │
│  The relay CANNOT:                                                      │
│  ❌ Read ACU content (encrypted)                                       │
│  ❌ Modify share grants (signed by author)                             │
│  ❌ Impersonate users (no private keys)                                │
│  ❌ Revoke global shares (immutable by design)                         │
│                                                                         │
│  The relay CAN:                                                         │
│  ✅ Store envelopes until recipient picks up                           │
│  ✅ Index publicly shared ACU metadata                                  │
│  ✅ Route connection requests                                           │
│  ✅ Enforce storage quotas                                              │
│  ✅ Be replaced by another relay (users are portable)                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Part 7: Encryption Strategy

```
Content Encryption (for non-global ACUs):

1. Each ACU has a unique symmetric key (AES-256-GCM)
2. The content is encrypted with this key
3. The key is encrypted N times:
   - Once for each device of the author (with device public key)
   - Once for each direct grantee (with their public key) 
   - Once for each circle (with circle key)
4. Circle keys are themselves encrypted per-member

For GLOBAL ACUs:
- Content is stored in plaintext (it's public!)
- Signature proves authenticity
- No encryption needed

Key Hierarchy:
┌─────────────────┐
│ User Master Key  │ (derived from password/passphrase, stored encrypted)
├─────────────────┤
│ Device Key       │ (per-device, encrypts local DB)
├─────────────────┤
│ Circle Keys      │ (per-circle, encrypted for each member)
├─────────────────┤
│ ACU Content Keys │ (per-ACU, encrypted for authorized parties)
└─────────────────┘
```

## Part 8: Migration Path from Current Schema

Here's what changes from your current schema:

```
KEPT AS-IS:
  ✅ Conversation (added ownerId as required)
  ✅ Message (unchanged)
  ✅ CaptureAttempt (unchanged)
  ✅ ProviderStats (unchanged)
  ✅ AcuLink (minor addition: createdByDid)

MODIFIED:
  🔄 User — added publicEncryptionKey, keyVersion, previousKeys
  🔄 Device — added trustChain, lastSyncAt, syncState, pendingOps
  🔄 AtomicChatUnit — REMOVED inline permissions (canView, canAnnotate, etc.)
     → moved to ShareGrant model (proper normalization)
     → REMOVED sharingCircles array (use ShareGrant with circleId instead)
  🔄 Circle — added circleKeyId
  🔄 CircleMember — added encryptedCircleKey
  🔄 Contribution — added type field
  🔄 Consumption — added action field

NEW:
  ✨ ShareGrant — fine-grained, append-only permission grants
  ✨ ShareEvent — immutable audit log with hash chains
  ✨ CircleInvite — invite links with tokens
  ✨ Annotation — others' contributions to shared ACUs
  ✨ PeerConnection — mutual connections between users
  ✨ SyncCursor — tracks sync state per peer
  ✨ SyncOperation — the CRDT operation log
  ✨ Envelope — encrypted store-and-forward mailbox
  ✨ PublishedAcuIndex — global discovery index
```

## Part 9: What to Build First (POC Priority)

```
Phase 1: Local-First Foundation
  ├── Local PostgreSQL with full schema
  ├── HLC implementation
  ├── SyncOperation generation on every write
  └── Content-addressed ACU IDs (hash-based)

Phase 2: Identity & Crypto
  ├── DID generation (did:key from Ed25519)
  ├── Signing all ACUs and ShareGrants
  ├── Key management (device keys)
  └── Verify signatures on received data

Phase 3: Sharing
  ├── ShareGrant creation with ratchet enforcement
  ├── ShareEvent logging
  ├── Permission resolution function
  └── Circle management

Phase 4: Sync (the hard part)
  ├── Relay server with Envelope table
  ├── Push sync ops to relay as envelopes
  ├── Pull envelopes from relay
  ├── Apply remote sync ops locally
  └── Cursor management

Phase 5: P2P Direct
  ├── WebRTC signaling through relay
  ├── Direct sync when both online
  └── Fallback to relay when offline

Phase 6: Discovery
  ├── PublishedAcuIndex for global ACUs
  ├── Semantic search over public index
  └── Peer discovery
```

This architecture gives you:
- **Full sovereignty**: users own their data, can switch relays, export everything
- **Minimal centralization**: relays are dumb mailboxes, replaceable and federable
- **Cryptographic integrity**: everything is signed, shares are verifiable
- **The ratchet**: global is permanent, circle/individual can be revoked (best-effort)
- **Offline-first**: HLC + operation log means sync works across any connectivity gap
