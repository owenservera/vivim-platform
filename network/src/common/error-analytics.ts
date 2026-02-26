import { EnhancedErrorReport, ErrorCategory, ErrorSeverity, ErrorComponent } from './error-reporting';

export interface TimeSeriesPoint {
  timestamp: number;
  count: number;
}

export interface ErrorAnalytics {
  totalErrors: number;
  uniqueErrors: number;
  errorRate: number;
  mttd: number;
  mttr: number;
  resolutionRate: number;
  topErrors: Array<{ fingerprint: string; message: string; count: number; severity: ErrorSeverity }>;
  timeSeries: {
    byHour: TimeSeriesPoint[];
    byDay: TimeSeriesPoint[];
  };
  distribution: {
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    byComponent: Record<ErrorComponent, number>;
    byHour: Record<number, number>;
  };
  predictions: {
    expectedErrorsNextHour: number;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
  };
}

export class ErrorAnalyticsEngine {
  private static instance: ErrorAnalyticsEngine;
  private errors: EnhancedErrorReport[] = [];
  private resolvedErrors: Map<string, { resolvedAt: Date; createdAt: Date }> = new Map();
  private maxErrors: number = 50000;

  private constructor() {}

  static getInstance(): ErrorAnalyticsEngine {
    if (!ErrorAnalyticsEngine.instance) {
      ErrorAnalyticsEngine.instance = new ErrorAnalyticsEngine();
    }
    return ErrorAnalyticsEngine.instance;
  }

  addError(error: EnhancedErrorReport): void {
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  markResolved(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      this.resolvedErrors.set(errorId, {
        resolvedAt: new Date(),
        createdAt: new Date(error.timestamp)
      });
    }
  }

  getAnalytics(timeRangeHours: number = 24): ErrorAnalytics {
    const cutoff = Date.now() - timeRangeHours * 60 * 60 * 1000;
    const recentErrors = this.errors.filter(e => new Date(e.timestamp).getTime() > cutoff);
    const previousCutoff = cutoff - timeRangeHours * 60 * 60 * 1000;
    const previousErrors = this.errors.filter(
      e => new Date(e.timestamp).getTime() > previousCutoff && new Date(e.timestamp).getTime() <= cutoff
    );

    const uniqueFingerprints = new Set(recentErrors.map(e => e.fingerprint));

    const errorRate = recentErrors.length / (timeRangeHours * 60);

    const resolvedInRange = Array.from(this.resolvedErrors.values()).filter(
      r => r.resolvedAt.getTime() > cutoff
    );
    const resolutionRate = resolvedInRange.length / recentErrors.length || 0;

    const mttd = this.calculateMTTD(recentErrors);
    const mttr = this.calculateMTTR(recentErrors, resolvedInRange);

    const topErrors = this.getTopErrors(recentErrors, 10);
    const timeSeries = this.calculateTimeSeries(recentErrors);
    const distribution = this.calculateDistribution(recentErrors);
    const predictions = this.predictNextHour(recentErrors, previousErrors);

    return {
      totalErrors: recentErrors.length,
      uniqueErrors: uniqueFingerprints.size,
      errorRate,
      mttd,
      mttr,
      resolutionRate,
      topErrors,
      timeSeries,
      distribution,
      predictions
    };
  }

  private calculateMTTD(errors: EnhancedErrorReport[]): number {
    if (errors.length === 0) return 0;
    
    const now = Date.now();
    const detectionTimes = errors.map(e => now - new Date(e.timestamp).getTime());
    return detectionTimes.reduce((sum, t) => sum + t, 0) / detectionTimes.length / 1000 / 60;
  }

  private calculateMTTR(errors: EnhancedErrorReport[], resolved: Array<{ resolvedAt: Date; createdAt: Date }>): number {
    if (resolved.length === 0) return 0;
    
    const totalTime = resolved.reduce((sum, r) => 
      sum + (r.resolvedAt.getTime() - r.createdAt.getTime()), 0
    );
    return totalTime / resolved.length / 1000 / 60;
  }

  private getTopErrors(errors: EnhancedErrorReport[], limit: number): Array<{ fingerprint: string; message: string; count: number; severity: ErrorSeverity }> {
    const counts = new Map<string, { message: string; count: number; severity: ErrorSeverity }>();
    
    for (const error of errors) {
      const existing = counts.get(error.fingerprint);
      if (existing) {
        existing.count++;
      } else {
        counts.set(error.fingerprint, {
          message: error.message,
          count: 1,
          severity: error.severity
        });
      }
    }

    return Array.from(counts.entries())
      .map(([fingerprint, data]) => ({ fingerprint, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private calculateTimeSeries(errors: EnhancedErrorReport[]): { byHour: TimeSeriesPoint[]; byDay: TimeSeriesPoint[] } {
    const byHourMap = new Map<number, number>();
    const byDayMap = new Map<number, number>();

    for (const error of errors) {
      const time = new Date(error.timestamp).getTime();
      const hourKey = Math.floor(time / (60 * 60 * 1000)) * 60 * 60 * 1000;
      const dayKey = Math.floor(time / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000;

      byHourMap.set(hourKey, (byHourMap.get(hourKey) || 0) + 1);
      byDayMap.set(dayKey, (byDayMap.get(dayKey) || 0) + 1);
    }

    const byHour = Array.from(byHourMap.entries())
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const byDay = Array.from(byDayMap.entries())
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return { byHour, byDay };
  }

  private calculateDistribution(errors: EnhancedErrorReport[]): ErrorAnalytics['distribution'] {
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

    const byHour: Record<number, number> = {};

    for (const error of errors) {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      byComponent[error.component] = (byComponent[error.component] || 0) + 1;

      const hour = new Date(error.timestamp).getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    }

    return {
      bySeverity,
      byCategory: byCategory as Record<ErrorCategory, number>,
      byComponent,
      byHour
    };
  }

  private predictNextHour(currentErrors: EnhancedErrorReport[], previousErrors: EnhancedErrorReport[]): ErrorAnalytics['predictions'] {
    const currentCount = currentErrors.length;
    const previousCount = previousErrors.length;
    
    const avgCurrent = currentCount;
    const avgPrevious = previousCount;
    
    let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let confidence = 0.5;

    if (previousCount > 0) {
      const growthRate = (currentCount - previousCount) / previousCount;
      
      if (growthRate > 0.15) {
        trendDirection = 'increasing';
        confidence = Math.min(0.9, 0.5 + Math.abs(growthRate));
      } else if (growthRate < -0.15) {
        trendDirection = 'decreasing';
        confidence = Math.min(0.9, 0.5 + Math.abs(growthRate));
      }
    }

    const expectedErrorsNextHour = avgCurrent * (1 + (trendDirection === 'increasing' ? 0.2 : trendDirection === 'decreasing' ? -0.1 : 0));

    return {
      expectedErrorsNextHour: Math.round(expectedErrorsNextHour),
      trendDirection,
      confidence
    };
  }

  getHealthScore(timeRangeHours: number = 24): number {
    const analytics = this.getAnalytics(timeRangeHours);
    
    let score = 100;
    
    score -= Math.min(30, analytics.errorRate * 10);
    
    if (analytics.resolutionRate < 0.5) score -= 20;
    else if (analytics.resolutionRate < 0.8) score -= 10;
    
    const criticalRatio = analytics.distribution.bySeverity.critical / (analytics.totalErrors || 1);
    score -= criticalRatio * 30;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getComponentHealth(): Array<{ component: ErrorComponent; errorCount: number; healthScore: number }> {
    const components: ErrorComponent[] = ['pwa', 'network', 'server', 'api', 'database', 'auth', 'sync'];
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000;
    const recentErrors = this.errors.filter(e => new Date(e.timestamp).getTime() > cutoff);

    return components.map(component => {
      const componentErrors = recentErrors.filter(e => e.component === component);
      const errorCount = componentErrors.length;
      
      const criticalCount = componentErrors.filter(e => e.severity === 'critical' || e.severity === 'fatal').length;
      const healthScore = Math.max(0, 100 - (errorCount * 2) - (criticalCount * 10));

      return { component, errorCount, healthScore };
    });
  }

  clear(): void {
    this.errors = [];
    this.resolvedErrors.clear();
  }
}

export const errorAnalytics = ErrorAnalyticsEngine.getInstance();
