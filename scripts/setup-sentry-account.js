#!/usr/bin/env node

/**
 * Automated Sentry Account Setup Script
 *
 * This script helps set up a complete Sentry integration including:
 * - Account creation guidance
 * - Project setup
 * - DSN configuration
 * - Release management
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const ROOT_DIR = join(__dirname, '..');

console.log('🚀 VIVIM Sentry Account Setup Assistant\n');
console.log('This script will guide you through setting up Sentry and configuring it for VIVIM.\n');

// ============================================================================
// STEP 1: Check Sentry CLI Installation
// ============================================================================

console.log('📦 Step 1: Checking Sentry CLI...');

try {
  const version = execSync('sentry --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Sentry CLI installed: ${version}`);
} catch (error) {
  console.log('❌ Sentry CLI not found. Installing...');
  console.log('   Run: bun add -g @sentry/cli');
  process.exit(1);
}

// ============================================================================
// STEP 2: Account Creation Guide
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📋 Step 2: Create Your Sentry Account');
console.log('='.repeat(60));

console.log('\n🌐 To create your free Sentry account:');
console.log('\n1. Visit: https://sentry.io/signup/');
console.log('2. Sign up (free for up to 5,000 errors/month)');
console.log('3. Choose your organization name (e.g., "vivim-dev")');
console.log('4. Verify your email address');
console.log('\n⚠️  After creating your account, continue with Step 3...\n');

// ============================================================================
// STEP 3: Authentication Guide
// ============================================================================

console.log('='.repeat(60));
console.log('🔐 Step 3: Authenticate Sentry CLI');
console.log('='.repeat(60));

console.log('\nTo authenticate the CLI, run:');
console.log('\n   sentry login\n');
console.log('\nThis will:');
console.log('   1. Open a browser window');
console.log('   2. Ask you to log in to Sentry');
console.log('   3. Create an authentication token');
console.log('   4. Store the token locally\n');

console.log('⚠️  Please run the command above, then press Enter to continue...\n');

// ============================================================================
// STEP 4: Project Creation Guide
// ============================================================================

console.log('='.repeat(60));
console.log('📦 Step 4: Create Sentry Projects');
console.log('='.repeat(60));

console.log('\n🔹 Create these projects in your Sentry dashboard:');

const projects = [
  {
    name: 'vivim-server',
    platform: 'Node.js',
    description: 'VIVIM API Server - Express backend',
  },
  {
    name: 'vivim-pwa',
    platform: 'React',
    description: 'VIVIM Progressive Web App - Frontend',
  },
  {
    name: 'vivim-network',
    platform: 'Node.js',
    description: 'VIVIM Network Engine - P2P layer',
  },
];

projects.forEach((project, index) => {
  console.log(`\n   ${index + 1}. ${project.name}`);
  console.log(`      Platform: ${project.platform}`);
  console.log(`      ${project.description}`);
});

console.log('\n📝 For each project:');
console.log('   1. Go to your Sentry dashboard');
console.log('   2. Click "Create Project"');
console.log('   3. Select the platform');
console.log('   4. Give it the name shown above');
console.log('   5. Copy the DSN (Data Source Name)\n');

// ============================================================================
// STEP 5: DSN Collection
// ============================================================================

console.log('='.repeat(60));
console.log('🔑 Step 5: Enter Your Sentry DSNs');
console.log('='.repeat(60));

console.log('\n📋 Please enter the DSN for each project:');
console.log('   (Press Enter to skip if you want to configure manually later)\n');

const dsnConfig = {};

// Server DSN
console.log('🔹 Server DSN (Node.js):');
const serverDsn = process.stdin.read();
if (serverDsn && serverDsn.trim()) {
  dsnConfig.server = serverDsn.trim();
  console.log(`   ✅ Server DSN: ${dsnConfig.server.substring(0, 20)}...`);
}

// PWA DSN
console.log('\n🔹 PWA DSN (React):');
const pwaDsn = process.stdin.read();
if (pwaDsn && pwaDsn.trim()) {
  dsnConfig.pwa = pwaDsn.trim();
  console.log(`   ✅ PWA DSN: ${dsnConfig.pwa.substring(0, 20)}...`);
}

// Network DSN
console.log('\n🔹 Network DSN (Node.js):');
const networkDsn = process.stdin.read();
if (networkDsn && networkDsn.trim()) {
  dsnConfig.network = networkDsn.trim();
  console.log(`   ✅ Network DSN: ${dsnConfig.network.substring(0, 20)}...`);
}

// ============================================================================
// STEP 6: Configuration Update
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('⚙️  Step 6: Update Configuration Files');
console.log('='.repeat(60));

const envFiles = [
  { path: join(ROOT_DIR, '.env'), dsn: dsnConfig.server, name: 'Root' },
  { path: join(ROOT_DIR, 'server', '.env'), dsn: dsnConfig.server, name: 'Server' },
  { path: join(ROOT_DIR, 'pwa', '.env'), dsn: dsnConfig.pwa, name: 'PWA' },
  { path: join(ROOT_DIR, 'network', '.env'), dsn: dsnConfig.network, name: 'Network' },
];

let updatedFiles = 0;

for (const { path, dsn, name } of envFiles) {
  if (!dsn) {
    console.log(`⏭️  Skipping ${name} (no DSN provided)`);
    continue;
  }

  if (!existsSync(path)) {
    console.log(`⚠️  ${name} .env file not found. Creating...`);

    // Create .env from example if exists
    const examplePath = path.replace('.env', '.env.example');
    if (existsSync(examplePath)) {
      const example = readFileSync(examplePath, 'utf8');
      const updated = example.replace(
        /SENTRY_DSN=https:\/\/.*@sentry\.io\/.*/,
        `SENTRY_DSN=${dsn}`
      ).replace(
        /VITE_SENTRY_DSN=https:\/\/.*@sentry\.io\/.*/,
        `VITE_SENTRY_DSN=${dsn}`
      );
      writeFileSync(path, updated);
      console.log(`✅ Created ${name} .env with Sentry DSN`);
      updatedFiles++;
    }
  } else {
    console.log(`📝 Updating ${name} .env...`);

    let content = readFileSync(path, 'utf8');

    // Update or add SENTRY_DSN
    if (content.includes('SENTRY_DSN=')) {
      content = content.replace(
        /SENTRY_DSN=.*/,
        `SENTRY_DSN=${dsn}`
      );
    } else {
      content += `\nSENTRY_DSN=${dsn}`;
    }

    // Update or add VITE_SENTRY_DSN
    if (content.includes('VITE_SENTRY_DSN=')) {
      content = content.replace(
        /VITE_SENTRY_DSN=.*/,
        `VITE_SENTRY_DSN=${dsn}`
      );
    } else if (path.includes('pwa')) {
      content += `\nVITE_SENTRY_DSN=${dsn}`;
    }

    writeFileSync(path, content);
    console.log(`✅ Updated ${name} .env with Sentry DSN`);
    updatedFiles++;
  }
}

// ============================================================================
// STEP 7: Verification
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('✅ Step 7: Verify Configuration');
console.log('='.repeat(60));

if (updatedFiles > 0) {
  console.log(`\n🎉 Configuration updated for ${updatedFiles} file(s)!`);
  console.log('\n🚀 Next steps:');
  console.log('   1. Start your applications:');
  console.log('      bun run dev');
  console.log('   2. Check Sentry dashboard for incoming errors');
  console.log('   3. Verify error reporting is working');
} else {
  console.log('\n⚠️  No configuration files were updated.');
  console.log('   You can manually update your .env files with the DSNs.');
}

// ============================================================================
// STEP 8: Testing Guide
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('🧪 Step 8: Test Sentry Integration');
console.log('='.repeat(60));

console.log('\n📝 To test Sentry integration:');

console.log('\n1. Start the server:');
console.log('   cd server && bun run dev');

console.log('\n2. Start the PWA:');
console.log('   cd pwa && bun run dev');

console.log('\n3. Visit http://localhost:5173');

console.log('\n4. Test error reporting:');
console.log('   - Open browser console');
console.log('   - Type: throw new Error("Test error")');
console.log('   - Check Sentry dashboard');

console.log('\n5. Check Sentry dashboard:');
console.log('   - Go to your Sentry project');
console.log('   - Look for new error events');
console.log('   - Verify stack traces and context');

// ============================================================================
// STEP 9: Optional Features
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('⭐ Step 9: Optional Features');
console.log('='.repeat(60));

console.log('\n🎯 Enable these features for better monitoring:');

console.log('\n1. Source Maps (Production):');
console.log('   - Upload source maps for readable stack traces');
console.log('   - Run: sentry-cli releases files <release> upload-sourcemaps');

console.log('\n2. Session Replay (PWA):');
console.log('   - Enable in PWA Sentry config');
console.log('   - See user interactions before errors');

console.log('\n3. Performance Monitoring:');
console.log('   - Already configured with sampling');
console.log('   - View traces in Performance section');

console.log('\n4. Alert Rules:');
console.log('   - Set up email/Slack alerts');
console.log('   - Configure for critical errors');

console.log('\n5. Release Tracking:');
console.log('   - Track errors by deployment');
console.log('   - Compare error rates between releases');

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 SETUP COMPLETE');
console.log('='.repeat(60));

console.log('\n✅ Sentry is now configured for VIVIM!');
console.log('\n📚 Documentation:');
console.log('   - See SENTRY_SETUP.md for detailed guide');
console.log('   - See SENTRY_INTEGRATION_SUMMARY.md for overview');

console.log('\n🔗 Useful Commands:');
console.log('   - sentry login          - Authenticate CLI');
console.log('   - sentry projects        - List your projects');
console.log('   - sentry releases      - Manage releases');
console.log('   - sentry-cli upload-dsym - Upload debug symbols');

console.log('\n💡 Tips:');
console.log('   - Adjust sampling rates based on traffic');
console.log('   - Set up alert rules for immediate notifications');
console.log('   - Review errors weekly and fix top issues');
console.log('   - Use tags to categorize errors by feature\n');

console.log('='.repeat(60));
