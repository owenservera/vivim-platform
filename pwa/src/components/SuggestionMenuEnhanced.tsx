/**
 * Animated Suggestion Menu
 * Enhanced suggestion menu with animations and inline help
 */

import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';
import type { TriggerType, SuggestionItem } from './OmniComposerTypes';
import { TRIGGER_CONFIGS } from './OmniComposerTypes';
import './SuggestionMenuEnhanced.css';

interface SuggestionMenuEnhancedProps {
  trigger: TriggerType;
  items: SuggestionItem[];
  selectedIndex: number;
  onSelect: (item: SuggestionItem) => void;
  query: string;
  position?: { top?: number; bottom?: number; left: number };
}

export const SuggestionMenuEnhanced: React.FC<SuggestionMenuEnhancedProps> = ({
  trigger,
  items,
  selectedIndex,
  onSelect,
  query,
  position,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const config = TRIGGER_CONFIGS[trigger];
  const Icon = config.icon;

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = menuRef.current?.querySelector('[data-selected="true"]');
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="suggestion-menu-enhanced"
      style={position}
    >
      {/* Header */}
      <div className="suggestion-header">
        <div className={`suggestion-trigger-badge ${config.bgColor}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`suggestion-trigger-char ${config.color}`}>{trigger}</span>
        </div>
        <span className="suggestion-category-name">{config.name}</span>
        <button
          className="suggestion-help-btn"
          onMouseEnter={() => setShowHelp(true)}
          onMouseLeave={() => setShowHelp(false)}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Help tooltip */}
      {showHelp && (
        <div className="suggestion-help-tooltip">
          <p className="suggestion-help-title">{config.name}</p>
          <p className="suggestion-help-desc">{config.description}</p>
          <p className="suggestion-help-example">
            Type <code>{trigger}</code> followed by your search
          </p>
        </div>
      )}

      {/* Items */}
      <div className="suggestion-list">
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={item.id}
              data-selected={isSelected}
              className={`suggestion-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(item)}
            >
              <div className="suggestion-item-icon">
                {item.icon && <span className={`suggestion-icon-tag ${config.color}`}>{trigger}</span>}
              </div>
              <div className="suggestion-item-content">
                <span className="suggestion-item-label">
                  {item.label}
                  {query && (
                    <span className="suggestion-match">
                      {item.label.slice(query.length)}
                    </span>
                  )}
                </span>
                {item.subLabel && (
                  <span className="suggestion-item-sublabel">{item.subLabel}</span>
                )}
              </div>
              {isSelected && (
                <div className="suggestion-item-shortcut">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="suggestion-footer">
        <span className="suggestion-footer-hint">
          ↑↓ to navigate
        </span>
        <span className="suggestion-footer-hint">
          ↵ to select
        </span>
        <span className="suggestion-footer-hint">
          esc to dismiss
        </span>
      </div>
    </div>
  );
};

export default SuggestionMenuEnhanced;
