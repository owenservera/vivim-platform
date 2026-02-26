import { EnhancedErrorReport, ErrorCategory, ErrorSeverity, ErrorComponent, ErrorSource } from './error-reporting';

export interface ErrorAggregationConfig {
  timeWindowMs: number;
  minOccurrences: number;
  groupByFields: (keyof EnhancedErrorReport)[];
  alertThresholds: {
    [key in ErrorSeverity]: number;
  };
}

export interface ErrorGroup {
  fingerprint: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  errors: EnhancedErrorReport[];
  severity: ErrorSeverity;
  category: ErrorCategory;
  component: ErrorComponent;
  message: string;
}

export interface ErrorTrend {
  fingerprint: string;
  message: string;
  currentCount: number;
  previousCount: number;
  growthRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ErrorSummary {
  totalErrors: number;
  uniqueErrors: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  byComponent: Record<ErrorComponent, number>;
  groups: ErrorGroup[];
  trends: ErrorTrend[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

export class ErrorAggregator {
  private static instance: ErrorAggregator;
  private errors: EnhancedErrorReport[] = [];
  private config: ErrorAggregationConfig;
  private maxErrors: number = 10000;

  private constructor(config?: Partial<ErrorAggregationConfig>) {
    this.config = {
      timeWindowMs: 3600000,
      minOccurrences: 1,
      groupByFields: ['component', 'category', 'message'],
      alertThresholds: {
        critical: 1,
        high: 5,
        medium: 20,
        low: 50,
        fatal: 1
      },
      ...config
    };
  }

  static getInstance(config?: Partial<ErrorAggregationConfig>): ErrorAggregator {
    if (!ErrorAggregator.instance) {
      ErrorAggregator.instance = new ErrorAggregator(config);
    }
    return ErrorAggregator.instance;
  }

  addError(error: EnhancedErrorReport): void {
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  addErrors(errors: EnhancedErrorReport[]): void {
    errors.forEach(e => this.addError(e));
  }

  getErrorsInTimeWindow(windowMs?: number): EnhancedErrorReport[] {
    const window = windowMs || this.config.timeWindowMs;
    const cutoff = Date.now() - window;
    return this.errors.filter(e => new Date(e.timestamp).getTime() > cutoff);
  }

  groupErrors(errors?: EnhancedErrorReport[]): ErrorGroup[] {
    const errorsToGroup = errors || this.getErrorsInTimeWindow();
    const groups = new Map<string, ErrorGroup>();

    for (const error of errorsToGroup) {
      const fingerprint = this.generateFingerprint(error);
      
      if (!groups.has(fingerprint)) {
        groups.set(fingerprint, {
          fingerprint,
          count: 0,
          firstSeen: new Date(error.timestamp),
          lastSeen: new Date(error.timestamp),
          errors: [],
          severity: error.severity,
          category: error.category,
          component: error.component,
          message: error.message
        });
      }

      const group = groups.get(fingerprint)!;
      group.count++;
      group.errors.push(error);
      
      const errorTime = new Date(error.timestamp).getTime();
      if (errorTime < group.firstSeen.getTime()) {
        group.firstSeen = new Date(error.timestamp);
      }
      if (errorTime > group.lastSeen.getTime()) {
        group.lastSeen = new Date(error.timestamp);
      }
    }

    return Array.from(groups.values()).filter(g => g.count >= this.config.minOccurrences);
  }

  calculateTrends(currentWindowErrors: EnhancedErrorReport[], previousWindowErrors: EnhancedErrorReport[]): ErrorTrend[] {
    const currentGroups = this.groupErrors(currentWindowErrors);
    const previousGroups = this.groupErrors(previousWindowErrors);

    const previousGroupMap = new Map(previousGroups.map(g => [g.fingerprint, g]));

    const trends: ErrorTrend[] = [];

    for (const current of currentGroups) {
      const previous = previousGroupMap.get(current.fingerprint);
      const currentCount = current.count;
      const previousCount = previous?.count || 0;
      const growthRate = previousCount === 0 ? 100 : ((currentCount - previousCount) / previousCount) * 100;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (growthRate > 10) trend = 'increasing';
      else if (growthRate < -10) trend = 'decreasing';

      trends.push({
        fingerprint: current.fingerprint,
        message: current.message,
        currentCount,
        previousCount,
        growthRate,
        trend
      });
    }

    return trends.sort((a, b) => b.growthRate - a.growthRate);
  }

  getSummary(windowMs?: number): ErrorSummary {
    const window = windowMs || this.config.timeWindowMs;
    const currentWindow = this.getErrorsInTimeWindow(window);
    const previousWindow = this.getErrorsInTimeWindow(window * 2).filter(
      e => new Date(e.timestamp).getTime() <= Date.now() - window
    );

    const groups = this.groupErrors(currentWindow);
    const trends = this.calculateTrends(currentWindow, previousWindow);

    const bySeverity: Record<ErrorSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      fatal: 0
    };

    const byCategory: Partial<Record<ErrorCategory, number>> = {};
    const byComponent: Record<ErrorComponent, number> = {
      pwa: 0,
      network: 0,
      server: 0,
      shared: 0,
      api: 0,
      database: 0,
      auth: 0,
      sync: 0
    };

    for (const error of currentWindow) {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      byComponent[error.component] = (byComponent[error.component] || 0) + 1;
    }

    return {
      totalErrors: currentWindow.length,
      uniqueErrors: groups.length,
      bySeverity,
      byCategory: byCategory as Record<ErrorCategory, number>,
      byComponent,
      groups,
      trends,
      timeRange: {
        start: new Date(Date.now() - window),
        end: new Date()
      }
    };
  }

  getAlerts(): Array<{ group: ErrorGroup; alertLevel: ErrorSeverity }> {
    const groups = this.groupErrors();
    const alerts: Array<{ group: ErrorGroup; alertLevel: ErrorSeverity }> = [];

    for (const group of groups) {
      const threshold = this.config.alertThresholds[group.severity];
      if (group.count >= threshold) {
        alerts.push({ group, alertLevel: group.severity });
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder: Record<ErrorSeverity, number> = {
        fatal: 0,
        critical: 1,
        high: 2,
        medium: 3,
        low: 4
      };
      return severityOrder[a.alertLevel] - severityOrder[b.alertLevel];
    });
  }

  clear(): void {
    this.errors = [];
  }

  clearOlderThan(date: Date): number {
    const cutoff = date.getTime();
    const beforeCount = this.errors.length;
    this.errors = this.errors.filter(e => new Date(e.timestamp).getTime() > cutoff);
    return beforeCount - this.errors.length;
  }

  private generateFingerprint(error: EnhancedErrorReport): string {
    const parts: string[] = [];
    for (const field of this.config.groupByFields) {
      const value = error[field];
      if (value) {
        parts.push(String(value));
      }
    }
    return parts.join('|');
  }

  setConfig(config: Partial<ErrorAggregationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ErrorAggregationConfig {
    return { ...this.config };
  }
}

export const errorAggregator = ErrorAggregator.getInstance();
