import React from 'react';
import { useToast } from '../hooks/useToast';
import { X } from 'lucide-react';

/**
 * Toast Container Component
 * Displays toast notifications managed by the useToast hook
 */
export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs w-full">
      {toasts.map((toast) => {
        let bgColor = 'bg-gray-800';
        let textColor = 'text-gray-200';
        let borderColor = 'border-gray-700';

        switch (toast.type) {
          case 'success':
            bgColor = 'bg-green-900/90';
            textColor = 'text-green-200';
            borderColor = 'border-green-700';
            break;
          case 'error':
            bgColor = 'bg-red-900/90';
            textColor = 'text-red-200';
            borderColor = 'border-red-700';
            break;
          case 'warning':
            bgColor = 'bg-yellow-900/90';
            textColor = 'text-yellow-200';
            borderColor = 'border-yellow-700';
            break;
          case 'info':
            bgColor = 'bg-blue-900/90';
            textColor = 'text-blue-200';
            borderColor = 'border-blue-700';
            break;
        }

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${bgColor} ${borderColor} ${textColor} shadow-lg backdrop-blur-sm`}
          >
            <span className="text-sm flex-1">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;