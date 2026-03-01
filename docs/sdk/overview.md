---
sidebar_position: 1
---

# VIVIM SDK Overview

> **Open-Source E2E Self-Contained Toolkit for Decentralized Applications**

The **VIVIM SDK** (`@vivim/sdk`) is a powerful, Bun-native toolkit designed for building decentralized, AI-driven, and local-first applications. It provides the essential building blocks for P2P networking, distributed storage, identity management, and autonomous agent loops.

## 📦 Package Information

| Property | Value |
|----------|-------|
| **Package Name** | `@vivim/sdk` |
| **Version** | `1.0.0` |
| **License** | MIT |
| **Repository** | [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk) |
| **Runtime** | Bun, Node.js >= 20 |
| **Type** | ES Modules |

## ✨ Key Features

- **🌐 P2P Mesh Networking**: Built-in support for WebRTC, GossipSub, and peer discovery via `@vivim/network-engine`
- **📦 Decentralized Storage**: Local-first data model using CRDTs for collision-free synchronization
- **🆔 Identity Management**: Self-sovereign identity (SSI) and DID-based authentication
- **🤖 AI Integration**: Native support for decentralized AI agent loops and memory systems
- **⚡ Bun Optimized**: Leverages Bun's high-performance runtime for maximum execution speed
- **🔗 Chain of Trust**: On-chain recordkeeping via RecordKeeper and Anchor Protocol
- **🔌 Extensible Architecture**: Modular node-based design allowing you to extend and compose functionality

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     VIVIM SDK Architecture                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Applications Layer                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │    │
│  │  │   ACU    │  │ OmniFeed │  │ Circles  │               │    │
│  │  │Processor │  │          │  │  Engine  │               │    │
│  │  └──────────┘  └──────────┘  └──────────┘               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              SDK Core Layer                              │    │
│  │  ┌──────────────────────────────────────────────────┐   │    │
│  │  │            VivimSDK Core                          │   │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │   │    │
│  │  │  │Record    │ │ Anchor   │ │ Self-    │         │   │    │
│  │  │  │Keeper    │ │Protocol  │ │ Design   │         │   │    │
│  │  │  └──────────┘ └──────────┘ └──────────┘         │   │    │
│  │  └──────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Infrastructure Layer                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │  P2P     │  │   L0     │  │  Chain   │              │    │
│  │  │ Network  │  │ Storage  │  │  of      │              │    │
│  │  │ Engine   │  │ (SQLite) │  │  Trust   │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📚 Documentation Structure

### Core SDK

- **[Overview](./core/overview)** - Main SDK class and initialization
- **[Types](./core/types)** - TypeScript type definitions
- **[Constants](./core/constants)** - SDK constants and configuration
- **[RecordKeeper](./core/recordkeeper)** - On-chain operation recording
- **[Anchor Protocol](./core/anchor)** - State anchoring and trust levels
- **[Self-Design](./core/self-design)** - Self-modification capabilities
- **[Assistant Runtime](./core/assistant)** - AI assistant integration

### API Nodes

- **[Identity Node](./api-nodes/identity)** - DID management and profiles
- **[Storage Node](./api-nodes/storage)** - Decentralized storage with IPFS/Filecoin
- **[Content Node](./api-nodes/content)** - Content management and feeds
- **[Social Node](./api-nodes/social)** - Social graph and circles
- **[Memory Node](./api-nodes/memory)** - Knowledge and memory management
- **[AI Chat Node](./api-nodes/ai-chat)** - AI chat with context
- **[ChatLink Nexus](./api-nodes/chatlink)** - Chat linking system
- **[ChatVault Archiver](./api-nodes/chatvault)** - Chat archiving

### Network

- **[Network Engine](./network/overview)** - P2P networking fundamentals
- **[Protocols](./network/protocols)** - Communication protocols
- **[CRDT Schema](./network/crdt)** - Conflict-free replicated data types

## 🚀 Quick Start

### Installation

```bash
# Using Bun (recommended)
bun add @vivim/sdk

# Using npm
npm install @vivim/sdk

# Using yarn
yarn add @vivim/sdk
```

### Basic Usage

```typescript
import { VivimSDK } from '@vivim/sdk';

// Initialize the SDK
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

// Initialize
await sdk.initialize();

console.log('SDK initialized!');
console.log('DID:', sdk.identity?.did);

// Access core modules
const recordKeeper = sdk.getRecordKeeper();
const anchor = sdk.getAnchorProtocol();
const selfDesign = sdk.getSelfDesign();
const assistant = sdk.getAssistant();

// Load a node
const storageNode = await sdk.loadNode('storage');
await storageNode.save({
  key: 'my-data',
  value: { hello: 'world' },
  encrypt: true,
});

// Clean up
await sdk.destroy();
```

## 🔧 Core Modules

### VivimSDK Class

The main entry point for all SDK functionality:

```typescript
class VivimSDK {
  // Core Module Instances
  public readonly recordKeeper: OnChainRecordKeeper;
  public readonly anchor: AnchorProtocol;
  public readonly selfDesign: SelfDesignModule;
  public readonly assistant: VivimAssistantRuntime;
  
  // Methods
  initialize(): Promise<void>;
  loadNode<T>(nodeId: string): Promise<T>;
  registerNode(definition: APINodeDefinition): Promise<string>;
  unloadNode(nodeId: string): Promise<void>;
  destroy(): Promise<void>;
}
```

### RecordKeeper

Provides cryptographic audit trail for all SDK operations:

```typescript
import { OnChainRecordKeeper } from '@vivim/sdk/core';

const recordKeeper = sdk.getRecordKeeper();

// Record an operation
const operation = await recordKeeper.recordOperation({
  type: 'node:create',
  author: sdk.identity.did,
  payload: { nodeId: 'my-node', nodeDefinition: {...} },
});

// Get operation history
const history = await recordKeeper.getOperationHistory(sdk.identity.did);

// Verify operation chain
const verified = await recordKeeper.verifyOperationChain(operation.id);
```

### Anchor Protocol

Handles on-chain state anchoring and trust levels:

```typescript
import { AnchorProtocol, TrustLevel } from '@vivim/sdk/core';

const anchor = sdk.getAnchorProtocol();

// Get current anchor state
const state = await anchor.getState();
console.log('Trust Level:', state.trustLevel);

// Anchor state to chain
await anchor.anchorState();

// Verify trust
const verified = await anchor.verifyTrust('did:vivim:...');
```

### Self-Design Module

Enables self-modification and evolution capabilities:

```typescript
import { SelfDesignModule } from '@vivim/sdk/core';

const selfDesign = sdk.getSelfDesign();

// Apply self-modification
await selfDesign.applyModification({
  type: 'node:add',
  nodeId: 'new-node',
  definition: {...},
});

// Get evolution history
const history = await selfDesign.getEvolutionHistory();
```

### Assistant Runtime

AI assistant integration with context:

```typescript
import { VivimAssistantRuntime } from '@vivim/sdk/core';

const assistant = sdk.getAssistant();

// Process context
const context = await assistant.processContext({
  userId: 'user-123',
  query: 'What did I ask about yesterday?',
});

// Generate response
const response = await assistant.generateResponse(context);
```

## 📊 SDK Events

The SDK emits events for monitoring and debugging:

```typescript
import { VivimSDK, SDK_EVENTS } from '@vivim/sdk';

const sdk = new VivimSDK();

// Listen for events
sdk.on(SDK_EVENTS.NODE_LOADED, (nodeInfo) => {
  console.log('Node loaded:', nodeInfo);
});

sdk.on(SDK_EVENTS.IDENTITY_CREATED, (identity) => {
  console.log('Identity created:', identity.did);
});

sdk.on(SDK_EVENTS.ERROR, (error) => {
  console.error('SDK Error:', error);
});
```

## 🔗 GitHub Repositories

| Repository | Description |
|------------|-------------|
| **[vivim-sdk](https://github.com/vivim/vivim-sdk)** | SDK source code and packages |
| **[vivim-app](https://github.com/owenservera/vivim-app)** | Main application using the SDK |
| **[vivim-live](https://github.com/owenservera/vivim-live)** | Documentation and landing site |

## 📄 License

MIT License - See [LICENSE](https://github.com/vivim/vivim-sdk/blob/main/LICENSE) for details.

---

**Built with ❤️ by the VIVIM Community**
