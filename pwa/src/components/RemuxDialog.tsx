/**
 * Remux Dialog
 * Dialog for remixing/reusing AI conversations
 */

import React, { useState } from 'react';
import { X, RefreshCw, Settings, Check, Sparkles } from 'lucide-react';
import type { Conversation } from '../types/conversation';

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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-slideIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Remix Conversation</h2>
              <p className="text-sm text-gray-500">Reuse this conversation with new context</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Conversation Title */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">From:</span>
            <span className="font-medium">{conversation.title}</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-500 capitalize">{conversation.provider}</span>
          </div>

          {/* Message Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Select Messages</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Select All
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={deselectAll}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {conversation.messages.map((msg, index) => {
                const isSelected = selectedMessages.has(index);
                const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
                const preview = content.slice(0, 150) + (content.length > 150 ? '...' : '');

                return (
                  <div
                    key={msg.id}
                    onClick={() => toggleMessage(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-purple-600/10 border border-purple-500/30'
                        : 'bg-gray-800/50 border border-transparent hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium capitalize text-gray-400">
                            {msg.role}
                          </span>
                          <span className="text-xs text-gray-600">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2">{preview}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              Advanced Options
              <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg space-y-4 animate-slideIn">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    New System Prompt (optional)
                  </label>
                  <textarea
                    value={newSystemPrompt}
                    onChange={(e) => setNewSystemPrompt(e.target.value)}
                    placeholder="Add a new system prompt to guide the conversation..."
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be prepended to the selected messages as a new system instruction.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-900/50">
          <div className="text-sm text-gray-500">
            {selectedMessages.size} message{selectedMessages.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRemix}
              disabled={selectedMessages.size === 0}
              className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Start Remix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemuxDialog;
