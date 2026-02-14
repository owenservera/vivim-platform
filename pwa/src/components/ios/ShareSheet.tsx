import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IOSButton } from './Button';
import { cn } from '../../lib/utils';
import {
  MessageCircle,
  Send,
  Link as LinkIcon,
  Copy,
  MoreHorizontal,
  Instagram,
  Twitter,
  Facebook,
  Mail,
  Bookmark,
} from 'lucide-react';

export interface IOSShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  url?: string;
  text?: string;
  onShare?: (platform: string) => void;
}

export interface SharePlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const sharePlatforms: SharePlatform[] = [
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-6 h-6" />, color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500' },
  { id: 'twitter', name: 'Twitter', icon: <Twitter className="w-6 h-6" />, color: 'bg-blue-400' },
  { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-6 h-6" />, color: 'bg-blue-600' },
  { id: 'message', name: 'Message', icon: <MessageCircle className="w-6 h-6" />, color: 'bg-green-500' },
  { id: 'mail', name: 'Mail', icon: <Mail className="w-6 h-6" />, color: 'bg-blue-500' },
  { id: 'link', name: 'Copy Link', icon: <LinkIcon className="w-6 h-6" />, color: 'bg-gray-600' },
];

export const IOSShareSheet: React.FC<IOSShareSheetProps> = ({
  isOpen,
  onClose,
  title = 'Share',
  url,
  onShare,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback((platform: SharePlatform) => {
    if (platform.id === 'link' && url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      onShare?.(platform.id);
    }
  }, [url, onShare]);

  const shareActions = [
    {
      id: 'send',
      name: 'Send to...',
      icon: <Send className="w-5 h-5" />,
      color: 'bg-blue-500',
    },
    {
      id: 'copy',
      name: 'Copy',
      icon: <Copy className="w-5 h-5" />,
      color: 'bg-gray-600',
    },
    {
      id: 'save',
      name: 'Save',
      icon: <Bookmark className="w-5 h-5" />,
      color: 'bg-yellow-500',
    },
    {
      id: 'more',
      name: 'More',
      icon: <MoreHorizontal className="w-5 h-5" />,
      color: 'bg-gray-500',
    },
  ];

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[1060] flex items-end justify-center ios-animate-slide-up',
        !isOpen && 'hidden'
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm ios-animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md pb-safe">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>

        {/* Platform Grid */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {sharePlatforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleShare(platform)}
                className="flex flex-col items-center gap-2 ios-touch-feedback"
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg',
                    platform.color
                  )}
                >
                  {platform.icon}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {copied && platform.id === 'link' ? 'Copied!' : platform.name}
                </span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-1">
            {shareActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleShare({ ...action, id: action.id })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ios-touch-feedback"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-white',
                    action.color
                  )}
                >
                  {action.icon}
                </div>
                <span className="text-gray-900 dark:text-white font-medium">
                  {action.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cancel Button */}
        <div className="px-6 pb-6 pt-2">
          <IOSButton
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Cancel
          </IOSButton>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Share Button Component
export interface IOSShareButtonProps {
  onShare?: () => void;
  count?: number;
  showCount?: boolean;
  variant?: 'default' | 'minimal' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

export const IOSShareButton: React.FC<IOSShareButtonProps> = ({
  onShare,
  count,
  showCount = false,
  variant = 'default',
  size = 'md',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
    onShare?.();
  }, [onShare]);

  const sizeStyles = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const variantStyles = {
    default: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
    minimal: 'text-gray-400 dark:text-gray-500',
    filled: 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };

  const animationClass = isAnimating ? 'ios-animate-like-bounce' : '';

  return (
    <button
      onClick={handleClick}
      className={cn(
        'ios-flex-center gap-1.5',
        variant === 'filled' && 'rounded-full p-2',
        animationClass
      )}
      aria-label="Share"
    >
      <Send
        className={cn(
          sizeStyles[size],
          variantStyles[variant]
        )}
      />
      {showCount && count !== undefined && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {count}
        </span>
      )}
    </button>
  );
};

// Quick Share Menu (smaller version)
export interface IOSQuickShareProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (platform: string) => void;
  position?: { x: number; y: number };
}

export const IOSQuickShare: React.FC<IOSQuickShareProps> = ({
  isOpen,
  onClose,
  onShare,
  position = { x: 0, y: 0 },
}) => {
  if (!isOpen) return null;

  const quickPlatforms = sharePlatforms.slice(0, 4);

  return createPortal(
    <div
      className="fixed inset-0 z-[1070]"
      onClick={onClose}
    >
      <div
        className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-2"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
          transform: 'translate(-50%, -100%) translateY(-10px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-1">
          {quickPlatforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => onShare(platform.id)}
              className={cn(
                'p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ios-touch-feedback',
                platform.color
              )}
            >
              {platform.icon}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
