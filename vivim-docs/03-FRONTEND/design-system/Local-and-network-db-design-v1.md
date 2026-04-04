

# OpenScroll POC Database Architecture

## The Core Challenge

You need a system where:

1. **Every user has a local database** (their sovereign vault)
2. **Sharing is permission-based** with granular access control
3. **Once shared globally, it's permanent** (append-only public ledger semantics)
4. **Minimal centralized infrastructure** (P2P-first)
5. **Working POC** with PostgreSQL (no Rust)

Let me architect this from first principles.

---

## Architectural Model: Three-Layer Database Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     OpenScroll Data Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 1: USER VAULT (Local PostgreSQL per user)                           │
│  ┌───────────────────────────────────────────────────────────┐              │
│  │  Everything the user owns. Full sovereignty.              │              │
│  │  - Conversations, Messages, ACUs                          │              │
│  │  - Private keys, identity                                 │              │
│  │  - Sharing decisions (what I shared, with whom)           │              │
│  │  - Received content (what others shared with me)          │              │
│  └───────────────────────────────────────────────────────────┘              │
│                           │                                                 │
│                           │ User decides to share                           │
│                           ▼                                                 │
│  LAYER 2: SHARING MESH (P2P Direct + Relay)                                │
│  ┌───────────────────────────────────────────────────────────┐              │
│  │  Encrypted envelopes between specific peers.              │              │
│  │  - Circle-scoped sharing (group of DIDs)                  │              │
│  │  - Direct DID-to-DID sharing                              │              │
│  │  - Time-limited or permanent grants                       │              │
│  │  - Relay server only stores encrypted blobs               │              │
│  └───────────────────────────────────────────────────────────┘              │
│                           │                                                 │
│                           │ User decides to publish globally                │
│                           ▼                                                 │
│  LAYER 3: GLOBAL COMMONS (Append-Only Public Index)                        │
│  ┌───────────────────────────────────────────────────────────┐              │
│  │  Irrevocable public contributions.                        │              │
│  │  - Content-addressed, signed ACUs                         │              │
│  │  - Public conversation summaries                          │              │
│  │  - Global search index                                    │              │
│  │  - Reputation/contribution tracking                       │              │
│  │  - NO deletion possible (append-only)                     │              │
│  └───────────────────────────────────────────────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Key Insight: Sharing Policy as State Machine

Every piece of content follows a **one-way state machine**:

```
  ┌──────────┐      grant()      ┌──────────┐     publish()     ┌──────────┐
  │          │ ───────────────►  │          │ ──────────────►  │          │
  │  PRIVATE │                   │  SHARED  │                  │  GLOBAL  │
  │  (vault) │ ◄─── revoke() ── │ (circles)│                  │ (commons)│
  │          │                   │          │      ✗            │          │
  └──────────┘                   └──────────┘  NO RETURN       └──────────┘
                                                                     │
                                                                     │
                                                              PERMANENT
                                                              IRREVOCABLE
```

- **PRIVATE → SHARED**: Revocable. User can revoke access from circles/individuals.
- **SHARED → PRIVATE**: Allowed. Revoke all grants.
- **ANY → GLOBAL**: **Irreversible**. Once published to commons, it's permanent.

---

## Complete Prisma Schema

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}

// ============================================================================
// LAYER 0: IDENTITY & DEVICES
// ============================================================================

model User {
  id                  String    @id @default(uuid())
  did                 String    @unique                    // did:key:z6Mk...
  displayName         String?
  email               String?   @unique
  avatarUrl           String?
  publicKey           String                               // Ed25519 public key (base64)
  encryptedPrivateKey String?                              // AES-256 encrypted with passphrase
  verificationTier    Int       @default(0)                // 0=anon, 1=email, 2=human, 3=kyc
  createdAt           DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt           DateTime  @updatedAt @db.Timestamptz(6)
  lastSeenAt          DateTime  @default(now()) @db.Timestamptz(6)
  settings            Json      @default("{}")

  // Relationships
  devices             Device[]
  conversations       Conversation[]
  acus                AtomicChatUnit[]
  circlesOwned        Circle[]          @relation("CircleOwner")
  circleMemberships   CircleMember[]
  sharingGrantsGiven  SharingGrant[]    @relation("Grantor")
  sharingGrantsReceived SharingGrant[]  @relation("Grantee")
  globalPublications  GlobalPublication[]
  reputationEvents    ReputationEvent[]
  syncCursors         SyncCursor[]

  @@index([did])
  @@index([email])
  @@index([verificationTier])
  @@map("users")
}

model Device {
  id               String   @id @default(uuid())
  userId           String
  deviceDid        String   @unique                       // Device-level DID
  deviceName       String                                  // "MacBook Pro", "iPhone 15"
  deviceType       String                                  // laptop, phone, tablet, browser
  platform         String                                  // macos, ios, android, web
  publicKey        String                                  // Device Ed25519 public key
  delegationProof  String?                                 // Signed delegation from master key
  isActive         Boolean  @default(true)
  isTrusted        Boolean  @default(false)
  lastSyncAt       DateTime?  @db.Timestamptz(6)          // Last successful sync
  lastSeenAt       DateTime @default(now()) @db.Timestamptz(6)
  createdAt        DateTime @default(now()) @db.Timestamptz(6)
  revokedAt        DateTime?  @db.Timestamptz(6)          // Null = active, set = revoked
  metadata         Json     @default("{}")

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isActive])
  @@index([deviceDid])
  @@map("devices")
}

// ============================================================================
// LAYER 1: USER VAULT (Sovereign Data)
// ============================================================================

model Conversation {
  id                   String    @id @default(uuid())
  contentHash          String    @unique                   // SHA-256 of canonical content
  ownerId              String                              // User who captured this
  provider             String                              // chatgpt, claude, gemini, etc.
  sourceUrl            String    @unique
  title                String
  model                String?
  createdAt            DateTime  @db.Timestamptz(6)        // Original conversation time
  updatedAt            DateTime  @db.Timestamptz(6)
  capturedAt           DateTime  @default(now()) @db.Timestamptz(6)
  signature            String                              // Ed25519 signature of contentHash

  // Stats
  messageCount         Int       @default(0)
  userMessageCount     Int       @default(0)
  aiMessageCount       Int       @default(0)
  totalWords           Int       @default(0)
  totalCharacters      Int       @default(0)
  totalTokens          Int?
  totalCodeBlocks      Int       @default(0)
  totalImages          Int       @default(0)
  totalTables          Int       @default(0)
  totalLatexBlocks     Int       @default(0)
  totalMermaidDiagrams Int       @default(0)
  totalToolCalls       Int       @default(0)

  // Sharing state (the state machine)
  sharingPolicy        SharingPolicy @default(PRIVATE)     // PRIVATE, SHARED, GLOBAL
  globalizedAt         DateTime?     @db.Timestamptz(6)    // Set once, never cleared

  metadata             Json      @default("{}")

  // Relationships
  owner                User      @relation(fields: [ownerId], references: [id])
  messages             Message[]
  acus                 AtomicChatUnit[]
  sharingGrants        SharingGrant[]
  dagNodes             DagNode[]
  globalPublication    GlobalPublication?

  @@index([ownerId])
  @@index([provider])
  @@index([capturedAt(sort: Desc)])
  @@index([sharingPolicy])
  @@index([contentHash])
  @@map("conversations")
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  contentHash    String                                    // SHA-256 of parts JSON
  role           String                                    // user, assistant, system
  author         String?
  parts          Json                                      // ContentBlock[]
  createdAt      DateTime @db.Timestamptz(6)
  messageIndex   Int
  status         String   @default("completed")
  finishReason   String?
  tokenCount     Int?
  signature      String?                                   // Ed25519 signature
  metadata       Json     @default("{}")

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  acus           AtomicChatUnit[]
  dagNode        DagNode?

  @@unique([conversationId, messageIndex])
  @@index([conversationId, messageIndex])
  @@index([contentHash])
  @@map("messages")
}

// ============================================================================
// DAG LAYER: Content-Addressed History
// ============================================================================

model DagNode {
  id              String    @id                            // SHA-256 content hash (IS the ID)
  conversationId  String
  messageId       String?   @unique                        // Links to message (if message node)
  nodeType        String                                   // message, edit, annotation, fork, snapshot
  authorDid       String                                   // DID of creator
  signature       String                                   // Ed25519 signature of content
  content         Json                                     // Node payload
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)
  snapshotName    String?                                  // e.g., "main", "draft-v1"
  metadata        Json      @default("{}")

  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  message         Message?     @relation(fields: [messageId], references: [id])
  parentEdges     DagEdge[]    @relation("ChildNode")
  childEdges      DagEdge[]    @relation("ParentNode")

  @@index([conversationId])
  @@index([authorDid])
  @@index([nodeType])
  @@index([snapshotName])
  @@map("dag_nodes")
}

model DagEdge {
  id        String   @id @default(uuid())
  parentId  String                                         // Points to parent DagNode
  childId   String                                         // Points to child DagNode
  edgeType  String   @default("next")                      // next, fork, merge, edit
  createdAt DateTime @default(now()) @db.Timestamptz(6)

  parent    DagNode  @relation("ParentNode", fields: [parentId], references: [id], onDelete: Cascade)
  child     DagNode  @relation("ChildNode", fields: [childId], references: [id], onDelete: Cascade)

  @@unique([parentId, childId])
  @@index([parentId])
  @@index([childId])
  @@map("dag_edges")
}

// ============================================================================
// ACU LAYER: Knowledge Graph
// ============================================================================

model AtomicChatUnit {
  id                  String    @id                        // Content hash (SHA-256)
  authorDid           String
  signature           String                               // Ed25519 signature (hex/base64 for POC)
  content             String
  language            String?
  type                String                               // statement, question, answer, code_snippet, thinking, mermaid
  category            String                               // technical, conceptual, procedural, personal

  // Source provenance
  conversationId      String
  messageId           String
  messageIndex        Int
  provider            String
  model               String?
  sourceTimestamp      DateTime  @db.Timestamptz(6)

  // Quality metrics
  qualityOverall      Float?                               // 0-100
  contentRichness     Float?
  structuralIntegrity Float?
  uniqueness          Float?

  // Usage counters
  viewCount           Int       @default(0)
  shareCount          Int       @default(0)
  quoteCount          Int       @default(0)
  rediscoveryScore    Float?

  // Sharing (inherits from conversation but can be overridden)
  sharingPolicy       SharingPolicy @default(PRIVATE)
  globalizedAt        DateTime?     @db.Timestamptz(6)

  // Timestamps
  createdAt           DateTime  @default(now()) @db.Timestamptz(6)
  indexedAt           DateTime  @default(now()) @db.Timestamptz(6)
  metadata            Json      @default("{}")

  // Relationships
  author              User         @relation(fields: [authorDid], references: [did])
  conversation        Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  message             Message      @relation(fields: [messageId], references: [id], onDelete: Cascade)
  linksFrom           AcuLink[]    @relation("SourceAcu")
  linksTo             AcuLink[]    @relation("TargetAcu")
  sharingGrants       SharingGrant[] @relation("SharedAcu")
  globalPublication   GlobalPublication? @relation("GlobalAcu")

  @@index([conversationId])
  @@index([messageId])
  @@index([authorDid])
  @@index([type])
  @@index([category])
  @@index([sharingPolicy])
  @@index([qualityOverall(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@map("atomic_chat_units")
}

model AcuLink {
  id        String   @id @default(uuid())
  sourceId  String
  targetId  String
  relation  String                                         // next, previous, explains, answers, similar_to, references
  weight    Float    @default(1.0)
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  metadata  Json     @default("{}")

  source    AtomicChatUnit @relation("SourceAcu", fields: [sourceId], references: [id], onDelete: Cascade)
  target    AtomicChatUnit @relation("TargetAcu", fields: [targetId], references: [id], onDelete: Cascade)

  @@unique([sourceId, targetId, relation])
  @@index([sourceId])
  @@index([targetId])
  @@index([relation])
  @@map("acu_links")
}

// ============================================================================
// LAYER 2: SHARING MESH (P2P Access Control)
// ============================================================================

// Circles = groups of users for batch sharing
model Circle {
  id          String         @id @default(uuid())
  ownerId     String
  name        String
  description String?
  isPublic    Boolean        @default(false)               // Discoverable by others?
  inviteCode  String?        @unique                       // For joining without owner approval
  createdAt   DateTime       @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime       @updatedAt @db.Timestamptz(6)
  metadata    Json           @default("{}")

  owner       User           @relation("CircleOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     CircleMember[]
  sharingGrants SharingGrant[]

  @@index([ownerId])
  @@index([isPublic])
  @@index([inviteCode])
  @@map("circles")
}

model CircleMember {
  id        String   @id @default(uuid())
  circleId  String
  userId    String
  role      String   @default("member")                    // owner, admin, member
  canInvite Boolean  @default(false)
  canShare  Boolean  @default(true)                        // Can share own content to this circle
  joinedAt  DateTime @default(now()) @db.Timestamptz(6)
  invitedBy String?                                        // DID of inviter

  circle    Circle   @relation(fields: [circleId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([circleId, userId])
  @@index([circleId])
  @@index([userId])
  @@map("circle_members")
}

// The core sharing primitive: a grant of access
model SharingGrant {
  id              String    @id @default(uuid())
  grantorId       String                                   // User who grants access
  granteeId       String?                                  // Specific user (null if circle grant)
  circleId        String?                                  // Circle (null if direct user grant)

  // What is being shared (one of these is set)
  conversationId  String?                                  // Share whole conversation
  acuId           String?                                  // Share specific ACU

  // Permissions
  canView         Boolean   @default(true)
  canAnnotate     Boolean   @default(false)
  canRemix        Boolean   @default(false)
  canReshare      Boolean   @default(false)

  // Lifecycle
  grantedAt       DateTime  @default(now()) @db.Timestamptz(6)
  expiresAt       DateTime? @db.Timestamptz(6)             // Null = permanent
  revokedAt       DateTime? @db.Timestamptz(6)             // Null = active

  // Crypto envelope
  encryptedKey    String?                                  // AES key encrypted for recipient's public key
  ephemeralPubKey String?                                  // X25519 ephemeral key used for ECDH

  // Status
  status          GrantStatus @default(ACTIVE)             // ACTIVE, EXPIRED, REVOKED
  accessCount     Int        @default(0)                   // How many times accessed
  lastAccessedAt  DateTime?  @db.Timestamptz(6)

  metadata        Json       @default("{}")

  // Relationships
  grantor         User         @relation("Grantor", fields: [grantorId], references: [id])
  grantee         User?        @relation("Grantee", fields: [granteeId], references: [id])
  circle          Circle?      @relation(fields: [circleId], references: [id])
  conversation    Conversation? @relation(fields: [conversationId], references: [id])
  acu             AtomicChatUnit? @relation("SharedAcu", fields: [acuId], references: [id])

  @@index([grantorId])
  @@index([granteeId])
  @@index([circleId])
  @@index([conversationId])
  @@index([acuId])
  @@index([status])
  @@index([expiresAt])
  @@index([granteeId, status])                             // "What can I access?"
  @@index([grantorId, status])                             // "What have I shared?"
  @@map("sharing_grants")
}

// ============================================================================
// LAYER 3: GLOBAL COMMONS (Append-Only Public Ledger)
// ============================================================================

// Once published here, CANNOT be deleted. This is the social contract.
model GlobalPublication {
  id              String    @id @default(uuid())
  publisherDid    String                                   // DID of publisher
  publisherId     String                                   // User ID of publisher

  // What was published (one of these)
  conversationId  String?   @unique                        // Whole conversation
  acuId           String?   @unique                        // Specific ACU

  // Content snapshot (frozen at publication time)
  contentHash     String                                   // SHA-256 of published content
  signature       String                                   // Publisher's Ed25519 signature
  title           String?                                  // Display title at publication time
  summary         String?                                  // Optional summary
  tags            String[]                                 // Discovery tags

  // Publication metadata
  publishedAt     DateTime  @default(now()) @db.Timestamptz(6)
  version         Int       @default(1)                    // Can publish updated versions
  previousVersion String?                                  // ID of previous version (if update)

  // Engagement (append-only counters)
  viewCount       Int       @default(0)
  starCount       Int       @default(0)
  forkCount       Int       @default(0)
  citationCount   Int       @default(0)

  // License / terms
  license         String    @default("CC-BY-4.0")          // Creative Commons by default

  metadata        Json      @default("{}")

  // Relationships
  publisher       User          @relation(fields: [publisherId], references: [id])
  conversation    Conversation? @relation(fields: [conversationId], references: [id])
  acu             AtomicChatUnit? @relation("GlobalAcu", fields: [acuId], references: [id])
  stars           GlobalStar[]
  citations       GlobalCitation[] @relation("CitedPublication")
  citedBy         GlobalCitation[] @relation("CitingPublication")

  @@index([publisherDid])
  @@index([publishedAt(sort: Desc)])
  @@index([contentHash])
  @@index([tags])
  @@index([starCount(sort: Desc)])
  @@index([viewCount(sort: Desc)])
  @@map("global_publications")
}

// Stars on global publications (like GitHub stars)
model GlobalStar {
  id            String   @id @default(uuid())
  publicationId String
  userDid       String
  starredAt     DateTime @default(now()) @db.Timestamptz(6)

  publication   GlobalPublication @relation(fields: [publicationId], references: [id], onDelete: Cascade)

  @@unique([publicationId, userDid])
  @@index([publicationId])
  @@index([userDid])
  @@map("global_stars")
}

// Citations between global publications
model GlobalCitation {
  id              String   @id @default(uuid())
  citingId        String                                   // The publication that cites
  citedId         String                                   // The publication being cited
  context         String?                                  // Why/how it's cited
  createdAt       DateTime @default(now()) @db.Timestamptz(6)

  citing          GlobalPublication @relation("CitingPublication", fields: [citingId], references: [id])
  cited           GlobalPublication @relation("CitedPublication", fields: [citedId], references: [id])

  @@unique([citingId, citedId])
  @@index([citingId])
  @@index([citedId])
  @@map("global_citations")
}

// ============================================================================
// REPUTATION & CONTRIBUTION TRACKING
// ============================================================================

model ReputationEvent {
  id          String   @id @default(uuid())
  userId      String
  eventType   String                                       // published, starred, cited, shared, consumed
  points      Int                                          // Positive or negative
  sourceId    String?                                      // Publication/grant/etc that triggered this
  sourceType  String?                                      // global_publication, sharing_grant, etc.
  reason      String?                                      // Human-readable reason
  createdAt   DateTime @default(now()) @db.Timestamptz(6)

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([eventType])
  @@index([createdAt(sort: Desc)])
  @@index([userId, eventType])
  @@map("reputation_events")
}

// ============================================================================
// P2P SYNC INFRASTRUCTURE
// ============================================================================

// Tracks what each device has synced (vector clock equivalent)
model SyncCursor {
  id          String   @id @default(uuid())
  userId      String
  deviceDid   String                                       // Which device
  tableName   String                                       // Which table
  lastSyncId  String?                                      // Last synced record ID
  lastSyncAt  DateTime @default(now()) @db.Timestamptz(6)  // Last sync timestamp
  vectorClock Json     @default("{}")                       // Full vector clock state

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deviceDid, tableName])
  @@index([userId, deviceDid])
  @@map("sync_cursors")
}

// Operations log for CRDT-style sync between devices
model SyncOperation {
  id          String   @id @default(uuid())
  authorDid   String                                       // Who made this change
  deviceDid   String                                       // On which device
  tableName   String                                       // Affected table
  recordId    String                                       // Affected record ID
  operation   String                                       // INSERT, UPDATE, DELETE
  payload     Json                                         // The change data (CRDT-friendly)
  hlcTimestamp String                                      // Hybrid Logical Clock timestamp
  vectorClock Json     @default("{}")                       // Vector clock at time of operation
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  appliedAt   DateTime? @db.Timestamptz(6)                 // When applied on this node

  @@index([authorDid])
  @@index([deviceDid])
  @@index([tableName, recordId])
  @@index([hlcTimestamp])
  @@index([createdAt(sort: Desc)])
  @@map("sync_operations")
}

// Relay server mailbox: encrypted messages waiting for offline peers
model PeerMailbox {
  id            String   @id @default(uuid())
  recipientDid  String                                     // Intended recipient
  senderDid     String                                     // Sender
  encryptedPayload String                                  // Encrypted with recipient's public key
  payloadType   String                                     // sync_ops, sharing_grant, message, etc.
  createdAt     DateTime @default(now()) @db.Timestamptz(6)
  expiresAt     DateTime @db.Timestamptz(6)                // Auto-delete after expiry
  deliveredAt   DateTime? @db.Timestamptz(6)               // Null = not yet delivered
  acknowledgedAt DateTime? @db.Timestamptz(6)              // Null = not yet acknowledged

  @@index([recipientDid, deliveredAt])                     // "What's waiting for me?"
  @@index([senderDid])
  @@index([expiresAt])
  @@index([createdAt(sort: Desc)])
  @@map("peer_mailbox")
}

// ============================================================================
// OPERATIONAL TABLES
// ============================================================================

model CaptureAttempt {
  id             String    @id @default(uuid())
  sourceUrl      String
  provider       String?
  status         String                                    // pending, success, failed
  errorCode      String?
  errorMessage   String?
  startedAt      DateTime  @db.Timestamptz(6)
  completedAt    DateTime? @db.Timestamptz(6)
  duration       Int?                                      // milliseconds
  ipAddress      String?
  userAgent      String?
  conversationId String?
  retryCount     Int       @default(0)
  retryOf        String?
  createdAt      DateTime  @default(now()) @db.Timestamptz(6)

  @@index([sourceUrl])
  @@index([status])
  @@index([createdAt(sort: Desc)])
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
  totalMessages      Int       @default(0)
  totalCodeBlocks    Int       @default(0)
  lastCaptureAt      DateTime? @db.Timestamptz(6)
  updatedAt          DateTime  @updatedAt @db.Timestamptz(6)

  @@map("provider_stats")
}

// ============================================================================
// ENUMS
// ============================================================================

enum SharingPolicy {
  PRIVATE                                                  // Only owner can see
  SHARED                                                   // Visible to granted users/circles
  GLOBAL                                                   // Published to commons (irrevocable)
}

enum GrantStatus {
  ACTIVE                                                   // Currently accessible
  EXPIRED                                                  // Past expiresAt
  REVOKED                                                  // Manually revoked by grantor
}
```

---

## How It Works: Flow Diagrams

### Flow 1: User Captures a Conversation

```
User pastes ChatGPT URL
         │
         ▼
┌─────────────────┐
│ Capture Service  │
│ (Playwright)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Extract & Parse  │────▶│ Generate Hashes  │
│ (Provider-specific)│   │ contentHash=SHA256│
└─────────────────┘     │ signature=Ed25519 │
                         └────────┬─────────┘
                                  │
         ┌────────────────────────┤
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│ Save Conversation│    │ Generate ACUs    │
│ sharingPolicy=   │    │ sharingPolicy=   │
│   PRIVATE        │    │   PRIVATE        │
└─────────────────┘     └──────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│ Create DagNodes  │    │ Create AcuLinks  │
│ for each message │    │ (relationships)  │
└─────────────────┘     └──────────────────┘
         │
         ▼
   All stored in user's
   local vault (Layer 1)
```

### Flow 2: User Shares with a Circle

```
User selects conversation → "Share with Research Team"
         │
         ▼
┌──────────────────────┐
│ Verify: policy !=     │
│ GLOBAL? (can revoke) │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ For each circle member│
│                       │
│ 1. Generate AES key  │
│ 2. Encrypt content   │
│ 3. ECDH with member's│
│    public key         │
│ 4. Wrap AES key      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Create SharingGrant   │
│                       │
│ grantorId = me        │
│ circleId = team_id    │
│ conversationId = X    │
│ canView = true        │
│ canAnnotate = true    │
│ canReshare = false    │
│ encryptedKey = ...    │
│ ephemeralPubKey = ... │
│ status = ACTIVE       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Update Conversation   │
│ sharingPolicy = SHARED│
└──────────┬───────────┘
           │
           ├──── Online members ─── WebSocket / WebRTC ──► Receive instantly
           │
           └──── Offline members ── PeerMailbox ──► Receive on next connect
```

### Flow 3: User Publishes to Global Commons

```
User selects conversation → "Publish Globally"
         │
         ▼
┌──────────────────────────┐
│ ⚠️ WARNING DIALOG          │
│                            │
│ "This action is PERMANENT  │
│  and IRREVOCABLE. Your     │
│  conversation will be      │
│  publicly visible forever. │
│  You cannot undo this."    │
│                            │
│  [Cancel]  [I Understand]  │
└──────────┬───────────────┘
           │ Confirmed
           ▼
┌──────────────────────────┐
│ 1. Snapshot content       │
│    contentHash = SHA256() │
│ 2. Sign with Ed25519      │
│ 3. Set version = 1        │
│ 4. Choose license         │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Create GlobalPublication  │
│                            │
│ contentHash = abc123...   │
│ signature = signed(hash)  │
│ license = CC-BY-4.0       │
│ publishedAt = now()       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Update Conversation       │
│ sharingPolicy = GLOBAL    │
│ globalizedAt = now()      │
│                            │
│ ⚡ THIS IS ONE-WAY         │
│ globalizedAt can never    │
│ be set back to null       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Create ReputationEvent    │
│ eventType = "published"   │
│ points = +10              │
└──────────────────────────┘
           │
           ▼
   Available in global search,
   feed, citations, etc.
```

### Flow 4: P2P Multi-Device Sync

```
Device A (Laptop)                    Device B (Phone)
     │                                    │
     │  User edits conversation           │
     │                                    │
     ▼                                    │
┌──────────┐                              │
│ Create    │                              │
│ SyncOp    │                              │
│           │                              │
│ op: UPDATE│                              │
│ table:    │                              │
│  convs    │                              │
│ hlc: t1   │                              │
│ vclock:   │                              │
│  {A:5}    │                              │
└─────┬────┘                              │
      │                                    │
      ├──── Device B online? ──── YES ────▶│
      │     (WebSocket/WebRTC)             │
      │                                    ▼
      │                           ┌──────────────┐
      │                           │ Receive SyncOp│
      │                           │               │
      │                           │ Compare vclock│
      │                           │ {A:5} > {A:4} │
      │                           │               │
      │                           │ Apply change  │
      │                           │ Update cursor │
      │                           └──────────────┘
      │
      ├──── Device B offline? ─── YES
      │
      ▼
┌──────────────┐
│ PeerMailbox   │
│               │
│ recipientDid  │
│  = device_B   │
│ encrypted     │
│  payload      │
│ expiresAt     │
│  = +30 days   │
└──────────────┘
      │
      │  Device B comes online later
      │
      ▼
┌──────────────┐
│ Check mailbox │─── GET /api/v1/sync/mailbox
│ Download ops  │
│ Apply in HLC  │
│ order         │
│ Acknowledge   │
└──────────────┘
```

---

## Access Control Query Patterns

### "What conversations can User X see?"

```sql
-- Their own conversations
SELECT c.* FROM conversations c
WHERE c."ownerId" = 'user-x-id'

UNION

-- Shared directly with them (active grants)
SELECT c.* FROM conversations c
JOIN sharing_grants sg ON sg."conversationId" = c.id
WHERE sg."granteeId" = 'user-x-id'
  AND sg.status = 'ACTIVE'
  AND (sg."expiresAt" IS NULL OR sg."expiresAt" > NOW())

UNION

-- Shared with circles they belong to
SELECT c.* FROM conversations c
JOIN sharing_grants sg ON sg."conversationId" = c.id
JOIN circle_members cm ON cm."circleId" = sg."circleId"
WHERE cm."userId" = 'user-x-id'
  AND sg.status = 'ACTIVE'
  AND (sg."expiresAt" IS NULL OR sg."expiresAt" > NOW())

UNION

-- All global publications
SELECT c.* FROM conversations c
WHERE c."sharingPolicy" = 'GLOBAL'
```

### "Can User X do Y with Conversation Z?"

```sql
SELECT
  COALESCE(bool_or(sg."canView"), false) as can_view,
  COALESCE(bool_or(sg."canAnnotate"), false) as can_annotate,
  COALESCE(bool_or(sg."canRemix"), false) as can_remix,
  COALESCE(bool_or(sg."canReshare"), false) as can_reshare
FROM sharing_grants sg
LEFT JOIN circle_members cm ON cm."circleId" = sg."circleId"
WHERE sg."conversationId" = 'conv-z-id'
  AND sg.status = 'ACTIVE'
  AND (sg."expiresAt" IS NULL OR sg."expiresAt" > NOW())
  AND (
    sg."granteeId" = 'user-x-id'                    -- Direct grant
    OR cm."userId" = 'user-x-id'                     -- Circle grant
  )
```

---

## Centralization vs P2P: What Lives Where

| Component | Location | Why |
|-----------|----------|-----|
| **Conversations & Messages** | User's local DB | Sovereignty |
| **ACUs & Knowledge Graph** | User's local DB | Sovereignty |
| **Private Keys** | User's local DB only (encrypted) | Security |
| **Sharing Grants** | Grantor's local DB + recipient's local DB | Both parties need record |
| **Global Publications** | Light relay server index + user's local DB | Discovery needs indexing |
| **Peer Mailbox** | Relay server (encrypted, temporary) | Offline delivery |
| **Sync Operations** | User's local DB (synced P2P) | Multi-device |
| **Reputation Events** | Light relay server + local | Global reputation needs aggregation |
| **Provider Stats** | Relay server | Operational |
| **Capture Attempts** | Relay server | Operational |
| **Circle Membership** | Owner's DB + members' DBs | Distributed |
| **Search Index** | Local: FTS on local DB. Global: relay indexes public content | Hybrid |

### The "Light Relay Server"

The only centralized component. Its responsibilities are **minimal**:

1. **Peer Mailbox**: Store encrypted blobs for offline peers (auto-expire after 30 days)
2. **Global Publications Index**: Index public content for search/discovery
3. **Signaling**: WebRTC signaling for direct P2P connections
4. **Reputation Aggregation**: Sum reputation events across the network
5. **Provider Stats**: Aggregate capture statistics

**The relay server NEVER has access to**:
- Private keys
- Unencrypted conversations
- Sharing grant permissions (only encrypted envelopes)
- User passwords or authentication tokens

---

## Migration Path from Current Schema

Here's what changes from your current schema:

| Current | New | Change Type |
|---------|-----|-------------|
| `Conversation` | `Conversation` | **Modified**: Added `contentHash`, `signature`, `sharingPolicy` enum, `globalizedAt` |
| `Message` | `Message` | **Modified**: Added `contentHash`, `signature`, unique constraint on `[conversationId, messageIndex]` |
| `AtomicChatUnit` | `AtomicChatUnit` | **Modified**: Removed per-ACU sharing fields (`sharingCircles`, `canView`, etc.), replaced with `SharingGrant` references. Changed `signature` from `Bytes` to `String` for POC simplicity. Removed `embedding` (add back when vector search ready) |
| `AcuLink` | `AcuLink` | **Unchanged** |
| `User` | `User` | **Modified**: Added `verificationTier`, removed duplicated relations |
| `Device` | `Device` | **Modified**: Added `deviceDid`, `delegationProof`, `revokedAt`, `lastSyncAt` |
| `Circle` | `Circle` | **Modified**: Added `inviteCode` |
| `CircleMember` | `CircleMember` | **Modified**: Added `invitedBy` |
| `Contribution` | **Removed** | Replaced by `ReputationEvent` (more general) |
| `Consumption` | **Removed** | Replaced by `SharingGrant.accessCount` + `ReputationEvent` |
| — | `DagNode` | **New**: Content-addressed DAG |
| — | `DagEdge` | **New**: DAG relationships |
| — | `SharingGrant` | **New**: Core sharing primitive |
| — | `GlobalPublication` | **New**: Irrevocable public content |
| — | `GlobalStar` | **New**: Public engagement |
| — | `GlobalCitation` | **New**: Cross-publication references |
| — | `ReputationEvent` | **New**: Contribution tracking |
| — | `SyncCursor` | **New**: Multi-device sync state |
| — | `SyncOperation` | **New**: CRDT-style operation log |
| — | `PeerMailbox` | **New**: Offline P2P delivery |
| — | `SharingPolicy` enum | **New**: PRIVATE/SHARED/GLOBAL |
| — | `GrantStatus` enum | **New**: ACTIVE/EXPIRED/REVOKED |

---

## Enforcing the "No Unshare After Global" Rule

This is enforced at **multiple levels**:

### 1. Database Level (PostgreSQL Trigger)

```sql
-- Prevent changing sharingPolicy from GLOBAL to anything else
CREATE OR REPLACE FUNCTION prevent_unglobalize()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."sharingPolicy" = 'GLOBAL' AND NEW."sharingPolicy" != 'GLOBAL' THEN
    RAISE EXCEPTION 'Cannot revoke global publication. This action is irrevocable.';
  END IF;
  IF OLD."globalizedAt" IS NOT NULL AND NEW."globalizedAt" IS NULL THEN
    RAISE EXCEPTION 'Cannot clear globalizedAt. Publication is permanent.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_global_permanence
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_unglobalize();

-- Same for ACUs
CREATE TRIGGER enforce_acu_global_permanence
  BEFORE UPDATE ON atomic_chat_units
  FOR EACH ROW
  EXECUTE FUNCTION prevent_unglobalize();

-- Prevent deletion of global publications
CREATE OR REPLACE FUNCTION prevent_global_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."sharingPolicy" = 'GLOBAL' THEN
    RAISE EXCEPTION 'Cannot delete globally published content. This action is irrevocable.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_no_global_delete
  BEFORE DELETE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_global_deletion();
```

### 2. Application Level (Service Layer)

```typescript
async function publishGlobally(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });

  // Guard: already global
  if (conversation.sharingPolicy === 'GLOBAL') {
    throw new Error('Already published globally');
  }

  // Guard: must be owner
  if (conversation.ownerId !== userId) {
    throw new Error('Only the owner can publish globally');
  }

  // Transaction: atomic publish
  await prisma.$transaction([
    // 1. Update conversation policy (ONE-WAY)
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        sharingPolicy: 'GLOBAL',
        globalizedAt: new Date(),  // Set once, never cleared
      }
    }),

    // 2. Create global publication record
    prisma.globalPublication.create({
      data: {
        publisherDid: user.did,
        publisherId: userId,
        conversationId,
        contentHash: conversation.contentHash,
        signature: signWithEd25519(conversation.contentHash, privateKey),
        title: conversation.title,
        license: 'CC-BY-4.0',
      }
    }),

    // 3. Globalize all ACUs in this conversation
    prisma.atomicChatUnit.updateMany({
      where: { conversationId },
      data: {
        sharingPolicy: 'GLOBAL',
        globalizedAt: new Date(),
      }
    }),

    // 4. Award reputation
    prisma.reputationEvent.create({
      data: {
        userId,
        eventType: 'published',
        points: 10,
        sourceId: conversationId,
        sourceType: 'conversation',
        reason: 'Published conversation to global commons',
      }
    }),
  ]);
}
```

### 3. API Level (Route Guard)

```typescript
router.delete('/api/v1/conversations/:id', async (req, res) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id }
  });

  if (conversation.sharingPolicy === 'GLOBAL') {
    return res.status(403).json({
      error: 'IRREVOCABLE',
      message: 'Cannot delete globally published content. This is by design.',
    });
  }

  // ... proceed with deletion
});
```

---

This architecture gives you a working POC that:

1. **Every user has their own PostgreSQL** with full sovereignty over their data
2. **Sharing is granular** through `SharingGrant` with per-permission controls
3. **Global publication is permanent** enforced at DB trigger, service, and API levels
4. **P2P sync** through `SyncOperation` log with HLC timestamps and vector clocks
5. **Minimal centralization** — the relay server only handles encrypted mailbox, signaling, and public index
6. **Progressive enhancement** — start with local-only, add sharing, then global publication as features mature
