import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download, RefreshCw, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../unified/Card';
import { Button } from '../unified/Button';
import { Input } from '../unified/Input';
import { adminApiService, LogEntry } from '../../lib/admin-api';

interface LogsPanelProps {
  onLoadingChange?: (loading: boolean) => void;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ onLoadingChange }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [levelFilter, searchTerm]);

  const loadLogs = async () => {
    setIsLoading(true);
    onLoadingChange?.(true);
    
    try {
      const systemLogs = await adminApiService.getSystemLogs(levelFilter, searchTerm);
      setLogs(systemLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  const filterLogs = () => {
    // The filtering is now done on the server side
    setFilteredLogs(logs);
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return <Info className="w-4 h-4" />;
      case 'warn': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'debug': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'warn': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'error': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'debug': return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const exportLogs = async () => {
    try {
      const allLogs = await adminApiService.getSystemLogs();
      const csvContent = [
        'Timestamp,Level,Source,Message,Details',
        ...allLogs.map(log =>
          `${log.timestamp},${log.level},${log.source},"${log.message}","${log.details || ''}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>System Logs</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={loadLogs}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
                disabled={filteredLogs.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {filteredLogs.length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Info</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {filteredLogs.filter(l => l.level === 'info').length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Warnings</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {filteredLogs.filter(l => l.level === 'warn').length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Errors</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {filteredLogs.filter(l => l.level === 'error').length}
              </div>
            </div>
          </div>

          {/* Log Entries */}
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getLevelIcon(log.level)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {log.source}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                  {log.message}
                </div>
                
                {log.details && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded p-2">
                    {log.details}
                  </div>
                )}
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No logs found matching your filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};