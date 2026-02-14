# VIVIM Context Engine Analysis

**Purpose**: Deep analysis of the Dynamic Context system for user isolation

---

## Current Architecture

```
USER REQUEST                    CONTEXT ORCHESTRATOR                DATABASE
   │                                  │                                │
   │  assembleContext(userId,        │                                │
   │                   conversationId,│                                │
   │                   message)      │                                │
   │                                  │                                │
   ├─────────────────────────────────▶│                                │
   │                                  │                                │
   │                                  ├──▶ prisma.topicProfile.findMany
   │                                  ├──▶ prisma.entityProfile.findMany
   │                                  ├──▶ prisma.contextBundle.findMany
   │                                  ├──▶ prisma.conversation.findMany
   │                                  │         (ALL USING SINGLE
   │                                  │          PRISMACLIENT)       │
   │                                  │                                │
   │                                  ├──▶ BundleCompiler.compile()
   │                                  │         (LLM-powered)
   │                                  │                                │
   │                                  ├──▶ prisma.contextBundle.create()
   │                                  │                                │
   ├──────────────────────────────────┤                                │
   │   Compiled Context               │                                │
```

---

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/context/context-orchestrator.ts` | Main orchestration | 200+ |
| `src/context/context-assembler.ts` | Context assembly | - |
| `src/context/bundle-compiler.ts` | Bundle compilation | - |
| `src/services/profile-rollup-service.ts` | Profile computation | - |
| `src/services/unified-context-service.ts` | Context service | - |
| `src/context/settings-integration.ts` | Settings integration | 150 |

---

## Current Code Issues

### 1. Single PrismaClient for All Users
```typescript
// src/context/settings-integration.ts Line 27
constructor(prisma: PrismaClient, llmService: ILLMService) {
  this.prisma = prisma;  // ← ONE CLIENT SHARED BY EVERYONE
  this.settingsService = new ContextSettingsService({ prisma });
  this.bundleCompiler = new BundleCompiler({ prisma });
}
```

### 2. UserId Passed as Parameter, Not Used for Routing
```typescript
// src/context/context-orchestrator.ts Line 28
async ingestPresence(userId: string, presence: ClientPresenceState): Promise<void> {
  // userId is used for queries but data is all in same DB
  await this.prisma.clientPresence.upsert({ where: { userId_deviceId: { userId, ... }}});
}
```

### 3. ContextAssembler Uses Global Client
```typescript
// Similar pattern throughout - userId filters data but all in one DB
const topicProfiles = await this.prisma.topicProfile.findMany({
  where: { userId }  // Only isolation is query filtering
});
```

---

## Key Insight: 100% Isolated Per User

Your requirement is that the **context engine is 100% isolated per user** - no shared service. This means:

1. **Each user has their own context engine instance**
2. **Each instance connects only to that user's database**
3. **User owns their intelligence** - profiles, bundles, learned data

---

## Required Changes

### 1. Create Per-User Context Engine

```typescript
// NEW: IsolatedContextEngine class
class IsolatedContextEngine {
  
  constructor(userDid: string) {
    this.userDid = userDid;
    this.userDb = UserDatabaseManager.getClient(userDid);
    
    // Each user gets their OWN service instances
    this.settingsService = new ContextSettingsService({ 
      prisma: this.userDb 
    });
    this.bundleCompiler = new BundleCompiler({
      prisma: this.userDb,  // Points to USER's database
      tokenEstimator: this.tokenEstimator,
      llmService: this.llmService
    });
  }
  
  async compileContext(request) {
    // Reads ONLY from user's database
    const profiles = await this.userDb.topicProfile.findMany({
      where: { userId: this.userDid }
    });
    
    // Writes ONLY to user's database
    const bundle = await this.userDb.contextBundle.create({
      data: { userId: this.userDid, ... }
    });
    
    return bundle;
  }
}
```

### 2. Update ContextAssembler

```typescript
// Current
class ContextAssembler {
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
}

// Target
class ContextAssembler {
  constructor(userDid: string, client: PrismaClient) {
    this.userDid = userDid;
    this.client = client;  // User-specific client
  }
}
```

### 3. Update ProfileRollupService

```typescript
// Current - uses global client
export async function rollupProfiles(userId: string, limit?: number) {
  const profiles = await prisma.topicProfile.findMany({ where: { userId }});
}

// Target - uses user-specific client
export async function rollupProfiles(userId: string, client: PrismaClient, limit?: number) {
  const profiles = await client.topicProfile.findMany({ where: { userId }});
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/context/context-orchestrator.ts` | Accept userId, create isolated instances |
| `src/context/context-assembler.ts` | Accept userDid + client parameter |
| `src/context/settings-integration.ts` | Accept userId, route to user DB |
| `src/context/bundle-compiler.ts` | Accept client parameter |
| `src/services/profile-rollup-service.ts` | Accept client parameter |
| `src/services/unified-context-service.ts` | Accept userDid, use user DB |

---

## Data That Will Move to User DB

- `topic_profiles` - User's learned topics
- `entity_profiles` - User's learned entities
- `context_bundles` - Compiled context
- `memories` - User's memories
- `notebooks` - User's notebooks
- `notebook_entries` - Notebook contents
- `ai_personas` - Custom AI personas
- `custom_instructions` - User instructions
- `client_presence` - User's device state
- `sync_cursors` - User's sync state
- `user_facts` - User's facts
- `user_context_settings` - User's preferences

---

## Implementation Pattern

```typescript
// How to get isolated context for a user
async function handleUserContextRequest(req, res) {
  const userDid = req.user.did;
  
  // Get user's isolated context engine
  const contextEngine = new IsolatedContextEngine(userDid);
  
  // Now all operations are isolated to this user
  const context = await contextEngine.compileContext({
    conversationId: req.body.conversationId,
    message: req.body.message
  });
  
  res.json(context);
}
```

---

*Created: 2026-02-14*
