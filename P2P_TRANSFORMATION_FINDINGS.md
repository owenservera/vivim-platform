# Transformation to Modern P2P Distributed System: Findings & Roadmap

This document outlines the strategy for transforming the centralized `vivim-app` architecture into a modern, P2P distributed system with minimal server dependency.

## 1. Executive Summary
The current system relies on a centralized server for Identity, Data Synchronization (Signaling), and Web Scraping (Capture). To achieve a P2P architecture, we will leverage **libp2p** for networking, **DIDs/Verifiable Credentials** for identity, **Yjs** on a gossip protocol for sync, and **Decentralized Web Nodes (DWNs)** for user data.

---

## 2. Current Architecture vs. P2P Future

| Component | Current (Centralized) | P2P Transformation | Technology Stack (Status) |
| :--- | :--- | :--- | :--- |
| **Identity** | Google OAuth + PostgreSQL | Decentralized Identifiers (DIDs) | Veramo / Web5 SDK (Planned) |
| **Networking** | Socket.io / WebSockets | libp2p (WebRTC + Circuit Relay) | `@vivim/network-engine` (Ready) |
| **Data Sync** | Y-Websocket Relay | Yjs over libp2p GossipSub | `CRDTSyncService` (Ready) |
| **Storage** | PostgreSQL / Local FS | IPFS (Global) / DWNs (Private) | Helia / Web5 DWNs (Planned) |
| **Capture** | Server-side Playwright | Distributed Extraction Workers | P2P Proxy via `NetworkNode` (Draft) |
| **Discovery** | Hardcoded API Endpoints | Kademlia DHT | `DHTService` (Ready) |

---

## 3. Core Transformation Pillars (Updated)

### A. Decentralized Identity (DID)
The existing `KeyManager` in `@vivim/network-engine` should be extended to support DIDs.
*   **Action:** Integrate **Veramo** plugins for `did:key` and `did:web` to bridge the libp2p PeerID with a verifiable user identity.

### B. libp2p-based Mesh Network (Leveraging network-engine)
The project already contains a robust libp2p implementation in the `network/` directory.
*   **Status:** `NetworkNode` and `ConnectionManager` are implemented.
*   **Optimization:** Port the `network-engine` to run in a **Web Worker** within the PWA to prevent UI thread blocking. Ensure `@libp2p/webrtc` is the primary transport for browser peers.

### C. Data Sovereignty (DWNs & IPFS)
*   **User Data:** Integrate **Decentralized Web Nodes (DWNs)** for cross-device state.
*   **Action:** Replace the Prisma-based `SyncOperation` table with a DWN-backed store.

### D. Distributed Capture Engine
Transform the centralized `server/src/routes/capture.js` into a distributed capability.
*   **Mechanism:** Peers can register as "Extraction Providers" in the `DHTService`. When a PWA needs a URL captured, it queries the DHT for a provider and sends an extraction request over a libp2p stream.

---

## 4. Implementation Roadmap (Phased)

### Phase 1: Local-First & Identity (Now - 2 Weeks)
1.  **Replace Auth:** Migrate from Google OAuth to `did:key` using the WebCrypto API.
2.  **Storage:** Implement **Dexie.js** with **Yjs** for local persistence.
3.  **Prototype:** Create a "Serverless" mode where the PWA works entirely offline using IndexedDB.

### Phase 2: P2P Transport (2 - 4 Weeks)
1.  **Libp2p Integration:** Configure `js-libp2p` with WebRTC and GossipSub.
2.  **Signaling:** Deploy 2-3 generic libp2p relay nodes (bootstrap nodes) to replace the current `sync` server.
3.  **Yjs-Libp2p:** Connect Yjs updates to a GossipSub topic.

### Phase 3: Content Addressable Storage (4 - 6 Weeks)
1.  **IPFS Integration:** Use **Helia** to store and share "Captured" content.
2.  **Verification:** Implement CID-based integrity checks for all shared data.

### Phase 4: Distributed Workers (6+ Weeks)
1.  **Headless Node:** Release a CLI/Desktop tool that users can run to provide "Scraping Power" to the network in exchange for credits/access.

---

## 5. Security & Privacy Considerations
*   **E2E Encryption:** All libp2p streams are encrypted via Noise by default.
*   **Privacy:** Use **Zk-Proofs** or **Private Set Intersection** if peers need to discover common interests without revealing their full data set.
*   **Post-Quantum:** Leverage the existing Kyber implementation to secure the initial DID/PeerID exchange.

---
*Created on: February 26, 2026*
