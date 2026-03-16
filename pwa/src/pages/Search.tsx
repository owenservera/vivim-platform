import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  X, 
  History, 
  Sparkles, 
  MessageSquare,
  ChevronRight,
  Database,
  Globe
} from 'lucide-react';

/* Services & Utils */
import { conversationService } from '../lib/service/conversation-service';
import { log } from '../lib/logger';
import { cn } from '../lib/utils';

/* Components */
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FeedItemCard } from '../components/features/conversation/FeedItemCard';

import './Search.css';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'local' | 'global'>('local');
  const navigate = useNavigate();

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      if (searchMode === 'local') {
        const all = await conversationService.getAllConversations();
        const filtered = all.filter(c => 
          c.title?.toLowerCase().includes(q.toLowerCase()) || 
          c.tags?.some(t => t.toLowerCase().includes(q.toLowerCase()))
        );
        setResults(filtered);
      } else {
        // Global search placeholder
        await new Promise(r => setTimeout(r, 800));
        setResults([]);
      }
    } catch (err) {
      log.error('SEARCH', 'Search failed', err as Error);
    } finally {
      setLoading(false);
    }
  }, [searchMode]);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="px-4 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        
        <div className="flex flex-col gap-4">
          <Input 
            placeholder="Search your AI memory..."
            leftIcon={<SearchIcon className="w-5 h-5 text-muted-foreground" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-card border-none shadow-sm h-14 text-lg rounded-2xl"
            rightIcon={query && <button onClick={() => setQuery('')}><X className="w-5 h-5 text-muted-foreground" /></button>}
          />

          <div className="flex items-center gap-2 bg-card p-1 rounded-xl w-fit shadow-sm border border-border/50">
            <button 
              onClick={() => setSearchMode('local')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                searchMode === 'local' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Database className="w-3.5 h-3.5" />
              Local Memory
            </button>
            <button 
              onClick={() => setSearchMode('global')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                searchMode === 'global' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              Global Index
            </button>
          </div>
        </div>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-4">
            {results.map((convo) => (
              <FeedItemCard 
                key={convo.id}
                conversation={convo}
                isPinned={false}
                isArchived={convo.state === 'ARCHIVED'}
                onContinue={(id) => navigate(`/ai/conversation/${id}`)}
                onShare={() => {}}
                onPinToggle={() => {}}
                onArchiveToggle={() => {}}
                onDelete={() => {}}
                onFork={() => {}}
                onDuplicate={() => {}}
                onAIClick={() => {}}
              />
            ))}
          </div>
        ) : query ? (
          <Card variant="glass" padding="lg" className="text-center py-20 border-none shadow-sm">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold">No results found</h3>
            <p className="text-muted-foreground">We couldn't find anything matching "{query}"</p>
          </Card>
        ) : (
          <div className="space-y-8 py-10">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                Recent Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {['React 19 hooks', 'Tailwind 4 migration', 'Decentralized AI', 'Post-quantum crypto'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setQuery(s)}
                    className="px-4 py-2 bg-card rounded-xl text-sm font-medium border border-border/50 hover:border-primary/50 transition-colors shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Suggested Queries
              </h3>
              <div className="grid gap-2">
                {[
                  { q: 'Conversations about Blockchain', icon: <ChevronRight className="w-4 h-4" /> },
                  { q: 'Shared with me last week', icon: <ChevronRight className="w-4 h-4" /> },
                  { q: 'DeepSeek vs GPT-4 comparisons', icon: <ChevronRight className="w-4 h-4" /> },
                ].map(item => (
                  <button 
                    key={item.q} 
                    onClick={() => setQuery(item.q)}
                    className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50 hover:bg-primary/5 transition-colors text-left shadow-sm"
                  >
                    <span className="font-semibold text-sm">{item.q}</span>
                    {item.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
