import React, { useState, useEffect } from 'react';
import { Activity, ArrowRight, Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../unified/Card';
import { Button } from '../unified/Button';
import { adminApiService, DataFlow } from '../../lib/admin-api';

interface DataFlowPanelProps {
  onLoadingChange?: (loading: boolean) => void;
}

export const DataFlowPanel: React.FC<DataFlowPanelProps> = ({ onLoadingChange }) => {
  const [flows, setFlows] = useState<DataFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDataFlows();
  }, []);

  const loadDataFlows = async () => {
    setIsLoading(true);
    onLoadingChange?.(true);
    
    try {
      const dataFlows = await adminApiService.getDataFlows();
      setFlows(dataFlows);
    } catch (error) {
      console.error('Failed to load data flows:', error);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  const getStatusColor = (status: DataFlow['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'syncing': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'failed': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getTypeIcon = (type: DataFlow['type']) => {
    switch (type) {
      case 'sync': return <RefreshCw className="w-4 h-4" />;
      case 'replication': return <Database className="w-4 h-4" />;
      case 'migration': return <ArrowRight className="w-4 h-4" />;
      case 'backup': return <Database className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Data Flow Overview</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={loadDataFlows}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {flows.filter(f => f.status === 'active').length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <RefreshCw className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {flows.filter(f => f.status === 'pending').length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {flows.filter(f => f.status === 'completed').length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {flows.filter(f => f.status === 'failed').length}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  {getTypeIcon(flow.type)}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {flow.source} → {flow.target}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {flow.type} • {flow.messagesPerSecond > 0 ? `${flow.messagesPerSecond.toFixed(1)} msg/s` : 'N/A'} • {flow.bytesPerSecond > 0 ? `${(flow.bytesPerSecond / 1024).toFixed(1)} KB/s` : 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(flow.status)}`}>
                    {flow.status}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(flow.lastActivity).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};