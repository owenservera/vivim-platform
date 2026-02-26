---
sidebar_position: 5
---

# Getting Started Guide

This guide will walk you through setting up and using the VIVIM SDK in your projects.

## Prerequisites

- **Node.js** >= 20.0.0 or **Bun** >= 1.0.0
- **TypeScript** >= 5.0.0 (optional but recommended)
- A code editor (VS Code recommended)

## Installation

### Using npm

```bash
npm install @vivim/sdk
```

### Using Bun

```bash
bun add @vivim/sdk
```

### Using yarn

```bash
yarn add @vivim/sdk
```

### Using pnpm

```bash
pnpm add @vivim/sdk
```

## Quick Start

### 1. Initialize the SDK

```typescript
import { VivimSDK } from '@vivim/sdk/core';

// Create SDK instance
const sdk = new VivimSDK({
  identity: {
    autoCreate: true, // Automatically create identity if not exists
  },
  network: {
    bootstrapNodes: ['https://bootstrap.vivim.live'],
  },
  storage: {
    defaultLocation: 'local',
    encryption: true,
  },
});

// Initialize
await sdk.initialize();

console.log('SDK initialized!');
console.log('DID:', sdk.identity.getDID());
```

### 2. Load and Use Nodes

```typescript
// Load the storage node
const storageNode = await sdk.loadNode('storage');

// Save data
await storageNode.save({
  key: 'my-first-data',
  value: {
    message: 'Hello, VIVIM!',
    timestamp: Date.now(),
  },
  encrypt: true,
});

// Load data
const data = await storageNode.load('my-first-data');
console.log('Loaded data:', data);

// Load the identity node
const identityNode = await sdk.loadNode('identity');

// Sign data
const signature = await identityNode.sign(data);
console.log('Signature:', signature);

// Verify signature
const valid = await identityNode.verify(data, signature);
console.log('Signature valid:', valid);
```

### 3. Use AI Chat

```typescript
// Load the AI chat node
const chatNode = await sdk.loadNode('ai-chat');

// Configure with your API key
await chatNode.configure({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
});

// Send a message
const response = await chatNode.send({
  message: 'What is VIVIM?',
  context: {
    includeMemories: true,
    maxContextItems: 5,
  },
});

console.log('AI Response:', response.content);
```

### 4. Save Memories

```typescript
// Load the memory node
const memoryNode = await sdk.loadNode('memory');

// Save a memory
await memoryNode.save({
  type: 'conversation',
  content: 'User asked about VIVIM SDK',
  metadata: {
    timestamp: Date.now(),
    tags: ['sdk', 'question', 'getting-started'],
  },
});

// Search memories
const results = await memoryNode.search('VIVIM SDK', {
  limit: 10,
});

console.log('Related memories:', results);
```

## Framework Integration

### React

```tsx
import { VivimProvider, useSDK, useNode } from '@vivim/sdk-react';

function App() {
  return (
    <VivimProvider config={{
      identity: { autoCreate: true },
      network: { bootstrapNodes: ['https://bootstrap.vivim.live'] },
    }}>
      <Dashboard />
    </VivimProvider>
  );
}

function Dashboard() {
  const { sdk, connected } = useSDK();
  const storageNode = useNode('storage');

  const handleSave = async () => {
    await storageNode?.save({
      key: 'react-data',
      value: { from: 'React component' },
    });
  };

  return (
    <div>
      <h1>VIVIM Dashboard</h1>
      <p>Connected: {connected ? 'Yes' : 'No'}</p>
      <button onClick={handleSave}>Save Data</button>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { provideVivim, useSDK, useNode } from '@vivim/sdk-vue';

provideVivim({
  identity: { autoCreate: true },
  network: { bootstrapNodes: ['https://bootstrap.vivim.live'] },
});

const { sdk, connected } = useSDK();
const storageNode = useNode('storage');

const handleSave = async () => {
  await storageNode.value?.save({
    key: 'vue-data',
    value: { from: 'Vue component' },
  });
};
</script>

<template>
  <div>
    <h1>VIVIM Dashboard</h1>
    <p>Connected: {{ connected ? 'Yes' : 'No' }}</p>
    <button @click="handleSave">Save Data</button>
  </div>
</template>
```

### Svelte

```svelte
<script lang="ts">
  import { createVivim, useSDK, useNode } from '@vivim/sdk-svelte';

  createVivim({
    identity: { autoCreate: true },
    network: { bootstrapNodes: ['https://bootstrap.vivim.live'] },
  });

  const { sdk, connected } = useSDK();
  const storageNode = useNode('storage');

  const handleSave = async () => {
    await storageNode?.save({
      key: 'svelte-data',
      value: { from: 'Svelte component' },
    });
  };
</script>

<template>
  <div>
    <h1>VIVIM Dashboard</h1>
    <p>Connected: {$connected ? 'Yes' : 'No'}</p>
    <button on:click={handleSave}>Save Data</button>
  </div>
</template>
```

## Configuration Options

### Full Configuration Example

```typescript
const sdk = new VivimSDK({
  // Identity configuration
  identity: {
    did: 'did:vivim:...', // Optional: use existing identity
    seed: new Uint8Array(32), // Optional: custom seed
    autoCreate: true, // Auto-create if not exists
  },

  // Network configuration
  network: {
    bootstrapNodes: [
      'https://bootstrap1.vivim.live',
      'https://bootstrap2.vivim.live',
    ],
    relays: [
      '/ip4/relay1.vivim.live/tcp/4002',
      '/ip4/relay2.vivim.live/tcp/4002',
    ],
    listenAddresses: [
      '/ip4/0.0.0.0/tcp/0',
      '/ip6/::/tcp/0',
    ],
  },

  // Storage configuration
  storage: {
    defaultLocation: 'local', // 'local' | 'ipfs' | 'filecoin'
    ipfsGateway: 'https://ipfs.vivim.live',
    encryption: true,
    encryptionAlgorithm: 'aes-256-gcm',
  },

  // Nodes configuration
  nodes: {
    autoLoad: true, // Auto-load default nodes
    registries: [
      'https://registry.vivim.live',
    ],
    trustedPublishers: [
      'did:vivim:vivim-team',
    ],
  },
});
```

## Common Patterns

### Error Handling

```typescript
import { SDKError, NodeError, NetworkError } from '@vivim/sdk/core';

try {
  await sdk.initialize();
  const storageNode = await sdk.loadNode('storage');
  await storageNode.save({ key: 'data', value: data });
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
    // Handle network issues
  } else if (error instanceof NodeError) {
    console.error('Node error:', error.message);
    // Handle node-specific errors
  } else if (error instanceof SDKError) {
    console.error('SDK error:', error.message);
    // Handle general SDK errors
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${i + 1} failed:`, error);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw lastError!;
}

// Usage
const storageNode = await withRetry(() => sdk.loadNode('storage'));
```

### Batch Operations

```typescript
// Batch save multiple items
const items = [
  { key: 'item1', value: { data: 'value1' } },
  { key: 'item2', value: { data: 'value2' } },
  { key: 'item3', value: { data: 'value3' } },
];

await Promise.all(
  items.map(item =>
    storageNode.save({
      ...item,
      encrypt: true,
    }),
  ),
);
```

## Next Steps

- [Core SDK](../core/overview) - Learn about the core SDK API
- [API Nodes](../api-nodes/overview) - Explore available API nodes
- [SDK Nodes](../sdk-nodes/overview) - Framework integrations
- [Network](../network/overview) - P2P networking
- [Examples](../examples/basic) - Code examples

## Troubleshooting

### Common Issues

#### "Failed to connect to bootstrap node"

- Check your internet connection
- Verify the bootstrap node URL is correct
- Try alternative bootstrap nodes

#### "Identity creation failed"

- Ensure you have sufficient entropy for seed generation
- Check if an identity already exists
- Clear local storage and retry

#### "Node not found"

- Verify the node ID is correct
- Check if the node is registered
- Ensure the node package is installed

## Resources

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **Issues**: [Report a bug](https://github.com/vivim/vivim-sdk/issues)
- **Discussions**: [Ask questions](https://github.com/vivim/vivim-sdk/discussions)
- **Discord**: [Join community](https://discord.gg/vivim)
