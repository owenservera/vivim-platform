import React, { forwardRef, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface IOSSearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClearButton?: boolean;
  placeholder?: string;
}

const IOSSearchBarComponent = forwardRef<HTMLInputElement, IOSSearchBarProps>(
  ({
    className,
    value,
    onChange,
    onClear,
    showClearButton = true,
    placeholder = 'Search...',
    ...props
  },
  ref
) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = useCallback(() => {
      if (onChange) {
        onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
      }
      onClear?.();
    }, [onChange, onClear]);

    const hasValue = value !== undefined && value !== '';

    return (
      <div
        className={cn(
          'relative flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl transition-all duration-200',
          isFocused && 'bg-white dark:bg-gray-900 ring-2 ring-blue-500',
          className
        )}
      >
        <Search className="absolute left-3 w-5 h-5 text-gray-400" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            'w-full h-10 pl-10 pr-10 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none',
            hasValue && 'pr-10'
          )}
          {...props}
        />
        {showClearButton && hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    );
  }
);

IOSSearchBarComponent.displayName = 'IOSSearchBar';

export const IOSSearchBar = IOSSearchBarComponent;

// iOS-style Search Input with Cancel Button (like iOS Safari)
export interface IOSSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  showCancel?: boolean;
  cancelText?: string;
}

export const IOSSearchInput: React.FC<IOSSearchInputProps> = ({
  value,
  onChange,
  onCancel,
  placeholder = 'Search',
  showCancel = true,
  cancelText = 'Cancel',
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const hasValue = value !== '';

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'relative flex-1 flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl transition-all duration-200',
          isFocused && 'bg-white dark:bg-gray-900 ring-2 ring-blue-500'
        )}
      >
        <Search className="absolute left-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full h-10 pl-10 pr-10 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
        />
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
      {showCancel && (isFocused || hasValue) && (
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-blue-500 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          {cancelText}
        </button>
      )}
    </div>
  );
};
