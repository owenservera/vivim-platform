#!/usr/bin/env node
/**
 * VIVIM Context Generator
 * 
 * Regenerates VIVIM system context from source files.
 * Run: node scripts/generate-vivim-context.js
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const OUTPUT_JSON = join(__dirname, '../src/context/vivim-system-context.json');
const OUTPUT_MD = join(__dirname, '../../VIVIM.docs/CONTEXT/VIVIM_SYSTEM_CONTEXT.md');

function findFiles(dir, pattern, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        findFiles(fullPath, pattern, files);
      }
    } else if (pattern.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractPrismaEnums(schemaPath) {
  const content = readFileSync(schemaPath, 'utf-8');
  const enums = [];
  const enumRegex = /enum (\w+) \{([^}]+)\}/g;
  let match;
  while ((match = enumRegex.exec(content)) !== null) {
    const values = match[2].trim().split(/\s+/).filter(v => v);
    enums.push({ name: match[1], values });
  }
  return enums;
}

function extractPrismaModels(schemaPath) {
  const content = readFileSync(schemaPath, 'utf-8');
  const models = [];
  const modelRegex = /model (\w+) \{[^}]+\}/g;
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    models.push(match[1]);
  }
  return models;
}

function extractContextLayers(typesPath) {
  const content = readFileSync(typesPath, 'utf-8');
  const layers = [];
  const layerRegex = /(L\d+):\s*['"]?(\w+['"]?)\s*\|\s*([^|]+)\|/g;
  let match;
  while ((match = layerRegex.exec(content)) !== null) {
    layers.push({ id: match[1], name: match[2].replace(/['"]/g, ''), description: match[3].trim() });
  }
  return layers.length ? layers : null;
}

console.log('🔄 Generating VIVIM System Context...\n');

const networkSchema = join(rootDir, '../network/prisma/schema.prisma');
const serverTypes = join(rootDir, '../server/src/context/types.ts');
const pwaSrc = join(rootDir, '../pwa/src');

console.log('📁 Sources:');
console.log('  - network/prisma/schema.prisma');
console.log('  - server/src/context/types.ts');
console.log('  - pwa/src/lib/*\n');

const networkEnums = extractPrismaEnums(networkSchema);
const networkModels = extractPrismaModels(networkSchema);
const contextLayers = extractContextLayers(serverTypes) || [
  { id: 'L0', name: 'VIVIM Identity', description: 'Who VIVIM is' },
  { id: 'L1', name: 'User Identity', description: 'Facts about the user' },
  { id: 'L2', name: 'Preferences', description: 'How to respond' },
  { id: 'L3', name: 'Topic Context', description: 'Current topic' },
  { id: 'L4', name: 'Entity Context', description: 'People/projects' },
  { id: 'L5', name: 'Conversation', description: 'History' },
  { id: 'L6', name: 'JIT Knowledge', description: 'Retrieved ACUs' }
];

const pwaModules = findFiles(pwaSrc, /\.ts$/).map(f => f.replace(pwaSrc + '/', '').replace('.ts', ''));

const context = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  generatedFrom: {
    network: 'network/prisma/schema.prisma',
    server: 'server/src/context/types.ts',
    pwa: 'pwa/src/lib/*'
  },
  systemArchitecture: {
    apps: ['network', 'server', 'pwa'],
    network: {
      purpose: 'P2P and Federation Layer',
      technologies: ['libp2p', 'Yjs CRDT', 'Kademlia DHT', 'WebRTC'],
      nodeTypes: ['bootstrap', 'relay', 'indexer', 'storage', 'edge', 'client', 'self-hosted'],
      transports: ['webrtc', 'websocket', 'tcp', 'quic'],
      database: {
        models: networkModels,
        enums: networkEnums.map(e => e.name)
      }
    },
    server: {
      purpose: 'Backend API and Context Engine',
      technologies: ['Node.js', 'Prisma', 'PostgreSQL', 'Z.ai embeddings'],
      contextLayers,
      keyServices: ['DynamicContextAssembler', 'BundleCompiler', 'LibrarianWorker', 'HybridRetrieval']
    },
    pwa: {
      purpose: 'Frontend Client',
      technologies: ['React', 'IndexedDB', 'Web Crypto API'],
      keyModules: pwaModules.slice(0, 20)
    }
  },
  contextPipeline: {
    layers: contextLayers,
    futureLayers: [
      { id: 'L7', name: 'Friends Context', description: 'Recent friend interactions, shared ACUs' },
      { id: 'L8', name: 'Network Context', description: 'Trending topics, popular ACUs' }
    ]
  },
  capabilities: {
    capture: { supported: true, providers: ['openai', 'anthropic', 'google', 'grok', 'deepseek', 'kimi', 'qwen', 'z', 'mistral'] },
    byok: { supported: true, providers: ['openai', 'anthropic', 'google', 'mistral'] },
    p2p: { supported: true, technologies: ['libp2p', 'WebRTC', 'Yjs CRDT'] },
    federation: { supported: true, protocols: ['ActivityPub', 'ATProtocol', 'VIVIM native'] }
  },
  privacy: {
    e2eEncryption: true,
    zeroKnowledgeSync: true,
    localFirst: true,
    noAITraining: true
  }
};

console.log('✅ Extracted:');
console.log(`  - ${networkModels.length} network models`);
console.log(`  - ${networkEnums.length} network enums`);
console.log(`  - ${contextLayers.length} context layers`);
console.log(`  - ${pwaModules.length} PWA modules\n`);

writeFileSync(OUTPUT_JSON, JSON.stringify(context, null, 2));
console.log(`📄 Written: ${OUTPUT_JSON}\n`);

const md = `# VIVIM System Context Documentation

> **Generated:** ${new Date().toDateString()}  
> **Sources:** network/prisma/schema.prisma, server/src/context/types.ts, pwa/src/lib/*

---

## System Architecture

${context.systemArchitecture.apps.map(app => {
  const a = context.systemArchitecture[app];
  return `### ${app.charAt(0).toUpperCase() + app.slice(1)} App
- **Purpose:** ${a.purpose}
- **Technologies:** ${a.technologies.join(', ')}
`;
}).join('\n')}

## Context Pipeline

| Layer | Name | Description |
|-------|------|-------------|
${contextLayers.map(l => `| ${l.id} | ${l.name} | ${l.description} |`).join('\n')}

## Network Database

**Models:** ${networkModels.join(', ')}

**Enums:** ${networkEnums.map(e => `${e.name}(${e.values.join(', ')})`).join(', ')}

---

*Generated by VIVIM Context Generator*
`;

writeFileSync(OUTPUT_MD, md);
console.log(`📄 Written: ${OUTPUT_MD}\n`);

console.log('✨ Done! Run `npm run generate:vivim-context` to regenerate.');
