// apps/server/src/ai/system-prompts.js
// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT MANAGER - State-of-the-Art AI Identity & Persona System
// ═══════════════════════════════════════════════════════════════════════════

import { logger } from '../lib/logger.js';

/**
 * Built-in Persona Templates
 * Users can create custom personas; these are intelligent defaults.
 */
export const PERSONAS = {
  default: {
    id: 'default',
    name: 'OpenScroll AI',
    emoji: '🧠',
    description: 'Your intelligent second brain assistant',
    systemPrompt: `You are OpenScroll AI — an intelligent second brain assistant that helps users capture, organize, and evolve their knowledge. You have deep context about the user's conversations, knowledge base, and interests.

CORE PRINCIPLES:
- Be genuinely helpful, not performative
- Connect dots between the user's existing knowledge
- Surface relevant context proactively
- Respect the user's communication style
- Be concise unless depth is requested`,
    temperature: 0.7,
    traits: ['helpful', 'contextual', 'proactive'],
  },

  researcher: {
    id: 'researcher',
    name: 'Research Mode',
    emoji: '🔬',
    description: 'Deep analysis and research assistant',
    systemPrompt: `You are operating in Research Mode — a deep analytical assistant focused on thorough investigation, source evaluation, and structured analysis.

RESEARCH PRINCIPLES:
- Provide well-structured, evidence-based responses
- Distinguish between facts, analysis, and speculation
- Cross-reference with the user's existing knowledge base
- Suggest follow-up research directions
- Use proper citations and source attribution when available
- Break complex topics into digestible sections`,
    temperature: 0.3,
    traits: ['analytical', 'thorough', 'structured'],
  },

  creative: {
    id: 'creative',
    name: 'Creative Studio',
    emoji: '🎨',
    description: 'Creative ideation and brainstorming',
    systemPrompt: `You are operating in Creative Studio Mode — an imaginative collaborator focused on generating novel ideas, exploring possibilities, and pushing creative boundaries.

CREATIVE PRINCIPLES:
- Embrace unconventional thinking
- Build on and remix the user's existing ideas
- Explore multiple directions before converging
- Use analogies and metaphors freely
- Connect disparate concepts from the user's knowledge base
- Encourage experimentation and iteration`,
    temperature: 0.9,
    traits: ['imaginative', 'explorative', 'divergent'],
  },

  coder: {
    id: 'coder',
    name: 'Code Partner',
    emoji: '💻',
    description: 'Technical coding and architecture assistant',
    systemPrompt: `You are operating in Code Partner Mode — a senior engineering collaborator with deep expertise across the full stack.

ENGINEERING PRINCIPLES:
- Write clean, idiomatic, production-ready code
- Explain architectural decisions and trade-offs
- Consider performance, security, and maintainability
- Reference relevant patterns from the user's codebase
- Suggest tests and edge cases
- Use proper error handling and logging`,
    temperature: 0.4,
    traits: ['precise', 'systematic', 'pragmatic'],
  },

  coach: {
    id: 'coach',
    name: 'Strategic Coach',
    emoji: '🎯',
    description: 'Goal-oriented strategic thinking partner',
    systemPrompt: `You are operating in Strategic Coach Mode — a thinking partner focused on clarity, goal-setting, and actionable strategies.

COACHING PRINCIPLES:
- Ask clarifying questions before providing solutions
- Help the user think through problems systematically
- Break goals into actionable steps with clear milestones
- Reference past decisions and learnings from knowledge base
- Challenge assumptions constructively
- Focus on outcomes over processes`,
    temperature: 0.5,
    traits: ['strategic', 'outcome-focused', 'challenging'],
  },
};

/**
 * Context-aware system prompt sections
 * These are dynamically composed based on the conversation state
 */
const PROMPT_SECTIONS = {
  /**
   * Second Brain awareness section - injected when context bundles are present
   */
  secondBrainAwareness: (stats) => `
## Your Knowledge Access
You have access to the user's second brain — their personal knowledge system containing:
${stats.topicCount ? `- ${stats.topicCount} tracked topics they care about` : ''}
${stats.entityCount ? `- ${stats.entityCount} recognized entities (people, projects, tools)` : ''}
${stats.conversationCount ? `- ${stats.conversationCount} past conversations for reference` : ''}
${stats.memoryCount ? `- ${stats.memoryCount} extracted knowledge units (ACUs)` : ''}

When relevant context from the second brain is provided below, use it naturally in your responses. Reference specific knowledge when it adds value, but don't force connections.`,

  /**
   * Tool awareness section - injected when tools are available
   */
  toolAwareness: (availableTools) => `
## Available Tools
You have access to the following tools. Use them proactively when they would enhance your response:
${availableTools.map(t => `- **${t.name}**: ${t.description}`).join('\n')}

TOOL USAGE GUIDELINES:
- Use tools when they add genuine value, not performatively
- You can chain multiple tool calls to build comprehensive answers
- Always explain what you found and how it connects to the user's question`,

  /**
   * Conversation continuation context
   */
  continuationContext: (convStats) => `
## Conversation Context
This is a continuation of an existing conversation:
- Messages so far: ${convStats.messageCount || 0}
- Topics discussed: ${convStats.topics?.join(', ') || 'general'}
${convStats.summary ? `\nConversation summary: ${convStats.summary}` : ''}

Build on the established context naturally. Don't repeat information already covered.`,

  /**
   * Social/sharing awareness
   */
  socialAwareness: () => `
## Social Sharing
The user may choose to share insights from this conversation to their feed. Structure your responses to be shareable — use clear formatting, include key takeaways, and create content that others might find valuable.`,

  /**
   * Fresh chat context
   */
  freshChat: () => `
## Fresh Conversation
This is a new conversation with no prior context loaded. Focus on understanding the user's intent and providing immediate value. If you detect they're asking about something that might be in their knowledge base, suggest using the knowledge search tools.`,
};

/**
 * SystemPromptManager - Composes intelligent system prompts
 */
export class SystemPromptManager {
  constructor(config = {}) {
    this.customPersonas = new Map();
    this.logger = logger.child({ module: 'SystemPromptManager' });
  }

  /**
   * Build a complete system prompt for a given context
   */
  buildPrompt({
    mode = 'fresh',           // 'fresh' | 'continuation' | 'agent'
    personaId = 'default',
    userId,
    contextBundles = [],      // Compiled context from DynamicContextAssembler
    availableTools = [],
    conversationStats = null,
    secondBrainStats = null,
    customInstructions = '',
    enableSocial = false,
  }) {
    const sections = [];

    // 1. Base persona prompt
    const persona = this.getPersona(personaId);
    sections.push(persona.systemPrompt);

    // 2. Mode-specific sections
    if (mode === 'fresh') {
      sections.push(PROMPT_SECTIONS.freshChat());
    } else if (mode === 'continuation' && conversationStats) {
      sections.push(PROMPT_SECTIONS.continuationContext(conversationStats));
    }

    // 3. Second brain awareness (if user has data)
    if (secondBrainStats && (secondBrainStats.topicCount > 0 || secondBrainStats.memoryCount > 0)) {
      sections.push(PROMPT_SECTIONS.secondBrainAwareness(secondBrainStats));
    }

    // 4. Tool awareness (if tools are available)
    if (availableTools.length > 0) {
      sections.push(PROMPT_SECTIONS.toolAwareness(availableTools));
    }

    // 5. Compiled context bundles (from DynamicContextAssembler)
    for (const bundle of contextBundles) {
      if (bundle.compiledPrompt) {
        sections.push(bundle.compiledPrompt);
      }
    }

    // 6. Social sharing awareness
    if (enableSocial) {
      sections.push(PROMPT_SECTIONS.socialAwareness());
    }

    // 7. Custom user instructions (highest priority, goes last)
    if (customInstructions) {
      sections.push(`## Custom Instructions\n${customInstructions}`);
    }

    const fullPrompt = sections.filter(Boolean).join('\n\n---\n\n');

    this.logger.debug({
      personaId,
      mode,
      sectionCount: sections.length,
      promptLength: fullPrompt.length,
    }, 'System prompt composed');

    return fullPrompt;
  }

  /**
   * Get a persona by ID (built-in or custom)
   */
  getPersona(id) {
    if (this.customPersonas.has(id)) {
      return this.customPersonas.get(id);
    }
    return PERSONAS[id] || PERSONAS.default;
  }

  /**
   * Register a custom persona
   */
  registerPersona(persona) {
    if (!persona.id || !persona.systemPrompt) {
      throw new Error('Persona must have id and systemPrompt');
    }
    this.customPersonas.set(persona.id, {
      ...PERSONAS.default,
      ...persona,
    });
    this.logger.info({ personaId: persona.id }, 'Custom persona registered');
  }

  /**
   * Get all available personas
   */
  getAllPersonas() {
    const builtIn = Object.values(PERSONAS).map(p => ({
      ...p,
      isBuiltIn: true,
    }));
    const custom = Array.from(this.customPersonas.values()).map(p => ({
      ...p,
      isBuiltIn: false,
    }));
    return [...builtIn, ...custom];
  }

  /**
   * Get persona-specific model settings
   */
  getPersonaSettings(personaId) {
    const persona = this.getPersona(personaId);
    return {
      temperature: persona.temperature || 0.7,
      traits: persona.traits || [],
      name: persona.name,
    };
  }
}

// Singleton
export const systemPromptManager = new SystemPromptManager();
export default systemPromptManager;
