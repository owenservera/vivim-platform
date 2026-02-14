# VIVIM Network Architecture Design

## Executive Summary

This document outlines the complete network architecture for VIVIM - a privacy-first, decentralized social platform for AI chat content. The network is designed to support the user management system (identity, circles, sharing) with robust, scalable, and privacy-preserving communication.

---

## 1. Network Topology

### 1.1 Hybrid Architecture

VIVIM uses a **hybrid federated-P2P architecture** that combines:

- **Central Coordination Servers** - Lightweight, can be self-hosted or cloud
- **P2P Mesh** - Direct device-to-device communication for real-time features
- **Federation** - Cross-instance communication for social features
- **Edge Computing** - CDN-like distribution for content delivery

```
┌─────────────────────────────────────────────────────────────────┐
│                      VIVIM Network                              │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  Instance A  │◄──►│  Instance B  │◄──►│  Instance C  │      │
│  │  (PDS)      │    │  (PDS)      │    │  (PDS)      │      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
│         │                   │                   │               │
│    ┌────┴────┐        ┌────┴────┐        ┌────┴────┐        │
│    │ Users    │        │ Users    │        │ Users    │        │
│    │ ▲▲▲     │        │ ▲▲▲     │        │ ▲▲▲     │        │
│    └────┬────┘        └────┬────┘        └────┬────┘        │
│         │                   │                   │               │
│    ┌────┴────┐        ┌────┴────┐        ┌────┴────┐        │
│    │ P2P Mesh│◄─────►│ P2P Mesh│◄─────►│ P2P Mesh│        │
│    │ (Real-  │        │ (Real-  │        │ (Real-  │        │
│    │  time)   │        │  time)  │        │  time)  │        │
│    └─────────┘        └─────────┘        └─────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Node Types

| Node Type | Role | Requirements | Can Self-Host |
|-----------|------|--------------|---------------|
| **PDS** (Personal Data Server) | Primary data storage, API | 2+ CPU, 4GB RAM, 50GB SSD | ✅ Yes |
| **Relay** | Message routing, federation | 4+ CPU, 8GB RAM, 100GB SSD | ✅ Yes |
| **Edge Node** | CDN, caching, compute | 2+ CPU, 2GB RAM | ✅ Yes |
| **Client Node** | User device (PWA/Mobile) | Browser/APP | N/A |

---

## 2. Communication Protocols

### 2.1 Protocol Stack

```
Layer 7: Application Protocols
├── HTTPS/REST (API)
├── WebSocket (Real-time)
├── ActivityPub (Federation)
└── WAMP (Pub/Sub)

Layer 6: Security
├── TLS 1.3
├── DID Authentication
└── E2E Encryption

Layer 5: Transport
├── HTTP/3 (QUIC)
├── WebRTC (P2P)
└── WebTransport

Layer 4: Network
├── IPv6/IPv4
├── NAT Traversal (STUN/TURN)
└── Tor/I2P (Optional)
```

### 2.2 Transport Mechanisms

#### Primary: HTTP/3 (QUIC)
- **Use**: API calls, file transfers, federation
- **Benefits**: Fast reconnect, 0-RTT, multiplexed streams
- **Port**: 443 (QUIC)

#### Real-Time: WebSocket + SSE
- **Use**: Notifications, presence, live updates
- **Connection**: Persistent, bidirectional
- **Heartbeat**: 30 seconds

#### P2P: WebRTC + libp2p
- **Use**: Direct messaging, voice/video, real-time sync
- **Mesh**: GossipSub for message distribution
- **NAT Traversal**: STUN/TURN servers

---

## 3. Data Synchronization

### 3.1 Consistency Model

VIVIM uses **Eventual Consistency with CRDTs** for:

- Content (ACUs, conversations)
- Circle memberships
- Social graph
- Sharing policies

```javascript
// Example: CRDT-based content sync
const contentCRDT = {
  id: 'acu_123',
  author: 'did:key:zABC...',
  content: 'Hello world',
  vectorClock: { 'device_1': 5, 'device_2': 3 },
  tombstones: []
};
```

### 3.2 Sync Protocol

```
1. Client connects to PDS
2. Client sends last sync vector
3. Server computes delta
4. Server sends new events
5. Client applies events locally
6. Client resolves conflicts with CRDT
7. Client sends acknowledgment
8. Server updates sync vector
```

### 3.3 Conflict Resolution

| Data Type | Strategy | Implementation |
|-----------|----------|----------------|
| Content | Last-Write-Wins + CRDT | Text CRDT (Yjs) |
| Circles | Set Union | LWW-Register |
| Policies | Most Restrictive | Custom merge |
| Presence | Lamport Timestamp | Logical clock |

---

## 4. Federation Protocol

### 4.1 ActivityPub Extension

VIVIM extends ActivityPub for:

- **Identity**: Uses DIDs, not ActivityPub actors
- **Content**: AI chat units (ACUs) as objects
- **Circles**: Custom collections with access control
- **Privacy**: Multi-stakeholder consent

```javascript
// VIVIM ActivityPub Object
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://vivim.social/vocab"
  ],
  "type": "AIChatUnit",
  "id": "https://pds.vivim.social/acu/123",
  "content": "encrypted:...",
  "sharingPolicy": "https://pds.vivim.social/policy/456",
  "audience": [
    "https://pds.vivim.social/circle/work"
  ],
  "signature": "did:key:zABC...#signature"
}
```

### 4.2 Federation Endpoints

```
GET  /actor/{did}           - Get actor profile
GET  /outbox               - Public posts
GET  /inbox                - Receive posts
POST /inbox                - Receive activity
GET  /circle/{id}          - Get circle
POST /circle/{id}/members  - Add member
GET  /feed                 - Federated feed
```

### 4.3 Instance Discovery

1. **DNS TXT Records**: `did.=_vivim_pds=vivim.social`
2. **Well-Known**: `https://domain.com/.well-known/vivim`
3. **Directory**: Optional instance directory
4. **Handshake**: DID-based verification

---

## 5. Real-Time Communication

### 5.1 WebSocket Infrastructure

```
                    ┌─────────────┐
                    │   Gateway   │
                    │  (HAProxy)  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
    │ WS Node 1│     │ WS Node 2│     │ WS Node 3│
    │          │     │          │     │          │
    └────┬────┘     └────┬────┘     └────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Redis Pub/Sub │
                    │  (Message Bus)  │
                    └─────────────────┘
```

### 5.2 Presence System

```javascript
// Presence state
{
  "online": true,
  "lastSeen": "2024-01-15T10:30:00Z",
  "device": "mobile",
  "circles": ["work", "family"],
  "status": "available"
}
```

### 5.3 P2P Real-Time (Optional)

For sensitive/real-time content:

1. **Signal** via WebSocket
2. **Connect** via WebRTC
3. **E2E Encrypt** with key exchange
4. **Direct Transfer** content

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Client │     │   PDS   │     │  Relay │
└────┬────┘     └────┬────┘     └────┬────┘
     │                  │                  │
     │  1. Challenge   │                  │
     │◄─────────────────│                  │
     │                  │                  │
     │  2. Sign(challenge)                │
     │─────────────────►│ 3. Verify DID  │
     │                  │─────────────────►│
     │                  │                  │
     │  4. Session Token (JWT)             │
     │◄─────────────────│                  │
     │                  │                  │
     │  5. Encrypted Requests             │
     │◄───────────────────────────────────►│
```

### 6.2 Encryption Layers

| Layer | Algorithm | Purpose |
|-------|-----------|---------|
| Transport | TLS 1.3 | In-flight encryption |
| Storage | AES-256-GCM | At-rest encryption |
| E2E (P2P) | X25519 + AES-GCM | End-to-end |
| Signing | Ed25519 | Authentication |

### 6.3 Privacy Protections

- **Zero-Knowledge Proofs**: Verify without revealing
- **Onion Routing**: Optional Tor integration
- **Metadata Minimization**: Limited logging
- **Perfect Forward Secrecy**: Key rotation

---

## 7. Scalability Design

### 7.1 Horizontal Scaling

```
                    ┌──────────────┐
                    │ Load Balancer │
                    │   (HAProxy)   │
                    └───────┬───────┘
                            │
     ┌──────────┬──────────┼──────────┬──────────┐
     │          │          │          │          │
┌────┴───┐ ┌───┴────┐ ┌───┴────┐ ┌───┴────┐ ┌───┴────┐
│  API   │ │  API   │ │  API   │ │  API   │ │  API   │
│ Shard1 │ │ Shard2 │ │ Shard3 │ │ Shard4 │ │ Shard5 │
└────┬───┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
     │          │          │          │          │
     └──────────┴──────────┴──────────┴──────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         ┌────┴────┐ ┌────┴────┐ ┌────┴────┐
         │PostgreSQL│ │PostgreSQL│ │PostgreSQL│
         │  Primary │ │ Replica  │ │ Replica  │
         └──────────┘ └──────────┘ └──────────┘
```

### 7.2 Sharding Strategy

| Data Type | Shard Key | Rationale |
|----------|-----------|----------|
| User Data | userId | Per-user isolation |
| Content | ownerId + time | Circle queries |
| Social Graph | ownerId | Circle membership |
| Activity | timestamp | Feed queries |

### 7.3 Caching Strategy

```
┌─────────────────────────────────────────────┐
│                   Cache                     │
├─────────────────────────────────────────────┤
│ L1: Browser (IndexedDB) - Offline first   │
│ L2: CDN (Cloudflare) - Public content       │
│ L3: Redis (In-memory) - Session/presence   │
│ L4: PostgreSQL - Source of truth            │
└─────────────────────────────────────────────┘
```

---

## 8. Network API Specification

### 8.1 Core Endpoints

```yaml
/api/v1/sync:
  POST /sync:
    body: { cursor, vectorClock, changes }
    response: { events, newCursor, merkleRoot }

/api/v1/p2p:
  GET /signal/{peerId}: WebRTC signaling
  POST /offer: SDP offer
  POST /answer: SDP answer
  POST /ice: ICE candidates

/api/v1/federation:
  GET /.well-known/did: DID document
  GET /actor/{did}: Profile
  POST /inbox: Receive activity
  GET /outbox: Public activities

/api/v1/presence:
  GET /presence/{did}: Online status
  POST /presence: Update status
  SSE /presence/stream: Real-time updates
```

### 8.2 Message Types

```javascript
// Sync Message
{ type: 'sync', payload: { events: [...], vectorClock: {} } }

// Signal Message (WebRTC)
{ type: 'signal', payload: { offer: {}, answer: {}, ice: [] } }

// Presence Message
{ type: 'presence', payload: { online: true, status: 'available' } }

// Activity (Federation)
{ type: 'Create', actor: 'did:...', object: { type: 'AIChatUnit' } }
```

---

## 9. Deployment Options

### 9.1 Self-Hosted (Recommended)

```yaml
# docker-compose.yml for self-hosted
services:
  pds:
    image: vivim/pds:latest
    ports:
      - "443:443"
    volumes:
      - data:/data
    environment:
      - DID=did:key:z...
      - PRIVATE_KEY=...
      
  relay:
    image: vivim/relay:latest
    ports:
      - "443:443"
    depends_on:
      - pds
      
  turn:
    image: coturn/coturn:latest
    ports:
      - "3478:3478"
      - "3478:3478/udp"
```

### 9.2 Cloud Deployment

```yaml
# Kubernetes (cloud)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vivim-pds
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: pds
        image: vivim/pds:latest
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "8Gi"
            cpu: "4"
```

---

## 10. Summary

The VIVIM network architecture provides:

| Feature | Implementation |
|---------|----------------|
| **Identity** | DID-based, portable |
| **Communication** | HTTPS + WebSocket + WebRTC |
| **Sync** | CRDT-based eventual consistency |
| **Federation** | ActivityPub extension |
| **Security** | E2E encryption, zero-knowledge |
| **Scalability** | Horizontal sharding, CDN |
| **Deployment** | Self-hosted or cloud |

This architecture supports the privacy-first principles of VIVIM while providing a robust, scalable foundation for the social platform.
