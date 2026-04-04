import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import {
  faker,
  createUser,
  createDevice,
  createConversation,
  createMessage,
  createACU,
  createMemory,
  createCaptureAttempt,
  createSyncCursor,
  createSyncOperation,
  createImportJob,
  createImportedConversation,
  createMemoryConflict,
  createEmptyUser,
  createSuspendedUser,
  createFailingCaptureAttempt,
  createLongRunningImportJob,
  uuid,
  daysAgo,
  hoursAgo,
  randomInt,
  randomFloat,
} from './factories/seed-factory';

const connectionString = process.env.DATABASE_URL || 'postgresql://openscroll:openscroll_dev_password@localhost:5432/openscroll';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, errorFormat: 'minimal' });

interface SeedConfig {
  users?: number;
  devices?: number;
  syncData?: boolean;
  captureAttempts?: number;
  importJobs?: number;
  memoryConflicts?: number;
  edgeCases?: boolean;
}

const DEFAULT_CONFIG: SeedConfig = {
  users: 10,
  devices: 3,
  syncData: true,
  captureAttempts: 50,
  importJobs: 5,
  memoryConflicts: 10,
  edgeCases: true,
};

const DEMO_USER = {
  did: 'did:key:demo-edge-user',
  displayName: 'Edge Test User',
  handle: 'edgetest',
  email: 'edge@vivimdemo.io',
  avatarUrl: 'https://i.pravatar.cc/150?u=edge-test',
  trustScore: 85,
  settings: { theme: 'dark', edgeMode: true },
  verificationLevel: 2,
};

async function main(config: SeedConfig = DEFAULT_CONFIG) {
  const startTime = Date.now();
  console.log('🌱 Seeding database with comprehensive test data...\n');

  console.log('Clearing existing data...');
  await prisma.$executeRaw`
    TRUNCATE TABLE users, devices, capture_attempts, sync_cursors, sync_operations,
    import_jobs, imported_conversations, memory_conflicts, memory_relationships,
    conversations, messages, atomic_chat_units, acu_links, memories,
    notebooks, notebook_entries, circles, circle_members, groups, group_members,
    group_posts, teams, team_members, team_channels, channel_members, channel_messages,
    user_blocks, api_keys, client_presence, context_bundles, custom_instructions,
    topic_profiles, topic_conversations, entity_profiles, sharing_policies,
    content_stakeholders, content_access_grants, content_access_logs,
    sharing_intents, share_links, content_records, content_providers,
    insights, feed_impressions, failed_jobs, memory_extraction_jobs,
    context_recipes, analytics_events, aggregated_metrics,
    content_flags, moderator_notes, moderation_rules, user_moderation_records
    RESTART IDENTITY CASCADE
  `.catch(() => {});
  console.log('✅ Cleared existing data\n');

  console.log('Creating demo user (Edge Case Test)...');
  const edgeUser = await prisma.user.create({
    data: {
      did: DEMO_USER.did,
      displayName: DEMO_USER.displayName,
      handle: DEMO_USER.handle,
      email: DEMO_USER.email,
      avatarUrl: DEMO_USER.avatarUrl,
      publicKey: 'demo-edge-key-' + uuid().slice(0, 16),
      settings: DEMO_USER.settings,
      trustScore: DEMO_USER.trustScore,
      verificationLevel: DEMO_USER.verificationLevel,
      emailVerified: true,
    },
  });
  console.log(`✅ Created edge user: ${edgeUser.displayName}\n`);

  console.log('Creating edge case users...');
  const emptyUser = await prisma.user.create({
    data: createEmptyUser(),
  });
  
  const suspendedUser = await prisma.user.create({
    data: createSuspendedUser(),
  });
  console.log(`✅ Created edge case users (${emptyUser.displayName}, ${suspendedUser.displayName})\n`);

  console.log('Creating additional test users...');
  const users = [edgeUser];
  for (let i = 0; i < (config.users || 10); i++) {
    const userData = createUser();
    const user = await prisma.user.create({ data: userData });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} total users\n`);

  console.log('Creating devices for each user...');
  const devices = [];
  for (const user of users) {
    const deviceCount = user.id === edgeUser.id ? (config.devices || 3) : randomInt(1, 3);
    for (let i = 0; i < deviceCount; i++) {
      const deviceData = createDevice(user.id);
      const device = await prisma.device.create({ data: deviceData });
      devices.push(device);
    }
  }
  console.log(`✅ Created ${devices.length} devices\n`);

  console.log('Creating API keys for selected users...');
  const apiKeyUsers = users.slice(0, Math.min(5, users.length));
  const apiKeys = [];
  for (const user of apiKeyUsers) {
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        keyHash: 'hash-' + uuid().slice(0, 16),
        name: `${user.displayName}'s API Key`,
        expiresAt: daysAgo(-30),
      },
    });
    apiKeys.push(apiKey);
  }
  console.log(`✅ Created ${apiKeys.length} API keys\n`);

  console.log('Creating conversations with messages...');
  const conversations = [];
  const allMessages = new Map<string, ReturnType<typeof createMessage>[]>();
  
  for (let i = 0; i < 30; i++) {
    const user = users[i % users.length];
    const providers = ['chatgpt', 'claude', 'gemini', 'deepseek'] as const;
    const provider = providers[i % providers.length];
    const convData = createConversation(provider, { ownerId: user.id });
    
    const conv = await prisma.conversation.create({ data: convData });
    conversations.push(conv);

    const messages = [];
    for (let j = 0; j < convData.messageCount; j++) {
      const msgData = createMessage(conv.id, j, convData.createdAt, convData.tags[0]);
      messages.push(msgData);
    }
    
    await prisma.message.createMany({ data: messages });
    allMessages.set(conv.id, messages);
  }
  console.log(`✅ Created ${conversations.length} conversations with messages\n`);

  console.log('Creating Atomic Chat Units (ACUs) from messages...');
  const acus = [];
  const acuLinks = [];
  
  for (const conv of conversations) {
    const messages = allMessages.get(conv.id) || [];
    let prevAcuId: string | null = null;

    for (const msg of messages) {
      if (msg.role === 'system') continue;
      
      const contentObj = JSON.parse(msg.parts);
      let content = contentObj.map((p: { content?: string }) => p.content || '').join('\n');
      if (!content.trim() || content.length < 10) continue;

      const acuData = createACU(
        conv.id, msg.id, msg.messageIndex, content,
        conv.provider, conv.model || 'unknown',
        msg.createdAt, conv.ownerId || users[0].did
      );
      
      await prisma.atomicChatUnit.create({ data: acuData });
      acus.push(acuData);

      if (prevAcuId && Math.random() > 0.4) {
        const relations = ['explains', 'follows_up', 'related_to', 'supports', 'contrasts'];
        acuLinks.push({
          sourceId: prevAcuId,
          targetId: acuData.id,
          relation: relations[randomInt(0, relations.length - 1)],
          weight: randomFloat(0.5, 1.0),
        });
      }
      prevAcuId = acuData.id;
    }
  }

  for (let i = 0; i < acuLinks.length; i += 100) {
    await prisma.acuLink.createMany({ data: acuLinks.slice(i, i + 100) });
  }
  console.log(`✅ Created ${acus.length} ACUs with ${acuLinks.length} links\n`);

  console.log('Creating capture attempts with various statuses...');
  const captureStatuses = [];
  const sampleUrls = [
    'https://chat.openai.com/share/test-conversation-1',
    'https://claude.ai/share/test-conversation-2',
    'https://gemini.google.com/share/test-conversation-3',
    'https://chat.deepseek.com/share/test-conversation-4',
  ];
  
  for (let i = 0; i < (config.captureAttempts || 50); i++) {
    const url = sampleUrls[i % sampleUrls.length] + '-' + uuid().slice(0, 8);
    const attemptData = createCaptureAttempt(url);
    await prisma.captureAttempt.create({ data: attemptData });
    captureStatuses.push(attemptData.status);
  }

  console.log(`  Capture attempt breakdown:`);
  const successCount = captureStatuses.filter(s => s === 'completed').length;
  const failedCount = captureStatuses.filter(s => s === 'failed').length;
  const partialCount = captureStatuses.filter(s => s === 'partial').length;
  console.log(`    - Success: ${successCount}`);
  console.log(`    - Failed: ${failedCount}`);
  console.log(`    - Partial: ${partialCount}`);
  console.log(`✅ Created ${captureStatuses.length} capture attempts\n`);

  console.log('Creating memories with various types...');
  const memories = [];
  for (const user of users) {
    for (let i = 0; i < randomInt(5, 15); i++) {
      const memoryData = createMemory(user.id);
      await prisma.memory.create({ data: memoryData });
      memories.push(memoryData);
    }
  }
  console.log(`✅ Created ${memories.length} memories\n`);

  console.log('Creating memory conflicts...');
  for (let i = 0; i < (config.memoryConflicts || 10); i++) {
    const user = users[i % users.length];
    const conflictData = createMemoryConflict(user.id);
    await prisma.memoryConflict.create({ data: conflictData });
  }
  console.log(`✅ Created ${config.memoryConflicts || 10} memory conflicts\n`);

  console.log('Creating sync cursors for devices...');
  const syncCursors = [];
  for (const device of devices.slice(0, 10)) {
    const tableNames = ['conversations', 'messages', 'memories', 'acu_links'];
    for (const tableName of tableNames) {
      const cursorData = createSyncCursor(device.userId, device.deviceId, { tableName });
      await prisma.syncCursor.create({ data: cursorData });
      syncCursors.push(cursorData);
    }
  }
  console.log(`✅ Created ${syncCursors.length} sync cursors\n`);

  console.log('Creating sync operations...');
  const syncOps = [];
  for (const device of devices.slice(0, 5)) {
    for (let i = 0; i < randomInt(10, 30); i++) {
      const opData = createSyncOperation(device.userId, device.deviceId);
      await prisma.syncOperation.create({ data: opData });
      syncOps.push(opData);
    }
  }
  console.log(`✅ Created ${syncOps.length} sync operations\n`);

  console.log('Creating import jobs with various states...');
  const importJobs = [];
  for (let i = 0; i < (config.importJobs || 5); i++) {
    const user = users[i % users.length];
    const jobData = createImportJob(user.id);
    const job = await prisma.importJob.create({ data: jobData });
    importJobs.push(job);

    const convCount = randomInt(5, 20);
    for (let j = 0; j < convCount; j++) {
      const convData = createImportedConversation(job.id);
      await prisma.importedConversation.create({ data: convData });
    }
  }
  console.log(`✅ Created ${importJobs.length} import jobs\n`);

  console.log('Creating failed jobs for error testing...');
  const failedJobTypes = ['memory_extraction', 'acu_generation', 'context_compilation', 'sync_merge'];
  for (const jobType of failedJobTypes) {
    await prisma.failedJob.create({
      data: {
        jobType,
        payload: { attempt: randomInt(1, 3), context: faker.lorem.sentence() },
        errorMessage: `Simulated ${jobType} failure: ${faker.hacker.phrase()}`,
        errorStack: `Error: ${faker.hacker.phrase()}\n    at ${jobType}Service.process (service.ts:142)\n    at async handleJob (worker.ts:89)`,
        retryCount: randomInt(1, 3),
      },
    });
  }
  console.log(`✅ Created ${failedJobTypes.length} failed jobs\n`);

  console.log('Creating circles with members...');
  const circles = [];
  for (let i = 0; i < 3; i++) {
    const circle = await prisma.circle.create({
      data: {
        ownerId: edgeUser.id,
        name: `Circle ${i + 1}: ${faker.lorem.words(2)}`,
        description: faker.lorem.sentence(),
        isPublic: i === 0,
      },
    });
    circles.push(circle);

    for (let j = 0; j < randomInt(3, 8); j++) {
      const member = users[(i * 3 + j) % users.length];
      await prisma.circleMember.create({
        data: {
          circleId: circle.id,
          userId: member.id,
          role: j < 2 ? 'admin' : 'member',
          canInvite: j < 2,
          canShare: true,
        },
      });
    }
  }
  console.log(`✅ Created ${circles.length} circles\n`);

  console.log('Creating groups with posts...');
  const groups = [];
  for (let i = 0; i < 3; i++) {
    const group = await prisma.group.create({
      data: {
        ownerId: edgeUser.id,
        name: `Group ${i + 1}: ${faker.lorem.words(2)}`,
        description: faker.lorem.sentence(),
        type: ['GENERAL', 'PROJECT', 'COMMUNITY'][i % 3] as 'GENERAL' | 'PROJECT' | 'COMMUNITY',
        visibility: 'PUBLIC',
        memberCount: randomInt(10, 100),
      },
    });
    groups.push(group);

    for (let j = 0; j < randomInt(5, 15); j++) {
      const author = users[j % users.length];
      await prisma.groupPost.create({
        data: {
          groupId: group.id,
          authorId: author.id,
          content: faker.lorem.paragraph(),
          likeCount: randomInt(0, 50),
          commentCount: randomInt(0, 20),
        },
      });
    }
  }
  console.log(`✅ Created ${groups.length} groups\n`);

  console.log('Creating teams with channels...');
  const team = await prisma.team.create({
    data: {
      ownerId: edgeUser.id,
      name: 'Edge Case Test Team',
      description: 'Team for testing edge cases',
      type: 'PROJECT',
      visibility: 'INVITE',
      isPersonal: false,
      memberCount: users.length,
    },
  });

  const channels = ['general', 'engineering', 'random'];
  for (const channelName of channels) {
    const channel = await prisma.teamChannel.create({
      data: {
        teamId: team.id,
        name: channelName,
        description: `${channelName} channel`,
        type: channelName === 'random' ? 'PUBLIC' : 'PUBLIC',
      },
    });

    for (let i = 0; i < randomInt(5, 15); i++) {
      const author = users[i % users.length];
      await prisma.channelMessage.create({
        data: {
          channelId: channel.id,
          authorId: author.id,
          content: faker.lorem.sentence(),
        },
      });
    }
  }
  console.log(`✅ Created team with ${channels.length} channels\n`);

  console.log('Creating context settings for users...');
  for (const user of users.slice(0, 5)) {
    await prisma.userContextSettings.create({
      data: {
        userId: user.id,
        maxContextTokens: randomInt(8000, 32000),
        responseStyle: randomFrom(['concise', 'balanced', 'detailed']),
        memoryThreshold: randomFrom(['low', 'moderate', 'high']),
        enablePredictions: Math.random() > 0.3,
        enableJitRetrieval: true,
        enableCompression: true,
        cacheAggressively: Math.random() > 0.5,
      },
    });
  }
  console.log(`✅ Created context settings\n`);

  console.log('Creating custom instructions...');
  const instructionScopes = ['global', 'coding', 'startup', 'ai', 'architecture'];
  for (const user of users.slice(0, 3)) {
    for (const scope of instructionScopes) {
      await prisma.customInstruction.create({
        data: {
          userId: user.id,
          content: faker.lorem.sentence(),
          scope,
          topicTags: [scope],
          priority: randomInt(1, 10),
          isActive: true,
        },
      });
    }
  }
  console.log(`✅ Created custom instructions\n`);

  console.log('Creating sharing policies...');
  for (let i = 0; i < 5; i++) {
    const conv = conversations[i % conversations.length];
    await prisma.sharingPolicy.create({
      data: {
        contentId: conv.id,
        contentType: 'conversation',
        ownerId: conv.ownerId || edgeUser.id,
        audience: { type: 'circle', circleIds: [circles[0].id] },
        permissions: { view: true, annotate: false, reshare: false },
        status: 'active',
        createdBy: edgeUser.id,
      },
    });
  }
  console.log(`✅ Created sharing policies\n`);

  console.log('Creating moderation data...');
  await prisma.contentFlag.create({
    data: {
      contentId: uuid(),
      contentType: 'conversation',
      contentOwnerId: users[1].id,
      contentText: 'Suspicious conversation content',
      reporterId: users[2].id,
      reason: 'SPAM',
      status: 'PENDING',
      priority: 'MEDIUM',
      aiDetected: true,
      aiConfidence: 0.85,
    },
  });

  await prisma.moderationRule.create({
    data: {
      name: 'Auto-flag promotional content',
      description: 'Automatically flag content with promotional keywords',
      conditionType: 'keyword',
      condition: { keywords: ['buy now', 'click here', 'free money'] },
      action: 'flag',
      contentTypes: ['conversation', 'group_post'],
      appliesTo: 'public',
      isEnabled: true,
      priority: 10,
    },
  });

  await prisma.userModerationRecord.create({
    data: {
      userId: suspendedUser.id,
      spamCount: 3,
      totalStrikes: 3,
      warningsIssued: 2,
      contentRemoved: 1,
      isWarningActive: false,
      isBanned: true,
      banReason: 'Multiple spam violations',
      lastStrikedAt: daysAgo(5),
    },
  });
  console.log(`✅ Created moderation data\n`);

  console.log('Creating insights...');
  const insightTypes = ['PATTERN_DETECTED', 'ANOMALY_DETECTED', 'RECOMMENDATION', 'TREND_DETECTED'];
  for (const user of users.slice(0, 3)) {
    for (let i = 0; i < randomInt(2, 5); i++) {
      await prisma.insight.create({
        data: {
          insightType: insightTypes[i % insightTypes.length] as 'PATTERN_DETECTED' | 'ANOMALY_DETECTED' | 'RECOMMENDATION' | 'TREND_DETECTED',
          userDid: user.did,
          title: faker.lorem.sentence({ min: 3, max: 6 }),
          description: faker.lorem.paragraph(),
          confidence: randomFloat(0.6, 0.95),
          relevanceScore: randomFloat(0.5, 0.9),
          isRead: Math.random() > 0.7,
        },
      });
    }
  }
  console.log(`✅ Created insights\n`);

  console.log('Creating feed impressions for analytics...');
  for (const user of users.slice(0, 3)) {
    for (let i = 0; i < randomInt(20, 50); i++) {
      const conv = conversations[i % conversations.length];
      await prisma.feedImpression.create({
        data: {
          userId: user.id,
          contentId: conv.id,
          contentType: 'conversation',
          position: i,
          contextTags: conv.tags,
          viewedAt: hoursAgo(randomInt(1, 72)),
          dwellTimeMs: randomInt(1000, 30000),
          clicked: Math.random() > 0.7,
          shared: Math.random() > 0.9,
          dismissed: Math.random() > 0.8,
        },
      });
    }
  }
  console.log(`✅ Created feed impressions\n`);

  console.log('Creating content blocks (user blocking)...');
  await prisma.userBlock.create({
    data: {
      blockerId: edgeUser.id,
      blockedId: users[users.length - 1].id,
      reason: 'Test block for edge cases',
    },
  });
  console.log(`✅ Created user block\n`);

  console.log('Creating API keys for users...');
  const apiKeyNames = ['Production Key', 'Development Key', 'CI/CD Key'];
  for (const user of users.slice(0, 3)) {
    for (const keyName of apiKeyNames) {
      await prisma.apiKey.create({
        data: {
          userId: user.id,
          keyHash: hash(uuid()),
          name: `${user.displayName} ${keyName}`,
          expiresAt: daysAgo(-randomInt(30, 90)),
          lastUsed: hoursAgo(randomInt(1, 168)),
        },
      });
    }
  }
  console.log(`✅ Created API keys\n`);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('='.repeat(60));
  console.log('✅ EDGE CASE SEED COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nSeeded data summary:`);
  console.log(`  - Users: ${users.length} (including edge cases)`);
  console.log(`  - Devices: ${devices.length}`);
  console.log(`  - Conversations: ${conversations.length}`);
  console.log(`  - ACUs: ${acus.length}`);
  console.log(`  - Capture Attempts: ${captureStatuses.length}`);
  console.log(`  - Memories: ${memories.length}`);
  console.log(`  - Memory Conflicts: ${config.memoryConflicts || 10}`);
  console.log(`  - Sync Cursors: ${syncCursors.length}`);
  console.log(`  - Sync Operations: ${syncOps.length}`);
  console.log(`  - Import Jobs: ${importJobs.length}`);
  console.log(`  - Circles: ${circles.length}`);
  console.log(`  - Groups: ${groups.length}`);
  console.log(`  - Team: 1`);
  console.log(`  - Insights: 10+`);
  console.log(`  - Feed Impressions: 100+`);
  console.log(`\n⏱️  Completed in ${duration}s`);
}

main()
  .catch((e) => {
    console.error('❌ Edge case seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
