import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import {
  Users,
  MessageSquare,
  Wifi,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Legend
} from 'recharts'
import {
  systemApi,
  networkApi,
  realTimeUpdates
} from '../../lib/api'
import type { 
  SystemStats, 
  UserStats, 
  ConversationStats, 
  StorageStats,
  NetworkMetric 
} from '../../types'

export default function SystemOverviewPanel() {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [conversationStats, setConversationStats] = useState<ConversationStats | null>(null)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetric[]>([])
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    if (bytes < 1024 * 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-accent-green'
      case 'degraded': return 'text-accent-orange'
      case 'unhealthy': return 'text-accent-red'
      default: return 'text-dark-400'
    }
  }

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'bg-accent-green'
      case 'degraded': return 'bg-accent-orange'
      case 'down': return 'bg-accent-red'
      default: return 'bg-dark-600'
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [system, users, conversations, storage, network, health] = await Promise.all([
        systemApi.getSystemStats(),
        systemApi.getUserStats(),
        systemApi.getConversationStats(),
        systemApi.getStorageStats(),
        networkApi.getMetrics(50),
        systemApi.getHealth()
      ])

      setSystemStats(system)
      setUserStats(users)
      setConversationStats(conversations)
      setStorageStats(storage)
      setNetworkMetrics(network)
      setSystemHealth(health)
    } catch (error) {
      console.error('Failed to fetch system overview data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
    
    // Set up real-time updates
    realTimeUpdates.connect()
    realTimeUpdates.on('system_stats', (data: SystemStats) => {
      setSystemStats(data)
    })
    realTimeUpdates.on('network_metrics', (data: NetworkMetric) => {
      setNetworkMetrics(prev => [...prev.slice(-49), data])
    })
    realTimeUpdates.on('system_health', (data: any) => {
      setSystemHealth(data)
    })

    return () => {
      realTimeUpdates.disconnect()
    }
  }, [])

  const latestMetric = networkMetrics[networkMetrics.length - 1]

  // Prepare data for charts
  const storageData = storageStats ? [
    { name: 'Used', value: storageStats.usedSize, color: '#ef4444' },
    { name: 'Free', value: storageStats.freeSize, color: '#10b981' }
  ] : []

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 border-b border-dark-700 flex items-center justify-between px-6 bg-dark-900">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-accent-cyan" />
          <h1 className="text-lg font-semibold">System Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchAllData}
            disabled={loading}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {/* System Health Status */}
        {systemHealth && (
          <div className="panel mb-6">
            <div className="panel-header">
              <h3 className="font-medium">System Health</h3>
              <span className={clsx('text-sm font-medium', getHealthStatusColor(systemHealth.status))}>
                {systemHealth.status.toUpperCase()}
              </span>
            </div>
            <div className="panel-content">
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className={clsx('w-3 h-3 rounded-full', getServiceStatusColor(systemHealth.services.database))} />
                  <span className="text-sm">Database</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={clsx('w-3 h-3 rounded-full', getServiceStatusColor(systemHealth.services.network))} />
                  <span className="text-sm">Network</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={clsx('w-3 h-3 rounded-full', getServiceStatusColor(systemHealth.services.storage))} />
                  <span className="text-sm">Storage</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={clsx('w-3 h-3 rounded-full', getServiceStatusColor(systemHealth.services.api))} />
                  <span className="text-sm">API</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Total Users</span>
              <Users className="w-4 h-4 text-accent-cyan" />
            </div>
            <div className="text-2xl font-bold">{userStats?.totalUsers?.toLocaleString() || '0'}</div>
            <div className="text-xs text-accent-green mt-1 flex items-center gap-1">
              <TrendingUp size={12} />
              {userStats?.newUsersToday || 0} today
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Conversations</span>
              <MessageSquare className="w-4 h-4 text-accent-purple" />
            </div>
            <div className="text-2xl font-bold">{conversationStats?.totalConversations?.toLocaleString() || '0'}</div>
            <div className="text-xs text-accent-green mt-1 flex items-center gap-1">
              <TrendingUp size={12} />
              {conversationStats?.conversationsToday || 0} today
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Network Nodes</span>
              <Wifi className="w-4 h-4 text-accent-green" />
            </div>
            <div className="text-2xl font-bold">{latestMetric?.peerCount || '0'}</div>
            <div className="text-xs text-dark-500 mt-1">
              {latestMetric?.connectionCount || 0} connections
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">System Uptime</span>
              <Clock className="w-4 h-4 text-accent-orange" />
            </div>
            <div className="text-2xl font-bold">{systemStats ? formatUptime(systemStats.uptime) : '0d 0h 0m'}</div>
            <div className="text-xs text-accent-green mt-1 flex items-center gap-1">
              <CheckCircle size={12} />
              Running
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* System Resources */}
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-medium">System Resources</h3>
            </div>
            <div className="panel-content h-64">
              {systemStats ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-dark-400">CPU Usage</span>
                      <span className="font-medium">{systemStats.cpu.usage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-cyan"
                        style={{ width: `${systemStats.cpu.usage}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-dark-400">Memory Usage</span>
                      <span className="font-medium">{systemStats.memory.usage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-purple"
                        style={{ width: `${systemStats.memory.usage}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-dark-400">Disk Usage</span>
                      <span className="font-medium">{systemStats.disk.usage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-orange"
                        style={{ width: `${systemStats.disk.usage}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-dark-500">
                    <span>{formatBytes(systemStats.memory.used)} / {formatBytes(systemStats.memory.total)} RAM</span>
                    <span className="mx-2">•</span>
                    <span>{formatBytes(systemStats.disk.used)} / {formatBytes(systemStats.disk.total)} Disk</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-dark-500">
                  Loading system resources...
                </div>
              )}
            </div>
          </div>

          {/* Network Activity */}
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-medium">Network Activity</h3>
            </div>
            <div className="panel-content h-64">
              {networkMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={networkMetrics}>
                    <defs>
                      <linearGradient id="colorBandwidth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#343541" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(v) => new Date(v).toLocaleTimeString()} 
                      stroke="#6e6e80" 
                      fontSize={10} 
                    />
                    <YAxis stroke="#6e6e80" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid #343541', borderRadius: '8px' }}
                      labelFormatter={(v) => new Date(v).toLocaleTimeString()}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="bandwidthIn" 
                      stroke="#00d4ff" 
                      fillOpacity={1} 
                      fill="url(#colorBandwidth)" 
                      name="Bandwidth In" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-dark-500">
                  Loading network activity...
                </div>
              )}
            </div>
          </div>

          {/* Storage Distribution */}
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-medium">Storage Distribution</h3>
            </div>
            <div className="panel-content h-64">
              {storageData.length > 0 ? (
                <div className="h-full flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={storageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {storageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid #343541', borderRadius: '8px' }}
                        formatter={(value) => formatBytes(value as number)}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-dark-500">
                  Loading storage data...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* User Activity */}
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-medium">User Activity</h3>
            </div>
            <div className="panel-content h-64">
              {userStats ? (
                <div className="h-full">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent-cyan">{userStats.activeUsers}</div>
                      <div className="text-xs text-dark-500">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent-purple">{userStats.newUsersThisWeek}</div>
                      <div className="text-xs text-dark-500">New This Week</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent-green">{userStats.newUsersThisMonth}</div>
                      <div className="text-xs text-dark-500">New This Month</div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium mb-2">Top Active Users</div>
                    <div className="space-y-2">
                      {userStats.topUsersByActivity?.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <span className="text-dark-300">{user.name}</span>
                          <span className="text-xs text-dark-500">{user.activityScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-dark-500">
                  Loading user activity...
                </div>
              )}
            </div>
          </div>

          {/* Conversation Activity */}
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-medium">Conversation Activity</h3>
            </div>
            <div className="panel-content h-64">
              {conversationStats ? (
                <div className="h-full">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent-cyan">{conversationStats.activeConversations}</div>
                      <div className="text-xs text-dark-500">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent-purple">{conversationStats.conversationsThisWeek}</div>
                      <div className="text-xs text-dark-500">This Week</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent-green">{conversationStats.conversationsThisMonth}</div>
                      <div className="text-xs text-dark-500">This Month</div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium mb-2">Top Active Conversations</div>
                    <div className="space-y-2">
                      {conversationStats.topConversationsByActivity?.slice(0, 5).map((conv) => (
                        <div key={conv.id} className="flex items-center justify-between">
                          <span className="text-dark-300 truncate max-w-[200px]" title={conv.title}>{conv.title}</span>
                          <span className="text-xs text-dark-500">{conv.messageCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-dark-500">
                  Loading conversation activity...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}