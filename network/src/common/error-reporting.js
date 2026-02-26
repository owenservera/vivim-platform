/**
 * Enhanced Centralized Error Reporting System
 * Comprehensive error reporting across PWA, Network, and Server components
 *
 * Features:
 * - Detailed error categorization and context
 * - Automatic error grouping and deduplication
 * - Performance impact tracking
 * - User journey reconstruction
 * - Real-time error alerting
 * - Service contract validation
 * - Data sync issue detection
 * - Structured error context with full request/response/sync context
 */
export const ErrorCategory = {
    NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
    CONNECTION_LOST: 'CONNECTION_LOST',
    PROTOCOL_VIOLATION: 'PROTOCOL_VIOLATION',
    DATABASE_ERROR: 'DATABASE_ERROR',
    SCHEMA_VIOLATION: 'SCHEMA_VIOLATION',
    CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
    TRANSACTION_ROLLBACK: 'TRANSACTION_ROLLBACK',
    SYNC_CONFLICT: 'SYNC_CONFLICT',
    SYNC_TIMEOUT: 'SYNC_TIMEOUT',
    VERSION_MISMATCH: 'VERSION_MISMATCH',
    CRDT_CONFLICT: 'CRDT_CONFLICT',
    CONTRACT_VIOLATION: 'CONTRACT_VIOLATION',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    AUTH_EXPIRED: 'AUTH_EXPIRED',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    EXTRACTION_FAILED: 'EXTRACTION_FAILED',
    AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
    CONTENT_PARSE_ERROR: 'CONTENT_PARSE_ERROR',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    INPUT_TOO_LARGE: 'INPUT_TOO_LARGE',
    MALFORMED_REQUEST: 'MALFORMED_REQUEST',
};
export class ErrorReporter {
    static instance;
    config;
    buffer = [];
    flushTimer;
    isReporting = false;
    errorGroups = new Map();
    errorCounts = new Map();
    alertThresholds = new Map();
    userJourney = [];
    performanceMetrics = {};
    contractRegistry = new Map();
    contractViolations = [];
    syncIssues = [];
    debugStreamListeners = [];
    correlationIdCounter = 0;
    constructor(config = {}) {
        this.config = {
            endpoint: '/api/v1/errors',
            bufferSize: 10,
            flushInterval: 5000,
            maxRetries: 3,
            enabled: true,
            sampleRate: 100,
            alertThreshold: 10,
            ...config
        };
        // Set up periodic flushing
        if (this.config.flushInterval) {
            this.flushTimer = setInterval(async () => {
                try {
                    await this.flush();
                }
                catch (e) {
                    // Silently ignore flush errors in background
                }
            }, this.config.flushInterval);
        }
        // Capture unhandled errors
        this.setupGlobalErrorHandlers();
        // Start performance monitoring
        this.startPerformanceMonitoring();
    }
    static getInstance(config) {
        if (!ErrorReporter.instance) {
            ErrorReporter.instance = new ErrorReporter(config);
        }
        return ErrorReporter.instance;
    }
    generateCorrelationId() {
        return `corr_${Date.now()}_${++this.correlationIdCounter}_${Math.random().toString(36).substr(2, 6)}`;
    }
    registerContract(contract) {
        this.contractRegistry.set(contract.id, contract);
        this.emitDebugEvent({
            eventType: 'contract_check',
            timestamp: Date.now(),
            service: 'error-reporter',
            data: { action: 'contract_registered', contractId: contract.id }
        });
    }
    getContract(contractId) {
        return this.contractRegistry.get(contractId);
    }
    getAllContracts() {
        return Array.from(this.contractRegistry.values());
    }
    validateContract(contractId, actualParams, actualResponse, responseTime) {
        const contract = this.contractRegistry.get(contractId);
        if (!contract) {
            return null;
        }
        const violations = [];
        for (const expectedParam of contract.expectedParams) {
            const actualValue = actualParams[expectedParam.name];
            if (expectedParam.required && (actualValue === undefined || actualValue === null)) {
                violations.push({
                    id: this.generateViolationId(),
                    contractId,
                    timestamp: new Date(),
                    violationType: 'param_mismatch',
                    actualRequest: actualParams,
                    expectedContract: contract,
                    deviation: `Missing required parameter: ${expectedParam.name}`,
                    severity: 'high'
                });
            }
            if (actualValue !== undefined && expectedParam.type) {
                const actualType = typeof actualValue;
                if (actualType !== expectedParam.type && !this.isTypeCoercible(actualType, expectedParam.type)) {
                    violations.push({
                        id: this.generateViolationId(),
                        contractId,
                        timestamp: new Date(),
                        violationType: 'param_mismatch',
                        actualRequest: actualParams,
                        expectedContract: contract,
                        deviation: `Parameter ${expectedParam.name} type mismatch: expected ${expectedParam.type}, got ${actualType}`,
                        severity: 'medium'
                    });
                }
            }
        }
        if (responseTime > contract.timeout) {
            violations.push({
                id: this.generateViolationId(),
                contractId,
                timestamp: new Date(),
                violationType: 'timeout',
                actualRequest: actualParams,
                actualResponse,
                expectedContract: contract,
                deviation: `Request timeout: ${responseTime}ms > ${contract.timeout}ms`,
                severity: 'medium'
            });
        }
        if (violations.length > 0) {
            const primaryViolation = violations[0];
            this.contractViolations.push(...violations);
            this.report({
                level: 'warning',
                component: 'api',
                category: 'CONTRACT_VIOLATION',
                source: 'server',
                message: `Contract violation: ${contract.serviceName} - ${primaryViolation.deviation}`,
                context: {
                    contract: {
                        contractId,
                        expectedParams: contract.expectedParams,
                        actualParams,
                        deviation: primaryViolation.deviation
                    }
                },
                severity: primaryViolation.severity
            });
            this.emitDebugEvent({
                eventType: 'contract_check',
                timestamp: Date.now(),
                service: contract.serviceName,
                data: { contractId, violations: violations.length },
                contractState: {
                    checked: this.contractRegistry.size,
                    violations: this.contractViolations.length,
                    lastViolation: primaryViolation
                }
            });
            return primaryViolation;
        }
        return null;
    }
    isTypeCoercible(actualType, expectedType) {
        const coercibleTypes = {
            number: ['string'],
            string: ['number'],
            boolean: ['string', 'number']
        };
        return coercibleTypes[expectedType]?.includes(actualType) || false;
    }
    generateViolationId() {
        return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getContractViolations(contractId) {
        if (contractId) {
            return this.contractViolations.filter(v => v.contractId === contractId);
        }
        return [...this.contractViolations];
    }
    trackSyncIssue(issue) {
        const syncIssue = {
            ...issue,
            id: `sync_issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
        };
        this.syncIssues.push(syncIssue);
        this.report({
            level: issue.issueType === 'conflict' ? 'warning' : 'error',
            component: 'sync',
            category: this.mapSyncIssueTypeToCategory(issue.issueType),
            source: 'client',
            message: `Sync issue: ${issue.issueType} - ${issue.entityType}:${issue.entityId}`,
            context: {
                sync: {
                    entityType: issue.entityType,
                    entityId: issue.entityId,
                    operation: issue.details?.operation
                }
            },
            severity: issue.issueType === 'conflict' ? 'medium' : 'high'
        });
        this.emitDebugEvent({
            eventType: 'sync_update',
            timestamp: Date.now(),
            service: 'sync',
            data: { issue: syncIssue },
            syncState: {
                pendingOperations: this.getPendingSyncOperations(),
                lastSyncTimestamp: this.getLastSyncTimestamp(),
                conflictCount: this.getConflictCount(),
                offlineQueue: this.getOfflineQueueSize()
            }
        });
        return syncIssue;
    }
    resolveSyncIssue(issueId, resolution) {
        const issue = this.syncIssues.find(i => i.id === issueId);
        if (issue) {
            issue.resolution = resolution;
            return true;
        }
        return false;
    }
    getSyncIssues(entityId) {
        if (entityId) {
            return this.syncIssues.filter(i => i.entityId === entityId);
        }
        return [...this.syncIssues];
    }
    getPendingSyncOperations() {
        return this.syncIssues.filter(i => !i.resolution).length;
    }
    getLastSyncTimestamp() {
        const resolved = this.syncIssues.filter(i => i.resolution);
        if (resolved.length === 0)
            return 0;
        return Math.max(...resolved.map(i => i.resolution.resolvedAt.getTime()));
    }
    getConflictCount() {
        return this.syncIssues.filter(i => i.issueType === 'conflict').length;
    }
    getOfflineQueueSize() {
        return this.syncIssues.filter(i => i.issueType === 'missing_data').length;
    }
    mapSyncIssueTypeToCategory(issueType) {
        const mapping = {
            conflict: 'SYNC_CONFLICT',
            divergence: 'SYNC_CONFLICT',
            missing_data: 'DATABASE_ERROR',
            order_violation: 'SYNC_CONFLICT',
            validation_failed: 'VALIDATION_FAILED'
        };
        return mapping[issueType] || 'SYNC';
    }
    addDebugStreamListener(listener) {
        this.debugStreamListeners.push(listener);
        return () => {
            this.debugStreamListeners = this.debugStreamListeners.filter(l => l !== listener);
        };
    }
    emitDebugEvent(event) {
        this.debugStreamListeners.forEach(listener => {
            try {
                listener(event);
            }
            catch (e) {
                console.error('Debug stream listener error:', e);
            }
        });
    }
    getDebugStream() {
        return [];
    }
    setupGlobalErrorHandlers() {
        // Browser environment
        // @ts-ignore - window is checked at runtime
        if (typeof window !== 'undefined') {
            // @ts-ignore
            window.addEventListener('error', (event) => {
                this.report({
                    level: 'error',
                    component: 'pwa',
                    category: 'runtime',
                    source: 'client',
                    message: event.message,
                    stack: event.error?.stack,
                    context: {
                        fileName: event.filename,
                        lineNumber: event.lineno,
                        columnNumber: event.colno,
                        userAction: this.getLastUserAction(),
                        userJourney: [...this.userJourney]
                    },
                    severity: 'high'
                });
            });
            // @ts-ignore
            window.addEventListener('unhandledrejection', (event) => {
                this.report({
                    level: 'error',
                    component: 'pwa',
                    category: 'runtime',
                    source: 'client',
                    message: `Unhandled promise rejection: ${this.extractErrorMessage(event.reason)}`,
                    stack: event.reason?.stack,
                    context: {
                        userAction: this.getLastUserAction(),
                        userJourney: [...this.userJourney]
                    },
                    severity: 'high'
                });
            });
        }
        // Node.js environment
        if (typeof process !== 'undefined') {
            process.on('uncaughtException', (error) => {
                this.report({
                    level: 'critical',
                    component: 'server',
                    category: 'runtime',
                    source: 'server',
                    message: error.message,
                    stack: error.stack,
                    context: {
                        memoryUsage: process.memoryUsage?.().heapUsed,
                        cpuUsage: process.cpuUsage ? process.cpuUsage().user : undefined
                    },
                    severity: 'critical'
                });
            });
            process.on('unhandledRejection', (reason) => {
                this.report({
                    level: 'critical',
                    component: 'server',
                    category: 'runtime',
                    source: 'server',
                    message: `Unhandled promise rejection: ${this.extractErrorMessage(reason)}`,
                    stack: reason instanceof Error ? reason.stack : undefined,
                    context: {
                        memoryUsage: process.memoryUsage?.().heapUsed
                    },
                    severity: 'critical'
                });
            });
        }
    }
    startPerformanceMonitoring() {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.performance) {
            // Monitor memory usage
            // @ts-ignore
            const perf = window.performance;
            // @ts-ignore
            if ('memory' in perf) {
                setInterval(() => {
                    // @ts-ignore
                    const memInfo = perf.memory;
                    this.performanceMetrics.memoryUsage = memInfo.usedJSHeapSize;
                    // Alert if memory usage is too high
                    if (memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.9) {
                        this.report({
                            level: 'warning',
                            component: 'pwa',
                            category: 'performance',
                            source: 'client',
                            message: 'High memory usage detected',
                            context: {
                                memoryUsage: memInfo.usedJSHeapSize,
                                memoryLimit: memInfo.jsHeapSizeLimit,
                                memoryPercent: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100
                            },
                            severity: 'medium'
                        });
                    }
                }, 30000);
            }
        }
    }
    /**
     * Report an error with comprehensive context
     */
    async report(error) {
        if (!this.config.enabled)
            return;
        // Sample rate check
        if (Math.random() * 100 > (this.config.sampleRate || 100)) {
            return;
        }
        const fingerprint = this.generateFingerprint(error);
        const errorCount = this.errorCounts.get(fingerprint) || 0;
        this.errorCounts.set(fingerprint, errorCount + 1);
        // Check if we should alert
        const shouldAlert = error.severity === 'critical' ||
            error.severity === 'fatal' ||
            errorCount >= (this.config.alertThreshold || 10);
        const report = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            fingerprint,
            shouldAlert,
            alertChannels: shouldAlert ? ['webhook'] : undefined,
            ...error,
            context: {
                ...error.context,
                version: this.config.version,
                environment: this.config.environment,
                sessionId: this.config.sessionId,
                userId: this.config.userId,
                ...this.performanceMetrics,
                ...error.context
            }
        };
        // Group related errors
        if (!this.errorGroups.has(fingerprint)) {
            this.errorGroups.set(fingerprint, []);
        }
        this.errorGroups.get(fingerprint).push(report);
        // Add to buffer
        this.buffer.push(report);
        // Flush if buffer is full
        if (this.buffer.length >= (this.config.bufferSize || 10)) {
            await this.flush();
        }
    }
    /**
     * Track user action for journey reconstruction
     */
    trackUserAction(action, metadata) {
        this.userJourney.push(`${new Date().toISOString()}: ${action}`);
        if (this.userJourney.length > 50) {
            this.userJourney.shift(); // Keep last 50 actions
        }
    }
    /**
     * Report API endpoint error with request/response context
     */
    async reportApiError(endpoint, method, statusCode, error, responseTime, additionalContext) {
        await this.report({
            level: statusCode >= 500 ? 'error' : 'warning',
            component: 'api',
            category: 'api',
            source: 'server',
            message: `API Error: ${method} ${endpoint} - ${statusCode}`,
            stack: error?.stack,
            context: {
                endpoint,
                method,
                statusCode,
                responseTime,
                userAction: this.getLastUserAction(),
                ...additionalContext
            },
            severity: statusCode >= 500 ? 'high' : 'medium'
        });
    }
    /**
     * Report database error with query context
     */
    async reportDatabaseError(operation, error, table, query, additionalContext) {
        await this.report({
            level: 'error',
            component: 'database',
            category: 'database',
            source: 'server',
            message: `Database Error: ${operation}${table ? ` on ${table}` : ''}`,
            stack: error?.stack,
            context: {
                operation,
                table,
                query,
                errorCode: error?.code,
                userAction: this.getLastUserAction(),
                ...additionalContext
            },
            severity: 'high'
        });
    }
    /**
     * Report authentication/authorization error
     */
    async reportAuthError(action, reason, error, additionalContext) {
        await this.report({
            level: 'warning',
            component: 'auth',
            category: 'authentication',
            source: 'server',
            message: `Auth Error: ${action} failed - ${reason}`,
            stack: error?.stack,
            context: {
                action,
                reason,
                userId: this.config.userId,
                ...additionalContext
            },
            severity: action === 'permission_check' ? 'low' : 'medium'
        });
    }
    /**
     * Report sync error with conflict details
     */
    async reportSyncError(operation, error, conflictDetails, additionalContext) {
        await this.report({
            level: 'error',
            component: 'sync',
            category: 'sync',
            source: 'client',
            message: `Sync Error: ${operation} failed`,
            stack: error?.stack,
            context: {
                operation,
                ...conflictDetails,
                userAction: this.getLastUserAction(),
                ...additionalContext
            },
            severity: 'high'
        });
    }
    /**
     * Report network/connection error
     */
    async reportNetworkError(operation, error, target, additionalContext) {
        await this.report({
            level: 'error',
            component: 'network',
            category: 'network',
            source: 'client',
            message: `Network Error: ${operation}${target ? ` to ${target}` : ''}`,
            stack: error?.stack,
            context: {
                operation,
                target,
                errorCode: error?.code,
                networkLatency: this.performanceMetrics.networkLatency,
                userAction: this.getLastUserAction(),
                ...additionalContext
            },
            severity: operation === 'timeout' ? 'medium' : 'high'
        });
    }
    /**
     * Report validation error with field details
     */
    async reportValidationError(resource, fields, error, additionalContext) {
        await this.report({
            level: 'warning',
            component: 'api',
            category: 'validation',
            source: 'server',
            message: `Validation Error: ${resource}`,
            stack: error?.stack,
            context: {
                resource,
                validationErrors: fields,
                userAction: this.getLastUserAction(),
                ...additionalContext
            },
            severity: 'low'
        });
    }
    /**
     * Report performance issue
     */
    async reportPerformanceIssue(metric, value, threshold, additionalContext) {
        await this.report({
            level: 'warning',
            component: 'pwa',
            category: 'performance',
            source: 'client',
            message: `Performance Issue: ${metric} exceeded threshold`,
            context: {
                metric,
                value,
                threshold,
                percentOver: ((value - threshold) / threshold) * 100,
                ...additionalContext
            },
            severity: value > threshold * 2 ? 'medium' : 'low'
        });
    }
    /**
     * Report security issue
     */
    async reportSecurityIssue(type, details, error) {
        await this.report({
            level: 'critical',
            component: 'server',
            category: 'security',
            source: 'server',
            message: `Security Issue: ${type}`,
            stack: error?.stack,
            context: {
                type,
                ...details,
                ip: details.ip,
                userAgent: details.userAgent
            },
            severity: 'critical',
            alertChannels: ['email', 'slack', 'webhook']
        });
    }
    /**
     * Flush error buffer to server
     */
    async flush() {
        if (this.buffer.length === 0 || this.isReporting)
            return;
        const reportsToSend = [...this.buffer];
        this.buffer = [];
        this.isReporting = true;
        try {
            await this.sendReports(reportsToSend);
        }
        catch (error) {
            // Only log in development mode - in production, silently fail
            if (this.config.environment === 'development') {
                console.error('Failed to send error reports:', error);
            }
            // Add failed reports back to buffer (at the beginning)
            this.buffer.unshift(...reportsToSend);
        }
        finally {
            this.isReporting = false;
        }
    }
    /**
     * Get error statistics
     */
    getStats() {
        const allErrors = [...this.buffer, ...Array.from(this.errorGroups.values()).flat()];
        const stats = {
            total: allErrors.length,
            byLevel: {},
            byComponent: {},
            byCategory: {},
            bySeverity: {},
            bySource: {},
            recent: allErrors.filter(e => new Date(e.timestamp) > new Date(Date.now() - 3600000)).length,
            trending: [],
            topErrors: []
        };
        // Count by different dimensions
        allErrors.forEach(error => {
            stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;
            stats.byComponent[error.component] = (stats.byComponent[error.component] || 0) + 1;
            stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            stats.bySource[error.source] = (stats.bySource[error.source] || 0) + 1;
        });
        // Calculate trending errors
        const fingerprintCounts = new Map();
        allErrors.forEach(error => {
            fingerprintCounts.set(error.fingerprint, (fingerprintCounts.get(error.fingerprint) || 0) + 1);
        });
        stats.trending = Array.from(fingerprintCounts.entries())
            .map(([fingerprint, count]) => ({
            fingerprint,
            count,
            growth: count / (this.errorCounts.get(fingerprint) || count)
        }))
            .sort((a, b) => b.growth - a.growth)
            .slice(0, 10);
        // Calculate top errors
        stats.topErrors = Array.from(fingerprintCounts.entries())
            .map(([fingerprint, count]) => {
            const error = allErrors.find(e => e.fingerprint === fingerprint);
            return {
                message: error?.message || 'Unknown error',
                count,
                fingerprint
            };
        })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return stats;
    }
    async sendReports(reports) {
        if (!this.config.endpoint) {
            // If no endpoint, log to console for development
            if (this.config.environment === 'development') {
                reports.forEach(report => {
                    console.error('[ERROR REPORT]', report);
                });
            }
            return;
        }
        let retries = 0;
        let success = false;
        while (retries < (this.config.maxRetries || 3) && !success) {
            try {
                const fullUrl = this.config.endpoint.startsWith('http')
                    ? this.config.endpoint
                    // @ts-ignore
                    : `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost'}${this.config.endpoint}`;
                const response = await fetch(fullUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Error-Reporting-Version': '2.0',
                        'X-Client-Version': this.config.version || 'unknown'
                    },
                    body: JSON.stringify({
                        reports,
                        metadata: {
                            clientTime: new Date().toISOString(),
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            // @ts-ignore
                            language: typeof navigator !== 'undefined' ? navigator.language : 'unknown'
                        }
                    })
                });
                if (response.ok) {
                    success = true;
                }
                else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            catch (error) {
                retries++;
                if (retries >= (this.config.maxRetries || 3)) {
                    throw error;
                }
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
            }
        }
    }
    generateFingerprint(error) {
        // Create a fingerprint based on error type, message, and location
        const components = [
            error.component,
            error.category,
            error.message.split('\n')[0].substring(0, 100), // First line, truncated
            error.context?.fileName?.split('/').pop()?.split('\\').pop(), // Just filename
            error.context?.functionName || 'unknown'
        ];
        return this.hash(components.join('|'));
    }
    hash(str) {
        // Simple hash function for fingerprinting
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    generateId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    extractErrorMessage(reason) {
        if (reason instanceof Error) {
            return reason.message;
        }
        if (typeof reason === 'string') {
            return reason;
        }
        if (reason?.message) {
            return reason.message;
        }
        return String(reason);
    }
    getLastUserAction() {
        return this.userJourney[this.userJourney.length - 1] || 'unknown';
    }
    setUserId(userId) {
        this.config.userId = userId;
    }
    setSessionId(sessionId) {
        this.config.sessionId = sessionId;
    }
    setEnabled(enabled) {
        this.config.enabled = enabled;
    }
    getVersion() {
        return this.config.version || 'unknown';
    }
    setVersion(version) {
        this.config.version = version;
    }
    getBufferCount() {
        return this.buffer.length;
    }
    async shutdown() {
        // Flush remaining errors
        await this.flush();
        // Clear timer
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
    }
}
// Helper functions for common error reporting
export const reportError = async (message, component, category, error, context, severity = 'high') => {
    const reporter = ErrorReporter.getInstance();
    await reporter.report({
        level: 'error',
        component,
        category,
        source: component === 'server' || component === 'database' ? 'server' : 'client',
        message,
        stack: error?.stack,
        context: context || {},
        severity
    });
};
export const reportWarning = async (message, component, category, context) => {
    const reporter = ErrorReporter.getInstance();
    await reporter.report({
        level: 'warning',
        component,
        category,
        source: component === 'server' || component === 'database' ? 'server' : 'client',
        message,
        context: context || {},
        severity: 'medium'
    });
};
export const reportInfo = async (message, component, category, context) => {
    const reporter = ErrorReporter.getInstance();
    await reporter.report({
        level: 'info',
        component,
        category,
        source: component === 'server' || component === 'database' ? 'server' : 'client',
        message,
        context: context || {},
        severity: 'low'
    });
};
// Singleton instance
export const errorReporter = ErrorReporter.getInstance();
//# sourceMappingURL=error-reporting.js.map