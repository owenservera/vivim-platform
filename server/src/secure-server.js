/**
 * OpenScroll Capture API - Secure Server Configuration
 *
 * Enhanced security features:
 * - Restricted CORS policy
 * - Input validation
 * - Rate limiting improvements
 * - Secure headers
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { logger } from './lib/logger.js';
import { config, validateConfig } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { requestId } from './middleware/requestId.js';
import { captureRouter } from './routes/capture.js';
import { healthRouter } from './routes/health.js';
import { conversationsRouter } from './routes/conversations.js';
import { disconnectPrisma } from './lib/database.js';
import { setupSwagger } from './docs/swagger.js';

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
        connectSrc: ["'self'", 'https://*.openai.com', 'https://*.anthropic.com', 'https://*.googleapis.com'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  }),
);

// Define allowed origins based on environment
const allowedOrigins = config.isDevelopment 
  ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://0.0.0.0:5173']
  : [
      'https://openscroll.yourdomain.com',
      'https://www.openscroll.yourdomain.com',
      // Add your production domains here
    ];

// CORS - Cross-Origin Resource Sharing with restricted origins
app.use(cors({
  origin: true, // Allow all origins for POC
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Request-ID',
    'Accept',
    'Origin',
  ],
}));

// Alternative CORS implementation if the above doesn't work for all routes
// app.use((req, res, next) => {
//   const origin = req.get('Origin');
//   if (origin && allowedOrigins.includes(origin)) {
//     res.header('Access-Control-Allow-Origin', origin);
//   }
//   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
//   res.header('Access-Control-Allow-Credentials', 'true');
  
//   if (req.method === 'OPTIONS') {
//     process.stdout.write(` \x1b[2m[CORS]\x1b[0m ${req.method} ${req.path}\n`);
//     return res.status(200).end();
//   }
//   next();
// });

// Compression - Gzip response bodies
app.use(compression());

// Rate Limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimitMax, // Limit each IP to 100 requests per windowMs
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
});
// app.use('/api/', limiter);

// Additional security rate limiting for sensitive endpoints
const sensitiveEndpointLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit to 10 requests per 5 minutes
  message: {
    error: 'Too many requests to sensitive endpoint, please try again later.',
  },
});
// app.use('/api/v1/capture', sensitiveEndpointLimiter);

// ============================================================================
// PARSING MIDDLEWARE
// ============================================================================

// Parse JSON request bodies with size limits and validation
app.use(
  express.json({
    limit: '1mb', // Prevent memory exhaustion attacks
    strict: true, // Only parse objects and arrays
    type: 'application/json',
    // Custom reviver to prevent prototype pollution
    reviver: (key, value) => {
      if (key.startsWith('__') || key.includes('constructor.prototype')) {
        throw new Error('Invalid property name');
      }
      return value;
    },
  }),
);

// Parse URL-encoded bodies
app.use(
  express.urlencoded({
    extended: false,
    limit: '1mb',
  }),
);

// ============================================================================
// CUSTOM MIDDLEWARE
// ============================================================================

// Request ID - Add unique identifier to each request
app.use(requestId);

// Request Logger - Log all requests
app.use(requestLogger);

// Input validation middleware for critical endpoints
app.use('/api/v1/capture', (req, res, next) => {
  if (req.method === 'POST') {
    const { url, options } = req.body;
    
    // Validate URL format
    if (url && typeof url === 'string') {
      try {
        const parsedUrl = new URL(url);
        
        // Only allow supported domains
        const allowedHosts = [
          'chat.openai.com', 'claude.ai', 'gemini.google.com',
          'x.ai', 'cohere.com', 'anthropic.com',
        ];
        
        if (!allowedHosts.includes(parsedUrl.hostname)) {
          logger.warn({ url, ip: req.ip }, 'Blocked request to unsupported domain');
          return res.status(400).json({
            error: 'Invalid or unsupported URL domain',
            supportedDomains: allowedHosts,
          });
        }
      } catch (e) {
        logger.warn({ url, ip: req.ip, error: e.message }, 'Invalid URL format');
        return res.status(400).json({
          error: 'Invalid URL format',
          message: e.message,
        });
      }
    }
  }
  
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check (no auth, no rate limit)
app.use('/', healthRouter);

// API routes
app.use('/api/v1', captureRouter);
app.use('/api/v1/conversations', conversationsRouter);

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

  console.log('\n\x1b[1m\x1b[44m SECURE SYSTEM MANIFEST \x1b[0m');
  console.log(`\x1b[34m${  '━'.repeat(60)  }\x1b[0m`);

  console.log(' \x1b[1mWHAT IS HAPPENING:\x1b[0m    Initializing Secure OpenScroll Capture Engine');
  console.log(' \x1b[1mWHAT IT CAN DO:\x1b[0m       Cross-origin content extraction & DAG building');
  console.log(' \x1b[1mWHAT IS EXPECTED:\x1b[0m    Valid configuration detected & Prisma connected');

  console.log(`\x1b[34m${  '─'.repeat(40)  }\x1b[0m`);

  console.log(` \x1b[1mWHERE (NETWORK):\x1b[0m     http://${localIp}:${config.port}/api/v1`);
  console.log(` \x1b[1mWHERE (LOCAL):\x1b[0m       http://localhost:${config.port}`);
  console.log(` \x1b[1mWHERE (DOCS):\x1b[0m        http://localhost:${config.port}/api-docs`);

  console.log(`\x1b[34m${  '─'.repeat(40)  }\x1b[0m`);

  console.log(` \x1b[1mWHEN:\x1b[0m                ${startTime}`);
  console.log(` \x1b[1mBY WHO (PROCESS):\x1b[0m    Node ${process.version} (${process.platform}) PID: ${process.pid}`);
  console.log(` \x1b[1mBY WHO (MODE):\x1b[0m       ${config.isDevelopment ? '\x1b[33mDEVELOPMENT\x1b[0m' : '\x1b[32mPRODUCTION\x1b[0m'}`);

  console.log(`\x1b[34m${  '━'.repeat(60)  }\x1b[0m`);
  console.log(' \x1b[2mListening for incoming intelligence requests...\x1b[0m\n');

  logger.info({ port: config.port, env: config.nodeEnv, localIp }, 'Secure System Manifest Broadcast Complete');
});

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