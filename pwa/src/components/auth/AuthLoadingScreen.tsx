import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface AuthLoadingScreenProps {
  message?: string;
  subMessage?: string;
  variant?: 'fullscreen' | 'overlay' | 'inline';
  showProgress?: boolean;
  progress?: number;
  stage?: 'initializing' | 'authenticating' | 'syncing' | 'loading' | 'success';
}

const stageMessages: Record<string, { title: string; subtitle: string }> = {
  initializing: {
    title: 'Initializing...',
    subtitle: 'Setting up your session',
  },
  authenticating: {
    title: 'Authenticating...',
    subtitle: 'Verifying your credentials',
  },
  syncing: {
    title: 'Syncing...',
    subtitle: 'Getting your data ready',
  },
  loading: {
    title: 'Loading...',
    subtitle: 'Just a moment',
  },
  success: {
    title: 'Ready!',
    subtitle: 'Redirecting you now',
  },
};

export function AuthLoadingScreen({
  message,
  subMessage,
  variant = 'fullscreen',
  showProgress = false,
  progress = 0,
  stage = 'loading',
}: AuthLoadingScreenProps) {
  const [dots, setDots] = useState('');
  const stageInfo = stageMessages[stage];
  const displayMessage = message || stageInfo.title;
  const displaySubMessage = subMessage || stageInfo.subtitle;

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const containerClasses = {
    fullscreen: 'fixed inset-0 z-50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900',
    overlay: 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
    inline: 'w-full h-full min-h-[200px] bg-transparent',
  };

  const contentClasses = {
    fullscreen: 'flex flex-col items-center justify-center h-full',
    overlay: 'flex flex-col items-center justify-center h-full',
    inline: 'flex flex-col items-center justify-center py-8',
  };

  return (
    <div className={cn(containerClasses[variant])}>
      <div className={cn(contentClasses[variant])}>
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          
          <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 rounded-2xl bg-blue-500/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {displayMessage}
          <span className="inline-block w-8">{dots}</span>
        </h2>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {displaySubMessage}
        </p>

        {showProgress && (
          <div className="w-64 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          {(['initializing', 'authenticating', 'syncing', 'success'] as const).map((s, i) => {
            const isActive = stage === s;
            const isPast = ['initializing', 'authenticating', 'syncing', 'success'].indexOf(stage) > i;
            
            return (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    isActive && 'bg-blue-500 scale-125',
                    isPast && 'bg-green-500',
                    !isActive && !isPast && 'bg-gray-300 dark:bg-gray-700'
                  )}
                />
                {i < 3 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 transition-all duration-300',
                      isPast ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <div className="w-8 h-8 border-3 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}

interface AccountLoadingScreenProps {
  userName?: string;
  avatarUrl?: string | null;
  variant?: 'fullscreen' | 'overlay' | 'card';
}

export function AccountLoadingScreen({
  userName,
  avatarUrl,
  variant = 'card',
}: AccountLoadingScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  if (variant === 'card') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 max-w-md w-full mx-auto">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName || 'User'}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {userName || 'Loading account'}
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading your account details{dots}
          </p>

          <div className="w-full mt-6 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4 mx-auto" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/2 mx-auto" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-2/3 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthLoadingScreen
      variant={variant}
      message={`Welcome back${userName ? `, ${userName}` : ''}`}
      subMessage="Loading your account"
      stage="loading"
    />
  );
}

export function ShimmerLoadingItem() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl overflow-hidden relative">
      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 shimmer" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 shimmer" />
      </div>
      <style>{`
        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.4) 50%,
            rgba(255,255,255,0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

export function ShimmerLoadingList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerLoadingItem key={i} />
      ))}
    </div>
  );
}

interface LoadingButtonProps {
  children: React.ReactNode;
  isLoading: boolean;
  loadingText?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function LoadingButton({
  children,
  isLoading,
  loadingText = 'Loading...',
  className = '',
  onClick,
  disabled,
}: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
        'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span>{isLoading ? loadingText : children}</span>
    </button>
  );
}
