/**
 * Inline Help Component
 * Shows contextual help based on current input
 */

import React from 'react';
import { TRIGGER_CONFIGS, type TriggerType } from './OmniComposerTypes';
import './InlineHelp.css';

interface InlineHelpProps {
  input: string;
  cursorPosition: number;
  activeTrigger: TriggerType | null;
}

export const InlineHelp: React.FC<InlineHelpProps> = ({
  input,
  cursorPosition,
  activeTrigger,
}) => {
  // Get trigger at cursor position
  const textBeforeCursor = input.slice(0, cursorPosition);
  
  // If we're in a trigger, show trigger-specific help
  if (activeTrigger) {
    const config = TRIGGER_CONFIGS[activeTrigger];
    const Icon = config.icon;
    
    return (
      <div className="inline-help-trigger">
        <div className={`inline-help-badge ${config.bgColor}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`inline-help-char ${config.color}`}>{config.trigger}</span>
        </div>
        <div className="inline-help-content">
          <span className="inline-help-name">{config.name}</span>
          <span className="inline-help-desc">{config.description}</span>
        </div>
      </div>
    );
  }

  // Check for common patterns and show relevant help
  const suggestions: { pattern: RegExp; message: string; icon: string }[] = [
    { pattern: /^\s*!/, message: 'Actions: save, broadcast, remix', icon: '⚡' },
    { pattern: /^\s*@\w*$/, message: 'Mentions: @AI, @Network, @Coder', icon: '@' },
    { pattern: /^\s*\+\w*$/, message: 'Add context: +capture, +bookmark', icon: '+' },
    { pattern: /^\s*#\w*$/, message: 'Topics: #project, #tag', icon: '#' },
    { pattern: /^\s*\/\w*$/, message: 'Commands: /help, /settings', icon: '/' },
  ];

  const match = suggestions.find(s => s.pattern.test(textBeforeCursor));

  if (match) {
    return (
      <div className="inline-help-suggestion">
        <span className="inline-help-icon">{match.icon}</span>
        <span className="inline-help-message">{match.message}</span>
      </div>
    );
  }

  // Show default hint when no trigger
  return (
    <div className="inline-help-default">
      <span className="inline-help-hint">
        Type <kbd>/</kbd> for commands, <kbd>@</kbd> for mentions, <kbd>+</kbd> for context, <kbd>!</kbd> for actions
      </span>
    </div>
  );
};

export default InlineHelp;
