# DOCUMENT F: Security & Auth Audit

**Date**: 2026-03-05
**Project**: VIVIM — Security Analysis

---

## Authentication Flow

### 1. Google OAuth
- **Implementation**: server/src/middleware/google-auth.js
- **Routes**: 
  - GET /api/v1/auth/google - Initiates OAuth
  - GET /api/v1/auth/google/callback - Handles callback
- **Configuration**: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- **Status**: WORKING

### 2. DID Identity
- **Implementation**: server/src/routes/identity-v2.js, identity-service.ts
- **Flow**:
  1. User generates Ed25519 keypair
  2. Creates DID (did:key:z...)
  3. Registers with server
- **Status**: WORKING

### 3. Session Authentication
- **Implementation**: express-session with JWT
- **Session Secret**: SESSION_SECRET (env)
- **JWT Secret**: JWT_SECRET (env)
- **Status**: WORKING

### 4. API Key Authentication
- **Implementation**: server/src/middleware/auth.js (requireApiKey)
- **Routes**: Protected endpoints
- **Key Management**: /api/v1/account/me/api-keys
- **Status**: WORKING

---

## Authorization

### Protected Routes

| Route Type | Auth Required | Middleware |
|------------|--------------|------------|
| /api/v1/account/* | JWT | requireAuth |
| /api/v1/conversations/* | JWT | requireAuth |
| /api/v1/acus/* | Optional/JWT | optionalAuth |
| /api/v1/memory/* | DID | authenticateDID |
| /api/v2/context/* | DID | authenticateDID |
| /api/v2/circles/* | DID | authenticateDID |
| /api/v2/social/* | DID | authenticateDID |
| /api/v2/sharing/* | DID | authenticateDID |
| /api/v2/moderation/* | Mod | requireModerator |
| /api/admin/* | Admin | requireAdminAuth |

### userId/ownerId Threading

- **Pattern**: userId extracted from JWT/DID, passed to services
- **Services**: Most services accept userId parameter
- **Potential Issue**: Some routes may not verify ownership properly

---

## Security Issues Found

### 1. Routes Potentially Missing Auth

| Route | Issue |
|-------|-------|
| POST /api/v1/capture/capture | Requires API key but no user verification |
| GET /api/v1/acus/:id | Public read - intentional? |
| GET /api/v2/context/* | May be missing user verification |

### 2. Hardcoded Secrets

- **File**: server/.env.example
- **ZAI_API_KEY**: Has default development key
- **Note**: Should be changed for production

### 3. .env Dependencies

| Variable | Required | Purpose |
|----------|----------|---------|
| SESSION_SECRET | YES | Session encryption |
| JWT_SECRET | YES | JWT signing |
| DATABASE_URL | YES | Database connection |
| GOOGLE_CLIENT_ID | YES (OAuth) | Google OAuth |
| GOOGLE_CLIENT_SECRET | YES (OAuth) | Google OAuth |
| ZAI_API_KEY | YES (AI) | AI provider |

---

## Input Validation

### Zod Schema Coverage

| Domain | Schemas | Coverage |
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

**Status**: Most routes use Zod for validation

---

## Encryption

### At Rest

| Data Type | Encryption | Status |
|-----------|------------|--------|
| ACU Content | Optional | PARTIAL |
| User Settings | No | PLAINTEXT |
| Memories | No | PLAINTEXT |
| Messages | No | PLAINTEXT |

### In Transit

- TLS: Configured at server level
- Quantum-resistant handshake: ML-KEM-1024 (Kyber)
- Message signing: Ed25519

### Crypto Implementation
- **File**: server/src/lib/crypto.js
- **Algorithms**:
  - Key exchange: ML-KEM-1024
  - Signing: Ed25519
  - Symmetric: AES-GCM

---

## CORS Configuration

- **Setting**: CORS_ORIGINS in .env
- **Default**: https://app.openscroll.com,https://openscroll.com
- **Development**: Can be configured for localhost

---

## JWT Token Lifecycle

| Property | Value |
|----------|-------|
| Expiration | Not set in code (session-based) |
| Refresh | Via session |
| Storage | HTTP-only cookie |

---

## API Key Management

- **Creation**: POST /api/v1/account/me/api-keys
- **Usage**: X-API-Key header
- **Hashing**: Keys hashed before storage (keyHash)
- **Expiration**: Optional expiresAt field

---

## 2FA (MFA)

### Implementation
- **Library**: OTPLib (version 12)
- **Type**: TOTP (Time-based OTP)
- **Routes**:
  - POST /api/v1/account/me/mfa/setup
  - POST /api/v1/account/me/mfa/enable
  - POST /api/v1/account/me/mfa/disable

### Security
- Secret stored in mfaSecret field
- Backup codes generated (10 codes)
- Status tracked in mfaEnabled boolean

---

## Admin Authentication

- **Implementation**: server/src/middleware/admin-auth.js
- **Check**: Admin role or IP allowlist
- **Routes**: All /api/admin/* endpoints

---

## Known Security Gaps

1. **No rate limiting on some endpoints** - RATE_LIMIT_MAX set but may not cover all
2. **E2E encryption not enforced** - SecurityLevel field exists but not mandatory
3. **Missing CSRF protection** - Relies on CORS and same-origin
4. **No request signing** - Only API keys, no per-request signatures
5. **P2P not authenticated** - Network layer lacks peer verification

---

## Summary

| Area | Status |
|------|--------|
| Authentication | WORKING |
| Authorization | WORKING |
| Input Validation | WORKING |
| Encryption (Transit) | WORKING |
| Encryption (At Rest) | PARTIAL |
| MFA | WORKING |
| Admin Auth | WORKING |
| API Keys | WORKING |

---

## Recommendations

1. Enforce E2E encryption for sensitive data
2. Add rate limiting to all endpoints
3. Implement request signing for sensitive operations
4. Add CSRF tokens
5. Configure P2P authentication
6. Rotate default API keys
