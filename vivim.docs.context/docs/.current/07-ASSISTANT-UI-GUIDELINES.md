# VIVIM Assistant-UI Implementation Guidelines

This document outlines the standard implementation guidelines for integrating, modernizing, and leveraging the full feature set of `@assistant-ui/react` and `@assistant-ui/react-ai-sdk` within the VIVIM PWA. This blueprint ensures that our frontend modernization (Goal 1) harnesses the absolute latest capabilities of the library, specifically regarding streaming, tool UI rendering, and declarative state management.

---

## 1. Architecture Overview

`assistant-ui` operates on a layered architecture that distinctly separates UI rendering from state management and backend transportation. VIVIM will strictly adhere to this separation to maintain a clean, testable, and responsive frontend.

```text
┌─────────────────────────────────────────────────────────┐
│                  UI Components (Primitives)             │
│    ThreadPrimitive, MessagePrimitive, ComposerPrimitive │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   Context Hooks                         │
│           useAui, useAuiState, useAuiEvent              │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    Runtime Layer                        │
│  AssistantRuntime → ThreadRuntime → MessageRuntime      │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   Adapters/Backend                      │
│            useChatRuntime (Vercel AI SDK v6)            │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Runtime Selection & Transport

VIVIM leverages the **Vercel AI SDK** on the server side (via `/api/v1/ai/chat/stream`). Therefore, we must utilize the `useChatRuntime` provided by `@assistant-ui/react-ai-sdk` as our primary runtime adapter.

### 2.1 Implementing the Transport

Replace custom streaming logic (`useAIChat` custom hook) with the standardized `AssistantChatTransport`.

```tsx
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { useAuth } from "@/lib/auth-context";

export function VivimAIChatProvider({ children, conversationId }) {
  const { token } = useAuth();
  
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({ 
      api: `/api/v1/ai/chat/session/${conversationId}/message`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      // Pass any global context or metadata required by the VIVIM engine
      body: {
        includeMemories: true,
        maxContextItems: 5
      }
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
```

---

## 3. UI Component Construction (Primitives)

VIVIM's "Neo-Glassmorphic Knowledge Hub" design system must be mapped directly onto the `assistant-ui` primitives. **Do not** use the pre-built `Thread` component if it restricts custom design tokens; instead, compose the UI using primitives.

### 3.1 The Thread Layout
Construct the main chat area utilizing `ThreadPrimitive`.

```tsx
import { ThreadPrimitive } from "@assistant-ui/react";
import { VIVIMMessage } from "./VIVIMMessage";
import { VIVIMComposer } from "./VIVIMComposer";

export function VIVIMThread() {
  return (
    <ThreadPrimitive.Root className="flex flex-col h-full bg-surface-base">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        <ThreadPrimitive.Messages
          components={{
            UserMessage: () => <VIVIMMessage role="user" />,
            EditComposer: () => <VIVIMComposer isEdit />,
            AssistantMessage: () => <VIVIMMessage role="assistant" />,
          }}
        />
      </ThreadPrimitive.Viewport>
      
      <div className="p-4 border-t border-border-subtle bg-surface-elevated/80 backdrop-blur-xl">
        <VIVIMComposer />
      </div>
    </ThreadPrimitive.Root>
  );
}
```

### 3.2 The Message Component
Implement the `MessagePrimitive` to handle the display of both user inputs and AI responses, integrating VIVIM's highly-polished `ContentRenderer`.

```tsx
import { MessagePrimitive } from "@assistant-ui/react";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import { Avatar } from "@/components/ui/Avatar";

export function VIVIMMessage({ role }: { role: "user" | "assistant" }) {
  return (
    <MessagePrimitive.Root className={`flex w-full ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[85%] ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        
        <Avatar role={role} />
        
        <div className={`p-4 rounded-2xl glass-border ${
          role === 'user' ? 'bg-brand-primary text-white rounded-tr-sm' : 'bg-surface-glass rounded-tl-sm'
        }`}>
          {/* Render text, markdown, and ACUs seamlessly */}
          <MessagePrimitive.Content components={{
            Text: ({ content }) => <ContentRenderer content={content} />,
            // Attach tool UIs here (see Section 4)
          }} />
        </div>
        
      </div>
    </MessagePrimitive.Root>
  );
}
```

---

## 4. Tool & ACU (Atomic Chat Unit) Integration

VIVIM makes heavy use of functional calls (e.g., retrieving context, generating ACUs). `assistant-ui` handles tool-call rendering cleanly.

### 4.1 Rendering Tool States
Map `tool_call` and `tool_result` states into the chat stream visually, so the user knows when the Context Engine is fetching memories or analyzing the query.

```tsx
import { makeAssistantToolUI } from "@assistant-ui/react";
import { Brain, Search, CheckCircle } from "lucide-react";

// Tool: Memory Retrieval
export const MemoryRetrievalUI = makeAssistantToolUI({
  toolName: "retrieve_memories",
  render: ({ args, status, result }) => {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg border border-border-subtle bg-surface-base/50">
        {status === "running" ? (
          <><Search className="w-4 h-4 animate-pulse text-brand-secondary" /> <span className="text-xs text-text-tertiary">Searching memories for "{args.query}"...</span></>
        ) : (
          <><CheckCircle className="w-4 h-4 text-success-500" /> <span className="text-xs text-text-secondary">Retrieved {result?.count || 0} memories.</span></>
        )}
      </div>
    );
  }
});
```

Inject this into your `MessagePrimitive.Content`:

```tsx
<MessagePrimitive.Content components={{
  tools: {
    byByName: {
      retrieve_memories: MemoryRetrievalUI,
      extract_acu: ACUExtractionUI
    }
  }
}} />
```

---

## 5. Context & State Management

Instead of syncing chat state manually into Zustand, use `assistant-ui`'s state hooks to read the real-time thread data.

### 5.1 Accessing the Runtime API

```tsx
import { useAui, useAuiState } from "@assistant-ui/react";

export function ChatControls() {
  const api = useAui();
  const isRunning = useAuiState(s => s.thread.isRunning);
  const messageCount = useAuiState(s => s.thread.messages.length);

  const handleStop = () => api.thread().cancelRun();
  const handleClear = () => { /* Implement custom clear logic via API */ };

  return (
    <div className="flex gap-2">
      {isRunning && (
        <button onClick={handleStop} className="btn-destructive text-xs">Stop Generating</button>
      )}
      <span className="text-xs text-text-tertiary">{messageCount} messages</span>
    </div>
  );
}
```

---

## 6. Migration Checklist (Legacy to Modern)

To transition VIVIM to this standard:

1. **Remove Manual Streaming Parsing:** Remove custom fetch/EventSource logic tracking streaming chunks in `useAIChat.ts`. Replace entirely with `@assistant-ui/react-ai-sdk`'s `useChatRuntime`.
2. **Deprecate Local Chat Store:** If a Zustand slice exists purely for temporary chat message tracking, remove it. Allow `assistant-ui`'s `ThreadRuntime` to own the live array of messages.
3. **Bridge Persistence:** Sync completed threads from the `AssistantRuntime` down to the `Dexie` (IndexedDB) database upon completion (listen for the `onFinish` or utilize `useAuiState` effect triggers) to ensure offline availability.
4. **Implement ACU Visualizers as Tools:** Refactor the existing `ContentRenderer` tool output blocks to utilize `makeAssistantToolUI`. This provides better state transitions (`running`, `requires_action`, `done`).
5. **Context Cockpit Integration:** Bind the visual "Context Cockpit" to the `args` and `results` of hidden tool calls to show exactly what data the Context Engine injected.