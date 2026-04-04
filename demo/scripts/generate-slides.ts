import * as fs from 'fs';
import * as path from 'path';

interface Slide {
  title: string;
  subtitle?: string;
  image?: string;
  content?: string;
  notes?: string;
  code?: string;
  layout?: 'default' | 'center' | 'split' | 'dark';
}

interface SlideTemplate {
  name: string;
  description: string;
  theme: 'light' | 'dark';
  slides: Slide[];
}

const INVESTOR_DECK: SlideTemplate = {
  name: 'VIVIM Investor Pitch Deck',
  description: '90-second investor demo presentation',
  theme: 'dark',
  slides: [
    {
      title: 'The Problem',
      subtitle: 'Every AI power user lives here',
      content: 'Browser tabs filled with ChatGPT, Claude, Gemini...\n\nThis is where your most valuable thinking goes to die.',
      layout: 'center',
    },
    {
      title: 'VIVIM',
      subtitle: 'Own Your AI Brain',
      content: 'Capture. Organize. Surface.\nYour AI conversations, unified.',
      layout: 'center',
    },
    {
      title: 'The Archive',
      image: 'screenshots/investor/investor-home.png',
      content: '9 AI providers. Weeks of conversations. Fully organized.',
      layout: 'split',
    },
    {
      title: 'Knowledge Graph',
      image: 'screenshots/investor/investor-graph.png',
      content: 'What if your AI conversations could remember each other?',
      layout: 'split',
    },
    {
      title: 'Context Cockpit',
      image: 'screenshots/investor/investor-conversation.png',
      content: "It knows you.\nNot because you told it.\nBecause it's been watching you think.",
      layout: 'split',
    },
    {
      title: 'The Vision',
      subtitle: 'You own your AI brain.',
      content: 'Decentralized. Private. Permanent.\n\nVIVIM.',
      layout: 'center',
    },
  ],
};

const TECHNICAL_DECK: SlideTemplate = {
  name: 'VIVIM Technical Deep Dive',
  description: 'Architecture and technical details',
  theme: 'dark',
  slides: [
    {
      title: 'Architecture Overview',
      code: 'PWA (React) -> Server (Bun) -> Network (LibP2P)\n                    |\n              PostgreSQL + Redis\n                    |\n            CRDT Sync + Vector Search',
      layout: 'default',
    },
    {
      title: 'Data Flow',
      content: '1. User captures conversation URL\n2. Server fetches and parses\n3. Messages extracted into ACUs\n4. Embeddings computed\n5. Graph relationships mapped\n6. Context bundles compiled',
      layout: 'default',
    },
  ],
};

const TEMPLATES: Record<string, SlideTemplate> = {
  investor: INVESTOR_DECK,
  technical: TECHNICAL_DECK,
};

function escapeMDX(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}

function generateSlideMDX(slide: Slide): string {
  const layout = slide.layout || 'default';
  const imageSection = slide.image
    ? '\n<img src="' + slide.image + '" alt="' + slide.title + '" style="max-width: 100%; border-radius: 8px;" />\n'
    : '';
  const codeSection = slide.code
    ? '\n```\n' + slide.code + '\n```\n'
    : '';
  const notesSection = slide.notes ? '\n> Notes: ' + slide.notes + '\n' : '';

  if (layout === 'center') {
    return '## ' + slide.title + '\n' +
      (slide.subtitle ? '*' + slide.subtitle + '*\n\n' : '\n') +
      imageSection + escapeMDX(slide.content || '') + codeSection + notesSection;
  }

  if (layout === 'split') {
    return '## ' + slide.title + '\n\n' +
      imageSection + '\n' +
      escapeMDX(slide.content || '') + codeSection + notesSection;
  }

  return '## ' + slide.title + '\n' +
    (slide.subtitle ? '*' + slide.subtitle + '*\n\n' : '\n') +
    imageSection + escapeMDX(slide.content || '') + codeSection + notesSection;
}

function generateDeckMDX(template: SlideTemplate): string {
  const slidesMDX = template.slides.map(slide => '---\n' + generateSlideMDX(slide)).join('\n\n');
  return '# ' + template.name + '\n\n' + template.description + '\n\n---\n\n' + slidesMDX + '\n';
}

function buildSlideHTML(slide: Slide, i: number): string {
  const imageHtml = slide.image
    ? '<img src="' + slide.image + '" alt="' + slide.title + '" style="max-width: 100%; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);" />'
    : '';
  const codeHtml = slide.code
    ? '<pre style="background: #1a1a2e; padding: 20px; border-radius: 8px; overflow: auto; text-align: left; font-size: 14px;"><code>' + slide.code + '</code></pre>'
    : '';
  const contentLines = (slide.content || '').split('\n').join('<br/>');
  const titleHtml = slide.title ? '<h2>' + slide.title + '</h2>' : '';
  const subtitleHtml = slide.subtitle ? '<p class="subtitle">' + slide.subtitle + '</p>' : '';
  const contentHtml = contentLines ? '<p>' + contentLines + '</p>' : '';
  return '<div class="slide ' + (slide.layout || 'default') + '" id="slide-' + (i + 1) + '">' +
    titleHtml + subtitleHtml + imageHtml + contentHtml + codeHtml +
    '</div>';
}

function buildHTML(template: SlideTemplate): string {
  const slidesHtml = template.slides.map((slide, i) => buildSlideHTML(slide, i)).join('\n    ');
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>' + template.name + '</title>\n' +
    '  <style>\n' +
    '    * { margin: 0; padding: 0; box-sizing: border-box; }\n' +
    '    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0a0f; color: #fff; min-height: 100vh; }\n' +
    '    .slide { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px; text-align: center; }\n' +
    '    .slide.split { flex-direction: row; gap: 60px; text-align: left; }\n' +
    '    .slide.split img { max-width: 50%; }\n' +
    '    h2 { font-size: 3em; margin-bottom: 20px; font-weight: 700; }\n' +
    '    .subtitle { font-size: 1.5em; color: #EF9F27; margin-bottom: 30px; }\n' +
    '    p { font-size: 1.3em; line-height: 1.8; color: #B4B2A9; max-width: 600px; }\n' +
    '    pre { background: #1a1a2e; padding: 24px; border-radius: 12px; max-width: 600px; overflow: auto; }\n' +
    '    code { font-family: "SF Mono", Consolas, monospace; font-size: 14px; color: #E24B4A; }\n' +
    '    img { border-radius: 12px; }\n' +
    '  </style>\n' +
    '</head>\n<body>\n  ' + slidesHtml + '\n' +
    '  <script>\n' +
    '    let current = 0;\n' +
    '    var allSlides = document.querySelectorAll(".slide");\n' +
    '    function showSlide(n) { allSlides.forEach(function(s, i) { s.style.display = i === n ? "flex" : "none"; }); }\n' +
    '    document.addEventListener("keydown", function(e) {\n' +
    '      if (e.key === "ArrowRight" || e.key === " ") showSlide(++current % allSlides.length);\n' +
    '      if (e.key === "ArrowLeft") showSlide(--current < 0 ? allSlides.length - 1 : current);\n' +
    '    });\n' +
    '    showSlide(0);\n' +
    '  </script>\n' +
    '</body>\n</html>';
}

async function generateSlides(templateName: string): Promise<void> {
  const template = TEMPLATES[templateName];
  if (!template) {
    console.error('Unknown template: ' + templateName);
    console.log('Available: ' + Object.keys(TEMPLATES).join(', '));
    process.exit(1);
  }

  console.log('\nVIVIM Slide Generator\n');
  console.log('='.repeat(50));
  console.log('Template: ' + template.name);
  console.log('Description: ' + template.description);
  console.log('Theme: ' + template.theme);
  console.log('Slides: ' + template.slides.length);
  console.log('='.repeat(50) + '\n');

  const outputDir = path.join(__dirname, '../slides');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const mdxContent = generateDeckMDX(template);
  const outputPath = path.join(outputDir, templateName + '-deck.mdx');
  fs.writeFileSync(outputPath, mdxContent);
  console.log('Generated: ' + outputPath + ' (' + template.slides.length + ' slides)');

  const htmlOutput = path.join(outputDir, templateName + '-deck.html');
  const htmlContent = buildHTML(template);
  fs.writeFileSync(htmlOutput, htmlContent);
  console.log('Generated: ' + htmlOutput);
  console.log('\nDone! Open ' + htmlOutput + ' in a browser to view.\n');
}

const args = process.argv.slice(2);
const templateArg = args.find(function(a) { return a.startsWith('--template='); });
const templateName = templateArg ? templateArg.split('=')[1] : 'investor';

generateSlides(templateName).catch(function(err) {
  console.error('Generation failed:', err);
  process.exit(1);
});
