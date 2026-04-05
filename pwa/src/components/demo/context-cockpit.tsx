/**
 * VIVIM PWA — Context Cockpit (7-Layer Context Intelligence)
 *
 * The "Magic Moment #3" visualization — shows VIVIM's layered context assembly.
 *
 * 7 Layers:
 *   L0: Core Identity — DID, keys, wallet
 *   L1: Physical — Device, location, time
 *   L2: Network — Connections, peers, federation
 *   L3: Ledger — On-chain anchors, trust proofs
 *   L4: Memory — Extracted memories, knowledge graph
 *   L5: AI Agent — Active agents, tool usage, sessions
 *   L6: Self-Design — Evolving architecture, auto-generated patterns
 *
 * Each layer has a token budget, memory count, and relevance score.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// TYPES
// ============================================

export interface ContextLayer {
  level: number;
  name: string;
  description: string;
  icon: string;
  memories: number;
  tokens: number;
  maxTokens: number;
  relevance: number; // 0-1
  color: string;
  items: ContextLayerItem[];
}

export interface ContextLayerItem {
  id: string;
  label: string;
  type: string;
  timestamp: number;
  weight: number;
}

// ============================================
// DEFAULT LAYER DEFINITIONS
// ============================================

export function generateContextLayers(): ContextLayer[] {
  return [
    {
      level: 0,
      name: 'Core Identity',
      description: 'DID, cryptographic keys, wallet address',
      icon: '🔑',
      memories: 12,
      tokens: 340,
      maxTokens: 500,
      relevance: 1.0,
      color: '#3ecfb2',
      items: [
        { id: 'did', label: 'did:key:z6Mk...', type: 'DID', timestamp: Date.now(), weight: 1.0 },
        { id: 'pubkey', label: 'Ed25519 Public Key', type: 'Key', timestamp: Date.now(), weight: 0.9 },
        { id: 'wallet', label: 'Smart Account 0x7a3F', type: 'Wallet', timestamp: Date.now(), weight: 0.8 },
      ],
    },
    {
      level: 1,
      name: 'Physical',
      description: 'Device fingerprint, timezone, locale',
      icon: '📱',
      memories: 8,
      tokens: 180,
      maxTokens: 300,
      relevance: 0.7,
      color: '#3b82f6',
      items: [
        { id: 'device', label: 'Chrome on macOS', type: 'Device', timestamp: Date.now(), weight: 0.6 },
        { id: 'tz', label: 'America/New_York', type: 'Timezone', timestamp: Date.now(), weight: 0.5 },
        { id: 'locale', label: 'en-US', type: 'Locale', timestamp: Date.now(), weight: 0.4 },
      ],
    },
    {
      level: 2,
      name: 'Network',
      description: 'Peer connections, federation status',
      icon: '🌐',
      memories: 47,
      tokens: 890,
      maxTokens: 1200,
      relevance: 0.85,
      color: '#8b5cf6',
      items: [
        { id: 'peers', label: '47 active peers', type: 'P2P', timestamp: Date.now(), weight: 0.8 },
        { id: 'fed', label: '3 federated instances', type: 'Federation', timestamp: Date.now(), weight: 0.7 },
        { id: 'sync', label: 'CRDT synced 2.3 GB', type: 'Sync', timestamp: Date.now(), weight: 0.9 },
      ],
    },
    {
      level: 3,
      name: 'Ledger',
      description: 'On-chain anchors, trust proofs',
      icon: '⛓️',
      memories: 156,
      tokens: 1200,
      maxTokens: 2000,
      relevance: 0.6,
      color: '#f59e0b',
      items: [
        { id: 'anchor', label: '156 anchored objects', type: 'Anchor', timestamp: Date.now(), weight: 0.7 },
        { id: 'trust', label: 'Trust level: Primary', type: 'Trust', timestamp: Date.now(), weight: 0.8 },
        { id: 'proof', label: 'Merkle proof verified', type: 'Proof', timestamp: Date.now(), weight: 0.9 },
      ],
    },
    {
      level: 4,
      name: 'Memory',
      description: 'Extracted memories, knowledge graph',
      icon: '🧠',
      memories: 2847,
      tokens: 8400,
      maxTokens: 12000,
      relevance: 0.94,
      color: '#ec4899',
      items: [
        { id: 'facts', label: '1,204 factual memories', type: 'Semantic', timestamp: Date.now(), weight: 0.95 },
        { id: 'prefs', label: '487 preferences', type: 'Preference', timestamp: Date.now(), weight: 0.9 },
        { id: 'graph', label: 'Graph: 1,547 nodes', type: 'Knowledge', timestamp: Date.now(), weight: 0.92 },
      ],
    },
    {
      level: 5,
      name: 'AI Agent',
      description: 'Active agents, tool usage, sessions',
      icon: '🤖',
      memories: 34,
      tokens: 3200,
      maxTokens: 4000,
      relevance: 0.88,
      color: '#6366f1',
      items: [
        { id: 'agents', label: '3 active agents', type: 'Agent', timestamp: Date.now(), weight: 0.85 },
        { id: 'tools', label: '12 tools available', type: 'Tools', timestamp: Date.now(), weight: 0.8 },
        { id: 'session', label: 'Session: investor-pitch', type: 'Session', timestamp: Date.now(), weight: 0.9 },
      ],
    },
    {
      level: 6,
      name: 'Self-Design',
      description: 'Evolving architecture, auto-generated patterns',
      icon: '🧬',
      memories: 23,
      tokens: 560,
      maxTokens: 1000,
      relevance: 0.45,
      color: '#10b981',
      items: [
        { id: 'patterns', label: '7 auto-generated patterns', type: 'Pattern', timestamp: Date.now(), weight: 0.5 },
        { id: 'evolve', label: 'Architecture v2.3', type: 'Evolution', timestamp: Date.now(), weight: 0.4 },
        { id: 'learn', label: 'Self-improving prompts', type: 'Learning', timestamp: Date.now(), weight: 0.6 },
      ],
    },
  ];
}

// ============================================
// CONTEXT COCKPIT COMPONENT
// ============================================

export interface ContextCockpitProps {
  layers?: ContextLayer[];
  totalTokenBudget?: number;
  showDetails?: boolean;
  animated?: boolean;
  className?: string;
}

export function ContextCockpit({
  layers,
  totalTokenBudget = 20000,
  showDetails = true,
  animated = true,
  className = '',
}: ContextCockpitProps) {
  const [data, setData] = useState<ContextLayer[]>(layers ?? generateContextLayers());
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);

  // Calculate aggregates
  const totalMemories = data.reduce((sum, l) => sum + l.memories, 0);
  const totalTokens = data.reduce((sum, l) => sum + l.tokens, 0);
  const avgRelevance = data.reduce((sum, l) => sum + l.relevance, 0) / data.length;

  return (
    <div className={`rounded-xl bg-gray-950/90 backdrop-blur border border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Context Cockpit</h3>
            <p className="text-xs text-gray-500 mt-1">7-Layer Context Intelligence</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums" style={{ color: '#3ecfb2' }}>
              {totalMemories.toLocale()}
            </div>
            <div className="text-xs text-gray-500">memories loaded</div>
          </div>
        </div>

        {/* Token budget bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Token Budget</span>
            <span>{totalTokens.toLocale()} / {totalTokenBudget.toLocale()} ({((totalTokens / totalTokenBudget) * 100).toFixed(0)}%)</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${(totalTokens / totalTokenBudget) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Layer Stack */}
      <div className="p-4 space-y-2">
        {[...data].reverse().map((layer) => {
          const tokenPercentage = (layer.tokens / layer.maxTokens) * 100;
          const isExpanded = expandedLayer === layer.level;

          return (
            <motion.div
              key={layer.level}
              initial={animated ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: layer.level * 0.08 }}
              className="rounded-lg border overflow-hidden cursor-pointer transition-all hover:border-gray-600"
              style={{ borderColor: `${layer.color}30` }}
              onClick={() => setExpandedLayer(isExpanded ? null : layer.level)}
            >
              {/* Layer header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/50">
                <span className="text-lg">{layer.icon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">L{layer.level}</span>
                    <span className="text-sm font-semibold text-white">{layer.name}</span>
                  </div>

                  {/* Token budget bar */}
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: layer.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${tokenPercentage}%` }}
                        transition={{ duration: 0.8, delay: layer.level * 0.1 }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums w-16 text-right">
                      {layer.tokens.toLocale()}τ
                    </span>
                    <span className="text-xs tabular-nums w-12 text-right" style={{ color: layer.color }}>
                      {(layer.relevance * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs text-gray-500">
                  <div className="tabular-nums">{layer.memories.toLocale()}</div>
                  <div>memories</div>
                </div>

                {/* Expand indicator */}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-600"
                >
                  ▾
                </motion.div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-black/30 border-t border-gray-800">
                      <p className="text-xs text-gray-500 mb-2">{layer.description}</p>
                      <div className="space-y-1">
                        {layer.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{item.label}</span>
                            <span className="text-gray-600 font-mono">{item.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer summary */}
      <div className="px-6 py-3 border-t border-gray-800 bg-gray-900/30">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Relevance Score</span>
          <span className="text-teal-400 font-bold tabular-nums">
            {(avgRelevance * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>Layers Active</span>
          <span className="text-white font-bold">
            {data.filter(l => l.memories > 0).length}/{data.length}
          </span>
        </div>
      </div>
    </div>
  );
}
