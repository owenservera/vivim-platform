# P2P Local-First Database Architecture for ACU Network

Based on your vision and current schema, here's a comprehensive architecture that maximizes decentralization while maintaining practical usability.

## Core Design Principles

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE OVERVIEW                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐      P2P Sync       ┌─────────────────┐           │
│  │   User A's      │◄──────────────────►│   User B's      │           │
│  │   Local DB      │                     │   Local DB      │           │
│  └────────┬────────┘                     └────────┬────────┘           │
│           │                                       │                     │
│           │              ┌──────────┐             │                     │
│           └─────────────►│  Minimal │◄────────────┘                     │
│                          │  Relay   │                                   │
│                          │  Server  │  (Only for discovery +            │
│                          └──────────┘   offline message queue)          │
│                                                                         │
│  KEY INSIGHT: Users OWN their data locally. The network only            │
│  facilitates discovery and delivers signed access grants/content.       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Enhanced Prisma Schema

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
// SECTION 1: IDENTITY LAYER
// Local identity + known remote identities
// ============================================================================

// The local user (only ONE per device database)
model LocalIdentity {
  id                    String   @id @default(uuid())
  did                   String   @unique
  displayName           String?
  email                 String?
  avatarUrl             String?
  
  // Cryptographic identity
  publicKey             String   // Base64 encoded public key
  encryptedPrivateKey   String   // Encrypted with device key
  keyDerivationSalt     String   // For key derivation
  
  // Settings
  settings              Json     @default("{}")
  defaultSharingPolicy  String   @default("private") // "private", "circle", "public"
  autoSyncEnabled       Boolean  @default(true)
  
  createdAt             DateTime @default(now()) @db.Timestamptz(6)
  updatedAt             DateTime @updatedAt @db.Timestamptz(6)

  @@map("local_identity")
}

// Known identities from the network (cached)
model KnownIdentity {
  id                String   @id // The DID itself
  publicKey         String
  displayName       String?
  avatarUrl         String?
  
  // Trust & verification
  verificationLevel String   @default("unverified") // "unverified", "verified", "trusted"
  verifiedAt        DateTime?
  trustScore        Float    @default(0.5)
  
  // Relationship
  isFollowing       Boolean  @default(false)
  isBlocked         Boolean  @default(false)
  mutualCircles     String[] // Circle IDs we share
  
  // Sync state
  lastSeenAt        DateTime?
  lastContentAt     DateTime? // Last content we received from them
  
  metadata          Json     @default("{}")
  createdAt         DateTime @default(now()) @db.Timestamptz(6)
  updatedAt         DateTime @updatedAt @db.Timestamptz(6)

  @@index([isFollowing])
  @@index([verificationLevel])
  @@map("known_identities")
}

// Devices linked to local identity (for multi-device sync)
model Device {
  id              String   @id @default(uuid())
  deviceId        String   @unique // Stable device identifier
  deviceName      String
  deviceType      String   // "desktop", "mobile", "tablet", "browser"
  platform        String   // "windows", "macos", "linux", "ios", "android", "web"
  
  // Cryptographic identity per device
  publicKey       String
  fingerprint     String?
  
  // Status
  isCurrentDevice Boolean  @default(false)
  isActive        Boolean  @default(true)
  isTrusted       Boolean  @default(false)
  
  // Sync state with this device
  lastSyncAt      DateTime?
  syncCursor      String?  // Vector clock or sequence number
  
  createdAt       DateTime @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime @updatedAt @db.Timestamptz(6)
  lastSeenAt      DateTime @default(now()) @db.Timestamptz(6)
  metadata        Json     @default("{}")

  @@index([isActive])
  @@map("devices")
}

// ============================================================================
// SECTION 2: CONTENT LAYER (Owned Content)
// This is the user's actual data - full control, local-first
// ============================================================================

model Conversation {
  id                   String           @id @default(uuid())
  provider             String
  sourceUrl            String           @unique
  title                String
  model                String?
  
  // Timestamps
  createdAt            DateTime         @db.Timestamptz(6)
  updatedAt            DateTime         @db.Timestamptz(6)
  capturedAt           DateTime         @default(now()) @db.Timestamptz(6)
  
  // Stats
  messageCount         Int              @default(0)
  userMessageCount     Int              @default(0)
  aiMessageCount       Int              @default(0)
  totalWords           Int              @default(0)
  totalCharacters      Int              @default(0)
  totalTokens          Int?
  totalCodeBlocks      Int              @default(0)
  totalImages          Int              @default(0)
  totalTables          Int              @default(0)
  totalLatexBlocks     Int              @default(0)
  totalMermaidDiagrams Int              @default(0)
  totalToolCalls       Int              @default(0)
  
  metadata             Json             @default("{}")
  
  // Relationships
  acus                 AtomicChatUnit[]
  messages             Message[]

  @@index([provider])
  @@index([capturedAt(sort: Desc)])
  @@index([provider, capturedAt(sort: Desc)])
  @@index([sourceUrl])
  @@index([createdAt(sort: Desc)])
  @@map("conversations")
}

model Message {
  id             String           @id @default(uuid())
  conversationId String
  role           String
  author         String?
  parts          Json
  createdAt      DateTime         @db.Timestamptz(6)
  messageIndex   Int
  status         String           @default("completed")
  finishReason   String?
  tokenCount     Int?
  metadata       Json             @default("{}")
  
  acus           AtomicChatUnit[]
  conversation   Conversation     @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, messageIndex])
  @@index([conversationId, createdAt])
  @@index([role])
  @@map("messages")
}

// THE CORE UNIT - Atomic Chat Unit (owned by local user)
model AtomicChatUnit {
  id                  String    @id // Content-addressed: hash(authorDid + content + sourceTimestamp)
  
  // Authorship & Integrity
  authorDid           String    // Always the local user's DID for owned content
  signature           Bytes     // Ed25519 signature of content hash
  contentHash         String    // SHA-256 of content for integrity verification
  
  // Content
  content             String
  language            String?
  type                String    // "code", "explanation", "question", "answer", "instruction"
  category            String    // Domain category
  
  // AI/ML Features
  embedding           Float[]
  embeddingModel      String?
  
  // Provenance
  conversationId      String
  messageId           String
  messageIndex        Int
  provider            String
  model               String?
  sourceTimestamp     DateTime  @db.Timestamptz(6)
  extractorVersion    String?
  parserVersion       String?
  
  // Quality Metrics
  qualityOverall      Float?
  contentRichness     Float?
  structuralIntegrity Float?
  uniqueness          Float?
  
  // Engagement (local tracking)
  viewCount           Int       @default(0)
  shareCount          Int       @default(0)
  quoteCount          Int       @default(0)
  rediscoveryScore    Float?
  
  // Timestamps
  createdAt           DateTime  @default(now()) @db.Timestamptz(6)
  indexedAt           DateTime  @default(now()) @db.Timestamptz(6)
  
  metadata            Json      @default("{}")
  
  // Relationships
  conversation        Conversation   @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  message             Message        @relation(fields: [messageId], references: [id], onDelete: Cascade)
  linksFrom           AcuLink[]      @relation("SourceAcu")
  linksTo             AcuLink[]      @relation("TargetAcu")
  
  // Access Control
  accessPolicy        AccessPolicy?
  grants              AccessGrant[]
  
  // Public share (if made public)
  publicShare         PublicShare?

  @@index([conversationId])
  @@index([messageId])
  @@index([authorDid])
  @@index([type])
  @@index([category])
  @@index([qualityOverall(sort: Desc)])
  @@index([rediscoveryScore(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@index([contentHash])
  @@map("atomic_chat_units")
}

model AcuLink {
  id        String         @id @default(uuid())
  sourceId  String
  targetId  String
  relation  String         // "references", "extends", "contradicts", "similar_to"
  weight    Float          @default(1.0)
  createdAt DateTime       @default(now()) @db.Timestamptz(6)
  metadata  Json           @default("{}")
  
  source    AtomicChatUnit @relation("SourceAcu", fields: [sourceId], references: [id], onDelete: Cascade)
  target    AtomicChatUnit @relation("TargetAcu", fields: [targetId], references: [id], onDelete: Cascade)

  @@unique([sourceId, targetId, relation])
  @@index([sourceId])
  @@index([targetId])
  @@index([relation])
  @@map("acu_links")
}

// ============================================================================
// SECTION 3: ACCESS CONTROL LAYER
// Fine-grained permissions with immutable public sharing
// ============================================================================

// Default policy for an ACU (can be overridden by specific grants)
model AccessPolicy {
  id              String         @id @default(uuid())
  acuId           String         @unique
  
  // Current visibility level
  visibility      String         @default("private") // "private", "circles", "public"
  
  // Default permissions for circles
  defaultCanView     Boolean     @default(true)
  defaultCanAnnotate Boolean     @default(false)
  defaultCanRemix    Boolean     @default(false)
  defaultCanReshare  Boolean     @default(false)
  
  // Expiration (null = never expires)
  defaultExpiry   DateTime?      @db.Timestamptz(6)
  
  // Lock status - once public, policy is locked
  isLocked        Boolean        @default(false)
  lockedAt        DateTime?      @db.Timestamptz(6)
  lockReason      String?        // "made_public", "admin_lock"
  
  createdAt       DateTime       @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime       @updatedAt @db.Timestamptz(6)
  
  acu             AtomicChatUnit @relation(fields: [acuId], references: [id], onDelete: Cascade)

  @@map("access_policies")
}

// Specific access grants (to users or circles)
model AccessGrant {
  id              String    @id // Content-addressed: hash(grantorDid + granteeId + acuId + permissions + createdAt)
  
  // Grant details
  acuId           String
  grantorDid      String    // Who is granting (must be ACU author)
  
  // Recipient (one of these is set)
  granteeType     String    // "user", "circle"
  granteeDid      String?   // For user grants
  circleId        String?   // For circle grants
  
  // Permissions
  canView         Boolean   @default(true)
  canAnnotate     Boolean   @default(false)
  canRemix        Boolean   @default(false)
  canReshare      Boolean   @default(false)
  
  // Time bounds
  validFrom       DateTime  @default(now()) @db.Timestamptz(6)
  expiresAt       DateTime? @db.Timestamptz(6)
  
  // Cryptographic proof
  signature       Bytes     // Signed by grantor
  signedPayload   String    // The exact data that was signed (for verification)
  
  // Status
  isActive        Boolean   @default(true)
  revokedAt       DateTime? @db.Timestamptz(6)
  revocationSig   Bytes?    // Signature of revocation
  
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)
  
  // Relationships
  acu             AtomicChatUnit @relation(fields: [acuId], references: [id], onDelete: Cascade)
  circle          Circle?        @relation(fields: [circleId], references: [id])

  @@index([acuId])
  @@index([grantorDid])
  @@index([granteeDid])
  @@index([circleId])
  @@index([isActive])
  @@map("access_grants")
}

// IMMUTABLE public share record - once created, cannot be deleted
model PublicShare {
  id              String    @id @default(uuid())
  acuId           String    @unique
  
  // Author confirmation
  authorDid       String
  signature       Bytes     // Author's signature confirming public share
  signedPayload   String    // "I hereby share {acuId} publicly at {timestamp}"
  
  // Content snapshot (for verification even if ACU is later deleted locally)
  contentHash     String
  contentSnapshot String?   // Optional: actual content for redundancy
  
  // Timestamp
  sharedAt        DateTime  @default(now()) @db.Timestamptz(6)
  
  // Witness system (other nodes that have seen this)
  witnesses       PublicShareWitness[]
  
  // Stats
  globalViewCount  Int      @default(0)
  globalShareCount Int      @default(0)
  
  acu             AtomicChatUnit @relation(fields: [acuId], references: [id])

  @@index([authorDid])
  @@index([sharedAt])
  @@index([contentHash])
  @@map("public_shares")
}

// Witnesses confirm they've seen a public share (decentralized verification)
model PublicShareWitness {
  id              String      @id @default(uuid())
  publicShareId   String
  witnessDid      String
  witnessedAt     DateTime    @default(now()) @db.Timestamptz(6)
  signature       Bytes       // Witness signature
  
  publicShare     PublicShare @relation(fields: [publicShareId], references: [id], onDelete: Cascade)

  @@unique([publicShareId, witnessDid])
  @@index([publicShareId])
  @@index([witnessDid])
  @@map("public_share_witnesses")
}

// ============================================================================
// SECTION 4: CIRCLES (Trust Groups)
// ============================================================================

model Circle {
  id          String         @id @default(uuid())
  name        String
  description String?
  
  // Circle type
  circleType  String         @default("private") // "private", "public", "discoverable"
  
  // Invite policy
  invitePolicy String        @default("owner_only") // "owner_only", "members", "open"
  
  // Cryptographic identity for the circle
  circleKey   String?        // Shared symmetric key (encrypted for each member)
  
  createdAt   DateTime       @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime       @updatedAt @db.Timestamptz(6)
  metadata    Json           @default("{}")
  
  members     CircleMember[]
  grants      AccessGrant[]

  @@index([circleType])
  @@map("circles")
}

model CircleMember {
  id              String   @id @default(uuid())
  circleId        String
  memberDid       String
  
  // Role
  role            String   @default("member") // "owner", "admin", "member"
  
  // Permissions
  canInvite       Boolean  @default(false)
  canRemove       Boolean  @default(false)
  canShare        Boolean  @default(true)
  
  // Encrypted circle key for this member
  encryptedKey    String?  // Circle key encrypted with member's public key
  
  // Status
  status          String   @default("active") // "pending", "active", "left", "removed"
  
  joinedAt        DateTime @default(now()) @db.Timestamptz(6)
  invitedBy       String?  // DID of inviter
  
  circle          Circle   @relation(fields: [circleId], references: [id], onDelete: Cascade)

  @@unique([circleId, memberDid])
  @@index([circleId])
  @@index([memberDid])
  @@index([status])
  @@map("circle_members")
}

// ============================================================================
// SECTION 5: RECEIVED CONTENT (from network)
// Content we have ACCESS to but don't OWN
// ============================================================================

model ReceivedAcu {
  id              String    @id // Same as original ACU id
  
  // Original authorship (verified via signature)
  authorDid       String
  signature       Bytes
  contentHash     String
  
  // Content (decrypted)
  content         String
  language        String?
  type            String
  category        String
  
  // ML features (may be computed locally or received)
  embedding       Float[]?
  embeddingModel  String?
  
  // Provenance
  originalProvider   String
  originalModel      String?
  originalTimestamp  DateTime  @db.Timestamptz(6)
  
  // How we got access
  accessGrantId   String?   // The grant that authorized our access
  accessType      String    // "direct_grant", "circle", "public"
  receivedFrom    String    // Peer DID we received this from
  
  // Local metadata (not synced)
  receivedAt      DateTime  @default(now()) @db.Timestamptz(6)
  lastAccessedAt  DateTime  @default(now()) @db.Timestamptz(6)
  isPinned        Boolean   @default(false)
  isHidden        Boolean   @default(false)
  localRating     Int?      // 1-5 local rating
  localNotes      String?
  localTags       String[]
  
  // Cache management
  expiresFromCache DateTime? @db.Timestamptz(6) // When to purge from local cache
  
  // Links to received content
  linksFrom       ReceivedAcuLink[] @relation("ReceivedSourceAcu")
  linksTo         ReceivedAcuLink[] @relation("ReceivedTargetAcu")

  @@index([authorDid])
  @@index([type])
  @@index([category])
  @@index([accessType])
  @@index([receivedAt(sort: Desc)])
  @@index([isPinned])
  @@map("received_acus")
}

model ReceivedAcuLink {
  id        String      @id @default(uuid())
  sourceId  String
  targetId  String
  relation  String
  weight    Float       @default(1.0)
  createdAt DateTime    @default(now()) @db.Timestamptz(6)
  
  source    ReceivedAcu @relation("ReceivedSourceAcu", fields: [sourceId], references: [id], onDelete: Cascade)
  target    ReceivedAcu @relation("ReceivedTargetAcu", fields: [targetId], references: [id], onDelete: Cascade)

  @@unique([sourceId, targetId, relation])
  @@map("received_acu_links")
}

// ============================================================================
// SECTION 6: SYNC INFRASTRUCTURE
// ============================================================================

// Known peers for P2P connections
model Peer {
  id              String    @id @default(uuid())
  peerDid         String    @unique
  
  // Connection endpoints (multiple for redundancy)
  endpoints       PeerEndpoint[]
  
  // Relationship
  relationship    String    @default("known") // "known", "following", "mutual", "blocked"
  
  // Trust
  trustLevel      String    @default("untrusted") // "untrusted", "verified", "trusted"
  trustScore      Float     @default(0.5)
  
  // Sync state
  lastSyncAt      DateTime? @db.Timestamptz(6)
  lastSyncCursor  String?   // For resumable sync
  lastSyncStatus  String?   // "success", "partial", "failed"
  
  // Stats
  successfulSyncs Int       @default(0)
  failedSyncs     Int       @default(0)
  bytesReceived   BigInt    @default(0)
  bytesSent       BigInt    @default(0)
  
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @db.Timestamptz(6)
  lastSeenAt      DateTime? @db.Timestamptz(6)

  @@index([relationship])
  @@index([trustLevel])
  @@index([lastSeenAt])
  @@map("peers")
}

model PeerEndpoint {
  id            String   @id @default(uuid())
  peerId        String
  
  endpointType  String   // "webrtc", "websocket", "relay"
  address       String   // Connection address/details
  priority      Int      @default(0)
  
  isReachable   Boolean  @default(true)
  lastCheckedAt DateTime?
  latencyMs     Int?
  
  peer          Peer     @relation(fields: [peerId], references: [id], onDelete: Cascade)

  @@index([peerId])
  @@map("peer_endpoints")
}

// Sync event log (local operation log for CRDT-style sync)
model SyncLog {
  id            String   @id @default(uuid())
  sequence      BigInt   @unique @default(autoincrement())
  
  // What changed
  operation     String   // "create", "update", "delete", "share", "revoke"
  entityType    String   // "acu", "grant", "circle", "circle_member"
  entityId      String
  
  // Vector clock for conflict resolution
  vectorClock   Json     // {"did1": seq1, "did2": seq2, ...}
  
  // Change details
  changePayload Json?    // The actual change data
  checksum      String   // For verification
  
  createdAt     DateTime @default(now()) @db.Timestamptz(6)

  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("sync_log")
}

// Outbound sync queue
model SyncOutbox {
  id            String   @id @default(uuid())
  targetDid     String   // null for broadcast to all peers
  
  // Payload
  payloadType   String   // "acu", "grant", "revocation", "heartbeat"
  payload       Bytes    // Encrypted sync payload
  signature     Bytes    // Signature for verification
  
  // Priority & retry
  priority      Int      @default(0) // Higher = more urgent
  attempts      Int      @default(0)
  maxAttempts   Int      @default(5)
  lastAttemptAt DateTime?
  nextAttemptAt DateTime @default(now()) @db.Timestamptz(6)
  
  // Status
  status        String   @default("pending") // "pending", "sending", "delivered", "failed"
  errorMessage  String?
  
  createdAt     DateTime @default(now()) @db.Timestamptz(6)

  @@index([status, nextAttemptAt])
  @@index([targetDid])
  @@map("sync_outbox")
}

// Inbound sync queue (messages received, pending processing)
model SyncInbox {
  id            String   @id @default(uuid())
  fromDid       String
  
  // Payload
  payloadType   String
  payload       Bytes
  signature     Bytes
  
  // Processing status
  status        String   @default("pending") // "pending", "processing", "completed", "rejected"
  processedAt   DateTime?
  errorMessage  String?
  
  receivedAt    DateTime @default(now()) @db.Timestamptz(6)

  @@index([status])
  @@index([fromDid])
  @@map("sync_inbox")
}

// ============================================================================
// SECTION 7: MINIMAL SERVER SUPPORT
// These tables are for the RELAY server (optional, can run self-hosted)
// ============================================================================

// Message relay for offline peers
model RelayMessage {
  id            String   @id @default(uuid())
  targetDid     String
  fromDid       String
  
  // Encrypted payload (only recipient can decrypt)
  encryptedData Bytes
  
  // TTL
  expiresAt     DateTime @db.Timestamptz(6)
  
  // Tracking
  createdAt     DateTime @default(now()) @db.Timestamptz(6)
  deliveredAt   DateTime?

  @@index([targetDid, createdAt])
  @@index([expiresAt])
  @@map("relay_messages")
}

// Peer discovery announcements
model PeerAnnouncement {
  id            String   @id @default(uuid())
  peerDid       String   @unique
  publicKey     String
  
  // Connection info
  endpoints     Json     // Array of endpoint objects
  capabilities  Json     // What this peer supports
  
  // Signature for verification
  signature     Bytes
  
  // TTL
  announcedAt   DateTime @default(now()) @db.Timestamptz(6)
  expiresAt     DateTime @db.Timestamptz(6)

  @@index([expiresAt])
  @@map("peer_announcements")
}

// ============================================================================
// SECTION 8: ANALYTICS & TRACKING (Local only)
// ============================================================================

model Contribution {
  id             String   @id @default(uuid())
  acuId          String
  recipientType  String   // "user", "circle", "public"
  recipientId    String?  // null for public
  
  // Quality tracking
  quality        Float    @default(1.0)
  
  timestamp      DateTime @default(now()) @db.Timestamptz(6)
  metadata       Json     @default("{}")

  @@index([acuId])
  @@index([timestamp(sort: Desc)])
  @@map("contributions")
}

model Consumption {
  id          String   @id @default(uuid())
  acuId       String   // Could be owned or received ACU
  sourceType  String   // "owned", "received"
  providerDid String   // Who we got it from
  
  // Interaction type
  action      String   // "view", "copy", "remix", "share"
  
  timestamp   DateTime @default(now()) @db.Timestamptz(6)
  metadata    Json     @default("{}")

  @@index([acuId])
  @@index([providerDid])
  @@index([timestamp(sort: Desc)])
  @@map("consumptions")
}

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
  conversationId String?
  retryCount     Int       @default(0)
  retryOf        String?
  createdAt      DateTime  @default(now()) @db.Timestamptz(6)

  @@index([sourceUrl])
  @@index([status])
  @@index([createdAt(sort: Desc)])
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

## Access Control Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ACCESS CONTROL STATE MACHINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐                                                               │
│   │ PRIVATE  │ ──────── "Grant to user" ────────► ┌─────────────────┐       │
│   │          │                                     │ USER-SPECIFIC   │       │
│   │ (Default)│ ◄─────── "Revoke" ◄──────────────── │ GRANT           │       │
│   └────┬─────┘                                     └─────────────────┘       │
│        │                                                                      │
│        │ "Grant to circle"                                                    │
│        ▼                                                                      │
│   ┌──────────┐                                                               │
│   │ CIRCLE   │ ◄─────── "Add to more circles" ───►│(Can add more circles)   │
│   │ SHARED   │                                                               │
│   │          │ ◄─────── "Revoke from circle" ────► (Remove from circles)    │
│   └────┬─────┘                                                               │
│        │                                                                      │
│        │ "Make Public"                                                        │
│        ▼                                                                      │
│   ╔══════════╗                                                               │
│   ║ PUBLIC   ║  ◄── IMMUTABLE: Once public, CANNOT revert                    │
│   ║          ║                                                               │
│   ║ Creates: ║                                                               │
│   ║ - PublicShare record                                                     │
│   ║ - Locks AccessPolicy                                                     │
│   ║ - Signs irrevocable proof                                                │
│   ╚══════════╝                                                               │
│                                                                              │
│  KEY PROPERTIES:                                                             │
│  ✓ Private grants can be revoked                                             │
│  ✓ Circle shares can be added/removed                                        │
│  ✗ Public shares are PERMANENT                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## P2P Sync Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          P2P SYNC ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER A's DEVICE                           USER B's DEVICE                   │
│  ┌────────────────────┐                   ┌────────────────────┐            │
│  │  ┌──────────────┐  │                   │  ┌──────────────┐  │            │
│  │  │ AtomicChat   │  │                   │  │ ReceivedAcu  │  │            │
│  │  │ Unit (owned) │  │                   │  │ (cached)     │  │            │
│  │  └──────┬───────┘  │                   │  └──────▲───────┘  │            │
│  │         │          │                   │         │          │            │
│  │  ┌──────▼───────┐  │                   │  ┌──────┴───────┐  │            │
│  │  │ AccessGrant  │  │ ═══════════════►  │  │ Verify Grant │  │            │
│  │  │ (signed)     │  │   Sync Grant      │  │ + Signature  │  │            │
│  │  └──────┬───────┘  │                   │  └──────┬───────┘  │            │
│  │         │          │                   │         │          │            │
│  │  ┌──────▼───────┐  │                   │  ┌──────▼───────┐  │            │
│  │  │ SyncOutbox   │  │ ═══════════════►  │  │ SyncInbox    │  │            │
│  │  │              │  │   Encrypted ACU   │  │              │  │            │
│  │  └──────────────┘  │                   │  └──────────────┘  │            │
│  └─────────┬──────────┘                   └─────────┬──────────┘            │
│            │                                        │                        │
│            │       ┌──────────────────┐             │                        │
│            └──────►│  RELAY SERVER    │◄────────────┘                        │
│                    │  (Optional)      │                                      │
│                    │                  │                                      │
│                    │  - Message queue │   Only needed when:                  │
│                    │  - Peer discovery│   - Peers offline                    │
│                    │  - NAT traversal │   - No direct connection             │
│                    └──────────────────┘                                      │
│                                                                              │
│  SYNC PROTOCOL:                                                              │
│  1. User A creates AccessGrant, signs it                                     │
│  2. Grant + encrypted ACU added to SyncOutbox                                │
│  3. On connection, sync to User B (direct or via relay)                      │
│  4. User B receives in SyncInbox                                             │
│  5. User B verifies signature, decrypts, stores in ReceivedAcu               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Helpers

Here's key TypeScript code for the access control logic:

```typescript
// types/access.ts
export type Visibility = 'private' | 'circles' | 'public';
export type GranteeType = 'user' | 'circle';

export interface GrantPermissions {
  canView: boolean;
  canAnnotate: boolean;
  canRemix: boolean;
  canReshare: boolean;
}

export interface CreateGrantInput {
  acuId: string;
  granteeType: GranteeType;
  granteeDid?: string;
  circleId?: string;
  permissions: GrantPermissions;
  expiresAt?: Date;
}

// lib/access-control.ts
import { createHash } from 'crypto';
import { sign, verify } from './crypto'; // Your Ed25519 implementation

export class AccessController {
  constructor(
    private prisma: PrismaClient,
    private localDid: string,
    private privateKey: Uint8Array
  ) {}

  /**
   * Create a new access grant
   */
  async createGrant(input: CreateGrantInput): Promise<AccessGrant> {
    // Verify we own this ACU
    const acu = await this.prisma.atomicChatUnit.findUnique({
      where: { id: input.acuId },
      include: { accessPolicy: true }
    });
    
    if (!acu || acu.authorDid !== this.localDid) {
      throw new Error('Cannot grant access to ACU you do not own');
    }
    
    // Check if ACU is locked (made public)
    if (acu.accessPolicy?.isLocked) {
      throw new Error('ACU is public - no grants needed');
    }
    
    // Create grant payload
    const grantData = {
      acuId: input.acuId,
      grantorDid: this.localDid,
      granteeType: input.granteeType,
      granteeDid: input.granteeDid,
      circleId: input.circleId,
      ...input.permissions,
      validFrom: new Date().toISOString(),
      expiresAt: input.expiresAt?.toISOString(),
    };
    
    const signedPayload = JSON.stringify(grantData);
    const signature = await sign(signedPayload, this.privateKey);
    
    // Content-addressed ID
    const grantId = createHash('sha256')
      .update(signedPayload)
      .digest('hex');
    
    const grant = await this.prisma.accessGrant.create({
      data: {
        id: grantId,
        ...grantData,
        signature: Buffer.from(signature),
        signedPayload,
        isActive: true,
      }
    });
    
    // Update access policy
    await this.updateAccessPolicy(input.acuId, 'circles');
    
    // Queue for sync
    await this.queueGrantSync(grant, input.granteeDid || input.circleId!);
    
    return grant;
  }

  /**
   * Revoke a grant (only for non-public shares)
   */
  async revokeGrant(grantId: string): Promise<void> {
    const grant = await this.prisma.accessGrant.findUnique({
      where: { id: grantId },
      include: { acu: { include: { accessPolicy: true } } }
    });
    
    if (!grant) {
      throw new Error('Grant not found');
    }
    
    if (grant.grantorDid !== this.localDid) {
      throw new Error('Only grantor can revoke');
    }
    
    if (grant.acu.accessPolicy?.isLocked) {
      throw new Error('Cannot revoke - ACU is public');
    }
    
    // Create revocation signature
    const revocationPayload = JSON.stringify({
      grantId,
      revokedAt: new Date().toISOString(),
      revokerDid: this.localDid,
    });
    const revocationSig = await sign(revocationPayload, this.privateKey);
    
    await this.prisma.accessGrant.update({
      where: { id: grantId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revocationSig: Buffer.from(revocationSig),
      }
    });
    
    // Queue revocation sync
    await this.queueRevocationSync(grantId);
  }

  /**
   * Make ACU public - IRREVERSIBLE
   */
  async makePublic(acuId: string): Promise<PublicShare> {
    const acu = await this.prisma.atomicChatUnit.findUnique({
      where: { id: acuId },
      include: { accessPolicy: true, publicShare: true }
    });
    
    if (!acu || acu.authorDid !== this.localDid) {
      throw new Error('Cannot make public - not owner');
    }
    
    if (acu.publicShare) {
      throw new Error('Already public');
    }
    
    // Create the irrevocable public share proof
    const publicSharePayload = JSON.stringify({
      statement: `I, ${this.localDid}, hereby irrevocably share ACU ${acuId} publicly.`,
      acuId,
      authorDid: this.localDid,
      contentHash: acu.contentHash,
      sharedAt: new Date().toISOString(),
    });
    
    const signature = await sign(publicSharePayload, this.privateKey);
    
    // Transaction: create public share + lock policy
    const result = await this.prisma.$transaction(async (tx) => {
      const publicShare = await tx.publicShare.create({
        data: {
          acuId,
          authorDid: this.localDid,
          signature: Buffer.from(signature),
          signedPayload: publicSharePayload,
          contentHash: acu.contentHash,
          contentSnapshot: acu.content, // Store snapshot
          sharedAt: new Date(),
        }
      });
      
      // Lock the access policy
      await tx.accessPolicy.upsert({
        where: { acuId },
        update: {
          visibility: 'public',
          isLocked: true,
          lockedAt: new Date(),
          lockReason: 'made_public',
        },
        create: {
          acuId,
          visibility: 'public',
          isLocked: true,
          lockedAt: new Date(),
          lockReason: 'made_public',
        }
      });
      
      return publicShare;
    });
    
    // Broadcast to network
    await this.broadcastPublicShare(result);
    
    return result;
  }

  /**
   * Check if a peer has access to an ACU
   */
  async checkAccess(
    acuId: string, 
    requesterDid: string
  ): Promise<GrantPermissions | null> {
    // Check if public
    const publicShare = await this.prisma.publicShare.findUnique({
      where: { acuId }
    });
    
    if (publicShare) {
      return {
        canView: true,
        canAnnotate: true,
        canRemix: true,
        canReshare: true,
      };
    }
    
    // Check direct grant
    const directGrant = await this.prisma.accessGrant.findFirst({
      where: {
        acuId,
        granteeType: 'user',
        granteeDid: requesterDid,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    if (directGrant) {
      return {
        canView: directGrant.canView,
        canAnnotate: directGrant.canAnnotate,
        canRemix: directGrant.canRemix,
        canReshare: directGrant.canReshare,
      };
    }
    
    // Check circle grants
    const circleGrants = await this.prisma.accessGrant.findMany({
      where: {
        acuId,
        granteeType: 'circle',
        isActive: true,
        circle: {
          members: {
            some: {
              memberDid: requesterDid,
              status: 'active'
            }
          }
        }
      }
    });
    
    if (circleGrants.length > 0) {
      // Merge permissions (OR logic - most permissive wins)
      return circleGrants.reduce((acc, grant) => ({
        canView: acc.canView || grant.canView,
        canAnnotate: acc.canAnnotate || grant.canAnnotate,
        canRemix: acc.canRemix || grant.canRemix,
        canReshare: acc.canReshare || grant.canReshare,
      }), { canView: false, canAnnotate: false, canRemix: false, canReshare: false });
    }
    
    return null; // No access
  }

  private async updateAccessPolicy(acuId: string, visibility: Visibility) {
    await this.prisma.accessPolicy.upsert({
      where: { acuId },
      update: { visibility },
      create: { acuId, visibility }
    });
  }

  private async queueGrantSync(grant: AccessGrant, targetId: string) {
    // Implementation: add to SyncOutbox
  }

  private async queueRevocationSync(grantId: string) {
    // Implementation: broadcast revocation
  }

  private async broadcastPublicShare(share: PublicShare) {
    // Implementation: announce to all peers
  }
}
```

## Sync Protocol Implementation

```typescript
// lib/sync.ts

export class SyncManager {
  constructor(
    private prisma: PrismaClient,
    private localDid: string,
    private crypto: CryptoService
  ) {}

  /**
   * Process incoming sync message from a peer
   */
  async processInbound(message: SyncMessage): Promise<void> {
    // Verify signature
    const isValid = await this.crypto.verify(
      message.payload,
      message.signature,
      message.fromDid
    );
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    switch (message.type) {
      case 'access_grant':
        await this.processGrantSync(message);
        break;
      case 'acu_content':
        await this.processAcuSync(message);
        break;
      case 'revocation':
        await this.processRevocationSync(message);
        break;
      case 'public_share':
        await this.processPublicShareSync(message);
        break;
    }
  }

  private async processGrantSync(message: SyncMessage): Promise<void> {
    const grant = message.payload as AccessGrant;
    
    // Verify the grant signature
    const isValidGrant = await this.crypto.verify(
      grant.signedPayload,
      grant.signature,
      grant.grantorDid
    );
    
    if (!isValidGrant) {
      throw new Error('Invalid grant signature');
    }
    
    // Check if grant is for us
    if (grant.granteeType === 'user' && grant.granteeDid !== this.localDid) {
      return; // Not for us
    }
    
    if (grant.granteeType === 'circle') {
      const isMember = await this.prisma.circleMember.findFirst({
        where: {
          circleId: grant.circleId!,
          memberDid: this.localDid,
          status: 'active'
        }
      });
      if (!isMember) return; // Not a member
    }
    
    // Store the grant locally
    await this.prisma.accessGrant.upsert({
      where: { id: grant.id },
      update: grant,
      create: grant
    });
    
    // Request the ACU content
    await this.requestAcuContent(grant.acuId, grant.grantorDid);
  }

  private async processAcuSync(message: SyncMessage): Promise<void> {
    const acu = message.payload as ReceivedAcuPayload;
    
    // Verify content hash
    const computedHash = this.crypto.hash(acu.content);
    if (computedHash !== acu.contentHash) {
      throw new Error('Content hash mismatch');
    }
    
    // Verify author signature
    const isValidSignature = await this.crypto.verify(
      acu.contentHash,
      acu.signature,
      acu.authorDid
    );
    
    if (!isValidSignature) {
      throw new Error('Invalid ACU signature');
    }
    
    // Store as received content
    await this.prisma.receivedAcu.upsert({
      where: { id: acu.id },
      update: {
        lastAccessedAt: new Date(),
      },
      create: {
        id: acu.id,
        authorDid: acu.authorDid,
        signature: acu.signature,
        contentHash: acu.contentHash,
        content: acu.content,
        type: acu.type,
        category: acu.category,
        language: acu.language,
        embedding: acu.embedding,
        embeddingModel: acu.embeddingModel,
        originalProvider: acu.provider,
        originalModel: acu.model,
        originalTimestamp: acu.sourceTimestamp,
        accessGrantId: acu.grantId,
        accessType: acu.accessType,
        receivedFrom: message.fromDid,
      }
    });
  }

  private async processPublicShareSync(message: SyncMessage): Promise<void> {
    const publicShare = message.payload as PublicShare;
    
    // Verify the public share signature
    const isValid = await this.crypto.verify(
      publicShare.signedPayload,
      publicShare.signature,
      publicShare.authorDid
    );
    
    if (!isValid) {
      throw new Error('Invalid public share signature');
    }
    
    // Store locally
    await this.prisma.publicShare.upsert({
      where: { acuId: publicShare.acuId },
      update: {},
      create: publicShare
    });
    
    // Add ourselves as witness
    await this.witnessPublicShare(publicShare);
    
    // Request the content
    await this.requestAcuContent(publicShare.acuId, publicShare.authorDid);
  }

  private async witnessPublicShare(share: PublicShare): Promise<void> {
    const witnessPayload = JSON.stringify({
      publicShareId: share.id,
      witnessDid: this.localDid,
      witnessedAt: new Date().toISOString(),
      contentHashVerified: share.contentHash,
    });
    
    const signature = await this.crypto.sign(witnessPayload);
    
    await this.prisma.publicShareWitness.create({
      data: {
        publicShareId: share.id,
        witnessDid: this.localDid,
        signature: Buffer.from(signature),
      }
    });
  }

  private async requestAcuContent(acuId: string, fromDid: string): Promise<void> {
    // Add to outbox
    await this.prisma.syncOutbox.create({
      data: {
        targetDid: fromDid,
        payloadType: 'content_request',
        payload: Buffer.from(JSON.stringify({ acuId })),
        signature: await this.crypto.sign(acuId),
      }
    });
  }
}
```

## Key Design Decisions Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Local Storage** | Full PostgreSQL per device | Enables complex queries, full SQL power, works offline |
| **Content Identity** | Content-addressed (hash-based IDs) | Deduplication, integrity verification, immutability |
| **Signatures** | Ed25519 on all shared content | Lightweight, fast, proven security |
| **Access Control** | Signed grants | Verifiable, portable, works offline |
| **Public Shares** | Immutable with witnesses | Cannot be revoked, decentralized verification |
| **Sync** | Append-only log + vector clocks | Conflict resolution, resumable sync |
| **Server Role** | Optional relay only | NAT traversal, offline message queue, discovery |

This design gives you:
- ✅ Full local-first operation
- ✅ Fine-grained, cryptographically-verifiable access control  
- ✅ Immutable public sharing
- ✅ P2P sync with minimal server dependency
- ✅ Works offline with eventual consistency
