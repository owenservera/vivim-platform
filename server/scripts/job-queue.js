#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const QUEUE_TABLE = '_background_jobs';

async function ensureQueueTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${QUEUE_TABLE} (
      id TEXT PRIMARY KEY,
      job_type TEXT NOT NULL,
      payload JSONB,
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      created_at TIMESTAMP DEFAULT NOW(),
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      error TEXT
    )
  `);
}

async function enqueue(jobType, payload, options = {}) {
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${QUEUE_TABLE} (id, job_type, payload, max_attempts) VALUES (?, ?, ?, ?)`,
    id,
    jobType,
    JSON.stringify(payload),
    options.maxAttempts || 3
  );
  return id;
}

async function processQueue(concurrency = 5) {
  const jobs = await prisma.$queryRawUnsafe(`
    SELECT * FROM ${QUEUE_TABLE} 
    WHERE status = 'pending' 
    ORDER BY created_at ASC 
    LIMIT ${concurrency}
  `);

  for (const job of jobs) {
    await processJob(job);
  }
}

async function processJob(job) {
  const id = job.id;
  
  await prisma.$executeRawUnsafe(
    `UPDATE ${QUEUE_TABLE} SET status = 'processing', started_at = NOW(), attempts = attempts + 1 WHERE id = ?`,
    id
  );

  try {
    const handler = getHandler(job.job_type);
    if (handler) {
      await handler(JSON.parse(job.payload));
    }
    
    await prisma.$executeRawUnsafe(
      `UPDATE ${QUEUE_TABLE} SET status = 'completed', completed_at = NOW() WHERE id = ?`,
      id
    );
  } catch (error) {
    const shouldRetry = job.attempts < job.max_attempts;
    
    if (shouldRetry) {
      await prisma.$executeRawUnsafe(
        `UPDATE ${QUEUE_TABLE} SET status = 'pending', error = ? WHERE id = ?`,
        error.message,
        id
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE ${QUEUE_TABLE} SET status = 'failed', error = ? WHERE id = ?`,
        error.message,
        id
      );
    }
  }
}

function getHandler(jobType) {
  const handlers = {
    'process_acus': async (payload) => {
      console.log('Processing ACUs:', payload);
    },
    'memory_extraction': async (payload) => {
      console.log('Extracting memories:', payload);
    },
    'send_notification': async (payload) => {
      console.log('Sending notification:', payload);
    },
    'cleanup': async (payload) => {
      console.log('Running cleanup:', payload);
    },
  };
  return handlers[jobType];
}

async function getStats() {
  const stats = await prisma.$queryRawUnsafe(`
    SELECT status, COUNT(*) as count FROM ${QUEUE_TABLE} GROUP BY status
  `);
  return stats;
}

const args = process.argv.slice(2);
const command = args[0];

if (command === 'enqueue') {
  const [jobType, payload] = args.slice(1);
  ensureQueueTable().then(() => enqueue(jobType, JSON.parse(payload || '{}')).then(id => {
    console.log('Job enqueued:', id);
    process.exit(0);
  }));
} else if (command === 'process') {
  const concurrency = parseInt(args[1]) || 5;
  ensureQueueTable().then(() => processQueue(concurrency).then(() => process.exit(0)));
} else if (command === 'stats') {
  ensureQueueTable().then(() => getStats().then(s => {
    console.table(s);
    process.exit(0);
  }));
} else if (command === 'worker') {
  const concurrency = parseInt(args[1]) || 5;
  const interval = parseInt(args[2]) || 5000;
  
  ensureQueueTable().then(() => {
    console.log(`Starting worker (concurrency: ${concurrency}, interval: ${interval}ms)`);
    setInterval(() => processQueue(concurrency), interval);
  });
} else {
  console.log(`
Background Job Queue

Usage:
  node job-queue.js enqueue <jobType> <jsonPayload>
  node job-queue.js process [concurrency]
  node job-queue.js worker [concurrency] [interval]
  node job-queue.js stats

Examples:
  node job-queue.js enqueue process_acus '{"conversationId":"123"}'
  node job-queue.js process 5
  node job-queue.js worker 3 10000
`);
}
