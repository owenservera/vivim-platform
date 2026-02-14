/**
 * Fork Button Component
 * 
 * Fork a conversation or ACU to create a copy
 */

import { useState, useCallback } from 'react';
import { GitFork, Loader2, Check } from 'lucide-react';
import './ForkButton.css';

interface ForkButtonProps {
  conversationId: string;
  onFork?: (newConversationId: string) => void;
  label?: string;
  showAttribution?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'icon-only';
}

export function ForkButton({ 
  conversationId, 
  onFork,
  label = 'Fork',
  showAttribution = true,
  size = 'md',
  variant = 'default'
}: ForkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [forked, setForked] = useState(false);

  const handleFork = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading || forked) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/v1/conversations/${conversationId}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('OPENSCROLL_API_KEY') || import.meta.env.VITE_API_KEY || ''}`,
          'X-API-Key': localStorage.getItem('OPENSCROLL_API_KEY') || import.meta.env.VITE_API_KEY || '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to fork conversation: ${response.status}`);
      }

      const data = await response.json();
      setForked(true);
      onFork?.(data.forkedId || data.id);

      // Reset success state after 2 seconds
      setTimeout(() => setForked(false), 2000);
    } catch (error) {
      console.error('Fork error:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, loading, forked, onFork]);

  return (
    <button
      className={`fork-button ${forked ? 'success' : ''} size-${size}`}
      onClick={handleFork}
      disabled={loading}
      aria-label={`Fork ${label}`}
    >
      {loading ? (
        <Loader2 className="spinner" size={getIconSize(size)} />
      ) : forked ? (
        <Check className="success-icon" size={getIconSize(size)} />
      ) : (
        <GitFork className="fork-icon" size={getIconSize(size)} />
      )}
      
      {variant !== 'icon-only' && (
        <span className="fork-label">
          {forked ? 'Forked!' : label}
        </span>
      )}

      {showAttribution && forked && (
        <span className="fork-attribution">
          Original preserved
        </span>
      )}
    </button>
  );
}

function getIconSize(size: string): number {
  switch (size) {
    case 'sm': return 14;
    case 'lg': return 24;
    default: return 18;
  }
}

export default ForkButton;
