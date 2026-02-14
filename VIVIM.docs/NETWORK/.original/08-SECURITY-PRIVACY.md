# Security and Privacy Model

## Overview

This document outlines the comprehensive security and privacy architecture for VIVIM's network sharing system. The model ensures that user data remains protected while enabling intelligent content sharing across the decentralized network.

## Database Isolation Security

The dual-database architecture provides enhanced security through physical data isolation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       IDENTITY LAYER                                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐   │  │
│  │  │    DID     │  │  Key Mgmt   │  │    Credential Verification   │   │  │
│  │  │  System    │  │             │  │    (Master DB)              │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│  ┌──────────────────────────────────┼────────────────────────────────────┐  │
│  │                  USER DATABASE ISOLATION LAYER                       │  │
│  │  ┌─────────────────────────────────────────────────────────────┐    │  │
│  │  │  Each user has their own SQLite database file:             │    │  │
│  │  │  - File system-level isolation                              │    │  │
│  │  │  - Database file owned by user                             │    │  │
│  │  │  - No cross-user database queries possible                 │    │  │
│  │  └─────────────────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│  ┌──────────────────────────────────┼────────────────────────────────────┐  │
│  │                       ENCRYPTION LAYER                                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐   │  │
│  │  │  Symmetric  │  │  Asymmetric │  │   Key Encapsulation          │   │  │
│  │  │  (AES-256)  │  │   (Kyber)   │  │    (Post-Quantum)            │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│  ┌──────────────────────────────────┼────────────────────────────────────┐  │
│  │                       ACCESS CONTROL LAYER                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐   │  │
│  │  │   Policy   │  │  Capability │  │    Circle-Based ACL          │   │  │
│  │  │   Engine   │  │   Tokens    │  │    (Master DB)               │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│  ┌──────────────────────────────────┼────────────────────────────────────┐  │
│  │                       AUDIT & COMPLIANCE                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐   │  │
│  │  │  Logging   │  │  Monitoring │  │    Privacy-Preserving       │   │  │
│  │  │            │  │             │  │    Analytics                 │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Identity and Authentication

### Decentralized Identifier (DID) System

VIVIM uses DIDs for user identity:

```typescript
// DID Structure
interface VIVIMDID {
  did: string;                    // "did:vivim:AbCd1234..."
  method: 'vivim';
  identifier: string;             // Unique identifier
  version: number;                // DID version
  
  // Associated keys
  publicKeys: PublicKey[];
  
  // Service endpoints
  serviceEndpoints: ServiceEndpoint[];
}
```

### User Database Isolation

Each user has their own isolated SQLite database with enhanced security:

```typescript
class UserDatabaseSecurity {
  // Ensure complete isolation between user databases
  async getUserClient(userDid: string): Promise<PrismaClient> {
    // Verify user exists in Master DB
    const user = await this.masterDb.user.findUnique({
      where: { did: userDid }
    });
    
    if (!user) {
      throw new SecurityError('User not found in Master DB');
    }
    
    // Get user's isolated SQLite database
    // Each user can ONLY access their own database
    return this.userDatabaseManager.getUserClient(userDid);
  }
  
  // Prevent cross-user database access
  async validateAccess(
    userDid: string,
    resourceOwnerDid: string
  ): Promise<boolean> {
    // Users can only access their own database directly
    // Cross-user access requires going through Master DB policies
    return userDid === resourceOwnerDid;
  }
}
```

### Database File Security

```typescript
// User database files are stored with strict permissions
const DATABASE_SECURITY = {
  // File permissions: owner read/write only (600)
  fileMode: 0o600,
  
  // Directory permissions: owner only (700)
  directoryMode: 0o700,
  
  // Isolation: each user has separate database file
  // {USER_DB_DIR}/{sanitized_did}.db
  
  // No network exposure: SQLite files are local only
  // All network traffic goes through the API layer
};
```

### Authentication Flow

```typescript
// Authentication using DID Auth
class AuthenticationService {
  // Generate authentication challenge
  async createChallenge(did: string): Promise<AuthChallenge> {
    const challenge = randomBytes(32).toString('base64');
    
    // Store challenge with expiration
    await this.cache.set(`auth:${did}:${challenge}`, {
      did,
      expiresAt: Date.now() + 300000 // 5 minutes
    }, { ttl: 300 });
    
    return {
      challenge,
      expiresIn: 300
    };
  }
  
  // Verify authentication response
  async verifyResponse(response: AuthResponse): Promise<AuthResult> {
    const { did, signature, challenge } = response;
    
    // Verify challenge exists and is valid
    const stored = await this.cache.get(`auth:${did}:${challenge}`);
    if (!stored) {
      throw new AuthError('Invalid or expired challenge');
    }
    
    // Verify signature
    const publicKey = await this.getPublicKey(did);
    const isValid = await this.verifySignature(
      challenge,
      signature,
      publicKey
    );
    
    if (!isValid) {
      throw new AuthError('Invalid signature');
    }
    
    // Generate session token
    const token = await this.createSession(did);
    
    return { token, did };
  }
}
```

### Session Management

```typescript
interface Session {
  id: string;
  did: string;
  deviceId: string;
  createdAt: Date;
  expiresAt: Date;
  permissions: string[];
  metadata: {
    deviceName: string;
    ipAddress: string;
    userAgent: string;
  };
}
```

## Encryption

### Content Encryption

All shared content is encrypted using AES-256-GCM:

```typescript
class ContentEncryption {
  // Generate random key
  generateContentKey(): Buffer {
    return randomBytes(32); // 256 bits
  }
  
  // Encrypt content
  async encrypt(
    plaintext: Buffer,
    key: Buffer
  ): Promise<EncryptedContent> {
    const nonce = randomBytes(12);
    const cipher = new AESGCM(key);
    
    const ciphertext = cipher.encrypt(nonce, plaintext, null);
    
    return {
      ciphertext: ciphertext.toString('base64'),
      nonce: nonce.toString('base64'),
      algorithm: 'AES-256-GCM'
    };
  }
  
  // Decrypt content
  async decrypt(
    encrypted: EncryptedContent,
    key: Buffer
  ): Promise<Buffer> {
    const cipher = new AESGCM(key);
    const nonce = Buffer.from(encrypted.nonce, 'base64');
    const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');
    
    return cipher.decrypt(nonce, ciphertext, null);
  }
}
```

### Key Encapsulation

Keys are encapsulated using Kyber (post-quantum secure):

```typescript
class KeyEncapsulation {
  // Generate key pair
  async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await Kyber.generateKeyPair();
    return {
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey
    };
  }
  
  // Encapsulate key for recipient
  async encapsulate(
    recipientPublicKey: Buffer,
    contentKey: Buffer
  ): Promise<KeyCapsule> {
    const { ciphertext, sharedSecret } = await Kyber.encapsulate(
      recipientPublicKey,
      contentKey
    );
    
    return {
      ciphertext: ciphertext.toString('base64'),
      // Note: sharedSecret should equal contentKey for encryption
    };
  }
  
  // Decapsulate key
  async decapsulate(
    capsule: KeyCapsule,
    recipientSecretKey: Buffer
  ): Promise<Buffer> {
    const ciphertext = Buffer.from(capsule.ciphertext, 'base64');
    const sharedSecret = await Kyber.decapsulate(
      ciphertext,
      recipientSecretKey
    );
    
    return sharedSecret;
  }
}
```

### Encryption Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENCRYPTION FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SENDER SIDE                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. Generate random content key (AES-256)                          │   │
│  │        contentKey = randomBytes(32)                                 │   │
│  │                                                                     │   │
│  │  2. Encrypt content with content key (AES-256-GCM)                │   │
│  │        ciphertext = AES-GCM.encrypt(plaintext, contentKey)         │   │
│  │                                                                     │   │
│  │  3. For each recipient:                                            │   │
│  │     a. Get recipient's Kyber public key                           │   │
│  │     b. Encapsulate content key with Kyber                         │   │
│  │        capsule = Kyber.encapsulate(recipientPubKey, contentKey)   │   │
│  │     c. Store capsule with content                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  RECIPIENT SIDE                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. Receive encrypted content + key capsule                       │   │
│  │                                                                     │   │
│  │  2. Decapsulate using own Kyber secret key                        │   │
│  │        contentKey = Kyber.decapsulate(capsule, mySecretKey)       │   │
│  │                                                                     │   │
│  │  3. Decrypt content with recovered key                            │   │
│  │        plaintext = AES-GCM.decrypt(ciphertext, contentKey)        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Access Control

### Policy Engine

The Policy Engine enforces sharing policies:

```typescript
class PolicyEngine {
  // Evaluate access request
  async evaluate(
    request: AccessRequest,
    context: AccessContext
  ): Promise<PolicyDecision> {
    // Check intent policy
    const intentPolicy = await this.checkIntentPolicy(request, context);
    if (!intentPolicy.allowed) {
      return intentPolicy;
    }
    
    // Check circle policy
    const circlePolicy = await this.checkCirclePolicy(request, context);
    if (!circlePolicy.allowed) {
      return circlePolicy;
    }
    
    // Check user policy
    const userPolicy = await this.checkUserPolicy(request, context);
    if (!userPolicy.allowed) {
      return userPolicy;
    }
    
    // Check rate limiting
    const rateLimit = await this.checkRateLimit(request, context);
    if (!rateLimit.allowed) {
      return rateLimit;
    }
    
    return { allowed: true };
  }
  
  // Check intent-specific policies
  async checkIntentPolicy(
    request: AccessRequest,
    context: AccessContext
  ): Promise<PolicyDecision> {
    const intent = await this.getIntent(request.intentId);
    
    // Check if intent is active
    if (intent.status !== 'ACTIVE') {
      return {
        allowed: false,
        reason: 'Intent is not active'
      };
    }
    
    // Check expiration
    if (intent.expiresAt && new Date() > intent.expiresAt) {
      return {
        allowed: false,
        reason: 'Intent has expired'
      };
    }
    
    // Check permissions
    const requiredPermission = request.permission;
    const hasPermission = intent.permissions[requiredPermission];
    
    if (!hasPermission) {
      return {
        allowed: false,
        reason: `Missing required permission: ${requiredPermission}`
      };
    }
    
    return { allowed: true };
  }
}
```

### Capability Tokens

Access is controlled through capability tokens:

```typescript
interface CapabilityToken {
  // Token identification
  id: string;
  type: CapabilityType;
  
  // Grant
  issuer: string;           // DID of issuer
  subject: string;          // DID of subject
  audience: string;         // Intended recipient
  
  // Resource
  resource: string;         // Content ID
  permissions: Permission[];
  
  // Constraints
  validFrom: Date;
  validUntil: Date;
  maxUses?: number;
  usesCount: number;
  
  // Metadata
  nonce: string;
  context?: Record<string, any>;
  
  // Signature
  signature: string;
}
```

### Circle-Based Access Control

```typescript
class CircleAccessControl {
  // Check circle membership
  async checkMembership(
    userDid: string,
    circleId: string
  ): Promise<CircleMembershipStatus> {
    const membership = await this.db.circleMember.findUnique({
      where: {
        circleId_userId: { circleId, userId: userDid }
      }
    });
    
    if (!membership) {
      return { isMember: false };
    }
    
    return {
      isMember: true,
      role: membership.role,
      canInvite: membership.canInvite,
      canShare: membership.canShare,
      joinedAt: membership.joinedAt
    };
  }
  
  // Check circle sharing permissions
  async checkCirclePermissions(
    userDid: string,
    circleId: string,
    permission: string
  ): Promise<boolean> {
    const membership = await this.checkMembership(userDid, circleId);
    
    if (!membership.isMember) {
      return false;
    }
    
    // Check role-based permissions
    const rolePermissions = await this.getRolePermissions(
      membership.role,
      circleId
    );
    
    return rolePermissions.includes(permission);
  }
}
```

## Privacy Protection

### Data Minimization

```typescript
class PrivacyProtection {
  // Minimize collected data
  minimizeData(event: AnalyticsEvent): AnonymizedEvent {
    return {
      // Remove PII
      eventType: event.eventType,
      timestamp: event.timestamp,
      
      // Generalize exact values
      contentType: this.generalize(event.contentType),
      audienceSize: this.generalize(event.audienceSize, 'range'),
      
      // Remove exact identifiers - use Master DB reference only
      actorDid: undefined, // Remove entirely, use ID only
      
      // Add noise for differential privacy
      metric: this.addNoise(event.metric, epsilon = 0.1)
    };
  }
  
  // User data isolation - each user's data in their own SQLite
  async getUserData(
    userDid: string,
    dataType: string
  ): Promise<any> {
    // Get user's isolated database
    const userDb = await this.userDatabaseManager.getUserClient(userDid);
    
    // Query only from user's database
    // No cross-user queries possible
    switch (dataType) {
      case 'conversations':
        return userDb.conversation.findMany();
      case 'profiles':
        return userDb.topicProfile.findMany();
      case 'context':
        return userDb.contextBundle.findMany();
    }
  }
  
  // Apply k-anonymity
  applyKAnonymity(data: DataPoint[], k: number): DataPoint[] {
    // Group by quasi-identifiers
    const groups = this.groupBy(data, ['audienceType', 'contentType']);
    
    // Suppress groups with less than k members
    return data.filter(point => {
      const group = groups.get(this.getGroupKey(point));
      return group.length >= k;
    });
  }
}
```

### Privacy Settings

```typescript
interface PrivacySettings {
  // Data collection
  allowAnalytics: boolean;
  allowPersonalizedAds: boolean;
  
  // Sharing
  defaultVisibility: 'private' | 'circle' | 'public';
  requireApprovalForCircleShare: boolean;
  blockUnknownUsers: boolean;
  
  // Discovery
  allowDiscovery: boolean;
  showInPublicDirectory: boolean;
  
  // Retention
  dataRetentionPeriod: '30d' | '90d' | '1y' | 'forever';
  autoDeleteExpiredShares: boolean;
  
  // Export
  allowDataExport: boolean;
  includeAnalyticsInExport: boolean;
}
```

### Consent Management

```typescript
class ConsentManager {
  // Record consent
  async recordConsent(
    userDid: string,
    consent: UserConsent
  ): Promise<ConsentRecord> {
    const record = await this.db.consentRecord.create({
      data: {
        userDid,
        type: consent.type,
        granted: consent.granted,
        version: consent.version,
        timestamp: new Date(),
        ipAddress: consent.ipAddress, // Hash for audit
        userAgent: consent.userAgent
      }
    });
    
    // Update user's privacy settings
    await this.applyConsent(userDid, consent);
    
    return record;
  }
  
  // Check consent
  async hasConsent(userDid: string, consentType: string): Promise<boolean> {
    const record = await this.db.consentRecord.findFirst({
      where: {
        userDid,
        type: consentType,
        granted: true
      },
      orderBy: { timestamp: 'desc' }
    });
    
    // Check if consent is still valid (not expired)
    if (record && record.expiresAt) {
      return new Date() < record.expiresAt;
    }
    
    return !!record;
  }
}
```

## Audit Logging

### Security Events

```typescript
interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  
  // Actor
  actorDid: string;
  actorIp: string;
  actorDevice: string;
  
  // Action
  action: string;
  resource: string;
  result: 'success' | 'failure';
  
  // Context
  timestamp: Date;
  metadata: Record<string, any>;
}

enum SecurityEventType {
  AUTH_LOGIN = 'auth:login',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_FAILURE = 'auth:failure',
  
  SHARE_CREATE = 'share:create',
  SHARE_ACCESS = 'share:access',
  SHARE_REVOKE = 'share:revoke',
  
  KEY_REQUEST = 'key:request',
  KEY_GENERATE = 'key:generate',
  
  POLICY_VIOLATION = 'policy:violation',
  RATE_LIMIT_EXCEEDED = 'rate:exceeded'
}
```

### Audit Log Access

```typescript
class AuditLogger {
  // Log security event
  async log(event: SecurityEvent): Promise<void> {
    // Write to immutable log
    await this.auditLog.append({
      ...event,
      // Add server-side metadata
      serverTimestamp: new Date(),
      serverId: this.serverId
    });
    
    // Check for suspicious patterns
    await this.checkAnomalies(event);
  }
  
  // Query audit logs (admin only)
  async query(
    filters: AuditQueryFilters,
    pagination: Pagination
  ): Promise<AuditLogEntry[]> {
    // Verify admin permissions
    await this.verifyAdminAccess(filters.requestingDid);
    
    return this.auditLog.query(filters, pagination);
  }
}
```

## Threat Model

### Identified Threats

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Unauthorized access | Critical | Encryption + Access Control |
| Key compromise | Critical | Key rotation + Forward secrecy |
| Replay attacks | High | Nonces + Timestamps |
| Man-in-the-middle | High | TLS + Certificate pinning |
| Content tampering | High | Hash verification + Signatures |
| Privacy leakage | Critical | Encryption + Data minimization |
| Denial of service | Medium | Rate limiting + Caching |
| Social engineering | Medium | User education + Anomaly detection |

### Security Controls

```typescript
// Rate limiting
const rateLimiter = new TokenBucketRateLimiter({
  capacity: 100,
  refillRate: 10, // per second
  burstSize: 20
});

// Input validation
const validator = new InputValidator({
  maxStringLength: 10000,
  maxArrayLength: 100,
  allowNull: false,
  sanitizeHtml: true
});

// SQL injection prevention
const queryBuilder = new ParameterizedQueryBuilder();

// XSS prevention
const sanitizer = new DOMPurify();
```

## Compliance

### Data Protection Regulations

| Regulation | Requirement | Implementation |
|------------|-------------|----------------|
| GDPR | Right to access | Export API |
| GDPR | Right to erasure | Deletion API |
| GDPR | Data portability | Export API |
| GDPR | Consent management | Consent Manager |
| CCPA | Opt-out | Privacy settings |
| COPPA | Age verification | Age gate |

### Data Retention

```typescript
const retentionPolicy: RetentionPolicy = {
  // Raw events: 30 days
  analyticsEvents: { retention: '30d', archive: false },
  
  // Aggregated metrics: 1 year
  aggregatedMetrics: { retention: '1y', archive: true },
  
  // Audit logs: 7 years
  auditLogs: { retention: '7y', archive: true },
  
  // User data: Until deletion
  userData: { retention: 'indefinite', archive: false },
  
  // Deleted content: Immediately
  deletedContent: { retention: '0d', archive: false }
};
```

## Incident Response

### Security Incident Types

```typescript
enum IncidentSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

interface SecurityIncident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  affectedUsers: string[];
  rootCause?: string;
  remediation?: string;
}
```

### Response Procedures

```typescript
class IncidentResponse {
  async handleIncident(incident: SecurityIncident): Promise<void> {
    // 1. Contain
    await this.contain(incident);
    
    // 2. Assess
    const assessment = await this.assess(incident);
    
    // 3. Eradicate
    await this.eradicate(incident);
    
    // 4. Recover
    await this.recover(incident);
    
    // 5. Post-incident
    await this.postIncident(incident);
  }
}
```

## Conclusion

The security and privacy model provides comprehensive protection for VIVIM's network sharing system:

- **Identity**: DID-based authentication with secure session management
- **User Database Isolation**: Each user has their own SQLite database with file-level isolation
- **Encryption**: AES-256-GCM for content, Kyber for key exchange (post-quantum)
- **Access Control**: Policy engine with capability tokens and circle-based ACL
- **Privacy**: Data minimization, k-anonymity, differential privacy, user-isolated databases
- **Audit**: Comprehensive logging and anomaly detection
- **Compliance**: GDPR, CCPA, COPPA support with data retention policies
- **Incident Response**: Structured incident handling procedures

This architecture ensures that:

- User data remains confidential in isolated SQLite databases
- No cross-user database queries are possible
- Access is properly controlled through Master DB policies
- Privacy is preserved through encryption and isolation
- Security events are tracked
- Compliance requirements are met
- Incidents are handled effectively
