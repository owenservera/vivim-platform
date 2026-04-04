# VIVIM Capture Pipeline Analysis

**Purpose**: Deep analysis of data ingestion system for user isolation

---

## Current Flow

```
POST /api/v1/capture
  │
  ├─── 1. Authentication (API Key only - NO USER)
  │
  ├─── 2. Cache Check
  │         └─> prisma.conversation.findFirst(...)
  │
  ├─── 3. Create Capture Attempt
  │         └─> prisma.captureAttempt.create(...)
  │
  ├─── 4. Extract Conversation
  │         └─> Playwright/Puppeteer → Parse HTML → JSON
  │
  ├─── 5. Save to Database
  │         └─> storage-adapter.js → prismaCreate()
  │              │
  │              └──> prisma.conversation.create(...)
  │              └──> prisma.message.createMany(...)
  │
  └─── 6. Generate ACUs (async)
            └─> acu-generator.js
                 └──> prisma.atomicChatUnit.createMany(...)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/routes/capture.js` | HTTP entry point (449 lines) |
| `src/services/extractor.js` | HTML parsing |
| `src/services/storage-adapter.js` | Database persistence |
| `src/services/acu-generator.js` | ACU generation |
| `src/repositories/ConversationRepository.js` | Data access |

---

## Current Code Issues

### 1. No User Ownership on Capture
```javascript
// src/routes/capture.js Line 105
router.post('/capture', requireApiKey(), async (req, res) => {
  // API key auth only - NO user identity attached
  // Conversations have ownerId but it's not set during capture!
});
```

### 2. Single Global PrismaClient
```javascript
// src/services/storage-adapter.js Line 8
import { getPrismaClient } from '../lib/database.js';
// Always uses the same global client for all users
```

### 3. ACU Generator Uses Global Client
```javascript
// src/services/acu-generator.js Line 29
const savedConversation = await getPrismaClient().conversation.findUnique({...});
// No user context passed - uses global singleton
```

---

## Required Changes

### 1. Add User Authentication to Capture

**Current**:
```javascript
router.post('/capture', requireApiKey(), async (req, res) => {
```

**Target**:
```javascript
router.post('/capture', authenticateDID(), async (req, res) => {
  const userDid = req.user.did; // Get user from DID auth
```

### 2. Route to User Database

**Current**:
```javascript
const saveResult = await saveConversationUnified(conversation);
```

**Target**:
```javascript
const userDb = UserDatabaseManager.getClient(userDid);
const saveResult = await saveConversationUnified(conversation, userDb);
```

### 3. Update Storage Adapter

**Current**:
```javascript
export async function saveConversationUnified(conversation) {
  const savedConversation = await prismaCreate(conversation);
}
```

**Target**:
```javascript
export async function saveConversationUnified(conversation, client) {
  const db = client || getPrismaClient();
  const savedConversation = await prismaCreate(conversation, db);
}
```

### 4. Update Repository Pattern

**Current**:
```javascript
// src/repositories/ConversationRepository.js
import { getPrismaClient } from '../lib/database.js';

export async function createConversation(data) {
  return withTransaction(async (tx) => {
    // Uses global client
  });
}
```

**Target**:
```javascript
export async function createConversation(data, client) {
  const db = client || getPrismaClient();
  return db.$transaction(async (tx) => {
    // Uses provided client
  });
}
```

---

## Implementation Priority

| Order | Task | Files to Modify |
|-------|------|-----------------|
| 1 | Add user authentication | `src/routes/capture.js` |
| 2 | Update storage adapter signature | `src/services/storage-adapter.js` |
| 3 | Pass client through ACU generator | `src/services/acu-generator.js` |
| 4 | Update repositories | `src/repositories/*.js` |

---

## Data That Will Move to User DB

- `conversations` table
- `messages` table
- `atomic_chat_units` table
- `capture_attempts` (per-user tracking)

---

*Created: 2026-02-14*
