import { useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { useAppStore } from '../../store/appStore'
import { 
  FileText, 
  Search, 
  Trash2, 
  Download, 
  Filter,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import type { LogEntry } from '../../types'

const levelIcons = {
  debug: Bug,
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
}

const levelColors = {
  debug: 'text-dark-500',
  info: 'text-accent-cyan',
  warn: 'text-accent-orange',
  error: 'text-accent-red',
}

const levelBgColors = {
  debug: 'bg-dark-700',
  info: 'bg-accent-cyan/20',
  warn: 'bg-accent-orange/20',
  error: 'bg-accent-red/20',
}

export default function LogsPanel() {
  const { logs, clearLogs, addLog } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const sources = [...new Set(logs.map(log => log.source))]

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter
    const matchesSource = sourceFilter === 'all' || log.source === sourceFilter
    return matchesSearch && matchesLevel && matchesSource
  })

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        const randomMessages = [
          { level: 'debug', source: 'DHT', message: 'Routing table lookup: 45ms' },
          { level: 'info', source: 'Network', message: 'Peer connected: QmNewPeer1...' },
          { level: 'debug', source: 'CRDT', message: 'Document updated: doc:conv:001' },
          { level: 'info', source: 'PubSub', message: 'Message published to Topic:general' },
          { level: 'warn', source: 'Network', message: 'High latency detected: 150ms' },
          { level: 'debug', source: 'Storage', message: 'Cache hit: content:abc123' },
        ]
        const randomMsg = randomMessages[Math.floor(Math.random() * randomMessages.length)]
        addLog({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: randomMsg.level as LogEntry['level'],
          source: randomMsg.source,
          message: randomMsg.message,
        })
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, addLog])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [filteredLogs.length])

  const handleExport = () => {
    const content = filteredLogs
      .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`)
      .join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vivim-logs-${new Date().toISOString().split('T')[0]}.log`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 border-b border-dark-700 flex items-center justify-between px-6 bg-dark-900">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-accent-cyan" />
          <h1 className="text-lg font-semibold">System Logs</h1>
          <span className="text-sm text-dark-500">({filteredLogs.length} entries)</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={clsx('btn flex items-center gap-2', autoRefresh ? 'btn-primary' : 'btn-secondary')}
          >
            <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
            Auto
          </button>
          <button 
            onClick={handleExport}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download size={14} />
            Export
          </button>
          <button 
            onClick={clearLogs}
            className="btn btn-danger flex items-center gap-2"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </header>

      <div className="px-6 py-3 border-b border-dark-700 bg-dark-900/50 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="input w-full pl-10 text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-dark-500" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="input text-sm py-1.5"
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
          
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="input text-sm py-1.5"
          >
            <option value="all">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-dark-500">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No logs to display</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {filteredLogs.map((log) => {
              const LevelIcon = levelIcons[log.level]
              const isExpanded = expandedLog === log.id
              
              return (
                <div 
                  key={log.id}
                  className={clsx(
                    'hover:bg-dark-800/30 transition-colors',
                    levelBgColors[log.level]
                  )}
                >
                  <button
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    className="w-full px-6 py-2 flex items-start gap-3 text-left"
                  >
                    <div className="text-dark-500 text-xs pt-0.5 w-20 flex-shrink-0">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="ml-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <LevelIcon size={14} className={clsx('flex-shrink-0 mt-0.5', levelColors[log.level])} />
                    <span className={clsx('badge text-xs flex-shrink-0', levelColors[log.level], levelBgColors[log.level])}>
                      {log.level}
                    </span>
                    <span className="text-accent-purple text-xs flex-shrink-0 w-20">{log.source}</span>
                    <span className="text-dark-300 flex-1">{log.message}</span>
                  </button>
                  
                  {isExpanded && log.metadata && (
                    <div className="px-6 pb-3 pl-20">
                      <pre className="text-xs text-dark-400 bg-dark-800 p-3 rounded overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}
