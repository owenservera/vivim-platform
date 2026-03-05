import { FC, ReactNode } from 'react';
import { ThreadPrimitive } from '@assistant-ui/react';
import { VIVIMMessage } from './VIVIMMessage';
import { VIVIMComposer } from './VIVIMComposer';

export interface VIVIMThreadProps {
  className?: string;
  welcome?: ReactNode;
}

export const VIVIMThread: FC<VIVIMThreadProps> = ({ className, welcome }) => {
  // Optional: Get tool results to pass to ContextCockpit, though typically
  // tools are rendered directly inside VIVIMMessage.
  
  return (
    <ThreadPrimitive.Root className={`flex flex-col h-full ${className || ''}`}>
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        <ThreadPrimitive.Messages
          components={{
            Message: VIVIMMessage,
            UserMessage: VIVIMMessage, // Reuse same component, it branches internally
          }}
        />
        <ThreadPrimitive.Empty>{welcome}</ThreadPrimitive.Empty>
      </ThreadPrimitive.Viewport>

      <div className="relative sticky bottom-0 z-10 bg-background/80 backdrop-blur-lg border-t pt-2 pb-4 px-4">
        {/* We can show a minimized ContextCockpit indicator here if needed */}
        <VIVIMComposer />
      </div>
    </ThreadPrimitive.Root>
  );
};
