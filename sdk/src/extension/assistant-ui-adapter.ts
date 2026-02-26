/**
 * VIVIM SDK - Assistant-UI Adapter
 * 
 * Provides a standardized bridge for @assistant-ui/react to consume
 * the VIVIM SDK core directly without an intermediate HTTP API.
 */

import { VivimAssistantRuntime } from '../core/assistant-runtime.js';

/**
 * VivimSDKTransport
 * 
 * Implements the ChatModelAdapter interface from assistant-ui
 */
export class VivimSDKTransport {
  constructor(
    private runtime: VivimAssistantRuntime,
    private threadId: string
  ) {}

  /**
   * Main entry point for assistant-ui to send messages
   */
  async *stream(params: any): AsyncIterable<any> {
    const { messages } = params;
    const lastMessage = messages[messages.length - 1];
    
    // Convert to SDK format if needed
    const content = lastMessage.content[0].text;

    // Trigger SDK assistant
    await this.runtime.sendMessage(content);

    const state = this.runtime.getState();
    const assistantMsg = state.messages[state.messages.length - 1];

    if (assistantMsg && assistantMsg.role === 'assistant') {
      // Mock streaming chunks for the UI
      const text = assistantMsg.content[0].type === 'text' ? (assistantMsg.content[0] as any).text : '';
      for (const char of text) {
        yield {
          content: [{ type: 'text', text: char }]
        };
        await new Promise(r => setTimeout(r, 20));
      }
    }
  }
}

/**
 * Helper to create a standardized runtime config for assistant-ui
 */
export function createAssistantRuntimeConfig(sdk: any, threadId: string) {
  const runtime = new VivimAssistantRuntime(sdk);
  return {
    transport: new VivimSDKTransport(runtime, threadId),
  };
}
