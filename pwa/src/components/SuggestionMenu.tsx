import React, { useRef } from 'react';
import { Command, Zap, User, FileText, Save, Globe, Hash, Smile, HelpCircle } from 'lucide-react';
import './SuggestionMenu.css';

export type TriggerType = '/' | '@' | '+' | '!' | '#';

export interface SuggestionItem {
  id: string;
  label: string;
  subLabel?: string;
  icon?: any; // Can be component or string name
  value: string;
  type: TriggerType;
}

interface SuggestionMenuProps {
  trigger: TriggerType;
  items: SuggestionItem[]; // Pass items from parent instead of using MOCK_DATA
  selectedIndex: number;
  onSelect: (item: SuggestionItem) => void;
  position: { bottom: number; left: number };
}

// Icon mapper
const getIcon = (iconName: string | any) => {
  if (typeof iconName !== 'string') return iconName || HelpCircle;
  
  const map: Record<string, any> = {
    'zap': Zap,
    'command': Command,
    'user': User,
    'file-text': FileText,
    'save': Save,
    'globe': Globe,
    'hash': Hash,
    'smile': Smile,
    'bot': BotIcon // defined below
  };
  return map[iconName.toLowerCase()] || HelpCircle;
};

const BotIcon = Zap; // Fallback

export const SuggestionMenu: React.FC<SuggestionMenuProps> = ({
  trigger,
  items,
  selectedIndex,
  onSelect,
  position
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  return (
    <div 
      className="omni-suggestion-menu"
      ref={menuRef}
      style={{ bottom: position.bottom, left: position.left }}
    >
      <div className="omni-menu-header">
        {trigger === '/' && 'Commands'}
        {trigger === '@' && 'Mentions'}
        {trigger === '+' && 'Add Context'}
        {trigger === '!' && 'Actions'}
        {trigger === '#' && 'Topics & ACUs'}
      </div>
      <div className="omni-menu-list">
        {items.map((item, index) => {
          const Icon = getIcon(item.icon);
          const isSelected = index === selectedIndex;
          
          return (
            <button
              key={item.id}
              className={`omni-menu-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(item)}
              onMouseEnter={() => { /* Optional: update selection on hover */ }}
            >
              <div className="omni-item-icon">
                <Icon size={16} />
              </div>
              <div className="omni-item-content">
                <span className="omni-item-label">{item.label}</span>
                {item.subLabel && <span className="omni-item-sublabel">{item.subLabel}</span>}
              </div>
              {isSelected && <div className="omni-item-indicator">↵</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
