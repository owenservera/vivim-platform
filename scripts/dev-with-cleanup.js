#!/usr/bin/env node

/**
 * Development server with forced cleanup on exit
 * Ensures all VIVIM processes are killed when dev server exits
 */

const { spawn } = require('child_process');

// VIVIM ports
const VIVIM_PORTS = [3000, 5173, 5174, 1235];

console.log('🚀 Starting VIVIM development server with forced cleanup...');
console.log('');
console.log('Services will be started:');
console.log('  📱 PWA Frontend:     http://localhost:5173');
console.log('  🔧 API Server:        http://localhost:3000');
console.log('  🌐 WebSocket Server:   ws://localhost:1235');
console.log('  🎛️ Admin Panel:       http://localhost:5174');
console.log('');
console.log('Press Ctrl+C to stop all services');
console.log('');

/**
 * Force cleanup function
 */
function forceCleanup() {
  console.log('\n🧹 Force cleanup of VIVIM development processes...\n');

  const cleanupScript = spawn('node', ['scripts/force-cleanup.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  cleanupScript.on('close', (code) => {
    console.log('\n✓ All processes cleaned up');
    process.exit(code || 0);
  });
}

/**
 * Start development server
 */
function startDevServer() {
  const devProcess = spawn('bun', ['run', 'dev:core'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: true
  });

  devProcess.on('close', (code) => {
    console.log(`\n✓ Development server exited (code: ${code})`);
    forceCleanup();
  });

  devProcess.on('error', (error) => {
    console.error(`\n❌ Development server error: ${error.message}`);
    forceCleanup();
    process.exit(1);
  });
}

/**
 * Handle signals
 */
function handleSignal(signal) {
  console.log(`\n🛑 Received ${signal} signal...`);
  forceCleanup();
}

// Setup signal handlers
process.on('SIGINT', () => handleSignal('SIGINT'));
process.on('SIGTERM', () => handleSignal('SIGTERM'));

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught exception:', error);
  forceCleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n❌ Unhandled rejection:', reason);
  forceCleanup();
  process.exit(1);
});

// Start the development server
startDevServer();