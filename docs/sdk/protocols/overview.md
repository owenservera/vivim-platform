# Protocols

VIVIM uses specialized protocols for decentralized communication, data synchronization, and federation.

## Core Protocols

### 1. ActivityPub (`sdk/src/protocols/activitypub.ts`)
The foundational protocol for Fediverse integration, enabling VIVIM instances to communicate with Mastodon, Pleroma, and other decentralized social platforms.

### 2. Synchronization (`sdk/src/protocols/sync.ts`)
Handles CRDT-based state synchronization across multiple user devices and federated instances.

### 3. Exit Nodes (`sdk/src/protocols/exit-node.ts`)
Manages communication with traditional web services through secure, identifiable gateways.

### 4. Storage Protocols (`sdk/src/protocols/storage/`)
- **Distributed Storage** - Content-addressable storage for large assets.
- **IPFS Integration** - Native support for InterPlanetary File System.
- **Database Schema** - Cross-instance data models.

## Extending Protocols

Developers can implement custom protocols by extending the base protocol classes in the SDK.
