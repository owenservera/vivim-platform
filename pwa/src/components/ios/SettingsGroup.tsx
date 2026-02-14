import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronRight, ToggleLeft, ToggleRight, ArrowRight } from 'lucide-react';

export interface IOSSettingsItem {
  id: string;
  label: string;
  value?: string;
  icon?: React.ReactNode;
  type?: 'default' | 'toggle' | 'navigation' | 'action';
  disabled?: boolean;
  destructive?: boolean;
  onClick?: () => void;
  onToggle?: (value: boolean) => void;
  toggleValue?: boolean;
}

export interface IOSSettingsGroupProps {
  title?: string;
  items: IOSSettingsItem[];
  className?: string;
}

export const IOSSettingsGroup: React.FC<IOSSettingsGroupProps> = ({
  title,
  items,
  className,
}) => {
  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-2xl overflow-hidden', className)}>
      {title && (
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {items.map((item, index) => (
          <IOSSettingsItem key={item.id} item={item} isFirst={index === 0} />
        ))}
      </div>
    </div>
  );
};

interface IOSSettingsItemProps {
  item: IOSSettingsItem;
  isFirst?: boolean;
}

export const IOSSettingsItem: React.FC<IOSSettingsItemProps> = ({ item, isFirst }) => {
  const baseStyles = 'flex items-center gap-3 px-4 py-3 transition-colors';
  const enabledStyles = item.disabled
    ? 'opacity-50 cursor-not-allowed'
    : item.destructive
    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
    : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer';

  const renderRightContent = () => {
    if (item.type === 'toggle') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            item.onToggle?.(!item.toggleValue);
          }}
          disabled={item.disabled}
          className="flex-shrink-0"
        >
          {item.toggleValue ? (
            <ToggleRight className="w-11 h-6 text-green-500" />
          ) : (
            <ToggleLeft className="w-11 h-6 text-gray-400" />
          )}
        </button>
      );
    }

    if (item.type === 'navigation' || item.value) {
      return (
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.value && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {item.value}
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      );
    }

    if (item.type === 'action') {
      return (
        <ArrowRight className="w-5 h-5 text-gray-400" />
      );
    }

    return null;
  };

  return (
    <div
      onClick={() => {
        if (!item.disabled && item.type !== 'toggle') {
          item.onClick?.();
        }
      }}
      className={cn(
        baseStyles,
        enabledStyles,
        isFirst && !item.type && 'pt-4'
      )}
    >
      {item.icon && (
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          item.destructive ? 'bg-red-100 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800'
        )}>
          {item.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium',
          item.destructive ? 'text-red-500' : 'text-gray-900 dark:text-white'
        )}>
          {item.label}
        </p>
      </div>
      {renderRightContent()}
    </div>
  );
};

// Settings Page Layout
export interface IOSSettingsPageProps {
  title: string;
  groups: Array<{
    title?: string;
    items: IOSSettingsItem[];
  }>;
  footer?: React.ReactNode;
  className?: string;
}

export const IOSSettingsPage: React.FC<IOSSettingsPageProps> = ({
  title,
  groups,
  footer,
  className,
}) => {
  return (
    <div className={cn('p-4 space-y-4', className)}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
      </div>

      {/* Settings Groups */}
      {groups.map((group, index) => (
        <IOSSettingsGroup
          key={index}
          title={group.title}
          items={group.items}
        />
      ))}

      {/* Footer */}
      {footer && (
        <div className="mt-6">
          {footer}
        </div>
      )}
    </div>
  );
};

// Settings Section (iOS-style section with header)
export interface IOSSettingsSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const IOSSettingsSection: React.FC<IOSSettingsSectionProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn('mb-6', className)}>
      {(title || description) && (
        <div className="mb-3 px-1">
          {title && (
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

// Settings Action Button (for logout, delete account, etc.)
export interface IOSSettingsActionProps {
  label: string;
  destructive?: boolean;
  onClick: () => void;
  className?: string;
}

export const IOSSettingsAction: React.FC<IOSSettingsActionProps> = ({
  label,
  destructive = false,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full py-3 text-center text-sm font-medium rounded-xl transition-colors ios-touch-feedback',
        destructive
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
        className
      )}
    >
      {label}
    </button>
  );
};

// Settings Info Text (for version, copyright, etc.)
export const IOSSettingsInfo: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <p className={cn('text-xs text-center text-gray-500 dark:text-gray-400 mt-6', className)}>
      {children}
    </p>
  );
};
