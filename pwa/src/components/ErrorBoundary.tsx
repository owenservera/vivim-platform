import React, { Component, ReactNode } from 'react';
import { useSettingsStore } from '@/stores';
import { logger } from '@/lib/logger';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

function ErrorDisplay({ error, errorInfo, onRefresh }: { error: Error | null; errorInfo: React.ErrorInfo | null; onRefresh: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Something went wrong
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          An unexpected error occurred. Please try refreshing the page.
        </p>
        {error && (
          <details className="mb-4">
            <summary className="text-xs cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
              Error details
            </summary>
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-48 text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all">
              {error.message}
              {errorInfo?.componentStack && (
                <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                  <strong>Component Stack:</strong>
                  {errorInfo.componentStack}
                </div>
              )}
            </pre>
          </details>
        )}
        <button
          onClick={onRefresh}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary', `Caught render error: ${error.message}`, error);
    
    this.setState({ errorInfo });

    // Report to error tracking service
    try {
      const settings = useSettingsStore.getState();
      const endpoint = `${settings.apiBaseUrl}/errors`;
      // Best-effort fire-and-forget error report
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          component: 'ErrorBoundary',
          category: 'react',
          message: error.message,
          stack: error.stack,
          context: {
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
          },
          severity: 'high',
        }),
      }).catch(() => { /* silently ignore network failures during error reporting */ });
    } catch (reportError) {
      logger.error('ErrorBoundary', 'Failed to report error to tracking service', reportError instanceof Error ? reportError : new Error(String(reportError)));
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          onRefresh={this.handleRefresh}
        />
      );
    }

    return this.props.children ?? null;
  }
}

export default ErrorBoundary;
