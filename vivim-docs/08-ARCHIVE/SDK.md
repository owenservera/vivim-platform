# <img src="https://img.icons8.com/color/48/000000/toolbox.png" width="40" align="left" /> VIVIM SDK

### Core Developer Toolkit for Building Decentralized AI Applications

[![npm version](https://img.shields.io/npm/v/@vivim/sdk?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@vivim/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/@vivim/sdk?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@vivim/sdk)

[« Back to Main Repository](../README.md)

---

## 📖 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [📚 Core Concepts](#-core-concepts)
- [🔧 API Reference](#-api-reference)
- [📁 Package Structure](#-package-structure)
- [🧩 Apps Built with SDK](#-apps-built-with-sdk)
- [🤝 Contributing](#-contributing)

---

## ✨ Overview

The **VIVIM SDK** is a comprehensive TypeScript toolkit for building decentralized, AI-powered applications. It provides the foundational primitives for:

- 🔐 **Identity & Authentication** - DID-based identity management
- 🧠 **Memory & Context** - Persistent AI memory with ACU processing
- 💬 **Conversations** - Multi-party encrypted chat systems
- 📝 **Content Management** - Distributed content storage and retrieval
- 🔗 **Blockchain Integration** - On-chain verification and trust proofs
- 🌐 **P2P Networking** - LibP2P-based peer-to-peer communication

```typescript
import { VivimSDK } from '@vivim/sdk'

// Initialize the SDK
const sdk = new VivimSDK({
  did: 'did:vivim:your-identity',
  storage: 'local', // or 'ipfs', 'filecoin'
  encryption: true
})

// Create an AI chat node
const chatNode = await sdk.nodes.create('ai-chat', {
  model: 'gpt-4',
  memory: true
})

// Send a message
const response = await chatNode.sendMessage('Hello, VIVIM!')
```

---

## 🎯 Features

### Core Capabilities

| Feature | Description | Status |
|---------|-------------|--------|
| **Identity System** | DID-based identity with key management | ✅ Stable |
| **Memory Engine** | Persistent AI memory with vector search | ✅ Stable |
| **Conversation CRDT** | Conflict-free replicated conversations | ✅ Stable |
| **Content Nodes** | Distributed content storage | ✅ Stable |
| **Social Graph** | Friends, circles, and follow relationships | 🚧 Beta |
| **Blockchain Anchor** | On-chain verification and trust | 🚧 Beta |
| **P2P Sync** | LibP2P-based data synchronization | 🚧 Beta |
| **E2E Encryption** | End-to-end encrypted communications | ✅ Stable |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIVIM SDK Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Application Layer                      │   │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │   │
│  │  │ AI Chat │ │ Publishing│ │ Roadmap │ │  Dashboard   │  │   │
│  │  │  Node   │ │  Agent   │ │ Engine  │ │   (Public)   │  │   │
│  │  └─────────┘ └──────────┘ └─────────┘ └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                    Extension Layer                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │  Assistant  │  │   Tool      │  │   Circle        │   │ │
│  │  │   Engine    │  │   Engine    │  │   Engine        │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                      Core Layer                           │ │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │ │
│  │  │ Identity│ │  Memory  │ │ Content │ │   Social     │  │ │
│  │  │  Node   │ │   Node   │ │  Node   │ │    Node      │  │ │
│  │  └─────────┘ └──────────┘ └─────────┘ └──────────────┘  │ │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │ │
│  │  │ Anchor  │ │  Record  │ │   L0    │ │   Graph      │  │ │
│  │  │ System  │ │  Keeper  │ │ Storage │ │   Registry   │  │ │
│  │  └─────────┘ └──────────┘ └─────────┘ └──────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                   Protocol Layer                          │ │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐ │ │
│  │  │   Exit Node     │  │      Sync Protocol              │ │ │
│  │  │   Protocol      │  │  (State Updates & Replication)  │ │ │
│  │  └─────────────────┘  └─────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                  Network Layer                            │ │
│  │     LibP2P  │  CRDT Sync  │  DHT  │  Pub/Sub  │  E2EE    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Via npm

```bash
npm install @vivim/sdk
```

### Via Bun

```bash
bun add @vivim/sdk
```

### Via yarn

```bash
yarn add @vivim/sdk
```

### Peer Dependencies

The SDK requires the following peer dependencies:

```json
{
  "peerDependencies": {
    "libp2p": "^1.0.0",
    "yjs": "^13.6.0"
  }
}
```

Install them if needed:

```bash
npm install libp2p yjs
```

---

## 🚀 Quick Start

### 1. Initialize the SDK

```typescript
import { VivimSDK } from '@vivim/sdk'

// Create SDK instance
const sdk = new VivimSDK({
  did: 'did:vivim:abc123...',
  seed: new Uint8Array([...]), // Optional seed for deterministic keys
  autoCreate: true
})

// Initialize
await sdk.initialize()
```

### 2. Create Identity

```typescript
// Create or load identity
const identity = await sdk.identity.create({
  displayName: 'Alice',
  verificationLevel: 1
})

console.log(`DID: ${identity.did}`)
console.log(`Public Key: ${identity.publicKey}`)
```

### 3. Store Memory

```typescript
// Store a memory
const memory = await sdk.memory.create({
  content: 'Learned about VIVIM SDK today',
  type: 'note',
  tags: ['vivim', 'sdk', 'learning']
})

// Query memories
const memories = await sdk.memory.query({
  text: 'VIVIM',
  limit: 10
})
```

### 4. Create Conversation

```typescript
// Create a conversation
const conversation = await sdk.conversation.create({
  title: 'Project Discussion',
  participants: ['did:vivim:bob...', 'did:vivim:carol...']
})

// Send message
await conversation.sendMessage({
  content: 'Hello everyone!',
  type: 'text'
})
```

### 5. Connect to Network

```typescript
import { NetworkNode } from '@vivim/network-engine'

// Create network node
const networkNode = new NetworkNode({
  nodeType: 'peer',
  roles: ['storage', 'compute'],
  listenAddresses: ['/ip4/0.0.0.0/tcp/9000/ws']
})

await networkNode.start()
console.log(`Peer ID: ${networkNode.getPeerId()}`)
```

---

## 📚 Core Concepts

### Identity & Authentication

VIVIM uses **DID (Decentralized Identifiers)** for user identity:

```typescript
interface Identity {
  did: string              // Decentralized Identifier
  publicKey: string        // Public key for verification
  keyType: 'Ed25519' | 'secp256k1'
  displayName?: string
  verificationLevel: number  // Trust level (0-5)
  createdAt: number
}
```

### Memory System

The **ACU (Attention, Context, Understanding)** memory processor:

```typescript
interface Memory {
  id: string
  content: string
  summary?: string
  memoryType: 'note' | 'fact' | 'event' | 'concept' | 'procedure'
  category: string
  tags: string[]
  acuScore: {
    attention: number    // Importance score
    context: number      // Contextual relevance
    understanding: number // Comprehension level
  }
  vectorEmbedding?: number[]  // For semantic search
}
```

### Content Objects

Distributed content with cryptographic signatures:

```typescript
interface ContentObject {
  cid: string            // Content Identifier (IPFS-style)
  id: string             // Local ID
  type: ContentType      // 'text' | 'image' | 'video' | 'audio' | 'code'
  author: string         // DID of creator
  signature: string      // Cryptographic signature
  timestamp: number
  visibility: 'public' | 'private' | 'circle' | 'friends'
  text?: string
  media?: MediaMetadata
  tags: string[]
}
```

### Trust Levels

VIVIM implements a **trust hierarchy** for verification:

```
┌─────────────────────────────────────────────────────────┐
│                    Trust Hierarchy                       │
├─────────────────────────────────────────────────────────┤
│  Level 5  │  GENESIS     │  Root anchor (system)       │
│  Level 4  │  BOOTSTRAP   │  Initial network peers      │
│  Level 3  │  PRIMARY     │  Directly verified nodes    │
│  Level 2  │  SECONDARY   │  Verified by primary        │
│  Level 1  │  UNVERIFIED  │  New/unverified nodes       │
│  Level 0  │  SUSPENDED   │  Revoked trust              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 API Reference

### VivimSDK Class

#### Constructor

```typescript
new VivimSDK(config: SDKConfig)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `SDKConfig` | SDK configuration object |

#### SDKConfig

```typescript
interface SDKConfig {
  did?: string                    // Existing DID
  seed?: Uint8Array               // Seed for key generation
  autoCreate?: boolean            // Auto-create identity
  storage?: {
    defaultLocation: 'local' | 'ipfs' | 'filecoin'
    ipfsGateway?: string
    encryption?: boolean
  }
}
```

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `initialize()` | `async () => Promise<void>` | Initialize SDK and load identity |
| `getIdentity()` | `() => Identity` | Get current identity |
| `createNode()` | `async (type, config) => Promise<Node>` | Create a node instance |

### Identity Node

```typescript
class IdentityNode {
  // Create identity
  create(options: CreateIdentityOptions): Promise<Identity>
  
  // Update identity
  update(identity: Identity): Promise<void>
  
  // Verify signature
  verify(data: Uint8Array, signature: Uint8Array): Promise<boolean>
  
  // Sign data
  sign(data: Uint8Array): Promise<Uint8Array>
}
```

### Memory Node

```typescript
class MemoryNode {
  // Create memory
  create(data: MemoryData): Promise<Memory>
  
  // Query memories
  query(query: MemoryQuery): Promise<Memory[]>
  
  // Update memory
  update(id: string, data: Partial<Memory>): Promise<void>
  
  // Delete memory
  delete(id: string): Promise<void>
  
  // Get related memories
  getRelated(id: string, limit?: number): Promise<Memory[]>
}
```

### Content Node

```typescript
class ContentNode {
  // Create content
  create(data: ContentData): Promise<ContentObject>
  
  // Get content by CID
  getByCid(cid: string): Promise<ContentObject>
  
  // Search content
  search(query: ContentQuery): Promise<ContentObject[]>
  
  // Pin content (keep local)
  pin(cid: string): Promise<void>
  
  // Unpin content
  unpin(cid: string): Promise<void>
}
```

### Social Node

```typescript
class SocialNode {
  // Send friend request
  sendFriendRequest(target: string): Promise<void>
  
  // Accept friend request
  acceptFriendRequest(requestId: string): Promise<void>
  
  // Create circle
  createCircle(options: CircleOptions): Promise<Circle>
  
  // Follow user
  follow(target: string): Promise<void>
  
  // Get friends
  getFriends(): Promise<Friend[]>
}
```

---

## 📁 Package Structure

```
sdk/
├── src/
│   ├── core/                    # Core SDK functionality
│   │   ├── sdk.ts               # Main SDK class
│   │   ├── identity.ts          # Identity management
│   │   ├── anchor.ts            # Blockchain anchor system
│   │   ├── recordkeeper.ts      # On-chain recordkeeping
│   │   ├── l0-storage.ts        # L0 core storage
│   │   ├── memory-node.ts       # Memory operations
│   │   ├── content-node.ts      # Content operations
│   │   ├── social-node.ts       # Social graph operations
│   │   └── ai-chat-node.ts      # AI chat operations
│   │
│   ├── apps/                    # Pre-built applications
│   │   ├── ai-git/              # AI-powered Git assistant
│   │   ├── ai-documentation/    # Auto-documentation generator
│   │   ├── acu-processor/       # ACU memory processor
│   │   ├── assistant-engine/    # AI assistant runtime
│   │   ├── circle-engine/       # Circle management
│   │   ├── crypto-engine/       # Cryptography utilities
│   │   ├── omni-feed/           # Unified content feed
│   │   ├── publishing-agent/    # Content publishing
│   │   ├── roadmap-engine/      # Roadmap management
│   │   ├── tool-engine/         # Tool integration
│   │   └── public-dashboard/    # Public dashboard
│   │
│   ├── nodes/                   # Node implementations
│   │   ├── identity-node.ts
│   │   ├── memory-node.ts
│   │   ├── content-node.ts
│   │   ├── social-node.ts
│   │   ├── storage-node.ts
│   │   └── ai-chat-node.ts
│   │
│   ├── protocols/               # Network protocols
│   │   ├── exit-node.ts         # Exit node protocol
│   │   └── sync.ts              # State sync protocol
│   │
│   ├── extension/               # Extension system
│   │   ├── extension-system.ts
│   │   └── assistant-ui-adapter.ts
│   │
│   ├── graph/                   # Graph database
│   │   └── graph.ts
│   │
│   ├── registry/                # Service registry
│   │   └── registry.ts
│   │
│   ├── utils/                   # Utilities
│   │   ├── crypto.ts
│   │   └── logger.ts
│   │
│   └── bun/                     # Bun-specific modules
│       ├── server.ts
│       └── sqlite-store.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧩 Apps Built with SDK

The SDK includes several pre-built applications:

### 🤖 AI Git Assistant

Git operations powered by AI:

```typescript
import { AIGitApp } from '@vivim/sdk/apps/ai-git'

const gitApp = new AIGitApp(sdk)

// Auto-generate commit messages
const commitMessage = await gitApp.generateCommitMessage()

// Review pull requests
const review = await gitApp.reviewPR('feature-branch')
```

### 📝 Auto-Documentation

Generate documentation from code:

```typescript
import { AIDocumentationApp } from '@vivim/sdk/apps/ai-documentation'

const docApp = new AIDocumentationApp(sdk)

// Generate docs for a file
const docs = await docApp.generateDocumentation({
  filePath: './src/index.ts',
  format: 'markdown'
})
```

### 🧠 ACU Processor

Process and score memories:

```typescript
import { ACUProcessor } from '@vivim/sdk/apps/acu-processor'

const processor = new ACUProcessor(sdk)

// Process raw content into memory
const memory = await processor.process({
  content: 'Meeting notes from today...',
  context: { source: 'meeting', participants: ['alice', 'bob'] }
})
```

### 📰 Omni Feed

Unified content feed:

```typescript
import { OmniFeedApp } from '@vivim/sdk/apps/omni-feed'

const feed = new OmniFeedApp(sdk)

// Get personalized feed
const items = await feed.get({
  limit: 20,
  types: ['post', 'article', 'memory'],
  fromFriends: true
})
```

---

## 🤝 Contributing

### Development Setup

```bash
# Clone and navigate to SDK
git clone https://github.com/owenservera/vivim-app.git
cd vivim-app/sdk

# Install dependencies
bun install

# Build the SDK
bun run build

# Run tests
bun run test
```

### Running Examples

```bash
# Start the publishing agent
cd apps/publishing-agent
bun run dev

# Start the public dashboard
cd apps/public-dashboard
bun run dev
```

### Documentation

To contribute to SDK documentation:

1. Edit the relevant `.md` file in `docs/`
2. Run `npm run build` in `vivim.docs.context/`
3. Submit a pull request

---

## 📜 License

MIT License - see [LICENSE](../LICENSE) for details.

---

## 🔗 Related Packages

| Package | Description |
|---------|-------------|
| [@vivim/network-engine](./NETWORK.md) | P2P networking and CRDT sync |
| [vivim-server](./SERVER.md) | Backend API server |
| [vivim-pwa](./PWA.md) | Progressive web application |

---

<div align="center">

**Built with ❤️ by the VIVIM Team**

[⬆ Back to top](#vivim-sdk) | [🏠 Back to Main Repo](../README.md)

</div>
