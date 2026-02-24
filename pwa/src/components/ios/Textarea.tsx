import React, { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface IOSTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const IOSTextarea = forwardRef<HTMLTextAreaElement, IOSTextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 resize-none';

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
          <textarea
            ref={ref}
            className={cn(
              baseStyles,
              errorStyles,
              disabledStyles,
              className
            )}
            disabled={disabled}
            {...props}
          />
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

IOSTextarea.displayName = 'IOSTextarea';
