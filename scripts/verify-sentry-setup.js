#!/usr/bin/env node

/**
 * Sentry Setup Verification Script
 *
 * This script verifies that Sentry is properly configured across the VIVIM monorepo.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname, '..');

console.log('🔍 Verifying Sentry Setup for VIVIM Monorepo\n');

const checks = [];

// ============================================================================
// Check 1: Verify Sentry packages are installed
// ============================================================================

console.log('📦 Checking Sentry packages...');

const packageFiles = [
  { path: join(ROOT_DIR, 'server', 'package.json'), packages: ['@sentry/node', '@sentry/profiling-node'] },
  { path: join(ROOT_DIR, 'pwa', 'package.json'), packages: ['@sentry/react'] },
  { path: join(ROOT_DIR, 'network', 'package.json'), packages: ['@sentry/node'] },
];

for (const { path, packages } of packageFiles) {
  if (!existsSync(path)) {
    console.log(`❌ ${path} not found`);
    continue;
  }

  const pkg = JSON.parse(readFileSync(path, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const pkgName of packages) {
    if (deps[pkgName]) {
      console.log(`✅ ${pkgName} found in ${path}`);
      checks.push({ name: `Package: ${pkgName}`, status: 'pass' });
    } else {
      console.log(`❌ ${pkgName} missing in ${path}`);
      checks.push({ name: `Package: ${pkgName}`, status: 'fail' });
    }
  }
}

// ============================================================================
// Check 2: Verify Sentry configuration files exist
// ============================================================================

console.log('\n📄 Checking Sentry configuration files...');

const configFiles = [
  { path: join(ROOT_DIR, 'server', 'src', 'lib', 'sentry.js'), component: 'Server' },
  { path: join(ROOT_DIR, 'server', 'src', 'middleware', 'sentry.js'), component: 'Server Middleware' },
  { path: join(ROOT_DIR, 'server', 'src', 'config', 'sentry.js'), component: 'Server Config' },
  { path: join(ROOT_DIR, 'pwa', 'src', 'lib', 'sentry.ts'), component: 'PWA' },
  { path: join(ROOT_DIR, 'network', 'src', 'lib', 'sentry.ts'), component: 'Network' },
];

for (const { path, component } of configFiles) {
  if (existsSync(path)) {
    console.log(`✅ ${component} config found at ${path}`);
    checks.push({ name: `Config: ${component}`, status: 'pass' });
  } else {
    console.log(`❌ ${component} config missing at ${path}`);
    checks.push({ name: `Config: ${component}`, status: 'fail' });
  }
}

// ============================================================================
// Check 3: Verify Sentry is imported in entry points
// ============================================================================

console.log('\n🚀 Checking Sentry initialization in entry points...');

const entryFiles = [
  { path: join(ROOT_DIR, 'server', 'src', 'server.js'), component: 'Server' },
  { path: join(ROOT_DIR, 'pwa', 'src', 'main.tsx'), component: 'PWA' },
];

for (const { path, component } of entryFiles) {
  if (!existsSync(path)) {
    console.log(`❌ ${component} entry point not found at ${path}`);
    checks.push({ name: `Entry: ${component}`, status: 'fail' });
    continue;
  }

  const content = readFileSync(path, 'utf8');
  const hasSentryImport = content.includes('sentry') || content.includes('./lib/sentry');

  if (hasSentryImport) {
    console.log(`✅ ${component} has Sentry initialization`);
    checks.push({ name: `Entry: ${component}`, status: 'pass' });
  } else {
    console.log(`❌ ${component} missing Sentry initialization`);
    checks.push({ name: `Entry: ${component}`, status: 'fail' });
  }
}

// ============================================================================
// Check 4: Verify environment variable examples exist
// ============================================================================

console.log('\n📋 Checking environment variable examples...');

const envFiles = [
  { path: join(ROOT_DIR, '.env.example'), component: 'Root' },
  { path: join(ROOT_DIR, 'server', '.env.example'), component: 'Server' },
  { path: join(ROOT_DIR, 'pwa', '.env.example'), component: 'PWA' },
  { path: join(ROOT_DIR, 'network', '.env.example'), component: 'Network' },
];

for (const { path, component } of envFiles) {
  if (!existsSync(path)) {
    console.log(`⚠️  ${component} .env.example not found at ${path}`);
    checks.push({ name: `Env: ${component}`, status: 'warn' });
    continue;
  }

  const content = readFileSync(path, 'utf8');
  const hasSentryConfig = content.includes('SENTRY_DSN') || content.includes('VITE_SENTRY_DSN');

  if (hasSentryConfig) {
    console.log(`✅ ${component} .env.example has Sentry configuration`);
    checks.push({ name: `Env: ${component}`, status: 'pass' });
  } else {
    console.log(`⚠️  ${component} .env.example missing Sentry configuration`);
    checks.push({ name: `Env: ${component}`, status: 'warn' });
  }
}

// ============================================================================
// Check 5: Verify documentation exists
// ============================================================================

console.log('\n📖 Checking documentation...');

const docsPath = join(ROOT_DIR, 'SENTRY_SETUP.md');

if (existsSync(docsPath)) {
  console.log(`✅ Sentry setup documentation found`);
  checks.push({ name: 'Documentation', status: 'pass' });
} else {
  console.log(`⚠️  Sentry setup documentation missing`);
  checks.push({ name: 'Documentation', status: 'warn' });
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50));

const passed = checks.filter(c => c.status === 'pass').length;
const failed = checks.filter(c => c.status === 'fail').length;
const warned = checks.filter(c => c.status === 'warn').length;
const total = checks.length;

console.log(`Total Checks: ${total}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warned}`);

if (failed === 0) {
  console.log('\n🎉 Sentry setup is properly configured!');
  console.log('\nNext steps:');
  console.log('1. Copy .env.example files to .env and add your Sentry DSN');
  console.log('2. Set SENTRY_DSN in each .env file');
  console.log('3. Start your applications to begin error tracking');
  console.log('4. Visit Sentry.io to view errors and performance data');
} else {
  console.log('\n❌ Some checks failed. Please review the errors above.');
  process.exit(1);
}
