#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const args = process.argv.slice(2);
let outputDir = path.join(__dirname, '..', 'backups');
let compress = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) {
    outputDir = args[i + 1];
    i++;
  } else if (args[i] === '--compress') {
    compress = true;
  }
}

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  console.log('   Set it with: export DATABASE_URL="postgresql://user:pass@host:5432/dbname"');
  process.exit(1);
}

// Parse database URL to extract connection info
function parseDatabaseUrl(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  };
}

// Create backup
async function createBackup() {
  const db = parseDatabaseUrl(databaseUrl);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `vivim-backup-${timestamp}.sql`;
  const backupPath = path.join(outputDir, backupFileName);

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created backup directory: ${outputDir}`);
  }

  console.log('🗄️  Starting database backup...');
  console.log(`   Database: ${db.database}@${db.host}:${db.port}`);
  console.log(`   Output:   ${backupPath}`);

  // Set password for pg_dump
  const env = { ...process.env, PGPASSWORD: db.password };

  try {
    // Build pg_dump command
    const pgDumpCmd = [
      'pg_dump',
      `-h ${db.host}`,
      `-p ${db.port}`,
      `-U ${db.user}`,
      `-d ${db.database}`,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      '-f', backupPath
    ].join(' ');

    console.log('⏳ Running pg_dump...');
    execSync(pgDumpCmd, { env, stdio: 'inherit' });

    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Compress if requested
    if (compress) {
      console.log('🗜️  Compressing backup...');
      const compressCmd = `gzip "${backupPath}"`;
      execSync(compressCmd, { stdio: 'inherit' });
      const compressedPath = `${backupPath}.gz`;
      const compressedStats = fs.statSync(compressedPath);
      const compressedSizeMB = (compressedStats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Backup created and compressed: ${compressedPath} (${compressedSizeMB} MB)`);
    } else {
      console.log(`✅ Backup created: ${backupPath} (${fileSizeMB} MB)`);
    }

    // Cleanup old backups (keep last 10)
    cleanupOldBackups(outputDir, 10);

    console.log('✅ Backup completed successfully!');
    return backupPath;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

// Cleanup old backups, keeping only the specified number
function cleanupOldBackups(dir, keepCount) {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('vivim-backup-') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
      .map(f => ({
        name: f,
        path: path.join(dir, f),
        time: fs.statSync(path.join(dir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > keepCount) {
      const toDelete = files.slice(keepCount);
      console.log(`🧹 Cleaning up ${toDelete.length} old backup(s)...`);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
        console.log(`   Deleted: ${file.name}`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not cleanup old backups:', error.message);
  }
}

// List existing backups
function listBackups() {
  if (!fs.existsSync(outputDir)) {
    console.log('No backups found.');
    return;
  }

  const files = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('vivim-backup-') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
    .map(f => {
      const stats = fs.statSync(path.join(outputDir, f));
      return {
        name: f,
        size: (stats.size / (1024 * 1024)).toFixed(2),
        date: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (files.length === 0) {
    console.log('No backups found.');
    return;
  }

  console.log('📦 Existing backups:');
  for (const file of files) {
    console.log(`   ${file.name} (${file.size} MB) - ${file.date}`);
  }
}

// Handle CLI commands
if (args.includes('--list')) {
  listBackups();
} else if (args.includes('--help')) {
  console.log(`
Database Backup Script

Usage:
  node backup-db.js                 Create a new backup
  node backup-db.js --list          List existing backups
  node backup-db.js --help          Show this help

Options:
  --output <dir>    Output directory (default: ./backups)
  --compress        Compress the backup with gzip

Environment:
  DATABASE_URL    PostgreSQL connection string (required)
  BACKUP_DIR     Default backup directory

Example:
  export DATABASE_URL="postgresql://postgres:password@localhost:5432/openscroll"
  node scripts/backup-db.js --compress
`);
} else {
  createBackup();
}
