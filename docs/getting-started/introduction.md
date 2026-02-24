---
sidebar_position: 1
title: Introduction
description: Welcome to VIVIM - Your Personal AI Memory Platform
---

# VIVIM - Own Your AI

VIVIM is a decentralized AI memory and capture platform that allows users to capture, store, and interact with their AI conversations across multiple providers. The platform emphasizes user ownership, privacy, and seamless integration with AI assistants.

## Vision

VIVIM aims to be your "personal digital brain" - a system that captures and understands your interactions with AI assistants, making your knowledge accessible and useful across contexts.

## Core Principles

1. **User Ownership** - Your data belongs to you, not the AI providers
2. **Privacy First** - End-to-end encryption and isolated user contexts
3. **Decentralization** - P2P sync and federated architecture
4. **Universal Capture** - Support for multiple AI providers (ChatGPT, Claude, Gemini, etc.)

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        PWA[PWA Frontend]
        Admin[Admin Panel]
    end
    
    subgraph "Server Layer"
        API[API Server]
        Context[Dynamic Context Engine]
        Capture[Capture Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Redis[(Redis)]
        Vector[(Vector Store)]
    end
    
    subgraph "Network Layer"
        P2P[P2P Network]
        CRDT[CRDT Sync]
        DHT[DHT Discovery]
    end
    
    PWA --> API
    Admin --> API
    API --> Context
    API --> Capture
    Context --> DB
    Context --> Vector
    Capture --> DB
    PWA --> P2P
    P2P --> CRDT
    P2P --> DHT
```

---

## System Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **PWA** | React + TypeScript | Frontend application for capturing and viewing conversations |
| **Server** | Express + TypeScript | RESTful API, WebSocket support, context engine |
| **Network** | libp2p + Yjs | P2P networking, CRDT synchronization |
| **Database** | PostgreSQL + Prisma | Primary data store with full-text search |
| **Cache** | Redis | Session management, caching, pub/sub |
| **Admin Panel** | React + Recharts | System monitoring and management dashboard |

---

## Getting Started

Explore the documentation by selecting a topic from the sidebar:

- **[Architecture](/docs/architecture/overview)** - Deep dive into system design
- **[API Reference](/docs/api/overview)** - REST API documentation
- **[PWA Frontend](/docs/pwa/overview)** - Frontend application guide
- **[Network Layer](/docs/network/overview)** - P2P and sync architecture
- **[Database Schema](/docs/database/schema)** - Data models and relationships
