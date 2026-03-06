import fs from 'fs';
import path from 'path';

const sdkSrc = 'C:/0-BlackBoxProject-0/vivim-app-og/vivim-app/sdk/src';

function walk(dir: string, callback: (file: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else if (fullPath.endsWith('.ts')) {
      callback(fullPath);
    }
  }
}

walk(sdkSrc, (file) => {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Remove the XX| prefixes
  const newContent = content.replace(/^[A-Z]{2}\|/gm, '');
  
  if (content !== newContent) {
    console.log(`Cleaned up prefixes in ${file}`);
    fs.writeFileSync(file, newContent);
  }
});

// Specific fix for sdk/src/core/constants.ts
const constantsPath = path.join(sdkSrc, 'core/constants.ts');
if (fs.existsSync(constantsPath)) {
  let content = fs.readFileSync(constantsPath, 'utf-8');
  // It has a duplicate BUILTIN_NODES block
  // We'll use a more robust replacement for the specific duplication we saw
  const duplicatePattern = /} as const;\r?\n\r?\n\s+IDENTITY: '@vivim\/node-identity',\r?\n\s+STORAGE: '@vivim\/node-storage',\r?\n\s+CONTENT: '@vivim\/node-content',\r?\n\s+SOCIAL: '@vivim\/node-social',\r?\n\s+AI_CHAT: '@vivim\/node-ai-chat',\r?\n\s+MEMORY: '@vivim\/node-memory',\r?\n\s+CAPTURE: '@vivim\/node-capture',\r?\n\s+ANALYTICS: '@vivim\/node-analytics',\r?\n} as const;/;
  
  const cleaned = content.replace(duplicatePattern, '} as const;');
  if (content !== cleaned) {
     console.log(`Cleaned up duplicate BUILTIN_NODES in constants.ts`);
     fs.writeFileSync(constantsPath, cleaned);
  }
}
