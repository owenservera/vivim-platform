import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MoreVertical, 
  Share2, 
  Pin, 
  Bookmark,
  Sparkles,
  Send,
  Paperclip,
  Mic,
  Loader2,
  Bot,
  User,
  CheckCheck,
  ExternalLink
} from 'lucide-react';
import { IOSAvatar, useIOSToast, toast } from './index';
import { cn } from '../../lib/utils';
import { featureService } from '../../lib/feature-service';
import { useBookmarks, useFeatureCapabilities } from '../../lib/feature-hooks';
import { ContentRenderer } from '../content/ContentRenderer';
import type { Conversation } from '../../types/conversation';
import type { AIAction } from '../../types/features';

interface FullScreenConversationProps {
  conversation: Conversation;
  onBack?: () => void;
  onSendMessage?: (message: string) => void;
  onAIClick?: (action: AIAction) => void;
  isLoading?: boolean;
}

export const FullScreenConversation: React.FC<FullScreenConversationProps> = ({
  conversation,
  onBack,
  onSendMessage,
  onAIClick,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const { toast: showToast } = useIOSToast();
  const capabilities = useFeatureCapabilities();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isLocalBookmarked = isBookmarked(conversation.id);

  useEffect(() => {
    const loadMetadata = async () => {
      const metadata = await featureService.getMetadata(conversation.id);
      if (metadata) {
        setIsPinned(metadata.isPinned);
        setIsArchived(metadata.isArchived);
      }
    };
    loadMetadata();
  }, [conversation.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage?.(message);
    setMessage('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePin = async () => {
    const newState = !isPinned;
    setIsPinned(newState);
    const success = newState 
      ? await featureService.pin(conversation.id)
      : await featureService.unpin(conversation.id);
    if (success) {
      showToast(toast.success(newState ? 'Pinned' : 'Unpinned'));
    } else {
      setIsPinned(!newState);
    }
  };

  const handleBookmark = async () => {
    const success = await toggleBookmark(conversation.id);
    if (success) {
      showToast(toast.success(isLocalBookmarked ? 'Bookmark removed' : 'Bookmarked'));
    }
  };

  const handleShare = async () => {
    const link = await featureService.generateShareLink(conversation.id, {
      visibility: 'link',
      allowComments: true,
      allowForks: true,
      attributionRequired: true,
    });
    if (link) {
      await navigator.clipboard.writeText(link.url);
      showToast(toast.success('Link copied to clipboard'));
    }
  };

  const providerIcons: Record<string, string> = {
    chatgpt: '🤖',
    claude: '✨',
    gemini: '💎',
    grok: '🚀',
    zai: '⚡',
    qwen: '🌐',
    deepseek: '🔍',
    kimi: '🎯',
    default: '💬',
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const groupedMessages = conversation.messages?.reduce((groups, msg) => {
    const date = new Date(msg.timestamp || conversation.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {} as Record<string, typeof conversation.messages>);

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-white dark:bg-gray-950">
      <header className="flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 safe-top">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <IOSAvatar
          initials={providerIcons[conversation.provider] || providerIcons.default}
          size="md"
          className="bg-gradient-to-br from-blue-500 to-indigo-600"
        />

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 dark:text-white truncate">
            {conversation.title}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>
              {conversation.provider} 
              {conversation.metadata?.model && conversation.metadata.model !== 'unknown' && ` (${conversation.metadata.model})`} 
              · {conversation.stats?.totalMessages || 0} messages
            </span>
            {conversation.sourceUrl && (
              <>
                <span className="opacity-30">|</span>
                <a 
                  href={conversation.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Original
                </a>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {isPinned && <Pin className="w-4 h-4 text-blue-500 fill-current" />}
          {isLocalBookmarked && <Bookmark className="w-4 h-4 text-amber-500 fill-current" />}
          
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {showActions && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowActions(false)} 
            />
            <div className="absolute right-4 top-14 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
              <button
                onClick={handlePin}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Pin className="w-4 h-4" />
                {isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={handleBookmark}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Bookmark className={cn('w-4 h-4', isLocalBookmarked && 'fill-current')} />
                {isLocalBookmarked ? 'Remove Bookmark' : 'Bookmark'}
              </button>
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <button
                onClick={() => onAIClick?.('summarize')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                AI Summarize
              </button>
            </div>
          </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {groupedMessages && Object.entries(groupedMessages).map(([date, messages]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center justify-center">
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                {formatDate(date)}
              </span>
            </div>

            {messages?.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5',
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                )}>
                  <div className="text-sm leading-relaxed">
                    <ContentRenderer 
                      content={msg.parts || (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))} 
                    />
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 mt-1 text-[10px]',
                    msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  )}>
                    <span>{formatTime(msg.timestamp || conversation.createdAt)}</span>
                    {msg.role === 'user' && (
                      <CheckCheck className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 safe-bottom">
        <div className="flex items-end gap-2 px-4 py-3">
          <button
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
            onClick={() => showToast(toast.info('Attachments coming soon'))}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 resize-none outline-none text-sm max-h-[120px]"
              style={{ minHeight: '24px' }}
            />
          </div>

          {message.trim() ? (
            <button
              onClick={handleSend}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex-shrink-0 shadow-lg shadow-blue-500/30"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={cn(
                'p-2 rounded-full transition-colors flex-shrink-0',
                isRecording 
                  ? 'bg-red-500 text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => onAIClick?.('continue_chat')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-full whitespace-nowrap"
          >
            <Sparkles className="w-3 h-3" />
            Continue with AI
          </button>
          <button
            onClick={() => onAIClick?.('summarize')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full whitespace-nowrap"
          >
            Summarize
          </button>
          <button
            onClick={() => onAIClick?.('expand')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full whitespace-nowrap"
          >
            Expand
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullScreenConversation;
