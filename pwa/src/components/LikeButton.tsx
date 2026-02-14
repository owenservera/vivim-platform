/**
 * Like Button Component
 * 
 * Toggle like/unlike for ACUs and conversations
 */

import { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import './LikeButton.css';

interface LikeButtonProps {
  acuId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLike?: (acuId: string, liked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

export function LikeButton({ 
  acuId, 
  initialLiked = false, 
  initialCount = 0,
  onLike,
  size = 'md',
  variant = 'default'
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setCount(prev => newLiked ? prev + 1 : prev - 1);
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/social/like/${acuId}`, {
        method: newLiked ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert on error
        setLiked(!newLiked);
        setCount(prev => !newLiked ? prev + 1 : prev - 1);
        throw new Error('Failed to toggle like');
      }

      onLike?.(acuId, newLiked);
    } catch (error) {
      console.error('Like error:', error);
    } finally {
      setLoading(false);
    }
  }, [acuId, liked, loading, onLike]);

  return (
    <button
      className={`like-button ${liked ? 'liked' : ''} size-${size} variant-${variant}`}
      onClick={handleToggle}
      disabled={loading}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <Heart 
        className={`heart-icon ${liked ? 'filled' : 'outline'}`}
        size={size === 'sm' ? 14 : size === 'lg' ? 24 : 18}
      />
      {variant !== 'compact' && (
        <span className="like-count">{formatCount(count)}</span>
      )}
    </button>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default LikeButton;
