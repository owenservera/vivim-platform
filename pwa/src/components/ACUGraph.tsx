/**
 * ACU Graph Visualizer
 * 
 * Interactive knowledge graph visualization using D3.js-style force layout
 * Shows relationships between Atomic Chat Units
 */

import { useEffect, useRef, useState } from 'react';
import { getACUGraph, type ACUGraph } from '../lib/acu-api';
import './ACUGraph.css';

interface ACUGraphProps {
  acuId: string;
  depth?: number;
  onNodeClick?: (nodeId: string) => void;
}

export function ACUGraph({ acuId, depth = 1, onNodeClick }: ACUGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graph, setGraph] = useState<ACUGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    loadGraph();
  }, [acuId, depth]);

  useEffect(() => {
    if (graph && canvasRef.current) {
      renderGraph();
    }
  }, [graph, selectedNode]);

  async function loadGraph() {
    try {
      setLoading(true);
      setError(null);
      const result = await getACUGraph(acuId, depth);
      setGraph(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  }

  function renderGraph() {
    if (!graph || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Simple force-directed layout (simplified version)
    const nodes = graph.nodes.map((node, i) => ({
      ...node,
      x: node.isCenter ? width / 2 : width / 2 + Math.cos(i * 2 * Math.PI / graph.nodes.length) * 150,
      y: node.isCenter ? height / 2 : height / 2 + Math.sin(i * 2 * Math.PI / graph.nodes.length) * 150,
      radius: node.isCenter ? 30 : 20
    }));

    // Draw edges
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    
    graph.edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const arrowSize = 10;
        const arrowX = target.x - Math.cos(angle) * (target.radius + 5);
        const arrowY = target.y - Math.sin(angle) * (target.radius + 5);

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = '#9ca3af';
        ctx.fill();

        // Draw edge label
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(edge.relation, midX, midY - 5);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode === node.id;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      
      if (node.isCenter) {
        ctx.fillStyle = '#3b82f6';
      } else if (isSelected) {
        ctx.fillStyle = '#10b981';
      } else {
        ctx.fillStyle = '#6b7280';
      }
      ctx.fill();

      // Node border
      ctx.strokeStyle = isSelected ? '#059669' : '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      
      const label = node.type.substring(0, 10);
      ctx.fillText(label, node.x, node.y + node.radius + 15);
    });
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!graph || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is on a node
    const width = rect.width;
    const height = rect.height;

    const nodes = graph.nodes.map((node, i) => ({
      ...node,
      x: node.isCenter ? width / 2 : width / 2 + Math.cos(i * 2 * Math.PI / graph.nodes.length) * 150,
      y: node.isCenter ? height / 2 : height / 2 + Math.sin(i * 2 * Math.PI / graph.nodes.length) * 150,
      radius: node.isCenter ? 30 : 20
    }));

    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      onNodeClick?.(clickedNode.id);
    }
  }

  if (loading) {
    return (
      <div className="acu-graph loading">
        <div className="spinner"></div>
        <p>Loading knowledge graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="acu-graph error">
        <p>❌ {error}</p>
        <button onClick={loadGraph}>Retry</button>
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="acu-graph empty">
        <p>No relationships found for this ACU.</p>
      </div>
    );
  }

  return (
    <div className="acu-graph">
      <div className="graph-header">
        <h3>Knowledge Graph</h3>
        <div className="graph-stats">
          <span>{graph.nodes.length} nodes</span>
          <span>{graph.edges.length} relationships</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="graph-canvas"
        onClick={handleCanvasClick}
      />

      {selectedNode && (
        <div className="node-details">
          {(() => {
            const node = graph.nodes.find(n => n.id === selectedNode);
            if (!node) return null;

            return (
              <>
                <div className="detail-header">
                  <span className="detail-type">{node.type}</span>
                  {node.isCenter && <span className="center-badge">Center</span>}
                </div>
                <p className="detail-content">{node.content}</p>
                {node.qualityOverall && (
                  <div className="detail-quality">
                    Quality: {Math.round(node.qualityOverall)}%
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      <div className="graph-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#3b82f6' }}></div>
          <span>Center Node</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#6b7280' }}></div>
          <span>Related Nodes</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#10b981' }}></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}

export default ACUGraph;
