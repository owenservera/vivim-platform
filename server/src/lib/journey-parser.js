/**
 * Journey Parser
 *
 * Parses markdown journey files and extracts journey data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JOURNEYS_DIR = path.join(__dirname, '../../../demo/journeys');
const SCREENSHOTS_DIR = path.join(__dirname, '../../../demo/screenshots/journeys');

function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontmatterRegex);

  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const frontmatter = {};

  frontmatterStr.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });

  return {
    frontmatter,
    content: content.slice(match[0].length),
  };
}

function parseStepTable(content) {
  const lines = content.split('\n');
  const steps = [];
  let inTable = false;

  for (const line of lines) {
    if (line.includes('| Step |') && line.includes('Action |')) {
      inTable = true;
      continue;
    }

    if (inTable && line.includes('|---')) continue;

    if (inTable && line.trim().startsWith('|') && !line.includes('---')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c);
      if (cells.length >= 5) {
        steps.push({
          step: parseInt(cells[0]) || steps.length + 1,
          action: cells[1],
          url: cells[2],
          wait: parseInt(cells[3]) || 2000,
          screenshot: cells[4].includes('✅'),
          notes: cells[5] || '',
        });
      }
    }

    if (inTable && !line.includes('|') && line.trim()) {
      inTable = false;
    }
  }

  return steps;
}

function parseNarration(content) {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const phaseMatch = line.match(/^###\s+Phase\s+(\d+):\s+(.+)/);
    const timeMatch = line.match(/\*\*Time:\*\*\s*(.+)/);
    const actionMatch = line.match(/\*\*Action:\*\*\s*(.+)/);
    const narrationMatch = line.match(/\*\*Narration:\*\*\s*(.+)/);

    if (phaseMatch) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        phase: phaseMatch[2],
        time: '',
        action: '',
        narration: '',
      };
    } else if (currentSection) {
      if (timeMatch) currentSection.time = timeMatch[1];
      if (actionMatch) currentSection.action = actionMatch[1];
      if (narrationMatch) currentSection.narration = narrationMatch[1];
    }
  }

  if (currentSection) sections.push(currentSection);

  return sections;
}

function parsePreConditions(content) {
  const conditions = [];
  const lines = content.split('\n');
  let inPreConditions = false;

  for (const line of lines) {
    if (line.includes('## Pre-Conditions')) {
      inPreConditions = true;
      continue;
    }

    if (inPreConditions) {
      if (line.includes('- [ ]')) {
        conditions.push(line.replace('- [ ]', '').trim());
      } else if (line.startsWith('##')) {
        break;
      }
    }
  }

  return conditions;
}

function parseBackupPlan(content) {
  const plan = [];
  const lines = content.split('\n');
  let inBackupPlan = false;

  for (const line of lines) {
    if (line.includes('## Backup Plan')) {
      inBackupPlan = true;
      continue;
    }

    if (inBackupPlan && line.includes('| Failure |')) {
      continue;
    }

    if (inBackupPlan && line.includes('|---')) continue;

    if (inBackupPlan && line.includes('|') && !line.includes('##')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c);
      if (cells.length >= 2) {
        plan.push({
          failure: cells[0],
          solution: cells[1],
        });
      }
    }
  }

  return plan;
}

function parseExpectedQuestions(content) {
  const questions = [];
  const lines = content.split('\n');
  let inQuestions = false;

  for (const line of lines) {
    if (line.includes('## Expected Investor Questions')) {
      inQuestions = true;
      continue;
    }

    if (inQuestions && line.includes('**"')) {
      const qMatch = line.match(/\*\*"(.+)"\*\*/);
      if (qMatch) {
        questions.push({
          question: qMatch[1],
          answer: '',
        });
      }
    } else if (inQuestions && line.includes('- Answer:') && questions.length > 0) {
      questions[questions.length - 1].answer = line.replace('- Answer:', '').trim();
    }
  }

  return questions;
}

function getScreenshotsForJourney(journeySlug) {
  const journeyScreenshotDir = path.join(SCREENSHOTS_DIR, journeySlug);

  if (!fs.existsSync(journeyScreenshotDir)) {
    return [];
  }

  const files = fs
    .readdirSync(journeyScreenshotDir)
    .filter((f) => f.endsWith('.png') || f.endsWith('.jpg'))
    .sort();

  return files.map((filename, index) => ({
    id: `${journeySlug}-${index + 1}`,
    journeySlug,
    stepNumber: index + 1,
    filename,
    url: `/api/demo/screenshots/${journeySlug}/${filename}`,
    thumbnailUrl: `/api/demo/screenshots/${journeySlug}/${filename}?thumb=true`,
    capturedAt: new Date().toISOString(),
  }));
}

function getAllJourneys() {
  if (!fs.existsSync(JOURNEYS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(JOURNEYS_DIR).filter((f) => f.endsWith('.md'));

  return files.map((filename) => {
    const slug = filename.replace('.md', '');
    const content = fs.readFileSync(path.join(JOURNEYS_DIR, filename), 'utf-8');
    const { frontmatter } = parseFrontmatter(content);
    const steps = parseStepTable(content);
    const screenshots = getScreenshotsForJourney(slug);

    return {
      slug,
      title: frontmatter.title || slug,
      description: frontmatter.description || '',
      duration: frontmatter.duration || '60s',
      target: frontmatter.target || '',
      stepCount: steps.length,
      hasScreenshots: screenshots.length > 0,
      thumbnailUrl: screenshots.length > 0 ? screenshots[0].thumbnailUrl : null,
    };
  });
}

function getJourneyBySlug(slug) {
  const filepath = path.join(JOURNEYS_DIR, `${slug}.md`);

  if (!fs.existsSync(filepath)) {
    return null;
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  const { frontmatter } = parseFrontmatter(content);

  return {
    slug,
    title: frontmatter.title || slug,
    description: frontmatter.description || '',
    duration: frontmatter.duration || '60s',
    target: frontmatter.target || '',
    preConditions: parsePreConditions(content),
    steps: parseStepTable(content),
    narration: parseNarration(content),
    backupPlan: parseBackupPlan(content),
    expectedQuestions: parseExpectedQuestions(content),
    screenshots: getScreenshotsForJourney(slug),
  };
}

export {
  getAllJourneys,
  getJourneyBySlug,
  getScreenshotsForJourney,
  JOURNEYS_DIR,
  SCREENSHOTS_DIR,
};
