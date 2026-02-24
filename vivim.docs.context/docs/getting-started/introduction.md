---
sidebar_position: 1
title: Introduction
description: Welcome to VIVIM - Your Personal AI Memory Platform
---

# VIVIM

## Your Personal AI Memory Platform

**Capture. Remember. Connect.**

VIVIM is a decentralized platform that captures your AI conversations, indexes them, and retrieves the exact context you need—when you need it.

---

## The Problem

| Problem | Description |
|---------|-------------|
| 🔒 **Locked Away** | AI providers store your conversations. You can't access them, search them, or use them to teach future AI about you. |
| 🌊 **Ephemeral** | Chat histories disappear. Context windows are limited. Your knowledge evaporates when the conversation ends. |
| 🌍 **Siloed** | Your AI interactions exist in isolated silos—one for ChatGPT, another for Claude, another for Gemini. No connection between them. |

---

## The VIVIM Solution

### 🦾 Universal Capture
Capture conversations from **any AI provider**—ChatGPT, Claude, Gemini, Grok, Mistral, or your own API keys.

```mermaid
graph LR
    O[OpenAI] --> V[VIVIM]
    A[Anthropic] --> V
    G[Google] --> V
    X[xAI] --> V
    M[Mistral] --> V
    B[BYOK] --> V
    V --> S[Your Memory]
```

### 🧠 Dynamic Context
Every conversation is indexed, tagged, and ranked. When you chat with AI, VIVIM retrieves the **exact context you need**.

```mermaid
sequenceDiagram
    participant User
    participant VIVIM
    participant AI
    User->>VIVIM: Send message
    VIVIM->>VIVIM: Retrieve relevant memories
    VIVIM->>AI: Context + Query
    AI->>User: Rich response
```

---

## Core Features

| Feature | Description |
|---------|-------------|
| 🔐 **End-to-End Encrypted** | Your memories are encrypted. Only you can decrypt them. Zero-knowledge architecture. |
| 🌐 **P2P Decentralized** | No central server stores your data. Sync directly between devices using libp2p. |
| 📱 **Offline-First** | Works without internet. Sync when you're back online. |
| 🏛️ **Federated Social** | Share memories with Circles. Follow others. Build your network. |
| 💾 **Storage V2** | Content-addressed DAG storage with cryptographic verification. |
| 🔑 **BYOK** | Bring Your Own Key. Use your own API keys for maximum privacy and cost control. |
| 📊 **Context Pipeline** | Hyper-optimized streaming context pipelines with budget algorithms. |
| 🛡️ **Capability-Based Access** | Fine-grained permissions for sharing and collaboration. |

---

## Architecture Overview

```mermaid
flowchart TB
    subgraph Client
        PWA[PWA]
        Admin[Admin Panel]
    end
    
    subgraph Server
        API[REST API]
        Context[Context Engine]
        Capture[Capture Service]
    end
    
    subgraph Data
        DB[(PostgreSQL)]
        Redis[(Redis)]
        Vector[(Vector DB)]
    end
    
    subgraph Network
        P2P[P2P Network]
        CRDT[CRDT Sync]
        DHT[DHT]
    end
    
    PWA --> API
    Admin --> API
    API --> Context
    API --> Capture
    Context --> DB
    Context --> Vector
    Capture --> DB
    PWA <--> P2P
    P2P <--> CRDT
    P2P <--> DHT
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, TypeScript, Vite, PWA |
| **Backend** | Express.js, TypeScript |
| **Database** | PostgreSQL, Prisma |
| **Cache** | Redis |
| **Vector** | Embedding-based retrieval |
| **Network** | libp2p, Yjs CRDT |
| **Security** | E2E Encryption, Capability-based ACL |

---

## Quick Links

- **[Context Pipeline](/docs/architecture/pipeline)** - Hyper-optimized streaming context
- **[Storage V2](/docs/pwa/storage-v2)** - Content-addressed DAG storage
- **[BYOK](/docs/pwa/byok)** - Bring Your Own Key
- **[Security](/docs/network/security)** - E2E encryption & capabilities
- **[Development Guide](/docs/development/guide)** - Local setup
- **[Deployment](/docs/deployment/guide)** - Production deployment
