import React, { useState, useEffect } from 'react';
import { getStorage } from '../../lib/storage-v2';
import { Activity, Bell, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface IOSTopBarProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export const IOSTopBar: React.FC<IOSTopBarProps> = ({
  title,
  showBackButton = false,
  onBack,
  rightAction,
  transparent = false,
}) => {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 h-14 ios-safe-top z-[1030] transition-all duration-200',
        transparent
          ? 'bg-transparent'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50'
      )}
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section */}
        <div className="flex items-center gap-2 w-24">
          {showBackButton && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ios-touch-feedback"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
          )}
          {!showBackButton && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg leading-none">V</span>
              </div>
            </div>
          )}
        </div>

        {/* Center Section - Title */}
        {title && (
          <div className="flex-1 text-center min-w-0 px-2">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h1>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center justify-end gap-2 w-24">
          {rightAction || <div className="w-8" />}
        </div>
      </div>
    </header>
  );
};

// Default Top Bar with branding and notifications
export const IOSDefaultTopBar: React.FC = () => {
  const [did, setDid] = useState<string>('');

  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const storage = getStorage();
        const identity = await storage.getIdentity();
        setDid(identity);
      } catch {
        setDid('Offline');
      }
    };
    loadIdentity();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 ios-safe-top bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 z-[1030]">
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg leading-none">V</span>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            VIVIM
          </h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            <Activity className="w-3 h-3 text-green-500 animate-pulse" />
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 hidden sm:inline-block">
              Online
            </span>
          </div>

          {/* Notifications */}
          <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative ios-touch-feedback">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
          </button>

          {/* Profile Avatar */}
          {did && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden shadow-sm">
              <span className="text-xs font-medium text-white">
                {did.slice(8, 10).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Minimal Top Bar for clean pages
export const IOSMinimalTopBar: React.FC<{ title: string }> = ({ title }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 ios-safe-top bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 z-[1030]">
      <div className="flex items-center justify-center h-full px-4 min-w-0">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {title}
        </h1>
      </div>
    </header>
  );
};
