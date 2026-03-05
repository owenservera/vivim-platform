import { FC, ReactNode } from 'react';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useVivimChatRuntime } from '../../lib/chat-runtime';

export interface VivimAIChatProviderProps {
  children: ReactNode;
  conversationId: string | null;
}

export const VivimAIChatProvider: FC<VivimAIChatProviderProps> = ({ children, conversationId }) => {
  // useVivimChatRuntime wraps Assistant-UI's useChatRuntime and hooks it up to our backend
  const runtime = useVivimChatRuntime(conversationId);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};
