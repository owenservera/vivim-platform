import React, { useState, useCallback } from 'react';
import { IOSAvatar, IOSStoryRing } from './Avatar';
import { cn } from '../../lib/utils';

export interface IOSStory {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  viewed?: boolean;
  onClick?: () => void;
}

export interface IOSStoriesProps {
  stories: IOSStory[];
  className?: string;
}

export const IOSStories: React.FC<IOSStoriesProps> = ({ stories, className }) => {
  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-2 ios-scrollbar-hide', className)}>
      {stories.map((story) => (
        <IOSStoryItem key={story.id} story={story} />
      ))}
    </div>
  );
};

export const IOSStoryItem: React.FC<{ story: IOSStory }> = ({ story }) => {
  const [, setIsPressed] = useState(false);

  const handlePress = useCallback(() => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
  }, []);

  return (
    <button
      onClick={() => {
        handlePress();
        story.onClick?.();
      }}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 ios-touch-feedback"
    >
      <IOSStoryRing viewed={story.viewed} size="lg">
        <IOSAvatar
          src={story.avatar}
          initials={story.initials}
          alt={story.name}
          size="lg"
        />
      </IOSStoryRing>
      <span className="text-xs font-medium text-gray-900 dark:text-white truncate w-16 text-center">
        {story.name}
      </span>
    </button>
  );
};

// Story Viewer Component
export interface IOSStoryViewerProps {
  stories: IOSStory[];
  currentIndex: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onStoryView?: (storyId: string) => void;
}

export const IOSStoryViewer: React.FC<IOSStoryViewerProps> = ({
  stories,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
  onStoryView,
}) => {
  const [progress, setProgress] = useState(0);
  const currentStory = stories[currentIndex];

  React.useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex]);

  React.useEffect(() => {
    if (progress === 100) {
      onNext?.();
    }
  }, [progress, onNext]);

  React.useEffect(() => {
    if (currentStory && !currentStory.viewed) {
      onStoryView?.(currentStory.id);
    }
  }, [currentStory, onStoryView]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onPrevious?.();
    }
  }, [currentIndex, onPrevious]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      onNext?.();
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onNext, onClose]);

  return (
    <div className="fixed inset-0 z-[1080] bg-black">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className={cn(
                'h-full bg-white rounded-full transition-all duration-100',
                index < currentIndex && 'w-full',
                index === currentIndex && 'transition-all duration-[5000ms] ease-linear',
                index > currentIndex && 'w-0'
              )}
              style={{
                width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-8 z-10">
        <div className="flex items-center gap-3">
          <IOSAvatar
            src={currentStory?.avatar}
            initials={currentStory?.initials}
            alt={currentStory?.name}
            size="md"
          />
          <div>
            <p className="text-white font-semibold text-sm">{currentStory?.name}</p>
            <p className="text-white/70 text-xs">2h ago</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="w-full h-full flex items-center justify-center">
        {/* Story content would be rendered here */}
        <div className="text-white text-center">
          <IOSAvatar
            src={currentStory?.avatar}
            initials={currentStory?.initials}
            alt={currentStory?.name}
            size="2xl"
            showRing
          />
          <p className="mt-4 text-lg font-medium">{currentStory?.name}'s Story</p>
        </div>
      </div>

      {/* Touch Areas */}
      <button
        onClick={handlePrevious}
        className="absolute left-0 top-0 bottom-0 w-1/3 z-20"
        aria-label="Previous story"
      />
      <button
        onClick={handleNext}
        className="absolute right-0 top-0 bottom-0 w-1/3 z-20"
        aria-label="Next story"
      />
    </div>
  );
};
