import React, { useState, useEffect } from 'react';
import { 
  AssistantRuntimeProvider, 
  Thread, 
  ThreadList,
  useRuntime
} from '@assistant-ui/react';
import { useVivimChatRuntime } from '../lib/chat-runtime';
import { useAppStore } from '../stores/appStore';
import { useVivim } from '../contexts/VivimContext';
import { 
  Bot, 
  Plus, 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  Database, 
  Shield,
  Loader2,
  Settings
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import './AIChat.css';

export const BlockchainAIChat: React.FC = () => {
  const { isReady, chainClient } = useVivim();
  const { 
    ui: { activeConversation }, 
    network: { status, peerCount },
    actions: { setActiveConversation }
  } = useAppStore();
  
  const runtime = useVivimChatRuntime(activeConversation);

  const handleNewThread = async () => {
    if (!chainClient) return;
    const { entityId } = await chainClient.createEntity('conversation' as any, {
      title: 'New Conversation',
      createdAt: Date.now()
    });
    setActiveConversation(entityId);
  };

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-muted-foreground">Initializing Blockchain Network...</p>
      </div>
    );
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full bg-background border rounded-xl overflow-hidden shadow-lg">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/30 flex flex-col">
          <div className="p-4">
            <Button 
              onClick={handleNewThread} 
              className="w-full justify-start gap-2 shadow-sm"
              variant="default"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex-1 overflow-y-auto p-2">
            <ConversationList />
          </div>

          <Separator />

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {status === 'connected' ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
                {status}
              </span>
              <span>{peerCount} peers</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-primary-500" />
              <span className="text-[10px] font-mono truncate max-w-[120px]">
                {useAppStore.getState().identity.did || 'Generating DID...'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-6 text-primary-600 shadow-inner">
                <Bot className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Welcome to VIVIM AI</h3>
              <p className="text-muted-foreground max-w-sm mb-8">
                Your conversations are encrypted and stored on the blockchain DAG. 
                Own your AI memory, forever.
              </p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <SuggestionCard 
                  icon={<Database className="w-4 h-4" />}
                  title="Knowledge DAG"
                  desc="Learn about how your data is distributed."
                />
                <SuggestionCard 
                  icon={<Shield className="w-4 h-4" />}
                  title="Identity"
                  desc="Manage your keys and DID settings."
                />
              </div>
            </div>
          ) : (
            <Thread 
              className="h-full" 
              welcome={
                <div className="p-8 text-center">
                  <Badge variant="outline" className="mb-4">Encrypted Channel</Badge>
                  <h4 className="text-lg font-semibold">Beginning of a new distributed memory</h4>
                </div>
              }
            />
          )}
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
};

const ConversationList = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const { setActiveConversation } = useAppStore().actions;
  const activeConversationId = useAppStore(s => s.ui.activeConversation);

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const chain = useAppStore.getState().identity.did ? useVivim().chainClient : null;
        if (!chain) return;

        const events = await chain.getEventStore().queryEvents({
          types: ['conversation:create' as any],
          authors: [chain.getDID()!]
        });

        setConversations(events.map(e => ({
          id: e.entityId,
          title: e.payload.title,
          timestamp: e.timestamp
        })));
      } catch (err) {
        console.error('Failed to load threads', err);
      }
    };

    loadThreads();
  }, [useVivim().isReady]);

  return (
    <div className="space-y-1">
      {conversations.map(conv => (
        <button
          key={conv.id}
          onClick={() => setActiveConversation(conv.id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
            activeConversationId === conv.id 
              ? 'bg-primary-100 text-primary-900 font-medium' 
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span className="truncate">{conv.title}</span>
        </button>
      ))}
    </div>
  );
};

const SuggestionCard = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="p-4 rounded-xl border bg-card text-left hover:border-primary-300 hover:shadow-md transition-all cursor-pointer group">
    <div className="text-primary-500 mb-2 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="font-semibold text-sm mb-1">{title}</div>
    <div className="text-xs text-muted-foreground">{desc}</div>
  </div>
);
