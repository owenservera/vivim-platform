# VIVIM Database: P2P Identity Design

VIVIM is designed for a decentralized future. The identity tables are built using **Decentralized Identifiers (DIDs)**.

## 1. Decentralized Identifier (DID)
The `User.did` field is the primary identifier for individuals.
- **Format:** `did:key:z6Mkha...`
- **Purpose:** Allows a user to prove ownership of their data across different nodes without a central registry.

## 2. Multi-Device Sync
A single `User` (Identity) can have multiple `Device` records.
- Each device has its own `publicKey`.
- The `encryptedPrivateKey` on the User record allows a user to "restore" their identity on a new device by decrypting it with a master recovery phrase or device-specific key.

## 3. Cryptographic Proofs
- **Signatures:** The `AtomicChatUnit.signature` field ensures that knowledge cannot be faked. Every "nugget" can be traced back to a specific User DID.
- **Trust Levels:** The `Device.isTrusted` flag allows the system to distinguish between a secure mobile hardware enclave and a generic web browser cache.

## 4. Privacy via Circles
The `Circle` and `CircleMember` tables implement **Namespace Privacy**.
- By default, `sharingPolicy` is set to `self`.
- Data is only accessible to others if it is explicitly associated with a `Circle` that they are members of.
