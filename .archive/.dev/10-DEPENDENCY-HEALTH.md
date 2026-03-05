# VIVIM — Dependency & Integration Health
**Archived**: 2026-03-05 | **Basis**: `08G-dependency-integration-health.md`

---

## Overall Health: GOOD
Most dependencies actively used. No critical version conflicts identified.

---

## Server Dependencies (Bun Runtime)

### Core Runtime
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| bun | ≥1.0.0 | Runtime | REQUIRED |
| express | 5.2.1 | HTTP server | ACTIVE |
| @prisma/client | 7.3.0 | ORM | ACTIVE |
| prisma | 7.3.0 | DB migrations | ACTIVE |
| socket.io | 4.8.3 | WebSockets | ACTIVE |

### AI SDKs
| Package | Version | Provider | Status |
|---------|---------|---------|--------|
| ai | 6.0.82 | Core AI SDK (Vercel) | ACTIVE |
| @ai-sdk/openai | 3.0.27 | OpenAI | ACTIVE |
| @ai-sdk/anthropic | 3.0.42 | Anthropic | ACTIVE |
| @ai-sdk/google | 3.0.26 | Google Gemini | ACTIVE |
| @ai-sdk/xai | 3.0.54 | xAI (Grok) | ACTIVE |
| openai | 6.22.0 | Legacy OpenAI direct | ACTIVE |

### Authentication
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| passport | 0.7.0 | Auth framework | ACTIVE |
| passport-google-oauth20 | 2.0.0 | Google OAuth | ACTIVE |
| jsonwebtoken | 9.0.3 | JWT generation/verify | ACTIVE |
| otplib | 12 | TOTP 2FA | ACTIVE |
| qrcode | 1.5.4 | QR code for MFA setup | ACTIVE |

### Database
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| @prisma/client | 7.3.0 | ORM client | ACTIVE |
| @prisma/adapter-pg | 7.3.0 | PostgreSQL adapter | ACTIVE |
| @libsql/client | 0.14.0 | LibSQL (future SQLite isolation) | ACTIVE |
| pg | 8.18.0 | Raw PostgreSQL driver | ACTIVE |
| ioredis | 5.9.3 | Redis client | ACTIVE |

### Web Scraping
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| playwright | 1.58.2 | Browser automation | ACTIVE |
| playwright-extra | 4.3.6 | Playwright plugin system | ACTIVE |
| puppeteer-extra-plugin-stealth | 2.11.2 | Anti-bot evasion | POTENTIALLY UNUSED |
| cheerio | 1.2.0 | HTML parsing (fallback) | ACTIVE |

### Utilities
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| zod | 4.3.6 | Schema validation | ACTIVE |
| pino | 10.3.1 | Structured logging | ACTIVE |
| uuid | 13.0.0 | ID generation | ACTIVE |
| tweetnacl | 1.0.3 | Ed25519, NaCl crypto | ACTIVE |
| tweetnacl-util | 0.15.1 | TweetNaCl utilities | ACTIVE |

---

## PWA Dependencies (Vite + React)

### Core
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| react | 19.2.4 | UI framework | ACTIVE |
| react-dom | 19.2.4 | React DOM | ACTIVE |
| react-router-dom | 7.13.0 | Routing | ACTIVE |
| vite | 7.2.5 | Build tool + dev server | ACTIVE |
| typescript | ~5.9.3 | TypeScript | ACTIVE |

### State Management
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| zustand | 5.0.11 | Global state | ACTIVE |
| @tanstack/react-query | 5.90.21 | Server state + caching | ACTIVE |
| dexie | 4.0.10 | IndexedDB ORM | ACTIVE |
| dexie-react-hooks | 1.1.7 | Dexie React integration | ACTIVE |

### UI
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| tailwindcss | 4.1.18 | Utility-first CSS | ACTIVE |
| framer-motion | 12.34.3 | Animations + gestures | ACTIVE |
| lucide-react | 0.575.0 | Icon library | ACTIVE |
| @radix-ui/* | Latest | Accessible UI primitives | ACTIVE |
| shiki | 3.23.0 | Syntax highlighting | ACTIVE |
| react-markdown | 10.1.0 | Markdown rendering | ACTIVE |

### CRDT / Sync
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| yjs | 13.6.29 | CRDT implementation | ACTIVE |
| y-websocket | 3.0.0 | Yjs WebSocket provider | ACTIVE |
| y-indexeddb | 9.0.12 | Yjs IndexedDB persistence | ACTIVE |
| @automerge/automerge | 3.2.4 | Alternative CRDT | INSTALLED (not used) |

### Real-Time
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| socket.io-client | 4.8.3 | WebSocket client | ACTIVE |

---

## Workspace Packages

| Package | Purpose | Status |
|---------|---------|--------|
| @vivim/sdk | JavaScript client SDK | ACTIVE |
| @vivim/network-engine | LibP2P P2P networking | PARTIAL (not operational) |

---

## AI Provider Configuration

| Provider | Config Key | Status |
|----------|-----------|--------|
| Z.AI (default) | `ZAI_API_KEY` + `ZAI_BASE_URL` | ✅ ACTIVE (primary) |
| OpenAI | `OPENAI_API_KEY` | ⚙️ CONFIGURED |
| Anthropic | `ANTHROPIC_API_KEY` | ⚙️ CONFIGURED |
| Google | `GOOGLE_GENERATIVE_AI_KEY` | ⚙️ CONFIGURED |
| xAI (Grok) | `XAI_API_KEY` | ⚙️ CONFIGURED |

**Primary**: Z.AI (`glm-4.7-flash` model by default)

---

## Playwright Extractors

All 9 provider extractors are fully implemented and working:
- `extractor-chatgpt.js` ✅
- `extractor-claude.js` ✅
- `extractor-deepseek.js` ✅
- `extractor-gemini.js` ✅
- `extractor-grok.js` ✅
- `extractor-kimi.js` ✅
- `extractor-mistral.js` ✅
- `extractor-qwen.js` ✅
- `extractor-zai.js` ✅

---

## Dependency Risks

| Risk | Impact | Packages |
|------|--------|---------|
| React 19 breaking changes from v18 | Medium | `react`, `react-dom` |
| Vite 7 newness — potential edge cases | Low | `vite` |
| Zod 4.x major version breaking changes | Medium | `zod` |
| `@automerge/automerge` installed but unused | Negligible | `@automerge/automerge` |
| `puppeteer-extra-plugin-stealth` usage unclear | Low | May be removable |
| `@rtrvr-ai/sdk` imported but usage unclear | Low | May be removable |

---

## Missing Integrations

| Integration | Priority | Notes |
|------------|---------|-------|
| LibP2P (P2P networking) | HIGH | `@vivim/network-engine` installed, not integrated |
| Blockchain client (Merkle verification) | MEDIUM | Referenced in `privacy-manager.ts`, not implemented |
| Email service | HIGH | No email provider configured — notifications never sent |
| Sentry error tracking | MEDIUM | DSN env var defined but may not be configured in prod |
