# VIVIM — Security & Auth Audit
**Archived**: 2026-03-05 | **Basis**: `08F-security-auth-audit.md`

---

## Authentication Overview

VIVIM supports four authentication mechanisms, each covering different access patterns.

### 1. Google OAuth
- **File**: `server/src/middleware/google-auth.js`
- **Library**: `passport-google-oauth20`
- **Flow**: OAuth2 redirect → callback → express-session cookie + JWT issue
- **Config**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- **Routes**: `GET /api/v1/auth/google` → `GET /api/v1/auth/google/callback`
- **Status**: ✅ WORKING

### 2. DID-Based Identity (Decentralized)
- **Files**: `server/src/routes/identity-v2.js`, `server/src/services/identity-service.ts`
- **Flow**:
  1. Client generates Ed25519 keypair (`tweetnacl`)
  2. Derives `did:key:z...` from public key
  3. POSTs to `POST /api/v2/identity/register` with DID + public key
  4. Server registers and issues JWT
- **Status**: ✅ WORKING

### 3. Session + JWT
- **Library**: `express-session` + `jsonwebtoken`
- **Storage**: HTTP-only cookie (prevents XSS theft)
- **Expiration**: Session-based (not time-limited JWT)
- **Secret**: `SESSION_SECRET` + `JWT_SECRET` env vars
- **Status**: ✅ WORKING

### 4. API Keys
- **Management**: `POST/GET/DELETE /api/v1/account/me/api-keys`
- **Transport**: `X-API-Key` header
- **Storage**: Hashed with SHA-256 before persistence (`keyHash` field)
- **Expiration**: Optional `expiresAt` field
- **Status**: ✅ WORKING

---

## 2FA (TOTP)
- **Library**: `otplib` v12 (TOTP — time-based one-time passwords)
- **QR Code**: `qrcode` library for setup
- **Backup Codes**: 10 codes generated on setup, stored in `User.backupCodes` JSON
- **Routes**:
  - `POST /api/v1/account/me/mfa/setup` — Generate secret + QR
  - `POST /api/v1/account/me/mfa/enable` — Verify first OTP to enable
  - `POST /api/v1/account/me/mfa/disable` — Disable MFA
- **Status**: ✅ WORKING

---

## Authorization Middleware Map

| Route Prefix | Auth Type | Middleware |
|-------------|-----------|------------|
| `/api/v1/account/*` | JWT | `requireAuth` |
| `/api/v1/conversations/*` | JWT | `requireAuth` |
| `/api/v1/acus/*` | Optional JWT | `optionalAuth` |
| `/api/v1/memory/*` | DID | `authenticateDID` |
| `/api/v2/context/*` | DID or None | Varies |
| `/api/v2/circles/*` | DID | `authenticateDID` |
| `/api/v2/social/*` | DID | `authenticateDID` |
| `/api/v2/sharing/*` | DID | `authenticateDID` |
| `/api/v2/moderation/*` | Moderator | `requireModerator` |
| `/api/admin/*` | Admin | `requireAdminAuth` (role + IP allowlist) |

---

## Cryptography Stack

| Operation | Algorithm | Status |
|-----------|-----------|--------|
| Key exchange | ML-KEM-1024 (Kyber — post-quantum) | ✅ Implemented |
| Message signing | Ed25519 | ✅ Implemented |
| Symmetric encryption | AES-GCM | ✅ Implemented |
| PQ signing | CRYSTALS-Dilithium | ⚠️ Stubbed (WASM needed) |

**Implementation file**: `server/src/lib/crypto.js`

---

## Input Validation

| Domain | Library | Coverage |
|--------|---------|----------|
| Auth | Zod | Partial |
| Capture | Zod | Full |
| Conversations | Zod | Full |
| ACUs | Zod | Full |
| Memory | Zod | Full |
| Context | Zod | Full |
| Sharing | Zod | Full |
| Social | Zod | Full |
| Account | Zod | Full |
| Identity | Zod | Full |

---

## Encryption at Rest

| Data | Encrypted | Status |
|------|-----------|--------|
| ACU Content | Optional (securityLevel field) | ⚠️ PARTIAL |
| User Settings | No | PLAINTEXT |
| Memories | No | PLAINTEXT |
| Messages | No | PLAINTEXT |
| API Keys | SHA-256 hash | ✅ Protected |
| MFA Secrets | Should be encrypted | ⚠️ UNCLEAR |

---

## Known Security Gaps

| Gap | Severity | Status |
|-----|---------|--------|
| **SQL Injection in admin query endpoint** | 🔴 CRITICAL | ✅ FIXED (2026-03-05) |
| No rate limiting on some endpoints | 🟡 HIGH | ⚠️ OPEN |
| E2E encryption not enforced | 🟡 HIGH | ⚠️ OPEN |
| Missing CSRF protection | 🟡 HIGH | ⚠️ OPEN — relies on CORS/same-origin |
| No per-request signing | 🟢 MEDIUM | ⚠️ OPEN |
| P2P layer unauthenticated | 🟡 HIGH | ⚠️ OPEN (LibP2P not active) |
| Dev API key in `.env.example` | 🟡 HIGH | ⚠️ OPEN — must rotate before production |
| ACUs publicly readable | 🟢 LOW | Intentional? — needs product decision |
| JWT no expiration | 🟡 HIGH | ⚠️ OPEN — session-based, no TTL field |

---

## CORS Configuration

```
# .env
CORS_ORIGINS=https://app.openscroll.com,https://openscroll.com
```

Development: Configured for localhost. Do not use wildcard in production.

---

## Production Security Checklist

- [ ] Rotate `SESSION_SECRET` (strong random ≥32 chars)
- [ ] Rotate `JWT_SECRET` (strong random ≥32 chars)
- [ ] Rotate `ZAI_API_KEY` (use production key)
- [ ] Set proper `CORS_ORIGINS` to production domains only
- [ ] Enable `DATABASE_SSL_REQUIRED=true`
- [ ] Enable rate limiting globally (`RATE_LIMIT_MAX`)
- [ ] Add CSRF token protection
- [ ] Enforce E2E encryption for `Memory` and sensitive ACUs
- [ ] Configure P2P peer authentication when LibP2P is activated
- [ ] Schedule security audit / penetration test before public launch

---

## Security Summary

| Area | Status |
|------|--------|
| Authentication (OAuth, DID, JWT) | ✅ WORKING |
| Authorization (middleware map) | ✅ WORKING |
| Input Validation (Zod) | ✅ WORKING |
| Encryption in Transit (TLS + Kyber) | ✅ WORKING |
| Encryption at Rest | ⚠️ PARTIAL |
| 2FA (TOTP) | ✅ WORKING |
| Admin Auth | ✅ WORKING |
| API Key Management | ✅ WORKING |
| SQL Injection Protection | ✅ FIXED |
| CSRF | ⚠️ MISSING |
| Rate Limiting | ⚠️ PARTIAL |
