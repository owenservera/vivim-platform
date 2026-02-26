---
sidebar_position: 1
---

# VIVIM SDK Overview

The **VIVIM SDK** is an open-source, end-to-end, self-contained toolkit for building decentralized, AI-native, and local-first applications. It provides a modular architecture where developers can build, extend, and contribute to a growing network of API nodes and SDK components.

## 🎯 Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VIVIM SDK ECOSYSTEM                                   │
│                                                                              │
│                         ┌─────────────────┐                                  │
│                         │   CORE SDK      │                                  │
│                         │   (@vivim/sdk)  │                                  │
│                         └────────┬────────┘                                  │
│                                  │                                           │
│          ┌───────────────────────┼───────────────────────┐                   │
│          │                       │                       │                   │
│          ▼                       ▼                       ▼                   │
│   ┌──────────────┐       ┌──────────────┐       ┌──────────────┐            │
│   │  API NODES   │       │  SDK NODES   │       │ NETWORK NODES│            │
│   │              │       │              │       │              │            │
│   │ • Identity   │       │ • React Kit  │       │ • Bootstrap  │            │
│   │ • Storage    │       │ • Vue Kit    │       │ • Relay      │            │
│   │ • AI Chat    │       │ • Svelte Kit │       │ • Indexer    │            │
│   │ • Social     │       │ • Flutter    │       │ • Anchor     │            │
│   │ • Memory     │       │ • React Nat. │       │              │            │
│   └──────┬───────┘       └──────┬───────┘       └──────┬───────┘            │
│          │                      │                      │                     │
│          └──────────────────────┴──────────────────────┘                     │
│                                 │                                            │
│                                 ▼                                            │
│                    ┌────────────────────────┐                                │
│                    │    NETWORK GRAPH       │                                │
│                    │    (P2P Mesh)          │                                │
│                    │                        │                                │
│                    │  ○──○──○──○──○         │                                │
│                    │  │  │  │  │  │         │                                │
│                    │  ○──○──○──○──○         │                                │
│                    │  │  │  │  │  │         │                                │
│                    │  ○──○──○──○──○         │                                │
│                    └────────────────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @vivim/sdk

# Using Bun
bun add @vivim/sdk

# Using yarn
yarn add @vivim/sdk
```

### Basic Usage

```typescript
import { VivimSDK } from '@vivim/sdk/core';

// Initialize the SDK
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

// Start the SDK
await sdk.initialize();

// Load a node
const storageNode = await sdk.loadNode('storage');
await storageNode.save({ key: 'my-data', value: { hello: 'world' } });
```

## 📦 Package Structure

The VIVIM SDK is organized into several packages:

| Package | Description | Repository |
|---------|-------------|------------|
| [`@vivim/sdk`](https://github.com/vivim/vivim-sdk) | Core SDK | [GitHub](https://github.com/vivim/vivim-sdk) |
| `@vivim/nodes-api` | Official API Nodes | [GitHub](https://github.com/vivim/vivim-sdk) |
| `@vivim/nodes-sdk` | Official SDK Nodes (React, Vue, etc.) | [GitHub](https://github.com/vivim/vivim-sdk) |
| `@vivim/nodes-network` | Network Infrastructure | [GitHub](https://github.com/vivim/vivim-sdk) |
| `@vivim/cli` | Developer CLI | [GitHub](https://github.com/vivim/vivim-sdk) |

## 🏗️ Architecture

### Node Types

| Node Type | Description | Can Create | Can Extend |
|-----------|-------------|------------|------------|
| **API Node** | Core functionality module | Anyone | Anyone |
| **SDK Node** | Platform/framework adapter | Anyone | Anyone |
| **Network Node** | Infrastructure component | Anyone | Anyone |
| **Composite Node** | Combination of nodes | Anyone | Anyone |

### Design Principles

1. **Modular**: Every feature is an independent node
2. **Extensible**: Users can extend any node
3. **Composable**: Nodes can be combined
4. **Discoverable**: Nodes publish capabilities to network
5. **Versioned**: Semantic versioning with migration paths
6. **Isolated**: Nodes run in isolated contexts
7. **Permissionless**: Anyone can add nodes to the graph

## 🔗 GitHub Repositories

- **Main Application**: [github.com/owenservera/vivim-app](https://github.com/owenservera/vivim-app)
- **SDK**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)

## 📚 Documentation Sections

- [**Core SDK**](./core/overview) - Core types, utilities, and initialization
- [**API Nodes**](./api-nodes/overview) - Identity, Storage, AI Chat, Social, Memory nodes
- [**SDK Nodes**](./sdk-nodes/overview) - React, Vue, Svelte, Flutter adapters
- [**Network**](./network/overview) - P2P networking, bootstrap, relay nodes
- [**Guides**](./guides/getting-started) - Step-by-step tutorials
- [**Examples**](./examples/basic) - Runnable code examples
- [**Advanced**](./advanced/architecture) - Deep dives into architecture

## 🤝 Community & Contributing

- **GitHub Issues**: [Report bugs or request features](https://github.com/vivim/vivim-sdk/issues)
- **Discussions**: [Join the conversation](https://github.com/vivim/vivim-sdk/discussions)
- **Discord**: [Join our community](https://discord.gg/vivim)
- **Twitter**: [@vivim](https://twitter.com/vivim)

## 📄 License

MIT License - See [LICENSE](https://github.com/vivim/vivim-sdk/blob/main/LICENSE) for details.

---

**Built with ❤️ by the VIVIM Community**
