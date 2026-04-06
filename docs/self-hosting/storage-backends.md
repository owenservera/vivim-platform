---
title: "Storage Backends"
description: "Configure and choose between PostgreSQL, SQLite, IPFS, and S3-compatible storage backends."
---

# Storage Backends

VIVIM supports multiple storage backends. Choose the right one for your use case.

## PostgreSQL (Recommended)

Full-featured, production-ready relational database.

### Configuration

```env
DATABASE_URL=postgresql://user:password@localhost:5432/vivim
```

### When to use

- Production deployments
- Multi-node setups
- Need for full-text search
- Concurrent access patterns

### Features

| Feature | Support |
|---|---|
| Full-text search | Yes (tsvector) |
| Graph queries | Yes (recursive CTEs) |
| Concurrent writes | Yes |
| Horizontal scaling | Yes (read replicas) |

## SQLite (Development)

Zero-setup embedded database.

### Configuration

```env
DATABASE_URL=file:./vivim.db
```

### When to use

- Development and testing
- Single-user, single-node setups
- Minimal infrastructure requirements

### Limitations

- No concurrent writes
- No multi-node support
- Limited full-text search (FTS5 only)

## IPFS (Decentralized)

Content-addressed distributed storage for exports and large objects.

### Configuration

```env
IPFS_ENABLED=true
IPFS_GATEWAY=http://localhost:5001
```

### When to use

- Decentralized memory exports
- Large object storage (encrypted blobs)
- Content-addressed deduplication

## S3-compatible (Object Storage)

Scalable object storage for encrypted blobs and backups.

### Configuration

```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=vivim-storage
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

### When to use

- Encrypted blob storage
- Backup and archive
- Cost-effective long-term storage

### Compatible providers

| Provider | Endpoint | Notes |
|---|---|---|
| **AWS S3** | `s3.amazonaws.com` | Default |
| **Cloudflare R2** | `r2.cloudflarestorage.com` | No egress fees |
| **MinIO** | Self-hosted | S3-compatible |
| **Backblaze B2** | `s3.us-west-002.backblazeb2.com` | Low cost |

## Multi-backend configuration

VIVIM can use multiple backends simultaneously:

```env
# Primary database
DATABASE_URL=postgresql://vivim:vivim@db:5432/vivim

# Object storage for large blobs
S3_ENDPOINT=https://r2.cloudflarestorage.com
S3_BUCKET=vivim-blobs

# IPFS for exports
IPFS_ENABLED=true
IPFS_GATEWAY=http://localhost:5001
```


::: tip
For the most cost-effective production setup, use PostgreSQL for structured data and Cloudflare R2 for encrypted blobs (no egress fees).
:::

