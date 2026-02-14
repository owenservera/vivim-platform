import React, { createContext, useContext, type ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ToastContainer';

interface ToastContextType {
  toasts: ReturnType<typeof useToast>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast Provider Component
 * Provides toast functionality to the entire app
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const toastHook = useToast();

  return (
    <ToastContext.Provider value={{ toasts: toastHook }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/**
 * Custom hook to use toast context
 */
export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context.toasts;
};