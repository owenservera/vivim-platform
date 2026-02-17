import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Database, 
  Network, 
  Activity, 
  FileText, 
  BarChart3, 
  Shield, 
  Bug,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/unified/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/unified/Card';

// Import admin panel components
const SystemOverviewPanel = React.lazy(() => import('../components/admin/SystemOverviewPanel'));
const DatabasePanel = React.lazy(() => import('../components/admin/DatabasePanel'));
const NetworkPanel = React.lazy(() => import('../components/admin/NetworkPanel'));
const DataFlowPanel = React.lazy(() => import('../components/admin/DataFlowPanel'));
const ActionsPanel = React.lazy(() => import('../components/admin/ActionsPanel'));
const LogsPanel = React.lazy(() => import('../components/admin/LogsPanel'));
const RealTimeLogsPanel = React.lazy(() => import('../components/admin/RealTimeLogsPanel'));
const CRDTManagementPanel = React.lazy(() => import('../components/admin/CRDTManagementPanel'));

type AdminPanelType = 'overview' | 'database' | 'network' | 'dataflow' | 'crdt' | 'realtime-logs' | 'actions' | 'logs';

interface AdminPanelItem {
  id: AdminPanelType;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const adminPanelItems: AdminPanelItem[] = [
  {
    id: 'overview',
    name: 'System Overview',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'System health and metrics'
  },
  {
    id: 'database',
    name: 'Database',
    icon: <Database className="w-5 h-5" />,
    description: 'Database status and operations'
  },
  {
    id: 'network',
    name: 'Network',
    icon: <Network className="w-5 h-5" />,
    description: 'Network nodes and connections'
  },
  {
    id: 'dataflow',
    name: 'Data Flow',
    icon: <Activity className="w-5 h-5" />,
    description: 'Data flow visualization'
  },
  {
    id: 'crdt',
    name: 'CRDT Management',
    icon: <FileText className="w-5 h-5" />,
    description: 'CRDT document management'
  },
  {
    id: 'realtime-logs',
    name: 'Real-time Logs',
    icon: <Bug className="w-5 h-5" />,
    description: 'Live system logs and debugging'
  },
  {
    id: 'actions',
    name: 'Actions',
    icon: <Shield className="w-5 h-5" />,
    description: 'System actions and controls'
  },
  {
    id: 'logs',
    name: 'Log History',
    icon: <FileText className="w-5 h-5" />,
    description: 'Historical log data'
  }
];

export const AdminPanel: React.FC = () => {
  const [activePanel, setActivePanel] = useState<AdminPanelType>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  const renderActivePanel = () => {
    const panelProps = {
      onLoadingChange: (loading: boolean) => setIsLoading(loading)
    };

    switch (activePanel) {
      case 'overview':
        return <SystemOverviewPanel {...panelProps} />;
      case 'database':
        return <DatabasePanel {...panelProps} />;
      case 'network':
        return <NetworkPanel {...panelProps} />;
      case 'dataflow':
        return <DataFlowPanel {...panelProps} />;
      case 'crdt':
        return <CRDTManagementPanel {...panelProps} />;
      case 'realtime-logs':
        return <RealTimeLogsPanel {...panelProps} />;
      case 'actions':
        return <ActionsPanel {...panelProps} />;
      case 'logs':
        return <LogsPanel {...panelProps} />;
      default:
        return <SystemOverviewPanel {...panelProps} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-gray-600 dark:text-gray-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Admin Panel
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                System administration and debugging
              </p>
            </div>
          </div>
          {isLoading && (
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
          <div className="p-4">
            <nav className="space-y-1">
              {adminPanelItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id)}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    activePanel === item.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <span className={cn(
                    'flex-shrink-0',
                    activePanel === item.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  )}>
                    {item.icon}
                  </span>
                  <div className="text-left">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">Loading panel...</p>
                  </div>
                </div>
              }
            >
              {renderActivePanel()}
            </React.Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;