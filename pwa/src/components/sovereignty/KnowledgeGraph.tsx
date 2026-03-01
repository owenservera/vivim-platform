import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Conversation } from '../../types/conversation';

interface KnowledgeGraphProps {
  conversations: Conversation[];
  onNodeClick: (id: string) => void;
  className?: string;
}

/**
 * KnowledgeGraph: Visualizes the "Knowledge Map" moment.
 * Shows conversations as a constellation of interconnected nodes.
 */
export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ conversations, onNodeClick, className = "" }) => {
  // Simple force-ish layout logic
  const nodes = useMemo(() => {
    return conversations.slice(0, 30).map((c, i) => {
      const angle = (i / Math.min(conversations.length, 30)) * Math.PI * 2;
      const radius = 30 + Math.random() * 60;
      return {
        id: c.id,
        title: c.title,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        size: 2 + (c.stats?.totalMessages || 0) / 10,
        provider: c.provider
      };
    });
  }, [conversations]);

  // Generate random connections for visual effect (simulating shared entities/tags)
  const links = useMemo(() => {
    const l = [];
    for (let i = 0; i < nodes.length; i++) {
      if (Math.random() > 0.7) {
        const targetIndex = (i + Math.floor(Math.random() * 5) + 1) % nodes.length;
        l.push({ source: nodes[i], target: nodes[targetIndex] });
      }
    }
    return l;
  }, [nodes]);

  return (
    <div className={`w-full h-[400px] bg-gray-950 rounded-3xl border border-white/5 relative overflow-hidden ${className}`}>
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2dd4bf11_0%,_transparent_70%)]" />
      
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Connections */}
        {links.map((link, i) => (
          <motion.line
            key={`link-${i}`}
            x1={link.source.x} y1={link.source.y}
            x2={link.target.x} y2={link.target.y}
            stroke="white"
            strokeWidth="0.2"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.1, pathLength: 1 }}
            transition={{ duration: 2, delay: i * 0.1 }}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.05 }}
            className="cursor-pointer"
            onClick={() => onNodeClick(node.id)}
          >
            {/* Glow */}
            <circle 
              cx={node.x} cy={node.y} r={node.size * 1.5} 
              fill={node.provider === 'chatgpt' ? '#10b981' : '#6366f1'} 
              className="opacity-20 blur-[2px]" 
            />
            {/* Core Node */}
            <circle 
              cx={node.x} cy={node.y} r={node.size} 
              fill={node.provider === 'chatgpt' ? '#10b981' : '#6366f1'} 
            />
            {/* Label (visible on hover/mobile) */}
            <text 
              x={node.x} y={node.y + node.size + 4} 
              className="text-[3px] fill-gray-500 font-mono text-center pointer-events-none"
              textAnchor="middle"
            >
              {node.title.substring(0, 15)}...
            </text>
          </motion.g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex gap-4">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-[8px] font-mono text-gray-500 uppercase tracking-tighter">Verified Intelligence</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[8px] font-mono text-gray-500 uppercase tracking-tighter">Sovereign Knowledge</span>
        </div>
      </div>
    </div>
  );
};
