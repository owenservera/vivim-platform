# OpenScroll Storage Schema V2: DAG+CRDT

**Version:** 2.0.0
**Date:** January 23, 2026
**Status:** DRAFT - Implementation POC

## 1. Philosophy & Design Principles

### 1.1 Core Principles
1. **Content Addressing:** Every object is identified by its hash (SHA-256)
2. **Immutability:** Once written, data never changes (append-only)
3. **Cryptographic Provenance:** Every message is signed by its author
4. **Local-First:** All data lives on-device; cloud is optional
5. **P2P Native:** Designed for peer-to-peer synchronization
6. **Mobile Optimized:** Efficient storage and sync patterns

### 1.2 What This Enables
- ✅ Full conversation ownership
- ✅ Forking conversations (like Git branches)
- ✅ Editing individual messages with version history
- ✅ Merging concurrent edits (CRDT-style)
- ✅ Selective sharing (share entire conversation, a branch, or a single message)
- ✅ Efficient P2P sync (only transfer missing objects)
- ✅ On-chain verification (Merkle proofs)
- ✅ Offline-first operation

---

## 2. Data Model: The Conversation DAG

### 2.1 Core Structure

A **Conversation** is a Directed Acyclic Graph (DAG) of **Message Nodes**.

```
Conversation Root (Genesis)
    │
    ├─ Msg[0xabc...] (User: "Hello")
    │   │
    │   └─ Msg[0xdef...] (Assistant: "Hi there!")
    │       │
    │       ├─ Msg[0x123...] (User: "Help with X")
    │       │   │
    │       │   └─ Msg[0x456...] (Assistant: "Here's how...")
    │       │
    │       └─ Msg[0x789...] (User: "Actually, Y instead")  ← FORK
    │           │
    │           └─ Msg[0xyz...] (Assistant: "Here's Y...")
```

### 2.2 Node Types

| Node Type | Description | Immutable? |
|-----------|-------------|------------|
| `MessageNode` | A single message in the conversation | Yes |
| `EditNode` | Points to a new version of a message | Yes |
| `ForkNode` | Creates a new branch point | Yes |
| `MergeNode` | Combines multiple branches | Yes |
| `AnnotationNode` | Adds metadata without changing content | Yes |
| `ConversationRoot` | The genesis node of a conversation | Yes |

---

## 3. Object Schemas

### 3.1 MessageNode

The atomic unit of conversation data.

```typescript
interface MessageNode {
  // Content Addressing
  id: Hash;              // SHA-256(content + headers)
  cid: IPFS_CID;         // Optional IPFS CID for external reference

  // Content
  role: 'user' | 'assistant' | 'system';
  content: ContentBlock[];
  timestamp: ISO8601;

  // DAG Structure
  parents: Hash[];       // Previous message(s) this responds to
  depth: number;         // Distance from root (for ordering)

  // Provenance
  author: DID;           // Decentralized Identity
  signature: Signature;  // Ed25519 signature of (id + content)

  // Metadata
  metadata?: {
    model?: string;
    provider?: string;
    tokens?: number;
    [key: string]: unknown;
  };

  // Hash for integrity verification
  contentHash: Hash;     // Hash of content only (for diff purposes)
}
```

### 3.2 ContentBlock

Rich content representation.

```typescript
type ContentBlock =
  | TextBlock
  | CodeBlock
  | ImageBlock
  | MermaidBlock
  | TableBlock
  | MathBlock
  | ToolCallBlock
  | ToolResultBlock;

interface TextBlock {
  type: 'text';
  content: string;
}

interface CodeBlock {
  type: 'code';
  content: string;
  language: string;
}

interface ImageBlock {
  type: 'image';
  url: string;           // Can be data URI, IPFS, or URL
  alt?: string;
  caption?: string;
}

interface MermaidBlock {
  type: 'mermaid';
  content: string;       // Mermaid diagram source
}

interface ToolCallBlock {
  type: 'tool_call';
  name: string;
  args: Record<string, unknown>;
  id: string;
}

interface ToolResultBlock {
  type: 'tool_result';
  tool_call_id: string;
  content: string | unknown;
}
```

### 3.3 ConversationRoot

The genesis node that defines a conversation.

```typescript
interface ConversationRoot {
  id: Hash;
  type: 'root';

  // Metadata
  title: string;
  createdAt: ISO8601;
  author: DID;
  signature: Signature;

  // Initial state
  metadata: {
    provider?: string;
    model?: string;
    sourceUrl?: string;
    [key: string]: unknown;
  };

  // Root of the message DAG
  firstMessage?: Hash;   // Pointer to first message (optional for empty convos)
}
```

### 3.4 ConversationSnapshot

A named pointer to a specific state in the DAG (like a Git commit).

```typescript
interface ConversationSnapshot {
  id: Hash;
  name: string;          // e.g., "main", "feature-branch"
  head: Hash;            // Current tip of this branch
  createdAt: ISO8601;
  author: DID;
  description?: string;
  metadata?: Record<string, unknown>;
}
```

---

## 4. Storage Layers

### 4.1 Object Store (Content Addressed)

The foundational layer stores all objects by their hash.

```
ObjectStore: Hash -> Bytes
```

**Operations:**
- `put(obj: Node): Hash` - Store object, return its hash
- `get(hash: Hash): Node | null` - Retrieve object by hash
- `has(hash: Hash): boolean` - Check if object exists
- `delete(hash: Hash): void` - Delete object (and GC orphaned)

### 4.2 Index Store (Query Layer)

Fast lookups without traversing the DAG.

```
IndexStore: {
  conversations: Set<Hash>,           // All conversation roots
  messagesByConversation: Map<ConvHash, Set<MsgHash>>,
  messagesByAuthor: Map<DID, Set<MsgHash>>,
  snapshotsByConversation: Map<ConvHash, Set<SnapshotHash>>,
  timestamps: TemporalIndex
}
```

### 4.3 Signature Store (Crypto Cache)

Cached verification results for performance.

```
SignatureStore: {
  verified: Map<Hash, boolean>,
  authorKeys: Map<DID, PublicKey>
}
```

---

## 5. Cryptographic Operations

### 5.1 Signing

Every message is signed with the author's Ed25519 key.

```
SIGNATURE = Ed25519.Sign(
  PRIVKEY,
  HASH(id || role || content || timestamp || parents)
)
```

### 5.2 Verification

```
VALID = Ed25519.Verify(
  PUBKEY,
  HASH(id || role || content || timestamp || parents),
  SIGNATURE
)
```

### 5.3 Content Hashing

For diff purposes (ignores metadata):

```
contentHash = SHA256(
  role || content || timestamp
)
```

### 5.4 Conversation Root Hash

The identity of a conversation:

```
conversationId = SHA256(
  root.id || root.title || root.createdAt || root.author
)
```

---

## 6. CRDT Operations

### 6.1 Append (Add Message)

```
function appendMessage(conversationId, role, content, parentId):
  node = new MessageNode({
    role,
    content,
    parents: [parentId],
    depth: getNode(parentId).depth + 1,
    timestamp: now(),
    author: myDID
  })
  node.signature = sign(node)
  store.put(node.id, node)
  index.add(conversationId, node.id)
  return node.id
```

### 6.2 Fork (Create Branch)

```
function fork(conversationId, fromMessageId, branchName):
  snapshot = new ConversationSnapshot({
    name: branchName,
    head: fromMessageId,
    author: myDID
  })
  store.put(snapshot.id, snapshot)
  return snapshot.id
```

### 6.3 Edit (Create New Version)

```
function editMessage(messageId, newContent):
  oldMessage = store.get(messageId)
  editNode = new EditNode({
    edits: messageId,
    newContent,
    parents: oldMessage.parents,
    timestamp: now()
  })
  editNode.signature = sign(editNode)

  // Update parent pointers of children
  for child in getChildren(messageId):
    child.parents = child.parents.filter(p => p !== messageId)
    child.parents.push(editNode.id)
    child.signature = sign(child) // Re-sign
  return editNode.id
```

### 6.4 Merge (Combine Branches)

```
function merge(conversationId, branch1Head, branch2Head):
  // Find LCA (Lowest Common Ancestor)
  lca = findCommonAncestor(branch1Head, branch2Head)

  // Create merge node
  mergeNode = new MessageNode({
    role: 'system',
    content: [{type: 'text', content: 'Merged branch'}],
    parents: [branch1Head, branch2Head],
    timestamp: now()
  })
  mergeNode.signature = sign(mergeNode)
  return mergeNode.id
```

---

## 7. Merkle Tree for On-Chain Verification

### 7.1 Sparse Merkle Tree

Each conversation has a Sparse Merkle Tree for efficient proof generation.

```
                    Root Hash
                   /          \
              Hash(A,B)      Hash(C,D)
              /      \       /      \
           Msg(A)  Msg(B)  Msg(C)  Msg(D)
```

### 7.2 Merkle Proof

Prove that a message is part of a conversation without revealing everything.

```
function getMerkleProof(messageId, conversationId):
  path = []
  node = store.get(messageId)
  sibling = getSibling(node)
  path.push({hash: sibling.hash, direction: 'left'|'right'})
  return path
```

### 7.3 On-Chain Anchor

Minimal on-chain data:

```
struct OnChainAnchor {
  bytes32 conversationRoot;  // Merkle root
  uint256 timestamp;
  bytes32 previousRoot;      // Chain to previous state
}
```

---

## 8. P2P Sync Protocol

### 8.1 Object Discovery

```
WANT: <Hash>
HAVE: <Hash[]>
```

### 8.2 Message Exchange

```
GET_OBJECTS: [Hash1, Hash2, ...]
OBJECTS: [Object1, Object2, ...]
```

### 8.3 Sync Flow

```
1. A connects to B
2. A sends HAVE list (all conversation root hashes)
3. B responds with WANT list (missing hashes)
4. A sends OBJECTS for wanted hashes
5. B verifies signatures and stores
6. Repeat until sync complete
```

---

## 9. IndexedDB Schema

### 9.1 Database Structure

```
OpenScrollV2
├── objects           (ObjectStore) - Hash -> Node
├── conversations     (ObjectStore) - ConvRoot -> Metadata
├── snapshots         (ObjectStore) - SnapshotHash -> Snapshot
├── indexes           (ObjectStore) - Type -> IndexData
└── pending_sync      (ObjectStore) - Hash -> SyncStatus
```

### 9.2 Index Structures

```typescript
interface IndexData {
  type: 'by_conversation' | 'by_author' | 'by_timestamp';
  entries: Map<string, Hash[]>;  // Key -> Message IDs
}

interface SyncStatus {
  hash: Hash;
  status: 'pending' | 'syncing' | 'done' | 'failed';
  attempts: number;
  lastAttempt: ISO8601;
}
```

---

## 10. Migration Path (V1 → V2)

### Phase 1: Dual-Write
- Extractors produce both V1 (flat) and V2 (DAG) formats
- UI reads V1, writes V2 in background

### Phase 2: Validation
- Verify all V1 conversations imported as V2
- Signature verification passes
- DAG integrity checks pass

### Phase 3: Cutover
- UI reads V2, V1 becomes legacy export only
- Add migration tool to convert V1 exports

---

## 11. Implementation Checklist

- [ ] Core types (TypeScript)
- [ ] Hash utilities (SHA-256, content addressing)
- [ ] Crypto utilities (Ed25519 sign/verify)
- [ ] ObjectStore (IndexedDB wrapper)
- [ ] IndexStore (query layer)
- [ ] DAG operations (append, fork, edit, merge)
- [ ] Merkle tree generation and proofs
- [ ] CRDT merge logic
- [ ] P2P sync protocol
- [ ] V1 → V2 migration tool
- [ ] Export/Import functionality

---

## 12. References

- IPFS: Content addressing and DAG design
- Git: Branching and merge strategies
- Automerge: CRDT merge patterns
- Ethereum: Merkle Patricia Trees
- DID: Decentralized Identity specifications
