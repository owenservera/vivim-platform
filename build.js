// Build script for Vercel deployment
// Combines landing page with Docusaurus docs

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const DOCS_BUILD = path.join(ROOT, 'docs', 'build');

// Create dist directory
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

// Copy landing page files to dist
const landingFiles = ['index.html', 'style.css', 'script.js'];
landingFiles.forEach(file => {
  const src = path.join(ROOT, file);
  const dest = path.join(DIST, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to dist/`);
  }
});

// Copy assets directory
const assetsSrc = path.join(ROOT, 'assets');
const assetsDest = path.join(DIST, 'assets');
if (fs.existsSync(assetsSrc)) {
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
  console.log('Copied assets/ to dist/assets/');
}

// Copy docs build to dist/docs
if (fs.existsSync(DOCS_BUILD)) {
  fs.cpSync(DOCS_BUILD, path.join(DIST, 'docs'), { recursive: true });
  console.log('Copied docs/build to dist/docs/');
} else {
  console.log('Warning: docs/build not found. Run "cd docs && bun run build" first.');
}

console.log('Build complete! Output in dist/');
