import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, AlertTriangle, Info, Zap, XCircle } from 'lucide-react';
import { IOSTopBar } from '../components/ios';
import { useIOSToast, toast } from '../components/ios';

interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  component: 'pwa' | 'network' | 'server' | 'shared';
  category: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  version?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ErrorStats {
  total: number;
  byLevel: Record<string, number>;
  byComponent: Record<string, number>;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  recent: number;
}

export const ErrorDashboard: React.FC = () => {
  const { toast: showToast } = useIOSToast();
  const [filters, setFilters] = useState({
    component: '',
    severity: '',
    category: '',
    hours: 24
  });

  // Fetch error statistics
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery<ErrorStats>({
    queryKey: ['error-stats'],
    queryFn: async () => {
      const response = await fetch('/api/v1/errors/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch error statistics');
      }
      return response.json();
    },
    refetchInterval: 30000, 
  });

  // Fetch recent errors
  const { data: errors, isLoading: isErrorsLoading, refetch: refetchErrors } = useQuery<ErrorReport[]>({
    queryKey: ['recent-errors', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.component) params.append('component', filters.component);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.category) params.append('category', filters.category);
      params.append('hours', filters.hours.toString());
      
      const response = await fetch(`/api/v1/errors/recent?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent errors');
      }
      const result = await response.json();
      return result.data || [];
    },
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchStats(), refetchErrors()]);
      showToast(toast.success('System stats updated'));
    } catch (error) {
      showToast(toast.error('Sync failed'));
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug': return <Zap className="w-4 h-4 text-purple-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'debug': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleBack = () => window.history.back();

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      <IOSTopBar 
        title="Protocol Monitor" 
        showBackButton 
        onBack={handleBack}
        rightAction={
          <button 
            onClick={handleRefresh}
            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
          >
            <RefreshCw className={cn("w-5 h-5", (isStatsLoading || isErrorsLoading) && "animate-spin")} />
          </button>
        }
      />
      
      <div className="px-4 py-4 space-y-6">
        {/* Filter Section */}
        <section>
          <IOSCard padding="md" className="space-y-4">
            <div className="flex items-center justify-between mb-1 px-1">
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Global Filters</h2>
              <span className="text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded uppercase">Live Feed</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filters.component}
                onChange={(e) => setFilters({...filters, component: e.target.value})}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="">All Components</option>
                <option value="pwa">PWA</option>
                <option value="network">Network</option>
                <option value="server">Server</option>
              </select>
              
              <select
                value={filters.severity}
                onChange={(e) => setFilters({...filters, severity: e.target.value})}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="">All Severities</option>
                <option value="low">Low Impact</option>
                <option value="medium">Medium</option>
                <option value="high">High Severity</option>
                <option value="critical">Mission Critical</option>
              </select>
            </div>
          </IOSCard>
        </section>
        
        {/* Stats Cards */}
        {stats && (
          <section>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <div className="text-lg font-black text-gray-900 dark:text-white">{stats.total}</div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Historical</div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <div className="text-lg font-black text-red-500">{stats.byLevel.error || 0}</div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Failures</div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <div className="text-lg font-black text-blue-500">{stats.recent}</div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">60m Window</div>
              </div>
            </div>
          </section>
        )}
        
        {/* Recent Errors */}
        <section className="space-y-3">
          <div className="px-1 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Detection Stream</h3>
            <span className="text-[9px] text-gray-400 font-mono">COUNT: {errors?.length || 0}</span>
          </div>
          
          <div className="space-y-3">
            {isErrorsLoading ? (
              <IOSSkeletonList count={5} />
            ) : errors && errors.length > 0 ? (
              errors.map((error) => (
                <IOSCard key={error.id} padding="md" className="space-y-3 group border-2 border-transparent hover:border-blue-500/10 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded-md border shadow-sm", getLevelColor(error.level))}>
                          {error.level}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-700">
                          {error.component}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-700">
                          {error.category}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white break-words leading-snug">
                        {error.message}
                      </h4>
                      
                      <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(error.timestamp).toLocaleTimeString()}</span>
                        {error.userId && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {error.userId.substring(0, 8)}</span>}
                      </div>
                      
                      {error.stack && (
                        <details className="mt-3 group/stack">
                          <summary className="cursor-pointer text-[10px] font-black text-blue-500/60 uppercase tracking-widest hover:text-blue-500 transition-colors list-none flex items-center gap-1">
                            <ChevronRight className="w-3 h-3 group-open/stack:rotate-90 transition-transform" />
                            Intelligence Trace
                          </summary>
                          <pre className="mt-2 p-3 bg-black/90 dark:bg-black rounded-xl text-[10px] font-mono text-blue-300/80 overflow-x-auto ios-scrollbar-hide border border-white/5">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                    
                    <div className={cn("shrink-0 w-1.5 h-12 rounded-full", 
                      error.severity === 'critical' ? "bg-red-500" :
                      error.severity === 'high' ? "bg-orange-500" :
                      error.severity === 'medium' ? "bg-yellow-500" : "bg-green-500"
                    )} />
                  </div>
                </IOSCard>
              ))
            ) : (
              <div className="py-20 text-center opacity-40">
                <Shield size={48} className="mx-auto mb-4 text-green-500" />
                <p className="text-sm font-bold uppercase tracking-widest text-green-600 dark:text-green-400">System Integrity Verified</p>
                <p className="text-xs mt-1">No protocol anomalies detected</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ErrorDashboard;