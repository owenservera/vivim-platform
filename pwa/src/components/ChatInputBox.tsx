import React from 'react';
import { OmniComposer } from './OmniComposer';

export interface ChatInputBoxProps {
  onSend: (message: string, action?: string) => Promise<void>;
  isLoading: boolean;
  onStop?: () => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

export const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  onSend,
  isLoading,
  onStop,
  placeholder = "Message AI...",
  initialValue = "",
  className = ""
}) => {
  return (
    <div className={`w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-safe ${className}`}>
      <div className="max-w-3xl mx-auto px-2 py-2">
        <OmniComposer
          onSend={onSend}
          isLoading={isLoading}
          onStop={onStop || (() => {})}
          placeholder={placeholder}
          initialValue={initialValue}
        />
      </div>
    </div>
  );
};
