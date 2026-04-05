/**
 * VIVIM PWA — Investor Demo Components
 *
 * Visualization components for investor POC demos.
 * Every metric tells a story. Every animation has a purpose.
 *
 * Components:
 * - MetricCard — Animated metric display with trend
 * - LiveEventFeed — Real-time event stream (terminal-style)
 * - SystemHealthDashboard — Server/PWA/network status
 * - DemoStatusBadge — Current demo state indicator
 * - MagicMomentBanner — Triggered wow moment display
 * - JourneyProgressBar — Cinematic progress indicator
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// ANIMATED COUNTER (MetricCard core)
// ============================================

/**
 * Animated number counter — smoothly increments from old to new value.
 * The "wow factor" animation for investor metrics.
 */
function AnimatedCounter({
  from = 0,
  to,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  from?: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (to - from) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [to, from, duration]);

  return (
    <span>
      {prefix}
      {value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      {suffix}
    </span>
  );
}

// ============================================
// METRIC CARD
// ============================================

export interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  icon?: React.ReactNode;
  color?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MetricCard({
  label,
  value,
  suffix = '',
  prefix = '',
  trend,
  trendValue,
  icon,
  color = '#3ecfb2',
  description,
  size = 'md',
}: MetricCardProps) {
  const sizeClasses = {
    sm: { value: 'text-2xl', label: 'text-xs', padding: 'p-3' },
    md: { value: 'text-4xl', label: 'text-sm', padding: 'p-5' },
    lg: { value: 'text-6xl', label: 'text-base', padding: 'p-8' },
  };

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    stable: 'text-gray-400',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl bg-gray-900/80 backdrop-blur border border-gray-800 ${sizeClasses[size].padding}`}
      style={{ borderColor: `${color}30` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-gray-400 ${sizeClasses[size].label}`}>{label}</span>
        {icon && <span className="text-lg opacity-60">{icon}</span>}
      </div>

      <div className={`${sizeClasses[size].value} font-bold tabular-nums`} style={{ color }}>
        <AnimatedCounter to={value} prefix={prefix} suffix={suffix} />
      </div>

      {(trend || description) && (
        <div className="flex items-center gap-2 mt-2">
          {trend && trendValue !== undefined && (
            <span className={`text-xs ${trendColors[trend]}`}>
              {trendIcons[trend]} {trendValue}%
            </span>
          )}
          {description && (
            <span className="text-xs text-gray-500">{description}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// LIVE EVENT FEED
// ============================================

export interface DemoEvent {
  id: string;
  type: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: Record<string, unknown>;
}

export function LiveEventFeed({
  events,
  maxEvents = 50,
  height = '300px',
  title = 'Live Event Feed',
}: {
  events: DemoEvent[];
  maxEvents?: number;
  height?: string;
  title?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const levelColors = {
    info: 'text-cyan-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    debug: 'text-gray-500',
  };

  const levelSymbols = {
    info: 'ℹ',
    warn: '⚠',
    error: '✗',
    debug: '·',
  };

  const displayEvents = events.slice(-maxEvents);

  return (
    <div className="rounded-xl bg-black/90 backdrop-blur border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-sm font-mono text-gray-400">{title}</span>
        <span className="text-xs text-gray-600 font-mono">{events.length} events</span>
      </div>

      <div
        ref={scrollRef}
        style={{ height, maxHeight: height }}
        className="overflow-y-auto p-3 font-mono text-xs space-y-1"
      >
        <AnimatePresence initial={false}>
          {displayEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2"
            >
              <span className={`shrink-0 ${levelColors[event.level]}`}>
                {levelSymbols[event.level]}
              </span>
              <span className="text-gray-600 shrink-0">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className={levelColors[event.level]}>
                {event.type}
              </span>
              <span className="text-gray-300">
                {event.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {displayEvents.length === 0 && (
          <div className="text-gray-600 italic">Waiting for events...</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SYSTEM HEALTH DASHBOARD
// ============================================

export interface SystemHealthStatus {
  server: { status: 'healthy' | 'degraded' | 'down'; uptime: string };
  pwa: { status: 'healthy' | 'degraded' | 'down'; cacheHitRate: number };
  network: { status: 'healthy' | 'degraded' | 'down'; peers: number };
  memory: { status: 'healthy' | 'degraded' | 'down'; count: number };
  database: { status: 'healthy' | 'degraded' | 'down'; queryTime: number };
}

export function SystemHealthDashboard({ status }: { status: SystemHealthStatus }) {
  const statusColors: Record<string, string> = {
    healthy: 'bg-emerald-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
  };

  const components = [
    { name: 'API Server', ...status.server, metric: status.server.uptime },
    { name: 'PWA', ...status.pwa, metric: `${status.pwa.cacheHitRate}% cache` },
    { name: 'P2P Network', ...status.network, metric: `${status.network.peers} peers` },
    { name: 'Memory Engine', ...status.memory, metric: `${status.memory.count.toLocale()} memories` },
    { name: 'Database', ...status.database, metric: `${status.database.queryTime}ms avg` },
  ];

  const allHealthy = components.every(c => c.status === 'healthy');

  return (
    <div className="rounded-xl bg-gray-900/80 backdrop-blur border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">System Health</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${allHealthy ? 'bg-emerald-500' : 'bg-yellow-500'} animate-pulse`} />
          <span className={`text-sm ${allHealthy ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {allHealthy ? 'All Systems Operational' : 'Some Systems Degraded'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {components.map((comp) => (
          <div key={comp.name} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${statusColors[comp.status]}`} />
              <span className="text-sm text-gray-400">{comp.name}</span>
            </div>
            <div className="text-xs text-gray-500">{comp.metric}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// DEMO STATUS BADGE
// ============================================

export function DemoStatusBadge({
  isRunning,
  journeyName,
  progress,
}: {
  isRunning: boolean;
  journeyName?: string;
  progress: number;
}) {
  return (
    <div className="flex items-center gap-3">
      {isRunning && (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-emerald-400 font-mono">
            DEMO: {journeyName}
          </span>
          <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {Math.round(progress * 100)}%
          </span>
        </>
      )}
      {!isRunning && (
        <span className="text-sm text-gray-500">Demo Idle</span>
      )}
    </div>
  );
}

// ============================================
// MAGIC MOMENT BANNER
// ============================================

export interface MagicMomentData {
  name: string;
  metric: string;
  value: string;
  story: string;
}

export function MagicMomentBanner({
  moment,
  duration = 5000,
  onDismiss,
}: {
  moment: MagicMomentData;
  duration?: number;
  onDismiss?: () => void;
}) {
  useEffect(() => {
    if (onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="rounded-2xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 backdrop-blur-xl border border-teal-500/30 px-8 py-4 shadow-2xl shadow-teal-500/10">
        <div className="flex items-center gap-4">
          <span className="text-3xl">✨</span>
          <div>
            <div className="text-lg font-bold text-white">{moment.name}</div>
            <div className="text-sm text-teal-300">
              {moment.metric}: <span className="font-bold">{moment.value}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">{moment.story}</div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-white transition-colors ml-4"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// JOURNEY PROGRESS BAR (Cinematic)
// ============================================

export function JourneyProgressBar({
  progress,
  currentStep,
  totalSteps,
  narration,
}: {
  progress: number;
  currentStep: number;
  totalSteps: number;
  narration?: string;
}) {
  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="relative h-1 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-mono">
          Step {currentStep}/{totalSteps}
        </span>
        <span className="text-xs text-gray-500 font-mono">
          {Math.round(progress * 100)}%
        </span>
      </div>

      {/* Narration */}
      <AnimatePresence mode="wait">
        {narration && (
          <motion.div
            key={narration}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-gray-400 italic"
          >
            "{narration}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
