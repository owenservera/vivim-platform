/**
 * Test Import Service with Sample ChatGPT Export
 * 
 * Usage: bun test-import.ts
 */

import { importService } from '../server/src/services/import-service.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const ZIP_PATH = join(import.meta.dir, '../chatgpt-exports/50f21fc0eefd1bdbb9eda7bf5e7145d7f92921dcd853ac96c49096eaeeec95b5-2026-03-05-06-36-32-d5be5ff9b0fe4d368479fb705cd03a9d.zip');

async function testImport() {
  console.log('🧪 Testing Import Service with ChatGPT Export...\n');

  try {
    // Read the ZIP file
    console.log('📦 Reading ZIP file...');
    const fileBuffer = readFileSync(ZIP_PATH);
    console.log(`   File size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB\n`);

    // Create import job
    console.log('🚀 Creating import job...');
    const importJob = await importService.createImportJob(
      'test-user-123',
      fileBuffer,
      'chatgpt-export.zip'
    );

    console.log('✅ Import job created:');
    console.log(`   Job ID: ${importJob.id}`);
    console.log(`   Status: ${importJob.status}`);
    console.log(`   Total Conversations: ${importJob.totalConversations}`);
    console.log(`   File: ${importJob.fileName}\n`);

    // Wait for processing
    console.log('⏳ Waiting for processing to complete...\n');
    
    // Poll for completion
    const maxAttempts = 30;
    const pollInterval = 2000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const job = await importService.getImportJob(importJob.id, 'test-user-123');
      
      if (!job) {
        console.log('❌ Job not found!');
        break;
      }

      console.log(`📊 Attempt ${attempt}/${maxAttempts}:`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Processed: ${job.processedConversations}/${job.totalConversations}`);
      console.log(`   Failed: ${job.failedConversations}`);
      console.log(`   Progress: ${Math.round((job.processedConversations / job.totalConversations) * 100)}%\n`);

      if (job.status === 'COMPLETED') {
        console.log('🎉 Import completed successfully!');
        break;
      }

      if (job.status === 'FAILED') {
        console.log('❌ Import failed:');
        console.log(`   Errors: ${JSON.stringify(job.errors, null, 2)}`);
        break;
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    console.log('\n✅ Test complete!\n');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testImport();
