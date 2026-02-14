import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const systemContext = JSON.parse(
  readFileSync(join(__dirname, 'vivim-system-context.json'), 'utf-8')
);

// ============================================================================
// TYPES
// ============================================================================

export interface VIVIMPillar {
  name: string;
  description: string;
  value: string;
}

export interface VIVIMCapability {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

export interface VIVIMProvider {
  id: string;
  name: string;
  domain: string;
  captureSupported: boolean;
  byokSupported: boolean;
}

export interface VIVIMPrivacyFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface VIVIMContextLayer {
  id: string;
  name: string;
  priority: number;
  description: string;
}

export interface VIVIMFAQ {
  question: string;
  answer: string;
  category: 'general' | 'privacy' | 'technical' | 'billing';
}

export interface VIVIMIdentity {
  version: string;
  updatedAt: string;
  name: string;
  tagline: string;
  description: string;
  pillars: VIVIMPillar[];
  capabilities: VIVIMCapability[];
  providers: VIVIMProvider[];
  privacyFeatures: VIVIMPrivacyFeature[];
  layers: VIVIMContextLayer[];
  faq: VIVIMFAQ[];
  limitations: string[];
}

// ============================================================================
// IDENTITY DATA
// ============================================================================

// This is compiled from VIVIM_IDENTITY_PROMPT.md
// Do not edit manually - regenerate via workflow

export const VIVIM_IDENTITY: VIVIMIdentity = {
  version: '1.0.0',
  updatedAt: '2026-02-13T00:00:00Z',
  name: 'VIVIM',
  tagline: 'Own Your AI',
  description: 'VIVIM is a consumer app focused on capturing, owning, evolving, and sharing AI conversations.',
  
  pillars: [
    {
      name: 'Feed',
      description: 'Social network for AI conversations',
      value: 'Discovery, inspiration, social proof'
    },
    {
      name: 'Vault',
      description: 'Personal encrypted knowledge store',
      value: 'Ownership, privacy, organization'
    },
    {
      name: 'Capture',
      description: 'Extract from any AI platform',
      value: 'Liberation from walled gardens'
    },
    {
      name: 'Chat',
      description: 'Continue with your own AI keys',
      value: 'Evolve, remix, build on knowledge'
    }
  ],
  
  capabilities: [
    { id: 'capture', name: 'Capture', description: 'Extract conversations from AI platforms', available: true },
    { id: 'vault', name: 'Vault', description: 'Encrypted personal knowledge store', available: true },
    { id: 'byok', name: 'BYOK Chat', description: 'Bring your own AI keys', available: true },
    { id: 'social', name: 'Social Feed', description: 'Share and discover conversations', available: true },
    { id: 'acu', name: 'ACU System', description: 'Atomic Chat Units for modular knowledge', available: true },
    { id: 'search', name: 'Search', description: 'Full-text and semantic search', available: true },
    { id: 'sync', name: 'Cloud Sync', description: 'Sync across devices', available: true },
    { id: 'export', name: 'Data Export', description: 'Export your data', available: true }
  ],
  
  providers: [
    { id: 'openai', name: 'ChatGPT', domain: 'chat.openai.com', captureSupported: true, byokSupported: true },
    { id: 'anthropic', name: 'Claude', domain: 'claude.ai', captureSupported: true, byokSupported: true },
    { id: 'google', name: 'Gemini', domain: 'gemini.google.com', captureSupported: true, byokSupported: true },
    { id: 'grok', name: 'Grok', domain: 'grok.com', captureSupported: true, byokSupported: false },
    { id: 'deepseek', name: 'DeepSeek', domain: 'deepseek.com', captureSupported: true, byokSupported: false },
    { id: 'kimi', name: 'Kimi', domain: 'kimi.ai', captureSupported: true, byokSupported: false },
    { id: 'qwen', name: 'Qwen', domain: 'qwen.ai', captureSupported: true, byokSupported: false },
    { id: 'z', name: 'z.ai', domain: 'z.ai', captureSupported: true, byokSupported: false },
    { id: 'mistral', name: 'Mistral', domain: 'mistral.ai/chat', captureSupported: true, byokSupported: true }
  ],
  
  privacyFeatures: [
    { id: 'e2e', name: 'End-to-End Encryption', description: 'Only you can read your vault', enabled: true },
    { id: 'zk', name: 'Zero-Knowledge Sync', description: 'Servers cannot read your data', enabled: true },
    { id: 'local', name: 'Local-First', description: 'Data in browser IndexedDB first', enabled: true },
    { id: 'no-training', name: 'No AI Training', description: 'Your data is never used to train AI', enabled: true },
    { id: 'did', name: 'DID Identity', description: 'Self-sovereign decentralized identity', enabled: false }
  ],
  
  layers: [
    { id: 'L0', name: 'VIVIM Identity', priority: 100, description: 'Who VIVIM is (this context)' },
    { id: 'L1', name: 'User Identity', priority: 95, description: 'Facts about the user' },
    { id: 'L2', name: 'Preferences', priority: 90, description: 'How to respond to user' },
    { id: 'L3', name: 'Topic Context', priority: 80, description: 'Current topic being discussed' },
    { id: 'L4', name: 'Entity Context', priority: 70, description: 'People and projects mentioned' },
    { id: 'L5', name: 'Conversation', priority: 60, description: 'Current conversation history' },
    { id: 'L6', name: 'JIT Knowledge', priority: 50, description: 'Just-in-time retrieved ACUs' }
  ],
  
  faq: [
    { 
      question: 'What is VIVIM?', 
      answer: 'VIVIM is your personal AI conversation manager. It lets you capture conversations from any AI chatbot (ChatGPT, Claude, Gemini, etc.), store them in your private encrypted vault, and continue or remix them with your own API keys.',
      category: 'general'
    },
    { 
      question: 'Why should I use VIVIM?', 
      answer: 'Because AI conversations are valuable knowledge, but they\'re trapped in walled gardens. VIVIM liberates your AI conversations, gives you ownership, and lets you evolve them over time.',
      category: 'general'
    },
    { 
      question: 'Is my data safe?', 
      answer: 'Yes. VIVIM uses end-to-end encryption meaning only you can read your vault. Your API keys are encrypted with your master key and never touch our servers. We can\'t read your conversations even if we wanted to.',
      category: 'privacy'
    },
    { 
      question: 'How does BYOK work?', 
      answer: 'BYOK (Bring Your Own Key) lets you connect your own AI API keys to VIVIM. Your keys are encrypted in your browser before being stored. When you chat, requests go directly from your device to the AI provider—we never see your keys.',
      category: 'technical'
    },
    { 
      question: 'Can I share my conversations?', 
      answer: 'Yes! You can share publicly to the feed, create unlisted links, or share to specific circles. You can also fork other people\'s public conversations to your vault and continue them privately.',
      category: 'general'
    },
    { 
      question: 'How much does VIVIM cost?', 
      answer: 'VIVIM has a free tier with limited captures and storage. Paid tiers add more captures, storage, and advanced features. BYOK uses your own AI API keys - you pay the AI providers directly.',
      category: 'billing'
    }
  ],
  
  limitations: [
    'No real-time AI generation (VIVIM is a conversation manager, not an AI provider)',
    'No built-in AI models (users must BYOK)',
    'No deep web scraping (v1.1 feature)',
    'No P2P sync (v2 feature)',
    'No visual knowledge graph (v1.1 feature)'
  ]
};

// ============================================================================
// SYSTEM PROMPT GENERATION
// ============================================================================

/**
 * Generate the system prompt for VIVIM identity
 * This is injected as L0 in the context pipeline
 */
export function getVIVIMSystemPrompt(): string {
  const arch = systemContext.systemArchitecture;
  return `# VIVIM Identity (Who I Am) - READ THIS WHEN USER ASKS ABOUT VIVIM

## ${VIVIM_IDENTITY.name} - ${VIVIM_IDENTITY.tagline}

${VIVIM_IDENTITY.description}

## 🚨 YOUR INSTRUCTIONS (CRITICAL)

When a user asks about VIVIM, you MUST use this context to answer. Do NOT guess or make up information.

### Answer these questions using THIS context:
- "What is VIVIM?" → Use "Core Pillars" section
- "Is my data safe?" → Use "Privacy & Security" section  
- "What AI can I capture from?" → Use "Supported AI Platforms" section
- "What is BYOK?" → Use "What I Can Do" section
- "How does VIVIM work?" → Use "System Architecture" section
- "Can I use my own API key?" → YES - BYOK section

### Simply respond normally if question is NOT about VIVIM.

## Core Pillars

${VIVIM_IDENTITY.pillars.map(p => `- **${p.name}**: ${p.description} (${p.value})`).join('\n')}

## System Architecture

**3-App Distributed System:**
- **Network** (${arch.network.purpose}): ${arch.network.technologies.join(', ')}
- **Server** (${arch.server.purpose}): ${arch.server.technologies.join(', ')}  
- **PWA** (${arch.pwa.purpose}): ${arch.pwa.technologies.join(', ')}

## What I Can Do

${VIVIM_IDENTITY.capabilities.filter(c => c.available).map(c => `- ${c.name}: ${c.description}`).join('\n')}

## Supported AI Platforms

### Capture From:
${VIVIM_IDENTITY.providers.filter(p => p.captureSupported).map(p => `- ${p.name} (${p.domain})`).join('\n')}

### BYOK (Bring Your Own Key) - Use YOUR own API key:
${VIVIM_IDENTITY.providers.filter(p => p.byokSupported).map(p => `- ${p.name}`).join('\n')}

## Privacy & Security

${VIVIM_IDENTITY.privacyFeatures.filter(f => f.enabled).map(f => `- **${f.name}**: ${f.description}`).join('\n')}

## My Limitations

${VIVIM_IDENTITY.limitations.map(l => `- ${l}`).join('\n')}

---

**Remember:** When users ask about VIVIM, use THIS context - don't make things up!
`;
}

// ============================================================================
// QUICK HELPERS
// ============================================================================

/**
 * Get a specific FAQ by question keyword
 */
export function findFAQ(keyword: string): VIVIMFAQ | undefined {
  const lower = keyword.toLowerCase();
  return VIVIM_IDENTITY.faq.find(f => 
    f.question.toLowerCase().includes(lower) ||
    f.answer.toLowerCase().includes(lower)
  );
}

/**
 * Check if a provider is supported for capture
 */
export function isCaptureSupported(providerDomain: string): boolean {
  return VIVIM_IDENTITY.providers.some(p => 
    p.domain.includes(providerDomain.toLowerCase()) ||
    p.id.includes(providerDomain.toLowerCase())
  );
}

/**
 * Check if a provider supports BYOK
 */
export function isBYOKSupported(providerId: string): boolean {
  return VIVIM_IDENTITY.providers.some(p => 
    p.id === providerId.toLowerCase() && p.byokSupported
  );
}

/**
 * Get all supported provider IDs
 */
export function getSupportedProviders(): string[] {
  return VIVIM_IDENTITY.providers.map(p => p.id);
}

/**
 * Get all BYOK-supported provider IDs
 */
export function getBYOKProviders(): string[] {
  return VIVIM_IDENTITY.providers.filter(p => p.byokSupported).map(p => p.id);
}

export const SYSTEM_CONTEXT = systemContext;

export function getSystemArchitecture(): string {
  const arch = systemContext.systemArchitecture;
  return `VIVIM consists of 3 apps: ${arch.apps.join(', ')}. 
Network: ${arch.network.purpose} using ${arch.network.technologies.join(', ')}.
Server: ${arch.server.purpose} using ${arch.server.technologies.join(', ')}.
PWA: ${arch.pwa.purpose} using ${arch.pwa.technologies.join(', ')}.`;
}

export function getNetworkInfo(): string {
  const net = systemContext.systemArchitecture.network;
  return `VIVIM Network supports node types: ${net.nodeTypes.join(', ')}.
Transports: ${net.transports.join(', ')}.
Technologies: ${net.technologies.join(', ')}.`;
}

export const CONCEPTUAL_DOCS = {
  story: 'VIVIM.docs/CONTEXT/VIVIM_STORY.md',
  userContext: 'VIVIM.docs/CONTEXT/VIVIM_USER_CONTEXT.md',
  memorySystem: 'VIVIM.docs/CONTEXT/VIVIM_MEMORY_SYSTEM.md'
};

export function getSimpleExplanation(topic: string): string {
  const explanations: Record<string, string> = {
    'what-is-vivim': 'VIVIM is your personal AI conversation manager - like iPhotos for your AI chats. We capture conversations from any AI (ChatGPT, Claude, Gemini, etc.), store them privately in your encrypted vault, and let you continue or share them.',
    'privacy': 'VIVIM uses end-to-end encryption so only you can read your vault. Your API keys are encrypted with your master key and never touch our servers. Zero-knowledge means we cant read your data even if we wanted to.',
    'capture': 'Just paste a link from any supported AI (ChatGPT, Claude, Gemini, Grok, DeepSeek, Kimi, Qwen, z.ai, Mistral) and VIVIM extracts the full conversation including text, code, images, and tables.',
    'byok': 'BYOK (Bring Your Own Key) lets you connect your own AI API keys. Your keys are encrypted in your browser. When you chat, requests go directly from your device to the AI provider - we never see your keys.',
    'acu': 'ACUs (Atomic Chat Units) break conversations into reusable knowledge pieces. Instead of flat chat logs, you get searchable, shareable, linkable building blocks.',
    'circles': 'Circles are groups you share with. Create circles for work, friends, or specific projects. Control exactly who sees what.',
    'vault': 'Your vault is your private, encrypted knowledge store. It lives locally in your browser first, then syncs encrypted to the cloud. You own it, we just protect it.'
  };
  
  const key = Object.keys(explanations).find(k => topic.toLowerCase().includes(k));
  return key ? explanations[key] : explanations['what-is-vivim'];
}
