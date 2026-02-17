import React, { useState, useEffect, useRef } from 'react';
import {
  Bug,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Download,
  Filter,
  Search,
  Clock,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../unified/Card';
import { Badge } from '../unified/Badge';
import { Button } from '../unified/Button';
import { Input } from '../unified/Input';
import { adminApiService, LogEntry } from '../../lib/admin-api';

interface RealTimeLogsPanelProps {
  onLoadingChange?: (loading: boolean) => void;
}

const LOG_LEVEL_COLORS = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  debug: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

const LOG_LEVEL_ICONS = {
  info: <Info className="w-4 h-4" />,
  warn: <AlertCircle className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
  debug: <Bug className="w-4 h-4" />
};

export const RealTimeLogsPanel: React.FC<RealTimeLogsPanelProps> = ({ 
  onLoadingChange 
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const maxLogs = 1000; // Maximum number of logs to keep

  // Fetch real logs from API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const initialLogs = await adminApiService.getSystemLogs();
        setLogs(initialLogs);
      } catch (error) {
        console.error('Failed to fetch initial logs:', error);
      }
    };

    fetchLogs();

    // Set up real-time log updates
    const interval = setInterval(async () => {
      try {
        const latestLogs = await adminApiService.getSystemLogs();
        setLogs(prev => {
          // Only add new logs that we haven't seen before
          const newLogs = latestLogs.filter(log =>
            !prev.some(existingLog => existingLog.id === log.id)
          );
          
          const updatedLogs = [...prev, ...newLogs];
          
          // Keep only the last maxLogs entries
          if (updatedLogs.length > maxLogs) {
            return updatedLogs.slice(-maxLogs);
          }
          return updatedLogs;
        });
      } catch (error) {
        console.error('Failed to fetch latest logs:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Filter logs based on level and search term
  useEffect(() => {
    let filtered = logs;
    
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredLogs(filtered);
  }, [logs, levelFilter, searchTerm]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, isAutoScroll]);

  const handleClearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };

  const handleExportLogs = async () => {
    try {
      const allLogs = await adminApiService.getSystemLogs();
      const logData = allLogs.map(log =>
        `[${new Date(log.timestamp).toLocaleString()}] [${log.level.toUpperCase()}] [${log.source}]: ${log.message}`
      ).join('\n');
      
      const blob = new Blob([logData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Bug className="w-5 h-5" />
              <span>Real-time Logs</span>
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoScroll(!isAutoScroll)}
                className={isAutoScroll ? 'bg-blue-100 dark:bg-blue-900' : ''}
              >
                Auto-scroll: {isAutoScroll ? 'On' : 'Off'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportLogs}
                icon={<Download className="w-4 h-4" />}
              >
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLogs}
                icon={<X className="w-4 h-4" />}
              >
                Clear
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Level Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card>
        <CardContent className="p-0">
          <div className="h-96 overflow-y-auto bg-gray-900 text-gray-100 font-mono text-sm">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  <p>No logs found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 p-2 rounded hover:bg-gray-800 transition-colors"
                  >
                    <Badge className={LOG_LEVEL_COLORS[log.level]}>
                      {LOG_LEVEL_ICONS[log.level]}
                      <span className="ml-1">{log.level.toUpperCase()}</span>
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-gray-400">
                          <Clock className="inline w-3 h-3 mr-1" />
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className="text-blue-400">[{log.source}]</span>
                      </div>
                      <p className="text-gray-200 break-all">{log.message}</p>
                      {log.details && (
                        <details className="mt-1">
                          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-200">
                            View details
                          </summary>
                          <pre className="mt-1 p-2 bg-gray-800 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {filteredLogs.filter(l => l.level === 'info').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Info</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredLogs.filter(l => l.level === 'warn').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Warnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(l => l.level === 'error').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {filteredLogs.filter(l => l.level === 'debug').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Debug</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealTimeLogsPanel;