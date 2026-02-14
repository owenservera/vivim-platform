# VIVIM Architecture Overview

**Purpose**: High-level architecture for fully isolated per-user databases with 100% isolated context engines

---

## Executive Summary

### Your Vision
- **Each user has their own fully isolated database** - SQLite files
- **Each user has their own fully isolated context engine** - no shared service
- **User owns their intelligence** - topic profiles, entity profiles, context bundles
- **Master database only for identity/auth** - minimal shared state

### Current Architecture
Single shared PostgreSQL database with row-level isolation via `userId` foreign keys. Every component uses a single global PrismaClient.

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TARGET ISOLATED ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────┘

  MASTER DATABASE (PostgreSQL)              USER A ENV              USER B ENV
  ┌────────────────────────┐                ┌──────────┐            ┌──────────┐
  │  Identity (DID, PK)   │                │SQLite DB │            │SQLite DB │
  │  Auth Sessions        │                │          │            │          │
  │  Device Registry      │                │Conversa- │            │Conversa- │
  │  Cross-User Circles  │                │tions     │            │tions     │
  │  Sharing Policies     │                │          │            │          │
  └──────────┬───────────┘                │   ACUs   │            │   ACUs   │
             │                             │          │            │          │
             │ AUTH ONLY                   │Profiles  │            │Profiles  │
             ▼                             │          │            │          │
  ┌─────────────────────────────────┐     │Context   │            │Context   │
  │       AUTH GATEWAY              │     │Bundles   │            │Bundles   │
  │   (Validates DID, returns      │     │          │            │          │
  │    user context for routing)   │     │          │            │          │
  └───────────────┬─────────────────┘     └────┬─────┘            └────┬─────┘
                  │                              │                     │
                  │        ┌─────────────────────┴─────────────────────┘
                  │        │
                  ▼        ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      PER-USER ISOLATED CONTEXT ENGINE                    │
  │  ┌─────────────────────────────────────────────────────────────────────┐│
  │  │  ContextOrchestrator (USER-ISOLATED INSTANCE)                       ││
  │  │  - Own PrismaClient (pointing to user DB)                         ││
  │  │  - Own ProfileRollupService                                       ││
  │  │  - Own BundleCompiler                                             ││
  │  │  - Reads/Writes ONLY to user's database                           ││
  │  └─────────────────────────────────────────────────────────────────────┘│
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Summary

### Capture Flow (Data Ingestion)
```
External Source → Auth → Master DB (user lookup) → User DB (conversation + ACUs)
```

### Context Flow (Intelligence)
```
User Request → Context Engine (per-user instance) → User DB (query) → User DB (write)
```

### Auth Flow
```
Request → Master DB (validate DID/PK) → Return userId + routing info
```

---

## Key Principle

| Component | Ownership | Location |
|-----------|-----------|----------|
| User Identity | Shared | Master DB (PostgreSQL) |
| User Data | User-owned | User DB (SQLite) |
| Context Engine | User-owned | Per-user instance |
| Topic/Entity Profiles | User-owned | User DB (SQLite) |
| Context Bundles | User-owned | User DB (SQLite) |
| Cross-user relationships | Shared | Master DB (PostgreSQL) |

---

## Files in This Analysis

| Document | Content |
|----------|---------|
| `01-architecture-overview.md` | This file - high-level architecture |
| `02-capture-pipeline.md` | Data ingestion analysis |
| `03-context-engine.md` | Context system analysis |
| `04-identity-auth.md` | Identity/auth analysis |
| `05-model-classification.md` | Database model ownership |
| `06-implementation-roadmap.md` | Implementation guide |

---

*Created: 2026-02-14*
