# DOCUMENT 1: SYSTEM ARCHITECTURE SNAPSHOT

## Tech Stack

### Frontend (PWA)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 4 with tailwind-merge, clsx
- **State Management**: Zustand 5, TanStack Query 5
- **Animation**: Framer Motion 12
- **UI Components**: Radix UI primitives (accordion, dropdown, tooltip, etc.)
- **Content Rendering**: react-markdown, remark-gfm, rehype-katex, react-syntax-highlighter, Shiki
- **Offline Storage**: Dexie (IndexedDB), idb
- **P2P/CRDT**: Yjs, y-indexeddb, y-websocket, Automerge
- **Real-time**: Socket.IO client
- **Testing**: Vitest, Playwright

### Backend (Server)
- **Runtime**: Bun 1.0+
- **Framework**: Express 5
- **ORM**: Prisma 7 with PostgreSQL
- **Database**: PostgreSQL with pgvector extension for embeddings
- **Cache/Session**: Redis via ioredis
- **AI Integration**: 
  - AI SDK (@ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google, @ai-sdk/xai)
  - Vercel AI SDK (ai@6.x)
  - OpenAI SDK (openai@6.x)
- **WebSockets**: Socket.IO
- **Authentication**: Passport with Google OAuth, JWT (jsonwebtoken), OTPLib for 2FA
- **HTML Extraction**: Playwright, Cheerio, Puppeteer stealth plugins
- **Validation**: Zod
- **Logging**: Pino

### Network Engine (P2P)
- **P2P Protocol**: LibP2P
- **CRDT**: Yjs
- **WebRTC**: Built-in LibP2P WebRTC
- **DHT**: Kademlia DHT for peer discovery
- **PubSub**: GossipPub for message dissemination

### SDK
- **Package**: TypeScript/Node
- **Storage Protocol**: Custom storage token standards
- **Identity**: DID-based identity

---

## Deployment Architecture

### Current Setup
- **Monorepo Structure**: Bun workspaces with packages:
  - `pwa/` - Frontend application
  - `server/` - API server
  - `network/` - P2P network engine
  - `admin-panel/` - Admin dashboard
  - `sdk/` - Developer toolkit
  - `sdk/apps/*` - Sample applications (public-dashboard, publishing-agent)

### Hosting
- **Deployment Target**: Not explicitly defined in codebase (Vercel-compatible based on Next.js presence in related packages)
- **Development**: `bun run dev` runs all services concurrently

### Database
- **Primary**: PostgreSQL with Prisma
- **Vector Search**: pgvector extension enabled
- **Multiple Schema Versions**: schema.prisma (current), plus phase-specific schemas for migrations

---

## Application Structure

### Architecture Pattern
- **Current**: Monolithic shared PostgreSQL database with row-level isolation via `userId` foreign keys
- **Target Vision**: Per-user isolated SQLite databases with minimal master database for identity/auth only

### Key Architectural Decisions

1. **User Isolation via Query Filtering**
   - Currently uses single PrismaClient for all users
   - User data isolation achieved through `where: { userId }` filters
   - Target: Per-user isolated databases

2. **CRDT for P2P Sync**
   - Yjs-based CRDT for distributed state
   - Custom CRDT types for Circles, Groups, Teams, Conversations, Friends, Follows

3. **Atomic Chat Units (ACUs)**
   - Fine-grained message primitives extracted from conversations
   - Cryptographically signed content with author DID
   - Embeddings for semantic search
   - Quality scoring and rediscovery metrics

4. **Context Engine with Layered Bundles**
   - Multi-layer context system for AI prompts
   - Bundle types: identity_core, global_prefs, topic, entity, conversation, composite
   - Token budget management with elasticity

5. **Provider-Agnostic Capture**
   - Playwright-based extraction with stealth plugins
   - Support for multiple AI providers: ChatGPT, Claude, Gemini, Grok, DeepSeek, Kimi, Qwen, ZAI, Mistral

---

## External APIs and Services

### AI Providers Supported
- OpenAI (chat.openai.com)
- Anthropic (claude.ai)
- Google (gemini.google.com)
- xAI (grok.x.com)
- DeepSeek (chat.deepseek.com)
- Kimi (kimi.moonshot.cn)
- Qwen (qwen.alibaba.com)
- ZAI (zaimini.com)
- Mistral (chat.mistral.ai)

### Authentication
- Google OAuth via Passport
- JWT tokens for session management
- DID-based identity for decentralized features
- Device registration with public key cryptography (Ed25519)

### Storage
- PostgreSQL for primary data
- Redis for sessions and caching
- IndexedDB (via Dexie) for PWA offline storage

---

## Authentication and User Identity Model

### Identity System
- **DID (Decentralized Identifier)**: Primary user identifier
- **Public Key**: Ed25519 cryptographic key pair
- **Handle**: Human-readable username (unique)
- **Display Name**: User-set name

### Account Lifecycle
- Status enum: ACTIVE, SUSPENDED, BANNED, DELETING, DELETED
- Deletion request tracking with `deletionRequestedAt`, `deletedAt`
- Suspension with reason tracking

### Device Management
- Device registration with public keys
- Trust levels for devices
- Multi-device sync support

### Verification
- Verification level system (0-N)
- Email and phone verification flags
- Trust score calculation

---

## Data Persistence Layer

### What is Stored

| Category | Examples |
|----------|----------|
| **Conversations** | External AI conversation imports with messages |
| **ACUs** | Atomic Chat Units extracted from conversations |
| **Profiles** | Topic profiles, entity profiles |
| **Memories** | User memories with types (episodic, semantic, procedural, etc.) |
| **Context** | Compiled context bundles |
| **Social** | Circles, groups, teams, friends, follows |
| **Sharing** | Share links, access grants, permissions |
| **Content** | Notebooks, bookmarks, collections |

### Storage Format
- **PostgreSQL**: Primary relational storage via Prisma
- **JSON fields**: Flexible metadata storage
- **Vector embeddings**: Float arrays for semantic search (pgvector)
- **Encrypted**: Some sensitive data patterns identified but implementation varies

---

## Notable Architectural Decisions

1. **Capture-First Philosophy**
   - Heavy investment in conversation capture/extraction from external providers
   - Playwright-based scraping with stealth to avoid bot detection

2. **ACU as First-Class Primitive**
   - Breaking conversations into atomic, signable units
   - Enables fine-grained sharing, forking, and remixing

3. **Context Engine for Personalization**
   - Layered context bundles compiled from user data
   - Token budget management for AI context windows

4. **P2P with CRDT**
   - Decentralized sync using Yjs
   - Enables offline-first and peer-to-peer features

5. **Target: User-Owned Databases**
   - Vision for per-user isolated SQLite
   - Currently blocked by single-database architecture

---

## Current Limitations

- Single shared database (not yet per-user isolation)
- No end-to-end encryption implementation visible
- P2P features still in development
- Some Phase schemas (2-5) exist but may not be fully deployed
