---
sidebar_position: 2
---

# API Nodes

API Nodes are the core functionality modules of the VIVIM SDK. Each node provides a specific capability and can be extended or replaced by anyone.

## Official API Nodes

| Node | Package | Description |
|------|---------|-------------|
| **Identity** | `@vivim/node-identity` | DID/Identity management |
| **Storage** | `@vivim/node-storage` | Distributed storage |
| **Content** | `@vivim/node-content` | Content management |
| **Social** | `@vivim/node-social` | Social graph |
| **AI Chat** | `@vivim/node-ai-chat` | AI chat runtime |
| **Memory** | `@vivim/node-memory` | Knowledge/Memory management |
| **Capture** | `@vivim/node-capture` | Web capture |
| **Analytics** | `@vivim/node-analytics` | Analytics (optional) |

## Identity Node

Manages decentralized identities (DID) using cryptographic keypairs.

```typescript
import { IdentityNode } from '@vivim/node-identity';

const identityNode = await sdk.loadNode<IdentityNode>('identity');

// Create identity
const identity = await identityNode.create({
  algorithm: 'ed25519',
});

// Get DID
const did = identityNode.getDID();

// Sign data
const signature = await identityNode.sign(data);

// Verify signature
const valid = await identityNode.verify(data, signature, publicKey);
```

### API Reference

| Method | Description | Returns |
|--------|-------------|---------|
| `create(options)` | Create new identity | `Promise<Identity>` |
| `getDID()` | Get current DID | `string` |
| `sign(data)` | Sign data | `Promise<Signature>` |
| `verify(data, sig, pubKey)` | Verify signature | `Promise<boolean>` |
| `export(password)` | Export encrypted identity | `Promise<ExportedData>` |
| `import(data, password)` | Import identity | `Promise<Identity>` |

## Storage Node

Provides distributed storage with optional encryption and IPFS/Filecoin integration.

```typescript
import { StorageNode } from '@vivim/node-storage';

const storageNode = await sdk.loadNode<StorageNode>('storage');

// Save data
await storageNode.save({
  key: 'my-data',
  value: { hello: 'world' },
  encrypt: true,
});

// Load data
const data = await storageNode.load('my-data');

// Delete data
await storageNode.delete('my-data');

// List all keys
const keys = await storageNode.list();
```

### Storage Locations

```typescript
// Local storage
await storageNode.save({
  key: 'data',
  value: data,
  location: 'local',
});

// IPFS storage
await storageNode.save({
  key: 'data',
  value: data,
  location: 'ipfs',
  pin: true,
});

// Filecoin storage
await storageNode.save({
  key: 'data',
  value: data,
  location: 'filecoin',
  duration: 180, // days
});
```

## Content Node

Manages content creation, editing, and versioning.

```typescript
import { ContentNode } from '@vivim/node-content';

const contentNode = await sdk.loadNode<ContentNode>('content');

// Create content
const content = await contentNode.create({
  type: 'article',
  title: 'My Article',
  body: 'Content body...',
  tags: ['vivim', 'sdk'],
});

// Update content
await contentNode.update(content.id, {
  title: 'Updated Title',
});

// Get content
const retrieved = await contentNode.get(content.id);

// Delete content
await contentNode.delete(content.id);
```

### Content Types

```typescript
type ContentType = 
  | 'article'
  | 'note'
  | 'bookmark'
  | 'image'
  | 'video'
  | 'audio'
  | 'code'
  | 'custom';
```

## Social Node

Manages social graph connections and interactions.

```typescript
import { SocialNode } from '@vivim/node-social';

const socialNode = await sdk.loadNode<SocialNode>('social');

// Follow a user
await socialNode.follow('did:vivim:...');

// Unfollow
await socialNode.unfollow('did:vivim:...');

// Get followers
const followers = await socialNode.getFollowers();

// Get following
const following = await socialNode.getFollowing();

// Check if following
const isFollowing = await socialNode.isFollowing('did:vivim:...');

// Send message
await socialNode.sendMessage({
  to: 'did:vivim:...',
  content: 'Hello!',
  encrypt: true,
});
```

### Social Interactions

```typescript
// Like content
await socialNode.like(contentId);

// Unlike
await socialNode.unlike(contentId);

// Share/Repost
await socialNode.share(contentId);

// Comment
await socialNode.comment(contentId, {
  body: 'Great content!',
  parentId: null, // For replies
});
```

## AI Chat Node

Provides AI chat capabilities with context from the memory node.

```typescript
import { AIChatNode } from '@vivim/node-ai-chat';

const chatNode = await sdk.loadNode<AIChatNode>('ai-chat');

// Send message
const response = await chatNode.send({
  message: 'What is VIVIM?',
  context: {
    includeMemories: true,
    maxContextItems: 10,
  },
});

// Stream response
const stream = await chatNode.stream({
  message: 'Explain quantum computing',
});

for await (const chunk of stream) {
  console.log(chunk);
}

// Set system prompt
await chatNode.setSystemPrompt('You are a helpful assistant.');

// Clear conversation history
await chatNode.clear();
```

### BYOK (Bring Your Own Key)

```typescript
// Configure API key
await chatNode.configure({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
});

// Or use Anthropic
await chatNode.configure({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-opus',
});
```

## Memory Node

Manages knowledge and memories with semantic search capabilities.

```typescript
import { MemoryNode } from '@vivim/node-memory';

const memoryNode = await sdk.loadNode<MemoryNode>('memory');

// Save memory
await memoryNode.save({
  type: 'conversation',
  content: 'User asked about VIVIM SDK',
  metadata: {
    timestamp: Date.now(),
    tags: ['sdk', 'question'],
  },
});

// Search memories
const results = await memoryNode.search('VIVIM SDK', {
  limit: 10,
  includeVectors: false,
});

// Get related memories
const related = await memoryNode.getRelated(memoryId);

// Delete memory
await memoryNode.delete(memoryId);
```

### Memory Types

```typescript
type MemoryType =
  | 'conversation'
  | 'document'
  | 'code'
  | 'webpage'
  | 'note'
  | 'interaction'
  | 'custom';
```

## Capture Node

Captures web content for storage and processing.

```typescript
import { CaptureNode } from '@vivim/node-capture';

const captureNode = await sdk.loadNode<CaptureNode>('capture');

// Capture URL
const captured = await captureNode.capture('https://example.com', {
  saveContent: true,
  saveMetadata: true,
  saveScreenshot: false,
});

// Capture with options
const result = await captureNode.capture('https://example.com', {
  selectors: ['article', 'main'],
  exclude: ['nav', 'footer', '.ads'],
  waitFor: '.content-loaded',
  timeout: 30000,
});
```

## Analytics Node (Optional)

Provides optional analytics and usage tracking.

```typescript
import { AnalyticsNode } from '@vivim/node-analytics';

const analyticsNode = await sdk.loadNode<AnalyticsNode>('analytics');

// Track event
await analyticsNode.track('node_loaded', {
  nodeId: 'storage',
  duration: 123,
});

// Get stats
const stats = await analyticsNode.getStats({
  period: '7d',
  granularity: 'day',
});

// Export analytics
const exportData = await analyticsNode.export({
  format: 'json',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});
```

## Creating Custom API Nodes

```typescript
import { APINode, NodeConfig } from '@vivim/sdk/core';
import { z } from 'zod';

interface MyNodeConfig {
  apiKey: string;
  endpoint: string;
}

class MyCustomNode implements APINode {
  id = 'my-custom-node';
  version = '1.0.0';
  capabilities = ['custom-op-1', 'custom-op-2'];
  
  private config?: MyNodeConfig;

  async initialize(config: NodeConfig) {
    this.config = config as MyNodeConfig;
    // Initialize resources
  }

  async destroy() {
    // Cleanup resources
  }

  getCapabilities() {
    return this.capabilities;
  }

  async customOp1(data: any) {
    // Implementation
    return { success: true };
  }

  async customOp2(data: any) {
    // Implementation
    return { success: true };
  }
}

// Register the node
await sdk.registerNode({
  id: 'my-custom-node',
  name: 'My Custom Node',
  version: '1.0.0',
  type: 'api',
  schema: z.object({
    apiKey: z.string(),
    endpoint: z.string().url(),
  }),
  factory: (config) => {
    const node = new MyCustomNode();
    node.initialize(config);
    return node;
  },
});
```

## Related

- [Core SDK](../core/overview) - Core SDK fundamentals
- [SDK Nodes](../sdk-nodes/overview) - Framework adapters
- [Examples](../examples/api-nodes) - API node examples

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **API Nodes Source**: [github.com/vivim/vivim-sdk/tree/main/nodes-api](https://github.com/vivim/vivim-sdk/tree/main/nodes-api)
