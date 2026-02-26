import { Page, expect } from '@playwright/test';
import { DebugLog, DataFlowTracker, PerformanceMetrics, DebugStreamEvent } from '../../../src/lib/unified-debug-service';
import { EnhancedErrorReport } from '../../../../common/error-reporting';

/**
 * VIVIM Frontend Debugging Toolkit for E2E Tests
 * Provides deep introspection into the PWA state during tests
 */
export class VivimDebugKit {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Initialize the debug service in the page context
   */
  async init() {
    // We can inject scripts to monitor the UnifiedDebugService
    await this.page.addInitScript(() => {
      window.addEventListener('vivim-debug-event', (event: any) => {
        (window as any)._vivim_events = (window as any)._vivim_events || [];
        (window as any)._vivim_events.push(event.detail);
      });
    });
  }

  /**
   * Get all logs from the UnifiedDebugService
   */
  async getLogs(): Promise<DebugLog[]> {
    return await this.page.evaluate(() => {
      return (window as any).unifiedDebugService?.getLogs() || [];
    });
  }

  /**
   * Get all data flows from the UnifiedDebugService
   */
  async getDataFlows(): Promise<DataFlowTracker[]> {
    return await this.page.evaluate(() => {
      return (window as any).unifiedDebugService?.getAllDataFlows() || [];
    });
  }

  /**
   * Get a specific data flow by ID or name (partial match on message)
   */
  async findDataFlow(requestId: string): Promise<DataFlowTracker | undefined> {
    const flows = await this.getDataFlows();
    return flows.find(f => f.requestId === requestId);
  }

  /**
   * Wait for a data flow to complete or fail
   */
  async waitForFlow(requestId: string, timeout = 10000) {
    await expect.poll(async () => {
      const flow = await this.findDataFlow(requestId);
      return flow?.status;
    }, {
      message: `Wait for data flow ${requestId} to complete`,
      timeout,
    }).not.toBe('in-progress');

    const flow = await this.findDataFlow(requestId);
    if (flow?.status === 'failed') {
      const errorStep = flow.steps.find(s => s.status === 'error');
      throw new Error(`Data flow ${requestId} failed at step ${errorStep?.step}: ${errorStep?.error}`);
    }
    return flow;
  }

  /**
   * Get current performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return await this.page.evaluate(() => {
      return (window as any).unifiedDebugService?.getPerformanceMetrics() || {};
    });
  }

  /**
   * Check if any errors were reported to the ErrorReporter
   */
  async getReportedErrors(): Promise<EnhancedErrorReport[]> {
    return await this.page.evaluate(() => {
      return (window as any).errorReporter?.getBufferCount() > 0 
        ? (window as any).errorReporter.getStats().topErrors // Simplified for now
        : [];
    });
  }

  /**
   * Assert that no errors were reported
   */
  async assertNoErrors() {
    const logs = await this.getLogs();
    const errorLogs = logs.filter(l => l.level === 'error');
    if (errorLogs.length > 0) {
      throw new Error(`Errors detected in debug logs:\n${errorLogs.map(l => `[${l.module}] ${l.message}`).join('\n')}`);
    }
  }

  /**
   * Capture a full diagnostic snapshot of the application state
   */
  async captureDiagnosticSnapshot() {
    return await this.page.evaluate(async () => {
      const debug = (window as any).unifiedDebugService;
      return {
        logs: debug?.getLogs(),
        flows: debug?.getAllDataFlows(),
        performance: debug?.getMetrics(),
        offlineQueue: debug?.getOfflineQueueState(),
        indexedDB: debug?.getIndexedDBHealth(),
        localStorage: debug?.getLocalStorageHealth(),
        webSocket: debug?.getWebSocketHealth(),
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
    });
  }

  /**
   * Clear all logs and flows to start fresh for a new test step
   */
  async clearDebugState() {
    await this.page.evaluate(() => {
      (window as any).unifiedDebugService?.clearLogs();
      (window as any).unifiedDebugService?.clearDataFlows();
    });
  }
}
