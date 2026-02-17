import React, { useState } from 'react';
import { X, RefreshCw, Settings, Check, Sparkles, MessageSquare, Clock } from 'lucide-react';
import type { Conversation } from '../types/conversation';
import { IOSModal, IOSButton, IOSCard, useIOSToast, toast } from './ios';
import { cn } from '../lib/utils';

interface RemuxDialogProps {
  conversation: Conversation | null;
  onClose: () => void;
  onRemix: (messages: { role: string; content: string }[]) => void;
}

export const RemuxDialog: React.FC<RemuxDialogProps> = ({ conversation, onClose, onRemix }) => {
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set(
    conversation?.messages.map((_, i) => i) || []
  ));
  const [newSystemPrompt, setNewSystemPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast: showToast } = useIOSToast();

  if (!conversation) return null;

  const toggleMessage = (index: number) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMessages(newSelected);
  };

  const selectAll = () => {
    setSelectedMessages(new Set(conversation.messages.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedMessages(new Set());
  };

  const handleRemix = () => {
    const messages = conversation.messages
      .filter((_, i) => selectedMessages.has(i))
      .map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      }));

    if (newSystemPrompt) {
      messages.unshift({
        role: 'system',
        content: newSystemPrompt,
      });
    }

    onRemix(messages);
    showToast(toast.success('Materialization remixed'));
  };

  return (
    <IOSModal
      isOpen={!!conversation}
      onClose={onClose}
      title="Remix Intelligence"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
            {selectedMessages.size} Selected
          </span>
          <div className="flex gap-3">
            <IOSButton variant="secondary" onClick={onClose}>
              Cancel
            </IOSButton>
            <IOSButton 
              variant="primary" 
              onClick={handleRemix} 
              disabled={selectedMessages.size === 0}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Start Remix
            </IOSButton>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Source info */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source Materialization</p>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{conversation.title}</h3>
          </div>
        </div>

        {/* Message Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Select Nodes
            </label>
            <div className="flex gap-3">
              <button onClick={selectAll} className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">All</button>
              <button onClick={deselectAll} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">None</button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 ios-scrollbar-thin">
            {conversation.messages.map((msg, index) => {
              const isSelected = selectedMessages.has(index);
              const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);

              return (
                <div
                  key={msg.id}
                  onClick={() => toggleMessage(index)}
                  className={cn(
                    "p-3 rounded-xl cursor-pointer transition-all border-2",
                    isSelected 
                      ? "bg-purple-50/50 dark:bg-purple-900/10 border-purple-500/30" 
                      : "bg-gray-50 dark:bg-gray-800/50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                      isSelected ? "bg-purple-500 border-purple-500" : "border-gray-300 dark:border-gray-600"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600">
                          {msg.role}
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced */}
        <div className="space-y-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors px-1"
          >
            <Settings className="w-3.5 h-3.5" />
            Override System Protocol
            <span className={cn("transition-transform duration-200", showAdvanced && "rotate-180")}>▼</span>
          </button>

          {showAdvanced && (
            <div className="p-4 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                New System Directive
              </label>
              <textarea
                value={newSystemPrompt}
                onChange={(e) => setNewSystemPrompt(e.target.value)}
                placeholder="Initialize new behavioral constraints..."
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none min-h-[80px]"
                rows={3}
              />
            </div>
          )}
        </div>
      </div>
    </IOSModal>
  );
};

export default RemuxDialog;
