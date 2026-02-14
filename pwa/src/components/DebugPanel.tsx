import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Terminal, Bug, X, Trash2, Download, Copy, Search, 
  ChevronDown, Pause, Play, 
  Maximize2, Minimize2, Activity, Cpu, Database
} from 'lucide-react';
import { logger, type LogEntry, LogLevel, type LogSource } from '../lib/logger';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// ATOMS
// ============================================================================

const Badge = ({ children, className, variant = 'default' }: { 
  children: React.ReactNode; 
  className?: string;
  variant?: 'default' | 'error' | 'warn' | 'info' | 'debug' | 'server' | 'client';
}) => {
  const variants = {
    default: 'bg-gray-800 text-gray-400',
    error: 'bg-red-500/20 text-red-400 border-red-500/50',
    warn: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    debug: 'bg-gray-700/50 text-gray-400 border-gray-600/50',
    server: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    client: 'bg-green-500/20 text-green-400 border-green-500/50',
  };

  return (
    <span className={cn(
      "px-1.5 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-tighter border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

// ============================================================================
// LOG ITEM
// ============================================================================

const LogItem = React.memo(({ log, isExpanded, onToggle }: { 
  log: LogEntry; 
  isExpanded: boolean; 
  onToggle: () => void;
}) => {
  const levelVariant = log.level.toLowerCase() as any;
  const hasDetails = !!(log.data || log.error);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `[${new Date(log.timestamp).toISOString()}] [${log.level}] [${log.source.toUpperCase()}] [${log.module}] ${log.message}${
      log.data ? '\nData: ' + JSON.stringify(log.data, null, 2) : ''
    }${log.error ? '\nError: ' + log.error.stack : ''}`;
    navigator.clipboard.writeText(text);
  };
  
  return (
    <div 
      className={cn(
        "group border-b border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer relative",
        isExpanded && "bg-white/[0.06]"
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-2 p-2 font-mono text-[11px] leading-tight pr-10">
        {/* Expansion Indicator */}
        <div className={cn(
          "shrink-0 mt-0.5 transition-transform duration-200",
          !hasDetails && "opacity-0",
          isExpanded ? "rotate-0" : "-rotate-90"
        )}>
          <ChevronDown size={12} className="text-white/20" />
        </div>

        <span className="text-white/30 shrink-0 font-light tabular-nums">
          {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
        </span>
        
        <div className="flex gap-1 shrink-0">
          <Badge variant={levelVariant}>{log.level.slice(0,3)}</Badge>
          <Badge variant={log.source === 'server' ? 'server' : 'client'}>{log.source}</Badge>
        </div>

        <span className={cn(
          "shrink-0 hidden sm:inline px-1 py-0.5 rounded text-[9px] font-bold border border-white/10",
          log.module === 'STORAGE' ? "bg-blue-500/10 text-blue-400" :
          log.module === 'DAG' ? "bg-purple-500/10 text-purple-400" :
          log.module === 'CRYPTO' ? "bg-green-500/10 text-green-400" :
          log.module === 'API' ? "bg-orange-500/10 text-orange-400" :
          "bg-gray-800 text-gray-400"
        )}>
          {log.module}
        </span>

        <span className={cn(
          "break-all selection:bg-blue-500/30",
          log.level === LogLevel.ERROR ? "text-red-400" : 
          log.level === LogLevel.WARN ? "text-yellow-200" : "text-white/80",
          !isExpanded && "truncate"
        )}>
          {log.message}
        </span>

        {/* Individual Copy Action */}
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 p-1.5 rounded-sm bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white"
          title="Copy entry"
        >
          <Copy size={12} />
        </button>
      </div>

      {isExpanded && (
        <div className="px-10 pb-3 animate-in slide-in-from-top-1 duration-200">
          {log.data != null && (
            <div className="mt-1 relative group/code">
              <pre className="p-3 bg-black/40 border border-white/5 rounded-sm text-[10px] text-blue-300/80 overflow-x-auto selection:bg-blue-500/50">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          )}
          {log.error && (
            <div className="mt-2 p-3 bg-red-950/20 border border-red-500/20 rounded-sm">
              <div className="text-red-400 font-bold mb-1">{log.error.name}: {log.error.message}</div>
              <pre className="text-[9px] text-red-300/60 leading-relaxed whitespace-pre-wrap italic">
                {log.error.stack}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// MAIN PANEL
// ============================================================================

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [activeSource, setActiveSource] = useState<LogSource | 'both'>('both');
  const [activeLevel, setActiveLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  // Sync ref for callback stability
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  // Handle external open events
  useEffect(() => {
    const handleOpenRequest = (e: any) => {
      console.log('[DEBUG] openscroll:open-debug event caught', e);
      setIsOpen(prev => !prev);
    };
    window.addEventListener('openscroll:open-debug', handleOpenRequest);
    return () => window.removeEventListener('openscroll:open-debug', handleOpenRequest);
  }, []);

  // Initial load & Subscription
  useEffect(() => {
    setLogs(logger.getLogs());

    const handleNewLog = (log: LogEntry) => {
      if (pausedRef.current && log.id !== 'clear') return;
      if (log.id === 'clear') {
        setLogs([]);
        return;
      }
      setLogs(prev => [log, ...prev].slice(0, 2000));
    };

    logger.addListener(handleNewLog);
    
    return () => {
      logger.removeListener(handleNewLog);
    };
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs.length, autoScroll, isPaused]);

  // Filtering
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchSource = activeSource === 'both' || l.source === activeSource;
      const matchLevel = activeLevel === 'ALL' || l.level === activeLevel;
      const matchSearch = !search || 
        l.message.toLowerCase().includes(search.toLowerCase()) ||
        l.module.toLowerCase().includes(search.toLowerCase());
      return matchSource && matchLevel && matchSearch;
    });
  }, [logs, activeSource, activeLevel, search]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stats = useMemo(() => ({
    server: logs.filter(l => l.source === 'server').length,
    client: logs.filter(l => l.source === 'client').length,
    errors: logs.filter(l => l.level === LogLevel.ERROR).length
  }), [logs]);

  if (!isOpen) {
    return null; // Do not render floating button, use BottomNav trigger
  }

  return (
    <div className={cn(
      "fixed z-[9999] bg-black border-l-2 border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] transition-all duration-300 ease-in-out flex flex-col font-mono",
      isZenMode ? "inset-y-0 right-0 w-[400px]" : "inset-0 md:left-20"
    )}>
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-white/10 bg-gradient-to-r from-black via-zinc-950 to-black">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded">
              <Terminal className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">OpenScroll_Log.stream</h2>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5 text-white/40">
              <Cpu className="w-3 h-3" />
              <span className="font-bold text-green-500/80">{stats.client}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/40">
              <Database className="w-3 h-3" />
              <span className="font-bold text-purple-500/80">{stats.server}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/40">
              <Activity className="w-3 h-3" />
              <span className="font-bold text-red-500/80">{stats.errors}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsZenMode(!isZenMode)}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
          >
            {isZenMode ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-sm transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-950/50 border-b border-white/5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="FILTER_SEARCH..."
            className="w-full bg-black border border-white/10 rounded-sm px-8 py-1.5 text-[10px] text-white/80 placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <div className="flex gap-1">
          {(['both', 'client', 'server'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveSource(s)}
              className={cn(
                "px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all",
                activeSource === s ? "bg-white text-black border-white" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <div className="flex gap-1">
          {(['ALL', LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.DEBUG] as const).map(l => (
            <button
              key={l}
              onClick={() => setActiveLevel(l)}
              className={cn(
                "px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all",
                activeLevel === l ? "bg-white text-black border-white" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {l === 'ALL' ? 'ALL' : l.slice(0,3)}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex gap-1">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              "p-2 rounded-sm border transition-all",
              isPaused ? "bg-yellow-500/20 text-yellow-500 border-yellow-500" : "text-white/40 hover:text-white border-transparent"
            )}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button 
            onClick={() => logger.clearLogs()}
            className="p-2 text-white/40 hover:text-red-400 border border-transparent hover:border-red-400/50 rounded-sm transition-all"
          >
            <Trash2 size={14} />
          </button>
          <button 
            onClick={() => {
              const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `openscroll_dump_${Date.now()}.json`;
              a.click();
            }}
            className="p-2 text-white/40 hover:text-blue-400 border border-transparent hover:border-blue-400/50 rounded-sm transition-all"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* LOGS LIST */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-black scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        <div className="flex flex-col">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-20 select-none">
              <Bug size={48} className="mb-4" />
              <div className="text-[10px] font-black uppercase tracking-[0.4em]">Zero_Logs.found</div>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <LogItem 
                key={log.id} 
                log={log} 
                isExpanded={expandedIds.has(log.id)}
                onToggle={() => toggleExpand(log.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-4 py-2 bg-zinc-950 border-t-2 border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[9px] font-bold text-white/30 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isPaused ? "bg-yellow-500" : "bg-green-500")} />
            {isPaused ? "PAUSED_BUFFER" : "LIVE_CAPTURE"}
          </div>
          <div>MEM_LOAD: {(logs.length / 2000 * 100).toFixed(0)}%</div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              "px-3 py-1 text-[9px] font-black uppercase tracking-tighter border rounded-full transition-all",
              autoScroll ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : "text-white/20 border-white/10"
            )}
          >
            AUTO_SCROLL: {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};