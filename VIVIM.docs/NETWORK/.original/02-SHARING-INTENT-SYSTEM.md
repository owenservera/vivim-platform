# Sharing Intent System Design

## Overview

The Sharing Intent System is the foundation of VIVIM's sharing architecture. It captures, validates, and processes user sharing decisions, ensuring that every share action reflects the user's explicit intent while enforcing privacy and policy constraints.

## Database Architecture

The Sharing Intent System uses a dual-database architecture:

- **Master Database (PostgreSQL)**: Stores sharing intent metadata, circle relationships, and access control
- **User Databases (SQLite)**: Stores the actual content being shared (conversations, ACUs)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SHARING INTENT DATA FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User A (SQLite)              Master DB (PostgreSQL)       User B (SQLite)  │
│  ┌────────────────┐          ┌────────────────────┐      ┌────────────────┐│
│  │ Conversation   │          │ SharingIntent      │      │ Received       ││
│  │ - ACUs         │─────────▶│ - contentIds       │─────▶│ Content        ││
│  │ - Messages     │  Shares  │ - circleIds       │ Access│ (decrypted)    ││
│  └────────────────┘          │ - permissions     │      └────────────────┘│
│        │                      │ - ownerDid        │              ▲          │
│        │                      └────────────────────┘              │          │
│        │                              │                            │          │
│        │                              ▼                            │          │
│        │                      ┌────────────────────┐              │          │
│        │                      │ Circle             │              │          │
│        │                      │ CircleMember       │──────────────┘          │
│        └─────────────────────▶│ (validates access) │                         │
│             Content ref       └────────────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Intent Model

### What is Sharing Intent?

Sharing Intent is a structured representation of a user's decision to share content. It captures:

- **The content** being shared (conversation ID, ACU references)
- **The scope** of sharing (who can access, under what conditions)
- **The permissions** granted to recipients (view, copy, remix, share)
- **The temporal constraints** (when available, when expires)
- **The metadata** (title, description, tags)

### Intent Structure

```typescript
interface SharingIntent {
  // Identification
  id: string;                    // Unique intent ID
  version: number;               // Intent schema version
  createdAt: Date;              // When intent was created
  updatedAt: Date;               // Last modification

  // Content Reference
  content: {
    type: 'conversation' | 'acu' | 'collection' | 'annotation';
    ids: string[];              // Content item IDs
    scope: 'full' | 'partial';  // Full content or subset
    includeACUs?: string[];      // Specific ACUs to include
    excludeACUs?: string[];      // ACUs to exclude
  };

  // Audience
  audience: {
    type: 'public' | 'circle' | 'users' | 'link';
    
    // For circle type
    circleIds?: string[];
    
    // For users type
    userDids?: string[];
    
    // For link type (shareable link)
    linkId?: string;
  };

  // Permissions
  permissions: {
    view: boolean;
    copy: boolean;
    annotate: boolean;
    remix: boolean;
    share: boolean;              // Can recipients share further?
    download: boolean;
  };

  // Temporal Constraints
  schedule?: {
    publishAt?: Date;            // When content becomes available
    expiresAt?: Date;            // When content becomes unavailable
    timezone?: string;           // Timezone for schedule
  };

  // Content Modifications
  transformations?: {
    // Content filtering
    removeSystemMessages?: boolean;
    removeToolCalls?: boolean;
    removeImages?: boolean;
    redactPersonalInfo?: boolean;
    
    // Content modification
    addWatermark?: boolean;
    addAttribution?: boolean;
    addNotes?: string;
    
    // Anonymization
    anonymizeUserMessages?: boolean;
    anonymizeAIMessages?: boolean;
  };

  // Metadata
  metadata: {
    title?: string;
    description?: string;
    tags?: string[];
    language?: string;
    category?: string;
  };

  // Policy
  policy: {
    requireAcceptance?: boolean;  // Recipients must accept
    trackViews?: boolean;         // Track who viewed
    allowAnalytics?: boolean;     // Allow anonymous analytics
    moderationFlag?: string;      // Content flag for moderation
  };
}
```

## Intent Lifecycle

### 1. Creation

Intent is created when a user initiates a share action:

```
User Action → Intent Builder → Intent Draft
```

The Intent Builder provides a fluent API for constructing intents:

```typescript
const intent = new SharingIntentBuilder(userDid)
  .forConversation('conv-123')
  .withAudience.circle(['circle-friends', 'circle-work'])
  .withPermissions({
    view: true,
    copy: true,
    annotate: true,
    remix: false,
    share: false,
    download: false
  })
  .withSchedule({
    publishAt: new Date('2026-02-15T10:00:00Z'),
    expiresAt: new Date('2026-03-15T10:00:00Z')
  })
  .withTransformations({
    removeToolCalls: true,
    addAttribution: true
  })
  .withMetadata({
    title: 'AI Conversation about TypeScript',
    tags: ['typescript', 'programming', 'ai']
  })
  .build();
```

### 2. Validation

Before publishing, the intent is validated:

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: Suggestion[];
}

interface ValidationError {
  field: string;
  code: ErrorCode;
  message: string;
  severity: 'error' | 'warning';
}
```

Validation checks include:

- **Permission constraints**: Can the user grant these permissions?
- **Circle membership**: Are all target circles valid and accessible?
- **Content ownership**: Does the user own the content?
- **Policy compliance**: Does the intent violate any platform policies?
- **Schedule validity**: Are publish/expire dates valid?

### 3. Policy Engine Evaluation

The Policy Engine evaluates the intent against user and system policies:

```typescript
interface PolicyEvaluation {
  allowed: boolean;
  policyResults: {
    userPolicy: PolicyCheckResult;
    circlePolicy: PolicyCheckResult;
    systemPolicy: PolicyCheckResult;
  };
  requiredModifications: Modification[];
  flags: string[];
}
```

### 4. Transformation

If allowed, the content is transformed according to the intent:

```typescript
interface ContentTransformer {
  // Filter content based on scope
  filterContent(intent: SharingIntent, content: Content): Content;
  
  // Apply transformations
  applyTransformations(
    intent: SharingIntent, 
    content: Content
  ): TransformedContent;
  
  // Encrypt for specific recipients
  encryptForRecipients(
    content: TransformedContent, 
    recipients: Recipient[]
  ): EncryptedContent;
}
```

### 5. Publishing

The validated and transformed intent is published:

```
Validated Intent + Transformed Content → Publishing Pipeline → Network
```

## Intent Actions

### Create Share

Creates a new sharing intent:

```typescript
POST /api/v1/sharing/intents
{
  "content": {
    "type": "conversation",
    "ids": ["conv-123"]
  },
  "audience": {
    "type": "circle",
    "circleIds": ["circle-friends"]
  },
  "permissions": {
    "view": true,
    "copy": false,
    "annotate": true,
    "remix": false,
    "share": false,
    "download": false
  }
}
```

### Update Share

Modifies an existing share:

```typescript
PATCH /api/v1/sharing/intents/:intentId
{
  "audience": {
    "type": "circle",
    "circleIds": ["circle-friends", "circle-family"]
  },
  "schedule": {
    "expiresAt": "2026-04-01T00:00:00Z"
  }
}
```

### Revoke Share

Revokes a previously shared content:

```typescript
POST /api/v1/sharing/intents/:intentId/revoke
{
  "reason": "content_no_longer_relevant",
  "notifyRecipients": true
}
```

### Query Shares

Lists shares based on filters:

```typescript
GET /api/v1/sharing/intents?status=active&contentType=conversation
```

## Intent States

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ DRAFT   │────▶│PENDING  │────▶│ACTIVE  │────▶│EXPIRED  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │
     │               │               │               │
     ▼               ▼               ▼               ▼
  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
  │CANCELLED│     │VALIDATED│     │REVOKED  │     │ARCHIVED │
  └─────────┘     └─────────┘     └─────────┘     └─────────┘
```

| State | Description |
|-------|-------------|
| DRAFT | Intent created but not yet submitted |
| PENDING | Intent submitted, awaiting validation |
| VALIDATED | Intent passed validation |
| ACTIVE | Intent is published and accessible |
| EXPIRED | Intent reached expiration date |
| REVOKED | User explicitly revoked the share |
| CANCELLED | User cancelled before publishing |
| ARCHIVED | System archived for retention |

## Intent Resolution

When a user accesses shared content, the system resolves the applicable intent:

```typescript
interface IntentResolver {
  // Resolve all applicable intents for a user
  resolveForUser(
    contentId: string, 
    userDid: string
  ): Promise<ResolvedIntent[]>;
  
  // Check specific permission
  checkPermission(
    contentId: string,
    userDid: string,
    permission: Permission
  ): Promise<boolean>;
  
  // Get effective permissions
  getEffectivePermissions(
    contentId: string,
    userDid: string
  ): Promise<Permissions>;
}
```

Resolution logic:

1. Find all sharing intents for the content
2. Check if user is in audience (circle member, specific user, public)
3. Check temporal constraints (published, not expired)
4. Evaluate any policy flags
5. Return effective permissions

## Advanced Features

### Scheduled Sharing

Content can be scheduled for future publication:

```typescript
const intent = new SharingIntentBuilder(userDid)
  .forConversation('conv-123')
  .withAudience.public()
  .withSchedule({
    publishAt: new Date('2026-02-20T09:00:00Z'),
    expiresAt: new Date('2026-03-20T09:00:00Z')
  })
  .build();
```

The Publishing Pipeline evaluates scheduled intents:

```typescript
// Background job runs every minute
const scheduler = new IntentScheduler();
await scheduler.processScheduledIntents();
```

### Expiration Policies

Content automatically expires based on:

- **Time-based**: Reaches `expiresAt` timestamp
- **Access-based**: Maximum view count reached
- **Condition-based**: Custom conditions (e.g., "when I leave the circle")

```typescript
interface ExpirationPolicy {
  type: 'time' | 'access' | 'condition';
  
  // For time-based
  expiresAt?: Date;
  
  // For access-based
  maxViews?: number;
  
  // For condition-based
  condition?: string; // Evaluated expression
}
```

### Share Links

Generate shareable links for direct access:

```typescript
const link = await shareLinkService.createLink({
  intentId: 'intent-123',
  scope: 'conversation',
  permissions: {
    view: true,
    copy: false,
    annotate: false,
    remix: false,
    share: false,
    download: false
  },
  expiresIn: '7d', // Link expires in 7 days
  maxUses: 100     // Max number of uses
});

// Generated link: https://vivim.app/s/abc123xyz
```

### Collaborative Shares

Multiple users can co-own a share:

```typescript
const intent = new SharingIntentBuilder(userDid)
  .forConversation('conv-123')
  .withCoOwners(['did:vivim:user2', 'did:vivim:user3'])
  .withVetoPower(true) // Any co-owner can revoke
  .build();
```

### Smart Sharing

AI-powered sharing suggestions:

```typescript
interface SmartShareSuggestion {
  type: 'suggested_audience' | 'suggested_permissions' | 'suggested_schedule';
  confidence: number; // 0-1
  reasoning: string;
  suggestedValue: any;
  acceptAction: string;
}
```

## Integration Points

### PWA Integration

The PWA provides the sharing UI:

```typescript
// Share dialog captures intent
const handleShare = async (conversationId: string, options: ShareOptions) => {
  const intent = buildIntent(conversationId, options);
  const result = await sharingApi.createIntent(intent);
  
  if (result.valid) {
    // Content is fetched from user's SQLite database
    await publishingPipeline.publish(result.intent);
  }
};
```

### Server Integration

The server handles intent processing with dual-database access:

```typescript
// Server-side intent handling
class SharingIntentService {
  // Validates intent against Master DB (circles, permissions)
  async validateIntent(intent: SharingIntent): Promise<ValidationResult> {
    // Check circle membership in Master DB
    const circleMembers = await masterDb.circleMember.findMany({
      where: { circleId: { in: intent.circleIds } }
    });
    
    // Verify user has access
    return { valid: true };
  }
  
  // Fetches content from user's SQLite database
  async fetchContent(intent: SharingIntent, ownerDid: string): Promise<RawContent> {
    // Get user's SQLite client
    const userDb = await userDatabaseManager.getUserClient(ownerDid);
    
    // Fetch from user's database
    const conversation = await userDb.conversation.findUnique({
      where: { id: intent.contentIds[0] }
    });
    
    return conversation;
  }
}
```

### Network Integration

The network layer receives intents for distribution:

```typescript
// Publishing Pipeline sends to network
await networkOrchestrator.distribute({
  content: transformedContent,
  recipients: resolvedRecipients,
  intent: validatedIntent
});
```

### Analytics Integration

All sharing actions are logged for analytics:

```typescript
analytics.track('share_intent_created', {
  contentType: 'conversation',
  audienceType: 'circle',
  circleCount: 2,
  permissionsGranted: ['view', 'annotate'],
  ownerDid: ownerDid // For cross-user analytics in Master DB
});
```

## Error Handling

### Validation Errors

```typescript
try {
  await sharingApi.createIntent(intent);
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    // Show validation errors in UI
    displayErrors(error.details);
  }
}
```

### Policy Violations

```typescript
try {
  await sharingApi.createIntent(intent);
} catch (error) {
  if (error.code === 'POLICY_VIOLATION') {
    // Explain policy violation
    explainPolicyViolation(error.policyResult);
  }
}
```

### Publishing Failures

```typescript
try {
  await publishingPipeline.publish(intent);
} catch (error) {
  // Handle transient failures with retry
  if (error.retryable) {
    await retryQueue.enqueue({
      intent,
      retryAt: error.retryAfter
    });
  }
}
```

## Conclusion

The Sharing Intent System provides a comprehensive framework for capturing, validating, and processing user sharing decisions. By structuring intent as a first-class entity, VIVIM enables sophisticated sharing scenarios while maintaining user control and privacy.

The system supports:

- Granular permission control
- Temporal constraints (scheduling, expiration)
- Content transformations and filtering
- Collaborative sharing
- Intelligent suggestions
- Comprehensive auditing

This architecture serves as the foundation for all sharing operations in VIVIM's network.
