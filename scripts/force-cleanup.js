#!/usr/bin/env node

/**
 * Force cleanup of VIVIM development processes
 * Kills all processes on VIVIM ports to ensure clean exit
 */

const { execSync } = require('child_process');
const { spawn } = require('child_process');

// VIVIM ports to clean up
const VIVIM_PORTS = [3000, 5173, 5174, 5175, 1235];

/**
 * Get processes using specific ports on Windows
 */
function getProcessesOnPorts(ports) {
  try {
    const result = execSync('netstat -ano | findstr "LISTENING"', { encoding: 'utf-8' });
    const lines = result.split('\n');
    const portProcesses = {};

    for (const line of lines) {
      for (const port of ports) {
        if (line.includes(`:${port}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parts[parts.length - 1];
            portProcesses[port] = pid;
          }
        }
      }
    }

    return portProcesses;
  } catch (error) {
    console.error('Error getting processes:', error.message);
    return {};
  }
}

/**
 * Force kill a process by PID
 */
function forceKillProcess(pid, port) {
  try {
    execSync(`powershell -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`, {
      stdio: 'pipe',
      timeout: 5000
    });
    console.log(`✓ Killed process ${pid} on port ${port}`);
  } catch (error) {
    try {
      execSync(`taskkill /F /PID ${pid}`, {
        stdio: 'pipe',
        timeout: 5000
      });
      console.log(`✓ Killed process ${pid} on port ${port}`);
    } catch (taskkillError) {
      console.log(`⚠ Could not kill process ${pid} on port ${port}: ${taskkillError.message}`);
    }
  }
}

/**
 * Main cleanup function
 */
function forceCleanup() {
  console.log('🧹 Force cleanup of VIVIM development processes...\n');

  const portProcesses = getProcessesOnPorts(VIVIM_PORTS);
  let killedCount = 0;

  for (const [port, pid] of Object.entries(portProcesses)) {
    if (pid) {
      console.log(`Killing process ${pid} on port ${port}...`);
      forceKillProcess(pid, port);
      killedCount++;
    }
  }

  if (killedCount === 0) {
    console.log('✓ No VIVIM processes found running');
  } else {
    console.log(`\n✓ Cleanup complete: ${killedCount} process(es) killed`);
  }

  console.log('\nWaiting for processes to terminate...');

  setTimeout(() => {
    console.log('✓ Cleanup finished');
    process.exit(0);
  }, 1000);
}

// Handle cleanup on script exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Cleanup interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Cleanup terminated');
  process.exit(0);
});

// Run cleanup
forceCleanup();