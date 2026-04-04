import * as fs from 'fs';
import * as path from 'path';
import { FOCUS_AREAS, type FocusArea } from '../highlights/FOCUS_AREAS';

const SLIDES_DIR = path.join(__dirname, '../slides/highlights');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generateSlideMDX(area: FocusArea): string {
  let md = '# ' + area.name + ' - Investor Highlight\n\n';
  md += '> ' + area.tagline + '\n\n';
  md += '**Investor Type:** ' + area.investorType + ' | **Demo Time:** ' + area.demoTime + '\n\n';
  md += '---\n\n## Hook\n\n' + area.narrative.hook + '\n\n---\n\n## Narrative\n\n';
  for (const b of area.narrative.body) {
    md += '- ' + b + '\n';
  }
  md += '\n**Close:** ' + area.narrative.close + '\n\n---\n\n## Demo Flows\n\n';
  for (let fi = 0; fi < area.flows.length; fi++) {
    const flow = area.flows[fi];
    md += '### ' + (fi + 1) + '. ' + flow.name + '\n\n';
    for (const page of flow.pages) {
      md += '- **' + page.label + '** -> `' + page.path + '`';
      if (page.notes) md += ' <- ' + page.notes;
      md += '\n';
    }
    md += '\n';
  }
  md += '---\n\n## Search Queries\n\n';
  for (const q of area.searchQueries) {
    md += '- `' + q + '`\n';
  }
  return md;
}

function generateScript(area: FocusArea): string {
  let text = '================================================================\n';
  text += 'VIVIM DEMO SCRIPT: ' + area.name.toUpperCase() + '\n';
  text += '================================================================\n\n';
  text += 'Tagline: ' + area.tagline + '\n';
  text += 'Investor Type: ' + area.investorType + '\n';
  text += 'Target Time: ' + area.demoTime + '\n\n';
  text += '----------------------------------------------------------------\n';
  text += 'NARRATIVE\n';
  text += '----------------------------------------------------------------\n\n';
  text += '[HOOK] ' + area.narrative.hook + '\n\n';
  for (let i = 0; i < area.narrative.body.length; i++) {
    text += '[' + (i + 1) + '] ' + area.narrative.body[i] + '\n\n';
  }
  text += '[CLOSE] ' + area.narrative.close + '\n\n';
  text += '----------------------------------------------------------------\n';
  text += 'CLICK SCRIPT\n';
  text += '----------------------------------------------------------------\n\n';
  for (let fi = 0; fi < area.flows.length; fi++) {
    const flow = area.flows[fi];
    text += '[' + (fi + 1) + '] ' + flow.name + '\n';
    for (const page of flow.pages) {
      const note = page.notes ? ' -> ' + page.notes : '';
      text += '  ' + page.label.padEnd(30) + ' ' + page.path + note + '\n';
    }
    text += '\n';
  }
  text += '----------------------------------------------------------------\n';
  text += 'SEARCH QUERIES TO VERIFY\n';
  text += '----------------------------------------------------------------\n\n';
  for (const q of area.searchQueries) {
    text += '  "' + q + '"\n';
  }
  text += '\n';
  text += '----------------------------------------------------------------\n';
  text += 'PRE-DEMO CHECKLIST\n';
  text += '----------------------------------------------------------------\n\n';
  text += '[ ] Seed reset complete\n';
  text += '[ ] Embeddings pre-computed\n';
  text += '[ ] All pages load without errors\n';
  text += '[ ] Search queries verified\n';
  text += '[ ] Loom backup recorded\n';
  text += '[ ] Practiced 3+ times\n\n';
  return text;
}

async function main() {
  ensureDir(SLIDES_DIR);

  const areas = Object.values(FOCUS_AREAS);
  console.log('\nVIVIM Demo Suite - Generating slides and scripts\n');
  console.log('='.repeat(60));

  for (const area of areas) {
    const areaDir = path.join(SLIDES_DIR, area.id);
    ensureDir(areaDir);

    const mdxPath = path.join(areaDir, area.id + '-slides.md');
    const scriptPath = path.join(areaDir, area.id + '-script.txt');

    fs.writeFileSync(mdxPath, generateSlideMDX(area));
    fs.writeFileSync(scriptPath, generateScript(area));

    const short = 'slides/highlights/' + area.id;
    console.log('  ' + area.name.padEnd(18) + ' -> ' + short + '/' + area.id + '-slides.md');
    console.log('                    ' + short + '/' + area.id + '-script.txt');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\nDone! ' + areas.length + ' focus areas generated.\n');
}

main().catch(function(err) {
  console.error('Failed:', err);
  process.exit(1);
});
