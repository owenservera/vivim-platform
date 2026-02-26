---
sidebar_position: 1
---

# Core SDK

The VIVIM Core SDK provides the foundation for all nodes and applications in the VIVIM ecosystem.

## Installation

```bash
npm install @vivim/sdk
# or
bun add @vivim/sdk
```

## Quick Start

```typescript
import { VivimSDK } from '@vivim/sdk/core';

const sdk = new VivimSDK({
  identity: {
    autoCreate: true,
  },
  network: {
    bootstrapNodes: ['https://bootstrap.vivim.live'],
  },
  storage: {
    defaultLocation: 'local',
    encryption: true,
  },
});

await sdk.initialize();
```

## Configuration

### VivimSDKConfig

```typescript
interface VivimSDKConfig {
  // Identity configuration
  identity?: {
    did?: string;
    seed?: Uint8Array;
    autoCreate?: boolean;
  };

  // Network configuration
  network?: {
    bootstrapNodes?: string[];
    relays?: string[];
    listenAddresses?: string[];
  };

  // Storage configuration
  storage?: {
    defaultLocation?: 'local' | 'ipfs' | 'filecoin';
    ipfsGateway?: string;
    encryption?: boolean;
  };

  // Nodes configuration
  nodes?: {
    autoLoad?: boolean;
    registries?: string[];
    trustedPublishers?: string[];
  };
}
```

## Core API

### VivimSDK Class

#### Initialization

```typescript
// Initialize the SDK
await sdk.initialize();

// Wait for network connection
await sdk.waitForConnection();
```

#### Node Management

```typescript
// Load a node by ID
const storageNode = await sdk.loadNode<StorageNode>('storage');

// Register a custom node
const nodeId = await sdk.registerNode(customNodeDefinition);

// Unload a node
await sdk.unloadNode(nodeId);
```

#### Identity Management

```typescript
// Get current identity
const identity = sdk.identity.getCurrentIdentity();

// Create new identity
const newIdentity = await sdk.identity.create({
  seed: crypto.getRandomValues(new Uint8Array(32)),
});

// Export identity
const exported = await sdk.identity.export(identity);

// Import identity
const imported = await sdk.identity.import(exportedData, password);
```

## Core Modules

### Identity Manager

Handles decentralized identity (DID) creation and management.

```typescript
import { IdentityManager } from '@vivim/sdk/core';

const identityManager = new IdentityManager({
  autoCreate: true,
});

const identity = await identityManager.create();
console.log(identity.did); // "did:vivim:..."
```

### Network Graph

Manages the P2P network topology and node discovery.

```typescript
import { NetworkGraph } from '@vivim/sdk/core';

const graph = new NetworkGraph();

// Connect to peers
await graph.connect(peerAddresses);

// Discover nodes
const nodes = await graph.discover('storage');

// Get network stats
const stats = graph.getStats();
```

### Node Registry

Registers and manages available nodes.

```typescript
import { NodeRegistry } from '@vivim/sdk/core';

const registry = new NodeRegistry();

// Register a node
await registry.register(nodeDefinition);

// Get node by ID
const node = await registry.get('storage');

// List all nodes
const allNodes = registry.list();
```

## Types

### APINode

Base interface for all API nodes:

```typescript
interface APINode {
  id: string;
  version: string;
  capabilities: string[];
  
  initialize(config: NodeConfig): Promise<void>;
  destroy(): Promise<void>;
  getCapabilities(): string[];
}
```

### NodeDefinition

Definition for registering a node:

```typescript
interface NodeDefinition {
  id: string;
  name: string;
  version: string;
  type: 'api' | 'sdk' | 'network';
  schema: ZodSchema;
  factory: (config: NodeConfig) => APINode;
}
```

## Error Handling

```typescript
import { SDKError, NodeError, NetworkError } from '@vivim/sdk/core';

try {
  await sdk.loadNode('storage');
} catch (error) {
  if (error instanceof NodeError) {
    console.error('Node error:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Utilities

### Cryptography

```typescript
import { crypto } from '@vivim/sdk/core';

// Generate keypair
const keypair = await crypto.generateKeyPair();

// Sign data
const signature = await crypto.sign(data, keypair.privateKey);

// Verify signature
const valid = await crypto.verify(data, signature, keypair.publicKey);

// Hash data
const hash = await crypto.hash(data);
```

### Encoding

```typescript
import { encoding } from '@vivim/sdk/core';

// Encode to base64
const base64 = encoding.toBase64(data);

// Decode from base64
const decoded = encoding.fromBase64(base64);

// CID encoding
const cid = encoding.toCID(data);
```

## Examples

### Basic Node Creation

```typescript
import { APINode, NodeConfig } from '@vivim/sdk/core';
import { z } from 'zod';

class MyCustomNode implements APINode {
  id = 'my-custom-node';
  version = '1.0.0';
  capabilities = ['custom-operation'];

  private config?: NodeConfig;

  async initialize(config: NodeConfig) {
    this.config = config;
    console.log('Node initialized');
  }

  async destroy() {
    console.log('Node destroyed');
  }

  getCapabilities() {
    return this.capabilities;
  }

  async customOperation(data: any) {
    // Custom logic here
    return { success: true, data };
  }
}

// Register the node
await sdk.registerNode({
  id: 'my-custom-node',
  name: 'My Custom Node',
  version: '1.0.0',
  type: 'api',
  schema: z.object({}),
  factory: (config) => new MyCustomNode(),
});
```

## Related

- [API Nodes](../api-nodes/overview) - Official API nodes
- [SDK Nodes](../sdk-nodes/overview) - Framework adapters
- [Network](../network/overview) - P2P networking
- [Examples](../examples/basic) - Code examples

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **Issues**: [Report a bug](https://github.com/vivim/vivim-sdk/issues)
- **NPM Package**: [@vivim/sdk](https://www.npmjs.com/package/@vivim/sdk)
