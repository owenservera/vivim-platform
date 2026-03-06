# Redis Setup Guide for VIVIM

## Overview

Redis is an optional but recommended component for VIVIM. It provides:
- **Session storage** - Persistent user sessions across server restarts
- **API caching** - Faster response times for frequently accessed data
- **Rate limiting** - Distributed rate limiting across multiple server instances
- **Real-time sync** - Pub/sub for real-time features

**Note:** If Redis is not configured, VIVIM automatically falls back to in-memory caching (perfect for development).

---

## Quick Start

### Option 1: Docker (Recommended for Development)

```bash
# Start Redis with Docker
docker run -d -p 6379:6379 --name vivim-redis redis:latest

# Verify it's running
docker ps | grep vivim-redis

# Test connection
docker exec vivim-redis redis-cli ping
```

**Expected output:** `PONG`

### Option 2: Windows (Chocolatey)

```powershell
# Install Redis
choco install redis-64

# Install as Windows service
redis-server --service-install

# Start the service
redis-server --service-start

# Test connection
redis-cli ping
```

### Option 3: macOS (Homebrew)

```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# Test connection
redis-cli ping
```

### Option 4: Linux (Ubuntu/Debian)

```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server

# Enable on boot
sudo systemctl enable redis-server

# Test connection
redis-cli ping
```

---

## Configuration

### Server Environment

Add to `server/.env`:

```bash
# Basic Redis configuration
REDIS_URL=redis://localhost:6379

# With authentication (production)
REDIS_URL=redis://:your-password@localhost:6379

# With database selection
REDIS_URL=redis://localhost:6379/1

# With TLS (production)
REDIS_URL=rediss://:your-password@your-redis-host:6380
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `REDIS_TLS_ENABLED` | Enable TLS connection | `false` |
| `REDIS_DB` | Database number (0-15) | `0` |

---

## Testing Redis Connection

### Using the Setup Script

```bash
# Run the automated setup script
bun run setup:redis
```

This script will:
1. Check if Redis CLI is installed
2. Verify Redis server is running
3. Test Node.js connection
4. Provide installation instructions if needed

### Manual Test

```bash
# Using redis-cli
redis-cli ping

# Expected output: PONG
```

---

## Production Configuration

### Redis with Authentication

```bash
# Generate a strong password
openssl rand -base64 32

# Add to .env
REDIS_URL=redis://:your-strong-password@localhost:6379
```

### Redis with TLS

```bash
# For managed Redis services (AWS ElastiCache, Azure Redis, etc.)
REDIS_URL=rediss://:your-password@your-redis-host.amazonaws.com:6380
```

### Redis Cluster

```bash
# For Redis Cluster (comma-separated nodes)
REDIS_URL=redis://node1:6379,redis://node2:6379,redis://node3:6379
```

---

## Troubleshooting

### "Redis URL not configured" Message

**Issue:** Server shows info message about Redis not configured

**Solution:** Add `REDIS_URL` to your `server/.env` file:
```bash
REDIS_URL=redis://localhost:6379
```

### Connection Refused

**Issue:** `ECONNREFUSED` error when connecting to Redis

**Causes:**
1. Redis server is not running
2. Wrong port (default is 6379)
3. Firewall blocking connection

**Solutions:**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis (Docker)
docker start vivim-redis

# Start Redis (Windows service)
redis-server --service-start

# Start Redis (macOS)
brew services start redis

# Start Redis (Linux)
sudo systemctl start redis-server
```

### Authentication Failed

**Issue:** `ERR AUTH` or authentication error

**Solution:** Include password in Redis URL:
```bash
REDIS_URL=redis://:your-password@localhost:6379
```

### Memory Issues

**Issue:** Redis running out of memory

**Solution:** Configure max memory in `redis.conf`:
```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

---

## Monitoring Redis

### Basic Commands

```bash
# Check Redis info
redis-cli info

# Check memory usage
redis-cli info memory

# Check connected clients
redis-cli client list

# Monitor commands in real-time
redis-cli monitor

# Check slow queries
redis-cli slowlog get 10
```

### Key Patterns Used by VIVIM

- `session:*` - User sessions
- `cache:*` - API response cache
- `ratelimit:*` - Rate limiting counters

---

## Backup & Restore

### Backup

```bash
# Create a backup
redis-cli SAVE

# Or in background
redis-cli BGSAVE

# Copy the RDB file
# Location: /var/lib/redis/dump.rdb (Linux)
# Location: C:\Program Files\Redis\dump.rdb (Windows)
```

### Restore

```bash
# Stop Redis
sudo systemctl stop redis-server

# Replace dump.rdb with backup
sudo cp /path/to/backup/dump.rdb /var/lib/redis/

# Set permissions
sudo chown redis:redis /var/lib/redis/dump.rdb

# Start Redis
sudo systemctl start redis-server
```

---

## Performance Tuning

### Recommended Settings for Production

Edit `redis.conf`:

```conf
# Persistence
save 900 1
save 300 10
save 60 10000

# Memory
maxmemory 512mb
maxmemory-policy allkeys-lru

# Network
bind 127.0.0.1
port 6379
timeout 300
tcp-keepalive 60

# Security
requirepass your-strong-password-here
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
```

---

## Next Steps

1. ✅ **Configure Redis URL** in `server/.env`
2. ✅ **Run setup script**: `bun run setup:redis`
3. ✅ **Start development server**: `bun run dev`
4. ✅ **Verify logs show**: "Redis connected successfully"

---

## Support

For issues:
- Check Redis logs: `docker logs vivim-redis` (Docker)
- Check Windows Event Viewer (Windows)
- Check systemd logs: `journalctl -u redis-server` (Linux)

**Documentation:** https://redis.io/documentation
