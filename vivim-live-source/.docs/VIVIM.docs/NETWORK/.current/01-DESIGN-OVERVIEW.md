# VIVIM Network Sharing System - Design Overview

## Executive Summary

This document outlines the architecture for VIVIM's state-of-the-art network sharing system. The system is designed to provide intelligent content sharing, tracking, and publishing capabilities that honor user intent while enabling a decentralized, privacy-preserving network of AI conversations.

The sharing system consists of four interconnected layers:

1. **Sharing Intent Layer** - Captures and processes user sharing decisions
2. **Content Publishing Pipeline** - Transforms, encrypts, and routes shared content
3. **Network Orchestration Layer** - Manages peer-to-peer distribution and storage
4. **Analytics & Insights Layer** - Provides visibility into sharing patterns

## Database Architecture

VIVIM uses a dual-database architecture for complete user data isolation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DUAL-DATABASE ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────┐    ┌─────────────────────────────┐ │
│  │    MASTER DATABASE (PostgreSQL)      │    │   USER DATABASES (SQLite) │ │
│  │  ┌───────────────────────────────┐  │    │   ┌─────────────────────┐ │ │
│  │  │  Identity & Authentication    │  │    │   │   Per-User SQLite   │ │ │
│  │  │  - User (DID, public key)    │  │    │   │   Database          │ │ │
│  │  │  - Device Registry           │  │    │   │                     │ │ │
│  │  │  - Auth Sessions            │  │    │   │  - Conversations    │ │ │
│  │  └───────────────────────────────┘  │    │   │  - Messages         │ │ │
│  │  ┌───────────────────────────────┐  │    │   │  - ACUs             │ │ │
│  │  │  Cross-User Data             │  │    │   │  - Profiles         │ │ │
│  │  │  - Circle                    │  │    │   │  - Context Bundles  │ │ │
│  │  │  - CircleMember              │  │    │   │  - Memories         │ │ │
│  │  │  - PeerConnection            │  │    │   │  - Notebooks        │ │ │
│  │  │  - SharingIntent (refs)      │  │    │   └─────────────────────┘ │ │
│  │  │  - ShareLink                 │  │    │                            │ │
│  │  │  - ContentRecord (refs)      │  │    │   Each user gets their  │ │
│  │  │  - AnalyticsEvent (refs)     │  │    │   own isolated database │ │
│  │  └───────────────────────────────┘  │    │   file: {userDid}.db    │ │
│  └─────────────────────────────────────┘    └─────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    USER DATABASE MANAGER                                 │ │
│  │  - Creates per-user SQLite databases on registration                    │ │
│  │  - Routes queries to correct user database based on DID                │ │
│  │  - Ensures complete data isolation between users                      │ │
│  │  - Manages database lifecycle (create, delete, migrate)               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Classification

| Classification | Location | Description |
|---------------|----------|-------------|
| **MASTER** | PostgreSQL | Identity, auth, device registry |
| **CROSS** | PostgreSQL | Circles, CircleMembers, PeerConnections, Sharing metadata |
| **USER** | SQLite (per-user) | All personal content and intelligence |
| **SYSTEM** | PostgreSQL | Aggregated stats, global config |

### Sharing Data Location

Sharing-related data is distributed across both databases:

- **Master DB (PostgreSQL)**: SharingIntent references, ShareLink, ContentRecord references, AnalyticsEvent references
- **User DB (SQLite)**: Original content being shared (Conversations, ACUs) - the actual content stays in user's isolated database

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PWA FRONTEND                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Share Dialog│  │Privacy Mgr  │  │Circle Select│  │Share Preview│      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │                │                │                │              │
│         └────────────────┼────────────────┼────────────────┘              │
│                          ▼                                                  │
│              ┌─────────────────────────┐                                   │
│              │   Sharing Intent API    │                                   │
│              └────────────┬────────────┘                                   │
└───────────────────────────┼───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           SERVER                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SHARING INTENT SERVICE                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │    │
│  │  │Intent Decoder│  │Policy Engine │  │ Sharing Analytics    │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                       │
│  ┌──────────────────────────────────┼───────────────────────────────────┐   │
│  │              CONTENT PUBLISHING PIPELINE                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │   │
│  │  │Content Filter│  │Crypto Handler│  │ Routing Resolver     │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│  ┌──────────────────────────────────┼───────────────────────────────────┐   │
│  │              DATABASE ACCESS LAYER                                   │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐              │   │
│  │  │  UserDatabaseManager │  │   Master DB Client   │              │   │
│  │  │  (routes to SQLite)  │  │   (PostgreSQL)       │              │   │
│  │  └──────────────────────┘  └──────────────────────┘              │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬─────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           NETWORK                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  NETWORK ORCHESTRATION LAYER                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │    │
│  │  │ DHT Service  │  │PubSub Service│  │ Content Registry    │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │    │
│  │  │CRDT Sync     │  │Peer Discovery│  │ Connection Manager   │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PWA FRONTEND                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Share Dialog│  │Privacy Mgr  │  │Circle Select│  │Share Preview│      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │                │                │                │              │
│         └────────────────┼────────────────┼────────────────┘              │
│                          ▼                                                  │
│              ┌─────────────────────────┐                                   │
│              │   Sharing Intent API    │                                   │
│              └────────────┬────────────┘                                   │
└───────────────────────────┼───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           SERVER                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SHARING INTENT SERVICE                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │    │
│  │  │Intent Decoder│  │Policy Engine │  │ Sharing Analytics    │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                       │
│  ┌──────────────────────────────────┼───────────────────────────────────┐   │
│  │              CONTENT PUBLISHING PIPELINE                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │   │
│  │  │Content Filter│  │Crypto Handler│  │ Routing Resolver     │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬─────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           NETWORK                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  NETWORK ORCHESTRATION LAYER                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │    │
│  │  │ DHT Service  │  │PubSub Service│  │ Content Registry    │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │    │
│  │  │CRDT Sync     │  │Peer Discovery│  │ Connection Manager   │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Core Design Principles

### 1. User Intent First

Every sharing action begins with explicit user intent. The system captures:

- **What** content is being shared (conversation, ACUs, annotations)
- **Who** can access it (specific users, circles, public)
- **How** it can be used (view only, can remix, can share further)
- **When** it should be available (immediate, scheduled, expiration)
- **Where** it can be discovered (search, feed, direct share)

### 2. Privacy by Default

- All content is encrypted end-to-end
- Users retain full control over their data
- Sharing is opt-in and granular
- Metadata is minimized
- Zero-knowledge proofs for verification where possible

### 3. Decentralized Architecture

- No central server controls the network
- Content is distributed across peer nodes
- Users can self-host or use community nodes
- Federation allows cross-instance sharing

### 4. Intelligent Orchestration

The network layer is not a dumb pipe—it actively:

- Caches frequently accessed content
- Routes content through optimal paths
- Manages replication based on popularity
- Handles offline/online state gracefully

## Integration with Existing Systems

### PWA Integration

The PWA frontend provides the user interface for sharing:

- **ShareDialog**: Modal for configuring share options
- **PrivacyManager**: Handles privacy level transitions (local → shared → public)
- **CircleSelector**: UI for selecting target circles
- **SharePreview**: Shows what will be shared before confirmation

### Server Integration

The server provides:

- **Database**: Dual-database architecture
  - **Master Database (PostgreSQL)**: User identity, authentication, device registry, cross-user data (Circles, CircleMembers)
  - **User Databases (SQLite)**: Each user's personal content (conversations, ACUs, profiles, context bundles)
- **Authentication**: DID-based identity system
- **Context Engine**: Intelligent content recommendations (per-user isolated instance)
- **User Database Manager**: Routes queries to correct user database based on DID

### Network Integration

The network system provides:

- **DHT (Distributed Hash Table)**: Content location discovery
- **PubSub**: Real-time notifications and updates
- **CRDT**: Conflict-free data synchronization
- **Peer-to-Peer**: Direct content transfer

## Key Components

### SharingIntentService

The central service that processes all sharing requests:

```
User Action → Intent Capture → Policy Check → Transformation → Publishing
```

### ContentRegistry

Maintains a distributed registry of all shared content:

- Content ID (cryptographic hash)
- Owner DID
- Access policy
- Location (peer nodes)
- Version/history

### PolicyEngine

Enforces sharing policies:

- Circle-based access control
- Time-based expiration
- Usage restrictions (no remix, no share)
- Content moderation flags

### NetworkOrchestrator

Manages the P2P network:

- Node discovery and connection
- Content routing and caching
- Replication management
- Failure handling

## Data Flow

### Share Flow

1. User initiates share from PWA
2. PrivacyManager validates transition (local → shared)
3. ShareDialog captures intent (audience, permissions)
4. API call to `/api/v1/shares` with intent payload
5. Server validates permissions and policy (queries Master DB for user/circle data)
6. Content is fetched from user's SQLite database
7. Content is transformed (filtered, encrypted)
8. Sharing metadata stored in Master DB (PostgreSQL)
9. NetworkOrchestrator publishes to relevant peers
10. ContentRecord created in distributed registry
11. PubSub notifies subscribers
12. Share confirmation returned to user

### Discovery Flow

1. User searches for shared content
2. Query routed to network DHT
3. Relevant content records returned (from Master DB metadata)
4. Policy engine filters by access rights (validates circle membership in Master DB)
5. Content fetched from owner's user SQLite database
6. Decrypted and rendered in PWA

## Security Model

### Encryption

- **Content**: AES-256-GCM for symmetric encryption
- **Key Exchange**: Kyber (post-quantum) for key encapsulation
- **Signatures**: Ed25519 for authentication

### Access Control

- DID-based identity
- Circle membership verification
- Capability tokens for delegation
- Rate limiting on share actions

### Privacy

- Minimal metadata collection
- Differential privacy for analytics
- Local-first encryption
- User-controlled data retention

## Performance Considerations

### Caching Strategy

- L1: Local device cache (most recent)
- L2: Peer cache (frequently accessed)
- L3: CDN-like regional caches (popular content)

### Replication

- Automatic replication based on access patterns
- Geographic distribution for latency reduction
- Priority replication for owner's content

### Offline Support

- Queue share actions when offline
- Sync when connection restored
- Conflict resolution via CRDT

## Implementation Phases

### Phase 1: Foundation

- Basic sharing intent capture
- Simple circle-based sharing
- Network DHT integration

### Phase 2: Advanced Features

- Time-based sharing (scheduled, expiration)
- Advanced permissions (no remix, no share)
- Content moderation integration
- Analytics dashboard

### Phase 3: Federation

- Cross-instance sharing
- Federation protocols
- Advanced discovery

### Phase 4: Intelligence

- AI-powered sharing recommendations
- Automatic content optimization
- Predictive caching

## Conclusion

This sharing system provides a comprehensive solution for VIVIM's network-based content sharing. By combining user-centric design with decentralized architecture, it enables secure, private, and intelligent sharing of AI conversations across the network.

The system is designed to scale from small personal networks to global federated communities while maintaining privacy and user control at every step.
