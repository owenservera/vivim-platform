import React from 'react';
import { ConversationCard } from '../ConversationCard/ConversationCard';
import { ConversationMetadata } from '../../../lib/db/vivim-db';

interface Props {
  conversations: ConversationMetadata[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onClick: (id: string) => void;
}

export const GridView: React.FC<Props> = ({ conversations, selectedIds, onSelect, onClick }) => {
  return (
    <div className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto pt-4 pb-24 scrollbar-hide px-4 md:px-6">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
        {conversations.map((item) => (
          <div key={item.id} className="relative w-full h-full flex">
            <div className="w-full flex-1 transition-transform hover:-translate-y-1 duration-300">
              <ConversationCard 
                data={item} 
                viewMode="grid" 
                isSelected={selectedIds.has(item.id)}
                onSelect={() => onSelect(item.id)}
                onClick={() => onClick(item.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
