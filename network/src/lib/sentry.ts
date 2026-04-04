/**
 * Sentry Configuration for VIVIM Network Engine
 *
 * Provides:
 * - Error tracking and reporting
 * - Performance monitoring
 * - P2P network operation tracking
 * - Release tracking
 */

import * as Sentry from '@sentry/node';

// Environment detection
const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';

// Initialize Sentry if DSN is configured
export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return null;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,

      // Environment
      environment: nodeEnv,

      // Release tracking
      release: process.env.SENTRY_RELEASE || `vivim-network@${process.env.npm_package_version || '0.1.0'}`,

      // Sampling configuration
      tracesSampleRate: isDevelopment ? 1.0 : 0.1,

      // Integrations
      integrations: [
        // HTTP request tracking
        Sentry.httpIntegration(),
        // Capture console errors
        Sentry.captureConsoleIntegration({
          levels: ['error', 'warn']
        }),
      ],

      // Before send callback to filter sensitive data
      beforeSend(event, hint) {
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
        // Ignore common network errors
        'Non-Error promise rejection captured',
        'Network request failed',
        'Connection refused',
        'ECONNREFUSED',
        // Ignore P2P specific errors that are expected
        'dial failed',
        'peer not found',
      ],

      // Attach stack traces
      attachStacktrace: true,

      // Max breadcrumbs
      maxBreadcrumbs: 50,

      // Debug mode (only in development)
      debug: isDevelopment && process.env.SENTRY_DEBUG === 'true',

      // Set initial context
      initialScope: {
        tags: {
          platform: 'network',
          component: 'p2p-engine',
        },
      },
    });

    console.log('✅ Sentry initialized successfully');
    console.log(`   Environment: ${nodeEnv}`);
    console.log(`   Release: ${process.env.SENTRY_RELEASE || 'default'}`);
    console.log(`   Traces Sample Rate: ${isDevelopment ? '100%' : '10%'}`);

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

// Initialize on import
sentryInstance = initSentry();

export default sentryInstance;
