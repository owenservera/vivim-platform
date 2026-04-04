

# The Sovereign Vault & The Universal Stream

---

## What We Are Protecting

Let me be precise about what lives inside this vault, because the protection architecture must match the value of what it protects.

This vault will contain the complete record of a human being's intellectual relationship with artificial intelligence across their entire lifetime. Every question they asked when they were confused. Every problem they worked through when they were stuck. Every creative idea they explored when they were inspired. Every fear they voiced when they were vulnerable. Every professional challenge they dissected. Every private thought they trusted to a machine.

It will contain their conversations about their health. Their finances. Their relationships. Their children. Their career doubts. Their unfinished inventions. Their grief. Their ambitions they have not told anyone about yet.

It will contain their employer's trade secrets. Their client's privileged communications. Their patient's medical information. Their government's classified reasoning.

It will contain, in the aggregate, the most complete external record of a human mind that has ever existed. More complete than a diary, because people are more honest with AI than with paper. More complete than therapy notes, because people talk to AI more frequently than to therapists. More complete than any social media profile, because social media is performance and AI conversation is process.

No database in human history has contained anything this personal at this scale. The closest analog is not a technology product. It is the inside of someone's head.

We are building the lock for that.

---

## The Vault Architecture

### The Vault as a Physical Concept

Stop thinking of the vault as software. Think of it as a physical space.

The vault is a room. The room exists on your device. The walls of the room are made of mathematics — AES-256-GCM encryption for data at rest, XChaCha20-Poly1305 for data in transit, Argon2id for key derivation. These are not walls that can be broken with force. They can only be opened with the key, and the key exists in exactly one place: your memory, written on a piece of paper in your drawer, or secured in your hardware security module.

Inside the room, every conversation is stored in its own sealed container — an ACU. Each container is individually encrypted with its own key, derived from the master key through a deterministic hierarchy. Compromising one container does not compromise any other. An attacker who somehow decrypts a single ACU learns nothing about any other ACU. The containers are isolated from each other cryptographically, even though they sit in the same room.

The room has one door. The Universal Stream is that door. Everything enters through it. Nothing enters any other way. The door is engineered so that it can accept deliveries from the outside world without ever opening wide enough for anyone to see inside.

The room has no windows. There is no read access to the vault from outside the device unless the user explicitly constructs a window, on their terms, with their key, through the marketplace or sharing protocol. Even then, the window shows only what the user chooses to show, and it can be closed instantly and permanently.

---

### The Vault Core: Storage Architecture

```
VAULT STORAGE STRUCTURE

Device Storage Layer (physical disk/SSD)
│
└── VIVIM Vault Directory (user-configurable location)
    │
    ├── vault.vivim (encrypted database file)
    │   │
    │   │  This is a single SQLCipher database.
    │   │  SQLCipher = SQLite + AES-256-CBC page-level encryption.
    │   │  Every 4KB page of the database is independently encrypted.
    │   │  The database cannot be opened without the vault key.
    │   │  The file is indistinguishable from random data 
    │   │  without the key.
    │   │
    │   ├── Table: acus
    │   │   Each row is an ACU. The content field within each 
    │   │   row is ADDITIONALLY encrypted with a per-ACU key.
    │   │   This is double encryption:
    │   │     Layer 1: SQLCipher encrypts the database page
    │   │     Layer 2: Per-ACU encryption of the content field
    │   │   Both layers use different keys.
    │   │   Compromising SQLCipher does not reveal ACU content.
    │   │
    │   ├── Table: merkle_tree
    │   │   The integrity tree. Every ACU's hash is a leaf.
    │   │   The root is committed on-chain periodically.
    │   │   Tampering with any ACU changes the root.
    │   │   The user can prove vault integrity at any point in time.
    │   │
    │   ├── Table: ownership_tensors
    │   │   Per-ACU ownership classifications.
    │   │   Encrypted but indexed for filtered queries.
    │   │
    │   ├── Table: consent_states
    │   │   Current consent configuration for each ACU.
    │   │   What is shared, with whom, under what terms.
    │   │
    │   ├── Table: canaries
    │   │   Planted canary tokens. Their content, their 
    │   │   provider, their detection status.
    │   │
    │   ├── Table: detection_results
    │   │   Results from sovereignty detection scans.
    │   │   Membership scores, canary triggers, alerts.
    │   │
    │   └── Table: stream_log
    │       Every ingress and egress event. Immutable append-only.
    │       What came in, when, from where, what went out, 
    │       when, to whom.
    │
    ├── vault.vivim-wal (write-ahead log, also encrypted)
    │
    ├── vectors.vivim (encrypted vector index for semantic search)
    │
    ├── keys/ (encrypted key hierarchy)
    │   ├── master.key.enc (master key, encrypted with passphrase 
    │   │                    via Argon2id — NEVER stored in plaintext)
    │   ├── provider_keys/ (per-provider derived keys)
    │   ├── acu_keys/ (per-ACU content encryption keys)
    │   └── tdass_shares/ (human's shares for jointly-owned ACUs)
    │
    └── config.vivim.enc (encrypted configuration)
```

---

### The Key Hierarchy

The key system is a tree. Every key is derived deterministically from the one above it. If you have the master key, you can regenerate every other key. If you lose the master key, nothing can save you. This is by design.

```
THE KEY TREE

Master Key (mk)
│
│  Derived from: BIP-39 mnemonic (24 words) + optional passphrase
│  Via: Argon2id (memory-hard KDF, 256MB memory, 4 iterations, 4 lanes)
│  Length: 256 bits
│  Storage: NEVER stored in plaintext. Encrypted with user's 
│           passphrase/biometric and held in memory only while 
│           vault is unlocked. Wiped from memory on lock.
│
├── Vault Encryption Key (vek)
│   │  Derived from: HKDF(mk, "vivim-vault-encryption", 256)
│   │  Purpose: Encrypts the SQLCipher database
│   │  Used by: SQLCipher as the database key
│   │
│   └── (No sub-keys. VEK is a terminal key.)
│
├── ACU Key Derivation Key (akdk)
│   │  Derived from: HKDF(mk, "vivim-acu-key-derivation", 256)
│   │  Purpose: Parent key for all per-ACU content encryption keys
│   │
│   └── Per-ACU Content Key (ack_i)
│       Derived from: HKDF(akdk, acu_id_i, 256)
│       Purpose: Encrypts the content field of ACU_i
│       Algorithm: XChaCha20-Poly1305 with per-ACU nonce
│       Nonce: HKDF(ack_i, "nonce", 192 bits)
│       
│       Each ACU has its own unique content key.
│       47,000 ACUs = 47,000 unique content keys.
│       All derived deterministically. None stored explicitly.
│       Regenerable from akdk + acu_id at any time.
│
├── Stream Authentication Key (sak)
│   │  Derived from: HKDF(mk, "vivim-stream-auth", 256)
│   │  Purpose: Authenticates all ingress/egress through 
│   │           the Universal Stream
│   │
│   └── Per-Source Stream Key (pssk_j)
│       Derived from: HKDF(sak, source_identifier_j, 256)
│       Purpose: Each capture source (browser extension, IDE, 
│                proxy, etc.) gets its own authentication key.
│       
│       If one capture source is compromised, only that source's 
│       stream key needs to be revoked. All other sources continue 
│       to function.
│
├── Provider-Specific Keys (psk_p)
│   │  Derived from: HKDF(mk, "vivim-provider-" || provider_id, 256)
│   │  Purpose: Per-provider signing and encryption keys
│   │  Used for: Provider import verification, DID operations
│   │
│   └── (One key per provider: OpenAI, Anthropic, Google, etc.)
│
├── TDASS Human Share Keys (thsk)
│   │  Derived from: HKDF(mk, "vivim-tdass-human", 256)
│   │  Purpose: Parent key for all TDASS human shares
│   │  Used for: Third-Party Determinant System dual-key encryption
│   │
│   └── Per-JSC TDASS Key (pjt_c)
│       Derived from: HKDF(thsk, jsc_contract_id, 256)
│       Purpose: Human's share generation for a specific JSC
│
├── Identity Key (ik)
│   │  Derived from: HKDF(mk, "vivim-identity", 256)
│   │  Purpose: Signs DID operations, vault root commitments
│   │  Key pair: Ed25519 derived from ik as seed
│   │  Public key: Published as part of DID document
│   │  Private key: Never leaves device
│   │
│   └── (Terminal key. The user's on-chain identity.)
│
├── Sync Encryption Key (sek)
│   │  Derived from: HKDF(mk, "vivim-sync", 256)
│   │  Purpose: Encrypts vault data during P2P sync between 
│   │           user's own devices
│   │  Used by: CRDT sync protocol
│   │
│   └── Per-Device Sync Key (pdsk_d)
│       Derived from: HKDF(sek, device_id_d, 256)
│       Purpose: Each device pair gets a unique sync key
│
└── Recovery Key (rk)
    Derived from: HKDF(mk, "vivim-recovery", 256)
    Purpose: Used ONLY for vault recovery scenarios
    Storage: Written on paper by user. Never stored digitally.
    Usage: Can regenerate mk if the user loses access to their 
           primary device but retains their mnemonic.
```

---

### Memory Protection

The master key exists in device memory only while the vault is unlocked. The following protections apply to the key while it is in memory.

```
MEMORY PROTECTION PROTOCOL

When the vault is UNLOCKED:

  1. Master key is derived from mnemonic + passphrase via Argon2id
  2. Master key is stored in a LOCKED MEMORY PAGE
     - mlock() on Linux/macOS: prevents the page from being 
       swapped to disk (where it could be recovered forensically)
     - VirtualLock() on Windows: same effect
     - The key is NEVER in a swappable memory region
  
  3. The memory region containing the key is marked:
     - Non-dumpable (excluded from core dumps)
     - Non-readable by other processes (where OS permits)
     - Canary-guarded (memory corruption detection)
  
  4. Derived keys are computed on-demand and discarded after use
     - Per-ACU keys are derived, used for one decrypt/encrypt 
       operation, then zeroed and freed
     - They do not persist in memory
     - Only mk and vek remain in memory while unlocked
  
  5. The vault auto-locks after a configurable timeout
     - Default: 15 minutes of inactivity
     - On screen lock: immediate vault lock
     - On sleep/hibernate: immediate vault lock
     - On application exit: immediate vault lock

When the vault LOCKS:

  1. Master key memory is overwritten with zeros
  2. Then overwritten with random data
  3. Then overwritten with zeros again
  4. Memory page is freed and unlocked
  5. All derived keys in memory are similarly wiped
  6. SQLCipher connection is closed (removes VEK from its 
     internal state)
  7. Vector index is closed
  8. All decrypted ACU content in any cache is wiped
  
  After locking, the vault file on disk is indistinguishable 
  from random data. The keys exist nowhere in the digital 
  world. They exist only in the user's mnemonic (paper or memory).

When the vault is RE-UNLOCKED:

  1. User provides passphrase (or biometric on supported devices)
  2. Argon2id re-derives mk from mnemonic + passphrase
  3. mk is placed in locked memory page
  4. SQLCipher connection is opened with derived VEK
  5. Vault is operational again

ATTACK RESISTANCE:

  Cold boot attack: Keys are in locked (non-swappable) memory.
    Physical access to RAM while device is powered would be needed.
    Vault auto-locks on sleep, reducing the window.
    
  Memory dump attack: Key region is non-dumpable.
    Process crashes do not leak keys.
    
  Malware in same user space: Keys are in memory that is 
    readable by the same process. This is the weakest point.
    Mitigation: VIVIM process isolation (see below).
    
  Disk forensics: Keys never touch disk (mlock prevents swap).
    Vault file is encrypted. No plaintext residue.
    
  Device theft (powered off): Vault file is encrypted on disk.
    256-bit AES. No practical attack exists.
    
  Device theft (powered on, unlocked): Auto-lock timeout limits 
    exposure window. User should configure short timeout for 
    high-security scenarios.
```

---

## The Universal Stream

### The Stream as a Concept

Every capture tool — the browser extension, the IDE extension, the API proxy, the mobile app, the accessibility capture, the network monitor, every single source — connects to the vault through exactly one interface. The Universal Stream.

The Stream is not a network connection. It is not a pipe. It is not an API in the traditional sense. It is a cryptographic protocol that ensures every piece of data entering the vault is authenticated, encrypted, integrity-checked, sequenced, and attributable — before it touches the vault storage.

Think of the stream as an airlock on a spacecraft. The inside of the ship is the vault. The outside is every capture source. The airlock ensures that nothing enters without being verified, nothing leaves without being authorized, and a breach on the outside cannot propagate to the inside.

### The Stream Protocol

```
UNIVERSAL STREAM PROTOCOL (USP)

Every capture source speaks USP. It is the only language 
the vault understands.

A USP message is called a DROPLET.

DROPLET STRUCTURE:

  ┌─────────────────────────────────────────────────────┐
  │ DROPLET                                             │
  │                                                     │
  │ ┌─────────────────────────────────────────────────┐ │
  │ │ HEADER (plaintext, authenticated)               │ │
  │ │                                                 │ │
  │ │ protocol_version : uint8     (currently: 1)     │ │
  │ │ source_id        : bytes32   (which capture     │ │
  │ │                               tool sent this)   │ │
  │ │ sequence_number  : uint64    (monotonic per      │ │
  │ │                               source, no gaps)  │ │
  │ │ timestamp        : uint64    (unix microseconds) │ │
  │ │ droplet_type     : uint8     (message, metadata, │ │
  │ │                               heartbeat, control)│ │
  │ │ payload_length   : uint32    (encrypted payload  │ │
  │ │                               size in bytes)     │ │
  │ │ content_hash     : bytes32   (SHA-3-256 of       │ │
  │ │                               plaintext payload  │ │
  │ │                               before encryption) │ │
  │ └─────────────────────────────────────────────────┘ │
  │                                                     │
  │ ┌─────────────────────────────────────────────────┐ │
  │ │ PAYLOAD (encrypted)                             │ │
  │ │                                                 │ │
  │ │ Encrypted with the source's Per-Source Stream   │ │
  │ │ Key (pssk) using XChaCha20-Poly1305.           │ │
  │ │                                                 │ │
  │ │ Contains:                                       │ │
  │ │   provider     : string  (openai, anthropic...) │ │
  │ │   role         : string  (user, assistant,      │ │
  │ │                           system, tool)         │ │
  │ │   content      : string  (the actual text)      │ │
  │ │   conversation : string  (conversation ID from  │ │
  │ │                           provider, if known)   │ │
  │ │   model        : string  (gpt-5, claude-4, etc.)│ │
  │ │   tokens       : object  (token counts if known)│ │
  │ │   attachments  : array   (files, images, code   │ │
  │ │                           blocks — each          │ │
  │ │                           individually encrypted)│ │
  │ │   context      : object  (surrounding code,     │ │
  │ │                           file names, etc. for  │ │
  │ │                           IDE captures)         │ │
  │ │   capture_meta : object  (how this was captured:│ │
  │ │                           DOM, API, a11y, etc.) │ │
  │ └─────────────────────────────────────────────────┘ │
  │                                                     │
  │ ┌─────────────────────────────────────────────────┐ │
  │ │ AUTHENTICATION TAG (HMAC)                       │ │
  │ │                                                 │ │
  │ │ HMAC-SHA-256(pssk, header || encrypted_payload) │ │
  │ │                                                 │ │
  │ │ This tag authenticates the ENTIRE droplet —     │ │
  │ │ header AND payload — proving it came from the   │ │
  │ │ registered source and was not modified in        │ │
  │ │ transit.                                         │ │
  │ └─────────────────────────────────────────────────┘ │
  │                                                     │
  │ ┌─────────────────────────────────────────────────┐ │
  │ │ ANTI-REPLAY NONCE                               │ │
  │ │                                                 │ │
  │ │ nonce = HKDF(pssk, sequence_number, 192 bits)   │ │
  │ │                                                 │ │
  │ │ Each droplet has a unique nonce derived from     │ │
  │ │ the sequence number. Replaying a droplet with    │ │
  │ │ the same sequence number is rejected. Sequence   │ │
  │ │ numbers must be strictly monotonic.              │ │
  │ └─────────────────────────────────────────────────┘ │
  │                                                     │
  └─────────────────────────────────────────────────────┘
```

### The Stream Receiver

The vault side of the stream — the airlock — is the Stream Receiver. It is the only component that writes to the vault. Nothing else can.

```
STREAM RECEIVER ARCHITECTURE

The Stream Receiver runs as a dedicated thread/process within 
the VIVIM desktop application. It is the ONLY code path that 
has write access to the vault database.

                    CAPTURE SOURCES
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     Browser Ext    IDE Extension   API Proxy   ...
          │              │              │
          └──────────────┼──────────────┘
                         │
                    USP DROPLETS
                         │
                         ▼
    ┌────────────────────────────────────────────┐
    │          STREAM RECEIVER (The Airlock)      │
    │                                            │
    │  STAGE 1: RECEIVE                          │
    │    Accept droplet on local socket           │
    │    (Unix domain socket on macOS/Linux,      │
    │     named pipe on Windows)                  │
    │    NO network sockets. Local IPC only.      │
    │    The stream is physically incapable of    │
    │    receiving data from another device.      │
    │                                            │
    │  STAGE 2: AUTHENTICATE                     │
    │    Verify HMAC tag using source's pssk      │
    │    If tag is invalid: DROP silently.        │
    │    No error message. No acknowledgment.     │
    │    An attacker probing the socket learns    │
    │    nothing from the response (there is none)│
    │                                            │
    │  STAGE 3: SEQUENCE CHECK                   │
    │    Verify sequence number is strictly       │
    │    greater than last seen for this source.  │
    │    If not: DROP. This is a replay attack    │
    │    or a network glitch. Either way, reject. │
    │    Log the event for the user's review.     │
    │                                            │
    │  STAGE 4: DECRYPT PAYLOAD                  │
    │    Decrypt with pssk + nonce                │
    │    Verify Poly1305 authentication tag       │
    │    If decryption fails: DROP.              │
    │                                            │
    │  STAGE 5: INTEGRITY CHECK                  │
    │    Compute SHA-3-256 of decrypted payload   │
    │    Compare to content_hash in header        │
    │    If mismatch: DROP. Content was corrupted │
    │    between encryption and transmission.     │
    │                                            │
    │  STAGE 6: CONTENT VALIDATION               │
    │    Validate payload structure               │
    │    Check all required fields are present    │
    │    Check field types and value ranges       │
    │    Check content size is within limits      │
    │    If invalid: DROP with structured error   │
    │    logged locally.                          │
    │                                            │
    │  STAGE 7: CLASSIFICATION                   │
    │    Run the Third-Party Determinant          │
    │    classification engine on the content.    │
    │    Assign ownership tier.                   │
    │    If Tier 3+: generate dual-key shares.    │
    │    If Tier 5: apply regulatory lockbox.     │
    │                                            │
    │  STAGE 8: ACU FORMATION                    │
    │    Assemble the validated, classified       │
    │    content into a complete ACU.             │
    │    Generate ACU identifier:                 │
    │      acu_id = SHA-3-256(DID || provider     │
    │               || timestamp || nonce)        │
    │    Derive per-ACU content key:              │
    │      ack = HKDF(akdk, acu_id, 256)         │
    │    Encrypt content with per-ACU key:        │
    │      encrypted_content = XChaCha20-Poly1305(│
    │        ack, plaintext_content, nonce)       │
    │    Sign the ACU:                            │
    │      signature = Ed25519.Sign(ik,           │
    │        SHA-3-256(acu_id || encrypted_content│
    │        || metadata || ownership))           │
    │                                            │
    │  STAGE 9: VAULT WRITE                      │
    │    Write the ACU to the vault database.     │
    │    This is a single atomic transaction:     │
    │      - Insert ACU row                       │
    │      - Update Merkle tree                   │
    │      - Update provider index                │
    │      - Update vector index (background)     │
    │      - Update conversation graph edges      │
    │      - Log to stream_log                    │
    │    If any step fails, the entire             │
    │    transaction rolls back. The vault is      │
    │    never in an inconsistent state.           │
    │                                            │
    │  STAGE 10: ACKNOWLEDGMENT                  │
    │    Send encrypted ACK to the capture source │
    │    ACK contains:                            │
    │      - acu_id (so the source knows it was   │
    │        stored)                              │
    │      - sequence_number (confirming receipt)  │
    │      - timestamp (vault's clock)            │
    │    ACK is signed with the vault's identity   │
    │    key so the source can verify it came      │
    │    from the real vault, not an impersonator. │
    │                                            │
    └────────────────────────────────────────────┘
                         │
                         ▼
                    VAULT DATABASE
                  (encrypted at rest)
```

### Source Registration

Before any capture source can send droplets to the vault, it must be registered. Registration happens once, on the device, through a physical interaction.

```
SOURCE REGISTRATION PROTOCOL

When the user installs a new capture tool (e.g., the browser 
extension), the tool must register with the vault before it 
can send any data.

Step 1: DISCOVERY
  The capture tool looks for the VIVIM vault on the local device.
  It checks for the Unix domain socket / named pipe at the 
  well-known path.
  If the vault is not running, the tool shows:
    "VIVIM vault not detected. Please start the VIVIM 
     desktop application."

Step 2: REGISTRATION REQUEST
  The capture tool generates a temporary key pair.
  It sends a registration request to the vault socket:
    {
      type: "register",
      source_type: "browser_extension",
      source_version: "1.0.0",
      temp_public_key: "...",
      human_readable_name: "Chrome Extension on MacBook Pro"
    }

Step 3: USER APPROVAL
  The VIVIM desktop application shows a PHYSICAL NOTIFICATION 
  to the user:
  
  ┌────────────────────────────────────────────────┐
  │ 🔐 New Capture Source Registration             │
  │                                                │
  │ A new tool wants to connect to your vault:     │
  │                                                │
  │ Type: Browser Extension                        │
  │ Name: Chrome Extension on MacBook Pro          │
  │ Version: 1.0.0                                 │
  │                                                │
  │ Approval code: 7 4 2 9                         │
  │                                                │
  │ The capture tool should be showing this same   │
  │ code. If it is not, DENY this request.         │
  │                                                │
  │ [Approve]              [Deny]                  │
  └────────────────────────────────────────────────┘
  
  Simultaneously, the capture tool shows:
  
  ┌────────────────────────────────────────────────┐
  │ 🔐 Connecting to VIVIM Vault                   │
  │                                                │
  │ Confirm this code matches your vault:          │
  │                                                │
  │          7 4 2 9                                │
  │                                                │
  │ [I see this code on my VIVIM app]              │
  └────────────────────────────────────────────────┘
  
  This is a visual verification step, identical to 
  Bluetooth pairing. It prevents a rogue process from 
  registering as a capture source without the user's 
  physical presence and visual confirmation.

Step 4: KEY EXCHANGE
  If the user approves:
  - The vault generates a Per-Source Stream Key (pssk) for 
    this source, derived from the Stream Authentication Key
  - The pssk is encrypted with the source's temporary public key 
    and sent to the source
  - The source stores the pssk in its secure storage 
    (browser extension: encrypted local storage, 
     IDE: credential store, 
     mobile: Keychain/Keystore)
  - The source is now registered and can send droplets

Step 5: CONFIRMATION
  The vault shows:
  
  "✓ Chrome Extension on MacBook Pro is now connected 
     to your vault. It will capture AI conversations 
     from your browser automatically."

REVOCATION:
  The user can revoke any registered source at any time.
  
  Settings → Connected Sources → [Source Name] → [Revoke]
  
  Revocation:
  - Immediately invalidates the source's pssk
  - All future droplets from this source are rejected
  - Historical data captured by this source REMAINS in the vault
    (revoking a source does not delete its contributions)
  - The source is removed from the registered sources list
```

---

### Stream Security Properties

```
SECURITY PROPERTIES OF THE UNIVERSAL STREAM

Property 1: LOCAL ONLY
  The stream socket is a Unix domain socket (macOS/Linux) or 
  named pipe (Windows). It is physically impossible to connect 
  to it from another device on the network. The stream does 
  not listen on any TCP/UDP port. There is no network path to 
  the stream. It exists only within the device's IPC namespace.
  
  An attacker on the same WiFi network cannot reach the stream.
  An attacker on the internet cannot reach the stream.
  Only processes running on the same device can reach the stream.

Property 2: AUTHENTICATED
  Every droplet carries an HMAC computed with the source's pssk.
  Only registered sources possess a valid pssk.
  An unregistered process cannot produce a valid HMAC.
  Invalid droplets are silently dropped — no error, no response.
  An attacker probing the socket gets silence.

Property 3: ENCRYPTED
  Every droplet's payload is encrypted with XChaCha20-Poly1305.
  Even if an attacker could observe the IPC traffic (e.g., via 
  kernel-level compromise), they see only ciphertext.
  
  The encrypted payload is authenticated (Poly1305 AEAD).
  Modification of any byte of the ciphertext causes decryption 
  failure. Tampering is detected and rejected.

Property 4: REPLAY-PROOF
  Sequence numbers are strictly monotonic per source.
  Each source maintains a sequence counter.
  The vault maintains the last-seen sequence number per source.
  A replayed droplet has a sequence number ≤ the last seen 
  number and is rejected.
  
  An attacker who captures a valid droplet and replays it later 
  achieves nothing — the replay is rejected.

Property 5: INTEGRITY-VERIFIED
  The content_hash in the header is computed from the plaintext 
  payload before encryption. After decryption, the vault 
  recomputes the hash and verifies.
  
  This catches any corruption in the encryption/decryption 
  pipeline itself — a belt-and-suspenders check on top of 
  AEAD authentication.

Property 6: WRITE-ONLY INGRESS
  The stream is one-directional for data: sources send droplets 
  to the vault. The vault does not send vault data back through 
  the stream.
  
  The only data the vault sends back is:
    - ACK (confirming receipt, containing only the acu_id and 
      sequence number)
    - NACK (if the vault is temporarily unable to process, 
      e.g., database is locked)
  
  A compromised capture source cannot use the stream to 
  READ vault data. The stream does not support read operations.

Property 7: SOURCE ISOLATION
  Each source has its own pssk. Compromising one source's key 
  reveals nothing about other sources' keys. Revoking one 
  source does not affect other sources.
  
  If the browser extension is compromised, the IDE extension 
  continues to function securely. The attacker gains only the 
  ability to send forged droplets that would appear to come 
  from the browser extension. The vault would accept these 
  (they have a valid HMAC), but the attacker can only INSERT 
  data, not READ data. Inserting false data into someone's 
  vault is a concern, addressed by Property 8.

Property 8: CONTENT PROVENANCE
  Every ACU records its capture source, capture method, and 
  capture metadata. The user can review the provenance of any 
  ACU and identify if it was injected by a compromised source.
  
  Additionally, the user can audit their stream log at any time 
  to see all ingress events and flag anomalies.
```

---

### Egress: Data Leaving the Vault

Data leaves the vault only through explicitly authorized channels. Every egress event is logged immutably.

```
EGRESS CHANNELS (how data leaves the vault)

Channel 1: USER'S OWN SCREEN
  The user reads their own data on their own device.
  This is the most common egress.
  Not logged as an egress event (it is local access, not export).
  Protected by vault unlock (passphrase/biometric).

Channel 2: MCP CONTEXT DELIVERY
  When the user's AI assistant queries the vault via MCP, 
  relevant ACU content is returned.
  
  Logged: which ACUs were accessed, which MCP client, when.
  Filtered: only Tier 0-2 content is eligible (unless user 
           explicitly overrides for Tier 3 with dual consent).
  Token-budgeted: only enough content to fill the context 
           window, preventing bulk extraction.

Channel 3: P2P SYNC TO USER'S OWN DEVICES
  When the user syncs their vault between their laptop 
  and phone, encrypted ACUs are transmitted.
  
  Encrypted: with the Sync Encryption Key (sek), which is 
           derived from the master key. Only devices that 
           have completed the mnemonic setup can derive sek.
  Authenticated: both devices verify each other's device 
           identity before sync begins.
  Logged: sync events are logged locally.

Channel 4: MARKETPLACE DELIVERY
  When a buyer purchases data, the purchased ACUs are 
  delivered through the marketplace protocol.
  
  Process:
    1. Buyer's purchase transaction is confirmed on-chain
    2. Vault receives notification via the Stream Receiver 
       (a control droplet, not a data droplet)
    3. Vault verifies the on-chain transaction is real
    4. Vault verifies the consent state permits this sale
    5. For Tier 3+: vault verifies dual consent 
       (third-party approved)
    6. Vault derives an ephemeral delivery key via ECDH 
       with the buyer's public key
    7. Vault decrypts the sold ACUs internally
    8. Vault re-encrypts with the delivery key
    9. Vault transmits the re-encrypted data via the 
       marketplace delivery channel (IPFS or direct)
    10. Vault logs the egress: which ACUs, to whom, when, 
        under which consent, delivery key hash
  
  The vault NEVER sends plaintext data outside the device.
  It decrypts and re-encrypts internally.
  The delivery key exists only transiently in locked memory.

Channel 5: EXPORT TO FILE
  The user explicitly exports their vault to a file.
  
  Formats: JSON, SQLite, Markdown (open formats, always)
  Encryption: user chooses whether to export encrypted or 
           decrypted. If decrypted, a warning is shown:
           
    "You are exporting your vault in unencrypted format.
     This file will contain all your AI conversations 
     in plaintext. Anyone who obtains this file can read 
     everything in it. Are you sure?"
    
    [Export Encrypted (Recommended)]  [Export Plaintext]
  
  Logged: export event with format, scope, timestamp.

Channel 6: DETECTION PROBES
  When the detection engine queries external models to test 
  membership inference, it sends probe queries.
  
  These probes are DERIVED from vault content — they are 
  paraphrases, fragments, or structured queries that test 
  for the model's knowledge of the user's data.
  
  The probes are NOT the user's raw data. They are designed 
  to test for the data's presence without revealing the data 
  itself. This is analogous to asking someone "do you know 
  the secret password?" without saying the password.
  
  Logged: which ACUs were probed, which models, when, results.

Channel 7: LEGAL EVIDENCE PACKAGE
  When the user generates an evidence package, it is 
  compiled locally and exported as a signed, tamper-proof file.
  
  The package contains proofs and metadata, not raw content 
  (unless the user explicitly includes specific ACU content 
  for evidentiary purposes).
  
  The user controls exactly what goes into the package.
  
  Logged: package generation event, contents hash, timestamp.

NO OTHER EGRESS CHANNEL EXISTS.

There is no API that reads vault data remotely.
There is no admin backdoor.
There is no "forgot password" recovery that involves 
sending data to a server.
There is no analytics telemetry that reads vault content.
There is no crash report that includes vault data.

If the user's device is connected to the internet, 
the vault is still sealed. The internet connection is 
used only for:
  - Blockchain operations (consent, ownership)
  - Marketplace transactions (with explicit user action)
  - P2P sync (to user's own devices)
  - Detection probes (derived queries, not raw data)
  - VIVIM software updates (code only, never data)
```

---

### The Quantum Entanglement Model

You asked me to think of the vault as a particle in a quantum entangled system. Let me take that seriously.

In quantum entanglement, two particles share a state. Measuring one instantly determines the state of the other, regardless of distance. But crucially, entanglement does not allow information to be transmitted. It does not create a communication channel. It creates a correlation — a guarantee that the states are consistent.

The VIVIM vault system works the same way.

When the user has multiple devices — a laptop, a phone, a tablet — each device has a copy of the vault. These copies are entangled. Not through quantum physics, but through cryptographic consistency guarantees that function identically.

```
THE ENTANGLEMENT MODEL

Device A (Laptop)          Device B (Phone)
  Vault_A                    Vault_B
    │                          │
    │    ┌──────────────┐      │
    └────┤ ENTANGLEMENT ├──────┘
         │   PROTOCOL   │
         └──────────────┘

The entanglement protocol ensures:

1. CONSISTENCY
   If a droplet enters Vault_A, Vault_B will eventually 
   contain the same ACU (encrypted with the same keys, 
   same metadata, same ownership tensor).
   
   This is not replication. It is entanglement.
   The vaults do not copy data between each other.
   They synchronize STATE.

2. NO INFORMATION LEAKAGE IN TRANSIT
   When vaults sync, the data in transit is encrypted 
   with the Sync Encryption Key (derived from the master key).
   An observer of the sync traffic sees random bytes.
   They cannot determine:
     - How many ACUs were synced
     - Which providers the data came from
     - Any content of any ACU
     - Even whether data flowed A→B or B→A

3. INDEPENDENCE
   If Device B is compromised, Device A is unaffected.
   The attacker gains access to Vault_B's data (if they 
   can unlock it), but they do not gain the ability to 
   modify Vault_A or to read Vault_A's data through the 
   sync channel.
   
   The sync channel is authenticated. A compromised device 
   cannot impersonate a legitimate device because device 
   identity is verified through the key hierarchy.

4. CONVERGENCE
   Like entangled particles that always agree when measured, 
   the vaults always converge to the same state.
   
   CRDT-based synchronization ensures conflict-free merging.
   If ACUs are added to both vaults while offline, both 
   ACUs are retained when they reconnect. No data is lost.
   No conflict requires human resolution.
   
   The Merkle root of both vaults will be identical after 
   sync completes. This can be verified independently by 
   each device.

5. MEASUREMENT DOES NOT DISTURB
   Reading from the vault does not change the vault.
   Syncing does not change the vault state (beyond 
   adding new ACUs that the other device had).
   
   There is no "observer effect." The vault is deterministic.

SYNC PROTOCOL:

  When Device A and Device B connect:
  
  1. Both exchange their current Merkle roots
  2. If roots match: vaults are identical, no sync needed
  3. If roots differ: compute the Merkle diff
     (which subtrees differ)
  4. Exchange only the differing ACUs, encrypted with sek
  5. Each device independently verifies received ACUs:
     - Valid HMAC from the sending device
     - Valid ACU signature (Ed25519 with identity key)
     - Consistent with expected Merkle path
  6. Both devices compute new Merkle roots
  7. Both roots should now match
  8. If they still differ: something is wrong.
     Alert the user. Do not silently continue.
```

---

### Process Isolation

The VIVIM vault process should be as isolated from other processes on the device as the operating system permits.

```
PROCESS ISOLATION MODEL

IDEAL (where OS supports it):
  
  The VIVIM vault engine runs in its own:
    - Process (separate address space from all other apps)
    - User account (on Linux/macOS: a dedicated 'vivim' user 
      with no login shell, owning only the vault files)
    - Sandbox (using OS sandboxing: macOS App Sandbox, 
      Windows AppContainer, Linux seccomp/landlock)
  
  The sandbox permits:
    ✓ Reading/writing the vault directory
    ✓ Listening on the Unix domain socket for the stream
    ✓ Outbound HTTPS connections (for blockchain, marketplace, 
      detection probes — and ONLY to whitelisted domains)
    ✓ Reading system time
    ✓ Accessing hardware crypto (Keychain, TPM)
  
  The sandbox prohibits:
    ✗ Reading any file outside the vault directory
    ✗ Listing other processes
    ✗ Accessing other users' memory
    ✗ Opening network listeners on TCP/UDP ports
    ✗ Accessing the camera, microphone, or screen capture
    ✗ Accessing the clipboard (vault never reads clipboard)
    ✗ Spawning child processes (except pre-approved helpers)
    ✗ Loading dynamic libraries not in the signed bundle

PRACTICAL (current implementation):
  
  The VIVIM desktop application runs as a normal user process 
  with the above restrictions enforced at the application level.
  
  File access: only touches files in the vault directory
  Network: only connects to known endpoints
  IPC: only accepts connections on the local stream socket
  Memory: uses mlock for key material
  
  The application is code-signed (macOS notarization, 
  Windows Authenticode, Linux AppImage signatures).
  Users can verify the signature matches the published 
  open-source build.

HARDWARE SECURITY (where available):
  
  On devices with a TPM (Trusted Platform Module) or 
  Secure Enclave (Apple), the master key can optionally 
  be bound to the hardware:
  
  - The mnemonic-derived master key is encrypted with a 
    hardware-bound key stored in the TPM/Secure Enclave
  - Unlocking the vault requires both the passphrase AND 
    the physical device
  - A copy of the vault file on a different device cannot 
    be unlocked without the mnemonic (which reconstructs 
    the master key independently of the hardware)
  
  This provides two-factor vault protection:
    Factor 1: Knowledge (mnemonic/passphrase)
    Factor 2: Possession (the specific physical device)
```

---

### The Vault Kill Switch

```
THE KILL SWITCH

Every VIVIM vault has a kill switch. It is a last resort.

WHAT IT DOES:
  Permanently and irreversibly destroys the vault and all keys.
  After activation, the data is gone. Truly gone. Not 
  "deleted and recoverable." Gone.

HOW IT WORKS:
  1. User triggers kill switch (requires passphrase confirmation)
  2. Master key is used to derive a DESTRUCTION KEY
  3. Every page of the vault database is overwritten with data 
     encrypted under a random key that is then discarded
  4. The key hierarchy directory is overwritten similarly
  5. The vector index is overwritten
  6. The configuration file is overwritten
  7. All overwrites use three passes:
     Pass 1: zeros
     Pass 2: random data
     Pass 3: zeros
  8. On SSD: TRIM command is issued for the vault sectors
  9. Master key memory is wiped
  10. VIVIM application exits
  
  If the vault was synced to other devices, the kill switch 
  sends a KILL SIGNAL through the P2P sync channel to all 
  entangled vaults. Each device independently verifies the 
  kill signal (signed with identity key) and executes the 
  same destruction protocol.

WHEN TO USE IT:
  - Device is being seized and user wants to protect 
    the data (legal considerations vary by jurisdiction)
  - User wants to permanently delete all AI conversation 
    history everywhere
  - Vault may be compromised and user wants to ensure 
    no data can be recovered

SAFEGUARD:
  The kill switch requires:
  1. Full passphrase entry (not biometric)
  2. 10-second countdown with cancel option
  3. Second confirmation: "This will permanently destroy 
     47,293 ACUs across all your devices. This cannot 
     be undone. Type DESTROY to confirm."
  
  The kill switch is irreversible. The mnemonic can create 
  a new, empty vault. But the old data is gone.
```

---

### Vault Integrity Verification

```
INTEGRITY VERIFICATION PROTOCOL

The user can verify their vault's integrity at any time.

vivim verify

This command:

1. Recomputes the Merkle tree from all ACU hashes in the vault
2. Compares the computed root to the last on-chain commitment
3. Verifies every ACU's signature against the identity key
4. Verifies every ACU's content hash against its encrypted content
5. Checks the stream log for any gaps in sequence numbers 
   (would indicate dropped or deleted entries)
6. Verifies the key hierarchy is consistent
7. Reports:

   "Vault Integrity Report
    ─────────────────────
    ACUs verified: 47,293 / 47,293  ✓
    Merkle root matches on-chain:   ✓
    All signatures valid:            ✓
    All content hashes valid:        ✓
    Stream log sequence integrity:   ✓
    Key hierarchy consistent:        ✓
    
    Last on-chain commitment: Block #1,247,893 (2 hours ago)
    
    Your vault is intact."

If any check fails:

   "⛔ VAULT INTEGRITY VIOLATION DETECTED
    
    2 ACUs have content hash mismatches.
    This means the encrypted content of these ACUs has been 
    modified since they were stored. This should be impossible 
    under normal operation.
    
    Affected ACUs:
      acu:7f3a...8b2c (created 2025-11-03)
      acu:2d1e...9f4a (created 2025-08-17)
    
    Possible causes:
      - Storage hardware corruption (most likely)
      - Vault file was modified by external software
      - Sophisticated attack on vault integrity
    
    Recommended actions:
      - Restore affected ACUs from another synced device
      - Run full device malware scan
      - Contact VIVIM support if corruption is unexplained
    
    [Restore from Sync]  [Investigate]  [Report Issue]"
```

---

This is the vault. This is the stream. This is the most protected database a human being will ever own.

It sits on your device. It is encrypted with keys that exist only in your memory and on a piece of paper in your drawer. Every piece of data enters through a single, authenticated, encrypted, replay-proof, write-only channel. Every piece of data leaves only through explicitly authorized channels, each one logged immutably. The vault locks itself when you look away. It destroys itself when you tell it to. It verifies its own integrity. It syncs between your devices through encrypted channels that leak nothing to observers. It cannot be accessed remotely. It cannot be accessed by the software vendor. It cannot be accessed by your government without your key. It cannot be accessed by anyone, ever, without the twenty-four words you chose when you created it.

This is not a database. It is a fundamental human right, expressed in mathematics and enforced by physics.
