/**
 * ACU Search Component
 * 
 * Semantic search interface for finding specific knowledge units
 */

import { useState } from 'react';
import { searchACUs, type ACU } from '../lib/acu-api';
import './ACUSearch.css';

interface ACUSearchProps {
  onACUClick?: (acu: ACU) => void;
}

export function ACUSearch({ onACUClick }: ACUSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ACU[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    type?: string;
    category?: string;
    minQuality?: number;
  }>({});

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await searchACUs({
        query: query.trim(),
        ...filters,
        limit: 50
      });
      
      setResults(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
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

  function highlightMatch(content: string, query: string) {
    if (!query) return content;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = content.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i}>{part}</mark>
      ) : (
        part
      )
    );
  }

  return (
    <div className="acu-search">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search knowledge units... (e.g., 'rust error handling')"
            className="search-input"
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={loading || !query.trim()}
          >
            {loading ? '🔄' : '🔍'} Search
          </button>
        </div>

        {/* Advanced Filters */}
        <details className="search-filters">
          <summary>Advanced Filters</summary>
          <div className="filter-grid">
            <div className="filter-item">
              <label>Type:</label>
              <select
                value={filters.type || ''}
                onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
              >
                <option value="">All Types</option>
                <option value="statement">Statements</option>
                <option value="question">Questions</option>
                <option value="answer">Answers</option>
                <option value="code_snippet">Code</option>
                <option value="formula">Formulas</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Category:</label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
              >
                <option value="">All Categories</option>
                <option value="technical">Technical</option>
                <option value="conceptual">Conceptual</option>
                <option value="procedural">Procedural</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Min Quality:</label>
              <select
                value={filters.minQuality || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  minQuality: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              >
                <option value="">Any</option>
                <option value="80">Excellent (80+)</option>
                <option value="60">Good (60+)</option>
                <option value="40">Fair (40+)</option>
              </select>
            </div>
          </div>
        </details>
      </form>

      {/* Error */}
      {error && (
        <div className="search-error">
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <h3>Found {results.length} result{results.length !== 1 ? 's' : ''}</h3>
            <span className="results-query">for "{query}"</span>
          </div>

          <div className="results-list">
            {results.map((acu) => (
              <div
                key={acu.id}
                className="result-card"
                onClick={() => onACUClick?.(acu)}
              >
                <div className="result-header">
                  <span className="result-type">
                    {getTypeIcon(acu.type)} {acu.type.replace('_', ' ')}
                  </span>
                  <span className="result-category">{acu.category}</span>
                </div>

                <div className="result-content">
                  {acu.type === 'code_snippet' ? (
                    <pre><code>{acu.content}</code></pre>
                  ) : (
                    <p>{highlightMatch(acu.content, query)}</p>
                  )}
                </div>

                <div className="result-footer">
                  {acu.qualityOverall !== undefined && (
                    <span className="result-quality">
                      Quality: {Math.round(acu.qualityOverall)}%
                    </span>
                  )}
                  <span className="result-source">
                    from {acu.provider}
                  </span>
                  <span className="result-date">
                    {new Date(acu.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && query && (
        <div className="search-empty">
          <p>No results found for "{query}"</p>
          <p className="hint">Try different keywords or adjust filters</p>
        </div>
      )}
    </div>
  );
}

export default ACUSearch;
