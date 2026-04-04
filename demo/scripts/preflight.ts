#!/usr/bin/env bun
/**
 * VIVIM Demo Pre-flight Script
 * 
 * Fetches real conversation IDs from the API and updates screenshot scripts.
 * Run this before capturing screenshots to ensure real data is shown.
 */

import { $ } from 'bun';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const PWA_URL = process.env.PWA_URL || 'http://localhost:5173';
const SCREENSHOT_SCRIPT_PATH = path.join(__dirname, 'capture-screenshots.ts');

interface Conversation {
  id: string;
  title: string;
  provider: string;
  messageCount: number;
}

async function fetchConversation(): Promise<Conversation | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/conversations?limit=1`, {
      headers: {
        'Origin': PWA_URL,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const conversations = await response.json() as Conversation[];
    if (conversations.length === 0) {
      return null;
    }
    
    return conversations[0];
  } catch (error) {
    console.error('Failed to fetch conversation:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function updateScreenshotScript(conversationId: string): Promise<boolean> {
  try {
    const scriptPath = SCREENSHOT_SCRIPT_PATH;
    
    if (!fs.existsSync(scriptPath)) {
      console.error(`Screenshot script not found: ${scriptPath}`);
      return false;
    }
    
    let content = fs.readFileSync(scriptPath, 'utf-8');
    
    // Replace /conversation/:id with real ID
    const oldPattern = /{ path: '\/conversation\/:id'/g;
    const newPattern = `{ path: '/conversation/${conversationId}'`;
    
    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, newPattern);
      fs.writeFileSync(scriptPath, content, 'utf-8');
      console.log(`✅ Updated screenshot script with conversation ID: ${conversationId}`);
      return true;
    }
    
    // Check if already updated with a different ID
    const existingMatch = content.match(/{ path: '\/conversation\/([^']+)'}/);
    if (existingMatch && existingMatch[1] !== ':id') {
      console.log(`ℹ️  Screenshot script already has conversation ID: ${existingMatch[1]}`);
      
      // Update anyway to ensure consistency
      content = content.replace(/{ path: '\/conversation\/[^']+'}/, newPattern);
      fs.writeFileSync(scriptPath, content, 'utf-8');
      console.log(`✅ Updated to new conversation ID: ${conversationId}`);
      return true;
    }
    
    console.log('ℹ️  No /conversation/:id pattern found in script');
    return false;
  } catch (error) {
    console.error('Failed to update screenshot script:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      headers: {
        'Origin': PWA_URL,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkPWAHealth(): Promise<boolean> {
  try {
    const response = await fetch(PWA_URL);
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 VIVIM Demo Pre-flight Check\n');
  console.log('═'.repeat(50));
  
  // Check server health
  console.log('Checking API server...');
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    console.log('❌ API server not responding at', API_BASE);
    console.log('\n💡 Start the server with:');
    console.log('   cd server && bun run dev\n');
    process.exit(1);
  }
  console.log('✅ API server healthy');
  
  // Check PWA health
  console.log('Checking PWA...');
  const pwaHealthy = await checkPWAHealth();
  if (!pwaHealthy) {
    console.log('❌ PWA not responding at', PWA_URL);
    console.log('\n💡 Start the PWA with:');
    console.log('   cd pwa && bun run dev\n');
    process.exit(1);
  }
  console.log('✅ PWA healthy');
  
  // Fetch conversation
  console.log('\nFetching conversation from API...');
  const conversation = await fetchConversation();
  if (!conversation) {
    console.log('❌ No conversations found in database');
    console.log('\n💡 Run the seed script first:');
    console.log('   cd server && bun run prisma:seed:investor\n');
    process.exit(1);
  }
  console.log(`✅ Found conversation: ${conversation.title || 'Untitled'} (${conversation.id})`);
  
  // Update screenshot script
  console.log('\nUpdating screenshot script...');
  const updated = await updateScreenshotScript(conversation.id);
  if (!updated) {
    console.log('⚠️  Could not update screenshot script automatically');
    console.log(`\n💡 Manual fix: Edit demo/scripts/capture-screenshots.js`);
    console.log(`   Replace '/conversation/:id' with '${conversation.id}'\n`);
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('✅ Pre-flight check complete!\n');
  console.log('📋 Next steps:');
  console.log('   1. bun run demo/scripts/capture-screenshots.ts --flow=investor');
  console.log('   2. bun run demo:highlight --focus=knowledgeGraph\n');
}

main().catch(error => {
  console.error('❌ Pre-flight failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
