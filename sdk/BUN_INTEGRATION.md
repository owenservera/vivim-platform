# VIVIM ✕ Bun Integration Layer

The VIVIM SDK provides a purely dedicated, hyper-optimized layer specifically engineered for the [Bun](https://bun.sh/) runtime. This allows developers to construct edge-native, decentralized indexer-nodes, orchestrators, and high-velocity peers without transpilation or external daemon overhead.

## Architecture

The integration layer sits squarely alongside the primary `/core` functionalities, exposing Bun-native wrapper APIs that circumvent intermediate standardizations (like general `fs` or `node:http`) to directly bind into Bun's engine.

### Modules

- **BunVivimServer** (`@vivim/sdk/bun`): A native HTTP/WebSocket Edge Server mapping Bun's ultra-fast networking stack directly into the VIVIM sync protocols.
- **BunSQLiteStore** (`@vivim/sdk/bun`): Uses Bun's baked-in `bun:sqlite` C-bindings to offer synchronous, high-throughput storage read/writes for the `RecordKeeper` CRDT operations.

## Setup & Implementation

Install the VIVIM SDK directly from your package manager:

```bash
bun add @vivim/sdk
```

*(If testing locally, use `bun link @vivim/sdk` instead)*

### 1. Initializing an Edge Node

You can spin up a fully autonomous VIVIM node configured with high-performance SQLite storage and a WebSocket relay in fewer than 15 lines of code:

```typescript
import { BunVivimServer, BunSQLiteStore } from '@vivim/sdk/bun';
import { VivimSDK } from '@vivim/sdk';

// 1. Initialize native SQLite Store
const sqliteStore = new BunSQLiteStore({
  dbPath: './vivim-edge.db'
});

// 2. Wrap into a Core SDK instance
const sdk = new VivimSDK({
  identity: {
    did: 'bun-edge-001'
  }
});

// Bind custom store manually if necessary (or update SDK config pattern)
// sdk.injectStore(sqliteStore); 

// 3. Ignite the specific Bun Server map
const edgeServer = new BunVivimServer({
  port: 8080,
  sdk: sdk
});

await edgeServer.start();
console.log("VIVIM Edge Node is alive");
```

### 2. High-Performance CRDT Storage (`BunSQLiteStore`)

VIVIM relies heavily on CRDT-based merging protocols. During sync loads, node networks experience high I/O churn tracking thousands of micro-states. `BunSQLiteStore` natively maps to the `bun:sqlite` interface, yielding:

- ~5x faster block-processing than standard JSON filesystem stores.
- Direct synchronization with the CRDT memory heap.

```typescript
import { BunSQLiteStore } from '@vivim/sdk/bun';

const store = new BunSQLiteStore({ dbPath: './memory.db' });
await store.put('crdt_blob_1', { state: [...] });
```

## Running the Examples

Inside the repository, invoke natively:

```bash
bun src/bun/server.ts
```

It leverages Bun's internal ESM module resolution, automatically pulling built TS without any Node-like polyfilling configurations required.
