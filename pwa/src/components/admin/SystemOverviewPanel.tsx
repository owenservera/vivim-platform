import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Network,
  Activity,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../unified/Card';
import { Badge } from '../unified/Badge';
import { adminApiService, SystemMetrics } from '../../lib/admin-api';

interface SystemOverviewPanelProps {
  onLoadingChange?: (loading: boolean) => void;
}

export const SystemOverviewPanel: React.FC<SystemOverviewPanelProps> = ({ 
  onLoadingChange 
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch real metrics from API
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        onLoadingChange?.(true);
        
        const newMetrics = await adminApiService.getSystemMetrics();
        setMetrics(newMetrics);
        setLastUpdated(new Date());
        
        // Determine system status based on metrics
        if (newMetrics.errorRate > 0.03 || newMetrics.latencyAvg > 50) {
          setSystemStatus('error');
        } else if (newMetrics.errorRate > 0.01 || newMetrics.latencyAvg > 30) {
          setSystemStatus('warning');
        } else {
          setSystemStatus('healthy');
        }
      } catch (error) {
        console.error('Failed to fetch system metrics:', error);
        setSystemStatus('error');
      } finally {
        onLoadingChange?.(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onLoadingChange]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatLatency = (ms: number): string => {
    return `${ms.toFixed(1)}ms`;
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              {getStatusIcon(systemStatus)}
              <span>System Status</span>
            </span>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Wifi className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
              <Badge variant="outline" className={getStatusColor(systemStatus) + ' text-white'}>
                {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Network Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Network className="w-5 h-5" />
              <span>Network</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Peers</span>
              <span className="font-medium">{metrics.peerCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Connections</span>
              <span className="font-medium">{metrics.connectionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Latency</span>
              <span className="font-medium">{formatLatency(metrics.latencyAvg)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Data Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Data Transfer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Inbound</span>
              <span className="font-medium">{formatBytes(metrics.bandwidthIn)}/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Outbound</span>
              <span className="font-medium">{formatBytes(metrics.bandwidthOut)}/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Queue Size</span>
              <span className="font-medium">{metrics.messageQueueSize}</span>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cache Hit Rate</span>
              <span className="font-medium">{(metrics.cacheHitRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">DHT Lookup</span>
              <span className="font-medium">{formatLatency(metrics.dhtLookupTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
              <span className="font-medium">{(metrics.errorRate * 100).toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>System</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Platform</span>
              <span className="font-medium">{navigator.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">User Agent</span>
              <span className="font-medium text-xs" title={navigator.userAgent}>
                {navigator.userAgent.substring(0, 20)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Language</span>
              <span className="font-medium">{navigator.language}</span>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Storage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">IndexedDB</span>
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Available
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Service Worker</span>
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Registered
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cache</span>
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Enabled
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Auth Status</span>
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Authenticated
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemOverviewPanel;