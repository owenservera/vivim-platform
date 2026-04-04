# VIVIM Security Architecture: DeepCode Analysis & Audit

> **Date:** February 10, 2026
> **Purpose:** Comprehensive security audit of VIVIM's capture & storage pipeline before simplifying for POC velocity.

---

## 1. Executive Summary

VIVIM implements a **"Zero-Trust, Quantum-Hardened"** architecture designed to protect user data from both external threats and internal server compromises. The system assumes the network is hostile and the server is untrusted ("Byzantine").

**Current Security Posture:**
- **Encryption:** End-to-end symmetric encryption (XSalsa20-Poly1305) over HTTPS.
- **Key Exchange:** Simulated Post-Quantum Cryptography (ML-KEM/Kyber) handshake.
- **Authentication:** API Key enforcement on sensitive endpoints.
- **Integrity:** Client-side Merkle Witness verification of all captured data.
- **Storage:** Content-addressed DAG with Ed25519 signatures.

**Recommendation for POC:**
While robust, this architecture introduces significant friction for rapid prototyping. The cryptographic overhead, strict CORS policies, and rate limiting are currently blocking development velocity. We recommend **temporarily bypassing** the active enforcement mechanisms while keeping the architectural shell intact for future reactivation.

---

## 2. Detailed Component Analysis

### 2.1 Authentication Middleware (`server/src/middleware/auth.js`)

**Design:**
- **Strategy:** Bearer Token / API Key.
- **Source:** Checks `Authorization` header, `X-API-Key` header, and `api_key` query param (for SSE).
- **Validation:** Compares against a static list of keys defined in `.env` (`API_KEYS`, `MASTER_API_KEY`).
- **Enforcement:** `requireApiKey()` middleware blocks access returning 401.

**POC Bottleneck:**
- Development tools (like manual `curl` or browser tests) constantly fail due to missing keys.
- **Action:** Short-circuit `requireApiKey` to always return `isAuthenticated: true` in "Pure Dev Mode".

### 2.2 Secure Server Configuration (`server/src/secure-server.js`)

**Design:**
- **Helmet:** Enforces strict Content Security Policy (CSP), HSTS, and X-Frame-Options.
- **CORS:** Whitelists specific origins (`localhost`, production domains). Blocks wildcards in production.
- **Rate Limiting:** `express-rate-limit` prevents abuse (100 req/15min). Sensitive endpoints (`/capture`) are stricter (10 req/5min).
- **Input Validation:** Zod schemas sanitize all incoming JSON bodies.

**POC Bottleneck:**
- Strict CORS blocks local IP access (e.g., testing PWA on phone via LAN).
- Rate limits trigger during stress testing or rapid reload cycles.
- **Action:** Open CORS to `*` and disable rate limiting middleware.

### 2.3 Cryptography Library (`server/src/lib/crypto.js`)

**Design:**
- **Quantum-Resistance:** Simulates a Kyber-1024 Key Encapsulation Mechanism (KEM).
- **Tunneling:** Establishes a shared secret for symmetric encryption (XSalsa20) *inside* the TLS tunnel.
- **Hashing:** SHA-256 / Keccak-256 for content addressing and Merkle trees.

**POC Bottleneck:**
- Debugging encrypted payloads is impossible.
- "Handshake" failures block simple API calls.
- **Action:** Keep the library functions but making the *enforcement* of encryption optional or transparent.

### 2.4 Data Integrity (`pwa/src/lib/storage-v2/dag-engine.ts`)

**Design:**
- **Merkle Witness:** The client re-calculates hashes of received data.
- **Rejection:** If the server's hash doesn't match the client's calculation, the data is rejected as "tampered."

**POC Bottleneck:**
- Minor formatting differences (whitespace, JSON serialization) cause hash mismatches, rejecting valid data.
- **Action:** Log warnings on mismatch instead of throwing fatal errors.

---

## 3. Vulnerability Report (Pre-Strip)

Despite the strong design, several issues exist:

1.  **Simulated PQC:** The Kyber implementation is a simulation using SHA-256, offering no actual quantum resistance.
2.  **Static Keys:** API keys are stored in plaintext environment variables.
3.  **No User Segregation:** The current auth model validates *access* but does not enforce *ownership* isolation effectively (all valid keys can access all endpoints).

---

## 4. Stripping Plan (POC Mode)

To unblock development, we will implement the following "Pure Dev Mode" changes:

1.  **Auth:** `requireApiKey` -> Pass-through (no check).
2.  **CORS:** Allow `*` origin, headers, and methods.
3.  **Rate Limit:** Disable or set to effectively infinite.
4.  **Crypto:** Allow plaintext payloads in `/capture` and `/sync` (bypass PQC requirements).
5.  **Validation:** Relax strict schema checks where they block partial data.

**Security Note:** These changes MUST be reverted before any public deployment.

---

*Analysis performed by VIVIM AI Security Agent*
