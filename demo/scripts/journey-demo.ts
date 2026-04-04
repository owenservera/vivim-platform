#!/usr/bin/env bun
/**
 * VIVIM Journey System Demo (Offline Mode)
 * 
 * This script demonstrates the journey system without requiring live servers.
 * It parses journey scripts and shows what would be captured.
 * 
 * Usage:
 *   bun run demo/scripts/journey-demo.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Journey Parser (same as journey-runner.ts)
// ============================================================================

interface JourneyStep {
  step: number;
  action: string;
  url: string;
  wait?: number;
  screenshot?: boolean;
  notes?: string;
}

interface JourneyScript {
  title: string;
  description: string;
  duration: string;
  target: string;
  preConditions: string[];
  steps: JourneyStep[];
}

class JourneyParser {
  parse(content: string): JourneyScript {
    const lines = content.split('\n');
    const script: Partial<JourneyScript> = {
      steps: [],
      preConditions: [],
    };

    let inSteps = false;
    let inPreConditions = false;

    for (const line of lines) {
      if (line.startsWith('title:')) {
        script.title = line.replace('title:', '').trim();
      } else if (line.startsWith('description:')) {
        script.description = line.replace('description:', '').trim();
      } else if (line.startsWith('duration:')) {
        script.duration = line.replace('duration:', '').trim();
      } else if (line.startsWith('target:')) {
        script.target = line.replace('target:', '').trim();
      } else if (line.includes('## Pre-Conditions')) {
        inPreConditions = true;
        inSteps = false;
      } else if (line.includes('## Steps')) {
        inSteps = true;
        inPreConditions = false;
      } else if (line.startsWith('## ') && !line.includes('Pre-Conditions') && !line.includes('Steps')) {
        inSteps = false;
        inPreConditions = false;
      } else if (inPreConditions && line.trim().startsWith('- [ ]')) {
        script.preConditions?.push(line.trim().replace('- [ ]', '').trim());
      } else if (inSteps && line.trim().startsWith('|')) {
        const step = this.parseStepLine(line);
        if (step && step.step > 0) {
          script.steps?.push(step);
        }
      }
    }

    if (!script.title) {
      script.title = 'Untitled Journey';
    }

    return script as JourneyScript;
  }

  private parseStepLine(line: string): JourneyStep | null {
    const parts = line.split('|').map(p => p.trim()).filter(p => p);
    if (parts.length < 3) return null;
    
    const stepNum = parseInt(parts[0], 10);
    if (isNaN(stepNum)) return null;

    return {
      step: stepNum,
      action: parts[1] || 'Navigate',
      url: parts[2] || '/',
      wait: parseInt(parts[3]) || 2000,
      screenshot: parts[4] !== '❌',
      notes: parts[5] || '',
    };
  }
}

// ============================================================================
// Demo Runner
// ============================================================================

function printBanner(text: string, char = '═') {
  console.log('\n' + char.repeat(70));
  console.log(text);
  console.log(char.repeat(70) + '\n');
}

function printJourneyInfo(script: JourneyScript) {
  console.log('📋 Journey Information');
  console.log('-'.repeat(70));
  console.log(`   Title:       ${script.title}`);
  console.log(`   Duration:    ${script.duration}`);
  console.log(`   Target:      ${script.target}`);
  console.log(`   Steps:       ${script.steps.length}`);
  console.log(`   Description: ${script.description}`);
  console.log();
}

function printPreConditions(script: JourneyScript) {
  if (script.preConditions.length === 0) return;
  
  console.log('✅ Pre-Conditions');
  console.log('-'.repeat(70));
  for (const cond of script.preConditions) {
    console.log(`   ☐ ${cond}`);
  }
  console.log();
}

function printSteps(script: JourneyScript) {
  console.log('🎬 Journey Steps');
  console.log('-'.repeat(70));
  console.log();
  
  for (const step of script.steps) {
    const screenshot = step.screenshot !== false ? '📸' : '⏭️';
    const wait = step.wait ? `${step.wait}ms` : '—';
    
    console.log(`   Step ${step.step.toString().padStart(2)}: ${step.action}`);
    console.log(`      URL:       ${step.url}`);
    console.log(`      Wait:      ${wait}`);
    console.log(`      Screenshot: ${screenshot}`);
    if (step.notes) {
      console.log(`      Notes:     ${step.notes}`);
    }
    console.log();
  }
}

function generateMockOutput(script: JourneyScript) {
  const journeyName = script.title.toLowerCase().replace(/[^a-z]+/g, '-');
  const outputDir = path.join(__dirname, `../screenshots/journeys/${journeyName}`);
  
  console.log('📁 Mock Output Structure');
  console.log('-'.repeat(70));
  console.log(`   Output Dir:  ${outputDir}`);
  console.log();
  console.log('   Files that would be created:');
  
  for (const step of script.steps) {
    if (step.screenshot !== false) {
      const slug = (step.notes || step.action).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const filename = `${step.step.toString().padStart(2, '0')}-${slug}.png`;
      console.log(`      - ${filename}`);
    }
  }
  
  console.log(`      - ${journeyName}-report.md`);
  console.log(`      - ${journeyName}-preview.html`);
  console.log();
}

function generateMockReport(script: JourneyScript) {
  let md = `# ${script.title} - Mock Capture Report\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Duration:** ${script.duration}\n`;
  md += `**Target:** ${script.target}\n\n`;
  md += `${script.description}\n\n`;
  md += `---\n\n`;
  
  md += `## Steps Executed\n\n`;
  
  for (const step of script.steps) {
    md += `### Step ${step.step}: ${step.action}\n\n`;
    if (step.notes) {
      md += `> ${step.notes}\n\n`;
    }
    md += `- **URL:** \`${step.url}\`\n`;
    md += `- **Wait:** ${step.wait}ms\n`;
    md += `- **Screenshot:** ${step.screenshot !== false ? 'Yes' : 'No'}\n\n`;
  }
  
  return md;
}

async function main() {
  printBanner('🎬 VIVIM Journey System Demo (Offline Mode)');
  
  const journeysDir = path.join(__dirname, '../journeys');
  
  if (!fs.existsSync(journeysDir)) {
    console.error('❌ Journeys directory not found');
    process.exit(1);
  }
  
  const journeyFiles = fs.readdirSync(journeysDir).filter(f => f.endsWith('.md'));
  
  console.log(`Found ${journeyFiles.length} journey scripts:\n`);
  for (const file of journeyFiles) {
    console.log(`   - ${file}`);
  }
  console.log();
  
  const parser = new JourneyParser();
  
  for (const file of journeyFiles) {
    const filePath = path.join(journeysDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const script = parser.parse(content);
    
    printBanner(`📋 ${script.title}`, '─');
    printJourneyInfo(script);
    printPreConditions(script);
    printSteps(script);
    generateMockOutput(script);
    
    // Generate mock report
    const reportMd = generateMockReport(script);
    const reportPath = path.join(__dirname, `../screenshots/journeys/${script.title.toLowerCase().replace(/[^a-z]+/g, '-')}/${file.replace('.md', '-mock-report.md')}`);
    
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(reportPath, reportMd);
    console.log(`✅ Mock report generated: ${reportPath}`);
    console.log();
  }
  
  printBanner('✅ Journey System Demo Complete');
  
  console.log('📊 Summary');
  console.log('-'.repeat(70));
  console.log(`   Journeys Parsed:     ${journeyFiles.length}`);
  console.log(`   Total Steps:         ${journeyFiles.reduce((sum, file) => {
    const content = fs.readFileSync(path.join(journeysDir, file), 'utf-8');
    const script = parser.parse(content);
    return sum + script.steps.length;
  }, 0)}`);
  console.log(`   Mock Reports:        ${journeyFiles.length}`);
  console.log();
  console.log('💡 To run with live servers:');
  console.log('   1. Start API:  cd server && bun run dev');
  console.log('   2. Start PWA:  cd pwa && bun run dev');
  console.log('   3. Run pre-flight: bun run demo:preflight');
  console.log('   4. Capture journey: bun run demo:journey --script=problem-solver');
  console.log();
}

main().catch(error => {
  console.error('❌ Demo failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
