# PageIndex Integration Guide

This document describes how to integrate PageIndex (https://github.com/VectifyAI/PageIndex) into VIVIM for intelligent, reasoning-based document search.

## What is PageIndex?

PageIndex is a **vectorless, reasoning-based RAG system** that:
- Builds hierarchical tree indexes from documents (like an intelligent Table of Contents)
- Uses LLM reasoning for context-aware retrieval via tree search
- Does NOT require a vector database
- Achieved 98.7% accuracy on FinanceBench benchmark

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VIVIM + PageIndex                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
│  │  Docusaurus │────►│   Server    │────►│    PWA     │     │
│  │    Docs     │     │  PageIndex  │     │  Frontend   │     │
│  └─────────────┘     │   Service   │     │             │     │
│        │             └─────────────┘     └─────────────┘     │
│        │                   │                   │               │
│        ▼                   ▼                   ▼               │
│  Build-time:          API Routes:         DocumentChat        │
│  - Index docs         - /api/docs/search  Component          │
│  - Store tree         - /api/docs/index                      │
│                        - /api/docs/tree                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Files Created

### 1. Server Service (`server/src/services/page-index-service.ts`)

Provides the core PageIndex integration:
- `indexDocument()` - Index PDF or Markdown documents
- `search()` - Reasoning-based search using tree traversal
- `getDocumentTree()` - Retrieve document structure

### 2. API Routes (`server/src/routes/doc-search.ts`)

REST API endpoints:
- `POST /api/docs/search` - Search documents
- `POST /api/docs/index` - Index new document
- `GET /api/docs/tree/:documentId` - Get document tree
- `DELETE /api/docs/index/:documentId` - Remove document
- `GET /api/docs/status` - Service status

### 3. Frontend Component (`pwa/src/components/DocumentChat.tsx`)

React component for document chat:
- Document upload (PDF/Markdown)
- Reasoning-based Q&A
- Source citations with page references
- Streaming responses

---

## Setup Instructions

### Option 1: Cloud API (Recommended for Quick Start)

1. Get API key from https://pageindex.ai
2. Set environment variable:

```bash
# server/.env
PAGEINDEX_API_KEY=your_api_key_here
```

3. Register the route in `server/src/server.js`:

```javascript
import docSearchRouter from './routes/doc-search.js';
app.use('/api/docs', docSearchRouter);
```

### Option 2: Self-Hosted (Full Control)

1. Clone PageIndex repository:

```bash
cd /path/to/vivim-app
git clone https://github.com/VectifyAI/PageIndex.git
```

2. Install Python dependencies:

```bash
cd PageIndex
pip3 install -r requirements.txt
```

3. Set environment variables:

```bash
# server/.env
PAGEINDEX_SELF_HOSTED=true
OPENAI_API_KEY=your_openai_key  # Required for LLM reasoning
```

4. Register the route (same as Option 1)

---

## Integration with User WebChat (BYOKChat)

### Step 1: Add Document Mode Toggle

In `pwa/src/pages/BYOKChat.tsx`, add a toggle for document chat mode:

```typescript
import { DocumentChat } from '../components/DocumentChat';

// In your component state
const [chatMode, setChatMode] = useState<'general' | 'document'>('general');

// In your render
return (
  <div className="chat-container">
    {chatMode === 'document' ? (
      <DocumentChat onClose={() => setChatMode('general')} />
    ) : (
      <ExistingChat />
    )}
  </div>
);
```

### Step 2: Pass User's API Key

If users need to use their own API key for document processing:

```typescript
const handleDocQuery = async (query: string) => {
  const response = await fetch('/api/docs/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userApiKey}`  // Pass user's key
    },
    body: JSON.stringify({
      documentId: currentDocId,
      query
    })
  });
  return response.json();
};
```

---

## Integration with AI Auto Documentation (Service Worker)

### Option 1: Server-Side Documentation Indexing

Create a build script that indexes all Docusaurus docs:

```javascript
// scripts/index-docs.js
import { pageIndexService } from '../server/src/services/page-index-service.js';
import { glob } from 'glob';
import * as path from 'path';

async function indexAllDocs() {
  const docsDir = './vivim.docs.context/docs';
  const files = await glob(`${docsDir}/**/*.md`);
  
  for (const file of files) {
    const docId = path.basename(file, '.md');
    console.log(`Indexing: ${docId}`);
    
    await pageIndexService.indexDocument(file, {
      documentId: docId,
      title: docId,
      isMarkdown: true
    });
  }
  
  console.log('All docs indexed!');
}

indexAllDocs();
```

### Option 2: Service Worker Enhancement

Enhance `pwa/src/service-worker.ts` to cache doc index and provide contextual help:

```typescript
// In service-worker.ts
const DOC_INDEX_CACHE = 'doc-index-v1';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Intercept doc page requests
  if (url.pathname.startsWith('/docs/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          // Check if we should provide contextual help
          const docId = url.pathname.split('/').pop();
          suggestContextualHelp(docId, event.clientId);
        }
        return response || fetch(event.request);
      })
    );
  }
});

async function suggestContextualHelp(docId: string, clientId: string) {
  // Query PageIndex for relevant sections
  const response = await fetch('/api/docs/search', {
    method: 'POST',
    body: JSON.stringify({
      documentId: docId,
      query: 'How do I use this feature?'
    })
  });
  
  if (response.ok) {
    // Send suggestion to client via postMessage
    const clients = await self.clients.get(clientId);
    clients?.postMessage({
      type: 'DOC_HELP',
      suggestions: await response.json()
    });
  }
}
```

---

## Usage Examples

### 1. Indexing a User's PDF

```typescript
// Frontend - Upload and index
const handleFileSelect = async (file: File) => {
  // Upload file to server first
  const formData = new FormData();
  formData.append('file', file);
  
  const uploadResponse = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const { filePath } = await uploadResponse.json();
  
  // Index with PageIndex
  await fetch('/api/docs/index', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: file.name,
      title: file.name,
      filePath,
      isMarkdown: false  // PDF
    })
  });
};
```

### 2. Searching Documents

```typescript
// Frontend - Ask questions
const handleSearch = async (question: string) => {
  const response = await fetch('/api/docs/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: 'my-document',
      query: question,
      top_k: 3
    })
  });
  
  const { results } = await response.json();
  
  // Display results with citations
  results.forEach((result: any) => {
    console.log(`${result.section_title} (Page ${result.page_reference})`);
    console.log(result.content);
  });
};
```

### 3. Server-Side Context Augmentation

```typescript
// Use in AI chat to augment context with docs
async function generateResponseWithDocs(userMessage: string) {
  // Find relevant docs
  const searchResults = await fetch('/api/docs/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: 'vivim-docs',
      query: userMessage,
      top_k: 3
    })
  });
  
  const { results } = await searchResults.json();
  
  // Build context from results
  const docContext = results
    .map(r => `## ${r.section_title}\n${r.content}`)
    .join('\n\n');
  
  // Send to AI with augmented context
  return await aiService.chat({
    messages: [{
      role: 'system',
      content: `Use these documentation sections to answer:\n\n${docContext}`
    }, {
      role: 'user',
      content: userMessage
    }]
  });
}
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PAGEINDEX_API_KEY` | API key from pageindex.ai | Cloud mode |
| `PAGEINDEX_API_URL` | Custom API URL | No (default: https://api.pageindex.ai) |
| `PAGEINDEX_SELF_HOSTED` | Set to `true` for self-hosted | Self-hosted mode |
| `OPENAI_API_KEY` | OpenAI key for self-hosted | Self-hosted mode |

---

## Performance Considerations

1. **Index at Build Time**: For VIVIM docs, index during the build process and store the tree in the database
2. **Cache Results**: Cache frequent queries to reduce API calls
3. **Batch Indexing**: When indexing multiple docs, do it in parallel
4. **Token Limits**: PageIndex trees can be large; consider pagination for very long docs

---

## Troubleshooting

### Issue: "PageIndex not configured"

**Solution**: Ensure environment variables are set correctly:
```bash
# Check if variables are loaded
curl http://localhost:3000/api/docs/status
```

### Issue: "Document not found in index"

**Solution**: The document hasn't been indexed yet. Call `/api/docs/index` first.

### Issue: Search returns no results

**Possible causes**:
- Document tree structure doesn't match query
- LLM reasoning didn't find relevant sections

**Solution**: Try re-indexing with different parameters or check the document structure with `/api/docs/tree/:id`

---

## References

- PageIndex GitHub: https://github.com/VectifyAI/PageIndex
- PageIndex Docs: https://docs.pageindex.ai
- PageIndex Blog: https://pageindex.ai/blog
- FinanceBench Results: https://github.com/VectifyAI/Mafin2.5-FinanceBench
