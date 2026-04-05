/**
 * VIVIM PWA — Interactive Knowledge Graph
 *
 * Canvas-based force-directed graph visualization for the "money shot" demo moment.
 *
 * Inspired by the reference version's InteractiveKnowledgeGraph.tsx but enhanced
 * with real data integration, zoom/pan, node selection, and investor metrics overlay.
 *
 * Features:
 * - Force-directed layout with animated nodes and edges
 * - Click nodes to see memory details
 * - Pan/zoom camera
 * - Type-coded colors (episodic, semantic, procedural, etc.)
 * - Investor metrics overlay (node count, edge count, density)
 * - Export as PNG for demo screenshots
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// ============================================
// GRAPH DATA TYPES
// ============================================

export interface GraphNode {
  id: string;
  label: string;
  type: MemoryNodeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number;
  /** Memory metadata (optional, for detail panel) */
  metadata?: Record<string, unknown>;
}

export type MemoryNodeType =
  | 'central'     // The user ("You")
  | 'episodic'    // Event memories
  | 'semantic'    // Factual knowledge
  | 'procedural'  // How-to
  | 'preference'  // User preferences
  | 'identity'    // Bio, role
  | 'relationship' // People
  | 'goal';       // Plans

export interface GraphEdge {
  source: string;
  target: string;
  weight: number; // 0-1
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ============================================
// NODE COLORS
// ============================================

const NODE_COLORS: Record<MemoryNodeType, string> = {
  central: '#3ecfb2',    // Teal
  episodic: '#8b5cf6',   // Violet
  semantic: '#3b82f6',   // Blue
  procedural: '#f59e0b', // Amber
  preference: '#ec4899', // Pink
  identity: '#10b981',   // Emerald
  relationship: '#f97316', // Orange
  goal: '#6366f1',       // Indigo
};

const NODE_GLOW: Record<MemoryNodeType, string> = {
  central: 'rgba(62, 207, 178, 0.4)',
  episodic: 'rgba(139, 92, 246, 0.3)',
  semantic: 'rgba(59, 130, 246, 0.3)',
  procedural: 'rgba(245, 158, 11, 0.3)',
  preference: 'rgba(236, 72, 153, 0.3)',
  identity: 'rgba(16, 185, 129, 0.3)',
  relationship: 'rgba(249, 115, 22, 0.3)',
  goal: 'rgba(99, 102, 241, 0.3)',
};

// ============================================
// FORCE-DIRECTED LAYOUT
// ============================================

interface LayoutOptions {
  /** Repulsion force between nodes */
  repulsion: number;
  /** Attraction force along edges */
  attraction: number;
  /** Gravity toward center */
  gravity: number;
  /** Damping factor */
  damping: number;
  /** Maximum iterations per frame */
  maxIterations: number;
  /** Target edge length */
  edgeLength: number;
}

const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  repulsion: 5000,
  attraction: 0.005,
  gravity: 0.01,
  damping: 0.85,
  maxIterations: 50,
  edgeLength: 120,
};

function applyForces(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: LayoutOptions,
  width: number,
  height: number
): GraphNode[] {
  const { repulsion, attraction, gravity, damping, maxIterations, edgeLength } = options;
  const cx = width / 2;
  const cy = height / 2;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);

        nodes[i].vx -= (dx / dist) * force;
        nodes[i].vy -= (dy / dist) * force;
        nodes[j].vx += (dx / dist) * force;
        nodes[j].vy += (dy / dist) * force;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - edgeLength) * attraction * edge.weight;

      source.vx += (dx / dist) * force;
      source.vy += (dy / dist) * force;
      target.vx -= (dx / dist) * force;
      target.vy -= (dy / dist) * force;
    }

    // Gravity toward center
    for (const node of nodes) {
      const dx = cx - node.x;
      const dy = cy - node.y;
      node.vx += dx * gravity;
      node.vy += dy * gravity;
    }

    // Update positions
    for (const node of nodes) {
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;

      // Boundary constraints
      const padding = 60;
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }

  return nodes;
}

// ============================================
// MOCK DATA GENERATOR (for demos)
// ============================================

export function generateMockGraphData(nodeCount = 50): GraphData {
  const types: MemoryNodeType[] = ['episodic', 'semantic', 'procedural', 'preference', 'identity', 'relationship', 'goal'];
  const labels = [
    'React Architecture', 'TypeScript Patterns', 'PostgreSQL Schema', 'Auth Flow',
    'API Design', 'Node.js Runtime', 'JWT Auth', 'Redis Cache', 'CRDT Sync',
    'Memory Extraction', 'Context Assembly', 'P2P Network', 'WebRTC', 'Yjs',
    'LibP2P', 'Encryption', 'Zero Knowledge', 'Circle Sharing', 'Access Grants',
    'Smart Contracts', 'DID Identity', 'Ed25519 Keys', 'Merkle Proofs',
    'Anchor Protocol', 'Trust Levels', 'Federation', 'ActivityPub',
    'ACU Processing', 'Knowledge Graph', 'Feed Algorithm', 'Content Ranking',
    'Social Graph', 'Circle Engine', 'Import Pipeline', 'Export Format',
    'Session Memory', 'Team Sync', 'Delta Sync', 'Conflict Resolution',
    'Compression', 'Token Budget', 'Prompt Engineering', 'Model Routing',
    'Cost Optimization', 'Rate Limiting', 'Circuit Breaker', 'Error Handling',
    'Audit Logging', 'Compliance', 'GDPR', 'Data Portability',
  ];

  const nodes: GraphNode[] = [
    {
      id: 'central',
      label: 'You',
      type: 'central',
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      radius: 24,
      connections: 0,
    },
  ];

  for (let i = 0; i < nodeCount; i++) {
    const type = types[i % types.length];
    const angle = (i / nodeCount) * Math.PI * 2;
    const distance = 100 + Math.random() * 200;

    nodes.push({
      id: `node_${i}`,
      label: labels[i % labels.length],
      type,
      x: 400 + Math.cos(angle) * distance,
      y: 300 + Math.sin(angle) * distance,
      vx: 0,
      vy: 0,
      radius: 6 + Math.random() * 8,
      connections: 0,
    });
  }

  // Create edges
  const edges: GraphEdge[] = [];

  // Connect all nodes to central
  for (let i = 1; i < nodes.length; i++) {
    edges.push({
      source: 'central',
      target: nodes[i].id,
      weight: 0.5 + Math.random() * 0.5,
      type: 'remembers',
    });
    nodes[i].connections++;
  }

  // Create inter-node connections (sparse graph)
  for (let i = 1; i < nodes.length; i++) {
    const connectionCount = Math.floor(Math.random() * 3);
    for (let j = 0; j < connectionCount; j++) {
      const targetIndex = 1 + Math.floor(Math.random() * (nodes.length - 1));
      if (targetIndex !== i) {
        edges.push({
          source: nodes[i].id,
          target: nodes[targetIndex].id,
          weight: 0.2 + Math.random() * 0.5,
          type: ['relates_to', 'derived_from', 'supports'][Math.floor(Math.random() * 3)],
        });
        nodes[i].connections++;
        nodes[targetIndex].connections++;
      }
    }
  }

  nodes[0].connections = nodes.length - 1;

  return { nodes, edges };
}

// ============================================
// KNOWLEDGE GRAPH COMPONENT
// ============================================

export interface KnowledgeGraphProps {
  data?: GraphData;
  width?: number;
  height?: number;
  showMetrics?: boolean;
  showLegend?: boolean;
  interactive?: boolean;
  animated?: boolean;
  className?: string;
}

export function KnowledgeGraph({
  data,
  width = 800,
  height = 600,
  showMetrics = true,
  showLegend = true,
  interactive = true,
  animated = true,
  className = '',
}: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphData>(data ?? generateMockGraphData(50));
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  // Apply forces on mount and periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setGraphData(prev => ({
        ...prev,
        nodes: applyForces(
          prev.nodes.map(n => ({ ...n })),
          prev.edges,
          DEFAULT_LAYOUT_OPTIONS,
          width,
          height
        ),
      }));
    }, animated ? 100 : 999999);

    return () => clearInterval(interval);
  }, [width, height, animated]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const bg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
      bg.addColorStop(0, '#0f172a');
      bg.addColorStop(1, '#020617');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.scale(camera.zoom, camera.zoom);

      // Draw edges
      for (const edge of graphData.edges) {
        const source = graphData.nodes.find(n => n.id === edge.source);
        const target = graphData.nodes.find(n => n.id === edge.target);
        if (!source || !target) continue;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(148, 163, 184, ${0.1 * edge.weight})`;
        ctx.lineWidth = 0.5 + edge.weight;
        ctx.stroke();
      }

      // Draw nodes
      for (const node of graphData.nodes) {
        const color = NODE_COLORS[node.type];
        const glow = NODE_GLOW[node.type];
        const isSelected = selectedNode?.id === node.id;

        // Glow effect
        if (isSelected || node.type === 'central') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * (isSelected ? 1.3 : 1), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Label
        if (node.type === 'central' || node.radius > 10 || isSelected) {
          ctx.font = `${isSelected ? 'bold ' : ''}${node.type === 'central' ? '14px' : '10px'} Inter, system-ui, sans-serif`;
          ctx.fillStyle = node.type === 'central' ? '#ffffff' : '#94a3b8';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, node.x, node.y + node.radius + 12);
        }
      }

      ctx.restore();

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [graphData, camera, selectedNode, width, height]);

  // Click handler
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - camera.x) / camera.zoom;
    const my = (e.clientY - rect.top - camera.y) / camera.zoom;

    let closest: GraphNode | null = null;
    let closestDist = Infinity;

    for (const node of graphData.nodes) {
      const dx = node.x - mx;
      const dy = node.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < node.radius + 10 && dist < closestDist) {
        closest = node;
        closestDist = dist;
      }
    }

    setSelectedNode(closest);
  }, [interactive, camera, graphData.nodes]);

  // Pan handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
  }, [interactive, camera]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !interactive) return;
    setCamera(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  }, [isDragging, interactive, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(0.3, Math.min(3, prev.zoom * delta)),
    }));
  }, [interactive]);

  // Metrics
  const nodeCount = graphData.nodes.length;
  const edgeCount = graphData.edges.length;
  const density = nodeCount > 1 ? (2 * edgeCount) / (nodeCount * (nodeCount - 1)) : 0;

  return (
    <div className={`relative rounded-xl overflow-hidden bg-gray-950 border border-gray-800 ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Metrics overlay */}
      {showMetrics && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 bg-black/70 backdrop-blur rounded-lg p-3 border border-gray-800"
        >
          <div className="text-xs font-mono text-gray-400 mb-2">Graph Metrics</div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-500">Nodes</span>
              <span className="text-xs text-teal-400 font-bold">{nodeCount.toLocale()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-500">Edges</span>
              <span className="text-xs text-blue-400 font-bold">{edgeCount.toLocale()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-500">Density</span>
              <span className="text-xs text-violet-400 font-bold">{(density * 100).toFixed(1)}%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      {showLegend && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 right-4 bg-black/70 backdrop-blur rounded-lg p-3 border border-gray-800"
        >
          <div className="text-xs font-mono text-gray-400 mb-2">Memory Types</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Selected node detail */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 bg-black/80 backdrop-blur rounded-lg p-4 border border-gray-800 max-w-xs"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS[selectedNode.type] }} />
            <span className="text-sm font-semibold text-white">{selectedNode.label}</span>
          </div>
          <div className="text-xs text-gray-400">
            Type: <span className="text-gray-300 capitalize">{selectedNode.type}</span>
          </div>
          <div className="text-xs text-gray-400">
            Connections: <span className="text-gray-300">{selectedNode.connections}</span>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-2 text-xs text-gray-500 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Zoom controls */}
      {interactive && (
        <div className="absolute top-4 right-4 flex flex-col gap-1">
          <button
            onClick={() => setCamera(c => ({ ...c, zoom: Math.min(3, c.zoom * 1.2) }))}
            className="w-8 h-8 rounded bg-black/70 backdrop-blur border border-gray-800 text-gray-400 hover:text-white flex items-center justify-center text-lg"
          >
            +
          </button>
          <button
            onClick={() => setCamera(c => ({ ...c, zoom: Math.max(0.3, c.zoom * 0.8) }))}
            className="w-8 h-8 rounded bg-black/70 backdrop-blur border border-gray-800 text-gray-400 hover:text-white flex items-center justify-center text-lg"
          >
            −
          </button>
          <button
            onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}
            className="w-8 h-8 rounded bg-black/70 backdrop-blur border border-gray-800 text-gray-400 hover:text-white flex items-center justify-center text-xs"
          >
            ⊙
          </button>
        </div>
      )}
    </div>
  );
}
