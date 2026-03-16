# Integration Guide

**Target Audience:** Developers integrating Sovereign Memory with existing systems

---

## Overview

This guide covers integrating Sovereign Memory with your existing tools, workflows, and systems. From simple API integrations to custom connectors, learn how to extend Sovereign Memory's capabilities.

---

## Integration Categories

### 1. AI Provider Integrations

Import conversations from AI platforms.

| Provider | Method | Status | Documentation |
|----------|--------|--------|---------------|
| **ChatGPT/OpenAI** | Share Link, Export, API | ✅ Complete | [ChatGPT Integration](./integrations/chatgpt.md) |
| **Claude/Anthropic** | Share Link, Export | ✅ Complete | [Claude Integration](./integrations/claude.md) |
| **Gemini/Google** | Takeout, API | ✅ Complete | [Gemini Integration](./integrations/gemini.md) |
| **Perplexity** | Export, API | 🚧 Partial | Coming Soon |
| **Cohere** | API | ⏳ Planned | Roadmap |
| **Local LLMs** | API, File Import | ⏳ Planned | Roadmap |

### 2. Knowledge Base Integrations

Sync with existing knowledge systems.

| System | Method | Status | Documentation |
|--------|--------|--------|---------------|
| **Notion** | API Sync | 🚧 Partial | [Notion Integration](./integrations/notion.md) |
| **Obsidian** | File Sync | ⏳ Planned | Roadmap |
| **Roam Research** | Graph API | ⏳ Planned | Roadmap |
| **Logseq** | File Sync | ⏳ Planned | Roadmap |
| **Confluence** | REST API | ⏳ Planned | Roadmap |

### 3. Communication Integrations

Capture knowledge from communication tools.

| Tool | Method | Status | Documentation |
|------|--------|--------|---------------|
| **Slack** | Bot, Webhook | ⏳ Planned | Roadmap |
| **Discord** | Bot | ⏳ Planned | Roadmap |
| **Email** | IMAP, Forwarding | ⏳ Planned | Roadmap |
| **Teams** | Graph API | ⏳ Planned | Roadmap |

### 4. Development Tool Integrations

Connect with developer workflows.

| Tool | Method | Status | Documentation |
|------|--------|--------|---------------|
| **GitHub** | Webhook, API | ⏳ Planned | Roadmap |
| **GitLab** | Webhook, API | ⏳ Planned | Roadmap |
| **Linear** | API | ⏳ Planned | Roadmap |
| **Jira** | API | ⏳ Planned | Roadmap |

---

## API Integration

### Authentication

```typescript
// API Key Authentication
const apiKey = 'sm_live_xxxxxxxxxxxxx';  // From Settings → API Keys

// Request with authentication
fetch('https://api.sovereign-memory.app/v1/memories', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
});
```

### Core API Endpoints

```typescript
// Create Memory
POST /v1/memories
{
  "content": "Learned about React Server Components",
  "memoryType": "SEMANTIC",
  "category": "knowledge",
  "tags": ["react", "javascript", "web"],
  "importance": 0.7,
  "source": {
    "type": "api",
    "reference": "manual-entry"
  }
}

// Search Memories
POST /v1/search
{
  "query": "React Server Components",
  "filters": {
    "memoryTypes": ["SEMANTIC", "PROCEDURAL"],
    "minImportance": 0.5
  },
  "limit": 20
}

// Get Memory
GET /v1/memories/{id}

// Update Memory
PATCH /v1/memories/{id}
{
  "content": "Updated content",
  "tags": ["new", "tags"]
}

// Delete Memory
DELETE /v1/memories/{id}

// Bulk Import
POST /v1/memories/bulk
{
  "memories: [
    { /* memory 1 */ },
    { /* memory 2 */ },
    // ... up to 1000
  ]
}
```

### SDK Integration

```bash
# Install SDK
npm install @sovereign-memory/sdk
# or
bun add @sovereign-memory/sdk
```

```typescript
import { SovereignMemory } from '@sovereign-memory/sdk';

// Initialize
const memory = new SovereignMemory({
  apiKey: process.env.SOVEREIGN_API_KEY,
  // Optional: Custom endpoint for self-hosted
  // baseUrl: 'https://your-instance.com',
});

// Create memory
await memory.memories.create({
  content: 'Important learning from today',
  memoryType: 'EPISODIC',
  tags: ['learning'],
});

// Search
const results = await memory.search('important learning');

// Get context for AI
const context = await memory.context.build({
  query: 'What do I know about this topic?',
  maxTokens: 2000,
});
```

---

## Webhook Integration

### Configure Webhooks

```typescript
// Settings → Integrations → Webhooks

POST /v1/webhooks
{
  "url": "https://your-server.com/webhooks/sovereign",
  "events": [
    "memory.created",
    "memory.updated",
    "memory.deleted",
    "conversation.imported"
  ],
  "secret": "whsec_xxxxxxxxxxxxx"  // For signature verification
}
```

### Webhook Payload

```typescript
// memory.created event
{
  "id": "evt_xxxxx",
  "type": "memory.created",
  "timestamp": "2026-03-09T12:00:00Z",
  "data": {
    "memory": {
      "id": "mem_xxxxx",
      "userId": "user_xxxxx",
      "content": "New memory content",
      "memoryType": "SEMANTIC",
      "category": "knowledge",
      "tags": ["tag1", "tag2"],
      "importance": 0.7,
      "createdAt": "2026-03-09T12:00:00Z"
    }
  }
}
```

### Verify Webhook Signatures

```typescript
import { verifyWebhookSignature } from '@sovereign-memory/sdk';

app.post('/webhooks/sovereign', (req, res) => {
  const signature = req.headers['sovereign-signature'];
  const payload = req.body;
  const secret = process.env.SOVEREIGN_WEBHOOK_SECRET;

  try {
    verifyWebhookSignature(payload, signature, secret);
    
    // Process webhook
    console.log('Webhook received:', payload.type);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Invalid webhook signature');
    res.status(401).send('Invalid signature');
  }
});
```

---

## Custom Connector Development

### Connector Interface

```typescript
interface AIProviderConnector {
  // Connector metadata
  providerId: string;
  name: string;
  version: string;
  
  // Authentication
  authenticate(credentials: Credentials): Promise<AuthResult>;
  
  // Data retrieval
  fetchConversations(options: FetchOptions): Promise<Conversation[]>;
  fetchConversation(id: string): Promise<Conversation>;
  
  // Export handling
  importExport(data: ExportData): Promise<ImportResult>;
  
  // Share link processing
  processShareLink(url: string): Promise<Conversation>;
}
```

### Example: Custom AI Provider Connector

```typescript
import { BaseConnector } from '@sovereign-memory/sdk/connectors';

class CustomAIConnector extends BaseConnector {
  providerId = 'custom-ai';
  name = 'Custom AI Platform';
  version = '1.0.0';

  async authenticate(credentials: CustomCredentials): Promise<AuthResult> {
    // Implement authentication logic
    const response = await fetch(`${credentials.baseUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: credentials.apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresAt: new Date(data.expires_at),
      userId: data.user_id,
    };
  }

  async fetchConversations(options: FetchOptions): Promise<Conversation[]> {
    // Fetch conversations from custom AI platform
    const response = await fetch(
      `${this.credentials.baseUrl}/conversations?limit=${options.limit}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    const data = await response.json();
    
    return data.conversations.map(conv => this.normalizeConversation(conv));
  }

  private normalizeConversation(conv: any): Conversation {
    return {
      id: conv.id,
      messages: conv.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
      })),
      createdAt: conv.created_at,
      metadata: {
        model: conv.model,
        title: conv.title,
      },
    };
  }
}

// Register connector
registerConnector('custom-ai', CustomAIConnector);
```

---

## Browser Extension Development

### Extension Architecture

```
extension/
├── manifest.json
├── background/
│   └── service-worker.ts    # Background service
├── content/
│   └── content-script.ts    # Page interaction
├── popup/
│   └── popup.html           # Extension popup
└── lib/
    └── api.ts               # API client
```

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "Sovereign Memory Capture",
  "version": "1.0.0",
  "description": "Capture AI conversations to your sovereign memory",
  
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus"
  ],
  
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*"
  ],
  
  "background": {
    "service_worker": "background/service-worker.js"
  },
  
  "content_scripts": [
    {
      "matches": [
        "https://chat.openai.com/*",
        "https://claude.ai/*",
        "https://gemini.google.com/*"
      ],
      "js": ["content/content-script.js"]
    }
  ],
  
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

### Content Script

```typescript
// content/content-script.ts

// Detect conversation content
function extractConversation(): Conversation {
  const isChatGPT = window.location.hostname === 'chat.openai.com';
  const isClaude = window.location.hostname === 'claude.ai';
  const isGemini = window.location.hostname === 'gemini.google.com';

  if (isChatGPT) {
    return extractChatGPTConversation();
  } else if (isClaude) {
    return extractClaudeConversation();
  } else if (isGemini) {
    return extractGeminiConversation();
  }
  
  throw new Error('Unsupported AI provider');
}

// Send to background service
browser.runtime.sendMessage({
  type: 'CONVERSATION_CAPTURED',
  payload: extractConversation(),
});

// Listen for save confirmation
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'CONVERSATION_SAVED') {
    showNotification('Conversation saved to Sovereign Memory!');
  }
});
```

---

## Zapier Integration

### Create Zapier App

```typescript
// Zapier CLI setup
npm install -g zapier-platform-cli
zapier login
zapier init sovereign-memory
cd sovereign-memory
```

### Define Trigger

```typescript
// triggers/new_memory.js
module.exports = {
  key: 'new_memory',
  noun: 'Memory',
  display: {
    label: 'New Memory Created',
    description: 'Triggers when a new memory is created.',
  },
  operation: {
    perform: {
      url: '{{process.env.BASE_URL}}/v1/memories',
      method: 'GET',
      params: {
        created_after: '{{bundle.authData.last_poll}}',
      },
    },
  },
};
```

### Define Action

```typescript
// actions/create_memory.js
module.exports = {
  key: 'create_memory',
  noun: 'Memory',
  display: {
    label: 'Create Memory',
    description: 'Creates a new memory in Sovereign Memory.',
  },
  operation: {
    perform: {
      url: '{{process.env.BASE_URL}}/v1/memories',
      method: 'POST',
      body: {
        content: bundle.inputData.content,
        memoryType: bundle.inputData.memoryType,
        tags: bundle.inputData.tags,
      },
    },
    inputFields: [
      { key: 'content', type: 'text', required: true },
      { key: 'memoryType', type: 'string', choices: ['EPISODIC', 'SEMANTIC', 'PROCEDURAL'] },
      { key: 'tags', type: 'string', list: true },
    ],
  },
};
```

---

## Testing Integrations

### Unit Tests

```typescript
import { test } from 'bun:test';
import { SovereignMemory } from '@sovereign-memory/sdk';

test('should create memory', async () => {
  const memory = new SovereignMemory({
    apiKey: process.env.TEST_API_KEY,
  });

  const result = await memory.memories.create({
    content: 'Test memory',
    memoryType: 'SEMANTIC',
  });

  expect(result.id).toBeDefined();
  expect(result.content).toBe('Test memory');
});

test('should search memories', async () => {
  const memory = new SovereignMemory({
    apiKey: process.env.TEST_API_KEY,
  });

  const results = await memory.search('test');

  expect(results.length).toBeGreaterThan(0);
});
```

### Integration Tests

```typescript
// tests/integration/chatgpt-connector.test.ts
import { test, describe, beforeEach } from 'bun:test';
import { ChatGPTConnector } from '../src/connectors/chatgpt';

describe('ChatGPT Connector', () => {
  let connector: ChatGPTConnector;

  beforeEach(() => {
    connector = new ChatGPTConnector({
      apiKey: process.env.OPENAI_API_KEY,
    });
  });

  test('should authenticate', async () => {
    const result = await connector.authenticate({
      apiKey: process.env.OPENAI_API_KEY,
    });
    expect(result.accessToken).toBeDefined();
  });

  test('should fetch conversations', async () => {
    const conversations = await connector.fetchConversations({
      limit: 10,
    });
    expect(conversations.length).toBeGreaterThan(0);
  });

  test('should process share link', async () => {
    const conversation = await connector.processShareLink(
      'https://chat.openai.com/share/xxxxx'
    );
    expect(conversation.messages.length).toBeGreaterThan(0);
  });
});
```

---

## Best Practices

### For API Integrations

1. **Rate Limiting**: Respect API rate limits (100 req/min default)
2. **Error Handling**: Implement retry logic with exponential backoff
3. **Caching**: Cache frequently accessed data
4. **Pagination**: Handle large result sets properly
5. **Webhooks**: Use webhooks for real-time updates instead of polling

### For Security

1. **API Keys**: Store securely, never in client code
2. **Encryption**: Use HTTPS for all API calls
3. **Validation**: Validate all incoming webhook payloads
4. **Scopes**: Request minimum required permissions
5. **Rotation**: Rotate API keys regularly

### For Performance

1. **Batching**: Use bulk endpoints for multiple operations
2. **Filtering**: Filter on server-side when possible
3. **Indexing**: Use appropriate indexes for searches
4. **Caching**: Implement multi-layer caching
5. **Monitoring**: Track API latency and errors

---

## Troubleshooting

### Common Issues

**"401 Unauthorized"**
- Check API key is valid
- Verify key hasn't expired
- Ensure correct environment (prod vs staging)

**"429 Rate Limited"**
- Implement exponential backoff
- Use bulk endpoints
- Consider caching

**"Webhook not received"**
- Check webhook URL is publicly accessible
- Verify SSL certificate
- Check firewall rules

**"Connector not working"**
- Verify connector is registered
- Check authentication credentials
- Review connector logs

---

## Support

- **API Documentation**: `/docs/api`
- **SDK Documentation**: `/docs/sdk`
- **Community**: GitHub Discussions
- **Enterprise Support**: enterprise@sovereign-memory.app

---

**Previous:** [Enterprise Use Case](enterprise.md)
