#!/usr/bin/env node

/**
 * VIVIM SDK CLI Entry Point
 * 
 * Run with: npx vivim-cli [command]
 * Or import as module
 */

import { createAIAgentCLI } from './src/cli/agent-cli.js';
import { createCLI, AgentSession } from './src/cli/agent-utils.js';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Determine if running in pipe mode (input from stdin)
const isPipeMode = !process.stdin.isTTY;

async function main() {
  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  // Check for version flag
  if (args.includes('--version') || args.includes('-v')) {
    console.log('VIVIM SDK CLI v1.0.0');
    process.exit(0);
  }

  // Parse options
  const options: { format?: 'json' | 'text' | 'markdown' | 'compact' } = {};
  const formatIdx = args.indexOf('--format');
  if (formatIdx !== -1 && args[formatIdx + 1]) {
    options.format = args[formatIdx + 1] as any;
  }

  // Auto-init mode (no interactive prompt)
  const autoInit = args.includes('--init') || args.includes('-i');

  // Create CLI
  const cli = await createAIAgentCLI({
    format: options.format || 'json',
    autoInit,
  });

  // If command provided, execute and exit
  if (command) {
    await cli.runCommand(args.slice(1).join(' ').replace(command, '').trim() || command);
    await cli.close();
    return;
  }

  // If piped input, execute each line
  if (isPipeMode) {
    let input = '';
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    
    process.stdin.on('end', async () => {
      const lines = input.split('\n').filter(l => l.trim());
      for (const line of lines) {
        await cli.runCommand(line);
      }
      await cli.close();
    });
    return;
  }

  // Otherwise, start interactive mode
  await cli.interactive();
}

function printHelp() {
  console.log(`
VIVIM SDK CLI - AI Agent Command Interface

Usage:
  vivim-cli [command] [options]
  echo "[command]" | vivim-cli
  vivim-cli --init --format json

Commands:
  identity              Get current identity
  identity create       Create new identity
  memory create        Create a memory
  memory search         Search memories
  content create        Create content
  content feed          Get content feed
  social follow         Follow a user
  social circle create Create a circle
  chat new             Start new conversation
  chat send            Send message
  storage status       Get storage status
  help                 Show help
  format               Set output format
  exit                 Exit CLI

Options:
  --format, -f         Output format: json, text, markdown, compact
  --init, -i           Auto-initialize SDK
  --help, -h           Show this help
  --version, -v       Show version

Examples:
  vivim-cli identity create --name "My Agent"
  vivim-cli memory create "Important info" --type semantic
  vivim-cli format json
  echo "memory search api" | vivim-cli

For programmatic use:
  import { createCLI } from '@vivim/sdk/cli';
  
  const agent = await createCLI().agent();
  await agent.remember("Key insight", "semantic");
  const memories = await agent.recall("api");
`);
}

main().catch(console.error);
