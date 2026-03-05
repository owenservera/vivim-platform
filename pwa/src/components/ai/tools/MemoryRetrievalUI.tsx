import React from 'react';
import { makeAssistantToolUI } from '@assistant-ui/react';
import { Search, CheckCircle } from 'lucide-react';

export const MemoryRetrievalUI = makeAssistantToolUI({
  toolName: 'retrieve_memories',
  render: ({ args, status, result }) => (
    <div className="flex items-center gap-2 p-3 my-2 rounded-xl border border-border-subtle bg-surface-base/50 shadow-sm max-w-sm">
      {status === 'running' ? (
        <>
          <Search className="w-4 h-4 animate-pulse text-brand-secondary" />
          <span className="text-xs text-text-tertiary">
            Searching memories for "{args.query as string}"...
          </span>
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 text-success-500" />
          <span className="text-xs text-text-secondary">
            Retrieved {(result as any)?.count || 0} memories.
          </span>
        </>
      )}
    </div>
  )
});
