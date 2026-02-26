# VIVIM SDK Architecture Visualization

This document provides high-level visualizations of the VIVIM SDK architecture using Mermaid diagrams.

## 1. System Overview

The VIVIM SDK is a multi-layered toolkit that enables decentralized, local-first applications.

```mermaid
graph TD
    subgraph "Applications Layer"
        ACU[ACU Processor]
        Feed[OmniFeed]
        Social[Circle Engine]
        AIDoc[AI Documentation]
    end

    subgraph "SDK Core Layer"
        SDK[VivimSDK Core]
        RK[RecordKeeper]
        AP[Anchor Protocol]
        SD[Self-Design Module]
        Comm[Communication Layer]
    end

    subgraph "Nodes Layer"
        IdentityNode[Identity Node]
        StorageNode[Storage Node]
        ContentNode[Content Node]
        SocialNode[Social Node]
        AINode[AI Chat Node]
        MemoryNode[Memory Node]
    end

    subgraph "Infrastructure Layer"
        Network[P2P Network Engine]
        Storage[L0 Storage / SQLite]
        Blockchain[Chain of Trust]
    end

    ACU --> SDK
    Feed --> SDK
    Social --> SDK
    AIDoc --> SDK

    SDK --> RK
    SDK --> AP
    SDK --> SD
    SDK --> Comm

    Comm --> IdentityNode
    Comm --> StorageNode
    Comm --> ContentNode
    Comm --> SocialNode
    Comm --> AINode
    Comm --> MemoryNode

    IdentityNode --> Network
    StorageNode --> Storage
    RK --> Blockchain
    AP --> Blockchain
```

## 2. Chain of Trust Flow

The Chain of Trust ensures that every operation and node identity is cryptographically verified.

```mermaid
sequenceDiagram
    participant User
    participant SDK as VivimSDK
    participant ID as IdentityNode
    participant RK as RecordKeeper
    participant AP as AnchorProtocol
    participant P2P as Network Mesh

    User->>SDK: Initialize(config)
    SDK->>ID: Create/Load Identity
    ID-->>SDK: Signed Identity (DID)
    
    User->>SDK: Perform Operation (e.g. Store Data)
    SDK->>RK: CreateOperation(type, payload)
    RK->>RK: Hash & Sign Operation
    RK-->>SDK: SDKOperation (Signed)
    
    SDK->>AP: Trigger Anchor
    AP->>AP: Compute Merkle Root of State
    AP->>P2P: Broadcast Anchor State
    
    P2P-->>P2P: Validate & Sync
```

## 3. Node Lifecycle

How nodes are loaded, registered, and managed within the SDK.

```mermaid
stateDiagram-v2
    [*] --> Loading: sdk.loadNode(id)
    Loading --> Initialized: init(context)
    Initialized --> Running: start()
    Running --> Stopped: stop()
    Stopped --> Running: start()
    Stopped --> Destroyed: destroy()
    Destroyed --> [*]

    state Running {
        [*] --> Idle
        Idle --> Processing: Event Received
        Processing --> Idle: Task Complete
        Idle --> Error: Exception
        Error --> Idle: Recovery
    }
```

## 4. RecordKeeper Detail

The internal structure of the On-Chain Recordkeeping system.

```mermaid
classDiagram
    class VivimSDK {
        +getIdentity()
        +sign(data)
        +verify(data, sig, did)
    }
    class OnChainRecordKeeper {
        -operations: Map
        -pendingOps: SDKOperation[]
        +createOperation(type, payload)
        +confirmOperations(ids)
        +verifyChain(opId)
        +getAuditTrail()
    }
    class SDKOperation {
        +id: CID
        +type: SDKOperationType
        +author: DID
        +timestamp: number
        +payload: any
        +previousOps: CID[]
        +signature: string
        +status: Status
    }
    OnChainRecordKeeper --> VivimSDK : uses
    OnChainRecordKeeper *-- SDKOperation : manages
```

## 5. Deployment Topology

How VIVIM instances interact across the network.

```mermaid
graph LR
    subgraph "Peer A (Genesis)"
        NodeA[VIVIM Instance]
    end
    
    subgraph "Peer B (Primary)"
        NodeB[VIVIM Instance]
    end
    
    subgraph "Peer C (Clone)"
        NodeC[VIVIM Instance]
    end
    
    NodeA <-->|libp2p / GossipSub| NodeB
    NodeB <-->|Exit Node Protocol| NodeC
    NodeA <-->|Trust Delegation| NodeC
```

## 6. Data Flow & Recordkeeping

Detailed view of how data is processed and recorded.

```mermaid
graph LR
    Input[Data Input] --> Logic[SDK Node Logic]
    Logic --> RK[RecordKeeper]
    Logic --> Storage[L0 Storage]
    
    subgraph "Recordkeeping"
        RK --> Sign[Sign Operation]
        Sign --> Chain[Add to Operation Chain]
        Chain --> Proof[Generate Merkle Proof]
    end
    
    subgraph "Persistence"
        Storage --> SQLite[Bun-native SQLite]
        Storage --> IPFS[IPFS / Decentralized]
    end
    
    Proof --> Anchor[Anchor Protocol]
    Anchor --> Network[P2P Broadcast]
```

---

*These diagrams can be rendered using Mermaid.js compatible viewers (e.g., GitHub, VS Code Mermaid extension).*
