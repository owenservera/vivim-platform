# Virtual User Identification System

## Overview

A comprehensive no-login identification system that creates and manages virtual user identities based on device fingerprinting, behavioral patterns, and persistent identifiers. Virtual users get the full suite of memory and context features without requiring traditional authentication.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ Fingerprint │  │ Virtual      │  │ Memory/Context      │    │
│  │ SDK         │  │ Session Mgr  │  │ API Client          │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
│         │                │                       │               │
│         ▼                ▼                       ▼               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Virtual User Identification Layer           │    │
│  │  - Device Fingerprint  - Cookie/LocalStorage             │    │
│  │  - IP/UA Matching      - Behavioral Signals              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Server                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Virtual User Identification API              │   │
│  │  POST /api/v1/virtual/identify  - Identify or create      │   │
│  │  GET  /api/v1/virtual/profile   - Get virtual profile     │   │
│  │  POST /api/v1/virtual/merge     - Merge virtual users     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Virtual User Manager Service                 │   │
│  │  - Fingerprint matching  - Identity resolution            │   │
│  │  - Profile building      - Merge/split logic              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Device Fingerprinting Service                   │   │
│  │  - Canvas/WebGL fingerprints  - Audio context             │   │
│  │  - Font detection           - Hardware concurrency        │   │
│  │  - Screen/battery info      - IP/Timezone analysis        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Virtual Memory Adapter                          │   │
│  │  - Extends existing Memory Service                        │   │
│  │  - Same encryption, vector search, consolidation          │   │
│  │  - Virtual user namespace isolation                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Virtual Context Engine                          │   │
│  │  - Adapts Context Pipeline for virtual users              │   │
│  │  - Same L0-L6 layers, virtual namespace                   │   │
│  │  - Session-based context bundles                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ VirtualUser  │  │ Virtual      │  │ VirtualMemory        │  │
│  │ - id (uuid)  │  │ Session      │  │ - Extends Memory     │  │
│  │ - fingerprint│  │ - id (uuid)  │  │ - Virtual user FK    │  │
│  │ - confidence │  │ - virtualId  │  │ - Same schema +      │  │
│  │ - signals    │  │ - signals    │  │   virtual namespace  │  │
│  │ - metadata   │  │ - expires    │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Virtual      │  │ Virtual      │                            │
│  │ Conversation │  │ ACU          │                            │
│  │ - Same as    │  │ - Same as    │                            │
│  │ Conversation │  │ ACU with     │                            │
│  │ + virtual FK │  │ virtual FK   │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Identification Signals

### Primary Signals (High Confidence)

| Signal | Description | Persistence | Confidence Weight |
|--------|-------------|-------------|-------------------|
| **Device Fingerprint** | Canvas + WebGL + Audio + Fonts | Very High | 40% |
| **Virtual User Cookie** | Secure HttpOnly session cookie | Medium | 30% |
| **IP + User Agent + Timezone** | Network/browser signature | Low-Medium | 15% |
| **Screen/Battery/Touch** | Hardware characteristics | High | 15% |

### Secondary Signals (Supporting)

| Signal | Description | Use Case |
|--------|-------------|----------|
| **Behavioral Patterns** | Typing rhythm, mouse movement | Continuous verification |
| **Local Storage Token** | Persistent identifier | Cookie fallback |
| **TLS Fingerprint** | JA3/TLS signature | Advanced identification |
| **WebRTC Leak** | Local IP addresses | Additional signal |

### Confidence Scoring

```typescript
interface IdentificationConfidence {
  score: number;        // 0-100
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: {
    fingerprint: number;   // 0-100
    cookie: number;        // 0-100
    ip_ua: number;         // 0-100
    behavioral: number;    // 0-100
  };
  threshold: {
    auto_identify: 75;     // Auto-identify if >= 75
    suggest_merge: 60;     // Suggest merge if >= 60
    create_new: 0;         // Create new virtual user
  };
}
```

## Virtual User Lifecycle

### 1. First Visit (Anonymous)
```
User visits website
    │
    ▼
Collect identification signals
    │
    ▼
Calculate device fingerprint
    │
    ▼
Search existing virtual users
    │
    ├─► Match found (confidence >= 75)
    │       │
    │       ▼
    │   Load existing virtual user
    │   Restore session
    │   Load memories & context
    │
    └─► No match (confidence < 75)
            │
            ▼
        Create new virtual user
            │
            ▼
        Generate virtual user ID (uuid)
            │
            ▼
        Store fingerprint + signals
            │
            ▼
        Set session cookie + local storage token
```

### 2. Returning User
```
User returns to website
    │
    ▼
Collect identification signals
    │
    ▼
Search virtual users (fingerprint + signals)
    │
    ▼
Calculate confidence score
    │
    ├─► HIGH (>= 75): Auto-identify
    │       │
    │       ▼
    │   Load virtual user profile
    │   Load memories from past conversations
    │   Resume context
    │
    ├─► MEDIUM (60-74): Suggest merge
    │       │
    │       ▼
    │   "We found a previous session, is this you?"
    │       │
    │       ├─► Yes: Merge and continue
    │       └─► No: Create new virtual user
    │
    └─► LOW (< 60): Create new
            │
            ▼
        Create new virtual user
```

### 3. Profile Building
```
Virtual user interacts with chatbot
    │
    ▼
Conversations stored
    │
    ▼
Memory extraction (LLM-powered)
    │
    ▼
Memories stored with virtual user FK
    │
    ▼
Topic profiles updated
    │
    ▼
Entity profiles created/updated
    │
    ▼
Context bundles rebuilt
    │
    ▼
Profile becomes more personalized over time
```

### 4. Virtual User Merge
```
Multiple virtual users detected as same person
    │
    ▼
Trigger: Confidence score + manual confirmation
    │
    ▼
Merge process:
    ├─► Combine memories (deduplicate)
    ├─► Merge conversations
    ├─► Consolidate topic profiles
    ├─► Merge entity profiles
    ├─► Transfer ACUs
    ├─► Archive source virtual users
    │
    ▼
Update fingerprint with combined signals
```

## Database Schema Extensions

### VirtualUser Model
```prisma
model VirtualUser {
  id                    String    @id @default(uuid())
  fingerprint           String    @unique  // Composite fingerprint hash
  confidenceScore       Float     @default(50)
  
  // Identification signals (encrypted)
  fingerprintSignals    Json      // Raw fingerprint components
  ipHistory             Json      // Historical IP addresses
  userAgentHistory      Json      // Historical user agents
  deviceCharacteristics Json      // Screen, battery, touch, etc.
  
  // Profile (built over time)
  displayName           String?   // Auto-generated or user-provided
  topicInterests        Json      @default("[]")
  entityProfiles        Json      @default("[]")
  conversationCount     Int       @default(0)
  memoryCount           Int       @default(0)
  firstSeenAt           DateTime  @default(now())
  lastSeenAt            DateTime  @updatedAt
  lastIpAddress         String?
  
  // Privacy & compliance
  consentGiven          Boolean   @default(false)
  consentTimestamp      DateTime?
  dataRetentionPolicy   String    @default("90_days")
  anonymizedAt          DateTime?
  deletedAt             DateTime?
  
  // Relations
  sessions              VirtualSession[]
  memories              VirtualMemory[]
  conversations         VirtualConversation[]
  acus                  VirtualACU[]
  notebooks             VirtualNotebook[]
  
  @@index([fingerprint])
  @@index([lastSeenAt])
  @@index([confidenceScore])
}
```

### VirtualSession Model
```prisma
model VirtualSession {
  id              String    @id @default(uuid())
  virtualUserId   String
  virtualUser     VirtualUser @relation(fields: [virtualUserId], references: [id], onDelete: Cascade)
  
  sessionToken    String    @unique
  fingerprint     String    // Session-specific fingerprint
  
  // Session signals
  ipAddress       String?
  userAgent       String?
  timezone        String?
  language        String?
  screenResolution String?
  
  // Session state
  isActive        Boolean   @default(true)
  expiresAt       DateTime
  createdAt       DateTime  @default(now())
  lastActivityAt  DateTime  @updatedAt
  
  // Context state
  activeConversationId String?
  contextBundleVersion String?
  
  @@index([virtualUserId])
  @@index([sessionToken])
  @@index([expiresAt])
}
```

### VirtualMemory Model
```prisma
model VirtualMemory {
  id                    String    @id @default(uuid())
  virtualUserId         String
  virtualUser           VirtualUser @relation(fields: [virtualUserId], references: [id], onDelete: Cascade)
  
  // Inherits Memory schema
  content               String    // ENCRYPTED
  summary               String?   // ENCRYPTED
  memoryType            MemoryType
  category              String
  subcategory           String?
  tags                  String[]
  importance            Float
  relevance             Float
  accessCount           Int       @default(0)
  isPinned              Boolean   @default(false)
  isArchived            Boolean   @default(false)
  embedding             Float[]   // Vector for semantic search
  embeddingModel        String?
  embeddingDimension    Int?
  sourceConversationIds String[]
  sourceAcuIds          String[]
  relatedMemoryIds      String[]
  metadata              Json
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([virtualUserId])
  @@index([memoryType])
  @@index([category])
  @@index([tags])
  @@index([embedding])
}
```

### VirtualConversation Model
```prisma
model VirtualConversation {
  id              String    @id @default(uuid())
  virtualUserId   String
  virtualUser     VirtualUser @relation(fields: [virtualUserId], references: [id], onDelete: Cascade)
  
  // Inherits Conversation schema
  title           String?
  metadata        Json      @default("{}")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  messages        VirtualMessage[]
  acus            VirtualACU[]
  
  @@index([virtualUserId])
  @@index([createdAt])
}
```

## Privacy & Compliance

### Data Retention Policies

| Policy | Duration | Auto-delete |
|--------|----------|-------------|
| **7_days** | 7 days | Yes |
| **30_days** | 30 days | Yes |
| **90_days** | 90 days | Yes (default) |
| **1_year** | 1 year | Yes |
| **indefinite** | Until manual delete | No |

### GDPR Compliance

- **Consent Required**: Before storing any virtual user data
- **Right to Access**: Export all virtual user data
- **Right to Erasure**: Complete deletion with cascade
- **Data Portability**: JSON export format
- **Transparency**: Access audit logs

### Anonymization Process

```typescript
async function anonymizeVirtualUser(virtualUserId: string) {
  // 1. Remove PII from memories
  await memoryService.anonymizeContent(virtualUserId);
  
  // 2. Hash fingerprint signals
  await virtualUserManager.hashSignals(virtualUserId);
  
  // 3. Remove IP history
  await virtualUserManager.clearIpHistory(virtualUserId);
  
  // 4. Delete sessions
  await virtualSessionManager.deleteAll(virtualUserId);
  
  // 5. Mark as anonymized
  await db.virtualUser.update({
    where: { id: virtualUserId },
    data: {
      anonymizedAt: new Date(),
      fingerprintSignals: {},
      ipHistory: [],
      userAgentHistory: [],
      deviceCharacteristics: {},
    }
  });
}
```

## API Reference

### Identification Endpoints

#### POST /api/v1/virtual/identify
Identify or create a virtual user based on signals.

**Request:**
```json
{
  "fingerprint": "sha256:abc123...",
  "signals": {
    "canvas": "data:image/png;base64,...",
    "webgl": "vendor_id,renderer_id",
    "audio": "hash_value",
    "fonts": ["font1", "font2"],
    "screen": { "width": 1920, "height": 1080 },
    "battery": { "level": 0.8, "charging": false },
    "touch": { "points": 10 },
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "timezone": "America/New_York",
    "language": "en-US"
  },
  "existingSessionToken": "optional_token"
}
```

**Response:**
```json
{
  "virtualUserId": "uuid",
  "sessionToken": "new_session_token",
  "identification": {
    "confidence": 92,
    "level": "HIGH",
    "isExisting": true,
    "matchedSignals": ["fingerprint", "cookie", "ip_ua"]
  },
  "profile": {
    "displayName": "Virtual User #1234",
    "conversationCount": 15,
    "memoryCount": 47,
    "topicInterests": ["technology", "science"],
    "firstSeenAt": "2025-01-15T10:30:00Z",
    "lastSeenAt": "2026-03-27T14:22:00Z"
  },
  "consentRequired": true
}
```

#### POST /api/v1/virtual/consent
Provide consent for data storage.

**Request:**
```json
{
  "virtualUserId": "uuid",
  "sessionToken": "token",
  "consentGiven": true,
  "dataRetentionPolicy": "90_days"
}
```

#### GET /api/v1/virtual/profile
Get virtual user profile with memories and context.

**Request:**
```
GET /api/v1/virtual/profile?virtualUserId=uuid&sessionToken=token
```

**Response:**
```json
{
  "virtualUserId": "uuid",
  "profile": { ... },
  "recentConversations": [...],
  "recentMemories": [...],
  "topicProfiles": [...],
  "entityProfiles": [...]
}
```

#### POST /api/v1/virtual/merge
Merge two virtual users.

**Request:**
```json
{
  "sourceVirtualUserId": "uuid1",
  "targetVirtualUserId": "uuid2",
  "sessionToken": "token",
  "reason": "confidence_match|manual"
}
```

#### DELETE /api/v1/virtual/account
Delete virtual user and all data.

**Request:**
```
DELETE /api/v1/virtual/account?virtualUserId=uuid&sessionToken=token
```

### Conversation Endpoints (Virtual User Compatible)

#### POST /api/v1/virtual/conversations
Create a new conversation.

#### GET /api/v1/virtual/conversations
List virtual user's conversations.

#### POST /api/v1/virtual/chat
Send a message and get AI response with full context.

## Frontend SDK

### Installation
```bash
npm install @vivim/virtual-user-sdk
```

### Usage
```typescript
import { VirtualUserSDK } from '@vivim/virtual-user-sdk';

const sdk = new VirtualUserSDK({
  apiUrl: 'https://api.vivim.com',
  consentRequired: true,
  autoIdentify: true,
  dataRetentionPolicy: '90_days'
});

// Initialize and identify user
await sdk.initialize();

// Get virtual user state
const state = sdk.getState();
console.log(state.virtualUserId);
console.log(state.confidence);
console.log(state.profile);

// Listen for events
sdk.on('identified', (data) => {
  console.log('User identified:', data);
});

sdk.on('consentRequired', () => {
  showConsentModal();
});

// Give consent
await sdk.giveConsent({
  dataRetentionPolicy: '90_days'
});

// Chat with context
const response = await sdk.chat({
  message: 'Hello, remember me?',
  conversationId: 'optional_id'
});

// Export data
const exportData = await sdk.exportData();
```

### Fingerprinting Module
```typescript
import { FingerprintGenerator } from '@vivim/virtual-user-sdk';

const generator = new FingerprintGenerator();

const fingerprint = await generator.generate({
  includeCanvas: true,
  includeWebGL: true,
  includeAudio: true,
  includeFonts: true,
  includeScreen: true,
  includeBattery: true,
  includeTouch: true
});

console.log(fingerprint.hash);
console.log(fingerprint.signals);
```

## Security Considerations

### Fingerprint Spoofing Prevention

1. **Multi-signal verification**: Require multiple matching signals
2. **Behavioral analysis**: Detect automated/bot behavior
3. **Rate limiting**: Prevent brute-force identification attempts
4. **Signal encryption**: Encrypt stored fingerprint signals
5. **Confidence decay**: Reduce confidence over time without activity

### Session Security

1. **Secure cookies**: HttpOnly, Secure, SameSite=Strict
2. **Token rotation**: Rotate session tokens periodically
3. **Expiration**: Sessions expire after inactivity
4. **IP binding**: Optional IP address binding for high-security scenarios

### Data Protection

1. **Encryption at rest**: All memories and signals encrypted
2. **Encryption in transit**: TLS 1.3 required
3. **Access controls**: Virtual users can only access their own data
4. **Audit logging**: All access logged for transparency

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Database schema migrations
- [ ] VirtualUser model and repository
- [ ] VirtualSession management
- [ ] Basic fingerprinting service

### Phase 2: Identification Engine
- [ ] Multi-signal confidence scoring
- [ ] Fingerprint matching algorithm
- [ ] Virtual user creation flow
- [ ] Session cookie management

### Phase 3: Memory Integration
- [ ] VirtualMemory adapter
- [ ] Memory extraction for virtual users
- [ ] Vector search integration
- [ ] Memory consolidation

### Phase 4: Context Engine
- [ ] Virtual context pipeline
- [ ] Context bundle generation
- [ ] Topic/entity profiling
- [ ] Context prediction

### Phase 5: API & SDK
- [ ] REST API endpoints
- [ ] Frontend SDK
- [ ] Consent management UI
- [ ] Documentation

### Phase 6: Privacy & Compliance
- [ ] GDPR compliance features
- [ ] Data retention automation
- [ ] Anonymization workflows
- [ ] Export/delete functionality

### Phase 7: Optimization & Testing
- [ ] Performance optimization
- [ ] Load testing
- [ ] Security audit
- [ ] Edge case handling

## Metrics & Monitoring

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Identification Rate** | % of returning users identified | > 85% |
| **False Positive Rate** | Incorrect identifications | < 1% |
| **False Negative Rate** | Missed identifications | < 15% |
| **Confidence Distribution** | HIGH/MEDIUM/LOW split | 70/20/10 |
| **Session Duration** | Average session length | > 10 min |
| **Return Rate** | % of virtual users returning | > 40% |
| **Memory Growth** | Memories per user over time | > 5/week |

### Monitoring Dashboards

1. **Identification Health**: Confidence scores, match rates
2. **Session Analytics**: Active sessions, duration, churn
3. **Memory Growth**: Memories created, accessed, consolidated
4. **Privacy Compliance**: Consent rates, deletion requests
