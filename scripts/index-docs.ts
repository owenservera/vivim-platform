#!/usr/bin/env bun
/**
 * Documentation Indexing Script
 * 
 * This script indexes all VIVIM documentation using PageIndex-style
 * tree-based indexing with LLM-powered reasoning.
 * 
 * Usage:
 *   bun run scripts/index-docs.ts
 * 
 * Environment:
 *   OPENAI_API_KEY - Required for LLM summaries
 */

import { indexAllVivimDocs } from '../server/src/services/page-index-service';
import { logger } from '../server/src/lib/logger';

const DOCS_PATH = './vivim.docs.context/docs';

async function main() {
  console.log('🚀 Starting VIVIM Documentation Indexing...\n');
  
  const startTime = Date.now();
  
  try {
    await indexAllVivimDocs(DOCS_PATH);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Documentation indexing complete! (${duration}s)`);
  } catch (error) {
    console.error('\n❌ Indexing failed:', error);
    process.exit(1);
  }
}

main();
