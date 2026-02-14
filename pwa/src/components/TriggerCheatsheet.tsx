/**
 * Trigger Cheatsheet Component
 * Shows available triggers with their icons and descriptions
 */

import React from 'react';
import { TRIGGER_CONFIGS, type TriggerType } from './OmniComposerTypes';
import './TriggerCheatsheet.css';

interface TriggerCheatsheetProps {
  visible?: boolean;
  compact?: boolean;
  onTriggerSelect?: (trigger: TriggerType) => void;
}

export const TriggerCheatsheet: React.FC<TriggerCheatsheetProps> = ({
  visible = true,
  compact = false,
  onTriggerSelect,
}) => {
  if (!visible) return null;

  if (compact) {
    return (
      <div className="trigger-cheatsheet-compact">
        {Object.values(TRIGGER_CONFIGS).map((config) => {
          const Icon = config.icon;
          return (
            <button
              key={config.trigger}
              onClick={() => onTriggerSelect?.(config.trigger)}
              className="trigger-chip-compact"
              title={config.name}
            >
              <Icon className={`w-4 h-4 ${config.color}`} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="trigger-cheatsheet">
      <div className="trigger-cheatsheet-header">
        <span className="trigger-cheatsheet-title">Quick Actions</span>
        <span className="trigger-cheatsheet-hint">Type to search or click to insert</span>
      </div>
      <div className="trigger-grid">
        {Object.values(TRIGGER_CONFIGS).map((config) => {
          const Icon = config.icon;
          return (
            <button
              key={config.trigger}
              onClick={() => onTriggerSelect?.(config.trigger)}
              className="trigger-card"
            >
              <div className={`trigger-icon-wrapper ${config.bgColor}`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="trigger-info">
                <span className="trigger-char">{config.trigger}</span>
                <span className="trigger-name">{config.name}</span>
              </div>
              <span className="trigger-description">{config.description}</span>
            </button>
          );
        })}
      </div>
      <div className="trigger-examples">
        <span className="trigger-examples-label">Try:</span>
        {Object.values(TRIGGER_CONFIGS).map((config) => (
          <span key={config.trigger} className="trigger-example">
            {config.examples[0]}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TriggerCheatsheet;
