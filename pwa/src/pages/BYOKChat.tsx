import './BYOKChat.css';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Send,
  Settings,
  Trash2,
  Plus,
  ChevronDown,
  Sparkles,
  X,
  Loader2,
  Cpu,
  Zap,
  Key
} from 'lucide-react';
import { 
  IOSTopBar, 
  IOSCard, 
  IOSButton, 
  IOSModal, 
  IOSChatBubble,
  IOSAIChatBubble,
  IOSTypingIndicator,
  useIOSToast,
  toast
} from '../components/ios';
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
import { cn } from '../lib/utils';

interface Conversation {
  id: string;
  provider: BYOKProvider;
  model: string;
  messages: BYOKMessage[];
  settings: ChatSettings;
  createdAt: Date;
}

export const BYOKChat: React.FC = () => {
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
  const { toast: showToast } = useIOSToast();

  useEffect(() => {
    const checkKeys = async () => {
      const providers = await getProvidersWithKeys();
      const keys: Record<string, boolean> = {};
      providers.forEach(p => keys[p] = true);
      setHasKeys(keys);

      if (!provider && providers.length > 0) {
        setProvider(providers[0] as BYOKProvider);
        setModel(getDefaultModel(providers[0]));
      }
    };
    checkKeys();
  }, [provider]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, loading, streaming]);

  const handleProviderSelect = useCallback((newProvider: BYOKProvider) => {
    setProvider(newProvider);
    setModel(getDefaultModel(newProvider));
  }, []);

  const handleKeyAdded = useCallback((newProvider: BYOKProvider) => {
    setHasKeys(prev => ({ ...prev, [newProvider]: true }));
    showToast(toast.success('API Key Added'));
  }, [showToast]);

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

      const result = await collectStream(
        {
          provider,
          model,
          messages: messagesForAPI,
          settings,
        },
        (chunk) => {
          if (chunk.type === 'done') {
            setStreaming(false);
          }
        },
        abortControllerRef.current.signal
      );

      await recordUsage(
        provider,
        result.usage.promptTokens,
        result.usage.completionTokens,
        result.usage.cost
      );

      setCurrentConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, result.message],
        };
      });
    } catch (error) {
      console.error('Chat error:', error);
      showToast(toast.error('Sync failed'));
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

  const canSend = provider && model && hasKeys[provider] && !loading && !streaming;

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      <IOSTopBar 
        title={provider ? getProviderConfig(provider)?.displayName : "BYOK Chat"} 
        rightAction={
          <button 
            onClick={() => setCurrentConversation(null)}
            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
          >
            <Plus size={22} />
          </button>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 ios-scrollbar-hide">
          {!currentConversation ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                <Cpu className="w-10 h-10 text-white" />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Direct Intelligence</h2>
                <p className="text-sm text-gray-500">Connect your own API keys for unmetered local materialization.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
                {Object.values(PROVIDER_CONFIGS).map(config => (
                  <IOSCard 
                    key={config.id} 
                    padding="sm" 
                    clickable 
                    onClick={() => handleProviderSelect(config.id as BYOKProvider)}
                    className={cn(
                      "flex items-center gap-3 border-2 transition-all",
                      provider === config.id ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "border-transparent"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: config.color }}>
                      {config.displayName[0]}
                    </div>
                    <span className="flex-1 text-sm font-bold text-left">{config.displayName}</span>
                    {hasKeys[config.id] ? (
                      <Zap className="w-4 h-4 text-green-500" />
                    ) : (
                      <Key className="w-4 h-4 text-gray-300" />
                    )}
                  </IOSCard>
                ))}
              </div>
            </div>
          ) : (
            <>
              {currentConversation.messages.map(msg => (
                msg.role === 'user' ? (
                  <IOSChatBubble key={msg.id} content={msg.content} isOwn />
                ) : (
                  <IOSAIChatBubble key={msg.id} content={msg.content} />
                )
              ))}
              {(loading || streaming) && <IOSTypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 safe-bottom">
          <div className="flex items-end gap-3 max-w-lg mx-auto">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-3xl px-4 py-3 border border-transparent focus-within:border-blue-500/30 transition-all">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={canSend ? "Type your query..." : "Add API key to initialize engine"}
                disabled={!canSend}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none resize-none max-h-32"
                rows={1}
                style={{ height: 'auto', minHeight: '20px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!canSend || !input.trim()}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-lg",
                canSend && input.trim() 
                  ? "bg-blue-500 text-white shadow-blue-500/20 active:scale-90" 
                  : "bg-gray-200 dark:bg-gray-800 text-gray-400 opacity-50"
              )}
            >
              <Send size={20} />
            </button>
          </div>
          
          {!canSend && provider && !hasKeys[provider] && (
            <div className="mt-4 flex justify-center">
              <IOSButton 
                variant="primary" 
                size="sm" 
                onClick={() => setShowAddKey(provider)}
                icon={<Key className="w-4 h-4" />}
                className="rounded-full px-6"
              >
                Unlock {getProviderConfig(provider)?.displayName} Engine
              </IOSButton>
            </div>
          )}
        </div>
      </div>

      {showAddKey && (
        <IOSModal
          isOpen={!!showAddKey}
          onClose={() => setShowAddKey(null)}
          title={`Engine Access: ${getProviderConfig(showAddKey)?.displayName}`}
        >
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 leading-relaxed">
                Your API key is stored locally in your browser's secure vault and never transmitted to our servers. All materialization happens through our zero-trust proxy.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                Protocol Key
              </label>
              <input
                type="password"
                placeholder={getProviderConfig(showAddKey)?.keyFormat.example}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
                onChange={(e) => setInput(e.target.value)} // Temporary use of input state for simple modal
              />
            </div>

            <IOSButton 
              variant="primary" 
              fullWidth 
              onClick={async () => {
                // Simplified handleSubmit logic
                const result = await addKey(showAddKey, input);
                if (result.valid) {
                  handleKeyAdded(showAddKey);
                  setShowAddKey(null);
                } else {
                  showToast(toast.error('Invalid Key'));
                }
              }}
            >
              Authorize Engine
            </IOSButton>
          </div>
        </IOSModal>
      )}
    </div>
  );
};

export default BYOKChat;
