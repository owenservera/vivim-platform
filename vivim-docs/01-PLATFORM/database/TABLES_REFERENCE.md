# VIVIM Database: Tables Reference

Detailed field definitions and descriptions for each table in the schema.

## 1. Source Layer

### `conversations`
The top-level container for an extracted AI conversation.
- `id`: UUID primary key.
- `provider`: String (chatgpt, claude, etc.).
- `sourceUrl`: Unique share URL.
- `title`: The conversation title.
- `messageCount`: Total number of messages.
- `totalWords`: Aggregate word count.
- `totalCodeBlocks`: Aggregate number of code snippets.
- `metadata`: JSONB blob for additional provider-specific data.

### `messages`
Individual turns in a conversation.
- `id`: UUID primary key.
- `conversationId`: Foreign key to `conversations`.
- `role`: user, assistant, system, or tool.
- `parts`: JSONB array of content blocks (text, code, image).
- `messageIndex`: Zero-based order in the conversation.

### `capture_attempts`
Logging for the extraction pipeline.
- `status`: pending, success, or failed.
- `errorCode` / `errorMessage`: Failure details.
- `duration`: Time in ms for the extraction.

---

## 2. Knowledge Layer

### `atomic_chat_units` (ACUs)
Stand-alone, content-addressed knowledge nuggets.
- `id`: SHA3-256 hash of the content (enforces deduplication).
- `authorDid`: DID of the user who captured/created it.
- `content`: The raw text or code.
- `type`: statement, question, answer, code_snippet, etc.
- `qualityOverall`: composite score (0-100).
- `embedding`: Float array for vector search.

### `acu_links`
Graph edges between ACUs.
- `sourceId` / `targetId`: Hashes of the connected ACUs.
- `relation`: next, explains, answers, similar_to.
- `weight`: Confidence score (0.0 - 1.0).

---

## 3. Network Layer

### `users`
Identity records for individuals.
- `did`: Decentralized Identifier (Primary Key).
- `publicKey`: Ed25519 key for signature verification.
- `encryptedPrivateKey`: Stored encrypted for device portability.

### `devices`
Authorized hardware associated with a user.
- `deviceId`: Unique hardware/browser ID.
- `isTrusted`: Flag for elevated permissions.

### `circles`
Group-based sharing entities.
- `isPublic`: Visibility flag.
- `members`: Join table to `users`.

### `contributions` / `consumptions`
Reciprocity tracking for the P2P network.
- `quality`: User-rated or algorithmic value of the share.
