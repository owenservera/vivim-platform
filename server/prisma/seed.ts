/**
 * Database Seed Script
 * 
 * Populates the database with test data for development and testing
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// Generate content hash for ACU ID
function generateAcuId(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (development only!)
  if (process.env.NODE_ENV === 'development') {
    console.log('Clearing existing data...');
    await prisma.acuLink.deleteMany();
    await prisma.atomicChatUnit.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create test conversations
  console.log('Creating test conversations...');
  
  const conversation1 = await prisma.conversation.create({
    data: {
      provider: 'chatgpt',
      sourceUrl: 'https://chatgpt.com/share/test-1',
      title: 'Introduction to Rust Programming',
      model: 'gpt-4',
      createdAt: new Date('2026-01-15T10:00:00Z'),
      updatedAt: new Date('2026-01-15T10:30:00Z'),
      messageCount: 6,
      userMessageCount: 3,
      aiMessageCount: 3,
      totalWords: 450,
      totalCharacters: 2800,
      totalCodeBlocks: 2,
      metadata: {
        tags: ['rust', 'programming', 'tutorial']
      }
    }
  });

  // Add messages to conversation 1
  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation1.id,
        role: 'user',
        author: 'User',
        parts: JSON.stringify([{ type: 'text', content: 'Can you explain Rust ownership?' }]),
        createdAt: new Date('2026-01-15T10:00:00Z'),
        messageIndex: 0,
        status: 'completed'
      },
      {
        conversationId: conversation1.id,
        role: 'assistant',
        author: 'ChatGPT',
        parts: JSON.stringify([{
          type: 'text',
          content: 'Rust ownership is a unique feature that ensures memory safety without garbage collection. Every value in Rust has a single owner, and when the owner goes out of scope, the value is dropped.'
        }]),
        createdAt: new Date('2026-01-15T10:05:00Z'),
        messageIndex: 1,
        status: 'completed'
      },
      {
        conversationId: conversation1.id,
        role: 'user',
        author: 'User',
        parts: JSON.stringify([{ type: 'text', content: 'Can you show me an example?' }]),
        createdAt: new Date('2026-01-15T10:10:00Z'),
        messageIndex: 2,
        status: 'completed'
      },
      {
        conversationId: conversation1.id,
        role: 'assistant',
        author: 'ChatGPT',
        parts: JSON.stringify([{
          type: 'code',
          language: 'rust',
          content: `fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 is moved to s2
    // println!("{}", s1); // This would error!
    println!("{}", s2); // This works
}`
        }]),
        createdAt: new Date('2026-01-15T10:15:00Z'),
        messageIndex: 3,
        status: 'completed'
      }
    ]
  });

  const conversation2 = await prisma.conversation.create({
    data: {
      provider: 'claude',
      sourceUrl: 'https://claude.ai/chat/test-2',
      title: 'Building a REST API with Express',
      model: 'claude-3-opus',
      createdAt: new Date('2026-01-20T14:00:00Z'),
      updatedAt: new Date('2026-01-20T14:45:00Z'),
      messageCount: 8,
      userMessageCount: 4,
      aiMessageCount: 4,
      totalWords: 680,
      totalCharacters: 4200,
      totalCodeBlocks: 3,
      metadata: {
        tags: ['nodejs', 'express', 'api', 'backend']
      }
    }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation2.id,
        role: 'user',
        author: 'User',
        parts: JSON.stringify([{ type: 'text', content: 'How do I create a REST API with Express?' }]),
        createdAt: new Date('2026-01-20T14:00:00Z'),
        messageIndex: 0,
        status: 'completed'
      },
      {
        conversationId: conversation2.id,
        role: 'assistant',
        author: 'Claude',
        parts: JSON.stringify([{
          type: 'text',
          content: 'Creating a REST API with Express is straightforward. First, install Express with npm install express, then create your server file.'
        }]),
        createdAt: new Date('2026-01-20T14:05:00Z'),
        messageIndex: 1,
        status: 'completed'
      },
      {
        conversationId: conversation2.id,
        role: 'assistant',
        author: 'Claude',
        parts: JSON.stringify([{
          type: 'code',
          language: 'javascript',
          content: `const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`
        }]),
        createdAt: new Date('2026-01-20T14:06:00Z'),
        messageIndex: 2,
        status: 'completed'
      }
    ]
  });

  const conversation3 = await prisma.conversation.create({
    data: {
      provider: 'gemini',
      sourceUrl: 'https://gemini.google.com/app/test-3',
      title: 'React Hooks Best Practices',
      model: 'gemini-pro',
      createdAt: new Date('2026-02-01T09:00:00Z'),
      updatedAt: new Date('2026-02-01T09:30:00Z'),
      messageCount: 10,
      userMessageCount: 5,
      aiMessageCount: 5,
      totalWords: 820,
      totalCharacters: 5100,
      totalCodeBlocks: 4,
      metadata: {
        tags: ['react', 'hooks', 'frontend', 'javascript']
      }
    }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation3.id,
        role: 'user',
        author: 'User',
        parts: JSON.stringify([{ type: 'text', content: 'What are the best practices for using React hooks?' }]),
        createdAt: new Date('2026-02-01T09:00:00Z'),
        messageIndex: 0,
        status: 'completed'
      },
      {
        conversationId: conversation3.id,
        role: 'model',
        author: 'Gemini',
        parts: JSON.stringify([{
          type: 'text',
          content: 'Here are key best practices for React hooks: 1) Only call hooks at the top level, 2) Only call hooks from React functions, 3) Use custom hooks to extract reusable logic, 4) Keep effects focused and minimal.'
        }]),
        createdAt: new Date('2026-02-01T09:05:00Z'),
        messageIndex: 1,
        status: 'completed'
      }
    ]
  });

  console.log(`✅ Created ${3} test conversations`);

  // Create test user
  console.log('Creating test user...');
  const testUser = await prisma.user.create({
    data: {
      did: 'did:key:test123',
      displayName: 'Test User',
      email: 'test@openscroll.local',
      publicKey: 'test-public-key-placeholder',
      settings: {}
    }
  });
  console.log(`✅ Created test user: ${testUser.displayName}`);

  // Create some test ACUs
  console.log('Creating test ACUs...');

  const acu1Content = 'Rust ownership ensures memory safety without garbage collection';
  const acu1 = await prisma.atomicChatUnit.create({
    data: {
      id: generateAcuId(acu1Content),
      authorDid: 'did:key:test123',
      content: acu1Content,
      type: 'statement',
      category: 'technical',
      conversationId: conversation1.id,
      messageId: (await prisma.message.findFirst({ where: { conversationId: conversation1.id, messageIndex: 1 } }))!.id,
      messageIndex: 1,
      provider: 'chatgpt',
      model: 'gpt-4',
      sourceTimestamp: new Date('2026-01-15T10:05:00Z'),
      signature: Buffer.from('test-signature'),
      embedding: [],
      qualityOverall: 92,
      contentRichness: 88,
      structuralIntegrity: 95,
      uniqueness: 93,
      sharingPolicy: 'self',
      sharingCircles: []
    }
  });

  const acu2Content = `fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{}", s2);
}`;
  const acu2 = await prisma.atomicChatUnit.create({
    data: {
      id: generateAcuId(acu2Content),
      authorDid: 'did:key:test123',
      content: acu2Content,
      language: 'rust',
      type: 'code_snippet',
      category: 'technical',
      conversationId: conversation1.id,
      messageId: (await prisma.message.findFirst({ where: { conversationId: conversation1.id, messageIndex: 3 } }))!.id,
      messageIndex: 3,
      provider: 'chatgpt',
      model: 'gpt-4',
      sourceTimestamp: new Date('2026-01-15T10:15:00Z'),
      signature: Buffer.from('test-signature'),
      embedding: [],
      qualityOverall: 85,
      contentRichness: 90,
      structuralIntegrity: 88,
      uniqueness: 78,
      sharingPolicy: 'self',
      sharingCircles: []
    }
  });

  // Create ACU link
  await prisma.acuLink.create({
    data: {
      sourceId: acu1.id,
      targetId: acu2.id,
      relation: 'explains',
      weight: 0.9,
      metadata: {}
    }
  });

  console.log(`✅ Created ${2} test ACUs with 1 link`);

  console.log('✅ Database seeded successfully!');
  console.log('\nTest data summary:');
  console.log(`- ${3} conversations`);
  console.log(`- ${await prisma.message.count()} messages`);
  console.log(`- ${2} ACUs`);
  console.log(`- ${1} ACU link`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
