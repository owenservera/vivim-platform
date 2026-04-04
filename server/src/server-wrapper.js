#!/usr/bin/env bun
/**
 * Server wrapper that suppresses bun watch warnings for external files
 * These warnings are informational - files ARE watched correctly
 */

import { spawn } from 'child_process';

const BUN_WATCH_WARNINGS = [
  /warn: File .* is not in the project directory and will not be watched/i,
];

const server = spawn(process.execPath, ['--watch', 'src/server.js'], {
  cwd: process.cwd(),
  env: { ...process.env, FORCE_COLOR: '1' },
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: process.platform === 'win32',
});

let stdoutBuffer = '';
server.stdout.on('data', (data) => {
  stdoutBuffer += data.toString();
  let newlineIndex;
  while ((newlineIndex = stdoutBuffer.indexOf('\n')) !== -1) {
    const line = stdoutBuffer.slice(0, newlineIndex);
    stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
    if (BUN_WATCH_WARNINGS.some(pattern => pattern.test(line))) {
      continue;
    }
    // Also catch wrapped warnings (crude check for the wrapped part)
    if (line.includes('not in the project directory and will not be watched')) {
      continue;
    }
    process.stdout.write(line + '\n');
  }
});

let stderrBuffer = '';
server.stderr.on('data', (data) => {
  stderrBuffer += data.toString();
  let newlineIndex;
  while ((newlineIndex = stderrBuffer.indexOf('\n')) !== -1) {
    const line = stderrBuffer.slice(0, newlineIndex);
    stderrBuffer = stderrBuffer.slice(newlineIndex + 1);
    if (BUN_WATCH_WARNINGS.some(pattern => pattern.test(line))) {
      continue;
    }
    if (line.includes('not in the project directory and will not be watched')) {
      continue;
    }
    process.stderr.write(line + '\n');
  }
});

server.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});
