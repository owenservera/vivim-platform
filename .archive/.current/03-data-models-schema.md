# DOCUMENT 3: DATA MODELS & SCHEMA

## Core Data Entities

---

## User Model

```prisma
model User {
  // Identity
  id                  String    @id @default(uuid())
  did                 String    @unique        // Decentralized Identifier
  handle              String?   @unique        // Human-readable username
  displayName         String?
  email               String?   @unique
  emailVerified       Boolean   @default(false)
  phoneNumber         String?
  phoneVerified       Boolean   @default(false)
  avatarUrl           String?
  
  // Identity verification
  verificationLevel   Int       @default(0)
  verificationBadges  Json      @default("[]")
  trustScore          Float     @default(50)
  
  // Cryptographic keys
  publicKey           String
  keyType             String    @default("Ed25519")
  
  // Account status
  status              AccountStatus @default(ACTIVE)  // ACTIVE, SUSPENDED, BANNED, DELETING, DELETED
  deletedAt           DateTime?
  deletionRequestedAt DateTime?
  suspendedAt         DateTime?
  suspensionReason    String?
  bannedAt            DateTime?
  banReason           String?
  
  // Security & MFA
  mfaEnabled          Boolean   @default(false)
  mfaSecret           String?
  backupCodes         String[]  @default([])
  
  // Federated hosting (Bluesky-style)
  pdsUrl              String?
  
  // Timestamps
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  lastSeenAt          DateTime  @default(now())
  
  // Settings
  settings            Json      @default("{}")
  privacyPreferences  Json      @default("{}")
  
  // Relations
  conversations       Conversation[]
  acus                AtomicChatUnit[]
  circlesOwned        Circle[]           @relation("CircleOwner")
  circleMemberships   CircleMember[]
  memories            Memory[]
  notebooks           Notebook[]
  topicProfiles       TopicProfile[]
  entityProfiles      EntityProfile[]
  aiPersonas          AiPersona[]
  
  @@index([did])
  @@index([email])
}
```

**Key Constraints**:
- `did` is the primary decentralized identifier
- `handle` must be unique
- Email optional but must be unique if provided

---

## Conversation Model

```prisma
model Conversation {
  id                String    @id @default(uuid())
  provider          String    // e.g., "openai", "anthropic"
  sourceUrl         String    @unique  // Original conversation URL
  contentHash       String?   // For deduplication
  version           Int       @default(1)
  title             String?
  model             String?
  state             String    @default("ACTIVE")
  
  // Stats
  messageCount      Int       @default(0)
  userMessageCount  Int       @default(0)
  aiMessageCount   Int       @default(0)
  totalWords        Int       @default(0)
  totalCharacters   Int       @default(0)
  totalTokens       Int?
  totalCodeBlocks   Int       @default(0)
  totalImages       Int       @default(0)
  totalTables       Int       @default(0)
  totalLatexBlocks  Int       @default(0)
  totalMermaidDiagrams Int    @default(0)
  totalToolCalls    Int       @default(0)
  
  // Metadata
  metadata          Json      @default("{}")
  tags              String[]
  
  // Ownership
  ownerId           String?
  owner             User?     @relation(fields: [ownerId], references: [id])
  
  // Timestamps
  createdAt         DateTime
  updatedAt         DateTime  @updatedAt
  capturedAt        DateTime  @default(now())
  
  // Relations
  messages          Message[]
  acus              AtomicChatUnit[]
  contextBundles    ContextBundle[]
  
  @@index([provider])
  @@index([capturedAt(sort: Desc)])
  @@index([sourceUrl])
  @@index([ownerId])
}
```

**Key Constraints**:
- `sourceUrl` must be unique - prevents duplicate captures

---

## Atomic Chat Unit (ACU) Model

```prisma
model AtomicChatUnit {
  // Identification
  id                String    @id
  authorDid         String    // Author's DID
  signature         Bytes     // Cryptographic signature
  
  // Content
  content           String
  contentHash       String?
  version           Int       @default(1)
  language          String?
  type              String    // e.g., "text", "code", "explanation"
  category          String?
  origin            String    @default("extraction")  // extraction, generation, fork
  contentType       String    @default("text")
  
  // Embeddings
  embedding         Float[]
  embeddingModel    String?
  
  // Provenance
  conversationId    String?
  messageId         String?
  messageIndex      Int?
  provider          String?
  model             String?
  sourceTimestamp   DateTime?
  parentId          String?   // For forks/derivations
  extractorVersion  String?
  parserVersion     String?
  
  // State
  state             String    @default("ACTIVE")
  securityLevel     Int       @default(0)
  isPersonal        Boolean   @default(false)
  level             Int       @default(4)  // Quality level
  
  // Quality metrics
  qualityOverall    Float?
  contentRichness   Float?
  structuralIntegrity Float?
  uniqueness        Float?
  
  // Engagement
  viewCount         Int       @default(0)
  shareCount        Int       @default(0)
  quoteCount        Int       @default(0)
  rediscoveryScore  Float?
  
  // Sharing
  sharingPolicy     String    @default("self")  // self, circle, public
  sharingCircles   String[]
  canView          Boolean   @default(true)
  canAnnotate      Boolean   @default(false)
  canRemix         Boolean   @default(false)
  canReshare       Boolean   @default(false)
  expiresAt        DateTime?
  
  // Metadata
  tags              String[]
  metadata         Json      @default("{}")
  
  // Timestamps
  createdAt         DateTime  @default(now())
  indexedAt         DateTime  @default(now())
  
  // Relations
  author            User      @relation(fields: [authorDid], references: [did])
  conversation      Conversation? @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  message           Message?  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  parent            AtomicChatUnit? @relation("AcuDerivations", fields: [parentId], references: [id])
  derivations       AtomicChatUnit[] @relation("AcuDerivations")
  
  @@index([authorDid])
  @@index([parentId])
  @@index([conversationId])
  @@index([type])
  @@index([category])
  @@index([qualityOverall(sort: Desc)])
  @@index([rediscoveryScore(sort: Desc)])
  @@index([createdAt(sort: Desc)])
}
```

**Key Constraints**:
- `id` is the primary key (not auto-incrementing)
- `parentId` creates fork/derivation relationship
- Cryptographic signature ensures authenticity

---

## Thread / Fork Entity

ACUs already support threading via the parent/derivation relationship:

```prisma
// From AtomicChatUnit model above:
parentId            String?   // Points to parent ACU
parent              AtomicChatUnit? @relation("AcuDerivations", fields: [parentId], references: [id])
derivations         AtomicChatUnit[] @relation("AcuDerivations")
```

For additional graph-like connections:

```prisma
model AcuLink {
  id           String         @id @default(uuid())
  sourceId     String         // Source ACU ID
  targetId     String         // Target ACU ID
  relation     String         // Type: "reply_to", "references", "continues", etc.
  weight       Float          @default(1.0)
  createdByDid String?
  createdAt    DateTime       @default(now())
  metadata     Json           @default("{}")
  
  source       AtomicChatUnit @relation("SourceAcu", fields: [sourceId], references: [id], onDelete: Cascade)
  target       AtomicChatUnit @relation("TargetAcu", fields: [targetId], references: [id], onDelete: Cascade)
  
  @@unique([sourceId, targetId, relation])
}
```

---

## Share / Permission Records

### SharingIntent Model
```prisma
model SharingIntent {
  id              String         @id @default(uuid())
  version         Int            @default(1)
  intentType      IntentType     @default(SHARE)  // SHARE, PUBLISH, EMBED, FORK
  actorDid        String
  contentType     ContentType      // CONVERSATION, ACU, COLLECTION, NOTEBOOK, MEMORY
  contentIds      String[]
  contentScope    ContentScope   @default(FULL)  // FULL, PARTIAL, SUMMARY, PREVIEW
  includeACUs     String[]
  excludeACUs     String[]
  audienceType    AudienceType    // PUBLIC, CIRCLE, USERS, LINK
  circleIds       String[]
  userDids        String[]
  linkId          String?        @unique
  permissions     Json
  schedule        Json?
  transformations Json?
  metadata        Json?
  policy          Json?
  status          IntentStatus   @default(DRAFT)  // DRAFT, PENDING, VALIDATED, ACTIVE, EXPIRED, REVOKED, CANCELLED, ARCHIVED
  
  // Timestamps
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  publishedAt     DateTime?
  expiresAt       DateTime?
  revokedAt       DateTime?
  revokedReason   String?
  
  // Ownership
  ownerDid        String
  coOwners        Json?
  
  // Relations
  contentRecords  ContentRecord[]
  accessGrants   ContentAccessGrant[]
  accessLogs     ContentAccessLog[]
  shareLinks     ShareLink[]
}
```

### ShareLink Model
```prisma
model ShareLink {
  id              String         @id @default(uuid())
  linkCode        String         @unique @default(uuid())
  intentId        String         @unique
  maxUses         Int?           // Optional usage limit
  usesCount       Int            @default(0)
  expiresAt       DateTime?
  passwordHash    String?        // Optional password protection
  createdByDid    String
  isActive        Boolean        @default(true)
  createdAt       DateTime       @default(now())
  lastUsedAt      DateTime?
  
  intent          SharingIntent  @relation(fields: [intentId], references: [id], onDelete: Cascade)
}
```

### ContentAccessGrant Model
```prisma
model ContentAccessGrant {
  id              String    @id @default(uuid())
  policyId        String
  grantedTo       String    // User DID or entity
  grantedToType   String    @default("user")
  grantedBy       String
  accessLevel     String    @default("view")  // view, annotate, remix, etc.
  permissions     Json?
  
  // Temporal
  grantedAt       DateTime  @default(now())
  expiresAt       DateTime?
  viewsUsed       Int       @default(0)
  maxViews        Int?
  lastAccessedAt  DateTime?
  status          String    @default("active")
}
```

---

## Context Engine State

### UserContextSettings
```prisma
model UserContextSettings {
  id                        String   @id @default(uuid())
  userId                    String   @unique
  
  // Budget
  maxContextTokens          Int      @default(12000)
  
  // Behavior
  responseStyle             String    @default("balanced")  // balanced, concise, detailed
  memoryThreshold          String    @default("moderate")
  focusMode                String    @default("balanced")
  compressionStrategy      String    @default("auto")
  predictionAggressiveness String    @default("balanced")
  
  // Layer overrides
  layerBudgetOverrides      Json     @default("{}")
  elasticityOverrides       Json     @default("{}")
  customBudgetFormulas      Json     @default("{}")
  
  // Feature flags
  enablePredictions         Boolean  @default(true)
  enableJitRetrieval        Boolean  @default(true)
  enableCompression         Boolean  @default(true)
  enableEntityContext       Boolean  @default(true)
  enableTopicContext        Boolean  @default(true)
  prioritizeLatency         Boolean  @default(false)
  cacheAggressively        Boolean  @default(true)
  
  // Thresholds
  topicSimilarityThreshold  Float    @default(0.35)
  entitySimilarityThreshold Float    @default(0.40)
  acuSimilarityThreshold    Float    @default(0.35)
  memorySimilarityThreshold Float    @default(0.40)
  
  // Exclusions
  excludedTopicSlugs        String[] @default([])
  excludedEntityIds         String[] @default([])
  excludedMemoryIds         String[] @default([])
  excludedConversationIds   String[] @default([])
  
  // TTL
  ttlMultipliers           Json     @default("{}")
  enabledSignals           Json     @default("{}")
  
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
  
  user                     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### TopicProfile
```prisma
model TopicProfile {
  id                 String   @id @default(uuid())
  userId             String
  slug               String   // URL-safe identifier
  label              String   // Display name
  aliases            String[]
  parentSlug         String?
  domain             String   // e.g., "programming", "finance"
  
  // Stats
  totalConversations Int     @default(0)
  totalAcus          Int     @default(0)
  totalMessages      Int     @default(0)
  totalTokensSpent   Int     @default(0)
  avgSessionDepth    Float   @default(0)
  
  // Engagement
  firstEngagedAt     DateTime
  lastEngagedAt      DateTime
  engagementStreak   Int      @default(0)
  peakHour           Int?
  
  // Proficiency
  proficiencyLevel   String   @default("unknown")  // unknown, beginner, intermediate, advanced, expert
  proficiencySignals Json     @default("[]")
  importanceScore    Float    @default(0.5)
  
  // Compiled context
  compiledContext    String?
  compiledAt        DateTime?
  compiledTokenCount Int?
  contextVersion    Int      @default(0)
  isDirty           Boolean  @default(true)
  
  // Embeddings
  embedding          Float[]
  embeddingModel     String?
  
  // Relations
  relatedMemoryIds   String[]
  relatedAcuIds      String[]
  contextBundles     ContextBundle[]
  conversations      TopicConversation[]
  
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, slug])
  @@index([userId, importanceScore(sort: Desc)])
}
```

### ContextBundle
```prisma
model ContextBundle {
  id              String    @id @default(uuid())
  userId          String
  bundleType      BundleType  // identity_core, global_prefs, topic, entity, conversation, composite
  
  // Source references
  topicProfileId  String?
  entityProfileId String?
  conversationId  String?
  personaId       String?
  
  // Compiled content
  compiledPrompt  String
  tokenCount      Int
  composition     Json     @default("{}")  // What went into this bundle
  version         Int      @default(1)
  isDirty         Boolean  @default(false)
  priority        Float    @default(0.5)
  
  // Usage
  compiledAt      DateTime @default(now())
  expiresAt       DateTime?
  lastUsedAt      DateTime @default(now())
  useCount        Int      @default(0)
  hitCount        Int      @default(0)
  missCount       Int      @default(0)
  
  // Relations
  conversation    Conversation?  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  entityProfile   EntityProfile? @relation("EntityBundles", fields: [entityProfileId], references: [id], onDelete: Cascade)
  persona         AiPersona?    @relation(fields: [personaId], references: [id], onDelete: Cascade)
  topicProfile    TopicProfile? @relation("TopicBundles", fields: [topicProfileId], references: [id], onDelete: Cascade)
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, bundleType, topicProfileId, entityProfileId, conversationId, personaId])
  @@index([userId, priority(sort: Desc)])
}
```

---

## Additional First-Class Entities

### Circle (Social Grouping)
```prisma
model Circle {
  id          String         @id @default(uuid())
  ownerId     String
  name        String
  description String?
  isPublic    Boolean       @default(false)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  metadata    Json          @default("{}")
  
  members     CircleMember[]
  owner       User          @relation("CircleOwner", fields: [ownerId], references: [id], onDelete: Cascade)
}

model CircleMember {
  id        String   @id @default(uuid())
  circleId  String
  userId    String
  role      String   @default("member")
  canInvite Boolean  @default(false)
  canShare  Boolean  @default(true)
  joinedAt  DateTime @default(now())
  
  circle    Circle   @relation(fields: [circleId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([circleId, userId])
}
```

### Memory Model
```prisma
model Memory {
  // Core
  id             String   @id @default(uuid())
  userId         String
  content        String
  summary        String?
  
  // Provenance
  provenanceId   String?
  provider       String?    // openai, anthropic, google, grok, deepseek, kimi, qwen, zai, mistral
  sourceUrl      String?
  sourceType     String     @default("conversation")  // conversation, manual, import, extraction, legacy
  sourcePlatform String?
  
  // Lineage
  lineageDepth   Int       @default(0)
  lineageParentId String?
  version        Int       @default(1)
  contentVersion Int       @default(1)
  
  // Verification
  isVerified     Boolean   @default(false)
  verifiedAt     DateTime?
  
  // Categorization
  memoryType     MemoryType  // EPISODIC, SEMANTIC, PROCEDURAL, FACTUAL, PREFERENCE, IDENTITY, RELATIONSHIP, GOAL, PROJECT, CUSTOM
  category       String
  subcategory    String?
  tags           String[]  @default([])
  
  // Importance
  importance     Float     @default(0.5)  // 0.0-1.0
  relevance      Float     @default(0.5)
  accessCount    Int       @default(0)
  lastAccessedAt DateTime?
  
  // Relationships
  parentMemoryId String?
  childMemoryIds String[] @default([])
  relatedMemoryIds String[] @default([])
  
  // Status
  isActive       Boolean   @default(true)
  isPinned       Boolean   @default(false)
  isArchived     Boolean   @default(false)
  
  // Embeddings
  embedding       Float[]
  embeddingModel  String?
  
  // Consolidation
  consolidationStatus MemoryConsolidationStatus @default(RAW)
  consolidationScore  Float?
  lastConsolidatedAt  DateTime?
  
  // Temporal
  occurredAt     DateTime?
  validFrom      DateTime?
  validUntil     DateTime?
  
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, memoryType])
  @@index([userId, importance(sort: Desc)])
  @@index([userId, relevance(sort: Desc)])
}
```

---

## Key Relationships Diagram

```
User
├── Conversation (1:N)
│   └── Message (1:N)
│       └── AtomicChatUnit (1:N)
├── AtomicChatUnit (1:N) - authored
│   └── parent/derivation (self-ref)
├── Circle (ownership 1:N, membership N:N)
├── Group (ownership 1:N, membership N:N)
├── Team (ownership 1:N, membership N:N)
├── Memory (1:N)
├── Notebook (1:N)
│   └── NotebookEntry (1:N)
│       └── AtomicChatUnit (N:1)
├── TopicProfile (1:N)
│   └── ContextBundle (1:N)
├── EntityProfile (1:N)
│   └── ContextBundle (1:N)
├── AiPersona (1:N)
│   └── ContextBundle (1:N)
├── ContextBundle (1:N)
├── UserContextSettings (1:1)
├── SharingIntent (1:N)
│   ├── ShareLink (1:N)
│   └── ContentAccessGrant (1:N)
└── CircleMember (1:N)
```
