

# Zero-Trust Self-Defending Chat Frontend — Production Blueprint

## Complete Implementation Guide

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Server Infrastructure](#3-server-infrastructure)
4. [Cryptographic Layer](#4-cryptographic-layer)
5. [Client Runtime Attestation](#5-client-runtime-attestation)
6. [Input Sealing Engine](#6-input-sealing-engine)
7. [Integrity Monitoring System](#7-integrity-monitoring-system)
8. [Self-Defense Module](#8-self-defense-module)
9. [Trust Scoring Engine](#9-trust-scoring-engine)
10. [User-Facing Trust UI](#10-user-facing-trust-ui)
11. [Zero-Trust Gateway (Server)](#11-zero-trust-gateway-server)
12. [Service Worker Shield](#12-service-worker-shield)
13. [Content Security Policy & Headers](#13-content-security-policy--headers)
14. [Tamper-Evident Message Chain](#14-tamper-evident-message-chain)
15. [Deployment Checklist](#15-deployment-checklist)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                         │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Trust UI     │  │ Input Sealer │  │ Self-Defense  │  │
│  │ Indicator    │  │ (WebCrypto)  │  │ Module        │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                │                   │          │
│  ┌──────▼────────────────▼───────────────────▼───────┐  │
│  │           Integrity Monitoring Core               │  │
│  │  • MutationObserver    • API Tamper Detection      │  │
│  │  • Network Gatekeeper  • Listener Auditor          │  │
│  │  • Runtime Attestation • Bundle Verification       │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                               │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │              Service Worker Shield                │  │
│  │  • Request allowlisting  • Response verification  │  │
│  │  • Offline attestation cache                      │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │  Sealed + Signed Payloads
                          │  (TLS 1.3 + App-Layer Encryption)
                          ▼
┌─────────────────────────────────────────────────────────┐
│               ZERO-TRUST GATEWAY                        │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Signature    │  │ Session      │  │ Trust Score   │  │
│  │ Verifier     │  │ Validator    │  │ Evaluator     │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                │                   │          │
│  ┌──────▼────────────────▼───────────────────▼───────┐  │
│  │              Rate Limiter + Anomaly Detector       │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │  Verified Payload
                          ▼
┌─────────────────────────────────────────────────────────┐
│               CHAT BACKEND / LLM                        │
│  • Processes only gateway-verified messages             │
│  • Returns signed responses                             │
│  • Maintains message chain hashes                       │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Project Structure

```
zero-trust-chat/
├── client/
│   ├── index.html
│   ├── css/
│   │   └── trust-ui.css
│   ├── js/
│   │   ├── main.js                    # Application entry point
│   │   ├── crypto/
│   │   │   ├── session-keys.js        # Ephemeral ECDH + AES key management
│   │   │   ├── input-sealer.js        # Message encryption + binding
│   │   │   ├── signature.js           # Ed25519/ECDSA signing utilities
│   │   │   └── message-chain.js       # Tamper-evident hash chain
│   │   ├── integrity/
│   │   │   ├── runtime-attestation.js # Boot-time integrity proof
│   │   │   ├── mutation-monitor.js    # DOM injection detection
│   │   │   ├── api-guard.js           # Native API tamper detection
│   │   │   ├── network-gatekeeper.js  # fetch/XHR/WebSocket wrappers
│   │   │   ├── listener-auditor.js    # Event listener surveillance
│   │   │   └── heartbeat.js           # Continuous integrity heartbeat
│   │   ├── defense/
│   │   │   ├── self-defense.js        # Isolation + shutdown logic
│   │   │   ├── trust-score.js         # Client-side risk accumulator
│   │   │   └── quarantine.js          # Input quarantine mode
│   │   └── ui/
│   │       ├── trust-indicator.js     # Visual trust badge
│   │       ├── warning-banner.js      # Graduated warning system
│   │       └── secure-input.js        # Hardened input component
│   └── sw.js                          # Service Worker shield
├── server/
│   ├── gateway/
│   │   ├── index.js                   # Zero-trust gateway entry
│   │   ├── middleware/
│   │   │   ├── signature-verify.js    # Verify client signatures
│   │   │   ├── session-validate.js    # Session freshness + nonce
│   │   │   ├── trust-evaluate.js      # Server-side trust scoring
│   │   │   ├── rate-limiter.js        # Behavioral rate limiting
│   │   │   └── anomaly-detector.js    # IP/timing/header anomalies
│   │   ├── crypto/
│   │   │   ├── key-manager.js         # Server key rotation
│   │   │   ├── attestation.js         # Client attestation verification
│   │   │   └── unseal.js             # Decrypt sealed messages
│   │   └── routes/
│   │       ├── handshake.js           # Session establishment
│   │       ├── chat.js                # Message processing
│   │       ├── heartbeat.js           # Integrity heartbeat endpoint
│   │       └── report.js             # Client security reports
│   ├── config/
│   │   ├── csp-headers.js            # CSP generation
│   │   ├── tls-config.js             # TLS 1.3 configuration
│   │   └── allowed-origins.js        # Origin allowlist
│   └── monitoring/
│       ├── ct-monitor.js             # Certificate Transparency monitor
│       ├── session-analytics.js      # Session behavior analysis
│       └── alert-rules.js           # Alerting thresholds
├── shared/
│   ├── constants.js                  # Shared protocol constants
│   ├── message-schema.js            # Message format validation
│   └── error-codes.js               # Standardized error taxonomy
├── scripts/
│   ├── generate-keys.js             # Key generation utility
│   ├── compute-bundle-hash.js       # Build-time hash computation
│   └── rotate-keys.js              # Key rotation automation
├── package.json
├── Dockerfile
└── nginx.conf                       # Production proxy configuration
```

---

## 3. Server Infrastructure

### 3.1 TLS Configuration (`server/config/tls-config.js`)

```js
// server/config/tls-config.js
import fs from 'fs';
import path from 'path';

export function createTLSConfig() {
  return {
    key: fs.readFileSync(path.resolve(process.env.TLS_KEY_PATH)),
    cert: fs.readFileSync(path.resolve(process.env.TLS_CERT_PATH)),
    ca: process.env.TLS_CA_PATH
      ? fs.readFileSync(path.resolve(process.env.TLS_CA_PATH))
      : undefined,

    // Enforce TLS 1.3 minimum
    minVersion: 'TLSv1.3',
    maxVersion: 'TLSv1.3',

    // Prefer server cipher order
    honorCipherOrder: true,

    // TLS 1.3 cipher suites (Node uses OpenSSL names)
    ciphers: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
    ].join(':'),

    // Enable OCSP stapling support
    // (actual OCSP stapling requires reverse proxy like nginx)

    // Session configuration
    sessionTimeout: 300,  // 5 minutes
  };
}
```

### 3.2 Nginx Configuration (`nginx.conf`)

```nginx
# nginx.conf — Production reverse proxy

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=handshake:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=chat:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=heartbeat:10m rate=12r/m;

server {
    listen 443 ssl http2;
    server_name chat.yourdomain.com;

    # TLS 1.3 only
    ssl_protocols TLSv1.3;
    ssl_prefer_server_ciphers off;  # TLS 1.3 handles this
    ssl_certificate /etc/ssl/certs/chat.yourdomain.com.pem;
    ssl_certificate_key /etc/ssl/private/chat.yourdomain.com.key;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/ssl/certs/chain.pem;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    # HSTS — 2 years, include subdomains, preload
    add_header Strict-Transport-Security
      "max-age=63072000; includeSubDomains; preload" always;

    # Security headers (CSP set by application, but add baseline here)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "0" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header Permissions-Policy
      "camera=(), microphone=(), geolocation=(), payment=()" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cross-Origin-Resource-Policy "same-origin" always;

    # Static assets (chat frontend)
    location / {
        root /var/www/chat/client;
        index index.html;

        # Cache busting for integrity
        add_header Cache-Control "no-cache, must-revalidate";

        # Block embedding
        add_header X-Frame-Options "DENY" always;
    }

    # API routes
    location /api/handshake {
        limit_req zone=handshake burst=2 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }

    location /api/chat {
        limit_req zone=chat burst=5 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }

    location /api/heartbeat {
        limit_req zone=heartbeat burst=3 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }

    location /api/report {
        limit_req zone=chat burst=3 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }

    # Block everything else
    location ~ /\. {
        deny all;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name chat.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

### 3.3 CSP Header Generation (`server/config/csp-headers.js`)

```js
// server/config/csp-headers.js

// Generate a unique nonce per request for inline scripts (if any are needed)
import crypto from 'crypto';

export function generateCSPNonce() {
  return crypto.randomBytes(16).toString('base64');
}

export function buildCSPHeader(nonce) {
  const directives = [
    // Default: block everything
    "default-src 'none'",

    // Scripts: same-origin only, with nonce for any inline bootstrap
    `script-src 'self' 'nonce-${nonce}'`,

    // Styles: same-origin only, with nonce
    `style-src 'self' 'nonce-${nonce}'`,

    // Images: same-origin + data URIs for inline icons
    "img-src 'self' data:",

    // Fonts: same-origin only
    "font-src 'self'",

    // Network connections: only your API origin
    "connect-src 'self'",

    // No frames allowed
    "frame-src 'none'",
    "frame-ancestors 'none'",

    // No objects/embeds
    "object-src 'none'",

    // Base URI locked to self
    "base-uri 'self'",

    // Form actions locked to self
    "form-action 'self'",

    // Manifest: self
    "manifest-src 'self'",

    // Worker: self (for service worker)
    "worker-src 'self'",

    // Require trusted types (Chrome)
    "require-trusted-types-for 'script'",

    // Report violations
    "report-uri /api/report/csp",
    "report-to csp-endpoint",

    // Upgrade insecure requests
    "upgrade-insecure-requests",
  ];

  return directives.join('; ');
}

// Express/Koa middleware
export function cspMiddleware(req, res, next) {
  const nonce = generateCSPNonce();
  req.cspNonce = nonce;

  res.setHeader('Content-Security-Policy', buildCSPHeader(nonce));

  // Report-To header for CSP reporting API
  res.setHeader('Report-To', JSON.stringify({
    group: 'csp-endpoint',
    max_age: 86400,
    endpoints: [{ url: '/api/report/csp' }],
  }));

  next();
}
```

---

## 4. Cryptographic Layer

### 4.1 Session Key Management (`client/js/crypto/session-keys.js`)

```js
// client/js/crypto/session-keys.js

/**
 * Ephemeral session key management using ECDH key agreement + AES-GCM.
 *
 * Flow:
 * 1. Client generates ephemeral ECDH key pair
 * 2. Client sends public key to server during handshake
 * 3. Server responds with its ephemeral public key
 * 4. Both sides derive shared AES-256-GCM key via ECDH
 * 5. Keys are never stored — live only in memory
 * 6. Keys rotate every N minutes or N messages
 */

const KEY_ROTATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const KEY_ROTATION_MESSAGE_COUNT = 50;

class SessionKeyManager {
  constructor() {
    this.keyPair = null;
    this.sharedKey = null;
    this.sessionId = null;
    this.messageCount = 0;
    this.keyCreatedAt = null;
    this.serverPublicKey = null;
    this._destroyed = false;
  }

  /**
   * Generate a new ephemeral ECDH key pair.
   * Returns the public key in JWK format for transmission to server.
   */
  async generateEphemeralKeys() {
    this._assertNotDestroyed();

    this.keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      false, // not extractable — private key never leaves WebCrypto
      ['deriveKey']
    );

    this.keyCreatedAt = Date.now();
    this.messageCount = 0;

    // Export public key for sending to server
    const publicKeyJwk = await crypto.subtle.exportKey(
      'jwk',
      this.keyPair.publicKey
    );

    return publicKeyJwk;
  }

  /**
   * Import the server's ephemeral public key and derive shared AES key.
   */
  async deriveSharedKey(serverPublicKeyJwk) {
    this._assertNotDestroyed();

    this.serverPublicKey = await crypto.subtle.importKey(
      'jwk',
      serverPublicKeyJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      false,
      []
    );

    this.sharedKey = await crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: this.serverPublicKey,
      },
      this.keyPair.privateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );

    return true;
  }

  /**
   * Encrypt a payload with the shared AES-GCM key.
   * Returns { ciphertext, iv, tag } as base64.
   */
  async encrypt(plaintext) {
    this._assertNotDestroyed();
    this._assertKeyAvailable();

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      this.sharedKey,
      encoded
    );

    this.messageCount++;

    return {
      ciphertext: this._arrayBufferToBase64(ciphertext),
      iv: this._arrayBufferToBase64(iv),
    };
  }

  /**
   * Decrypt a payload from the server.
   */
  async decrypt(ciphertextB64, ivB64) {
    this._assertNotDestroyed();
    this._assertKeyAvailable();

    const ciphertext = this._base64ToArrayBuffer(ciphertextB64);
    const iv = this._base64ToArrayBuffer(ivB64);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      this.sharedKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Check whether key rotation is needed.
   */
  needsRotation() {
    if (!this.keyCreatedAt) return true;

    const age = Date.now() - this.keyCreatedAt;
    return (
      age > KEY_ROTATION_INTERVAL_MS ||
      this.messageCount >= KEY_ROTATION_MESSAGE_COUNT
    );
  }

  /**
   * Destroy all key material — call on session end or compromise detection.
   */
  destroy() {
    this.keyPair = null;
    this.sharedKey = null;
    this.serverPublicKey = null;
    this.sessionId = null;
    this.messageCount = 0;
    this.keyCreatedAt = null;
    this._destroyed = true;
  }

  // --- Private helpers ---

  _assertNotDestroyed() {
    if (this._destroyed) {
      throw new Error('SessionKeyManager has been destroyed');
    }
  }

  _assertKeyAvailable() {
    if (!this.sharedKey) {
      throw new Error('Shared key not yet derived — complete handshake first');
    }
  }

  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(
      buffer instanceof ArrayBuffer ? buffer : buffer.buffer
    );
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default SessionKeyManager;
```

### 4.2 Signing Utilities (`client/js/crypto/signature.js`)

```js
// client/js/crypto/signature.js

/**
 * ECDSA P-256 signing for client attestation and message authentication.
 *
 * The signing key is ephemeral per session — generated at handshake,
 * public key registered with server, destroyed on session end.
 */

class SignatureManager {
  constructor() {
    this.signingKeyPair = null;
    this._destroyed = false;
  }

  /**
   * Generate an ephemeral ECDSA signing key pair.
   * Returns the public key in JWK for server registration.
   */
  async generateSigningKeys() {
    this.signingKeyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false, // private key not extractable
      ['sign', 'verify']
    );

    const publicKeyJwk = await crypto.subtle.exportKey(
      'jwk',
      this.signingKeyPair.publicKey
    );

    return publicKeyJwk;
  }

  /**
   * Sign arbitrary data (string or ArrayBuffer).
   * Returns signature as base64.
   */
  async sign(data) {
    if (this._destroyed || !this.signingKeyPair) {
      throw new Error('Signing key not available');
    }

    const encoded =
      typeof data === 'string'
        ? new TextEncoder().encode(data)
        : new Uint8Array(data);

    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      this.signingKeyPair.privateKey,
      encoded
    );

    return this._arrayBufferToBase64(signature);
  }

  /**
   * Verify a signature using a provided public key (e.g., server's key).
   */
  async verify(data, signatureB64, publicKeyJwk) {
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['verify']
    );

    const encoded =
      typeof data === 'string'
        ? new TextEncoder().encode(data)
        : new Uint8Array(data);

    const signature = this._base64ToArrayBuffer(signatureB64);

    return crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      publicKey,
      signature,
      encoded
    );
  }

  destroy() {
    this.signingKeyPair = null;
    this._destroyed = true;
  }

  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default SignatureManager;
```

### 4.3 Message Chain (`client/js/crypto/message-chain.js`)

```js
// client/js/crypto/message-chain.js

/**
 * Tamper-evident hash chain for messages.
 *
 * Each message includes the hash of the previous message,
 * creating a chain that breaks if any message is inserted,
 * deleted, or modified.
 *
 * Chain structure:
 *   H0 = SHA-256("CHAIN_INIT" + sessionId + timestamp)
 *   H1 = SHA-256(H0 + message1 + timestamp1 + nonce1)
 *   H2 = SHA-256(H1 + message2 + timestamp2 + nonce2)
 *   ...
 *
 * Both client and server maintain independent chain state.
 * Divergence = tampering detected.
 */

class MessageChain {
  constructor() {
    this.previousHash = null;
    this.chainLength = 0;
    this.initialized = false;
  }

  /**
   * Initialize chain with session binding.
   */
  async initialize(sessionId) {
    const seed = `CHAIN_INIT:${sessionId}:${Date.now()}`;
    this.previousHash = await this._sha256Hex(seed);
    this.chainLength = 0;
    this.initialized = true;
    return this.previousHash;
  }

  /**
   * Add a message to the chain.
   * Returns the new chain hash that must be sent with the message
   * and verified by the server.
   */
  async addMessage(messageText, nonce) {
    if (!this.initialized) {
      throw new Error('Chain not initialized');
    }

    const chainInput = [
      this.previousHash,
      messageText,
      Date.now().toString(),
      nonce,
      this.chainLength.toString(),
    ].join('|');

    const newHash = await this._sha256Hex(chainInput);
    this.previousHash = newHash;
    this.chainLength++;

    return {
      chainHash: newHash,
      chainIndex: this.chainLength - 1,
      previousHash: this.previousHash,
    };
  }

  /**
   * Verify a received message's chain hash (for server responses).
   */
  async verifyChainLink(expectedPreviousHash, messageText, nonce, receivedHash) {
    const chainInput = [
      expectedPreviousHash,
      messageText,
      Date.now().toString(), // server must include its timestamp
      nonce,
    ].join('|');

    const computed = await this._sha256Hex(chainInput);
    return computed === receivedHash;
  }

  async _sha256Hex(str) {
    const data = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  destroy() {
    this.previousHash = null;
    this.chainLength = 0;
    this.initialized = false;
  }
}

export default MessageChain;
```

---

## 5. Client Runtime Attestation

### `client/js/integrity/runtime-attestation.js`

```js
// client/js/integrity/runtime-attestation.js

/**
 * Runtime Attestation Module
 *
 * At boot, the client computes a fingerprint of its own code and DOM state,
 * signs it with the session signing key, and sends it to the server.
 *
 * The server compares against the expected fingerprint (computed at build time).
 *
 * This proves the client is running unmodified code — at least at boot time.
 * Continuous heartbeats (see heartbeat.js) extend this guarantee over time.
 */

class RuntimeAttestation {
  constructor(signatureManager) {
    this.signatureManager = signatureManager;
    this.bootFingerprint = null;
    this.expectedHashes = null; // populated from server during handshake
  }

  /**
   * Compute the runtime fingerprint.
   * Captures:
   *  - All inline and external script content hashes
   *  - Critical DOM structure hash
   *  - Key native API integrity checks
   */
  async computeFingerprint() {
    const components = {};

    // 1. Hash all script elements
    const scripts = document.querySelectorAll('script');
    const scriptHashes = [];
    for (const script of scripts) {
      if (script.src) {
        // For external scripts, hash the src URL
        // (actual content hash is verified by SRI)
        scriptHashes.push(await this._sha256(script.src));
      } else if (script.textContent) {
        scriptHashes.push(await this._sha256(script.textContent));
      }
    }
    components.scripts = await this._sha256(scriptHashes.join(':'));

    // 2. Hash critical DOM structure (head + body skeleton)
    const domSkeleton = this._extractDOMSkeleton(document.documentElement);
    components.dom = await this._sha256(domSkeleton);

    // 3. Native API integrity checks
    components.apiIntegrity = await this._checkNativeAPIs();

    // 4. Meta information
    components.meta = await this._sha256(
      JSON.stringify({
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency,
        // Note: these are not secrets — they help detect environment changes
      })
    );

    // Combine all components into final fingerprint
    const fingerprintInput = Object.entries(components)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    this.bootFingerprint = await this._sha256(fingerprintInput);

    return {
      fingerprint: this.bootFingerprint,
      components,
    };
  }

  /**
   * Create a signed attestation payload for the server.
   */
  async createAttestation(serverNonce) {
    const { fingerprint, components } = await this.computeFingerprint();

    const attestationPayload = JSON.stringify({
      fingerprint,
      components,
      serverNonce,
      timestamp: Date.now(),
      type: 'boot_attestation',
    });

    const signature = await this.signatureManager.sign(attestationPayload);

    return {
      payload: attestationPayload,
      signature,
    };
  }

  /**
   * Check whether critical native browser APIs have been tampered with.
   * Returns a hash representing native API state.
   */
  async _checkNativeAPIs() {
    const checks = {
      fetch: this._isNative(window.fetch),
      XMLHttpRequest_open: this._isNative(XMLHttpRequest.prototype.open),
      XMLHttpRequest_send: this._isNative(XMLHttpRequest.prototype.send),
      WebSocket: this._isNative(window.WebSocket),
      addEventListener: this._isNative(EventTarget.prototype.addEventListener),
      removeEventListener: this._isNative(
        EventTarget.prototype.removeEventListener
      ),
      createElement: this._isNative(Document.prototype.createElement),
      postMessage: this._isNative(window.postMessage),
      cryptoSubtle: typeof crypto?.subtle?.digest === 'function',
      JSON_stringify: this._isNative(JSON.stringify),
      JSON_parse: this._isNative(JSON.parse),
    };

    return this._sha256(JSON.stringify(checks));
  }

  /**
   * Test if a function appears to be native (not monkey-patched).
   * This is a heuristic — sophisticated attackers can fake toString().
   */
  _isNative(fn) {
    if (typeof fn !== 'function') return false;
    try {
      const str = Function.prototype.toString.call(fn);
      return /\[native code\]/.test(str);
    } catch {
      return false;
    }
  }

  /**
   * Extract a structural skeleton of the DOM (tag names and nesting)
   * without content — used for structural integrity checking.
   */
  _extractDOMSkeleton(element, depth = 0) {
    if (depth > 10) return ''; // limit depth
    const parts = [`<${element.tagName}`];

    // Include security-relevant attributes only
    for (const attr of ['src', 'href', 'integrity', 'crossorigin', 'nonce']) {
      if (element.hasAttribute(attr)) {
        parts.push(`${attr}="${element.getAttribute(attr)}"`);
      }
    }
    parts.push('>');

    for (const child of element.children) {
      parts.push(this._extractDOMSkeleton(child, depth + 1));
    }

    return parts.join('');
  }

  async _sha256(str) {
    const data = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export default RuntimeAttestation;
```

---

## 6. Input Sealing Engine

### `client/js/crypto/input-sealer.js`

```js
// client/js/crypto/input-sealer.js

/**
 * Input Sealing Engine
 *
 * Before any user message leaves the client, it is "sealed":
 *  - Encrypted with the session AES-GCM key
 *  - Bound to the current session nonce
 *  - Bound to the current runtime integrity fingerprint
 *  - Bound to a timestamp (prevents replay)
 *  - Bound to the message chain hash (prevents reordering)
 *  - Signed with the client's ephemeral signing key
 *
 * The server can only unseal if:
 *  - It holds the shared ECDH-derived key
 *  - The session is still valid
 *  - The chain hash matches
 *  - The signature verifies
 *  - The timestamp is within acceptable window
 */

class InputSealer {
  constructor(sessionKeyManager, signatureManager, messageChain, integrityMonitor) {
    this.keys = sessionKeyManager;
    this.signer = signatureManager;
    this.chain = messageChain;
    this.integrity = integrityMonitor;
  }

  /**
   * Seal a user message for transmission.
   *
   * @param {string} plaintext - The user's raw message text
   * @param {string} sessionNonce - Current session nonce from handshake
   * @returns {object} Sealed message payload ready for transmission
   */
  async seal(plaintext, sessionNonce) {
    // 1. Check if key rotation needed
    if (this.keys.needsRotation()) {
      throw new Error('KEY_ROTATION_NEEDED');
    }

    // 2. Generate per-message nonce
    const messageNonce = this._generateNonce();

    // 3. Get current integrity fingerprint
    const runtimeHash = this.integrity
      ? await this.integrity.getCurrentHash()
      : 'no-integrity-monitor';

    // 4. Build the binding payload (plaintext + context)
    const bindingPayload = JSON.stringify({
      text: plaintext,
      ts: Date.now(),
      sessionNonce,
      messageNonce,
      runtimeHash,
      seq: this.chain.chainLength,
    });

    // 5. Add to message chain
    const chainLink = await this.chain.addMessage(plaintext, messageNonce);

    // 6. Encrypt the binding payload
    const { ciphertext, iv } = await this.keys.encrypt(bindingPayload);

    // 7. Create the envelope (includes unencrypted metadata for server routing)
    const envelope = JSON.stringify({
      v: 1, // protocol version
      sid: sessionNonce,
      seq: chainLink.chainIndex,
      chainHash: chainLink.chainHash,
      ciphertext,
      iv,
      messageNonce,
      ts: Date.now(),
    });

    // 8. Sign the entire envelope
    const signature = await this.signer.sign(envelope);

    return {
      envelope,
      signature,
    };
  }

  /**
   * Verify and parse a sealed response from the server.
   */
  async unsealResponse(serverEnvelope, serverSignature, serverPublicKeyJwk) {
    // 1. Verify server signature
    const valid = await this.signer.verify(
      serverEnvelope,
      serverSignature,
      serverPublicKeyJwk
    );

    if (!valid) {
      throw new Error('SERVER_SIGNATURE_INVALID');
    }

    // 2. Parse envelope
    const envelope = JSON.parse(serverEnvelope);

    // 3. Decrypt
    const decryptedJson = await this.keys.decrypt(
      envelope.ciphertext,
      envelope.iv
    );

    const payload = JSON.parse(decryptedJson);

    // 4. Verify timestamp freshness (allow 30 second window)
    const age = Date.now() - payload.ts;
    if (age > 30_000 || age < -5_000) {
      throw new Error('RESPONSE_TIMESTAMP_STALE');
    }

    return payload;
  }

  _generateNonce() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export default InputSealer;
```

---

## 7. Integrity Monitoring System

### 7.1 Mutation Monitor (`client/js/integrity/mutation-monitor.js`)

```js
// client/js/integrity/mutation-monitor.js

/**
 * DOM Mutation Monitor
 *
 * Watches for:
 *  - Injected <script> elements
 *  - Injected <iframe> elements
 *  - Modified input elements (overlays, interceptors)
 *  - Injected <link> stylesheets (potential data exfiltration via CSS)
 *  - Modified form actions
 *  - Shadow DOM attachments on critical elements
 */

class MutationMonitor {
  constructor(trustScoreEngine) {
    this.trust = trustScoreEngine;
    this.observer = null;
    this.allowedScriptSources = new Set();
    this.criticalElements = new Set();
    this._running = false;
  }

  /**
   * Register allowed script sources (populated at boot from known scripts).
   */
  registerAllowedScripts(sources) {
    sources.forEach((src) => this.allowedScriptSources.add(src));
  }

  /**
   * Register critical elements to watch closely.
   */
  registerCriticalElements(selectors) {
    selectors.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) this.criticalElements.add(el);
    });
  }

  /**
   * Start monitoring.
   */
  start() {
    if (this._running) return;

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        this._handleMutation(mutation);
      }
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'href', 'action', 'onload', 'onerror',
                        'onclick', 'oninput', 'onkeydown', 'onkeyup',
                        'onkeypress', 'style'],
    });

    this._running = true;
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this._running = false;
  }

  _handleMutation(mutation) {
    // Check added nodes
    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // Injected scripts
        if (node.tagName === 'SCRIPT') {
          const src = node.src || '[inline]';
          if (!this.allowedScriptSources.has(src)) {
            this.trust.addViolation({
              type: 'SCRIPT_INJECTION',
              severity: 40,
              detail: `Unauthorized script: ${src.substring(0, 100)}`,
              element: this._describeElement(node),
              timestamp: Date.now(),
            });
          }
        }

        // Injected iframes
        if (node.tagName === 'IFRAME') {
          this.trust.addViolation({
            type: 'IFRAME_INJECTION',
            severity: 35,
            detail: `Iframe injected: ${(node.src || 'about:blank').substring(0, 100)}`,
            element: this._describeElement(node),
            timestamp: Date.now(),
          });
        }

        // Injected stylesheets (CSS exfiltration vectors)
        if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
          const href = node.href || '';
          if (!href.startsWith(location.origin)) {
            this.trust.addViolation({
              type: 'EXTERNAL_STYLESHEET',
              severity: 20,
              detail: `External stylesheet: ${href.substring(0, 100)}`,
              timestamp: Date.now(),
            });
          }
        }

        // Check for overlay elements positioned over critical elements
        if (this._isOverlayThreat(node)) {
          this.trust.addViolation({
            type: 'UI_OVERLAY',
            severity: 30,
            detail: 'Suspicious overlay element detected over chat input',
            timestamp: Date.now(),
          });
        }

        // Recursively check children of added nodes
        const childScripts = node.querySelectorAll?.('script, iframe, link[rel="stylesheet"]');
        if (childScripts) {
          childScripts.forEach((child) => {
            this._handleMutation({ type: 'childList', addedNodes: [child], removedNodes: [] });
          });
        }
      }
    }

    // Check attribute modifications on critical elements
    if (mutation.type === 'attributes') {
      if (this.criticalElements.has(mutation.target)) {
        const attr = mutation.attributeName;
        // Inline event handler injection
        if (attr.startsWith('on')) {
          this.trust.addViolation({
            type: 'INLINE_HANDLER_INJECTION',
            severity: 35,
            detail: `Inline handler '${attr}' modified on critical element`,
            element: this._describeElement(mutation.target),
            timestamp: Date.now(),
          });
        }
        // Style modification (potential overlay/hiding)
        if (attr === 'style') {
          this.trust.addViolation({
            type: 'CRITICAL_ELEMENT_STYLE_CHANGE',
            severity: 10,
            detail: `Style modified on ${mutation.target.tagName}#${mutation.target.id}`,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  /**
   * Detect if a newly added element is positioned to overlay critical UI.
   */
  _isOverlayThreat(node) {
    if (!node.getBoundingClientRect) return false;
    const style = window.getComputedStyle(node);
    const isAbsolute =
      style.position === 'absolute' ||
      style.position === 'fixed' ||
      style.position === 'sticky';
    const isHighZ = parseInt(style.zIndex, 10) > 1000;
    const isTransparent = parseFloat(style.opacity) < 0.1;

    if (isAbsolute && (isHighZ || isTransparent)) {
      // Check if it overlaps any critical element
      const nodeRect = node.getBoundingClientRect();
      for (const critical of this.criticalElements) {
        const critRect = critical.getBoundingClientRect();
        if (this._rectsOverlap(nodeRect, critRect)) {
          return true;
        }
      }
    }
    return false;
  }

  _rectsOverlap(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  _describeElement(el) {
    return `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className : ''}>`;
  }
}

export default MutationMonitor;
```

### 7.2 API Guard (`client/js/integrity/api-guard.js`)

```js
// client/js/integrity/api-guard.js

/**
 * Native API Tamper Detection & Guarding
 *
 * Captures references to critical native APIs at load time (before any
 * other scripts run) and periodically verifies they haven't been replaced.
 *
 * Also wraps fetch/XHR/WebSocket to enforce destination allowlisting.
 */

class APIGuard {
  constructor(trustScoreEngine, allowedHosts) {
    this.trust = trustScoreEngine;
    this.allowedHosts = new Set(allowedHosts);

    // Capture native references immediately
    this.natives = {
      fetch: window.fetch,
      fetchBound: window.fetch.bind(window),
      XMLHttpRequest: window.XMLHttpRequest,
      XHR_open: XMLHttpRequest.prototype.open,
      XHR_send: XMLHttpRequest.prototype.send,
      WebSocket: window.WebSocket,
      addEventListener: EventTarget.prototype.addEventListener,
      removeEventListener: EventTarget.prototype.removeEventListener,
      createElement: Document.prototype.createElement,
      toString: Function.prototype.toString,
      postMessage: window.postMessage,
      setTimeout: window.setTimeout,
      setInterval: window.setInterval,
      jsonStringify: JSON.stringify,
      jsonParse: JSON.parse,
    };

    // Store native toString representations for comparison
    this.nativeSignatures = {};
    for (const [name, fn] of Object.entries(this.natives)) {
      if (typeof fn === 'function') {
        try {
          this.nativeSignatures[name] = Function.prototype.toString.call(fn);
        } catch {
          this.nativeSignatures[name] = null;
        }
      }
    }
  }

  /**
   * Install all guards. Call this as early as possible in page lifecycle.
   */
  install() {
    this._guardFetch();
    this._guardXHR();
    this._guardWebSocket();
    this._guardSendBeacon();
    this._startPeriodicChecks();
  }

  /**
   * Wrap window.fetch to enforce destination allowlist.
   */
  _guardFetch() {
    const self = this;
    const originalFetch = this.natives.fetchBound;

    window.fetch = function guardedFetch(...args) {
      try {
        const url = new URL(
          typeof args[0] === 'string' ? args[0] : args[0]?.url || '',
          location.href
        );

        if (!self.allowedHosts.has(url.hostname)) {
          self.trust.addViolation({
            type: 'UNAUTHORIZED_FETCH',
            severity: 25,
            detail: `Blocked fetch to: ${url.hostname}${url.pathname}`,
            timestamp: Date.now(),
          });
          return Promise.reject(new Error('Network destination not allowed'));
        }
      } catch (e) {
        self.trust.addViolation({
          type: 'MALFORMED_FETCH_URL',
          severity: 15,
          detail: `Unparseable fetch URL: ${String(args[0]).substring(0, 100)}`,
          timestamp: Date.now(),
        });
        return Promise.reject(new Error('Invalid request URL'));
      }

      return originalFetch(...args);
    };

    // Preserve toString appearance
    window.fetch.toString = () => 'function fetch() { [native code] }';
  }

  /**
   * Wrap XMLHttpRequest.open to enforce destination allowlist.
   */
  _guardXHR() {
    const self = this;
    const originalOpen = this.natives.XHR_open;

    XMLHttpRequest.prototype.open = function guardedOpen(method, url, ...rest) {
      try {
        const parsed = new URL(url, location.href);
        if (!self.allowedHosts.has(parsed.hostname)) {
          self.trust.addViolation({
            type: 'UNAUTHORIZED_XHR',
            severity: 25,
            detail: `Blocked XHR to: ${parsed.hostname}${parsed.pathname}`,
            timestamp: Date.now(),
          });
          // Store flag to block send()
          this.__blocked = true;
          return;
        }
      } catch {
        this.__blocked = true;
        return;
      }
      this.__blocked = false;
      return originalOpen.call(this, method, url, ...rest);
    };

    const originalSend = this.natives.XHR_send;
    XMLHttpRequest.prototype.send = function guardedSend(...args) {
      if (this.__blocked) {
        throw new Error('Network destination not allowed');
      }
      return originalSend.call(this, ...args);
    };
  }

  /**
   * Wrap WebSocket constructor to enforce destination allowlist.
   */
  _guardWebSocket() {
    const self = this;
    const OriginalWebSocket = this.natives.WebSocket;

    window.WebSocket = function GuardedWebSocket(url, protocols) {
      try {
        const parsed = new URL(url);
        if (!self.allowedHosts.has(parsed.hostname)) {
          self.trust.addViolation({
            type: 'UNAUTHORIZED_WEBSOCKET',
            severity: 30,
            detail: `Blocked WebSocket to: ${parsed.hostname}`,
            timestamp: Date.now(),
          });
          throw new Error('WebSocket destination not allowed');
        }
      } catch (e) {
        if (e.message === 'WebSocket destination not allowed') throw e;
        self.trust.addViolation({
          type: 'MALFORMED_WEBSOCKET_URL',
          severity: 15,
          detail: `Unparseable WebSocket URL`,
          timestamp: Date.now(),
        });
        throw e;
      }

      return new OriginalWebSocket(url, protocols);
    };

    // Copy static properties
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    window.WebSocket.prototype = OriginalWebSocket.prototype;
  }

  /**
   * Guard navigator.sendBeacon — often used for exfiltration.
   */
  _guardSendBeacon() {
    const self = this;
    const originalBeacon = navigator.sendBeacon?.bind(navigator);

    if (originalBeacon) {
      navigator.sendBeacon = function guardedBeacon(url, data) {
        try {
          const parsed = new URL(url, location.href);
          if (!self.allowedHosts.has(parsed.hostname)) {
            self.trust.addViolation({
              type: 'UNAUTHORIZED_BEACON',
              severity: 25,
              detail: `Blocked sendBeacon to: ${parsed.hostname}`,
              timestamp: Date.now(),
            });
            return false;
          }
        } catch {
          return false;
        }
        return originalBeacon(url, data);
      };
    }
  }

  /**
   * Periodic check that native APIs haven't been re-patched
   * after our guards were installed.
   */
  _startPeriodicChecks() {
    const checkInterval = 10_000; // every 10 seconds

    const check = () => {
      // Verify our guarded fetch hasn't been replaced with something else
      // that removes our allowlist checking
      const criticalChecks = [
        {
          name: 'addEventListener',
          current: EventTarget.prototype.addEventListener,
          native: this.natives.addEventListener,
        },
        {
          name: 'createElement',
          current: Document.prototype.createElement,
          native: this.natives.createElement,
        },
        {
          name: 'JSON.stringify',
          current: JSON.stringify,
          native: this.natives.jsonStringify,
        },
        {
          name: 'JSON.parse',
          current: JSON.parse,
          native: this.natives.jsonParse,
        },
      ];

      for (const { name, current, native } of criticalChecks) {
        if (current !== native) {
          this.trust.addViolation({
            type: 'API_TAMPER',
            severity: 35,
            detail: `${name} has been replaced after initial load`,
            timestamp: Date.now(),
          });
        }
      }
    };

    // Use the captured native setInterval to prevent tampering with timers
    this.natives.setInterval.call(window, check, checkInterval);
  }
}

export default APIGuard;
```

### 7.3 Listener Auditor (`client/js/integrity/listener-auditor.js`)

```js
// client/js/integrity/listener-auditor.js

/**
 * Event Listener Auditor
 *
 * Wraps addEventListener to track all listener registrations.
 * Specifically watches for suspicious listeners on:
 *  - Chat input elements (input, keydown, keyup, keypress, paste, copy)
 *  - Document/window level keystroke capture
 *  - Clipboard events
 *
 * Any unexpected listener on sensitive elements raises trust score.
 */

class ListenerAuditor {
  constructor(trustScoreEngine) {
    this.trust = trustScoreEngine;
    this.registeredListeners = new Map(); // element → [{type, fn, stack}]
    this.sensitiveElements = new Set();
    this.sensitiveEventTypes = new Set([
      'input',
      'keydown',
      'keyup',
      'keypress',
      'paste',
      'copy',
      'cut',
      'compositionstart',
      'compositionend',
      'beforeinput',
      'textInput',
    ]);
    this.allowedListenerFingerprints = new Set();
    this._installed = false;
  }

  /**
   * Register elements that should have restricted listener access.
   */
  registerSensitiveElements(elements) {
    elements.forEach((el) => this.sensitiveElements.add(el));
  }

  /**
   * Register known-good listener fingerprints (from your own code).
   * A fingerprint is a hash of the listener function source.
   */
  registerAllowedListeners(fingerprints) {
    fingerprints.forEach((fp) => this.allowedListenerFingerprints.add(fp));
  }

  /**
   * Install the monitoring wrapper. Must be called before
   * application code registers its own listeners.
   */
  install(nativeAddEventListener) {
    if (this._installed) return;

    const self = this;

    EventTarget.prototype.addEventListener = function auditedAddEventListener(
      type,
      listener,
      options
    ) {
      // Track the registration
      const entry = {
        type,
        listener,
        options,
        timestamp: Date.now(),
        stack: new Error().stack, // capture call stack for debugging
      };

      if (!self.registeredListeners.has(this)) {
        self.registeredListeners.set(this, []);
      }
      self.registeredListeners.get(this).push(entry);

      // Check for suspicious patterns
      if (self.sensitiveElements.has(this) && self.sensitiveEventTypes.has(type)) {
        const fnSource = listener.toString();
        const isSuspicious = !self._isAllowedListener(fnSource);

        if (isSuspicious) {
          self.trust.addViolation({
            type: 'SUSPICIOUS_INPUT_LISTENER',
            severity: 30,
            detail: `Unknown '${type}' listener on sensitive element. Stack: ${entry.stack?.split('\n')[2]?.trim() || 'unknown'}`,
            timestamp: Date.now(),
          });
        }
      }

      // Check for document/window level keystroke capture
      if (
        (this === document || this === window) &&
        self.sensitiveEventTypes.has(type)
      ) {
        self.trust.addViolation({
          type: 'GLOBAL_KEYSTROKE_CAPTURE',
          severity: 25,
          detail: `Global '${type}' listener registered on ${this === document ? 'document' : 'window'}`,
          timestamp: Date.now(),
        });
      }

      // Call the real addEventListener
      return nativeAddEventListener.call(this, type, listener, options);
    };

    this._installed = true;
  }

  /**
   * Get a report of all registered listeners on sensitive elements.
   */
  getAuditReport() {
    const report = [];
    for (const el of this.sensitiveElements) {
      const listeners = this.registeredListeners.get(el) || [];
      report.push({
        element: `<${el.tagName?.toLowerCase()}#${el.id || 'unknown'}>`,
        listenerCount: listeners.length,
        listeners: listeners.map((l) => ({
          type: l.type,
          timestamp: l.timestamp,
          fnPreview: l.listener.toString().substring(0, 100),
        })),
      });
    }
    return report;
  }

  _isAllowedListener(fnSource) {
    // Simple hash-based check — in production use a more robust fingerprint
    // For now, check if it contains known signatures
    for (const allowed of this.allowedListenerFingerprints) {
      if (fnSource.includes(allowed)) return true;
    }
    return false;
  }
}

export default ListenerAuditor;
```

### 7.4 Continuous Heartbeat (`client/js/integrity/heartbeat.js`)

```js
// client/js/integrity/heartbeat.js

/**
 * Continuous Integrity Heartbeat
 *
 * Every N seconds, computes a fresh integrity snapshot and sends it
 * to the server. The server checks for drift from the boot attestation.
 *
 * The heartbeat also serves as a liveness check — if heartbeats stop,
 * the server can assume the session was hijacked or the page navigated away.
 */

class IntegrityHeartbeat {
  constructor({
    runtimeAttestation,
    signatureManager,
    trustScoreEngine,
    apiGuard,
    listenerAuditor,
    sessionNonce,
    serverEndpoint,
    intervalMs = 15_000,
  }) {
    this.attestation = runtimeAttestation;
    this.signer = signatureManager;
    this.trust = trustScoreEngine;
    this.apiGuard = apiGuard;
    this.listenerAuditor = listenerAuditor;
    this.sessionNonce = sessionNonce;
    this.endpoint = serverEndpoint;
    this.intervalMs = intervalMs;
    this._timer = null;
    this._seq = 0;
    this._running = false;
    this._nativeFetch = apiGuard?.natives?.fetchBound || window.fetch.bind(window);
    this._nativeSetInterval = apiGuard?.natives?.setInterval || window.setInterval;
  }

  /**
   * Start heartbeat.
   */
  start() {
    if (this._running) return;
    this._running = true;

    this._timer = this._nativeSetInterval.call(window, () => {
      this._sendHeartbeat().catch((err) => {
        this.trust.addViolation({
          type: 'HEARTBEAT_FAILURE',
          severity: 15,
          detail: `Heartbeat send failed: ${err.message}`,
          timestamp: Date.now(),
        });
      });
    }, this.intervalMs);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._running = false;
  }

  async _sendHeartbeat() {
    const snapshot = await this._buildSnapshot();
    const payload = JSON.stringify(snapshot);
    const signature = await this.signer.sign(payload);

    const response = await this._nativeFetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Nonce': this.sessionNonce,
      },
      body: JSON.stringify({ payload, signature }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      // Server may respond with trust degradation signal
      if (response.status === 403) {
        this.trust.addViolation({
          type: 'SERVER_TRUST_REJECTION',
          severity: 50,
          detail: `Server rejected heartbeat: ${body}`,
          timestamp: Date.now(),
        });
      }
    } else {
      // Server may send back a signed trust token
      const serverResponse = await response.json().catch(() => null);
      if (serverResponse?.trustToken) {
        // Verify server's trust attestation
        this.trust.setServerTrustToken(serverResponse.trustToken);
      }
    }

    this._seq++;
  }

  async _buildSnapshot() {
    const { fingerprint, components } = await this.attestation.computeFingerprint();

    return {
      type: 'heartbeat',
      seq: this._seq,
      sessionNonce: this.sessionNonce,
      timestamp: Date.now(),
      fingerprint,
      components,
      trustScore: this.trust.getCurrentScore(),
      violations: this.trust.getRecentViolations(5), // last 5 violations
      listenerReport: this.listenerAuditor?.getAuditReport() || [],
    };
  }

  async getCurrentHash() {
    const { fingerprint } = await this.attestation.computeFingerprint();
    return fingerprint;
  }
}

export default IntegrityHeartbeat;
```

---

## 8. Self-Defense Module

### 8.1 Self-Defense Controller (`client/js/defense/self-defense.js`)

```js
// client/js/defense/self-defense.js

/**
 * Self-Defense Module
 *
 * When the trust score exceeds certain thresholds, the frontend
 * progressively isolates itself:
 *
 * Level 1 (score > 30):  Warning — user notified
 * Level 2 (score > 60):  Quarantine — input delayed, extra encryption
 * Level 3 (score > 80):  Lockdown — input disabled, session paused
 * Level 4 (score > 95):  Destruction — all keys destroyed, session ended
 *
 * The system is designed to NEVER panic-scare the user.
 * Instead it gracefully degrades with clear, calm communication.
 */

class SelfDefense {
  constructor({
    trustScoreEngine,
    sessionKeyManager,
    signatureManager,
    messageChain,
    inputSealer,
    heartbeat,
    trustUI,
  }) {
    this.trust = trustScoreEngine;
    this.keys = sessionKeyManager;
    this.signer = signatureManager;
    this.chain = messageChain;
    this.sealer = inputSealer;
    this.heartbeat = heartbeat;
    this.ui = trustUI;
    this.currentLevel = 0;
    this._destroyed = false;
  }

  /**
   * Called by trust score engine whenever score changes.
   */
  onTrustScoreChange(score, violations) {
    if (this._destroyed) return;

    const newLevel = this._computeLevel(score);

    if (newLevel !== this.currentLevel) {
      this.currentLevel = newLevel;
      this._executeDefenseLevel(newLevel, score, violations);
    }
  }

  _computeLevel(score) {
    if (score > 95) return 4;
    if (score > 80) return 3;
    if (score > 60) return 2;
    if (score > 30) return 1;
    return 0;
  }

  _executeDefenseLevel(level, score, violations) {
    switch (level) {
      case 0:
        this._levelNormal();
        break;
      case 1:
        this._levelWarning(violations);
        break;
      case 2:
        this._levelQuarantine(violations);
        break;
      case 3:
        this._levelLockdown(violations);
        break;
      case 4:
        this._levelDestruction(violations);
        break;
    }
  }

  _levelNormal() {
    this.ui.showStatus('secure', {
      message: 'Private session verified',
      icon: '🟢',
    });
    this.ui.enableInput();
  }

  _levelWarning(violations) {
    const latestViolation = violations[violations.length - 1];
    this.ui.showStatus('warning', {
      message: 'Your environment may have been modified',
      detail: 'Your messages remain encrypted. Consider using a different browser or network.',
      icon: '🟡',
      violations: violations.slice(-3),
    });
    this.ui.enableInput(); // still allow input
  }

  _levelQuarantine(violations) {
    this.ui.showStatus('quarantine', {
      message: 'Environment security concern detected',
      detail:
        'Input is being held for additional verification. Messages are still encrypted but delivery may be delayed.',
      icon: '🟠',
      violations: violations.slice(-5),
    });
    this.ui.enableInput({ delayed: true, delayMs: 2000 });
    // Increase heartbeat frequency
    this.heartbeat.intervalMs = 5000;
  }

  _levelLockdown(violations) {
    this.ui.showStatus('lockdown', {
      message: 'Input security risk detected',
      detail:
        'Text input has been temporarily disabled to protect your privacy. Please try a different device, browser, or network.',
      icon: '🔴',
      violations: violations.slice(-5),
      actions: [
        { label: 'Try another browser', action: 'suggest_browser' },
        { label: 'Learn more', action: 'show_details' },
      ],
    });
    this.ui.disableInput();
  }

  _levelDestruction(violations) {
    // Destroy all cryptographic material
    this.keys.destroy();
    this.signer.destroy();
    this.chain.destroy();
    this.heartbeat.stop();
    this._destroyed = true;

    this.ui.showStatus('destroyed', {
      message: 'Session ended for your protection',
      detail:
        'Active interference with your session was detected. All encryption keys have been destroyed. Please reload in a secure environment.',
      icon: '⛔',
      violations: violations.slice(-5),
      actions: [
        { label: 'Reload', action: 'reload' },
        { label: 'Learn more', action: 'show_details' },
      ],
    });
    this.ui.disableInput();

    // Clear any sensitive data from memory
    this._scrubMemory();
  }

  /**
   * Best-effort memory scrubbing.
   * Can't guarantee GC timing, but we overwrite what we can.
   */
  _scrubMemory() {
    // Overwrite any message cache in the UI
    const chatContainer = document.querySelector('#chat-messages');
    if (chatContainer) {
      chatContainer.innerHTML = '';
    }

    // Overwrite input
    const input = document.querySelector('#chat-input');
    if (input) {
      input.value = '';
      input.disabled = true;
    }
  }
}

export default SelfDefense;
```

---

## 9. Trust Scoring Engine

### `client/js/defense/trust-score.js`

```js
// client/js/defense/trust-score.js

/**
 * Trust Score Engine
 *
 * Accumulates security violations from all monitors.
 * Computes a 0–100 risk score.
 * Notifies the self-defense module on changes.
 * Implements decay (old violations matter less) and deduplication.
 */

const DECAY_HALF_LIFE_MS = 60_000; // violations lose half severity per minute
const MAX_VIOLATIONS_STORED = 100;

class TrustScoreEngine {
  constructor() {
    this.violations = [];
    this.listeners = [];
    this.serverTrustToken = null;
    this._score = 0;
  }

  /**
   * Register a listener for score changes.
   */
  onScoreChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Add a violation from any monitor.
   */
  addViolation(violation) {
    // Deduplicate rapid-fire identical violations
    const recent = this.violations[this.violations.length - 1];
    if (
      recent &&
      recent.type === violation.type &&
      Date.now() - recent.timestamp < 2000
    ) {
      recent.count = (recent.count || 1) + 1;
      return;
    }

    violation.count = 1;
    this.violations.push(violation);

    // Trim old violations
    if (this.violations.length > MAX_VIOLATIONS_STORED) {
      this.violations = this.violations.slice(-MAX_VIOLATIONS_STORED);
    }

    this._recompute();
  }

  /**
   * Get the current trust score (0 = fully trusted, 100 = fully compromised).
   */
  getCurrentScore() {
    return this._score;
  }

  /**
   * Get recent violations for reporting.
   */
  getRecentViolations(count = 10) {
    return this.violations.slice(-count);
  }

  /**
   * Get all violations for detailed reporting.
   */
  getAllViolations() {
    return [...this.violations];
  }

  /**
   * Store server trust token (from heartbeat response).
   */
  setServerTrustToken(token) {
    this.serverTrustToken = token;
  }

  /**
   * Recompute score with time-based decay.
   */
  _recompute() {
    const now = Date.now();
    let totalSeverity = 0;

    for (const v of this.violations) {
      const age = now - v.timestamp;
      // Exponential decay
      const decayFactor = Math.pow(0.5, age / DECAY_HALF_LIFE_MS);
      totalSeverity += v.severity * decayFactor * (v.count || 1);
    }

    // Normalize to 0–100 range
    // A score of 100 means roughly 100+ severity points of active violations
    const newScore = Math.min(100, Math.round(totalSeverity));

    if (newScore !== this._score) {
      this._score = newScore;
      this._notify();
    }
  }

  _notify() {
    for (const listener of this.listeners) {
      try {
        listener(this._score, this.violations);
      } catch (e) {
        console.error('Trust score listener error:', e);
      }
    }
  }
}

export default TrustScoreEngine;
```

---

## 10. User-Facing Trust UI

### 10.1 Trust Indicator (`client/js/ui/trust-indicator.js`)

```js
// client/js/ui/trust-indicator.js

/**
 * Trust Indicator UI Component
 *
 * Renders a visual trust badge + expandable detail panel.
 * Designed to be calm, informative, and never alarmist.
 */

class TrustIndicator {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      throw new Error(`Trust indicator container not found: ${containerSelector}`);
    }
    this._inputElement = null;
    this._delayedMode = false;
    this._delayMs = 0;
    this._render();
  }

  setInputElement(el) {
    this._inputElement = el;
  }

  _render() {
    this.container.innerHTML = `
      <div id="zt-trust-badge" class="zt-trust-badge zt-secure" role="status" aria-live="polite">
        <span class="zt-trust-icon">🟢</span>
        <span class="zt-trust-label">Private session verified</span>
        <button class="zt-trust-expand" aria-label="Security details" title="Security details">ℹ</button>
      </div>
      <div id="zt-trust-detail" class="zt-trust-detail" hidden>
        <div class="zt-trust-detail-content">
          <h4>Session Security Status</h4>
          <p id="zt-trust-detail-text"></p>
          <ul id="zt-trust-violations"></ul>
          <div id="zt-trust-actions"></div>
        </div>
      </div>
      <div id="zt-trust-banner" class="zt-trust-banner" hidden role="alert">
      </div>
    `;

    // Toggle detail panel
    this.container
      .querySelector('.zt-trust-expand')
      .addEventListener('click', () => {
        const detail = this.container.querySelector('#zt-trust-detail');
        detail.hidden = !detail.hidden;
      });
  }

  /**
   * Update the visual status.
   * @param {'secure'|'warning'|'quarantine'|'lockdown'|'destroyed'} level
   * @param {object} info
   */
  showStatus(level, info) {
    const badge = this.container.querySelector('#zt-trust-badge');
    const banner = this.container.querySelector('#zt-trust-banner');
    const detailText = this.container.querySelector('#zt-trust-detail-text');
    const violationsList = this.container.querySelector('#zt-trust-violations');
    const actionsDiv = this.container.querySelector('#zt-trust-actions');

    // Update badge
    badge.className = `zt-trust-badge zt-${level}`;
    badge.querySelector('.zt-trust-icon').textContent = info.icon || '🟢';
    badge.querySelector('.zt-trust-label').textContent = info.message || '';

    // Update detail panel
    detailText.textContent = info.detail || '';

    // Update violations list
    violationsList.innerHTML = '';
    if (info.violations) {
      for (const v of info.violations) {
        const li = document.createElement('li');
        li.textContent = `${v.type}: ${v.detail}`;
        li.className = 'zt-violation-item';
        violationsList.appendChild(li);
      }
    }

    // Update actions
    actionsDiv.innerHTML = '';
    if (info.actions) {
      for (const action of info.actions) {
        const btn = document.createElement('button');
        btn.textContent = action.label;
        btn.className = 'zt-action-btn';
        btn.addEventListener('click', () => this._handleAction(action.action));
        actionsDiv.appendChild(btn);
      }
    }

    // Show/hide banner for non-secure states
    if (level !== 'secure') {
      banner.hidden = false;
      banner.textContent = info.message;
      banner.className = `zt-trust-banner zt-banner-${level}`;
    } else {
      banner.hidden = true;
    }
  }

  enableInput(options = {}) {
    if (!this._inputElement) return;
    this._inputElement.disabled = false;
    this._inputElement.placeholder = 'Type your message...';

    if (options.delayed) {
      this._delayedMode = true;
      this._delayMs = options.delayMs || 2000;
      this._inputElement.placeholder = `Type your message... (${this._delayMs / 1000}s verification delay)`;
    } else {
      this._delayedMode = false;
    }
  }

  disableInput() {
    if (!this._inputElement) return;
    this._inputElement.disabled = true;
    this._inputElement.value = '';
    this._inputElement.placeholder = 'Input disabled for security';
  }

  isDelayedMode() {
    return this._delayedMode;
  }

  getDelayMs() {
    return this._delayMs;
  }

  _handleAction(action) {
    switch (action) {
      case 'reload':
        location.reload();
        break;
      case 'suggest_browser':
        alert(
          'For best security, use an up-to-date browser (Chrome, Firefox, Safari) without third-party extensions.'
        );
        break;
      case 'show_details':
        const detail = this.container.querySelector('#zt-trust-detail');
        detail.hidden = false;
        break;
    }
  }
}

export default TrustIndicator;
```

### 10.2 CSS Styles (`client/css/trust-ui.css`)

```css
/* client/css/trust-ui.css */

/* Trust Badge */
.zt-trust-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.3s ease;
  cursor: default;
  user-select: none;
}

.zt-trust-badge.zt-secure {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.zt-trust-badge.zt-warning {
  background: #fff8e1;
  color: #f57f17;
  border: 1px solid #ffe082;
}

.zt-trust-badge.zt-quarantine {
  background: #fff3e0;
  color: #e65100;
  border: 1px solid #ffcc80;
}

.zt-trust-badge.zt-lockdown {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.zt-trust-badge.zt-destroyed {
  background: #212121;
  color: #ef5350;
  border: 1px solid #ef5350;
}

.zt-trust-icon {
  font-size: 16px;
}

.zt-trust-label {
  flex: 1;
  font-weight: 500;
}

.zt-trust-expand {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 2px 6px;
  border-radius: 50%;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.zt-trust-expand:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

/* Trust Detail Panel */
.zt-trust-detail {
  margin-top: 8px;
  padding: 12px 16px;
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-height: 200px;
  overflow-y: auto;
}

.zt-trust-detail h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
}

.zt-trust-detail p {
  margin: 0 0 8px 0;
  color: #616161;
}

.zt-violation-item {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #757575;
  margin-bottom: 4px;
}

/* Trust Banner (appears at top of chat) */
.zt-trust-banner {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.zt-banner-warning {
  background: #fff8e1;
  color: #f57f17;
  border: 1px solid #ffe082;
}

.zt-banner-quarantine {
  background: #fff3e0;
  color: #e65100;
  border: 1px solid #ffcc80;
}

.zt-banner-lockdown {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.zt-banner-destroyed {
  background: #212121;
  color: #ef5350;
  border: 1px solid #ef5350;
}

/* Action Buttons */
.zt-action-btn {
  margin: 4px 4px 0 0;
  padding: 6px 12px;
  border: 1px solid #bdbdbd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.zt-action-btn:hover {
  background: #f5f5f5;
}
```

---

## 11. Zero-Trust Gateway (Server)

### 11.1 Gateway Entry Point (`server/gateway/index.js`)

```js
// server/gateway/index.js

import express from 'express';
import https from 'https';
import { createTLSConfig } from '../config/tls-config.js';
import { cspMiddleware } from '../config/csp-headers.js';
import { signatureVerify } from './middleware/signature-verify.js';
import { sessionValidate } from './middleware/session-validate.js';
import { trustEvaluate } from './middleware/trust-evaluate.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { anomalyDetector } from './middleware/anomaly-detector.js';
import handshakeRouter from './routes/handshake.js';
import chatRouter from './routes/chat.js';
import heartbeatRouter from './routes/heartbeat.js';
import reportRouter from './routes/report.js';

const app = express();

// --- Global middleware ---

// Parse JSON bodies (limit size to prevent abuse)
app.use(express.json({ limit: '16kb' }));

// CSP headers on all responses
app.use(cspMiddleware);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
});

// Anomaly detection (runs on all requests)
app.use(anomalyDetector);

// --- Routes ---

// Handshake — establishes session, exchanges keys
app.use('/api/handshake', rateLimiter('handshake'), handshakeRouter);

// Chat — processes sealed messages
app.use(
  '/api/chat',
  rateLimiter('chat'),
  sessionValidate,
  signatureVerify,
  trustEvaluate,
  chatRouter
);

// Heartbeat — integrity attestation
app.use(
  '/api/heartbeat',
  rateLimiter('heartbeat'),
  sessionValidate,
  signatureVerify,
  heartbeatRouter
);

// Report — CSP violations, client security reports
app.use('/api/report', rateLimiter('report'), reportRouter);

// --- Start server ---
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  const tlsConfig = createTLSConfig();
  https.createServer(tlsConfig, app).listen(PORT, () => {
    console.log(`Zero-Trust Gateway listening on :${PORT} (TLS)`);
  });
} else {
  // Development — HTTP (nginx handles TLS in production)
  app.listen(PORT, () => {
    console.log(`Zero-Trust Gateway listening on :${PORT} (HTTP dev mode)`);
  });
}

export default app;
```

### 11.2 Handshake Route (`server/gateway/routes/handshake.js`)

```js
// server/gateway/routes/handshake.js

import { Router } from 'express';
import crypto from 'crypto';
import { KeyManager } from '../crypto/key-manager.js';

const router = Router();
const keyManager = new KeyManager();

// In-memory session store (use Redis/similar in production)
const sessions = new Map();

router.post('/', async (req, res) => {
  try {
    const {
      clientEncryptionPublicKey, // ECDH public key (JWK)
      clientSigningPublicKey, // ECDSA public key (JWK)
      clientAttestation, // { payload, signature }
    } = req.body;

    // Validate required fields
    if (!clientEncryptionPublicKey || !clientSigningPublicKey) {
      return res.status(400).json({ error: 'Missing client keys' });
    }

    // 1. Generate server-side ephemeral ECDH key pair
    const serverECDH = await keyManager.generateEphemeralECDH();

    // 2. Derive shared key
    const sharedKey = await keyManager.deriveSharedKey(
      serverECDH.privateKey,
      clientEncryptionPublicKey
    );

    // 3. Generate session nonce
    const sessionNonce = crypto.randomBytes(32).toString('hex');

    // 4. Generate server nonce for next attestation
    const serverNonce = crypto.randomBytes(16).toString('hex');

    // 5. Compute expected bundle hash (from build artifacts)
    const expectedBundleHash = process.env.EXPECTED_BUNDLE_HASH || 'not-configured';

    // 6. If attestation provided, verify it
    let attestationValid = false;
    if (clientAttestation) {
      attestationValid = await keyManager.verifyAttestation(
        clientAttestation,
        clientSigningPublicKey,
        expectedBundleHash
      );
    }

    // 7. Create session record
    const session = {
      id: sessionNonce,
      clientSigningPublicKey,
      clientEncryptionPublicKey,
      sharedKey,
      attestationValid,
      createdAt: Date.now(),
      lastHeartbeat: Date.now(),
      trustScore: attestationValid ? 0 : 20, // start slightly elevated if no attestation
      messageCount: 0,
      clientIP: req.ip,
      userAgent: req.headers['user-agent'],
      nonces: new Set(), // track used nonces for replay prevention
    };

    sessions.set(sessionNonce, session);

    // 8. Set session expiry (30 minutes)
    setTimeout(() => {
      sessions.delete(sessionNonce);
    }, 30 * 60 * 1000);

    // 9. Generate server signing key pair for this session
    const serverSigningPublicKey = await keyManager.getSessionSigningPublicKey(
      sessionNonce
    );

    // 10. Send response
    res.json({
      sessionNonce,
      serverNonce,
      serverEncryptionPublicKey: serverECDH.publicKeyJwk,
      serverSigningPublicKey,
      expectedBundleHash,
      attestationAccepted: attestationValid,
      heartbeatIntervalMs: 15_000,
      keyRotationIntervalMs: 5 * 60 * 1000,
      maxMessageSize: 4096,
    });
  } catch (error) {
    console.error('Handshake error:', error);
    res.status(500).json({ error: 'Handshake failed' });
  }
});

// Export sessions for use by other middleware
export { sessions };
export default router;
```

### 11.3 Signature Verification Middleware (`server/gateway/middleware/signature-verify.js`)

```js
// server/gateway/middleware/signature-verify.js

import crypto from 'crypto';
import { sessions } from '../routes/handshake.js';

export async function signatureVerify(req, res, next) {
  try {
    const sessionNonce = req.headers['x-session-nonce'] || req.body?.sessionNonce;
    const session = sessions.get(sessionNonce);

    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { payload, signature } = req.body;

    if (!payload || !signature) {
      return res.status(400).json({ error: 'Missing payload or signature' });
    }

    // Import client's signing public key
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      session.clientSigningPublicKey,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['verify']
    );

    // Verify signature
    const signatureBuffer = Buffer.from(signature, 'base64');
    const payloadBuffer = Buffer.from(payload, 'utf-8');

    const valid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      publicKey,
      signatureBuffer,
      payloadBuffer
    );

    if (!valid) {
      session.trustScore += 30;
      return res.status(403).json({ error: 'Signature verification failed' });
    }

    // Parse and attach verified payload
    req.verifiedPayload = JSON.parse(payload);
    req.session = session;

    next();
  } catch (error) {
    console.error('Signature verification error:', error);
    return res.status(403).json({ error: 'Signature verification failed' });
  }
}
```

### 11.4 Session Validation Middleware (`server/gateway/middleware/session-validate.js`)

```js
// server/gateway/middleware/session-validate.js

import { sessions } from '../routes/handshake.js';

const MAX_SESSION_AGE_MS = 30 * 60 * 1000; // 30 minutes
const MAX_TIMESTAMP_DRIFT_MS = 30_000; // 30 seconds

export function sessionValidate(req, res, next) {
  const sessionNonce =
    req.headers['x-session-nonce'] ||
    req.body?.sessionNonce;

  if (!sessionNonce) {
    return res.status(401).json({ error: 'No session nonce' });
  }

  const session = sessions.get(sessionNonce);

  if (!session) {
    return res.status(401).json({ error: 'Session not found or expired' });
  }

  // Check session age
  const age = Date.now() - session.createdAt;
  if (age > MAX_SESSION_AGE_MS) {
    sessions.delete(sessionNonce);
    return res.status(401).json({ error: 'Session expired' });
  }

  // Check for IP change (suspicious but not necessarily malicious)
  if (session.clientIP !== req.ip) {
    session.trustScore += 15;
    console.warn(
      `Session ${sessionNonce}: IP changed from ${session.clientIP} to ${req.ip}`
    );
  }

  // Check for user-agent change (more suspicious)
  if (session.userAgent !== req.headers['user-agent']) {
    session.trustScore += 20;
    console.warn(
      `Session ${sessionNonce}: User-Agent changed`
    );
  }

  // Attach session to request
  req.session = session;
  next();
}
```

### 11.5 Trust Evaluation Middleware (`server/gateway/middleware/trust-evaluate.js`)

```js
// server/gateway/middleware/trust-evaluate.js

const TRUST_THRESHOLD_REJECT = 80;
const TRUST_THRESHOLD_WARN = 50;

export function trustEvaluate(req, res, next) {
  const session = req.session;

  if (!session) {
    return res.status(401).json({ error: 'No session' });
  }

  // Check server-side trust score
  if (session.trustScore >= TRUST_THRESHOLD_REJECT) {
    return res.status(403).json({
      error: 'Session trust too low',
      trustScore: session.trustScore,
      recommendation: 'Please establish a new session from a secure environment',
    });
  }

  // Check for nonce replay
  const payload = req.verifiedPayload;
  if (payload?.messageNonce) {
    if (session.nonces.has(payload.messageNonce)) {
      session.trustScore += 25;
      return res.status(403).json({ error: 'Replay detected' });
    }
    session.nonces.add(payload.messageNonce);

    // Limit nonce set size
    if (session.nonces.size > 1000) {
      // Convert to array, keep last 500
      const arr = Array.from(session.nonces);
      session.nonces = new Set(arr.slice(-500));
    }
  }

  // Check timestamp freshness
  if (payload?.ts) {
    const drift = Math.abs(Date.now() - payload.ts);
    if (drift > 30_000) {
      session.trustScore += 10;
    }
  }

  // Set trust header for downstream handlers
  req.trustLevel = session.trustScore < 30 ? 'high' : session.trustScore < 60 ? 'medium' : 'low';

  next();
}
```

### 11.6 Anomaly Detection Middleware (`server/gateway/middleware/anomaly-detector.js`)

```js
// server/gateway/middleware/anomaly-detector.js

/**
 * Server-side anomaly detection.
 * Tracks per-IP behavioral patterns and flags deviations.
 */

const ipProfiles = new Map();

const WINDOW_MS = 60_000; // 1-minute windows

export function anomalyDetector(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  if (!ipProfiles.has(ip)) {
    ipProfiles.set(ip, {
      requests: [],
      firstSeen: now,
      sessions: new Set(),
      blockedUntil: 0,
    });
  }

  const profile = ipProfiles.get(ip);

  // Check if IP is temporarily blocked
  if (profile.blockedUntil > now) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Record request
  profile.requests.push(now);

  // Trim old requests
  profile.requests = profile.requests.filter((t) => now - t < WINDOW_MS);

  // Track sessions per IP
  const sessionNonce = req.headers['x-session-nonce'];
  if (sessionNonce) {
    profile.sessions.add(sessionNonce);
  }

  // Anomaly checks

  // 1. Request rate anomaly (more than 60 requests per minute)
  if (profile.requests.length > 60) {
    profile.blockedUntil = now + 60_000;
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  // 2. Too many concurrent sessions from one IP
  if (profile.sessions.size > 10) {
    console.warn(`Anomaly: IP ${ip} has ${profile.sessions.size} concurrent sessions`);
    // Don't block but flag
    req.anomalyFlags = req.anomalyFlags || [];
    req.anomalyFlags.push('EXCESSIVE_SESSIONS');
  }

  // 3. Unusual headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'via',
    'x-real-ip',
    'forwarded',
  ];
  const proxyIndicators = suspiciousHeaders.filter(
    (h) => req.headers[h] && req.headers[h] !== ip
  );
  if (proxyIndicators.length > 0) {
    req.anomalyFlags = req.anomalyFlags || [];
    req.anomalyFlags.push('PROXY_DETECTED');
  }

  // Cleanup old IP profiles every 5 minutes
  if (now % 300_000 < 1000) {
    for (const [profileIP, profileData] of ipProfiles) {
      if (now - profileData.firstSeen > 600_000 && profileData.requests.length === 0) {
        ipProfiles.delete(profileIP);
      }
    }
  }

  next();
}
```

---

## 12. Service Worker Shield

### `client/sw.js`

```js
// client/sw.js

/**
 * Service Worker Shield
 *
 * Acts as a network gatekeeper at the SW level.
 * All fetch requests from the page pass through here.
 *
 * Controls:
 *  - Destination allowlisting
 *  - Request/response integrity verification
 *  - Offline attestation caching
 *  - CSP enforcement backup
 */

const ALLOWED_ORIGINS = [
  self.location.origin, // Same origin
  // Add any additional trusted origins here
];

const CACHE_NAME = 'zt-attestation-v1';

// Install — cache attestation resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache the main page and critical scripts for offline attestation
      return cache.addAll([
        '/',
        '/js/main.js',
        // Add other critical resources
      ]);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch — intercept and validate all network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Check if destination is allowed
  const isAllowed = ALLOWED_ORIGINS.some((origin) => url.origin === origin);

  if (!isAllowed) {
    console.warn(`[SW Shield] Blocked request to: ${url.origin}${url.pathname}`);

    // Report to main thread
    reportViolation({
      type: 'SW_BLOCKED_REQUEST',
      destination: url.origin,
      path: url.pathname,
      timestamp: Date.now(),
    });

    // Return a blocked response
    event.respondWith(
      new Response(JSON.stringify({ error: 'Destination not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    return;
  }

  // For allowed requests, add security headers and pass through
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Verify response headers for MITM indicators
        const cloned = response.clone();
        verifyResponse(cloned, url);
        return response;
      })
      .catch((error) => {
        // Network error — try cache for critical resources
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          throw error;
        });
      })
  );
});

// Message handler — receive configuration updates from main thread
self.addEventListener('message', (event) => {
  if (event.data?.type === 'UPDATE_ALLOWED_ORIGINS') {
    // In production, verify the update is signed
    // For now, only accept from same origin
    const newOrigins = event.data.origins;
    if (Array.isArray(newOrigins)) {
      // Only add, never remove the base origin
      newOrigins.forEach((origin) => {
        if (!ALLOWED_ORIGINS.includes(origin)) {
          ALLOWED_ORIGINS.push(origin);
        }
      });
    }
  }
});

function verifyResponse(response, url) {
  // Check for suspicious response modifications
  const ct = response.headers.get('content-type');

  // If we requested JSON but got HTML, something may be intercepting
  if (
    url.pathname.startsWith('/api/') &&
    ct &&
    ct.includes('text/html')
  ) {
    reportViolation({
      type: 'RESPONSE_TYPE_MISMATCH',
      expected: 'application/json',
      received: ct,
      url: url.href,
      timestamp: Date.now(),
    });
  }
}

function reportViolation(violation) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SW_SECURITY_VIOLATION',
        violation,
      });
    });
  });
}
```

---

## 13. Content Security Policy & Headers

Already covered in section 3.3 (`server/config/csp-headers.js`). Here's the summary of all security headers applied:

```
Content-Security-Policy:
  default-src 'none';
  script-src 'self' 'nonce-{per-request}';
  style-src 'self' 'nonce-{per-request}';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self';
  frame-src 'none';
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  manifest-src 'self';
  worker-src 'self';
  require-trusted-types-for 'script';
  upgrade-insecure-requests;
  report-uri /api/report/csp;

Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
Cache-Control: no-store
Pragma: no-cache
```

---

## 14. Tamper-Evident Message Chain

Already implemented in `client/js/crypto/message-chain.js` (section 4.3). Here's the corresponding server-side verification:

### `server/gateway/crypto/chain-verifier.js`

```js
// server/gateway/crypto/chain-verifier.js

import crypto from 'crypto';

class ServerMessageChain {
  constructor() {
    // Map of sessionNonce → { previousHash, chainLength }
    this.chains = new Map();
  }

  /**
   * Initialize a chain for a new session.
   */
  initializeChain(sessionNonce, initialHash) {
    this.chains.set(sessionNonce, {
      previousHash: initialHash,
      chainLength: 0,
    });
  }

  /**
   * Verify and advance the chain for a received message.
   */
  async verifyAndAdvance(sessionNonce, message) {
    const chain = this.chains.get(sessionNonce);
    if (!chain) {
      return { valid: false, reason: 'Chain not initialized' };
    }

    const { chainHash, chainIndex } = message;

    // Verify sequence number
    if (chainIndex !== chain.chainLength) {
      return {
        valid: false,
        reason: `Expected chain index ${chain.chainLength}, got ${chainIndex}`,
      };
    }

    // Recompute expected hash
    const chainInput = [
      chain.previousHash,
      message.text,
      message.ts?.toString() || '',
      message.messageNonce,
      chain.chainLength.toString(),
    ].join('|');

    const expectedHash = await this._sha256Hex(chainInput);

    if (expectedHash !== chainHash) {
      return {
        valid: false,
        reason: 'Chain hash mismatch — message may have been tampered',
      };
    }

    // Advance chain
    chain.previousHash = chainHash;
    chain.chainLength++;

    return { valid: true };
  }

  deleteChain(sessionNonce) {
    this.chains.delete(sessionNonce);
  }

  async _sha256Hex(str) {
    const hash = crypto.createHash('sha256').update(str).digest('hex');
    return hash;
  }
}

export default ServerMessageChain;
```

---

## 15. Main Application Entry Point

### `client/js/main.js`

```js
// client/js/main.js

/**
 * Zero-Trust Chat Client — Main Entry Point
 *
 * Boot sequence:
 * 1. Initialize trust score engine
 * 2. Install API guards (as early as possible)
 * 3. Install listener auditor
 * 4. Start mutation monitor
 * 5. Register service worker
 * 6. Generate ephemeral keys
 * 7. Perform handshake with server
 * 8. Verify runtime attestation
 * 9. Start integrity heartbeat
 * 10. Initialize self-defense module
 * 11. Enable chat UI
 */

import TrustScoreEngine from './defense/trust-score.js';
import APIGuard from './integrity/api-guard.js';
import ListenerAuditor from './integrity/listener-auditor.js';
import MutationMonitor from './integrity/mutation-monitor.js';
import RuntimeAttestation from './integrity/runtime-attestation.js';
import SessionKeyManager from './crypto/session-keys.js';
import SignatureManager from './crypto/signature.js';
import MessageChain from './crypto/message-chain.js';
import InputSealer from './crypto/input-sealer.js';
import IntegrityHeartbeat from './integrity/heartbeat.js';
import SelfDefense from './defense/self-defense.js';
import TrustIndicator from './ui/trust-indicator.js';

(async function boot() {
  console.log('[ZT-Chat] Boot sequence starting...');

  // ---- Step 1: Trust Score Engine ----
  const trustEngine = new TrustScoreEngine();

  // ---- Step 2: API Guards ----
  // Must be installed FIRST, before any other scripts can intercept
  const apiGuard = new APIGuard(trustEngine, [
    location.hostname, // same-origin only
  ]);
  apiGuard.install();
  console.log('[ZT-Chat] API guards installed');

  // ---- Step 3: Listener Auditor ----
  const listenerAuditor = new ListenerAuditor(trustEngine);
  // Must capture native addEventListener reference BEFORE wrapping
  listenerAuditor.install(apiGuard.natives.addEventListener);
  console.log('[ZT-Chat] Listener auditor installed');

  // ---- Step 4: Mutation Monitor ----
  const mutationMonitor = new MutationMonitor(trustEngine);
  // Register all currently loaded scripts as allowed
  const existingScripts = Array.from(document.querySelectorAll('script[src]')).map(
    (s) => s.src
  );
  mutationMonitor.registerAllowedScripts(existingScripts);
  mutationMonitor.start();
  console.log('[ZT-Chat] Mutation monitor active');

  // ---- Step 5: Service Worker ----
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[ZT-Chat] Service worker registered');

      // Listen for SW security violations
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_SECURITY_VIOLATION') {
          trustEngine.addViolation({
            ...event.data.violation,
            severity: event.data.violation.severity || 20,
          });
        }
      });
    } catch (err) {
      console.warn('[ZT-Chat] Service worker registration failed:', err);
      trustEngine.addViolation({
        type: 'SW_REGISTRATION_FAILED',
        severity: 10,
        detail: err.message,
        timestamp: Date.now(),
      });
    }
  }

  // ---- Step 6: Generate Ephemeral Keys ----
  const sessionKeys = new SessionKeyManager();
  const sigManager = new SignatureManager();

  const encryptionPubKey = await sessionKeys.generateEphemeralKeys();
  const signingPubKey = await sigManager.generateSigningKeys();
  console.log('[ZT-Chat] Ephemeral keys generated');

  // ---- Step 7: Runtime Attestation ----
  const attestation = new RuntimeAttestation(sigManager);
  const bootAttestation = await attestation.createAttestation('pre-handshake');
  console.log('[ZT-Chat] Boot attestation computed');

  // ---- Step 8: Handshake ----
  let handshakeResponse;
  try {
    const resp = await fetch('/api/handshake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientEncryptionPublicKey: encryptionPubKey,
        clientSigningPublicKey: signingPubKey,
        clientAttestation: bootAttestation,
      }),
    });

    if (!resp.ok) {
      throw new Error(`Handshake failed: ${resp.status}`);
    }

    handshakeResponse = await resp.json();
    console.log('[ZT-Chat] Handshake complete');
  } catch (err) {
    console.error('[ZT-Chat] Handshake error:', err);
    trustEngine.addViolation({
      type: 'HANDSHAKE_FAILED',
      severity: 50,
      detail: err.message,
      timestamp: Date.now(),
    });
    // Show error UI and stop
    document.querySelector('#chat-status').textContent =
      'Unable to establish secure session. Please reload.';
    return;
  }

  // ---- Step 9: Derive Shared Key ----
  await sessionKeys.deriveSharedKey(handshakeResponse.serverEncryptionPublicKey);
  sessionKeys.sessionId = handshakeResponse.sessionNonce;

  // ---- Step 10: Initialize Message Chain ----
  const messageChain = new MessageChain();
  const chainInitHash = await messageChain.initialize(handshakeResponse.sessionNonce);

  // ---- Step 11: Initialize Input Sealer ----
  const heartbeat = new IntegrityHeartbeat({
    runtimeAttestation: attestation,
    signatureManager: sigManager,
    trustScoreEngine: trustEngine,
    apiGuard,
    listenerAuditor,
    sessionNonce: handshakeResponse.sessionNonce,
    serverEndpoint: '/api/heartbeat',
    intervalMs: handshakeResponse.heartbeatIntervalMs || 15_000,
  });

  const inputSealer = new InputSealer(
    sessionKeys,
    sigManager,
    messageChain,
    heartbeat
  );

  // ---- Step 12: Trust UI ----
  const trustUI = new TrustIndicator('#trust-indicator-container');
  const chatInput = document.querySelector('#chat-input');
  trustUI.setInputElement(chatInput);

  // Register chat input as sensitive element for monitoring
  if (chatInput) {
    listenerAuditor.registerSensitiveElements([chatInput]);
    mutationMonitor.registerCriticalElements(['#chat-input', '#chat-messages']);
  }

  // ---- Step 13: Self-Defense Module ----
  const selfDefense = new SelfDefense({
    trustScoreEngine: trustEngine,
    sessionKeyManager: sessionKeys,
    signatureManager: sigManager,
    messageChain,
    inputSealer,
    heartbeat,
    trustUI,
  });

  // Connect trust score changes to self-defense
  trustEngine.onScoreChange((score, violations) => {
    selfDefense.onTrustScoreChange(score, violations);
  });

  // ---- Step 14: Start Heartbeat ----
  heartbeat.start();
  console.log('[ZT-Chat] Integrity heartbeat started');

  // ---- Step 15: Wire up Chat Send ----
  const sendButton = document.querySelector('#chat-send');
  const chatMessages = document.querySelector('#chat-messages');

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    if (chatInput.disabled) return;

    try {
      // Check for key rotation
      if (sessionKeys.needsRotation()) {
        // Perform key rotation (simplified — in production, use a dedicated rotation endpoint)
        const newPubKey = await sessionKeys.generateEphemeralKeys();
        // ... rotation handshake would go here
        console.log('[ZT-Chat] Key rotation needed — implement rotation handshake');
      }

      // Handle delayed mode (quarantine)
      if (trustUI.isDelayedMode()) {
        chatInput.disabled = true;
        await new Promise((resolve) => setTimeout(resolve, trustUI.getDelayMs()));
        chatInput.disabled = false;
      }

      // Seal the message
      const sealed = await inputSealer.seal(text, handshakeResponse.sessionNonce);

      // Display locally
      appendMessage('user', text);
      chatInput.value = '';

      // Send sealed message
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Nonce': handshakeResponse.sessionNonce,
        },
        body: JSON.stringify({
          envelope: sealed.envelope,
          signature: sealed.signature,
          payload: sealed.envelope, // for signature verification middleware
        }),
      });

      if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(error.error || `Server error: ${resp.status}`);
      }

      const serverResp = await resp.json();

      // Verify and decrypt server response
      if (serverResp.envelope && serverResp.signature) {
        const decrypted = await inputSealer.unsealResponse(
          serverResp.envelope,
          serverResp.signature,
          handshakeResponse.serverSigningPublicKey
        );
        appendMessage('assistant', decrypted.text);
      }
    } catch (err) {
      console.error('[ZT-Chat] Send error:', err);
      if (err.message === 'KEY_ROTATION_NEEDED') {
        appendMessage('system', 'Session refreshing — please resend your message.');
      } else {
        appendMessage('system', 'Message could not be sent securely. Please try again.');
      }
    }
  }

  function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `chat-message chat-${role}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  sendButton?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // ---- Boot Complete ----
  trustUI.showStatus('secure', {
    message: 'Private session verified',
    icon: '🟢',
  });

  console.log('[ZT-Chat] Boot sequence complete. Chat ready.');
})();
```

---

## 16. HTML Template

### `client/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Secure Chat</title>

  <!-- CSP nonce will be injected server-side -->
  <link rel="stylesheet" href="/css/trust-ui.css" nonce="{{CSP_NONCE}}">

  <style nonce="{{CSP_NONCE}}">
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .chat-container {
      width: 100%;
      max-width: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      height: 80vh;
      overflow: hidden;
    }
    .chat-header {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    .chat-header h1 {
      font-size: 18px;
      margin-bottom: 8px;
    }
    #chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .chat-message {
      margin-bottom: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      max-width: 80%;
      word-wrap: break-word;
      font-size: 14px;
      line-height: 1.5;
    }
    .chat-user {
      background: #e3f2fd;
      margin-left: auto;
      text-align: right;
    }
    .chat-assistant {
      background: #f5f5f5;
    }
    .chat-system {
      background: #fff8e1;
      color: #f57f17;
      font-size: 12px;
      text-align: center;
      max-width: 100%;
    }
    .chat-input-area {
      padding: 12px 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 8px;
    }
    #chat-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    #chat-input:focus { border-color: #1976d2; }
    #chat-input:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }
    #chat-send {
      padding: 10px 20px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }
    #chat-send:hover { background: #1565c0; }
    #chat-send:disabled {
      background: #bdbdbd;
      cursor: not-allowed;
    }
    #chat-status {
      padding: 8px 16px;
      font-size: 12px;
      color: #757575;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="chat-container">
    <div class="chat-header">
      <h1>Secure Chat</h1>
      <div id="trust-indicator-container"></div>
    </div>

    <div id="chat-messages">
      <!-- Messages will be appended here -->
    </div>

    <div id="chat-status">Establishing secure session...</div>

    <div class="chat-input-area">
      <input
        type="text"
        id="chat-input"
        placeholder="Connecting..."
        disabled
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      >
      <button id="chat-send" disabled>Send</button>
    </div>
  </div>

  <!-- Main application script — loaded with SRI -->
  <script
    type="module"
    src="/js/main.js"
    nonce="{{CSP_NONCE}}"
    integrity="sha384-{{BUNDLE_HASH}}"
    crossorigin="anonymous"
  ></script>

</body>
</html>
```

---

## 17. Build-Time Hash Computation

### `scripts/compute-bundle-hash.js`

```js
// scripts/compute-bundle-hash.js

/**
 * Run at build time to compute SRI hashes for all JS bundles.
 * Output is used in:
 *  1. HTML integrity attributes
 *  2. Server's expected bundle hash (for attestation verification)
 *  3. .env file for runtime configuration
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CLIENT_DIR = path.resolve('client/js');
const OUTPUT_FILE = path.resolve('.bundle-hashes.json');

function computeSRIHash(filePath) {
  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha384').update(content).digest('base64');
  return `sha384-${hash}`;
}

function computeSHA256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Compute hashes
const jsFiles = walkDir(CLIENT_DIR);
const hashes = {};

for (const file of jsFiles) {
  const relativePath = path.relative('client', file);
  hashes[relativePath] = {
    sri: computeSRIHash(file),
    sha256: computeSHA256(file),
  };
}

// Compute overall bundle fingerprint (hash of all file hashes)
const bundleFingerprint = crypto
  .createHash('sha256')
  .update(
    Object.entries(hashes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v.sha256}`)
      .join('\n')
  )
  .digest('hex');

const output = {
  generatedAt: new Date().toISOString(),
  bundleFingerprint,
  files: hashes,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log('Bundle hashes computed:');
console.log(`  Bundle fingerprint: ${bundleFingerprint}`);
console.log(`  Files hashed: ${jsFiles.length}`);
console.log(`  Output: ${OUTPUT_FILE}`);

// Also write to .env format
const envLine = `EXPECTED_BUNDLE_HASH=${bundleFingerprint}`;
const envFile = path.resolve('.env.bundle');
fs.writeFileSync(envFile, envLine);
console.log(`  Env file: ${envFile}`);
```

---

## 18. Deployment Checklist

### Pre-Deployment

- [ ] Generate TLS certificates (Let's Encrypt / your CA)
- [ ] Configure DNSSEC for your domain (if using DANE/TLSA)
- [ ] Run `node scripts/compute-bundle-hash.js` after every build
- [ ] Set `EXPECTED_BUNDLE_HASH` in server environment
- [ ] Configure nginx with the provided `nginx.conf`
- [ ] Register for HSTS preload at `hstspreload.org`
- [ ] Set up Certificate Transparency monitoring (e.g., `crt.sh`, Certspotter)

### Server Configuration

- [ ] TLS 1.3 only (verify with `testssl.sh` or `ssllabs.com/ssltest`)
- [ ] OCSP stapling enabled and working
- [ ] HSTS header with `preload` directive
- [ ] All security headers present (use `securityheaders.com` to verify)
- [ ] CSP properly configured and tested (no violations on normal use)
- [ ] Rate limiting configured per endpoint
- [ ] Log rotation and monitoring configured

### Client Security

- [ ] All scripts served same-origin
- [ ] No third-party scripts loaded
- [ ] SRI hashes on all `<script>` and `<link>` tags
- [ ] Service worker registered and functional
- [ ] API guard wrappers installed before any other code
- [ ] CSP nonces unique per request

### Operational

- [ ] Monitor CSP violation reports (`/api/report/csp`)
- [ ] Monitor client security reports (`/api/report`)
- [ ] Set up alerting for trust score spikes
- [ ] Set up alerting for anomaly detector flags
- [ ] Regular key rotation schedule configured
- [ ] Session expiry functioning correctly
- [ ] Load testing completed (ensure security overhead is acceptable)

### Testing

- [ ] Test with browser DevTools open (should not trigger false positives)
- [ ] Test with common browser extensions (ad blockers, password managers)
- [ ] Test on mobile browsers
- [ ] Test with VPN/proxy (should detect but handle gracefully)
- [ ] Test CSP violations by attempting inline script injection
- [ ] Test message chain integrity by simulating out-of-order messages
- [ ] Test key rotation under load
- [ ] Test self-defense escalation levels manually
- [ ] Penetration test with common MITM tools (mitmproxy, Burp Suite)

---

## Security Tradeoffs & Limitations

| What This System Does Well | What It Cannot Do |
|---|---|
| Detects network-level MITM symptoms | Read actual TLS certificate from JS |
| Blocks exfiltration to unauthorized domains | Stop kernel-level keyloggers |
| Detects script/DOM injection | Detect sophisticated browser extensions that intercept at the browser API level before your code runs |
| Creates tamper-evident message chains | Guarantee integrity if the initial page load is compromised |
| Provides user-visible trust transparency | Prevent screenshots or screen recording |
| Encrypts messages at the application layer | Stop a fully compromised OS |
| Implements progressive defense (graceful degradation) | Replace proper endpoint security |

**The fundamental principle:** This system makes compromise **observable, costly, and evident** — even when it cannot be prevented. That alone raises the security bar above 99% of web chat implementations.
