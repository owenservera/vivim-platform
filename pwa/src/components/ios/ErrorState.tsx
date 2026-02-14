import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, WifiOff, RefreshCw, XCircle, AlertTriangle } from 'lucide-react';

export type IOSErrorType = 'network' | 'server' | 'not-found' | 'permission' | 'generic';

export interface IOSErrorStateProps {
  type?: IOSErrorType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const IOSErrorState: React.FC<IOSErrorStateProps> = ({
  type = 'generic',
  title,
  description,
  action,
  className,
}) => {
  const errorConfig = {
    network: {
      icon: <WifiOff className="w-12 h-12" />,
      defaultTitle: 'No internet connection',
      defaultDescription: 'Please check your internet connection and try again',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    server: {
      icon: <XCircle className="w-12 h-12" />,
      defaultTitle: 'Server error',
      defaultDescription: 'Something went wrong on our end. Please try again later',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    'not-found': {
      icon: <AlertCircle className="w-12 h-12" />,
      defaultTitle: 'Not found',
      defaultDescription: 'The item you are looking for could not be found',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    permission: {
      icon: <AlertTriangle className="w-12 h-12" />,
      defaultTitle: 'Access denied',
      defaultDescription: 'You do not have permission to access this content',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    generic: {
      icon: <AlertCircle className="w-12 h-12" />,
      defaultTitle: 'Something went wrong',
      defaultDescription: 'An unexpected error occurred. Please try again',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  };

  const config = errorConfig[type];

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className={cn('mb-4 p-4 rounded-full', config.bgColor)}>
        <div className={config.color}>
          {config.icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
        {description || config.defaultDescription}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors ios-touch-feedback flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
};

// Pre-configured error states
export const ErrorNetwork: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <IOSErrorState
    type="network"
    action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
  />
);

export const ErrorServer: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <IOSErrorState
    type="server"
    action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
  />
);

export const ErrorNotFound: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <IOSErrorState
    type="not-found"
    action={onAction ? { label: 'Go Back', onClick: onAction } : undefined}
  />
);

export const ErrorPermission: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <IOSErrorState
    type="permission"
    action={onAction ? { label: 'Go Back', onClick: onAction } : undefined}
  />
);

// Error Card for inline display
export interface IOSErrorCardProps {
  type?: IOSErrorType;
  title?: string;
  description?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const IOSErrorCard: React.FC<IOSErrorCardProps> = ({
  type = 'generic',
  title,
  description,
  onDismiss,
  onRetry,
  className,
}) => {
  const errorConfig = {
    network: {
      icon: <WifiOff className="w-5 h-5" />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    server: {
      icon: <XCircle className="w-5 h-5" />,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    'not-found': {
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      borderColor: 'border-gray-200 dark:border-gray-800',
    },
    permission: {
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    generic: {
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  };

  const config = errorConfig[type];
  const defaultTitle = type === 'network' ? 'No internet connection'
    : type === 'server' ? 'Server error'
    : type === 'not-found' ? 'Not found'
    : type === 'permission' ? 'Access denied'
    : 'Something went wrong';

  const defaultDescription = type === 'network' ? 'Please check your internet connection'
    : type === 'server' ? 'Something went wrong on our end'
    : type === 'not-found' ? 'The item could not be found'
    : type === 'permission' ? 'You do not have permission'
    : 'An unexpected error occurred';

  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 rounded-2xl p-4 border-2',
      config.borderColor,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg flex-shrink-0', config.bgColor)}>
          <div className={config.color}>
            {config.icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {title || defaultTitle}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {description || defaultDescription}
          </p>
          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors ios-touch-feedback flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors ios-touch-feedback"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Inline Error Banner
export interface IOSErrorBannerProps {
  type?: IOSErrorType;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const IOSErrorBanner: React.FC<IOSErrorBannerProps> = ({
  type = 'generic',
  message,
  onDismiss,
  className,
}) => {
  const errorConfig = {
    network: {
      icon: <WifiOff className="w-4 h-4" />,
      color: 'text-orange-700 dark:text-orange-300',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    server: {
      icon: <XCircle className="w-4 h-4" />,
      color: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    'not-found': {
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      borderColor: 'border-gray-200 dark:border-gray-700',
    },
    permission: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-yellow-700 dark:text-yellow-300',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    generic: {
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  };

  const config = errorConfig[type];

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className={config.color}>
        {config.icon}
      </div>
      <p className={cn('text-sm flex-1', config.color)}>
        {message}
      </p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn('p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors', config.color)}
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
