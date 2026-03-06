#!/usr/bin/env bun
/**
 * System Verification Script
 * Tests all fixes for warnings and errors
 */

import { $ } from 'bun';

console.log('🔍 VIVIM System Verification\n');

const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Test 1: Check server tsconfig includes common directory
console.log('✓ Checking server tsconfig.json...');
try {
  const serverTsconfig = await Bun.file('server/tsconfig.json').json();
  if (serverTsconfig.include?.includes('../common/**/*')) {
    results.passed.push('Server tsconfig includes common directory');
    console.log('  ✅ Server tsconfig includes ../common/**/*');
  } else {
    results.failed.push('Server tsconfig missing common directory');
    console.log('  ❌ Server tsconfig missing ../common/**/*');
  }
} catch (err) {
  results.failed.push(`Server tsconfig check failed: ${err.message}`);
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 2: Check bunfig.toml exists and has proper excludes
console.log('\n✓ Checking bunfig.toml...');
try {
  const bunfig = await Bun.file('bunfig.toml').text();
  if (bunfig.includes('exclude') && bunfig.includes('dist')) {
    results.passed.push('bunfig.toml has proper excludes');
    console.log('  ✅ bunfig.toml configured with excludes');
  } else {
    results.warnings.push('bunfig.toml missing excludes');
    console.log('  ⚠️  bunfig.toml may need excludes configuration');
  }
} catch (err) {
  results.failed.push('bunfig.toml not found');
  console.log('  ❌ bunfig.toml not found');
}

// Test 3: Check server bunfig.toml for watch configuration
console.log('\n✓ Checking server/bunfig.toml...');
try {
  const serverBunfig = await Bun.file('server/bunfig.toml').text();
  if (serverBunfig.includes('watch') && serverBunfig.includes('../common')) {
    results.passed.push('Server bunfig.toml has watch config for common');
    console.log('  ✅ Server bunfig.toml watches common directory');
  } else {
    results.failed.push('Server bunfig.toml missing common watch config');
    console.log('  ❌ Server bunfig.toml missing ../common watch config');
  }
} catch (err) {
  results.failed.push('server/bunfig.toml not found');
  console.log('  ❌ server/bunfig.toml not found');
}

// Test 4: Check PWA vite config has proxy error handling
console.log('\n✓ Checking PWA vite proxy error handling...');
try {
  const viteConfig = await Bun.file('pwa/vite.config.ts').text();
  if (viteConfig.includes('proxy.on') && viteConfig.includes('ECONNREFUSED')) {
    results.passed.push('PWA vite has proxy error handling');
    console.log('  ✅ PWA vite configured for ECONNREFUSED handling');
  } else {
    results.failed.push('PWA vite missing proxy error handling');
    console.log('  ❌ PWA vite missing ECONNREFUSED handling');
  }
} catch (err) {
  results.failed.push(`PWA vite config check failed: ${err.message}`);
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 5: Check Redis config is added to server config
console.log('\n✓ Checking server Redis configuration...');
try {
  const serverConfig = await Bun.file('server/src/config/index.js').text();
  if (serverConfig.includes('redisUrl') && serverConfig.includes('REDIS_URL')) {
    results.passed.push('Server config includes redisUrl');
    console.log('  ✅ Server config includes redisUrl');
  } else {
    results.failed.push('Server config missing redisUrl');
    console.log('  ❌ Server config missing redisUrl');
  }
} catch (err) {
  results.failed.push(`Server config check failed: ${err.message}`);
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 6: Check cache service has improved message
console.log('\n✓ Checking cache service Redis message...');
try {
  const cacheService = await Bun.file('server/src/services/cache-service.js').text();
  if (cacheService.includes('in-memory cache fallback')) {
    results.passed.push('Cache service has improved Redis message');
    console.log('  ✅ Cache service has user-friendly Redis message');
  } else {
    results.warnings.push('Cache service Redis message could be improved');
    console.log('  ⚠️  Cache service Redis message unchanged');
  }
} catch (err) {
  results.failed.push(`Cache service check failed: ${err.message}`);
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 7: Check common files exist
console.log('\n✓ Checking common directory files...');
try {
  const commonFiles = [
    'common/error-reporting.js',
    'common/error-aggregator.ts',
    'common/error-alerting.ts'
  ];
  
  let allExist = true;
  for (const file of commonFiles) {
    const exists = await Bun.file(file).exists();
    if (!exists) {
      allExist = false;
      console.log(`  ❌ Missing: ${file}`);
    }
  }
  
  if (allExist) {
    results.passed.push('All common files exist');
    console.log('  ✅ All common files exist');
  } else {
    results.failed.push('Some common files missing');
  }
} catch (err) {
  results.failed.push(`Common files check failed: ${err.message}`);
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 8: Check network dist directory exists
console.log('\n✓ Checking network dist directory...');
try {
  const networkDist = await Bun.file('network/dist/index.js').exists();
  if (networkDist) {
    results.passed.push('Network dist directory exists');
    console.log('  ✅ Network dist directory exists');
  } else {
    results.warnings.push('Network dist may need to be built');
    console.log('  ⚠️  Network dist not built (run: cd network && bun run build)');
  }
} catch (err) {
  results.failed.push(`Network dist check failed: ${err.message}`);
  console.log(`  ❌ Error: ${err.message}`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log('='.repeat(60));

if (results.failed.length > 0) {
  console.log('\n❌ FAILED CHECKS:');
  results.failed.forEach(f => console.log(`  - ${f}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  results.warnings.forEach(w => console.log(`  - ${w}`));
}

if (results.passed.length > 0 && results.failed.length === 0) {
  console.log('\n🎉 All critical checks passed! System is ready.');
}

console.log('\n📝 NEXT STEPS:');
console.log('  1. Run: bun run dev');
console.log('  2. Watch for startup messages');
console.log('  3. Verify no "not in project directory" warnings');
console.log('  4. Test PWA at http://localhost:5173');
console.log('');

// Exit with appropriate code
if (results.failed.length > 0) {
  process.exit(1);
}
