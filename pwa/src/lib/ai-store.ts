/**
 * AI Settings Store
 * Manages AI provider preferences, personas, and tool settings using Zustand
 * Enhanced for the state-of-the-art AI system
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AIProviderType } from '../types/ai';

/**
 * Persona type matching backend PERSONAS
 */
export type PersonaId = 'default' | 'researcher' | 'creative' | 'coder' | 'coach' | string;

/**
 * Agent interaction mode
 */
export type AgentMode = 'single-shot' | 'multi-step' | 'researcher' | 'conversational';

/**
 * Tool set options
 */
export type ToolSet = 'full' | 'second-brain' | 'social' | 'minimal' | 'none';

interface AIState {
  // Provider settings
  defaultProvider: AIProviderType;
  defaultModel: string;
  preferredProviders: AIProviderType[];
  apiKeys: Record<string, string>;

  // Model settings
  maxTokens: number;
  temperature: number;
  enableStreaming: boolean;

  // Persona & Agent settings
  defaultPersona: PersonaId;
  agentMode: AgentMode;
  toolSet: ToolSet;
  maxSteps: number;
  enableTools: boolean;
  enableSocial: boolean;
  customInstructions: string;

  // Actions
  setDefaultProvider: (provider: AIProviderType) => void;
  setDefaultModel: (model: string) => void;
  setPreferredProviders: (providers: AIProviderType[]) => void;
  setApiKey: (provider: string, key: string) => void;
  removeApiKey: (provider: string) => void;
  setMaxTokens: (max: number) => void;
  setTemperature: (temp: number) => void;
  setEnableStreaming: (enabled: boolean) => void;
  setDefaultPersona: (persona: PersonaId) => void;
  setAgentMode: (mode: AgentMode) => void;
  setToolSet: (toolSet: ToolSet) => void;
  setMaxSteps: (steps: number) => void;
  setEnableTools: (enabled: boolean) => void;
  setEnableSocial: (enabled: boolean) => void;
  setCustomInstructions: (instructions: string) => void;
  reset: () => void;
}

const DEFAULT_STATE = {
  defaultProvider: 'zai' as AIProviderType,
  defaultModel: 'glm-4.7',
  preferredProviders: ['zai'] as AIProviderType[],
  apiKeys: {},
  maxTokens: 4096,
  temperature: 0.7,
  enableStreaming: true,
  defaultPersona: 'default' as PersonaId,
  agentMode: 'multi-step' as AgentMode,
  toolSet: 'full' as ToolSet,
  maxSteps: 8,
  enableTools: true,
  enableSocial: true,
  customInstructions: '',
};

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      // Provider actions
      setDefaultProvider: (provider) => set({ defaultProvider: provider }),
      setDefaultModel: (model) => set({ defaultModel: model }),
      setPreferredProviders: (providers) => set({ preferredProviders: providers }),
      setApiKey: (provider, key) => set((state) => ({
        apiKeys: { ...state.apiKeys, [provider]: key },
      })),
      removeApiKey: (provider) => set((state) => {
        const { [provider]: _, ...rest } = state.apiKeys;
        return { apiKeys: rest };
      }),
      setMaxTokens: (max) => set({ maxTokens: max }),
      setTemperature: (temp) => set({ temperature: temp }),
      setEnableStreaming: (enabled) => set({ enableStreaming: enabled }),

      // Persona & agent actions
      setDefaultPersona: (persona) => set({ defaultPersona: persona }),
      setAgentMode: (mode) => set({ agentMode: mode }),
      setToolSet: (toolSet) => set({ toolSet }),
      setMaxSteps: (steps) => set({ maxSteps: steps }),
      setEnableTools: (enabled) => set({ enableTools: enabled }),
      setEnableSocial: (enabled) => set({ enableSocial: enabled }),
      setCustomInstructions: (instructions) => set({ customInstructions: instructions }),
      reset: () => set(DEFAULT_STATE),
    }),
    {
      name: 'vivim-ai-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
