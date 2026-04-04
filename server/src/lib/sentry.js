import { config } from '../config/index.js';

let sentryInstance = null;
let Sentry = null;

export function getSentry() {
  return sentryInstance;
}

export default sentryInstance;

export async function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry DSN not configured. Error tracking disabled.');
    return null;
  }

  try {
    const [sentryModule, profilingModule] = await Promise.all([
      import('@sentry/node'),
      import('@sentry/profiling-node'),
    ]);
    
    Sentry = sentryModule;
    const { nodeProfilingIntegration } = profilingModule;

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: config.nodeEnv,
      release: process.env.SENTRY_RELEASE || `vivim-server@${process.env.npm_package_version || '1.0.0'}`,
      tracesSampleRate: config.isDevelopment ? 1.0 : 0.1,
      profilesSampleRate: config.isDevelopment ? 1.0 : 0.1,
      integrations: [
        nodeProfilingIntegration(),
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
        Sentry.prismaIntegration(),
      ],
      beforeSend(event) {
        if (config.isDevelopment && event.request?.url?.includes('/health')) {
          return null;
        }
        if (event.request?.headers) {
          const headers = { ...event.request.headers };
          delete headers['authorization'];
          delete headers['cookie'];
          delete headers['x-api-key'];
          delete headers['x-session-id'];
          event.request.headers = headers;
        }
        if (event.user) {
          const user = { ...event.user };
          delete user.email;
          delete user.ip_address;
          event.user = user;
        }
        return event;
      },
      beforeTransaction(transaction) {
        if (transaction.name?.includes('/health')) {
          return null;
        }
        return transaction;
      },
      ignoreErrors: [
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
        'Network request failed',
        'rate limit exceeded',
        'Too many requests',
      ],
      attachStacktrace: true,
      maxBreadcrumbs: 50,
      debug: config.isDevelopment && process.env.SENTRY_DEBUG === 'true',
    });

    sentryInstance = Sentry;
    console.log('Sentry initialized');
    return sentryInstance;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error.message);
    return null;
  }
}

initSentry();
