import React, { useState, useEffect } from 'react';
import { Network, Wifi, WifiOff, Users, Activity, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../unified/Card';
import { Button } from '../unified/Button';
import { adminApiService, NetworkNode } from '../../lib/admin-api';

interface NetworkPanelProps {
  onLoadingChange?: (loading: boolean) => void;
}

export const NetworkPanel: React.FC<NetworkPanelProps> = ({ onLoadingChange }) => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    setIsLoading(true);
    onLoadingChange?.(true);
    
    try {
      const networkNodes = await adminApiService.getNetworkNodes();
      setNodes(networkNodes);
    } catch (error) {
      console.error('Failed to load network data:', error);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  const getStatusColor = (status: NetworkNode['status']) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'offline': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'connecting': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getTypeIcon = (type: NetworkNode['type']) => {
    switch (type) {
      case 'peer': return <Users className="w-4 h-4" />;
      case 'server': return <Wifi className="w-4 h-4" />;
      case 'client': return <Activity className="w-4 h-4" />;
      default: return <Network className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="w-5 h-5" />
            <span>Network Overview</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={loadNetworkData}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Online</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {nodes.filter(n => n.status === 'online').length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Offline</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {nodes.filter(n => n.status === 'offline').length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Nodes</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {nodes.length}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  {getTypeIcon(node.type)}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {node.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {node.type} • {node.connections} connections
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(node.status)}`}>
                    {node.status}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(node.lastSeen).toLocaleString()}
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