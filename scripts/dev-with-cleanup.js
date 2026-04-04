#!/usr/bin/env node

/**
 * Development server with forced cleanup on exit
 * Ensures all VIVIM processes are killed when dev server exits
 * Automatically generates error logs in dev-server-dump.log
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(process.cwd(), 'dev-server-dump.log');
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

/**
 * Write log with timestamp
 */
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${type}] ${message}\n`;
  
  // Strip ANSI codes for file
  const cleanMessage = formattedMessage.replace(/\x1b\[[0-9;]*m/g, '');
  logStream.write(cleanMessage);
  
  if (type === 'ERROR') {
    process.stderr.write(`\x1b[31m${formattedMessage}\x1b[0m`);
  } else if (type === 'WARN') {
    process.stdout.write(`\x1b[33m${formattedMessage}\x1b[0m`);
  }
}

console.log('🚀 Starting VIVIM development server with forced cleanup...');
console.log(`📄 Logs will be captured in: ${LOG_FILE}`);
console.log('');
console.log('Services will be started:');
console.log('  📱 PWA Frontend:     http://localhost:5173');
console.log('  🔧 API Server:        http://localhost:3000');
console.log('  🌐 WebSocket Server:   ws://localhost:1235');
console.log('  🎛️ Admin Panel:       http://localhost:5174');
console.log('');
console.log('Press Ctrl+C to stop all services');
console.log('');

log('Starting development session');

/**
 * Force cleanup function
 */
function forceCleanup() {
  console.log('\n🧹 Force cleanup of VIVIM development processes...\n');
  log('Executing force cleanup');

  const cleanupScript = spawn('bun', ['scripts/force-cleanup.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  cleanupScript.on('close', (code) => {
    console.log('\n✓ All processes cleaned up');
    log(`Cleanup completed with code ${code}`);
    process.exit(code || 0);
  });
}

/**
 * Start development server
 */
function startDevServer() {
  const devProcess = spawn('bun', ['run', 'dev:core'], {
    cwd: process.cwd(),
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  // Capture stdout
  devProcess.stdout.on('data', (data) => {
    const output = data.toString();
    logStream.write(output);
    process.stdout.write(output);
    
    // Check for errors in output
    if (output.toLowerCase().includes('error') || output.includes('❌')) {
      // We don't need to do anything special here as it's already going to the log file
    }
  });

  // Capture stderr
  devProcess.stderr.on('data', (data) => {
    const output = data.toString();
    logStream.write(output);
    process.stderr.write(output);
    
    const trimmed = output.trim();
    if (!trimmed) return;

    // Filter out common benign stderr messages
    const isCommandEcho = trimmed.startsWith('$ ') || trimmed.startsWith('>');
    const isDeprecationWarning = trimmed.includes('DeprecationWarning') || trimmed.includes('(node:');
    const isBenignWarning = trimmed.includes('is not in the project directory and will not be watched');
    
    // Only mark as ERROR if it's not a known benign message AND contains error-like keywords
    const hasErrorKeyword = /error|fail|exception|rejection|abort/i.test(trimmed);
    
    if (hasErrorKeyword && !isCommandEcho && !isDeprecationWarning && !isBenignWarning) {
      log(`STDERR: ${trimmed}`, 'ERROR');
    } else {
      log(`STDERR_INFO: ${trimmed}`, 'INFO');
    }
  });

  devProcess.on('close', (code) => {
    console.log(`\n✓ Development server exited (code: ${code})`);
    log(`Development server exited with code ${code}`);
    forceCleanup();
  });

  devProcess.on('error', (error) => {
    console.error(`\n❌ Development server error: ${error.message}`);
    log(`Development server process error: ${error.message}`, 'ERROR');
    forceCleanup();
    process.exit(1);
  });
}

/**
 * Handle signals
 */
function handleSignal(signal) {
  console.log(`\n🛑 Received ${signal} signal...`);
  log(`Received signal ${signal}`);
  forceCleanup();
}

// Setup signal handlers
process.on('SIGINT', () => handleSignal('SIGINT'));
process.on('SIGTERM', () => handleSignal('SIGTERM'));

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught exception:', error);
  log(`Uncaught exception: ${error.stack || error}`, 'ERROR');
  forceCleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n❌ Unhandled rejection:', reason);
  log(`Unhandled rejection: ${reason}`, 'ERROR');
  forceCleanup();
  process.exit(1);
});

// Start the development server
startDevServer();