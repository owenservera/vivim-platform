# VIVIM AI Chat - Priority Enhancements
**Focus: Stability, Foundation, UX, Dedicated AI Page**

---

## Selected Priority Stack

| # | Enhancement | Goal |
|---|-------------|------|
| 1 | **Streaming Stability** | Fix connection drops, auto-reconnect |
| 2 | **Data Structures** | Unified types for AI domain |
| 3 | **OmniComposer Visuals** | Visual trigger indicators, inline help |
| 4 | **Connection Indicator** | Show reconnection state, quality |
| 5 | **AI Conversations Page** | Dedicated page (NOT main feed panel) |

---

# 1. Streaming Stability Fixes

## Problem

Current streaming has issues:
- No auto-retry on connection drops
- No heartbeat to detect dead connections
- Poor error messages
- No progress indication
- User doesn't know what's happening

## Solution Architecture

```typescript
// pwa/src/lib/stream-manager.ts

interface StreamConfig {
  maxRetries: number;           // 3
  initialDelay: number;         // 1000ms
  maxDelay: number;            // 30000ms
  backoffMultiplier: number;    // 2
  heartbeatInterval: number;   // 30000ms
  reconnectWindow: number;     // 60000ms (user can reconnect within this time)
}

interface StreamState {
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'failed';
  attempt: number;
  nextRetryAt: number | null;
  lastHeartbeat: number;
  progress: number; // 0-100 estimated
  error: string | null;
}

class StreamManager {
  private state: StreamState;
  private controller: AbortController | null = null;
  private retryTimer: Timer | null = null;
  private heartbeatTimer: Timer | null = null;

  async startStream(request: AICompletionRequest): Promise<void> {
    this.state = {
      status: 'connecting',
      attempt: 0,
      nextRetryAt: null,
      lastHeartbeat: Date.now(),
      progress: 0,
      error: null,
    };

    await this.executeWithRetry(request);
  }

  private async executeWithRetry(request: AICompletionRequest): Promise<void> {
    while (this.state.attempt <= this.config.maxRetries) {
      try {
        this.state.status = 'connecting';
        this.state.attempt++;

        await this.establishConnection(request);
        
        // Success - start heartbeat monitor
        this.startHeartbeat();
        this.state.status = 'connected';
        return;

      } catch (error) {
        if (this.isRecoverable(error)) {
          const delay = this.calculateDelay();
          this.state.status = 'reconnecting';
          this.state.nextRetryAt = Date.now() + delay;
          this.state.attempt++;
          
          await this.delay(delay);
        } else {
          this.state.status = 'failed';
          this.state.error = this.formatError(error);
          return;
        }
      }
    }

    this.state.status = 'failed';
    this.state.error = 'Max retries exceeded. Please try again.';
  }

  private async establishConnection(request: AICompletionRequest): Promise<void> {
    this.controller = new AbortController();
    
    await streamAICompletion(request, (chunk) => {
      this.handleChunk(chunk);
      this.state.lastHeartbeat = Date.now();
    }, this.controller.signal);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (Date.now() - this.state.lastHeartbeat > this.config.heartbeatInterval) {
        this.handleConnectionDeath();
      }
    }, this.config.heartbeatInterval);
  }

  private handleConnectionDeath(): void {
    // Connection died - trigger reconnection
    this.state.status = 'disconnected';
    this.state.nextRetryAt = Date.now() + this.config.reconnectWindow;
    
    // Notify UI
    this.notifyListeners('connection_death', {
      canReconnect: Date.now() < this.state.nextRetryAt,
      reconnectDeadline: this.state.nextRetryAt,
    });
  }

  // User can manually reconnect
  manualReconnect(): void {
    if (this.state.nextRetryAt && Date.now() > this.state.nextRetryAt) {
      throw new Error('Reconnection window expired');
    }
    this.executeWithRetry(this.currentRequest);
  }
}
```

## UI Integration

```typescript
// pwa/src/components/AIChat.tsx

interface ConnectionIndicatorProps {
  streamState: StreamState;
  onReconnect?: () => void;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  streamState,
  onReconnect,
}) => {
  if (streamState.status === 'connected') {
    return null; // Don't show when healthy
  }

  return (
    <div className={`connection-indicator ${streamState.status}`}>
      {streamState.status === 'connecting' && (
        <>
          <Loader2 className="animate-spin" />
          <span>Connecting to AI...</span>
          {streamState.attempt > 1 && (
            <span className="attempt-badge">Attempt {streamState.attempt}</span>
          )}
        </>
      )}

      {streamState.status === 'reconnecting' && (
        <>
          <WifiOff size={16} />
          <span>Reconnecting...</span>
          {streamState.nextRetryAt && (
            <span className="retry-countdown">
              Retrying in {Math.ceil((streamState.nextRetryAt - Date.now()) / 1000)}s
            </span>
          )}
        </>
      )}

      {streamState.status === 'disconnected' && (
        <>
          <WifiOff size={16} className="pulse" />
          <span>Connection lost</span>
          {streamState.nextRetryAt && Date.now() < streamState.nextRetryAt && (
            <button className="reconnect-btn" onClick={onReconnect}>
              Reconnect
            </button>
          )}
          {streamState.nextRetryAt && Date.now() > streamState.nextRetryAt && (
            <span className="expired">Reconnection window expired</span>
          )}
        </>
      )}

      {streamState.status === 'failed' && (
        <>
          <AlertCircle size={16} />
          <span>{streamState.error}</span>
          <button className="retry-btn" onClick={onReconnect}>
            Try Again
          </button>
        </>
      )}
    </div>
  );
};
```

## CSS Styles

```css
/* Connection Indicator */
.connection-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.connection-indicator.connecting {
  background: #eff6ff;
  color: #3b82f6;
}

.connection-indicator.reconnecting {
  background: #fef3c7;
  color: #d97706;
}

.connection-indicator.disconnected {
  background: #fef2f2;
  color: #dc2626;
}

.connection-indicator.failed {
  background: #fef2f2;
  color: #dc2626;
}

.connection-indicator .animate-spin {
  animation: spin 1s linear infinite;
}

.connection-indicator .pulse {
  animation: pulse 2s ease-in-out infinite;
}

.reconnect-btn, .retry-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.reconnect-btn {
  background: #3b82f6;
  color: white;
}

.retry-btn {
  background: #dc2626;
  color: white;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

# 2. Unified Data Structures

## New Types File

```typescript
// pwa/src/types/ai-chat.ts (shared with server)

export type AIProviderType = 
  | 'openai' 
  | 'xai' 
  | 'anthropic' 
  | 'gemini' 
  | 'qwen' 
  | 'moonshot' 
  | 'minimax' 
  | 'zai';

export type AIMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type ConversationStatus = 
  | 'active' 
  | 'archived' 
  | 'pinned' 
  | 'trashed';

export type MessageStatus = 
  | 'pending' 
  | 'streaming' 
  | 'completed' 
  | 'failed';

// =====================
// Conversation Types
// =====================

export interface AIMessage {
  id: string;
  conversationId: string;
  role: AIMessageRole;
  content: string | ContentPart[];
  status: MessageStatus;
  createdAt: number;
  metadata?: MessageMetadata;
}

export interface ContentPart {
  type: 'text' | 'code' | 'image' | 'audio' | 'tool_call' | 'tool_result';
  content: string;
  language?: string; // For code
  mimeType?: string; // For images/audio
  toolName?: string; // For tool calls
  isStreaming?: boolean;
}

export interface MessageMetadata {
  tokenCount?: {
    prompt?: number;
    completion?: number;
    total: number;
  };
  finishReason?: string;
  provider?: AIProviderType;
  model?: string;
  latency?: number; // ms
}

export interface AIConversation {
  id: string;
  title: string;
  status: ConversationStatus;
  provider: AIProviderType;
  model: string;
  createdAt: number;
  updatedAt: number;
  lastMessageAt: number;
  messageCount: number;
  ownerId?: string;
  metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
  topics?: string[];
  tags?: string[];
  pinnedMessageId?: string;
  color?: string; // For visual distinction
  isRemuxedFrom?: string[]; // Source conversation IDs
  linkedACUs?: string[]; // Related ACU IDs
}

// =====================
// Stream Types
// =====================

export interface StreamChunk {
  content: string;
  done: boolean;
  chunkIndex: number;
  timestamp: number;
}

export interface StreamConfig {
  enableStreaming: boolean;
  chunkDelay: number; // ms between chunks for smoothing
  maxRetries: number;
  heartbeatInterval: number;
}

export interface StreamState {
  isActive: boolean;
  isReconnecting: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  lastChunkAt: number | null;
  progress: number; // 0-100 estimated
}

// =====================
// Connection Types
// =====================

export interface ConnectionState {
  status: 'connected' | 'connecting' | 'disconnected' | 'failed';
  attempt: number;
  nextRetryAt: number | null;
  error: string | null;
  quality: ConnectionQuality;
}

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface ReconnectOptions {
  maxAttempts: number;
  windowMs: number; // Time window for reconnection
  backoffMs: number;
}

// =====================
// Context Types
// =====================

export interface AIContext {
  conversationId: string;
  topics: string[];
  complexity: 'low' | 'medium' | 'high';
  suggestedProvider?: AIProviderType;
  suggestedModel?: string;
  confidence?: number; // 0-1
}

// =====================
// Export Types
// =====================

export interface AIConversationExport {
  version: '1.0';
  exportedAt: string;
  format: 'json' | 'markdown' | 'text';
  conversation: AIConversation;
  messages: AIMessage[];
  context?: {
    topics?: string[];
    linkedACUs?: string[];
  };
}

// =====================
// Provider Types
// =====================

export interface AIProviderInfo {
  id: AIProviderType;
  displayName: string;
  isFree: boolean;
  models: AIModelInfo[];
  defaultModel: string;
  pricing: {
    inputPer1M: number;
    outputPer1M: number;
  };
}

export interface AIModelInfo {
  id: string;
  contextWindow: number;
  capabilities: string[];
  pricing: {
    inputPer1M: number;
    outputPer1M: number;
  };
  recommendedFor?: string[];
}

// =====================
// API Response Types
// =====================

export interface AIChatResponse {
  success: boolean;
  data?: {
    conversationId: string;
    message: AIMessage;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AIStreamResponse {
  chunks: StreamChunk[];
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// =====================
// Utility Types
// =====================

export type WithId<T> = T & { id: string };
export type WithTimestamp<T> = T & { createdAt: number; updatedAt: number };

export function createMessage(
  conversationId: string,
  role: AIMessageRole,
  content: string | ContentPart[]
): AIMessage {
  return {
    id: crypto.randomUUID(),
    conversationId,
    role,
    content,
    status: 'pending',
    createdAt: Date.now(),
  };
}

export function isValidProvider(provider: string): provider is AIProviderType {
  return [
    'openai', 'xai', 'anthropic', 'gemini', 
    'qwen', 'moonshot', 'minimax', 'zai'
  ].includes(provider);
}
```

## Migration Strategy

```typescript
// pwa/src/lib/ai-data-migration.ts

class DataMigration {
  async migrateFromLegacy(): Promise<void> {
    // Read legacy data from localStorage
    const legacyData = localStorage.getItem('vivim-ai-settings');
    
    if (legacyData) {
      const legacy = JSON.parse(legacyData);
      
      // Migrate to new format
      const migrated = {
        version: '2.0',
        migratedAt: Date.now(),
        settings: {
          defaultProvider: legacy.defaultProvider || 'zai',
          defaultModel: legacy.defaultModel || 'glm-4.7',
          enableStreaming: legacy.enableStreaming ?? true,
          maxTokens: legacy.maxTokens ?? 4096,
          temperature: legacy.temperature ?? 0.7,
        },
        apiKeys: legacy.apiKeys || {},
      };
      
      // Save new format
      localStorage.setItem('vivim-ai-settings', JSON.stringify(migrated));
    }
  }
}
```

---

# 3. OmniComposer Visual Enhancements

## Visual Trigger System

```typescript
// pwa/src/components/OmniComposer.tsx

interface TriggerInfo {
  char: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const TRIGGER_INFO: Record<string, TriggerInfo> = {
  '/': {
    char: '/',
    label: 'Command',
    description: 'AI commands and shortcuts',
    icon: <Command size={14} />,
    color: '#3b82f6',
  },
  '@': {
    char: '@',
    label: 'Mention',
    description: 'Reference people, conversations, or AI',
    icon: <AtSign size={14} />,
    color: '#8b5cf6',
  },
  '!': {
    char: '!',
    label: 'Action',
    description: 'Perform actions like remux, remix, save',
    icon: <Zap size={14} />,
    color: '#f59e0b',
  },
  '+': {
    char: '+',
    label: 'Context',
    description: 'Add context from page or ACUs',
    icon: <Plus size={14} />,
    color: '#10b981',
  },
  '#': {
    char: '#',
    label: 'Topic',
    description: 'Tag with topics for organization',
    icon: <Tag size={14} />,
    color: '#ec4899',
  },
};

interface OmniComposerProps {
  onSend: (message: string, action?: string) => Promise<void>;
  isLoading: boolean;
  onStop: () => void;
}

export const OmniComposer: React.FC<OmniComposerProps> = ({
  onSend,
  isLoading,
  onStop,
}) => {
  const [input, setInput] = useState('');
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

  // Detect triggers and show visual feedback
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart;
    const beforeCursor = value.slice(0, cursor);
    
    // Check for triggers
    const lastSlash = beforeCursor.lastIndexOf('/');
    const lastAt = beforeCursor.lastIndexOf('@');
    const lastBang = beforeCursor.lastIndexOf('!');
    const lastPlus = beforeCursor.lastIndexOf('+');
    const lastHash = beforeCursor.lastIndexOf('#');
    
    const triggers = [
      { char: '/', pos: lastSlash },
      { char: '@', pos: lastAt },
      { char: '!', pos: lastBang },
      { char: '+', pos: lastPlus },
      { char: '#', pos: lastHash },
    ].filter(t => t.pos !== -1 && !value.slice(t.pos, cursor).includes(' '));
    
    if (triggers.length > 0) {
      const active = triggers.reduce((a, b) => a.pos > b.pos ? a : b);
      setActiveTrigger(active.char);
    } else {
      setActiveTrigger(null);
    }
    
    setInput(value);
  };

  return (
    <div className="omni-composer">
      {/* Active Trigger Indicator */}
      {activeTrigger && (
        <TriggerIndicator 
          trigger={activeTrigger} 
          info={TRIGGER_INFO[activeTrigger]}
        />
      )}
      
      {/* Suggestions Menu */}
      {activeTrigger && suggestions.length > 0 && (
        <SuggestionMenu
          trigger={activeTrigger}
          items={suggestions}
          onSelect={handleSuggestionSelect}
        />
      )}
      
      {/* Input Area */}
      <div className="omni-input-row">
        {/* Trigger Cheatsheet */}
        <TriggerCheatsheet />
        
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Type / for commands, @ to mention..."
          className={activeTrigger ? 'has-active-trigger' : ''}
        />
        
        {/* Send Button */}
        <SendButton isLoading={isLoading} onStop={onStop} />
      </div>
    </div>
  );
};

// Visual Trigger Indicator Component
const TriggerIndicator: React.FC<{ trigger: string; info: TriggerInfo }> = ({
  trigger,
  info,
}) => (
  <div 
    className="trigger-indicator"
    style={{ borderColor: info.color }}
  >
    <span className="trigger-char">{trigger}</span>
    <span className="trigger-label">{info.label}</span>
    <span className="trigger-desc">{info.description}</span>
    {info.icon}
  </div>
);

// Trigger Cheatsheet
const TriggerCheatsheet: React.FC = () => (
  <div className="trigger-cheatsheet">
    {Object.entries(TRIGGER_INFO).map(([char, info]) => (
      <span 
        key={char} 
        className="cheatsheet-item"
        style={{ color: info.color }}
        title={info.description}
      >
        {char}
      </span>
    ))}
  </div>
);
```

## CSS Styles

```css
/* OmniComposer Enhancements */

.omni-composer {
  background: var(--bg-secondary, #f9fafb);
  border-top: 1px solid var(--border-color, #e5e7eb);
  padding: 12px 16px;
  position: relative;
}

/* Trigger Indicator */
.trigger-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 2px solid;
  border-radius: 8px;
  margin-bottom: 8px;
  animation: slideDown 0.2s ease;
}

.trigger-indicator .trigger-char {
  font-family: monospace;
  font-weight: 700;
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.trigger-indicator .trigger-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
}

.trigger-indicator .trigger-desc {
  font-size: 12px;
  color: var(--text-secondary);
  flex: 1;
}

.trigger-indicator svg {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

/* Trigger Cheatsheet */
.trigger-cheatsheet {
  display: flex;
  gap: 6px;
  padding: 8px 0;
}

.cheatsheet-item {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: var(--bg-tertiary, #f3f4f6);
  font-family: monospace;
  font-weight: 600;
  font-size: 12px;
  cursor: help;
  transition: all 0.2s;
}

.cheatsheet-item:hover {
  transform: scale(1.1);
  background: var(--bg-secondary, #e5e7eb);
}

/* Input with Active Trigger */
.omni-input-row textarea.has-active-trigger {
  border-color: var(--primary-400, #818cf8);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Animated Suggestions */
.suggestion-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
  overflow: hidden;
  animation: slideDown 0.2s ease;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background: var(--primary-50, #eff6ff);
}

.suggestion-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary, #f3f4f6);
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary);
}

.suggestion-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/ai` | Switch to AI context | `/ai` |
| `/model` | Show model selector | `/model` |
| `/clear` | Clear conversation | `/clear` |
| `/export` | Export conversation | `/export markdown` |
| `/remux` | Open remux dialog | `/remux` |
| `/settings` | Open AI settings | `/settings` |
| `/help` | Show help | `/help` |

---

# 4. Connection Indicator Component

## Standalone Component

```typescript
// pwa/src/components/ConnectionIndicator.tsx

import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  ChevronDown
} from 'lucide-react';

export type ConnectionStatus = 
  | 'connected' 
  | 'connecting' 
  | 'reconnecting' 
  | 'disconnected' 
  | 'failed';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  quality?: ConnectionQuality;
  attempt?: number;
  maxAttempts?: number;
  retryCountdown?: number; // seconds remaining
  error?: string;
  onReconnect?: () => void;
  showQuality?: boolean;
  compact?: boolean;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  status,
  quality,
  attempt = 1,
  maxAttempts = 3,
  retryCountdown,
  error,
  onReconnect,
  showQuality = true,
  compact = false,
}) => {
  if (status === 'connected') {
    if (compact) {
      return (
        <div className="connection-indicator compact connected">
          <Wifi size={14} className="quality-good" />
        </div>
      );
    }
    return null; // Don't show when healthy
  }

  const config = {
    connecting: {
      icon: <Loader2 size={18} className="animate-spin" />,
      bgColor: '#eff6ff',
      textColor: '#3b82f6',
      label: 'Connecting',
    },
    reconnecting: {
      icon: <Loader2 size={18} className="animate-spin" />,
      bgColor: '#fef3c7',
      textColor: '#d97706',
      label: 'Reconnecting',
    },
    disconnected: {
      icon: <WifiOff size={18} />,
      bgColor: '#fef2f2',
      textColor: '#dc2626',
      label: 'Connection lost',
    },
    failed: {
      icon: <AlertCircle size={18} />,
      bgColor: '#fef2f2',
      textColor: '#dc2626',
      label: 'Connection failed',
    },
  };

  const { icon, bgColor, textColor, label } = config[status];

  return (
    <div 
      className="connection-indicator"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="indicator-icon">{icon}</div>
      
      <div className="indicator-content">
        <span className="indicator-label">{label}</span>
        
        {!compact && (
          <>
            {status === 'connecting' && attempt > 1 && (
              <span className="indicator-attempt">
                Attempt {attempt} of {maxAttempts}
              </span>
            )}
            
            {status === 'reconnecting' && retryCountdown !== undefined && (
              <span className="indicator-countdown">
                Retrying in {retryCountdown}s
              </span>
            )}
            
            {status === 'disconnected' && (
              <span className="indicator-window">
                {retryCountdown && retryCountdown > 0 ? (
                  <>Auto-reconnect available</>
                ) : (
                  <>Reconnection window expired</>
                )}
              </span>
            )}
            
            {status === 'failed' && error && (
              <span className="indicator-error">{error}</span>
            )}
            
            {showQuality && quality && status === 'connected' && (
              <span className={`indicator-quality quality-${quality}`}>
                {quality.charAt(0).toUpperCase() + quality.slice(1)} connection
              </span>
            )}
          </>
        )}
      </div>

      {!compact && (status === 'disconnected' || status === 'failed') && onReconnect && (
        <button 
          className="indicator-action"
          onClick={onReconnect}
          disabled={status === 'disconnected' && retryCountdown === 0}
        >
          {status === 'disconnected' && retryCountdown && retryCountdown > 0 ? (
            <>Wait...</>
          ) : (
            <>
              <RefreshCw size={14} />
              Reconnect
            </>
          )}
        </button>
      )}
    </div>
  );
};

// Compact Version for Header
export const ConnectionBadge: React.FC<{ quality?: ConnectionQuality }> = ({ quality }) => {
  const qualityColors = {
    excellent: '#10b981',
    good: '#3b82f6',
    fair: '#f59e0b',
    poor: '#ef4444',
  };

  return (
    <div className="connection-badge" title={`Connection: ${quality || 'unknown'}`}>
      <Wifi size={14} style={{ color: quality ? qualityColors[quality] : '#9ca3af' }} />
    </div>
  );
};
```

---

# 5. AI Conversations Page (Dedicated)

## Page Structure

```
/ai-conversations
├── Sidebar
│   ├── Search bar
│   ├── Filter tabs (All, Active, Archived, Pinned)
│   ├── Conversation list
│   │   ├── Conversation cards with preview
│   │   ├── Remux indicator
│   │   └── Quick actions
│   └── New Chat button
│
├── Main Content
│   ├── Empty state / Quick start
│   ├── Active conversation view
│   │   ├── Header with actions
│   │   ├── Messages list
│   │   └── OmniComposer input
│   └── Remux dialog
│
└── Right Panel (optional)
    ├── Conversation details
    ├── Linked ACUs
    └── Export options
```

## Implementation

```typescript
// pwa/src/pages/AIConversationsPage.tsx

import React, { useState, useCallback } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Pin,
  Archive,
  Trash2,
  Copy,
  Download,
  Remux,
  Sparkles,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { AIChat } from '../components/AIChat';
import { OmniComposer } from '../components/OmniComposer';
import { RemuxDialog } from '../components/RemuxDialog';
import { useAIConversations } from '../hooks/useAIConversations';
import './AIConversationsPage.css';

interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  lastMessage: string;
  lastMessageAt: number;
  messageCount: number;
  isPinned: boolean;
  isRemuxed: boolean;
  remuxSources?: string[];
  tags?: string[];
}

export const AIConversationsPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRemux, setShowRemux] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived' | 'pinned'>('all');
  const [search, setSearch] = useState('');
  
  const { 
    conversations, 
    loading, 
    createConversation,
    archiveConversation,
    deleteConversation,
    pinConversation,
  } = useAIConversations();

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'active') return !conv.isPinned && !conv.isArchived;
    if (filter === 'pinned') return conv.isPinned;
    if (filter === 'archived') return conv.isArchived;
    return true;
  }).filter(conv => 
    search ? conv.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  const handleNewChat = useCallback(async () => {
    const conv = await createConversation({
      title: 'New AI Chat',
      provider: 'zai',
      model: 'glm-4.7',
    });
    setSelectedId(conv.id);
  }, [createConversation]);

  const handleRemux = useCallback((sourceId: string) => {
    setSelectedId(sourceId);
    setShowRemux(true);
  }, []);

  return (
    <div className="ai-conversations-page">
      {/* Sidebar */}
      <aside className="ai-sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <h1>
            <Sparkles className="icon" />
            AI Conversations
          </h1>
          <button className="new-chat-btn" onClick={handleNewChat}>
            <Plus size={18} />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="sidebar-tabs">
          {(['all', 'active', 'pinned', 'archived'] as const).map(tab => (
            <button
              key={tab}
              className={`tab ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="count">
                {tab === 'all' ? conversations.length : 
                 tab === 'active' ? conversations.filter(c => !c.isPinned && !c.isArchived).length :
                 tab === 'pinned' ? conversations.filter(c => c.isPinned).length :
                 conversations.filter(c => c.isArchived).length}
              </span>
            </button>
          ))}
        </div>

        {/* Conversation List */}
        <div className="conversation-list">
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={48} />
              <p>No conversations yet</p>
              <button onClick={handleNewChat}>Start your first chat</button>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                isSelected={conv.id === selectedId}
                onSelect={() => setSelectedId(conv.id)}
                onPin={() => pinConversation(conv.id)}
                onArchive={() => archiveConversation(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
                onRemux={() => handleRemux(conv.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ai-main">
        {selectedId ? (
          <>
            {/* Chat View */}
            <AIChat conversationId={selectedId} />
          </>
        ) : (
          /* Empty State / Quick Start */
          <div className="ai-empty">
            <div className="empty-content">
              <Sparkles size={64} className="empty-icon" />
              <h2>Welcome to AI Conversations</h2>
              <p>Start a new chat or browse your existing conversations</p>
              
              <div className="quick-actions">
                <button className="action-card" onClick={handleNewChat}>
                  <MessageSquare size={24} />
                  <span>New Chat</span>
                </button>
                <button className="action-card" onClick={() => setFilter('active')}>
                  <Filter size={24} />
                  <span>Browse Chats</span>
                </button>
                <button className="action-card" onClick={() => {}}>
                  <Download size={24} />
                  <span>Import Chat</span>
                </button>
                <button className="action-card" onClick={() => {}}>
                  <Settings size={24} />
                  <span>AI Settings</span>
                </button>
              </div>

              <div className="recent-topics">
                <h3>Continue where you left off</h3>
                <div className="topic-tags">
                  <span className="topic-tag">Physics Discussion</span>
                  <span className="topic-tag">React Components</span>
                  <span className="topic-tag">Code Review</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Remux Dialog */}
      {showRemux && (
        <RemuxDialog
          sourceId={selectedId!}
          onClose={() => setShowRemux(false)}
          onComplete={(newId) => {
            setSelectedId(newId);
            setShowRemux(false);
          }}
        />
      )}
    </div>
  );
};

// Conversation Card Component
interface ConversationCardProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onRemux: () => void;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  isSelected,
  onSelect,
  onPin,
  onArchive,
  onDelete,
  onRemux,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      className={`conversation-card ${isSelected ? 'selected' : ''} ${conversation.isPinned ? 'pinned' : ''}`}
      onClick={onSelect}
    >
      <div className="card-main">
        {conversation.isRemuxed && (
          <div className="remux-badge" title="Remuxed conversation">
            <Remux size={12} />
          </div>
        )}
        
        <div className="card-content">
          <div className="card-header">
            <h4 className="card-title">{conversation.title}</h4>
            <span className="card-time">{formatTime(conversation.lastMessageAt)}</span>
          </div>
          
          <p className="card-preview">
            {conversation.lastMessage.slice(0, 60)}
            {conversation.lastMessage.length > 60 ? '...' : ''}
          </p>
          
          <div className="card-meta">
            <span className="model-badge">{conversation.model}</span>
            <span className="message-count">{conversation.messageCount} messages</span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button 
          className="action-btn"
          onClick={(e) => { e.stopPropagation(); onPin(); }}
          title={conversation.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin size={14} fill={conversation.isPinned ? 'currentColor' : 'none'} />
        </button>
        
        <div className="menu-wrapper">
          <button 
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          >
            <MoreVertical size={14} />
          </button>
          
          {showMenu && (
            <div className="action-menu">
              <button onClick={(e) => { e.stopPropagation(); onRemux(); }}>
                <Remux size={14} /> Remux
              </button>
              <button onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                <Archive size={14} /> Archive
              </button>
              <button onClick={(e) => { e.stopPropagation(); }}>
                <Copy size={14} /> Duplicate
              </button>
              <button onClick={(e) => { e.stopPropagation(); }}>
                <Download size={14} /> Export
              </button>
              <hr />
              <button className="danger" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

## CSS Styles

```css
/* AI Conversations Page */

.ai-conversations-page {
  display: flex;
  height: 100vh;
  background: var(--background);
}

/* Sidebar */
.ai-sidebar {
  width: 320px;
  min-width: 320px;
  background: var(--surface);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header h1 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.sidebar-header .icon {
  color: var(--primary);
}

.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* Search */
.sidebar-search {
  padding: 12px 16px;
  position: relative;
}

.sidebar-search .search-icon {
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
}

.sidebar-search input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--background);
  font-size: 14px;
}

/* Filter Tabs */
.sidebar-tabs {
  display: flex;
  padding: 0 16px;
  gap: 4px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-tabs .tab {
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-tabs .tab.active {
  color: var(--primary);
}

.sidebar-tabs .tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary);
}

.sidebar-tabs .count {
  padding: 2px 6px;
  border-radius: 10px;
  background: var(--bg-tertiary);
  font-size: 11px;
}

/* Conversation List */
.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-card {
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  position: relative;
}

.conversation-card:hover {
  background: var(--bg-secondary);
}

.conversation-card.selected {
  background: var(--primary-50);
  border: 1px solid var(--primary-200);
}

.conversation-card.pinned {
  border-left: 3px solid var(--primary);
}

.card-main {
  display: flex;
  gap: 10px;
}

.remux-badge {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-time {
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.card-preview {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-badge {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  font-size: 11px;
  font-family: monospace;
}

.message-count {
  font-size: 12px;
  color: var(--text-tertiary);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.conversation-card:hover .card-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-tertiary);
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

/* Main Content */
.ai-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Empty State */
.ai-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
}

.empty-icon {
  color: var(--primary);
  margin-bottom: 24px;
}

.empty-content h2 {
  font-size: 28px;
  margin: 0 0 12px 0;
}

.empty-content p {
  color: var(--text-secondary);
  margin: 0 0 32px 0;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}

.action-card {
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-card span {
  font-size: 13px;
  font-weight: 500;
}

.recent-topics h3 {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}

.topic-tags {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.topic-tag {
  padding: 6px 12px;
  border-radius: 20px;
  background: var(--bg-secondary);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.topic-tag:hover {
  background: var(--primary-50);
  color: var(--primary);
}
```

## Integration with Navigation

```typescript
// pwa/src/App.tsx

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/conversations" element={<ConversationsPage />} />
        <Route path="/conversations/:id" element={<ConversationsPage />} />
        <Route path="/capture" element={<CapturePage />} />
        {/* ... */}
      </Routes>
    </Router>
  );
};
```

---

## Implementation Roadmap

### Phase 1: Foundation (This Sprint)

| Task | Files | Effort |
|------|-------|--------|
| Unified data structures | `pwa/src/types/ai-chat.ts` | 2h |
| Migration utilities | `pwa/src/lib/ai-data-migration.ts` | 1h |
| Stream manager core | `pwa/src/lib/stream-manager.ts` | 3h |
| Connection indicator | `pwa/src/components/ConnectionIndicator.tsx` | 2h |
| **Total** | | **8h** |

### Phase 2: OmniComposer (Next Sprint)

| Task | Files | Effort |
|------|-------|--------|
| Visual trigger system | `pwa/src/components/OmniComposer.tsx` | 4h |
| Trigger indicator | `pwa/src/components/TriggerIndicator.tsx` | 1h |
| Suggestion menu updates | `pwa/src/components/SuggestionMenu.tsx` | 2h |
| CSS polish | `pwa/src/components/OmniComposer.css` | 2h |
| **Total** | | **9h** |

### Phase 3: AI Conversations Page (Following Sprint)

| Task | Files | Effort |
|------|-------|--------|
| Page structure | `pwa/src/pages/AIConversationsPage.tsx` | 4h |
| Conversation card | `pwa/src/components/ConversationCard.tsx` | 2h |
| Sidebar | Included above | - |
| Empty state | Included above | - |
| Remux dialog | `pwa/src/components/RemuxDialog.tsx` | 3h |
| Routing integration | `pwa/src/App.tsx` | 1h |
| **Total** | | **10h** |

---

**Generated**: February 11, 2026
**Priority Stack**: Streaming, Data Structures, OmniComposer, Connection, AI Page
