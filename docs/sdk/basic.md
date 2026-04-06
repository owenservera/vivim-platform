itle: "SDK Basic Usage"
description: "Connect to VIVIM, manage memories, and import conversations from AI providers."
---

# Basic Usage

Learn to connect to VIVIM, manage memories, and import conversations using the SDK.

## Connecting to VIVIM

Initialize the SDK with your VIVIM instance URL and API key:

```typescript
import { VIVIM } from '@vivim/sdk';

const vivim = new VIVIM({
  apiUrl: 'https://api.vivim.app',   // or your self-hosted URL
  apiKey: process.env.VIVIM_API_KEY,  // from your VIVIM dashboard
});

// Test the connection
const status = await vivim.health.check();
console.log(`Connected: ${status.ok}`);
```

### Self-hosted connection

```typescript
const vivim = new VIVIM({
  apiUrl: 'http://localhost:3000',
  // No API key needed for local development
});
```

## Memory operations

### Create a memory

```typescript
const acu = await vivim.memory.create({
  content: 'We deploy to Vercel using the CLI',
  type: 'procedural',
  tags: ['deployment', 'vercel'],
});

console.log(`Created ACU: ${acu.id}`);
```

### Read a memory

```typescript
const acu = await vivim.memory.get('acu_abc123');
console.log(acu.content);
```

### Update a memory

```typescript
await vivim.memory.update('acu_abc123', {
  content: 'We deploy to Vercel using the CLI with preview deployments',
});
```

### Delete a memory

```typescript
await vivim.memory.delete('acu_abc123');
// Soft delete — recoverable within retention period
```

## Searching memories

### Full-text search

```typescript
const results = await vivim.memory.search({
  query: 'deployment procedure',
  limit: 10,
});

for (const acu of results) {
  console.log(`[${acu.type}] ${acu.content}`);
}
```

### Filtered search

```typescript
const results = await vivim.memory.search({
  query: 'preferences',
  filters: {
    types: ['preference', 'identity'],
    createdAfter: new Date('2025-01-01'),
  },
  limit: 5,
});
```

### Semantic search

```typescript
// Find memories semantically similar to a concept
const similar = await vivim.memory.similar({
  seedText: 'team communication patterns',
  limit: 10,
  threshold: 0.7, // minimum similarity score
});
```

## Importing conversations

### From ChatGPT export

```typescript
const result = await vivim.conversations.import({
  provider: 'openai',
  format: 'html',
  data: chatgptExportHtml,
});

console.log(`Imported ${result.conversations.length} conversations`);
console.log(`Extracted ${result.acus.length} memories`);
```

### From Claude export

```typescript
const result = await vivim.conversations.import({
  provider: 'anthropic',
  format: 'json',
  data: claudeExportJson,
});
```

### From Gemini (Google Takeout)

```typescript
const result = await vivim.conversations.import({
  provider: 'google',
  format: 'activity',
  data: googleTakeoutJson,
});
```

## Conversations list

```typescript
// List all conversations
const conversations = await vivim.conversations.list({
  limit: 20,
  offset: 0,
});

// Get a specific conversation
const conversation = await vivim.conversations.get('conv_xyz789');
console.log(`Messages: ${conversation.messages.length}`);
console.log(`ACUs: ${conversation.acus.length}`);
```


::: tip
For production imports, use batch import with progress callbacks to handle large conversation sets without timeout.
:::

