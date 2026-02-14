import React from 'react';
import { cn } from '../../lib/utils';

export interface IOSSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const IOSSkeleton: React.FC<IOSSkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseStyles = 'bg-gray-200 dark:bg-gray-800';

  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'relative overflow-hidden',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={style}
    >
      {animation === 'wave' && (
        <div className="absolute inset-0 -translate-x-full animate-[wave_1.5s_infinite]">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent opacity-50" />
        </div>
      )}
    </div>
  );
};

// Skeleton Card Component
export interface IOSSkeletonCardProps {
  showAvatar?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showContent?: boolean;
  showFooter?: boolean;
  className?: string;
}

export const IOSSkeletonCard: React.FC<IOSSkeletonCardProps> = ({
  showAvatar = true,
  showTitle = true,
  showSubtitle = true,
  showContent = true,
  showFooter = true,
  className,
}) => {
  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-2xl p-4', className)}>
      {/* Header */}
      {showAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <IOSSkeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            {showTitle && <IOSSkeleton variant="text" width="60%" />}
            {showSubtitle && <IOSSkeleton variant="text" width="40%" />}
          </div>
        </div>
      )}

      {/* Content */}
      {showContent && (
        <div className="space-y-2 mb-4">
          <IOSSkeleton variant="text" width="100%" />
          <IOSSkeleton variant="text" width="90%" />
          <IOSSkeleton variant="text" width="80%" />
        </div>
      )}

      {/* Footer */}
      {showFooter && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
          <IOSSkeleton variant="rounded" width={80} height={32} />
          <IOSSkeleton variant="rounded" width={80} height={32} />
        </div>
      )}
    </div>
  );
};

// Skeleton List Component
export interface IOSSkeletonListProps {
  count?: number;
  showAvatar?: boolean;
  className?: string;
}

export const IOSSkeletonList: React.FC<IOSSkeletonListProps> = ({
  count = 5,
  showAvatar = true,
  className,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl">
          {showAvatar && <IOSSkeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <IOSSkeleton variant="text" width="70%" />
            <IOSSkeleton variant="text" width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Add wave animation to global styles
export const SkeletonStyles = () => (
  <style>{`
    @keyframes wave {
      100% {
        transform: translateX(100%);
      }
    }
  `}</style>
);
