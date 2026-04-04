# VIVIM AI Chat Feature Documentation

## Overview

The VIVIM AI Chat feature is a multi-provider AI chat system that allows users to have conversations with AI assistants using various LLM providers. The system is designed with a **unified provider architecture** that abstracts differences between AI providers, allowing easy switching between providers while maintaining a consistent API.

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PWA / Mobile Clients                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │   AIChat.tsx    │  │  AISettings.tsx │  │     useAI Hooks         │  │
│  │  (UI Component) │  │  (Configuration)│  │  (React Query + Store)  │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬─────────────┘  │
├───────────┼───────────────────┼────────────────────────┼───────────────┤
│           │                   │                        │               │
│           └───────────────────┴────────────────────────┘               │
│                              │                                        │
│                       ┌──────┴──────┐                                 │
│                       │  ai-api.ts  │                                 │
│                       │  (API Layer)│                                 │
│                       └──────┬──────┘                                 │
└──────────────────────────────┼────────────────────────────────────────┘
                               │
                    HTTP REST / SSE
                               │
┌──────────────────────────────┼────────────────────────────────────────┐
│                              │                                        │
│                       ┌──────┴──────┐                                 │
│                       │  server/    │                                 │
│                       │  routes/    │                                 │
│                       │  ai.js      │                                 │
│                       │  (Express)  │                                 │
│                       └──────┬──────┘                                 │
└──────────────────────────────┼────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────┴────────┐ ┌────┴────────┐ ┌─────┴──────┐
    │ unified-provider │ │ai-storage-  │ │Validators  │
    │      .js         │ │service.js   │ │(ai.js)     │
    └────────┬─────────┘ └────┬────────┘ └────────────┘
             │                │
    ┌────────┴────────┐       │
    │ providers/     │       │
    │ ├── base.js    │       │
    │ └── zai.js     │       │
    └────────────────┘       │
             │                │
    ┌─────────┴────────┐     │
    │ Repository       │     │
    │ (Conversation)   │     │
    └──────────────────┘     │
```

## Data Flow

### 1. Message Flow (Non-Streaming)

```
User Input → AIChat.tsx → useAIChat.sendMessage() → ai-api.ts: getAICompletion()
    → POST /api/v1/ai/complete → aiRouter.js: POST /complete
    → unifiedProvider.complete() → ZAIProvider.complete()
    → AI API Response → Response Parsed → UI Update
```

### 2. Message Flow (Streaming)

```
User Input → AIChat.tsx → useAIChat.sendMessage(stream=true)
    → ai-api.ts: streamAICompletion() → POST /api/v1/ai/stream
    → aiRouter.js: POST /stream → SSE Response
    → unifiedProvider.stream() → ZAIProvider.stream()
    → onChunk() Callbacks → UI Real-time Updates
```

## Component Details

### PWA Components

#### AIChat.tsx (`pwa/src/components/AIChat.tsx`)

**Purpose**: Main chat UI component

**Key Features**:
- Real-time message display with streaming support
- Model/provider selection dropdown
- Conversation management (clear, regenerate)
- Message copy functionality
- Error handling with user feedback
- OmniComposer integration for input

**State Management**:
```typescript
interface AIChatState {
  messages: AIMessage[];      // Conversation history
  isLoading: boolean;         // Loading indicator
  error: string | null;       // Error state
  copiedIndex: number | null; // Copy feedback
  showModelSelector: boolean; // UI state
}
```

**Methods**:
- `handleSend()` - Sends user message to AI
- `handleRegenerate()` - Regenerates last AI response
- `handleCopy()` - Copies message to clipboard
- `clearMessages()` - Clears conversation history

#### AISettings.tsx (`pwa/src/components/AISettings.tsx`)

**Purpose**: Configuration UI for AI providers

**Features**:
- Provider selection with pricing display
- Model selection per provider
- API key input (BYOK - Bring Your Own Key)
- Parameter tuning (maxTokens, temperature)
- Streaming toggle
- Real-time pricing estimates

**Settings Managed**:
```typescript
interface AISettingsState {
  selectedProvider: AIProviderType;
  selectedModel: string;
  maxTokens: number;          // 256 - 16384
  temperature: number;       // 0.0 - 2.0
  enableStreaming: boolean;
  apiKeys: Record<string, string>;
}
```

### Hook Layer

#### useAI.ts (`pwa/src/hooks/useAI.ts`)

**TanStack Query Integration**:
```typescript
// Data fetching hooks
useAIProviders()    // GET /api/v1/ai/providers
useAIModels()       // GET /api/v1/ai/models
```

**Core Hooks**:

1. **useAICompletion()**
   - Non-streaming completions
   - AbortController support
   - Error handling
   - Returns: `{ isLoading, error, response, complete, abort }`

2. **useAIStream()**
   - Streaming completions
   - Chunk-by-chunk updates
   - Abort support
   - Returns: `{ isLoading, error, content, stream, abort, enableStreaming, reset }`

3. **useAIChat()**
   - Full chat interface
   - Conversation state management
   - Server-side conversation tracking
   - Provider/model override support
   - Returns: `{ messages, isLoading, error, conversationId, sendMessage, stop, clearMessages, setProvider }`

4. **useAISettings()**
   - Zustand store integration
   - Settings CRUD operations

### State Management

#### ai-store.ts (`pwa/src/lib/ai-store.ts`)

**Zustand Store with Persistence**:
```typescript
interface AIState {
  // Provider settings
  defaultProvider: AIProviderType;  // Default: 'zai'
 string;             // Default: 'glm-4.  defaultModel:7'
  preferredProviders: AIProviderType[];
  apiKeys: Record<string, string>;   // BYOK storage

  // Model settings
  maxTokens: number;                // Default: 4096
  temperature: number;              // Default: 0.7
  enableStreaming: boolean;         // Default: true

  // Actions
  setDefaultProvider(), setDefaultModel(),
  setPreferredProviders(), setApiKey(),
  setMaxTokens(), setTemperature(), setEnableStreaming(),
  reset()
}
```

**Persistence**: `vivim-ai-settings` (localStorage)

### API Layer

#### ai-api.ts (`pwa/src/lib/ai-api.ts`)

**Endpoints**:

| Function | Endpoint | Method | Purpose |
|----------|----------|--------|---------|
| `getAICompletion()` | `/ai/complete` | POST | Non-streaming completion |
| `streamAICompletion()` | `/ai/stream` | POST | Streaming completion (SSE) |
| `startAIConversation()` | `/ai/chat/start` | POST | Initialize conversation |
| `forkAIConversation()` | `/ai/chat/fork` | POST | Fork existing chat |
| `getAIProviders()` | `/ai/providers` | GET | List providers |
| `getAIModels()` | `/ai/models` | GET | List models per provider |

**Cost Estimation**:
```typescript
function estimateCompletionCost(
  provider: AIProviderType,
  promptTokens: number,
  completionTokens: number
): number
```

### Server Side

#### ai.js Routes (`server/src/routes/ai.js`)

**Endpoints**:

| Route | Method | Purpose |
|-------|--------|---------|
| `/chat/start` | POST | Initialize new conversation in DB |
| `/chat/fork` | POST | Fork conversation to new chat |
| `/complete` | POST | Get completion + persist |
| `/stream` | POST | Stream completion + persist |
| `/providers` | GET | List available providers |
| `/models` | GET | List available models |

**Validation**: Uses Zod schemas (`aiCompletionSchema`, `aiStreamSchema`)

#### unified-provider.js (`server/src/ai/unified-provider.js`)

**Singleton Pattern**: `export const unifiedProvider = new UnifiedAIProvider()`

**Key Methods**:

```javascript
initialize()                    // Initialize all providers
initializeProvider(type, config) // Single provider setup
getAvailableProviders()         // Return array of active providers
getProvider(type, keyOverride)   // Get provider instance
selectProvider(request)         // Auto-select best provider
complete(request)               // Unified completion interface
stream(request, onChunk)        // Unified streaming interface
```

**Provider Selection Logic**:
1. If `isFreeOnly` → return Z.AI
2. If `preferredProvider` available → use it
3. Default → Z.AI (FREE)

#### Providers

##### base.js (`server/src/ai/providers/base.js`)

**Abstract Base Class** for all providers:

```typescript
class BaseAIProvider {
  constructor(providerType, config)
  complete(messages, options)      // Abstract
  stream(messages, options, onChunk) // Abstract
  getHeaders()
  transformMessages(messages)      // Provider-specific formatting
  parseResponse(response)          // Normalize response
  handleAPIError(error, response) // Error classification
  healthCheck()
}
```

##### zai.js (`server/src/ai/providers/zai.js`)

**Z.AI (智谱AI) Provider** - Default FREE provider

**Configuration**:
```javascript
baseURL: 'https://api.z.ai/api/coding/paas/v4'
defaultModel: 'glm-4.7'
apiKey: '60428e43a9e14a8db7d7baf789248f19.LUBQi1RGm777hYbh' // Pre-configured
```

**Features**:
- OpenAI-compatible API format
- Streaming support (SSE)
- Thinking mode disabled (standard responses)
- Token usage tracking

#### Storage Service

##### ai-storage-service.js (`server/src/services/ai-storage-service.js`)

**Conversation Persistence**:

```typescript
class AiStorageService {
  startConversation(data)           // Create new conversation
  appendMessage(conversationId, msg) // Add message to existing
  forkConversation(sourceId, ...)    // Fork with context
}
```

**Message Format**:
```typescript
{
  id: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  parts: [{ type: 'text', text: string }],
  messageIndex: number,
  createdAt: ISO8601,
  status: 'completed' | 'pending',
  finishReason?: string,
  tokenCount?: number
}
```

## Supported Providers

### Provider Matrix

| Provider | Display Name | Models | Cost | Status |
|----------|--------------|--------|------|--------|
| `zai` | Z.AI (智谱AI) | glm-4.7 | FREE | ✅ Active |
| `openai` | OpenAI | gpt-5.2, gpt-5-mini | Paid | ⚠️ Config |
| `anthropic` | Anthropic (Claude) | claude-opus-4.6, claude-sonnet-4 | Paid | ⚠️ Config |
| `xai` | xAI (Grok) | grok-4.1, grok-3 | Paid | ⚠️ Config |
| `gemini` | Google Gemini | gemini-2.0-ultra, gemini-2.0-flash-lite | Paid | ⚠️ Config |
| `qwen` | Alibaba Qwen | qwen-3-max, qwen-3 | Paid | ⚠️ Config |
| `moonshot` | Moonshot (Kimi) | kimi-k2.5, kimi-k2 | Paid | ⚠️ Config |
| `minimax` | MiniMax | minimax-m2.1, minimax-m2 | Paid | ⚠️ Config |

### Pricing (per 1M tokens)

| Provider | Input ($) | Output ($) |
|----------|-----------|------------|
| zai | 0.00 | 0.00 |
| minimax | 0.39 | 1.56 |
| xai | 0.20 | 1.00 |
| gemini | 0.10 | 0.50 |
| qwen | 0.10 | 0.50 |
| moonshot | 0.50 | 2.50 |
| openai | 1.75 | 14.00 |
| anthropic | 15.00 | 75.00 |

### Provider Capabilities

| Provider | Coding | Reasoning | Long Context | Multimodal | Fast Response |
|----------|--------|-----------|--------------|------------|---------------|
| zai | ✅ | ✅ | 128K | ❌ | ✅ |
| openai | ✅ | ✅ | 200K-400K | ❌ | ✅ (mini) |
| anthropic | ✅ | ✅ | 1M | ❌ | ✅ (sonnet) |
| xai | ✅ | ✅ | 2M | ❌ | ✅ |
| gemini | ✅ | ❌ | 200K | ✅ | ✅ (flash) |
| qwen | ✅ | ✅ | Ultra-long | ❌ | ✅ |
| moonshot | ✅ | ❌ | ? | ✅ | ❌ |
| minimax | ✅ | ❌ | ? | ❌ | ❌ |

## Type Definitions

### AI Types (`pwa/src/types/ai.ts`)

```typescript
// Provider type union
type AIProviderType = 'openai' | 'xai' | 'anthropic' | 'gemini' | 'qwen' | 'moonshot' | 'minimax' | 'zai';

// Message structure
interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

// Request structure
interface AICompletionRequest {
  messages: AIMessage[];
  provider?: AIProviderType;
  model?: string;
  conversationId?: string;
  options?: AICompletionOptions;
}

interface AICompletionOptions {
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

// Response structure
interface AICompletionResponse {
  content: string;
  model: string;
  usage: AIUsage;
  finishReason: string;
  provider: AIProviderType;
  conversationId?: string;
}

interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Streaming chunk
interface AIStreamChunk {
  content: string;
  done: boolean;
}
```

## Error Handling

### Error Classes (`server/src/ai/errors.js`)

```typescript
class AIError extends Error {
  name = 'AIError';
  details: Record<string, unknown>;
}

class AuthenticationError extends AIError {
  name = 'AuthenticationError';  // 401/403
}

class RateLimitError extends AIError {
  name = 'RateLimitError';       // 429
}
```

### Error Flow

```
API Error → Provider.handleAPIError()
  → Check status code
    → 401/403 → AuthenticationError
    → 429 → RateLimitError
    → Other → AIError
  → Log with logger
  → Throw to router
```

## Mobile Context

### AIChatContext.tsx (`mobile/src/context/AIChatContext.tsx`)

React Context for mobile app:

```typescript
interface AIChatContextType {
  isAIChatActive: boolean;
  activateAIChat(): void;
  deactivateAIChat(): void;
  toggleAIChat(): void;
  messages: Message[];
  addMessage(message: Message): void;
  clearMessages(): void;
  setMessages(messages: Message[]): void;
  isTyping: boolean;
  setIsTyping(typing: boolean): void;
}
```

### Mobile Components

| Component | Purpose |
|----------|---------|
| `AIChatTrigger.tsx` | Floating action button to open AI chat |
| `AIChatOverlay.tsx` | Full-screen or modal overlay for chat |
| `AIChatInput.tsx` | Input field with send capability |

## Security & Privacy

### API Key Storage

| Layer | Storage | Notes |
|-------|---------|-------|
| PWA | localStorage | `vivim-ai-settings` namespace |
| BYOK | User-provided | Via headers `X-Provider-Key` |
| Server | Environment | `process.env[PROVIDER_API_KEY]` |
| Z.AI | Pre-configured | Hardcoded fallback key |

### BYOK (Bring Your Own Key) Flow

```
User enters key → AISettings.tsx
  → useAIStore.setApiKey(provider, key)
  → localStorage persist
  → On API call:
    → ai-api.ts checks store
    → Adds 'X-Provider-Key' header
    → Server uses override key
```

## Configuration

### Environment Variables (Server)

```bash
# Optional - for server-side provider access
OPENAI_API_KEY=
XAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
QWEN_API_KEY=
MOONSHOT_API_KEY=
MINIMAX_API_KEY=
ZAI_API_KEY=           # Optional, has fallback
```

### Environment Variables (PWA)

```bash
VITE_API_BASE_URL=     # Server URL (default: http://localhost:3000/api/v1)
VITE_API_KEY=          # App API key (default: dev key)
```

### LocalStorage Keys

```javascript
'vivim-ai-settings'     // AI store persistence
'OPENSCROLL_API_OVERRIDE'  // Server URL override
'OPENSCROLL_API_KEY'   // API key override
```

## Key Design Decisions

### 1. Unified Provider Pattern

**Problem**: Each AI provider has different APIs, formats, and quirks.

**Solution**: Abstract base class with provider-specific implementations.

```javascript
// Client code always calls:
unifiedProvider.complete(request)
unifiedProvider.stream(request, callback)

// Never calls provider-specific methods directly
```

### 2. Free Default Provider

**Problem**: Users need immediate value without setup.

**Solution**: Z.AI pre-configured as default.

```typescript
// From useAIStore default
defaultProvider: 'zai'
defaultModel: 'glm-4.7'
```

### 3. Conversation Persistence

**Problem**: Chat context needed for follow-up questions.

**Solution**: Server-side conversation storage.

```
1. POST /ai/chat/start → Get conversationId
2. Include conversationId in all requests
3. Server appends messages to conversation
4. UI maintains local state for responsiveness
```

### 4. Streaming Architecture

**Problem**: Large responses slow without real-time feedback.

**Solution**: Server-Sent Events (SSE).

```javascript
// Server response format
res.setHeader('Content-Type', 'text/event-stream');
res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
res.write('data: [DONE]\n\n');
```

## Limitations & Future Work

### Current Limitations

1. **Single Conversation Context**: No cross-conversation memory
2. **No Tool Calling**: Limited to text completions only
3. **No Function Calling**: Cannot invoke external APIs
4. **Mobile Offline**: Requires server connection
5. **Basic Pricing**: No token tracking per user

### Planned Enhancements

1. **Multi-provider Fallback**: Auto-fallback on failures
2. **Token Tracking**: Per-user usage quotas
3. **System Prompts**: Custom instruction support
4. **Conversation Export**: Download chat history
5. **Voice Input**: Speech-to-text integration

## File Inventory

### PWA Layer

| File | Purpose |
|------|---------|
| `pwa/src/components/AIChat.tsx` | Main chat UI |
| `pwa/src/components/AISettings.tsx` | Settings UI |
| `pwa/src/hooks/useAI.ts` | React hooks |
| `pwa/src/lib/ai-api.ts` | API client |
| `pwa/src/lib/ai-store.ts` | Zustand store |
| `pwa/src/types/ai.ts` | TypeScript types |

### Server Layer

| File | Purpose |
|------|---------|
| `server/src/routes/ai.js` | Express routes |
| `server/src/ai/unified-provider.js` | Provider orchestration |
| `server/src/ai/providers/base.js` | Abstract provider |
| `server/src/ai/providers/zai.js` | Z.AI implementation |
| `server/src/ai/errors.js` | Error classes |
| `server/src/services/ai-storage-service.js` | Persistence |
| `server/src/types/ai.js` | Server types |

### Mobile Layer

| File | Purpose |
|------|---------|
| `mobile/src/context/AIChatContext.tsx` | React Context |
| `mobile/src/components/organisms/AIChatOverlay.tsx` | Chat UI |
| `mobile/src/components/organisms/AIChatInput.tsx` | Input |
| `mobile/src/components/molecules/AIChatTrigger.tsx` | Trigger button |

---

# "Discuss with AI" Feature

## Overview

The **"Discuss with AI"** feature (also referred to as AI Chat Trigger) is a prominent entry point for AI interactions embedded directly in the app's navigation. This feature provides quick access to AI chat capabilities from anywhere in the application.

## Mobile Implementation (React Native)

### Trigger Button

**Location**: `mobile/src/components/molecules/AIChatTrigger.tsx`

The trigger is a floating circular button integrated into the bottom tab bar:

```typescript
interface AIChatTriggerProps {
  position?: 'bottom-right' | 'bottom-left' | 'floating';
  showLabel?: boolean;
  onPress?: () => void;
}
```

**Features**:
- Circular primary button with `MessageCircle` icon
- Positioned at bottom-right by default (customizable)
- Supports optional "NEW" badge indicator
- Press animation (scale 0.95 on press)
- Elevation shadow for depth
- Accessibility labeled with translation key `aiChat.triggerA11y`

**Visual Design**:
```css
/* From Tamagui Button props */
variant="primary"
size="$lg"
circular
bg="$primary"
hoverStyle={{ bg: '$primaryHover' }}
elevation="$4"
br="$full"
```

### AI Chat Overlay (Mobile)

**Location**: `mobile/src/components/organisms/AIChatOverlay.tsx`

When triggered, an overlay slides up from the bottom:

```typescript
interface AIChatOverlayProps {
  onClose?: () => void;
}
```

**Animation**:
```typescript
const animation = useAnimation({
  type: 'spring',
  damping: 20,
  stiffness: 300,
});
```

**Animation States**:
- `enterStyle`: Slides up from 300px down, fades in
- `exitStyle`: Slides down 300px, fades out

**Layout**:
- Covers 85% of screen height
- Full width
- Positioned absolute at bottom

**Components**:
1. **Header** - Title "AI Chat" with close button
2. **ScrollView** - Message bubbles with auto-scroll
3. **AIChatInput** - Text input with send button

### Message Bubble Component

**Location**: `mobile/src/components/molecules/MessageBubble.tsx`

```
┌─────────────────────────────────────────┐
│  USER MESSAGE                          │
│  ┌─────────────────────────────────┐   │
│  │  (Primary gradient background)  │   │
│  │  White text, right-aligned      │   │
│  │  Timestamp in bottom-right     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ASSISTANT MESSAGE                      │
│  ┌─────────────────────────────────┐   │
│  │  (Surface background)           │   │
│  │  Dark text, left-aligned       │   │
│  │  Timestamp in bottom-right     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Styling**:
- User bubbles: Green gradient (`$primary`), white text
- Assistant bubbles: Surface background, dark text
- Max width: 85% of container
- Border radius: 12px with asymmetric corners
- Memoized to prevent unnecessary re-renders

### AI Chat Input

**Location**: `mobile/src/components/organisms/AIChatInput.tsx`

```
┌─────────────────────────────────────────────┐
│  [📎]  [Type a message...]         [Send] │
└─────────────────────────────────────────────┘
```

**Features**:
- TextInput with multiline support (max 120px height)
- Attachment button (for future expansion)
- Send button with loading state
- KeyboardAvoidingView for iOS/Android
- AnimatePresence for button transitions
- "Thinking..." indicator with animated dots

**States**:
- `isTyping` - Shows loader and "Thinking..." text
- `isSending` - Disables input during send

### Integration in App Navigator

**Location**: `mobile/src/navigation/AppNavigator.tsx`

```typescript
// Tab bar with AI trigger
const CustomTabBar = () => {
  const { isAIChatActive, activateAIChat } = useAIChat();
  
  return (
    <YStack>
      {/* Standard tabs... */}
      
      {/* AI Chat Trigger Button */}
      <Button onPress={activateAIChat}>
        <Icons.Sparkles size={24} color="$accent" />
        <Text size="$xs" color="$accent">AI</Text>
      </Button>
    </YStack>
  );
}

// Overlay rendered conditionally
<AnimatePresence>
  {isAIChatActive && <AIChatOverlay />}
</AnimatePresence>
```

### State Management (Mobile)

**Location**: `mobile/src/context/AIChatContext.tsx`

```typescript
interface AIChatContextType {
  isAIChatActive: boolean;
  activateAIChat: () => void;
  deactivateAIChat: () => void;
  toggleAIChat: () => void;
  
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
}
```

**Initial State**:
```typescript
messages: [{
  id: 'welcome-1',
  role: 'assistant',
  content: "Hi! I'm your AI assistant. How can I help you today?",
  timestamp: Date.now(),
}]
```

## PWA Implementation

### AIChat Component

**Location**: `pwa/src/components/AIChat.tsx`

The PWA uses a dedicated AIChat component with full-featured UI:

```
┌─────────────────────────────────────────────────────┐
│  AI Assistant                              [✕]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  ┌─────────┐                                │   │
│  │  │ 🤖 AI  │  VIVIM AI Assistant           │   │
│  │  └─────────┘  I'm powered by glm-4.7...    │   │
│  │                                             │   │
│  │  ┌─ Suggestion Buttons ─────────────────┐  │   │
│  │  │ [Quantum Computing] [React Opt...]  │  │   │
│  │  └─────────────────────────────────────┘  │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  AI Model Pill: [⚡ glm-4.7 ▾] [🗑️]      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  [Type a message...                       ]│   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Model Selector Dropdown

```
┌────────────────────────┐
│  ⚡ Switch AI Model     │
├────────────────────────┤
│  ┌─ OpenAI ────────┐   │
│  │  gpt-5.2 ✓      │   │
│  │  gpt-5-mini      │   │
│  └──────────────────┘   │
│  ┌─ Anthropic ─────┐    │
│  │  claude-opus    │    │
│  └──────────────────┘   │
│  [⚙️ Manage Providers...]│
└────────────────────────┘
```

### OmniComposer (PWA Input)

**Location**: `pwa/src/components/OmniComposer.tsx`

The OmniComposer is a unified input component that supports:

| Trigger | Symbol | Purpose |
|---------|--------|---------|
| Command | `/` | Commands (`/models`, `/settings`) |
| Mention | `@` | References (`@AI`, `@Network`) |
| Context | `+` | Context providers |
| Action | `!` | Actions (`!save`, `!broadcast`) |
| Topic | `#` | Topic tags |

**Dynamic Send Button**:
- Default: Send icon (purple gradient)
- Loading: Stop icon (red)
- `!save` detected: Save icon (green)
- `@Network` detected: Globe icon (purple)
- `@AI` detected: Zap icon (blue)

**Suggestion Menu**:
- Auto-suggestions based on trigger character
- Debounced API calls (150ms)
- Arrow key navigation
- Tab/Enter to select

### AI Settings Page

**Location**: `pwa/src/components/AISettings.tsx`

Comprehensive settings for AI configuration:

```
┌─────────────────────────────────────────────────────┐
│  [<]  AI Settings                      [Unsaved]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ API Key Configuration ───────────────────────┐  │
│  │  🔑 Z.AI (Free) API Key                     │  │
│  │  [sk-••••••••••••••••••                    ]│  │
│  │  Z.AI is free and pre-configured. No key... │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Select Provider ────────────────────────────┐  │
│  │  ○ Z.AI (Free)  No cost                    │  │
│  │  ○ OpenAI      $1.75/1M tokens              │  │
│  │  ○ Anthropic   $15.00/1M tokens             │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Model ──────────────────────────────────────┐  │
│  │  [glm-4.7 ▾]  128K context                 │  │
│  │  Free to use - sponsored by Z.AI            │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Parameters ─────────────────────────────────┐  │
│  │  Max Tokens: [──────●──────]  4,096        │  │
│  │  Temperature: [────●──────]  0.7           │  │
│  │  [✓] Streaming Responses                   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Active Configuration ──────────────────────┐  │
│  │  Provider:  Z.AI (Free) ⚡                  │  │
│  │  Model:     glm-4.7                          │  │
│  │  Max Output: 4,096 tokens                   │  │
│  │  Creativity: Balanced                       │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Reset]  [✓ Save Changes]                         │
└─────────────────────────────────────────────────────┘
```

## User Experience Flow

### 1. Initial Activation (Mobile)

```
User taps "AI" tab button
    ↓
AppNavigator detects activateAIChat() call
    ↓
isAIChatActive state set to true
    ↓
AnimatePresence renders AIChatOverlay
    ↓
Overlay slides up (spring animation, 300ms)
    ↓
Default welcome message displayed
    ↓
User can now type and send messages
```

### 2. Sending a Message (Mobile)

```
User types message in AIChatInput
    ↓
Taps send button (or presses Enter)
    ↓
handleSend() called:
  - Creates user message object
  - Calls addMessage() to display
  - Sets isTyping = true
    ↓
Message sent to AI provider (mock/demo for now)
    ↓
AI response received
    ↓
AI message added to messages array
    ↓
Auto-scroll to bottom
    ↓
isTyping = false
```

### 3. PWA Chat Session

```
User opens AIChat component
    ↓
Empty state with suggestions shown:
  - "Explain quantum computing simply"
  - "Help me optimize a React component"
  - "Write a clean architecture overview"
    ↓
User selects suggestion or types custom message
    ↓
OmniComposer sends to useAIChat.sendMessage()
    ↓
useAIChat initiates conversation on server:
  - POST /ai/chat/start
  - Gets conversationId
    ↓
Streaming response begins:
  - POST /ai/stream
  - Chunks arrive via SSE
  - UI updates in real-time
    ↓
Message displayed with:
  - Copy button
  - Regenerate button (last message only)
    ↓
Conversation can be:
  - Continued with more messages
  - Cleared with trash icon
  - Provider switched via pill dropdown
```

## Visual Design System

### Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Primary | `#667eea` → `#764ba2` | Send button, user bubbles |
| Success | `#10b981` | Save actions, user gradients |
| Accent | Dynamic | AI trigger icon |
| Surface | `#f9fafb` | Chat background |
| Border | `#e5e7eb` | Input borders |

### Typography

- **Headings**: 1rem, 600 weight
- **Body**: 0.9375rem, 1.5 line-height
- **Caption**: 0.8125rem
- **Meta**: 0.75rem, uppercase, 0.03em letter-spacing

### Spacing

- **Padding**: 1rem (16px) standard
- **Gap**: 0.75rem (12px) between elements
- **Border Radius**: 12px (containers), 8px (buttons)

### Animations

| Animation | Duration | Type | Purpose |
|-----------|----------|------|---------|
| Overlay slide | 300ms | Spring | Modal enter/exit |
| Button press | 200ms | Ease | Click feedback |
| Fade in | 200ms | Ease | Element visibility |
| Spin | 1s linear | Infinite | Loading state |
| Pulse | 2s | Infinite | Stop button warning |

## Accessibility

### ARIA Labels

| Element | Label | Purpose |
|---------|-------|---------|
| AIChatTrigger | `aiChat.triggerA11y` | Screen reader for trigger |
| AIChatInput | `aiChat.inputA11y` | Input field |
| Input hint | `aiChat.inputHint` | Expected input type |
| Send button | `aiChat.send` | Send action |
| Typing indicator | `aiChat.typing` | Loading state |

### Keyboard Navigation

- Tab navigation between elements
- Enter to send message
- Escape to close overlay (mobile)
- Arrow keys for suggestion navigation

## Translation Keys

```json
{
  "aiChat": {
    "title": "AI Chat",
    "triggerA11y": "Open AI Chat",
    "close": "Close Chat",
    "placeholder": "Type a message...",
    "inputA11y": "Chat Message Input",
    "inputHint": "Type your message and press send",
    "send": "Send Message",
    "attach": "Attach File",
    "thinking": "AI is thinking",
    "new": "NEW"
  }
}
```

## Component Hierarchy

```
AppNavigator
├── AIChatProvider (Context Wrapper)
│   ├── CustomTabBar
│   │   └── AI Chat Trigger Button
│   │
│   └── TabNavigator
│       ├── HomeScreen
│       ├── CaptureScreen
│       ├── NetworkScreen
│       ├── CirclesScreen
│       └── SettingsScreen
│
└── AnimatePresence (Conditional)
    └── AIChatOverlay
        ├── Header (Title + Close)
        ├── ScrollView
        │   └── MessageBubble[]
        │       └── AnimatePresence
        └── AIChatInput
            └── KeyboardAvoidingView
```

## Current Limitations

### Mobile
1. **Demo Mode**: AI responses are mocked (1.5s delay)
2. **No Context**: Each session starts fresh
3. **No Streaming**: Messages appear instantly, not streamed
4. **Limited Formatting**: Plain text only

### PWA
1. **Full Implementation**: Streaming, persistence, context all work
2. **Settings Navigation**: `/settings` command works but needs UX polish

## Future Enhancements

1. **Voice Input**: Microphone integration
2. **Image Attachments**: Camera/gallery support
3. **Rich Text**: Markdown support in messages
4. **Code Highlighting**: Syntax highlighting for code blocks
5. **Conversation History**: Saved chat sessions
6. **Prompt Templates**: Pre-built prompt library
7. **Voice Output**: Text-to-speech for AI responses

---

**Documentation Generated**: February 11, 2026
**Last Updated**: VIVIM Architecture Documentation
**Version**: 1.1.0
