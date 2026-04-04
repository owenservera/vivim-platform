# VIVIM Technical Architecture

## System Design Deep Dive

This document provides a comprehensive technical architecture overview for engineers, architects, and technical stakeholders.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            VIVIM PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     FRONTEND LAYER (PWA)                         │   │
│  │  React 19 • TypeScript • Zustand • TanStack Query • Yjs         │   │
│  │  IndexedDB (Dexie) • Framer Motion • NNTailwindCSS               │   │
│  └───────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                        │
│  ┌───────────────────────────────▼─────────────────────────────────┐   │
│  │                      API GATEWAY                                 │   │
│  │  Express 5 • Socket.IO • Rate Limiting • Auth                  │   │
│  └───────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                        │
│  ┌───────────────────────────────▼─────────────────────────────────┐   │
│  │                     BACKEND SERVICES                             │   │
│  │  Bun Runtime • Prisma • PostgreSQL • Redis • Playwright        │   │
│  │                                                                   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │   │
│  │  │ Capture  │ │ Context  │ │ Sharing  │ │  Memory  │          │   │
│  │  │ Service  │ │ Engine   │ │ Service  │ │ Pipeline │          │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │   │
│  └───────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                        │
│  ┌───────────────────────────────▼─────────────────────────────────┐   │
│  │                    DATA LAYER                                    │   │
│  │  PostgreSQL + pgvector • Redis • Per-User SQLite               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                 DECENTRALIZED LAYER (Optional)                   │   │
│  │  LibP2P • Yjs CRDTs • IPFS • Blockchain                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture (PWA)

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 19 | UI components |
| Language | TypeScript | Type safety |
| State | Zustand | Global state |
| Data | TanStack Query | Server state |
| Local Storage | Dexie (IndexedDB) | Offline data |
| Styling | TailwindCSS | Styling |
| Animation | Framer Motion | Animations |
| Routing | React Router | Navigation |

### 2.2 State Management

```
┌──────────────────────────────────────────────────┐
│               APPLICATION STATE                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌────────────────┐   ┌────────────────┐        │
│  │ Zustand Stores │   │ TanStack Query │        │
│  ├────────────────┤   ├────────────────┤        │
│  │ • appStore    │   │ • conversations│        │
│  │ • uiStore     │   │ • acu          │        │
│  │ • authStore   │   │ • memories     │        │
│  │ • archiveStore│   │ • sharing      │        │
│  └───────┬────────┘   └───────┬────────┘        │
│          │                   │                  │
│          └─────────┬─────────┘                  │
│                    ▼                            │
│          ┌────────────────┐                    │
│          │  Socket.IO    │                    │
│          │  Real-time    │                    │
│          └────────────────┘                    │
│                                                   │
└──────────────────────────────────────────────────┘
```

### 2.3 Key Frontend Modules

#### ConversationStore
```typescript
interface ConversationStore {
  conversations: Conversation[];
  activeConversation: string | null;
  filters: FilterState;
  
  // Actions
  fetchConversations(): Promise<void>;
  setActive(id: string): void;
  applyFilters(filters: FilterState): void;
}
```

#### ArchiveStore
```typescript
interface ArchiveStore {
  viewMode: 'list' | 'grid' | 'canvas' | 'timeline';
  activeZone: 'all' | 'imported' | 'active' | 'shared';
  searchQuery: string;
  
  // Actions
  setViewMode(mode: ViewMode): void;
  search(query: string): Promise<void>;
}
```

### 2.4 CRDT Integration (Yjs)

Client-side CRDT for offline-first:

```typescript
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

class VivimCRDT {
  constructor(userDid) {
    this.doc = new Y.Doc();
    
    // Persistent storage
    this.persistence = new IndexeddocPersistence(
      `vivim-${userDid}`,
      this.doc
    );
    
    // Shared types
    this.conversations = this.doc.getMap('conversations');
    this.messages = this.doc.getArray('messages');
  }
  
  // Observe changes
  observe(callback) {
    this.conversations.observe(callback);
  }
}
```

---

## 3. Backend Architecture

### 3.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Bun | JavaScript execution |
| Framework | Express 5 | HTTP framework |
| ORM | Prisma 7 | Database access |
| Database | PostgreSQL + pgvector | Storage + vectors |
| Cache | Redis | Caching, sessions |
| Real-time | Socket.IO | WebSockets |
| AI SDK | Vercel AI SDK | Multi-provider AI |
| Browser | Playwright | Conversation capture |

### 3.2 Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Express)                       │
│  Routes → Middleware → Controllers → Services               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  CAPTURE FLOW                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │   Route    │→ │  Extractor │→ │  Storage   │   │   │
│  │  │  (capture) │  │ (Playwright)│  │  (Prisma)  │   │   │
│  │  └────────────┘  └────────────┘  └────────────┘   │   │
│  │        ↓                                              │   │
│  │  ┌────────────┐  ┌────────────┐                    │   │
│  │  │ ACU Gen    │→ │  Embedding │                    │   │
│  │  │            │  │  (Vector)  │                    │   │
│  │  └────────────┘  └────────────┘                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  CONTEXT FLOW                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │   Request  │→ │  Compiler  │→ │   Bundler  │   │   │
│  │  │            │  │ (8 Layers) │  │ (Token $)  │   │   │
│  │  └────────────┘  └────────────┘  └────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  SHARING FLOW                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │   Share   │→ │  Policy   │→ │ Encryption │   │   │
│  │  │  Request  │  │  Engine   │  │  (Nacl)   │   │   │
│  │  └────────────┘  └────────────┘  └────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Capture Service

```javascript
// Capture flow orchestration
class CaptureService {
  async captureFromProvider(provider, userId, sessionToken) {
    // 1. Detect provider
    const extractor = await this.getExtractor(provider);
    
    // 2. Authenticate
    await extractor.authenticate(sessionToken);
    
    // 3. Fetch conversations
    const conversations = await extractor.fetchAll();
    
    // 4. Save to database
    const saved = await this.saveConversations(conversations, userId);
    
    // 5. Queue ACU generation
    for (const conv of saved) {
      await this.queueACUGeneration(conv.id);
    }
    
    return saved;
  }
  
  async getExtractor(provider) {
    const extractors = {
      chatgpt: new ChatGPTExtractor(),
      claude: new ClaudeExtractor(),
      // ...
    };
    return extractors[provider];
  }
}
```

### 3.4 Context Engine

```typescript
// Context compilation
class ContextEngine {
  async compile(userDid, conversationId, options = {}) {
    const {
      maxTokens = 12000,
      includeLayers = [0,1,2,3,4,5,6,7]
    } = options;
    
    const context = {
      identity: null,
      preferences: null,
      topics: [],
      entities: [],
      memories: [],
      acuSearch: [],
      systemPrompt: ''
    };
    
    // Compile each layer
    if (includeLayers.includes(0)) {
      context.identity = await this.getIdentityContext(userDid);
    }
    if (includeLayers.includes(2)) {
      context.topics = await this.getTopicProfiles(userDid);
    }
    // ... more layers
    
    // Token budget allocation
    const budget = new ContextBudget(context, maxTokens);
    return budget.compile();
  }
}
```

---

## 4. Data Architecture

### 4.1 Database Schema (Key Models)

```prisma
model User {
  id              String   @id @default(cuid())
  did             String   @unique // Decentralized ID
  email           String?  // Optional, for auth
  publicKey       String
  settings        Json
  
  conversations   Conversation[]
  memories        Memory[]
  acu             AtomicChatUnit[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Conversation {
  id              String   @id @default(cuid())
  userId          String
  provider        String   // chatgpt, claude, etc.
  providerId      String   // External ID
  title           String?
  status          String   // imported, active, archived
  
  messages        Message[]
  acus            AtomicChatUnit[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AtomicChatUnit {
  id              String   @id
  authorDid       String
  signature       String   // Ed25519 signature
  
  content         String   @db.Text
  language        String?
  type            String   // code, explanation, etc.
  category        String?
  
  // Quality metrics
  qualityOverall  Float
  contentRichness Float
  structuralIntegrity Float
  uniqueness      Float
  rediscoveryScore Float?
  
  // Embedding for semantic search
  embedding       Float[]  @vector(384)
  
  conversationId  String?
  messageId       String?
  
  createdAt       DateTime @default(now())
}

model Memory {
  id              String   @id @default(cuid())
  userId          String
  
  content         String   @db.Text
  type            String   // FACTUAL, PREFERENCE, EPISODIC
  confidence      Float
  
  sourceAcuIds    String[]
  
  createdAt       DateTime @default(now())
}

model TopicProfile {
  id              String   @id @default(cuid())
  userId          String
  
  name            String
  mentionCount    Int      @default(0)
  importance      Float    @default(0.5)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 4.2 Per-User Database Architecture

```
/databases/
├── main/                    # Shared database
│   ├── users/
│   ├── sessions/
│   └── metadata/
│
├── user_isolated/           # Per-user databases
│   ├── did_abc123/
│   │   ├── conversations.db
│   │   ├── acu.db
│   │   ├── memories.db
│   │   └── context.db
│   │
│   ├── did_def456/
│   │   ├── conversations.db
│   │   ├── acu.db
│   │   └── ...
│   │
│   └── ...
```

**Benefits:**
- Complete data isolation
- Easy compliance (no cross-user queries)
- Simple export (copy file)
- Performance isolation

---

## 5. API Architecture

### 5.1 REST Endpoints

| Domain | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `/auth/*` | Login, OAuth, MFA |
| Capture | `/capture/*` | Import, sync |
| Conversations | `/conversations/*` | CRUD |
| Messages | `/messages/*` | CRUD |
| ACU | `/acus/*` | Search, retrieve |
| Memory | `/memory/*` | Extract, consolidate |
| Context | `/context/*` | Compile, settings |
| Sharing | `/sharing/*` | Create, permissions |
| Social | `/social/*` | Friends, circles |
| Collections | `/collections/*` | CRUD |
| Search | `/search/*` | Hybrid search |
| Portability | `/portability/*` | Export, import |
| Admin | `/admin/*` | System management |

### 5.2 WebSocket Events

```javascript
// Socket.IO event mapping
const socketEvents = {
  // Real-time sync
  'sync:request': 'Request state sync',
  'sync:push': 'Push local changes',
  'sync:pull': 'Pull remote changes',
  
  // Conversation updates
  'conversation:new': 'New conversation added',
  'conversation:update': 'Conversation modified',
  'conversation:delete': 'Conversation removed',
  
  // Sharing
  'share:received': 'New share received',
  'share:accepted': 'Share accepted',
  
  // Presence
  'presence:update': 'User online/offline'
};
```

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
┌────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐                                              │
│  │  User    │                                              │
│  └────┬─────┘                                              │
│       │                                                    │
│       ▼                                                    │
│  ┌─────────────────────┐                                   │
│  │   Choose Method     │                                   │
│  │  • DID + Keypair   │                                   │
│  │  • Google OAuth    │                                   │
│  │  • Email + Password│                                   │
│  └──────────┬──────────┘                                   │
│             │                                               │
│       ┌────┴────┐                                          │
│       ▼         ▼                                          │
│  ┌────────┐  ┌────────┐                                    │
│  │  DID   │  │ OAuth  │                                    │
│  │ Verify │  │  Flow  │                                    │
│  │Signat..│  │        │                                    │
│  └────┬───┘  └────┬───┘                                    │
│       │          │                                         │
│       └────┬─────┘                                         │
│            ▼                                               │
│     ┌────────────┐                                         │
│     │  Session   │                                         │
│     │   Token    │                                         │
│     └────────────┘                                         │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 6.2 Encryption Flow

```typescript
// Sharing encryption
class EncryptionService {
  // Generate symmetric key for content
  generateContentKey() {
    return nacl.randomBytes(nacl.secretbox.keyLength);
  }
  
  // Encrypt content for recipient
  encryptForRecipient(content, recipientPublicKey) {
    // 1. Generate content key
    const contentKey = this.generateContentKey();
    
    // 2. Encrypt content with content key
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const ciphertext = nacl.secretbox(
      Buffer.from(content),
      nonce,
      contentKey
    );
    
    // 3. Encrypt content key for recipient (key exchange)
    const encryptedKey = nacl.box.seal(
      contentKey,
      recipientPublicKey
    );
    
    return { ciphertext, encryptedKey, nonce };
  }
}
```

---

## 7. Deployment Architecture

### 7.1 Production Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐                                                    │
│   │  CDN    │  (CloudFlare / CloudFront)                        │
│   └────┬────┘                                                    │
│        │                                                         │
│   ┌────▼─────────────────────────────────────────────┐         │
│   │                 LOAD BALANCER                      │         │
│   │              (nginx / cloud provider)              │         │
│   └────┬─────────────────────────────────────────────┘         │
│        │                                                          │
│   ┌────▼──────────────────────────┐                           │
│   │     APPLICATION TIER            │                           │
│   │                                 │                           │
│   │  ┌────────┐ ┌────────┐ ┌────────┐                          │
│   │  │  API   │ │  API   │ │  API   │  (Horizontal scaling)  │
│   │  │ Server │ │ Server │ │ Server │                          │
│   │  └────────┘ └────────┘ └────────┘                          │
│   │       │           │           │                            │
│   └───────┼───────────┼───────────┼────────────────────────┘   │
│           │           │           │                             │
│   ┌───────▼───────────▼───────────▼─────────────┐               │
│   │            DATA TIER                        │               │
│   │                                           │               │
│   │  ┌──────────┐   ┌──────────┐   ┌────────┐ │               │
│   │  │PostgreSQL│   │PostgreSQL│   │ Redis │ │               │
│   │  │ Primary  │◄─►│ Replica  │   │ Cache │ │               │
│   │  └──────────┘   └──────────┘   └────────┘ │               │
│   │        │                           │       │               │
│   │   ┌────▼────┐                       │       │               │
│   │   │ pgvector│                       │       │               │
│   │   │  (vector│                       │       │               │
│   │   │  search)│                       │       │               │
│   │   └─────────┘                       │       │               │
│   │                                     │       │               │
│   └─────────────────────────────────────┘       │               │
│                                                  │               │
└──────────────────────────────────────────────────┘
```

### 7.2 Self-Hosted (Docker Compose)

```yaml
version: '3.8'

services:
  api:
    image: vivim/api:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/vivim
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      - redis

  db:
    image: pgvector/pgvector:pg15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=vivim
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

---

## 8. Performance Characteristics

### 8.1 Latency Targets

| Operation | Target | 95th Percentile |
|-----------|--------|------------------|
| Page load | < 1s | 2s |
| Search (lexical) | < 50ms | 100ms |
| Search (semantic) | < 200ms | 500ms |
| Conversation fetch | < 100ms | 300ms |
| ACU generation | < 5s | 10s |
| Context compile | < 300ms | 500ms |

### 8.2 Scale Targets

| Metric | Target |
|--------|--------|
| Concurrent users | 100,000 |
| Conversations | 10,000,000 |
| ACUs | 100,000,000 |
| API requests/day | 10,000,000 |

---

## 9. Observability

### 9.1 Metrics

- **Business**: DAU, MAU, conversations captured, searches performed
- **Technical**: Latency, error rate, CPU, memory, disk I/O
- **Custom**: Capture success rate, extraction time, sync latency

### 9.2 Logging

Structured JSON logging with Pino:
```javascript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  }
});
```

### 9.3 Tracing

OpenTelemetry integration for distributed tracing.

---

*Document Version: 1.0*
*Last Updated: 2026-03-17*
