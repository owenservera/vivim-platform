import { 
  SyncIssue, 
  SyncIssueType, 
  SyncSource, 
  SyncTarget, 
  EntityType, 
  SyncResolution, 
  SyncResolutionStrategy,
  ErrorReporter,
  ErrorCategory 
} from './error-reporting';

export interface SyncConflictDetails {
  localVersion: number;
  remoteVersion: number;
  localState: any;
  remoteState: any;
  conflictingFields: string[];
  mergeStrategy?: SyncResolutionStrategy;
}

export interface SyncHealthMetrics {
  totalIssues: number;
  unresolvedIssues: number;
  resolvedIssues: number;
  byType: Record<SyncIssueType, number>;
  byEntityType: Record<EntityType, number>;
  averageResolutionTime: number;
}

export class SyncIssueTracker {
  private static instance: SyncIssueTracker;
  private issues: Map<string, SyncIssue> = new Map();
  private resolutionHistory: Array<{ issueId: string; resolution: SyncResolution; timeToResolve: number }> = [];
  private reporter: ErrorReporter;
  private conflictListeners: Array<(issue: SyncIssue, details?: SyncConflictDetails) => void> = [];

  private constructor() {
    this.reporter = ErrorReporter.getInstance();
  }

  static getInstance(): SyncIssueTracker {
    if (!SyncIssueTracker.instance) {
      SyncIssueTracker.instance = new SyncIssueTracker();
    }
    return SyncIssueTracker.instance;
  }

  track(
    issueType: SyncIssueType,
    source: SyncSource,
    target: SyncTarget,
    entityType: EntityType,
    entityId: string,
    details?: Record<string, any>
  ): SyncIssue {
    const issue = this.reporter.trackSyncIssue({
      issueType,
      source,
      target,
      entityType,
      entityId,
      details
    });

    this.issues.set(issue.id, issue);

    if (issueType === 'conflict') {
      this.notifyConflictListeners(issue, details as any);
    }

    return issue;
  }

  detectConflict(
    entityType: EntityType,
    entityId: string,
    localVersion: number,
    remoteVersion: number,
    localState: any,
    remoteState: any,
    conflictingFields: string[]
  ): SyncIssue | null {
    if (localVersion === remoteVersion) {
      return null;
    }

    const conflictDetails: SyncConflictDetails = {
      localVersion,
      remoteVersion,
      localState,
      remoteState,
      conflictingFields
    };

    return this.track(
      'conflict',
      'network',
      'server',
      entityType,
      entityId,
      conflictDetails
    );
  }

  detectDivergence(
    entityType: EntityType,
    entityId: string,
    expectedState: any,
    actualState: any
  ): SyncIssue | null {
    const divergence = this.calculateDivergence(expectedState, actualState);
    
    if (Object.keys(divergence).length === 0) {
      return null;
    }

    return this.track(
      'divergence',
      'server',
      'pwa',
      entityType,
      entityId,
      { divergence }
    );
  }

  detectMissingData(
    entityType: EntityType,
    entityId: string,
    expectedFields: string[],
    actualData: any
  ): SyncIssue | null {
    const missingFields = expectedFields.filter(field => !(field in actualData));
    
    if (missingFields.length === 0) {
      return null;
    }

    return this.track(
      'missing_data',
      'server',
      'pwa',
      entityType,
      entityId,
      { missingFields, expectedFields }
    );
  }

  detectOrderViolation(
    entityType: EntityType,
    entityId: string,
    expectedOrder: string[],
    actualOrder: string[]
  ): SyncIssue | null {
    const expectedStr = expectedOrder.join(',');
    const actualStr = actualOrder.join(',');
    
    if (expectedStr === actualStr) {
      return null;
    }

    return this.track(
      'order_violation',
      'server',
      'pwa',
      entityType,
      entityId,
      { expectedOrder, actualOrder }
    );
  }

    const conflictDetails: SyncConflictDetails = {
      localVersion,
      remoteVersion,
      localState,
      remoteState,
      conflictingFields
    };

    return this.track(
      'conflict',
      'client',
      'server',
      entityType,
      entityId,
      conflictDetails
    );
  }

  detectDivergence(
    entityType: EntityType,
    entityId: string,
    expectedState: any,
    actualState: any
  ): SyncIssue | null {
    const divergence = this.calculateDivergence(expectedState, actualState);
    
    if (Object.keys(divergence).length === 0) {
      return null;
    }

    return this.track(
      'divergence',
      'server',
      'client',
      entityType,
      entityId,
      { divergence }
    );
  }

  private calculateDivergence(expected: any, actual: any): Record<string, { expected: any; actual: any }> {
    const divergence: Record<string, { expected: any; actual: any }> = {};
    
    const allKeys = new Set([...Object.keys(expected || {}), ...Object.keys(actual || {})]);
    
    for (const key of allKeys) {
      const expectedValue = expected?.[key];
      const actualValue = actual?.[key];
      
      if (JSON.stringify(expectedValue) !== JSON.stringify(actualValue)) {
        divergence[key] = { expected: expectedValue, actual: actualValue };
      }
    }
    
    return divergence;
  }

  detectMissingData(
    entityType: EntityType,
    entityId: string,
    expectedFields: string[],
    actualData: any
  ): SyncIssue | null {
    const missingFields = expectedFields.filter(field => !(field in actualData));
    
    if (missingFields.length === 0) {
      return null;
    }

    return this.track(
      'missing_data',
      'server',
      'client',
      entityType,
      entityId,
      { missingFields, expectedFields }
    );
  }

  detectOrderViolation(
    entityType: EntityType,
    entityId: string,
    expectedOrder: string[],
    actualOrder: string[]
  ): SyncIssue | null {
    const expectedStr = expectedOrder.join(',');
    const actualStr = actualOrder.join(',');
    
    if (expectedStr === actualStr) {
      return null;
    }

    return this.track(
      'order_violation',
      'server',
      'client',
      entityType,
      entityId,
      { expectedOrder, actualOrder }
    );
  }

  resolve(
    issueId: string,
    strategy: SyncResolutionStrategy,
    resolutionData?: any,
    resolvedBy: 'system' | 'user' = 'system'
  ): boolean {
    const issue = this.issues.get(issueId);
    
    if (!issue || issue.resolution) {
      return false;
    }

    const resolution: SyncResolution = {
      strategy,
      resolutionData,
      resolvedAt: new Date(),
      resolvedBy
    };

    const success = this.reporter.resolveSyncIssue(issueId, resolution);
    
    if (success) {
      issue.resolution = resolution;
      
      this.resolutionHistory.push({
        issueId,
        resolution,
        timeToResolve: resolution.resolvedAt.getTime() - issue.timestamp.getTime()
      });

      this.reporter.report({
        level: 'info',
        component: 'sync',
        category: 'sync' as ErrorCategory,
        source: 'client',
        message: `Sync issue resolved: ${issue.issueType} on ${issue.entityType}:${issue.entityId}`,
        context: {
          sync: {
            entityType: issue.entityType,
            entityId: issue.entityId,
            operation: 'update' as const
          }
        },
        severity: 'low'
      });
    }

    return success;
  }

  autoResolve(issueId: string, preferredStrategy: SyncResolutionStrategy = 'server_wins'): boolean {
    const issue = this.issues.get(issueId);
    
    if (!issue) {
      return false;
    }

    if (issue.issueType === 'conflict') {
      return this.resolve(issueId, preferredStrategy, { autoResolved: true }, 'system');
    }

    if (issue.issueType === 'missing_data') {
      return this.resolve(issueId, 'server_wins', { autoResolved: true }, 'system');
    }

    if (issue.issueType === 'order_violation') {
      return this.resolve(issueId, 'server_wins', { autoResolved: true }, 'system');
    }

    return this.resolve(issueId, 'rejected', { autoResolved: true, reason: 'unknown_issue_type' }, 'system');
  }

  get(issueId: string): SyncIssue | undefined {
    return this.issues.get(issueId);
  }

  getByEntity(entityType: EntityType, entityId: string): SyncIssue[] {
    return Array.from(this.issues.values()).filter(
      issue => issue.entityType === entityType && issue.entityId === entityId
    );
  }

  getUnresolved(): SyncIssue[] {
    return Array.from(this.issues.values()).filter(issue => !issue.resolution);
  }

  getResolved(): SyncIssue[] {
    return Array.from(this.issues.values()).filter(issue => !!issue.resolution);
  }

  getAll(): SyncIssue[] {
    return Array.from(this.issues.values());
  }

  getHealthMetrics(): SyncHealthMetrics {
    const issues = Array.from(this.issues.values());
    const resolved = issues.filter(i => i.resolution);
    const unresolved = issues.filter(i => !i.resolution);

    const byType: Record<SyncIssueType, number> = {
      conflict: 0,
      divergence: 0,
      missing_data: 0,
      order_violation: 0,
      validation_failed: 0
    };

    const byEntityType: Record<EntityType, number> = {
      conversation: 0,
      message: 0,
      acu: 0,
      user: 0,
      circle: 0
    };

    issues.forEach(issue => {
      byType[issue.issueType]++;
      byEntityType[issue.entityType]++;
    });

    const averageResolutionTime = this.resolutionHistory.length > 0
      ? this.resolutionHistory.reduce((sum, r) => sum + r.timeToResolve, 0) / this.resolutionHistory.length
      : 0;

    return {
      totalIssues: issues.length,
      unresolvedIssues: unresolved.length,
      resolvedIssues: resolved.length,
      byType,
      byEntityType,
      averageResolutionTime
    };
  }

  addConflictListener(listener: (issue: SyncIssue, details?: SyncConflictDetails) => void): () => void {
    this.conflictListeners.push(listener);
    return () => {
      this.conflictListeners = this.conflictListeners.filter(l => l !== listener);
    };
  }

  private notifyConflictListeners(issue: SyncIssue, details?: SyncConflictDetails): void {
    this.conflictListeners.forEach(listener => {
      try {
        listener(issue, details);
      } catch (e) {
        console.error('Conflict listener error:', e);
      }
    });
  }

  clear(): void {
    this.issues.clear();
    this.resolutionHistory = [];
  }

  clearResolved(): void {
    const resolved = Array.from(this.issues.entries()).filter(([, issue]) => issue.resolution);
    resolved.forEach(([id]) => this.issues.delete(id));
  }
}

export const syncIssueTracker = SyncIssueTracker.getInstance();
