import { useState } from 'react'
import { clsx } from 'clsx'
import { useAppStore } from '../../store/appStore'
import {
  Network,
  Activity,
  Radio,
  Wifi,
  Clock,
  Gauge,
  Signal,
  Server,
  Smartphone,
  Cloud,
  HardDrive,
  Home,
  Zap,
  RefreshCw,
  TrendingUp,
  Minus
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const nodeTypeIcons = {
  BOOTSTRAP: Zap,
  RELAY: Radio,
  INDEXER: Server,
  STORAGE: HardDrive,
  EDGE: Smartphone,
  CLIENT: Cloud,
  SELF_HOSTED: Home,
}

const nodeTypeColors = {
  BOOTSTRAP: 'text-accent-cyan',
  RELAY: 'text-accent-purple',
  INDEXER: 'text-accent-green',
  STORAGE: 'text-accent-orange',
  EDGE: 'text-accent-cyan',
  CLIENT: 'text-dark-400',
  SELF_HOSTED: 'text-accent-green',
}

const statusColors = {
  ACTIVE: 'badge-success',
  DEGRADED: 'badge-warning',
  OFFLINE: 'badge-error',
  BANNED: 'badge-error',
}

export default function NetworkPanel() {
  const { networkNodes, connections, metrics } = useAppStore()
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [view, setView] = useState<'overview' | 'nodes' | 'connections'>('overview')

  const latestMetric = metrics[metrics.length - 1]
  const activeNodes = networkNodes.filter(n => n.status === 'ACTIVE').length

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 border-b border-dark-700 flex items-center justify-between px-6 bg-dark-900">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-accent-cyan" />
          <h1 className="text-lg font-semibold">Network Monitor</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setView('overview')}
            className={clsx('btn text-xs', view === 'overview' ? 'btn-primary' : 'btn-secondary')}
          >
            Overview
          </button>
          <button 
            onClick={() => setView('nodes')}
            className={clsx('btn text-xs', view === 'nodes' ? 'btn-primary' : 'btn-secondary')}
          >
            Nodes
          </button>
          <button 
            onClick={() => setView('connections')}
            className={clsx('btn text-xs', view === 'connections' ? 'btn-primary' : 'btn-secondary')}
          >
            Connections
          </button>
          <button className="btn btn-secondary flex items-center gap-2 ml-4">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {view === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-400">Total Nodes</span>
                  <Signal className="w-4 h-4 text-accent-cyan" />
                </div>
                <div className="text-2xl font-bold">{networkNodes.length}</div>
                <div className="text-xs text-accent-green mt-1 flex items-center gap-1">
                  <TrendingUp size={12} />
                  {activeNodes} active
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-400">Connections</span>
                  <Wifi className="w-4 h-4 text-accent-green" />
                </div>
                <div className="text-2xl font-bold">{connections.filter(c => c.status === 'CONNECTED').length}</div>
                <div className="text-xs text-dark-500 mt-1">
                  {connections.filter(c => c.status === 'CONNECTING').length} connecting
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-400">Avg Latency</span>
                  <Gauge className="w-4 h-4 text-accent-purple" />
                </div>
                <div className="text-2xl font-bold">{latestMetric?.latencyAvg?.toFixed(0) ?? '0'}ms</div>
                <div className="text-xs text-accent-green mt-1 flex items-center gap-1">
                  <Minus size={12} />
                  Stable
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-400">Bandwidth</span>
                  <Activity className="w-4 h-4 text-accent-orange" />
                </div>
                <div className="text-2xl font-bold">{formatBytes(latestMetric?.bandwidthIn || 0)}/s</div>
                <div className="text-xs text-dark-500 mt-1">
                  Out: {formatBytes(latestMetric?.bandwidthOut || 0)}/s
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="panel">
                <div className="panel-header">
                  <h3 className="font-medium">Network Activity</h3>
                </div>
                <div className="panel-content h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.slice(-20)}>
                      <defs>
                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#343541" />
                      <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString()} stroke="#6e6e80" fontSize={10} />
                      <YAxis stroke="#6e6e80" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid #343541', borderRadius: '8px' }}
                        labelFormatter={(v) => new Date(v).toLocaleTimeString()}
                      />
                      <Area type="monotone" dataKey="bandwidthIn" stroke="#00d4ff" fillOpacity={1} fill="url(#colorIn)" />
                      <Area type="monotone" dataKey="bandwidthOut" stroke="#10b981" fillOpacity={1} fill="url(#colorOut)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h3 className="font-medium">Latency & DHT Lookup</h3>
                </div>
                <div className="panel-content h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.slice(-20)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#343541" />
                      <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString()} stroke="#6e6e80" fontSize={10} />
                      <YAxis stroke="#6e6e80" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid #343541', borderRadius: '8px' }}
                      />
                      <Line type="monotone" dataKey="latencyAvg" stroke="#a855f7" strokeWidth={2} dot={false} name="Latency" />
                      <Line type="monotone" dataKey="dhtLookupTime" stroke="#f97316" strokeWidth={2} dot={false} name="DHT Lookup" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3 className="font-medium">Node Status</h3>
              </div>
              <div className="panel-content">
                <div className="grid grid-cols-7 gap-2">
                  {networkNodes.map((node) => {
                    const Icon = nodeTypeIcons[node.type]
                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNode(node.id)}
                        className={clsx(
                          'p-3 rounded-lg border transition-all text-left',
                          selectedNode === node.id 
                            ? 'border-accent-cyan bg-accent-cyan/10' 
                            : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                        )}
                      >
                        <div className={clsx('mb-2', nodeTypeColors[node.type])}>
                          <Icon size={20} />
                        </div>
                        <div className="text-xs text-dark-400 truncate">{node.type}</div>
                        <div className={clsx('text-sm font-medium mt-1', statusColors[node.status] === 'badge-success' ? 'text-accent-green' : statusColors[node.status] === 'badge-warning' ? 'text-accent-orange' : 'text-accent-red')}>
                          {node.status}
                        </div>
                        {node.latency && (
                          <div className="text-xs text-dark-500 mt-1">{node.latency}ms</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'nodes' && (
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-medium">Network Nodes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Node ID</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Latency</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Reputation</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {networkNodes.map((node) => {
                    const Icon = nodeTypeIcons[node.type]
                    return (
                      <tr 
                        key={node.id} 
                        className="table-row cursor-pointer"
                        onClick={() => setSelectedNode(node.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon size={16} className={nodeTypeColors[node.type]} />
                            <span className="font-mono text-xs">{node.nodeId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('badge', nodeTypeColors[node.type].replace('text-', 'bg-') + '/20', nodeTypeColors[node.type])}>
                            {node.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('badge', statusColors[node.status])}>
                            {node.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-dark-300">
                          {node.latency ? `${node.latency}ms` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                              <div 
                                className={clsx(
                                  'h-full rounded-full',
                                  node.reputation >= 90 ? 'bg-accent-green' : node.reputation >= 70 ? 'bg-accent-orange' : 'bg-accent-red'
                                )}
                                style={{ width: `${node.reputation}%` }}
                              />
                            </div>
                            <span className="text-xs text-dark-400">{node.reputation}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-dark-400 text-xs">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(node.lastSeenAt).toLocaleTimeString()}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'connections' && (
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-medium">Node Connections</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Source</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Target</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Transport</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Direction</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Latency</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Data Transfer</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((conn) => {
                    const sourceNode = networkNodes.find(n => n.id === conn.sourceNodeId)
                    const targetNode = networkNodes.find(n => n.id === conn.targetNodeId)
                    return (
                      <tr key={conn.id} className="table-row">
                        <td className="px-4 py-3 font-mono text-xs text-accent-cyan">
                          {sourceNode?.nodeId.slice(0, 12)}...
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-accent-purple">
                          {targetNode?.nodeId.slice(0, 12)}...
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge bg-dark-700 text-dark-300">{conn.transport}</span>
                        </td>
                        <td className="px-4 py-3 text-dark-300">{conn.direction}</td>
                        <td className="px-4 py-3">
                          <span className={clsx(
                            'badge',
                            conn.status === 'CONNECTED' ? 'badge-success' : 
                            conn.status === 'CONNECTING' ? 'badge-warning' : 'badge-error'
                          )}>
                            {conn.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-dark-300">
                          {conn.latency ? `${conn.latency}ms` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-dark-400">
                            <span className="text-accent-green">↑ {formatBytes(conn.bytesSent)}</span>
                            <span className="mx-2">/</span>
                            <span className="text-accent-cyan">↓ {formatBytes(conn.bytesRecv)}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
