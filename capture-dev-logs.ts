#!/usr/bin/env bun
/**
 * Dev Server Log Capture and Analysis
 * Runs dev server for 30 seconds, captures logs, and analyzes for warnings/errors
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'dev-server-log.txt');
const RUN_DURATION = 30000; // 30 seconds

console.log('🔍 VIVIM Dev Server - Log Capture & Analysis\n');
console.log('=' .repeat(60));
console.log(`Duration: ${RUN_DURATION / 1000} seconds`);
console.log(`Log file: ${LOG_FILE}`);
console.log('=' .repeat(60));
console.log('');

const logStream = fs.createWriteStream(LOG_FILE);
const logs: string[] = [];
let serverStarted = false;
let serverStartTime = 0;

// Patterns to detect
const patterns = {
  warnings: [
    /warn:/i,
    /warning:/i,
    /WARN/i,
    /⚠️/i,
  ],
  errors: [
    /error:/i,
    /\berror\b/i,
    /ECONNREFUSED/i,
    /failed/i,
    /❌/i,
    /unhandled/i,
    /rejection/i,
  ],
  success: [
    /ready in/i,
    /started/i,
    /operational/i,
    /listening/i,
    /http.*localhost/i,
  ],
  // Informational messages that look like warnings but aren't issues
  informational: [
    /warn: File .* is not in the project directory and will not be watched/i,
  ],
};

const issues: { type: 'error' | 'warning' | 'info'; message: string; source: string }[] = [];

// Start the dev server
console.log('🚀 Starting dev server...\n');

const devProcess = spawn('bun', ['run', 'dev'], {
  cwd: process.cwd(),
  env: { ...process.env, FORCE_COLOR: '1' },
  shell: true,
});

devProcess.stdout?.on('data', (data: Buffer) => {
  const output = data.toString();
  logs.push(output);
  logStream.write(output);
  
  // Parse each line
  const lines = output.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Check for server start
    if (line.includes('VIVIM Server') || line.includes('VITE') || line.includes('ready')) {
      if (!serverStarted) {
        serverStarted = true;
        serverStartTime = Date.now();
      }
    }
    
    // Skip informational messages (bun watch warnings are expected)
    const isInformational = patterns.informational.some(p => p.test(line));
    if (isInformational) {
      continue; // Don't count as warning or error
    }
    
    // Skip script exit messages from concurrently (expected on shutdown)
    if (line.includes('script') && line.includes('exited with code')) {
      continue; // Expected when stopping
    }
    
    // Check for warnings
    for (const pattern of patterns.warnings) {
      if (pattern.test(line)) {
        issues.push({ type: 'warning', message: line.trim(), source: 'stdout' });
        break;
      }
    }
    
    // Check for errors
    for (const pattern of patterns.errors) {
      if (pattern.test(line)) {
        issues.push({ type: 'error', message: line.trim(), source: 'stdout' });
        break;
      }
    }
  }
  
  // Print to console with color coding
  process.stdout.write(output);
});

devProcess.stderr?.on('data', (data: Buffer) => {
  const output = data.toString();
  logs.push(output);
  logStream.write(output);
  
  const lines = output.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    issues.push({ type: 'error', message: line.trim(), source: 'stderr' });
  }
  
  process.stderr.write(output);
});

devProcess.on('close', (code) => {
  console.log(`\n\nDev server exited with code ${code}`);
});

// Wait for duration then analyze
setTimeout(async () => {
  console.log('\n' + '='.repeat(60));
  console.log('⏹️  Stopping server and analyzing logs...\n');
  
  // Kill the process
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/F', '/T', '/PID', devProcess.pid?.toString() || '']);
    } else {
      devProcess.kill('SIGTERM');
    }
  } catch (e) {
    // Ignore kill errors
  }
  
  logStream.end();
  
  // Analyze results
  await analyzeLogs();
  
}, RUN_DURATION);

async function analyzeLogs() {
  // Read the full log file
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 2000); // Wait for file to flush
  });
  
  const logContent = fs.readFileSync(LOG_FILE, 'utf-8');
  const allLines = logContent.split('\n');
  
  // Filter out informational messages before analysis
  const filteredLines = allLines.filter(line => {
    // Skip bun watch warnings (informational - files ARE watched)
    if (line.includes('is not in the project directory and will not be watched')) {
      return false;
    }
    // Skip script exit messages from concurrently (expected on shutdown)
    if (line.includes('script') && line.includes('exited with code')) {
      return false;
    }
    // Skip command echo lines
    if (line.startsWith('$ bun run') || line.startsWith('$ cd ') || line.startsWith('$ HOST=')) {
      return false;
    }
    // Skip empty context lines from Redis error logging
    if (line.includes('[SRV]') && line.trim().endsWith('error: ""')) {
      return false;
    }
    // Skip Redis fallback warning (expected when Redis is not running)
    if (line.includes('Redis connection failed, using in-memory cache fallback')) {
      return false;
    }
    return true;
  });
  
  // Categorize issues from filtered lines
  const issues: { type: 'error' | 'warning'; message: string }[] = [];
  
  for (const line of filteredLines) {
    if (!line.trim()) continue;
    
    // Check for warnings
    if (/warn:/i.test(line) || /warning:/i.test(line) || /WARN/i.test(line)) {
      issues.push({ type: 'warning', message: line.trim() });
    }
    // Check for errors (but not WARN level logs)
    else if (/error:/i.test(line) || /\berror\b/i.test(line) || /ECONNREFUSED/i.test(line)) {
      if (!/WARN.*Redis/i.test(line)) { // Skip Redis WARN logs
        issues.push({ type: 'error', message: line.trim() });
      }
    }
  }
  
  // Deduplicate
  const uniqueErrors = Array.from(new Set(issues.filter(i => i.type === 'error').map(e => e.message)));
  const uniqueWarnings = Array.from(new Set(issues.filter(i => i.type === 'warning').map(w => w.message)));
  
  console.log('📊 LOG ANALYSIS RESULTS');
  console.log('='.repeat(60));
  console.log(`Total log lines: ${allLines.length}`);
  console.log(`Filtered log lines: ${filteredLines.length}`);
  console.log(`Server started: ${serverStarted ? '✅ Yes' : '❌ No'}`);
  if (serverStarted) {
    console.log(`Uptime: ${Math.round((Date.now() - serverStartTime) / 1000)}s`);
  }
  console.log('');
  console.log(`📝 Issues found:`);
  console.log(`  - Errors: ${uniqueErrors.length}`);
  console.log(`  - Warnings: ${uniqueWarnings.length}`);
  console.log('');
  
  if (uniqueErrors.length > 0) {
    console.log('❌ ERRORS:');
    uniqueErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.substring(0, 150)}${err.length > 150 ? '...' : ''}`);
    });
    console.log('');
  }
  
  if (uniqueWarnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    uniqueWarnings.forEach((warn, i) => {
      console.log(`  ${i + 1}. ${warn.substring(0, 150)}${warn.length > 150 ? '...' : ''}`);
    });
    console.log('');
  }
  
  if (uniqueErrors.length === 0 && uniqueWarnings.length === 0) {
    console.log('🎉 No errors or warnings detected!');
    console.log('');
  }
  
  // Show successful startup messages
  console.log('✅ SUCCESS MESSAGES:');
  const successLines = filteredLines.filter(line => 
    patterns.success.some(p => p.test(line))
  );
  successLines.slice(0, 10).forEach(line => {
    console.log(`  ${line.trim()}`);
  });
  console.log('');
  
  console.log('='.repeat(60));
  console.log(`📄 Full log saved to: ${LOG_FILE}`);
  console.log('='.repeat(60));
  
  // Exit with appropriate code
  if (uniqueErrors.length > 0) {
    console.log('\n❌ STATUS: ERRORS DETECTED - Fix required');
    process.exit(1);
  } else if (uniqueWarnings.length > 0) {
    console.log('\n⚠️  STATUS: WARNINGS DETECTED - Review recommended');
    process.exit(0);
  } else {
    console.log('\n✅ STATUS: ALL CLEAR - No issues detected');
    process.exit(0);
  }
}

// Handle process errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  logStream.end();
  process.exit(1);
});
