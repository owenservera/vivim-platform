# OpenScroll On-Chain Bridge Design

**Version:** 1.0.0
**Date:** January 23, 2026
**Status:** DRAFT

## 1. Overview

The On-Chain Bridge enables OpenScroll conversations to be anchored to blockchain infrastructure for:
- **Permanence:** Immutable timestamping and existence proofs
- **Discovery:** Public registries without central servers
- **Verification:** Cryptographic proofs of conversation integrity
- **Transfer:** Asset-like transfer of conversation ownership

### 1.1 Design Philosophy

1. **Minimal On-Chain Data:** Only store Merkle roots and metadata
2. **Off-Chain Storage:** Full content stored locally or on IPFS
3. **Optional Anchoring:** Users choose what to anchor
4. **Privacy Preserving:** Private conversations stay private
5. **Multi-Chain:** Support multiple blockchains

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         OpenScroll Client                        │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  Storage    │  │   DAG Engine │  │   Bridge Manager        │ │
│  │  (IndexedDB)│  │  (DAG+CRDT) │  │   - Anchor               │ │
│  └─────────────┘  └──────────────┘  │   - Verify               │ │
│                                       │   - Sync                 │ │
│                                       └───────────┬─────────────┘ │
└───────────────────────────────────────────────────┼───────────────┘
                                                    │
                                    ┌───────────────┴───────────┐
                                    │   On-Chain Bridge API     │
                                    │   (REST / GraphQL)        │
                                    └───────────────┬───────────┘
                                                    │
        ┌───────────────────────────────────────────┼──────────────────┐
        │                                           │                   │
┌───────▼─────────┐  ┌─────────────┐  ┌────────────▼─────────┐  ┌───▼──────────┐
│  Ethereum L2    │  │  Celestia    │  │  Optimism           │  │  Arweave     │
│  (Rollups)      │  │  (Storage)   │  │  (Low Cost)         │  │  (Permastore)│
└─────────────────┘  └─────────────┘  └─────────────────────┘  └──────────────┘
```

---

## 3. On-Chain Data Structures

### 3.1 Conversation Anchor

```solidity
struct ConversationAnchor {
    bytes32 conversationId;     // Hash of conversation root
    bytes32 merkleRoot;         // Merkle root of all messages
    uint256 messageCount;       // Total messages
    uint256 timestamp;          // Block timestamp
    address owner;              // Owner's address
    bytes metadata;             // Optional metadata hash
}
```

### 3.2 Message Proof

```solidity
struct MessageProof {
    bytes32 conversationId;     // Conversation this belongs to
    bytes32 messageHash;        // Hash of the message
    bytes32[] merklePath;       // Merkle proof path
    uint8[] directions;         // 0 = left, 1 = right for each step
}
```

### 3.3 Ownership Transfer

```solidity
struct OwnershipTransfer {
    bytes32 conversationId;
    address from;
    address to;
    uint256 timestamp;
    bytes signature;            // Previous owner's signature
}
```

---

## 4. Smart Contract Interface

### 4.1 Main Anchor Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOpenScrollAnchor {
    // Anchor a conversation
    function anchorConversation(
        bytes32 conversationId,
        bytes32 merkleRoot,
        uint256 messageCount,
        bytes calldata metadata
    ) external returns (uint256);

    // Update an existing anchor (new messages added)
    function updateAnchor(
        bytes32 conversationId,
        bytes32 newMerkleRoot,
        uint256 newMessageCount,
        bytes32[] calldata addedMessageHashes
    ) external;

    // Verify a message belongs to a conversation
    function verifyMessage(
        MessageProof calldata proof
    ) external pure returns (bool);

    // Transfer ownership
    function transferOwnership(
        bytes32 conversationId,
        address to,
        bytes calldata signature
    ) external;

    // Get anchor by conversation ID
    function getAnchor(bytes32 conversationId)
        external view returns (ConversationAnchor memory);

    // Check if caller owns the conversation
    function isOwner(bytes32 conversationId, address user)
        external view returns (bool);
}
```

### 4.2 Events

```solidity
event ConversationAnchored(
    bytes32 indexed conversationId,
    bytes32 merkleRoot,
    uint256 messageCount,
    address indexed owner,
    uint256 timestamp
);

event AnchorUpdated(
    bytes32 indexed conversationId,
    bytes32 oldMerkleRoot,
    bytes32 newMerkleRoot,
    uint256 messageCount
);

event OwnershipTransferred(
    bytes32 indexed conversationId,
    address indexed from,
    address indexed to
);
```

---

## 5. Bridge Operations

### 5.1 Anchoring a Conversation

```
Client Side:
1. Compute Merkle root of all messages
2. Create anchor payload
3. Sign with wallet
4. Submit transaction

On-Chain:
1. Verify signature
2. Store anchor data
3. Emit ConversationAnchored event
4. Return anchor ID
```

### 5.2 Verifying a Message

```
Client Side:
1. Get anchor from contract (conversationId -> merkleRoot)
2. Generate Merkle proof for message
3. Call verifyMessage on contract (or verify locally)

On-Chain:
1. Recompute Merkle root from proof
2. Compare to stored root
3. Return true/false
```

### 5.3 Updating an Anchor

```
Client Side:
1. Add new messages locally
2. Compute new Merkle root
3. Prove old messages are included
4. Submit update transaction

On-Chain:
1. Verify caller is owner
2. Update stored anchor
3. Emit AnchorUpdated event
```

---

## 6. Gas Optimization Strategies

### 6.1 Batch Anchoring

Anchor multiple conversations in a single transaction:

```solidity
function batchAnchor(
    bytes32[] calldata conversationIds,
    bytes32[] calldata merkleRoots,
    uint256[] calldata messageCounts
) external {
    require(
        conversationIds.length == merkleRoots.length &&
        conversationIds.length == messageCounts.length,
        "Length mismatch"
    );

    for (uint i = 0; i < conversationIds.length; i++) {
        _anchorSingle(
            conversationIds[i],
            merkleRoots[i],
            messageCounts[i]
        );
    }
}
```

### 6.2 Lazy Updates

Only update anchors when needed (e.g., before sharing publicly).

### 6.3 Rollup Support

Use L2 solutions (Optimism, Arbitrum, Base) for lower fees:

```
┌─────────────────────────────────────────────┐
│           L1 (Ethereum Mainnet)            │
│  - Final security                           │
│  - Data availability                        │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           L2 (Optimism/Base)               │
│  - Low cost anchoring                       │
│  - Fast confirmations                       │
└─────────────────────────────────────────────┘
```

---

## 7. Privacy Models

### 7.1 Public Anchors

Anyone can verify the conversation exists and retrieve Merkle proofs.

```
Anchor: {
    merkleRoot: "0xabc...",
    messageCount: 42,
    visibility: "public"
}
```

### 7.2 Private Anchors

Only existence is proven; content hashes are blinded.

```
Anchor: {
    merkleRoot: "0xdef...",  // Hash of encrypted content
    messageCount: 42,
    visibility: "private",
    contentKeyHash: "0x123..."  // Hash of decryption key
}
```

### 7.3 Selective Disclosure

Some messages public, some private:

```
Merkle Tree:
├── Public Branch
│   ├── Msg A (public)
│   └── Msg B (public)
└── Private Branch
    ├── Msg C (encrypted)
    └── Msg D (encrypted)
```

---

## 8. IPFS Integration

### 8.1 Content Addressing

Store full conversation on IPFS, anchor CID on-chain:

```solidity
struct IPFSAnchor {
    bytes32 conversationId;
    string ipfsCID;          // IPFS content identifier
    bytes32 contentHash;     // SHA-256 for verification
    uint256 size;            // Content size in bytes
}
```

### 8.2 Pinning Services

```
Client -> IPFS Gateway -> Pinata/Essence/Web3Storage
                      ↓
                 Content Pinned
                      ↓
                 CID Returned
                      ↓
           Anchor CID on-chain
```

### 8.3 Retrieval

```
1. Get CID from on-chain anchor
2. Fetch from IPFS (via gateway or direct)
3. Verify content hash matches
4. Load into local storage
```

---

## 9. Multi-Chain Support

### 9.1 Chain Registry

```solidity
contract ChainRegistry {
    mapping(bytes32 => address) public chainAnchors;

    function registerChain(
        bytes32 chainId,
        address anchorContract
    ) external {
        chainAnchors[chainId] = anchorContract;
    }

    function getAnchorContract(bytes32 chainId)
        external view returns (address)
    {
        return chainAnchors[chainId];
    }
}
```

### 9.2 Cross-Chain Verification

```
1. Anchor on Ethereum (primary chain)
2. Mirror Merkle root to Optimism (for low-cost verification)
3. User can choose which chain to verify against
```

---

## 10. Client Implementation

### 10.1 Bridge Manager

```typescript
class BridgeManager {
  private wallet: ethers.Wallet;
  private contracts: Map<string, Contract>;

  async anchorConversation(
    conversationId: Hash,
    merkleRoot: Hash,
    chain: string = 'ethereum'
  ): Promise<TransactionResponse> {
    const contract = this.getContract(chain);
    const tx = await contract.anchorConversation(
      conversationId,
      merkleRoot,
      messageCount,
      metadata
    );
    return tx.wait();
  }

  async verifyOnChain(
    conversationId: Hash,
    messageHash: Hash,
    proof: MerkleProof,
    chain: string = 'ethereum'
  ): Promise<boolean> {
    const contract = this.getContract(chain);
    return contract.verifyMessage({
      conversationId,
      messageHash,
      merklePath: proof.path,
      directions: proof.directions
    });
  }
}
```

### 10.2 Gas Estimation

```typescript
async function estimateGasCost(
    messageCount: number
): Promise<ETH> {
    const ESTIMATES = {
        ethereum: { base: 50000, perMessage: 5000 },
        optimism: { base: 1000, perMessage: 100 },
        base: { base: 1000, perMessage: 100 },
        arbitrum: { base: 1500, perMessage: 150 }
    };

    const chain = 'optimism';
    const gas = ESTIMATES[chain].base +
                (ESTIMATES[chain].perMessage * messageCount);
    const gasPrice = await provider.getGasPrice();

    return (gas * gasPrice) / 1e18;
}
```

---

## 11. Cost Estimates (as of Jan 2026)

| Operation | Ethereum | Optimism/Base | Arbitrum |
|-----------|----------|---------------|----------|
| New Anchor | $5-20 | $0.01-0.05 | $0.02-0.10 |
| Update Anchor | $2-10 | $0.005-0.02 | $0.01-0.05 |
| Verify (on-chain) | $0.50-2 | $0.001-0.005 | $0.002-0.01 |
| Verify (off-chain) | $0 | $0 | $0 |

*Note: Verify can be done off-chain by reading contract state*

---

## 12. Roadmap

### Phase 1: Basic Anchoring (Q1 2026)
- [ ] Deploy anchor contract on Optimism
- [ ] Implement client-side bridge manager
- [ ] Basic anchor and verify functions

### Phase 2: IPFS Integration (Q2 2026)
- [ ] IPFS upload integration
- [ ] CID anchoring
- [ ] Pinning service integration

### Phase 3: Privacy (Q3 2026)
- [ ] Private anchor model
- [ ] Encryption for IPFS content
- [ ] Selective disclosure

### Phase 4: Multi-Chain (Q4 2026)
- [ ] Support for Base, Arbitrum
- [ ] Cross-chain verification
- [ ] Chain registry contract

---

## 13. Security Considerations

### 13.1 Front-Running Protection

```solidity
mapping(bytes32 => uint256) public nonce;

function anchorWithNonce(
    bytes32 conversationId,
    bytes32 merkleRoot,
    uint256 nonce,
    bytes calldata signature
) external {
    // Verify nonce matches
    // Prevent front-running
}
```

### 13.2 Replay Protection

Include chain ID and nonce in all signed messages.

### 13.3 Reentrancy Guards

```solidity
modifier nonReentrant() {
    require(_status != _ENTERED, "ReentrancyGuard");
    _status = _ENTERED;
    _;
    _status = _NOT_ENTERED;
}
```

---

## 14. References

- EIP-191: Signed Data Standard
- EIP-712: Ethereum typed structured data
- EIP-1559: Fee market change
- IPFS: Content addressing
- Celestia: Data availability layer
- Optimism: Optimistic rollups
