import { useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { useAppStore } from '../../store/appStore'
import {
  Search,
  Filter,
  Download,
  Trash2,
  Pause,
  Play,
  RefreshCw,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import { systemApi, realTimeUpdates } from '../../lib/api'
import type { LogEntry } from '../../types'

const LogLevelIcons = {
  debug: Info,
  info: CheckCircle,
  warn: AlertTriangle,
  error: AlertCircle,
}

const LogLevelColors = {
  debug: 'text-dark-400',
  info: 'text-accent-green',
  warn: 'text-accent-orange',
  error: 'text-accent-red',
}

const LogLevelBadgeColors = {
  debug: 'bg-dark-700 text-dark-300',
  info: 'bg-accent-green/20 text-accent-green',
  warn: 'bg-accent-orange/20 text-accent-orange',
  error: 'bg-accent-red/20 text-accent-red',
}

export default function RealTimeLogsPanel() {
  const { logs, addLog, clearLogs } = useAppStore()
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['info', 'warn', 'error'])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [availableSources, setAvailableSources] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Fetch initial logs
  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const fetchedLogs = await systemApi.getLogs()
      clearLogs()
      fetchedLogs.forEach(log => addLog(log))
      
      // Extract unique sources
      const sources = Array.from(new Set(fetchedLogs.map(log => log.source)))
      setAvailableSources(sources)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()

    // Set up real-time log updates
    const handleLog = (log: LogEntry) => {
      if (!isPaused) {
        addLog(log)

        // Update available sources if new source is detected
        if (!availableSources.includes(log.source)) {
          setAvailableSources(prev => [...prev, log.source])
        }
      }
    }

    realTimeUpdates.on('log', handleLog)

    return () => {
      realTimeUpdates.off('log', handleLog)
    }
  }, [isPaused, availableSources, addLog])

  // Filter logs based on search term and selected filters
  useEffect(() => {
    let filtered = logs

    // Apply level filter
    if (selectedLevels.length > 0) {
      filtered = filtered.filter(log => selectedLevels.includes(log.level))
    }

    // Apply source filter
    if (selectedSources.length > 0) {
      filtered = filtered.filter(log => selectedSources.includes(log.source))
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        log.source.toLowerCase().includes(term) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(term))
      )
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, selectedLevels, selectedSources])

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && !isPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [filteredLogs, autoScroll, isPaused])

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }

  const exportLogs = () => {
    const data = JSON.stringify(filteredLogs, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyLog = (log: LogEntry) => {
    const text = JSON.stringify(log, null, 2)
    navigator.clipboard.writeText(text)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 border-b border-dark-700 flex items-center justify-between px-6 bg-dark-900">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-accent-cyan" />
          <h1 className="text-lg font-semibold">Real-time Logs</h1>
          <span className="text-sm text-dark-500">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={clsx(
              'btn flex items-center gap-2',
              isPaused ? 'btn-primary' : 'btn-secondary'
            )}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Filters Sidebar */}
        <div className="w-64 border-r border-dark-700 bg-dark-900/50 flex flex-col">
          <div className="p-4 border-b border-dark-700">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} />
              <h3 className="text-sm font-medium">Filters</h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="input w-full pl-10 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <h4 className="text-sm font-medium text-dark-400 mb-2">Log Level</h4>
              <div className="space-y-1">
                {(['debug', 'info', 'warn', 'error'] as const).map(level => (
                  <label key={level} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLevels.includes(level)}
                      onChange={() => toggleLevel(level)}
                      className="rounded border-dark-600 bg-dark-800 text-accent-cyan focus:ring-accent-cyan"
                    />
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = LogLevelIcons[level]
                        return <Icon size={14} className={LogLevelColors[level]} />
                      })()}
                      <span className={clsx('uppercase', LogLevelColors[level])}>
                        {level}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {availableSources.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-dark-400 mb-2">Sources</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {availableSources.map(source => (
                    <label key={source} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source)}
                        onChange={() => toggleSource(source)}
                        className="rounded border-dark-600 bg-dark-800 text-accent-cyan focus:ring-accent-cyan"
                      />
                      <span className="text-dark-300">{source}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logs Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-dark-700 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span>{filteredLogs.length} {filteredLogs.length === 1 ? 'log entry' : 'log entries'}</span>
              {isPaused && (
                <span className="text-accent-orange flex items-center gap-1">
                  <Pause size={12} />
                  Paused
                </span>
              )}
            </div>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={clsx(
                'btn btn-sm flex items-center gap-1',
                autoScroll ? 'btn-primary' : 'btn-secondary'
              )}
            >
              {autoScroll ? <Eye size={12} /> : <EyeOff size={12} />}
              Auto-scroll
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-dark-500">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No logs found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-dark-800">
                {filteredLogs.map(log => {
                  const Icon = LogLevelIcons[log.level]
                  return (
                    <div key={log.id} className="p-4 hover:bg-dark-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Icon size={16} className={LogLevelColors[log.level]} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={clsx(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              LogLevelBadgeColors[log.level]
                            )}>
                              {log.level.toUpperCase()}
                            </span>
                            <span className="text-xs text-dark-500">{log.source}</span>
                            <span className="text-xs text-dark-500">
                              {formatTimestamp(log.timestamp)}
                            </span>
                            <button
                              onClick={() => copyLog(log)}
                              className="text-dark-500 hover:text-dark-300 ml-auto"
                              title="Copy log"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <p className="text-sm text-dark-200 break-all">{log.message}</p>
                          {log.metadata && (
                            <details className="mt-2">
                              <summary className="text-xs text-dark-500 cursor-pointer hover:text-dark-300">
                                View metadata
                              </summary>
                              <pre className="mt-1 text-xs bg-dark-800/50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}