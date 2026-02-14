import React from 'react';
import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

export interface IOSAvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  initials?: string;
  className?: string;
  showRing?: boolean;
  ringColor?: 'blue' | 'green' | 'purple' | 'pink' | 'orange' | 'gradient';
}

export const IOSAvatar: React.FC<IOSAvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  initials,
  className,
  showRing = false,
  ringColor = 'gradient',
}) => {
  const sizeStyles = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  const ringStyles = {
    blue: 'ring-2 ring-blue-500',
    green: 'ring-2 ring-green-500',
    purple: 'ring-2 ring-purple-500',
    pink: 'ring-2 ring-pink-500',
    orange: 'ring-2 ring-orange-500',
    gradient: 'ring-2 ring-gradient',
  };

  if (src) {
    return (
      <div
        className={cn(
          'relative rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800',
          sizeStyles[size],
          showRing && ringStyles[ringColor],
          showRing && ringColor === 'gradient' && 'p-0.5',
          className
        )}
      >
        <div className={cn('w-full h-full rounded-full overflow-hidden', showRing && ringColor === 'gradient' && 'p-0.5')}>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  if (initials) {
    return (
      <div
        className={cn(
          'relative rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold flex items-center justify-center',
          sizeStyles[size],
          showRing && ringStyles[ringColor],
          showRing && ringColor === 'gradient' && 'p-0.5',
          className
        )}
      >
        <div className={cn('w-full h-full rounded-full flex items-center justify-center', showRing && ringColor === 'gradient' && 'p-0.5')}>
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center',
        sizeStyles[size],
        showRing && ringStyles[ringColor],
        showRing && ringColor === 'gradient' && 'p-0.5',
        className
      )}
    >
      <div className={cn('w-full h-full rounded-full flex items-center justify-center', showRing && ringColor === 'gradient' && 'p-0.5')}>
        <User className={cn(
          size === 'xs' && 'w-3 h-3',
          size === 'sm' && 'w-4 h-4',
          size === 'md' && 'w-5 h-5',
          size === 'lg' && 'w-6 h-6',
          size === 'xl' && 'w-8 h-8',
          size === '2xl' && 'w-10 h-10'
        )} />
      </div>
    </div>
  );
};

// Story Ring Component for Instagram-style stories
export interface IOSStoryRingProps {
  children: React.ReactNode;
  viewed?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const IOSStoryRing: React.FC<IOSStoryRingProps> = ({
  children,
  viewed = false,
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'p-0.5',
    md: 'p-0.5',
    lg: 'p-1',
    xl: 'p-1.5',
  };

  const gradientClass = viewed
    ? 'bg-gray-300 dark:bg-gray-600'
    : 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500';

  return (
    <div className={cn('rounded-full', gradientClass, sizeStyles[size])}>
      <div className="bg-white dark:bg-gray-900 rounded-full p-0.5">
        {children}
      </div>
    </div>
  );
};
