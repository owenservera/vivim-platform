import React, { useState, useRef, useCallback } from 'react';
import { IOSAvatar, IOSLikeButton } from './index';
import { cn } from '../../lib/utils';
import { Heart, MessageCircle, Share2, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';

export interface IOSReel {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials?: string;
    handle?: string;
  };
  content?: string;
  description?: string;
  audio?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  liked?: boolean;
}

export interface IOSReelsProps {
  reels: IOSReel[];
  className?: string;
}

export const IOSReels: React.FC<IOSReelsProps> = ({ reels, className }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const reelHeight = container.clientHeight;
    const newIndex = Math.round(scrollPosition / reelHeight);
    setCurrentIndex(newIndex);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('h-full overflow-y-auto snap-y snap-mandatory scroll-smooth ios-scrollbar-hide', className)}
      onScroll={handleScroll}
    >
      {reels.map((reel, index) => (
        <div
          key={reel.id}
          className="h-full w-full snap-start relative"
        >
          <IOSReelCard
            reel={reel}
            isActive={index === currentIndex}
            onLike={(_liked) => {
              // Handle like
            }}
            onComment={() => {
              // Handle comment
            }}
            onShare={() => {
              // Handle share
            }}
          />
        </div>
      ))}
    </div>
  );
};

export interface IOSReelCardProps {
  reel: IOSReel;
  isActive?: boolean;
  onLike?: (liked: boolean) => void;
  onComment?: () => void;
  onShare?: () => void;
}

export const IOSReelCard: React.FC<IOSReelCardProps> = ({
  reel,
  onLike,
  onComment,
  onShare,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [liked, setLiked] = useState(reel.liked || false);
  const [likeCount, setLikeCount] = useState(reel.likes || 0);

  const handleLike = useCallback((newLiked: boolean) => {
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));
    onLike?.(newLiked);
  }, [onLike]);

  const handleDoubleClick = useCallback(() => {
    if (!liked) {
      handleLike(true);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  }, [liked, handleLike]);

  return (
    <div
      className="h-full w-full bg-gradient-to-br from-gray-900 to-black relative overflow-hidden"
      onDoubleClick={handleDoubleClick}
    >
      {/* Background Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {reel.content ? (
          <div className="w-full h-full flex items-center justify-center">
            {/* Reel content would be rendered here */}
            <div className="text-white/20 text-6xl font-bold">
              {reel.user.name}
            </div>
          </div>
        ) : (
          <div className="text-white/20 text-4xl font-medium">
            No content
          </div>
        )}
      </div>

      {/* Double Tap Heart */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none ios-animate-bounce-in">
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-full">
            <Heart className="w-20 h-20 text-red-500 fill-red-500" />
          </div>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

      {/* User Info */}
      <div className="absolute bottom-20 left-4 right-20">
        <div className="flex items-center gap-3 mb-3">
          <IOSAvatar
            src={reel.user.avatar}
            initials={reel.user.initials}
            alt={reel.user.name}
            size="md"
            showRing
          />
          <div>
            <p className="text-white font-semibold text-sm">{reel.user.name}</p>
            {reel.user.handle && (
              <p className="text-white/70 text-xs">@{reel.user.handle}</p>
            )}
          </div>
          <button className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-full transition-colors">
            Follow
          </button>
        </div>
        {reel.description && (
          <p className="text-white text-sm line-clamp-2">{reel.description}</p>
        )}
        {reel.audio && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <p className="text-white/80 text-xs">Original Audio</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" />
          )}
        </button>

        <div className="flex flex-col items-center gap-1">
          <IOSLikeButton
            liked={liked}
            onLike={handleLike}
            size="lg"
            variant="filled"
          />
          <span className="text-white text-xs font-medium">{likeCount}</span>
        </div>

        <button
          onClick={onComment}
          className="flex flex-col items-center gap-1 ios-touch-feedback"
        >
          <div className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{reel.comments || 0}</span>
        </button>

        <button
          onClick={onShare}
          className="flex flex-col items-center gap-1 ios-touch-feedback"
        >
          <div className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{reel.shares || 0}</span>
        </button>

        <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors ios-touch-feedback">
          <MoreHorizontal className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

// Reel Card for Feed (smaller version)
export interface IOSReelFeedCardProps {
  reel: IOSReel;
  onClick?: () => void;
}

export const IOSReelFeedCard: React.FC<IOSReelFeedCardProps> = ({ reel, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative aspect-[9/16] bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden cursor-pointer ios-touch-feedback"
    >
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white/20 text-4xl font-medium">
          {reel.user.name}
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

      {/* User Info */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="flex items-center gap-2 mb-2">
          <IOSAvatar
            src={reel.user.avatar}
            initials={reel.user.initials}
            alt={reel.user.name}
            size="sm"
          />
          <p className="text-white font-semibold text-sm">{reel.user.name}</p>
        </div>
        {reel.description && (
          <p className="text-white text-xs line-clamp-2">{reel.description}</p>
        )}
      </div>

      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
