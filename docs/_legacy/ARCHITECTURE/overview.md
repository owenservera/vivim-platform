---
sidebar_position: 1
title: Architecture Overview
description: VIVIM System Architecture
---

# Architecture Overview

This document provides a comprehensive overview of the VIVIM system architecture, including the major components, data flows, and design decisions.

## High-Level Architecture

```mermaid
flowchart TB
    subgraph "External Services"
        AI[AI Providers]
        OAUTH[OAuth Providers]
    end
    
    subgraph "Client Applications"
        PWA[VIVIM PWA]
        ADMIN[Admin Panel]
    end
    
    subgraph "VIVIM Backend"
        LB[Load Balancer]
        
        subgraph "API Cluster"
            REST[REST API]
            WS[WebSocket Server]
        end
        
        subgraph "Services"
            CAP[Capture Service]
            CTX[Context Engine]
            SYNC[Sync Service]
            MEM[Memory Service]
        end
        
        subgraph "Workers"
            WARMUP[Context Warmup]
            LIB[Librarian Worker]
            EXTRACT[Extraction Worker]
        end
    end
    
    subgraph "Data Infrastructure"
        PG[(PostgreSQL)]
        REDIS[(Redis)]
        VEC[(Vector Store)]
        S3[(Object Storage)]
    end
    
    subgraph "Network Engine"
        P2P[P2P Node]
        GOSSIP[GossipSub]
        FED[Federation]
    end
    
    AI -->|Capture| CAP
    OAUTH -->|Auth| REST
    PWA -->|API| REST
    PWA -->|WS| WS
    ADMIN -->|API| REST
    
    REST --> CAP
    REST --> CTX
    REST --> SYNC
    REST --> MEM
    
    CAP --> PG
    CTX --> PG
    CTX --> VEC
    SYNC --> PG
    MEM --> PG
    
    CAP --> S3
    CTX --> REDIS
    
    PWA --> P2P
    P2P --> GOSSIP
    P2P --> FED
```

---

## Component Responsibilities

### API Server (`/server`)

The API server is the central hub for all client communications, handling:

- **Authentication**: OAuth 2.0 (Google), session-based auth, API keys
- **REST Endpoints**: CRUD operations for conversations, users, ACUs
- **WebSocket**: Real-time updates, sync notifications
- **Context Assembly**: Dynamic context generation for AI prompts

### PWA Frontend (`/pwa`)

The Progressive Web App provides:

- **Conversation Capture**: URL-based extraction from AI providers
- **Content Rendering**: Rich content display (code, images, tables, mermaid)
- **Offline Support**: Service workers for offline functionality
- **Real-time Sync**: WebSocket connection for live updates

### Network Engine (`/network`)

Decentralized P2P layer enabling:

- **Peer Discovery**: DHT-based peer finding
- **Data Sync**: CRDT-based conflict-free replication
- **Federation**: Cross-instance communication
- **E2E Encryption**: Secure peer-to-peer messaging

---

## Data Flow: Conversation Capture

```mermaid
sequenceDiagram
    participant U as User
    participant PWA as PWA Frontend
    participant API as API Server
    participant CAP as Capture Service
    participant DB as Database
    participant VEC as Vector Store

    U->>PWA: Enter AI Chat URL
    PWA->>API: POST /api/v1/capture
    
    API->>CAP: Forward Capture Request
    CAP->>CAP: Validate URL & Provider
    
    alt Provider Supported
        CAP->>CAP: Extract Content
        CAP->>CAP: Parse Messages
        CAP->>CAP: Generate ACUs
        
        CAP->>DB: Store Conversation
        CAP->>DB: Store Messages
        CAP->>DB: Store ACUs
        
        CAP->>VEC: Generate Embeddings
        VEC->>VEC: Store Vector Data
        
        DB-->>CAP: Confirmation
        CAP-->>API: Success Response
        API-->>PWA: 200 OK + Conversation ID
        
        PWA->>U: Display Captured Content
    else Provider Not Supported
        CAP-->>API: Error: Unsupported Provider
        API-->>PWA: 400 Error
        PWA->>U: Show Error Message
    end
```

---

## Data Flow: Context Injection

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant API as Context API
    participant PIPELINE as Parallel Pipeline
    participant ASSEMBLER as Context Assembler
    participant DB as Database
    participant VEC as Vector Store

    AI->>API: Request Context for Prompt
    API->>PIPELINE: Create Context Request
    
    rect rgb(240, 248, 255)
        Note over PIPELINE: Parallel Retrieval
        PIPELINE->>DB: Query Explicit Matches
        PIPELINE->>VEC: Semantic Search
        PIPELINE->>DB: Query Memories
        PIPELINE->>VEC: Query Topics
    end
    
    PIPELINE-->>ASSEMBLER: Retrieved Context Items
    
    ASSEMBLER->>ASSEMBLER: Calculate Token Budget
    ASSEMBLER->>ASSEMBLER: Apply Priority Rules
    ASSEMBLER->>ASSEMBLER: Format for LLM
    
    ASSEMBLER-->>API: Assembled Context Bundle
    API-->>AI: Context in Prompt
    
    AI->>AI: Generate Response with Context
```

---

## API Route Structure

```mermaid
graph LR
    subgraph "API v1 (/api/v1)"
        CAP[capture]
        CONV[conversations]
        ACU[acus]
        MEM[memory]
        SYNC[sync]
        FEED[feed]
        ID[identity]
    end
    
    subgraph "API v2 (/api/v2)"
        CIRC[circles]
        SHAR[sharing]
        FEEDv2[feed-v2]
        PORT[portability]
    end
    
    subgraph "Admin (/api/admin)"
        SYS[system]
        NET[network]
        DB[database]
        CRDT[crdt]
    end
    
    subgraph "Special (/api)"
        UNI[unified]
        OMNI[omni]
        AI[ai/*]
    end
```

---

## Security Architecture

```mermaid
flowchart TB
    subgraph "Client Security"
        E2E[End-to-End Encryption]
        KEYS[Key Management]
        DEV[Device Trust]
    end
    
    subgraph "Transport Security"
        TLS[TLS 1.3]
        CORS[CORS Policies]
        RATE[Rate Limiting]
    end
    
    subgraph "Application Security"
        AUTH[Authentication]
        PERM[Authorization]
        VAL[Input Validation]
    end
    
    subgraph "Data Security"
        ENC[Encryption at Rest]
        MASK[Data Masking]
        AUDIT[Audit Logging]
    end
    
    E2E --> TLS
    KEYS --> TLS
    DEV --> AUTH
    
    TLS --> AUTH
    CORS --> AUTH
    RATE --> AUTH
    
    AUTH --> PERM
    PERM --> VAL
    
    VAL --> ENC
    ENC --> MASK
    MASK --> AUDIT
```

---

## Next Steps

- [Server Architecture](/docs/architecture/server) - Detailed API and services
- [Context Engine](/docs/architecture/context) - Dynamic context system
- [Network Layer](/docs/network/overview) - P2P and sync details
- [Database Schema](/docs/database/schema) - Data models
