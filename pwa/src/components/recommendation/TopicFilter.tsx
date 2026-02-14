/**
 * Topic Filter Component
 * Allows filtering recommendations by topic tags
 */

import { useState } from 'react';
import { Hash, ChevronUp, ChevronDown, X } from 'lucide-react';
import './TopicFilter.css';

interface TopicFilterProps {
  topics: { name: string; count: number }[];
  selectedTopics: string[];
  onTopicToggle: (topic: string) => void;
  onClearAll: () => void;
}

export function TopicFilter({ topics, selectedTopics, onTopicToggle, onClearAll }: TopicFilterProps) {
  const [expanded, setExpanded] = useState(false);

  // Sort topics by count (descending)
  const sortedTopics = [...topics].sort((a, b) => b.count - a.count);

  if (sortedTopics.length === 0) {
    return null;
  }

  return (
    <div className="topic-filter">
      <button
        className="topic-filter-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="topic-filter-header">
          <div className="topic-filter-title">
            <Hash className="w-3.5 h-3.5" />
            <span>Filter by Topic</span>
            {selectedTopics.length > 0 && (
              <span className="topic-count-badge">{selectedTopics.length}</span>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="topic-filter-chevron w-4 h-4" />
          ) : (
            <ChevronDown className="topic-filter-chevron w-4 h-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="topic-filter-content">
          {selectedTopics.length > 0 && (
            <div className="topic-filter-actions">
              <span className="selected-text">
                {selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''} selected
              </span>
              <button
                className="clear-topics-btn"
                onClick={onClearAll}
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            </div>
          )}

          <div className="topic-list">
            {sortedTopics.map((topic) => {
              const isSelected = selectedTopics.includes(topic.name);
              return (
                <button
                  key={topic.name}
                  className={`topic-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => onTopicToggle(topic.name)}
                  title={`${topic.count} conversations`}
                >
                  <span className="topic-name">{topic.name}</span>
                  <span className="topic-count">{topic.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}