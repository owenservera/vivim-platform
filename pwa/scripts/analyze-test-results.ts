import fs from 'fs';
import path from 'path';

/**
 * VIVIM Test Analysis Script
 * Parses Playwright diagnostic snapshots and generates a comprehensive analysis report
 */

const REPORT_DIR = path.join(process.cwd(), 'pwa', 'playwright-report');
const DATA_DIR = path.join(REPORT_DIR, 'vivim-data');

async function analyze() {
  console.log('Starting VIVIM Test Analysis...');

  if (!fs.existsSync(REPORT_DIR)) {
    console.error('Playwright report not found. Run tests first.');
    return;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Find all diagnostic snapshots in the report
  // They are usually stored in the 'data' or 'attachments' subfolders
  const attachmentFiles: string[] = [];
  
  function findSnapshots(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        findSnapshots(fullPath);
      } else if (file.includes('vivim-diagnostic-snapshot')) {
        attachmentFiles.push(fullPath);
      }
    }
  }

  try {
    findSnapshots(REPORT_DIR);
  } catch (e) {
    console.warn('No diagnostic snapshots found.');
  }

  const analysis = {
    totalTests: attachmentFiles.length,
    failedTests: attachmentFiles.length, // Only failures usually have snapshots in my fixture
    errorsByCategory: {} as Record<string, number>,
    slowFlows: [] as any[],
    performanceIssues: [] as any[],
    recommendations: [] as string[],
  };

  for (const file of attachmentFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const snapshot = JSON.parse(content);
      
      // Analyze logs for errors
      const logs = snapshot.logs || [];
      logs.forEach((log: any) => {
        if (log.level === 'error') {
          const category = log.module || 'Unknown';
          analysis.errorsByCategory[category] = (analysis.errorsByCategory[category] || 0) + 1;
        }
      });

      // Analyze data flows for bottlenecks
      const flows = snapshot.flows || [];
      flows.forEach((flow: any) => {
        if (flow.status === 'failed') {
          analysis.performanceIssues.push({
            type: 'Flow Failure',
            requestId: flow.requestId,
            duration: flow.endTime - flow.startTime,
            url: snapshot.url
          });
        }
        
        const totalDuration = (flow.endTime || Date.now()) - flow.startTime;
        if (totalDuration > 2000) {
          analysis.slowFlows.push({
            requestId: flow.requestId,
            duration: totalDuration,
            url: snapshot.url
          });
        }
      });

      // Analyze health
      if (snapshot.localStorage?.corruptionDetected) {
        analysis.recommendations.push(`Local storage corruption detected at ${snapshot.url}`);
      }
      if (snapshot.webSocket?.reconnectAttempts > 3) {
        analysis.recommendations.push(`High WebSocket reconnection attempts at ${snapshot.url}`);
      }
    } catch (e) {
      console.error(`Failed to parse snapshot ${file}:`, e);
    }
  }

  // Generate recommendations
  if (analysis.slowFlows.length > 0) {
    analysis.recommendations.push(`${analysis.slowFlows.length} data flows took longer than 2s. Check network or DB latency.`);
  }
  if (Object.keys(analysis.errorsByCategory).length > 0) {
    analysis.recommendations.push(`Errors found in modules: ${Object.keys(analysis.errorsByCategory).join(', ')}.`);
  }

  const reportPath = path.join(DATA_DIR, 'analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));

  console.log(`
==================================================`);
  console.log(`VIVIM TEST ANALYSIS SUMMARY`);
  console.log(`==================================================`);
  console.log(`Failed Tests with Diagnostics: ${analysis.failedTests}`);
  console.log(`Errors by Module:`, analysis.errorsByCategory);
  console.log(`Slow Data Flows: ${analysis.slowFlows.length}`);
  console.log(`Recommendations:`);
  analysis.recommendations.forEach(r => console.log(` - ${r}`));
  console.log(`==================================================`);
  console.log(`Full report saved to: ${reportPath}`);
}

analyze();
