# Project Overview

## What this app does
VIVIM is a personal AI memory platform that acts as a "personal digital brain." It allows users to capture, store, and interact with their AI conversations across multiple providers (ChatGPT, Claude, Gemini, etc.). It indexes these interactions and uses a dynamic context engine to retrieve the exact context needed for personalized AI interactions. VIVIM is fundamentally decentralized, leveraging local-first data storage with peer-to-peer (P2P) synchronization and end-to-end encryption. 

## The SDK and its relationship to the app
The VIVIM SDK is an open-source, end-to-end self-contained toolkit for building decentralized, AI-driven applications. While the main app is the primary frontend/backend experience, the SDK provides the underlying building blocks (API Nodes) for identity, storage, memory, AI chat, and social features. The app acts as an implementation that consumes the SDK's architecture and primitives, bridging local client interactions with the decentralized network mesh. They share a contract over the `Communication Protocol` via standard message envelopes.

## Tech Stack
**Frontend (PWA)**
- React 19.2.4
- TypeScript ~5.9.3
- Vite 7.2.5
- TailwindCSS 4.1.18
- State Management: Zustand 5.0.11, TanStack Query 5.90.21
- Local Storage: Dexie 4.0.10 (IndexedDB wrapper)
- Sync: Yjs 13.6.29, y-websocket

**Backend (Server)**
- Bun runtime >= 1.0.0
- Express 5.2.1
- Prisma 7.3.0
- PostgreSQL 16.x
- Redis (ioredis 5.9.3)
- AI SDKs: @ai-sdk/openai, anthropic, google, xai

**Network Engine & SDK**
- libp2p ^1.0.0 (WebRTC, WebSockets, TCP)
- @noble/crypto, @noble/ed25519 (Cryptography)
- multiformats ^13.0.0
- Yjs (CRDT for peer sync)
- Helia (IPFS integration)

## Folder and Module Structure
- `pwa/` - The Progressive Web App (Frontend). Contains the React 19 UI, local storage logic, and client-side sync.
- `server/` - The Backend API Server. Handles OAuth, centralized REST endpoints, conversation extraction, and the initial context engine logic.
- `network/` - The P2P Network Engine. Built on libp2p, providing WebRTC transports, DHT discovery, and CRDT synchronization.
- `sdk/` - The Core Developer Toolkit. Exposes standard API nodes (`IdentityNode`, `MemoryNode`, `ContentNode`) and the communication protocol.
- `admin-panel/` - Platform Management Dashboard. A React-based monitoring interface for observing network health, metrics, and database stats.
- `common/` - Shared utilities. Houses the global `ErrorReporter` and synced type definitions.

## Entry Points, Bootstrapping, and Environment
- **PWA**: Bootstraps via `pwa/src/main.tsx` into a standard Vite + React tree, initializing Zustand stores (`appStore.ts`), connecting to IndexedDB, and establishing Socket.IO links.
- **Server**: Entry point is `server/src/server.js`, setting up the Express app, connecting to Prisma, configuring Passport (OAuth), and mounting routes. 
- **SDK**: Bootstrapped via the `VivimSDK` class. It manages a dynamic plugin registry, loads requested nodes (Identity, Storage, etc.), and initializes the P2P Graph network.
- **Environment**: Configurations rely heavily on `.env` variables for PostgreSQL URIs, Redis URIs, AI Provider API keys, JWT secrets, and LibP2P addresses.