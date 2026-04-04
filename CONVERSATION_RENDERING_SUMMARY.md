# Conversation Rendering Enhancement Summary

**Session:** ses_2fceee947ffe9fYKGFmljNyc2R  
**Date:** March 19, 2026  
**Status:** Schema & Backend Complete

---

## Overview

This document summarizes the comprehensive enhancements made to enable full conversation rendering with all styling and text types properly displayed across all frontend contexts (feed cards, scroll view, conversation view, etc.).

## Changes Made

### 1. Database Schema Enhancements (`server/prisma/schema.prisma`)

#### Message Model - New Fields

```prisma
model Message {
  // ... existing fields ...
  
  // Rich rendering support
  renderedContent Json?           @db.JsonB  // Pre-rendered content with full styling
  textStyles     Json?            @db.JsonB  // Inline text formatting (bold, italic, links, etc.)
  customClasses  String[]         // Custom CSS classes for this message
  displayOrder   Int              @default(0)  // For custom ordering in feeds
  
  @@index([displayOrder])
}
```

**Purpose:**
- `renderedContent`: Stores pre-computed rendered content for performance
- `textStyles`: Captures inline text formatting (bold, italic, underline, links, highlights, code spans)
- `customClasses`: Allows custom Tailwind/CSS classes per message
- `displayOrder`: Enables custom ordering in feeds independent of messageIndex

#### Conversation Model - New Fields

```prisma
model Conversation {
  // ... existing fields ...
  
  // Rendering support
  renderedPreview         Json?                    @db.JsonB  // Pre-rendered preview for feeds
  renderingOptions        Json?                    @db.JsonB  // Custom rendering options
  
  messages                Message[]
  renderingCache          RenderingCache?
  
  // ... rest of relations ...
}
```

**Purpose:**
- `renderedPreview`: Cached preview data for fast feed rendering
- `renderingOptions`: Custom rendering configuration per conversation
- `renderingCache`: Relation to dedicated cache table

#### New Models for Rendering Infrastructure

**1. RenderingTemplate** - Reusable styling templates

```prisma
model RenderingTemplate {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  
  // Template configuration
  templateType String  // 'feed_card', 'scroll_item', 'conversation_view', 'preview'
  provider     String? // Specific provider or null for all
  role         String? // 'user', 'assistant', 'system', or null for all
  
  // Styling configuration
  styles       Json    @default("{}") @db.JsonB  // CSS-in-JS styles
  classes      String[]  // Tailwind/custom CSS classes
  layout       String  @default("default")  // 'default', 'compact', 'expanded', 'grid'
  
  // Content rendering options
  showMetadata Boolean  @default(true)
  showTimestamp Boolean @default(true)
  showProvider Boolean @default(true)
  maxPreviewLength Int?  // Max characters for preview mode
  enableSyntaxHighlighting Boolean @default(true)
  enableLazyLoading Boolean @default(true)
  
  // Conditional rendering rules
  conditions   Json?   @db.JsonB  // Rules for when to apply this template
  
  createdAt    DateTime @default(now()) @db.Timestamptz(6)
  updatedAt    DateTime @updatedAt @db.Timestamptz(6)
  
  @@index([templateType])
  @@index([provider])
  @@index([name])
}
```

**2. RenderingCache** - Performance optimization

```prisma
model RenderingCache {
  id              String   @id @default(uuid())
  conversationId  String   @unique
  contentHash     String   // Hash of content for cache invalidation
  renderedVersion String   // Version of rendering engine used
  
  // Cached rendered data
  renderedData    Json     @db.JsonB  // Fully rendered conversation data
  
  // Cache metadata
  viewMode        String   @default("list")  // 'list', 'grid', 'graph'
  includeMessages Boolean  @default(true)
  messageLimit    Int?     // Max messages to include
  
  // Performance metrics
  renderTimeMs    Int?     // Time taken to render
  messageCount    Int?     // Number of messages rendered
  contentSize     Int?     // Size of rendered content in bytes
  
  // Cache lifecycle
  hits            Int      @default(0)  // Cache hit counter
  lastAccessedAt  DateTime @default(now()) @db.Timestamptz(6)
  expiresAt       DateTime? @db.Timestamptz(6)
  createdAt       DateTime @default(now()) @db.Timestamptz(6)
  
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@index([contentHash])
  @@index([lastAccessedAt])
  @@index([expiresAt])
}
```

**3. MessageStylePreset** - Predefined style configurations

```prisma
model MessageStylePreset {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  
  // Style configuration
  backgroundColor String?
  borderColor     String?
  textColor       String?
  fontFamily      String?
  fontSize        String?
  lineHeight      String?
  padding         String?
  margin          String?
  borderRadius    String?
  boxShadow       String?
  
  // Tailwind class presets
  twClasses       String[]
  
  // Conditional application
  applyToRole     String?  // 'user', 'assistant', 'system'
  applyToProvider String?  // Specific provider
  applyToContentTypes String[] // ['code', 'image', 'table', etc.]
  
  createdAt       DateTime @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime @updatedAt @db.Timestamptz(6)
  
  @@index([applyToRole])
  @@index([applyToProvider])
}
```

---

### 2. Backend Services

#### Conversation Rendering Service
**File:** `server/src/services/conversation-rendering-service.ts`

**Key Features:**
- Full conversation rendering with styling metadata
- In-memory caching with TTL (configurable, default 5 minutes)
- Database cache persistence via `RenderingCache` model
- Support for multiple view modes (list, grid, graph, preview, full)
- ACU (Atomic Chat Unit) rendering integration
- Content part styling with CSS classes and layout options

**Main Methods:**
```typescript
renderConversation(conversationId: string, options: RenderOptions): Promise<RenderedConversation>
renderMessages(messages: any[], options: RenderOptions): Promise<RenderedMessage[]>
getRenderingTemplates(options: { templateType?, provider?, role? }): Promise<any[]>
clearCache(conversationId: string): void
```

**Rendered Data Structure:**
```typescript
interface RenderedConversation {
  id: string;
  title: string;
  provider: string;
  sourceUrl: string;
  state: string;
  visibility: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  capturedAt: string;
  stats: ConversationStats;
  messages?: RenderedMessage[];
  messageCount: number;
  renderedAt: string;
  renderTimeMs: number;
  contentHash: string;
  viewMode: string;
  acus?: RenderedACU[];
  customClasses?: string[];
  renderingOptions?: Record<string, unknown>;
}

interface RenderedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  author?: string;
  messageIndex: number;
  createdAt: string;
  parts: ContentPart[];
  renderedContent?: any;
  textStyles?: TextStyle[];
  customClasses: string[];
  displayOrder: number;
  status: string;
  finishReason?: string;
  tokenCount?: number;
  metadata: Record<string, unknown>;
  acus?: RenderedACU[];
}

interface ContentPart {
  type: 'text' | 'code' | 'image' | 'latex' | 'table' | 'mermaid' | 'tool_call' | 'tool_result';
  content: string | Record<string, unknown>;
  metadata?: Record<string, unknown>;
  styling?: PartStyling;
}

interface PartStyling {
  cssClasses?: string[];
  inlineStyles?: Record<string, string>;
  theme?: 'light' | 'dark';
  layout?: 'default' | 'compact' | 'expanded';
}

interface TextStyle {
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link' | 'highlight';
  startOffset: number;
  endOffset: number;
  href?: string;
  customClass?: string;
}
```

---

### 3. API Endpoints

**File:** `server/src/routes/conversations.render.ts`

#### GET `/api/v1/conversations/:id/render`

Render a conversation with full styling for display.

**Query Parameters:**
- `viewMode`: 'list' | 'grid' | 'graph' | 'preview' | 'full' (default: 'list')
- `includeMessages`: 'true' | 'false' (default: 'true')
- `messageLimit`: number (optional)
- `messageOffset`: number (default: 0)
- `enableSyntaxHighlighting`: 'true' | 'false' (default: 'true')
- `enableLazyLoading`: 'true' | 'false' (default: 'true')
- `maxPreviewLength`: number (optional)
- `includeMetadata`: 'true' | 'false' (default: 'true')
- `includeStats`: 'true' | 'false' (default: 'true')
- `includeACUs`: 'true' | 'false' (default: 'false')
- `stylePreset`: string (optional)
- `template`: string (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Conversation Title",
    "provider": "chatgpt",
    "messages": [...],
    "stats": {...},
    "renderedAt": "2026-03-19T...",
    "renderTimeMs": 45,
    "contentHash": "sha256...",
    "viewMode": "list"
  },
  "meta": {
    "renderedAt": "2026-03-19T...",
    "renderTimeMs": 45,
    "contentHash": "sha256...",
    "viewMode": "list",
    "cached": false
  }
}
```

#### GET `/api/v1/conversations/:id/render/preview`

Get a lightweight preview optimized for feed cards.

**Features:**
- Returns only first 3 messages
- Disabled syntax highlighting for speed
- Max 200 characters per message preview
- Includes basic stats and metadata

#### POST `/api/v1/conversations/render/batch`

Render multiple conversations at once for efficient feed loading.

**Request Body:**
```json
{
  "conversationIds": ["uuid1", "uuid2", ...],
  "options": {
    "viewMode": "grid",
    "includeMessages": false,
    "messageLimit": 5
  }
}
```

**Limits:**
- Maximum 50 conversations per batch
- Returns success/failure per conversation

#### GET `/api/v1/conversations/render/templates`

Get available rendering templates.

**Query Parameters:**
- `templateType`: Filter by template type
- `provider`: Filter by provider
- `role`: Filter by message role

#### DELETE `/api/v1/conversations/:id/render/cache`

Clear rendering cache for a conversation.

---

### 4. Frontend Integration Points

The rendering API is designed to integrate with existing frontend components:

#### Feed Card Rendering (`pwa/src/components/FeedCard.tsx`, `pwa/src/components/features/conversation/FeedItemCard.tsx`)

**Current:** Uses `getPreviewText()` to extract plain text preview

**Enhanced:** Can use `/render/preview` endpoint for rich previews:
```typescript
const preview = await fetch(`/api/v1/conversations/${id}/render/preview`);
const { data } = await preview.json();
// data.messagePreview contains styled content parts
```

#### Scroll View (`pwa/src/pages/Scroll.tsx`)

**Current:** Uses `FeedItemCard` with expanded mode for inline conversation viewing

**Enhanced:** Can use `/render` endpoint with `viewMode=full`:
```typescript
const rendered = await fetch(`/api/v1/conversations/${id}/render?viewMode=full&includeMessages=true`);
const { data } = await rendered.json();
// data.messages contains fully styled content with CSS classes
```

#### Content Renderer (`pwa/src/lib/content-renderer/ContentRenderer.tsx`)

**Current:** Parses content parts client-side

**Enhanced:** Can use server-rendered `renderedContent` or apply server-provided `textStyles` and `customClasses`:
```typescript
<ContentRenderer 
  content={message.parts}
  textStyles={message.textStyles}
  customClasses={message.customClasses}
  styling={message.styling}
/>
```

---

## Migration Steps

### 1. Apply Schema Changes

```bash
cd server
npx prisma migrate dev --name add-conversation-rendering-support
```

This will create the new tables and add fields to existing models.

### 2. Seed Default Templates (Optional)

Create a seed script to populate `RenderingTemplate` and `MessageStylePreset` tables with default values:

```typescript
// server/prisma/seeds/rendering-templates.ts
await prisma.renderingTemplate.createMany({
  data: [
    {
      name: 'feed-card-default',
      templateType: 'feed_card',
      layout: 'default',
      styles: { /* CSS-in-JS */ },
      classes: ['conv-card', 'conv-card-default'],
      showMetadata: true,
      showTimestamp: true,
      showProvider: true,
      maxPreviewLength: 200,
    },
    // ... more templates
  ]
});
```

### 3. Update Frontend API Client

Create a rendering API client in the PWA:

```typescript
// pwa/src/lib/rendering-api.ts
export class RenderingAPI {
  async renderConversation(id: string, options?: RenderOptions): Promise<RenderedConversation> {
    const params = new URLSearchParams(options as any);
    const response = await fetch(`/api/v1/conversations/${id}/render?${params}`);
    const { data } = await response.json();
    return data;
  }

  async renderPreview(id: string): Promise<ConversationPreview> {
    const response = await fetch(`/api/v1/conversations/${id}/render/preview`);
    const { data } = await response.json();
    return data;
  }

  async batchRender(ids: string[], options?: RenderOptions): Promise<BatchRenderResponse> {
    const response = await fetch('/api/v1/conversations/render/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationIds: ids, options }),
    });
    return response.json();
  }
}

export const renderingAPI = new RenderingAPI();
```

### 4. Update Feed Components

Replace client-side preview extraction with server-rendered previews:

```typescript
// In FeedCard.tsx or FeedItemCard.tsx
useEffect(() => {
  const loadPreview = async () => {
    const preview = await renderingAPI.renderPreview(conversation.id);
    setPreview(preview.data);
  };
  loadPreview();
}, [conversation.id]);
```

---

## Performance Considerations

### Caching Strategy

1. **In-Memory Cache** (ConversationRenderingService)
   - TTL: 5 minutes (configurable)
   - Key: `${conversationId}:${viewMode}:${messageLimit}`
   - Cleared on conversation update

2. **Database Cache** (RenderingCache table)
   - Persistent across server restarts
   - Tracks cache hits for analytics
   - Stores performance metrics (render time, content size)
   - Automatic expiration via `expiresAt` field

3. **Client-Side Cache** (Recommended frontend addition)
   - Use React Query or SWR for HTTP caching
   - Stale-while-revalidate strategy
   - Background refetch on focus

### Optimization Tips

1. **Use `render/preview` for feeds** - Lighter weight, faster response
2. **Batch render for initial feed load** - Single request for multiple conversations
3. **Lazy load full renders** - Only render full conversation when expanded
4. **Enable syntax highlighting selectively** - Disable in preview mode
5. **Use appropriate message limits** - Don't fetch all messages for feed cards

---

## Content Type Support

The rendering system supports all content types defined in the frontend:

### Basic Content
- ✅ `text` - Plain text or markdown
- ✅ `code` - Code blocks with syntax highlighting
- ✅ `image` - Static images
- ✅ `link` - URLs and links

### Rich Media
- ✅ `audio` - Audio files
- ✅ `video` - Video files
- ✅ `gif` - Animated GIFs

### Data & Structured
- ✅ `table` - Data tables
- ✅ `json` - JSON data display
- ✅ `yaml` - YAML data display
- ✅ `xml` - XML data display

### Visual & Diagrams
- ✅ `mermaid` - Mermaid diagrams
- ✅ `latex` - LaTeX math
- ✅ `svg` - SVG graphics
- ✅ `chart` - Charts and graphs

### AI & Structured
- ✅ `tool_call` - AI tool/function calls
- ✅ `tool_result` - AI tool results
- ✅ `acu_statement` - ACU statement blocks
- ✅ `acu_question` - ACU question blocks
- ✅ `acu_answer` - ACU answer blocks
- ✅ `acu_code` - ACU code blocks
- ✅ `acu_formula` - ACU formula blocks
- ✅ `acu_table` - ACU table blocks
- ✅ `acu_image` - ACU image blocks
- ✅ `acu_tool` - ACU tool blocks

### Special
- ✅ `html` - Raw HTML
- ✅ `quote` - Blockquotes
- ✅ `divider` - Horizontal dividers
- ✅ `callout` - Callout/alert boxes
- ✅ `accordion` - Collapsible sections
- ✅ `tabs` - Tabbed content

---

## Text Styling Support

The `textStyles` field captures inline text formatting:

```typescript
interface TextStyle {
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link' | 'highlight';
  startOffset: number;  // Character offset in text
  endOffset: number;    // Character offset in text
  href?: string;        // For links
  customClass?: string; // Additional CSS class
}
```

**Example:**
```json
{
  "content": "This is bold and this is a link",
  "textStyles": [
    {
      "type": "bold",
      "startOffset": 8,
      "endOffset": 12
    },
    {
      "type": "link",
      "startOffset": 25,
      "endOffset": 29,
      "href": "https://example.com"
    }
  ]
}
```

---

## Next Steps

### Frontend Integration (Todo #6)

1. **Create rendering API client** in `pwa/src/lib/`
2. **Update FeedCard component** to use server-rendered previews
3. **Update Scroll page** to use rendering API for expanded views
4. **Update ContentRenderer** to consume server-provided styling
5. **Add React Query hooks** for caching and background refetch

### Future Enhancements

1. **Real-time rendering updates** via WebSocket
2. **Collaborative editing styles** - User-customizable themes
3. **A/B testing templates** - Test different rendering styles
4. **Analytics dashboard** - Track rendering performance and cache hit rates
5. **CDN integration** - Cache rendered conversations at edge

---

## Files Modified/Created

### Modified Files
- `server/prisma/schema.prisma` - Added rendering models and fields
- `server/src/routes/conversations.js` - Mounted rendering router

### New Files
- `server/src/services/conversation-rendering-service.ts` - Core rendering service
- `server/src/routes/conversations.render.ts` - Rendering API endpoints
- `CONVERSATION_RENDERING_SUMMARY.md` - This documentation

---

## API Reference Quick Links

- **Render Full Conversation:** `GET /api/v1/conversations/:id/render`
- **Render Preview:** `GET /api/v1/conversations/:id/render/preview`
- **Batch Render:** `POST /api/v1/conversations/render/batch`
- **Get Templates:** `GET /api/v1/conversations/render/templates`
- **Clear Cache:** `DELETE /api/v1/conversations/:id/render/cache`

---

## Support

For questions or issues:
1. Check this documentation
2. Review the TypeScript types in `conversation-rendering-service.ts`
3. Inspect the `RenderingCache` table for performance metrics
4. Enable debug logging in the rendering service

---

**Last Updated:** March 19, 2026  
**Version:** 1.0  
**Status:** Backend Complete, Frontend Integration Pending
