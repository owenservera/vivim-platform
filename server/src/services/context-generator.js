import { getPrismaClient } from '../lib/database.js';
import { SimpleTokenEstimator } from '../context/index.js';
import { logger } from '../lib/logger.js';

const prisma = getPrismaClient();
const tokenEstimator = new SimpleTokenEstimator();

// VIVIM Identity - inlined to avoid import issues in fallback path
const VIVIM_IDENTITY_PROMPT = `# VIVIM Identity (Who I Am) - READ THIS WHEN USER ASKS ABOUT VIVIM

## VIVIM - Own Your AI
VIVIM is a consumer app focused on capturing, owning, evolving, and sharing AI conversations.

## 🚨 YOUR INSTRUCTIONS (CRITICAL)
When a user asks about VIVIM, you MUST use this context to answer. Do NOT guess or make up information.

### Answer these questions using THIS context:
- "What is VIVIM?" → Use "Core Pillars" section
- "Is my data safe?" → Use "Privacy & Security" section  
- "What AI can I capture from?" → Use "Supported AI Platforms" section
- "What is BYOK?" → Use "What I Can Do" section
- "How does VIVIM work?" → Use "System Architecture" section

### Simply respond normally if question is NOT about VIVIM.

## Core Pillars
- **Feed**: Social network for AI conversations (Discovery, inspiration)
- **Vault**: Personal encrypted knowledge store (Ownership, privacy)
- **Capture**: Extract from any AI platform (Liberation from walled gardens)
- **Chat**: Continue with your own AI keys (Evolve, remix, build on knowledge)

## System Architecture
**3-App Distributed System:** Network (P2P/Federation), Server (Backend API), PWA (Frontend Client)

## What I Can Do
- Capture: Extract conversations from AI platforms
- Vault: Encrypted personal knowledge store
- BYOK Chat: Bring your own AI keys
- Social Feed: Share and discover conversations

## Supported AI Platforms
### Capture From: ChatGPT, Claude, Gemini, Grok, DeepSeek, Kimi, Qwen, z.ai, Mistral
### BYOK: OpenAI, Anthropic, Google, Mistral

## Privacy & Security
- **End-to-End Encryption**: Only you can read your vault
- **Zero-Knowledge Sync**: Servers cannot read your data
- **Local-First**: Data in browser IndexedDB first
- **No AI Training**: Your data is never used to train AI

## My Limitations
- No real-time AI generation (conversation manager, not AI provider)
- No built-in AI models (users must BYOK)

---

**Remember:** When users ask about VIVIM, use THIS context - don't make things up!
`;

export async function generateContextBundles(conversationId, options = {}) {
  const log = logger.child({ conversationId });

  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { messageIndex: 'asc' } } },
    });

    if (!conv) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    log.info({ messageCount: conv.messageCount }, 'Generating context bundles');

    const bundles = {};

    bundles.L4_conversation = await compileConversationBundle(conv);
    bundles.L7_user_message = await compileUserMessageBundle(conv);

    for (const [type, bundle] of Object.entries(bundles)) {
      await storeBundle('Owen', type, bundle, conv.id);
    }

    log.info({ bundleTypes: Object.keys(bundles) }, 'Context bundles generated');

    return bundles;
  } catch (error) {
    log.error({ error: error.message }, 'Failed to generate context bundles');
    throw error;
  }
}

async function compileConversationBundle(conv) {
  const content = buildConversationSummary(conv);

  return {
    compiledPrompt: content,
    tokenCount: tokenEstimator.estimateTokens(content),
    composition: {
      messageCount: conv.messageCount,
      wordCount: conv.totalWords,
      title: conv.title,
      provider: conv.provider,
      model: conv.model,
    },
  };
}

async function compileUserMessageBundle(conv) {
  const userMessages = conv.messages.filter((m) => m.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1];

  if (!lastUserMessage) {
    return { compiledPrompt: '', tokenCount: 0, composition: { messageIndex: -1 } };
  }

  const content = Array.isArray(lastUserMessage.parts)
    ? lastUserMessage.parts.map((p) => p.text || p.content || '').join('')
    : String(lastUserMessage.parts);

  return {
    compiledPrompt: `## Current User Input\n\n${content}`,
    tokenCount: tokenEstimator.estimateTokens(content),
    composition: {
      messageIndex: lastUserMessage.messageIndex,
      timestamp: lastUserMessage.createdAt,
    },
  };
}

function buildConversationSummary(conv) {
  const lines = [
    '## Conversation Context',
    `**Title:** ${conv.title}`,
    `**Provider:** ${conv.provider}`,
    `**Model:** ${conv.model || 'Unknown'}`,
    `**Messages:** ${conv.messageCount}`,
    `**Words:** ${conv.totalWords}`,
    '',
    '### Message History',
    '',
  ];

  const recentMessages = conv.messages.slice(-10);

  for (const msg of recentMessages) {
    const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    const text = Array.isArray(msg.parts)
      ? msg.parts
          .map((p) => p.text || p.content || '')
          .join('')
          .substring(0, 300)
      : String(msg.parts).substring(0, 300);

    lines.push(`**${role}** (${msg.messageIndex + 1})`);
    lines.push(text);
    lines.push('');
  }

  return lines.join('\n');
}

async function storeBundle(userId, bundleType, bundle, conversationId) {
  try {
    await prisma.contextBundle.create({
      data: {
        userId,
        bundleType,
        compiledPrompt: bundle.compiledPrompt,
        tokenCount: bundle.tokenCount,
        composition: bundle.composition,
        topicProfileId: null,
        entityProfileId: null,
        conversationId,
        personaId: null,
      },
    });
  } catch (e) {
    if (e.code === 'P2002') {
      await prisma.contextBundle.update({
        where: {
          userId_bundleType_topicProfileId_entityProfileId_conversationId_personaId: {
            userId,
            bundleType,
            topicProfileId: null,
            entityProfileId: null,
            conversationId,
            personaId: null,
          },
        },
        data: {
          compiledPrompt: bundle.compiledPrompt,
          tokenCount: bundle.tokenCount,
          composition: bundle.composition,
          isDirty: false,
          version: { increment: 1 },
          compiledAt: new Date(),
        },
      });
    } else {
      throw e;
    }
  }
}

export async function getContextForChat(conversationId, options = {}) {
  const { maxTokens = 8000, includeHistory = true } = options;

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { messageIndex: 'asc' },
        take: includeHistory ? 50 : 5,
      },
    },
  });

  if (!conv) {
    return { systemPrompt: '', layers: {} };
  }

  const layers = {};

  const convBundle = await getCachedBundle('L4_conversation', conversationId);
  if (convBundle) {
    layers.L4 = convBundle.compiledPrompt;
  } else {
    const bundle = await compileConversationBundle(conv);
    layers.L4 = bundle.compiledPrompt;
  }

  const userMessages = conv.messages.filter((m) => m.role === 'user');
  if (userMessages.length > 0) {
    const lastMsg = userMessages[userMessages.length - 1];
    layers.L7 = Array.isArray(lastMsg.parts)
      ? lastMsg.parts.map((p) => p.text || p.content || '').join('')
      : String(lastMsg.parts);
  }

  const systemPrompt = buildSystemPrompt(layers);

  return {
    systemPrompt,
    layers,
    stats: {
      messageCount: conv.messageCount,
      tokenCount: tokenEstimator.estimateTokens(systemPrompt),
    },
  };
}

async function getCachedBundle(bundleType, referenceId) {
  return prisma.contextBundle.findFirst({
    where: { bundleType, conversationId: referenceId, isDirty: false },
  });
}

function buildSystemPrompt(layers) {
  const parts = [];

  // L0: Always include VIVIM identity - this tells the AI who VIVIM is
  parts.push(VIVIM_IDENTITY_PROMPT);

  // L4: Conversation context
  if (layers.L4) {
    parts.push(layers.L4);
  }

  // L7: Current user message
  if (layers.L7) {
    parts.push(`## Current Request\n\n${layers.L7}`);
  }

  return parts.join('\n\n---\n\n');
}

export const contextGenerator = {
  generateContextBundles,
  getContextForChat,
};
