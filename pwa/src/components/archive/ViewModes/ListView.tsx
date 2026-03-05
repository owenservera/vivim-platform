import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ConversationCard } from '../ConversationCard/ConversationCard';
import { ConversationMetadata } from '../../../lib/db/vivim-db';

interface Props {
  conversations: ConversationMetadata[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onClick: (id: string) => void;
}

export const ListView: React.FC<Props> = ({ conversations, selectedIds, onSelect, onClick }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76, // Approximate height of a list item
    overscan: 10, // Render 10 items outside the visible viewport
  });

  return (
    <div 
      ref={parentRef} 
      className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto pt-4 pb-24 scrollbar-hide"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
        className="max-w-4xl mx-auto px-4 md:px-6"
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = conversations[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                paddingBottom: '12px' 
              }}
            >
              <ConversationCard 
                data={item} 
                viewMode="list" 
                isSelected={selectedIds.has(item.id)}
                onSelect={() => onSelect(item.id)}
                onClick={() => onClick(item.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
