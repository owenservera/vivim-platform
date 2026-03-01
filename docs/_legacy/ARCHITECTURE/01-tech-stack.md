# VIVIM Technical Stack Documentation

## Overview

VIVIM is a comprehensive monorepo web application designed for AI content capture, knowledge management, and social networking. The system employs a modern technology stack with a focus on decentralization, real-time synchronization, and privacy.

---

## 1. Monorepo Structure

```
vivim-app/
├── pwa/              # Progressive Web App (Frontend)
├── server/           # Backend API Server
├── network/          # P2P Network Engine
├── admin-panel/      # Admin Dashboard
├── common/           # Shared utilities and error tracking
└── VIVIM.docs/      # Project Documentation
```

---

## 2. Frontend (PWA) - Technology Stack

### Core Framework

| Technology       | Version | Purpose             |
| ---------------- | ------- | ------------------- |
| React            | 19.2.4  | UI Framework        |
| React DOM        | 19.2.4  | React DOM rendering |
| React Router DOM | 7.13.0  | Client-side routing |

### Build & Development

| Technology  | Version | Purpose                   |
| ----------- | ------- | ------------------------- |
| Vite        | 7.2.5   | Build tool and dev server |
| TypeScript  | ~5.9.3  | Type safety               |
| TailwindCSS | 4.1.18  | Utility-first CSS         |
| PostCSS     | 8.5.6   | CSS processing            |
| ESLint      | 9.39.2  | Code linting              |

### State Management

| Technology     | Version | Purpose                      |
| -------------- | ------- | ---------------------------- |
| Zustand        | 5.0.11  | Lightweight state management |
| TanStack Query | 5.90.21 | Server state caching         |
| Dexie          | 4.0.10  | IndexedDB wrapper            |
| IDB            | 8.0.3   | IndexedDB Promises           |

### Real-time & Sync

| Technology       | Version | Purpose                   |
| ---------------- | ------- | ------------------------- |
| Socket.io Client | 4.8.3   | WebSocket client          |
| Yjs              | 13.6.29 | CRDT for collaboration    |
| Y-Websocket      | 3.0.0   | Yjs WebSocket provider    |
| Y-IndexedDB      | 9.0.12  | Yjs IndexedDB persistence |

### UI Components & Styling

| Technology     | Version | Purpose                 |
| -------------- | ------- | ----------------------- |
| Lucide React   | 0.563.0 | Icon library            |
| Tailwind Merge | 3.4.1   | Tailwind class merging  |
| clsx           | 2.1.1   | Conditional class names |
| QRCode React   | 4.2.0   | QR code generation      |

### Content & Markdown

| Technology     | Version | Purpose            |
| -------------- | ------- | ------------------ |
| React Markdown | 10.1.0  | Markdown rendering |

### Security & Cryptography

| Technology     | Version | Purpose                          |
| -------------- | ------- | -------------------------------- |
| TweetNaCl      | 1.0.3   | Cryptographic library            |
| TweetNaCl Util | 0.15.1  | NaCl utilities                   |
| ed2curve       | ^0.3.0  | Ed25519 to X25519 key conversion |

### PWA Features

| Technology      | Version | Purpose        |
| --------------- | ------- | -------------- |
| Vite Plugin PWA | 1.2.0   | PWA generation |

### Testing

| Technology      | Version | Purpose            |
| --------------- | ------- | ------------------ |
| Vitest          | 4.0.18  | Unit testing       |
| Testing Library | 16.3.2  | React testing      |
| Happy DOM       | 15.11.7 | DOM implementation |

---

## 3. Backend (Server) - Technology Stack

### Runtime & Framework

| Technology | Version | Purpose            |
| ---------- | ------- | ------------------ |
| Bun        | >=1.0.0 | JavaScript runtime |
| Express    | 5.2.1   | Web framework      |
| TypeScript | 5.7.3   | Type safety        |

### Database

| Technology            | Version | Purpose               |
| --------------------- | ------- | --------------------- |
| Prisma Client         | 7.3.0   | ORM                   |
| PostgreSQL            | -       | Primary database      |
| LibSQL                | 0.14.0  | SQLite-compatible DB  |
| Prisma Adapter LibSQL | 7.3.0   | LibSQL Prisma adapter |
| Prisma Adapter PG     | 7.3.0   | PostgreSQL adapter    |

### AI & ML Integrations

| Technology    | Version | Purpose                      |
| ------------- | ------- | ---------------------------- |
| AI SDK        | 6.0.82  | Unified AI SDK               |
| OpenAI SDK    | 6.22.0  | OpenAI integration           |
| Anthropic SDK | 3.0.42  | Anthropic/Claude integration |
| Google AI SDK | 3.0.26  | Google AI integration        |
| xAI SDK       | 3.0.54  | xAI integration              |

### Authentication & Security

| Technology              | Version | Purpose                       |
| ----------------------- | ------- | ----------------------------- |
| Passport                | 0.7.0   | Authentication middleware     |
| Passport Google OAuth20 | 2.0.0   | Google OAuth                  |
| JWT                     | 9.0.3   | JSON Web Tokens               |
| Helmet                  | 8.1.0   | Security headers              |
| CORS                    | 2.8.6   | Cross-origin resource sharing |
| Express Rate Limit      | 8.2.1   | Rate limiting                 |

### Session Management

| Technology      | Version | Purpose            |
| --------------- | ------- | ------------------ |
| Express Session | 1.19.0  | Session middleware |

### Real-time Communication

| Technology | Version | Purpose          |
| ---------- | ------- | ---------------- |
| Socket.io  | 4.8.3   | WebSocket server |

### Web Scraping & Browser Automation

| Technology        | Version | Purpose                    |
| ----------------- | ------- | -------------------------- |
| Playwright        | 1.58.2  | Browser automation         |
| Playwright Extra  | 4.3.6   | Playwright plugins         |
| Puppeteer Stealth | 2.11.2  | Stealth browser automation |
| Cheerio           | 1.2.0   | HTML parsing               |

### Logging & Monitoring

| Technology  | Version | Purpose           |
| ----------- | ------- | ----------------- |
| Pino        | 10.3.1  | JSON logger       |
| Pino Pretty | 13.1.3  | Pretty print logs |

### Data Validation

| Technology | Version | Purpose           |
| ---------- | ------- | ----------------- |
| Zod        | 4.3.6   | Schema validation |

### Utilities

| Technology  | Version | Purpose               |
| ----------- | ------- | --------------------- |
| UUID        | 13.0.0  | UUID generation       |
| Dotenv      | 17.2.4  | Environment variables |
| Compression | 1.8.1   | Response compression  |
| YAML        | 0.3.0   | YAML parsing          |
| P Queue     | 9.1.0   | Promise queue         |
| Opossum     | 9.0.0   | Circuit breaker       |

### API Documentation

| Technology         | Version | Purpose           |
| ------------------ | ------- | ----------------- |
| Swagger UI Express | 5.0.1   | API documentation |

### Development Tools

| Technology | Version | Purpose         |
| ---------- | ------- | --------------- |
| ESLint     | 9.20.0  | Code linting    |
| Prettier   | 3.5.0   | Code formatting |
| Vitest     | 4.0.18  | Testing         |
| Supertest  | 7.0.0   | HTTP testing    |

---

## 4. Network Engine (P2P) - Technology Stack

### Core P2P

| Technology        | Version | Purpose                  |
| ----------------- | ------- | ------------------------ |
| libp2p            | 1.0.0   | P2P networking framework |
| libp2p WebRTC     | 6.0.0   | WebRTC transport         |
| libp2p WebSockets | 10.0.0  | WebSocket transport      |
| libp2p TCP        | 11.0.0  | TCP transport            |
| libp2p Noise      | 1.0.0   | Noise protocol           |
| libp2p TLS        | 3.0.0   | TLS encryption           |
| libp2p Yamux      | 8.0.0   | Stream multiplexing      |
| libp2p Multiplex  | 12.0.0  | Connection multiplexing  |

### Distributed Systems

| Technology          | Version | Purpose          |
| ------------------- | ------- | ---------------- |
| libp2p Kad-DHT      | 16.0.0  | Kademlia DHT     |
| libp2p Gossipsub    | 15.0.0  | PubSub messaging |
| Chainsafe Gossipsub | 14.0.0  | Extended PubSub  |

### CRDT & Sync

| Technology  | Version | Purpose                |
| ----------- | ------- | ---------------------- |
| Yjs         | 13.6.0  | CRDT library           |
| Y-Websocket | 1.5.0   | Yjs WebSocket provider |
| Y-WebRTC    | 10.3.0  | Yjs WebRTC provider    |

### Cryptography

| Technology    | Version | Purpose              |
| ------------- | ------- | -------------------- |
| Noble Ed25519 | 2.0.0   | Ed25519 signatures   |
| Noble Hashes  | 1.3.0   | Hashing functions    |
| Noble Ciphers | 0.4.0   | Encryption ciphers   |
| Multiformats  | 13.0.0  | Multiformat data     |
| Uint8arrays   | 5.0.0   | Uint8Array utilities |

### Utilities

| Technology | Version | Purpose          |
| ---------- | ------- | ---------------- |
| P Queue    | 8.0.0   | Promise queue    |
| P Retry    | 6.0.0   | Retry logic      |
| P Timeout  | 6.0.0   | Timeout handling |
| Debug      | 4.3.4   | Debugging        |
| WS         | 8.16.0  | WebSocket server |

### Database

| Technology    | Version | Purpose         |
| ------------- | ------- | --------------- |
| Prisma        | 5.0.0   | ORM             |
| Prisma Client | 5.0.0   | Database client |

### Express Server

| Technology  | Version | Purpose      |
| ----------- | ------- | ------------ |
| Express     | 4.18.2  | HTTP server  |
| CORS        | 2.8.5   | Cross-origin |
| Helmet      | 7.1.0   | Security     |
| Compression | 1.7.4   | Compression  |

### Logging

| Technology  | Version | Purpose      |
| ----------- | ------- | ------------ |
| Pino        | 8.17.0  | JSON logging |
| Pino Pretty | 10.3.0  | Pretty print |

### Development

| Technology | Version | Purpose            |
| ---------- | ------- | ------------------ |
| TypeScript | 5.3.0   | Type safety        |
| TSX        | 4.7.0   | TypeScript execute |
| Vitest     | 1.1.0   | Testing            |

---

## 5. Admin Panel - Technology Stack

### Framework

| Technology   | Version | Purpose       |
| ------------ | ------- | ------------- |
| React        | 18.3.1  | UI Framework  |
| React DOM    | 18.3.1  | DOM rendering |
| React Router | 6.22.0  | Routing       |

### Build

| Technology   | Version | Purpose        |
| ------------ | ------- | -------------- |
| Vite         | 6.0.5   | Build tool     |
| TypeScript   | 5.6.2   | Type safety    |
| TailwindCSS  | 3.4.1   | Styling        |
| PostCSS      | 8.4.35  | CSS processing |
| Autoprefixer | 10.4.18 | CSS prefixing  |

### Data & Tables

| Technology     | Version | Purpose      |
| -------------- | ------- | ------------ |
| TanStack Table | 8.13.2  | Data tables  |
| TanStack Query | 5.28.0  | Server state |

### Visualization

| Technology    | Version | Purpose            |
| ------------- | ------- | ------------------ |
| Recharts      | 2.12.2  | Charting library   |
| React D3 Tree | 3.6.2   | Tree visualization |
| Elkjs         | 0.9.3   | Layout algorithm   |

### UI & Animation

| Technology             | Version | Purpose          |
| ---------------------- | ------- | ---------------- |
| Framer Motion          | 11.0.8  | Animation        |
| Lucide React           | 0.356.0 | Icons            |
| React Resizable Panels | 2.0.16  | Resizable panels |
| clsx                   | 2.1.0   | Class names      |
| date-fns               | 3.6.0   | Date utilities   |

### State

| Technology | Version | Purpose          |
| ---------- | ------- | ---------------- |
| Zustand    | 4.5.2   | State management |

---

## 6. Development Tools

### Package Manager

| Technology | Version | Purpose                              |
| ---------- | ------- | ------------------------------------ |
| Bun        | >=1.0.0 | JavaScript runtime & package manager |

### Monorepo Management

| Technology   | Version | Purpose              |
| ------------ | ------- | -------------------- |
| concurrently | 9.2.1   | Run multiple scripts |

---

## 7. External Services & APIs

### AI Providers

- OpenAI (GPT-4, GPT-4o)
- Anthropic (Claude 3, Claude 3.5)
- Google AI (Gemini)
- xAI (Grok)

### Authentication

- Google OAuth 2.0

### Database

- PostgreSQL (primary)
- LibSQL (embedded/SQLite)

---

## 8. Key Dependencies Summary

| Category         | Primary Tech             |
| ---------------- | ------------------------ |
| Runtime          | Bun                      |
| Frontend         | React 19 + Vite          |
| Backend          | Express + Prisma         |
| Database         | PostgreSQL               |
| P2P              | libp2p + Yjs             |
| State (Frontend) | Zustand + TanStack Query |
| State (Local)    | Dexie (IndexedDB)        |
| Real-time        | Socket.io                |
| Auth             | Passport + JWT           |
| Styling          | TailwindCSS 4            |

---

_Document Version: 1.0_
_Last Updated: February 2026_
