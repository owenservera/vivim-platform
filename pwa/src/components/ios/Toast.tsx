import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type IOSToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface IOSToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: IOSToastVariant;
  duration?: number;
  onClose?: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const IOSToast: React.FC<IOSToastProps> = ({
  id,
  title,
  description,
  variant = 'info',
  duration = 4000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.(id);
    }, 200);
  };

  const variantStyles = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-500',
      titleColor: 'text-green-900 dark:text-green-100',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-500',
      titleColor: 'text-red-900 dark:text-red-100',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-500',
      titleColor: 'text-yellow-900 dark:text-yellow-100',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-900 dark:text-blue-100',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, titleColor } = variantStyles[variant];

  return createPortal(
    <div
      className={cn(
        'fixed top-4 right-4 z-[1070] max-w-sm w-full ios-animate-slide-left',
        !isVisible && 'opacity-0',
        isLeaving && 'ios-animate-fade-out'
      )}
    >
      <div
        className={cn(
          'bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-2 p-4',
          borderColor
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn('p-1 rounded-full', bgColor)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={cn('font-semibold text-sm', titleColor)}>{title}</h4>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
            {action && (
              <button
                onClick={() => {
                  action.onClick();
                  handleClose();
                }}
                className="mt-2 text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {action.label}
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Toast Provider
interface IOSToastContextValue {
  toast: (props: Omit<IOSToastProps, 'id' | 'onClose'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const IOSToastContext = React.createContext<IOSToastContextValue | undefined>(undefined);

export const useIOSToast = () => {
  const context = React.useContext(IOSToastContext);
  if (!context) {
    throw new Error('useIOSToast must be used within IOSToastProvider');
  }
  return context;
};

export interface IOSToastProviderProps {
  children: React.ReactNode;
}

export const IOSToastProvider: React.FC<IOSToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<IOSToastProps[]>([]);

  const toast = React.useCallback((props: Omit<IOSToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...props, id }]);
    return id;
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <IOSToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}
      {toasts.map((toastProps) => (
        <IOSToast key={toastProps.id} {...toastProps} onClose={dismiss} />
      ))}
    </IOSToastContext.Provider>
  );
};

// Convenience functions
export const toast = {
  success: (title: string, description?: string) => ({
    title,
    description,
    variant: 'success' as const,
  }),
  error: (title: string, description?: string) => ({
    title,
    description,
    variant: 'error' as const,
  }),
  warning: (title: string, description?: string) => ({
    title,
    description,
    variant: 'warning' as const,
  }),
  info: (title: string, description?: string) => ({
    title,
    description,
    variant: 'info' as const,
  }),
};
