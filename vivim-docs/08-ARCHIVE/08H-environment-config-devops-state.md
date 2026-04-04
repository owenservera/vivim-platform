# DOCUMENT H: Environment, Config & DevOps State

**Date**: 2026-03-05
**Project**: VIVIM — Environment & Configuration

---

## Server Environment Variables

### Database
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| DATABASE_URL | YES | postgresql://... | Postgres connection |
| DATABASE_SSL_REQUIRED | NO | false | SSL requirement |
| USER_DB_DIR | NO | ./data/users | Per-user SQLite |
| DB_PASSWORD | NO | - | Docker DB password |

### Server
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| NODE_ENV | NO | development | Environment |
| PORT | NO | 3000 | Server port |
| HOST | NO | 0.0.0.0 | Bind address |
| TRUST_PROXY | NO | false | Proxy headers |

### CORS
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| CORS_ORIGINS | NO | app.openscroll.com,... | Allowed origins |

### Rate Limiting
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| RATE_LIMIT_MAX | NO | 100 | Max requests |
| RATE_LIMIT_WINDOW_MS | NO | 900000 | Time window |

### Security
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| SESSION_SECRET | YES | - | Session encryption |
| JWT_SECRET | YES | - | JWT signing |
| SKIP_AUTH_FOR_DEVELOPMENT | NO | false | Dev auth bypass |

### Google OAuth
| Variable | Required | Purpose |
|----------|----------|---------|
| GOOGLE_CLIENT_ID | YES (OAuth) | OAuth ID |
| GOOGLE_CLIENT_SECRET | YES (OAuth) | OAuth secret |
| GOOGLE_CALLBACK_URL | YES | OAuth callback |
| GOOGLE_SUCCESS_REDIRECT | NO | Post-login redirect |

### Extraction
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| PLAYWRIGHT_BROWSER_PATH | NO | - | Browser path |
| EXTRACTION_TIMEOUT | NO | 30000 | Timeout (ms) |
| MAX_CONCURRENT_EXTRACTIONS | NO | 5 | Parallel limit |

### Logging
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| LOG_LEVEL | NO | info | Log level |
| LOG_FILE_PATH | NO | ./logs | Log directory |
| SENTRY_DSN | NO | - | Error tracking |

### Swagger
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| ENABLE_SWAGGER | NO | true | API docs |

### Sync
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| SYNC_INTERVAL | NO | 5000 | Sync interval (ms) |
| SYNC_BATCH_SIZE | NO | 100 | Batch size |

### ACU Processing
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| AUTO_PROCESS_ACUS | NO | true | Auto-process |
| ACU_BATCH_SIZE | NO | 10 | Batch size |
| ACU_BATCH_DELAY | NO | 1000 | Delay (ms) |

### Vector Search
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| EMBEDDING_MODEL | NO | all-MiniLM-L6-v2 | Model |
| VECTOR_DIMENSION | NO | 384 | Embedding dim |

### Z.AI Integration
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| ZAI_API_KEY | YES | (default key) | API key |
| ZAI_MODEL | NO | glm-4.7-flash | Model |
| ZAI_BASE_URL | NO | api.z.ai/... | Base URL |
| ZAI_EMBEDDING_DIMENSIONS | NO | 1536 | Embedding dim |
| COMPACTION_MODEL | NO | glm-4.7-flash | Compaction |
| ZAI_EMBEDDING_FALLBACK_TO_MOCK | NO | false | Dev fallback |

### Librarian Worker
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| LIBRARIAN_ENABLED | NO | true | Enable worker |
| LIBRARIAN_BATCH_SIZE | NO | 20 | Batch size |
| LIBRARIAN_COOLDOWN_MINUTES | NO | 30 | Cooldown |

### Idle Detection
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| ENABLE_IDLE_DETECTION | NO | true | Enable |
| CONVERSATION_IDLE_TIMEOUT_MINUTES | NO | 5 | Timeout |

### Token Estimation
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| TOKEN_ESTIMATOR_TYPE | NO | gpt | Estimator |

### Dynamic Context
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| USE_DYNAMIC_CONTEXT | NO | false | Enable |
| DYNAMIC_CONTEXT_LOG_LEVEL | NO | info | Log level |

### P2P Network
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| P2P_LISTEN_ADDRESSES | NO | /ip4/0.0.0.0/... | Listen addrs |
| P2P_BOOTSTRAP_PEERS | NO | - | Bootstrap peers |

### Debug
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| DEBUG | NO | false | Debug mode |
| HOT_RELOAD | NO | true | Hot reload |

---

## PWA Environment Variables

### pwa/.env

| Variable | Required | Purpose |
|----------|----------|---------|
| VITE_API_URL | YES | Server URL |
| VITE_WS_URL | YES | WebSocket URL |

---

## Development Setup

### Running the Application

```bash
# Install dependencies
bun run setup:deps

# Setup database
bun run setup:db

# Run all services
bun run dev

# Or individually
bun run dev:pwa     # Frontend (port 5173)
bun run dev:server  # Backend (port 3000)
```

### Server Scripts (package.json)

| Script | Command | Purpose |
|--------|---------|---------|
| start | bun src/server.js | Production start |
| dev | bun --watch src/server.js | Development |
| test | bun test | Run tests |
| db:migrate | bunx prisma migrate deploy | Run migrations |
| db:generate | bunx prisma generate | Generate client |
| db:push | bunx prisma db push | Push schema |
| db:seed | bun run prisma/seed-real-data.ts | Seed data |
| lint | bunx eslint src/ | Lint code |
| build | bun run db:generate | Build |

### PWA Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| dev | bun --bun vite | Dev server |
| build | bun run build:vite | Production build |
| test | vitest | Run tests |
| test:e2e | playwright test | E2E tests |
| lint | eslint . | Lint code |

---

## Database

### Migration State

| Migration | Applied | Date |
|-----------|---------|------|
| 20260211045216_initial_schema | YES | 2026-02-11 |
| 20260211073604_add_context_models | YES | 2026-02-11 |

**Status**: 2 migrations applied

### Database Type
- PostgreSQL with pgvector extension
- Connection via Prisma

---

## External Services Required

### Must Run
1. **PostgreSQL** - Main database (port 5432)
2. **Redis** - Optional (for caching, not actively used)

### Optional
1. **Playwright browsers** - For extraction
2. **Sentry** - Error tracking (DSN required)

---

## CI/CD

### GitHub Actions
- Location: server/.github/
- Status: Basic workflows present

### Vercel Configuration
- File: vercel.json
- Status: Configured

---

## Logging

### Server Logging
- **Library**: Pino
- **Level**: Configurable (info, debug, error)
- **Output**: Console + file (./logs)

### What Gets Logged
- HTTP requests (via requestLogger)
- Errors and exceptions
- Capture attempts
- Sync events
- Debug info (when DEBUG=true)

---

## Known Dev-Only Hacks

1. **SKIP_AUTH_FOR_DEVELOPMENT** - Disables auth in dev
2. **ZAI_EMBEDDING_FALLBACK_TO_MOCK** - Falls back to mock embeddings
3. **USE_DYNAMIC_CONTEXT** - Feature flag for new context engine
4. **DEBUG=true** - Enables debug endpoints

---

## Production Concerns

### Must Fix Before Production
1. Change SESSION_SECRET
2. Change JWT_SECRET
3. Change ZAI_API_KEY (use own key)
4. Configure proper CORS_ORIGINS
5. Set up proper database with SSL
6. Configure P2P_BOOTSTRAP_PEERS for P2P
7. Enable proper rate limiting
8. Set up monitoring/alerting

### Missing for Production
1. Proper CI/CD pipeline
2. Database backup strategy
3. Load balancing configuration
4. CDN for static assets
5. Email service for notifications

---

## Summary

| Area | Status |
|------|--------|
| Env vars documented | YES |
| Dev setup working | YES |
| Migrations applied | YES |
| CI/CD basic | YES |
| Production ready | NO |

---

## Recommendations

1. Document all environment variables in .env files
2. Add production deployment checklist
3. Set up proper monitoring
4. Configure automated backups
5. Add health check endpoints
6. Set up CDN
