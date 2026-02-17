import React, { useState, useEffect } from 'react';
import {
  Database,
  Table,
  Key,
  HardDrive,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../unified/Card';
import { Badge } from '../unified/Badge';
import { Button } from '../unified/Button';
import { adminApiService, DatabaseStatus } from '../../lib/admin-api';

interface DatabasePanelProps {
  onLoadingChange?: (loading: boolean) => void;
}

export const DatabasePanel: React.FC<DatabasePanelProps> = ({ 
  onLoadingChange 
}) => {
  const [status, setStatus] = useState<DatabaseStatus>({ ready: false });
  const [isLoading, setIsLoading] = useState(false);
  const [tables, setTables] = useState<any[]>([]);

  // Fetch real database status from API
  useEffect(() => {
    const fetchDatabaseStatus = async () => {
      try {
        setIsLoading(true);
        onLoadingChange?.(true);
        
        const dbStatus = await adminApiService.getDatabaseStatus();
        
        setStatus({
          ready: dbStatus.ready,
          message: dbStatus.message,
          totalConversations: dbStatus.totalConversations,
          totalSize: dbStatus.totalSize,
          lastSync: dbStatus.lastSync
        });
        
        setTables(dbStatus.tables || []);
      } catch (error) {
        console.error('Failed to fetch database status:', error);
        setStatus({
          ready: false,
          message: 'Failed to connect to database'
        });
      } finally {
        setIsLoading(false);
        onLoadingChange?.(false);
      }
    };

    fetchDatabaseStatus();
  }, [onLoadingChange]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      onLoadingChange?.(true);
      
      const dbStatus = await adminApiService.getDatabaseStatus();
      
      setStatus({
        ready: dbStatus.ready,
        message: dbStatus.message,
        totalConversations: dbStatus.totalConversations,
        totalSize: dbStatus.totalSize,
        lastSync: dbStatus.lastSync
      });
      
      setTables(dbStatus.tables || []);
    } catch (error) {
      console.error('Failed to refresh database status:', error);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Database Status</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              {status.ready ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <div className="text-sm font-medium">
                  {status.ready ? 'Online' : 'Offline'}
                </div>
                <div className="text-xs text-gray-500">
                  {status.message}
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium">
                {status.totalConversations || 0}
              </div>
              <div className="text-xs text-gray-500">Conversations</div>
            </div>
            
            <div>
              <div className="text-sm font-medium">
                {status.totalSize ? formatBytes(status.totalSize) : '0 B'}
              </div>
              <div className="text-xs text-gray-500">Total Size</div>
            </div>
            
            <div>
              <div className="text-sm font-medium">
                {status.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'Never'}
              </div>
              <div className="text-xs text-gray-500">Last Sync</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Table className="w-5 h-5" />
            <span>Database Tables</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tables.map((table) => (
              <div
                key={table.name}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Key className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{table.name}</div>
                    <div className="text-sm text-gray-500">
                      {table.rows} rows
                    </div>
                  </div>
                </div>
                <Badge variant="outline">
                  {formatBytes(table.size)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5" />
            <span>Database Operations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  onLoadingChange?.(true);
                  await adminApiService.executeSystemAction('clear-cache');
                  handleRefresh();
                } catch (error) {
                  console.error('Failed to rebuild indexes:', error);
                } finally {
                  setIsLoading(false);
                  onLoadingChange?.(false);
                }
              }}
            >
              Rebuild Indexes
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              icon={<BarChart3 className="w-4 h-4" />}
            >
              Analyze Performance
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              icon={<Clock className="w-4 h-4" />}
            >
              View Query Log
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              icon={<Database className="w-4 h-4" />}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  onLoadingChange?.(true);
                  await adminApiService.executeSystemAction('backup-db');
                } catch (error) {
                  console.error('Failed to backup database:', error);
                } finally {
                  setIsLoading(false);
                  onLoadingChange?.(false);
                }
              }}
            >
              Backup Database
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabasePanel;