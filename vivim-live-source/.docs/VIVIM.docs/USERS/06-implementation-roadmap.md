# VIVIM Implementation Roadmap

**Purpose**: Step-by-step guide for implementing user isolation

---

## Phase 1: Foundation (Week 1)

### Day 1-2: User Database Manager

**Create**: `src/lib/user-database-manager.js`

```javascript
import { PrismaClient } from '@prisma/client';
import { PrismaClient as PrismaClientSQLite } from '../node_modules/.prisma/client-sqlite/index.js';
import fs from 'fs';
import path from 'path';

const USER_DB_DIR = './data/users';

export class UserDatabaseManager {
  
  static getClient(userDid) {
    // Create/cache per-user PrismaClient
  }
  
  static getMasterClient() {
    // Return existing PostgreSQL client
  }
  
  static async createUserDatabase(userDid) {
    // Initialize new user's SQLite DB
  }
  
  static async deleteUserDatabase(userDid) {
    // Delete user's database (account deletion)
  }
}
```

**Test**: Basic CRUD operations per user

---

### Day 3-4: SQLite Schema

**Create**: `prisma/schema-user.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client-sqlite"
}

datasource db {
  provider = "sqlite"
  url      = env("USER_DATABASE_URL")
}

// User-scoped models only
model Conversation { ... }
model Message { ... }
model AtomicChatUnit { ... }
model TopicProfile { ... }
model EntityProfile { ... }
// ... all user models
```

**Generate**: `bunx prisma generate --schema=prisma/schema-user.prisma`

---

### Day 5: Integration Test

- Create test user
- Verify user DB created
- Basic CRUD in user DB

---

## Phase 2: Capture Pipeline (Week 2)

### Day 1-2: Update Capture Routes

**Modify**: `src/routes/capture.js`

1. Change authentication from API key to DID
2. Get userDid from authenticated request
3. Pass userDb to storage adapter

### Day 3: Update Storage Adapter

**Modify**: `src/services/storage-adapter.js`

```javascript
export async function saveConversationUnified(conversation, client) {
  const db = client || getPrismaClient();
  // Use provided client
}
```

### Day 4: Update ACU Generator

**Modify**: `src/services/acu-generator.js`

- Accept client parameter
- Pass through to all Prisma calls

### Day 5: Test Capture Flow

- Register test user
- Capture conversation
- Verify data in user's SQLite DB

---

## Phase 3: Context Engine (Week 3)

### Day 1-2: Refactor ContextOrchestrator

**Modify**: `src/context/context-orchestrator.ts`

```typescript
// OLD
constructor(prisma: PrismaClient) {
  this.prisma = prisma;
}

// NEW
constructor(userDid: string) {
  this.userDid = userDid;
  this.userDb = UserDatabaseManager.getClient(userDid);
}
```

### Day 3: Refactor ContextAssembler

**Modify**: `src/context/context-assembler.ts`

- Accept userDid parameter
- Use user-specific client

### Day 4: Refactor ProfileRollupService

**Modify**: `src/services/profile-rollup-service.ts`

- Accept client parameter
- Route all queries to user DB

### Day 5: Test Context Compilation

- Create context for test user
- Verify profiles in user's DB
- Verify bundles in user's DB

---

## Phase 4: Identity Integration (Week 4)

### Day 1-2: Update Identity Service

**Modify**: `src/services/identity-service.ts`

```typescript
async registerUser(did, publicKey) {
  // 1. Create in master DB
  const user = await masterDb.user.create({...});
  
  // 2. Create user database
  await UserDatabaseManager.createUserDatabase(did);
  
  return { user };
}
```

### Day 3: Update Auth Middleware

**Modify**: `src/middleware/auth.js`

- Return user context including database path
- Attach to request object

### Day 4: Update Routes

Update all routes to use user DB:
- `src/routes/conversations.js`
- `src/routes/feed.js`
- `src/routes/collections.js`
- etc.

### Day 5: Full Integration Test

- Register 2 users
- Each captures data
- Each compiles context
- Verify isolation

---

## Phase 5: Migration (Week 5)

### Day 1-2: Migrate Existing Data

For each existing user:
1. Create user database
2. Copy user data from master
3. Delete from master

### Day 3-4: Multi-User Testing

- Run with 3+ users simultaneously
- Verify no data leaks
- Performance testing

### Day 5: Optimization

- Connection pooling for SQLite
- Cache frequently accessed data
- Monitor performance

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `src/lib/user-database-manager.js` | User DB lifecycle |
| `prisma/schema-user.prisma` | SQLite schema |

### Modified Files
| File | Changes |
|------|---------|
| `src/routes/capture.js` | User auth, user DB routing |
| `src/services/storage-adapter.js` | Accept client param |
| `src/services/acu-generator.js` | Accept client param |
| `src/services/identity-service.ts` | Auto-create user DB |
| `src/middleware/auth.js` | Return routing info |
| `src/context/context-orchestrator.ts` | Per-user instance |
| `src/context/context-assembler.ts` | User DB routing |
| `src/context/settings-integration.ts` | User DB routing |
| `src/services/profile-rollup-service.ts` | Accept client param |
| `src/repositories/*.js` | Accept client param |

---

## Configuration

### Environment Variables
```bash
# Master Database (PostgreSQL)
MASTER_DATABASE_URL=postgresql://postgres:vivim1@localhost:5432/openscroll

# User Databases (SQLite)
USER_DB_DIR=./data/users

# Feature Flag
PER_USER_ISOLATION=true
```

---

## Testing Checklist

- [ ] Create user → DB auto-created
- [ ] Capture conversation → Goes to user DB
- [ ] Generate ACUs → In user DB
- [ ] Build context → In user DB
- [ ] User A cannot see User B data
- [ ] Delete user → DB deleted
- [ ] Multiple users simultaneously → Isolated

---

*Created: 2026-02-14*
