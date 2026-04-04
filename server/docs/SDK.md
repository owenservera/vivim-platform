# VIVIM SDK Documentation

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Architecture](#core-architecture)
5. [Identity Management](#identity-management)
6. [Node System](#node-system)
7. [Built-in Nodes](#built-in-nodes)
8. [Context Engine Integration](#context-engine-integration)
9. [ACU System](#acu-system)
10. [Storage & Encryption](#storage--encryption)
11. [P2P Networking](#p2p-networking)
12. [CLI Tools](#cli-tools)
13. [API Reference](#api-reference)
14. [Examples](#examples)

---

## Overview

The VIVIM SDK (`@vivim/sdk`) is the foundation for building decentralized AI applications. It provides everything you need to create sovereign, privacy-first AI experiences that remember, understand, and connect knowledge across conversations.

### What the SDK Provides

| Capability         | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| **Identity**       | Decentralized identifiers (DIDs) with cryptographic key management          |
| **Nodes**          | Modular system for extending functionality (Storage, Memory, AI Chat, etc.) |
| **Context Engine** | 8-layer dynamic context assembly powered by ACUs                            |
| **Memory**         | 9 memory types with semantic search capabilities                            |
| **Storage**        | Local, SQLite, or IPFS storage with end-to-end encryption                   |
| **P2P**            | Peer-to-peer networking for decentralized communication                     |
| **CRDT**           | Conflict-free replicated data types for real-time sync                      |

### Key Features

- **Model Agnostic**: Works with any LLM provider (OpenAI, Anthropic, Google, local models)
- **Zero-Knowledge**: Encryption keys never leave the user's device
- **Portable**: Your data travels with you, not trapped in silos
- **Extensible**: Build custom nodes to extend functionality
- **Open Source**: AGPL v3 licensed, community-driven

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

### TypeScript Support

The SDK is written in TypeScript with full type definitions included:

```typescript
import { VivimSDK, type SDKConfig } from '@vivim/sdk';
```

---

## Quick Start

### Basic Initialization

```typescript
import { VivimSDK } from '@vivim/sdk';

// Create SDK instance with minimal config
const sdk = new VivimSDK({
  identity: {
    // Auto-create identity if none provided
    autoCreate: true,
  },
  storage: {
    // Enable encryption (recommended)
    encryption: true,
  },
});

// Initialize SDK
await sdk.initialize();

console.log('SDK ready!');
console.log('My DID:', sdk.getIdentity()?.did);
```

### Full Configuration

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  identity: {
    // Provide existing DID or seed
    did: 'did:vivim:user:abc123',
    seed: 'your-seed-phrase',
    // Auto-create if identity doesn't exist
    autoCreate: true,
  },

  storage: {
    // Local storage directory
    defaultLocation: './vivim-data',
    // Enable encryption
    encryption: true,
    // Optional IPFS gateway
    ipfsGateway: 'https://ipfs.io',
  },

  network: {
    // Enable P2P networking
    enableP2P: true,
    // Bootstrap nodes for initial connection
    bootstrapNodes: ['/dns4/node1.vivim.app/ws/p2p/Qm...', '/dns4/node2.vivim.app/ws/p2p/Qm...'],
    // Custom relay servers
    relays: ['/ip4/1.2.3.4/tcp/4001/...'],
  },

  nodes: {
    // Auto-load built-in nodes
    autoLoad: true,
  },
});

await sdk.initialize();
```

---

## Core Architecture

The SDK is built on a modular architecture centered around the `VivimSDK` class:

```
┌─────────────────────────────────────────────────────────────────┐
│                        VivimSDK                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  RecordKeeper  │  │ Anchor Protocol │  │ SelfDesign    │  │
│  │  (On-Chain)    │  │  (Timestamping) │  │   Module      │  │
│  └────────┬────────┘  └────────┬────────┘  └───────┬───────┘  │
│           │                    │                   │            │
│  ┌────────┴────────┐  ┌────────┴────────┐  ┌───────┴───────┐  │
│  │    Wallet      │  │   Assistant     │  │    Nodes      │  │
│  │   Service     │  │    Runtime      │  │   (Extendable)│  │
│  └────────────────┘  └─────────────────┘  └───────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Modules

The SDK exposes these primary modules:

```typescript
const sdk = await sdk.initialize();

// Access core modules
sdk.recordKeeper; // On-chain record management
sdk.anchor; // Timestamp verification
sdk.selfDesign; // Knowledge graph management
sdk.assistant; // AI conversation runtime
sdk.wallet; // Token and key management
```

---

## Identity Management

### Understanding DIDs

VIVIM uses **Decentralized Identifiers (DIDs)** for identity. A DID is:

- **Self-owned**: You control it, no central authority
- **Cryptographic**: Based on public/private key pairs
- **Portable**: Works across any VIVIM application

```
did:vivim:user:abc123def456
       │       │    │
       │       │    └─ Unique identifier (from public key)
       │       └───── User namespace
       └────────────── Method identifier
```

### Creating Identity

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK();
await sdk.initialize();

// Create new identity with optional display name
const identity = await sdk.createIdentity({
  displayName: 'My Developer Account',
  keyType: 'Ed25519', // Default
});

console.log('My DID:', identity.did);
console.log('Created at:', new Date(identity.createdAt));
```

### Restoring Identity

```typescript
// From seed phrase
const sdk = new VivimSDK({
  identity: {
    seed: 'your-12-word-seed-phrase',
  },
});
await sdk.initialize();

// Or from explicit DID + seed
const sdk2 = new VivimSDK({
  identity: {
    did: 'did:vivim:user:abc123',
    seed: 'your-seed-phrase',
  },
});
```

### Signing & Verification

```typescript
const sdk = await sdk.initialize();
const identity = sdk.getIdentity();

// Sign data
const signature = await sdk.sign({
  message: 'Hello, VIVIM!',
  timestamp: Date.now(),
});

// Verify signature
const isValid = await sdk.verify(
  { message: 'Hello, VIVIM!', timestamp: Date.now() },
  signature,
  identity.did
);

console.log('Signature valid:', isValid);
```

---

## Node System

### What Are Nodes?

Nodes are **modular components** that extend the SDK's functionality. Think of them as plugins that provide specific capabilities.

### Node Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         SDK                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌────────────┐   ┌────────────┐   ┌────────────┐        │
│   │  Storage   │   │   Memory   │   │ AI Chat    │  ...   │
│   │   Node     │   │    Node     │   │   Node     │        │
│   └────────────┘   └────────────┘   └────────────┘        │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                   ┌──────▼──────┐                          │
│                   │  Node       │                          │
│                   │  Registry   │                          │
│                   └─────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Loading Nodes

```typescript
const sdk = await sdk.initialize();

// Get built-in nodes
const storageNode = await sdk.getStorageNode();
const contentNode = await sdk.getContentNode();
const socialNode = await sdk.getSocialNode();
const aiChatNode = await sdk.getAIChatNode();
const memoryNode = await sdk.getMemoryNode();
```

### Registering Custom Nodes

```typescript
// Define your custom node
const myNodeDefinition = {
  id: 'my-custom-node',
  name: 'My Custom Node',
  type: 'api',
  version: '1.0.0',

  // Node initialization
  init: async (sdk) => {
    return {
      // Your node's methods
      greet: (name: string) => `Hello, ${name}!`,
    };
  },
};

// Register it
await sdk.registerNode(myNodeDefinition);

// Load it
const myNode = await sdk.loadNode('my-custom-node');
```

---

## Built-in Nodes

### Identity Node

Manages decentralized identity and cryptographic keys.

```typescript
const identityNode = await sdk.getIdentityNode?.();

// Get current identity
const identity = identityNode.getIdentity();

// Update profile
await identityNode.updateProfile({
  displayName: 'New Name',
  avatar: 'https://...',
});
```

### Storage Node

Provides persistent data storage with encryption.

```typescript
const storage = await sdk.getStorageNode();

// Store data
await storage.put('key', {
  data: 'your-data',
  metadata: { created: Date.now() },
});

// Retrieve data
const result = await storage.get('key');

// Delete data
await storage.delete('key');

// Query with filters
const results = await storage.query({
  prefix: 'conversation:',
  limit: 10,
});
```

### Content Node

Manages AI conversation content and ACUs.

```typescript
const content = await sdk.getContentNode();

// Get conversation
const conversation = await content.getConversation('conv_abc123');

// List conversations
const conversations = await content.listConversations({
  provider: 'chatgpt',
  limit: 20,
});

// Search content
const results = await content.search('authentication code');
```

### Memory Node

Provides intelligent memory storage and retrieval.

```typescript
const memory = await sdk.getMemoryNode();

// Create memory
const mem = await memory.create({
  content: 'Use bcrypt with cost factor 12 for passwords',
  memoryType: 'PROCEDURAL',
  importance: 0.9,
  tags: ['security', 'authentication'],
});

// Semantic search
const results = await memory.search('How to hash passwords securely', {
  type: 'PROCEDURAL',
  limit: 5,
  includeScore: true,
});

// List memories by type
const proceduralMemories = await memory.list({
  type: 'PROCEDURAL',
  minImportance: 0.5,
});
```

### AI Chat Node

Enables AI conversations with context awareness.

```typescript
const aiChat = await sdk.getAIChatNode();

// Start conversation
const conversation = await aiChat.createConversation({
  provider: 'openai',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful coding assistant.',
});

// Send message (with automatic context)
const response = await conversation.send('How do I implement authentication?');

// Stream responses
for await (const chunk of conversation.sendStream('Write a React component')) {
  process.stdout.write(chunk);
}
```

### Social Node

Handles connections, circles, and sharing.

```typescript
const social = await sdk.getSocialNode();

// Create a circle
const circle = await social.createCircle({
  name: 'Engineering Team',
  members: ['did:vivim:user:alice', 'did:vivim:user:bob'],
});

// Share content with circle
await social.share('memory_abc123', {
  type: 'circle',
  circleId: circle.id,
  permissions: {
    view: true,
    annotate: true,
    remix: true,
  },
});
```

---

## Context Engine Integration

The SDK integrates with VIVIM's 8-layer Dynamic Context Engine to provide persistent, contextual AI conversations.

### How Context Works

When you send a message through the SDK, it automatically assembles context from all 8 layers:

```
┌─────────────────────────────────────────────────────────────────┐
│              CONTEXT ASSEMBLY PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Your Message                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ L0: Identity Core    ← Who you are                      │   │
│  │ L1: Preferences     ← How you like to work             │   │
│  │ L2: Topics           ← What subjects you care about     │   │
│  │ L3: Entities         ← Your projects, tools, people    │   │
│  │ L4: Conversation Arc ← Where this chat is going         │   │
│  │ L5: JIT Knowledge    ← Exactly what you need now        │   │
│  │ L6: Message History  ← Recent messages                  │   │
│  │ L7: Current Message  ← This exact message               │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           AI MODEL RECEIVES ENHANCED PROMPT             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Using Context

```typescript
const aiChat = await sdk.getAIChatNode();

// Create conversation with custom context
const conv = await aiChat.createConversation({
  provider: 'openai',
  model: 'gpt-4',

  // Configure context assembly
  context: {
    // Override default token budget
    maxTokens: 12000,

    // Focus on specific topics
    focusTopics: ['react', 'typescript'],

    // Include specific memory types
    memoryTypes: ['EPISODIC', 'PREFERENCE', 'PROCEDURAL'],

    // Enable predictive context
    enablePredictions: true,
  },
});

// The AI now knows:
// - Who you are (L0)
// - Your preferences (L1)
// - Your React expertise (L2)
// - Current project context (L3)
// - This conversation's arc (L4)
// - Relevant memories (L5)
// - Recent messages (L6)
conv.send('Help me with state management');
```

### Manual Context Control

```typescript
// Inject custom context
conv.setContext({
  // Add identity info
  identity: {
    role: 'Senior Developer',
    expertise: ['React', 'Node.js', 'PostgreSQL'],
  },

  // Set preferences
  preferences: {
    responseStyle: 'detailed',
    codeStyle: 'functional',
  },

  // Add specific memories
  memories: [
    { id: 'mem1', content: 'Prefers TypeScript' },
    { id: 'mem2', content: 'Current project: E-commerce' },
  ],
});
```

---

## ACU System

The SDK leverages **Atomic Chat Units (ACUs)** as the foundation for intelligent context. ACUs break conversations into meaningful, interconnected pieces.

### How ACUs Work

```
Traditional Message:
┌──────────────────────────────────────────────────────────────┐
│ "Here's how to read files in Python. Use pathlib which     │
│ is more modern than os.path. Here's the code:              │
│                                                             │
│ from pathlib import Path                                    │
│ def read_file(path):                                        │
│     return Path(path).read_text()                           │
│                                                             │
│ This handles edge cases better."                            │
└──────────────────────────────────────────────────────────────┘
              │
              ▼ Decomposition
              │
ACUs Created:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ACU: Question│  │ ACU: Answer  │  │ACU: Code    │
│ "How to read │  │ "Use pathlib"│  │ from pathlib│
│  files?"     │  │ (Statement)  │  │ Path(path). │
│              │  │              │  │ read_text() │
└──────────────┘  └──────────────┘  └──────────────┘
       │                 │                 │
       └────────────────┼─────────────────┘
                        │
                 Knowledge Graph
       (ACUs are linked and searchable)
```

### Working with ACUs

```typescript
const content = await sdk.getContentNode();

// Get ACUs from a conversation
const acus = await content.getACUs('conv_abc123');

// Search ACUs semantically
const results = await content.searchACUs('pathlib file reading');

// Get ACU by ID
const acu = await content.getACU('acu_hash_abc123');

console.log('ACU content:', acu.content);
console.log('ACU type:', acu.type); // question, answer, code, etc.
console.log('ACU links:', acu.links); // Connected ACUs
```

### ACU Types

| Type           | Description     | Example                          |
| -------------- | --------------- | -------------------------------- |
| `QUESTION`     | User's question | "How do I read files in Python?" |
| `ANSWER`       | Direct response | "Use pathlib, it's more modern"  |
| `CODE_SNIPPET` | Code block      | `Path(path).read_text()`         |
| `STATEMENT`    | General prose   | "This handles edge cases better" |
| `REASONING`    | Explanation     | "Because pathlib is OOP"         |
| `DECISION`     | Choice made     | "We chose Option A over B"       |
| `REFERENCE`    | Citation        | Links to documentation           |

### ACU Relationships

ACUs form a knowledge graph with these relationship types:

```typescript
// ACU relationships are automatically created
const relationships = await content.getRelationships('acu_abc123');

// Returns:
// - NEXT: Sequential in conversation
// - CHILD_OF: Part of larger message
// - SIMILAR_TO: Related by meaning
// - ANSWERS: Responds to question
// - DERIVED_FROM: Builds on other ACU
```

---

## Storage & Encryption

### Storage Adapters

The SDK supports multiple storage backends:

```typescript
// Local file storage (default)
const sdk1 = new VivimSDK({
  storage: {
    adapter: 'local',
    defaultLocation: './vivim-data',
  },
});

// SQLite (Node.js)
const sdk2 = new VivimSDK({
  storage: {
    adapter: 'sqlite',
    database: './vivim.db',
  },
});

// IPFS (decentralized)
const sdk3 = new VivimSDK({
  storage: {
    adapter: 'ipfs',
    ipfsGateway: 'https://ipfs.io',
    ipfsPinning: true,
  },
});
```

### Encryption

All data is encrypted by default:

```typescript
const sdk = new VivimSDK({
  storage: {
    encryption: true,
  },
});
await sdk.initialize();

// Your encryption keys are derived from your identity
const identity = sdk.getIdentity();

// Data is encrypted before leaving your device
await sdk.getStorageNode().put('secret', { data: 'sensitive' });
```

### Manual Encryption

```typescript
import { encrypt, decrypt } from '@vivim/sdk';

// Generate key pair
const { publicKey, privateKey } = await generateKeyPair();

// Encrypt data
const encrypted = await encrypt('Sensitive message', publicKey);

// Decrypt data
const decrypted = await decrypt(encrypted, privateKey);
```

### Encryption Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENCRYPTION FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  YOUR DEVICE                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Generate session key (AES-256-GCM)                   │   │
│  │ 2. Encrypt data with session key                       │   │
│  │ 3. Encrypt session key with your public key            │   │
│  │ 4. Package: Encrypted data + Encrypted key + Nonce     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼ (Send to storage/network)         │
│  SERVER/PEER NEVER SEES:                                        │
│  ❌ Plaintext data                                              │
│  ❌ Session key                                                 │
│  ❌ Private key                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## P2P Networking

### Network Configuration

```typescript
const sdk = new VivimSDK({
  network: {
    enableP2P: true,

    // Bootstrap nodes for initial connection
    bootstrapNodes: [
      '/dns4/peer1.vivim.app/ws/p2p/QmPeerID1',
      '/dns4/peer2.vivim.app/ws/p2p/QmPeerID2',
    ],

    // Custom relay servers
    relays: ['/ip4/1.2.3.4/tcp/4001/p2p/QmRelay1'],

    // Listen addresses
    listenAddresses: ['/ip4/0.0.0.0/tcp/4002', '/dns4/mynode.example.com/tcp/4003/ws'],
  },
});
```

### Connecting to Peers

```typescript
const sdk = await sdk.initialize();

// Wait for network connection
await sdk.waitForConnection();

// Get connected peers
const peers = sdk.network.peers;
console.log('Connected peers:', peers.length);

// Connect to specific peer
await sdk.network.connect('QmPeerID...');

// Listen for peer events
sdk.network.on('peer:connected', (peer) => {
  console.log('New peer:', peer.id);
});

sdk.network.on('peer:disconnected', (peer) => {
  console.log('Peer disconnected:', peer.id);
});
```

### Data Sync with CRDTs

```typescript
// Enable automatic sync
await sdk.sync.enable({
  // What data to sync
  collections: ['memories', 'conversations', 'contacts'],

  // Sync interval (ms)
  interval: 5000,

  // Conflict resolution strategy
  conflictResolution: 'latest-wins', // or 'merge', 'manual'
});

// Trigger manual sync
await sdk.sync.now();

// Listen for sync events
sdk.on('sync:progress', (progress) => {
  console.log(`Syncing: ${progress.completed}/${progress.total}`);
});

sdk.on('sync:complete', () => {
  console.log('Sync complete!');
});
```

### Federation

```typescript
// Connect to another VIVIM instance
const federation = sdk.federation.connect({
  endpoint: 'https://other-instance.com',
  did: 'did:vivim:user:other123',
});

// Query federated data
const results = await federation.query({
  path: '/memories',
  filters: { type: 'FACTUAL' },
});

// Share to federated instance
await federation.share({
  memoryId: 'mem_abc123',
  permissions: { view: true },
});
```

---

## CLI Tools

The SDK includes CLI tools for common operations:

### Vivim Node

```bash
# Start a full VIVIM node
vivim-node start

# With custom configuration
vivim-node start --port 8080 --data-dir ./data

# As daemon (background)
vivim-node start --daemon

# Check status
vivim-node status
```

### Vivim CLI

```bash
# Initialize new project
vivim init

# Check status
vivim status

# List memories
vivim memories list

# Search
vivim search "authentication"

# Export data
vivim export --format json

# Import data
vivim import --file data.json

# Manage circles
vivim circle create "Engineering Team"
vivim circle list
```

### Vivim Git

```bash
# Initialize VIVIM tracking in a directory
vivim-git init

# Commit current state
vivim-git commit -m "Updated memories"

# View history
vivim-git log

# Sync with network
vivim-git sync
```

### Vivim MCP (Model Context Protocol)

```bash
# Start MCP server
vivim-mcp start

# Configure for Claude Desktop
vivim-mcp configure --client claude

# Configure for VS Code
vivim-mcp configure --client vscode
```

---

## API Reference

### VivimSDK Class

```typescript
class VivimSDK extends EventEmitter {
  // Configuration
  constructor(config?: SDKConfig);

  // Initialization
  async initialize(): Promise<void>;
  async destroy(): Promise<void>;

  // Identity
  getIdentity(): Identity | null;
  async createIdentity(options?: CreateIdentityOptions): Promise<Identity>;
  async sign(data: unknown): Promise<string>;
  async verify(data: unknown, signature: string, publicKeyOrDID: string): Promise<boolean>;

  // Nodes
  async loadNode<T>(nodeId: string): Promise<T>;
  async registerNode(definition: APINodeDefinition): Promise<string>;
  async unloadNode(nodeId: string): Promise<void>;
  getLoadedNodes(): NodeInfo[];

  // Built-in Node Accessors
  async getStorageNode(): Promise<StorageNode>;
  async getContentNode(): Promise<ContentNode>;
  async getSocialNode(): Promise<SocialNode>;
  async getAIChatNode(): Promise<AIChatNode>;
  async getMemoryNode(): Promise<MemoryNode>;

  // Core Modules
  getRecordKeeper(): OnChainRecordKeeper;
  getAnchorProtocol(): AnchorProtocol;
  getSelfDesign(): SelfDesignModule;
  getAssistant(): VivimAssistantRuntime;
  getWallet(): WalletService;

  // Network
  async waitForConnection(timeout?: number): Promise<void>;

  // Events
  on(event: string, handler: Function): this;
  emit(event: string, ...args: any[]): boolean;
}
```

### Configuration Types

```typescript
interface SDKConfig {
  identity?: {
    did?: string;
    seed?: string;
    autoCreate?: boolean;
  };

  storage?: {
    defaultLocation?: string;
    adapter?: 'local' | 'sqlite' | 'ipfs';
    encryption?: boolean;
    ipfsGateway?: string;
  };

  network?: {
    enableP2P?: boolean;
    bootstrapNodes?: string[];
    relays?: string[];
    listenAddresses?: string[];
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

  wallet?: WalletServiceConfig;
}
```

### Event Types

```typescript
// Connection events
'connected'; // SDK connected to network
'disconnected'; // SDK disconnected from network

// Identity events
'identity:created'; // New identity created
'identity:loaded'; // Existing identity loaded

// Node events
'node:loaded'; // Node registered
'node:unloaded'; // Node removed

// Data events
'conversation:created';
'conversation:updated';
'memory:created';
'memory:updated';
'acu:extracted';

// Sync events
'sync:progress';
'sync:complete';
'sync:error';

// Peer events
'peer:connected';
'peer:disconnected';
```

---

## Examples

### Example 1: Basic Memory App

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  identity: { autoCreate: true },
  storage: { encryption: true },
});

await sdk.initialize();

// Create a memory
await sdk.getMemoryNode().create({
  content: 'Meeting with team tomorrow at 2pm',
  memoryType: 'EPISODIC',
  importance: 0.7,
  tags: ['meeting', 'team'],
});

// Search memories
const results = await sdk.getMemoryNode().search('meeting schedule');
console.log('Found:', results);
```

### Example 2: Context-Aware AI Chat

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  identity: { did: 'did:vivim:user:myapp' },
  storage: { encryption: true },
  network: { enableP2P: true },
});

await sdk.initialize();

// Store some memories first
const memoryNode = await sdk.getMemoryNode();
await memoryNode.create({
  content: 'I prefer React with TypeScript',
  memoryType: 'PREFERENCE',
  importance: 0.8,
  tags: ['react', 'typescript'],
});

// Start AI conversation with automatic context
const aiChat = await sdk.getAIChatNode();
const conv = await aiChat.createConversation({
  provider: 'openai',
  model: 'gpt-4',
});

// Now the AI knows your React + TypeScript preference!
const response = await conv.send('What component library should I use?');
// Response will consider your React + TypeScript preference
```

### Example 3: Team Collaboration

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  identity: { did: 'did:vivim:user:lead' },
  storage: { encryption: true },
  network: { enableP2P: true },
});

await sdk.initialize();

// Create team circle
const social = await sdk.getSocialNode();
const circle = await social.createCircle({
  name: 'Engineering Team',
  members: ['did:vivim:user:alice', 'did:vivim:user:bob', 'did:vivim:user:charlie'],
});

// Create shared memory
const memory = await sdk.getMemoryNode();
const mem = await memory.create({
  content: 'Use bcrypt with cost factor 12 for passwords',
  memoryType: 'PROCEDURAL',
  importance: 0.9,
  tags: ['security', 'authentication'],
  sharing: {
    circleId: circle.id,
    permissions: {
      view: true,
      annotate: true,
    },
  },
});
```

### Example 4: Import and Organize Conversations

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  identity: { autoCreate: true },
  storage: { encryption: true },
});

await sdk.initialize();

// Import from ChatGPT
const content = await sdk.getContentNode();
await content.import({
  provider: 'chatgpt',
  source: 'chatgpt-export.json',
  options: {
    extractACUs: true,
    generateEmbeddings: true,
  },
});

// Create collection for organization
await sdk.getContentNode().createCollection({
  name: 'Work Projects',
  description: 'Important work conversations',
  color: '#3B82F6',
});

// Add conversations to collection
const conversations = await content.listConversations({ limit: 100 });
for (const conv of conversations) {
  if (conv.provider === 'chatgpt') {
    await content.addToCollection('work-projects', conv.id);
  }
}
```

### Example 5: Real-time Sync App

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  identity: { did: 'did:vivim:user:syncapp' },
  network: { enableP2P: true },
  storage: { encryption: true },
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
await sdk.sync.enable({
  collections: ['memories', 'conversations'],
  interval: 5000,
});

console.log('Listening for changes...');
```

---

## Related Documentation

- **[ATOMIC-CHAT-UNITS.md](./ATOMIC-CHAT-UNITS.md)** — Deep dive into ACUs and how they power dynamic context
- **[CORE-SERVICES.md](./CORE-SERVICES.md)** — Overview of VIVIM's three-layer architecture
- **[CONTEXT-ENGINE.md](./CONTEXT-ENGINE.md)** — Technical details on the 8-layer context system
- **[MEMORY-ENGINE.md](./MEMORY-ENGINE.md)** — 9 memory types and retrieval strategies
- **[STORAGE.md](./STORAGE.md)** — Database schema and encryption details
- **[PRODUCT.md](./PRODUCT.md)** — Product positioning and pricing

---

## Support

- **Documentation**: docs.vivim.app
- **GitHub Issues**: github.com/vivim-app/vivim-sdk
- **Discord**: discord.gg/vivim
- **Email**: support@vivim.app

---

_Built with ❤️ by the VIVIM community_
