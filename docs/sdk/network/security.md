---
sidebar_position: 4
---

# Network Security

Security best practices for VIVIM SDK network operations.

## Encryption

### Data at Rest

```typescript
import { StorageNode } from '@vivim/sdk/nodes';

const storageNode = await sdk.loadNode('storage');

// Encrypt before storing
await storageNode.store(sensitiveData, {
  encryption: true,
  visibility: 'private',
});

// Data is automatically decrypted on retrieve
const data = await storageNode.retrieve(cid);
```

### Data in Transit

```typescript
// P2P connections use encrypted transports by default
const sdk = new VivimSDK({
  network: {
    enableP2P: true,
    // WebRTC connections are encrypted
    // WebSocket connections use WSS
  },
});
```

## Key Management

### Key Rotation

```typescript
import { KeyManager } from '@vivim/sdk/core';

const keyManager = new KeyManager();

// Generate new keypair
const newKeys = await keyManager.generateKey();

// Rotate keys
await keyManager.rotateKeys({
  oldKey: currentKey,
  newKey: newKeys,
  reEncrypt: true, // Re-encrypt existing data
});
```

### Key Storage

```typescript
// Secure key storage options
const options = {
  // Option 1: Environment variable
  seed: new TextEncoder().encode(process.env.SDK_SEED),
  
  // Option 2: Hardware wallet
  hardwareWallet: 'ledger',
  
  // Option 3: Encrypted file
  encryptedFile: './keys.enc',
  password: process.env.KEY_PASSWORD,
};
```

## Access Control

### Capability-Based Access

```typescript
import { SocialNode } from '@vivim/sdk/nodes';

const socialNode = await sdk.loadNode('social');

// Set access control
await socialNode.setACL(circleId, {
  owner: sdk.getIdentity().did,
  read: ['did:vivim:friend1', 'did:vivim:friend2'],
  write: ['did:vivim:owner'],
  public: false,
});

// Check permissions
const canRead = await socialNode.checkPermission(
  circleId,
  'read',
  'did:vivim:user'
);
```

### Role-Based Access

```typescript
interface AccessPolicy {
  roles: {
    admin: ['read', 'write', 'delete', 'admin'];
    member: ['read', 'write'];
    guest: ['read'];
  };
  assignments: {
    'did:vivim:admin1': 'admin';
    'did:vivim:member1': 'member';
  };
}

const policy: AccessPolicy = {
  roles: {
    admin: ['read', 'write', 'delete', 'admin'],
    member: ['read', 'write'],
    guest: ['read'],
  },
  assignments: {
    [adminDid]: 'admin',
    [memberDid]: 'member',
  },
};
```

## Trust Verification

### Verify Identities

```typescript
import { verifySignature } from '@vivim/sdk/utils';

// Verify message signature
const valid = await verifySignature(
  message,
  signature,
  senderDid // or publicKey
);

if (!valid) {
  throw new Error('Invalid signature');
}
```

### Verify Operations

```typescript
import { OnChainRecordKeeper } from '@vivim/sdk/core';

const rk = sdk.getRecordKeeper();

// Verify operation chain
const result = await rk.verifyOperationChain(operationId);

if (!result.valid) {
  console.error('Chain verification failed:', result.errors);
}
```

### Trust Levels

```typescript
import { TrustLevel } from '@vivim/sdk/core';

const anchor = sdk.getAnchorProtocol();
const state = await anchor.getState();

// Check trust level
switch (state.trustLevel) {
  case TrustLevel.GENESIS:
  case TrustLevel.BOOTSTRAP:
  case TrustLevel.PRIMARY:
    // Trusted - proceed
    break;
  case TrustLevel.SECONDARY:
    // Verified clone - proceed with caution
    break;
  case TrustLevel.UNVERIFIED:
    // Untrusted - require additional verification
    await requireChallenge();
    break;
  case TrustLevel.SUSPENDED:
    // Revoked - reject
    throw new Error('Trust suspended');
}
```

## Security Best Practices

### 1. Validate All Input

```typescript
import { z } from 'zod';

const storeSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
  encryption: z.boolean().optional(),
});

async function safeStore(data: unknown) {
  const validated = storeSchema.parse(data);
  return await storageNode.store(validated);
}
```

### 2. Use Least Privilege

```typescript
// ❌ Bad: Grant all permissions
await setPermissions(userDid, ['*']);

// ✅ Good: Grant only needed permissions
await setPermissions(userDid, ['storage:read', 'memory:write']);
```

### 3. Audit Operations

```typescript
const rk = sdk.getRecordKeeper();

// Record all sensitive operations
await rk.recordOperation('storage:store', {
  key: 'sensitive-data',
  accessLevel: 'confidential',
});

// Review audit trail
const audit = await rk.getAuditTrail(sdk.getIdentity().did);
```

### 4. Monitor for Anomalies

```typescript
// Set up monitoring
const monitor = new SecurityMonitor({
  thresholds: {
    maxRequestsPerMinute: 100,
    maxDataTransferPerHour: 1000000, // bytes
    suspiciousPatterns: ['repeated-failures', 'unusual-access'],
  },
  alerts: {
    onThreshold: 'warn',
    onSuspicious: 'alert',
  },
});

monitor.start();
```

## Related

- [Network Protocols](./protocols) - P2P protocols
- [Core SDK](../core/overview) - Security modules
