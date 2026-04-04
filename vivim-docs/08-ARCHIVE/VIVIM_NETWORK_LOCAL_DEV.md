# VIVIM Network - Local Development & Testing Specification

## Overview

This document specifies how to run the VIVIM network locally for development and testing, including support for simulating multiple isolated devices/users on a single machine.

---

## 1. Local Architecture

### 1.1 Development Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LOCAL DEVELOPMENT ENVIRONMENT                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐            │
│   │  PWA Tab 1  │     │  PWA Tab 2  │     │  PWA Tab 3  │            │
│   │  (User A)   │     │  (User B)   │     │  (User C)   │            │
│   │  :3000      │     │  :3001      │     │  :3002      │            │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘            │
│          │                    │                    │                     │
│          └──────────────────┼────────────────────┘                     │
│                             │                                           │
│                    ┌────────┴────────┐                                 │
│                    │   SIGNALLING    │                                 │
│                    │   SERVER        │                                 │
│                    │   :4000         │                                 │
│                    └────────┬────────┘                                 │
│                             │                                           │
│          ┌──────────────────┼──────────────────┐                       │
│          │                  │                  │                       │
│   ┌──────┴──────┐   ┌──────┴──────┐   ┌──────┴──────┐            │
│   │   STUN      │   │   TURN      │   │  DATABASE   │            │
│   │   :3478    │   │   :3478/UDP │   │  :5432      │            │
│   └─────────────┘   └─────────────┘   └─────────────┘            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Ports

| Component | Port | Protocol | Purpose |
|-----------|------|----------|---------|
| PWA (User 1) | 3000 | HTTP/WebSocket | Browser 1 |
| PWA (User 2) | 3001 | HTTP/WebSocket | Browser 2 |
| PWA (User N) | 300N | HTTP/WebSocket | Browser N |
| Signaling Server | 4000 | WebSocket | WebRTC signaling |
| STUN Server | 3478 | UDP/TCP | NAT traversal |
| TURN Server | 3478 | UDP/TCP | Relay (if needed) |
| PostgreSQL | 5432 | TCP | Shared database |
| PDS API (User 1) | 5001 | HTTP | User 1's PDS |
| PDS API (User 2) | 5002 | HTTP | User 2's PDS |

---

## 2. Prerequisites

### 2.1 Required Services

```bash
# Core dependencies
Node.js >= 20.0.0
PostgreSQL >= 14
Redis >= 7

# Install PostgreSQL (if not already)
# macOS
brew install postgresql@14
brew services start postgresql@14

# Linux
sudo apt install postgresql-14

# Create database
createdb vivim_network
```

### 2.2 Package Installation

```bash
# Network package
cd network
npm install

# Build
npm run build
```

---

## 3. Starting Local Infrastructure

### 3.1 Start PostgreSQL

```bash
# Ensure PostgreSQL is running
brew services start postgresql@14  # macOS
sudo systemctl start postgresql   # Linux

# Create database
createdb vivim_network

# Apply schema
cd network
npx prisma migrate dev
```

### 3.2 Start Signaling Server

The signaling server is required for WebRTC peer discovery. Create `signaling-server/index.ts`:

```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 4000 });

interface Room {
  peers: Set<WebSocket>;
}

const rooms = new Map<string, Room>();

wss.on('connection', (ws) => {
  let currentRoom: string | null = null;

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    const { type, room, peerId, offer, answer, candidate } = message;

    switch (type) {
      case 'join':
        currentRoom = room;
        if (!rooms.has(room)) {
          rooms.set(room, { peers: new Set() });
        }
        rooms.get(room)!.peers.add(ws);
        rooms.get(room)!.peers.forEach((peer) => {
          if (peer !== ws) {
            peer.send(JSON.stringify({ type: 'peer-joined', peerId }));
          }
        });
        break;

      case 'offer':
        broadcastToRoom(room, { type: 'offer', offer, from: peerId }, ws);
        break;

      case 'answer':
        broadcastToRoom(room, { type: 'answer', answer, from: peerId }, ws);
        break;

      case 'ice':
        broadcastToRoom(room, { type: 'ice', candidate, from: peerId }, ws);
        break;

      case 'leave':
        leaveRoom(ws, room);
        break;
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      leaveRoom(ws, currentRoom);
    }
  });
});

function broadcastToRoom(room: string, message: object, exclude: WebSocket) {
  const roomObj = rooms.get(room);
  if (!roomObj) return;

  roomObj.peers.forEach((peer) => {
    if (peer !== exclude && peer.readyState === 1) {
      peer.send(JSON.stringify(message));
    }
  });
}

function leaveRoom(ws: WebSocket, room: string) {
  const roomObj = rooms.get(room);
  if (!roomObj) return;

  roomObj.peers.delete(ws);
  if (roomObj.peers.size === 0) {
    rooms.delete(room);
  }
}

console.log('Signaling server running on ws://localhost:4000');
```

Run it:
```bash
cd signaling-server
npm init -y
npm install ws
npx tsx index.ts
```

### 3.3 Start STUN/TURN Server

For local NAT traversal testing, use coturn:

```bash
# macOS
brew install coturn

# Linux
sudo apt install coturn

# Create /etc/turnserver.conf:
listening-port=3478
external-ip=127.0.0.1
realm=vivim.local
fingerprint
lt-cred-mech
user=guest:guest
simple-log

# Start coturn
sudo coturn -c /etc/turnserver.conf
```

For development without TURN (simpler), use only STUN:
```javascript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },  // Public STUN
  { urls: 'stun:stun1.l.google.com:19302' }
];
```

---

## 4. Running Multiple Users

### 4.1 Multi-Port PWA Setup

Each "user" runs on a different port. Create start scripts:

```bash
# scripts/start-user.sh
#!/bin/bash
USER_ID=$1
PORT=$((3000 + USER_ID))

echo "Starting User $USER_ID on port $PORT"
PORT=$PORT npm run dev -- --host
```

```bash
# Start 3 users
chmod +x scripts/start-user.sh
./scripts/start-user.sh 1  # User 1 on :3000
./scripts/start-user.sh 2  # User 2 on :3001
./scripts/start-user.sh 3  # User 3 on :3002
```

### 4.2 User Isolation

Each user gets:
1. **Separate browser profile** - Different IndexedDB
2. **Different DID** - Unique decentralized identity
3. **Separate PDS** - Own API server instance
4. **Independent CRDT** - Own Yjs document

To simulate device isolation:
- Use **different browser tabs** (shares IndexedDB - NOT isolated)
- Use **different browsers** (Chrome/Firefox/Safari - isolated)
- Use **Incognito/Private mode** (isolated storage)
- Use **different devices** (truly isolated)

### 4.3 Configuration Per User

```typescript
// User 1 config (port 3000)
const userConfig = {
  did: 'did:key:zUser1...',
  peerId: 'peer-user1',
  signalingUrl: 'ws://localhost:4000',
  pdsUrl: 'http://localhost:5001',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

// User 2 config (port 3001)
const userConfig2 = {
  did: 'did:key:zUser2...',
  peerId: 'peer-user2',
  signalingUrl: 'ws://localhost:4000',
  pdsUrl: 'http://localhost:5002',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};
```

---

## 5. Testing Scenarios

### 5.1 P2P Connection Test

**Goal**: Verify two users can connect directly via WebRTC

**Steps**:
1. Start signaling server on :4000
2. Start User 1 PWA on :3000
3. Start User 2 PWA on :3001
4. User 1 searches for User 2
5. Initiate P2P connection
6. Verify direct connection in DevTools → Application → Frames

**Expected**: WebRTC connection established, data flows directly

### 5.2 CRDT Sync Test

**Goal**: Verify conversations sync between users

**Steps**:
1. Both users join same circle
2. User 1 creates conversation
3. User 1 adds message
4. User 2 should see message appear

**Expected**: Message appears within 2 seconds via CRDT

### 5.3 Offline/Online Test

**Goal**: Verify offline-first behavior

**Steps**:
1. Disconnect User 2 from network
2. User 1 sends message
3. User 2 reconnects
4. Sync should occur

**Expected**: Messages sync after reconnection

### 5.4 Federation Test

**Goal**: Verify cross-instance communication

**Steps**:
1. Start PDS for User 1 on :5001
2. Start PDS for User 2 on :5002
3. User 1 follows User 2
4. Verify federation message sent

**Expected**: Follow request received by User 2's PDS

---

## 6. Docker Compose for Local Dev

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: vivim
      POSTGRES_PASSWORD: vivim
      POSTGRES_DB: vivim_network
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vivim"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis (for pub/sub, caching)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Signaling Server
  signaling:
    build:
      context: ./signaling-server
    ports:
      - "4000:4000"
    depends_on:
      - redis

  # STUN/TURN Server
  coturn:
    image: coturn/coturn:latest
    ports:
      - "3478:3478"
      - "3478:3478/udp"
    volumes:
      - ./coturn/turnserver.conf:/etc/coturn/turnserver.conf
    network_mode: host

  # User 1 PDS
  pds-user1:
    build:
      context: ./server
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=development
      - PORT=5001
      - USER_ID=1
      - DATABASE_URL=postgresql://vivim:vivim@postgres:5432/vivim_network
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy

  # User 2 PDS
  pds-user2:
    build:
      context: ./server
    ports:
      - "5002:5002"
    environment:
      - NODE_ENV=development
      - PORT=5002
      - USER_ID=2
      - DATABASE_URL=postgresql://vivim:vivim@postgres:5432/vivim_network
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
```

Run with:
```bash
docker-compose -f docker-compose.local.yml up
```

---

## 7. Debugging

### 7.1 WebRTC Debugging

```javascript
// Enable WebRTC logging in browser console
localStorage.setItem('debug', '*');
localStorage.setItem('webrtc-debug', 'true');

// Or in code
console.log('RTCPeerConnection:', RTCPeerConnection);
const pc = new RTCPeerConnection(config);
pc.oniceconnectionstatechange = () => {
  console.log('ICE State:', pc.iceConnectionState);
};
```

### 7.2 Network Debugging

```javascript
// Monitor all WebSocket messages
const originalSend = WebSocket.prototype.send;
WebSocket.prototype.send = function(data) {
  console.log('WS Send:', JSON.parse(data));
  return originalSend.apply(this, arguments);
};
```

### 7.3 Chrome Flags

Navigate to `chrome://webrtc-internals` for:
- Peer connection stats
- ICE candidate pairs
- Data channel info

---

## 8. Test Accounts

Create test users with:

```bash
# Generate test DID
node -e "
const { DID } = require('@veramo/did-manager');
const keyManager = new DID({ 
  defaultProvider: 'did:key' 
});
keyManager.create().then(did => console.log(did));
"

# Or use test vectors
# User 1: did:key:zQ3shN8vT8X7A1Y2Z9K5P3L
# User 2: did:key:zQ3shN8vT8X7A1Y2Z9K5P3M
# User 3: did:key:zQ3shN8vT8X7A1Y2Z9K5P3N
```

---

## 9. Success Criteria

| Test | Criteria | Tool |
|------|----------|------|
| P2P Connect | < 5s between users | Chrome WebRTC Internals |
| CRDT Sync | < 2s message propagation | Console logs |
| Offline Queue | Messages queued, synced on reconnect | Network tab |
| Federation | Cross-instance message delivery | Server logs |

---

## 10. Troubleshooting

### Issue: WebRTC Connection Fails

**Diagnosis**:
1. Check signaling server is running on :4000
2. Check browser console for ICE errors
3. Verify STUN server is accessible

**Fix**:
- Ensure all browsers can reach signaling server
- Use public STUN if local fails
- Check firewall rules

### Issue: Users Can't Find Each Other

**Diagnosis**:
1. Check both users have same circle ID
2. Verify signaling server messages

**Fix**:
- Ensure users are in same circle
- Check DHT bootstrap nodes

### Issue: CRDT Conflicts

**Diagnosis**:
1. Check vector clocks are incrementing
2. Verify both users see same state

**Fix**:
- Ensure single writer for critical fields
- Use Y.Map for shared state

---

## Appendix: Quick Start Commands

```bash
# Full local environment setup

# 1. Start infrastructure
docker-compose -f docker-compose.local.yml up -d

# 2. Start signaling (if not in docker)
cd signaling-server && npx tsx index.ts

# 3. Start PWA for User 1
cd pwa && PORT=3000 npm run dev

# 4. Start PWA for User 2 (new terminal)
cd pwa && PORT=3001 npm run dev

# 5. Open browsers
# User 1: http://localhost:3000
# User 2: http://localhost:3001

# 6. Test P2P connection
# In User 1: Search for User 2's DID
# Initiate connection
# Verify in chrome://webrtc-internals
```
