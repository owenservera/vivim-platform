import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UseToastReturn {
  toasts: Toast[];
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

/**
 * Custom hook for managing toast notifications
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    duration = 4000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    const newToast: Toast = {
      id,
      type,
      message,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss toast after duration
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter(toast => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    addToast('success', message, duration);
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    addToast('error', message, duration);
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    addToast('info', message, duration);
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    addToast('warning', message, duration);
  }, [addToast]);

  return {
    toasts,
    success,
    error,
    info,
    warning,
    dismiss,
    clear,
  };
}