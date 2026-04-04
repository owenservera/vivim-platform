/**
 * Sentry Configuration for VIVIM PWA
 *
 * Provides:
 * - Client-side error tracking
 * - Performance monitoring
 * - User feedback
 * - Session replay (optional)
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/react';
import { config } from '../../config/environment';

// Initialize Sentry if DSN is configured
export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.log('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return null;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,

      // Environment
      environment: import.meta.env.MODE || 'development',

      // Release tracking
      release: import.meta.env.VITE_SENTRY_RELEASE || `vivim-pwa@${import.meta.env.PACKAGE_VERSION || '1.0.0'}`,

      // Integrations
      integrations: [
        // Browser tracing for performance monitoring
        new BrowserTracing({
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            React.useLocation,
            React.useNavigationType,
            React.createRoutesFromChildren,
            React.matchRoutes
          ),
        }),
        // Capture console errors
        Sentry.captureConsoleIntegration({
          levels: ['error', 'warn']
        }),
        // Capture HTTP requests
        Sentry.httpClientIntegration(),
      ],

      // Sampling configuration
      tracesSampleRate: import.meta.env.MODE === 'development' ? 1.0 : 0.1,
      replaysSessionSampleRate: 0, // Disable session replay by default
      replaysOnErrorSampleRate: import.meta.env.MODE === 'development' ? 1.0 : 0.1,

      // Before send callback to filter sensitive data
      beforeSend(event, hint) {
        // Filter out health check errors in development
        if (import.meta.env.MODE === 'development' && event.request?.url?.includes('/health')) {
          return null;
        }

        // Remove sensitive data from request headers
        if (event.request?.headers) {
          const headers = { ...event.request.headers };
          delete headers['authorization'];
          delete headers['cookie'];
          delete headers['x-api-key'];
          delete headers['x-session-id'];
          event.request.headers = headers;
        }

        // Remove sensitive data from user context
        if (event.user) {
          const user = { ...event.user };
          delete user.email;
          delete user.ip_address;
          event.user = user;
        }

        return event;
      },

      // Filter out specific errors
      ignoreErrors: [
        // Ignore common development errors
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
        'Network request failed',
        // Ignore specific API rate limit errors
        'rate limit exceeded',
        'Too many requests',
        // Ignore React development warnings
        'Warning: ReactDOM.render is no longer supported',
      ],

      // Attach stack traces
      attachStacktrace: true,

      // Max breadcrumbs
      maxBreadcrumbs: 50,

      // Debug mode (only in development)
      debug: import.meta.env.MODE === 'development' && import.meta.env.VITE_SENTRY_DEBUG === 'true',

      // Set user context when available
      initialScope: {
        tags: {
          platform: 'pwa',
        },
      },
    });

    console.log('✅ Sentry initialized successfully');
    console.log(`   Environment: ${import.meta.env.MODE}`);
    console.log(`   Release: ${import.meta.env.VITE_SENTRY_RELEASE || 'default'}`);
    console.log(`   Traces Sample Rate: ${import.meta.env.MODE === 'development' ? '100%' : '10%'}`);

    return Sentry;
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
    return null;
  }
}

// Export Sentry instance if initialized
let sentryInstance: any = null;

export function getSentry() {
  return sentryInstance;
}

// Export performance utilities
export function startPerformanceMeasurement(name: string) {
  return Sentry.startSpan({ name, op: 'ui.interaction' }, () => {
    // Span will be automatically sent when this function completes
  });
}

// Initialize on import
sentryInstance = initSentry();

export default sentryInstance;
