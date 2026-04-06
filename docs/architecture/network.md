itle: "Network"
description: "VIVIM's decentralized network layer: libp2p for peer discovery, CRDT for conflict-free synchronization, and ActivityPub for federation."
---

# Network

VIVIM's network layer enables decentralized, peer-to-peer synchronization of AI memories across devices and instances — without relying on any central server.

## Architecture overview

```
┌──────────────────────────────────────────────────────────┐
│                  Network Stack                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────┐                │
│  │         ActivityPub                 │  Federation    │
│  └──────────────────┬──────────────────┘                │
│                     │                                    │
│  ┌──────────────────▼──────────────────┐                │
│  │         CRDT (Yjs)                  │  Sync          │
│  └──────────────────┬──────────────────┘                │
│                     │                                    │
│  ┌──────────────────▼──────────────────┐                │
│  │         libp2p                      │  Transport     │
│  │  DHT │ WebRTC │ WebSockets │ TCP   │                │
│  └─────────────────────────────────────┘                │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## libp2p transport

libp2p provides the networking foundation:

| Component | Purpose | Protocol |
|---|---|---|
| **Peer Discovery** | Finding other VIVIM nodes | DHT (Distributed Hash Table) |
| **Transport** | Data transfer | WebRTC, WebSockets, TCP |
| **Security** | Encrypted peer connections | Noise protocol |
| **Stream multiplexing** | Multiple channels per connection | mplex, yamux |

### Peer discovery

Peers find each other through the Distributed Hash Table (DHT):



1. **Bootstrap**
   A new VIVIM node connects to bootstrap peers (well-known nodes in the network).

  
2. **Announce**
   The node publishes its presence in the DHT with its DID and available services.

  
3. **Discovery**
   Other nodes query the DHT to find peers with specific capabilities (e.g., "nodes that can sync circle memories").

  
4. **Connection**
   Direct peer-to-peer connections are established via WebRTC or WebSockets, with NAT traversal.


## CRDT synchronization

VIVIM uses Yjs, a high-performance CRDT (Conflict-free Replicated Data Type) library, for synchronization:

| Property | Description |
|---|---|
| **Conflict-free** | Concurrent edits always converge to the same state |
| **Eventual consistency** | All peers eventually see the same data |
| **Offline-first** | Changes made offline sync when reconnected |
| **Incremental** | Only changed data is transmitted |

### Sync flow

```
┌─────────────────────────────────────────────┐
│          CRDT Sync Flow                      │
├─────────────────────────────────────────────┤
│                                              │
│  Peer A          Network          Peer B    │
│    │                │                │       │
│    │─── State ─────▶│                │       │
│    │   Vector       │                │       │
│    │                │─── State ──────▶│       │
│    │                │   Vector        │       │
│    │                │                 │       │
│    │◀── Diff ───────│─────────────────│       │
│    │   Request      │                 │       │
│    │                │                 │       │
│    │─── Diff ───────│─────────────────▶│       │
│    │   Data         │                 │       │
│    │                │                 │       │
│    │                │◀── Merge ───────│       │
│    │                │   Complete      │       │
│                                              │
└─────────────────────────────────────────────┘
```

## ActivityPub federation

ActivityPub enables federation across VIVIM instances:

| Feature | Description |
|---|---|
| **Cross-instance sharing** | Share memories across different VIVIM deployments |
| **Actor model** | Each user/circle is an ActivityPub Actor |
| **Activity types** | Create, Update, Delete, Share, Follow |
| **Inbox/Outbox** | Standard ActivityPub message queues |

### Federation use cases

| Scenario | How it works |
|---|---|
| **Personal instance to cloud** | Self-hosted node shares selected memories with VIVIM Cloud |
| **Organization to organization** | Two company instances share team memories securely |
| **Community knowledge** | Public circles share patterns and best practices |

## Network security

All network communication is encrypted and authenticated:

| Layer | Security |
|---|---|
| **Transport** | Noise protocol (libp2p), TLS (WebSockets) |
| **Application** | AES-256-GCM (client-side encryption) |
| **Authentication** | DID-based peer verification |
| **Authorization** | Circle-scoped access controls |


::: warning
The P2P network layer is still under active development. CRDT sync works for single-circle scenarios. Multi-circle federation sync is planned for Q4 2025.
:::



::: info
For the complete network protocol specification, see the [P2P Network documentation](https://github.com/owenservera/vivim-platform/tree/main/vivim-docs/04-NETWORK-SDK/p2p-network) in the repository.
:::

