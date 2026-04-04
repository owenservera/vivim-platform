# DOCUMENT G: Dependency & Integration Health

**Date**: 2026-03-05
**Project**: VIVIM — Dependencies

---

## Server Dependencies

### Core Runtime
| Package | Version | Purpose | Status |
|--------|---------|---------|--------|
| bun | >=1.0.0 | Runtime | REQUIRED |
| express | 5.2.1 | HTTP server | ACTIVE |
| @prisma/client | 7.3.0 | ORM | ACTIVE |
| prisma | 7.3.0 | DB migration | ACTIVE |
| socket.io | 4.8.3 | WebSockets | ACTIVE |

### AI SDKs
| Package | Version | Purpose | Status |
|--------|---------|---------|--------|
| ai | 6.0.82 | AI SDK | ACTIVE |
| @ai-sdk/openai | 3.0.27 | OpenAI provider | ACTIVE |
| @ai-sdk/anthropic | 3.0.42 | Anthropic provider | ACTIVE |
| @ai-sdk/google | 3.0.26 | Google provider | ACTIVE |
| @ai-sdk/xai | 3.0.54 | xAI provider | ACTIVE |
| openai | 6.22.0 | Legacy OpenAI | ACTIVE |

### Authentication
| Package | Version | Purpose | Status |
|--------|---------|---------|--------|
| passport | 0.7.0 | Auth framework | ACTIVE |
| passport-google-oauth20 | 2.0.0 | Google OAuth | ACTIVE |
| jsonwebtoken | 9.0.3 | JWT tokens | ACTIVE |
| otplib | 12 | TOTP 2FA | ACTIVE |
| qrcode | 1.5.4 | QR code gen | ACTIVE |

### Database
| Package | Version | Purpose | Status |
|--------|---------|---------|--------|
| @prisma/client | 7.3.0 | ORM | ACTIVE |
| @prisma/adapter-pg | 7.3.0 | Postgres adapter | ACTIVE |
| @libsql/client | 0.14.0 | LibSQL client | ACTIVE |
| pg | 8.18.0 | Postgres driver | ACTIVE |
| ioredis | 5.9.3 | Redis client | ACTIVE |

### Web Scraping
| Package | Version | Purpose | Status |
|--------|---------|---------|--------|
| playwright | 1.58.2 | Browser automation | ACTIVE |
| playwright-extra | 4.3.6 | Playwright plugins | ACTIVE |
| puppeteer-extra-plugin-stealth | 2.11.2 | Stealth mode | ACTIVE |
| cheerio | 1.2.0 | HTML parsing | ACTIVE |

### Utilities
| Package | Version | Purpose | Status |
|--------|---------|---------|--------|
| zod | 4.3.6 | Validation | ACTIVE |
| pino | 10.3.1 | Logging | ACTIVE |
| uuid | 13.0.0 | ID generation | ACTIVE |
| tweetnacl | 1.0.3 | Crypto | ACTIVE |
| tweetnacl-util | 0.15.1 | Crypto utils | ACTIVE |

---

## PWA Dependencies

### Core
| Package | Version | Purpose | Status |
|--------|---------|---------|--------|
| react | 19.2.4 | UI framework | ACTIVE |
| react-dom | 19.2.4 | React DOM | ACTIVE |
| react-router-dom | 7.13.0 | Routing | ACTIVE |
| vite | 7.2.5 | Build tool | ACTIVE |
| typescript | ~5.9.3 | TypeScript | ACTIVE |

### State Management
| Package | Version | Purpose | Status |
|--------|---------|---------|--------|
| zustand | 5.0.11 | State store | ACTIVE |
| @tanstack/react-query | 5.90.21 | Data fetching | ACTIVE |
| dexie | 4.0.10 | IndexedDB | ACTIVE |
| dexie-react-hooks | 1.1.7 | Dexie React | ACTIVE |

### UI
| Package | Version | Purpose | Status |
|--------|---------|---------|--------|
| tailwindcss | 4.1.18 | Styling | ACTIVE |
| framer-motion | 12.34.3 | Animations | ACTIVE |
| lucide-react | 0.575.0 | Icons | ACTIVE |
| radix-ui/* | Latest | UI primitives | ACTIVE |
| shiki | 3.23.0 | Syntax highlight | ACTIVE |
| react-markdown | 10.1.0 | Markdown | ACTIVE |

### CRDT/Sync
| Package | Version | Purpose | Status |
|--------|---------|---------|--------|
| yjs | 13.6.29 | CRDT | ACTIVE |
| y-websocket | 3.0.0 | Yjs WS | ACTIVE |
| y-indexeddb | 9.0.12 | Yjs IndexedDB | ACTIVE |
| @automerge/automerge | 3.2.4 | Automerge | INSTALLED |

### Real-time
| Package | Version | Purpose | Status |
|--------|---------|---------|--------|
| socket.io-client | 4.8.3 | WebSocket client | ACTIVE |

---

## Workspace Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| @vivim/sdk | JS SDK | ACTIVE |
| @vivim/network-engine | P2P networking | PARTIAL |

---

## Playwright Extractors

### Provider Extractors (server/src/extractors/)

| Provider | File | Status |
|----------|------|--------|
| ChatGPT | extractor-chatgpt.js | WORKING |
| Claude | extractor-claude.js | WORKING |
| DeepSeek | extractor-deepseek.js | WORKING |
| Gemini | extractor-gemini.js | WORKING |
| Grok | extractor-grok.js | WORKING |
| Kimi | extractor-kimi.js | WORKING |
| Mistral | extractor-mistral.js | WORKING |
| Qwen | extractor-qwen.js | WORKING |
| Z.AI | extractor-zai.js | WORKING |

**Status**: All major providers have extractors - TESTED/WORKING

---

## AI SDK Integrations

### Providers Wired End-to-End

| Provider | Endpoint | Status |
|----------|----------|--------|
| Z.AI (default) | ZAI_BASE_URL | WORKING |
| OpenAI | OPENAI_API_KEY | CONFIGURED |
| Anthropic | ANTHROPIC_API_KEY | CONFIGURED |
| Google | GOOGLE_GENERATIVE_AI_KEY | CONFIGURED |
| xAI | XAI_API_KEY | CONFIGURED |

**Note**: Primary provider is Z.AI with fallback configuration

---

## Socket.IO Events

### Server Events (server/src/services/socket.ts)

| Event | Direction | Handler |
|-------|-----------|---------|
| connection | In | New client |
| disconnect | In | Client left |
| context:update | In/Out | Context changes |
| sync:request | In | Sync request |
| sync:response | Out | Sync response |

### Client Listener (pwa/src/components/GlobalSocketListener.tsx)

- Listens to: connection, context:update, sync:response
- Status: WORKING

---

## P2P/LibP2P

### Configuration (from .env)

```
P2P_LISTEN_ADDRESSES=/ip4/0.0.0.0/tcp/4001,/ip4/0.0.0.0/tcp/4002/ws
P2P_BOOTSTRAP_PEERS=
```

### Status

- **Implementation**: Stubbed in network engine
- **Listen addresses**: Configured but no peers configured
- **Status**: PARTIAL - Infrastructure ready but not operational

---

## CRDT Types

### Yjs Types

| Type | Usage | Status |
|------|-------|--------|
| Y.Doc | Document | ACTIVE |
| Y.Map | Map | ACTIVE |
| Y.Array | Array | ACTIVE |
| Y.Text | Text | ACTIVE |

### Automerge

- **Status**: Installed but not actively used
- **Usage**: Potential future sync

---

## Dependency Risks

### 1. Major Version Gaps
- None critical identified

### 2. Unused Dependencies
- puppeteer-extra-plugin-stealth: May not be used
- @rtrvr-ai/sdk: Imported but usage unclear

### 3. Known Breaking Changes Risk
- React 19: Some breaking changes from v18
- Vite 7: Relatively new, potential issues
- Zod 4.x: Major version, may have breaking changes

---

## Summary

| Category | Active | Installed | Unused |
|----------|--------|-----------|--------|
| Server deps | 40+ | 0 | 2 |
| PWA deps | 30+ | 1 | 0 |
| Extractors | 9 | 0 | 0 |
| AI providers | 5 | 0 | 0 |

**Overall Health**: GOOD - Most dependencies actively used
