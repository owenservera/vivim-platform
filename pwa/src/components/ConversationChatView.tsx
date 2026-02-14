/**
 * Conversation Chat View
 * Displays a conversation's messages with AI styling
 */

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
} from 'lucide-react';
import type { Conversation, Message } from '../types/conversation';
import { ContentRenderer } from './content';

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
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = () => {
    navigate(`/conversation/${conversation.id}/share`);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this conversation?')) return;
    navigate('/ai-conversations');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="font-semibold text-lg truncate max-w-md">{conversation.title}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="capitalize flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  {conversation.provider}
                </span>
                <span>•</span>
                <span>{conversation.stats.totalMessages} messages</span>
                <span>•</span>
                <span>{new Date(conversation.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRemix && (
              <button
                onClick={onRemix}
                className="px-3 py-1.5 text-sm bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Remix
              </button>
            )}
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {conversation.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onCopy={() => copyToClipboard(
                typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
                message.id
              )}
              isCopied={copiedId === message.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Message Bubble Component
 */
interface MessageBubbleProps {
  message: Message;
  onCopy: () => void;
  isCopied: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onCopy, isCopied }) => {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';

  const icon = isUser ? (
    <MessageSquare className="w-4 h-4" />
  ) : isTool ? (
    <Wrench className="w-4 h-4" />
  ) : (
    <Bot className="w-4 h-4" />
  );

  const bgColor = isUser
    ? 'bg-blue-600/20 text-blue-100 rounded-tr-sm'
    : isTool
    ? 'bg-orange-600/20 text-orange-100 rounded-tl-sm'
    : 'bg-gray-800/50 text-gray-200 rounded-tl-sm';

  const iconBg = isUser
    ? 'bg-blue-600'
    : isTool
    ? 'bg-orange-600'
    : 'bg-gray-700';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 ${bgColor}`}>
          <ContentRenderer content={message.content} />
        </div>

        <div className={`mt-2 flex items-center gap-3 px-1 ${isUser ? 'justify-end' : ''}`}>
          <button
            onClick={onCopy}
            className="text-gray-500 hover:text-white transition-colors"
            title="Copy message"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          <span className="text-[10px] text-gray-600 font-mono">
            {message.id.slice(0, 8)}...
          </span>

          {message.metadata?.model && (
            <span className="text-[10px] text-gray-600">
              {message.metadata.model}
            </span>
          )}

          <span className="text-[10px] text-gray-600">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConversationChatView;
