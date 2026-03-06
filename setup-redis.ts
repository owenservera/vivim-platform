#!/usr/bin/env bun
/**
 * Redis Setup Script for VIVIM
 * 
 * This script:
 * 1. Checks if Redis is installed and running
 * 2. Provides installation instructions for Windows
 * 3. Tests the Redis connection
 * 
 * Usage: bun run setup-redis.ts
 */

import { $ } from 'bun';

const REDIS_HOST = 'localhost';
const REDIS_PORT = '6379';
const REDIS_URL = process.env.REDIS_URL || `redis://${REDIS_HOST}:${REDIS_PORT}`;

console.log('🔴 Redis Setup for VIVIM\n');
console.log('=' .repeat(60));

// Check if Redis CLI is available
async function checkRedisCli(): Promise<boolean> {
  try {
    const result = await $`redis-cli --version`.quiet().nothrow();
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

// Check if Redis server is running
async function checkRedisServer(): Promise<boolean> {
  try {
    const result = await $`redis-cli ping`.quiet().nothrow();
    return result.exitCode === 0 && result.stdout?.toString().trim() === 'PONG';
  } catch {
    return false;
  }
}

// Get Redis version
async function getRedisVersion(): Promise<string> {
  try {
    const result = await $`redis-cli --version`.quiet().nothrow();
    return result.stdout?.toString().trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

// Test Redis connection from Node.js
async function testNodeRedisConnection(): Promise<boolean> {
  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(REDIS_URL);
    
    await redis.ping();
    await redis.set('vivim:test', 'connection-successful');
    const value = await redis.get('vivim:test');
    await redis.del('vivim:test');
    await redis.quit();
    
    return value === 'connection-successful';
  } catch (err) {
    console.error('Node.js Redis connection test failed:', err);
    return false;
  }
}

// Windows installation instructions
function showWindowsInstructions() {
  console.log('\n📦 Installing Redis on Windows\n');
  console.log('Option 1: Using Chocolatey (Recommended)');
  console.log('  choco install redis-64');
  console.log('  redis-server --service-install');
  console.log('  redis-server --service-start');
  console.log('');
  console.log('Option 2: Using Docker (Recommended for Development)');
  console.log('  docker run -d -p 6379:6379 --name vivim-redis redis:latest');
  console.log('');
  console.log('Option 3: Download from GitHub');
  console.log('  https://github.com/microsoftarchive/redis/releases');
  console.log('  Download Redis-x64-*.zip and extract');
  console.log('  Run: redis-server.exe');
  console.log('');
}

// Main setup function
async function setup() {
  const isWindows = process.platform === 'win32';
  
  // Check Redis CLI
  console.log('✓ Checking Redis CLI...');
  const hasCli = await checkRedisCli();
  
  if (hasCli) {
    const version = await getRedisVersion();
    console.log(`  ✅ Redis CLI found: ${version}`);
  } else {
    console.log('  ❌ Redis CLI not found');
  }
  
  // Check Redis Server
  console.log('\n✓ Checking Redis Server...');
  const serverRunning = await checkRedisServer();
  
  if (serverRunning) {
    console.log(`  ✅ Redis server is running at ${REDIS_URL}`);
  } else {
    console.log('  ❌ Redis server is not running or not installed');
    
    if (isWindows) {
      console.log('\n' + '='.repeat(60));
      console.log('📋 REDIS INSTALLATION INSTRUCTIONS FOR WINDOWS\n');
      showWindowsInstructions();
    } else {
      console.log('\n📋 Install Redis:');
      console.log('  macOS:   brew install redis');
      console.log('  Ubuntu:  sudo apt-get install redis-server');
      console.log('  Docker:  docker run -d -p 6379:6379 redis:latest');
    }
  }
  
  // Test Node.js connection
  if (serverRunning) {
    console.log('\n✓ Testing Node.js Redis connection...');
    const nodeTest = await testNodeRedisConnection();
    
    if (nodeTest) {
      console.log('  ✅ Node.js can connect to Redis successfully');
    } else {
      console.log('  ❌ Node.js Redis connection failed');
      console.log('\n  Check your REDIS_URL environment variable:');
      console.log(`  Current: ${REDIS_URL}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 REDIS SETUP SUMMARY');
  console.log('='.repeat(60));
  
  if (serverRunning && nodeTest) {
    console.log('✅ Redis is fully configured and working!');
    console.log('\nYour VIVIM server will now use Redis for:');
    console.log('  - Session storage');
    console.log('  - API response caching');
    console.log('  - Rate limiting');
    console.log('  - Real-time data sync');
  } else if (serverRunning) {
    console.log('⚠️  Redis server is running but Node.js connection failed');
    console.log('   Check your REDIS_URL environment variable');
  } else {
    console.log('⚠️  Redis is not running');
    console.log('   VIVIM will use in-memory cache fallback');
    console.log('   (This is fine for development, but Redis is recommended for production)');
  }
  
  console.log('\n📝 Configuration:');
  console.log(`   REDIS_URL=${REDIS_URL}`);
  console.log('');
  console.log('='.repeat(60));
  
  // Return success status
  return serverRunning && nodeTest;
}

// Run setup
setup()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
