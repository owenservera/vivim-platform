import { useState, useCallback, useEffect } from 'react';
import { getSDK } from '../lib/vivim-sdk';
import { VivimAssistantRuntime } from '@vivim/sdk';
import type { SDKMessage, SDKContentPart } from '@vivim/sdk';

/**
 * useVivimAssistant
 * 
 * Standardized hook for using the VIVIM SDK Assistant Runtime in React.
 */
export function useVivimAssistant(initialThreadId?: string | null) {
  const [messages, setMessages] = useState<SDKMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(initialThreadId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [runtime, setRuntime] = useState<VivimAssistantRuntime | null>(null);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const sdk = await getSDK();
        if (!active) return;
        
        const assistant = sdk.assistant;
        setRuntime(assistant);

        // Sync initial state
        const state = assistant.getState();
        if (threadId && state.threadId === threadId) {
          setMessages(state.messages);
        }
        setIsLoading(state.isLoading);
        setError(state.error);

        // Listen for changes
        const handleStateChange = (newState: any) => {
          if (!threadId || newState.threadId === threadId) {
            setMessages([...newState.messages]);
            setIsLoading(newState.isLoading);
            setError(newState.error);
          }
        };

        assistant.on('state:change', handleStateChange);
        
        return () => {
          assistant.off('state:change', handleStateChange);
        };
      } catch (err) {
        setError(err as Error);
      }
    };

    init();
    return () => { active = false; };
  }, [threadId]);

  const sendMessage = useCallback(async (content: string | SDKContentPart[]) => {
    if (!runtime) throw new Error('Assistant runtime not initialized');
    return await runtime.sendMessage(content);
  }, [runtime]);

  const createThread = useCallback(async (title?: string) => {
    if (!runtime) throw new Error('Assistant runtime not initialized');
    const newId = await runtime.createThread(title);
    setThreadId(newId);
    return newId;
  }, [runtime]);

  const setExistingThread = useCallback((id: string) => {
    setThreadId(id);
  }, []);

  const stop = useCallback(() => {
    // SDK doesn't have a stop mechanism yet, but we can clear the loading state
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    messages,
    threadId,
    isLoading,
    error,
    sendMessage,
    createThread,
    setExistingThread,
    setMessages,
    stop,
    reset,
    runtime
  };
}
