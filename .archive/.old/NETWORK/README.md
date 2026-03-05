# VIVIM Network Sharing System - Documentation Index

## Overview

This directory contains comprehensive documentation for VIVIM's network sharing system. The system is designed to intelligently track, store, and publish shared content based on user sharing intent.

## Implemented Architecture

The sharing system uses a **single PostgreSQL database** with row-level isolation via `ownerId` and `authorDid` filtering.

| Database | Type | Purpose |
|----------|------|---------|
| **Master Database** | PostgreSQL | All data (identity, auth, content, sharing) |

### Key Benefits

- **Simplicity**: Single database to manage, query, backup
- **Performance**: PostgreSQL handles millions of rows, complex queries
- **ACID**: Full transaction support across operations
- **Existing Integration**: Works seamlessly with context engine

### Note on Original Design

The original design specified dual-database (PostgreSQL + SQLite per-user) but was simplified for development efficiency. The single-database approach uses proper `where` clauses for data isolation:

```javascript
// Conversations - filter by ownerId
const conversations = await prisma.conversation.findMany({
  where: { ownerId: userId }
});

// ACUs - filter by authorDid
const acus = await prisma.atomicChatUnit.findMany({
  where: { authorDid: userDid }
});
```

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
| [09-IMPLEMENTATION.md](./09-IMPLEMENTATION.md) | Implementation guide and service details |
| [10-DATABASE-REFERENCE.md](./10-DATABASE-REFERENCE.md) | Complete schema reference |
| [11-API-REFERENCE.md](./11-API-REFERENCE.md) | Detailed API reference |

## Quick Start

### Architecture Overview

The sharing system consists of four interconnected layers:

1. **Sharing Intent Layer** - Captures user sharing decisions
2. **Content Publishing Pipeline** - Transforms and routes content
3. **Network Orchestration Layer** - Manages P2P distribution
4. **Analytics Layer** - Provides visibility into sharing patterns

### Database Flow

```
User → Server → PostgreSQL
              │
              ├── SharingIntent (sharing metadata)
              ├── ContentRecord (content references)
              ├── SharingPolicy (access control)
              ├── AnalyticsEvent (event tracking)
              └── User data (ownerId filtered)
```

### Key Features

- **Granular Permissions**: View, copy, annotate, remix, share, download
- **Audience Types**: Public, circle, users, link-based
- **Temporal Controls**: Scheduled sharing, expiration
- **Content Transformations**: Filtering, watermarking, anonymization
- **End-to-End Encryption**: AES-256-GCM
- **Circle-Based Access Control**: Privacy management
- **Analytics**: User metrics, activity logs, AI insights

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
    ├── SharingIntentService
    ├── SharingEncryptionService
    ├── SharingAnalyticsService
    └── PostgreSQL
```

## Services

| Service | File | Description |
|---------|------|-------------|
| SharingIntent | `server/src/services/sharing-intent-service.js` | Intent CRUD, publishing, links |
| Encryption | `server/src/services/sharing-encryption-service.js` | AES-256-GCM, password hashing |
| Analytics | `server/src/services/sharing-analytics-service.js` | Metrics, activity, insights |

## Design Principles

1. **User Intent First**: Every share action reflects explicit user decisions
2. **Privacy by Default**: Encryption and minimal data collection
3. **Simplicity**: Single database with ownerId filtering
4. **Security**: AES-256-GCM encryption, secure password handling

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.2.0 | 2026-02-14 | Simplified to single PostgreSQL, added implementation docs |
| 1.1.0 | 2026-02-14 | Updated for dual-database architecture |
| 1.0.0 | 2026-02-14 | Initial documentation set |

## Contributing

When extending the sharing system:

1. Follow the intent model structure in `02-SHARING-INTENT-SYSTEM.md`
2. Add new database models to `06-DATABASE-SCHEMA.md` and `10-DATABASE-REFERENCE.md`
3. Document new API endpoints in `07-API-ENDPOINTS.md` and `11-API-REFERENCE.md`
4. Update implementation details in `09-IMPLEMENTATION.md`
5. Update security considerations in `08-SECURITY-PRIVACY.md`

## Support

For questions or issues with the sharing system:
- Implementation guide: See `09-IMPLEMENTATION.md`
- API reference: See `11-API-REFERENCE.md`
- Database schema: See `10-DATABASE-REFERENCE.md`
- Security concerns: See `08-SECURITY-PRIVACY.md`
