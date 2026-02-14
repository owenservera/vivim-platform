import React, { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface IOSInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const IOSInput = forwardRef<HTMLInputElement, IOSInputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900';

    const errorStyles = error
      ? 'border-red-500 focus:border-red-500'
      : 'border-transparent';

    const disabledStyles = disabled
      ? 'opacity-50 cursor-not-allowed'
      : '';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              baseStyles,
              errorStyles,
              disabledStyles,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors',
                onRightIconClick && 'hover:text-gray-700 dark:hover:text-gray-300'
              )}
              disabled={disabled}
            >
              {rightIcon}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

IOSInput.displayName = 'IOSInput';
