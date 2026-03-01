---
title: Development Guide
description: Getting Started with VIVIM Development
---

# Development Guide

This guide covers how to set up and develop VIVIM locally.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Bun | ≥1.0 | JavaScript runtime |
| Node.js | ≥20 | For network module |
| PostgreSQL | ≥14 | Database |
| Redis | ≥7 | Cache & pub/sub |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/vivim/vivim-app.git
cd vivim-app

# Install dependencies
bun run setup

# Start all services
bun run dev

# Or start individually
bun run dev:pwa     # Frontend (http://localhost:5173)
bun run dev:server  # API (http://localhost:3000)
bun run dev:network # Network engine
bun run dev:admin  # Admin panel (http://localhost:5174)
```

## Project Structure

```
vivim-app/
├── pwa/              # Frontend application
├── server/           # API server
├── network/          # P2P network engine
├── admin-panel/      # Admin dashboard
├── common/          # Shared utilities
└── vivim.docs.context/ # Documentation
```

## Environment Variables

### Server

```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/vivim
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-secret-here

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI Providers (optional)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

### PWA

```bash
# .env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## Database Setup

```bash
# Generate Prisma client
cd server && bun run db:generate

# Run migrations
cd server && bun run db:migrate

# Seed with sample data
cd server && bun run db:seed
```

## Development Workflow

```mermaid
flowchart LR
    CODE[Write Code] --> TEST[Run Tests]
    TEST --> LINT[Lint]
    LINT --> BUILD[Build]
    BUILD --> COMMIT[Commit]
```

### Running Tests

```bash
# All tests
bun run test

# PWA tests
cd pwa && bun run test

# Server tests
cd server && bun run test

# Network tests
cd network && bun run test
```

### Linting

```bash
# Lint all
bun run lint

# Fix auto-fixable issues
bun run lint:fix
```

## Key Technologies

### Frontend Stack

- **React 19** - UI framework
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **Zustand** - State management
- **TanStack Query** - Server state
- **Dexie** - IndexedDB wrapper
- **React Router 7** - Routing

### Backend Stack

- **Express.js** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Redis** - Cache
- **Socket.IO** - WebSockets
- **Pino** - Logging

### Network Stack

- **libp2p** - P2P networking
- **Yjs** - CRDT synchronization
- **kad-dht** - Distributed hash table
- **Gossipsub** - PubSub

## Common Tasks

### Adding a New API Endpoint

```javascript
// server/src/routes/my-feature.js
import { Router } from 'express';
const router = Router();

router.get('/items', async (req, res) => {
  const items = await getItems();
  res.json({ data: items });
});

export { router };
```

Register in `server.js`:
```javascript
import { router as myFeatureRouter } from './routes/my-feature.js';
app.use('/api/v1/my-feature', myFeatureRouter);
```

### Adding a New Page

```tsx
// pwa/src/pages/MyPage.tsx
export default function MyPage() {
  return <div>My New Page</div>;
}
```

Add route in `routes.tsx`:
```tsx
{
  path: "/my-page",
  element: <MyPage />
}
```

### Database Schema Changes

```bash
# 1. Edit prisma/schema.prisma

# 2. Create migration
cd server
bunx prisma migrate dev --name my_migration

# 3. Regenerate client
bun run db:generate
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check PostgreSQL
pg_isready -h localhost -p 5432

# Reset database
cd server && bun run db:push --force-reset
```

### Build Errors

```bash
# Clear all caches
rm -rf pwa/node_modules/.vite
rm -rf server/node_modules/.cache

# Reinstall
bun run setup
```

## Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** rules
- Use **Prettier** for formatting
- Write **tests** for new features

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `my-feature.ts` |
| Components | PascalCase | `MyComponent.tsx` |
| Functions | camelCase | `getUserData()` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Interfaces | PascalCase | `UserData` |
