# @vivim/sdk

<p align="center">
  <strong>Open-Source E2E Self-Contained Toolkit for Decentralized Applications</strong>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-Native-black.svg?logo=bun" alt="Bun Native"></a>
  <a href="#"><img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version"></a>
  <a href="https://github.com/vivim-app/vivim-app"><img src="https://img.shields.io/badge/GitHub-Repository-lightgrey?logo=github" alt="GitHub Repo"></a>
</p>

---

The **VIVIM SDK** is a powerful, Bun-native toolkit designed for building decentralized, AI-driven, and local-first applications. It provides the essential building blocks for P2P networking, distributed storage, identity management, and autonomous agent loops.

## ✨ Key Features

- **🌐 P2P Mesh Networking**: Built-in support for WebRTC, GossipSub, and peer discovery via `@vivim/network-engine`.
- **📦 Decentralized Storage**: Local-first data model using CRDTs for collision-free synchronization.
- **🆔 Identity Management**: Self-sovereign identity (SSI) and DID-based authentication.
- **🤖 AI Integration**: Native support for decentralized AI agent loops and memory systems.
- **⚡ Bun Optimized**: Leverages Bun's high-performance runtime for maximum execution speed.
- **🔌 Extensible Architecture**: Modular node-based design allowing you to extend and compose functionality.

## 🏗 Architecture Overview

The SDK is organized into modular layers that work together to provide a seamless decentralized experience:

```text
┌─────────────────┐
│   CORE SDK      │  (Orchestration & Events)
└────────┬────────┘
         │
 ┌───────┼───────┐
 ▼       ▼       ▼
┌────────┐ ┌────────┐ ┌────────┐
│NETWORK │ │STORAGE │ │IDENTITY│
└────────┘ └────────┘ └────────┘
```

For a deep dive into the architecture, check out [VIVIM_SDK_DOCUMENTATION.md](../VIVIM_SDK_DOCUMENTATION.md).

## 🚀 Getting Started

### Installation

Install via Bun (recommended):

```bash
bun add @vivim/sdk
```

### Quick Usage

```typescript
import { VivimSDK } from '@vivim/sdk';

// Initialize the decentralized core
const sdk = new VivimSDK({
  identity: {
    did: 'my-node-' + Math.random().toString(36).slice(2, 9),
  },
  storage: {
    encryption: true
  },
  nodes: {
    autoLoad: true
  }
});

await sdk.initialize();

// Connect to the P2P Graph
sdk.on('network:connected', (peerId) => {
  console.log(`Connected to new network peer: ${peerId}`);
});
```

## ⚡ Bun-Native Optimization

The VIVIM SDK includes a dedicated layer for the Bun runtime, providing ultra-fast SQLite storage and native networking.

```typescript
import { BunVivimServer, BunSQLiteStore } from '@vivim/sdk/bun';

const store = new BunSQLiteStore({ dbPath: './vivim.db' });
const server = new BunVivimServer({ port: 8080, sdk });

await server.start();
```

See [BUN_INTEGRATION.md](./BUN_INTEGRATION.md) for more details.

## 📖 Documentation

Detailed documentation is available in the [`/docs`](./docs) directory:

- [Autonomous Workers](./docs/AUTONOMOUS_WORKERS.md)
- [Core Primitive Node Design](./docs/CORE_PRIMITIVE_NODE_DESIGN.md)
- [Social Transport Layer](./docs/SOCIAL_TRANSPORT_LAYER.md)
- [Feature Decomposition](./docs/FEATURE_DECOMPOSITION.md)
- [Development Roadmap](./docs/DEVELOPMENT_ROADMAP.md)

## 💡 Examples

Check out the [`/examples`](./examples) directory for runnable examples:

- [Basic Node](./examples/basic-node): Minimal setup to get a node running.

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](./CONTRIBUTING.md) for more information.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by the VIVIM Community
</p>
