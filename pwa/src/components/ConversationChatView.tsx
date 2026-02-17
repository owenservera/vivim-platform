import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Trash2,
  RefreshCw,
  Bot,
  MessageSquare,
  Wrench,
  Copy,
  Check,
  MoreVertical,
  Zap,
  Info
} from 'lucide-react';
import type { Conversation, Message } from '../types/conversation';
import { ContentRenderer } from './content';
import { 
  IOSTopBar, 
  IOSChatBubble, 
  IOSAIChatBubble, 
  IOSTypingIndicator,
  IOSAvatar,
  useIOSToast,
  toast
} from './ios';
import { cn } from '../lib/utils';

interface ConversationChatViewProps {
  conversation: Conversation;
  onBack?: () => void;
  onRemix?: () => void;
}

export const ConversationChatView: React.FC<ConversationChatViewProps> = ({
  conversation,
  onBack,
  onRemix,
}) => {
  const navigate = useNavigate();
  const { toast: showToast } = useIOSToast();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(toast.success('Copied to clipboard'));
  };

  const handleShare = () => {
    navigate(`/conversation/${conversation.id}/share`);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this intelligence materialization?')) return;
    showToast(toast.success('Removed from local library'));
    navigate('/ai-conversations');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950">
      {/* Header */}
      <IOSTopBar 
        title={conversation.title} 
        showBackButton={!!onBack}
        onBack={onBack}
        rightAction={
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        }
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 ios-scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Metadata info */}
          <div className="flex justify-center">
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Bot className="w-3 h-3" />
                {conversation.provider}
              </div>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {conversation.stats.totalMessages} Messages
              </div>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {new Date(conversation.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {conversation.messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.role === 'user' ? (
                <IOSChatBubble 
                  content={typeof message.content === 'string' ? message.content : JSON.stringify(message.content)} 
                  isOwn 
                  timestamp={formatTime(message.timestamp)}
                  onCopy={() => copyToClipboard(
                    typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
                    message.id
                  )}
                />
              ) : (
                <IOSAIChatBubble 
                  content={typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                  timestamp={formatTime(message.timestamp)}
                  onCopy={() => copyToClipboard(
                    typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
                    message.id
                  )}
                />
              )}
              
              {/* Message Details (Model, Token info etc) */}
              {message.metadata?.model && (
                <div className={cn(
                  "flex items-center gap-2 px-14 text-[9px] font-bold text-gray-400 uppercase tracking-tighter",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <Zap className="w-2.5 h-2.5" />
                  <span>{message.metadata.model}</span>
                  {message.metadata.usage && (
                    <>
                      <span>•</span>
                      <span>{message.metadata.usage.totalTokens} Tokens</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Remix Action (Bottom Float) */}
      {onRemix && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={onRemix}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-bold text-sm shadow-xl shadow-purple-500/30 hover:bg-purple-700 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Remix Materialization
          </button>
        </div>
      )}
    </div>
  );
};

export default ConversationChatView;
