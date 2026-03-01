# <img src="https://img.icons8.com/color/48/000000/server.png" width="40" align="left" /> VIVIM Server

### Backend API Server - Express.js on Bun Runtime

[« Back to Main Repository](../README.md) | [« Back to Documentation Index](./README.md)

---

## 📖 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [🏗️ Architecture](#️-architecture)
- [🔌 API Reference](#-api-reference)
- [🗄️ Database](#️-database)
- [🔐 Authentication](#-authentication)
- [🤝 Contributing](#-contributing)

---

## ✨ Overview

The **VIVIM Server** is a high-performance backend API server built with Express.js running on the Bun runtime. It provides RESTful APIs, WebSocket connections, and database services for the VIVIM platform.

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Bun | 1.x | JavaScript Runtime |
| Express | 5.x | Web Framework |
| Prisma | 7.x | Database ORM |
| PostgreSQL | 16.x | Primary Database |
| Redis | 7.x | Cache & Sessions |
| Socket.IO | 4.x | WebSocket Server |
| Pino | 10.x | Logging |
| Zod | 4.x | Validation |

---

## 🎯 Features

### Core Features

- ✅ **RESTful API** - Complete REST API for all resources
- ✅ **WebSocket Support** - Real-time bidirectional communication
- ✅ **Rate Limiting** - Configurable rate limiting per endpoint
- ✅ **Authentication** - JWT-based authentication with OAuth support
- ✅ **CORS** - Configurable cross-origin resource sharing
- ✅ **Compression** - Gzip/Brotli compression
- ✅ **Security Headers** - Helmet.js security middleware
- ✅ **Request Logging** - Structured logging with Pino

### API Endpoints

| Endpoint | Description | Status |
|----------|-------------|--------|
| `/api/users` | User management | ✅ Stable |
| `/api/identities` | Identity management | ✅ Stable |
| `/api/memories` | Memory CRUD operations | ✅ Stable |
| `/api/content` | Content management | ✅ Stable |
| `/api/conversations` | Conversation management | ✅ Stable |
| `/api/circles` | Circle management | 🚧 Beta |
| `/api/acus` | ACU processing | ✅ Stable |
| `/api/sync` | State synchronization | 🚧 Beta |
| `/api/feed` | Content feed | ✅ Stable |
| `/api/ai/*` | AI-related endpoints | ✅ Stable |

---

## 📦 Installation

```bash
# Navigate to server directory
cd server

# Install dependencies
bun install
```

### Dependencies

```json
{
  "dependencies": {
    "@ai-sdk/openai": "^3.0.27",
    "@prisma/client": "^7.3.0",
    "compression": "^1.8.1",
    "cors": "^2.8.6",
    "express": "^5.2.1",
    "express-rate-limit": "^8.2.1",
    "helmet": "^8.1.0",
    "ioredis": "^5.9.3",
    "pino": "^10.3.1",
    "socket.io": "^4.8.3",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.13.1",
    "prisma": "^7.3.0",
    "typescript": "^5.7.3"
  }
}
```

---

## 🚀 Quick Start

### Development

```bash
# Start development server with hot reload
bun run dev

# Server runs at http://localhost:3333
```

### Production

```bash
# Start production server
bun run start
```

### Database Setup

```bash
# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# Open Prisma Studio
bun run db:studio
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Server Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    HTTP Layer                            │   │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │   │
│  │  │ Express │ │  Helmet  │ │  CORS    │ │ Rate Limit   │  │   │
│  │  │  Router │ │ Security │ │  Config  │ │  Middleware  │  │   │
│  │  └─────────┘ └──────────┘ └─────────┘ └──────────────┘  │   │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                   Routes Layer                            │ │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │ │
│  │  │ /users  │ │ /memories│ │/content │ │ /conversations│ │ │
│  │  └─────────┘ └──────────┘ └─────────┘ └──────────────┘  │ │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │ │
│  │  │ /circles│ │  /acus   │ │  /sync  │ │    /ai/*     │  │ │
│  │  └─────────┘ └──────────┘ └─────────┘ └──────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                 Services Layer                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │   User      │  │   Memory    │  │    Content      │   │ │
│  │  │  Service    │  │  Service    │  │    Service      │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │    Auth     │  │     AI      │  │     Network     │   │ │
│  │  │  Service    │  │  Service    │  │    Service      │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                   Data Layer                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │  Prisma     │  │   Redis     │  │   Socket.IO     │   │ │
│  │  │   ORM       │  │   Cache     │  │   WebSocket     │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Reference

### Base URL

```
Development: http://localhost:3333
Production:  https://api.vivim.app
```

### Authentication

Most endpoints require authentication via JWT:

```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
     https://api.vivim.app/api/users/me
```

### Endpoints

#### Users

```http
GET    /api/users/:did          # Get user by DID
POST   /api/users               # Create new user
PUT    /api/users/:did          # Update user
DELETE /api/users/:did          # Delete user
GET    /api/users/me            # Get current user
```

#### Memories

```http
GET    /api/memories            # List memories
POST   /api/memories            # Create memory
GET    /api/memories/:id        # Get memory by ID
PUT    /api/memories/:id        # Update memory
DELETE /api/memories/:id        # Delete memory
GET    /api/memories/search     # Search memories
```

#### Content

```http
GET    /api/content             # List content
POST   /api/content             # Create content
GET    /api/content/:cid        # Get content by CID
PUT    /api/content/:cid        # Update content
DELETE /api/content/:cid        # Delete content
```

#### Conversations

```http
GET    /api/conversations       # List conversations
POST   /api/conversations       # Create conversation
GET    /api/conversations/:id   # Get conversation
POST   /api/conversations/:id/messages  # Send message
```

#### AI Endpoints

```http
POST   /api/ai/chat             # Chat with AI
POST   /api/ai/complete         # Text completion
POST   /api/ai/embed            # Generate embeddings
POST   /api/ai/analyze          # Analyze content
```

### Example Request

```bash
# Create a memory
curl -X POST http://localhost:3333/api/memories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "Learned about VIVIM today",
    "type": "note",
    "tags": ["vivim", "learning"]
  }'
```

### Example Response

```json
{
  "success": true,
  "data": {
    "id": "mem_abc123",
    "content": "Learned about VIVIM today",
    "type": "note",
    "tags": ["vivim", "learning"],
    "authorId": "did:vivim:xyz789",
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-15T10:30:00Z"
  }
}
```

---

## 🗄️ Database

### Schema Overview

```prisma
// Simplified Prisma Schema

model User {
  id            String    @id @default(cuid())
  did           String    @unique
  publicKey     String
  displayName   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  memories      Memory[]
  content       Content[]
  conversations ConversationParticipant[]
}

model Memory {
  id            String    @id @default(cuid())
  content       String
  type          MemoryType
  tags          String[]
  authorId      String
  author        User      @relation(fields: [authorId], references: [did])
  acuScore      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([authorId])
  @@index([type])
}

model Content {
  id            String    @id @default(cuid())
  cid           String    @unique
  type          ContentType
  text          String?
  media         Json?
  authorId      String
  author        User      @relation(fields: [authorId], references: [did])
  visibility    Visibility
  tags          String[]
  createdAt     DateTime  @default(now())
  
  @@index([authorId])
  @@index([cid])
}
```

### Connection String

```bash
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/vivim?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"
```

---

## 🔐 Authentication

### JWT Configuration

```typescript
// JWT settings
{
  secret: process.env.JWT_SECRET,
  expiresIn: '7d',
  issuer: 'vivim-app'
}
```

### OAuth Providers

| Provider | Status | Endpoint |
|----------|--------|----------|
| Google | ✅ Available | `/auth/google` |
| GitHub | 📝 Planned | - |
| Discord | 📝 Planned | - |

### Session Management

```typescript
// Session configuration
{
  store: 'redis',
  ttl: 60 * 60 * 24 * 7, // 7 days
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  }
}
```

---

## 📁 Project Structure

```
server/
├── src/
│   ├── routes/                # API routes
│   │   ├── users.ts
│   │   ├── memories.ts
│   │   ├── content.ts
│   │   ├── conversations.ts
│   │   ├── circles.ts
│   │   ├── acus.ts
│   │   ├── sync.ts
│   │   ├── feed.ts
│   │   └── ai.ts
│   │
│   ├── services/              # Business logic
│   │   ├── userService.ts
│   │   ├── memoryService.ts
│   │   ├── contentService.ts
│   │   ├── authService.ts
│   │   ├── aiService.ts
│   │   └── networkService.ts
│   │
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   ├── errorHandler.ts
│   │   ├── requestLogger.ts
│   │   └── requestId.ts
│   │
│   ├── lib/                   # Utilities
│   │   ├── database.ts        # Prisma client
│   │   ├── redis.ts           # Redis client
│   │   ├── logger.ts          # Pino logger
│   │   └── config.ts          # Configuration
│   │
│   └── server.js              # Main entry point
│
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed data
│
├── package.json
└── tsconfig.json
```

---

## 🤝 Contributing

### Development Setup

```bash
# Clone and navigate
cd server

# Install dependencies
bun install

# Set up environment
cp .env.example .env

# Generate Prisma client
bun run db:generate

# Start development
bun run dev
```

### Environment Variables

```bash
# Server
PORT=3333
NODE_ENV=development

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# AI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📜 License

MIT License - see [LICENSE](../LICENSE) for details.

---

<div align="center">

**Built with ❤️ by the VIVIM Team**

[⬆ Back to top](#vivim-server) | [🏠 Back to Main Repo](../README.md) | [📚 Back to Docs](./README.md)

</div>
