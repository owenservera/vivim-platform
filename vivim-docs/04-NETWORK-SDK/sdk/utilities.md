---
sidebar_position: 6
---

# Utilities

The VIVIM SDK provides utility functions for cryptography, logging, and common operations.

## Cryptography

### Generate Key Pair

```typescript
import { generateKeyPair } from '@vivim/sdk/utils';

// Generate random key pair
const { publicKey, privateKey } = await generateKeyPair();

// Generate from seed (deterministic)
const seed = crypto.getRandomValues(new Uint8Array(32));
const { publicKey, privateKey } = await generateKeyPair(seed);
```

### DID Conversion

```typescript
import { publicKeyToDID, didToPublicKey } from '@vivim/sdk/utils';

// Convert public key to DID
const did = publicKeyToDID(publicKey);
console.log('DID:', did);  // "did:key:z6Mk..."

// Extract public key from DID
const publicKey = didToPublicKey(did);
```

### Sign and Verify

```typescript
import { signData, verifySignature } from '@vivim/sdk/utils';

const data = { message: 'Hello, World!' };

// Sign data
const signature = await signData(data, privateKey);
console.log('Signature:', signature);

// Verify with public key
const valid = await verifySignature(data, signature, publicKey);
console.log('Valid:', valid);  // true

// Verify with DID
const valid = await verifySignature(data, signature, did);
console.log('Valid:', valid);  // true
```

### Calculate CID

```typescript
import { calculateCID } from '@vivim/sdk/utils';

const data = { content: 'My content' };

// Calculate content identifier
const cid = await calculateCID(data);
console.log('CID:', cid);  // "bafy..."

// Same data produces same CID
const cid2 = await calculateCID(data);
console.log('Same CID:', cid === cid2);  // true
```

### Complete Crypto Example

```typescript
import { 
  generateKeyPair, 
  publicKeyToDID, 
  signData, 
  verifySignature,
  calculateCID 
} from '@vivim/sdk/utils';

async function cryptoExample() {
  // Generate identity
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const { publicKey, privateKey } = await generateKeyPair(seed);
  
  // Create DID
  const did = publicKeyToDID(publicKey);
  console.log('Created DID:', did);
  
  // Sign message
  const message = { action: 'transfer', amount: 100 };
  const signature = await signData(message, privateKey);
  console.log('Signature:', signature);
  
  // Verify signature
  const valid = await verifySignature(message, signature, did);
  console.log('Signature valid:', valid);
  
  // Calculate CID for data
  const data = { record: 'important-data', timestamp: Date.now() };
  const cid = await calculateCID(data);
  console.log('Data CID:', cid);
}

cryptoExample();
```

## Logger

The SDK includes a built-in logger with configurable levels.

### Basic Usage

```typescript
import { getLogger } from '@vivim/sdk/utils';

const logger = getLogger();

logger.info('Application started');
logger.warn('Low disk space');
logger.error('Connection failed');
logger.debug('Debug info', { details: 'verbose data' });
```

### Logger Levels

```typescript
import { setLogger, Logger } from '@vivim/sdk/utils';

// Create logger with specific level
const logger = new Logger({
  level: 'debug',      // debug | info | warn | error
  prefix: 'MyApp',
  timestamps: true,
});

// Set as global logger
setLogger(logger);

// Now all SDK logs use this logger
logger.info('Custom logger active');
```

### Module Loggers

```typescript
import { createModuleLogger } from '@vivim/sdk/utils';

// Create logger for specific module
const storageLogger = createModuleLogger('storage');
const networkLogger = createModuleLogger('network');

storageLogger.info('Storage initialized');
// Output: [VIVIM:storage:INFO] Storage initialized

networkLogger.warn('Connection unstable');
// Output: [VIVIM:network:WARN] Connection unstable
```

### Logger Configuration

```typescript
import { Logger } from '@vivim/sdk/utils';

const logger = new Logger({
  level: 'info',           // Minimum log level
  prefix: 'VIVIM:SDK',     // Log prefix
  timestamps: true,        // Include timestamps
});

// Change level dynamically
logger.setLevel('debug');  // Now shows debug logs

// Create child logger
const childLogger = logger.child('Storage');
// Prefix becomes: [VIVIM:SDK:Storage]
```

### Output Format

```
[2026-02-26T12:00:00.000Z] [VIVIM:INFO] Application started
[2026-02-26T12:00:01.000Z] [VIVIM:WARN] Low disk space {"available": "1GB"}
[2026-02-26T12:00:02.000Z] [VIVIM:ERROR] Connection failed {"host": "localhost"}
[2026-02-26T12:00:03.000Z] [VIVIM:DEBUG] Debug info {"details": "verbose data"}
```

### Debug Mode

```typescript
// Enable debug mode via environment
process.env.DEBUG = 'true';

import { getLogger } from '@vivim/sdk/utils';
const logger = getLogger();

// Debug logs now show
logger.debug('This will be visible');
```

### Complete Logger Example

```typescript
import { VivimSDK } from '@vivim/sdk';
import { Logger, setLogger, createModuleLogger } from '@vivim/sdk/utils';

// Create custom logger
const appLogger = new Logger({
  level: 'debug',
  prefix: 'MyApp',
  timestamps: true,
});

// Set as global
setLogger(appLogger);

// Create module loggers
const sdkLogger = createModuleLogger('SDK');
const storageLogger = createModuleLogger('Storage');
const networkLogger = createModuleLogger('Network');

// Initialize SDK with logging
sdkLogger.info('Initializing SDK');

const sdk = new VivimSDK();
await sdk.initialize();

sdkLogger.info('SDK initialized', { did: sdk.identity.did });

// Use module loggers
storageLogger.info('Loading storage node');
const storageNode = await sdk.loadNode('storage');
storageLogger.info('Storage node loaded');

networkLogger.info('Connecting to network');
// ... network operations
```

## ID Generation

```typescript
import { generateId } from '@vivim/sdk/utils';

// Generate unique ID
const id = generateId();
console.log('ID:', id);  // e.g., "msg_abc123xyz"

// Use for message IDs, operation IDs, etc.
const messageId = generateId();
const operationId = generateId();
```

## Encoding

```typescript
import { bytesToHex, hexToBytes } from '@vivim/sdk/utils';

// Convert bytes to hex
const bytes = new Uint8Array([0x01, 0x02, 0x03]);
const hex = bytesToHex(bytes);
console.log('Hex:', hex);  // "010203"

// Convert hex to bytes
const bytes = hexToBytes('010203');
console.log('Bytes:', bytes);  // Uint8Array [1, 2, 3]
```

## Complete Utilities Example

```typescript
import { VivimSDK } from '@vivim/sdk';
import { 
  generateKeyPair, 
  publicKeyToDID, 
  signData, 
  verifySignature,
  calculateCID,
  generateId,
  getLogger,
  Logger,
  setLogger 
} from '@vivim/sdk/utils';

async function utilitiesExample() {
  // Setup logging
  const logger = new Logger({
    level: 'debug',
    prefix: 'Demo',
    timestamps: true,
  });
  setLogger(logger);
  
  logger.info('Starting utilities demo');
  
  // Generate identity
  logger.debug('Generating keypair...');
  const { publicKey, privateKey } = await generateKeyPair();
  const did = publicKeyToDID(publicKey);
  logger.info('Identity created', { did });
  
  // Sign and verify
  const message = { action: 'demo', timestamp: Date.now() };
  const signature = await signData(message, privateKey);
  logger.debug('Signature created', { signature });
  
  const valid = await verifySignature(message, signature, did);
  logger.info('Signature verification', { valid });
  
  // Calculate CID
  const data = { content: 'demo-data', id: generateId() };
  const cid = await calculateCID(data);
  logger.info('CID calculated', { cid });
  
  // Initialize SDK
  const sdk = new VivimSDK({ identity: { autoCreate: true } });
  await sdk.initialize();
  logger.info('SDK initialized', { did: sdk.identity.did });
}

utilitiesExample().catch(console.error);
```

## Related

- [Core SDK](./overview) - SDK fundamentals
- [Identity Node](../api-nodes/overview) - Identity operations

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **Source Code**: [github.com/vivim/vivim-sdk/tree/main/src/utils](https://github.com/vivim/vivim-sdk/tree/main/src/utils)
