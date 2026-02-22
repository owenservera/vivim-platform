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
  RefreshCw,
  Terminal,
  Cpu,
  Layers,
  Radio,
  ChevronRight,
  Clock,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

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
  badge?: string;
  badgeColor?: string;
  group: string;
}

const adminPanelItems: AdminPanelItem[] = [
  {
    id: 'overview',
    name: 'System Overview',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Health & metrics',
    group: 'Monitor',
  },
  {
    id: 'database',
    name: 'Database',
    icon: <Database className="w-4 h-4" />,
    description: 'Status & operations',
    group: 'Monitor',
  },
  {
    id: 'network',
    name: 'Network',
    icon: <Network className="w-4 h-4" />,
    description: 'Nodes & connections',
    group: 'Monitor',
  },
  {
    id: 'dataflow',
    name: 'Data Flow',
    icon: <Activity className="w-4 h-4" />,
    description: 'Flow visualization',
    group: 'Monitor',
  },
  {
    id: 'crdt',
    name: 'CRDT Docs',
    icon: <Layers className="w-4 h-4" />,
    description: 'Document management',
    group: 'Storage',
  },
  {
    id: 'realtime-logs',
    name: 'Live Logs',
    icon: <Radio className="w-4 h-4" />,
    description: 'Real-time stream',
    badge: 'LIVE',
    badgeColor: 'bg-red-500',
    group: 'Logs',
  },
  {
    id: 'logs',
    name: 'Log History',
    icon: <FileText className="w-4 h-4" />,
    description: 'Historical records',
    group: 'Logs',
  },
  {
    id: 'actions',
    name: 'Actions',
    icon: <Shield className="w-4 h-4" />,
    description: 'System controls',
    group: 'Control',
  },
];

const groups = ['Monitor', 'Storage', 'Logs', 'Control'];

export const AdminPanel: React.FC = () => {
  const [activePanel, setActivePanel] = useState<AdminPanelType>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [uptime, setUptime] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setUptime(u => u + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const renderActivePanel = () => {
    const panelProps = {
      onLoadingChange: (loading: boolean) => setIsLoading(loading),
    };
    switch (activePanel) {
      case 'overview':     return <SystemOverviewPanel {...panelProps} />;
      case 'database':     return <DatabasePanel {...panelProps} />;
      case 'network':      return <NetworkPanel {...panelProps} />;
      case 'dataflow':     return <DataFlowPanel {...panelProps} />;
      case 'crdt':         return <CRDTManagementPanel {...panelProps} />;
      case 'realtime-logs':return <RealTimeLogsPanel {...panelProps} />;
      case 'actions':      return <ActionsPanel {...panelProps} />;
      case 'logs':         return <LogsPanel {...panelProps} />;
      default:             return <SystemOverviewPanel {...panelProps} />;
    }
  };

  const activeItem = adminPanelItems.find(i => i.id === activePanel);

  return (
    <div className="admin-panel-root flex flex-col h-full" style={{ minHeight: '100%' }}>
      {/* ─── Top header bar ─────────────────────────────────────── */}
      <div className="admin-topbar flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="admin-back-btn flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="w-px h-5 bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Terminal className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white tracking-tight">Admin Console</span>
              {activeItem && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                  <ChevronRight className="w-3 h-3" />
                  <span>{activeItem.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-2">
          {/* Online status */}
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
            isOnline
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
            )} />
            {isOnline ? 'Online' : 'Offline'}
          </div>

          {/* Uptime */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-white/5 border border-white/10 text-gray-400">
            <Clock className="w-3 h-3" />
            {formatUptime(uptime)}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 border border-violet-500/30 text-violet-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Loading
            </div>
          )}
        </div>
      </div>

      {/* ─── Main content area ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className={cn(
          'admin-sidebar flex-shrink-0 border-r border-white/10 overflow-y-auto transition-all duration-300',
          sidebarOpen ? 'w-52' : 'w-14',
          'bg-gray-950/60 backdrop-blur-md'
        )}>
          <div className="p-2 space-y-4">
            {groups.map(group => {
              const items = adminPanelItems.filter(i => i.group === group);
              return (
                <div key={group}>
                  {sidebarOpen && (
                    <div className="px-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                        {group}
                      </span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {items.map(item => {
                      const isActive = activePanel === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActivePanel(item.id)}
                          title={!sidebarOpen ? item.name : undefined}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 group relative',
                            isActive
                              ? 'bg-violet-600/20 text-violet-300'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                          )}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400 rounded-r-full" />
                          )}

                          <span className={cn(
                            'flex-shrink-0 transition-colors',
                            isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'
                          )}>
                            {item.icon}
                          </span>

                          {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium truncate">{item.name}</span>
                                {item.badge && (
                                  <span className={cn(
                                    'text-[9px] font-bold px-1 py-0.5 rounded text-white',
                                    item.badgeColor || 'bg-gray-600'
                                  )}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-600 group-hover:text-gray-500 truncate">
                                {item.description}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar toggle */}
          <div className="p-2 border-t border-white/5 mt-2">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <ChevronRight className={cn('w-3.5 h-3.5 transition-transform duration-300', sidebarOpen && 'rotate-180')} />
            </button>
          </div>
        </aside>

        {/* Main panel area */}
        <main className="flex-1 overflow-hidden flex flex-col bg-gray-950">
          {/* Panel header breadcrumb */}
          {activeItem && (
            <div className="admin-panel-header flex items-center justify-between px-5 py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                  {activeItem.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{activeItem.name}</div>
                  <div className="text-xs text-gray-500">{activeItem.description}</div>
                </div>
              </div>
              {isLoading && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
                  <span className="text-violet-400">Fetching data…</span>
                </div>
              )}
            </div>
          )}

          {/* Scrollable panel content */}
          <div className="flex-1 overflow-y-auto p-5">
            <React.Suspense
              fallback={
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-violet-400" />
                  </div>
                  <p className="text-sm text-gray-500">Loading panel…</p>
                </div>
              }
            >
              {renderActivePanel()}
            </React.Suspense>
          </div>
        </main>
      </div>

      {/* ─── Inline styles ─────────── */}
      <style>{`
        .admin-panel-root {
          background: #030712;
          color: #e5e7eb;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .admin-topbar {
          background: rgba(3, 7, 18, 0.9);
        }

        .admin-back-btn:hover {
          color: #a78bfa;
        }

        /* Override card styles for dark admin theme */
        .admin-panel-root [class*="card"],
        .admin-panel-root .card {
          background: rgba(255,255,255,0.03) !important;
          border-color: rgba(255,255,255,0.07) !important;
          color: #e5e7eb !important;
        }

        .admin-panel-root [class*="CardTitle"],
        .admin-panel-root h2,
        .admin-panel-root h3 {
          color: #f3f4f6 !important;
        }

        .admin-panel-root [class*="text-gray-600"],
        .admin-panel-root [class*="text-gray-500"] {
          color: #6b7280 !important;
        }

        .admin-panel-root button[class*="btn"],
        .admin-panel-root button[class*="outline"] {
          border-color: rgba(255,255,255,0.12) !important;
          color: #d1d5db !important;
          background: rgba(255,255,255,0.04) !important;
        }

        .admin-panel-root button[class*="outline"]:hover {
          background: rgba(139, 92, 246, 0.12) !important;
          border-color: rgba(139, 92, 246, 0.4) !important;
          color: #a78bfa !important;
        }

        .admin-panel-root [class*="bg-gray-50"],
        .admin-panel-root [class*="bg-gray-100"] {
          background: rgba(255,255,255,0.04) !important;
        }

        .admin-panel-root [class*="bg-gray-800"],
        .admin-panel-root [class*="bg-gray-900"] {
          background: rgba(255,255,255,0.05) !important;
        }

        /* Badge overrides */
        .admin-panel-root [class*="Badge"],
        .admin-panel-root .badge {
          border-color: rgba(255,255,255,0.1) !important;
        }

        .admin-panel-root [class*="bg-green-100"] {
          background: rgba(16, 185, 129, 0.1) !important;
          color: #34d399 !important;
          border-color: rgba(16, 185, 129, 0.2) !important;
        }

        .admin-panel-root [class*="bg-red-100"],
        .admin-panel-root [class*="bg-red-500"] ~ * {
          background: rgba(239, 68, 68, 0.1) !important;
          color: #f87171 !important;
          border-color: rgba(239, 68, 68, 0.2) !important;
        }

        .admin-panel-root [class*="bg-yellow-100"] {
          background: rgba(234, 179, 8, 0.1) !important;
          color: #fbbf24 !important;
          border-color: rgba(234, 179, 8, 0.2) !important;
        }

        .admin-panel-root [class*="bg-blue-100"],
        .admin-panel-root [class*="bg-blue-900"] {
          background: rgba(99, 102, 241, 0.1) !important;
          color: #818cf8 !important;
          border-color: rgba(99, 102, 241, 0.2) !important;
        }

        /* Scrollbar */
        .admin-panel-root ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .admin-panel-root ::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-panel-root ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 9999px;
        }
        .admin-panel-root ::-webkit-scrollbar-thumb:hover {
          background: rgba(139,92,246,0.4);
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;