/**
 * Test Data Generator
 * Creates mock conversations for testing the recommendation system
 */

import type { Conversation } from './types';

/**
 * Generate test conversations for recommendation testing
 */
export function generateTestConversations(count: number = 25): Conversation[] {
  const topics = [
    'Rust memory management',
    'React Server Components',
    'TypeScript generics deep dive',
    'Python async/await patterns',
    'Docker container optimization',
    'GraphQL schema design',
    'Next.js app router',
    'PostgreSQL query optimization',
    'AWS Lambda performance',
    'Kubernetes deployment strategies'
  ];

  const providers: Array<'chatgpt' | 'claude' | 'gemini'> = ['chatgpt', 'claude', 'gemini'];

  const conversations: Conversation[] = [];

  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    const provider = providers[i % providers.length];
    const daysAgo = Math.floor(Math.random() * 365); // 0 to 365 days ago

    const hasCode = Math.random() > 0.3;
    const hasMermaid = Math.random() > 0.8;
    const isInteracted = Math.random() > 0.7;

    const conversation: Conversation = {
      id: `test-convo-${i + 1}`,
      title: topic,
      provider,
      sourceUrl: `https://${provider}.ai/share/test-${i + 1}`,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      exportedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      messages: [
        {
          id: `msg-${i}-1`,
          role: 'user',
          content: `Tell me about ${topic}`,
          timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `msg-${i}-2`,
          role: 'assistant',
          content: `Here is some information about ${topic}. It is a very interesting subject...`,
          timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 + 1000).toISOString()
        }
      ],
      metadata: {
        model: provider === 'claude' ? 'claude-3.5-sonnet' : provider === 'chatgpt' ? 'gpt-4' : 'gemini-pro',
        language: 'en',
        tags: [topic.split(' ')[0].toLowerCase()]
      },
      stats: {
        totalMessages: Math.floor(Math.random() * 20) + 5,
        totalWords: Math.floor(Math.random() * 8000) + 500,
        totalCharacters: Math.floor(Math.random() * 50000) + 3000,
        totalCodeBlocks: hasCode ? Math.floor(Math.random() * 20) + 5 : 0,
        totalMermaidDiagrams: hasMermaid ? Math.floor(Math.random() * 3) + 1 : 0,
        totalImages: Math.floor(Math.random() * 3),
        timesViewed: isInteracted ? Math.floor(Math.random() * 15) + 1 : 0,
        lastViewedAt: isInteracted ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        wasExported: isInteracted && Math.random() > 0.5,
        wasShared: isInteracted && Math.random() > 0.8,
        hasUserNotes: isInteracted && Math.random() > 0.9
      },
      privacy: {
        level: 'local',
        updatedAt: new Date().toISOString()
      }
    };

    conversations.push(conversation);
  }

  return conversations;
}

/**
 * Generate high-quality conversations (for testing quality scoring)
 */
export function generateHighQualityConversations(count: number = 5): Conversation[] {
  const conversations = generateTestConversations(count);

  return conversations.map(convo => ({
    ...convo,
    stats: {
      ...convo.stats,
      totalCodeBlocks: Math.floor(Math.random() * 15) + 10,
      totalWords: Math.floor(Math.random() * 5000) + 3000,
      totalMermaidDiagrams: Math.floor(Math.random() * 3) + 2
    }
  }));
}

/**
 * Generate low-quality conversations (for testing quality scoring)
 */
export function generateLowQualityConversations(count: number = 5): Conversation[] {
  const conversations = generateTestConversations(count);

  return conversations.map(convo => ({
    ...convo,
    stats: {
      ...convo.stats,
      totalCodeBlocks: 0,
      totalWords: Math.floor(Math.random() * 100) + 20,
      totalMermaidDiagrams: 0,
      totalMessages: 2
    }
  }));
}

/**
 * Generate conversations from specific time periods
 */
export function generateConversationsByTimePeriod(): {
  yesterday: Conversation[];
  lastWeek: Conversation[];
  lastMonth: Conversation[];
  older: Conversation[];
} {
  const createConvo = (daysAgo: number, index: number): Conversation => {
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    return {
      id: `test-${daysAgo}d-${index}`,
      title: `Conversation from ${daysAgo === 1 ? 'yesterday' : daysAgo < 7 ? `${daysAgo} days ago` : `${Math.floor(daysAgo / 7)} weeks ago`}`,
      provider: 'claude',
      sourceUrl: `https://claude.ai/share/test-${daysAgo}-${index}`,
      createdAt: date.toISOString(),
      exportedAt: date.toISOString(),
      messages: [],
      metadata: {
        model: 'claude-3.5-sonnet',
        tags: ['test']
      },
      stats: {
        totalMessages: 10,
        totalWords: 2000,
        totalCharacters: 12000,
        totalCodeBlocks: 5,
        totalMermaidDiagrams: 1,
        totalImages: 0,
        timesViewed: daysAgo < 7 ? 3 : 0,
        wasExported: false,
        wasShared: false,
        hasUserNotes: false
      },
      privacy: {
        level: 'local',
        updatedAt: date.toISOString()
      }
    };
  };

  return {
    yesterday: [createConvo(1, 1), createConvo(1, 2)],
    lastWeek: [
      createConvo(3, 1),
      createConvo(5, 1),
      createConvo(6, 1)
    ],
    lastMonth: [
      createConvo(14, 1),
      createConvo(21, 1),
      createConvo(28, 1)
    ],
    older: [
      createConvo(60, 1),
      createConvo(90, 1),
      createConvo(180, 1),
      createConvo(365, 1)
    ]
  };
}

/**
 * Load test data into storage for testing
 */
export async function loadTestDataIntoStorage(conversations?: Conversation[]): Promise<void> {
  // Use generateTestConversations if no list provided
  const list = conversations || generateTestConversations(25);

  console.log('[TestData] Loading test conversations:', list.length);

  try {
    const { getStorage } = await import('../storage-v2');
    const storage = getStorage();

    for (const convo of list) {
      // Map Conversation type to extraction format expected by storage
      await storage.importFromExtraction({
        id: convo.id,
        title: convo.title,
        provider: convo.provider || 'other',
        sourceUrl: convo.sourceUrl || '',
        createdAt: convo.createdAt,
        exportedAt: convo.exportedAt,
        messages: convo.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        })),
        metadata: convo.metadata,
        stats: convo.stats
      });
    }
    console.log('[TestData] Successfully loaded conversations into storage-v2');
  } catch (err) {
    console.error('[TestData] Failed to load test data:', err);
  }
}
