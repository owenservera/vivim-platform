import React, { useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { Copy, Check, CheckCheck, MoreHorizontal, Trash2, Reply, Pencil } from 'lucide-react';

export interface IOSChatBubbleProps {
  content: string;
  isOwn?: boolean;
  timestamp?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  showAvatar?: boolean;
  avatar?: React.ReactNode;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  className?: string;
}

export const IOSChatBubble: React.FC<IOSChatBubbleProps> = ({
  content,
  isOwn = false,
  timestamp,
  status,
  showAvatar = false,
  avatar,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  className,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [content, onCopy]);

  const bubbleStyles = isOwn
    ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
    : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-md';

  const statusIcon = status === 'read' ? (
    <CheckCheck className="w-3 h-3" />
  ) : status === 'delivered' ? (
    <CheckCheck className="w-3 h-3" />
  ) : status === 'sent' ? (
    <Check className="w-3 h-3" />
  ) : null;

  return (
    <div className={cn('flex gap-2 mb-4', isOwn && 'flex-row-reverse', className)}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0 self-end">
          {avatar}
        </div>
      )}

      {/* Message Container */}
      <div className="flex flex-col max-w-[75%]">
        {/* Bubble */}
        <div className={cn('px-4 py-2.5', bubbleStyles)}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>

        {/* Meta */}
        <div className={cn(
          'flex items-center gap-1.5 mt-1 px-1',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          {timestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timestamp}
            </span>
          )}
          {isOwn && statusIcon && (
            <span className={cn(
              'text-xs',
              status === 'read' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
            )}>
              {statusIcon}
            </span>
          )}
        </div>
      </div>

      {/* Action Menu */}
      <div className="relative self-center">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute bottom-full right-0 mb-2 w-40 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-20 ios-animate-scale-in">
              {onReply && (
                <button
                  onClick={() => {
                    onReply();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
              )}
              {onEdit && isOwn && (
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button
                onClick={() => {
                  handleCopy();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// AI Chat Bubble (specialized for AI responses)
export interface IOSAIChatBubbleProps {
  content: string;
  isStreaming?: boolean;
  timestamp?: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
  className?: string;
}

export const IOSAIChatBubble: React.FC<IOSAIChatBubbleProps> = ({
  content,
  isStreaming = false,
  timestamp,
  onCopy,
  onRegenerate,
  className,
}) => {
  const [, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [content, onCopy]);

  return (
    <div className={cn('flex gap-3 mb-4', className)}>
      {/* AI Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
      </div>

      {/* Message Container */}
      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-gray-900 dark:text-white">
            {content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-gray-400 dark:bg-gray-600 ml-1 animate-pulse" />
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          {timestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timestamp}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Copy"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {onRegenerate && !isStreaming && (
            <button
              onClick={onRegenerate}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Regenerate"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Typing Indicator
export const IOSTypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
