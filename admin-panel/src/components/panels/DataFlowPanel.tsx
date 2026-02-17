import { useState } from 'react'
import { clsx } from 'clsx'
import { useAppStore } from '../../store/appStore'
import {
  Workflow,
  RefreshCw,
  Dna,
  MessageSquare,
  Files,
  Globe,
  ArrowRight,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Boxes,
  Network
} from 'lucide-react'
import { mockDataFlows, mockPubSubTopics } from '../../lib/mockData'

const flowTypeIcons = {
  DHT: Dna,
  PUBSUB: MessageSquare,
  CRDT: Files,
  FEDERATION: Globe,
}

const flowTypeColors = {
  DHT: 'text-accent-cyan border-accent-cyan',
  PUBSUB: 'text-accent-purple border-accent-purple',
  CRDT: 'text-accent-green border-accent-green',
  FEDERATION: 'text-accent-orange border-accent-orange',
}

const statusIcons = {
  active: CheckCircle,
  pending: Clock,
  error: AlertCircle,
}

const statusColors = {
  active: 'text-accent-green',
  pending: 'text-accent-orange',
  error: 'text-accent-red',
}

export default function DataFlowPanel() {
  const { dataFlows, crdtDocuments } = useAppStore()
  const [view, setView] = useState<'visualization' | 'crdt' | 'pubsub'>('visualization')
  const [isPaused, setIsPaused] = useState(false)

  const activeFlows = dataFlows.filter(f => f.status === 'active')
  const pendingFlows = dataFlows.filter(f => f.status === 'pending')
  const errorFlows = dataFlows.filter(f => f.status === 'error')

  const totalBytesPerSec = activeFlows.reduce((sum, f) => sum + f.bytesPerSecond, 0)

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B/s`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB/s`
  }

  const FlowNode = ({ flow, index }: { flow: typeof mockDataFlows[0], index: number }) => {
    const Icon = flowTypeIcons[flow.type as keyof typeof flowTypeIcons]
    const StatusIcon = statusIcons[flow.status as keyof typeof statusIcons]

    return (
      <div 
        className={clsx(
          'absolute p-3 rounded-lg border-2 bg-dark-800/90 backdrop-blur-sm transition-all hover:scale-105 cursor-pointer',
          flowTypeColors[flow.type as keyof typeof flowTypeColors]
        )}
        style={{
          left: `${100 + (index % 4) * 180}px`,
          top: `${50 + Math.floor(index / 4) * 100}px`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon size={16} />
          <span className="text-xs font-medium">{flow.type}</span>
        </div>
        <div className="text-xs text-dark-400 mb-1 truncate max-w-[140px]">{flow.source}</div>
        <ArrowRight size={12} className="mx-auto my-1 text-dark-500" />
        <div className="text-xs text-dark-400 mb-2 truncate max-w-[140px]">{flow.target}</div>
        <div className="flex items-center justify-between">
          <StatusIcon size={14} className={statusColors[flow.status as keyof typeof statusColors]} />
          <span className="text-xs text-dark-500">
            {flow.messagesPerSecond > 0 ? `${flow.messagesPerSecond}/s` : '-'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 border-b border-dark-700 flex items-center justify-between px-6 bg-dark-900">
        <div className="flex items-center gap-3">
          <Workflow className="w-5 h-5 text-accent-cyan" />
          <h1 className="text-lg font-semibold">Data Flow Visualizer</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={clsx('btn flex items-center gap-2', isPaused ? 'btn-primary' : 'btn-secondary')}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2 px-6 py-3 border-b border-dark-700 bg-dark-900/50">
        <button 
          onClick={() => setView('visualization')}
          className={clsx('btn text-xs', view === 'visualization' ? 'btn-primary' : 'btn-secondary')}
        >
          <Boxes size={14} className="mr-1" />
          Flow Visualization
        </button>
        <button
          onClick={() => setView('crdt')}
          className={clsx('btn text-xs', view === 'crdt' ? 'btn-primary' : 'btn-secondary')}
        >
          <Files size={14} className="mr-1" />
          CRDT Documents
        </button>
        <button 
          onClick={() => setView('pubsub')}
          className={clsx('btn text-xs', view === 'pubsub' ? 'btn-primary' : 'btn-secondary')}
        >
          <MessageSquare size={14} className="mr-1" />
          Pub/Sub Topics
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {view === 'visualization' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-400">Active Flows</span>
                  <Activity className="w-4 h-4 text-accent-green" />
                </div>
                <div className="text-2xl font-bold">{activeFlows.length}</div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-400">Pending Flows</span>
                  <Clock className="w-4 h-4 text-accent-orange" />
                </div>
                <div className="text-2xl font-bold">{pendingFlows.length}</div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-400">Error Flows</span>
                  <AlertCircle className="w-4 h-4 text-accent-red" />
                </div>
                <div className="text-2xl font-bold">{errorFlows.length}</div>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-400">Throughput</span>
                  <Network className="w-4 h-4 text-accent-cyan" />
                </div>
                <div className="text-2xl font-bold">{formatBytes(totalBytesPerSec)}</div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3 className="font-medium">Live Data Flows</h3>
                <div className="flex items-center gap-4 text-xs text-dark-400">
                  <span className="flex items-center gap-1">
                    <Dna size={12} className="text-accent-cyan" />
                    DHT
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} className="text-accent-purple" />
                    PubSub
                  </span>
                  <span className="flex items-center gap-1">
                    <Files size={12} className="text-accent-green" />
                    CRDT
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe size={12} className="text-accent-orange" />
                    Federation
                  </span>
                </div>
              </div>
              <div className="panel-content relative h-96 overflow-auto">
                <div className="min-w-[800px] min-h-[400px] relative">
                  {dataFlows.map((flow, index) => (
                    <FlowNode key={flow.id} flow={flow} index={index} />
                  ))}
                  
                  <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                    {dataFlows.map((flow, index) => {
                      const x1 = 100 + (index % 4) * 180 + 100
                      const y1 = 50 + Math.floor(index / 4) * 100 + 40
                      const x2 = 100 + (index % 4) * 180 + 100
                      const y2 = 50 + Math.floor(index / 4) * 100 + 70
                      return (
                        <line
                          key={flow.id}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={flowTypeColors[flow.type as keyof typeof flowTypeColors].split(' ')[0].replace('text-', '')}
                          strokeWidth="1"
                          strokeOpacity="0.3"
                          strokeDasharray={flow.status === 'active' ? 'none' : '4 4'}
                        />
                      )
                    })}
                  </svg>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3 className="font-medium">Flow Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-dark-400">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-dark-400">Source</th>
                      <th className="px-4 py-3 text-left font-medium text-dark-400">Target</th>
                      <th className="px-4 py-3 text-left font-medium text-dark-400">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-dark-400">Messages/s</th>
                      <th className="px-4 py-3 text-left font-medium text-dark-400">Bytes/s</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataFlows.map((flow) => {
                      const Icon = flowTypeIcons[flow.type as keyof typeof flowTypeIcons]
                      const StatusIcon = statusIcons[flow.status as keyof typeof statusIcons]
                      return (
                        <tr key={flow.id} className="table-row">
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              <Icon size={16} className={flowTypeColors[flow.type as keyof typeof flowTypeColors].split(' ')[0]} />
                              {flow.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-dark-300">{flow.source}</td>
                          <td className="px-4 py-3 font-mono text-xs text-dark-300">{flow.target}</td>
                          <td className="px-4 py-3">
                            <span className={clsx('flex items-center gap-1', statusColors[flow.status as keyof typeof statusColors])}>
                              <StatusIcon size={14} />
                              {flow.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-dark-300">{flow.messagesPerSecond}</td>
                          <td className="px-4 py-3 text-dark-300">{formatBytes(flow.bytesPerSecond)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'crdt' && (
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-medium">CRDT Documents</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Document ID</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Entity</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Version</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Active Peers</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Last Synced</th>
                  </tr>
                </thead>
                <tbody>
                  {crdtDocuments.map((doc) => (
                    <tr key={doc.id} className="table-row">
                      <td className="px-4 py-3 font-mono text-xs text-accent-cyan">{doc.docId}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-accent-green/20 text-accent-green">{doc.docType}</span>
                      </td>
                      <td className="px-4 py-3 text-dark-300">{doc.entityType}:{doc.entityId}</td>
                      <td className="px-4 py-3 font-mono text-dark-300">{doc.version}</td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'badge',
                          doc.syncStatus === 'SYNCED' ? 'badge-success' :
                          doc.syncStatus === 'SYNCING' ? 'badge-warning' :
                          doc.syncStatus === 'CONFLICT' ? 'badge-error' :
                          doc.syncStatus === 'OFFLINE' ? 'bg-dark-700 text-dark-400' : 'badge-error'
                        )}>
                          {doc.syncStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-dark-300">{doc.activePeers}</td>
                      <td className="px-4 py-3 text-dark-400 text-xs">
                        {doc.lastSyncedAt ? new Date(doc.lastSyncedAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'pubsub' && (
          <div className="panel">
            <div className="panel-header">
              <h3 className="font-medium">Pub/Sub Topics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Topic</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Subscribers</th>
                    <th className="px-4 py-3 text-left font-medium text-dark-400">Messages</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPubSubTopics.map((topic) => (
                    <tr key={topic.id} className="table-row">
                      <td className="px-4 py-3 font-mono text-xs text-accent-purple">{topic.topic}</td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'badge',
                          topic.type === 'SYSTEM' ? 'bg-accent-orange/20 text-accent-orange' :
                          topic.type === 'CIRCLE' ? 'bg-accent-cyan/20 text-accent-cyan' :
                          topic.type === 'USER' ? 'bg-accent-green/20 text-accent-green' :
                          'bg-dark-700 text-dark-400'
                        )}>
                          {topic.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-dark-300">{topic.subscriberCount}</td>
                      <td className="px-4 py-3 text-dark-300">{topic.messageCount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
