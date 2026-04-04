# VIVIM SDK Guide

Comprehensive guide to building applications with the VIVIM SDK.

---

## Installation

### Prerequisites

- Node.js 20.0 or later
- Bun (recommended for optimal performance)

### Install

```bash
# Using Bun (recommended)
bun add @vivim/sdk

# Using npm
npm install @vivim/sdk

# Using yarn
yarn add @vivim/sdk
```

---

## Quick Start

### Basic Initialization

```typescript
import { VivimSDK } from '@vivim/sdk';

// Create SDK instance
const sdk = new VivimSDK({
  // Your decentralized identifier
  identity: {
    did: 'did:vivim:user:abc123',
  },
  
  // Storage configuration
  storage: {
    // Enable encryption (recommended)
    encryption: true,
    // Local storage adapter
    adapter: 'local'
  },
  
  // Network configuration
  network: {
    // Auto-connect to P2P network
    autoConnect: true,
    // Bootstrap nodes
    bootstrap: ['/dns4/node1.vivim.app/ws/p2p/...']
  }
});

// Initialize SDK
await sdk.initialize();

console.log('VIVIM SDK initialized!');
```

---

## Core Concepts

### Identity

VIVIM uses decentralized identifiers (DIDs) for identity:

```typescript
import { createIdentity, createFromSeed } from '@vivim/sdk';

// Create new identity
const identity = await createIdentity({
  // Optional handle for easy reference
  handle: 'my-handle'
});

console.log('My DID:', identity.did);

// Or create from existing seed
const identity2 = await createFromSeed('my-seed-phrase');
```

### Storage

VIVIM provides multiple storage adapters:

```typescript
// Local storage (default)
const sdk = new VivimSDK({
  storage: {
    adapter: 'local',
    path: './vivim-data'
  }
});

// SQLite (for Node.js)
const sdk2 = new VivimSDK({
  storage: {
    adapter: 'sqlite',
    database: ':memory:' // or file path
  }
});

// IPFS (decentralized)
const sdk3 = new VivimSDK({
  storage: {
    adapter: 'ipfs',
    ipfs: {
      gateway: 'https://ipfs.io'
    }
  }
});
```

### Network

Connect to the V2VIM P2P network:

```typescript
const sdk = new VivimSDK({
  network: {
    autoConnect: true,
    // LibP2P configuration
    libp2p: {
      // Bootstrap peers
      bootstrap: [
        '/dns4/peer1.vivim.app/ws/p2p/Qm...',
        '/dns4/peer2.vivim.app/ws/p2p/Qm...'
      ],
      // Connection limits
      maxConnections: 50,
      // Transport protocols
      transports: ['websocket', 'webRTC']
    }
  }
});
```

---

## Working with Conversations

### Listing Conversations

```typescript
// Get paginated list
const result = await sdk.conversations.list({
  limit: 20,
  offset: 0,
  // Optional filters
  provider: 'chatgpt',
  since: new Date('2024-01-01')
});

console.log('Conversations:', result.data);
console.log('Has more:', result.pagination.hasMore);
```

### Getting a Conversation

```typescript
const conversation = await sdk.conversations.get('conv_abc123');
console.log('Title:', conversation.title);
console.log('Messages:', conversation.messages.length);
```

### Creating a Conversation

```typescript
const conversation = await sdk.conversations.create({
  provider: 'chatgpt',
  title: 'My New Chat',
  messages: [
    {
      role: 'user',
      content: 'Hello!'
    }
  ]
});
```

### Searching Conversations

```typescript
const results = await sdk.conversations.search('authentication code', {
  provider: 'claude',
  limit: 10
});
```

---

## Working with Memories

### Creating Memories

```typescript
const memory = await sdk.memories.create({
  content: 'Remember to use bcrypt with cost factor 12',
  type: 'PROCEDURAL',
  importance: 0.8,
  tags: ['security', 'authentication'],
  metadata: {
    source: 'claude-conversation'
  }
});
```

### Listing Memories

```typescript
const memories = await sdk.memories.list({
  type: 'EPISODIC',
  minImportance: 0.5,
  limit: 50
});
```

### Semantic Search

```typescript
const results = await sdk.memories.semanticSearch(
  'How to implement JWT authentication',
  {
    type: 'PROCEDURAL',
    limit: 5,
    // Return similarity scores
    includeScore: true
  }
);

results.forEach(result => {
  console.log('Memory:', result.memory.content);
  console.log('Similarity:', result.score);
});
```

### Updating Memories

```typescript
await sdk.memories.update('mem_abc123', {
  importance: 0.9,
  tags: ['updated', 'security']
});
```

### Deleting Memories

```typescript
await sdk.memories.delete('mem_abc123');
```

---

## Working with Collections

### Creating Collections

```typescript
const collection = await sdk.collections.create({
  name: 'Work Projects',
  description: 'Important work conversations',
  visibility: 'private',
  color: '#3B82F6',
  icon: 'briefcase'
});
```

### Adding Items

```typescript
await sdk.collections.addItem('col_abc123', {
  type: 'conversation',
  id: 'conv_xyz789'
});
```

### Listing Collections

```typescript
const collections = await sdk.collections.list();
```

---

## Events & Subscriptions

### Listening to Events

```typescript
// Connection events
sdk.on('connected', () => {
  console.log('Connected to network');
});

sdk.on('disconnected', () => {
  console.log('Disconnected from network');
});

// Data events
sdk.on('conversation:created', (conversation) => {
  console.log('New conversation:', conversation.id);
});

sdk.on('memory:created', (memory) => {
  console.log('New memory extracted:', memory.content.substring(0, 50));
});

// Sync events
sdk.on('sync:progress', (progress) => {
  console.log(`Syncing: ${progress.completed}/${progress.total}`);
});
```

### Custom Events

```typescript
// Emit custom events (for peer-to-peer)
await sdk.emit('custom:event', {
  data: 'hello'
});
```

---

## P2P Features

### Connecting to Peers

```typescript
// Connect to specific peer
await sdk.network.connect('QmPeerID...');

// Get connected peers
const peers = sdk.network.peers;
console.log('Connected peers:', peers.length);

// Listen for peer events
sdk.network.on('peer:connected', (peer) => {
  console.log('New peer:', peer.id);
});
```

### Data Sync

```typescript
// Enable CRDT sync
await sdk.sync.enable({
  // What to sync
  collections: ['memories', 'conversations'],
  // Sync interval
  interval: 5000,
  // Conflict resolution
  conflictResolution: 'latest-wins'
});

// Manual sync
await sdk.sync.now();
```

### Federation

```typescript
// Connect to another VIVIM instance
const federated = sdk.federation.connect({
  endpoint: 'https://other-instance.com',
  did: 'did:vivim:user:other123'
});

// Query federated data
const results = await federated.query({
  path: '/memories',
  filters: { type: 'FACTUAL' }
});
```

---

## Encryption

### Enabling Encryption

```typescript
const sdk = new VivimSDK({
  storage: {
    encryption: true,
    // Encryption key derivation
    keyDerivation: {
      // Password-based (not recommended for production)
      type: 'password',
      password: 'your-password'
    }
  }
});
```

### Using Key Pairs

```typescript
import { generateKeyPair, encrypt, decrypt } from '@vivim/sdk';

// Generate encryption keys
const { publicKey, privateKey } = await generateKeyPair();

// Encrypt data
const encrypted = await encrypt('Sensitive data', publicKey);

// Decrypt data
const decrypted = await decrypt(encrypted, privateKey);
```

---

## Error Handling

### Try-Catch Pattern

```typescript
try {
  const conversation = await sdk.conversations.get('conv_abc123');
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    console.log('Conversation not found');
  } else if (error.code === 'UNAUTHORIZED') {
    console.log('Please authenticate');
  } else {
    console.error('Error:', error.message);
  }
}
```

### Error Types

```typescript
import { 
  VivimError,
  AuthError,
  NetworkError,
  StorageError,
  ValidationError
} from '@vivim/sdk';

// Handle specific errors
try {
  await sdk.operation();
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth errors
  } else if (error instanceof NetworkError) {
    // Handle network errors
  }
}
```

---

## CLI Tools

### Starting a Node

```bash
# Start a full VIVIM node
vivim-node start

# With custom configuration
vivim-node start --port 8080 --data-dir ./data

# As daemon
vivim-node start --daemon
```

### CLI Commands

```bash
# Initialize a new project
vivim init

# Status
vivim status

# List memories
vivim memories list

# Search
vivim search "authentication"

# Export data
vivim export --format json

# Import data  
vivim import --file data.json
```

---

## Examples

### Basic Memory App

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  identity: { did: 'did:vivim:user:myapp' },
  storage: { encryption: true }
});

await sdk.initialize();

// Create a memory
await sdk.memories.create({
  content: 'Meeting with team tomorrow at 2pm',
  type: 'EPISODIC',
  importance: 0.7
});

// Search memories
const results = await sdk.memories.semanticSearch('meeting schedule');
console.log('Found:', results);
```

### Real-time Sync App

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  identity: { did: 'did:vivim:user:syncapp' },
  network: { autoConnect: true },
  sync: { enabled: true }
});

await sdk.initialize();

// Listen for remote changes
sdk.on('memory:created', (memory) => {
  console.log('New memory from network:', memory.id);
});

sdk.on('conversation:updated', (conv) => {
  console.log('Conversation updated:', conv.id);
});

// Enable real-time sync
await sdk.sync.enable({ interval: 5000 });
```

### Team Collaboration

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  identity: { did: 'did:vivim:user:collab' }
});

await sdk.initialize();

// Create team circle
const circle = await sdk.circles.create({
  name: 'Engineering Team',
  members: ['did:vivim:user:alice', 'did:vivim:user:bob']
});

// Share collection with circle
await sdk.collections.share('col_abc123', {
  type: 'circle',
  circleId: circle.id,
  permissions: {
    view: true,
    annotate: true
  }
});
```

---

## Performance Tips

### Batching

```typescript
// Instead of individual operations
for (const item of items) {
  await sdk.memories.create(item);
}

// Use batch operations
await sdk.memories.createMany(items);
```

### Caching

```typescript
// Enable caching
const sdk = new VivimSDK({
  cache: {
    enabled: true,
    // Cache TTL in seconds
    ttl: 300,
    // Maximum cache size
    maxSize: 1000
  }
});
```

### Lazy Loading

```typescript
// Use pagination
const result = await sdk.conversations.list({ limit: 20 });

// Load more as needed
if (result.pagination.hasMore) {
  const more = await sdk.conversations.list({ 
    limit: 20, 
    offset: 20 
  });
}
```

---

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { 
  Conversation, 
  Memory, 
  Collection,
  CreateMemoryOptions,
  ListOptions 
} from '@vivim/sdk';

// Fully typed
const memory: Memory = await sdk.memories.create({
  content: 'My memory',
  type: 'EPISODIC',  // TypeScript knows valid types
  importance: 0.8    // TypeScript validates range
});
```

---

## Support

- **Documentation**: docs.vivim.app
- **GitHub Issues**: github.com/vivim-app/vivim-sdk
- **Discord**: discord.gg/vivim
- **Email**: support@vivim.app
