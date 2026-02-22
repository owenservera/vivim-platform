# VIVIM Operational Runbooks

## Overview

This document contains operational procedures for managing the VIVIM platform in production and development environments. These runbooks are designed for operators, developers, and system administrators to troubleshoot issues, perform routine maintenance, and respond to incidents.

---

## 1. Database Operations

### 1.1 Database Migration and Push

When schema changes are made (`schema.prisma`), follow these steps:

**For Development:**

1. Update `c:\0-BlackBoxProject-0\vivim-app\server\prisma\schema.prisma`.
2. Run database push to update the schema without creating migration history (useful for rapid iteration):
   ```bash
   bunx prisma db push
   ```
3. Generate the Prisma client:
   ```bash
   bunx prisma generate
   ```

**For Production:**

1. Create a migration:
   ```bash
   bunx prisma migrate dev --name <migration_name>
   ```
2. Apply the migration:
   ```bash
   bunx prisma migrate deploy
   ```

### 1.2 Database Backup (PostgreSQL)

Run the following command to create a database dump:

```bash
pg_dump -U <username> -h <host> -p <port> -F c -b -v -f /path/to/backup.dump openscroll
```

To restore:

```bash
pg_restore -U <username> -h <host> -p <port> -d openscroll -1 /path/to/backup.dump
```

---

## 2. Server Administration

### 2.1 Restarting the Server

The server uses Bun. If running via PM2 or a similar process manager:

```bash
pm2 restart vivim-server
```

If running manually in development:

```bash
bun run dev
```

### 2.2 Log Management

Logs are structured using Pino and output to standard output.
To view logs in a human-readable format, pipe them through `pino-pretty`:

```bash
bun run start | bunx pino-pretty
```

Log levels can be configured via the `LOG_LEVEL` environment variable (`trace`, `debug`, `info`, `warn`, `error`, `fatal`).

---

## 3. Incident Response

### 3.1 High Memory Usage / Memory Leaks

If the VIVIM server is consuming excessive memory:

1. Check the logs for `OutOfMemoryError` or warnings.
2. Verify if the CRDT Sync operations (Yjs) or Memory Extraction pipelines are stuck.
3. Restart the server service to clear the immediate pressure.
4. Scale up the container memory limit if necessary.

### 3.2 Redis Cache Failure

If the Redis caching layer (`cacheService`) fails:

1. The application is designed to gracefully fall back to an internal **in-memory Map cache**.
2. Performance may degrade on high-traffic routes.
3. Check Redis connection using `redis-cli ping`.
4. Ensure the `REDIS_URL` in `.env` is correct.

### 3.3 Peer-to-Peer (libp2p) Network Issues

If nodes are failing to connect or discover each other:

1. Check if the Bootstrap nodes are reachable.
2. Ensure the firewall allows the configured libp2p port (default TCP/WebRTC).
3. Verify TLS certificates are valid if secure transport is enforced.

---

## 4. Security & Authentication

### 4.1 Revoking an API Key

If an API key is compromised:

1. Locate the API Key under the user's account settings UI, or manually delete it from the database:
   ```sql
   DELETE FROM api_keys WHERE id = '<key_id>';
   ```
2. The middleware will immediately begin rejecting requests using that key.

### 4.2 Temporary Account Suspension

To suspend a user's account:

1. Set their account status to `SUSPENDED` in the database:
   ```sql
   UPDATE users SET status = 'SUSPENDED', "suspendedAt" = NOW(), "suspensionReason" = 'Violation' WHERE id = '<user_id>';
   ```
2. Active sessions will be rejected by the `accountLifecycle.canUserAccess` middleware on the next request.

---

_Document Version: 1.0_
_Last Updated: February 2026_
