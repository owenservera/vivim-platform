# Quick Start Prompt for New AI Session

Copy and paste this entire prompt into a new AI session to design the VIVIM blockchain:

---

## PROMPT START

```
I need you to design a custom blockchain for VIVIM, a distributed AI memory platform.

### What VIVIM Does
VIVIM captures AI conversations from multiple providers (ChatGPT, Claude, Gemini) and extracts reusable knowledge units called "Atomic Chat Units" (ACUs). Users can share insights, build knowledge graphs, and maintain a personal AI memory.

### Current Architecture
- PWA frontend (React 19, Vite, TanStack Query)
- Express.js server with PostgreSQL
- P2P network engine that EXISTS but is not integrated

### What Already Exists (CRITICAL - READ THESE)

1. **Network Engine** (`network/` package) - PRODUCTION READY:
   - `NetworkNode.ts` - Full libp2p with WebRTC, DHT, GossipSub
   - `CRDTSyncService.ts` - Yjs-based sync
   - `Libp2pYjsProvider.ts` - GossipSub for Yjs (NO signaling server needed!)
   - `DHTService.ts` - Kademlia content routing
   - `KeyManager.ts` - Ed25519 key management
   - `PubSubService.ts` - Topic-based messaging

2. **Data Models** already have blockchain-ready fields:
   - `User.did` - Decentralized identifier
   - `User.publicKey` - Ed25519 public key
   - `AtomicChatUnit.signature` - Signed content
   - `SyncOperation.hlcTimestamp` - Hybrid Logical Clock
   - `SyncOperation.vectorClock` - Causality tracking

3. **Inspiration Sources**:
   - Nostr: Signed events with kinds, relay-based distribution
   - Ceramic: Stream-based data with composability
   - IPFS: Content-addressed storage (CIDs)

### What You Need to Design

1. **ChainEvent** - A signed, content-addressed event structure:
   - id: CID of the event
   - type: Operation type (conversation:create, acu:create, etc.)
   - author: DID of creator
   - timestamp: HLC timestamp
   - payload: Operation-specific data
   - signature: Ed25519 signature
   - vectorClock: For CRDT merging

2. **VivimChainClient** - The main API class:
   - initializeIdentity() - Create/load DID
   - createEntity(type, data) - Create signed entity
   - updateEntity(id, updates) - CRDT merge
   - sync() - GossipSub + DHT sync
   - subscribe(filter, callback) - Real-time updates

3. **Event Handlers** - State transitions per event type:
   - conversation:create/update/delete
   - message:create
   - acu:create/derive/share
   - memory:create/link
   - social:follow/friend_request
   - circle:create/add_member

4. **DHT Schema** - Key structure for discovery:
   - `/vivim/content/{cid}` - Content metadata
   - `/vivim/authors/{did}/content` - Author's content
   - `/vivim/entities/{id}` - Entity state

5. **Sync Protocol** - Over GossipSub:
   - Topics: `/vivim/events/v1`, `/vivim/entity/{id}/v1`
   - Event announcement
   - Vector clock exchange
   - Conflict resolution

### Constraints
- Must work in browser (WebRTC, IndexedDB)
- Must work offline (local-first CRDT)
- Must integrate with existing network engine
- Must maintain ACU lineage and provenance

### Files to Read
- `VIVIM_BLOCKCHAIN_DESIGN_CONTEXT.md` - Complete context document
- `VIVIM_CHAIN_API_DESIGN.md` - Preliminary API design
- `network/src/index.ts` - Network engine exports
- `network/src/p2p/NetworkNode.ts` - libp2p configuration
- `network/src/crdt/Libp2pYjsProvider.ts` - Decentralized Yjs
- `server/prisma/schema.prisma` - All data models

### Deliverables
1. Complete TypeScript interfaces for ChainEvent, EntityState, Block
2. VivimChainClient class with full implementation
3. Event handler registry with validation and state transitions
4. DHT key schema with registration/resolution
5. GossipSub sync protocol specification
6. Security model (authorization rules per event type)
7. Implementation roadmap with file locations

Start by reading `VIVIM_BLOCKCHAIN_DESIGN_CONTEXT.md` for complete context, then design the blockchain architecture.
```

## PROMPT END

---

## Usage Instructions

1. Open a new AI session
2. Copy the content between `## PROMPT START` and `## PROMPT END`
3. Paste into the new session
4. The AI will have all context needed to design the blockchain

## Context Files to Provide

Ensure these files are available in the workspace:
- `VIVIM_BLOCKCHAIN_DESIGN_CONTEXT.md` (complete context - 944 lines)
- `VIVIM_CHAIN_API_DESIGN.md` (API design - 1044 lines)
- `P2P_TRANSFORMATION_FINDINGS.md` (research findings - 71 lines)
