# Content Publishing Pipeline Architecture

## Overview

The Content Publishing Pipeline is responsible for transforming, validating, and distributing shared content across the VIVIM network. It acts as the bridge between the Sharing Intent System and the Network Orchestration Layer, ensuring that content is delivered securely, efficiently, and according to user intent.

## Dual-Database Pipeline

The pipeline operates across both databases:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONTENT PUBLISHING PIPELINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  INPUT  │───▶│ FILTER   │───▶│TRANSFORM │───▶│ ENCRYPT  │              │
│  │ STAGE   │    │ STAGE    │    │ STAGE    │    │ STAGE    │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │                                                            │         │
│       │                                                            ▼         │
│       │                                                   ┌──────────┐      │
│       │                                                   │  OUTPUT  │      │
│       │                                                   │ STAGE    │      │
│       │                                                   └────┬─────┘      │
│       │                                                        │            │
│       ▼                                                        ▼            │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │                    DATABASE LAYER                            │           │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐ │           │
│  │  │  UserDatabaseManager   │  │   Master DB Client     │ │           │
│  │  │  (fetches from SQLite) │  │  (stores metadata)     │ │           │
│  │  └─────────────────────────┘  └─────────────────────────┘ │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Pipeline Stages

### 1. Input Stage

The Input Stage receives the sharing intent and fetches the source content from the user's isolated database:

```typescript
interface InputStage {
  // Fetch content based on intent from user's SQLite database
  async fetchContent(intent: SharingIntent, ownerDid: string): Promise<RawContent>;
  
  // Validate content exists and user has access
  async validateAccess(intent: SharingIntent): Promise<boolean>;
  
  // Gather content metadata
  gatherMetadata(content: RawContent): ContentMetadata;
}

class ContentFetchingService {
  // Fetch from user's isolated SQLite database
  async fetchFromUserDatabase(
    intent: SharingIntent,
    ownerDid: string
  ): Promise<RawContent> {
    // Get user's database client
    const userDb = await userDatabaseManager.getUserClient(ownerDid);
    
    // Fetch based on content type
    switch (intent.contentType) {
      case 'CONVERSATION':
        return this.fetchConversation(userDb, intent.contentIds);
      case 'ACU':
        return this.fetchACU(userDb, intent.contentIds);
      case 'COLLECTION':
        return this.fetchCollection(userDb, intent.contentIds);
    }
  }
  
  private async fetchConversation(
    userDb: PrismaClient,
    contentIds: string[]
  ): Promise<RawContent> {
    const conversation = await userDb.conversation.findUnique({
      where: { id: contentIds[0] },
      include: {
        messages: true,
        atomicChatUnits: true
      }
    });
    
    return {
      id: conversation.id,
      type: 'conversation',
      data: { conversation },
      metadata: {
        size: conversation.totalCharacters,
        createdAt: conversation.createdAt,
        messageCount: conversation.messageCount
      }
    };
  }
}
```

**Operations:**

- Fetch conversation/ACU data from user's SQLite database
- Verify ownership and permissions (via Master DB)
- Gather content metadata (size, type, timestamps)
- Create content hash for integrity verification

**Output:** `RawContent` with metadata

### 2. Filter Stage

The Filter Stage removes content that should not be shared:

```typescript
interface FilterStage {
  // Apply content filters based on intent
  filterContent(
    content: RawContent, 
    filters: ContentFilters
  ): FilteredContent;
  
  // Remove specific ACUs
  filterACUs(
    content: RawContent, 
    includeIds?: string[], 
    excludeIds?: string[]
  ): FilteredContent;
  
  // Apply privacy filters
  applyPrivacyFilters(
    content: RawContent, 
    userSettings: PrivacySettings
  ): FilteredContent;
}
```

**Filter Types:**

| Filter | Description | Example |
|--------|-------------|---------|
| Include | Only include specific items | `includeACUs: ['acu-1', 'acu-2']` |
| Exclude | Exclude specific items | `excludeACUs: ['acu-3']` |
| System | Remove system messages | `removeSystemMessages: true` |
| Tools | Remove tool call artifacts | `removeToolCalls: true` |
| Media | Handle images/videos | `removeImages: boolean` |
| PII | Redact personal info | `redactPersonalInfo: true` |

**Output:** `FilteredContent`

### 3. Transform Stage

The Transform Stage modifies content according to the sharing intent:

```typescript
interface TransformStage {
  // Apply transformations
  transform(
    content: FilteredContent, 
    transformations: Transformations
  ): TransformedContent;
  
  // Add watermark
  addWatermark(content: TransformedContent, watermark: WatermarkConfig): TransformedContent;
  
  // Add attribution
  addAttribution(
    content: TransformedContent, 
    attribution: AttributionConfig
  ): TransformedContent;
  
  // Anonymize content
  anonymize(
    content: TransformedContent, 
    anonymizationRules: AnonymizationRules
  ): TransformedContent;
  
  // Generate preview
  generatePreview(content: TransformedContent): ContentPreview;
}
```

**Transformations:**

```typescript
interface Transformations {
  // Content modification
  addWatermark?: {
    enabled: boolean;
    text?: string;
    position?: 'corner' | 'center' | 'tiled';
    opacity?: number;
    includeTimestamp?: boolean;
  };
  
  addAttribution?: {
    enabled: boolean;
    showAuthor?: boolean;
    showDate?: boolean;
    showSource?: boolean;
    customText?: string;
  };
  
  anonymizeUserMessages?: {
    enabled: boolean;
    preserveLength?: boolean;
    replaceWith?: string;
  };
  
  anonymizeAIMessages?: {
    enabled: boolean;
    preserveModel?: boolean;
  };
  
  // Preview generation
  generatePreview?: {
    maxLength: number;
    includeSystem?: boolean;
    previewFormat: 'text' | 'html';
  };
}
```

**Output:** `TransformedContent` + `ContentPreview`

### 4. Encrypt Stage

The Encrypt Stage secures content for the intended recipients:

```typescript
interface EncryptStage {
  // Encrypt content for recipients
  encrypt(
    content: TransformedContent, 
    recipients: Recipient[], 
    intent: SharingIntent
  ): EncryptedContentBundle;
  
  // Generate key material
  generateKeys(): EncryptionKeys;
  
  // Encapsulate keys for recipients
  encapsulateKeys(
    keys: EncryptionKeys, 
    recipients: Recipient[]
  ): KeyEncapsulation[];
}
```

**Encryption Flow:**

```
┌────────────────────────────────────────────────────────────────┐
│                     ENCRYPTION PROCESS                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Generate content key (AES-256-GCM)                         │
│                                                                 │
│  2. Encrypt content with content key                            │
│        ┌─────────────────┐                                     │
│        │   Plaintext      │──────▶ AES-GCM ──▶ Ciphertext       │
│        │   Content        │         (contentKey)                │
│        └─────────────────┘                                     │
│                                                                 │
│  3. For each recipient:                                         │
│     - Get recipient's public key                                │
│     - Encapsulate content key with Kyber                        │
│     - Store encapsulated key                                    │
│                                                                 │
│  4. Package bundle                                              │
│        ┌─────────────────┐                                     │
│        │ EncryptedBundle  │                                     │
│        │  - ciphertext    │                                     │
│        │  - nonce         │                                     │
│        │  - keyCapsules[] │                                     │
│        │  - metadata      │                                     │
│        └─────────────────┘                                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Output:** `EncryptedContentBundle`

### 5. Validation Gate

The Validation Gate runs at key points to ensure integrity:

```typescript
interface ValidationGate {
  // Stage 1: Input validation
  validateInput(intent: SharingIntent): Promise<ValidationResult>;
  
  // Stage 2: Content validation
  validateContent(content: RawContent): Promise<ValidationResult>;
  
  // Stage 3: Policy validation
  validatePolicy(
    intent: SharingIntent, 
    content: TransformedContent
  ): Promise<ValidationResult>;
  
  // Stage 4: Output validation
  validateOutput(bundle: EncryptedContentBundle): Promise<ValidationResult>;
}
```

**Validation Checks:**

- Intent integrity (signature verification)
- Content hash consistency
- Permission validity
- Policy compliance
- Encryption correctness

### 6. Output Stage

The Output Stage prepares and distributes the final bundle and stores metadata:

```typescript
interface OutputStage {
  // Prepare final bundle
  prepareBundle(
    encryptedContent: EncryptedContentBundle,
    intent: SharingIntent,
    recipients: Recipient[]
  ): PublishableBundle;
  
  // Create content record in Master DB
  async createContentRecord(
    bundle: PublishableBundle,
    ownerDid: string
  ): Promise<ContentRecord>;
  
  // Update sharing intent status in Master DB
  async updateIntentStatus(
    intentId: string,
    status: IntentStatus
  ): Promise<void>;
  
  // Distribute to network
  async distribute(bundle: PublishableBundle): Promise<DistributionResult>;
}
```

**Output:** `PublishableBundle` ready for network distribution

**Database Operations:**
- ContentRecord stored in Master DB (PostgreSQL)
- SharingIntent status updated in Master DB
- Original content remains in user's SQLite database

## Complete Pipeline Flow

```typescript
class ContentPublishingPipeline {
  constructor(
    private masterDb: PrismaClient,        // PostgreSQL
    private userDbManager: UserDatabaseManager  // SQLite manager
  ) {}
  
  async publish(
    intent: SharingIntent,
    actorDid: string
  ): Promise<PublishResult> {
    // Stage 1: Input - Fetch from user's SQLite database
    const ownerDid = intent.ownerDid;
    const rawContent = await this.inputStage.fetchContent(intent, ownerDid);
    await this.validationGate.validateInput(intent);
    
    // Stage 2: Filter
    const filteredContent = await this.filterStage.filterContent(
      rawContent,
      intent.transformations
    );
    
    // Stage 3: Transform
    const transformedContent = await this.transformStage.transform(
      filteredContent,
      intent.transformations
    );
    
    // Stage 4: Encrypt
    const recipients = await this.resolveRecipients(intent);
    const encryptedBundle = await this.encryptStage.encrypt(
      transformedContent,
      recipients,
      intent
    );
    
    // Validation Gate
    await this.validationGate.validatePolicy(intent, transformedContent);
    await this.validationGate.validateOutput(encryptedBundle);
    
    // Stage 5: Output
    const bundle = await this.outputStage.prepareBundle(
      encryptedBundle,
      intent,
      recipients
    );
    
    // Store metadata in Master DB (PostgreSQL)
    const contentRecord = await this.outputStage.createContentRecord(
      bundle,
      ownerDid
    );
    
    // Update intent status in Master DB
    await this.outputStage.updateIntentStatus(intent.id, 'ACTIVE');
    
    // Distribute
    const result = await this.outputStage.distribute(bundle);
    
    return {
      success: true,
      contentId: contentRecord.id,
      distribution: result
    };
  }
}
```

## Content Formats

### Raw Content

```typescript
interface RawContent {
  // Content identification
  id: string;
  type: 'conversation' | 'acu' | 'collection';
  
  // The actual content
  data: {
    conversation?: Conversation;
    acus?: AtomicChatUnit[];
    collection?: Collection;
  };
  
  // Metadata
  metadata: {
    size: number;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
    acuCount: number;
  };
  
  // Provenance
  provenance: {
    sourceUrl: string;
    provider: string;
    capturedAt: Date;
  };
}
```

### Filtered Content

```typescript
interface FilteredContent {
  // Original reference
  sourceContentId: string;
  
  // Applied filters
  appliedFilters: {
    type: string;
    description: string;
  }[];
  
  // Filtered content
  data: {
    messages?: Message[];
    acus?: AtomicChatUnit[];
  };
  
  // Filtered metadata
  metadata: {
    originalSize: number;
    filteredSize: number;
    itemsRemoved: number;
  };
}
```

### Transformed Content

```typescript
interface TransformedContent {
  // Content data
  data: {
    messages: TransformedMessage[];
    acus: TransformedACU[];
  };
  
  // Applied transformations
  transformations: {
    type: string;
    applied: boolean;
    details?: any;
  }[];
  
  // Preview
  preview?: ContentPreview;
  
  // Metadata
  metadata: {
    transformedAt: Date;
    hash: string;
    size: number;
  };
}
```

### Encrypted Content Bundle

```typescript
interface EncryptedContentBundle {
  // Encrypted payload
  ciphertext: string;        // Base64 encoded
  nonce: string;           // Base64 encoded
  
  // Key capsules for recipients
  keyCapsules: {
    recipientDid: string;
    capsule: string;       // Kyber encapsulation
    publicKey: string;     // For verification
  }[];
  
  // Bundle metadata
  metadata: {
    contentId: string;
    contentHash: string;
    algorithm: 'AES-256-GCM';
    keyEncapsulation: 'Kyber-1024';
    createdAt: Date;
    version: number;
  };
  
  // Content metadata (unencrypted, for discovery)
  discoveryMetadata: {
    contentType: string;
    title: string;
    tags: string[];
    createdAt: Date;
    authorDid: string;
  };
}
```

## Distribution Strategies

### Immediate Distribution

For active sharing to known recipients:

```typescript
const immediateStrategy: DistributionStrategy = {
  name: 'immediate',
  async distribute(bundle, recipients, network) {
    // Push directly to recipient nodes
    for (const recipient of recipients) {
      const node = await network.findNode(recipient.did);
      await network.pushContent(node, bundle);
    }
  }
};
```

### DHT-Based Distribution

For public or circle-based sharing:

```typescript
const dhtStrategy: DistributionStrategy = {
  name: 'dht',
  async distribute(bundle, recipients, network) {
    // Publish to DHT for discovery
    await network.dht.publish(bundle.contentId, {
      location: network.getLocalNodeId(),
      recipients: recipients.map(r => r.did),
      permissions: bundle.metadata
    });
    
    // Store with replication factor
    await network.replicate(bundle, {
      replicationFactor: 3,
      strategy: 'geo-distributed'
    });
  }
};
```

### PubSub-Based Distribution

For real-time notifications:

```typescript
const pubsubStrategy: DistributionStrategy = {
  name: 'pubsub',
  async distribute(bundle, recipients, network) {
    // Notify recipients via PubSub
    for (const recipient of recipients) {
      const topic = `shares:${recipient.did}`;
      await network.pubsub.publish(topic, {
        type: 'new_share',
        contentId: bundle.contentId,
        preview: bundle.discoveryMetadata
      });
    }
  }
};
```

## Error Handling

### Retry Policy

```typescript
const retryPolicy: RetryPolicy = {
  maxRetries: 3,
  backoff: 'exponential',
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  
  // Retry on specific errors
  retryableErrors: [
    'NETWORK_ERROR',
    'NODE_UNAVAILABLE',
    'TIMEOUT'
  ]
};
```

### Rollback

```typescript
async rollback(publishResult: PublishResult): Promise<void> {
  // Remove from DHT
  await this.dht.remove(publishResult.contentId);
  
  // Delete from storage nodes
  for (const node of publishResult.storedNodes) {
    await node.delete(publishResult.contentId);
  }
  
  // Revoke share links
  if (publishResult.shareLinks) {
    for (const link of publishResult.shareLinks) {
      await this.linkService.revoke(link.id);
    }
  }
  
  // Update content record status
  await this.contentRecord.update(publishResult.contentId, {
    status: 'rolled_back'
  });
}
```

## Performance Optimization

### Caching

```typescript
interface PipelineCache {
  // Cache transformed content
  transformed: Cache<TransformedContent>;
  
  // Cache recipient keys
  recipientKeys: Cache<RecipientKey[]>;
  
  // Cache encryption materials
  encryption: Cache<EncryptionContext>;
}
```

### Parallelization

```typescript
async publishParallel(intents: SharingIntent[]): Promise<PublishResult[]> {
  // Process multiple intents in parallel
  return Promise.all(
    intents.map(intent => this.publish(intent, actorDid))
  );
}
```

### Content Deduplication

```typescript
// Detect identical content
const contentHash = await this.hasher.computeHash(filteredContent);

// Check if already shared
const existing = await this.contentRecord.findByHash(contentHash);

if (existing) {
  // Reuse existing content record
  return this.createShareReference(existing.id, intent);
}
```

## Monitoring

### Metrics

```typescript
const metrics = {
  // Pipeline latency
  pipelineDuration: histogram,
  stageDuration: histogram,
  
  // Content metrics
  contentSize: gauge,
  filterReduction: gauge,
  
  // Error metrics
  errors: counter,
  retries: counter,
  
  // Distribution metrics
  distributionLatency: histogram,
  replicationCount: gauge
};
```

### Health Checks

```typescript
interface PipelineHealth {
  // Overall health
  status: 'healthy' | 'degraded' | 'unhealthy';
  
  // Per-stage health
  stages: {
    input: HealthStatus;
    filter: HealthStatus;
    transform: HealthStatus;
    encrypt: HealthStatus;
    output: HealthStatus;
  };
  
  // Queue depth
  queueDepth: number;
  
  // Error rate
  errorRate: number;
}
```

## Conclusion

The Content Publishing Pipeline provides a robust, secure, and efficient system for distributing shared content across the VIVIM network. By separating concerns into distinct stages and implementing comprehensive validation at each step, the pipeline ensures that:

- Content is properly filtered and transformed according to user intent
- Content is encrypted with modern, post-quantum cryptography
- Distribution is optimized for the target audience
- Errors are handled gracefully with rollback capabilities
- Performance is monitored and optimized

This architecture serves as the foundation for all content publishing operations in VIVIM's sharing system.
