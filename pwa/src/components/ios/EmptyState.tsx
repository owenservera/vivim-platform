import React from 'react';
import { cn } from '../../lib/utils';
import { Inbox, Search, FileText, MessageSquare, BookOpen, Sparkles } from 'lucide-react';

export interface IOSEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const IOSEmptyState: React.FC<IOSEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && (
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors ios-touch-feedback"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Pre-configured empty states
export const EmptyInbox: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <IOSEmptyState
    icon={<Inbox className="w-12 h-12 text-gray-400" />}
    title="No conversations yet"
    description="Start a new conversation to see it here"
    action={onAction ? { label: 'Start Conversation', onClick: onAction } : undefined}
  />
);

export const EmptySearch: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <IOSEmptyState
    icon={<Search className="w-12 h-12 text-gray-400" />}
    title="No results found"
    description="Try adjusting your search terms"
    action={onAction ? { label: 'Clear Search', onClick: onAction } : undefined}
  />
);

export const EmptyContent: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <IOSEmptyState
    icon={<FileText className="w-12 h-12 text-gray-400" />}
    title="No content yet"
    description="Content will appear here when available"
    action={onAction ? { label: 'Refresh', onClick: onAction } : undefined}
  />
);

export const EmptyMessages: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <IOSEmptyState
    icon={<MessageSquare className="w-12 h-12 text-gray-400" />}
    title="No messages yet"
    description="Send a message to start the conversation"
    action={onAction ? { label: 'Send Message', onClick: onAction } : undefined}
  />
);

export const EmptyBookmarks: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <IOSEmptyState
    icon={<BookOpen className="w-12 h-12 text-gray-400" />}
    title="No bookmarks yet"
    description="Save conversations to access them quickly"
    action={onAction ? { label: 'Explore', onClick: onAction } : undefined}
  />
);

export const EmptyAI: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <IOSEmptyState
    icon={<Sparkles className="w-12 h-12 text-gray-400" />}
    title="No AI conversations"
    description="Start chatting with AI to create your first conversation"
    action={onAction ? { label: 'Start Chat', onClick: onAction } : undefined}
  />
);

// Empty State for Cards
export interface IOSEmptyCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export const IOSEmptyCard: React.FC<IOSEmptyCardProps> = ({
  title = 'No items',
  description = 'There are no items to display',
  className,
}) => {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-800',
      className
    )}>
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <Inbox className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
};

// Empty State with Illustration
export interface IOSEmptyIllustrationProps {
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const IOSEmptyIllustration: React.FC<IOSEmptyIllustrationProps> = ({
  illustration,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      {illustration && (
        <div className="mb-6">
          {illustration}
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-base text-gray-500 dark:text-gray-400 mb-6 max-w-sm text-center">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 transition-all ios-touch-feedback"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
