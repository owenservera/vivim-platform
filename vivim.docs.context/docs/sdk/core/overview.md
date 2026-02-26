---
sidebar_position: 2
---

# Core SDK

The VIVIM SDK Core provides the foundation for all nodes and applications in the VIVIM ecosystem.

## Installation

```bash
bun add @vivim/sdk
```

## Quick Start

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  identity: {
    did: 'my-node-' + Math.random().toString(36).slice(2, 9),
    autoCreate: true,
  },
  network: {
    bootstrapNodes: ['https://bootstrap.vivim.live'],
    enableP2P: true,
  },
  storage: {
    defaultLocation: 'local',
    encryption: true,
  },
  nodes: {
    autoLoad: true,
  },
});

await sdk.initialize();
```

## VivimSDK Class

### Constructor

```typescript
class VivimSDK {
  constructor(config?: VivimSDKConfig)
}
```

### Configuration

```typescript
interface VivimSDKConfig {
  identity?: {
    did?: string;
    seed?: Uint8Array;
    autoCreate?: boolean;
  };
  
  network?: {
    bootstrapNodes?: string[];
    relays?: string[];
    listenAddresses?: string[];
    enableP2P?: boolean;
  };
  
  storage?: {
    defaultLocation?: 'local' | 'ipfs' | 'filecoin';
    ipfsGateway?: string;
    encryption?: boolean;
  };
  
  nodes?: {
    autoLoad?: boolean;
    registries?: string[];
    trustedPublishers?: string[];
  };
  
  extensions?: {
    autoLoad?: boolean;
    directories?: string[];
    registries?: string[];
  };
}
```

### Properties

```typescript
class VivimSDK {
  // Core Module Instances
  public readonly recordKeeper: OnChainRecordKeeper;
  public readonly anchor: AnchorProtocol;
  public readonly selfDesign: SelfDesignModule;
  public readonly assistant: VivimAssistantRuntime;
  
  // Identity (after initialization)
  public identity: Identity | null;
  
  // Initialization status
  public initialized: boolean;
}
```

### Methods

#### initialize()

Initializes the SDK and creates identity if configured.

```typescript
await sdk.initialize();
```

#### loadNode()

Load a node by ID.

```typescript
async loadNode<T>(nodeId: string): Promise<T>;

// Example
const storageNode = await sdk.loadNode<StorageNode>('storage');
```

#### registerNode()

Register a custom node definition.

```typescript
async registerNode(definition: APINodeDefinition): Promise<string>;

// Example
const nodeId = await sdk.registerNode({
  id: 'my-custom-node',
  name: 'My Custom Node',
  version: '1.0.0',
  // ... node definition
});
```

#### unloadNode()

Unload a node.

```typescript
async unloadNode(nodeId: string): Promise<void>;
```

#### destroy()

Clean up and destroy the SDK instance.

```typescript
await sdk.destroy();
```

### Core Module Accessors

#### getRecordKeeper()

Get the Record Keeper instance for on-chain operation recording.

```typescript
getRecordKeeper(): OnChainRecordKeeper;

// Usage
const rk = sdk.getRecordKeeper();
const operation = await rk.recordOperation({...});
```

#### getAnchorProtocol()

Get the Anchor Protocol instance for state anchoring.

```typescript
getAnchorProtocol(): AnchorProtocol;

// Usage
const anchor = sdk.getAnchorProtocol();
const state = await anchor.getState();
```

#### getSelfDesign()

Get the Self-Design module instance.

```typescript
getSelfDesign(): SelfDesignModule;

// Usage
const sd = sdk.getSelfDesign();
await sd.applyModification({...});
```

#### getAssistant()

Get the Assistant Runtime instance.

```typescript
getAssistant(): VivimAssistantRuntime;

// Usage
const assistant = sdk.getAssistant();
const context = await assistant.processContext({...});
```

## Identity Management

### Identity Interface

```typescript
interface Identity {
  did: string;                    // Decentralized Identifier (did:key)
  publicKey: string;              // Ed25519 public key (hex)
  keyType: 'Ed25519' | 'secp256k1';
  displayName?: string;
  avatar?: string;                // CID to avatar
  createdAt: number;
  verificationLevel: number;
}
```

### Creating Identity

```typescript
// Auto-create on initialize
const sdk = new VivimSDK({
  identity: {
    autoCreate: true,
  },
});
await sdk.initialize();
console.log(sdk.identity?.did); // "did:vivim:..."

// Or create manually with seed
import { generateKeyPair } from '@vivim/sdk/utils';

const seed = crypto.getRandomValues(new Uint8Array(32));
const sdk = new VivimSDK({
  identity: {
    seed,
    displayName: 'My Node',
  },
});
```

## RecordKeeper

The On-Chain RecordKeeper provides a cryptographic audit trail for all SDK operations.

### Operation Types

```typescript
type SDKOperationType =
  | 'node:create'
  | 'node:update'
  | 'node:delete'
  | 'node:register'
  | 'node:load'
  | 'extension:register'
  | 'extension:activate'
  | 'extension:deactivate'
  | 'config:update'
  | 'identity:create'
  | 'storage:store'
  | 'memory:create'
  | 'content:create'
  | 'social:follow'
  | 'circle:create';
```

### Recording Operations

```typescript
const rk = sdk.getRecordKeeper();

// Record an operation
const operation = await rk.recordOperation({
  type: 'node:create',
  author: sdk.identity.did,
  payload: {
    nodeId: 'my-node',
    nodeDefinition: {...},
  },
});

console.log('Operation ID:', operation.id); // CID
```

### Getting Operation History

```typescript
// Get all operations by author
const history = await rk.getOperationHistory(sdk.identity.did);

// Get operations by type
const nodeOps = await rk.getOperationsByType('node:create');

// Get operation by ID
const op = await rk.getOperation(operationId);
```

### Verifying Operations

```typescript
// Verify a single operation
const verified = await rk.verifyOperation(operationId);

// Verify entire operation chain
const chainVerified = await rk.verifyOperationChain(operationId);

// Get audit trail
const audit = await rk.getAuditTrail(sdk.identity.did);
```

## Anchor Protocol

The Anchor Protocol handles on-chain state anchoring and trust management.

### Trust Levels

```typescript
enum TrustLevel {
  GENESIS = 'genesis',         // Root anchor node
  BOOTSTRAP = 'bootstrap',     // Bootstrap/relay nodes
  PRIMARY = 'primary',         // Primary SDK instances
  SECONDARY = 'secondary',     // Verified clones
  UNVERIFIED = 'unverified',   // New/untrusted nodes
  SUSPENDED = 'suspended'      // Revoked trust
}
```

### Getting Anchor State

```typescript
const anchor = sdk.getAnchorProtocol();

// Get current state
const state = await anchor.getState();
console.log('DID:', state.did);
console.log('Trust Level:', state.trustLevel);
console.log('Merkle Root:', state.merkleRoot);
```

### Anchoring State

```typescript
// Anchor current state to chain
await anchor.anchorState();

// Get anchor history
const history = await anchor.getAnchorHistory();
```

### Trust Verification

```typescript
// Verify another node's trust
const verified = await anchor.verifyTrust('did:vivim:...');

// Get trust proofs
const proofs = await anchor.getTrustProofs('did:vivim:...');

// Add trust proof
await anchor.addTrustProof({
  type: 'attestation',
  issuer: sdk.identity.did,
  target: 'did:vivim:...',
  payload: { trustLevel: TrustLevel.PRIMARY },
});
```

## Self-Design Module

Enables self-modification and evolution capabilities.

### Applying Modifications

```typescript
const selfDesign = sdk.getSelfDesign();

// Apply a modification
await selfDesign.applyModification({
  type: 'node:add',
  nodeId: 'new-node',
  definition: {...},
});

// Other modification types
await selfDesign.applyModification({
  type: 'node:remove',
  nodeId: 'old-node',
});

await selfDesign.applyModification({
  type: 'config:update',
  key: 'network.bootstrapNodes',
  value: ['https://new-bootstrap.vivim.live'],
});
```

### Evolution History

```typescript
// Get evolution history
const history = await selfDesign.getEvolutionHistory();

// Get modifications by type
const nodeMods = await selfDesign.getModificationsByType('node:add');
```

## Assistant Runtime

AI assistant integration with context processing.

### Processing Context

```typescript
const assistant = sdk.getAssistant();

// Process context for a query
const context = await assistant.processContext({
  userId: 'user-123',
  query: 'What did I ask about yesterday?',
  options: {
    includeMemories: true,
    maxContextItems: 10,
  },
});
```

### Generating Responses

```typescript
// Generate response with context
const response = await assistant.generateResponse(context, {
  model: 'gpt-4',
  temperature: 0.7,
});

// Stream response
const stream = await assistant.streamResponse(context);
for await (const chunk of stream) {
  console.log(chunk);
}
```

## Events

The SDK extends EventEmitter and emits various events.

### Event Types

```typescript
enum SDK_EVENTS {
  NODE_LOADED = 'node:loaded',
  NODE_UNLOADED = 'node:unloaded',
  IDENTITY_CREATED = 'identity:created',
  OPERATION_RECORDED = 'operation:recorded',
  STATE_ANCHORED = 'state:anchored',
  ERROR = 'error',
  WARNING = 'warning',
}
```

### Listening for Events

```typescript
import { SDK_EVENTS } from '@vivim/sdk';

// Node events
sdk.on(SDK_EVENTS.NODE_LOADED, (nodeInfo) => {
  console.log('Node loaded:', nodeInfo);
});

// Identity events
sdk.on(SDK_EVENTS.IDENTITY_CREATED, (identity) => {
  console.log('Identity created:', identity.did);
});

// Error handling
sdk.on(SDK_EVENTS.ERROR, (error) => {
  console.error('SDK Error:', error);
});

// Operation events
sdk.on(SDK_EVENTS.OPERATION_RECORDED, (operation) => {
  console.log('Operation recorded:', operation.id);
});
```

## Error Handling

### Error Codes

```typescript
enum ERROR_CODES {
  SDK_NOT_INITIALIZED = 'SDK_NOT_INITIALIZED',
  NODE_NOT_FOUND = 'NODE_NOT_FOUND',
  NODE_LOAD_FAILED = 'NODE_LOAD_FAILED',
  IDENTITY_CREATION_FAILED = 'IDENTITY_CREATION_FAILED',
  OPERATION_RECORD_FAILED = 'OPERATION_RECORD_FAILED',
  ANCHOR_FAILED = 'ANCHOR_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}
```

### Handling Errors

```typescript
import { VivimSDK } from '@vivim/sdk';

try {
  const sdk = new VivimSDK();
  await sdk.initialize();
  const node = await sdk.loadNode('storage');
} catch (error) {
  if (error.code === ERROR_CODES.SDK_NOT_INITIALIZED) {
    console.error('SDK not initialized');
  } else if (error.code === ERROR_CODES.NODE_NOT_FOUND) {
    console.error('Node not found');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Examples

### Complete Setup Example

```typescript
import { VivimSDK } from '@vivim/sdk';

async function main() {
  // Create SDK instance
  const sdk = new VivimSDK({
    identity: {
      autoCreate: true,
      displayName: 'My First Node',
    },
    network: {
      bootstrapNodes: ['https://bootstrap.vivim.live'],
      enableP2P: true,
    },
    storage: {
      defaultLocation: 'local',
      encryption: true,
    },
    nodes: {
      autoLoad: true,
    },
  });

  // Initialize
  await sdk.initialize();
  console.log('SDK initialized with DID:', sdk.identity.did);

  // Access core modules
  const recordKeeper = sdk.getRecordKeeper();
  const anchor = sdk.getAnchorProtocol();
  
  // Get anchor state
  const state = await anchor.getState();
  console.log('Trust level:', state.trustLevel);

  // Load a node
  const storageNode = await sdk.loadNode('storage');
  
  // Save encrypted data
  await storageNode.save({
    key: 'my-first-data',
    value: { hello: 'world' },
    encrypt: true,
  });

  // Record the operation
  await recordKeeper.recordOperation({
    type: 'storage:store',
    author: sdk.identity.did,
    payload: { key: 'my-first-data' },
  });

  // Clean up
  await sdk.destroy();
}

main().catch(console.error);
```

## Related

- [API Nodes](../api-nodes/overview) - Available API nodes
- [Types](./types) - TypeScript type definitions
- [Examples](../examples/basic) - Code examples

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **NPM Package**: [@vivim/sdk](https://www.npmjs.com/package/@vivim/sdk)
