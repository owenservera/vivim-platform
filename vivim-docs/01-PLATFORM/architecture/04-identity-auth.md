# VIVIM Identity & Auth Analysis

**Purpose**: Analysis of authentication system for multi-user isolation

---

## Current Authentication Flow

```
USER REGISTRATION
  │
  ├─── 1. validateDID(did) - Check did:key:z... format
  │
  ├─── 2. Generate keypair (Ed25519)
  │
  ├─── 3. Create User in database
  │       └─> prisma.user.create({
  │             did, publicKey, handle, displayName
  │           })
  │
  └─── 4. Create default settings
          └─> prisma.userContextSettings.create({...})

AUTHENTICATION (DID Auth)
  │
  ├─── 1. Extract DID from header
  │
  ├─── 2. Validate DID format
  │
  ├─── 3. Resolve DID to public key
  │
  ├─── 4. Find or create user
  │       └─> identityService.getOrCreateUser(did, publicKey)
  │
  └─── 5. Attach user to request
```

---

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/services/identity-service.ts` | Core identity logic | 800+ |
| `src/middleware/auth.js` | Authentication middleware | - |
| `src/middleware/unified-auth.js` | Unified auth | - |
| `src/routes/identity-v2.js` | Identity API endpoints | 650+ |

---

## What Stays in Master Database

The identity/auth system needs to stay in the shared PostgreSQL master database because:

1. **User lookup** - System needs to find users by DID
2. **Cross-user relationships** - Circles, sharing need shared tables
3. **Device registry** - Users need to manage devices across sessions

### Tables That Stay in Master

- `users` - Identity anchor (DID, public key)
- `devices` - User's registered devices
- `circles` - Cross-user groupings
- `circle_members` - Circle membership
- `peer_connections` - P2P links
- `sharing_policies` - Cross-user access control

---

## Required Changes

### 1. Auto-Create User Database on Registration

```typescript
// src/services/identity-service.ts
export const identityService = {
  
  async registerUser(did, publicKey) {
    const masterDb = UserDatabaseManager.getMasterClient();
    
    // 1. Create identity in MASTER database
    const user = await masterDb.user.create({
      data: {
        did,
        publicKey,
        handle: generateHandle(),
        displayName: generateDisplayName(),
        status: 'ACTIVE'
      }
    });
    
    // 2. Initialize user's PRIVATE database
    await UserDatabaseManager.createUserDatabase(did);
    
    // 3. Return with user context for routing
    return {
      user,
      userDatabasePath: UserDatabaseManager.getDbPath(did)
    };
  },
  
  async getUserContext(did) {
    // Returns info needed to route requests to user's database
    return {
      did,
      databasePath: UserDatabaseManager.getDbPath(did)
    };
  }
};
```

### 2. Update Auth Middleware to Return Routing Info

```javascript
// src/middleware/auth.js
export async function authenticateDID(req, res, next) {
  const did = extractDID(req);
  
  // Validate DID
  if (!identityService.validateDID(did)) {
    return res.status(401).json({ error: 'Invalid DID' });
  }
  
  // Get user from master DB
  const user = await masterDb.user.findUnique({
    where: { did }
  });
  
  // Attach user + routing info to request
  req.user = {
    did: user.did,
    id: user.id,
    databasePath: UserDatabaseManager.getDbPath(user.did)  // NEW
  };
  
  next();
}
```

---

## Implementation Steps

| Order | Task | Files |
|-------|------|-------|
| 1 | Create UserDatabaseManager | `src/lib/user-database-manager.js` |
| 2 | Update identity service registration | `src/services/identity-service.ts` |
| 3 | Update auth middleware | `src/middleware/auth.js` |
| 4 | Update all routes to use user DB | Various |

---

## Data That Moves to User DB

Once user is authenticated, everything except identity goes to user DB:

- `user_context_settings` (but user stays in master)
- All other user data (see model classification)

---

*Created: 2026-02-14*
