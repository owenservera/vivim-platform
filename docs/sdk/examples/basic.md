---
sidebar_position: 6
---

# Examples

This section provides runnable examples for common VIVIM SDK use cases.

## Basic Examples

### Hello VIVIM

A simple example to get started with the SDK.

```typescript
// hello-vivim.ts
import { VivimSDK } from '@vivim/sdk/core';

async function main() {
  // Initialize SDK
  const sdk = new VivimSDK({
    identity: { autoCreate: true },
    network: { bootstrapNodes: ['https://bootstrap.vivim.live'] },
  });

  await sdk.initialize();

  console.log('Hello VIVIM!');
  console.log('Your DID:', sdk.identity.getDID());

  // Cleanup
  await sdk.destroy();
}

main().catch(console.error);
```

### Save and Load Data

Basic storage operations with encryption.

```typescript
// storage-example.ts
import { VivimSDK } from '@vivim/sdk/core';

async function main() {
  const sdk = new VivimSDK({
    identity: { autoCreate: true },
    storage: {
      defaultLocation: 'local',
      encryption: true,
    },
  });

  await sdk.initialize();

  const storageNode = await sdk.loadNode('storage');

  // Save data
  await storageNode.save({
    key: 'greeting',
    value: {
      message: 'Hello from VIVIM!',
      timestamp: Date.now(),
    },
    encrypt: true,
  });

  console.log('Data saved!');

  // Load data
  const data = await storageNode.load('greeting');
  console.log('Loaded data:', data);

  // List all keys
  const keys = await storageNode.list();
  console.log('All keys:', keys);

  await sdk.destroy();
}

main().catch(console.error);
```

### Identity and Signing

Create identity and sign/verify data.

```typescript
// identity-example.ts
import { VivimSDK } from '@vivim/sdk/core';
import { encoding } from '@vivim/sdk/core';

async function main() {
  const sdk = new VivimSDK({
    identity: { autoCreate: true },
  });

  await sdk.initialize();

  const identityNode = await sdk.loadNode('identity');

  // Get identity
  const did = identityNode.getDID();
  console.log('DID:', did);

  // Export identity (encrypted)
  const exported = await identityNode.export('my-password');
  console.log('Exported identity:', exported);

  // Sign data
  const data = { message: 'Hello, World!' };
  const signature = await identityNode.sign(data);
  console.log('Signature:', encoding.toBase64(signature));

  // Verify signature
  const valid = await identityNode.verify(data, signature);
  console.log('Signature valid:', valid);

  await sdk.destroy();
}

main().catch(console.error);
```

### AI Chat

Interactive AI chat with context.

```typescript
// chat-example.ts
import { VivimSDK } from '@vivim/sdk/core';

async function main() {
  const sdk = new VivimSDK({
    identity: { autoCreate: true },
  });

  await sdk.initialize();

  const chatNode = await sdk.loadNode('ai-chat');

  // Configure with your API key
  await chatNode.configure({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  });

  // Send message
  const response = await chatNode.send({
    message: 'What is VIVIM?',
    context: {
      includeMemories: true,
      maxContextItems: 5,
    },
  });

  console.log('AI Response:', response.content);

  // Stream response
  console.log('\nStreaming response:');
  const stream = await chatNode.stream({
    message: 'Explain quantum computing in simple terms',
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
  console.log();

  await sdk.destroy();
}

main().catch(console.error);
```

### Memory Management

Save and search memories.

```typescript
// memory-example.ts
import { VivimSDK } from '@vivim/sdk/core';

async function main() {
  const sdk = new VivimSDK({
    identity: { autoCreate: true },
  });

  await sdk.initialize();

  const memoryNode = await sdk.loadNode('memory');

  // Save memories
  const memories = [
    {
      type: 'conversation' as const,
      content: 'User asked about VIVIM SDK',
      metadata: { tags: ['sdk', 'question'] },
    },
    {
      type: 'note' as const,
      content: 'VIVIM is a decentralized AI memory platform',
      metadata: { tags: ['vivim', 'description'] },
    },
    {
      type: 'code' as const,
      content: 'const sdk = new VivimSDK({...})',
      metadata: { tags: ['code', 'typescript'] },
    },
  ];

  for (const memory of memories) {
    await memoryNode.save(memory);
  }

  console.log('Memories saved!');

  // Search memories
  const results = await memoryNode.search('VIVIM SDK', {
    limit: 10,
  });

  console.log('Search results:');
  results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.content} (score: ${result.score})`);
  });

  await sdk.destroy();
}

main().catch(console.error);
```

## Advanced Examples

### Custom Node

Create and register a custom API node.

```typescript
// custom-node-example.ts
import { VivimSDK, APINode, NodeConfig } from '@vivim/sdk/core';
import { z } from 'zod';

interface WeatherNodeConfig extends NodeConfig {
  apiKey: string;
}

class WeatherNode implements APINode {
  id = 'weather';
  version = '1.0.0';
  capabilities = ['get-weather', 'get-forecast'];

  private config?: WeatherNodeConfig;

  async initialize(config: NodeConfig) {
    this.config = config as WeatherNodeConfig;
    console.log('Weather node initialized');
  }

  async destroy() {
    console.log('Weather node destroyed');
  }

  getCapabilities() {
    return this.capabilities;
  }

  async getWeather(location: string) {
    // Simulated weather data
    return {
      location,
      temperature: 25,
      condition: 'sunny',
      humidity: 60,
    };
  }

  async getForecast(location: string, days: number = 7) {
    // Simulated forecast
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString(),
      temperature: 20 + Math.random() * 10,
      condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
    }));
  }
}

async function main() {
  const sdk = new VivimSDK({
    identity: { autoCreate: true },
  });

  await sdk.initialize();

  // Register custom node
  await sdk.registerNode({
    id: 'weather',
    name: 'Weather Node',
    version: '1.0.0',
    type: 'api',
    schema: z.object({
      apiKey: z.string(),
    }),
    factory: (config) => {
      const node = new WeatherNode();
      node.initialize(config);
      return node;
    },
  });

  // Use custom node
  const weatherNode = await sdk.loadNode('weather');

  const weather = await weatherNode.getWeather('San Francisco');
  console.log('Weather:', weather);

  const forecast = await weatherNode.getForecast('San Francisco', 5);
  console.log('Forecast:', forecast);

  await sdk.destroy();
}

main().catch(console.error);
```

### Social Interactions

Follow users and send messages.

```typescript
// social-example.ts
import { VivimSDK } from '@vivim/sdk/core';

async function main() {
  const sdk = new VivimSDK({
    identity: { autoCreate: true },
  });

  await sdk.initialize();

  const socialNode = await sdk.loadNode('social');

  // Follow a user
  const targetDid = 'did:vivim:...';
  await socialNode.follow(targetDid);
  console.log('Following:', targetDid);

  // Get followers
  const followers = await socialNode.getFollowers();
  console.log('Followers:', followers);

  // Get following
  const following = await socialNode.getFollowing();
  console.log('Following:', following);

  // Send encrypted message
  await socialNode.sendMessage({
    to: targetDid,
    content: 'Hello! This is a secret message.',
    encrypt: true,
  });
  console.log('Message sent!');

  // Like content
  const contentId = 'content-123';
  await socialNode.like(contentId);
  console.log('Liked content:', contentId);

  await sdk.destroy();
}

main().catch(console.error);
```

### Content Management

Create, update, and version content.

```typescript
// content-example.ts
import { VivimSDK } from '@vivim/sdk/core';

async function main() {
  const sdk = new VivimSDK({
    identity: { autoCreate: true },
  });

  await sdk.initialize();

  const contentNode = await sdk.loadNode('content');

  // Create content
  const content = await contentNode.create({
    type: 'article',
    title: 'My First Article',
    body: 'This is the content of my first article on VIVIM.',
    tags: ['vivim', 'article', 'first'],
    metadata: {
      author: sdk.identity.getDID(),
    },
  });

  console.log('Content created:', content.id);

  // Update content
  await contentNode.update(content.id, {
    title: 'My Updated Article',
    body: 'This is the updated content with more information.',
  });

  console.log('Content updated!');

  // Get content with version history
  const retrieved = await contentNode.get(content.id, {
    includeVersions: true,
  });

  console.log('Version count:', retrieved.versions.length);

  // Delete content
  // await contentNode.delete(content.id);

  await sdk.destroy();
}

main().catch(console.error);
```

## Framework Examples

### React Example

```tsx
// App.tsx
import { VivimProvider, useSDK, useStorage, useChat } from '@vivim/sdk-react';

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
  const { connected } = useSDK();
  const { save, load } = useStorage();
  const { send, messages } = useChat({
    provider: 'openai',
    model: 'gpt-4',
  });

  const [input, setInput] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await send(input);
    setInput('');
  };

  return (
    <div>
      <h1>VIVIM Dashboard</h1>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>

      <h2>Chat</h2>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg.content}</div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
```

### Vue Example

```vue
<!-- App.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { provideVivim, useSDK, useStorage, useChat } from '@vivim/sdk-vue';

provideVivim({
  identity: { autoCreate: true },
  network: { bootstrapNodes: ['https://bootstrap.vivim.live'] },
});

const { connected } = useSDK();
const { save, load } = useStorage();
const { send, messages } = useChat({
  provider: 'openai',
  model: 'gpt-4',
});

const input = ref('');

const handleSubmit = async () => {
  await send(input.value);
  input.value = '';
};
</script>

<template>
  <div>
    <h1>VIVIM Dashboard</h1>
    <p>Status: {{ connected ? 'Connected' : 'Disconnected' }}</p>

    <h2>Chat</h2>
    <div v-for="(msg, i) in messages" :key="i">
      {{ msg.content }}
    </div>
    <form @submit.prevent="handleSubmit">
      <input v-model="input" placeholder="Type a message..." />
      <button type="submit">Send</button>
    </form>
  </div>
</template>
```

## Related

- [Getting Started](./getting-started) - Quick start guide
- [Core SDK](../core/overview) - Core SDK API
- [API Nodes](../api-nodes/overview) - API nodes reference

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **Examples Source**: [github.com/vivim/vivim-sdk/tree/main/examples](https://github.com/vivim/vivim-sdk/tree/main/examples)
