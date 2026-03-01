import React, { useEffect, useState, useRef } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  status: 'pending' | 'signed' | 'stored';
}

interface DAGMaterializerProps {
  progress: number;
  status: string;
}

/**
 * DAGMaterializer: Visualises the "Intelligence Capture" moment.
 * Shows nodes snapping into a lattice as data is materialized.
 */
export const DAGMaterializer: React.FC<DAGMaterializerProps> = ({ progress, status }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate nodes based on progress
    const nodeCount = Math.floor(progress / 5);
    const newNodes: Node[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      const id = `node-${i}`;
      // Pseudo-random but deterministic layout
      const x = 10 + (i * 15) % 80;
      const y = 20 + Math.floor(i / 5) * 20;
      
      let nodeStatus: Node['status'] = 'pending';
      if (progress > 85) nodeStatus = 'stored';
      else if (progress > 50) nodeStatus = 'signed';

      newNodes.push({ id, x, y, status: nodeStatus });
    }
    
    setNodes(newNodes);
  }, [progress]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-48 bg-gray-900/50 rounded-2xl border border-white/5 relative overflow-hidden mb-6"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: 'radial-gradient(circle, #2dd4bf 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        {nodes.map((node, i) => {
          if (i === 0) return null;
          const prev = nodes[i - 1];
          return (
            <line 
              key={`line-${i}`}
              x1={`${prev.x}%`} y1={`${prev.y}%`}
              x2={`${node.x}%`} y2={`${node.y}%`}
              stroke={node.status === 'stored' ? '#2dd4bf' : '#94a3b8'}
              strokeWidth="1"
              strokeDasharray="4 2"
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => (
        <div 
          key={node.id}
          className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
          style={{ 
            left: `${node.x}%`, 
            top: `${node.y}%`,
            transform: `scale(${node.status === 'stored' ? 1.2 : 1}) rotate(45deg)`
          }}
        >
          <div className={`w-full h-full border-2 rounded-sm ${
            node.status === 'stored' ? 'bg-teal-500 border-teal-400 shadow-[0_0_10px_#2dd4bf]' :
            node.status === 'signed' ? 'bg-amber-500 border-amber-400 shadow-[0_0_8px_#fbbf24]' :
            'bg-gray-700 border-gray-600'
          }`} />
        </div>
      ))}

      {/* Scanline Effect */}
      <div 
        className="absolute top-0 left-0 w-full h-0.5 bg-teal-500/30 shadow-[0_0_15px_#2dd4bf] animate-[scan_3s_linear_infinite]"
        style={{ top: `${progress}%` }}
      />

      {/* Status Overlay */}
      <div className="absolute bottom-3 left-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-teal-500 animate-pulse'}`} />
        <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest">
          {status}
        </span>
      </div>
    </div>
  );
};
