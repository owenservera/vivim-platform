#!/usr/bin/env bun

/**
 * End-to-End Testing Script
 * 
 * Tests the complete OpenScroll flow:
 * 1. Database connection
 * 2. API endpoints
 * 3. Extraction
 * 4. ACU processing
 * 5. Sync
 * 6. Search
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function section(title: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    success(name);
    return true;
  } catch (err) {
    error(`${name}: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function main() {
  log('\n🚀 OpenScroll End-to-End Test Suite\n', colors.cyan);

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  section('1. Health Checks');
  
  if (await test('Server health', async () => {
    const res = await fetch(`${API_BASE.replace('/api/v1', '')}/health`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Server not healthy');
  })) passed++; else failed++;

  if (await test('Database health', async () => {
    const res = await fetch(`${API_BASE.replace('/api/v1', '')}/health/db`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Database not healthy');
  })) passed++; else failed++;

  // Test 2: Conversations API
  section('2. Conversations API');

  let testConversationId: string | null = null;

  if (await test('List conversations', async () => {
    const res = await fetch(`${API_BASE}/conversations`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('API returned success: false');
    if (!Array.isArray(data.data)) throw new Error('Data is not an array');
    if (data.data.length > 0) {
      testConversationId = data.data[0].id;
      info(`Found ${data.data.length} conversations`);
    }
  })) passed++; else failed++;

  if (testConversationId && await test('Get single conversation', async () => {
    const res = await fetch(`${API_BASE}/conversations/${testConversationId}`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('API returned success: false');
    if (!data.data.id) throw new Error('No conversation data');
    info(`Conversation: "${data.data.title}"`);
  })) passed++; else failed++;

  // Test 3: ACU API
  section('3. ACU API');

  if (await test('Get ACU statistics', async () => {
    const res = await fetch(`${API_BASE}/acus/stats`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('API returned success: false');
    info(`Total ACUs: ${data.data.total}`);
  })) passed++; else failed++;

  if (await test('List ACUs', async () => {
    const res = await fetch(`${API_BASE}/acus?limit=10`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('API returned success: false');
    if (!Array.isArray(data.data)) throw new Error('Data is not an array');
    info(`Found ${data.data.length} ACUs`);
  })) passed++; else failed++;

  if (testConversationId && await test('Process conversation to ACUs', async () => {
    const res = await fetch(`${API_BASE}/acus/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: testConversationId,
        calculateQuality: true,
        detectLinks: true
      })
    });
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('API returned success: false');
    info(`Generated ${data.data.acuCount} ACUs in ${data.data.duration}ms`);
  })) passed++; else failed++;

  // Test 4: Search
  section('4. Search API');

  if (await test('Search ACUs', async () => {
    const res = await fetch(`${API_BASE}/acus/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'rust',
        limit: 5
      })
    });
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('API returned success: false');
    info(`Found ${data.count} results for "rust"`);
  })) passed++; else failed++;

  // Test 5: Sync API
  section('5. Sync API');

  const testDeviceId = `test_device_${Date.now()}`;

  if (await test('Get sync status', async () => {
    const res = await fetch(`${API_BASE}/sync/status?deviceId=${testDeviceId}`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('API returned success: false');
    info(`Sync available: ${data.status.syncAvailable}`);
  })) passed++; else failed++;

  if (await test('Pull sync changes', async () => {
    const res = await fetch(`${API_BASE}/sync/pull?deviceId=${testDeviceId}&since=${new Date(0).toISOString()}`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('API returned success: false');
    info(`Pulled ${data.stats.total} changes`);
  })) passed++; else failed++;

  if (await test('Push sync changes', async () => {
    const res = await fetch(`${API_BASE}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: testDeviceId,
        changes: []
      })
    });
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('API returned success: false');
    info(`Sync timestamp: ${data.syncTimestamp}`);
  })) passed++; else failed++;

  // Test 6: Graph API
  section('6. Graph API');

  if (await test('Get ACU graph', async () => {
    const acusRes = await fetch(`${API_BASE}/acus?limit=1`);
    const acusData = await acusRes.json();
    
    if (acusData.data && acusData.data.length > 0) {
      const acuId = acusData.data[0].id;
      const res = await fetch(`${API_BASE}/acus/${acuId}/links?depth=1`);
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error('API returned success: false');
      info(`Graph has ${data.data.nodes.length} nodes and ${data.data.edges.length} edges`);
    } else {
      info('No ACUs available for graph test');
    }
  })) passed++; else failed++;

  // Summary
  section('Test Summary');
  
  const total = passed + failed;
  const percentage = Math.round((passed / total) * 100);
  
  log(`\nTotal Tests: ${total}`, colors.cyan);
  log(`Passed: ${passed}`, colors.green);
  log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green);
  log(`Success Rate: ${percentage}%\n`, percentage === 100 ? colors.green : colors.yellow);

  if (failed === 0) {
    success('🎉 All tests passed!');
    process.exit(0);
  } else {
    error(`⚠️  ${failed} test(s) failed`);
    process.exit(1);
  }
}

main().catch((err) => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
