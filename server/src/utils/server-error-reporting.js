/**
 * Enhanced Server-Side Error Reporting Module
 * Integrates with the centralized error reporting system
 * Provides comprehensive error tracking for all server operations
 * 
 * Features:
 * - Database error context extraction
 * - Service contract violation detection
 * - Sync conflict logging
 * - Enhanced error categorization
 */

import { ErrorReporter, ErrorCategory } from '../../../common/error-reporting.js';
import { logger } from '../lib/logger.js';

export class ServerErrorReporter {
  constructor() {
    this.reporter = ErrorReporter.getInstance();
    this.requestContexts = new Map();
  }

  /**
   * Set request context for error correlation
   */
  setRequestContext(requestId, context) {
    const existing = this.requestContexts.get(requestId) || {};
    this.requestContexts.set(requestId, { ...existing, ...context });
  }

  /**
   * Clear request context after response
   */
  clearRequestContext(requestId) {
    this.requestContexts.delete(requestId);
  }

  /**
   * Get request context for error correlation
   */
  getRequestContext(requestId) {
    if (!requestId) return {};
    return this.requestContexts.get(requestId) || {};
  }

  async reportContractViolation(
    contractId,
    violationType,
    actualRequest,
    actualResponse,
    expectedContract,
    deviation,
    severity = 'medium',
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      
      await this.reporter.report({
        level: 'warning',
        component: 'api',
        category: ErrorCategory.CONTRACT_VIOLATION,
        source: 'server',
        message: `Contract violation: ${contractId} - ${violationType}`,
        context: {
          ...requestContext,
          contract: {
            contractId,
            expectedParams: expectedContract.expectedParams,
            actualParams: actualRequest,
            expectedResponse: expectedContract.expectedResponse,
            actualResponse,
            deviation
          }
        },
        severity,
        shouldAlert: severity === 'high' || severity === 'critical'
      });
      
      logger.warn({ 
        msg: `[CONTRACT_VIOLATION] ${contractId}`, 
        violationType,
        deviation,
        requestId 
      });
    } catch (reportError) {
      logger.error({ 
        msg: 'Failed to report contract violation', 
        originalError: reportError?.message 
      });
    }
  }

  async reportDatabaseErrorWithContext(
    message,
    error = null,
    context = {},
    severity = 'critical',
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      const { model, operation, table, query, duration, parameters, errorCode, constraint, pgCode } = context;
      const target = model || table || 'unknown';
      
      let category = ErrorCategory.DATABASE_ERROR;
      if (pgCode === '23505' || errorCode === 'UNIQUE_CONSTRAINT') {
        category = ErrorCategory.CONSTRAINT_VIOLATION;
      } else if (pgCode === '23503' || errorCode === 'FOREIGN_KEY_CONSTRAINT') {
        category = ErrorCategory.CONSTRAINT_VIOLATION;
      } else if (error?.message?.includes('timeout') || error?.message?.includes('canceling')) {
        category = ErrorCategory.TRANSACTION_ROLLBACK;
      }
      
      const fullMessage = `DB_FAILURE [${operation} on ${target}]: ${message}${error ? ` (${error.message})` : ''}`;
      
      await this.reporter.report({
        level: 'error',
        component: 'database',
        category,
        source: 'server',
        message: fullMessage,
        stack: error?.stack,
        context: {
          ...requestContext,
          ...context,
          operation: operation || 'unknown',
          table: target,
          query: query ? (typeof query === 'string' ? query : JSON.stringify(query)) : undefined,
          parameters,
          duration,
          errorCode: errorCode || pgCode || error?.code,
          constraint,
          database: {
            query: query ? (typeof query === 'string' ? query : JSON.stringify(query)) : undefined,
            parameters,
            errorCode: errorCode || pgCode || error?.code,
            table: target,
            constraint
          }
        },
        severity,
        shouldAlert: severity === 'critical'
      });
      
      logger.error({ 
        msg: fullMessage,
        duration: `${duration}ms`,
        query: query,
        pgCode,
        constraint,
        context: { ...requestContext, ...context }, 
        severity,
        requestId 
      });
    } catch (reportError) {
      logger.error({ msg: 'Failed to report database error with context', originalError: reportError?.message });
    }
  }

  async reportServerError(
    message,
    error = null,
    context = {},
    severity = 'high',
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      const fullMessage = error?.message ? `${message}: ${error.message}` : message;
      
      await this.reporter.report({
        level: 'error',
        component: 'server',
        category: 'runtime',
        source: 'server',
        message: fullMessage,
        stack: error?.stack,
        context: {
          ...requestContext,
          ...context,
          memoryUsage: process.memoryUsage?.().heapUsed,
          cpuUsage: process.cpuUsage ? process.cpuUsage().user : undefined,
          errorType: error?.name || 'Error'
        },
        severity,
        shouldAlert: severity === 'critical' || severity === 'fatal'
      });
      
      logger.error({ 
        msg: `[SERVER_ERROR] ${fullMessage}`, 
        error: error?.message, 
        stack: error?.stack,
        context: { ...requestContext, ...context }, 
        severity,
        requestId 
      });
    } catch (reportError) {
      logger.error({ 
        msg: 'Failed to report server error to central system', 
        originalError: reportError?.message,
        originalMessage: message 
      });
    }
  }

  async reportDatabaseError(
    message,
    error = null,
    context = {},
    severity = 'critical',
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      const { model, operation, table, query, duration } = context;
      const target = model || table || 'unknown';
      const fullMessage = `DB_FAILURE [${operation} on ${target}]: ${message}${error ? ` (${error.message})` : ''}`;
      
      await this.reporter.report({
        level: 'error',
        component: 'database',
        category: 'database',
        source: 'server',
        message: fullMessage,
        stack: error?.stack,
        context: {
          ...requestContext,
          ...context,
          operation: operation || 'unknown',
          table: target,
          query: query ? (typeof query === 'string' ? query : JSON.stringify(query)) : undefined,
          duration,
          errorCode: error?.code || context.errorCode
        },
        severity,
        shouldAlert: severity === 'critical'
      });
      
      logger.error({ 
        msg: fullMessage,
        duration: `${duration}ms`,
        query: query,
        context: { ...requestContext, ...context }, 
        severity,
        requestId 
      });
    } catch (reportError) {
      logger.error({ msg: 'Failed to report database error', originalError: reportError?.message });
    }
  }

  async reportAuthError(
    message,
    error = null,
    context = {},
    severity = 'medium',
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      
      await this.reporter.report({
        level: 'warning',
        component: 'auth',
        category: 'authentication',
        source: 'server',
        message,
        stack: error?.stack,
        context: {
          ...requestContext,
          ...context,
          action: context.action || 'permission_check',
          reason: context.reason || message,
          ip: context.ip,
          userAgent: context.userAgent
        },
        severity,
        shouldAlert: severity === 'critical'
      });
      
      logger.warn({ 
        message, 
        error: error?.message, 
        context, 
        severity,
        requestId 
      }, 'Auth error reported');
    } catch (reportError) {
      logger.error({ 
        message: 'Failed to report auth error', 
        originalError: reportError?.message 
      }, 'Error reporting failed');
    }
  }

  async reportAPIError(
    endpoint,
    method,
    statusCode,
    error = null,
    context = {},
    severity = statusCode >= 500 ? 'high' : 'medium',
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      const isBottleneck = context.responseTime > 2000;
      const bottleneckMsg = isBottleneck ? ` [SLOW: ${context.responseTime}ms]` : '';
      const fullMessage = `API_FAILURE [${method} ${endpoint}] Status: ${statusCode}${bottleneckMsg}${error ? ` - ${error.message}` : ''}`;
      
      await this.reporter.report({
        level: statusCode >= 500 ? 'error' : 'warning',
        component: 'api',
        category: 'api',
        source: 'server',
        message: fullMessage,
        stack: error?.stack,
        context: {
          ...requestContext,
          ...context,
          endpoint,
          method,
          statusCode,
          responseTime: context.responseTime,
          requestBody: context.requestBody ? (typeof context.requestBody === 'object' ? JSON.stringify(context.requestBody) : context.requestBody) : undefined,
          isSlowResponse: isBottleneck
        },
        severity,
        shouldAlert: statusCode >= 500 || isBottleneck
      });
      
      logger.error({ 
        msg: fullMessage,
        error: error?.message, 
        responseTime: context.responseTime,
        context: { ...requestContext, ...context }, 
        severity,
        requestId 
      });

      if (isBottleneck) {
        logger.warn({
          msg: `PERFORMANCE_BOTTLENECK detected at ${method} ${endpoint}`,
          duration: context.responseTime,
          requestId
        });
      }
    } catch (reportError) {
      logger.error({ msg: 'Failed to report API error', originalError: reportError?.message });
    }
  }

  async reportSyncError(
    message,
    error = null,
    context = {},
    severity = 'high',
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      
      let category = 'sync';
      if (context.conflictType === 'version_mismatch') {
        category = ErrorCategory.VERSION_MISMATCH;
      } else if (context.conflictType === 'crdt_conflict') {
        category = ErrorCategory.CRDT_CONFLICT;
      } else if (context.conflictType === 'timeout') {
        category = ErrorCategory.SYNC_TIMEOUT;
      }
      
      await this.reporter.report({
        level: 'error',
        component: 'sync',
        category,
        source: 'server',
        message,
        stack: error?.stack,
        context: {
          ...requestContext,
          ...context,
          operation: context.operation || 'unknown',
          deviceId: context.deviceId,
          localVersion: context.localVersion,
          remoteVersion: context.remoteVersion,
          conflictingFields: context.conflictingFields,
          sync: {
            entityType: context.entityType,
            entityId: context.entityId,
            operation: context.operation,
            localVersion: context.localVersion,
            remoteVersion: context.remoteVersion,
            conflictData: context.conflictData
          }
        },
        severity,
        shouldAlert: severity === 'critical'
      });
      
      logger.error({ 
        message, 
        error: error?.message, 
        context, 
        severity,
        requestId 
      }, 'Sync error reported');
    } catch (reportError) {
      logger.error({ 
        message: 'Failed to report sync error', 
        originalError: reportError?.message 
      }, 'Error reporting failed');
    }
  }

  async reportCRDTConflict(
    entityType,
    entityId,
    localState,
    remoteState,
    conflictDetails,
    resolution,
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      
      await this.reporter.report({
        level: 'warning',
        component: 'sync',
        category: ErrorCategory.CRDT_CONFLICT,
        source: 'server',
        message: `CRDT Conflict: ${entityType}:${entityId}`,
        context: {
          ...requestContext,
          sync: {
            entityType,
            entityId,
            operation: 'merge',
            localVersion: localState?.version,
            remoteVersion: remoteState?.version,
            conflictData: {
              localState,
              remoteState,
              conflictFields: conflictDetails?.conflictingFields,
              mergeStrategy: resolution?.strategy
            }
          }
        },
        severity: 'medium',
        shouldAlert: false
      });
      
      logger.warn({ 
        msg: `[CRDT_CONFLICT] ${entityType}:${entityId}`,
        localVersion: localState?.version,
        remoteVersion: remoteState?.version,
        conflictFields: conflictDetails?.conflictingFields,
        resolution: resolution?.strategy,
        requestId 
      });
    } catch (reportError) {
      logger.error({ 
        msg: 'Failed to report CRDT conflict', 
        originalError: reportError?.message 
      });
    }
  }

  trackSyncIssueViaReporter(
    issueType,
    source,
    target,
    entityType,
    entityId,
    details,
    requestId
  ) {
    try {
      this.reporter.trackSyncIssue({
        issueType,
        source,
        target,
        entityType,
        entityId,
        details
      });
    } catch (error) {
      logger.error({ 
        msg: 'Failed to track sync issue', 
        originalError: error?.message 
      });
    }
  }

  async reportValidationError(
    resource,
    fields,
    error = null,
    context = {},
    severity = 'low',
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      
      await this.reporter.report({
        level: 'warning',
        component: 'api',
        category: 'validation',
        source: 'server',
        message: `Validation Error: ${resource}`,
        stack: error?.stack,
        context: {
          ...requestContext,
          ...context,
          resource,
          validationErrors: fields,
          requestBody: context.requestBody
        },
        severity,
        shouldAlert: false
      });
      
      logger.warn({ 
        message: `Validation Error: ${resource}`,
        fields,
        context, 
        severity,
        requestId 
      }, 'Validation error reported');
    } catch (reportError) {
      logger.error({ 
        message: 'Failed to report validation error', 
        originalError: reportError?.message 
      }, 'Error reporting failed');
    }
  }

  async reportSecurityIssue(
    type,
    details,
    error,
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      
      await this.reporter.report({
        level: 'critical',
        component: 'server',
        category: 'security',
        source: 'server',
        message: `Security Issue: ${type}`,
        stack: error?.stack,
        context: {
          ...requestContext,
          ...details,
          type,
          ip: details.ip,
          userAgent: details.userAgent
        },
        severity: 'critical',
        shouldAlert: true,
        alertChannels: ['email', 'slack', 'webhook']
      });
      
      logger.error({ 
        message: `Security Issue: ${type}`,
        details,
        error: error?.message
      }, 'Security issue reported');
    } catch (reportError) {
      logger.error({ 
        message: 'Failed to report security issue', 
        originalError: reportError?.message 
      }, 'Error reporting failed');
    }
  }

  async reportPerformanceIssue(
    metric,
    value,
    threshold,
    context = {},
    severity = value > threshold * 2 ? 'medium' : 'low',
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      
      await this.reporter.report({
        level: 'warning',
        component: 'server',
        category: 'performance',
        source: 'server',
        message: `Performance Issue: ${metric}`,
        context: {
          ...requestContext,
          ...context,
          metric,
          value,
          threshold,
          percentOver: ((value - threshold) / threshold) * 100
        },
        severity,
        shouldAlert: severity === 'medium'
      });
      
      logger.warn({ 
        message: `Performance Issue: ${metric}`,
        value,
        threshold,
        context,
        severity,
        requestId 
      }, 'Performance issue reported');
    } catch (reportError) {
      logger.error({ 
        message: 'Failed to report performance issue', 
        originalError: reportError?.message 
      }, 'Error reporting failed');
    }
  }

  async reportWarning(
    message,
    context = {},
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      
      await this.reporter.report({
        level: 'warning',
        component: 'server',
        category: 'general',
        source: 'server',
        message,
        context: { ...requestContext, ...context },
        severity: 'medium',
        shouldAlert: false
      });
      
      logger.warn({ message, context, requestId }, 'Server warning reported');
    } catch (reportError) {
      logger.error({ 
        message: 'Failed to report warning', 
        originalError: reportError?.message 
      }, 'Warning reporting failed');
    }
  }

  async reportInfo(
    message,
    context = {},
    requestId
  ) {
    try {
      const requestContext = this.getRequestContext(requestId);
      
      await this.reporter.report({
        level: 'info',
        component: 'server',
        category: 'general',
        source: 'server',
        message,
        context: { ...requestContext, ...context },
        severity: 'low',
        shouldAlert: false
      });
      
      logger.info({ message, context, requestId }, 'Server info reported');
    } catch (reportError) {
      logger.error({ 
        message: 'Failed to report info', 
        originalError: reportError?.message 
      }, 'Info reporting failed');
    }
  }
}

// Singleton instance
export const serverErrorReporter = new ServerErrorReporter();

// Express middleware for automatic error reporting and context tracking
export const errorReportingMiddleware = (req, res, next) => {
  // Add request context
  const requestId = req.id || req.headers['x-request-id'];
  if (requestId) {
    serverErrorReporter.setRequestContext(requestId, {
      requestId,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || req.session?.userId
    });
  }

  // Add error reporting methods to request object
  req.errorReporter = serverErrorReporter;

  // Track response time
  const startTime = Date.now();
  
  // Override res.end to track response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding, callback) {
    const responseTime = Date.now() - startTime;
    
    // Report slow responses
    if (responseTime > 5000) { // 5 seconds threshold
      serverErrorReporter.reportPerformanceIssue(
        'response_time',
        responseTime,
        5000,
        { endpoint: req.path, method: req.method },
        'medium',
        requestId
      );
    }
    
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};

// Global error handler that reports errors with full context
export const globalErrorHandler = (err, req, res, next) => {
  const requestId = req.id || req.headers['x-request-id'];
  const responseTime = res.locals?.responseTime || 0;
  
  // Extract error information
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.id || req.session?.userId || null,
    responseTime,
    requestBody: req.body,
    query: req.query
  };

  // Determine severity based on error type and status code
  let severity = 'high';
  if (err.statusCode >= 500) {
    severity = 'critical';
  } else if (err.statusCode >= 400) {
    severity = 'medium';
  }

  // Report the error with full context
  serverErrorReporter.reportServerError(
    `Unhandled error in ${req.method} ${req.path}`,
    err,
    errorInfo,
    severity,
    requestId
  );

  // Continue with the default error handler
  next(err);
};
