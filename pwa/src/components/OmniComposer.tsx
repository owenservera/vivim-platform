import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Save, Globe, Zap, X } from 'lucide-react';
import { SuggestionMenu, type TriggerType, type SuggestionItem } from './SuggestionMenu';
import { searchOmni } from '../lib/omni-api';
import './OmniComposer.css';

interface OmniComposerProps {
  onSend: (message: string, action?: string) => Promise<void>;
  isLoading: boolean;
  onStop: () => void;
  onClose?: () => void;
  placeholder?: string;
  initialValue?: string;
}

export const OmniComposer: React.FC<OmniComposerProps> = ({
  onSend,
  isLoading,
  onStop,
  onClose,
  placeholder = "Type a message...",
  initialValue = ""
}) => {
  const [input, setInput] = useState(initialValue);
  const [activeTrigger, setActiveTrigger] = useState<TriggerType | null>(null);
  const [triggerIndex, setTriggerIndex] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [actionIntent, setActionIntent] = useState<string | null>(null); // 'save', 'broadcast', etc.

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-resize
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (trigger: TriggerType, query: string) => {
    try {
      const results = await searchOmni(trigger, query);
      setSuggestions(results);
      setSelectedIndex(0);
    } catch (e) {
      console.error(e);
      setSuggestions([]);
    }
  }, []);

  // Detect triggers
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart;
    
    setInput(newValue);

    // Check for trigger characters detected BEFORE cursor
    // We look backwards from cursor to find the last trigger char that isn't followed by a space
    const textBeforeCursor = newValue.slice(0, newCursorPos);
    const lastSlash = textBeforeCursor.lastIndexOf('/');
    const lastAt = textBeforeCursor.lastIndexOf('@');
    const lastPlus = textBeforeCursor.lastIndexOf('+');
    const lastBang = textBeforeCursor.lastIndexOf('!');
    const lastHash = textBeforeCursor.lastIndexOf('#');

    const triggers = [
      { char: '/', index: lastSlash },
      { char: '@', index: lastAt },
      { char: '+', index: lastPlus },
      { char: '!', index: lastBang },
      { char: '#', index: lastHash }
    ];

    // Find the closest trigger to the cursor
    const active = triggers.reduce((prev, current) => {
      return current.index > prev.index ? current : prev;
    }, { char: '', index: -1 });

    if (active.index !== -1) {
      // Check if there are spaces between trigger and cursor (invalidates trigger usually, unless multi-word search supported later)
      const textFromTrigger = textBeforeCursor.slice(active.index + 1);
      if (!textFromTrigger.includes(' ')) {
        const triggerChar = active.char as TriggerType;
        setActiveTrigger(triggerChar);
        setTriggerIndex(active.index);
        // Debounce API call
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          fetchSuggestions(triggerChar, textFromTrigger);
        }, 150);
        return;
      }
    }

    // No active trigger found
    setActiveTrigger(null);
    setTriggerIndex(-1);
    setSuggestions([]);
  };

  const handleSuggestionSelect = (item: SuggestionItem) => {
    if (!activeTrigger || triggerIndex === -1) return;

    const textBefore = input.slice(0, triggerIndex);
    // Find end of current word
    const textAfter = input.slice(input.indexOf(' ', triggerIndex) === -1 ? input.length : input.indexOf(' ', triggerIndex));
    
    const newValue = textBefore + item.value + ' ' + textAfter; // Add space after
    
    setInput(newValue);
    setActiveTrigger(null);
    setSuggestions([]);
    
    // Focus back
    if (inputRef.current) {
      inputRef.current.focus();
      // Need to defer setting selection range slightly for React to render
      setTimeout(() => {
        const newCursorPos = (textBefore + item.value + ' ').length;
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }

    // Special handling for Action triggers (!)
    if (item.type === '!') {
      setActionIntent(item.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (activeTrigger && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSuggestionSelect(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setActiveTrigger(null);
        setSuggestions([]);
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    setActionIntent(null); // Reset intent
    if (inputRef.current) inputRef.current.style.height = 'auto';

    await onSend(message, actionIntent || undefined);
  };

  // Determine Button Icon & Color
  let SendIcon = Send;
  let sendButtonClass = 'omni-send-default';

  if (isLoading) {
    SendIcon = Square; // Stop icon
    sendButtonClass = 'omni-send-stop';
  } else if (input.includes('!save')) {
    SendIcon = Save;
    sendButtonClass = 'omni-send-save';
  } else if (input.includes('@Network') || input.includes('!broadcast')) {
    SendIcon = Globe;
    sendButtonClass = 'omni-send-broadcast';
  } else if (input.includes('@AI')) {
    SendIcon = Zap;
    sendButtonClass = 'omni-send-ai';
  }

  return (
    <div className="omni-composer-wrapper" ref={containerRef}>
      {activeTrigger && suggestions.length > 0 && (
        <SuggestionMenu 
          trigger={activeTrigger}
          items={suggestions}
          selectedIndex={selectedIndex}
          onSelect={handleSuggestionSelect}
          position={{ bottom: 60, left: 16 }} // simplified positioning
        />
      )}

      <form className="omni-input-container" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="omni-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading && false} // Allow typing while generating? usually no
        />
        <button
          type={isLoading ? 'button' : 'submit'}
          className={`omni-send-btn ${sendButtonClass}`}
          onClick={isLoading ? onStop : undefined}
          disabled={!input.trim() && !isLoading}
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
      
      <div className="omni-status-bar">
        {actionIntent === 'save' && <span className="omni-status-badge save">Saving to Vault</span>}
        {actionIntent === 'broadcast' && <span className="omni-status-badge broadcast">Public Post</span>}
        <span className="omni-helper-text">
          Use <b>/</b>cmd <b>@</b>mention <b>+</b>ctx <b>!</b>act <b>#</b>topic
        </span>
        
        {onClose && (
           <button 
             onClick={onClose} 
             className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1 flex items-center justify-center p-1"
             title="Close chat"
           >
             <X className="w-4 h-4" />
           </button>
        )}
      </div>
    </div>
  );
};
