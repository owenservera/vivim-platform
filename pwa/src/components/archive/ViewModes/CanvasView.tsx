import { useEffect, useRef } from 'react';
import { ConversationMetadata } from '../../../lib/db/vivim-db';
import { getProviderAccentConfig } from '../utils/providerColors';

interface Props {
  conversations: ConversationMetadata[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onClick: (id: string) => void;
}

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  provider: string;
  color: string;
  r: number;
}

export const CanvasView = ({ conversations, selectedIds, onSelect: _onSelect, onClick }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const rafRef = useRef<number>(0);
  const hoveredRef = useRef<string | null>(null);

  // Build initial node layout
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;

    nodesRef.current = conversations.map((c, i) => {
      const angle = (i / conversations.length) * 2 * Math.PI;
      const radius = Math.min(W, H) * 0.3;
      return {
        id: c.id,
        x: W / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 60,
        y: H / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 60,
        vx: 0,
        vy: 0,
        label: c.title || 'Untitled',
        provider: c.provider,
        color: getProviderAccentConfig(c.provider).hex,
        r: 8 + Math.min(c.messageCount ?? 0, 20) * 0.5,
      };
    });
  }, [conversations]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const nodes = nodesRef.current;

      // Simple repulsion force
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = (nodes[i].r + nodes[j].r + 30);
          if (dist < minDist) {
            const force = (minDist - dist) / dist * 0.05;
            nodes[i].vx -= dx * force;
            nodes[i].vy -= dy * force;
            nodes[j].vx += dx * force;
            nodes[j].vy += dy * force;
          }
        }
        // Gravity toward center
        nodes[i].vx += (W / 2 - nodes[i].x) * 0.001;
        nodes[i].vy += (H / 2 - nodes[i].y) * 0.001;
        // Dampen
        nodes[i].vx *= 0.9;
        nodes[i].vy *= 0.9;
        nodes[i].x += nodes[i].vx;
        nodes[i].y += nodes[i].vy;
      }

      // Draw edges (simplified - connect nearby nodes)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length && j < i + 3; j++) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const isSelected = selectedIds.has(node.id);
        const isHovered = hoveredRef.current === node.id;

        // Glow
        if (isSelected || isHovered) {
          const grd = ctx.createRadialGradient(node.x, node.y, node.r * 0.5, node.x, node.y, node.r * 2.5);
          grd.addColorStop(0, `${node.color}40`);
          grd.addColorStop(1, `${node.color}00`);
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? node.color : `${node.color}88`;
        ctx.fill();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Label (only if hovered or selected)
        if (isHovered || isSelected) {
          ctx.font = `500 11px system-ui, sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.textAlign = 'center';
          ctx.fillText(node.label.substring(0, 22), node.x, node.y + node.r + 14);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let found: string | null = null;
      for (const node of nodesRef.current) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < node.r + 4) {
          found = node.id;
          break;
        }
      }
      hoveredRef.current = found;
      canvas.style.cursor = found ? 'pointer' : 'default';
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const node of nodesRef.current) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < node.r + 4) {
          onClick(node.id);
          break;
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('resize', resize);
    };
  }, [conversations, selectedIds, onClick]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      {conversations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          No conversations to visualize
        </div>
      )}
    </div>
  );
};
