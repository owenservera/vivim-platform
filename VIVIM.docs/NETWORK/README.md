# VIVIM Network Sharing System - Documentation Index

## Overview

This directory contains comprehensive documentation for VIVIM's state-of-the-art network sharing system. The system is designed to intelligently track, store, and publish shared content based on user sharing intent.

## Dual-Database Architecture

The sharing system now uses a dual-database architecture for complete user data isolation:

| Database | Type | Purpose |
|----------|------|---------|
| **Master Database** | PostgreSQL | Identity, auth, cross-user data, sharing metadata |
| **User Databases** | SQLite (per-user) | User content, profiles, context bundles |

### Key Benefits

- **Complete Isolation**: Each user has their own SQLite database file
- **Cross-User Coordination**: Master DB handles circles, sharing, and access control
- **Enhanced Privacy**: No cross-user database queries possible
- **Scalability**: User data grows independently per user

## Document List

| Document | Description |
|----------|-------------|
| [01-DESIGN-OVERVIEW.md](./01-DESIGN-OVERVIEW.md) | High-level architecture and design principles |
| [02-SHARING-INTENT-SYSTEM.md](./02-SHARING-INTENT-SYSTEM.md) | User intent capture and processing |
| [03-CONTENT-PUBLISHING-PIPELINE.md](./03-CONTENT-PUBLISHING-PIPELINE.md) | Content transformation and distribution |
| [04-NETWORK-ORCHESTRATION.md](./04-NETWORK-ORCHESTRATION.md) | P2P network coordination layer |
| [05-SHARING-ANALYTICS.md](./05-SHARING-ANALYTICS.md) | Analytics and insights system |
| [06-DATABASE-SCHEMA.md](./06-DATABASE-SCHEMA.md) | Database schema extensions |
| [07-API-ENDPOINTS.md](./07-API-ENDPOINTS.md) | API endpoint specifications |
| [08-SECURITY-PRIVACY.md](./08-SECURITY-PRIVACY.md) | Security and privacy architecture |

## Quick Start

### Architecture Overview

The sharing system consists of four interconnected layers:

1. **Sharing Intent Layer** - Captures user sharing decisions
2. **Content Publishing Pipeline** - Transforms and routes content
3. **Network Orchestration Layer** - Manages P2P distribution
4. **Analytics Layer** - Provides visibility into sharing patterns

### Database Flow

```
User A (SQLite) ──────▶ Master DB (PostgreSQL) ──────▶ User B (SQLite)
     │                        │                            │
     │ Sharing Intent        │ Circle Validation          │ Access
     │ Content Reference     │ Sharing Metadata           │ Content
     └──────────────────────┴────────────────────────────┘
```

### Key Features

- **Granular Permissions**: View, copy, annotate, remix, share, download
- **Audience Types**: Public, circle, users, link-based
- **Temporal Controls**: Scheduled sharing, expiration
- **Content Transformations**: Filtering, watermarking, anonymization
- **End-to-End Encryption**: AES-256-GCM + Kyber (post-quantum)
- **Circle-Based Access Control**: Advanced privacy management
- **Federation Support**: Cross-instance sharing
- **Privacy-Preserving Analytics**: Insights without compromising privacy
- **User Database Isolation**: Each user has their own SQLite database

### Integration Points

```
PWA Frontend
    │
    ├── ShareDialog (UI)
    ├── PrivacyManager
    └── FeatureService (API)
            │
            ▼
    Server
    │
    ├── UserDatabaseManager (routes to SQLite)
    ├── Master DB Client (PostgreSQL)
    │
    ├── Sharing Intent Service
    ├── Content Publishing Pipeline
    ├── Policy Engine
    └── Analytics
            │
            ▼
    Network
    │
    ├── DHT Service (content discovery)
    ├── PubSub Service (notifications)
    ├── CRDT Sync (collaboration)
    ├── Storage Manager
    └── Peer Services
```

## Design Principles

1. **User Intent First**: Every share action reflects explicit user decisions
2. **Privacy by Default**: Encryption and minimal data collection
3. **Decentralized Architecture**: No central server controls the network
4. **Intelligent Orchestration**: Network actively manages content distribution
5. **Database Isolation**: Each user has their own SQLite database

## Related Documentation

### User Isolation Documentation
- `VIVIM.docs/USERS/01-architecture-overview.md` - High-level isolation architecture
- `VIVIM.docs/USERS/05-model-classification.md` - Model ownership classification

### Server Documentation
- `server/src/lib/user-database-manager.js` - User database management
- `server/prisma/schema.prisma` - Database schema
- `server/src/services/` - Service implementations

### Network Documentation
- `network/prisma/schema.prisma` - Network database schema
- `network/src/` - Network service implementations

### PWA Documentation
- `pwa/src/lib/` - Frontend libraries
- `pwa/src/components/` - UI components

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-02-14 | Updated for dual-database architecture with SQLite user isolation |
| 1.0.0 | 2026-02-14 | Initial documentation set |

## Contributing

When extending the sharing system:

1. Follow the intent model structure in `02-SHARING-INTENT-SYSTEM.md`
2. Add new database models to `06-DATABASE-SCHEMA.md` (considering Master vs User DB split)
3. Document new API endpoints in `07-API-ENDPOINTS.md`
4. Update security considerations in `08-SECURITY-PRIVACY.md`

## Support

For questions or issues with the sharing system:
- Architecture questions: See `01-DESIGN-OVERVIEW.md`
- Implementation details: See relevant component documentation
- Security concerns: See `08-SECURITY-PRIVACY.md`
