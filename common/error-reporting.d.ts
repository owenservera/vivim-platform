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
export type ErrorCategory = 'NETWORK_TIMEOUT' | 'CONNECTION_LOST' | 'PROTOCOL_VIOLATION' | 'DATABASE_ERROR' | 'SCHEMA_VIOLATION' | 'CONSTRAINT_VIOLATION' | 'TRANSACTION_ROLLBACK' | 'SYNC_CONFLICT' | 'SYNC_TIMEOUT' | 'VERSION_MISMATCH' | 'CRDT_CONFLICT' | 'CONTRACT_VIOLATION' | 'SERVICE_UNAVAILABLE' | 'RATE_LIMIT_EXCEEDED' | 'AUTH_EXPIRED' | 'PERMISSION_DENIED' | 'TOKEN_INVALID' | 'EXTRACTION_FAILED' | 'AI_PROVIDER_ERROR' | 'CONTENT_PARSE_ERROR' | 'VALIDATION_FAILED' | 'INPUT_TOO_LARGE' | 'MALFORMED_REQUEST';
export declare const ErrorCategory: {
    readonly NETWORK_TIMEOUT: "NETWORK_TIMEOUT";
    readonly CONNECTION_LOST: "CONNECTION_LOST";
    readonly PROTOCOL_VIOLATION: "PROTOCOL_VIOLATION";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly SCHEMA_VIOLATION: "SCHEMA_VIOLATION";
    readonly CONSTRAINT_VIOLATION: "CONSTRAINT_VIOLATION";
    readonly TRANSACTION_ROLLBACK: "TRANSACTION_ROLLBACK";
    readonly SYNC_CONFLICT: "SYNC_CONFLICT";
    readonly SYNC_TIMEOUT: "SYNC_TIMEOUT";
    readonly VERSION_MISMATCH: "VERSION_MISMATCH";
    readonly CRDT_CONFLICT: "CRDT_CONFLICT";
    readonly CONTRACT_VIOLATION: "CONTRACT_VIOLATION";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly AUTH_EXPIRED: "AUTH_EXPIRED";
    readonly PERMISSION_DENIED: "PERMISSION_DENIED";
    readonly TOKEN_INVALID: "TOKEN_INVALID";
    readonly EXTRACTION_FAILED: "EXTRACTION_FAILED";
    readonly AI_PROVIDER_ERROR: "AI_PROVIDER_ERROR";
    readonly CONTENT_PARSE_ERROR: "CONTENT_PARSE_ERROR";
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly INPUT_TOO_LARGE: "INPUT_TOO_LARGE";
    readonly MALFORMED_REQUEST: "MALFORMED_REQUEST";
};
export type ErrorLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type ErrorComponent = 'pwa' | 'network' | 'server' | 'shared' | 'api' | 'database' | 'auth' | 'sync';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical' | 'fatal';
export type ErrorSource = 'client' | 'server' | 'network' | 'third-party';
export interface ParamSchema {
    name: string;
    type: string;
    required: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    enum?: any[];
}
export interface ResponseSchema {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
}
export interface ServiceContract {
    id: string;
    serviceName: string;
    endpoint: string;
    contractVersion: string;
    expectedParams: ParamSchema[];
    expectedResponse: ResponseSchema;
    timeout: number;
    createdAt: Date;
    updatedAt: Date;
}
export type ViolationType = 'param_mismatch' | 'response_schema_error' | 'timeout' | 'unavailable';
export interface ContractViolation {
    id: string;
    contractId: string;
    timestamp: Date;
    violationType: ViolationType;
    actualRequest?: any;
    actualResponse?: any;
    expectedContract: ServiceContract;
    deviation?: string;
    severity: ErrorSeverity;
}
export type SyncIssueType = 'conflict' | 'divergence' | 'missing_data' | 'order_violation' | 'validation_failed';
export type SyncSource = 'server' | 'pwa' | 'network' | 'database';
export type SyncTarget = 'server' | 'pwa' | 'network' | 'database';
export type EntityType = 'conversation' | 'message' | 'acu' | 'user' | 'circle';
export type SyncResolutionStrategy = 'server_wins' | 'client_wins' | 'merge' | 'manual' | 'rejected';
export interface SyncIssue {
    id: string;
    issueType: SyncIssueType;
    source: SyncSource;
    target: SyncTarget;
    entityType: EntityType;
    entityId: string;
    timestamp: Date;
    details?: Record<string, any>;
    resolution?: SyncResolution;
}
export interface SyncResolution {
    strategy: SyncResolutionStrategy;
    resolutionData?: any;
    resolvedAt: Date;
    resolvedBy: 'system' | 'user';
}
export type DebugEventType = 'error' | 'warning' | 'info' | 'sync_update' | 'contract_check' | 'performance';
export interface DebugStreamEvent {
    eventType: DebugEventType;
    timestamp: number;
    service: string;
    data: any;
    syncState?: {
        pendingOperations: number;
        lastSyncTimestamp: number;
        conflictCount: number;
        offlineQueue: number;
    };
    contractState?: {
        checked: number;
        violations: number;
        lastViolation?: ContractViolation;
    };
    performance?: {
        duration: number;
        memoryDelta: number;
        cpuEstimate?: number;
    };
}
export interface EnhancedErrorContext {
    requestId?: string;
    flowId?: string;
    correlationId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    responseTime?: number;
    duration?: number;
    userId?: string;
    sessionId?: string;
    deviceId?: string;
    userAction?: string;
    userJourney?: string[];
    componentName?: string;
    functionName?: string;
    lineNumber?: number;
    columnNumber?: number;
    fileName?: string;
    environment?: string;
    version?: string;
    build?: string;
    metadata?: Record<string, any>;
    tags?: string[];
    memoryUsage?: number;
    cpuUsage?: number;
    networkLatency?: number;
    cause?: string;
    correlatedErrors?: string[];
    flowSteps?: string[];
    currentStep?: string;
    isRetry?: boolean;
    retryCount?: number;
    sync?: {
        entityType: string;
        entityId: string;
        operation: 'create' | 'update' | 'delete';
        localVersion?: number;
        remoteVersion?: number;
        conflictData?: any;
    };
    database?: {
        query?: string;
        parameters?: any[];
        errorCode?: string;
        table?: string;
        constraint?: string;
    };
    contract?: {
        contractId: string;
        expectedParams?: any;
        actualParams?: any;
        expectedResponse?: any;
        actualResponse?: any;
        deviation?: string;
    };
    debug?: {
        localStorage?: Record<string, any>;
        sessionStorage?: Record<string, any>;
        cookies?: Record<string, any>;
        recentActions?: string[];
        consoleErrors?: string[];
    };
}
export interface EnhancedErrorReport {
    id: string;
    timestamp: string;
    level: ErrorLevel;
    component: ErrorComponent;
    category: ErrorCategory;
    source: ErrorSource;
    message: string;
    stack?: string;
    context: EnhancedErrorContext;
    severity: ErrorSeverity;
    fingerprint: string;
    groupId?: string;
    shouldAlert: boolean;
    alertChannels?: ('email' | 'slack' | 'webhook' | 'sms')[];
    resolved?: boolean;
    resolvedAt?: string;
    resolution?: string;
}
export type ErrorContext = EnhancedErrorContext;
export interface ErrorContextLegacy {
    requestId?: string;
    flowId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    responseTime?: number;
    duration?: number;
    userId?: string;
    sessionId?: string;
    deviceId?: string;
    userAction?: string;
    userJourney?: string[];
    componentName?: string;
    functionName?: string;
    lineNumber?: number;
    columnNumber?: number;
    fileName?: string;
    environment?: string;
    version?: string;
    build?: string;
    metadata?: Record<string, any>;
    tags?: string[];
    memoryUsage?: number;
    cpuUsage?: number;
    networkLatency?: number;
    cause?: string;
    correlatedErrors?: string[];
    flowSteps?: string[];
    currentStep?: string;
    isRetry?: boolean;
    retryCount?: number;
}
export interface ErrorReport {
    id: string;
    timestamp: string;
    level: ErrorLevel;
    component: ErrorComponent;
    category: ErrorCategory;
    source: ErrorSource;
    message: string;
    stack?: string;
    context: ErrorContext;
    severity: ErrorSeverity;
    fingerprint: string;
    groupId?: string;
    shouldAlert: boolean;
    alertChannels?: ('email' | 'slack' | 'webhook' | 'sms')[];
    resolved?: boolean;
    resolvedAt?: string;
    resolution?: string;
}
export interface ErrorReporterConfig {
    endpoint?: string;
    bufferSize?: number;
    flushInterval?: number;
    maxRetries?: number;
    enabled?: boolean;
    userId?: string;
    sessionId?: string;
    environment?: string;
    version?: string;
    sampleRate?: number;
    alertThreshold?: number;
}
export interface ErrorStats {
    total: number;
    byLevel: Record<ErrorLevel, number>;
    byComponent: Record<ErrorComponent, number>;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    bySource: Record<ErrorSource, number>;
    recent: number;
    trending: Array<{
        fingerprint: string;
        count: number;
        growth: number;
    }>;
    topErrors: Array<{
        message: string;
        count: number;
        fingerprint: string;
    }>;
}
export declare class ErrorReporter {
    private static instance;
    private config;
    private buffer;
    private flushTimer?;
    private isReporting;
    private errorGroups;
    private errorCounts;
    private alertThresholds;
    private userJourney;
    private performanceMetrics;
    private contractRegistry;
    private contractViolations;
    private syncIssues;
    private debugStreamListeners;
    private correlationIdCounter;
    private constructor();
    static getInstance(config?: ErrorReporterConfig): ErrorReporter;
    generateCorrelationId(): string;
    registerContract(contract: ServiceContract): void;
    getContract(contractId: string): ServiceContract | undefined;
    getAllContracts(): ServiceContract[];
    validateContract(contractId: string, actualParams: any, actualResponse: any, responseTime: number): ContractViolation | null;
    private isTypeCoercible;
    private generateViolationId;
    getContractViolations(contractId?: string): ContractViolation[];
    trackSyncIssue(issue: Omit<SyncIssue, 'id' | 'timestamp'>): SyncIssue;
    resolveSyncIssue(issueId: string, resolution: SyncResolution): boolean;
    getSyncIssues(entityId?: string): SyncIssue[];
    private getPendingSyncOperations;
    private getLastSyncTimestamp;
    private getConflictCount;
    private getOfflineQueueSize;
    private mapSyncIssueTypeToCategory;
    addDebugStreamListener(listener: (event: DebugStreamEvent) => void): () => void;
    emitDebugEvent(event: DebugStreamEvent): void;
    getDebugStream(): DebugStreamEvent[];
    private setupGlobalErrorHandlers;
    private startPerformanceMonitoring;
    /**
     * Report an error with comprehensive context
     */
    report(error: Omit<ErrorReport, 'id' | 'timestamp' | 'fingerprint' | 'shouldAlert'>): Promise<void>;
    /**
     * Track user action for journey reconstruction
     */
    trackUserAction(action: string, metadata?: Record<string, any>): void;
    /**
     * Report API endpoint error with request/response context
     */
    reportApiError(endpoint: string, method: string, statusCode: number, error: Error | any, responseTime?: number, additionalContext?: Record<string, any>): Promise<void>;
    /**
     * Report database error with query context
     */
    reportDatabaseError(operation: string, error: Error | any, table?: string, query?: string, additionalContext?: Record<string, any>): Promise<void>;
    /**
     * Report authentication/authorization error
     */
    reportAuthError(action: 'login' | 'logout' | 'token_refresh' | 'permission_check', reason: string, error: Error | any, additionalContext?: Record<string, any>): Promise<void>;
    /**
     * Report sync error with conflict details
     */
    reportSyncError(operation: 'push' | 'pull' | 'merge' | 'conflict_resolution', error: Error | any, conflictDetails?: {
        localVersion?: number;
        remoteVersion?: number;
        conflictingFields?: string[];
    }, additionalContext?: Record<string, any>): Promise<void>;
    /**
     * Report network/connection error
     */
    reportNetworkError(operation: 'connect' | 'disconnect' | 'timeout' | 'dns' | 'ssl', error: Error | any, target?: string, additionalContext?: Record<string, any>): Promise<void>;
    /**
     * Report validation error with field details
     */
    reportValidationError(resource: string, fields: Array<{
        field: string;
        error: string;
        value?: any;
    }>, error: Error | any, additionalContext?: Record<string, any>): Promise<void>;
    /**
     * Report performance issue
     */
    reportPerformanceIssue(metric: 'response_time' | 'render_time' | 'load_time' | 'memory' | 'cpu', value: number, threshold: number, additionalContext?: Record<string, any>): Promise<void>;
    /**
     * Report security issue
     */
    reportSecurityIssue(type: 'xss_attempt' | 'csrf_attempt' | 'injection_attempt' | 'unauthorized_access' | 'rate_limit_exceeded', details: Record<string, any>, error?: Error | any): Promise<void>;
    /**
     * Flush error buffer to server
     */
    flush(): Promise<void>;
    /**
     * Get error statistics
     */
    getStats(): ErrorStats;
    private sendReports;
    private generateFingerprint;
    private hash;
    private generateId;
    private extractErrorMessage;
    private getLastUserAction;
    setUserId(userId: string): void;
    setSessionId(sessionId: string): void;
    setEnabled(enabled: boolean): void;
    getVersion(): string;
    setVersion(version: string): void;
    getBufferCount(): number;
    shutdown(): Promise<void>;
}
export declare const reportError: (message: string, component: ErrorComponent, category: ErrorCategory, error?: Error | any, context?: Partial<ErrorContext>, severity?: ErrorSeverity) => Promise<void>;
export declare const reportWarning: (message: string, component: ErrorComponent, category: ErrorCategory, context?: Partial<ErrorContext>) => Promise<void>;
export declare const reportInfo: (message: string, component: ErrorComponent, category: ErrorCategory, context?: Partial<ErrorContext>) => Promise<void>;
export declare const errorReporter: ErrorReporter;
//# sourceMappingURL=error-reporting.d.ts.map