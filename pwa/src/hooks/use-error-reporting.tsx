import { useCallback, useEffect } from 'react';
import { ErrorReporter, reportError, reportWarning, reportInfo } from '../../../../common/error-reporting';

export interface UseErrorReportingOptions {
  component?: string;
  userId?: string;
  sessionId?: string;
}

export const useErrorReporting = (options: UseErrorReportingOptions = {}) => {
  const { component = 'pwa', userId, sessionId } = options;

  // Initialize error reporter with user/session context
  useEffect(() => {
    const reporter = ErrorReporter.getInstance();
    
    if (userId) {
      reporter.setUserId(userId);
    }
    
    if (sessionId) {
      reporter.setSessionId(sessionId);
    }
  }, [userId, sessionId]);

  const reportAppError = useCallback(async (
    message: string,
    category: string,
    error?: Error | any,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ) => {
    await reportError(message, 'pwa' as const, category, error, { 
      component,
      ...context 
    }, severity);
  }, [component]);

  const reportAppWarning = useCallback(async (
    message: string,
    category: string,
    context?: Record<string, any>
  ) => {
    await reportWarning(message, 'pwa' as const, category, { 
      component,
      ...context 
    });
  }, [component]);

  const reportAppInfo = useCallback(async (
    message: string,
    category: string,
    context?: Record<string, any>
  ) => {
    await reportInfo(message, 'pwa' as const, category, { 
      component,
      ...context 
    });
  }, [component]);

  const reportSyncError = useCallback(async (
    message: string,
    error?: Error | any,
    context?: Record<string, any>
  ) => {
    await reportError(message, 'pwa' as const, 'sync', error, { 
      component,
      ...context 
    }, 'high');
  }, [component]);

  const reportAuthError = useCallback(async (
    message: string,
    error?: Error | any,
    context?: Record<string, any>
  ) => {
    await reportError(message, 'pwa' as const, 'auth', error, { 
      component,
      ...context 
    }, 'critical');
  }, [component]);

  const reportStorageError = useCallback(async (
    message: string,
    error?: Error | any,
    context?: Record<string, any>
  ) => {
    await reportError(message, 'pwa' as const, 'storage', error, { 
      component,
      ...context 
    }, 'high');
  }, [component]);

  return {
    reportAppError,
    reportAppWarning,
    reportAppInfo,
    reportSyncError,
    reportAuthError,
    reportStorageError
  };
};

// Higher-order component for automatic error reporting
export const withErrorReporting = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    const errorReporting = useErrorReporting({ component: componentName });

    useEffect(() => {
      // Set up error boundaries and error reporting for this component
      const errorHandler = (error: Error, errorInfo: React.ErrorInfo) => {
        errorReporting.reportAppError(
          `Error in ${componentName}`,
          'component',
          error,
          { errorInfo, component: componentName }
        );
      };

      // This would normally be handled by an ErrorBoundary component
      // For now, we'll just return the wrapped component
    }, [errorReporting, componentName]);

    return <WrappedComponent {...props} />;
  };
};