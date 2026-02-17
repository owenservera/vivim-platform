# VIVIM Platform - AI Context Document

**Purpose**: Single-session context file providing comprehensive overview of the VIVIM platform for AI agents starting new work sessions.

**Last Updated**: February 14, 2026

---

## 1. Vision and Mission

### 1.1 Vision Statement

VIVIM envisions a world where **users maintain complete sovereignty over their AI interactions**. We believe that the knowledge generated through conversations with AI assistants belongs to the user—not the platform. Our mission is to democratize access to AI-generated knowledge while ensuring privacy, portability, and user control.

### 1.2 Mission Statement

To build the **universal infrastructure for AI conversation capture, knowledge extraction, and decentralized sharing**. We enable users to:

- **Own** their AI conversations permanently
- **Extract** actionable knowledge from chat histories
- **Share** knowledge with peers without platform barriers
- **Discover** relevant insights across their knowledge base
- **Collaborate** in sovereign networks without central control

### 1.3 Core Principles

| Principle | Description |
|-----------|-------------|
| **User Sovereignty** | Users own their data, keys, and identity |
| **Platform Agnostic** | Work with any AI provider (ChatGPT, Claude, Gemini, etc.) |
| **Privacy First** | Zero-knowledge architecture with end-to-end encryption |
| **Decentralization** | No central authority controlling knowledge access |
| **Semantic Understanding** | Transform conversations into searchable, linkable knowledge |
| **Offline First** | Full functionality without internet connectivity |

### 1.4 Problem Space

Modern AI platforms have created an unprecedented knowledge management challenge:

- **Knowledge Fragmentation**: 10+ AI providers with incompatible formats, no interoperability, vendor lock-in
- **Information Loss**: Conversations become inaccessible when accounts are deleted, platforms randomly purge old conversations
- **Searchability Issues**: Conversations are flat lists with no semantic structure, no cross-conversation search
- **Privacy Concerns**: Platforms monetize user conversations, third-party access to sensitive discussions

---

## 2. Tech Stack

### 2.1 Architecture Overview

The VIVIM platform consists of three primary components:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  PWA (React 19 + TypeScript + Vite)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  Server (Bun + Express + TypeScript)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA PERSISTENCE LAYER                    │
│  PostgreSQL + pgvector + Prisma                            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Frontend (PWA)

| Category | Technology | Details |
|----------|------------|---------|
| **Framework** | React | Version 19.2.4 |
| **Language** | TypeScript | ~5.9.3 |
| **Bundler** | Vite | Version 7.2.5 (rolldown-vite) |
| **State Management** | Zustand | Version 5.0.11 |
| **Styling** | Tailwind CSS | Version 4.1.18 |
| **Routing** | React Router DOM | Version 7.13.0 |
| **Data Fetching** | TanStack Query | Version 5.90.20 |
| **PWA** | vite-plugin-pwa | Version 1.2.0 |
| **Local Storage** | IndexedDB (idb) | Version 8.0.3 |
| **CRDT/Sync** | Yjs + y-indexeddb + y-websocket | Version 13.6.29 |
| **Icons** | Lucide React, Feather Icons | Latest |
| **Markdown** | react-markdown | Version 10.1.0 |
| **Code Highlighting** | Mermaid, KaTeX | Latest |
| **Testing** | Vitest | Version 4.0.18 |
| **Runtime** | Bun | >=1.0.0 |

### 2.3 Backend (Server)

| Category | Technology | Details |
|----------|------------|---------|
| **Runtime** | Bun | >=1.0.0 |
| **Framework** | Express | Version 5.2.1 |
| **Language** | TypeScript | Version 5.7.3 |
| **ORM** | Prisma | Version 7.3.0 |
| **Database** | PostgreSQL + pgvector | Vector search support |
| **AI SDK** | ai (AI SDK) | Version 6.0.82 |
| **AI Providers** | OpenAI, Anthropic, Google, xAI | Multi-provider support |
| **Web Scraping** | Playwright + Cheerio | Version 1.58.2 |
| **Vector Store** | PostgreSQL + pgvector | Built-in vector support |
| **Authentication** | Passport + OAuth | Google OAuth 2.0 |
| **Session** | express-session | Version 1.19.0 |
| **Logging** | Pino | Version 10.3.1 |
| **Validation** | Zod | Version 4.3.6 |
| **Testing** | Vitest | Version 4.0.18 |

### 2.4 Network Layer (P2P/Federation)

| Category | Technology | Details |
|----------|------------|---------|
| **P2P Framework** | libp2p | Version 1.0.0 |
| **Transport** | WebRTC, WebSockets, TCP | Multiple transport options |
| **Encryption** | @libp2p/noise, @libp2p/tls | Secure communication |
| **DHT** | @libp2p/kad-dht | Distributed hash table |
| **PubSub** | @libp2p/gossipsub | Topic-based messaging |
| **CRDT** | Yjs | Conflict-free data |
| **Crypto** | @noble/ed25519, @noble/hashes | Post-quantum ready |
| **Runtime** | Node.js | >=20.0.0 |

### 2.5 Key Libraries Summary

```json
// Frontend Dependencies (pwa/package.json)
{
  "dependencies": {
    "@automerge/automerge": "^3.2.3",
    "@tanstack/react-query": "^5.90.20",
    "idb": "^8.0.3",
    "react": "^19.2.4",
    "react-router-dom": "^7.13.0",
    "tailwindcss": "^4.1.18",
    "yjs": "^13.6.29",
    "zustand": "^5.0.11"
  }
}

// Backend Dependencies (server/package.json)
{
  "dependencies": {
    "@prisma/client": "^7.3.0",
    "ai": "^6.0.82",
    "express": "^5.2.1",
    "playwright": "^1.58.2",
    "prisma": "^7.3.0",
    "zod": "^4.3.6"
  }
}
```

---

## 3. Conceptual Implementation - High Level Design Concept

### 3.1 Core Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                      CORE WORKFLOW FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CAPTURE                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ User shares AI conversation URL                              ││
│  │ ↓                                                            ││
│  │ Provider detection (ChatGPT/Claude/Gemini/etc.)            ││
│  │ ↓                                                            ││
│  │ Playwright extraction with stealth headers                  ││
│  │ ↓                                                            ││
│  │ Rich content parsing (text, code, images, tables, LaTeX)  ││
│  └─────────────────────────────────────────────────────────────┘│
│                             ↓                                    │
│  2. PROCESS (ACU Generation)                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Decomposition into Atomic Chat Units (ACUs)                 ││
│  │ ↓                                                            ││
│  │ Quality scoring (0-100) based on richness, structure       ││
│  │ ↓                                                            ││
│  │ 384-dimensional vector embedding generation                 ││
│  │ ↓                                                            ││
│  │ Relationship detection and graph linking                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                             ↓                                    │
│  3. STORE & INDEX                                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ PostgreSQL: Structured data (conversations, messages, ACUs)││
│  │ pgvector: Semantic embeddings for similarity search        ││
│  │ Local Storage: Encrypted offline-capable PWA storage        ││
│  └─────────────────────────────────────────────────────────────┘│
│                             ↓                                    │
│  4. SEARCH & DISCOVER                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Semantic search (meaning-based, not keyword-based)         ││
│  │ ↓                                                            ││
│  │ Graph traversal for related knowledge discovery             ││
│  │ ↓                                                            ││
│  │ Quality-ranked results with provenance tracking             ││
│  └─────────────────────────────────────────────────────────────┘│
│                             ↓                                    │
│  5. SHARE & COLLABORATE                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Decentralized circles for selective sharing                 ││
│  │ ↓                                                            ││
│  │ P2P knowledge exchange with contribution tracking          ││
│  │ ↓                                                            ││
│  │ No central authority—user-controlled access                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Architecture

#### Target Architecture: Per-User Isolated Databases

```
MASTER DATABASE (PostgreSQL)           USER A ENV              USER B ENV
┌────────────────────────┐              ┌──────────┐            ┌──────────┐
│  Identity (DID, PK)   │              │SQLite DB │            │SQLite DB │
│  Auth Sessions        │              │          │            │          │
│  Device Registry      │              │Conversa- │            │Conversa- │
│  Cross-User Circles  │              │tions     │            │tions     │
│  Sharing Policies     │              │          │            │          │
└──────────┬───────────┘              │   ACUs   │            │   ACUs   │
           │                           │          │            │          │
           │ AUTH ONLY                 │Profiles  │            │Profiles  │
           ▼                           │          │            │          │
┌─────────────────────────────────┐     │Context   │            │Context   │
│       AUTH GATEWAY              │     │Bundles   │            │Bundles   │
│   (Validates DID, returns       │     │          │            │          │
│    user context for routing)    │     │          │            │          │
└───────────────┬─────────────────┘     └────┬─────┘            └────┬─────┘
                │                              │                     │
                │        ┌─────────────────────┴─────────────────────┘
                │        │
                ▼        ▼
┌─────────────────────────────────────────────────────────────────┐
│              PER-USER ISOLATED CONTEXT ENGINE                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Key Concepts

#### ACU (Atomic Chat Unit)
The fundamental unit of knowledge in VIVIM. Each AI conversation is decomposed into semantic atomic units that can be:
- Independently searched
- Quality-scored (0-100)
- Vector-embedded for semantic search
- Graph-linked to related knowledge

#### Context Engine
Per-user isolated intelligence system that manages:
- Topic profiles
- Entity profiles
- Context bundles
- Predictive retrieval
- **Memory System** - Second brain for user knowledge
- **Event-Driven Invalidation** - Reactive cache updates
- **Parallel Pipeline** - Concurrent context assembly

#### DID (Decentralized Identifier)
User identity system based on cryptographic keys, not platform accounts. Users own their identity completely.

#### Circles
Decentralized sharing groups where users can selectively share knowledge with peers without central authority.

---

## 5B. Social Network (Friends, Groups, Follows, Teams)

VIVIM implements a comprehensive social network layer that enables users to connect, collaborate, and share knowledge through multiple relationship types. This goes beyond simple "Circles" to provide rich social features.

### 5B.1 Social Relationship Types

| Type | Model | Description | Example |
|------|-------|-------------|---------|
| **Friends** | Bidirectional | Mutually agreed connection | Facebook-style friends |
| **Follows** | Unidirectional | One-way subscription | Twitter/X-style following |
| **Groups** | Multi-user | Flexible organization | Study groups, interest communities |
| **Teams** | Multi-user | Collaborative workspaces | Slack-style team channels |
| **Circles** | Multi-user | Content sharing groups | Existing VIVIM sharing mechanism |

### 5B.2 Friends (Bidirectional)

Friends are mutual connections requiring acceptance:

- **Friend Request**: Send a request with optional message
- **Accept/Reject**: Addressee can accept, reject, or block
- **Settings**: Control notifications, activity sharing, profile visibility
- **Privacy**: Both parties must agree for connection to exist

### 5B.3 Follows (Unidirectional)

Follows are one-way subscriptions to user's public activity:

- **Follow Request**: Instant for public accounts, approval for private
- **Notifications**: Optional notify-on-post setting
- **Feed**: Shows followed user's public activity in your feed
- **Privacy**: Can block followers or set account to private

### 5B.4 Groups (Flexible Organization)

Groups are flexible collections for organizing around topics:

- **Group Types**: General, Study, Project, Community
- **Visibility**: Public (anyone can join), Approval (request to join), Private (invite only)
- **Roles**: Owner, Admin, Moderator, Member
- **Posts**: Share ACUs, text, images, links within group
- **Difference from Circles**: Groups are for discussion/organization, Circles are for selective content sharing

### 5B.5 Teams (Collaborative Workspaces)

Teams are structured workspaces for collaboration:

- **Team Types**: Work, Project, Personal
- **Channels**: Public, Private, or Direct Message sub-groups
- **Roles**: Owner, Admin, Member, Guest
- **Real-time**: Message history, reactions, threads
- **Notifications**: Per-channel mute/notify settings

### 5B.6 Social Network Data Models

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SOCIAL NETWORK ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐                                                   │
│  │      User       │                                                   │
│  └────────┬────────┘                                                   │
│           │                                                            │
│     ┌─────┼─────┬────────────┐                                        │
│     │     │     │            │                                        │
│     ▼     ▼     ▼            ▼                                        │
│ ┌──────┐ ┌───────┐ ┌──────────┐ ┌─────────┐                         │
│ │Friend│ │Follow │ │  Group   │ │  Team   │                         │
│ │      │ │       │ │          │ │         │                         │
│ │ ◄───►│ │ ────► │ │ ┌──────┐│ │┌──────┐│                         │
│ └──────┘ └───────┘ │ │Member││ ││Member││                         │
│                     │ └──────┘│ │└──────┘│                         │
│                     │ ┌──────┐│ │┌──────┐│                         │
│                     │ │ Post ││ ││Channel││                         │
│                     │ └──────┘│ │└──────┘│                         │
│                     └──────────┘ └─────────┘                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5B.7 Social CRDTs

The network layer implements CRDTs for offline-first social operations:

| CRDT | Purpose | Sync Strategy |
|------|---------|---------------|
| `FriendCRDT` | Manage friend relationships | Array-based, status transitions |
| `FollowCRDT` | Track follows and notifications | Map-based, one-way |
| `GroupCRDT` | Group metadata, members, posts | Mixed Y.Doc structure |
| `TeamCRDT` | Team channels and messages | Hierarchical Y.Doc |

---

## 6. Dev Environment Setup, Approach and Tooling

### 6.1 Project Structure

```
vivim-app/
├── pwa/                    # Frontend PWA (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/     # React components (ios/, content/, recommendation/)
│   │   ├── pages/          # Route pages (Home, Capture, Search, etc.)
│   │   ├── lib/            # Utilities (auth-context, storage-v2, content-renderer)
│   │   ├── contexts/       # React contexts
│   │   ├── types/          # TypeScript type definitions
│   │   └── styles/         # CSS and styling
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                  # Backend API (Bun + Express + TypeScript)
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── context/        # Context engine
│   │   │   ├── memory/     # Memory system (Second Brain)
│   │   │   │   ├── memory-service.ts
│   │   │   │   ├── memory-extraction-engine.ts
│   │   │   │   ├── memory-retrieval-service.ts
│   │   │   │   ├── memory-consolidation-service.ts
│   │   │   │   └── memory-types.ts
│   │   │   ├── context-cache.ts
│   │   │   ├── context-event-bus.ts
│   │   │   └── ...
│   │   ├── extractors/     # AI provider extractors
│   │   └── services/extraction/  # Extraction strategies
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
│
├── network/                 # P2P Network Layer (libp2p)
│   ├── src/
│   │   ├── crdt/          # CRDT implementations
│   │   ├── dht/           # Distributed hash table
│   │   ├── federation/    # Federation protocols
│   │   └── utils/
│   └── package.json
│
└── VIVIM.docs/            # Project documentation
    ├── USERS/             # User-facing docs
    ├── NETWORK/           # Network architecture
    ├── ACU/               # ACU specifications
    ├── CONTEXT/          # Context engine docs
    └── ...                # Other sections
```

### 6.2 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Bun** | >=1.0.0 | Runtime for PWA and Server |
| **Node.js** | >=20.0.0 | Runtime for Network layer |
| **PostgreSQL** | Latest | Primary database |
| **pgvector** | Latest | Vector search extension |
| **Git** | Latest | Version control |

### 6.3 Development Commands

#### Frontend (PWA)

```bash
cd pwa

# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Run tests
bun run test

# Type check
bun run typecheck

# Lint
bun run lint
```

#### Backend (Server)

```bash
cd server

# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Start development server
bun run dev

# Run tests
bun test
```

### 6.4 Database Setup

```bash
# Start PostgreSQL with pgvector
docker run -d \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=vivim \
  -p 5432:5432 \
  pgvector/pgvector

# Push schema
cd server && bun run db:push
```

### 6.5 Environment Variables

#### Server (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vivim"

# AI Providers
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="..."
XAI_API_KEY="..."

# Auth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
SESSION_SECRET="..."

# Vector Store
QDRANT_URL="http://localhost:6333"
QDRANT_API_KEY="..."

# P2P Network
LIBP2P_PORT=4001
LIBP2P_BOOTSTRAP_NODES=""
```

#### PWA (.env)

```env
VITE_API_URL="http://localhost:3000"
VITE_WS_URL="ws://localhost:3000"
```

### 6.6 Key Development Patterns

#### State Management (Zustand)

```typescript
// Store example
import { create } from 'zustand'

interface AppState {
  conversations: Conversation[]
  addConversation: (conv: Conversation) => void
}

export const useAppStore = create<AppState>((set) => ({
  conversations: [],
  addConversation: (conv) => set((state) => ({ 
    conversations: [...state.conversations, conv] 
  })),
}))
```

#### API Client Pattern

```typescript
// Use TanStack Query for data fetching
import { useQuery, useMutation } from '@tanstack/react-query'

// Fetch conversations
const { data, isLoading } = useQuery({
  queryKey: ['conversations'],
  queryFn: () => fetch('/api/v1/conversations').then(r => r.json())
})
```

#### CRDT Sync (Yjs)

```typescript
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'

// Local-first sync
const ydoc = new Y.Doc()
const persistence = new IndexeddbPersistence('vivim-data', ydoc)

ydoc.getMap('conversations').set('conv-1', { title: '...' })
```

### 6.7 Code Quality Standards

- **TypeScript**: 100% type coverage required
- **Linting**: ESLint with react-hooks plugin
- **Formatting**: Prettier (config via eslint-config-prettier)
- **Testing**: Vitest with @vitest/coverage-v8
- **Pre-commit**: Run lint and typecheck before commit

### 6.8 Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Bun Runtime** | Fast startup, native TypeScript, excellent performance |
| **React 19** | Latest features, automatic batching, concurrent rendering |
| **Zustand** | Minimal boilerplate, TypeScript-first, atomic updates |
| **Tailwind 4** | CSS-first configuration, no runtime overhead |
| **Prisma** | Type-safe database access, migration management |
| **Yjs CRDT** | Battle-tested, multiple storage backends |
| **libp2p** | Production-ready P2P, modular architecture |

---

## Quick Reference

### Essential Files

| File | Purpose |
|------|---------|
| `pwa/src/App.tsx` | Main application component |
| `pwa/src/pages/Home.tsx` | Main dashboard |
| `pwa/src/pages/Capture.tsx` | URL capture interface |
| `pwa/src/lib/auth-context.tsx` | Authentication context |
| `server/src/server.js` | Express server entry |
| `server/prisma/schema.prisma` | Database schema |
| `VIVIM.docs/PITCH/01-EXECUTIVE_SUMMARY.md` | Full platform overview |

### Key Routes (PWA)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Main feed |
| `/capture` | Capture | Add new conversation |
| `/search` | Search | Semantic search |
| `/conversation/:id` | ConversationView | View conversation |
| `/collections` | Collections | Organize content |
| `/share` | Share | Manage circles |
| `/settings` | Settings | User preferences |

### Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/capture` | Capture new conversation |
| `GET /api/v1/conversations` | List conversations |
| `GET /api/v1/conversations/:id` | Get conversation |
| `POST /api/v1/search` | Semantic search |
| `GET /api/v1/acu/:conversationId` | Get ACUs |
| `GET /api/v1/circles` | List circles |
| `POST /api/v1/auth/login` | OAuth login |
| `GET /api/v2/memories` | List memories |
| `POST /api/v2/memories` | Create memory |
| `GET /api/v2/memories/:id` | Get specific memory |
| `PUT /api/v2/memories/:id` | Update memory |
| `DELETE /api/v2/memories/:id` | Delete memory |
| `POST /api/v2/memories/retrieve` | Retrieve memories for context |
| `POST /api/v2/memories/extract` | Extract memories from conversation |
| `POST /api/v2/memories/consolidate` | Run memory consolidation |

---

*This document provides a high-level overview. For detailed implementation specifics, consult the relevant documentation sections in `VIVIM.docs/`.*
