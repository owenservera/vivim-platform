import React, { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface IOSLikeButtonProps {
  liked?: boolean;
  onLike?: (liked: boolean) => void;
  count?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'filled';
}

export const IOSLikeButton: React.FC<IOSLikeButtonProps> = ({
  liked: controlledLiked,
  onLike,
  count,
  showCount = false,
  size = 'md',
  variant = 'default',
}) => {
  const [internalLiked, setInternalLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const liked = controlledLiked !== undefined ? controlledLiked : internalLiked;

  const sizeStyles = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const handleLike = useCallback(() => {
    const newLiked = !liked;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);

    if (controlledLiked === undefined) {
      setInternalLiked(newLiked);
    }
    onLike?.(newLiked);
  }, [liked, controlledLiked, onLike]);

  const handleDoubleClick = useCallback(() => {
    if (!liked) {
      handleLike();
    }
  }, [liked, handleLike]);

  const baseStyles = 'transition-all duration-200';

  const variantStyles = {
    default: liked
      ? 'text-red-500 fill-red-500'
      : 'text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400',
    minimal: liked
      ? 'text-red-500 fill-red-500'
      : 'text-gray-400 dark:text-gray-500',
    filled: liked
      ? 'bg-red-500 text-white fill-white'
      : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };

  const animationClass = isAnimating ? 'ios-animate-like-bounce' : '';

  return (
    <button
      onClick={handleLike}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'ios-flex-center gap-1.5',
        variant === 'filled' && 'rounded-full p-2',
        baseStyles,
        animationClass
      )}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <Heart
        className={cn(
          sizeStyles[size],
          variantStyles[variant],
          liked && 'fill-current'
        )}
      />
      {showCount && count !== undefined && (
        <span className={cn(
          'text-sm font-medium',
          liked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
        )}>
          {count}
        </span>
      )}
    </button>
  );
};

// Double-tap heart overlay for Instagram-style double-tap to like
export interface IOSDoubleTapHeartProps {
  visible: boolean;
  onComplete?: () => void;
}

export const IOSDoubleTapHeart: React.FC<IOSDoubleTapHeartProps> = ({
  visible,
  onComplete,
}) => {
  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none ios-animate-bounce-in">
      <div className="bg-red-500 text-white p-6 rounded-full shadow-2xl">
        <Heart className="w-16 h-16 fill-white" />
      </div>
    </div>
  );
};
