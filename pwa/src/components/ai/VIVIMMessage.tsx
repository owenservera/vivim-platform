import React, { FC } from 'react';
import { MessagePrimitive, useMessage } from '@assistant-ui/react';
import { ContentRenderer } from '../content/ContentRenderer';
import { MemoryRetrievalUI } from './tools/MemoryRetrievalUI';
import { ACUExtractionUI } from './tools/ACUExtractionUI';
import { ContextCockpit } from '../ContextCockpit';
import { Bot, User } from 'lucide-react';

export const VIVIMMessage: FC = () => {
  const message = useMessage();
  const role = message.role;
  const isUser = role === 'user';

  return (
    <MessagePrimitive.Root className={`w-full py-4 transition-all animate-fade-in`}>
      <div className={`flex w-full mb-6 max-w-4xl mx-auto gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className="shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
            isUser ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-black' : 'bg-primary-500 text-white'
          }`}>
            {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
          </div>
        </div>

        {/* Message Bubble container */}
        <div className={`flex flex-col gap-2 min-w-0 flex-1 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl max-w-full glass-border shadow-sm text-[15px] leading-relaxed ${
            isUser
              ? 'bg-zinc-100 shadow-zinc-200/50 dark:bg-zinc-800 dark:shadow-black/50 text-zinc-900 dark:text-zinc-100 rounded-tr-sm'
              : 'bg-surface-base text-[var(--text-primary)] rounded-tl-sm border border-border-subtle'
          }`}>
            <MessagePrimitive.Content
              components={{
                Text: ({ part }: any) => {
                  const content = part?.text || '';
                  const deferredContent = React.useDeferredValue(typeof content === 'string' ? content : '');
                  return <ContentRenderer content={deferredContent} />;
                },
                tools: {
                  retrieve_memories: MemoryRetrievalUI,
                  extract_acu: ACUExtractionUI,
                  // The hidden tool that triggers the Context Cockpit visualization
                  assemble_context: {
                    render: ({ result }: any) => {
                        if (!result) return null;
                        return (
                          <div className="my-4 max-w-3xl border rounded-2xl overflow-hidden bg-background">
                            <div className="p-3 bg-muted/50 text-xs font-semibold text-muted-foreground border-b flex items-center justify-between">
                              <span>Context Engine: Pre-assembly Report</span>
                              <span className="text-[10px] font-mono">{result.totalTokens} tk</span>
                            </div>
                            <ContextCockpit
                              contextAllocation={result.allocation || {}}
                              totalTokensAvailable={12000}
                              metadata={result.metadata}
                              telemetry={result.telemetry}
                            />
                          </div>
                        );
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};
