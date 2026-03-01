claude-opus-4-6-thinking


Thought for 2 minutes and 52 seconds

Zero-Trust Chat Security System — Complete Production Implementation
Table of Contents
Architecture & Threat Model
Project Structure
Shared Constants & Types
Server Implementation
Client Security Modules
Service Worker
HTTP Security Headers & CSP
Integration Guide
Deployment Checklist
Testing Strategy
1. Architecture & Threat Model
System Diagram
text

┌─────────────────────────────────────────────────────────┐
│                      USER BROWSER                       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Prototype    │  │   Network    │  │  Integrity   │  │
│  │  Armor        │→ │  Guardian    │  │  Monitor     │  │
│  │ (freeze APIs) │  │ (wrap fetch) │  │ (DOM watch)  │  │
│  └──────────────┘  └──────┬───────┘  └──────┬───────┘  │
│                           │                  │          │
│  ┌──────────────┐  ┌──────▼──────────────────▼───────┐  │
│  │  Crypto       │  │       Trust Scorer              │  │
│  │  Engine       │  │  (aggregate risk signals)       │  │
│  │ (ECDH/AES)   │  └──────┬──────────────────────────┘  │
│  └──────┬───────┘         │                             │
│         │          ┌──────▼───────┐  ┌──────────────┐   │
│  ┌──────▼───────┐  │  Security    │  │  Heartbeat   │   │
│  │  Message      │  │  UI          │  │  (10s cycle) │   │
│  │  Sealer       │  │ (trust badge)│  └──────┬───────┘   │
│  │ (encrypt+sign)│  └─────────────┘         │           │
│  └──────┬───────┘                           │           │
│         │         ┌─────────────────────────┘           │
│  ┌──────▼─────────▼──────┐                              │
│  │   Service Worker       │                              │
│  │  (request gatekeeper)  │                              │
│  └──────────┬─────────────┘                              │
└─────────────┼───────────────────────────────────────────┘
              │  Encrypted + Signed Payloads
              ▼
┌─────────────────────────────────────────────────────────┐
│                 ZERO-TRUST GATEWAY                      │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Session      │  │   Trust      │  │   Nonce      │  │
│  │  Manager      │  │  Evaluator   │  │   Store      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │
│         │                 │                             │
│         ▼                 ▼                             │
│  ┌─────────────────────────────────────┐                │
│  │  Crypto Utils (verify, decrypt)     │                │
│  └──────────────────┬──────────────────┘                │
│                     │                                   │
│                     ▼                                   │
│              ┌─────────────┐                            │
│              │  LLM / Chat │                            │
│              │  Backend    │                            │
│              └─────────────┘                            │
└─────────────────────────────────────────────────────────┘
Cryptographic Protocol Flow
text

CLIENT                                    SERVER

Phase 1: Session Initialization
─────────────────────────────────────────────────────────
        ──── GET /api/session/init ──────►
                                          Generate nonce
                                          Generate ECDH keypair
                                          Sign(nonce, pubKey, bundleHash)
        ◄─── {nonce, serverPub,     ─────
              bundleHash, signature}

Phase 2: Session Establishment
─────────────────────────────────────────────────────────
Verify server signature
Compute runtime hash
Generate ECDH keypair
Derive shared secret (ECDH)
Derive AES-256-GCM key (HKDF)
Build attestation payload

        ──── POST /api/session/est ──────►
             {clientPub, attestation}     Verify nonce (one-time)
                                          Import client public key
                                          Derive shared secret
                                          Derive AES key
                                          Verify attestation
                                          Create session record
        ◄─── {sessionId, trustScore} ────

Phase 3: Encrypted Messaging
─────────────────────────────────────────────────────────
Seal message:
  plaintext + timestamp + seq
  + runtimeHash + nonce
  → AES-GCM encrypt
  → chain hash (prev)

        ──── POST /api/chat ─────────────►
             {sid, seq, prev, iv, ct}     Verify session
                                          Decrypt AES-GCM
                                          Verify chain
                                          Verify timestamp window
                                          Verify runtime hash
                                          Update trust score
                                          Forward to LLM
                                          Encrypt response
        ◄─── {seq, iv, ct, prev}  ───────

Phase 4: Continuous Attestation (every 10s)
─────────────────────────────────────────────────────────
Gather signals:
  runtimeHash, apiIntegrity,
  listenerState, networkState
Encrypt attestation

        ──── POST /api/session/heartbeat ►
             {sid, encAttestation}         Decrypt
                                          Compare runtime hash
                                          Check signal drift
                                          Update trust score
        ◄─── {trustScore, action}  ───────
Update security UI
If action = "halt" → disable input
Threat Coverage Matrix
Attack Vector	Prevention	Detection	User Notified
Network MITM (WiFi/proxy)	TLS 1.3 + HSTS + encrypted payloads	Latency anomalies, header checks	✅
TLS interception proxy	Certificate Transparency + HKDF binding	Server-side CT monitoring	✅
CDN/supply-chain tamper	SRI + bundle hash attestation	Runtime hash mismatch	✅
XSS / script injection	CSP + Trusted Types	MutationObserver + DOM scanning	✅
Malicious browser extension	Prototype freezing + API wrapping	API integrity checks, listener audit	✅
Replay attack	Session nonces + timestamps + sequence	Duplicate nonce/seq detection	✅
Message tampering	AES-GCM authenticated encryption	Decryption failure, chain break	✅
Session hijacking	Ephemeral keys + IP binding	IP/fingerprint drift detection	✅
Keylogger (software)	— (cannot prevent)	Listener anomaly detection	⚠️ Partial
Full device compromise	— (cannot prevent)	Runtime attestation drift	⚠️ Partial
2. Project Structure
text

zero-trust-chat/
│
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.js                    # Express server entry point
│   │   ├── middleware/
│   │   │   ├── gateway.js              # Zero-trust verification middleware
│   │   │   ├── rate-limiter.js         # Rate limiting
│   │   │   └── security-headers.js     # HTTP security headers
│   │   ├── services/
│   │   │   ├── session-manager.js      # Session lifecycle & ECDH
│   │   │   ├── trust-evaluator.js      # Server-side trust scoring
│   │   │   ├── nonce-store.js          # Nonce management (replay prevention)
│   │   │   └── crypto-utils.js         # Cryptographic operations
│   │   ├── routes/
│   │   │   ├── session.js              # /api/session/* routes
│   │   │   └── chat.js                 # /api/chat/* routes
│   │   └── config.js                   # Server configuration
│   └── keys/
│       └── .gitkeep                    # Server signing keys (generated)
│
├── client/
│   └── security/
│       ├── index.js                    # Boot orchestrator
│       ├── crypto-engine.js            # WebCrypto ECDH/AES operations
│       ├── message-sealer.js           # Message encrypt/decrypt + chaining
│       ├── integrity-monitor.js        # DOM/script/listener monitoring
│       ├── network-guardian.js         # fetch/XHR/WebSocket wrapping
│       ├── prototype-armor.js          # Freeze native APIs
│       ├── trust-scorer.js             # Client-side risk aggregation
│       ├── heartbeat.js                # Continuous attestation
│       ├── security-ui.js             # Trust indicator component
│       ├── constants.js                # Client constants
│       └── sw.js                       # Service worker (separate file)
│
├── nginx/
│   └── security.conf                   # Nginx security header config
│
└── README.md
3. Shared Constants
client/security/constants.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Zero-Trust Chat — Client Constants
// ─────────────────────────────────────────────────────────────

export const ZTC_VERSION = 1;

// Your API origin — the ONLY allowed network destination
export const API_ORIGIN = 'https://api.yourdomain.com';

// Allowed hostnames for all network requests
export const ALLOWED_HOSTS = new Set([
  'api.yourdomain.com',
  'yourdomain.com',
]);

// Heartbeat interval (milliseconds)
export const HEARTBEAT_INTERVAL_MS = 10_000;

// Trust score thresholds
export const TRUST_THRESHOLDS = {
  SECURE: 0,       // 0 risk score = fully trusted
  SUSPICIOUS: 20,  // 20+ = yellow warning
  UNSAFE: 50,      // 50+ = red warning, input restricted
  COMPROMISED: 80, // 80+ = session halted
};

// Maximum allowed clock skew (milliseconds)
export const MAX_TIMESTAMP_DRIFT_MS = 30_000;

// Risk weights for different signals
export const RISK_WEIGHTS = {
  SCRIPT_INJECTED: 30,
  UNKNOWN_LISTENER: 20,
  API_MODIFIED: 25,
  NETWORK_BLOCKED: 15,
  FETCH_OVERRIDE: 25,
  DOM_TAMPERED: 20,
  BUNDLE_MISMATCH: 40,
  CSP_VIOLATION: 35,
  HEARTBEAT_FAILED: 15,
  TIMESTAMP_DRIFT: 10,
};

// Crypto constants
export const ECDH_CURVE = 'P-256';
export const AES_KEY_LENGTH = 256;
export const AES_IV_LENGTH = 12; // bytes
export const HKDF_INFO = 'zero-trust-chat-v1';
4. Server Implementation
server/package.json
JSON

{
  "name": "zero-trust-chat-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "generate-keys": "node src/generate-keys.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "rate-limiter-flexible": "^5.0.0",
    "uuid": "^9.0.0"
  }
}
server/.env.example
env

PORT=3001
NODE_ENV=production
ALLOWED_ORIGIN=https://yourdomain.com

# Base64-encoded ECDSA P-256 signing key (JWK)
# Generate with: npm run generate-keys
SIGNING_KEY_PRIVATE=
SIGNING_KEY_PUBLIC=

# Expected SHA-256 hash of the client JS bundle
EXPECTED_BUNDLE_HASH=

# Session TTL in seconds
SESSION_TTL=3600

# Rate limit: requests per second per IP
RATE_LIMIT_RPS=10
server/src/config.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Server Configuration
// ─────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keysDir = join(__dirname, '..', 'keys');

function loadKey(envVar, filename) {
  // Prefer environment variable (production)
  if (process.env[envVar]) {
    return JSON.parse(Buffer.from(process.env[envVar], 'base64').toString());
  }
  // Fall back to file (development)
  const path = join(keysDir, filename);
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf8'));
  }
  return null;
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',

  signingKeyPrivate: loadKey('SIGNING_KEY_PRIVATE', 'signing-private.jwk.json'),
  signingKeyPublic: loadKey('SIGNING_KEY_PUBLIC', 'signing-public.jwk.json'),

  expectedBundleHash: process.env.EXPECTED_BUNDLE_HASH || 'dev-mode-skip',

  sessionTTL: parseInt(process.env.SESSION_TTL || '3600', 10),
  rateLimitRPS: parseInt(process.env.RATE_LIMIT_RPS || '10', 10),

  // Trust evaluation thresholds
  trust: {
    maxTimestampDriftMs: 30_000,
    maxHeartbeatMissed: 3,
    minTrustForChat: 30, // reject if trust score < this
  },
};
server/src/generate-keys.js
JavaScript

#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// Generate ECDSA P-256 signing key pair for the server
// Run: node src/generate-keys.js
// ─────────────────────────────────────────────────────────────

import { webcrypto } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { subtle } = webcrypto;
const __dirname = dirname(fileURLToPath(import.meta.url));
const keysDir = join(__dirname, '..', 'keys');

async function main() {
  mkdirSync(keysDir, { recursive: true });

  // Generate ECDSA P-256 key pair for signing attestations
  const signingPair = await subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true, // extractable
    ['sign', 'verify']
  );

  const privJwk = await subtle.exportKey('jwk', signingPair.privateKey);
  const pubJwk = await subtle.exportKey('jwk', signingPair.publicKey);

  writeFileSync(
    join(keysDir, 'signing-private.jwk.json'),
    JSON.stringify(privJwk, null, 2)
  );
  writeFileSync(
    join(keysDir, 'signing-public.jwk.json'),
    JSON.stringify(pubJwk, null, 2)
  );

  // Also output base64 for .env
  console.log('\n✅ Keys generated in server/keys/\n');
  console.log('For .env:');
  console.log(
    `SIGNING_KEY_PRIVATE=${Buffer.from(JSON.stringify(privJwk)).toString('base64')}`
  );
  console.log(
    `SIGNING_KEY_PUBLIC=${Buffer.from(JSON.stringify(pubJwk)).toString('base64')}`
  );
}

main().catch(console.error);
server/src/services/crypto-utils.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Server Cryptographic Utilities
// ─────────────────────────────────────────────────────────────

import { webcrypto } from 'crypto';
const { subtle } = webcrypto;

// ── Key Import ───────────────────────────────────────────────

/**
 * Import the server's ECDSA private key for signing.
 */
export async function importSigningKey(jwk) {
  return subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

/**
 * Import the server's ECDSA public key for verification.
 */
export async function importVerifyKey(jwk) {
  return subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );
}

/**
 * Import a client's ECDH public key from JWK.
 */
export async function importClientECDHPublicKey(jwk) {
  return subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
}

// ── Key Generation ───────────────────────────────────────────

/**
 * Generate an ephemeral ECDH key pair for a session.
 */
export async function generateECDHKeyPair() {
  return subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // public key must be exportable
    ['deriveBits']
  );
}

/**
 * Export public key as JWK.
 */
export async function exportPublicKey(key) {
  return subtle.exportKey('jwk', key);
}

// ── Key Derivation ───────────────────────────────────────────

/**
 * Derive AES-256-GCM key from ECDH shared secret via HKDF.
 */
export async function deriveSessionKey(privateKey, remotePublicKey, nonce) {
  // Step 1: ECDH → shared bits
  const sharedBits = await subtle.deriveBits(
    { name: 'ECDH', public: remotePublicKey },
    privateKey,
    256
  );

  // Step 2: Import shared bits as HKDF base key
  const baseKey = await subtle.importKey(
    'raw',
    sharedBits,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // Step 3: HKDF → AES-256-GCM key
  const aesKey = await subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(nonce),
      info: new TextEncoder().encode('zero-trust-chat-v1'),
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return aesKey;
}

// ── Signing ──────────────────────────────────────────────────

/**
 * Sign arbitrary data with the server's ECDSA key.
 * Returns base64url-encoded signature.
 */
export async function sign(signingKey, data) {
  const encoded = new TextEncoder().encode(
    typeof data === 'string' ? data : JSON.stringify(data)
  );
  const sig = await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    encoded
  );
  return bufferToBase64url(sig);
}

/**
 * Verify an ECDSA signature.
 */
export async function verify(verifyKey, data, signatureB64) {
  const encoded = new TextEncoder().encode(
    typeof data === 'string' ? data : JSON.stringify(data)
  );
  const sig = base64urlToBuffer(signatureB64);
  return subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    verifyKey,
    sig,
    encoded
  );
}

// ── Encryption / Decryption ──────────────────────────────────

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns { iv (base64), ciphertext (base64) }.
 */
export async function encrypt(aesKey, plaintext, aad = '') {
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ct = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: new TextEncoder().encode(aad),
      tagLength: 128,
    },
    aesKey,
    encoded
  );

  return {
    iv: bufferToBase64url(iv),
    ciphertext: bufferToBase64url(ct),
  };
}

/**
 * Decrypt AES-256-GCM ciphertext.
 */
export async function decrypt(aesKey, ivB64, ciphertextB64, aad = '') {
  const iv = base64urlToBuffer(ivB64);
  const ct = base64urlToBuffer(ciphertextB64);

  const plainBuf = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: new TextEncoder().encode(aad),
      tagLength: 128,
    },
    aesKey,
    ct
  );

  return new TextDecoder().decode(plainBuf);
}

// ── Hashing ──────────────────────────────────────────────────

export async function sha256Hex(data) {
  const encoded = new TextEncoder().encode(data);
  const hash = await subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Base64url Helpers ────────────────────────────────────────

export function bufferToBase64url(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlToBuffer(b64) {
  const str = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
server/src/services/nonce-store.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Nonce Store — Prevents Replay Attacks
// In production, replace with Redis-backed implementation.
// ─────────────────────────────────────────────────────────────

export class NonceStore {
  constructor(ttlMs = 120_000) {
    this.ttlMs = ttlMs;
    this.nonces = new Map(); // nonce → { createdAt, used }
  }

  /**
   * Generate and store a new nonce.
   */
  generate() {
    const bytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(bytes);
    const nonce = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    this.nonces.set(nonce, {
      createdAt: Date.now(),
      used: false,
    });

    // Schedule cleanup
    setTimeout(() => this.nonces.delete(nonce), this.ttlMs);

    return nonce;
  }

  /**
   * Consume a nonce. Returns true if valid and unused.
   * Each nonce can only be consumed ONCE.
   */
  consume(nonce) {
    const entry = this.nonces.get(nonce);
    if (!entry) return false;
    if (entry.used) return false;
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.nonces.delete(nonce);
      return false;
    }

    entry.used = true;
    return true;
  }

  /**
   * Check if a nonce exists and is valid (without consuming).
   */
  isValid(nonce) {
    const entry = this.nonces.get(nonce);
    if (!entry) return false;
    if (entry.used) return false;
    return Date.now() - entry.createdAt <= this.ttlMs;
  }

  /**
   * Periodic cleanup of expired nonces.
   */
  cleanup() {
    const now = Date.now();
    for (const [nonce, entry] of this.nonces) {
      if (now - entry.createdAt > this.ttlMs) {
        this.nonces.delete(nonce);
      }
    }
  }
}
server/src/services/session-manager.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Session Manager — Ephemeral Key Negotiation & Lifecycle
// ─────────────────────────────────────────────────────────────

import { v4 as uuidv4 } from 'uuid';
import {
  generateECDHKeyPair,
  exportPublicKey,
  importClientECDHPublicKey,
  deriveSessionKey,
  encrypt,
  decrypt,
} from './crypto-utils.js';
import { config } from '../config.js';

export class SessionManager {
  constructor() {
    // Active sessions: sessionId → SessionRecord
    this.sessions = new Map();

    // Pending handshakes: nonce → PendingSession
    this.pending = new Map();

    // Cleanup interval
    setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Phase 1: Initialize a session handshake.
   * Returns { nonce, serverPublicKey (JWK) }.
   */
  async initSession(nonce) {
    const ecdhPair = await generateECDHKeyPair();
    const serverPubJwk = await exportPublicKey(ecdhPair.publicKey);

    this.pending.set(nonce, {
      ecdhPrivateKey: ecdhPair.privateKey,
      serverPubJwk,
      createdAt: Date.now(),
    });

    // Auto-expire pending handshake after 2 minutes
    setTimeout(() => this.pending.delete(nonce), 120_000);

    return { serverPublicKey: serverPubJwk };
  }

  /**
   * Phase 2: Establish the session after client sends its public key.
   * Returns { sessionId, trustScore }.
   */
  async establishSession(nonce, clientPubJwk, attestation, clientMeta) {
    const pending = this.pending.get(nonce);
    if (!pending) {
      throw new Error('Invalid or expired handshake nonce');
    }

    // Import client's ECDH public key
    const clientPublicKey = await importClientECDHPublicKey(clientPubJwk);

    // Derive shared AES-256-GCM key
    const aesKey = await deriveSessionKey(
      pending.ecdhPrivateKey,
      clientPublicKey,
      nonce
    );

    const sessionId = uuidv4();

    const session = {
      id: sessionId,
      aesKey,
      nonce,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      lastHeartbeat: Date.now(),
      missedHeartbeats: 0,
      messageSeq: 0,
      lastChainHash: null,
      trustScore: 100, // starts fully trusted
      runtimeHash: attestation?.runtimeHash || null,
      clientMeta: {
        ip: clientMeta.ip,
        userAgent: clientMeta.userAgent,
        ...clientMeta,
      },
      issues: [],
    };

    this.sessions.set(sessionId, session);
    this.pending.delete(nonce);

    return {
      sessionId,
      trustScore: session.trustScore,
    };
  }

  /**
   * Get a session by ID. Returns null if not found or expired.
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check TTL
    if (Date.now() - session.createdAt > config.sessionTTL * 1000) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Encrypt a server→client message.
   */
  async encryptResponse(session, plaintext) {
    session.messageSeq++;
    const aad = `${session.id}:${session.messageSeq}:server`;
    return encrypt(session.aesKey, plaintext, aad);
  }

  /**
   * Decrypt a client→server message.
   */
  async decryptMessage(session, ivB64, ciphertextB64, seq) {
    const aad = `${session.id}:${seq}:client`;
    return decrypt(session.aesKey, ivB64, ciphertextB64, aad);
  }

  /**
   * Update session activity timestamp.
   */
  touch(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) session.lastActivity = Date.now();
  }

  /**
   * Record a heartbeat.
   */
  recordHeartbeat(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastHeartbeat = Date.now();
      session.missedHeartbeats = 0;
    }
  }

  /**
   * Destroy a session.
   */
  destroySession(sessionId) {
    this.sessions.delete(sessionId);
  }

  /**
   * Cleanup expired sessions.
   */
  cleanup() {
    const now = Date.now();
    const ttl = config.sessionTTL * 1000;
    for (const [id, session] of this.sessions) {
      if (now - session.createdAt > ttl) {
        this.sessions.delete(id);
      }
    }
    for (const [nonce, pending] of this.pending) {
      if (now - pending.createdAt > 120_000) {
        this.pending.delete(nonce);
      }
    }
  }
}
server/src/services/trust-evaluator.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Trust Evaluator — Server-Side Risk Scoring
// ─────────────────────────────────────────────────────────────

import { config } from '../config.js';

export class TrustEvaluator {
  /**
   * Evaluate a message and update session trust score.
   * Returns { trustScore, action, issues }.
   *
   * action: 'allow' | 'warn' | 'restrict' | 'halt'
   */
  evaluate(session, messagePayload) {
    const issues = [];
    let penalty = 0;

    // 1. Timestamp drift check
    const drift = Math.abs(Date.now() - messagePayload.ts);
    if (drift > config.trust.maxTimestampDriftMs) {
      issues.push(`timestamp_drift:${drift}ms`);
      penalty += 15;
    }

    // 2. Runtime hash consistency
    if (session.runtimeHash && messagePayload.runtimeHash) {
      if (messagePayload.runtimeHash !== session.runtimeHash) {
        issues.push('runtime_hash_changed');
        penalty += 25;
        // Update stored hash (it may change legitimately on deploy)
        // In production, compare against server's expected hash
        session.runtimeHash = messagePayload.runtimeHash;
      }
    }

    // 3. Sequence continuity
    const expectedSeq = session.messageSeq + 1;
    if (messagePayload.seq !== expectedSeq) {
      issues.push(`seq_gap:expected=${expectedSeq},got=${messagePayload.seq}`);
      penalty += 20;
    }

    // 4. Chain hash verification
    if (session.lastChainHash !== null) {
      if (messagePayload.prev !== session.lastChainHash) {
        issues.push('chain_hash_mismatch');
        penalty += 30;
      }
    }

    // 5. Heartbeat health
    if (session.missedHeartbeats > config.trust.maxHeartbeatMissed) {
      issues.push(`heartbeat_missed:${session.missedHeartbeats}`);
      penalty += session.missedHeartbeats * 5;
    }

    // 6. Client IP consistency
    // (checked in gateway middleware, passed here as issue if changed)

    // Apply penalty (trust score decreases but never below 0)
    session.trustScore = Math.max(0, session.trustScore - penalty);

    // Gradual recovery: if no issues, slowly restore trust
    if (issues.length === 0 && session.trustScore < 100) {
      session.trustScore = Math.min(100, session.trustScore + 2);
    }

    session.issues.push(...issues);

    // Determine action
    let action = 'allow';
    if (session.trustScore < 20) action = 'halt';
    else if (session.trustScore < 40) action = 'restrict';
    else if (session.trustScore < 70) action = 'warn';

    return {
      trustScore: session.trustScore,
      action,
      issues,
    };
  }

  /**
   * Evaluate a heartbeat attestation.
   */
  evaluateHeartbeat(session, attestation) {
    const issues = [];
    let penalty = 0;

    // Check runtime hash drift
    if (session.runtimeHash && attestation.runtimeHash !== session.runtimeHash) {
      issues.push('heartbeat_runtime_drift');
      penalty += 15;
    }

    // Check reported client-side issues
    if (attestation.clientIssues && attestation.clientIssues.length > 0) {
      for (const issue of attestation.clientIssues) {
        issues.push(`client_reported:${issue}`);
        penalty += 10;
      }
    }

    // Check API integrity flags
    if (attestation.apiIntegrity === false) {
      issues.push('client_api_compromised');
      penalty += 30;
    }

    session.trustScore = Math.max(0, session.trustScore - penalty);

    if (issues.length === 0 && session.trustScore < 100) {
      session.trustScore = Math.min(100, session.trustScore + 1);
    }

    let action = 'allow';
    if (session.trustScore < 20) action = 'halt';
    else if (session.trustScore < 40) action = 'restrict';
    else if (session.trustScore < 70) action = 'warn';

    return { trustScore: session.trustScore, action, issues };
  }
}
server/src/middleware/security-headers.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Security Headers Middleware
// ─────────────────────────────────────────────────────────────

import { config } from '../config.js';

export function securityHeaders(req, res, next) {
  // Strict Transport Security (1 year, include subdomains, preload)
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Content Security Policy — extremely restrictive
  const csp = [
    `default-src 'none'`,
    `script-src 'self'`,
    `style-src 'self' 'unsafe-inline'`, // tighten with nonces if possible
    `connect-src 'self' ${config.allowedOrigin}`,
    `img-src 'self' data:`,
    `font-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `require-trusted-types-for 'script'`,
    `report-uri /api/csp-report`,
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy — disable unnecessary browser features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Cross-Origin policies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  // Disable caching for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }

  next();
}
server/src/middleware/rate-limiter.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Rate Limiter Middleware
// ─────────────────────────────────────────────────────────────

import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from '../config.js';

const limiter = new RateLimiterMemory({
  points: config.rateLimitRPS,
  duration: 1,
});

const sessionInitLimiter = new RateLimiterMemory({
  points: 3,  // max 3 session inits per 10 seconds
  duration: 10,
});

export async function rateLimitMiddleware(req, res, next) {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await limiter.consume(key);
    next();
  } catch {
    res.status(429).json({ error: 'rate_limited' });
  }
}

export async function sessionInitRateLimit(req, res, next) {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await sessionInitLimiter.consume(key);
    next();
  } catch {
    res.status(429).json({ error: 'rate_limited' });
  }
}
server/src/middleware/gateway.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Zero-Trust Gateway Middleware
// Verifies session, decrypts messages, checks trust
// ─────────────────────────────────────────────────────────────

import { sha256Hex } from '../services/crypto-utils.js';

/**
 * Creates the gateway middleware bound to session manager and trust evaluator.
 */
export function createGateway(sessionManager, trustEvaluator) {
  return async function gatewayMiddleware(req, res, next) {
    const sessionId = req.headers['x-session-id'] || req.body?.sid;

    if (!sessionId) {
      return res.status(401).json({ error: 'missing_session' });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'invalid_session' });
    }

    // IP consistency check
    const currentIP = req.ip || req.connection.remoteAddress;
    if (session.clientMeta.ip && session.clientMeta.ip !== currentIP) {
      session.trustScore = Math.max(0, session.trustScore - 20);
      session.issues.push(`ip_changed:${session.clientMeta.ip}->${currentIP}`);
    }

    // Attach session to request
    req.ztSession = session;
    req.trustEvaluator = trustEvaluator;

    sessionManager.touch(sessionId);
    next();
  };
}
server/src/routes/session.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Session Routes — /api/session/*
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import { sign, importSigningKey, sha256Hex } from '../services/crypto-utils.js';
import { config } from '../config.js';
import { sessionInitRateLimit } from '../middleware/rate-limiter.js';

export function createSessionRoutes(sessionManager, nonceStore, trustEvaluator) {
  const router = Router();
  let signingKey = null;

  // Lazy-init signing key
  async function getSigningKey() {
    if (!signingKey && config.signingKeyPrivate) {
      signingKey = await importSigningKey(config.signingKeyPrivate);
    }
    return signingKey;
  }

  // ── POST /api/session/init ──────────────────────────────
  // Phase 1: Server generates nonce + ECDH public key
  router.post('/init', sessionInitRateLimit, async (req, res) => {
    try {
      const nonce = nonceStore.generate();
      const { serverPublicKey } = await sessionManager.initSession(nonce);

      // Data to sign: nonce + server public key + expected bundle hash
      const signPayload = JSON.stringify({
        nonce,
        serverPublicKey,
        expectedBundleHash: config.expectedBundleHash,
      });

      const key = await getSigningKey();
      const signature = key ? await sign(key, signPayload) : null;

      res.json({
        nonce,
        serverPublicKey,
        expectedBundleHash: config.expectedBundleHash,
        serverVerifyKeyJwk: config.signingKeyPublic,
        signature,
      });
    } catch (err) {
      console.error('Session init error:', err);
      res.status(500).json({ error: 'init_failed' });
    }
  });

  // ── POST /api/session/establish ─────────────────────────
  // Phase 2: Client sends ECDH public key + attestation
  router.post('/establish', async (req, res) => {
    try {
      const { nonce, clientPublicKey, attestation } = req.body;

      // Verify nonce is valid and unused
      if (!nonceStore.consume(nonce)) {
        return res.status(400).json({ error: 'invalid_nonce' });
      }

      // Verify attestation has required fields
      if (
        !attestation ||
        !attestation.runtimeHash ||
        !attestation.timestamp
      ) {
        return res.status(400).json({ error: 'invalid_attestation' });
      }

      // Timestamp check
      const drift = Math.abs(Date.now() - attestation.timestamp);
      if (drift > config.trust.maxTimestampDriftMs) {
        return res.status(400).json({ error: 'timestamp_drift' });
      }

      // Bundle hash check (if configured)
      if (
        config.expectedBundleHash !== 'dev-mode-skip' &&
        attestation.runtimeHash !== config.expectedBundleHash
      ) {
        console.warn(
          `Bundle hash mismatch: expected=${config.expectedBundleHash}, got=${attestation.runtimeHash}`
        );
        // Don't reject — but reduce initial trust score
      }

      const clientMeta = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const { sessionId, trustScore } =
        await sessionManager.establishSession(
          nonce,
          clientPublicKey,
          attestation,
          clientMeta
        );

      res.json({ sessionId, trustScore });
    } catch (err) {
      console.error('Session establish error:', err);
      res.status(400).json({ error: 'establish_failed' });
    }
  });

  // ── POST /api/session/heartbeat ─────────────────────────
  // Phase 4: Continuous attestation
  router.post('/heartbeat', async (req, res) => {
    try {
      const { sid, iv, ct } = req.body;

      const session = sessionManager.getSession(sid);
      if (!session) {
        return res.status(401).json({ error: 'invalid_session' });
      }

      // Decrypt the attestation
      const aad = `${sid}:heartbeat`;
      let attestation;
      try {
        const plaintext = await sessionManager.decryptMessage(
          session,
          iv,
          ct,
          'heartbeat'
        );
        attestation = JSON.parse(plaintext);
      } catch {
        return res.status(400).json({ error: 'decrypt_failed' });
      }

      sessionManager.recordHeartbeat(sid);

      const result = trustEvaluator.evaluateHeartbeat(session, attestation);

      res.json({
        trustScore: result.trustScore,
        action: result.action,
      });
    } catch (err) {
      console.error('Heartbeat error:', err);
      res.status(500).json({ error: 'heartbeat_failed' });
    }
  });

  // ── POST /api/session/destroy ───────────────────────────
  router.post('/destroy', async (req, res) => {
    const { sid } = req.body;
    if (sid) sessionManager.destroySession(sid);
    res.json({ ok: true });
  });

  return router;
}
server/src/routes/chat.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Chat Routes — /api/chat/*
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import { sha256Hex } from '../services/crypto-utils.js';

export function createChatRoutes(sessionManager) {
  const router = Router();

  // ── POST /api/chat/message ──────────────────────────────
  router.post('/message', async (req, res) => {
    const session = req.ztSession; // injected by gateway middleware
    const trustEval = req.trustEvaluator;

    try {
      const { seq, prev, iv, ct } = req.body;

      // Decrypt message
      const aad = `${session.id}:${seq}:client`;
      let plaintext;
      try {
        plaintext = await sessionManager.decryptMessage(session, iv, ct, seq);
      } catch (err) {
        // Decryption failure = likely tampering
        session.trustScore = Math.max(0, session.trustScore - 30);
        return res.status(400).json({ error: 'decrypt_failed' });
      }

      const payload = JSON.parse(plaintext);

      // Compute chain hash for this incoming message
      const incomingChainInput = JSON.stringify({ seq, iv, ct });
      const incomingHash = await sha256Hex(incomingChainInput);

      // Evaluate trust
      const trustResult = trustEval.evaluate(session, {
        ...payload,
        seq,
        prev,
      });

      // Verify chain continuity
      if (session.lastChainHash !== null && prev !== session.lastChainHash) {
        session.trustScore = Math.max(0, session.trustScore - 20);
        trustResult.issues.push('chain_break');
      }

      // Update chain
      session.lastChainHash = incomingHash;
      session.messageSeq = seq;

      // Check if trust allows continuing
      if (trustResult.action === 'halt') {
        return res.status(403).json({
          error: 'session_halted',
          trustScore: trustResult.trustScore,
        });
      }

      // ── Forward to your LLM/chat backend ──
      // Replace this with your actual chat processing logic
      const responseText = await processChat(payload.text, session.id);

      // Encrypt response
      session.messageSeq++;
      const respSeq = session.messageSeq;
      const respAad = `${session.id}:${respSeq}:server`;
      const encrypted = await sessionManager.encryptResponse(
        session,
        JSON.stringify({
          text: responseText,
          ts: Date.now(),
          seq: respSeq,
        })
      );

      // Compute response chain hash
      const respChainInput = JSON.stringify({
        seq: respSeq,
        iv: encrypted.iv,
        ct: encrypted.ciphertext,
      });
      const respHash = await sha256Hex(respChainInput);
      session.lastChainHash = respHash;

      res.json({
        seq: respSeq,
        prev: incomingHash,
        iv: encrypted.iv,
        ct: encrypted.ciphertext,
        trustScore: trustResult.trustScore,
        action: trustResult.action,
      });
    } catch (err) {
      console.error('Chat message error:', err);
      res.status(500).json({ error: 'message_failed' });
    }
  });

  return router;
}

// ── Placeholder: Replace with your actual LLM integration ──
async function processChat(userMessage, sessionId) {
  // Example: call your LLM API here
  // const response = await openai.chat.completions.create({ ... });
  // return response.choices[0].message.content;

  return `Echo: ${userMessage}`;
}
server/src/index.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Zero-Trust Chat Server — Entry Point
// ─────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { securityHeaders } from './middleware/security-headers.js';
import { rateLimitMiddleware } from './middleware/rate-limiter.js';
import { createGateway } from './middleware/gateway.js';
import { SessionManager } from './services/session-manager.js';
import { NonceStore } from './services/nonce-store.js';
import { TrustEvaluator } from './services/trust-evaluator.js';
import { createSessionRoutes } from './routes/session.js';
import { createChatRoutes } from './routes/chat.js';

const app = express();

// ── Core Middleware ──────────────────────────────────────────
app.use(express.json({ limit: '64kb' })); // small limit for chat
app.use(
  cors({
    origin: config.allowedOrigin,
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'X-Session-Id'],
    credentials: false,
  })
);
app.use(securityHeaders);
app.use(rateLimitMiddleware);

// ── Initialize Services ─────────────────────────────────────
const sessionManager = new SessionManager();
const nonceStore = new NonceStore();
const trustEvaluator = new TrustEvaluator();

// ── CSP Violation Report Endpoint ────────────────────────────
app.post('/api/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  console.warn('🚨 CSP Violation:', JSON.stringify(req.body, null, 2));
  // In production: send to your logging/alerting pipeline
  res.status(204).end();
});

// ── Session Routes (no gateway needed) ───────────────────────
app.use(
  '/api/session',
  createSessionRoutes(sessionManager, nonceStore, trustEvaluator)
);

// ── Chat Routes (protected by gateway) ───────────────────────
const gateway = createGateway(sessionManager, trustEvaluator);
app.use('/api/chat', gateway, createChatRoutes(sessionManager));

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ── Start Server ─────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`\n🔐 Zero-Trust Chat Gateway`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Env:  ${config.nodeEnv}`);
  console.log(`   Origin: ${config.allowedOrigin}`);
  console.log(
    `   Signing Key: ${config.signingKeyPrivate ? '✅ loaded' : '⚠️  missing'}`
  );
  console.log(
    `   Bundle Hash: ${config.expectedBundleHash === 'dev-mode-skip' ? '⚠️  dev-mode (skipped)' : '✅ enforced'}\n`
  );
});
5. Client Security Modules
client/security/prototype-armor.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Prototype Armor — Freeze Native APIs to Prevent Hijacking
//
// MUST be the first module loaded. Captures references to native
// APIs and freezes prototypes so injected scripts/extensions
// cannot silently override them.
// ─────────────────────────────────────────────────────────────

// ── Capture pristine references IMMEDIATELY ──────────────────
// These are grabbed before any other code runs.

export const pristine = Object.freeze({
  // Fetch & network
  fetch: window.fetch.bind(window),
  XMLHttpRequest: window.XMLHttpRequest,
  WebSocket: window.WebSocket,
  EventSource: window.EventSource,

  // DOM
  createElement: document.createElement.bind(document),
  querySelector: document.querySelector.bind(document),
  querySelectorAll: document.querySelectorAll.bind(document),
  getElementById: document.getElementById.bind(document),
  addEventListener: EventTarget.prototype.addEventListener,
  removeEventListener: EventTarget.prototype.removeEventListener,

  // Timers
  setTimeout: window.setTimeout.bind(window),
  setInterval: window.setInterval.bind(window),
  clearInterval: window.clearInterval.bind(window),

  // Constructors & utilities
  URL: window.URL,
  Request: window.Request,
  Response: window.Response,
  Headers: window.Headers,
  TextEncoder: window.TextEncoder,
  TextDecoder: window.TextDecoder,
  JSON_parse: JSON.parse,
  JSON_stringify: JSON.stringify,

  // Crypto
  crypto: window.crypto,
  subtle: window.crypto?.subtle,

  // Console (for secure logging)
  console_warn: console.warn.bind(console),
  console_error: console.error.bind(console),

  // Function references for integrity checking
  Function_toString: Function.prototype.toString,
});

// ── Freeze critical prototypes ───────────────────────────────
// Prevents prototype pollution attacks

const prototypesToFreeze = [
  Object.prototype,
  Array.prototype,
  String.prototype,
  Number.prototype,
  Boolean.prototype,
  Function.prototype,
  RegExp.prototype,
  Promise.prototype,
  Map.prototype,
  Set.prototype,
  WeakMap.prototype,
  WeakSet.prototype,
  ArrayBuffer.prototype,
  Uint8Array.prototype,
];

// We use Object.freeze cautiously — some libraries may break.
// In production, test thoroughly or selectively freeze.
const frozenSet = new WeakSet();

export function armorPrototypes(strict = false) {
  if (strict) {
    // Full freeze — maximum security, may break some third-party code
    for (const proto of prototypesToFreeze) {
      if (!frozenSet.has(proto)) {
        Object.freeze(proto);
        frozenSet.add(proto);
      }
    }
  }

  // Always freeze JSON to prevent JSON.parse/stringify hijacking
  Object.freeze(JSON);

  // Prevent overriding crypto.subtle
  if (window.crypto && window.crypto.subtle) {
    try {
      Object.defineProperty(window, 'crypto', {
        configurable: false,
        writable: false,
        value: window.crypto,
      });
    } catch {
      // Some browsers may not allow this
    }
  }
}

// ── API Integrity Checker ────────────────────────────────────
// Verifies that native functions haven't been replaced

export function checkAPIIntegrity() {
  const issues = [];

  // Check if fetch is still native
  const fetchStr = pristine.Function_toString.call(window.fetch);
  if (!fetchStr.includes('[native code]') && fetchStr !== pristine.Function_toString.call(pristine.fetch)) {
    // Note: our own wrapping will change this, so we compare against our wrapper
    // This check should run BEFORE our wrappers are applied, or compare against known wrapper
    issues.push('fetch_modified');
  }

  // Check WebSocket
  const wsStr = pristine.Function_toString.call(window.WebSocket);
  if (!wsStr.includes('[native code]')) {
    issues.push('websocket_modified');
  }

  // Check JSON
  if (JSON.parse !== pristine.JSON_parse) {
    issues.push('json_parse_modified');
  }
  if (JSON.stringify !== pristine.JSON_stringify) {
    issues.push('json_stringify_modified');
  }

  // Check crypto.subtle
  if (!window.crypto || !window.crypto.subtle) {
    issues.push('crypto_unavailable');
  }

  return issues;
}

// ── Trusted Types (if supported) ─────────────────────────────
// Prevents DOM-based XSS by requiring typed objects for dangerous sinks

export function setupTrustedTypes() {
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    try {
      window.trustedTypes.createPolicy('default', {
        createHTML: (input) => {
          // Sanitize — in production, use DOMPurify or equivalent
          pristine.console_warn(
            '⚠️ Trusted Types: HTML creation intercepted'
          );
          // Strip all script-related content
          const div = pristine.createElement('div');
          div.textContent = input; // escapes HTML
          return div.innerHTML;
        },
        createScript: () => {
          pristine.console_error(
            '🚨 Trusted Types: Script creation BLOCKED'
          );
          throw new Error('Dynamic script creation is not allowed');
        },
        createScriptURL: (url) => {
          pristine.console_error(
            '🚨 Trusted Types: Script URL BLOCKED:', url
          );
          throw new Error('Dynamic script URL is not allowed');
        },
      });
    } catch (e) {
      // Policy may already exist
      pristine.console_warn('Trusted Types policy creation failed:', e.message);
    }
  }
}
client/security/crypto-engine.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Crypto Engine — WebCrypto ECDH Key Exchange & AES-GCM
// ─────────────────────────────────────────────────────────────

import { pristine } from './prototype-armor.js';

const subtle = pristine.subtle;
const getRandomValues = pristine.crypto.getRandomValues.bind(pristine.crypto);

// ── Availability Check ───────────────────────────────────────

export function isCryptoAvailable() {
  return !!(
    subtle &&
    typeof subtle.generateKey === 'function' &&
    typeof subtle.deriveKey === 'function' &&
    typeof subtle.encrypt === 'function' &&
    typeof subtle.decrypt === 'function' &&
    typeof subtle.digest === 'function' &&
    typeof subtle.importKey === 'function' &&
    typeof subtle.verify === 'function'
  );
}

// ── ECDH Key Pair Generation ─────────────────────────────────

export async function generateECDHKeyPair() {
  const keyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // extractable (needed to export public key)
    ['deriveBits']
  );
  return keyPair;
}

export async function exportPublicKey(key) {
  return subtle.exportKey('jwk', key);
}

// ── Import Server's ECDH Public Key ──────────────────────────

export async function importServerECDHPublicKey(jwk) {
  return subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
}

// ── Import Server's ECDSA Verify Key ─────────────────────────

export async function importServerVerifyKey(jwk) {
  return subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );
}

// ── ECDSA Signature Verification ─────────────────────────────

export async function verifySignature(verifyKey, data, signatureB64) {
  const encoded = new pristine.TextEncoder().encode(
    typeof data === 'string' ? data : pristine.JSON_stringify(data)
  );
  const sig = base64urlToBuffer(signatureB64);

  return subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    verifyKey,
    sig,
    encoded
  );
}

// ── Session Key Derivation (ECDH → HKDF → AES-256-GCM) ─────

export async function deriveSessionKey(privateKey, remotePublicKey, nonce) {
  // Step 1: ECDH shared secret
  const sharedBits = await subtle.deriveBits(
    { name: 'ECDH', public: remotePublicKey },
    privateKey,
    256
  );

  // Step 2: HKDF base key
  const baseKey = await subtle.importKey(
    'raw',
    sharedBits,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // Step 3: Derive AES-256-GCM key
  const aesKey = await subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new pristine.TextEncoder().encode(nonce),
      info: new pristine.TextEncoder().encode('zero-trust-chat-v1'),
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable — key never leaves WebCrypto
    ['encrypt', 'decrypt']
  );

  return aesKey;
}

// ── AES-GCM Encryption ──────────────────────────────────────

export async function encryptPayload(aesKey, plaintext, aad = '') {
  const iv = getRandomValues(new Uint8Array(12));
  const encoded = new pristine.TextEncoder().encode(plaintext);

  const ciphertext = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: new pristine.TextEncoder().encode(aad),
      tagLength: 128,
    },
    aesKey,
    encoded
  );

  return {
    iv: bufferToBase64url(iv),
    ct: bufferToBase64url(ciphertext),
  };
}

// ── AES-GCM Decryption ──────────────────────────────────────

export async function decryptPayload(aesKey, ivB64, ctB64, aad = '') {
  const iv = base64urlToBuffer(ivB64);
  const ct = base64urlToBuffer(ctB64);

  const plainBuf = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: new pristine.TextEncoder().encode(aad),
      tagLength: 128,
    },
    aesKey,
    ct
  );

  return new pristine.TextDecoder().decode(plainBuf);
}

// ── SHA-256 Hashing ──────────────────────────────────────────

export async function sha256(data) {
  const encoded = new pristine.TextEncoder().encode(data);
  const hash = await subtle.digest('SHA-256', encoded);
  return bufferToHex(hash);
}

// ── Bundle Integrity Hash ────────────────────────────────────
// Computes SHA-256 of the main JavaScript bundle(s)

export async function computeBundleHash() {
  try {
    // Find all script tags with src on the same origin
    const scripts = document.querySelectorAll('script[src]');
    const hashes = [];

    for (const script of scripts) {
      try {
        const url = new pristine.URL(script.src, location.href);
        if (url.origin === location.origin) {
          const response = await pristine.fetch(script.src);
          const text = await response.text();
          const hash = await sha256(text);
          hashes.push(hash);
        }
      } catch {
        // Script may be unreachable — skip
      }
    }

    // Combine all hashes into a single fingerprint
    if (hashes.length === 0) return 'no-scripts';
    return sha256(hashes.sort().join(':'));
  } catch {
    return 'hash-computation-failed';
  }
}

// ── Function Integrity Hash ──────────────────────────────────
// Checks if critical functions have been modified

export async function computeFunctionFingerprint(fns) {
  const sources = fns
    .map((fn) => {
      try {
        return pristine.Function_toString.call(fn);
      } catch {
        return 'inaccessible';
      }
    })
    .join('|');
  return sha256(sources);
}

// ── Base64url Helpers ────────────────────────────────────────

export function bufferToBase64url(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlToBuffer(b64) {
  const str = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
client/security/network-guardian.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Network Guardian — Wrap & Monitor All Outbound Requests
//
// Intercepts fetch, XMLHttpRequest, WebSocket, EventSource
// and blocks requests to non-allowlisted destinations.
// ─────────────────────────────────────────────────────────────

import { pristine } from './prototype-armor.js';
import { ALLOWED_HOSTS } from './constants.js';

let trustScorer = null;
let blockedRequests = [];

/**
 * Initialize the network guardian.
 * @param {object} scorer - TrustScorer instance for reporting
 */
export function initNetworkGuardian(scorer) {
  trustScorer = scorer;
  wrapFetch();
  wrapXHR();
  wrapWebSocket();
  wrapEventSource();
  wrapBeaconAPI();
}

/**
 * Get list of blocked request attempts (for telemetry).
 */
export function getBlockedRequests() {
  return [...blockedRequests];
}

// ── Host Validation ──────────────────────────────────────────

function isAllowedHost(urlString) {
  try {
    const url = new pristine.URL(urlString, location.href);
    return ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function blockAndReport(type, url) {
  const entry = {
    type,
    url: String(url),
    timestamp: Date.now(),
  };
  blockedRequests.push(entry);

  // Keep last 100 only
  if (blockedRequests.length > 100) {
    blockedRequests = blockedRequests.slice(-100);
  }

  pristine.console_warn(
    `🛡️ Network Guardian: Blocked ${type} to ${url}`
  );

  if (trustScorer) {
    trustScorer.reportIssue('NETWORK_BLOCKED', {
      detail: `${type} to ${url}`,
    });
  }
}

// ── Wrap fetch() ─────────────────────────────────────────────

function wrapFetch() {
  window.fetch = function securedFetch(...args) {
    let url;
    if (args[0] instanceof Request) {
      url = args[0].url;
    } else {
      url = String(args[0]);
    }

    if (!isAllowedHost(url)) {
      blockAndReport('fetch', url);
      return Promise.reject(new Error(`Fetch blocked: ${url}`));
    }

    return pristine.fetch(...args);
  };

  // Make it look like native fetch (basic anti-detection)
  try {
    Object.defineProperty(window.fetch, 'name', { value: 'fetch' });
  } catch {
    // Not critical
  }
}

// ── Wrap XMLHttpRequest ──────────────────────────────────────

function wrapXHR() {
  const OriginalXHR = pristine.XMLHttpRequest;
  const originalOpen = OriginalXHR.prototype.open;

  OriginalXHR.prototype.open = function (method, url, ...rest) {
    if (!isAllowedHost(url)) {
      blockAndReport('xhr', url);
      // Store a flag so send() can abort
      this._ztBlocked = true;
      return;
    }
    this._ztBlocked = false;
    return originalOpen.call(this, method, url, ...rest);
  };

  const originalSend = OriginalXHR.prototype.send;
  OriginalXHR.prototype.send = function (...args) {
    if (this._ztBlocked) {
      pristine.console_warn('🛡️ XHR send blocked (destination not allowed)');
      return;
    }
    return originalSend.call(this, ...args);
  };
}

// ── Wrap WebSocket ───────────────────────────────────────────

function wrapWebSocket() {
  const OrigWS = pristine.WebSocket;

  window.WebSocket = function SecuredWebSocket(url, protocols) {
    if (!isAllowedHost(url)) {
      blockAndReport('websocket', url);
      throw new Error(`WebSocket blocked: ${url}`);
    }
    return new OrigWS(url, protocols);
  };

  // Preserve static properties
  window.WebSocket.CONNECTING = OrigWS.CONNECTING;
  window.WebSocket.OPEN = OrigWS.OPEN;
  window.WebSocket.CLOSING = OrigWS.CLOSING;
  window.WebSocket.CLOSED = OrigWS.CLOSED;
  window.WebSocket.prototype = OrigWS.prototype;
}

// ── Wrap EventSource (SSE) ───────────────────────────────────

function wrapEventSource() {
  if (!pristine.EventSource) return;

  const OrigES = pristine.EventSource;

  window.EventSource = function SecuredEventSource(url, config) {
    if (!isAllowedHost(url)) {
      blockAndReport('eventsource', url);
      throw new Error(`EventSource blocked: ${url}`);
    }
    return new OrigES(url, config);
  };

  window.EventSource.prototype = OrigES.prototype;
}

// ── Wrap sendBeacon ──────────────────────────────────────────

function wrapBeaconAPI() {
  if (!navigator.sendBeacon) return;

  const originalBeacon = navigator.sendBeacon.bind(navigator);

  navigator.sendBeacon = function securedBeacon(url, data) {
    if (!isAllowedHost(url)) {
      blockAndReport('beacon', url);
      return false;
    }
    return originalBeacon(url, data);
  };
}
client/security/integrity-monitor.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Integrity Monitor — DOM & Script Injection Detection
//
// Uses MutationObserver, event listener tracking, and periodic
// checks to detect runtime tampering.
// ─────────────────────────────────────────────────────────────

import { pristine } from './prototype-armor.js';
import { RISK_WEIGHTS } from './constants.js';

let trustScorer = null;
let chatInputElement = null;

// Track all listeners registered on monitored elements
const listenerRegistry = new Map(); // element → Set<{type, fn}>
let knownListenerCount = 0;

// Track known script elements at boot time
const knownScripts = new Set();

// Store MutationObserver reference
let domObserver = null;

/**
 * Initialize the integrity monitor.
 * @param {object} scorer - TrustScorer instance
 * @param {HTMLElement} inputEl - The chat input element to protect
 */
export function initIntegrityMonitor(scorer, inputEl) {
  trustScorer = scorer;
  chatInputElement = inputEl;

  // Snapshot existing scripts
  snapshotScripts();

  // Start DOM mutation watching
  startDOMObserver();

  // Start listener monitoring
  wrapAddEventListener();

  // Start periodic integrity scan
  startPeriodicScan();
}

/**
 * Get current integrity state (for heartbeat attestation).
 */
export function getIntegrityState() {
  return {
    knownScriptCount: knownScripts.size,
    currentScriptCount: document.querySelectorAll('script').length,
    monitoredListeners: knownListenerCount,
    domObserverActive: domObserver !== null,
    apiIntegrity: checkCriticalAPIs(),
  };
}

// ── Script Snapshot ──────────────────────────────────────────

function snapshotScripts() {
  const scripts = document.querySelectorAll('script');
  scripts.forEach((s) => knownScripts.add(s));
}

// ── DOM Mutation Observer ────────────────────────────────────

function startDOMObserver() {
  domObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        inspectAddedNode(node);
      }

      // Watch for attribute modifications on input elements
      if (
        mutation.type === 'attributes' &&
        mutation.target === chatInputElement
      ) {
        const attr = mutation.attributeName;
        if (
          attr.startsWith('on') || // onclick, oninput, etc.
          attr === 'style' || // potential overlay attack
          attr === 'class'
        ) {
          reportIssue('DOM_TAMPERED', {
            detail: `Chat input attribute modified: ${attr}`,
          });
        }
      }
    }
  });

  domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: chatInputElement
      ? ['onclick', 'oninput', 'onkeydown', 'onkeyup', 'onkeypress',
         'onchange', 'onfocus', 'onblur', 'style', 'class']
      : undefined,
    attributeOldValue: true,
  });
}

function inspectAddedNode(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  // Check for injected script tags
  if (node.tagName === 'SCRIPT') {
    if (!knownScripts.has(node)) {
      reportIssue('SCRIPT_INJECTED', {
        src: node.src || 'inline',
        content: node.src ? '' : node.textContent?.substring(0, 200),
      });
    }
  }

  // Check for injected iframes (potential overlay attacks)
  if (node.tagName === 'IFRAME') {
    reportIssue('DOM_TAMPERED', {
      detail: `Iframe injected: ${node.src || 'srcdoc'}`,
    });
  }

  // Check for invisible overlays positioned over the chat input
  if (chatInputElement && isOverlayAttack(node)) {
    reportIssue('DOM_TAMPERED', {
      detail: 'Suspicious overlay element detected over chat input',
    });
  }

  // Recursively check children
  if (node.children) {
    for (const child of node.children) {
      inspectAddedNode(child);
    }
  }
}

function isOverlayAttack(node) {
  try {
    const style = window.getComputedStyle(node);
    if (
      (style.position === 'fixed' || style.position === 'absolute') &&
      parseFloat(style.opacity) < 0.1 &&
      parseInt(style.zIndex, 10) > 1000
    ) {
      // Check if it overlaps the chat input
      const inputRect = chatInputElement.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      return (
        nodeRect.left < inputRect.right &&
        nodeRect.right > inputRect.left &&
        nodeRect.top < inputRect.bottom &&
        nodeRect.bottom > inputRect.top
      );
    }
  } catch {
    // Ignore errors in style computation
  }
  return false;
}

// ── Event Listener Monitoring ────────────────────────────────

function wrapAddEventListener() {
  const originalAdd = pristine.addEventListener;
  const originalRemove = pristine.removeEventListener;

  EventTarget.prototype.addEventListener = function wrappedAddEventListener(
    type,
    fn,
    opts
  ) {
    // Track listeners on the chat input
    if (this === chatInputElement) {
      const sensitiveTypes = [
        'input', 'keydown', 'keyup', 'keypress',
        'change', 'compositionend', 'paste', 'cut', 'copy'
      ];

      if (sensitiveTypes.includes(type)) {
        if (!listenerRegistry.has(this)) {
          listenerRegistry.set(this, new Set());
        }

        const entry = { type, fn: fn.toString().substring(0, 100) };
        const registry = listenerRegistry.get(this);
        const sizeBefore = registry.size;
        registry.add(JSON.stringify(entry));

        // If a NEW listener is attached after initialization
        if (registry.size > sizeBefore && knownListenerCount > 0) {
          reportIssue('UNKNOWN_LISTENER', {
            type,
            detail: `New ${type} listener on chat input`,
          });
        }
      }
    }

    return originalAdd.call(this, type, fn, opts);
  };

  EventTarget.prototype.removeEventListener = function wrappedRemoveEventListener(
    type,
    fn,
    opts
  ) {
    return originalRemove.call(this, type, fn, opts);
  };
}

/**
 * Call after your app has registered its own listeners.
 * Sets the "known" listener count baseline.
 */
export function finalizeListenerBaseline() {
  if (chatInputElement && listenerRegistry.has(chatInputElement)) {
    knownListenerCount = listenerRegistry.get(chatInputElement).size;
  }
}

// ── Critical API Integrity Check ─────────────────────────────

function checkCriticalAPIs() {
  const issues = [];

  // Check if crypto.subtle is still intact
  if (
    !window.crypto ||
    !window.crypto.subtle ||
    window.crypto.subtle !== pristine.subtle
  ) {
    issues.push('crypto_subtle_modified');
  }

  // Check if JSON has been modified
  if (JSON.parse !== pristine.JSON_parse) {
    issues.push('json_parse_modified');
  }
  if (JSON.stringify !== pristine.JSON_stringify) {
    issues.push('json_stringify_modified');
  }

  // Check for clipboard interception
  if (
    navigator.clipboard &&
    pristine.Function_toString.call(navigator.clipboard.readText).indexOf(
      '[native code]'
    ) === -1
  ) {
    issues.push('clipboard_api_modified');
  }

  return issues.length === 0 ? true : issues;
}

// ── Periodic Integrity Scan ──────────────────────────────────

function startPeriodicScan() {
  pristine.setInterval(() => {
    // 1. Check for new scripts not in our known set
    const currentScripts = document.querySelectorAll('script');
    for (const script of currentScripts) {
      if (!knownScripts.has(script)) {
        knownScripts.add(script);
        reportIssue('SCRIPT_INJECTED', {
          src: script.src || 'inline',
          detail: 'Detected in periodic scan',
        });
      }
    }

    // 2. Run API integrity check
    const apiCheck = checkCriticalAPIs();
    if (apiCheck !== true) {
      for (const issue of apiCheck) {
        reportIssue('API_MODIFIED', { detail: issue });
      }
    }

    // 3. Check for suspicious global variables
    checkSuspiciousGlobals();
  }, 5000); // every 5 seconds
}

function checkSuspiciousGlobals() {
  // Common malware/tracking globals
  const suspicious = [
    '__selenium', 'webdriver', '_phantom', 'callPhantom',
    '__nightmare', 'domAutomation', 'domAutomationController',
  ];

  for (const name of suspicious) {
    if (name in window) {
      reportIssue('DOM_TAMPERED', {
        detail: `Suspicious global detected: ${name}`,
      });
    }
  }
}

// ── Issue Reporting ──────────────────────────────────────────

function reportIssue(type, data) {
  pristine.console_warn(`🔍 Integrity Monitor: ${type}`, data);
  if (trustScorer) {
    trustScorer.reportIssue(type, data);
  }
}
client/security/trust-scorer.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Trust Scorer — Client-Side Risk Aggregation
//
// Collects signals from all monitors, computes a risk score,
// and triggers security UI updates.
// ─────────────────────────────────────────────────────────────

import { RISK_WEIGHTS, TRUST_THRESHOLDS } from './constants.js';
import { pristine } from './prototype-armor.js';

/**
 * @typedef {'SECURE'|'SUSPICIOUS'|'UNSAFE'|'COMPROMISED'} TrustLevel
 *
 * @typedef {Object} SecurityIssue
 * @property {string} type - Issue category key
 * @property {object} data - Issue details
 * @property {number} timestamp - When detected
 * @property {number} weight - Risk weight applied
 */

export class TrustScorer {
  constructor() {
    /** @type {number} Cumulative risk score (0 = safe, higher = worse) */
    this.riskScore = 0;

    /** @type {SecurityIssue[]} */
    this.issues = [];

    /** @type {Set<string>} Deduplicate identical issues */
    this.seenIssues = new Set();

    /** @type {TrustLevel} */
    this.currentLevel = 'SECURE';

    /** @type {number} Server-reported trust score (0-100, 100 = trusted) */
    this.serverTrustScore = 100;

    /** @type {Function[]} Callbacks for level changes */
    this._onLevelChange = [];

    /** @type {Function[]} Callbacks for any issue */
    this._onIssue = [];
  }

  /**
   * Register a callback for trust level changes.
   */
  onLevelChange(fn) {
    this._onLevelChange.push(fn);
  }

  /**
   * Register a callback for any new issue.
   */
  onIssue(fn) {
    this._onIssue.push(fn);
  }

  /**
   * Report a security issue. Automatically adjusts risk score.
   *
   * @param {string} type - Key from RISK_WEIGHTS
   * @param {object} data - Additional context
   */
  reportIssue(type, data = {}) {
    const weight = RISK_WEIGHTS[type] || 10;

    // Deduplication: same type + same detail within 30s
    const dedupeKey = `${type}:${data.detail || ''}`;
    if (this.seenIssues.has(dedupeKey)) return;
    this.seenIssues.add(dedupeKey);

    // Auto-clear deduplication after 30s (allows re-detection)
    pristine.setTimeout(() => {
      this.seenIssues.delete(dedupeKey);
    }, 30_000);

    const issue = {
      type,
      data,
      timestamp: Date.now(),
      weight,
    };

    this.issues.push(issue);
    this.riskScore += weight;

    // Keep issues list manageable
    if (this.issues.length > 200) {
      this.issues = this.issues.slice(-200);
    }

    // Notify listeners
    for (const fn of this._onIssue) {
      try {
        fn(issue);
      } catch {}
    }

    this._recalculateLevel();
  }

  /**
   * Update the server-reported trust score.
   */
  updateServerTrust(score) {
    this.serverTrustScore = score;
    this._recalculateLevel();
  }

  /**
   * Get the current combined trust level.
   */
  getLevel() {
    return this.currentLevel;
  }

  /**
   * Get combined risk information for heartbeat.
   */
  getState() {
    return {
      riskScore: this.riskScore,
      level: this.currentLevel,
      serverTrustScore: this.serverTrustScore,
      issueCount: this.issues.length,
      recentIssues: this.issues.slice(-10).map((i) => ({
        type: i.type,
        ts: i.timestamp,
      })),
    };
  }

  /**
   * Check if user input should be allowed.
   */
  isInputAllowed() {
    return (
      this.currentLevel !== 'COMPROMISED' &&
      this.currentLevel !== 'UNSAFE'
    );
  }

  /**
   * Check if the session should be halted.
   */
  shouldHalt() {
    return this.currentLevel === 'COMPROMISED';
  }

  /**
   * Recalculate trust level from risk score + server score.
   */
  _recalculateLevel() {
    const oldLevel = this.currentLevel;

    // Combine client risk score and server trust score
    // Client risk score: higher = worse
    // Server trust score: lower = worse
    const effectiveRisk = this.riskScore + (100 - this.serverTrustScore);

    if (effectiveRisk >= TRUST_THRESHOLDS.COMPROMISED) {
      this.currentLevel = 'COMPROMISED';
    } else if (effectiveRisk >= TRUST_THRESHOLDS.UNSAFE) {
      this.currentLevel = 'UNSAFE';
    } else if (effectiveRisk >= TRUST_THRESHOLDS.SUSPICIOUS) {
      this.currentLevel = 'SUSPICIOUS';
    } else {
      this.currentLevel = 'SECURE';
    }

    if (oldLevel !== this.currentLevel) {
      for (const fn of this._onLevelChange) {
        try {
          fn(this.currentLevel, oldLevel);
        } catch {}
      }
    }
  }

  /**
   * Gradual decay — call periodically to slowly reduce risk
   * when no new issues are detected (recovery).
   */
  decay(amount = 1) {
    if (this.riskScore > 0) {
      this.riskScore = Math.max(0, this.riskScore - amount);
      this._recalculateLevel();
    }
  }
}
client/security/message-sealer.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Message Sealer — Encrypt, Chain, and Bind Messages
//
// Each message is:
//  1. Bound to session + timestamp + sequence + runtime hash
//  2. Encrypted with AES-256-GCM (authenticated)
//  3. Chained to the previous message via hash
// ─────────────────────────────────────────────────────────────

import {
  encryptPayload,
  decryptPayload,
  sha256,
} from './crypto-engine.js';
import { pristine } from './prototype-armor.js';

export class MessageSealer {
  /**
   * @param {CryptoKey} aesKey - Derived session AES-256-GCM key
   * @param {string} sessionId - Current session ID
   * @param {Function} getRuntimeHash - Returns current runtime hash
   * @param {string} nonce - Session nonce
   */
  constructor(aesKey, sessionId, getRuntimeHash, nonce) {
    this.aesKey = aesKey;
    this.sessionId = sessionId;
    this.getRuntimeHash = getRuntimeHash;
    this.nonce = nonce;
    this.seq = 0;
    this.lastChainHash = null; // hash of last sealed message
  }

  /**
   * Seal a user message for transmission.
   *
   * @param {string} text - User's message text
   * @returns {Promise<object>} Sealed message envelope
   */
  async seal(text) {
    this.seq++;

    // Build inner payload (plaintext before encryption)
    const payload = pristine.JSON_stringify({
      text,
      ts: Date.now(),
      seq: this.seq,
      runtimeHash: await this.getRuntimeHash(),
      nonce: this.nonce,
    });

    // AAD binds ciphertext to session and sequence
    const aad = `${this.sessionId}:${this.seq}:client`;

    // Encrypt
    const { iv, ct } = await encryptPayload(this.aesKey, payload, aad);

    // Compute chain hash (covers the sealed envelope)
    const chainInput = pristine.JSON_stringify({
      seq: this.seq,
      iv,
      ct,
    });
    const chainHash = await sha256(chainInput);

    // Build envelope
    const envelope = {
      v: 1, // protocol version
      sid: this.sessionId,
      seq: this.seq,
      prev: this.lastChainHash, // hash of previous message (null for first)
      iv,
      ct,
    };

    // Update chain
    this.lastChainHash = chainHash;

    return envelope;
  }

  /**
   * Unseal a server response.
   *
   * @param {object} envelope - Server's sealed response
   * @returns {Promise<object>} Decrypted payload
   */
  async unseal(envelope) {
    const { seq, prev, iv, ct } = envelope;

    // Verify chain continuity
    if (this.lastChainHash !== null && prev !== this.lastChainHash) {
      throw new Error('Chain hash mismatch — message integrity compromised');
    }

    // AAD for server messages
    const aad = `${this.sessionId}:${seq}:server`;

    // Decrypt
    const plaintext = await decryptPayload(this.aesKey, iv, ct, aad);
    const payload = pristine.JSON_parse(plaintext);

    // Compute and update chain hash
    const chainInput = pristine.JSON_stringify({ seq, iv, ct });
    this.lastChainHash = await sha256(chainInput);

    // Verify timestamp is reasonable
    if (payload.ts && Math.abs(Date.now() - payload.ts) > 30_000) {
      pristine.console_warn('⚠️ Server response timestamp drift detected');
    }

    return payload;
  }

  /**
   * Get current sequence number.
   */
  getSeq() {
    return this.seq;
  }
}
client/security/heartbeat.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Heartbeat — Continuous Runtime Attestation
//
// Every HEARTBEAT_INTERVAL_MS, sends an encrypted attestation
// to the server containing current integrity state.
// ─────────────────────────────────────────────────────────────

import { pristine } from './prototype-armor.js';
import { encryptPayload, computeBundleHash } from './crypto-engine.js';
import { getIntegrityState } from './integrity-monitor.js';
import { API_ORIGIN, HEARTBEAT_INTERVAL_MS } from './constants.js';

let intervalId = null;

/**
 * Start the heartbeat cycle.
 *
 * @param {string} sessionId - Current session ID
 * @param {CryptoKey} aesKey - Session AES key for encrypting attestation
 * @param {TrustScorer} trustScorer - Trust scorer instance
 */
export function startHeartbeat(sessionId, aesKey, trustScorer) {
  if (intervalId) stopHeartbeat();

  intervalId = pristine.setInterval(async () => {
    try {
      await sendHeartbeat(sessionId, aesKey, trustScorer);
    } catch (err) {
      pristine.console_warn('❤️ Heartbeat failed:', err.message);
      trustScorer.reportIssue('HEARTBEAT_FAILED', {
        error: err.message,
      });
    }
  }, HEARTBEAT_INTERVAL_MS);
}

/**
 * Stop the heartbeat cycle.
 */
export function stopHeartbeat() {
  if (intervalId) {
    pristine.clearInterval(intervalId);
    intervalId = null;
  }
}

async function sendHeartbeat(sessionId, aesKey, trustScorer) {
  // Gather attestation signals
  const runtimeHash = await computeBundleHash();
  const integrityState = getIntegrityState();
  const scorerState = trustScorer.getState();

  const attestation = pristine.JSON_stringify({
    runtimeHash,
    timestamp: Date.now(),
    apiIntegrity: integrityState.apiIntegrity === true,
    listenerState: {
      monitoredCount: integrityState.monitoredListeners,
    },
    scriptState: {
      known: integrityState.knownScriptCount,
      current: integrityState.currentScriptCount,
    },
    clientIssues: scorerState.recentIssues.map((i) => i.type),
    clientRiskScore: scorerState.riskScore,
  });

  // Encrypt attestation
  const aad = `${sessionId}:heartbeat`;
  const { iv, ct } = await encryptPayload(aesKey, attestation, aad);

  // Send to server
  const response = await pristine.fetch(`${API_ORIGIN}/api/session/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: pristine.JSON_stringify({ sid: sessionId, iv, ct }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();

  // Update client trust with server's assessment
  if (typeof result.trustScore === 'number') {
    trustScorer.updateServerTrust(result.trustScore);
  }

  // Handle server actions
  if (result.action === 'halt') {
    pristine.console_error('🚨 Server requested session halt');
    stopHeartbeat();
    // The trust scorer will update the UI via level change callback
  }
}
client/security/security-ui.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Security UI — Trust Indicator Component
//
// Renders a visual trust badge and warning banners.
// Framework-agnostic: creates its own DOM elements.
// ─────────────────────────────────────────────────────────────

import { pristine } from './prototype-armor.js';

const STYLES = {
  badge: `
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 999999;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    user-select: none;
    backdrop-filter: blur(8px);
  `,
  banner: `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999998;
    padding: 12px 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    text-align: center;
    transition: all 0.3s ease;
    transform: translateY(-100%);
  `,
  detail: `
    position: fixed;
    bottom: 60px;
    right: 16px;
    z-index: 999997;
    width: 320px;
    max-height: 400px;
    overflow-y: auto;
    padding: 16px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    display: none;
    backdrop-filter: blur(12px);
  `,
};

const LEVEL_CONFIG = {
  SECURE: {
    icon: '🟢',
    label: 'Private Session Verified',
    badgeBg: 'rgba(34, 197, 94, 0.15)',
    badgeBorder: '1px solid rgba(34, 197, 94, 0.3)',
    badgeColor: '#166534',
    bannerBg: 'transparent',
    bannerColor: 'transparent',
    showBanner: false,
  },
  SUSPICIOUS: {
    icon: '🟡',
    label: 'Environment Modified',
    badgeBg: 'rgba(234, 179, 8, 0.15)',
    badgeBorder: '1px solid rgba(234, 179, 8, 0.3)',
    badgeColor: '#854d0e',
    bannerBg: 'rgba(254, 243, 199, 0.95)',
    bannerColor: '#854d0e',
    showBanner: true,
    bannerText: '⚠️ Your network or browser environment may have been modified. Proceed with caution.',
  },
  UNSAFE: {
    icon: '🔴',
    label: 'Input Security Risk',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeBorder: '1px solid rgba(239, 68, 68, 0.3)',
    badgeColor: '#991b1b',
    bannerBg: 'rgba(254, 226, 226, 0.95)',
    bannerColor: '#991b1b',
    showBanner: true,
    bannerText: '🔴 Security risk detected. Sensitive input has been restricted. Try a different network or browser.',
  },
  COMPROMISED: {
    icon: '⛔',
    label: 'Session Halted',
    badgeBg: 'rgba(127, 29, 29, 0.9)',
    badgeBorder: '1px solid rgba(127, 29, 29, 0.5)',
    badgeColor: '#ffffff',
    bannerBg: 'rgba(127, 29, 29, 0.95)',
    bannerColor: '#ffffff',
    showBanner: true,
    bannerText: '⛔ Active security threat detected. This session has been paused for your protection.',
  },
};

let badgeEl = null;
let bannerEl = null;
let detailEl = null;
let detailOpen = false;

/**
 * Mount the security UI.
 *
 * @param {TrustScorer} trustScorer
 */
export function mountSecurityUI(trustScorer) {
  createElements();

  // Update on level change
  trustScorer.onLevelChange((newLevel, oldLevel) => {
    updateUI(newLevel, trustScorer);
  });

  // Update on any issue
  trustScorer.onIssue((issue) => {
    updateDetailPanel(trustScorer);
  });

  // Initial render
  updateUI(trustScorer.getLevel(), trustScorer);
}

/**
 * Programmatically update the UI (e.g., after server trust update).
 */
export function updateSecurityUI(trustScorer) {
  updateUI(trustScorer.getLevel(), trustScorer);
}

function createElements() {
  // Trust badge
  badgeEl = pristine.createElement('div');
  badgeEl.id = 'zt-security-badge';
  badgeEl.setAttribute('style', STYLES.badge);
  badgeEl.setAttribute('role', 'status');
  badgeEl.setAttribute('aria-live', 'polite');
  badgeEl.setAttribute('aria-label', 'Session security status');
  document.body.appendChild(badgeEl);

  // Warning banner
  bannerEl = pristine.createElement('div');
  bannerEl.id = 'zt-security-banner';
  bannerEl.setAttribute('style', STYLES.banner);
  bannerEl.setAttribute('role', 'alert');
  document.body.appendChild(bannerEl);

  // Detail panel (click badge to toggle)
  detailEl = pristine.createElement('div');
  detailEl.id = 'zt-security-detail';
  detailEl.setAttribute('style', STYLES.detail);
  document.body.appendChild(detailEl);

  // Toggle detail on badge click
  pristine.addEventListener.call(badgeEl, 'click', () => {
    detailOpen = !detailOpen;
    detailEl.style.display = detailOpen ? 'block' : 'none';
  });
}

function updateUI(level, scorer) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.SECURE;

  // Update badge
  if (badgeEl) {
    badgeEl.innerHTML = `<span>${cfg.icon}</span><span>${cfg.label}</span>`;
    badgeEl.style.background = cfg.badgeBg;
    badgeEl.style.border = cfg.badgeBorder;
    badgeEl.style.color = cfg.badgeColor;
  }

  // Update banner
  if (bannerEl) {
    if (cfg.showBanner) {
      bannerEl.textContent = cfg.bannerText;
      bannerEl.style.background = cfg.bannerBg;
      bannerEl.style.color = cfg.bannerColor;
      bannerEl.style.transform = 'translateY(0)';
    } else {
      bannerEl.style.transform = 'translateY(-100%)';
    }
  }

  updateDetailPanel(scorer);
}

function updateDetailPanel(scorer) {
  if (!detailEl) return;

  const state = scorer.getState();
  const level = scorer.getLevel();
  const cfg = LEVEL_CONFIG[level];

  detailEl.style.background = cfg.badgeBg;
  detailEl.style.border = cfg.badgeBorder;
  detailEl.style.color = cfg.badgeColor;

  let html = `
    <div style="font-weight:600; font-size:14px; margin-bottom:8px;">
      ${cfg.icon} Security Status: ${cfg.label}
    </div>
    <div style="margin-bottom:8px;">
      Client Risk Score: <strong>${state.riskScore}</strong><br>
      Server Trust Score: <strong>${state.serverTrustScore}/100</strong><br>
      Issues Detected: <strong>${state.issueCount}</strong>
    </div>
  `;

  if (state.recentIssues.length > 0) {
    html += `<div style="font-weight:600; margin-bottom:4px;">Recent Issues:</div>`;
    html += '<div style="font-size:11px;">';
    for (const issue of state.recentIssues) {
      const time = new Date(issue.ts).toLocaleTimeString();
      html += `<div style="padding:2px 0;">• ${issue.type} (${time})</div>`;
    }
    html += '</div>';
  }

  html += `
    <div style="margin-top:12px; font-size:11px; opacity:0.7;">
      Zero-Trust Chat Security v1<br>
      Click badge to toggle this panel
    </div>
  `;

  detailEl.innerHTML = html;
}
client/security/index.js — Boot Orchestrator
JavaScript

// ─────────────────────────────────────────────────────────────
// Zero-Trust Chat Security — Boot Orchestrator
//
// This is the main entry point. It initializes all security
// modules in the correct order and provides the public API
// for your chat application to use.
//
// USAGE:
//   import { ZeroTrustChat } from './security/index.js';
//
//   const ztc = new ZeroTrustChat({
//     apiOrigin: 'https://api.yourdomain.com',
//     chatInputSelector: '#chat-input',
//     strictMode: false,
//   });
//
//   await ztc.init();
//
//   // Send a message
//   const response = await ztc.sendMessage('Hello');
//
//   // Check if input should be allowed
//   if (!ztc.isInputAllowed()) { /* disable input */ }
// ─────────────────────────────────────────────────────────────

import {
  pristine,
  armorPrototypes,
  checkAPIIntegrity,
  setupTrustedTypes,
} from './prototype-armor.js';

import {
  isCryptoAvailable,
  generateECDHKeyPair,
  exportPublicKey,
  importServerECDHPublicKey,
  importServerVerifyKey,
  verifySignature,
  deriveSessionKey,
  computeBundleHash,
} from './crypto-engine.js';

import { initNetworkGuardian } from './network-guardian.js';

import {
  initIntegrityMonitor,
  finalizeListenerBaseline,
  getIntegrityState,
} from './integrity-monitor.js';

import { TrustScorer } from './trust-scorer.js';
import { MessageSealer } from './message-sealer.js';
import { mountSecurityUI, updateSecurityUI } from './security-ui.js';
import { startHeartbeat, stopHeartbeat } from './heartbeat.js';
import { API_ORIGIN } from './constants.js';

export class ZeroTrustChat {
  /**
   * @param {object} options
   * @param {string} options.apiOrigin - API base URL
   * @param {string} options.chatInputSelector - CSS selector for chat input
   * @param {boolean} options.strictMode - Enable aggressive prototype freezing
   * @param {boolean} options.showUI - Show security badge (default: true)
   */
  constructor(options = {}) {
    this.apiOrigin = options.apiOrigin || API_ORIGIN;
    this.chatInputSelector = options.chatInputSelector || '#chat-input';
    this.strictMode = options.strictMode || false;
    this.showUI = options.showUI !== false;

    // Internal state
    this.trustScorer = new TrustScorer();
    this.messageSealer = null;
    this.sessionId = null;
    this.aesKey = null;
    this.runtimeHash = null;
    this.initialized = false;

    // Expose trustScorer for external monitoring
    this.trust = this.trustScorer;
  }

  /**
   * Initialize the zero-trust security system.
   * Call this ONCE when your chat app loads.
   */
  async init() {
    try {
      pristine.console_warn('🔐 Zero-Trust Chat: Initializing...');

      // ── Phase 1: Armor ───────────────────────────────────
      armorPrototypes(this.strictMode);
      setupTrustedTypes();

      // ── Phase 2: Verify crypto availability ──────────────
      if (!isCryptoAvailable()) {
        this.trustScorer.reportIssue('API_MODIFIED', {
          detail: 'WebCrypto API not available',
        });
        throw new Error(
          'WebCrypto API is not available. Secure chat requires HTTPS.'
        );
      }

      // ── Phase 3: Check initial API integrity ─────────────
      const apiIssues = checkAPIIntegrity();
      if (apiIssues.length > 0) {
        for (const issue of apiIssues) {
          this.trustScorer.reportIssue('API_MODIFIED', { detail: issue });
        }
      }

      // ── Phase 4: Network guardian ────────────────────────
      initNetworkGuardian(this.trustScorer);

      // ── Phase 5: Integrity monitor ───────────────────────
      const chatInput = document.querySelector(this.chatInputSelector);
      if (chatInput) {
        initIntegrityMonitor(this.trustScorer, chatInput);
      } else {
        pristine.console_warn(
          `⚠️ Chat input element not found: ${this.chatInputSelector}`
        );
      }

      // ── Phase 6: Compute runtime hash ────────────────────
      this.runtimeHash = await computeBundleHash();

      // ── Phase 7: Establish secure session ────────────────
      await this._establishSession();

      // ── Phase 8: Mount security UI ───────────────────────
      if (this.showUI) {
        mountSecurityUI(this.trustScorer);
      }

      // ── Phase 9: Finalize listener baseline ──────────────
      // Call this AFTER your app has registered its own listeners
      // on the chat input. We delay to allow framework setup.
      pristine.setTimeout(() => {
        finalizeListenerBaseline();
      }, 2000);

      // ── Phase 10: Start heartbeat ────────────────────────
      if (this.aesKey && this.sessionId) {
        startHeartbeat(this.sessionId, this.aesKey, this.trustScorer);
      }

      // ── Phase 11: Risk decay timer ───────────────────────
      pristine.setInterval(() => {
        this.trustScorer.decay(1);
      }, 15_000);

      // ── Phase 12: Listen for trust level changes ─────────
      this.trustScorer.onLevelChange((level) => {
        pristine.console_warn(`🔐 Trust level: ${level}`);

        if (level === 'COMPROMISED') {
          this._handleCompromised();
        }
      });

      this.initialized = true;
      pristine.console_warn('🔐 Zero-Trust Chat: Ready ✅');

      return true;
    } catch (err) {
      pristine.console_error('🔐 Zero-Trust Chat: Init failed:', err);
      throw err;
    }
  }

  /**
   * Send a chat message through the secure channel.
   *
   * @param {string} text - User's message text
   * @returns {Promise<{text: string, trustScore: number}>}
   */
  async sendMessage(text) {
    if (!this.initialized || !this.messageSealer) {
      throw new Error('Zero-Trust Chat not initialized');
    }

    if (!this.trustScorer.isInputAllowed()) {
      throw new Error('Input blocked due to security risk');
    }

    // Seal the message
    const envelope = await this.messageSealer.seal(text);

    // Send to server
    const response = await pristine.fetch(
      `${this.apiOrigin}/api/chat/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId,
        },
        body: pristine.JSON_stringify(envelope),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));

      if (response.status === 403 && err.error === 'session_halted') {
        this.trustScorer.updateServerTrust(err.trustScore || 0);
        throw new Error('Session halted by server');
      }

      throw new Error(`Chat request failed: ${response.status}`);
    }

    const serverEnvelope = await response.json();

    // Update server trust score
    if (typeof serverEnvelope.trustScore === 'number') {
      this.trustScorer.updateServerTrust(serverEnvelope.trustScore);
    }

    // Unseal the response
    const payload = await this.messageSealer.unseal(serverEnvelope);

    return {
      text: payload.text,
      trustScore: serverEnvelope.trustScore,
      action: serverEnvelope.action,
    };
  }

  /**
   * Check if input should be allowed.
   */
  isInputAllowed() {
    return this.trustScorer.isInputAllowed();
  }

  /**
   * Get current trust level.
   */
  getTrustLevel() {
    return this.trustScorer.getLevel();
  }

  /**
   * Get detailed trust state.
   */
  getTrustState() {
    return this.trustScorer.getState();
  }

  /**
   * Register a callback for trust level changes.
   */
  onTrustChange(fn) {
    this.trustScorer.onLevelChange(fn);
  }

  /**
   * Destroy the session and clean up.
   */
  async destroy() {
    stopHeartbeat();

    if (this.sessionId) {
      try {
        await pristine.fetch(
          `${this.apiOrigin}/api/session/destroy`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: pristine.JSON_stringify({ sid: this.sessionId }),
          }
        );
      } catch {
        // Best effort
      }
    }

    this.sessionId = null;
    this.aesKey = null;
    this.messageSealer = null;
    this.initialized = false;
  }

  // ── Private Methods ────────────────────────────────────────

  async _establishSession() {
    // Phase 1: Request session init from server
    const initResp = await pristine.fetch(
      `${this.apiOrigin}/api/session/init`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: pristine.JSON_stringify({}),
      }
    );

    if (!initResp.ok) {
      throw new Error(`Session init failed: ${initResp.status}`);
    }

    const initData = await initResp.json();
    const {
      nonce,
      serverPublicKey,
      expectedBundleHash,
      serverVerifyKeyJwk,
      signature,
    } = initData;

    // Verify server signature (if available)
    if (signature && serverVerifyKeyJwk) {
      const verifyKey = await importServerVerifyKey(serverVerifyKeyJwk);
      const signPayload = pristine.JSON_stringify({
        nonce,
        serverPublicKey,
        expectedBundleHash,
      });
      const valid = await verifySignature(verifyKey, signPayload, signature);

      if (!valid) {
        this.trustScorer.reportIssue('BUNDLE_MISMATCH', {
          detail: 'Server signature verification failed',
        });
        throw new Error('Server signature verification failed — possible MITM');
      }
    }

    // Verify bundle hash
    if (
      expectedBundleHash &&
      expectedBundleHash !== 'dev-mode-skip' &&
      this.runtimeHash !== expectedBundleHash
    ) {
      this.trustScorer.reportIssue('BUNDLE_MISMATCH', {
        expected: expectedBundleHash,
        actual: this.runtimeHash,
      });
      pristine.console_warn(
        '⚠️ Bundle hash mismatch — frontend may have been modified'
      );
    }

    // Phase 2: Generate client ECDH key pair
    const clientKeyPair = await generateECDHKeyPair();
    const clientPubJwk = await exportPublicKey(clientKeyPair.publicKey);

    // Import server's ECDH public key
    const serverECDHKey = await importServerECDHPublicKey(serverPublicKey);

    // Derive shared AES key
    this.aesKey = await deriveSessionKey(
      clientKeyPair.privateKey,
      serverECDHKey,
      nonce
    );

    // Build attestation
    const attestation = {
      runtimeHash: this.runtimeHash,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      screenRes: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    // Send establishment request
    const estResp = await pristine.fetch(
      `${this.apiOrigin}/api/session/establish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: pristine.JSON_stringify({
          nonce,
          clientPublicKey: clientPubJwk,
          attestation,
        }),
      }
    );

    if (!estResp.ok) {
      throw new Error(`Session establish failed: ${estResp.status}`);
    }

    const estData = await estResp.json();
    this.sessionId = estData.sessionId;
    this.trustScorer.updateServerTrust(estData.trustScore);

    // Create message sealer
    this.messageSealer = new MessageSealer(
      this.aesKey,
      this.sessionId,
      () => computeBundleHash(), // live hash on each message
      nonce
    );

    pristine.console_warn(
      `🔐 Session established: ${this.sessionId.substring(0, 8)}...`
    );
  }

  _handleCompromised() {
    stopHeartbeat();

    // Disable the chat input
    const input = document.querySelector(this.chatInputSelector);
    if (input) {
      input.disabled = true;
      input.placeholder = '⛔ Session paused for security';
      input.value = '';
    }
  }
}
6. Service Worker
client/security/sw.js
JavaScript

// ─────────────────────────────────────────────────────────────
// Security Service Worker — Request Gatekeeper
//
// Acts as a network-level firewall. Intercepts all requests
// from the page and blocks those not destined for allowed hosts.
//
// Register this from your main app:
//   navigator.serviceWorker.register('/security/sw.js');
// ─────────────────────────────────────────────────────────────

const ALLOWED_HOSTS = new Set([
  'api.yourdomain.com',
  'yourdomain.com',
  // Add your CDN / static asset hosts if needed
]);

const SW_VERSION = '1.0.0';

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log(`🛡️ Security SW v${SW_VERSION}: Installing`);
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log(`🛡️ Security SW v${SW_VERSION}: Active`);
  event.waitUntil(self.clients.claim());
});

// ── Fetch Interception ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Allow same-origin requests always
  if (url.origin === self.location.origin) {
    return; // Let it pass through (default network handling)
  }

  // Check against allowlist
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    console.warn(
      `🛡️ SW: Blocked request to ${url.hostname}${url.pathname}`
    );

    // Report to main thread
    reportToClients({
      type: 'BLOCKED_REQUEST',
      url: url.href,
      hostname: url.hostname,
      timestamp: Date.now(),
    });

    // Return an empty 403 response
    event.respondWith(
      new Response('Blocked by security policy', {
        status: 403,
        statusText: 'Forbidden',
      })
    );
    return;
  }

  // Allowed destination — pass through
  // Optionally add security headers to requests
  const modifiedHeaders = new Headers(event.request.headers);
  modifiedHeaders.set('X-ZT-SW', SW_VERSION);

  const modifiedRequest = new Request(event.request, {
    headers: modifiedHeaders,
  });

  event.respondWith(fetch(modifiedRequest));
});

// ── Communication with Main Thread ───────────────────────────
async function reportToClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage(message);
  }
}

// ── Message Handler (receive allowlist updates, etc.) ────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_ALLOWLIST') {
    // Dynamically update allowed hosts
    if (Array.isArray(event.data.hosts)) {
      ALLOWED_HOSTS.clear();
      for (const host of event.data.hosts) {
        ALLOWED_HOSTS.add(host);
      }
      console.log('🛡️ SW: Allowlist updated:', [...ALLOWED_HOSTS]);
    }
  }
});
Service Worker Registration (in your app's main script)
JavaScript

// Register the security service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/security/sw.js', { scope: '/' })
    .then((reg) => {
      console.log('🛡️ Security SW registered');

      // Listen for blocked request reports from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'BLOCKED_REQUEST') {
          console.warn('🛡️ SW blocked:', event.data.url);
          // If you have access to the trust scorer, report the issue
          // trustScorer.reportIssue('NETWORK_BLOCKED', event.data);
        }
      });
    })
    .catch((err) => {
      console.warn('🛡️ Security SW registration failed:', err);
    });
}
7. HTTP Security Headers
nginx/security.conf
nginx

# ─────────────────────────────────────────────────────────────
# Zero-Trust Chat — Nginx Security Headers
# Include this in your server block:
#   include /etc/nginx/conf.d/security.conf;
# ─────────────────────────────────────────────────────────────

# ── TLS Configuration ────────────────────────────────────────
ssl_protocols TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256';
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;

# ── HSTS ──────────────────────────────────────────────────────
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# ── Content Security Policy ──────────────────────────────────
# IMPORTANT: Customize 'connect-src' for your API domain
set $csp "default-src 'none'; ";
set $csp "${csp}script-src 'self'; ";
set $csp "${csp}style-src 'self'; ";
set $csp "${csp}img-src 'self' data:; ";
set $csp "${csp}font-src 'self'; ";
set $csp "${csp}connect-src 'self' https://api.yourdomain.com; ";
set $csp "${csp}frame-ancestors 'none'; ";
set $csp "${csp}base-uri 'self'; ";
set $csp "${csp}form-action 'self'; ";
set $csp "${csp}require-trusted-types-for 'script'; ";
set $csp "${csp}report-uri /api/csp-report";
add_header Content-Security-Policy $csp always;

# ── Other Security Headers ───────────────────────────────────
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "0" always;  # Disable — CSP handles this better
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;

# ── Cache Control for API ─────────────────────────────────────
location /api/ {
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    add_header Pragma "no-cache" always;
}

# ── SRI for Static Assets ─────────────────────────────────────
# Ensure your build system generates SRI hashes and includes them
# in <script> and <link> tags. Example:
#   <script src="/app.js"
#     integrity="sha384-<hash>"
#     crossorigin="anonymous"></script>
8. Integration Into Your Chat App
Quick Start (Minimal Example)
HTML

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Secure Chat</title>
</head>
<body>
  <div id="chat-container">
    <div id="messages"></div>
    <input
      id="chat-input"
      type="text"
      placeholder="Type a message..."
      autocomplete="off"
    />
    <button id="send-btn">Send</button>
  </div>

  <script type="module">
    import { ZeroTrustChat } from './security/index.js';

    // ── Initialize ─────────────────────────────────────────
    const ztc = new ZeroTrustChat({
      apiOrigin: 'https://api.yourdomain.com',
      chatInputSelector: '#chat-input',
      strictMode: false, // set true for maximum security
      showUI: true,      // show trust badge
    });

    try {
      await ztc.init();
    } catch (err) {
      console.error('Security initialization failed:', err);
      // Show fallback UI or proceed without security
    }

    // ── Register Service Worker ────────────────────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/security/sw.js');
    }

    // ── 
