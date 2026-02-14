import { useState } from 'react'
import { clsx } from 'clsx'
import { useAppStore } from '../../store/appStore'
import { 
  Zap, 
  Play, 
  RefreshCw, 
  Database, 
  Network, 
  FileArchive, 
  Globe, 
  Server,
  Radio,
  HardDrive,
  Users,
  MessageSquare,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface Action {
  id: string
  name: string
  description: string
  category: 'NETWORK' | 'DATABASE' | 'SYNC' | 'FEDERATION' | 'SYSTEM'
  icon: React.ElementType
  handler: () => Promise<{ success: boolean; message: string }>
}

const actions: Action[] = [
  {
    id: 'ping-all',
    name: 'Ping All Nodes',
    description: 'Send ping requests to all connected nodes to check latency',
    category: 'NETWORK',
    icon: Radio,
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      return { success: true, message: 'All nodes responded successfully' }
    }
  },
  {
    id: 'refresh-routing',
    name: 'Refresh Routing Table',
    description: 'Rebuild the DHT routing table from bootstrap nodes',
    category: 'NETWORK',
    icon: RefreshCw,
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return { success: true, message: 'Routing table refreshed with 45 new entries' }
    }
  },
  {
    id: 'discover-peers',
    name: 'Discover New Peers',
    description: 'Run peer discovery to find new network participants',
    category: 'NETWORK',
    icon: Users,
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 1800))
      return { success: true, message: 'Discovered 3 new peers' }
    }
  },
  {
    id: 'run-vacuum',
    name: 'Vacuum Database',
    description: 'Run PostgreSQL VACUUM to reclaim storage and optimize',
    category: 'DATABASE',
    icon: Database,
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 3000))
      return { success: true, message: 'Database vacuum completed, 128MB reclaimed' }
    }
  },
  {
    id: 'analyze-tables',
    name: 'Analyze Tables',
    description: 'Run ANALYZE to update query planner statistics',
    category: 'DATABASE',
    icon: Activity,
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 1200))
      return { success: true, message: 'All tables analyzed successfully' }
    }
  },
  {
    id: 'sync-all-crdt',
    name: 'Sync All CRDTs',
    description: 'Force synchronization of all CRDT documents',
    category: 'SYNC',
    icon: FileSync,
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 2500))
      return { success: true, message: '12 documents synced, 3 conflicts detected' }
    }
  },
  {
    id: 'resolve-conflicts',
    name: 'Resolve Conflicts',
    description: 'Automatically resolve CRDT sync conflicts',
    category: 'SYNC',
    icon: Shield,
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      return { success: true, message: '3 conflicts resolved using auto-merge strategy' }
    }
  },
  {
    id: 'test-federation',
    name: 'Test Federation',
    description: 'Test connectivity to all federation instances',
    category: 'FEDERATION',
    icon: Globe,
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return { success: true, message: '2 instances reachable, 1 unreachable' }
    }
  },
  {
    id: 'reconnect-bridge',
    name: 'Reconnect Bridge',
    description: 'Attempt to reconnect failed federation bridge',
    category: 'FEDERATION',
    icon: RefreshCw,
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 1800))
      return { success: false, message: 'Connection refused - instance may be offline' }
    }
  },
  {
    id: 'clear-cache',
    name: 'Clear Cache',
    description: 'Clear local network cache and cached content',
    category: 'SYSTEM',
    icon: HardDrive,
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
      return { success: true, message: 'Cache cleared: 256MB freed' }
    }
  },
  {
    id: 'restart-node',
    name: 'Restart Node',
    description: 'Restart the local network node',
    category: 'SYSTEM',
    icon: Server,
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 3000))
      return { success: true, message: 'Node restarted successfully' }
    }
  },
]

const categoryColors = {
  NETWORK: 'text-accent-cyan',
  DATABASE: 'text-accent-purple',
  SYNC: 'text-accent-green',
  FEDERATION: 'text-accent-orange',
  SYSTEM: 'text-dark-400',
}

export default function ActionsPanel() {
  const { addLog } = useAppStore()
  const [runningAction, setRunningAction] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleAction = async (action: Action) => {
    setRunningAction(action.id)
    setActionResult(null)
    
    try {
      const result = await action.handler()
      setActionResult(result)
      
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        level: result.success ? 'info' : 'error',
        source: action.category,
        message: `${action.name}: ${result.message}`,
      })
    } catch (error) {
      setActionResult({ success: false, message: 'Action failed unexpectedly' })
    } finally {
      setRunningAction(null)
    }
  }

  const groupedActions = actions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = []
    }
    acc[action.category].push(action)
    return acc
  }, {} as Record<string, Action[]>)

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 border-b border-dark-700 flex items-center justify-between px-6 bg-dark-900">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-accent-cyan" />
          <h1 className="text-lg font-semibold">Actions Panel</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {actionResult && (
          <div className={clsx(
            'mb-6 p-4 rounded-lg border flex items-start gap-3',
            actionResult.success 
              ? 'bg-accent-green/10 border-accent-green/30' 
              : 'bg-accent-red/10 border-accent-red/30'
          )}>
            {actionResult.success ? (
              <CheckCircle className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className={clsx('font-medium', actionResult.success ? 'text-accent-green' : 'text-accent-red')}>
                {actionResult.success ? 'Success' : 'Failed'}
              </div>
              <div className="text-sm text-dark-300 mt-1">{actionResult.message}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {Object.entries(groupedActions).map(([category, categoryActions]) => (
            <div key={category} className="panel">
              <div className="panel-header">
                <h3 className={clsx('font-medium flex items-center gap-2', categoryColors[category as keyof typeof categoryColors])}>
                  {category === 'NETWORK' && <Network size={16} />}
                  {category === 'DATABASE' && <Database size={16} />}
                  {category === 'SYNC' && <FileSync size={16} />}
                  {category === 'FEDERATION' && <Globe size={16} />}
                  {category === 'SYSTEM' && <Server size={16} />}
                  {category}
                </h3>
              </div>
              <div className="panel-content space-y-3">
                {categoryActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={runningAction !== null}
                    className={clsx(
                      'w-full p-3 rounded-lg border border-dark-700 bg-dark-800/50 hover:bg-dark-800 hover:border-dark-600 transition-all text-left group',
                      runningAction === action.id && 'border-accent-cyan bg-accent-cyan/5'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={clsx(
                          'p-2 rounded-lg bg-dark-700 group-hover:bg-dark-600',
                          categoryColors[action.category as keyof typeof categoryColors]
                        )}>
                          {runningAction === action.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <action.icon size={16} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-dark-200">{action.name}</div>
                          <div className="text-xs text-dark-500 mt-1">{action.description}</div>
                        </div>
                      </div>
                      <Play size={14} className="text-dark-500 group-hover:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
