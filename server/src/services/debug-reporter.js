import { logger } from '../lib/logger.js';
import {
  classifyError,
  shouldAlert,
  formatErrorForLog,
  ErrorLevel,
  Severity,
} from '../lib/error-classifier.js';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { pipeline } from 'stream/promises';

const DEBUG_LOG_DIR = process.env.DEBUG_LOG_DIR || 'logs/debug';
const RING_BUFFER_SIZE = parseInt(process.env.DEBUG_BUFFER_SIZE || '1000');

class DebugReporter {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.queries = [];
    this.externalCalls = [];
    this.extractions = [];
    this.syncOperations = [];
    this.stateSnapshots = [];
    this.operationChains = new Map();
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.initLogDirectory();
  }

  initLogDirectory() {
    try {
      if (!existsSync(DEBUG_LOG_DIR)) {
        mkdirSync(DEBUG_LOG_DIR, { recursive: true });
      }
    } catch (err) {
      logger.warn({ error: err.message }, 'Failed to create debug log directory');
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  addToRingBuffer(buffer, item, maxSize = RING_BUFFER_SIZE) {
    buffer.push({ ...item, timestamp: this.getTimestamp() });
    if (buffer.length > maxSize) {
      buffer.shift();
    }
  }

  trackError(error, context = {}) {
    const classified = classifyError(error, context);
    const errorRecord = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      ...classified,
      context: {
        ...context,
        requestId: context.requestId || null,
        userId: context.userId || null,
        endpoint: context.endpoint || null,
      },
      shouldAlert: shouldAlert(classified),
    };

    this.addToRingBuffer(this.errors, errorRecord);
    this.errorCount++;

    const logData = formatErrorForLog(classified, context.requestId);
    logger.error(logData, `ERROR: ${classified.message}`);

    if (errorRecord.shouldAlert) {
      this.writeToFile('errors', errorRecord);
    }

    return errorRecord;
  }

  trackWarning(warning, context = {}) {
    const warningRecord = {
      id: `warn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      message: warning.message || warning,
      category: warning.category || 'WARNING',
      severity: warning.severity || Severity.MEDIUM,
      context,
      timestamp: this.getTimestamp(),
    };

    this.addToRingBuffer(this.warnings, warningRecord);
    logger.warn({ ...warningRecord, requestId: context.requestId }, warningRecord.message);

    return warningRecord;
  }

  trackInfo(info, context = {}) {
    const infoRecord = {
      id: `info_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      message: info.message || info,
      category: info.category || 'INFO',
      context,
      timestamp: this.getTimestamp(),
    };

    this.addToRingBuffer(this.info, infoRecord);
    logger.info({ ...infoRecord, requestId: context.requestId }, infoRecord.message);

    return infoRecord;
  }

  trackQuery(query, duration, resultCount, context = {}) {
    const isSlow = duration > 50;
    const queryRecord = {
      query: typeof query === 'string' ? query : query.name || 'unknown',
      duration,
      resultCount,
      isSlow,
      slowThreshold: 50,
      ...context,
      timestamp: this.getTimestamp(),
    };

    this.addToRingBuffer(this.queries, queryRecord);

    if (isSlow) {
      logger.warn(
        { query: queryRecord.query, duration, resultCount, threshold: 50 },
        `SLOW_QUERY: ${duration}ms`
      );
    }

    return queryRecord;
  }

  trackExternalCall(provider, duration, status, context = {}) {
    const callRecord = {
      provider,
      duration,
      status,
      success: status >= 200 && status < 400,
      ...context,
      timestamp: this.getTimestamp(),
    };

    this.addToRingBuffer(this.externalCalls, callRecord);

    if (!callRecord.success) {
      logger.warn(
        { provider, duration, status, ...context },
        `EXTERNAL_CALL_FAILED: ${provider} returned ${status}`
      );
    }

    return callRecord;
  }

  trackExtraction(provider, url, duration, messageCount, context = {}) {
    const extractionRecord = {
      provider,
      url,
      duration,
      messageCount,
      success: messageCount > 0,
      ...context,
      timestamp: this.getTimestamp(),
    };

    this.addToRingBuffer(this.extractions, extractionRecord);

    logger.info(
      { provider, url, duration, messageCount },
      `EXTRACTION: ${provider} - ${messageCount} messages in ${duration}ms`
    );

    return extractionRecord;
  }

  trackSyncOperation(operation, entityType, entityId, context = {}) {
    const syncRecord = {
      operation,
      entityType,
      entityId,
      ...context,
      timestamp: this.getTimestamp(),
    };

    this.addToRingBuffer(this.syncOperations, syncRecord);

    logger.debug(
      { operation, entityType, entityId, ...context },
      `SYNC_OP: ${operation} on ${entityType}:${entityId}`
    );

    return syncRecord;
  }

  captureState(label, state, context = {}) {
    const snapshot = {
      label,
      state: this.sanitizeState(state),
      context,
      memoryUsage: process.memoryUsage(),
      timestamp: this.getTimestamp(),
    };

    this.addToRingBuffer(this.stateSnapshots, snapshot);
    logger.debug({ label, memory: snapshot.memoryUsage.heapUsed }, `STATE_CAPTURE: ${label}`);

    return snapshot;
  }

  captureMemoryUsage() {
    const usage = process.memoryUsage();
    const snapshot = {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      timestamp: this.getTimestamp(),
    };

    return snapshot;
  }

  captureDatabaseConnections() {
    return {
      active: 0,
      idle: 0,
      waiting: 0,
      timestamp: this.getTimestamp(),
    };
  }

  startOperationChain(id, context = {}) {
    this.operationChains.set(id, {
      id,
      operations: [],
      context,
      startTime: Date.now(),
    });

    return id;
  }

  addToChain(operation, metadata = {}) {
    for (const [chainId, chain] of this.operationChains) {
      if (chain.operations.length === 0 || chain.operations[chain.operations.length - 1].endTime) {
        chain.operations.push({
          ...operation,
          metadata,
          startTime: Date.now(),
          endTime: null,
        });
        return chainId;
      }
    }
    return null;
  }

  endChain(result) {
    for (const [chainId, chain] of this.operationChains) {
      const lastOp = chain.operations[chain.operations.length - 1];
      if (lastOp && !lastOp.endTime) {
        lastOp.endTime = Date.now();
        lastOp.duration = lastOp.endTime - lastOp.startTime;
        lastOp.result = result;
        chain.endTime = Date.now();
        chain.totalDuration = chain.endTime - chain.startTime;
        return chain;
      }
    }
    return null;
  }

  sanitizeState(state) {
    if (state === null || state === undefined) return state;
    if (typeof state === 'string' || typeof state === 'number' || typeof state === 'boolean') {
      return state;
    }

    const sanitized = JSON.parse(JSON.stringify(state));

    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'credential',
    ];
    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) return;
      for (const key of Object.keys(obj)) {
        if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  writeToFile(type, data) {
    try {
      const filename = `${type}-${new Date().toISOString().split('T')[0]}.jsonl`;
      const filepath = join(DEBUG_LOG_DIR, filename);
      const line = JSON.stringify(data) + '\n';

      const stream = createWriteStream(filepath, { flags: 'a' });
      stream.write(line);
      stream.end();
    } catch (err) {
      logger.error({ error: err.message }, 'Failed to write to debug log file');
    }
  }

  getStatus() {
    return {
      uptime: Date.now() - this.startTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorsInBuffer: this.errors.length,
      warningsInBuffer: this.warnings.length,
      queriesInBuffer: this.queries.length,
      externalCallsInBuffer: this.externalCalls.length,
      extractionsInBuffer: this.extractions.length,
      syncOperationsInBuffer: this.syncOperations.length,
      memoryUsage: this.captureMemoryUsage(),
    };
  }

  getErrors(filters = {}) {
    let filtered = [...this.errors];

    if (filters.category) {
      filtered = filtered.filter((e) => e.category === filters.category);
    }
    if (filters.level) {
      filtered = filtered.filter((e) => e.level === filters.level);
    }
    if (filters.severity) {
      filtered = filtered.filter((e) => e.severity === filters.severity);
    }
    if (filters.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered;
  }

  getPerformanceMetrics() {
    const slowQueries = this.queries
      .filter((q) => q.isSlow)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20);

    const slowExternalCalls = this.externalCalls
      .filter((c) => !c.success)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20);

    const extractionStats = this.extractions.reduce(
      (acc, e) => {
        acc.total++;
        acc.totalDuration += e.duration;
        acc.totalMessages += e.messageCount;
        if (e.success) acc.successful++;
        else acc.failed++;
        return acc;
      },
      { total: 0, totalDuration: 0, totalMessages: 0, successful: 0, failed: 0 }
    );

    return {
      slowQueries,
      slowExternalCalls,
      extractionStats: {
        ...extractionStats,
        avgDuration:
          extractionStats.total > 0 ? extractionStats.totalDuration / extractionStats.total : 0,
      },
    };
  }

  incrementRequestCount() {
    this.requestCount++;
  }

  clear() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.queries = [];
    this.externalCalls = [];
    this.extractions = [];
    this.syncOperations = [];
    this.stateSnapshots = [];
    this.operationChains.clear();
    logger.info('Debug reporter buffer cleared');
  }
}

export const debugReporter = new DebugReporter();

export default debugReporter;
