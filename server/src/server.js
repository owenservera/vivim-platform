/**
 * OpenScroll Capture API - Modernized Server (2025+)
 *
 * Features:
 * - ES Modules
 * - Structured logging (Pino)
 * - Security headers (Helmet)
 * - Rate limiting
 * - Request validation (Zod)
 * - Error handling middleware
 * - Graceful shutdown
 */

import 'dotenv/config';
console.log('DEBUG: Server.js loaded - ' + new Date().toISOString());
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { logger } from './lib/logger.js';
import { config, validateConfig } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { serverErrorReporter, errorReportingMiddleware } from './utils/server-error-reporting.js';
import { requestLogger } from './middleware/requestLogger.js';
import { requestId } from './middleware/requestId.js';
import { captureRouter } from './routes/capture.js';
import { healthRouter } from './routes/health.js';
import { conversationsRouter } from './routes/conversations.js';
import { logsRouter } from './routes/logs.js';
import identityRouter from './routes/identity.js';
import acusRouter from './routes/acus.js';
import syncRouter from './routes/sync.js';
import feedRouter from './routes/feed.js';
import { aiRouter } from './routes/ai.js';
import { aiChatRouter } from './routes/ai-chat.js';
import { aiSettingsRouter } from './routes/ai-settings.js';
import { omniRouter } from './routes/omni.js';
import { zaiMcpRouter } from './routes/zai-mcp.js';
import { createSettingsRoutes } from './routes/context-settings.ts';
import { errorsRouter } from './routes/errors.js';
import { disconnectPrisma, getPrismaClient } from './lib/database.js';
import { setupSwagger } from './docs/swagger.js';
import { logBroadcaster } from './lib/logBroadcaster.js';
import identityV2Router from './routes/identity-v2.js';
import circleRouter from './routes/circles.js';
import sharingRouter from './routes/sharing.js';
import feedV2Router from './routes/feed-v2.js';
import unifiedApiRouter from './routes/unified-api.js';
import portabilityRouter from './routes/portability.js';
import authRouter from './routes/auth.js';
import accountRouter from './routes/account.js';
import contextV2Router from './routes/context-v2.js';
import memoryRouter from './routes/memory.js';
import memorySearchRouter from './routes/memory-search.js';
import { debugRouter } from './routes/debug.js';
import { collectionsRouter } from './routes/collections.js';
import socialRouter from './routes/social.js';
import moderationRouter from './routes/moderation.js';
import adminNetworkRouter from './routes/admin/network.js';
import adminDatabaseRouter from './routes/admin/database.js';
import adminSystemRouter from './routes/admin/system.js';
import adminCrdtRouter from './routes/admin/crdt.js';
import adminPubsubRouter from './routes/admin/pubsub.js';
import adminDataflowRouter from './routes/admin/dataflow.js';

// Validate configuration on startup
try {
  validateConfig();
  logger.info('Configuration validated successfully');
} catch (error) {
  logger.error('Configuration validation failed:', error);
  process.exit(1);
}

// Initialize Express app
const app = express();

// ============================================================================
// SERVER LOG BROADCASTING
// ============================================================================
// Initialize log broadcaster to stream server logs to PWA
logBroadcaster.initialize();

// ============================================================================
// TRUSTED PROXY CONFIGURATION
// ============================================================================
// Enable when behind reverse proxy (nginx, AWS ALB, etc.)
if (config.trustProxy) {
  app.set('trust proxy', 1);
}

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet - Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS - Cross-Origin Resource Sharing (Enhanced Security)
// Use configured origins only - never allow all origins in production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // But in production, require proper CORS headers
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = config.isDevelopment
      ? [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000',
          'http://0.0.0.0:5173',
          'http://192.168.0.173:5173',
          'http://192.168.0.173:3000',
        ]
      : config.corsOrigins || [];

    // In development, also allow local network origins
    let effectiveAllowedOrigins = [...allowedOrigins];
    if (config.isDevelopment) {
      effectiveAllowedOrigins = [
        ...allowedOrigins,
        // Dynamically add any local network origin
      ];
    }

    if (effectiveAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (config.isDevelopment) {
      // In development, allow localhost and private network patterns
      const isLocalNetwork =
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.startsWith('http://172.');
      
      if (isLocalNetwork) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Production: only allow explicitly configured origins
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Requested-With',
    'X-API-Key',
    'Accept',
    'Cache-Control',
    'x-user-id',
  ],
};

app.use(cors(corsOptions));

// Custom CORS middleware for additional logging and headers
const allowedOrigins = config.isDevelopment
  ? [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://0.0.0.0:5173',
      'http://192.168.0.173:5173', // PWA on local IP
      'http://192.168.0.173:3000', // Server on local IP
    ]
  : config.corsOrigins || []; // Use configured origins, default to empty array if none provided

// Validate that production environments have specific origins configured
if (config.isProduction && allowedOrigins.length === 0) {
  logger.error('Production environment requires specific CORS origins to be configured');
  process.exit(1);
}

app.use((req, res, next) => {
  const origin = req.get('Origin');

  // Logic to allow origins:
  // 1. Explicitly allowed in allowedOrigins list
  // 2. In development, any origin that matches the local network pattern (e.g., 192.168.x.x)
  let isAllowed = false;
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      isAllowed = true;
    } else if (config.isDevelopment) {
      // Allow any local network origin in development for easier testing across devices
      const isLocalNetwork =
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.startsWith('http://172.');

      if (isLocalNetwork) {
        isAllowed = true;
      }
    }
  }

  if (isAllowed && origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (config.isDevelopment && !origin) {
    // Non-browser requests in development
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Request-ID, X-Requested-With, X-API-Key, Accept, Cache-Control'
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    if (config.isDevelopment) {
      console.log(
        `🔧 [CORS PRE-FLIGHT] ${req.method} ${req.path} - Origin: ${origin || 'none'} - Result: ${isAllowed ? '✅ ALLOWED' : '❌ BLOCKED'}`
      );
    }
    return res.status(200).end();
  }

  // Log CORS info for non-OPTIONS requests too in development
  if (origin && config.isDevelopment && !isAllowed) {
    console.log(`🌐 [CORS BLOCKED] Request from: ${origin} - Path: ${req.path}`);
  }

  next();
});

// Compression - Gzip response bodies
app.use(compression());

// Rate Limiting - Enable in both dev and production with environment-appropriate limits
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.isProduction ? (config.rateLimitMax || 100) : 1000, // Higher limit in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: '15m',
    });
  },
};

const limiter = rateLimit(rateLimitConfig);
app.use('/api/', limiter);
logger.info(`Rate limiting enabled (${config.isProduction ? 'production' : 'development'} mode: ${rateLimitConfig.max} req/15min)`);

// ============================================================================
// PARSING MIDDLEWARE
// ============================================================================

// Parse JSON request bodies
app.use(
  express.json({
    limit: '1mb', // Prevent memory exhaustion attacks
    strict: true, // Only parse objects and arrays
  })
);

// Parse URL-encoded bodies
app.use(
  express.urlencoded({
    extended: false,
    limit: '1mb',
  })
);

// ============================================================================
// SESSION & PASSPORT AUTH
// ============================================================================
import session from 'express-session';
import passport from './middleware/google-auth.js';

// Session configuration with secure defaults
const sessionSecret = process.env.SESSION_SECRET;

// Validate session secret - fail fast in production
if (!sessionSecret) {
  if (config.isProduction) {
    logger.error('SESSION_SECRET environment variable is required in production');
    process.exit(1);
  } else {
    // Generate a random secret for development convenience (sessions invalidate on restart)
    logger.warn('No SESSION_SECRET provided in development - generating random secret');
  }
}

app.use(
  session({
    secret: sessionSecret || `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: !config.isDevelopment,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Development auth bypass (must be after passport, before routes)
import { devAuthBypass, logDevAuthStatus } from './middleware/dev-auth.js';
app.use(devAuthBypass);
app.use(logDevAuthStatus);

// ============================================================================
// CUSTOM MIDDLEWARE
// ============================================================================

// Request ID - Add unique identifier to each request
app.use(requestId);

// Enhanced Request Logger - Human-readable, structured logging
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = req.id;
  const { method } = req;
  const { path } = req;
  const { ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  // Log incoming request in a human-readable format
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                        REQUEST RECEIVED                      ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(
    `║  🆔 ID:        ${requestId.substring(0, 8)}...${requestId.substring(requestId.length - 4)}`
  );
  console.log(`║  🧭 METHOD:    ${method.padEnd(10)}`);
  console.log(`║  📍 PATH:      ${path}`);
  console.log(`║  🌐 FROM:      ${ip}`);
  console.log(`║  ⏰ TIME:      ${new Date().toISOString()}`);
  console.log(
    `║  🤖 AGENT:     ${userAgent.substring(0, 40)}${userAgent.length > 40 ? '...' : ''}`
  );
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Capture the original end method to log response
  const originalEnd = res.end;
  res.end = function (chunk, encoding, callback) {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    // Determine status category for readability
    let statusCategory = 'UNKNOWN';
    if (statusCode >= 200 && statusCode < 300) {
      statusCategory = '✅ SUCCESS';
    } else if (statusCode >= 300 && statusCode < 400) {
      statusCategory = '🔄 REDIRECT';
    } else if (statusCode >= 400 && statusCode < 500) {
      statusCategory = '❌ CLIENT_ERROR';
    } else if (statusCode >= 500) {
      statusCategory = '💥 SERVER_ERROR';
    }

    // Log response in a human-readable format
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                        RESPONSE SENT                         ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(
      `║  🆔 ID:        ${requestId.substring(0, 8)}...${requestId.substring(requestId.length - 4)}`
    );
    console.log(`║  🏷️  STATUS:    ${statusCode} ${statusCategory}`);
    console.log(`║  ⏱️  DURATION:  ${duration}ms`);
    console.log(`║  📦 SIZE:      ${chunk ? Buffer.byteLength(chunk) : 0} bytes`);
    console.log(`║  🧭 METHOD:    ${method}`);
    console.log(`║  📍 PATH:      ${path}`);
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Call the original end method
    originalEnd.call(this, chunk, encoding, callback);
  };

  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check (no auth, no rate limit)
app.use('/', healthRouter);
app.use('/api/v1', healthRouter);

// API routes
app.use('/api/v1', captureRouter);
app.use('/api/v1/conversations', conversationsRouter);
app.use('/api/v1/logs', logsRouter);
app.use('/api/v1/identity', identityRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/account', accountRouter);
app.use('/api/v2/identity', identityV2Router);
app.use('/api/v2/circles', circleRouter);
app.use('/api/v2/sharing', sharingRouter);
app.use('/api/v2/feed', feedV2Router);
app.use('/api/unified', unifiedApiRouter);
app.use('/api/v2/portability', portabilityRouter);
app.use('/api/v2/moderation', moderationRouter);
app.use('/api/v1/acus', acusRouter);
app.use('/api/v1/sync', syncRouter);
app.use('/api/v1/feed', feedRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/ai/chat', aiChatRouter);
app.use('/api/v1/ai/settings', aiSettingsRouter);
app.use('/api/v1/settings', createSettingsRoutes(getPrismaClient()));
app.use('/api/v1/omni', omniRouter);
app.use('/api/v1/zai-mcp', zaiMcpRouter);
app.use('/api/v2/context', contextV2Router);
app.use('/api/v2/memories', memoryRouter);
app.use('/api/v2/memories/query', memorySearchRouter);
app.use('/api/v1/errors', errorsRouter);
app.use('/api/v1/debug', debugRouter);
app.use('/api/v1/collections', collectionsRouter);
app.use('/api/v3/social', socialRouter);
app.use('/api/v1/social', socialRouter);

// Admin routes
app.use('/api/admin/network', adminNetworkRouter);
app.use('/api/admin/database', adminDatabaseRouter);
app.use('/api/admin/system', adminSystemRouter);
app.use('/api/admin/crdt', adminCrdtRouter);
app.use('/api/admin/pubsub', adminPubsubRouter);
app.use('/api/admin/dataflow', adminDataflowRouter);

// API Documentation (Swagger)
if (config.enableSwagger) {
  setupSwagger(app);
  logger.info('Swagger UI available at /api-docs');
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    ...(config.enableSwagger && { documentationUrl: '/api-docs' }),
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// STARTUP
// ============================================================================

// Helper to get local IP
import { networkInterfaces } from 'os';

function getLocalIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4, internal (127.0.0.1), and APIPA (169.254.x.x) addresses
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const server = app.listen(config.port, '0.0.0.0', () => {
  const localIp = getLocalIp();
  const startTime = new Date().toISOString();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    VIVIM SERVER STARTED                 ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║                                                              ║');
  console.log('║  🚀 ENGINE STATUS:     OPERATIONAL                          ║');
  console.log('║  🎯 CAPABILITIES:      AI Content Capture & Knowledge Vault  ║');
  console.log('║  🔐 SECURITY LEVEL:    ENHANCED (CORS, Rate Limiting)       ║');
  console.log('║                                                              ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║                           CONNECTIONS                        ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  🌐 NETWORK ACCESS:    http://${localIp}:${config.port}/api/v1   ║`);
  console.log(`║  🏠 LOCAL ACCESS:      http://localhost:${config.port}           ║`);
  console.log(`║  📚 API DOCUMENTATION: http://localhost:${config.port}/api-docs  ║`);
  console.log('║                                                              ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║                           SYSTEM INFO                        ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  ⏱️  START TIME:        ${startTime}        ║`);
  console.log(`║  💻 PLATFORM:          Node ${process.version} (${process.platform})     ║`);
  console.log(`║  🆔 PROCESS ID:         PID: ${process.pid}                        ║`);
  console.log(
    `║  🏷️  MODE:              ${config.isDevelopment ? '🧪 DEVELOPMENT' : '🔒 PRODUCTION'}                 ║`
  );
  console.log('║                                                              ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║                    CONNECTION INSTRUCTIONS                   ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  1. PWA should connect to: http://SERVER_IP:${config.port}/api/v1  ║');
  console.log('║  2. API endpoints: /api/v1/capture, /api/v1/providers, etc.  ║');
  console.log('║  3. Documentation: http://localhost:${config.port}/api-docs        ║');
  console.log('║  4. Configure VITE_API_BASE_URL in PWA to match server URL   ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  logger.info(
    { port: config.port, env: config.nodeEnv, localIp },
    'System Manifest Broadcast Complete'
  );
});

// ============================================================================
// SOCKET SERVICE (Data Sync + Signaling)
// ============================================================================
import { socketService } from './services/socket.ts';
socketService.initialize(server);
logger.info('🔌 Socket service ready for Data Sync & P2P');

// ============================================================================
// ADMIN WEBSOCKET SERVICE
// ============================================================================
import { adminWsService } from './services/admin-ws-service.js';
adminWsService.initialize(server);
logger.info('🔌 Admin WebSocket service ready for real-time updates');

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const shutdown = async (signal) => {
  logger.info({ signal }, 'Shutdown signal received');

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    // Disconnect from database
    try {
      await disconnectPrisma();
    } catch (error) {
      logger.error({ error: error.message }, 'Error disconnecting database');
    }

    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, config.shutdownTimeout).unref();
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  shutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection');
  shutdown('UNHANDLED_REJECTION');
});

export { app, server };
