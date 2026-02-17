/**
 * Unified Debugging & Error Reporting Service
 * Merges the existing DebugPanel logging with the new error reporting system
 * Provides comprehensive step-by-step data flow tracking
 */

import { ErrorReporter, ErrorReporterConfig, ErrorContext, ErrorSeverity, ErrorLevel, ErrorComponent, ErrorCategory, DebugStreamEvent, SyncIssueType } from '../../../common/error-reporting';

// ============================================================================
// Types
// ============================================================================

export type DebugLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';
export type DataFlowStep = 'request' | 'validation' | 'processing' | 'database' | 'response' | 'error';
export type ComponentType = 'api' | 'service' | 'component' | 'store' | 'sync' | 'network';

export interface DebugLog {
  id: string;
  timestamp: string;
  level: DebugLevel;
  component: ComponentType;
  source: 'client' | 'server';
  module: string;
  message: string;
  data?: any;
  error?: Error;
  context?: {
    flowStep?: DataFlowStep;
    requestId?: string;
    userId?: string;
    sessionId?: string;
    duration?: number;
    correlationId?: string;
    [key: string]: any;
  };
  stack?: string;
}

export interface DataFlowTracker {
  requestId: string;
  steps: Array<{
    step: DataFlowStep;
    timestamp: string;
    duration?: number;
    status: 'pending' | 'success' | 'error';
    error?: string;
    data?: any;
  }>;
  startTime: number;
  endTime?: number;
  status: 'in-progress' | 'completed' | 'failed';
}

export interface DebugPanelConfig extends ErrorReporterConfig {
  maxLogs?: number;
  enableDataFlowTracking?: boolean;
  enablePerformanceMetrics?: boolean;
  enableNetworkMonitoring?: boolean;
  enableDatabaseMonitoring?: boolean;
  enableOfflineQueueTracking?: boolean;
  enableIndexedDBMonitoring?: boolean;
  enableWebSocketHealth?: boolean;
  enableLocalStorageMonitoring?: boolean;
}

export interface PerformanceMetrics {
  memoryUsage?: number;
  cpuUsage?: number;
  networkLatency?: number;
  renderTime?: number;
  responseTime?: number;
}

export interface OfflineQueueState {
  pendingOperations: number;
  queue: Array<{
    id: string;
    operation: string;
    entityType: string;
    entityId: string;
    timestamp: number;
    retryCount: number;
  }>;
}

export interface IndexedDBHealth {
  isOpen: boolean;
  databases: Array<{
    name: string;
    version: number;
    objectStores: number;
    error?: string;
  }>;
}

export interface WebSocketHealth {
  isConnected: boolean;
  lastPing: number;
  lastPong: number;
  missedPongs: number;
  reconnectAttempts: number;
}

export interface LocalStorageHealth {
  isAvailable: boolean;
  usedSpace?: number;
  quota?: number;
  corruptionDetected: boolean;
  corruptedKeys?: string[];
}

// ============================================================================
// Unified Debugging Service
// ============================================================================

export class UnifiedDebugService {
  private static instance: UnifiedDebugService;
  private config: DebugPanelConfig;
  private errorReporter: ErrorReporter;
  private logs: DebugLog[] = [];
  private listeners: Array<(log: DebugLog) => void> = [];
  private dataFlows: Map<string, DataFlowTracker> = new Map();
  private performanceMetrics: PerformanceMetrics = {};
  private logBuffer: DebugLog[] = [];
  private maxLogs: number;
  private eventSource: EventSource | null = null;
  private reconnectTimeout: any = null;
  private reconnectAttempt = 0;
  private isConnecting = false;
  
  private offlineQueue: OfflineQueueState = {
    pendingOperations: 0,
    queue: []
  };
  private indexedDBHealth: IndexedDBHealth = {
    isOpen: false,
    databases: []
  };
  private webSocketHealth: WebSocketHealth = {
    isConnected: false,
    lastPing: 0,
    lastPong: 0,
    missedPongs: 0,
    reconnectAttempts: 0
  };
  private localStorageHealth: LocalStorageHealth = {
    isAvailable: true,
    corruptionDetected: false,
    corruptedKeys: []
  };
  private debugStreamListeners: Array<(event: DebugStreamEvent) => void> = [];

  private constructor(config: DebugPanelConfig = {}) {
    this.config = {
      maxLogs: 2000,
      enableDataFlowTracking: true,
      enablePerformanceMetrics: true,
      enableNetworkMonitoring: true,
      enableDatabaseMonitoring: true,
      enableOfflineQueueTracking: true,
      enableIndexedDBMonitoring: true,
      enableWebSocketHealth: true,
      enableLocalStorageMonitoring: true,
      ...config
    };

    this.maxLogs = this.config.maxLogs || 2000;
    this.errorReporter = ErrorReporter.getInstance(config);

    if (this.config.enablePerformanceMetrics) {
      this.startPerformanceMonitoring();
    }

    if (this.config.enableNetworkMonitoring && typeof window !== 'undefined') {
      this.startNetworkMonitoring();
    }

    if (this.config.enableOfflineQueueTracking) {
      this.startOfflineQueueMonitoring();
    }

    if (this.config.enableIndexedDBMonitoring && typeof window !== 'undefined') {
      this.startIndexedDBMonitoring();
    }

    if (this.config.enableLocalStorageMonitoring && typeof window !== 'undefined') {
      this.startLocalStorageMonitoring();
    }

    this.setupConsoleCapture();
    
    this.setupDebugStreamListener();
  }

  private setupDebugStreamListener(): void {
    this.errorReporter.addDebugStreamListener((event) => {
      this.debugStreamListeners.forEach(listener => {
        try {
          listener(event);
        } catch (e) {
          console.error('Debug stream listener error:', e);
        }
      });
    });
  }

  addDebugStreamListener(listener: (event: DebugStreamEvent) => void): () => void {
    this.debugStreamListeners.push(listener);
    return () => {
      this.debugStreamListeners = this.debugStreamListeners.filter(l => l !== listener);
    };
  }

  private setupConsoleCapture(): void {
    if (typeof window === 'undefined') return;

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
      trace: console.trace
    };

    // Prevent recursion
    let isCapturing = false;

    const wrap = (level: DebugLevel, original: any) => (...args: any[]) => {
      // Call original first
      original.apply(console, args);
      
      if (isCapturing) return;
      
      try {
        isCapturing = true;
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch (e) { return '[Object]'; }
          }
          return String(arg);
        }).join(' ');

        // Skip internal logs
        if (message.includes('System: ') || message.includes('Connecting to server logs')) {
          isCapturing = false;
          return;
        }

        this.log(level, 'Console', message, args.find(a => typeof a === 'object'));
      } catch (e) {
        // Silent failure
      } finally {
        isCapturing = false;
      }
    };

    console.log = wrap('info', originalConsole.log);
    console.warn = wrap('warn', originalConsole.warn);
    console.error = wrap('error', originalConsole.error);
    console.info = wrap('info', originalConsole.info);
    console.debug = wrap('debug', originalConsole.debug);
  }

  static getInstance(config?: DebugPanelConfig): UnifiedDebugService {
    if (!UnifiedDebugService.instance) {
      UnifiedDebugService.instance = new UnifiedDebugService(config);
    }
    return UnifiedDebugService.instance;
  }

  // ============================================================================
  // Logging Methods
  // ============================================================================

  trace(module: string, message: string, data?: any, context?: any): void {
    this.log('trace', module, message, data, undefined, context);
  }

  debug(module: string, message: string, data?: any, context?: any): void {
    this.log('debug', module, message, data, undefined, context);
  }

  info(module: string, message: string, data?: any, context?: any): void {
    this.log('info', module, message, data, undefined, context);
  }

  warn(module: string, message: string, data?: any, error?: Error, context?: any): void {
    this.log('warn', module, message, data, error, context);
  }

  error(module: string, message: string, error?: Error, data?: any, context?: any): void {
    this.log('error', module, message, data, error, context);
  }

  private log(
    level: DebugLevel,
    module: string,
    message: string,
    data?: any,
    error?: Error,
    context?: any
  ): void {
    const log: DebugLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      component: this.inferComponent(module),
      source: 'client',
      module,
      message,
      data,
      error,
      stack: error?.stack,
      context: {
        ...context,
        sessionId: this.config.sessionId,
        userId: this.config.userId
      }
    };

    // Add to logs array
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Add to buffer for flushing
    this.logBuffer.push(log);

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(log);
      } catch (e) {
        console.error('Debug listener error:', e);
      }
    });

    // Report to error reporting system if it's an error
    if (level === 'error' || level === 'warn') {
      this.reportToErrorSystem(log);
    }
  }

  // ============================================================================
  // Data Flow Tracking
  // ============================================================================

  startDataFlow(requestId?: string): string {
    const id = requestId || this.generateId();
    const tracker: DataFlowTracker = {
      requestId: id,
      steps: [],
      startTime: Date.now(),
      status: 'in-progress'
    };
    this.dataFlows.set(id, tracker);
    
    this.debug('DataFlow', `Started flow: ${id}`, { requestId: id });
    return id;
  }

  trackFlowStep(
    requestId: string,
    step: DataFlowStep,
    status: 'pending' | 'success' | 'error',
    data?: any,
    error?: string
  ): void {
    const tracker = this.dataFlows.get(requestId);
    if (!tracker) {
      this.warn('DataFlow', `Tracker not found: ${requestId}`);
      return;
    }

    const previousStep = tracker.steps[tracker.steps.length - 1];
    const stepStartTime = previousStep ? Date.parse(previousStep.timestamp) : tracker.startTime;
    const duration = Date.now() - stepStartTime;

    tracker.steps.push({
      step,
      timestamp: new Date().toISOString(),
      duration,
      status,
      error,
      data
    });

    // Intelligent Feedback: Detect bottlenecks in data flow
    if (duration > 1000 && status !== 'error') {
      this.trackFlowBottleneck(requestId, step, duration);
    }

    if (status === 'error') {
      tracker.status = 'failed';
      tracker.endTime = Date.now();
      const totalDuration = tracker.endTime - tracker.startTime;
      this.error('DataFlow', `FLOW_FAILURE: Flow ${requestId} failed at step [${step}] after ${totalDuration}ms`, error ? new Error(error) : undefined, { requestId, step, data, totalDuration });
    } else if (step === 'response') {
      tracker.status = 'completed';
      tracker.endTime = Date.now();
      const totalDuration = tracker.endTime - tracker.startTime;
      this.info('DataFlow', `FLOW_SUCCESS: Flow ${requestId} completed in ${totalDuration}ms`, { 
        requestId, 
        totalDuration, 
        steps: tracker.steps.length,
        averageStepDuration: totalDuration / tracker.steps.length
      });
    }

    this.debug('DataFlow', `STEP_${step.toUpperCase()} [${status.toUpperCase()}]: ${duration}ms`, { requestId, step, duration, data });
  }

  /**
   * Specifically track and report performance bottlenecks in data flows
   */
  trackFlowBottleneck(requestId: string, step: DataFlowStep, duration: number): void {
    const msg = `BOTTLENECK_DETECTED: Step [${step}] in flow ${requestId} took ${duration}ms`;
    this.warn('Performance', msg, { requestId, step, duration });
    
    // Optionally report to error system as a warning
    this.errorReporter.report({
      level: 'warning',
      component: 'pwa',
      category: 'performance',
      source: 'client',
      message: msg,
      context: { requestId, step, duration, bottleneck: true },
      severity: duration > 3000 ? 'medium' : 'low'
    });
  }

  getDataFlow(requestId: string): DataFlowTracker | undefined {
    return this.dataFlows.get(requestId);
  }

  getAllDataFlows(): DataFlowTracker[] {
    return Array.from(this.dataFlows.values());
  }

  clearDataFlows(): void {
    this.dataFlows.clear();
    this.debug('DataFlow', 'Cleared all data flows');
  }

  // ============================================================================
  // Performance Monitoring
  // ============================================================================

  private startPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        this.performanceMetrics.memoryUsage = memInfo.usedJSHeapSize;
        
        // Alert if memory usage is too high
        if (memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.9) {
          this.warn('Performance', 'High memory usage detected', {
            memoryUsage: memInfo.usedJSHeapSize,
            memoryLimit: memInfo.jsHeapSizeLimit,
            memoryPercent: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100
          });
        }
      }, 30000);
    }

    // Monitor network latency
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformanceResourceTiming[];
          entries.forEach(entry => {
            if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
              this.performanceMetrics.networkLatency = entry.duration;
              this.performanceMetrics.responseTime = entry.responseEnd - entry.responseStart;
              
              // Track slow requests
              if (entry.duration > 5000) {
                this.warn('Performance', 'Slow network request', {
                  url: entry.name,
                  duration: entry.duration,
                  responseTime: this.performanceMetrics.responseTime
                });
              }
            }
          });
        });
        observer.observe({ entryTypes: ['resource'] });
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }

  private startNetworkMonitoring(): void {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    window.addEventListener('online', () => {
      this.info('Network', 'Connection restored');
      this.emitDebugStreamEvent('info', { event: 'connection_restored', timestamp: Date.now() });
    });

    window.addEventListener('offline', () => {
      this.warn('Network', 'Connection lost');
      this.emitDebugStreamEvent('warning', { event: 'connection_lost', timestamp: Date.now() });
    });
  }

  private startOfflineQueueMonitoring(): void {
    if (typeof window === 'undefined') return;
    
    setInterval(() => {
      if (this.offlineQueue.pendingOperations > 10) {
        this.warn('OfflineQueue', `High offline queue: ${this.offlineQueue.pendingOperations} pending operations`);
      }
      
      this.emitDebugStreamEvent('sync_update', {
        pendingOperations: this.offlineQueue.pendingOperations,
        queueSize: this.offlineQueue.queue.length
      });
    }, 30000);
  }

  addToOfflineQueue(operation: string, entityType: string, entityId: string): string {
    const id = this.generateId();
    this.offlineQueue.queue.push({
      id,
      operation,
      entityType,
      entityId,
      timestamp: Date.now(),
      retryCount: 0
    });
    this.offlineQueue.pendingOperations = this.offlineQueue.queue.length;
    
    this.info('OfflineQueue', `Added to queue: ${operation} on ${entityType}:${entityId}`, {
      queueSize: this.offlineQueue.pendingOperations
    });

    this.errorReporter.trackSyncIssue({
      issueType: 'missing_data' as SyncIssueType,
      source: 'pwa',
      target: 'server',
      entityType: entityType as any,
      entityId,
      details: { operation, queuedAt: Date.now() }
    });
    
    return id;
  }

  removeFromOfflineQueue(id: string): boolean {
    const index = this.offlineQueue.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.offlineQueue.queue.splice(index, 1);
      this.offlineQueue.pendingOperations = this.offlineQueue.queue.length;
      this.info('OfflineQueue', `Removed from queue: ${id}`, {
        queueSize: this.offlineQueue.pendingOperations
      });
      return true;
    }
    return false;
  }

  getOfflineQueueState(): OfflineQueueState {
    return { ...this.offlineQueue };
  }

  private startIndexedDBMonitoring(): void {
    if (typeof window === 'undefined' || !window.indexedDB) return;

    const checkIndexedDB = () => {
      try {
        const request = window.indexedDB.databases();
        request.onsuccess = (event: any) => {
          const databases = event.target.result || [];
          this.indexedDBHealth = {
            isOpen: true,
            databases: databases.map((db: any) => ({
              name: db.name,
              version: db.version,
              objectStores: 0
            }))
          };
        };
        request.onerror = () => {
          this.indexedDBHealth.isOpen = false;
          this.error('IndexedDB', 'Failed to access IndexedDB');
        };
      } catch (e) {
        this.indexedDBHealth.isOpen = false;
        this.warn('IndexedDB', 'IndexedDB not available');
      }
    };

    checkIndexedDB();
    setInterval(checkIndexedDB, 60000);
  }

  getIndexedDBHealth(): IndexedDBHealth {
    return { ...this.indexedDBHealth };
  }

  private startLocalStorageMonitoring(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const checkLocalStorage = () => {
      try {
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        
        this.localStorageHealth.isAvailable = true;
        
        let usedSpace = 0;
        for (let key in window.localStorage) {
          if (window.localStorage.hasOwnProperty(key)) {
            usedSpace += window.localStorage[key].length + key.length;
          }
        }
        this.localStorageHealth.usedSpace = usedSpace;
        
        if ('storage' in window) {
          (window as any).storage.addEventListener('storage', (e: StorageEvent) => {
            if (e.key && e.oldValue !== e.newValue) {
              this.debug('LocalStorage', `Storage changed: ${e.key}`, {
                key: e.key,
                oldValue: e.oldValue ? '[present]' : null,
                newValue: e.newValue ? '[present]' : null
              });
            }
          });
        }
      } catch (e) {
        this.localStorageHealth.isAvailable = false;
        this.error('LocalStorage', 'LocalStorage not available or quota exceeded');
      }
    };

    checkLocalStorage();
    setInterval(checkLocalStorage, 30000);
  }

  checkLocalStorageCorruption(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    const corruptedKeys: string[] = [];
    
    for (let key in window.localStorage) {
      if (window.localStorage.hasOwnProperty(key)) {
        try {
          const value = window.localStorage.getItem(key);
          if (value) {
            JSON.parse(value);
          }
        } catch (e) {
          corruptedKeys.push(key);
        }
      }
    }

    if (corruptedKeys.length > 0) {
      this.localStorageHealth.corruptionDetected = true;
      this.localStorageHealth.corruptedKeys = corruptedKeys;
      this.error('LocalStorage', `Corrupted storage keys detected: ${corruptedKeys.join(', ')}`, null, { corruptedKeys });
    }

    return corruptedKeys.length > 0;
  }

  getLocalStorageHealth(): LocalStorageHealth {
    return { ...this.localStorageHealth };
  }

  updateWebSocketHealth(health: Partial<WebSocketHealth>): void {
    const previousState = { ...this.webSocketHealth };
    this.webSocketHealth = { ...this.webSocketHealth, ...health };

    if (health.isConnected === true && previousState.isConnected === false) {
      this.webSocketHealth.reconnectAttempts = 0;
      this.info('WebSocket', 'WebSocket connection established');
    } else if (health.isConnected === false && previousState.isConnected === true) {
      this.webSocketHealth.reconnectAttempts++;
      this.warn('WebSocket', `WebSocket disconnected (reconnect attempt ${this.webSocketHealth.reconnectAttempts})`);
    }

    if (this.webSocketHealth.missedPongs > 3) {
      this.warn('WebSocket', `Missed ${this.webSocketHealth.missedPongs} pong responses`);
    }
  }

  getWebSocketHealth(): WebSocketHealth {
    return { ...this.webSocketHealth };
  }

  private emitDebugStreamEvent(eventType: string, data: any): void {
    this.errorReporter.emitDebugEvent({
      eventType: eventType as any,
      timestamp: Date.now(),
      service: 'pwa',
      data,
      syncState: {
        pendingOperations: this.offlineQueue.pendingOperations,
        lastSyncTimestamp: 0,
        conflictCount: 0,
        offlineQueue: this.offlineQueue.queue.length
      }
    });
  }

  getDebugStreamSnapshot(): DebugStreamEvent[] {
    return [];
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Monitor any operation for performance bottlenecks and report them automatically
   */
  async monitorOperation<T>(
    module: string,
    operationName: string,
    operationFn: () => Promise<T>,
    threshold = 1000,
    metadata?: any
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await operationFn();
      const duration = Date.now() - startTime;

      if (duration > threshold) {
        const msg = `BOTTLENECK: [${module}] ${operationName} took ${duration}ms (threshold: ${threshold}ms)`;
        this.warn('Performance', msg, { ...metadata, duration, threshold });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(module, `FAILED: ${operationName} failed after ${duration}ms`, error instanceof Error ? error : undefined, { ...metadata, duration });
      throw error;
    }
  }

  // ============================================================================
  // Error Reporting Integration
  // ============================================================================

  private reportToErrorSystem(log: DebugLog): void {
    const severity: ErrorSeverity = log.level === 'error' ? 'high' : 'medium';
    const component: ErrorComponent = this.mapComponentToErrorComponent(log.component);
    const category: ErrorCategory = this.inferCategory(log);

    this.errorReporter.report({
      level: log.level === 'error' ? 'error' : 'warning',
      component,
      category,
      source: log.context?.sessionId ? 'client' : 'server',
      message: log.message,
      stack: log.stack,
      context: {
        ...log.context,
        module: log.module,
        data: log.data,
        debugLogId: log.id
      },
      severity,
      shouldAlert: log.level === 'error' && severity === 'high'
    });
  }

  private mapComponentToErrorComponent(component: ComponentType): ErrorComponent {
    switch (component) {
      case 'api': return 'api';
      case 'service': return 'shared';
      case 'component': return 'pwa';
      case 'store': return 'pwa';
      case 'sync': return 'sync';
      case 'network': return 'network';
      default: return 'shared';
    }
  }

  private inferCategory(log: DebugLog): ErrorCategory {
    if (log.error) return 'runtime';
    if (log.module.includes('database') || log.module.includes('storage')) return 'database';
    if (log.module.includes('network') || log.module.includes('fetch')) return 'network';
    if (log.module.includes('auth')) return 'authentication';
    if (log.module.includes('sync')) return 'sync';
    if (log.module.includes('performance')) return 'performance';
    return 'runtime';
  }

  private inferComponent(module: string): ComponentType {
    if (module.includes('api') || module.includes('route')) return 'api';
    if (module.includes('service')) return 'service';
    if (module.includes('component') || module.includes('ui')) return 'component';
    if (module.includes('store') || module.includes('state')) return 'store';
    if (module.includes('sync')) return 'sync';
    if (module.includes('network') || module.includes('p2p')) return 'network';
    return 'service';
  }

  // ============================================================================
  // Listener Management
  // ============================================================================

  addListener(listener: (log: DebugLog) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getLogs(): DebugLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.logBuffer = [];
    this.debug('System', 'Logs cleared');
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private generateId(): string {
    return `dbg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async exportLogs(): Promise<string> {
    return JSON.stringify(this.logs, null, 2);
  }

  async downloadLogs(filename?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const blob = new Blob([await this.exportLogs()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `debug_dump_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  setUserId(userId: string): void {
    this.config.userId = userId;
    this.errorReporter.setUserId(userId);
  }

  setSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
    this.errorReporter.setSessionId(sessionId);
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.errorReporter.setEnabled(enabled);
  }

  // ============================================================================
  // Server Log Streaming
  // ============================================================================

  connectToServer(apiUrl: string): void {
    if (typeof window === 'undefined' || this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) return;

    this.disconnectFromServer();
    this.isConnecting = true;
    
    // Robustly construct stream URL avoiding double segments
    const rootUrl = apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '').replace(/\/$/, '');
    const streamUrl = `${rootUrl}/api/v1/logs/stream`;
    
    this.info('System', `Connecting to server logs: ${streamUrl}`);

    try {
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempt = 0;
        this.info('System', 'Connected to server logs');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const log: DebugLog = {
            id: `srv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: data.timestamp || new Date().toISOString(),
            level: (data.level?.toLowerCase() as DebugLevel) || 'info',
            component: this.inferComponent(data.module || 'SERVER'),
            source: 'server',
            module: data.module || 'SERVER',
            message: data.message || '',
            data: data.data,
            error: data.error,
            context: {
              ...data.context,
              serverSource: true
            }
          };
          
          this.logs.push(log);
          if (this.logs.length > this.maxLogs) {
            this.logs.shift();
          }

          this.listeners.forEach(listener => {
            try { listener(log); } catch (e) {}
          });
        } catch (e) {
          this.error('System', 'Failed to parse server log', e instanceof Error ? e : undefined);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        this.disconnectFromServer();
        
        if (this.reconnectAttempt < 5) {
          const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempt), 30000);
          this.reconnectAttempt++;
          this.reconnectTimeout = setTimeout(() => this.connectToServer(apiUrl), delay);
        }
      };
    } catch (e) {
      this.isConnecting = false;
      this.error('System', 'Failed to initialize server logs', e instanceof Error ? e : undefined);
    }
  }

  disconnectFromServer(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // ============================================================================
  // Step-by-Step Data Flow Reporting
  // ============================================================================

  /**
   * Track a complete API request flow with detailed step-by-step reporting
   */
  async trackApiRequest<T>(
    endpoint: string,
    method: string,
    requestFn: () => Promise<T>,
    requestData?: any
  ): Promise<T> {
    const requestId = this.startDataFlow();
    const startTime = Date.now();
    const flowTag = `[${method} ${endpoint}]`;

    try {
      // Step 1: Request
      this.trackFlowStep(requestId, 'request', 'pending', { endpoint, method, requestData });
      this.debug('API', `NETWORK_START ${flowTag}: Sending request...`, { requestData });

      // Step 2: Validation
      this.trackFlowStep(requestId, 'validation', 'pending');
      // Logic for validation would go here
      this.trackFlowStep(requestId, 'validation', 'success');

      // Step 3: Processing
      this.trackFlowStep(requestId, 'processing', 'pending');
      const result = await requestFn();
      const payloadSize = JSON.stringify(result).length;
      this.trackFlowStep(requestId, 'processing', 'success', { resultSize: payloadSize });

      // Step 4: Response
      const duration = Date.now() - startTime;
      this.trackFlowStep(requestId, 'response', 'success', { duration });
      
      const successMsg = `NETWORK_SUCCESS ${flowTag}: Received response in ${duration}ms (${(payloadSize / 1024).toFixed(2)} KB)`;
      this.info('API', successMsg, { duration, requestId, payloadSize });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.trackFlowStep(requestId, 'error', 'error', { duration }, errorMsg);
      
      this.error('API', `NETWORK_ERROR ${flowTag}: Request failed after ${duration}ms - ${errorMsg}`, error instanceof Error ? error : new Error(String(error)), { duration, requestId });
      throw error;
    }
  }

  /**
   * Track a database operation flow
   */
  async trackDatabaseOperation<T>(
    operation: string,
    table: string,
    operationFn: () => Promise<T>,
    query?: any
  ): Promise<T> {
    const requestId = this.startDataFlow();
    const startTime = Date.now();
    const dbTag = `[${operation} on ${table}]`;

    try {
      this.debug('Database', `DB_START ${dbTag}: Executing query...`, { query });
      this.trackFlowStep(requestId, 'database', 'pending', { operation, table, query });

      const result = await operationFn();

      const duration = Date.now() - startTime;
      const resultCount = Array.isArray(result) ? result.length : (result ? 1 : 0);
      this.trackFlowStep(requestId, 'database', 'success', { duration, resultCount });
      
      this.info('Database', `DB_SUCCESS ${dbTag}: Query completed in ${duration}ms (${resultCount} records)`, { duration, requestId, resultCount });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.trackFlowStep(requestId, 'database', 'error', { duration }, errorMsg);
      
      this.error('Database', `DB_ERROR ${dbTag}: Query failed after ${duration}ms - ${errorMsg}`, error instanceof Error ? error : new Error(String(error)), { duration, requestId, query });
      throw error;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const unifiedDebugService = UnifiedDebugService.getInstance();

// ============================================================================
// Convenience Functions
// ============================================================================

export const debug = {
  trace: (module: string, message: string, data?: any) => unifiedDebugService.trace(module, message, data),
  debug: (module: string, message: string, data?: any) => unifiedDebugService.debug(module, message, data),
  info: (module: string, message: string, data?: any) => unifiedDebugService.info(module, message, data),
  warn: (module: string, message: string, data?: any, error?: Error) => unifiedDebugService.warn(module, message, data, error),
  error: (module: string, message: string, error?: Error, data?: any) => unifiedDebugService.error(module, message, error, data),
  
  // Data flow tracking
  startFlow: (requestId?: string) => unifiedDebugService.startDataFlow(requestId),
  trackStep: (requestId: string, step: DataFlowStep, status: 'pending' | 'success' | 'error', data?: any, error?: string) => 
    unifiedDebugService.trackFlowStep(requestId, step, status, data, error),
  getFlow: (requestId: string) => unifiedDebugService.getDataFlow(requestId),
  
  // Performance
  getMetrics: () => unifiedDebugService.getPerformanceMetrics(),
  monitor: <T>(module: string, name: string, fn: () => Promise<T>, threshold?: number, meta?: any) => 
    unifiedDebugService.monitorOperation(module, name, fn, threshold, meta),
  
  // Utilities
  addListener: (listener: (log: DebugLog) => void) => unifiedDebugService.addListener(listener),
  getLogs: () => unifiedDebugService.getLogs(),
  clearLogs: () => unifiedDebugService.clearLogs(),
  exportLogs: () => unifiedDebugService.exportLogs(),
  downloadLogs: (filename?: string) => unifiedDebugService.downloadLogs(filename),
  
  // Context
  setUserId: (userId: string) => unifiedDebugService.setUserId(userId),
  setSessionId: (sessionId: string) => unifiedDebugService.setSessionId(sessionId),
  
  // Server Logs
  connectToServer: (apiUrl: string) => unifiedDebugService.connectToServer(apiUrl),
  disconnectFromServer: () => unifiedDebugService.disconnectFromServer()
};
