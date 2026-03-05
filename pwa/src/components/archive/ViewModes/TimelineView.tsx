import React, { useMemo } from 'react';
import { ConversationMetadata } from '../../../lib/db/vivim-db';
import { getProviderAccentConfig } from '../utils/providerColors';
import { cn } from '../../../lib/utils';

interface Props {
  conversations: ConversationMetadata[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onClick: (id: string) => void;
}

// Group conversations into monthly buckets
function groupByMonth(convs: ConversationMetadata[]) {
  const map = new Map<string, ConversationMetadata[]>();
  for (const c of convs) {
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  // Sort chronologically
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export const TimelineView: React.FC<Props> = ({ conversations, selectedIds, onSelect: _onSelect, onClick }) => {
  const groups = useMemo(() => groupByMonth(conversations), [conversations]);

  if (conversations.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
        No conversations to display
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto px-4 md:px-8 py-6 pb-24 scrollbar-hide">
      <div className="max-w-5xl mx-auto">
        {groups.map(([monthKey, items]) => {
          const [year, month] = monthKey.split('-');
          const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

          return (
            <div key={monthKey} className="relative mb-10">
              {/* Month Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">{label}</div>
                <div className="flex-1 h-px bg-black/5 dark:bg-white/5" />
                <span className="text-xs text-gray-400">{items.length}</span>
              </div>

              {/* Horizontal scroll lane */}
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {items.map(conv => {
                  const accent = getProviderAccentConfig(conv.provider);
                  const isSelected = selectedIds.has(conv.id);
                  return (
                    <div
                      key={conv.id}
                      onClick={() => onClick(conv.id)}
                      className={cn(
                        "flex-shrink-0 w-52 p-3 rounded-xl cursor-pointer transition-all duration-200",
                        "bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5",
                        "hover:shadow-md hover:-translate-y-0.5",
                        isSelected && "ring-2 ring-indigo-500/50"
                      )}
                      style={{
                        borderTop: `2px solid ${accent.hex}`,
                      }}
                    >
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate leading-snug">
                        {conv.title || 'Untitled'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                          style={{ backgroundColor: `${accent.hex}18`, color: accent.hex }}
                        >
                          {accent.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(conv.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
