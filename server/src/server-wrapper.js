#!/usr/bin/env bun
/**
 * Server wrapper that suppresses bun watch warnings for external files
 * These warnings are informational - files ARE watched correctly
 */

import { spawn } from 'child_process';

const BUN_WATCH_WARNINGS = [
  /warn: File .* is not in the project directory and will not be watched/i,
];

const server = spawn('bun', ['--watch', 'src/server.js'], {
  cwd: process.cwd(),
  env: { ...process.env, FORCE_COLOR: '1' },
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

server.stdout.on('data', (data) => {
  const output = data.toString();
  const lines = output.split('\n');
  
  for (const line of lines) {
    // Skip bun watch warnings
    if (BUN_WATCH_WARNINGS.some(pattern => pattern.test(line))) {
      continue;
    }
    process.stdout.write(line + '\n');
  }
});

server.stderr.on('data', (data) => {
  const output = data.toString();
  const lines = output.split('\n');
  
  for (const line of lines) {
    // Skip bun watch warnings
    if (BUN_WATCH_WARNINGS.some(pattern => pattern.test(line))) {
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
