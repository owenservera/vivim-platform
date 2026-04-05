/**
 * VIVIM PWA — Investor Pitch Demo Page (Cinematic Redesign)
 *
 * 90-second cinematic demo with premium dark aesthetic, particle field background,
 * and bold gradient typography — matching the VIVIM landing page design system.
 *
 * Design System:
 * - Dark-first (#000000 base, not gray-950)
 * - Particle/star field animated background
 * - Bold gradient typography (teal → gold)
 * - Premium badge/pill components
 * - Generous whitespace, cinematic pacing
 * - Subtle glass panels with border accents
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// PARTICLE FIELD BACKGROUND
// ============================================

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; color: string;
    }> = [];

    const colors = ['#3ecfb2', '#8b5cf6', '#3b82f6', '#d4a94a', '#10b981'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

// ============================================
// DESIGN COMPONENTS
// ============================================

function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-[#3ecfb2] via-[#5eead4] to-[#d4a94a] bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

function Badge({ children, color = '#3ecfb2' }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium"
      style={{
        borderColor: `${color}30`,
        backgroundColor: `${color}08`,
        color,
      }}
    >
      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
      {children}
    </div>
  );
}

function GlassCard({ children, className = '', accent = '#3ecfb2' }: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl ${className}`}
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: `${accent}15`,
      }}
    >
      {children}
    </div>
  );
}

function MetricPill({ label, value, accent = '#3ecfb2' }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold tabular-nums" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function CinematicButton({
  children,
  onClick,
  variant = 'primary',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}) {
  if (variant === 'primary') {
    return (
      <button
        onClick={onClick}
        className="group relative px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #3ecfb2, #2dd4bf)',
          color: '#000',
        }}
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="px-8 py-3.5 rounded-xl font-semibold text-sm text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-white transition-all duration-300"
    >
      {children}
    </button>
  );
}

// ============================================
// DEMO STEP DEFINITIONS
// ============================================

interface DemoStep {
  id: string;
  title: string;
  subtitle: string;
  narration: string;
  duration: number;
}

const DEMO_STEPS: DemoStep[] = [
  { id: 'intro', title: 'VIVIM', subtitle: 'Your Personal AI Memory Platform', narration: '', duration: 4000 },
  { id: 'problem', title: 'The Problem', subtitle: 'Where AI thinking goes to die', narration: 'Your AI conversations live in silos — ChatGPT, Claude, Gemini — disconnected, unsearchable, lost forever.', duration: 10000 },
  { id: 'archive', title: 'The Archive', subtitle: 'All your AI, one place', narration: '609 sessions across 6 providers. 47,000 messages. All searchable. All yours.', duration: 15000 },
  { id: 'extraction', title: 'Memory Extraction', subtitle: 'AI that learns from itself', narration: 'Watch as VIVIM automatically extracts memories — facts, preferences, patterns — building your AI brain in real-time.', duration: 12000 },
  { id: 'graph', title: 'Knowledge Graph', subtitle: 'Your AI brain, visualized', narration: '1,547 connected memories. 4,892 relationships. This is the money shot.', duration: 25000 },
  { id: 'context', title: 'Context Cockpit', subtitle: 'AI that knows you', narration: '2,847 memories. 12,400 tokens. 94% relevance. Because it remembers everything.', duration: 20000 },
  { id: 'trust', title: 'Sovereign & Encrypted', subtitle: 'Your data. Your rules.', narration: '100% end-to-end encrypted. Zero-knowledge architecture. You own it — not us, not OpenAI, not anyone.', duration: 10000 },
  { id: 'close', title: 'Your AI remembers everything.', subtitle: 'You own it.', narration: 'That\'s VIVIM. Sovereign. Portable. Yours.', duration: 8000 },
];

// ============================================
// MAIN DEMO COMPONENT
// ============================================

export function InvestorPitchDemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState({
    memories: 0, sessions: 0, providers: 0,
    graphNodes: 0, graphEdges: 0,
    tokenBudget: 0, relevance: 0,
    encryption: 0,
  });

  const stepTimerRef = useRef<ReturnType<typeof setInterval>>();

  const startDemo = useCallback(() => {
    setIsRunning(true);
    setCurrentStep(0);
    setStepProgress(0);
    setMetrics({ memories: 0, sessions: 0, providers: 0, graphNodes: 0, graphEdges: 0, tokenBudget: 0, relevance: 0, encryption: 0 });
  }, []);

  const stopDemo = useCallback(() => {
    setIsRunning(false);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  }, []);

  // Step progression
  useEffect(() => {
    if (!isRunning) return;

    const step = DEMO_STEPS[currentStep];
    if (!step) {
      setIsRunning(false);
      return;
    }

    // Animate metrics per step
    if (step.id === 'archive') {
      setTimeout(() => setMetrics(m => ({ ...m, sessions: 609, providers: 6 })), 1500);
      setTimeout(() => setMetrics(m => ({ ...m, memories: 50234 })), 3000);
    }
    if (step.id === 'extraction') {
      setTimeout(() => setMetrics(m => ({ ...m, memories: m.memories + 12 })), 2000);
      setTimeout(() => setMetrics(m => ({ ...m, memories: m.memories + 8 })), 5000);
    }
    if (step.id === 'graph') {
      setTimeout(() => setMetrics(m => ({ ...m, graphNodes: 1547, graphEdges: 4892 })), 2000);
    }
    if (step.id === 'context') {
      setTimeout(() => setMetrics(m => ({ ...m, tokenBudget: 12400, relevance: 94 })), 2000);
    }
    if (step.id === 'trust') {
      setTimeout(() => setMetrics(m => ({ ...m, encryption: 100 })), 1000);
    }
    if (step.id === 'close') {
      setTimeout(() => setMetrics(m => ({ ...m, memories: 50284 })), 1500);
    }

    const interval = 50;
    const steps = step.duration / interval;
    let current = 0;

    stepTimerRef.current = setInterval(() => {
      current++;
      setStepProgress(current / steps);
      if (current >= steps) {
        clearInterval(stepTimerRef.current);
        setCurrentStep(prev => prev + 1);
        setStepProgress(0);
      }
    }, interval);

    return () => { if (stepTimerRef.current) clearInterval(stepTimerRef.current); };
  }, [isRunning, currentStep]);

  const totalDuration = DEMO_STEPS.reduce((sum, s) => sum + s.duration, 0);
  const elapsed = DEMO_STEPS.slice(0, currentStep).reduce((sum, s) => sum + s.duration, 0) +
    (DEMO_STEPS[currentStep]?.duration ?? 0) * stepProgress;
  const overallProgress = isRunning ? elapsed / totalDuration : 0;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-[#000000] text-white overflow-hidden relative">
      <ParticleField />

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-xl font-bold tracking-widest" style={{ color: '#3ecfb2' }}>
          VIVIM
        </div>

        {isRunning && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE DEMO
            </div>
            <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #3ecfb2, #d4a94a)' }}
                animate={{ width: `${overallProgress * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <button onClick={stopDemo} className="text-xs text-gray-500 hover:text-white transition-colors">
              Stop
            </button>
          </div>
        )}

        {!isRunning && (
          <CinematicButton onClick={startDemo}>Start Demo</CinematicButton>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {/* INTRO */}
          {currentStep === 0 && isRunning && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl"
            >
              <Badge>The Missing AI Trust Layer</Badge>
              <h1 className="text-6xl md:text-8xl font-bold mt-8 leading-tight">
                Your AI remembers
                <br />
                <GradientText>everything.</GradientText>
                <br />
                <span className="text-gray-500">You own it.</span>
              </h1>
              <p className="text-lg text-gray-500 mt-6 max-w-xl mx-auto leading-relaxed">
                Sovereign, portable memory for every AI interaction.
                <br />Any provider. Every context. Your data.
              </p>
            </motion.div>
          )}

          {/* PROBLEM */}
          {currentStep === 1 && (
            <motion.div
              key="problem"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl"
            >
              <Badge color="#e86848">The Problem</Badge>
              <h2 className="text-5xl md:text-7xl font-bold mt-8 leading-tight">
                Where AI thinking
                <br />
                <span className="text-gray-600">goes to die.</span>
              </h2>
              <p className="text-lg text-gray-500 mt-6 max-w-lg mx-auto leading-relaxed">
                ChatGPT. Claude. Gemini. Six providers. Zero connection.
                Your most valuable AI context — trapped in silos you don't control.
              </p>

              <div className="grid grid-cols-3 gap-4 mt-12 max-w-md mx-auto">
                {['ChatGPT', 'Claude', 'Gemini'].map((p, i) => (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.3, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.2 }}
                    className="p-4 rounded-xl border border-gray-800/50 text-sm text-gray-600"
                  >
                    {p}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ARCHIVE */}
          {currentStep === 2 && (
            <motion.div
              key="archive"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl"
            >
              <Badge>The Archive</Badge>
              <h2 className="text-5xl md:text-7xl font-bold mt-8">
                All your AI,
                <br />
                <GradientText>one place.</GradientText>
              </h2>

              <div className="grid grid-cols-3 gap-8 mt-12">
                <MetricPill label="Sessions" value={metrics.sessions.toLocale()} accent="#3ecfb2" />
                <MetricPill label="Messages" value="47,000" accent="#8b5cf6" />
                <MetricPill label="Providers" value={metrics.providers} accent="#d4a94a" />
              </div>

              <div className="grid grid-cols-6 gap-3 mt-12 max-w-2xl mx-auto">
                {[
                  { name: 'ChatGPT', count: 234, color: '#10b981' },
                  { name: 'Claude', count: 187, color: '#8b5cf6' },
                  { name: 'Gemini', count: 98, color: '#3b82f6' },
                  { name: 'DeepSeek', count: 45, color: '#f59e0b' },
                  { name: 'Grok', count: 32, color: '#ec4899' },
                  { name: 'Mistral', count: 13, color: '#6366f1' },
                ].map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="p-3 rounded-xl border border-gray-800/50 text-center"
                  >
                    <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: p.color }} />
                    <div className="text-xs text-gray-400">{p.name}</div>
                    <div className="text-lg font-bold text-white mt-1">{p.count}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* EXTRACTION */}
          {currentStep === 3 && (
            <motion.div
              key="extraction"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl"
            >
              <Badge color="#ec4899">Memory Extraction</Badge>
              <h2 className="text-5xl md:text-7xl font-bold mt-8">
                AI that
                <br />
                <GradientText>learns from itself.</GradientText>
              </h2>

              <div className="space-y-3 mt-10 text-left max-w-lg mx-auto">
                {[
                  { type: 'PREFERENCE', text: 'Prefers Bun over Node.js', confidence: 95 },
                  { type: 'FACT', text: 'Uses TypeScript with strict mode', confidence: 92 },
                  { type: 'CONVENTION', text: 'Always uses functional components', confidence: 88 },
                  { type: 'GOAL', text: 'Building decentralized AI memory', confidence: 85 },
                ].map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.3 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-800/50 bg-white/[0.02]"
                  >
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider"
                      style={{ backgroundColor: '#ec489920', color: '#ec4899' }}
                    >
                      {m.type}
                    </span>
                    <span className="text-sm text-gray-300 flex-1">{m.text}</span>
                    <span className="text-xs font-mono" style={{ color: '#3ecfb2' }}>{m.confidence}%</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* GRAPH */}
          {currentStep === 4 && (
            <motion.div
              key="graph"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl"
            >
              <Badge color="#8b5cf6">Knowledge Graph</Badge>
              <h2 className="text-5xl md:text-7xl font-bold mt-8">
                Your AI brain,
                <br />
                <GradientText>visualized.</GradientText>
              </h2>

              <div className="grid grid-cols-2 gap-8 mt-10 max-w-md mx-auto">
                <MetricPill label="Nodes" value={metrics.graphNodes.toLocale()} accent="#8b5cf6" />
                <MetricPill label="Edges" value={metrics.graphEdges.toLocale()} accent="#3b82f6" />
              </div>

              {/* Simplified graph visualization */}
              <div className="relative w-72 h-72 mx-auto mt-10">
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="w-48 h-48 rounded-full border border-[#3ecfb2]/20" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="w-36 h-36 rounded-full border border-[#8b5cf6]/20" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-[#3ecfb2] shadow-lg shadow-[#3ecfb2]/50" />
                </div>
                {/* Orbiting nodes */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'][i],
                    }}
                    animate={{
                      x: Math.cos((i / 6) * Math.PI * 2) * 100,
                      y: Math.sin((i / 6) * Math.PI * 2) * 100,
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* CONTEXT */}
          {currentStep === 5 && (
            <motion.div
              key="context"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl"
            >
              <Badge color="#3b82f6">Context Cockpit</Badge>
              <h2 className="text-5xl md:text-7xl font-bold mt-8">
                AI that
                <br />
                <GradientText>knows you.</GradientText>
              </h2>

              <div className="grid grid-cols-3 gap-8 mt-10">
                <MetricPill label="Memories" value={metrics.memories.toLocale() || '50,284'} accent="#ec4899" />
                <MetricPill label="Tokens" value={metrics.tokenBudget.toLocale() || '12,400'} accent="#3b82f6" />
                <MetricPill label="Relevance" value={`${metrics.relevance || 94}%`} accent="#3ecfb2" />
              </div>

              {/* 7-layer stack visualization */}
              <div className="mt-10 max-w-md mx-auto space-y-2">
                {[
                  { level: 'L0', name: 'Core Identity', color: '#3ecfb2', width: '100%' },
                  { level: 'L1', name: 'Physical', color: '#3b82f6', width: '85%' },
                  { level: 'L2', name: 'Network', color: '#8b5cf6', width: '75%' },
                  { level: 'L3', name: 'Ledger', color: '#f59e0b', width: '65%' },
                  { level: 'L4', name: 'Memory', color: '#ec4899', width: '95%' },
                  { level: 'L5', name: 'AI Agent', color: '#6366f1', width: '80%' },
                  { level: 'L6', name: 'Self-Design', color: '#10b981', width: '45%' },
                ].map((layer, i) => (
                  <motion.div
                    key={layer.level}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[10px] font-mono text-gray-600 w-6">{layer.level}</span>
                    <div className="flex-1 h-6 rounded-lg overflow-hidden bg-gray-900">
                      <motion.div
                        className="h-full rounded-lg"
                        style={{ backgroundColor: `${layer.color}30`, borderLeft: `2px solid ${layer.color}` }}
                        initial={{ width: 0 }}
                        animate={{ width: layer.width }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-20 text-right">{layer.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TRUST */}
          {currentStep === 6 && (
            <motion.div
              key="trust"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl"
            >
              <Badge color="#10b981">Sovereign & Encrypted</Badge>
              <h2 className="text-5xl md:text-7xl font-bold mt-8">
                Your data.
                <br />
                <GradientText>Your rules.</GradientText>
              </h2>

              <div className="grid grid-cols-2 gap-6 mt-10 max-w-md mx-auto">
                <GlassCard className="p-6">
                  <div className="text-4xl font-bold" style={{ color: '#10b981' }}>
                    {metrics.encryption}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">End-to-end encrypted</div>
                </GlassCard>
                <GlassCard className="p-6">
                  <div className="text-4xl font-bold" style={{ color: '#3ecfb2' }}>
                    Zero
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Knowledge architecture</div>
                </GlassCard>
              </div>

              <p className="text-sm text-gray-600 mt-8 max-w-sm mx-auto">
                Not us. Not OpenAI. Not anyone. Your AI memory — truly yours.
              </p>
            </motion.div>
          )}

          {/* CLOSE */}
          {currentStep === 7 && (
            <motion.div
              key="close"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1 }}
              className="text-center max-w-4xl"
            >
              <Badge>The Close</Badge>
              <h2 className="text-5xl md:text-7xl font-bold mt-8 leading-tight">
                Your AI remembers
                <br />
                <GradientText>everything.</GradientText>
                <br />
                <span className="text-gray-500">You own it.</span>
              </h2>

              <div className="grid grid-cols-4 gap-6 mt-12 max-w-2xl mx-auto">
                <MetricPill label="Memories" value={metrics.memories.toLocale() || '50,284'} accent="#3ecfb2" />
                <MetricPill label="Sessions" value="609" accent="#8b5cf6" />
                <MetricPill label="Graph" value="1,547" accent="#3b82f6" />
                <MetricPill label="Encrypted" value="100%" accent="#10b981" />
              </div>

              <div className="mt-12 flex items-center justify-center gap-4">
                <CinematicButton onClick={startDemo}>Replay Demo</CinematicButton>
                <CinematicButton variant="secondary">Join the Waitlist</CinematicButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom step indicator */}
      {isRunning && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          {DEMO_STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: i === currentStep ? 24 : i < currentStep ? 16 : 6,
                backgroundColor: i <= currentStep ? '#3ecfb2' : '#1f2937',
              }}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-8 py-4 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
        <span className="text-[10px] text-gray-700 font-mono">VIVIM v2.0 — Investor POC</span>
        <span className="text-[10px] text-gray-700 font-mono">
          {isRunning ? DEMO_STEPS[currentStep]?.title : 'Ready'}
        </span>
      </div>
    </div>
  );
}

export default InvestorPitchDemoPage;
