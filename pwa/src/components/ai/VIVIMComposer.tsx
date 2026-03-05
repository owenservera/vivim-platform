import { FC } from 'react';
import { ComposerPrimitive, useAuiState } from '@assistant-ui/react';
import { Send, Loader2, Paperclip } from 'lucide-react';
import { Button } from '../ui/button';

export const VIVIMComposer: FC = () => {
  const isRunning = useAuiState(s => s.thread.isRunning);

  return (
    <ComposerPrimitive.Root className="flex items-end gap-2 w-full max-w-4xl mx-auto rounded-2xl border bg-surface-elevated/80 backdrop-blur pb-2 pt-2 px-3 shadow-sm focus-within:ring-2 focus-within:ring-primary-500/50 transition-all">
      {/* Optional attachment button */}
      <Button variant="ghost" size="icon" className="shrink-0 mb-1 rounded-full text-muted-foreground hover:bg-muted" disabled={isRunning}>
        <Paperclip className="w-5 h-5" />
      </Button>

      <ComposerPrimitive.Input
        autoFocus
        placeholder="Type a message or trigger memory retrieval..."
        className="flex-1 min-h-[44px] max-h-[200px] resize-none pb-3 pt-3 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      
      <ComposerPrimitive.Send asChild>
        <Button 
          disabled={isRunning}
          size="icon" 
          className="shrink-0 mb-1 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {isRunning ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5 ml-0.5" />
          )}
        </Button>
      </ComposerPrimitive.Send>

      <ComposerPrimitive.Cancel asChild>
        {isRunning && (
           <Button 
             variant="destructive"
             size="sm" 
             className="absolute -top-10 right-0 shrink-0 mb-1 rounded-full shadow-md transition-all active:scale-95"
           >
             Stop
           </Button>
        )}
      </ComposerPrimitive.Cancel>
    </ComposerPrimitive.Root>
  );
};
