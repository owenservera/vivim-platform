---
title: "SDK Introduction"
description: "The VIVIM SDK lets you build AI memory into any application. Learn the basics, core types, and integration patterns."
---

# SDK Introduction

The VIVIM SDK is a TypeScript toolkit that gives any application access to VIVIM's AI memory layer. Build contextual AI features, sync memories across apps, or create entirely new VIVIM-powered tools.

## What the SDK provides

| Capability | Description |
|---|---|
| **Memory access** | Read, write, and search ACUs programmatically |
| **Context cockpit** | Build rich context-aware UIs with React components |
| **Conversation capture** | Import conversations from any provider |
| **Context recipes** | Pre-built context assembly patterns |
| **Collections** | Group and organize memories programmatically |
| **Bookmarks** | Pin important memories for quick access |
| **Sharing** | Encrypted circle management |

## Installation

```bash
bun add @vivim/sdk
# or
npm install @vivim/sdk
# or
yarn add @vivim/sdk
```

## Quick example

```typescript
import { VIVIM } from '@vivim/sdk';

const vivim = new VIVIM({
  apiUrl: 'http://localhost:3000',
  apiKey: process.env.VIVIM_API_KEY,
});

// Search your memories
const results = await vivim.memory.search({
  query: 'deployment strategy',
  limit: 5,
});

// Capture a conversation
const conversation = await vivim.conversations.import({
  provider: 'openai',
  messages: [
    { role: 'user', content: 'How do we deploy to production?' },
    { role: 'assistant', content: 'Use bun run build, then deploy to Vercel.' },
  ],
});

console.log(`Extracted ${conversation.acus.length} memories`);
```

## SDK structure

The SDK is organized into modules:

| Module | Purpose |
|---|---|
| `memory` | ACU CRUD, search, classification |
| `conversations` | Import, export, list |
| `context` | Context assembly, recipes |
| `collections` | Group memories into collections |
| `bookmarks` | Pin and manage bookmarks |
| `sharing` | Circle management and encrypted sharing |
| `identity` | DID and key management |

## React components

For React applications, the SDK provides ready-made UI components:

```typescript
import { ContextCockpit, MemoryCard, SearchBar } from '@vivim/sdk/react';

function MyComponent() {
  return (
    <div>
      <SearchBar onResult={(results) => console.log(results)} />
      <ContextCockpit />
      <MemoryCard acuId="acu_abc123" />
    </div>
  );
}
```

## Next steps

- [Basic usage](/sdk/basic) — Connect to VIVIM and perform common operations
- [Intermediate guide](/sdk/intermediate) — Context recipes, collections, and search
- [Advanced guide](/sdk/advanced) — Custom integrations and extension points


::: info
The SDK source is available at [github.com/owenservera/vivim-platform/tree/main/sdk](https://github.com/owenservera/vivim-platform/tree/main/sdk).
:::

