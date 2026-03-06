# VIVIM — assistant-ui Integration Guidelines
**Archived**: 2026-03-05 | **Basis**: `07-ASSISTANT-UI-GUIDELINES.md`

---

## Overview

This document outlines the standard implementation guidelines for integrating `@assistant-ui/react` and `@assistant-ui/react-ai-sdk` into the VIVIM PWA. This modernizes the AI chat frontend by replacing custom streaming/state logic with the library's declarative runtime system.

**Goal**: Replace manual `EventSource`/`fetch`-based streaming in `useAIChat.ts` with `@assistant-ui/react-ai-sdk`'s `useChatRuntime`, while wiring VIVIM's Context Engine and ACU system into the UI via tool call UIs.

---

## Architecture Overview

```
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

## 1. Runtime Setup

Replace custom streaming logic with `useChatRuntime`:

```tsx
// pwa/src/providers/VivimAIChatProvider.tsx
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

## 2. Thread Layout (Using Primitives)

Compose using `ThreadPrimitive` rather than the pre-built `Thread` component to preserve VIVIM's design system:

```tsx
// pwa/src/components/ai/VIVIMThread.tsx
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

---

## 3. Message Component

```tsx
// pwa/src/components/ai/VIVIMMessage.tsx
import { MessagePrimitive } from "@assistant-ui/react";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import { Avatar } from "@/components/ui/Avatar";

export function VIVIMMessage({ role }: { role: "user" | "assistant" }) {
  return (
    <MessagePrimitive.Root className={`flex w-full ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[85%] ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        <Avatar role={role} />
        <div className={`p-4 rounded-2xl glass-border ${
          role === 'user'
            ? 'bg-brand-primary text-white rounded-tr-sm'
            : 'bg-surface-glass rounded-tl-sm'
        }`}>
          <MessagePrimitive.Content components={{
            Text: ({ content }) => <ContentRenderer content={content} />,
            // Tool UIs injected here (see Section 4)
          }} />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}
```

---

## 4. Tool UIs — ACU & Context Engine Integration

Map tool calls (Context Engine's memory retrieval, ACU extraction) to visual UI states:

```tsx
// pwa/src/components/ai/tools/MemoryRetrievalUI.tsx
import { makeAssistantToolUI } from "@assistant-ui/react";
import { Brain, Search, CheckCircle } from "lucide-react";

export const MemoryRetrievalUI = makeAssistantToolUI({
  toolName: "retrieve_memories",
  render: ({ args, status, result }) => (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-border-subtle bg-surface-base/50">
      {status === "running" ? (
        <>
          <Search className="w-4 h-4 animate-pulse text-brand-secondary" />
          <span className="text-xs text-text-tertiary">
            Searching memories for "{args.query}"...
          </span>
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 text-success-500" />
          <span className="text-xs text-text-secondary">
            Retrieved {result?.count || 0} memories.
          </span>
        </>
      )}
    </div>
  )
});

export const ACUExtractionUI = makeAssistantToolUI({
  toolName: "extract_acu",
  render: ({ args, status, result }) => (
    <div className="p-2 rounded-lg border border-border-subtle">
      {status === "running" ? (
        <span className="text-xs">Creating ACU from this exchange...</span>
      ) : (
        <span className="text-xs">ACU created: {result?.id}</span>
      )}
    </div>
  )
});
```

Wire tool UIs into MessagePrimitive:

```tsx
<MessagePrimitive.Content components={{
  Text: ({ content }) => <ContentRenderer content={content} />,
  tools: {
    byByName: {
      retrieve_memories: MemoryRetrievalUI,
      extract_acu: ACUExtractionUI
    }
  }
}} />
```

---

## 5. State Management via Runtime API

Avoid duplicating chat state in Zustand — use `assistant-ui` hooks:

```tsx
// pwa/src/components/ai/ChatControls.tsx
import { useAui, useAuiState } from "@assistant-ui/react";

export function ChatControls() {
  const api = useAui();
  const isRunning = useAuiState(s => s.thread.isRunning);
  const messageCount = useAuiState(s => s.thread.messages.length);

  const handleStop = () => api.thread().cancelRun();

  return (
    <div className="flex gap-2">
      {isRunning && (
        <button
          onClick={handleStop}
          className="btn-destructive text-xs"
        >
          Stop Generating
        </button>
      )}
      <span className="text-xs text-text-tertiary">{messageCount} messages</span>
    </div>
  );
}
```

---

## 6. ContextCockpit Integration

Bind the visual ContextCockpit to the tool call `args` and `results` to show exactly what context was injected:

```tsx
// Inside VIVIMMessage for assistant messages:
<MessagePrimitive.Content components={{
  tools: {
    byByName: {
      assemble_context: {
        render: ({ args, result }) => (
          <ContextVisualizer
            allocation={result?.allocation}
            totalTokens={result?.totalTokens}
            metadata={result?.metadata}
          />
        )
      }
    }
  }
}} />
```

---

## 7. Migration Checklist

| Step | Task | Status |
|------|------|--------|
| 1 | Remove manual `EventSource`/`fetch` streaming in `useAIChat.ts` | ⚠️ TODO |
| 2 | Replace with `useChatRuntime` from `@assistant-ui/react-ai-sdk` | ⚠️ TODO |
| 3 | Deprecate Zustand slice for live chat messages — use `ThreadRuntime` | ⚠️ TODO |
| 4 | Bridge persistence: sync completed threads from `AssistantRuntime` → Dexie on `onFinish` | ⚠️ TODO |
| 5 | Refactor ContentRenderer tool output blocks to `makeAssistantToolUI` | ⚠️ TODO |
| 6 | Bind ContextCockpit to tool call `args`/`results` via hidden tool | ⚠️ TODO |
| 7 | Remove `AIChat.tsx` `mousedown` dropdown hack — use Radix DropdownMenu | ⚠️ TODO |

---

## Required Packages

```bash
bun add @assistant-ui/react @assistant-ui/react-ai-sdk
```

Ensure these are already installed:
- `ai` (Vercel AI SDK) — v6.0.82 ✅
- `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/xai` ✅
