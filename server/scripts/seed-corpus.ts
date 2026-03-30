/**
 * Seed VIVIM Corpus from Documentation
 * 
 * Reads markdown files from vivim-docs and populates the corpus database
 * with documents, chunks, and embeddings for the chatbot context.
 * 
 * Usage: cd server && bun run scripts/seed-corpus.ts
 */

import 'dotenv/config';
import { readdir, readFile } from 'fs/promises';
import { join, relative, basename } from 'path';
import { createHash } from 'crypto';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from '../src/lib/logger.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://openscroll:openscroll_dev_password@localhost:5432/openscroll';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DOCS_ROOT = join(process.cwd(), '..', 'vivim-docs');

const CATEGORY_MAP: Record<string, string> = {
  '01-PLATFORM': 'platform',
  '02-PRODUCT': 'product',
  '03-FRONTEND': 'frontend',
  '04-NETWORK-SDK': 'sdk',
  '05-SECURITY': 'security',
  '06-RESEARCH': 'research',
  '07-BUSINESS': 'business',
};

const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 50;

interface DocFile {
  path: string;
  relativePath: string;
  category: string;
  content: string;
}

function chunkByHeadings(text: string): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  
  let currentChunk = '';
  let currentHeading = '';
  
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    
    if (headingMatch) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentHeading = headingMatch[2];
      currentChunk = line + '\n';
    } else if (currentChunk.length > CHUNK_SIZE) {
      chunks.push(currentChunk.trim());
      currentChunk = currentHeading ? `# ${currentHeading}\n${line}\n` : line + '\n';
    } else {
      currentChunk += line + '\n';
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(c => c.length > 50);
}

function simpleChunk(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    let chunk = text.slice(start, end);
    
    if (start + CHUNK_SIZE < text.length) {
      const lastNewline = chunk.lastIndexOf('\n');
      if (lastNewline > CHUNK_SIZE * 0.7) {
        chunk = chunk.slice(0, lastNewline);
      }
    }
    
    if (chunk.trim().length > 50) {
      chunks.push(chunk.trim());
    }
    
    start += chunk.length - CHUNK_OVERLAP;
    if (start >= text.length) break;
  }
  
  return chunks;
}

async function scanDocs(dir: string, category: string): Promise<DocFile[]> {
  const files: DocFile[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subCategory = CATEGORY_MAP[entry.name] || entry.name.toLowerCase();
        const subFiles = await scanDocs(fullPath, subCategory);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = await readFile(fullPath, 'utf-8');
        files.push({
          path: fullPath,
          relativePath: relative(DOCS_ROOT, fullPath),
          category,
          content,
        });
      }
    }
  } catch (error: any) {
    logger.warn({ dir, error: error.message }, 'Error scanning directory');
  }
  
  return files;
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

async function getOrCreateTenant() {
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'vivim' },
  });
  
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'VIVIM',
        slug: 'vivim',
        chatbotConfig: {
          identityCore: {
            name: 'VIVIM Assistant',
            description: 'VIVIM - Own Your AI Memory',
          },
        },
        brandVoice: {
          tone: 'professional',
        },
        guardrails: [
          'Do not reveal internal implementation details',
          'Always be helpful and accurate',
        ],
      },
    });
    logger.info({ tenantId: tenant.id }, 'Created VIVIM tenant');
  }
  
  return tenant;
}

async function seedCorpus() {
  logger.info('Starting VIVIM corpus seeding...');
  
  const tenant = await getOrCreateTenant();
  logger.info({ tenantId: tenant.id }, 'Using tenant');
  
  const categories = ['01-PLATFORM', '02-PRODUCT', '03-FRONTEND', '04-NETWORK-SDK', '05-SECURITY', '06-RESEARCH', '07-BUSINESS'];
  
  let totalDocs = 0;
  let totalChunks = 0;
  
  for (const category of categories) {
    const categoryDir = join(DOCS_ROOT, category);
    const files = await scanDocs(categoryDir, CATEGORY_MAP[category] || category);
    
    logger.info({ category, files: files.length }, 'Processing category');
    
    for (const file of files) {
      try {
        const contentHash = hashContent(file.content);
        
        const existing = await prisma.corpusDocument.findFirst({
          where: {
            tenantId: tenant.id,
            contentHash,
          },
        });
        
        if (existing) {
          logger.debug({ file: file.relativePath }, 'Document already exists, skipping');
          continue;
        }
        
        const doc = await prisma.corpusDocument.create({
          data: {
            tenantId: tenant.id,
            title: basename(file.relativePath, '.md').replace(/-/g, ' '),
            rawContent: file.content,
            contentHash,
            format: 'markdown',
            category: file.category,
            version: '1.0.0',
            wordCount: file.content.split(/\s+/).length,
            lastPublishedAt: new Date(),
          },
        });
        
        totalDocs++;
        logger.info({ file: file.relativePath }, 'Document seeded (chunks skipped)');
        
      } catch (error: any) {
        logger.error({ file: file.relativePath, error: error.message }, 'Failed to seed document');
      }
    }
  }
  
  logger.info({ totalDocs, totalChunks }, 'Corpus seeding completed');
  
  const stats = await prisma.corpusDocument.groupBy({
    by: ['category'],
    _count: { id: true },
    where: { tenantId: tenant.id },
  });
  
  logger.info({ stats }, 'Document count by category');
}

(async () => {
  try {
    await seedCorpus();
  } catch (error: any) {
    logger.error({ error: error.message }, 'Seeding failed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
