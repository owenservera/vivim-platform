# VIVIM SDK

**Open-Source E2E Self-Contained Toolkit for Decentralized Applications**

The VIVIM SDK encapsulates the core decentralized architecture into a single, reusable, **Bun-native** and highly performant library. It acts as the backbone layer for any P2P, AI-driven, and local-first application built within the VIVIM ecosystem.

## Core Architecture Overview

The SDK exports the underlying core primitives designed to operate without central servers relying on CRDTs, libp2p, and edge-first logic.

### Architectural Layers
1. **Core SDK (`src/core/sdk.ts`)**: The orchestration layer uniting network operations, identity mapping, and distributed events.
2. **Network Engine (`@vivim/network-engine`)**: Handled transparently by the SDK to facilitate P2P topology, WebRTC connections, and GossipSub messaging.
3. **Record Keeper (`src/core/recordkeeper.ts`)**: The decentralized storage model backed by CRDT logic enabling collision-free local-first data sync.
4. **Self-Design (`src/core/self-design.ts`)**: Programmable, meta-reflective system modules enabling autonomous workflows and decentralized agent loops.
5. **Nodes & Graph**: Encapsulated structures to design localized computation topologies before distributing them across the peer network.

---

## 🚀 Bun Linking & Setup Guide

This SDK is engineered to be natively installable via **[Bun](https://bun.sh/)**, leveraging its blazing fast module resolution and native TypeScript execution. Here is how to interlink the SDK into the VIVIM Server, PWA, or external apps.

### 1. Workspaces Integration (Monorepo)
If you are operating inside the main VIVIM monorepo, the SDK is pre-configured via Bun Workspaces.

**Step 1:** Ensure your consuming package (e.g., `pwa` or `server`) has the dependency mapped in its `package.json`:
```json
{
  "dependencies": {
    "@vivim/sdk": "workspace:*"
  }
}
```

**Step 2:** Install dependencies from the root directory to resolve the links automatically:
```bash
bun install
```

### 2. Local Linkage (Cross-Project Development)
If you are building an *external application* and want to link the SDK locally during development.

**Step 1: Register the SDK**
Navigate to the SDK directory and register it as a local Bun link:
```bash
cd path/to/vivim-app/sdk
bun link
```

**Step 2: Link in the Consumer App**
Navigate to your external project and link the SDK:
```bash
cd path/to/your/app
bun link @vivim/sdk
```

---

## Installing as a Bun Package (Production/External)

Once the SDK is published to a registry (e.g., npm or GitHub Packages), it can be installed natively with zero friction:

```bash
bun add @vivim/sdk
```

### TypeScript Configuration (`tsconfig.json`)
Since the SDK exports native ES Modules (`type: "module"`) built via TypeScript, ensure your consumer app supports Node16+ resolution:
```json
{
  "compilerOptions": {
    "moduleResolution": "Bundler",
    "module": "ESNext",
    "target": "ESNext"
  }
}
```

---

## Usage Example

Importing the Core Architecture directly from the SDK in your consumer application:

```typescript
import { VivimSDK } from '@vivim/sdk';

// Initialize the decentralized core
const sdk = new VivimSDK({
  networkNodeId: 'node-' + Math.random().toString(36).slice(2, 9),
  recordKeeper: true,
  verbosity: 'info'
});

await sdk.start();

// Connect to the P2P Graph
sdk.on('peer:connected', (peerId) => {
  console.log(`Connected to new network peer: ${peerId}`);
});

// Self-design runtime logic
const runtime = sdk.getSelfDesignGraph();
runtime.executeNode('genesis');
```

## Running & Building the SDK Local Source

The SDK itself utilizes `tsc` natively, and can be developed with:

```bash
# Watch mode for hot-recompilation
bun run dev

# Full emission build (output to /dist)
bun run build

# Run unit tests natively leveraging Bun/Vitest
bun run test
```
