import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface IOSButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const IOSButton = forwardRef<HTMLButtonElement, IOSButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'ios-touch-feedback ios-flex-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

    const variantStyles = {
      primary: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600',
      tertiary: 'bg-transparent text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
      danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
      ghost: 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-sm rounded-lg',
      md: 'h-10 px-4 text-base rounded-xl',
      lg: 'h-12 px-6 text-lg rounded-2xl',
    };

    const disabledStyles = disabled || isLoading
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer';

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          disabledStyles,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
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
        {!isLoading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {!isLoading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

IOSButton.displayName = 'IOSButton';
