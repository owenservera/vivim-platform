import { useState, useEffect, useRef, useCallback } from 'react';

import { AIProviderCapabilities } from '../types/ai';
import { Bot, User, Sparkles, AlertCircle, Loader2, Trash2, Copy, RefreshCw, Check, ChevronDown, Command, Zap, ZapOff, Settings } from 'lucide-react';
import { ChatInputBox } from './ChatInputBox';
import { useAIStore } from '../lib/ai-store';
import { useAIChat } from '../hooks/useAI';
import { ContextVisualizer } from './ContextVisualizer';
import './AIChat.css';

interface AIChatProps {
  initialMessage?: string;
}

export const AIChat = ({ initialMessage }: AIChatProps) => {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    stop,
    clearMessages,
    lastResponse,
  } = useAIChat();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  const { 
    defaultModel, 
    setDefaultProvider, 
    setDefaultModel,
    apiKeys 
  } = useAIStore();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Click outside listener for model selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;
    
    try {
      await sendMessage(message);
    } catch {
      // Error handled in state
    }
  };

  const handleSelectModel = (provider: string, model: string) => {
    setDefaultProvider(provider as any);
    setDefaultModel(model);
    setShowModelSelector(false);
  };

  const handleRegenerate = async () => {
    if (messages.length < 1 || isLoading) return;
    
    // Find last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      try {
        await sendMessage(lastUserMessage.content);
      } catch {
        // Error handled in state
      }
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCommandSelect = (command: string) => {
    if (command === '/settings') {
      window.location.href = '/settings/ai';
    }
    setShowModelSelector(false);
  };

  const isEmpty = messages.length === 0;

  // Available providers and models
  const providers = Object.keys(AIProviderCapabilities);
  const activeModels: Record<string, { models: string[] }> = {};
  
  // Build active models from capabilities
  providers.forEach(provider => {
    const capabilities = (AIProviderCapabilities as any)[provider];
    if (capabilities && capabilities.models) {
      activeModels[provider] = { models: capabilities.models };
    }
  });

  return (
    <div className="ai-chat-container">
      {/* Header */}
      <div className="ai-chat-header">
        <div className="ai-chat-title">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h3>AI Assistant</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Model Selector Pill */}
          <button 
            className={`ai-model-pill ${showModelSelector ? 'active' : ''}`}
            onClick={() => setShowModelSelector(!showModelSelector)}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{defaultModel || 'Select Model'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {messages.length > 0 && (
            <button
              className="ai-chat-clear"
              onClick={clearMessages}
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Model Selector Dropdown */}
        {showModelSelector && (
          <div className="ai-model-selector" ref={modelSelectorRef}>
            <div className="ai-model-selector-header">
              <Command className="w-4 h-4" />
              <span>Switch AI Model</span>
            </div>
            <div className="ai-model-list">
              {providers.map((providerId: string) => {
                const capabilities = (AIProviderCapabilities as any)[providerId];
                if (!capabilities) return null;
                
                const hasKey = capabilities.isFree || apiKeys[providerId];
                const providerModels = activeModels[providerId]?.models || [];
                
                if (providerModels.length === 0) return null;

                return (
                  <div key={providerId} className="ai-provider-group">
                    <div className="ai-provider-label">
                      {capabilities.displayName}
                      {!hasKey && <span className="ai-setup-required">Setup Req.</span>}
                    </div>
                    {providerModels.map((m: string) => (
                      <button
                        key={m}
                        className={`ai-model-option ${defaultModel === m ? 'selected' : ''} ${!hasKey ? 'disabled' : ''}`}
                        onClick={() => hasKey ? handleSelectModel(providerId, m) : handleCommandSelect('/settings')}
                      >
                        <span className="ai-model-name">{m}</span>
                        {defaultModel === m && <Check className="w-3.5 h-3.5" />}
                        {!hasKey && <ZapOff className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="ai-model-selector-footer">
              <button onClick={() => handleCommandSelect('/settings')}>
                <Settings className="w-3.5 h-3.5" />
                <span>Manage Providers & Keys</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {lastResponse?.contextAllocation && (
        <div className="px-4 pt-2">
          <ContextVisualizer 
            contextAllocation={lastResponse.contextAllocation as any} 
            bundlesInfo={lastResponse.contextStats?.bundlesInfo as any}
            totalTokensAvailable={12000} 
          />
        </div>
      )}

      {/* Messages */}
      <div className="ai-chat-messages">
        {isEmpty ? (
          <div className="ai-chat-empty">
            <div className="ai-chat-empty-icon">
              <Bot className="w-12 h-12" />
            </div>
            <h4>VIVIM AI Assistant</h4>
            <p>
              I'm powered by {defaultModel} and optimized for high-performance reasoning.
            </p>
            <div className="ai-chat-suggestions">
              <button onClick={() => handleSend('Explain quantum computing simply')}>
                Quantum Computing
              </button>
              <button onClick={() => handleSend('Help me optimize a React component')}>
                React Optimization
              </button>
              <button onClick={() => handleSend('Write a clean architecture overview')}>
                Clean Architecture
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`ai-chat-message ${msg.role}`}>
              <div className="ai-chat-message-avatar">
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className="ai-chat-message-content">
                <div className="ai-chat-message-header">
                  <div className="ai-chat-message-role">
                    {msg.role === 'user' ? 'You' : 'AI'}
                  </div>
                  <div className="ai-chat-message-actions">
                    <button 
                      onClick={() => handleCopy(msg.content, idx)}
                      title="Copy message"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {msg.role === 'assistant' && idx === messages.length - 1 && !isLoading && (
                      <button onClick={handleRegenerate} title="Regenerate">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="ai-chat-message-text">
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="ai-chat-message assistant loading">
            <div className="ai-chat-message-avatar">
              <Bot className="w-4 h-4" />
            </div>
            <div className="ai-chat-message-content">
              <div className="ai-chat-message-role">AI</div>
              <div className="ai-chat-message-typing">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating with {defaultModel}...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="ai-chat-error">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ChatInputBox */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <ChatInputBox 
          onSend={handleSend}
          isLoading={isLoading}
          onStop={stop}
          initialValue={initialMessage}
        />
      </div>
    </div>
  );
};

export default AIChat;
