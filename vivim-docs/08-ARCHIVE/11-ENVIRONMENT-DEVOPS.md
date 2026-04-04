# VIVIM — Environment, Config & DevOps
**Archived**: 2026-03-05 | **Basis**: `08H-environment-config-devops-state.md`

---

## Development Setup

### Prerequisites
- **Runtime**: Bun ≥1.0.0 (`https://bun.sh`)
- **Database**: PostgreSQL 15+ with `pgvector` extension
- **Optional**: Redis (caching layer — not actively required)
- **Optional**: Playwright browsers (`PLAYWRIGHT_BROWSER_PATH`)

### Commands
```bash
# Install all workspace dependencies
bun run setup:deps

# Set up and migrate database
bun run setup:db

# Run everything (PWA + Server)
bun run dev

# Individual services
bun run dev:pwa          # Port 5173 (Vite)
bun run dev:server       # Port 3000 (Express/Bun)
```

---

## Server Environment Variables

### Required (won't start without these)
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session encryption |
| `JWT_SECRET` | JWT signing secret |
| `ZAI_API_KEY` | Primary AI provider API key |

### Google OAuth (required if using Google login)
| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL (e.g., `http://localhost:3000/api/v1/auth/google/callback`) |
| `GOOGLE_SUCCESS_REDIRECT` | Post-login redirect URL |

### Server
| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | HTTP listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `development` | Environment mode |
| `TRUST_PROXY` | `false` | Enable if behind proxy/load balancer |
| `CORS_ORIGINS` | `app.openscroll.com,...` | Allowed CORS origins |

### Rate Limiting
| Variable | Default | Purpose |
|----------|---------|---------|
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Window duration (15 min) |

### AI Provider
| Variable | Default | Purpose |
|----------|---------|---------|
| `ZAI_API_KEY` | *(dev key)* | Z.AI API key |
| `ZAI_MODEL` | `glm-4.7-flash` | Default model |
| `ZAI_BASE_URL` | `api.z.ai/...` | Base URL |
| `ZAI_EMBEDDING_DIMENSIONS` | `1536` | Embedding size |
| `ZAI_EMBEDDING_FALLBACK_TO_MOCK` | `false` | Dev mock embeddings |
| `COMPACTION_MODEL` | `glm-4.7-flash` | Model for context compaction |
| `OPENAI_API_KEY` | — | OpenAI (BYOK) |
| `ANTHROPIC_API_KEY` | — | Anthropic (BYOK) |
| `GOOGLE_GENERATIVE_AI_KEY` | — | Google (BYOK) |
| `XAI_API_KEY` | — | xAI (BYOK) |

### Capture / Playwright
| Variable | Default | Purpose |
|----------|---------|---------|
| `PLAYWRIGHT_BROWSER_PATH` | — | System browser path |
| `EXTRACTION_TIMEOUT` | `30000` | MS before timeout |
| `MAX_CONCURRENT_EXTRACTIONS` | `5` | Parallel capture limit |

### Database
| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://...` | Main DB connection |
| `DATABASE_SSL_REQUIRED` | `false` | Enable SSL |
| `USER_DB_DIR` | `./data/users` | Per-user SQLite dir (future) |

### ACU Processing
| Variable | Default | Purpose |
|----------|---------|---------|
| `AUTO_PROCESS_ACUS` | `true` | Auto-run ACU gen after capture |
| `ACU_BATCH_SIZE` | `10` | ACUs per batch |
| `ACU_BATCH_DELAY` | `1000` | MS delay between batches |

### Librarian Worker
| Variable | Default | Purpose |
|----------|---------|---------|
| `LIBRARIAN_ENABLED` | `true` | Enable the Librarian Worker |
| `LIBRARIAN_COOLDOWN_MINUTES` | `30` | Cooldown between runs |
| `LIBRARIAN_BATCH_SIZE` | `20` | Conversations per run |
| `ENABLE_IDLE_DETECTION` | `true` | Enable idle conversation detection |
| `CONVERSATION_IDLE_TIMEOUT_MINUTES` | `5` | Minutes before conversation is "idle" |

### Sync
| Variable | Default | Purpose |
|----------|---------|---------|
| `SYNC_INTERVAL` | `5000` | MS between sync polling |
| `SYNC_BATCH_SIZE` | `100` | Ops per sync batch |

### Vector Search
| Variable | Default | Purpose |
|----------|---------|---------|
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Fallback local model |
| `VECTOR_DIMENSION` | `384` | Embedding dimensions (when not using Z.AI) |

### P2P Network
| Variable | Default | Purpose |
|----------|---------|---------|
| `P2P_LISTEN_ADDRESSES` | `/ip4/0.0.0.0/tcp/4001,...` | LibP2P listen addresses |
| `P2P_BOOTSTRAP_PEERS` | — | Bootstrap peer list (EMPTY = P2P inactive) |

### Logging & Debug
| Variable | Default | Purpose |
|----------|---------|---------|
| `LOG_LEVEL` | `info` | Pino log level |
| `LOG_FILE_PATH` | `./logs` | Log output directory |
| `SENTRY_DSN` | — | Sentry error tracking DSN |
| `DEBUG` | `false` | Enable debug endpoints |
| `HOT_RELOAD` | `true` | Hot reload in dev |

### Swagger
| Variable | Default | Purpose |
|----------|---------|---------|
| `ENABLE_SWAGGER` | `true` | Expose Swagger API docs |

### Dev-Only Flags
| Variable | Default | Purpose |
|----------|---------|---------|
| `SKIP_AUTH_FOR_DEVELOPMENT` | `false` | ⚠️ Bypass all auth |
| `ZAI_EMBEDDING_FALLBACK_TO_MOCK` | `false` | ⚠️ Mock embeddings |
| `USE_DYNAMIC_CONTEXT` | `false` | Feature flag: new context engine |
| `DYNAMIC_CONTEXT_LOG_LEVEL` | `info` | Log level for new engine |

---

## PWA Environment Variables

**File**: `pwa/.env`

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_URL` | YES | Backend server URL (e.g., `http://localhost:3000`) |
| `VITE_WS_URL` | YES | WebSocket URL (e.g., `ws://localhost:3000`) |

---

## Server Scripts (`server/package.json`)

| Script | Command | Purpose |
|--------|---------|---------|
| `start` | `bun src/server.js` | Production start |
| `dev` | `bun --watch src/server.js` | Dev with hot-reload |
| `test` | `bun test` | Run tests |
| `db:migrate` | `bunx prisma migrate deploy` | Apply migrations |
| `db:generate` | `bunx prisma generate` | Regenerate Prisma client |
| `db:push` | `bunx prisma db push` | Push schema (dev) |
| `db:seed` | `bun run prisma/seed-real-data.ts` | Seed database |
| `lint` | `bunx eslint src/` | Lint check |

## PWA Scripts (`pwa/package.json`)

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `bun --bun vite` | Dev server |
| `build` | `bun run build:vite` | Production build |
| `test` | `vitest` | Unit tests |
| `test:e2e` | `playwright test` | E2E tests |
| `lint` | `eslint .` | Lint check |

---

## Applied Database Migrations

| Migration | Applied |
|-----------|---------|
| `20260211045216_initial_schema` | ✅ 2026-02-11 |
| `20260211073604_add_context_models` | ✅ 2026-02-11 |

---

## DevOps / Deployment

| Area | Status | Notes |
|------|--------|-------|
| PWA hosting | Configured | Vercel (`vercel.json`) |
| Server hosting | Docker-ready | `docker-compose.yml` |
| CI/CD | Basic | `server/.github/` GitHub Actions |
| Database backup | ⚠️ MISSING | No automated backup configured |
| CDN for assets | ⚠️ MISSING | Static assets served directly |
| Load balancing | ⚠️ MISSING | Single-instance setup |
| Email service | ⚠️ MISSING | No email provider configured |
| Monitoring | ⚠️ PARTIAL | Sentry DSN defined, may not be configured |

---

## Production Pre-Launch Checklist

**Security:**
- [ ] Rotate `SESSION_SECRET` — use `openssl rand -base64 32`
- [ ] Rotate `JWT_SECRET` — use `openssl rand -base64 32`
- [ ] Rotate `ZAI_API_KEY` — use production key
- [ ] Restrict `CORS_ORIGINS` to production domains
- [ ] Set `DATABASE_SSL_REQUIRED=true`
- [ ] Set `SKIP_AUTH_FOR_DEVELOPMENT=false`
- [ ] Remove/disable debug endpoints (`DEBUG=false`)
- [ ] Enable rate limiting (`RATE_LIMIT_MAX` tuned to expected load)

**Infrastructure:**
- [ ] Configure `P2P_BOOTSTRAP_PEERS` if P2P enabled
- [ ] Set up PostgreSQL with pgvector in production
- [ ] Configure Redis for caching
- [ ] Set up automated database backups
- [ ] CDN for Vite static assets
- [ ] Sentry DSN configured
- [ ] Health check endpoint monitored by uptime service

**Functional:**
- [ ] Playwright browsers installed on server
- [ ] All provider extractors tested against production URLs
- [ ] Email service configured for notifications
- [ ] Google OAuth callback URL updated to production domain
