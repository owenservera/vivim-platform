# VIVIM Architecture Overview

## System Architecture

VIVIM is a comprehensive platform for capturing, organizing, and sharing AI conversations. The architecture follows a modular monorepo pattern with four primary components.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VIVIM Platform                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │     PWA     │    │    Server    │    │   Network   │              │
│  │  (Client)   │◄──►│   (API)      │◄──►│   (P2P)     │              │
│  │              │    │              │    │              │              │
│  │ - React 19   │    │ - Express    │    │ - libp2p    │              │
│  │ - IndexedDB  │    │ - PostgreSQL │    │ - Yjs CRDT  │              │
│  │ - Zustand    │    │ - Socket.io  │    │ - WebRTC    │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                   │                   │                        │
│         └───────────────────┼───────────────────┘                        │
│                             │                                            │
│                    ┌────────▼────────┐                                   │
│                    │  Admin Panel    │                                   │
│                    │   (Dashboard)   │                                   │
│                    └─────────────────┘                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 PWA (Progressive Web App)

```
PWA Architecture
├── src/
│   ├── components/         # React Components
│   │   ├── unified/       # Unified component library
│   │   ├── ios/           # iOS-style components
│   │   ├── admin/         # Admin components
│   │   ├── ui/            # Base UI components
│   │   └── content/       # Content rendering
│   ├── pages/             # Page components
│   ├── lib/               # Core libraries
│   │   ├── storage-v2/   # Storage layer (IndexedDB)
│   │   ├── sync/         # Sync engine
│   │   ├── recommendation/ # Recommendation engine
│   │   └── core-api.ts   # API client
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript types
│   └── router/            # Routing configuration
```

**Key Features:**

- Offline-first with IndexedDB
- Real-time sync via Socket.io
- P2P sync via Yjs
- Service worker for PWA capabilities

**Unified Component Library:**
The `unified/` directory provides cross-platform components consolidating functionality:

- `Button` - 5 variants (primary/secondary/ghost/destructive/tertiary), 4 sizes, loading state
- `Input` - Labels, icons, errors, helper text support
- `Card` - 4 variants (default/elevated/outlined/glass), hoverable/clickable states
- `ErrorState` - Network, server, not-found, permission, generic errors + banner/card variants
- `Skeleton` - PageSkeleton, ConversationSkeleton, DetailSkeleton, TableSkeleton

### 2.2 Server (Backend API)

```
Server Architecture
├── src/
│   ├── routes/           # API Route handlers
│   │   ├── v1/          # API v1 routes
│   │   ├── v2/          # API v2 routes
│   │   ├── v3/          # API v3 routes
│   │   └── admin/       # Admin routes
│   ├── services/         # Business logic
│   │   ├── socket.ts    # Socket.io service
│   │   └── streaming/   # Streaming services
│   ├── context/          # Context engine
│   │   ├── memory/      # Memory system
│   │   ├── prediction/  # Prediction engine
│   │   └── retrieval/   # Context retrieval
│   ├── lib/             # Core libraries
│   ├── middleware/      # Express middleware
│   ├── config/          # Configuration
│   └── extractors/      # Data extractors
├── prisma/              # Database schema
└── data/                # Local data storage
```

**Key Features:**

- RESTful API with versioning
- WebSocket real-time communication
- Multi-provider AI integration
- Advanced context management

### 2.3 Network Engine (P2P)

```
Network Engine Architecture
├── src/
│   ├── p2p/            # P2P networking
│   │   ├── NetworkNode.ts    # Main network node
│   │   ├── ConnectionManager.ts # Connection mgmt
│   │   └── PeerDiscovery.ts  # Peer discovery
│   ├── crdt/            # CRDT implementations
│   │   ├── ConversationCRDT.ts
│   │   ├── CircleCRDT.ts
│   │   ├── FriendCRDT.ts
│   │   └── FollowCRDT.ts
│   ├── pubsub/         # PubSub messaging
│   ├── federation/     # Federation layer
│   ├── dht/           # Distributed hash table
│   └── security/      # Security & encryption
```

**Key Features:**

- libp2p-based P2P networking
- CRDT for conflict-free sync
- End-to-end encryption
- Federated architecture

### 2.4 Admin Panel

```
Admin Panel Architecture
├── src/
│   ├── components/      # Dashboard components
│   ├── pages/           # Admin pages
│   ├── hooks/           # Custom hooks
│   └── stores/          # State management
```

**Key Features:**

- System monitoring
- Database management
- Network visualization
- Real-time logs

---

## 3. Data Flow Architecture

### 3.1 Capture Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │───►│  Playwright │───►│  Extractor  │───►│  Database   │
│  (Website)  │    │  (Headless)  │    │  (Parser)   │    │  (Prisma)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 3.2 Context Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Request   │───►│   Context   │───►│   Budget    │───►│    AI       │
│   (Query)   │    │   Assembler │    │   Algorithm │    │   Provider  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 3.3 Sync Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───►│  Socket.io  │───►│   Server    │───►│   Database  │
│   (Local)   │    │   (Real-time)│    │   (State)   │    │   (Remote)  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘

        │
        │
        ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Yjs      │───►│   P2P       │───►│   Other     │
│   (CRDT)    │    │  (Network)  │    │   Clients   │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 4. Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      Authentication Flow                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────┐                                                   │
│   │  User   │                                                   │
│   └────┬────┘                                                   │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────┐     ┌─────────────┐                           │
│   │   Google    │────►│   Passport  │                           │
│   │   OAuth    │     │   OAuth     │                           │
│   └─────────────┘     └──────┬──────┘                           │
│                              │                                    │
│                              ▼                                    │
│                       ┌─────────────┐                            │
│                       │   Session    │                            │
│                       │   Created   │                            │
│                       └──────┬──────┘                            │
│                              │                                    │
│                              ▼                                    │
│                       ┌─────────────┐     ┌─────────────┐       │
│                       │   JWT       │────►│   Client    │       │
│                       │   Token     │     │   Storage   │       │
│                       └─────────────┘     └─────────────┘       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema Overview

### Core Entities

```
User
├── id (UUID)
├── did (Decentralized Identifier)
├── handle (unique)
├── email
├── publicKey
├── status (ACTIVE/SUSPENDED/BANNED/DELETED)
├── mfaEnabled (Boolean)
├── trustScore (Float)
├── verificationLevel (Int)
└── createdAt

Conversation
├── id (UUID)
├── provider (AI provider)
├── sourceUrl
├── title
├── messageCount
├── totalTokens
└── ownerId (FK → User)

AtomicChatUnit (ACU)
├── id (UUID)
├── authorDid
├── signature
├── content
├── contentHash
├── type (text/code/markdown/etc)
├── category
├── embedding (vector)
└── conversationId (FK → Conversation)

Memory
├── id (UUID)
├── userId (FK → User)
├── content
├── memoryType (EPISODIC/SEMANTIC/PROCEDURAL/etc)
├── importance (0-1)
├── embedding (vector)
├── consolidationStatus
└── provenanceId

Circle
├── id (UUID)
├── ownerId (FK → User)
├── name
├── isPublic
└── members (1:N with CircleMember)

Group
├── id (UUID)
├── ownerId (FK → User)
├── name
├── type (GENERAL/STUDY/PROJECT/COMMUNITY)
├── visibility (PUBLIC/APPROVAL/PRIVATE)
└── members (1:N with GroupMember)

Team
├── id (UUID)
├── ownerId (FK → User)
├── type (WORK/PROJECT/PERSONAL)
├── visibility (OPEN/INVITE)
└── members (1:N with TeamMember)

Friend
├── requesterId (FK → User)
├── addresseeId (FK → User)
└── status (PENDING/ACCEPTED/REJECTED/BLOCKED/CANCELLED)

Follow
├── followerId (FK → User)
├── followingId (FK → User)
└── status (PENDING/ACTIVE/BLOCKED)

SharingIntent
├── id (UUID)
├── actorDid
├── intentType (SHARE/PUBLISH/EMBED/FORK)
├── contentType (CONVERSATION/ACU/COLLECTION/etc)
├── audienceType (PUBLIC/CIRCLE/USERS/LINK)
├── status (DRAFT/PENDING/ACTIVE/EXPIRED/etc)
└── accessGrants (1:N with ContentAccessGrant)
```

---

## 6. API Versioning Strategy

| Version | Status | Description                                |
| ------- | ------ | ------------------------------------------ |
| v1      | Stable | Core features                              |
| v2      | Stable | Enhanced features (circles, sharing, feed) |
| v3      | Beta   | Social features                            |
| Admin   | Stable | System management                          |

---

## 7. Security Architecture

### Layer 1: Transport Security

- HTTPS/TLS in production
- Helmet.js security headers

### Layer 2: Authentication

- Google OAuth 2.0
- JWT tokens
- Session-based auth

### Layer 3: Authorization

- Role-based access control (RBAC)
- Circle-based sharing policies

### Layer 4: Data Security

- End-to-end encryption (TweetNaCl)
- Content hashing
- Signature verification

### Layer 5: Network Security

- Rate limiting
- CORS policies
- Input validation (Zod)

---

## 8. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Production Setup                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐                  │
│  │  Nginx  │────►│  Server  │────►│PostgreSQL│                 │
│  │  (LB)   │     │  (Bun)  │     │  (DB)    │                 │
│  └─────────┘     └────┬────┘     └─────────┘                  │
│                       │                                         │
│                       ▼                                         │
│                ┌─────────────┐                                  │
│                │  Socket.io │                                  │
│                │  (Real-time)│                                  │
│                └─────────────┘                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Technology Choices Rationale

### Why Bun?

- Faster startup time
- Built-in bundling
- Native TypeScript support

### Why Yjs?

- Conflict-free sync
- Offline-first support
- Works with P2P

### Why Prisma?

- Type-safe queries
- Database agnostic
- Great migration support

### Why libp2p?

- Production-ready P2P
- Modular transport
- Built-in encryption

---

_Document Version: 1.1_
_Last Updated: February 2026_
