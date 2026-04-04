---
title: Visual Guides
description: Visual explanations of VIVIM processes and flows
---

# 🎬 Visual Guides

Visual explanations of VIVIM's key processes and connections.

---

## 🔄 How Data Flows Through VIVIM

### Complete User Journey

```mermaid
flowchart TD
    A[👤 User visits<br/>ChatGPT] -->|Copy URL| B[📋 VIVIM PWA]
    B -->|Capture| C[⚡ API Server]
    C -->|Extract| D[🔍 Parser]
    D -->|Store| E[💾 Database]
    E -->|Index| F[🔢 Vector DB]
    
    F -->|Later| G[🧠 Context Request]
    G -->|Query| H[📦 ACU Retrieval]
    H -->|Rank| I[🎯 Token Allocator]
    I -->|Build| J[📝 Context Bundle]
    J -->|Prompt| K[🤖 AI Provider]
    K -->|Response| L[👤 User]
    
    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style C fill:#45b7d1
    style E fill:#96ceb4
    style K fill:#ffeaa7
    style L fill:#dfe6e9
```

---

## 📥 Capture Process

```mermaid
flowchart LR
    subgraph "1. User Action"
        A[📋 URL Input] -->|Submit| B[🔄 Validate]
    end
    
    subgraph "2. Processing"
        B -->|Provider Detected| C[🌐 Fetch Content]
        C -->|HTML Response| D[🧩 Parse Messages]
        D -->|Extract| E[📝 Structure Data]
    end
    
    subgraph "3. Storage"
        E -->|Save| F[(💿 PostgreSQL)]
        E -->|Index| G[(🔢 Vector DB)]
        E -->|Cache| H[(⚡ Redis)]
    end
    
    subgraph "4. Response"
        F -->|Success| I[✅ Show in UI]
        G -->|Indexed| I
    end
```

---

## 🧠 Context Building Process

### The 8-Layer Pipeline

```mermaid
flowchart TB
    subgraph "User Message"
        UM[💬 "Help me with<br/>my React code"]
    end
    
    subgraph "L0: Identity Core"
        I0[👤 Your role,<br/>experience]
    end
    subgraph "L1: Preferences"
        I1[⚙️ Communication<br/>style]
    end
    subgraph "L2: Topic Context"
        I2[📚 Current topic<br/>profile]
    end
    subgraph "L3: Entity"
        I3[👥 Projects,<br/>people]
    end
    subgraph "L4: Conversation"
        I4[💭 This conversation<br/>summary]
    end
    subgraph "L5: JIT Memory"
        I5[⚡ On-demand<br/>retrieval]
    end
    subgraph "L6: History"
        I6[📜 Recent<br/>messages]
    end
    
    UM --> I0 & I1 & I2 & I3 & I4 & I5 & I6
    
    allLayers[All Layers] -->|Combine| bundle[📦 Context Bundle]
    
    I0 & I1 & I2 & I3 & I4 & I5 & I6 --> allLayers
```

### Token Allocation

```mermaid
pie title Token Budget Distribution (12K total)
    "L0 Identity" : 500
    "L1 Preferences" : 400
    "L2 Topics" : 3000
    "L3 Entities" : 1500
    "L4 Conversation" : 3000
    "L5 JIT Memory" : 2000
    "L6 History" : 800
    "L7 User Message" : 300
    "Buffer" : 500
```

---

## 🔄 Sync Process (P2P)

### How Devices Stay in Sync

```mermaid
sequenceDiagram
    participant D1 as 📱 Phone
    participant D2 as 💻 Laptop
    participant P2P as 🌐 P2P Network
    participant DB as 💾 Server DB
    
    D1->>D1: User makes change
    D1->>D1: Update local Yjs Doc
    D1->>P2P: Broadcast change
    
    P2P->>D2: Propagate change
    D2->>D2: Merge with CRDT
    
    rect rgb(200, 255, 200)
        Note over D1,D2: Conflict? Yjs auto-resolves!
    end
    
    D1->>DB: Background sync
    D2->>DB: Background sync
```

### CRDT Data Types

```mermaid
flowchart LR
    subgraph "Yjs Documents"
        YARRAY[Y.Array]
        YMAP[Y.Map]
        YTEXT[Y.Text]
    end
    
    subgraph "Used For"
        YARRAY -->|Messages| CONV[Conversations]
        YMAP -->|Settings| USER[User Profile]
        YTEXT -->|Content| MEM[Memories]
    end
```

---

## 🔐 Encryption Flow

### End-to-End Encryption

```mermaid
flowchart TB
    subgraph "🔑 Key Generation"
        A[👤 User] -->|Sign Up| B[🧬 Generate Keys]
        B -->|Public Key| C[☁️ Server]
        B -->|Private Key| D[🔐 Local Only]
    end
    
    subgraph "📝 Encrypt Content"
        E[New Message] -->|Encrypt| F[🔐 AES-256]
        F -->|Your Key| G[📦 Encrypted]
    end
    
    subgraph "🔓 Decrypt Content"
        G -->|Decrypt| H[🔐 AES-256]
        H -->|Your Key| I[📄 Plain Text]
    end
    
    C -.->|Can't read| G
    D -->|Can decrypt| H
```

---

## 📤 Sharing Process

```mermaid
flowchart TD
    A[👤 Owner] -->|Select| B[💬 Conversation]
    B -->|Click Share| C[⚙️ Set Options]
    
    C -->|Recipient DID| D[🔐 Encrypt]
    D -->|Key only they have| E[📦 Encrypted Bundle]
    
    E -->|Generate| F[🔗 Share Link]
    E -->|Generate| G[📱 QR Code]
    
    F -->|Send| H[👤 Recipient]
    G -->|Scan| H
    
    H -->|Open Link| I[🔓 Decrypt]
    I -->|Owner's Key| J[📄 View Content]
    
    J -->|Save| K[📚 Their Library]
```

---

## 🌐 Network Topology

### Node Types in VIVIM

```mermaid
flowchart TB
    subgraph "VIVIM Network"
        
        subgraph "Client Nodes"
            C1[📱 Mobile]
            C2[💻 Desktop]
        end
        
        subgraph "Edge Nodes"
            E1[⚡ Edge 1]
            E2[⚡ Edge 2]
        end
        
        subgraph "Relay Nodes"
            R1[🔄 Relay]
            R2[🔄 Relay]
        end
        
        subgraph "Storage Nodes"
            S1[💾 Storage 1]
            S2[💾 Storage 2]
        end
        
        subgraph "Bootstrap"
            B[🚀 Bootstrap]
        end
        
        C1 & C2 -->|Connect| E1 & E2
        C1 & C2 -->|Fallback| R1 & R2
        
        E1 & E2 -->|Route| R1 & R2
        R1 & R2 -->|Discover| B
        
        E1 & E2 -->|Store/Retreive| S1 & S2
    end
```

---

## 📊 Monitoring & Telemetry

### Admin Panel Architecture

```mermaid
flowchart LR
    subgraph "Data Sources"
        API[⚡ API Metrics]
        WS[🔌 WebSocket]
        P2P[🌐 P2P Network]
        DB[💾 Database]
    end
    
    subgraph "Admin Panels"
        LOGS[📝 Logs]
        METRICS[📊 Metrics]
        NETWORK[🌐 Network]
        DB_PANEL[💿 Database]
    end
    
    API --> LOGS & METRICS
    WS --> LOGS
    P2P --> NETWORK
    DB --> DB_PANEL
```

---

## 🔗 Related Guides

| Guide | Description |
|-------|-------------|
| [Architecture Overview](/architecture/overview) | Full system architecture |
| [Context Engine](/architecture/context) | Deep dive into context pipeline |
| [Network Overview](/network/overview) | P2P networking details |
| [Database Schema](/database/schema) | Data models |
| [Sync Architecture](/architecture/sync) | Synchronization details |
