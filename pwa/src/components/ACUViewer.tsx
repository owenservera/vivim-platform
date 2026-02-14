/**
 * ACU Viewer Component
 * 
 * Displays Atomic Chat Units with quality indicators,
 * type badges, and relationship visualization
 */

import { useEffect, useState } from 'react';
import { getConversationACUs, type ACU } from '../lib/acu-api';
import './ACUViewer.css';

interface ACUViewerProps {
  conversationId: string;
  onACUClick?: (acu: ACU) => void;
}

export function ACUViewer({ conversationId, onACUClick }: ACUViewerProps) {
  const [acus, setAcus] = useState<ACU[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    type?: string;
    minQuality?: number;
  }>({});

  useEffect(() => {
    loadACUs();
  }, [conversationId, filter]);

  async function loadACUs() {
    try {
      setLoading(true);
      setError(null);
      const result = await getConversationACUs(conversationId);
      
      let filteredACUs = result.data;
      
      // Apply filters
      if (filter.type) {
        filteredACUs = filteredACUs.filter(acu => acu.type === filter.type);
      }
      if (filter.minQuality) {
        filteredACUs = filteredACUs.filter(
          acu => (acu.qualityOverall || 0) >= filter.minQuality!
        );
      }
      
      setAcus(filteredACUs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ACUs');
    } finally {
      setLoading(false);
    }
  }

  function getTypeIcon(type: string) {
    const icons: Record<string, string> = {
      statement: '💬',
      question: '❓',
      answer: '✅',
      code_snippet: '💻',
      formula: '🔢',
      table: '📊',
      image: '🖼️',
      tool_call: '🔧',
      unknown: '📝'
    };
    return icons[type] || icons.unknown;
  }

  function getQualityColor(quality?: number) {
    if (!quality) return 'gray';
    if (quality >= 80) return 'green';
    if (quality >= 60) return 'yellow';
    if (quality >= 40) return 'orange';
    return 'red';
  }

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      technical: '#3b82f6',
      conceptual: '#8b5cf6',
      procedural: '#10b981',
      personal: '#f59e0b',
      general: '#6b7280'
    };
    return colors[category] || colors.general;
  }

  if (loading) {
    return (
      <div className="acu-viewer loading">
        <div className="spinner"></div>
        <p>Loading knowledge units...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="acu-viewer error">
        <p>❌ {error}</p>
        <button onClick={loadACUs}>Retry</button>
      </div>
    );
  }

  if (acus.length === 0) {
    return (
      <div className="acu-viewer empty">
        <p>No ACUs found for this conversation.</p>
        <p className="hint">
          ACUs are generated automatically when conversations are processed.
        </p>
      </div>
    );
  }

  return (
    <div className="acu-viewer">
      {/* Filters */}
      <div className="acu-filters">
        <div className="filter-group">
          <label>Type:</label>
          <select
            value={filter.type || ''}
            onChange={(e) => setFilter({ ...filter, type: e.target.value || undefined })}
          >
            <option value="">All Types</option>
            <option value="statement">Statements</option>
            <option value="question">Questions</option>
            <option value="answer">Answers</option>
            <option value="code_snippet">Code</option>
            <option value="formula">Formulas</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Min Quality:</label>
          <select
            value={filter.minQuality || ''}
            onChange={(e) => setFilter({ 
              ...filter, 
              minQuality: e.target.value ? parseInt(e.target.value) : undefined 
            })}
          >
            <option value="">Any Quality</option>
            <option value="80">Excellent (80+)</option>
            <option value="60">Good (60+)</option>
            <option value="40">Fair (40+)</option>
          </select>
        </div>

        <div className="acu-count">
          {acus.length} knowledge unit{acus.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ACU List */}
      <div className="acu-list">
        {acus.map((acu) => (
          <div
            key={acu.id}
            className="acu-card"
            onClick={() => onACUClick?.(acu)}
            style={{
              borderLeftColor: getCategoryColor(acu.category)
            }}
          >
            {/* Header */}
            <div className="acu-header">
              <div className="acu-type">
                <span className="type-icon">{getTypeIcon(acu.type)}</span>
                <span className="type-label">{acu.type.replace('_', ' ')}</span>
              </div>

              <div className="acu-badges">
                <span 
                  className="category-badge"
                  style={{ backgroundColor: getCategoryColor(acu.category) }}
                >
                  {acu.category}
                </span>
                
                {acu.language && (
                  <span className="language-badge">
                    {acu.language}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="acu-content">
              {acu.type === 'code_snippet' ? (
                <pre><code>{acu.content}</code></pre>
              ) : (
                <p>{acu.content}</p>
              )}
            </div>

            {/* Footer */}
            <div className="acu-footer">
              {/* Quality Indicator */}
              {acu.qualityOverall !== undefined && (
                <div className="quality-indicator">
                  <div className="quality-bar-container">
                    <div
                      className="quality-bar"
                      style={{
                        width: `${acu.qualityOverall}%`,
                        backgroundColor: getQualityColor(acu.qualityOverall)
                      }}
                    />
                  </div>
                  <span className="quality-score">
                    {Math.round(acu.qualityOverall)}
                  </span>
                </div>
              )}

              {/* Metadata */}
              <div className="acu-meta">
                <span className="meta-item">
                  📍 Message {acu.messageIndex + 1}
                </span>
                <span className="meta-item">
                  {new Date(acu.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ACUViewer;
