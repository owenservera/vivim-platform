/**
 * Configuration Management
 */

import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.number().min(1).max(65535).default(3000),
  trustProxy: z.boolean().default(false),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  logFormat: z.enum(['json', 'pretty']).default('json'),
  corsOrigins: z.array(z.string()).default(['*']),
  rateLimitMax: z.number().min(1).default(100),
  databaseUrl: z.string().optional(),
  shutdownTimeout: z.number().min(1000).default(30000),
  enableSwagger: z.boolean().default(false),
  browserWsEndpoint: z.string().optional(),
  skipAuthForDevelopment: z.boolean().default(false),
});

function loadConfig() {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    trustProxy: process.env.TRUST_PROXY === 'true',
    logLevel: process.env.LOG_LEVEL,
    logFormat: process.env.LOG_FORMAT,
    corsOrigins: process.env.CORS_ORIGINS?.split(',').map(s => s.trim()),
    rateLimitMax: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : undefined,
    databaseUrl: process.env.DATABASE_URL,
    shutdownTimeout: process.env.SHUTDOWN_TIMEOUT ? parseInt(process.env.SHUTDOWN_TIMEOUT, 10) : undefined,
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    browserWsEndpoint: process.env.BROWSER_WS_ENDPOINT,
    skipAuthForDevelopment: process.env.SKIP_AUTH_FOR_DEVELOPMENT === 'true',
  };
  return configSchema.parse(rawConfig);
}

export const config = loadConfig();
export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';
config.isDevelopment = isDevelopment;
config.isProduction = isProduction;
config.isTest = isTest;

export function validateConfig() {
  const errors = [];

  // Production-specific validations
  if (isProduction) {
    // Database URL validation
    if (!config.databaseUrl) {
      errors.push('DATABASE_URL is required in production');
    } else {
      // Validate database URL format and security
      try {
        const dbUrl = new URL(config.databaseUrl);
        if (dbUrl.protocol !== 'postgresql:' && dbUrl.protocol !== 'postgres:') {
          errors.push('DATABASE_URL must use postgresql: or postgres: protocol in production');
        }
        // Check if SSL is enabled for production
        if (!config.databaseUrl.includes('sslmode=require') &&
            !config.databaseUrl.includes('ssl=true')) {
          console.warn('WARNING: SSL is not enabled for database connection in production');
        }
      } catch (e) {
        errors.push('DATABASE_URL is not a valid URL format');
      }
    }

    // CORS validation
    if (!config.corsOrigins || config.corsOrigins.length === 0) {
      errors.push('CORS_ORIGINS must be specified in production');
    } else if (config.corsOrigins.includes('*')) {
      errors.push('CORS_ORIGINS should be specific origins, not wildcard (*) in production');
    } else {
      // Validate each origin is a proper URL
      for (const origin of config.corsOrigins) {
        try {
          new URL(origin);
        } catch (e) {
          errors.push(`Invalid CORS origin URL: ${origin}`);
        }
      }
    }

    // Security validations
    if (config.enableSwagger) {
      console.warn('WARNING: Swagger UI is enabled in production. This may expose API documentation publicly.');
    }

    // Rate limiting should be more restrictive in production
    if (config.rateLimitMax > 1000) {
      console.warn('WARNING: Rate limit is set very high for production. Consider reducing RATE_LIMIT_MAX.');
    }

    // Log level validation
    if (config.logLevel === 'debug') {
      console.warn('WARNING: Debug logging is enabled in production. This may expose sensitive information.');
    }
  }

  // Development-specific validations
  if (isDevelopment) {
    if (config.rateLimitMax < 100) {
      console.warn('INFO: Rate limit is low for development. Consider increasing RATE_LIMIT_MAX.');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
  return true;
}

export default config;
