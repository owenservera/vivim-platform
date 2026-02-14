# OpenScroll Database Schema Documentation

## Overview

This schema follows industry best practices for AI conversation storage, based on:
- **OpenAI ChatGPT** export format
- **LangChain** message structure
- **Google Gemini API** content parts model

## Core Design Principles

### 1. Normalized Structure
- **Conversations** and **Messages** are separate tables
- Enables efficient querying and updates
- Supports conversation-level and message-level operations

### 2. Multimodal Content Support
- Messages contain **parts** (JSONB array)
- Each part has a `type`, `content`, and `metadata`
- Supports: text, code, images, LaTeX, tables, Mermaid diagrams, tool calls

### 3. Provider Agnostic
- Works with any AI chat provider (Gemini, ChatGPT, Claude, etc.)
- Standardized message roles: `user`, `assistant`, `system`, `tool`
- Provider-specific data stored in `metadata` fields

## Table Structures

### Conversation

Represents a complete chat session.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `provider` | String | Source provider (e.g., "gemini", "chatgpt") |
| `sourceUrl` | String | Original share URL (unique) |
| `title` | String | Conversation title |
| `model` | String? | AI model used (e.g., "gemini-2.0-flash") |
| `createdAt` | Timestamp | When conversation was created |
| `updatedAt` | Timestamp | Last message time |
| `capturedAt` | Timestamp | When we captured it |
| `messageCount` | Int | Total messages |
| `userMessageCount` | Int | User messages only |
| `aiMessageCount` | Int | AI messages only |
| `totalWords` | Int | Word count across all messages |
| `totalCharacters` | Int | Character count |
| `totalTokens` | Int? | Token count (if available) |
| `totalCodeBlocks` | Int | Number of code blocks |
| `totalImages` | Int | Number of images |
| `totalTables` | Int | Number of tables |
| `totalLatexBlocks` | Int | Number of LaTeX blocks |
| `totalMermaidDiagrams` | Int | Number of Mermaid diagrams |
| `totalToolCalls` | Int | Number of tool calls |
| `metadata` | JSONB | Additional provider-specific data |

### Message

Individual messages within a conversation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `conversationId` | UUID | Foreign key to Conversation |
| `role` | String | "user", "assistant", "system", or "tool" |
| `author` | String? | Display name (e.g., "ChatGPT", "User") |
| `parts` | JSONB | Array of content parts (see below) |
| `createdAt` | Timestamp | When message was sent |
| `messageIndex` | Int | Position in conversation (0-based) |
| `status` | String | "completed", "error", "cancelled" |
| `finishReason` | String? | "stop", "length", "tool_calls" |
| `tokenCount` | Int? | Tokens in this message |
| `metadata` | JSONB | Additional message-specific data |

## Content Parts Structure

Messages contain an array of **parts** in the `parts` JSONB field. Each part represents a distinct piece of content.

### Part Schema

```typescript
interface ContentPart {
  type: 'text' | 'code' | 'image' | 'latex' | 'table' | 'mermaid' | 'tool_call' | 'tool_result';
  content: string | object;
  metadata?: Record<string, any>;
}
```

### Part Types

#### 1. Text Part

Plain or markdown-formatted text.

```json
{
  "type": "text",
  "content": "Here's how to solve this problem...",
  "metadata": {
    "format": "markdown"
  }
}
```

#### 2. Code Part

Source code with syntax highlighting.

```json
{
  "type": "code",
  "content": "function hello() {\n  console.log('Hello!');\n}",
  "metadata": {
    "language": "javascript",
    "filename": "example.js",
    "highlighted": true
  }
}
```

#### 3. Image Part

Images (URL or base64).

```json
{
  "type": "image",
  "content": "https://example.com/image.png",
  "metadata": {
    "alt": "A beautiful sunset",
    "width": 1024,
    "height": 768,
    "mimeType": "image/png",
    "source": "generated"
  }
}
```

#### 4. LaTeX Part

Mathematical equations.

```json
{
  "type": "latex",
  "content": "f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} dx",
  "metadata": {
    "display": "block"
  }
}
```

#### 5. Table Part

Structured tabular data.

```json
{
  "type": "table",
  "content": {
    "headers": ["Name", "Age", "City"],
    "rows": [
      ["Alice", "30", "NYC"],
      ["Bob", "25", "LA"]
    ]
  },
  "metadata": {
    "format": "markdown"
  }
}
```

#### 6. Mermaid Part

Diagrams and flowcharts.

```json
{
  "type": "mermaid",
  "content": "graph TD\n  A[Start] --> B[Process]\n  B --> C[End]",
  "metadata": {
    "diagramType": "flowchart"
  }
}
```

#### 7. Tool Call Part

AI tool/function invocations.

```json
{
  "type": "tool_call",
  "content": {
    "id": "call_abc123",
    "name": "web_search",
    "arguments": {
      "query": "latest news"
    }
  },
  "metadata": {}
}
```

#### 8. Tool Result Part

Results from tool calls.

```json
{
  "type": "tool_result",
  "content": {
    "tool_call_id": "call_abc123",
    "result": "Found 10 articles..."
  },
  "metadata": {
    "success": true
  }
}
```

## Example Message Structure

A complete message with multiple parts:

```json
{
  "id": "msg_123",
  "conversationId": "conv_456",
  "role": "assistant",
  "author": "Gemini",
  "messageIndex": 2,
  "createdAt": "2026-01-25T06:00:00Z",
  "status": "completed",
  "finishReason": "stop",
  "parts": [
    {
      "type": "text",
      "content": "Here's a solution in JavaScript:",
      "metadata": { "format": "markdown" }
    },
    {
      "type": "code",
      "content": "const sum = (a, b) => a + b;",
      "metadata": {
        "language": "javascript",
        "highlighted": true
      }
    },
    {
      "type": "text",
      "content": "The time complexity is O(1)."
    }
  ],
  "metadata": {
    "model": "gemini-2.0-flash",
    "temperature": 0.7
  }
}
```

## Migration Strategy

When migrating from the old schema:

1. **Create Messages table** from `content` JSON in Conversations
2. **Parse message content** into structured parts
3. **Compute statistics** from messages
4. **Update indexes** for performance

## Query Patterns

### Get conversation with all messages

```sql
SELECT c.*, 
       json_agg(m.* ORDER BY m.messageIndex) as messages
FROM conversations c
LEFT JOIN messages m ON m.conversationId = c.id
WHERE c.id = $1
GROUP BY c.id;
```

### Search for code blocks

```sql
SELECT m.*, c.title
FROM messages m
JOIN conversations c ON c.id = m.conversationId
WHERE m.parts::text LIKE '%"type":"code"%'
  AND m.parts::text LIKE '%python%';
```

### Get conversations with images

```sql
SELECT DISTINCT c.*
FROM conversations c
WHERE c.totalImages > 0
ORDER BY c.capturedAt DESC;
```

## Best Practices

1. **Always use transactions** when creating conversations + messages
2. **Compute statistics** after inserting messages
3. **Index JSONB fields** for common queries (use GIN indexes)
4. **Validate parts structure** before insertion
5. **Store large images** as URLs, not base64 in database
6. **Use cascading deletes** for conversation → messages relationship
