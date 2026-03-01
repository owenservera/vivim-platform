# VIVIM SDK Communication Protocol Formalization Research

## Executive Summary

This document outlines the research findings and recommendations for formalizing the communication protocol nomenclature in the VIVIM SDK based on patterns from:

1. **assistant-ui-VIVIM** (fork of assistant-ui/assistant-ui) - AI Chat UI primitives
2. **tool-ui-VIVIM** (fork of assistant-ui/tool-ui) - Tool call rendering components

---

## Part 1: Repository Analysis

### 1.1 assistant-ui-VIVIM

**Purpose**: TypeScript/React library for building production-grade AI chat experiences

**Key Features**:
- Composable primitives (message list, input, thread, toolbar)
- Built-in streaming, auto-scroll, retries, attachments
- Works with AI SDK, LangGraph, Mastra, or custom backends
- Broad provider support (OpenAI, Anthropic, Mistral, Perplexity, AWS Bedrock, Azure, Google Gemini, Hugging Face, Fireworks, Cohere, Replicate, Ollama)
- Extensible to custom APIs
- 2,728 commits (actively maintained fork)

**Architecture Patterns**:
- Radix-style composable components (not monolithic)
- ChatModelAdapter interface for backend integration
- Streaming protocol support via AsyncIterable
- Attachment handling system
- Markdown and code highlighting
- Voice input (dictation)
- Keyboard shortcuts and accessibility

**Communication Nomenclature**:
- `messages[]` - Array of conversation messages
- `content[]` - Message content blocks (text, tool calls, etc.)
- `role` - 'user' | 'assistant' | 'system'
- `stream()` - Streaming entry point
- ChatModelAdapter - Transport interface

### 1.2 tool-ui-VIVIM

**Purpose**: UI components for rendering tool calls in AI chat interfaces

**Key Features**:
- Interactive UI for tool payloads (not raw JSON)
- Component categories:
  - **Decision/Confirmation**: Approval Card, Order Summary, Message Draft, Option List
  - **Input/Configuration**: Parameter Slider, Preferences Panel, Question Flow
  - **Display/Artifacts**: Data Table, Chart, Citation, Link Preview, Stats Display, Code Block, Code Diff, Terminal
  - **Media/Creative**: Image, Image Gallery, Video, Audio, Instagram Post, LinkedIn Post, X Post
  - **Progress/Execution**: Plan, Progress Tracker, Weather Widget
- Zod schemas for payload validation
- Presets for realistic example data
- 1,234 commits

**Component Patterns**:
- Each component includes Zod schema for validation
- Payload-based rendering (not imperative)
- Interactive tool call execution UI
- Human approval workflows
- Inline form collection

---

## Part 2: Current VIVIM SDK State

### 2.1 Existing Protocol Layer (`communication.ts`)

The SDK already has a robust communication protocol layer with:

```typescript
// Message envelope with header
interface MessageEnvelope<T = unknown> {
  header: MessageHeader;
  payload: T;
  signature?: string;
}

interface MessageHeader {
  id: string;
  type: string;
  version: string;
  timestamp: number;
  priority: MessagePriority; // 'critical' | 'high' | 'normal' | 'low' | 'background'
  direction: MessageDirection; // 'inbound' | 'outbound' | 'internal'
  sourceNode: string;
  targetNode?: string;
  correlationId?: string;
  replyTo?: string;
  ttl?: number;
  flags: MessageFlags;
}
```

### 2.2 Existing Assistant UI Adapter

```typescript
// Current adapter in sdk/src/extension/assistant-ui-adapter.ts
class VivimSDKTransport {
  async *stream(params: any): AsyncIterable<any> {
    // Converts assistant-ui messages to SDK format
    // Handles streaming chunks
  }
}
```

### 2.3 Existing Protocol Capabilities

- Hook system (before_send, after_send, before_receive, etc.)
- Middleware stages (auth, validate, transform, rate_limit, process, respond)
- Metrics tracking (messagesSent, messagesReceived, latency, errors)
- Event system for communication events

---

## Part 3: Best Practices from Industry

### 3.1 SDK Protocol Design Patterns

**From OpenAI, Anthropic, Vercel AI SDK**:

1. **Message Format Standardization**
   - Role-based message types (system, user, assistant, tool)
   - Content blocks (text, image, tool_call, tool_result)
   - Streaming via AsyncIterable/Server-Sent Events

2. **Provider Abstraction**
   - Unified interface across multiple AI providers
   - Adapter pattern for different API protocols
   - Standardized error handling

3. **Version Compatibility**
   - Semantic versioning for protocols
   - Migration paths between versions
   - Deprecation notices

4. **Streaming Protocol**
   - Chunk-based streaming
   - Delta updates (not full messages)
   - Control tokens (start, end, error)

### 3.2 Distributed Storage Patterns

**CRDTs (Conflict-free Replicated Data Types)**:
- Yjs - Industry standard for collaborative text
- Automerge - JSON-like CRDT
- Used by Figma, Miro, Slack

**Real-time Sync Protocols**:
- Operational Transform (OT) - Google Docs approach
- Event sourcing - Store all events, replay for state
- Merkle trees for efficient sync

**Chat-Specific Patterns**:
- Message ordering via hybrid logical clocks (HLC)
- Offline-first with sync queue
- Conflict resolution strategies (last-write-wins, merge)

---

## Part 4: Formalization Recommendations

### 4.1 Protocol Nomenclature Integration

#### 4.1.1 Message Types

Formalize the following message types as VIVIM protocol standards:

```typescript
// VIVIM Chat Protocol Messages
export type VivimMessageType = 
  | 'vivim.user.message'      // User input
  | 'vivim.assistant.message'  // AI response
  | 'vivim.system.message'     // System prompt
  | 'vivim.tool.call'         // Tool invocation request
  | 'vivim.tool.result'        // Tool execution result
  | 'vivim.tool.approval'     // Human approval request
  | 'vivim.tool.approved'     // Human approval granted
  | 'vivim.tool.rejected'     // Human approval denied
  | 'vivim.context.update'    // Context window update
  | 'vivim.stream.chunk'       // Streaming chunk
  | 'vivim.stream.complete'    // Streaming complete
  | 'vivim.stream.error'      // Streaming error
  | 'vivim.attachment'         // File/media attachment
  | 'vivim.feedback'          // User feedback
  | 'vivim.quota'             // Rate limit/quota info
```

#### 4.1.2 Content Block Format

Adopt assistant-ui's content block pattern:

```typescript
export type ContentBlock = 
  | TextContentBlock
  | ImageContentBlock
  | ToolCallContentBlock
  | ToolResultContentBlock
  | ThinkingContentBlock
  | CodeContentBlock;

export interface TextContentBlock {
  type: 'text';
  text: string;
  annotations?: TextAnnotation[];
}

export interface ToolCallContentBlock {
  type: 'tool_call';
  id: string;
  name: string;
  input: Record<string, unknown>;
  approved?: boolean;  // Human approval status
}

export interface ToolResultContentBlock {
  type: 'tool_result';
  tool_call_id: string;
  result: unknown;
  is_error?: boolean;
}
```

#### 4.1.3 Tool Rendering Protocol

Formalize tool-ui patterns:

```typescript
// Tool UI Component Registry
export interface ToolUIComponent {
  type: string;  // 'approval-card' | 'data-table' | 'chart' | etc.
  schema: ZodSchema;
  render: (payload: unknown) => ReactNode;
}

// Tool approval workflow
export interface ToolApprovalRequest {
  tool_call_id: string;
  tool_name: string;
  input: Record<string, unknown>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  human_in_loop: boolean;
  user_did: string;
  timestamp: number;
}

export interface ToolApprovalResponse {
  approved: boolean;
  tool_call_id: string;
  modified_input?: Record<string, unknown>;
  reason?: string;
  timestamp: number;
}
```

### 4.2 Integration Components

#### 4.2.1 Enhanced Assistant-UI Adapter

```typescript
// sdk/src/extension/assistant-ui-adapter.ts - Enhanced
export interface VivimSDKTransportConfig {
  runtime: VivimAssistantRuntime;
  threadId: string;
  enableToolUI: boolean;  // Enable tool-ui components
  enableStreaming: boolean;
  humanApprovalEnabled: boolean;
}

export class VivimSDKTransport {
  constructor(private config: VivimSDKTransportConfig) {}

  async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    // Full implementation with:
    // - Tool call detection
    // - Streaming chunks
    // - Approval workflow integration
  }
}
```

#### 4.2.2 Tool UI Integration

```typescript
// sdk/src/extension/tool-ui-adapter.ts - NEW
import type { ToolUIComponent } from './types';

export class ToolUIAdapter {
  private componentRegistry: Map<string, ToolUIComponent> = new Map();
  
  registerComponent(component: ToolUIComponent): void {
    this.componentRegistry.set(component.type, component);
  }
  
  canRender(toolName: string): boolean {
    return this.componentRegistry.has(toolName);
  }
  
  render(toolName: string, payload: unknown): ReactNode {
    const component = this.componentRegistry.get(toolName);
    if (!component) {
      throw new Error(`No component registered for tool: ${toolName}`);
    }
    return component.render(payload);
  }
  
  validate(toolName: string, payload: unknown): ValidationResult {
    const component = this.componentRegistry.get(toolName);
    if (!component) {
      return { valid: false, errors: ['Tool not found'] };
    }
    return component.schema.safeParse(payload);
  }
}
```

### 4.3 Distributed Storage Protocol

#### 4.3.1 Message Persistence

```typescript
// sdk/src/core/storage/protocols/message-storage.ts
export interface MessageStorageProtocol {
  // CRUD operations
  storeMessage(conversationId: string, message: VivimMessage): Promise<string>; // returns CID
  getMessage(conversationId: string, messageId: string): Promise<VivimMessage | null>;
  updateMessage(conversationId: string, messageId: string, updates: Partial<VivimMessage>): Promise<void>;
  deleteMessage(conversationId: string, messageId: string): Promise<void>;
  
  // Batch operations
  storeMessages(conversationId: string, messages: VivimMessage[]): Promise<string[]>;
  getMessageRange(conversationId: string, start: number, end: number): Promise<VivimMessage[]>;
  
  // Sync
  sync(conversationId: string, peerId: string): Promise<SyncResult>;
  getChanges(conversationId: string, since: HLCTimestamp): Promise<MessageDelta[]>;
}
```

#### 4.3.2 Conversation Sync

```typescript
// sdk/src/core/storage/protocols/conversation-sync.ts
export interface ConversationSyncProtocol {
  // State
  getState(conversationId: string): ConversationState;
  
  // Changes
  applyChanges(conversationId: string, deltas: MessageDelta[]): Promise<ApplyResult>;
  generateChanges(conversationId: string, since: HLCTimestamp): Promise<MessageDelta[]>;
  
  // Conflict resolution
  resolveConflict(conversationId: string, conflict: Conflict): Resolution;
  
  // Merkle tree
  getMerkleRoot(conversationId: string): Promise<string>;
  verifyProof(conversationId: string, messageId: string, proof: MerkleProof): Promise<boolean>;
}
```

#### 4.3.3 Offline Queue

```typescript
// sdk/src/core/storage/protocols/offline-queue.ts
export interface OfflineQueueProtocol {
  // Queue operations
  enqueue(message: QueuedMessage): Promise<string>; // returns queue ID
  dequeue(): Promise<QueuedMessage | null>;
  peek(): Promise<QueuedMessage | null>;
  size(): number;
  
  // Persistence
  persist(): Promise<void>;
  restore(): Promise<void>;
  
  // Retry
  retryFailed(): Promise<RetryResult>;
  getFailed(): Promise<QueuedMessage[]>;
}
```

---

## Part 5: Implementation Roadmap

### Phase 1: Protocol Nomenclature (Week 1-2)

1. Create `sdk/src/protocols/chat/` module
2. Define all message types (Section 4.1.1)
3. Define content block types (Section 4.1.2)
4. Add TypeScript types and validation schemas

### Phase 2: UI Integration (Week 3-4)

1. Enhance assistant-ui adapter (Section 4.2.1)
2. Create tool-ui adapter (Section 4.2.2)
3. Build component registry system
4. Implement default tool components

### Phase 3: Storage Protocol (Week 5-6)

1. Implement message storage protocol (Section 4.3.1)
2. Implement conversation sync (Section 4.3.2)
3. Add offline queue support (Section 4.3.3)
4. Integrate with existing CRDT layer

### Phase 4: Testing & Documentation (Week 7-8)

1. Write comprehensive tests
2. Document protocol specifications
3. Create migration guide from existing code
4. Add examples and tutorials

---

## Part 6: Key Files to Create/Modify

### New Files

```
sdk/src/protocols/
├── chat/
│   ├── index.ts
│   ├── types.ts              # Message, ContentBlock types
│   ├── message-validator.ts   # Zod schemas for validation
│   └── serialization.ts      # JSON serialization
├── tool-ui/
│   ├── index.ts
│   ├── adapter.ts            # ToolUIAdapter class
│   ├── registry.ts           # Component registry
│   └── components/           # Default tool components
│       ├── approval-card.tsx
│       ├── data-table.tsx
│       ├── chart.tsx
│       └── ...
└── storage/
    ├── index.ts
    ├── message-storage.ts
    ├── conversation-sync.ts
    └── offline-queue.ts
```

### Files to Modify

```
sdk/src/extension/
├── assistant-ui-adapter.ts  # Enhance with new protocol
└── index.ts                  # Export new modules

sdk/src/core/
├── communication.ts          # Extend with chat-specific events
├── types.ts                  # Add new protocol types
└── index.ts                  # Export everything

sdk/src/index.ts              # Update exports

sdk/package.json              # Add dependencies (zod, etc.)
```

---

## Appendix A: Naming Conventions

### Message Type Naming
- Format: `vivim.<domain>.<action>`
- Examples: `vivim.chat.message`, `vivim.tool.call`, `vivim.sync.state`

### Content Block Naming
- Format: `<type>` (lowercase)
- Examples: `text`, `tool_call`, `tool_result`, `image`

### Protocol Versioning
- Format: `MAJOR.MINOR.PATCH`
- Initial version: `1.0.0`
- Document migration path for each breaking change

---

## Appendix B: Reference Implementations

### assistant-ui Patterns
- Stream handling: `AsyncIterable<{ content: ContentBlock[] }>`
- Message format: `{ role: 'user' | 'assistant', content: ContentBlock[] }`
- Tool calls: `{ type: 'tool_call', id: string, name: string, input: object }`

### tool-ui Patterns
- Zod-first validation
- Component registry pattern
- Payload-based rendering
- Approval workflow states

---

## Appendix C: Dependencies Required

```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "react": "^18.2.0",
    "@radix-ui/react-...": "latest"
  }
}
```

---

*Document Version: 1.0.0*
*Created: 2026-02-26*
*Authors: Research based on assistant-ui-VIVIM and tool-ui-VIVIM patterns*
