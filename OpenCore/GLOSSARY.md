# VIVIM Open Core — Glossary

## Terms and Definitions

### ACU (Atomic Chat Unit)
The fundamental unit of memory in VIVIM. An individually addressable, classified, embedded, and searchable unit of AI memory. Not a message — the smallest meaningful piece of memory extracted from a conversation.

### Context Engine
The system that assembles the right memory for every AI interaction. Uses an 8-layer architecture (L0-L7) to build precisely budgeted context windows.

### DID (Decentralized Identifier)
W3C-compliant identifier for self-sovereign identity. VIVIM uses DIDs as the root of every user's AI identity.

### Open Core
A business model where the core product is open source (free), and commercial revenue comes from added features (managed services, enterprise features).

### Sovereignty
The principle that users own and control their data, identity, and AI memory without dependency on any vendor.

### Zero-Knowledge
A security architecture where the server never sees plaintext user data. Encryption/decryption happens client-side.

---

## Memory Types

| Type | Description | Example |
|------|-------------|---------|
| **Episodic** | Specific events or interactions | "User asked about React hooks yesterday" |
| **Semantic** | Factual knowledge & concepts | "User prefers TypeScript over JavaScript" |
| **Procedural** | How-to knowledge & steps | "User's pattern for debugging: check logs, then re-run" |
| **Factual** | Hard facts about user/environment | "User's name is Sarah, works at Acme Corp" |
| **Preference** | Likes, dislikes, style | "User prefers concise responses with code examples" |
| **Identity** | Core identity information | "User is a senior frontend developer" |
| **Relationship** | How user relates to others | "User collaborates with Alex on side projects" |
| **Goal** | Objectives and aspirations | "User building a SaaS for task management" |
| **Project** | Active work and context | "Current project: building a React component library" |

---

## Context Layers (L0-L7)

| Layer | Name | Budget | Purpose |
|-------|------|--------|---------|
| **L7** | Live Input | ~500 tokens | Current user message |
| **L6** | Message History | ~3000 tokens | Recent conversation turns |
| **L5** | JIT Retrieval | ~3000 tokens | Dynamically retrieved relevant memories |
| **L4** | Conversation Arc | ~2000 tokens | Long-term thread understanding |
| **L3** | Entity Context | ~1500 tokens | People, projects, technologies active |
| **L2** | Topic Context | ~1000 tokens | Subject matter domain |
| **L1** | Global Preferences | ~500 tokens | User settings, communication style |
| **L0** | Identity Core | ~300 tokens | Who is this? (DID, profile, role) |

---

## Technical Terms

| Term | Definition |
|------|------------|
| **CRDT** | Conflict-free Replicated Data Type — enables conflict-free synchronization across devices |
| **DAG** | Directed Acyclic Graph — VIVIM's storage structure for content-addressed data |
| **MCP** | Model Context Protocol — standard for exposing tools to AI assistants |
| **Merkle Tree** | Cryptographic structure for verifying data integrity |
| **Vector Embedding** | Numerical representation of semantic content for similarity search |
| **JIT Retrieval** | Just-in-Time Retrieval — dynamic memory retrieval based on query relevance |

---

## Commercial Tiers

| Tier | Target | Key Features |
|------|--------|--------------|
| **Open Source** | Developers, individuals | Full SDK, self-hosting, MCP server |
| **VIVIM Cloud** | Individuals | Managed hosting, convenience |
| **VIVIM Teams** | Small organizations | Shared knowledge, RBAC |
| **VIVIM Enterprise** | Regulated industries | SOC 2, HIPAA, audit logs, SLA |

---

## Abbreviations

| Abbreviation | Full Form |
|--------------|-----------|
| ACU | Atomic Chat Unit |
| DID | Decentralized Identifier |
| MCP | Model Context Protocol |
| CRDT | Conflict-free Replicated Data Type |
| DAG | Directed Acyclic Graph |
| SDK | Software Development Kit |
| PWA | Progressive Web App |
| P2P | Peer-to-Peer |
| RBAC | Role-Based Access Control |
| SSO | Single Sign-On |
| SAML | Security Assertion Markup Language |
| SCIM | System for Cross-domain Identity Management |

---

*Document version: 1.0*
*Purpose: Glossary of terms for VIVIM Open Core*
*Last updated: March 2026*
