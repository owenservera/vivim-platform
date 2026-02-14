# VIVIM Database: Raw Prisma Schema

This file contains the absolute technical definition of the database structure as of February 10, 2026.

```prisma
// OpenScroll Extended Prisma Schema
// Combines current extraction schema with blueprint ACU/P2P features
// Database: PostgreSQL
// Runtime: Bun

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
}

// ============================================================================
// EXISTING TABLES (Source Layer)
// ============================================================================

model Conversation {
  id          String   @id @default(uuid())
  provider    String
  sourceUrl   String   @unique
  title       String   @db.Text
  model       String?
  createdAt   DateTime @db.Timestamptz
  updatedAt   DateTime @db.Timestamptz
  capturedAt  DateTime @default(now()) @db.Timestamptz
  
  messageCount      Int @default(0)
  userMessageCount  Int @default(0)
  aiMessageCount    Int @default(0)
  totalWords        Int @default(0)
  totalCharacters   Int @default(0)
  totalTokens       Int?
  totalCodeBlocks      Int @default(0)
  totalImages          Int @default(0)
  totalTables          Int @default(0)
  totalLatexBlocks     Int @default(0)
  totalMermaidDiagrams Int @default(0)
  totalToolCalls       Int @default(0)
  
  messages    Message[]
  acus        AtomicChatUnit[]
  metadata    Json @default("{}")
  ownerId     String?
  owner       User? @relation(fields: [ownerId], references: [id])
  
  @@index([provider])
  @@index([capturedAt(sort: Desc)])
  @@index([provider, capturedAt(sort: Desc)])
  @@index([sourceUrl])
  @@index([createdAt(sort: Desc)])
  @@index([ownerId])
  @@map("conversations")
}

model Message {
  id              String   @id @default(uuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role            String
  author          String?
  parts           Json
  createdAt       DateTime @db.Timestamptz
  messageIndex    Int
  status          String   @default("completed")
  finishReason    String?
  tokenCount      Int?
  metadata        Json @default("{}")
  acus            AtomicChatUnit[]
  
  @@index([conversationId, messageIndex])
  @@index([conversationId, createdAt])
  @@index([role])
  @@map("messages")
}

model CaptureAttempt {
  id          String   @id @default(uuid())
  sourceUrl   String
  provider    String?
  status      String
  errorCode   String?
  errorMessage String? @db.Text
  errorStack  String? @db.Text
  startedAt   DateTime @db.Timestamptz
  completedAt DateTime? @db.Timestamptz
  duration    Int?
  ipAddress   String?
  userAgent   String?  @db.Text
  conversationId String?
  retryCount  Int @default(0)
  retryOf     String?
  createdAt   DateTime @default(now()) @db.Timestamptz
  
  @@index([sourceUrl])
  @@index([status])
  @@index([createdAt(sort: Desc)])
  @@index([ipAddress, createdAt(sort: Desc)])
  @@index([conversationId])
  @@map("capture_attempts")
}

model ProviderStats {
  id              String   @id @default(uuid())
  provider        String   @unique
  totalCaptures      Int @default(0)
  successfulCaptures Int @default(0)
  failedCaptures     Int @default(0)
  avgDuration        Float?
  avgMessageCount    Float?
  avgTokenCount      Float?
  totalMessages      Int @default(0)
  totalCodeBlocks    Int @default(0)
  totalImages        Int @default(0)
  totalToolCalls     Int @default(0)
  lastCaptureAt   DateTime? @db.Timestamptz
  updatedAt       DateTime @updatedAt @db.Timestamptz
  
  @@map("provider_stats")
}

// ============================================================================
// IDENTITY & USER MANAGEMENT
// ============================================================================

model User {
  id          String   @id @default(uuid())
  did         String   @unique
  displayName String?
  email       String?  @unique
  avatarUrl   String?
  publicKey   String   @db.Text
  encryptedPrivateKey String? @db.Text
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz
  lastSeenAt  DateTime @default(now()) @db.Timestamptz
  
  devices         Device[]
  conversations   Conversation[]
  acus            AtomicChatUnit[]
  circlesOwned    Circle[] @relation("CircleOwner")
  circleMemberships CircleMember[]
  settings    Json @default("{}")
  
  @@index([did])
  @@index([email])
  @@map("users")
}

model Device {
  id          String   @id @default(uuid())
  userId      String
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  deviceId    String   @unique
  deviceName  String
  deviceType  String
  platform    String
  fingerprint String?  @db.Text
  publicKey   String   @db.Text
  isActive    Boolean  @default(true)
  isTrusted   Boolean  @default(false)
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz
  lastSeenAt  DateTime @default(now()) @db.Timestamptz
  metadata    Json @default("{}")
  
  @@index([userId])
  @@index([deviceId])
  @@index([userId, isActive])
  @@map("devices")
}

// ============================================================================
// ATOMIC CHAT UNITS (ACUs)
// ============================================================================

model AtomicChatUnit {
  id          String   @id
  authorDid   String
  author      User @relation(fields: [authorDid], references: [did])
  signature   Bytes
  content     String   @db.Text
  language    String?
  type        String
  category    String
  embedding   Float[]
  embeddingModel String?
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  messageId      String
  message        Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  messageIndex   Int
  provider       String
  model          String?
  sourceTimestamp DateTime @db.Timestamptz
  extractorVersion String?
  parserVersion    String?
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
  
  @@index([conversationId])
  @@index([messageId])
  @@index([authorDid])
  @@index([type])
  @@index([category])
  @@index([qualityOverall(sort: Desc)])
  @@index([rediscoveryScore(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@index([sharingPolicy])
  @@map("atomic_chat_units")
}

model AcuLink {
  id          String   @id @default(uuid())
  sourceId    String
  source      AtomicChatUnit @relation("SourceAcu", fields: [sourceId], references: [id], onDelete: Cascade)
  targetId    String
  target      AtomicChatUnit @relation("TargetAcu", fields: [targetId], references: [id], onDelete: Cascade)
  relation    String
  weight      Float    @default(1.0)
  createdAt   DateTime @default(now()) @db.Timestamptz
  metadata    Json @default("{}")
  
  @@unique([sourceId, targetId, relation])
  @@index([sourceId])
  @@index([targetId])
  @@index([relation])
  @@map("acu_links")
}

// ============================================================================
// SHARING & CIRCLES
// ============================================================================

model Circle {
  id          String   @id @default(uuid())
  ownerId     String
  owner       User @relation("CircleOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  name        String
  description String?  @db.Text
  isPublic    Boolean  @default(false)
  members     CircleMember[]
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz
  metadata    Json @default("{}")
  
  @@index([ownerId])
  @@index([isPublic])
  @@map("circles")
}

model CircleMember {
  id          String   @id @default(uuid())
  circleId    String
  circle      Circle @relation(fields: [circleId], references: [id], onDelete: Cascade)
  userId      String
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        String   @default("member")
  canInvite   Boolean  @default(false)
  canShare    Boolean  @default(true)
  joinedAt    DateTime @default(now()) @db.Timestamptz
  
  @@unique([circleId, userId])
  @@index([circleId])
  @@index([userId])
  @@map("circle_members")
}

// ============================================================================
// RECIPROCITY TRACKING
// ============================================================================

model Contribution {
  id             String   @id @default(uuid())
  contributorDid String
  acuId          String
  recipientDids  String[]
  quality        Float    @default(1.0)
  timestamp      DateTime @default(now()) @db.Timestamptz
  metadata       Json @default("{}")
  
  @@index([contributorDid])
  @@index([acuId])
  @@index([timestamp(sort: Desc)])
  @@map("contributions")
}

model Consumption {
  id          String   @id @default(uuid())
  consumerDid String
  acuId       String
  providerDid String
  timestamp   DateTime @default(now()) @db.Timestamptz
  metadata    Json @default("{}")
  
  @@index([consumerDid])
  @@index([acuId])
  @@index([providerDid])
  @@index([timestamp(sort: Desc)])
  @@map("consumptions")
}
```
