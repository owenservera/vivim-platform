# VIVIM Integration Guide

Technical guide for integrating with VIVIM.

---

## Integration Overview

VIVIM offers multiple integration paths depending on your needs:

1. **Provider Integration** - Add VIVIM memory to your AI product
2. **Platform Integration** - Embed VIVIM features in your platform
3. **API Integration** - Connect via REST API
4. **SDK Integration** - Full SDK implementation

---

## Getting Started

### Prerequisites

Before integrating, ensure you have:

1. **VIVIM Account** - Create at vivim.app
2. **API Key** - Generate in Settings → Developer → API Keys
3. **Technical Contact** - Assigned for support

### Environment

| Environment | URL | Purpose |
|------------|-----|---------|
| Sandbox | api.sandbox.vivim.app | Testing |
| Production | api.vivim.app | Live integration |

---

## Integration Paths

### 1. Provider Integration

For AI assistant providers who want to offer VIVIM memory to users.

#### Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Your AI   │ ──────> │   VIVIM    │ ──────> │   User's   │
│  Assistant  │         │   API      │         │   Memory   │
└─────────────┘         └─────────────┘         └─────────────┘
```

#### Implementation

**Step 1: OAuth Flow**

```typescript
// Redirect user to VIVIM authorization
const authUrl = `https://vivim.app/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=memories:read memories:write`;

window.location.href = authUrl;
```

**Step 2: Exchange Code for Token**

```typescript
const response = await fetch('https://api.vivim.app/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: AUTHORIZATION_CODE,
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET'
  })
});

const { access_token, refresh_token } = await response.json();
```

**Step 3: Enable Memory Capture**

```typescript
// Enable automatic memory extraction
await fetch('https://api.vivim.app/api/capture/enable', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    captureMode: 'automatic',
    extractionTypes: ['EPISODIC', 'SEMANTIC', 'PROCEDURAL'],
    provider: 'your-ai-assistant'
  })
});
```

**Step 4: Sync Conversations**

```typescript
// Webhook endpoint to receive new memories
app.post('/webhook/vivim', async (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'memory:created') {
    // New memory extracted from user's conversation
    const memory = data;
    console.log('New memory:', memory.content);
  }
  
  res.status(200).send('OK');
});
```

---

### 2. Platform Integration

For platforms wanting to embed VIVIM features.

#### Widget Integration

**HTML Integration**

```html
<!-- Add VIVIM widget -->
<script src="https://cdn.vivim.app/widget/v1.js"></script>

<div id="vivim-widget"></div>

<script>
  VivimWidget.init({
    container: '#vivim-widget',
    apiKey: 'YOUR_API_KEY',
    theme: 'auto', // 'light', 'dark', 'auto'
    features: {
      search: true,
      memories: true,
      collections: true
    },
    // Callback when user connects
    onConnect: (user) => {
      console.log('Connected:', user.did);
    }
  });
</script>
```

**React Integration**

```tsx
import { VivimSearch, VivimProvider } from '@vivim/sdk/react';

function App() {
  return (
    <VivimProvider apiKey="YOUR_API_KEY">
      <VivimSearch
        placeholder="Search your memories..."
        onResultSelect={(memory) => {
          console.log('Selected:', memory);
        }}
      />
    </VivimProvider>
  );
}
```

#### Full SDK Integration

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  apiKey: process.env.VIVIM_API_KEY,
  
  // Configure for your platform
  platform: {
    name: 'Your Platform',
    version: '1.0.0'
  },
  
  // Enable features
  features: {
    memories: true,
    collections: true,
    sharing: true
  }
});

await sdk.initialize();
```

---

### 3. API Integration

For simple integrations using REST API.

#### Authentication

```typescript
// Using API key
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

// Or OAuth token
const headers = {
  'Authorization': `Bearer ${OAUTH_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};
```

#### Common Use Cases

**Search Memories**

```typescript
const search = async (query) => {
  const response = await fetch('https://api.vivim.app/api/memories/search', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      limit: 10
    })
  });
  
  return response.json();
};
```

**Create Collection**

```typescript
const createCollection = async (name, description) => {
  const response = await fetch('https://api.vivim.app/api/collections', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name,
      description,
      visibility: 'private'
    })
  });
  
  return response.json();
};
```

**Share Memory**

```typescript
const shareMemory = async (memoryId, permissions) => {
  const response = await fetch('https://api.vivim.app/api/sharing/share', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contentType: 'memory',
      contentId: memoryId,
      permissions
    })
  });
  
  return response.json();
};
```

---

### 4. Webhook Integration

Receive real-time notifications.

#### Setting Up Webhooks

```typescript
// Register webhook
await fetch('https://api.vivim.app/api/webhooks', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    url: 'https://your-server.com/webhooks/vivim',
    events: [
      'conversation.created',
      'memory.created',
      'collection.updated',
      'user.action'
    ],
    secret: 'your-webhook-secret'
  })
});
```

#### Verifying Webhooks

```typescript
// Verify webhook signature
import { verifyWebhookSignature } from '@vivim/sdk';

const isValid = verifyWebhookSignature(
  req.body,
  req.headers['x-vivim-signature'],
  'your-webhook-secret'
);

if (!isValid) {
  return res.status(401).send('Invalid signature');
}
```

#### Event Types

| Event | Description | Payload |
|-------|-------------|---------|
| `conversation.created` | New conversation captured | Conversation object |
| `conversation.updated` | Conversation modified | Conversation, changes |
| `memory.created` | New memory extracted | Memory object |
| `memory.shared` | Memory was shared | Memory, share info |
| `collection.created` | Collection created | Collection object |
| `collection.item_added` | Item added to collection | Collection, item |
| `user.authenticated` | User logged in | User, method |

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {
      "field": "email",
      "reason": "Invalid format"
    }
  }
}
```

### Common Errors

| Code | HTTP | Description | Resolution |
|------|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid API key | Check API key |
| `FORBIDDEN` | 403 | Insufficient permissions | Request more scope |
| `NOT_FOUND` | 404 | Resource doesn't exist | Check resource ID |
| `VALIDATION_ERROR` | 422 | Invalid request data | Fix request body |
| `RATE_LIMITED` | 429 | Too many requests | Implement backoff |

---

## Rate Limits

### API Rate Limits

| Tier | Requests/Minute | Burst |
|------|-----------------|-------|
| Sandbox | 60 | 100 |
| Production | 60-1000 | Variable |

### Handling Rate Limits

```typescript
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
};
```

---

## Testing

### Sandbox Environment

Use sandbox for all testing:

```
Base URL: https://api.sandbox.vivim.app
```

### Test Data

Create test data in sandbox:

1. Create sandbox account
2. Use sandbox API key
3. Test all integration scenarios

### UAT Testing

Schedule UAT with our team:

- Email: integration@vivim.app
- Provide: Test scenarios, timeline
- We will: Validate integration, provide feedback

---

## Security

### API Key Management

```typescript
// NEVER expose API keys in client-side code
// Backend-only
const apiKey = process.env.VIVIM_API_KEY;

// Rotate keys regularly
// Generate new key in dashboard
// Update in your application
// Revoke old key
```

### OAuth Security

- Use PKCE for web flows
- Store tokens securely
- Implement token refresh
- Handle token revocation

### Webhook Security

- Verify signatures
- Use HTTPS endpoints
- Implement idempotency
- Log all webhook calls

---

## Performance

### Optimization Tips

1. **Batch Operations**
```typescript
// Instead of individual calls
const memories = await Promise.all(
  items.map(item => sdk.memories.create(item))
);

// Use batch API
await sdk.memories.createMany(items);
```

2. **Caching**
```typescript
// Cache frequent queries
const cache = new Map();

const getCachedMemories = async (query) => {
  const key = JSON.stringify(query);
  if (cache.has(key)) return cache.get(key);
  
  const result = await sdk.memories.search(query);
  cache.set(key, result);
  return result;
};
```

3. **Pagination**
```typescript
// Don't load all data
const allMemories = [];
let cursor;

do {
  const { data, pagination } = await sdk.memories.list({
    limit: 100,
    cursor
  });
  
  allMemories.push(...data);
  cursor = pagination.nextCursor;
} while (cursor);
```

---

## Support

### Technical Support

| Tier | Response Time | Channel |
|------|---------------|---------|
| Developer | 48 hours | Email |
| Platform | 24 hours | Email, Slack |
| Enterprise | 4 hours | Email, Slack, Phone |

### Resources

- **Documentation**: docs.vivim.app
- **API Reference**: docs.vivim.app/api
- **SDK Reference**: docs.vivim.app/sdk
- **Status Page**: status.vivim.app

---

## Certification

Complete certification to become a VIVIM Integration Partner:

### Steps

1. **Complete Integration**: Implement required features
2. **Submit Testing**: Provide test results
3. **Security Review**: Pass security audit
4. **Get Certified**: Receive partner certification

### Requirements

- Successful integration with all core features
- Passing test suite (>90% pass rate)
- Security compliance review
- Signed partner agreement

---

## Contact

**Integration Team**:
- Email: integration@vivim.app
- Slack: slack.vivim.app
- Phone: +1 (555) 123-4567

**Partnership Questions**:
- Email: partners@vivim.app
