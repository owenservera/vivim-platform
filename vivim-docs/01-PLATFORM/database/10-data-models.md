# VIVIM Data Models & Schemas

## Overview

This document provides the key data models, TypeScript interfaces, and database schemas needed to create accurate mock data for demos and visualizations.

---

## Core Entities

### User

```typescript
interface User {
  id: string;                    // UUID
  did: string;                   // Decentralized Identifier
  email?: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Profile
  profile?: UserProfile;
  
  // Security
  encryptionKeyId?: string;
  mfaEnabled: boolean;
  
  // Limits
  plan: 'free' | 'pro' | 'enterprise';
  storageUsed: number;
  storageLimit: number;
}

interface UserProfile {
  bio?: string;
  role?: string;
  company?: string;
  avatar?: string;
  preferences: UserPreferences;
}

interface UserPreferences {
  defaultProvider?: string;
  contextDepth: 'minimal' | 'standard' | 'deep';
  theme: 'light' | 'dark' | 'system';
  language: string;
}
```

---

### Conversation

```typescript
interface Conversation {
  id: string;                    // UUID
  userId: string;
  
  // Source
  provider: Provider;            // 'openai' | 'anthropic' | 'gemini' | ...
  providerConversationId: string; // ID from provider
  
  // Metadata
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  
  // Statistics
  messageCount: number;
  acuCount: number;
  tokenCount: number;
  
  // Status
  archived: boolean;
  starred: boolean;
  tags: string[];
}

type Provider = 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'grok' | 'mistral' | 'cohere' | 'llama' | 'local';
```

---

### Message

```typescript
interface Message {
  id: string;
  conversationId: string;
  
  // Content
  role: 'system' | 'user' | 'assistant';
  content: string;
  
  // Provider
  provider: Provider;
  model: string;
  
  // Metadata
  tokens: number;
  createdAt: Date;
  
  // Processing
  acuExtracted: boolean;
  embeddingGenerated: boolean;
}
```

---

### ACU (Atomic Chat Unit)

```typescript
interface ACU {
  // Identity & Integrity
  id: string;                    // SHA-256(content + parent_hash)
  signature: string;             // Ed25519 signature
  
  // Provenance
  authorDid: string;             // Decentralized ID
  originMessageId: string;
  originConversationId: string;
  timestamp: number;
  
  // Content
  content: string;
  contentType: 'text' | 'code' | 'image' | 'structured';
  language?: string;             // For code
  
  // Semantic
  type: ACUType;
  embedding?: number[];          // 384-dim vector
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

type ACUType = 
  | 'statement' 
  | 'question' 
  | 'answer' 
  | 'code_snippet' 
  | 'reasoning' 
  | 'decision' 
  | 'reference';

interface ACURelationship {
  id: string;
  sourceAcuId: string;
  targetAcuId: string;
  relationship: 'next' | 'child_of' | 'relates_to' | 'cites' | 'follows_up' | 'explains' | 'contradicts';
}
```

---

### Context Layers

```typescript
interface ContextBundle {
  // All 8 layers assembled
  layers: {
    L0: LayerL0;   // VIVIM Identity
    L1: LayerL1;   // User Identity
    L2: LayerL2;   // Preferences
    L3: LayerL3;   // Topic Context
    L4: LayerL4;   // Entity Context
    L5: LayerL5;   // Conversation Context
    L6: LayerL6;   // JIT Knowledge
    L7: LayerL7;   // Message History
  };
  
  // Budget
  totalTokens: number;
  budget: number;
}

interface LayerL0 {
  identity: string;
  version: string;
}

interface LayerL1 {
  facts: UserFact[];
  bio: string;
  role: string;
}

interface LayerL2 {
  instructions: string;
  preferences: Preference[];
}

interface LayerL3 {
  topics: TopicContext[];
}

interface LayerL4 {
  entities: EntityContext[];
}

interface LayerL5 {
  summary: string;
  keyPoints: string[];
}

interface LayerL6 {
  acuIds: string[];
  sources: string[];
}

interface LayerL7 {
  messages: Message[];
  compression: 'full' | 'summary' | 'truncated';
}
```

---

### Memory

```typescript
interface Memory {
  id: string;
  userId: string;
  
  // Content
  content: string;
  type: MemoryType;
  
  // Semantic
  embedding?: number[];
  
  // Metadata
  importance: number;            // 0-1
  accessCount: number;
  lastAccessedAt: Date;
  
  // Relationships
  relatedAcuIds: string[];
  relatedMemoryIds: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

type MemoryType = 
  | 'fact' 
  | 'preference' 
  | 'goal' 
  | 'relationship' 
  | 'experience'
  | 'learning';
```

---

### Circle (Social)

```typescript
interface Circle {
  id: string;
  name: string;
  description?: string;
  
  // Owner
  ownerId: string;
  
  // Privacy
  type: 'private' | 'public' | 'invite_only';
  
  // Members
  memberCount: number;
  
  // Content
  sharedAcuIds: string[];
  sharedConversationIds: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

interface CircleMember {
  circleId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}
```

---

### Topic

```typescript
interface Topic {
  id: string;
  userId: string;
  
  // Identity
  name: string;                  // 'react', 'startup-funding'
  slug: string;                 // 'react', 'startup-funding'
  
  // Metadata
  description?: string;
  icon?: string;
  
  // Statistics
  conversationCount: number;
  acuCount: number;
  
  // Profile
  profile?: TopicProfile;
  
  createdAt: Date;
  updatedAt: Date;
}

interface TopicProfile {
  summary: string;
  keyConcepts: string[];
  expertiseLevel: 'beginner' | 'intermediate' | 'expert';
  lastDiscussedAt?: Date;
}
```

---

## Database Schema (Prisma)

### Key Tables

```prisma
// User
model User {
  id            String   @id @default(uuid())
  did           String   @unique
  email         String?
  username      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  conversations Conversation[]
  acus          ACU[]
  memories      Memory[]
  circles       Circle[]
  topics        Topic[]
}

// Conversation
model Conversation {
  id                    String   @id @default(uuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id])
  
  provider              String
  providerConversationId String?
  title                String
  model                String
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  lastMessageAt        DateTime @default(now())
  
  messageCount         Int      @default(0)
  acuCount            Int      @default(0)
  tokenCount          Int      @default(0)
  
  archived             Boolean  @default(false)
  starred              Boolean  @default(false)
  tags                 String[]
  
  messages             Message[]
  acus                 ACU[]
}

// ACU
model ACU {
  id                    String   @id // SHA-256 hash
  signature             String
  
  authorDid             String
  originMessageId       String
  originConversationId  String
  conversation          Conversation @relation(fields: [originConversationId], references: [id])
  
  content               String   @db.Text
  contentType           String
  language              String?
  
  type                  String
  embedding             Float[]  // For vector search
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  relationshipsFrom     ACURelationship[] @relation("FromACU")
  relationshipsTo      ACURelationship[] @relation("ToACU")
  topics               ACUTopic[]
}

model ACURelationship {
  id             String @id @default(uuid())
  sourceAcuId    String
  sourceAcu      ACU   @relation("FromACU", fields: [sourceAcuId], references: [id])
  targetAcuId    String
  targetAcu      ACU   @relation("ToACU", fields: [targetAcuId], references: [id])
  relationship   String
  
  @@unique([sourceAcuId, targetAcuId, relationship])
}

// Context Layer
model ContextLayer {
  id          String   @id @default(uuid())
  userId      String
  conversationId String?
  
  layer       String   // L0-L7
  content     String   @db.Text
  tokens      Int
  priority    Int
  
  createdAt   DateTime @default(now())
  expiresAt   DateTime?
}

// Circle
model Circle {
  id          String   @id @default(uuid())
  name        String
  description String?
  
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  
  type        String   // private, public, invite_only
  memberCount Int     @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  members     CircleMember[]
  sharedAcus  SharedACU[]
}
```

---

## Mock Data for Demos

### Example Seed Data

```typescript
// Demo user
const demoUser = {
  id: 'demo-user-123',
  did: 'did:vivim:demo123',
  username: 'alexchen',
  email: 'alex@example.com',
  plan: 'pro',
  profile: {
    role: 'Senior Software Engineer',
    company: 'Acme Startup',
    bio: 'Building the future of AI',
    preferences: {
      defaultProvider: 'openai',
      contextDepth: 'deep',
      theme: 'dark'
    }
  }
};

// Demo conversations (320 total)
const conversations = Array.from({ length: 320 }, (_, i) => ({
  id: `conv-${i}`,
  provider: ['openai', 'anthropic', 'gemini'][i % 3],
  title: `Conversation ${i + 1}`,
  model: 'gpt-4',
  messageCount: Math.floor(Math.random() * 20) + 5,
  acuCount: Math.floor(Math.random() * 50) + 10,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
}));

// Demo topics
const topics = [
  { name: 'React', slug: 'react', conversationCount: 85, acuCount: 450 },
  { name: 'TypeScript', slug: 'typescript', conversationCount: 72, acuCount: 380 },
  { name: 'Architecture', slug: 'architecture', conversationCount: 45, acuCount: 290 },
  { name: 'PostgreSQL', slug: 'postgres', conversationCount: 38, acuCount: 210 },
  { name: 'System Design', slug: 'system_design', conversationCount: 42, acuCount: 180 }
];
```

---

## API Response Formats

### Search Response

```typescript
interface SearchResponse {
  results: ACU[];
  total: number;
  query: string;
  took: number;  // ms
  highlights: {
    [acuId: string]: {
      field: string;
      fragments: string[];
    }
  };
}
```

### Context Generation Response

```typescript
interface ContextResponse {
  bundle: ContextBundle;
  assembledAt: Date;
  took: number;
  cacheHit: boolean;
  layers: {
    [layer: string]: {
      tokens: number;
      source: string;
    }
  };
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `common/` | Core type definitions |
| `server/src/types/` | Server types |
| `server/src/schema/` | Prisma schema |
| `pwa/src/types/` | Frontend types |
