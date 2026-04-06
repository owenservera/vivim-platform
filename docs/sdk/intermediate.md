---
title: "SDK Intermediate"
description: "Context recipes, collections, bookmarks, and advanced search patterns."
---

# Intermediate Guide

Level up your VIVIM integration with context recipes, collections, bookmarks, and advanced search patterns.

## Context recipes

Context recipes are pre-built context assembly patterns for common use cases:

### Recipe: Developer context

```typescript
import { developerContext } from '@vivim/sdk/context';

const context = await developerContext(vivim, {
  project: 'vivim-platform',
  includeRecentConversations: true,
  includePreferences: true,
  maxTokens: 4000,
});

// Use as system prompt
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: context.systemPrompt },
    { role: 'user', content: 'How should I structure this component?' },
  ],
});
```

### Recipe: Personal context

```typescript
import { personalContext } from '@vivim/sdk/context';

const context = await personalContext(vivim, {
  includeIdentity: true,
  includeGoals: true,
  includeRecentMemories: true,
  maxTokens: 2000,
});
```

### Recipe: Custom recipe

```typescript
import { assembleContext } from '@vivim/sdk/context';

const context = await assembleContext(vivim, {
  layers: [
    { type: 'identity', maxTokens: 200 },
    { type: 'preference', maxTokens: 500 },
    {
      type: 'search',
      query: 'current project architecture',
      maxTokens: 3000,
    },
  ],
});
```

## Collections

Collections group related memories for easier management:

### Create a collection

```typescript
const collection = await vivim.collections.create({
  name: 'Deployment Knowledge',
  description: 'Everything about our deployment process',
  tags: ['deployment', 'devops'],
});
```

### Add memories to a collection

```typescript
await vivim.collections.addMemory(collection.id, 'acu_abc123');
await vivim.collections.addMemory(collection.id, 'acu_def456');
```

### Search within a collection

```typescript
const results = await vivim.collections.search(collection.id, {
  query: 'Vercel deployment commands',
  limit: 5,
});
```

### List collections

```typescript
const collections = await vivim.collections.list();
for (const c of collections) {
  console.log(`${c.name}: ${c.memoryCount} memories`);
}
```

## Bookmarks

Bookmarks pin important memories for quick access:

### Create a bookmark

```typescript
const bookmark = await vivim.bookmarks.create({
  acuId: 'acu_abc123',
  note: 'Critical deployment procedure',
});
```

### List bookmarks

```typescript
const bookmarks = await vivim.bookmarks.list();
for (const b of bookmarks) {
  console.log(`[${b.note}] ${b.acu.content}`);
}
```

### Remove a bookmark

```typescript
await vivim.bookmarks.delete(bookmark.id);
// Note: This only removes the bookmark, not the underlying memory
```

## Advanced search patterns

### Combined search

```typescript
const results = await vivim.memory.search({
  query: 'architecture decisions',
  filters: {
    types: ['semantic', 'factual'],
    createdAfter: new Date('2025-01-01'),
    tags: ['architecture'],
  },
  includeBookmarks: true,
  limit: 10,
});
```

### Graph traversal search

```typescript
// Find memories connected to a specific ACU
const related = await vivim.memory.findRelated('acu_abc123', {
  maxDepth: 2, // 2 hops away
  limit: 20,
  relationshipTypes: ['similar', 'causal', 'temporal'],
});
```

### Temporal search

```typescript
// Find memories from a specific time period
const memories = await vivim.memory.search({
  query: '',
  filters: {
    createdBetween: {
      start: new Date('2025-03-01'),
      end: new Date('2025-03-31'),
    },
  },
  sortBy: 'created_at',
  sortOrder: 'desc',
});
```


::: info
Context recipes are pre-optimized for token efficiency. They use VIVIM's budget algorithm to allocate context windows appropriately for each use case.
:::

