/**
 * Error Classification System
 *
 * Provides granular error categorization for the VIVIM server:
 * - Level 1: System Errors (database, network, infrastructure)
 * - Level 2: Service Errors (business logic failures)
 * - Level 3: Data Errors (validation, transformation, schema)
 * - Level 4: User Errors (invalid input, missing required fields)
 * - Level 5: External Errors (provider timeouts, API failures)
 */

import { logger } from './logger.js';

/**
 * Error Level Hierarchy
 */
export const ErrorLevel = {
  SYSTEM: 1, // Database, network, infrastructure
  SERVICE: 2, // Business logic failures
  DATA: 3, // Validation, transformation, schema
  USER: 4, // Invalid input, missing fields
  EXTERNAL: 5, // Provider timeouts, API failures
};

/**
 * Error Categories
 */
export const ErrorCategory = {
  // Level 1: System
  DATABASE_CONNECTION: 'DATABASE_CONNECTION',
  DATABASE_QUERY: 'DATABASE_QUERY',
  DATABASE_CONSTRAINT: 'DATABASE_CONSTRAINT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  MEMORY_ERROR: 'MEMORY_ERROR',
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR',

  // Level 2: Service
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  CACHE_ERROR: 'CACHE_ERROR',

  // Level 3: Data
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SCHEMA_ERROR: 'SCHEMA_ERROR',
  TRANSFORMATION_ERROR: 'TRANSFORMATION_ERROR',
  SERIALIZATION_ERROR: 'SERIALIZATION_ERROR',

  // Level 4: User
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',

  // Level 5: External
  PROVIDER_TIMEOUT: 'PROVIDER_TIMEOUT',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  API_ERROR: 'API_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
};

/**
 * Severity Levels
 */
export const Severity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

/**
 * Maps error types to categories
 */
const errorTypeMap = {
  // Database errors
  P1001: {
    category: ErrorCategory.DATABASE_CONNECTION,
    level: ErrorLevel.SYSTEM,
    severity: Severity.CRITICAL,
  },
  P1002: {
    category: ErrorCategory.DATABASE_QUERY,
    level: ErrorLevel.SYSTEM,
    severity: Severity.HIGH,
  },
  P2001: {
    category: ErrorCategory.DATABASE_CONSTRAINT,
    level: ErrorLevel.SYSTEM,
    severity: Severity.HIGH,
  },
  P2002: {
    category: ErrorCategory.DATABASE_CONSTRAINT,
    level: ErrorLevel.SYSTEM,
    severity: Severity.HIGH,
  },
  P2003: {
    category: ErrorCategory.DATABASE_CONSTRAINT,
    level: ErrorLevel.SYSTEM,
    severity: Severity.HIGH,
  },
  P2025: { category: ErrorCategory.NOT_FOUND, level: ErrorLevel.USER, severity: Severity.LOW },

  // Network errors
  ECONNREFUSED: {
    category: ErrorCategory.NETWORK_ERROR,
    level: ErrorLevel.SYSTEM,
    severity: Severity.CRITICAL,
  },
  ETIMEDOUT: {
    category: ErrorCategory.NETWORK_ERROR,
    level: ErrorLevel.SYSTEM,
    severity: Severity.HIGH,
  },
  ENOTFOUND: {
    category: ErrorCategory.NETWORK_ERROR,
    level: ErrorLevel.SYSTEM,
    severity: Severity.HIGH,
  },

  // Validation errors
  VALIDATION_ERROR: {
    category: ErrorCategory.VALIDATION_ERROR,
    level: ErrorLevel.DATA,
    severity: Severity.MEDIUM,
  },
  SCHEMA_ERROR: {
    category: ErrorCategory.SCHEMA_ERROR,
    level: ErrorLevel.DATA,
    severity: Severity.MEDIUM,
  },

  // Auth errors
  UNAUTHORIZED: {
    category: ErrorCategory.UNAUTHORIZED,
    level: ErrorLevel.USER,
    severity: Severity.MEDIUM,
  },
  FORBIDDEN: {
    category: ErrorCategory.FORBIDDEN,
    level: ErrorLevel.USER,
    severity: Severity.MEDIUM,
  },

  // External errors
  PROVIDER_TIMEOUT: {
    category: ErrorCategory.PROVIDER_TIMEOUT,
    level: ErrorLevel.EXTERNAL,
    severity: Severity.HIGH,
  },
  PROVIDER_ERROR: {
    category: ErrorCategory.PROVIDER_ERROR,
    level: ErrorLevel.EXTERNAL,
    severity: Severity.MEDIUM,
  },
};

/**
 * Classify an error based on its properties
 * @param {Error} error - The error to classify
 * @param {Object} context - Additional context about the error
 * @returns {Object} Classified error information
 */
export function classifyError(error, context = {}) {
  const errorCode = error?.code || error?.name || context?.errorCode;
  const errorMessage = error?.message || '';
  const errorStack = error?.stack || '';

  // Check error code map
  const mapped = errorTypeMap[errorCode];
  if (mapped) {
    return {
      ...mapped,
      errorCode,
      message: errorMessage,
      stack: errorStack,
      context,
    };
  }

  // Pattern-based classification
  const patterns = [
    // Database patterns
    {
      pattern: /prisma|database|postgres|pg/i,
      category: ErrorCategory.DATABASE_QUERY,
      level: ErrorLevel.SYSTEM,
    },
    {
      pattern: /connection|pool/i,
      category: ErrorCategory.DATABASE_CONNECTION,
      level: ErrorLevel.SYSTEM,
    },
    {
      pattern: /unique.*constraint|duplicate.*key|violates.*constraint/i,
      category: ErrorCategory.DATABASE_CONSTRAINT,
      level: ErrorLevel.SYSTEM,
    },

    // Network patterns
    {
      pattern: /timeout|timed?out/i,
      category: ErrorCategory.NETWORK_ERROR,
      level: ErrorLevel.SYSTEM,
    },
    {
      pattern: /ECONNREFUSED|connection.*refused/i,
      category: ErrorCategory.NETWORK_ERROR,
      level: ErrorLevel.SYSTEM,
    },
    {
      pattern: /fetch|axios|request.*fail/i,
      category: ErrorCategory.NETWORK_ERROR,
      level: ErrorLevel.EXTERNAL,
    },

    // Validation patterns
    {
      pattern: /validation|invalid.*input|schema|zod/i,
      category: ErrorCategory.VALIDATION_ERROR,
      level: ErrorLevel.DATA,
    },
    { pattern: /required|missing/i, category: ErrorCategory.MISSING_FIELD, level: ErrorLevel.USER },

    // Auth patterns
    {
      pattern: /unauthorized|auth.*fail|invalid.*token/i,
      category: ErrorCategory.UNAUTHORIZED,
      level: ErrorLevel.USER,
    },
    {
      pattern: /forbidden|permission|access.*denied/i,
      category: ErrorCategory.FORBIDDEN,
      level: ErrorLevel.USER,
    },

    // Provider patterns
    {
      pattern: /provider|extractor|chatgpt|claude|gemini/i,
      category: ErrorCategory.PROVIDER_ERROR,
      level: ErrorLevel.EXTERNAL,
    },
    {
      pattern: /rate.*limit|429/i,
      category: ErrorCategory.EXTERNAL_SERVICE_ERROR,
      level: ErrorLevel.EXTERNAL,
      severity: Severity.MEDIUM,
    },

    // Service patterns
    {
      pattern: /service.*unavailable|503/i,
      category: ErrorCategory.SERVICE_UNAVAILABLE,
      level: ErrorLevel.SERVICE,
    },
    {
      pattern: /transaction|rollback/i,
      category: ErrorCategory.TRANSACTION_FAILED,
      level: ErrorLevel.SERVICE,
    },
  ];

  for (const { pattern, category, level, severity } of patterns) {
    if (pattern.test(errorMessage) || pattern.test(errorStack)) {
      return {
        category,
        level,
        severity: severity || getDefaultSeverity(level),
        errorCode,
        message: errorMessage,
        stack: errorStack,
        context,
      };
    }
  }

  // Default classification
  return {
    category: ErrorCategory.BUSINESS_LOGIC_ERROR,
    level: ErrorLevel.SERVICE,
    severity: Severity.MEDIUM,
    errorCode,
    message: errorMessage,
    stack: errorStack,
    context,
  };
}

/**
 * Get default severity based on error level
 */
function getDefaultSeverity(level) {
  switch (level) {
    case ErrorLevel.SYSTEM:
      return Severity.HIGH;
    case ErrorLevel.SERVICE:
      return Severity.MEDIUM;
    case ErrorLevel.DATA:
      return Severity.MEDIUM;
    case ErrorLevel.USER:
      return Severity.LOW;
    case ErrorLevel.EXTERNAL:
      return Severity.MEDIUM;
    default:
      return Severity.MEDIUM;
  }
}

/**
 * Get human-readable error level name
 */
export function getErrorLevelName(level) {
  const names = {
    [ErrorLevel.SYSTEM]: 'System',
    [ErrorLevel.SERVICE]: 'Service',
    [ErrorLevel.DATA]: 'Data',
    [ErrorLevel.USER]: 'User',
    [ErrorLevel.EXTERNAL]: 'External',
  };
  return names[level] || 'Unknown';
}

/**
 * Determine if error should trigger an alert
 */
export function shouldAlert(classifiedError) {
  const { severity, level } = classifiedError;

  // Critical errors always alert
  if (severity === Severity.CRITICAL) return true;

  // System errors of high severity alert
  if (level === ErrorLevel.SYSTEM && severity === Severity.HIGH) return true;

  // Database connection errors always alert
  if (classifiedError.category === ErrorCategory.DATABASE_CONNECTION) return true;

  return false;
}

/**
 * Format error for logging
 */
export function formatErrorForLog(classifiedError, requestId = null) {
  const { category, level, severity, message, errorCode, context } = classifiedError;

  return {
    requestId,
    error: {
      category,
      level: getErrorLevelName(level),
      severity,
      code: errorCode,
      message,
    },
    context: {
      ...context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
  };
}

export default {
  ErrorLevel,
  ErrorCategory,
  Severity,
  classifyError,
  getErrorLevelName,
  shouldAlert,
  formatErrorForLog,
};
