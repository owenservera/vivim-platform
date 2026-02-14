import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface IOSCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hoverable?: boolean;
  clickable?: boolean;
}

export const IOSCard = forwardRef<HTMLDivElement, IOSCardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      radius = 'lg',
      hoverable = false,
      clickable = false,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'bg-white dark:bg-gray-900 transition-all duration-200';

    const variantStyles = {
      default: '',
      elevated: 'shadow-sm',
      outlined: 'border border-gray-200 dark:border-gray-800',
      glass: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const radiusStyles = {
      sm: 'rounded-lg',
      md: 'rounded-xl',
      lg: 'rounded-2xl',
      xl: 'rounded-3xl',
      '2xl': 'rounded-[24px]',
    };

    const hoverStyles = hoverable
      ? 'hover:shadow-md hover:-translate-y-0.5'
      : '';

    const clickStyles = clickable
      ? 'cursor-pointer active:scale-[0.98]'
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          radiusStyles[radius],
          hoverStyles,
          clickStyles,
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

IOSCard.displayName = 'IOSCard';
