/**
 * BYOK Chat Page
 * 
 * Chat interface for Bring Your Own Key AI conversations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Settings, Trash2, Plus, ChevronDown, Sparkles, X, Loader2 } from 'lucide-react';
import type { BYOKMessage, BYOKProvider, ChatSettings } from '../lib/byok/types';
import { 
  getStoredKeys, 
  addKey, 
  removeKey, 
  hasValidKey, 
  getProvidersWithKeys,
  recordUsage 
} from '../lib/byok/api-key-manager';
import { 
  PROVIDER_CONFIGS, 
  getProviderConfig, 
  getProviderModels, 
  getDefaultModel 
} from '../lib/byok/provider-config';
import { streamChat, collectStream, createBYOKAbortController } from '../lib/byok/streaming-client';
import './BYOKChat.css';

// ============================================================================
// Types
// ============================================================================

interface Conversation {
  id: string;
  provider: BYOKProvider;
  model: string;
  messages: BYOKMessage[];
  settings: ChatSettings;
  createdAt: Date;
}

// ============================================================================
// Components
// ============================================================================

function ProviderSelector({ 
  selectedProvider, 
  onSelect,
  hasKey 
}: { 
  selectedProvider: BYOKProvider | null;
  onSelect: (provider: BYOKProvider) => void;
  hasKey: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const providers = Object.values(PROVIDER_CONFIGS);
  const selectedConfig = selectedProvider ? getProviderConfig(selectedProvider) : null;

  return (
    <div className="provider-selector" ref={dropdownRef}>
      <button 
        className="provider-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!hasKey}
      >
        {selectedConfig ? (
          <>
            <span 
              className="provider-dot" 
              style={{ backgroundColor: selectedConfig.color }}
            />
            {selectedConfig.displayName}
          </>
        ) : (
          <span className="placeholder">Select Provider</span>
        )}
        <ChevronDown className="chevron" />
      </button>

      {isOpen && (
        <div className="provider-dropdown">
          {providers.map(config => (
            <button
              key={config.id}
              className={`provider-option ${selectedProvider === config.id ? 'selected' : ''}`}
              onClick={() => {
                onSelect(config.id as BYOKProvider);
                setIsOpen(false);
              }}
            >
              <span 
                className="provider-dot" 
                style={{ backgroundColor: config.color }}
              />
              <span className="provider-name">{config.displayName}</span>
              {selectedProvider === config.id && (
                <span className="check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ModelSelector({ 
  provider, 
  selectedModel, 
  onSelect 
}: { 
  provider: BYOKProvider | null;
  selectedModel: string;
  onSelect: (model: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const models = provider ? getProviderModels(provider) : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedModelInfo = models.find(m => m.id === selectedModel);

  return (
    <div className="model-selector" ref={dropdownRef}>
      <button 
        className="model-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!provider || models.length === 0}
      >
        {selectedModelInfo?.name || 'Select Model'}
        <ChevronDown className="chevron" />
      </button>

      {isOpen && (
        <div className="model-dropdown">
          {models.map(model => (
            <button
              key={model.id}
              className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
              onClick={() => {
                onSelect(model.id);
                setIsOpen(false);
              }}
            >
              <div className="model-info">
                <span className="model-name">{model.name}</span>
                <span className="model-details">
                  {model.contextWindow.toLocaleString()} context • 
                  ${model.inputCostPer1k.toFixed(4)}/1K input
                </span>
              </div>
              {selectedModel === model.id && (
                <span className="check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddKeyModal({ 
  provider, 
  onClose, 
  onKeyAdded 
}: { 
  provider: BYOKProvider | null;
  onClose: () => void;
  onKeyAdded: (provider: BYOKProvider) => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = provider ? getProviderConfig(provider) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !config) return;

    setLoading(true);
    setError(null);

    try {
      const result = await addKey(provider, apiKey);
      if (result.valid) {
        onKeyAdded(provider);
        onClose();
      } else {
        setError(result.error || 'Invalid API key');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add key');
    } finally {
      setLoading(false);
    }
  };

  if (!provider || !config) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div 
            className="provider-icon" 
            style={{ backgroundColor: config.color }}
          >
            {config.displayName[0]}
          </div>
          <h2>Add {config.displayName} API Key</h2>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={config.keyFormat.example}
              required
              autoFocus
            />
            <p className="help-text">
              Format: {config.keyFormat.placeholder}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !apiKey}>
              {loading ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  Validating...
                </>
              ) : (
                'Add API Key'
              )}
            </button>
          </div>

          <a 
            href={config.docsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="docs-link"
          >
            Get your API key from {config.displayName}
          </a>
        </form>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: BYOKMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? 'U' : 'AI'}
      </div>
      <div className="message-content">
        {message.parts?.map((part, i) => (
          <div key={i} className={`message-part ${part.type}`}>
            {part.type === 'code' ? (
              <pre><code>{part.content}</code></pre>
            ) : part.type === 'image' ? (
              <img src={part.content} alt="Uploaded content" />
            ) : (
              <p>{part.content}</p>
            )}
          </div>
        ))}
        {!message.parts && message.content && (
          <p>{message.content}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BYOKChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [provider, setProvider] = useState<BYOKProvider | null>(null);
  const [model, setModel] = useState<string>('');
  const [hasKeys, setHasKeys] = useState<Record<string, boolean>>({});
  const [showAddKey, setShowAddKey] = useState<BYOKProvider | null>(null);
  const [settings, setSettings] = useState<ChatSettings>({
    temperature: 0.7,
    maxTokens: 4096,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for available keys
  useEffect(() => {
    const checkKeys = async () => {
      const providers = await getProvidersWithKeys();
      const keys: Record<string, boolean> = {};
      providers.forEach(p => keys[p] = true);
      setHasKeys(keys);

      // Select first provider with a key
      if (!provider && providers.length > 0) {
        setProvider(providers[0] as BYOKProvider);
        setModel(getDefaultModel(providers[0]));
      }
    };
    checkKeys();
  }, [provider]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleProviderSelect = useCallback((newProvider: BYOKProvider) => {
    setProvider(newProvider);
    setModel(getDefaultModel(newProvider));
  }, []);

  const handleKeyAdded = useCallback((newProvider: BYOKProvider) => {
    setHasKeys(prev => ({ ...prev, [newProvider]: true }));
  }, []);

  const createConversation = useCallback((): Conversation => {
    return {
      id: crypto.randomUUID(),
      provider: provider!,
      model,
      messages: [],
      settings,
      createdAt: new Date(),
    };
  }, [provider, model, settings]);

  const handleSend = async () => {
    if (!input.trim() || !provider || !model || loading || streaming) return;

    let conversation = currentConversation;
    
    if (!conversation) {
      conversation = createConversation();
      setConversations(prev => [...prev, conversation!]);
    }

    const userMessage: BYOKMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    };

    setCurrentConversation({
      ...conversation,
      messages: [...conversation.messages, userMessage],
    });
    setInput('');

    setLoading(true);
    setStreaming(true);
    abortControllerRef.current = createBYOKAbortController();

    try {
      const messagesForAPI = [
        ...conversation.messages,
        { role: 'user', content: userMessage.content }
      ].map(m => ({ role: m.role, content: m.content }));

      // Collect streaming response
      const result = await collectStream(
        {
          provider,
          model,
          messages: messagesForAPI,
          settings,
        },
        (chunk) => {
          // Could update a streaming state for real-time display
          if (chunk.type === 'done') {
            setStreaming(false);
          }
        },
        abortControllerRef.current.signal
      );

      // Record usage
      await recordUsage(
        provider,
        result.usage.promptTokens,
        result.usage.completionTokens,
        result.usage.cost
      );

      // Update conversation with AI response
      setCurrentConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, result.message],
        };
      });
    } catch (error) {
      console.error('Chat error:', error);
      setStreaming(false);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setCurrentConversation(null);
  };

  const handleClearChat = () => {
    if (currentConversation) {
      setConversations(prev => prev.filter(c => c.id !== currentConversation.id));
      setCurrentConversation(null);
    }
  };

  const canSend = provider && model && hasKeys[provider] && !loading && !streaming;

  return (
    <div className="byok-chat-page">
      <aside className="byok-sidebar">
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="conversation-list">
          {conversations.map(conv => (
            <button
              key={conv.id}
              className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
              onClick={() => setCurrentConversation(conv)}
            >
              <span className="conv-title">
                {conv.messages[0]?.content.slice(0, 30) || 'New Chat'}
                ...
              </span>
              <span className="conv-provider">{conv.provider}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="byok-main">
        <header className="chat-header">
          <div className="header-left">
            <ProviderSelector 
              selectedProvider={provider} 
              onSelect={handleProviderSelect}
              hasKey={provider ? hasKeys[provider] : false}
            />
            <ModelSelector 
              provider={provider}
              selectedModel={model}
              onSelect={setModel}
            />
          </div>

          <div className="header-right">
            {!provider || !hasKeys[provider] ? (
              <button 
                className="add-key-btn"
                onClick={() => setShowAddKey(provider)}
              >
                <Sparkles size={16} />
                Add API Key
              </button>
            ) : null}
            
            {currentConversation && (
              <button className="clear-chat-btn" onClick={handleClearChat}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </header>

        <div className="chat-messages">
          {!currentConversation ? (
            <div className="empty-state">
              <Sparkles size={48} />
              <h2>Start a BYOK Chat</h2>
              <p>Select a provider and model to begin chatting with your own API key.</p>
              
              {provider && !hasKeys[provider] && (
                <button 
                  className="add-key-btn-large"
                  onClick={() => setShowAddKey(provider)}
                >
                  Add your {getProviderConfig(provider)?.displayName} API Key
                </button>
              )}
            </div>
          ) : (
            <>
              {currentConversation.messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              
              {(loading || streaming) && (
                <div className="chat-message assistant loading">
                  <div className="message-avatar">AI</div>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={canSend ? "Send a message..." : "Add an API key to start chatting"}
              disabled={!canSend}
              rows={3}
            />
            <button 
              className="send-btn"
              onClick={handleSend}
              disabled={!canSend || !input.trim()}
            >
              <Send size={18} />
            </button>
          </div>
          
          <p className="input-help">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </main>

      {showAddKey && (
        <AddKeyModal
          provider={showAddKey}
          onClose={() => setShowAddKey(null)}
          onKeyAdded={handleKeyAdded}
        />
      )}
    </div>
  );
}

export default BYOKChat;
