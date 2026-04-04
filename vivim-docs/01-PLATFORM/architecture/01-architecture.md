# VIVIM System Architecture

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VIVIM Architecture                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         FRONTEND LAYER                                │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │   │
│  │  │    PWA     │  │Admin Panel  │  │   SDK Apps                  │ │   │
│  │  │  (React)   │  │  (React)    │  │ (Publishing Agent, Dashboard)│ │   │
│  │  │  Port 5173 │  │  Port 5174  │  │   Ports vary                │ │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────────────┬──────────────┘ │   │
│  │         │                 │                        │                  │   │
│  │         └─────────────────┼────────────────────────┘                  │   │
│  │                           ▼                                             │   │
│  │                    ┌─────────────┐                                      │   │
│  │                    │   REST API  │                                      │   │
│  │                    │  Port 3000  │                                      │   │
│  │                    └──────┬──────┘                                      │   │
│  └──────────────────────────┼────────────────────────────────────────────┘   │
│                             │                                                 │
│  ┌──────────────────────────┼────────────────────────────────────────────┐   │
│  │                    BACKEND LAYER                                       │   │
│  ├──────────────────────────┼────────────────────────────────────────────┤   │
│  │                    ┌─────▼─────┐                                       │   │
│  │                    │  Server   │                                       │   │
│  │                    │  (Bun)   │                                       │   │
│  │                    └─────┬─────┘                                       │   │
│  │                          │                                             │   │
│  │    ┌─────────────────────┼─────────────────────┐                     │   │
│  │    │                     │                     │                     │   │
│  │    ▼                     ▼                     ▼                     │   │
│  │ ┌────────┐         ┌──────────┐        ┌──────────┐               │   │
│  │ │Services│         │  Routes  │        │   Data   │               │   │
│  │ │ (50+)  │         │  (40+)    │        │   Layer  │               │   │
│  │ └────────┘         └──────────┘        └──────────┘               │   │
│  │                                                         │            │   │
│  └─────────────────────────┬───────────────────────────────────────────┘   │
│                            │                                                │
│  ┌─────────────────────────┼───────────────────────────────────────────┐   │
│  │                    DATA LAYER                                        │   │
│  ├─────────────────────────┼───────────────────────────────────────────┤   │
│  │    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────────┐  │   │
│  │    │PostgreSQL│   │  Redis   │   │  Prisma  │   │   Socket.IO │  │   │
│  │    │          │   │          │   │   ORM    │   │   (Real-time│  │   │
│  │    └──────────┘   └──────────┘   └──────────┘   └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   DECENTRALIZED LAYER                               │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────────────────────────────────────────────────────────┐ │    │
│  │  │              Network Engine (LibP2P + CRDT)                   │ │    │
│  │  │              WebSocket Port 1235                               │ │    │
│  │  ├──────────────────────────────────────────────────────────────┤ │    │
│  │  │  Yjs CRDT  │  WebRTC  │  @noble/crypto  │  multiformats    │ │    │
│  │  └──────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      SDK CORE LAYER                                  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────────────────────────────────────────────────────────┐ │    │
│  │  │           @vivim/sdk (TypeScript/Node)                       │ │    │
│  │  │   AI Provider Abstraction: OpenAI, Anthropic, Gemini, etc.  │ │    │
│  │  └──────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Service-by-Service Breakdown

### 1. PWA (Progressive Web App)
- **Purpose**: Main user interface for interacting with VIVIM
- **Technology**: React 19, TypeScript, TailwindCSS, Vite 7, Framer Motion, Zustand, TanStack Query
- **Port**: 5173
- **Location**: `vivim-app/pwa/src/`
- **Key Directories**:
  - `app/` - Main application routes and pages
  - `components/` - Reusable UI components
  - `stores/` - Zustand state management
  - `hooks/` - Custom React hooks
  - `lib/` - Utility libraries
  - `pages/` - Page components

### 2. API Server
- **Purpose**: Backend services, database management, API endpoints
- **Technology**: Bun Runtime, Express 5, Prisma ORM, PostgreSQL, Redis, Socket.IO
- **Port**: 3000
- **Location**: `vivim-app/server/src/`
- **Key Directories**:
  - `services/` - 50+ business logic services
  - `routes/` - 40+ API route handlers
  - `repositories/` - Data access layer
  - `middleware/` - Express middleware
  - `lib/` - Server utilities
  - `types/` - TypeScript type definitions
  - `validators/` - Input validation
  - `workers/` - Background job workers

### 3. Network Engine (P2P)
- **Purpose**: Decentralized networking, CRDT synchronization, federation
- **Technology**: LibP2P, Yjs CRDT, WebRTC, WebSockets
- **Port**: 1235 (WebSocket)
- **Location**: `vivim-app/network/src/`
- **Purpose**: Enables peer-to-peer communication and data synchronization across nodes

### 4. SDK Core
- **Purpose**: Developer toolkit for building VIVIM-compatible applications
- **Technology**: TypeScript/Node.js
- **Location**: `vivim-app/sdk/src/`
- **Distribution**: `@vivim/sdk` npm package

### 5. SDK Apps
- **Publishing Agent**: Automated content publishing
- **Public Dashboard**: Analytics and monitoring dashboard
- **Location**: `vivim-app/sdk/apps/`

### 6. Admin Panel
- **Purpose**: Platform management and monitoring
- **Technology**: React-based
- **Port**: 5174
- **Location**: `vivim-app/admin-panel/`

---

## Technology Inventory Table

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 19 | UI Framework |
| | TypeScript | 5.9 | Type Safety |
| | TailwindCSS | - | Styling |
| | Vite | 7 | Build Tool |
| | Framer Motion | - | Animations |
| | Zustand | - | State Management |
| | TanStack Query | - | Data Fetching |
| **Backend** | Bun | >=1.0.0 | Runtime |
| | Express | 5 | Web Framework |
| | Prisma ORM | 7.4.2 | Database ORM |
| | PostgreSQL | >=14 | Primary Database |
| | Redis | - | Caching/Sessions |
| | Socket.IO | - | Real-time Communication |
| | AI SDK | - | Multi-Provider AI |
| **Decentralized** | LibP2P | - | P2P Networking |
| | Yjs | - | CRDT Sync |
| | WebRTC | - | P2P Communication |
| | @noble/crypto | - | Cryptography |
| | multiformats | - | Data Formats |
| | uint8arrays | - | Binary Data |
| **Development** | Bun | >=1.0.0 | Package Manager/Runtime |
| | Node.js | >=20.0.0 | Development Runtime |
| | TypeScript | 5.9 | Language |
| | Playwright | 1.58.2 | Testing |
| | Prisma | 7.4.2 | Database Tools |

---

## Communication Patterns

### 1. Client-Server Communication
- **REST API**: Primary communication between PWA/Admin and Server
- **WebSocket**: Real-time updates via Socket.IO
- **Port**: HTTP on 3000, WebSocket upgrade available

### 2. Service-to-Service Communication
- **Internal Services**: Direct JavaScript function calls within Server
- **Database**: Prisma ORM queries to PostgreSQL
- **Caching**: Redis for session and query caching

### 3. P2P Communication
- **LibP2P**: Peer discovery and connection
- **WebRTC**: Direct browser-to-browser communication
- **CRDT (Yjs)**: Conflict-free data synchronization
- **WebSocket Fallback**: For environments without WebRTC support
- **Port**: 1235

### 4. SDK Communication
- **Server API**: SDK communicates with VIVIM Server via REST
- **Provider Abstraction**: SDK normalizes AI provider interfaces

---

## Data Flow Description

### User Interaction Flow
1. User interacts with PWA (Port 5173)
2. PWA sends HTTP request to API Server (Port 3000)
3. API Server processes request via appropriate route handler
4. Route handler invokes relevant service(s)
5. Service(s) interact with database via Prisma ORM
6. Results returned to route handler
7. Route handler sends response to PWA
8. PWA updates UI via React state/TanStack Query

### Real-time Updates Flow
1. Client establishes WebSocket connection to Server
2. Server subscribes to relevant data channels
3. When data changes, relevant service publishes event
4. Socket.IO broadcasts to subscribed clients
5. Client updates UI reactively

### P2P Sync Flow
1. Network Engine connects to peers via LibP2P
2. Yjs CRDT manages shared document state
3. Changes propagate to all connected peers
4. Conflicts resolved automatically via CRDT merge rules

### AI Interaction Flow
1. User sends message via PWA
2. Server receives message and creates ACU (Atomic Chat Unit)
3. Context Engine assembles context (8-layer system)
4. AI Provider SDK sends request to selected provider (OpenAI, Anthropic, etc.)
5. Response streamed back to client via Socket.IO
6. ACU stored for future retrieval

---

## Entry Points

| Service | Port | URL | Entry Point |
|---------|------|-----|-------------|
| PWA | 5173 | http://localhost:5173 | `pwa/src/main.tsx` |
| Admin Panel | 5174 | http://localhost:5174 | Admin SPA entry |
| API Server | 3000 | http://localhost:3000 | `server/src/server.js` |
| Network WS | 1235 | ws://localhost:1235 | Network Engine entry |
| SDK | N/A | npm package | `@vivim/sdk` |

---

## Database Schema Overview

### Primary Tables (via Prisma)
- Users
- Conversations
- ACUs (Atomic Chat Units)
- Memories
- Context Layers
- Sharing Policies
- Collections
- Circles (social groups)
- Profiles

### Key Services
- `acu-generator.js` - Creates ACUs from conversations
- `context-generator.js` - Assembles context layers
- `streaming-context-service.ts` - Real-time context assembly
- `unified-context-service.ts` - Unified context management
- `memory-conflict-detection.ts` - CRDT conflict resolution
- `feed-service.js` - Activity feed generation
- `import-service.js` - Data import from external sources
- `sharing-policy-service.js` - Access control

---

## Summary

VIVIM is a sophisticated, multi-layered architecture designed for:
1. **User-Facing**: React-based PWA with modern state management
2. **Backend**: Bun-powered Express server with 50+ services
3. **Data**: PostgreSQL with Prisma ORM, Redis caching
4. **Real-time**: Socket.IO for live updates
5. **Decentralized**: LibP2P + Yjs for P2P sync
6. **Developer**: TypeScript SDK for building VIVIM-compatible apps
7. **AI**: Provider-agnostic AI integration layer

This architecture provides the foundation for a cinematic landing page that can showcase:
- Real-time context assembly demonstrations
- ACU creation and search visualizations
- P2P network topology
- AI provider switching demos
- Memory graph visualizations
- Secure sharing flows
