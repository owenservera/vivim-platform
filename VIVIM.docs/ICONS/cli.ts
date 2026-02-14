#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define icon categories
const CATEGORIES = [
  'actions', 'acu', 'acu-evolution', 'analytics', 'backend', 
  'collaboration', 'content', 'editor', 'files', 'knowledge-graph', 
  'knowledgebase', 'navigation', 'providers', 'security', 
  'settings', 'social', 'status', 'sync'
];

// Function to get all icon names from all categories
function getAllIcons(): { name: string; category: string; filePath: string }[] {
  const icons: { name: string; category: string; filePath: string }[] = [];
  
  CATEGORIES.forEach(category => {
    const categoryPath = path.join(__dirname, category);
    
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath);
      
      files.forEach(file => {
        if (file.endsWith('.tsx') && file !== 'index.tsx' && file !== 'index.ts') {
          const iconName = file.replace('.tsx', '');
          // Convert PascalCase to kebab-case for the icon name
          const kebabCaseName = iconName
            .replace(/([A-Z])/g, '-$1')
            .substring(1)
            .toLowerCase();
            
          icons.push({
            name: kebabCaseName,
            category,
            filePath: path.join(categoryPath, file)
          });
        }
      });
    }
  });
  
  return icons;
}

// Function to display help information
function showHelp() {
  console.log(
`VIVIM Icon Library CLI

Usage: npx @vivim/icons [command] [options]

Commands:
  list                    List all available icons
  search <term>           Search for icons containing the specified term
  info <icon-name>        Get detailed information about a specific icon
  categories             List all icon categories
  preview <icon-name>    Generate code snippet to use the icon
  help                   Show this help message

Examples:
  npx @vivim/icons list
  npx @vivim/icons search "home"
  npx @vivim/icons info "home-feed"
  npx @vivim/icons categories
  npx @vivim/icons preview "settings-cog"
  `
  );
}

// Function to list all icons
function listIcons() {
  const icons = getAllIcons();

  console.log('\nFound ' + icons.length + ' icons:\n');

  const groupedIcons: Record<string, typeof icons> = {};

  icons.forEach(icon => {
    if (!groupedIcons[icon.category]) {
      groupedIcons[icon.category] = [];
    }
    groupedIcons[icon.category].push(icon);
  });

  Object.keys(groupedIcons).sort().forEach(category => {
    console.log('\n' + category.toUpperCase() + ':');
    groupedIcons[category].forEach(icon => {
      console.log('  - ' + icon.name);
    });
  });
}

// Function to search for icons
function searchIcons(term: string) {
  const icons = getAllIcons();
  const matchedIcons = icons.filter(icon =>
    icon.name.toLowerCase().includes(term.toLowerCase()) ||
    icon.category.toLowerCase().includes(term.toLowerCase())
  );

  if (matchedIcons.length === 0) {
    console.log('\nNo icons found matching "' + term + '"');
    return;
  }

  console.log('\nFound ' + matchedIcons.length + ' icons matching "' + term + '":\n');

  const groupedIcons: Record<string, typeof matchedIcons> = {};

  matchedIcons.forEach(icon => {
    if (!groupedIcons[icon.category]) {
      groupedIcons[icon.category] = [];
    }
    groupedIcons[icon.category].push(icon);
  });

  Object.keys(groupedIcons).sort().forEach(category => {
    console.log('\n' + category.toUpperCase() + ':');
    groupedIcons[category].forEach(icon => {
      console.log('  - ' + icon.name);
    });
  });
}

// Function to get information about a specific icon
function getIconInfo(iconName: string) {
  const icons = getAllIcons();
  const icon = icons.find(i => i.name === iconName);

  if (!icon) {
    console.log('\nIcon "' + iconName + '" not found.');
    return;
  }

  // Read the icon file to get more details
  const fileContent = fs.readFileSync(icon.filePath, 'utf-8');

  // Extract size information from the default parameter
  const sizeMatch = fileContent.match(/size\\s*=\\s*(\\d+)/);
  const defaultSize = sizeMatch ? sizeMatch[1] : '24';

  // Check if the icon has a filled variant by looking for fill attributes
  const hasFill = fileContent.includes('fill=');

  console.log('\nIcon Information for "' + icon.name + '":');
  console.log('  Category: ' + icon.category);
  console.log('  File: ' + icon.filePath);
  console.log('  Default Size: ' + defaultSize + 'px');
  console.log('  Has Fill Option: ' + (hasFill ? 'Yes' : 'No'));
  console.log('  Available Props: size, color, strokeWidth, className, style, ...rest');
}

// Function to list all categories
function listCategories() {
  console.log('\nAvailable icon categories:');
  CATEGORIES.forEach(category => {
    console.log('  - ' + category);
  });
}

// Function to generate a code snippet for using an icon
function previewIcon(iconName: string) {
  const icons = getAllIcons();
  const icon = icons.find(i => i.name === iconName);

  if (!icon) {
    console.log('\nIcon "' + iconName + '" not found.');
    return;
  }

  console.log('\nCode snippet for "' + icon.name + '":\n');
  console.log("import { Icon } from '@vivim/icons';");
  console.log('\n// Usage in JSX:');
  console.log('<Icon name="' + icon.name + '" size={24} />');
  console.log('\n// Or with additional props:');
  console.log('<Icon name="' + icon.name + '" size={32} color="#3b82f6" onClick={() => console.log(\'Clicked!\')} />');
}

// Main function to handle CLI commands
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }
  
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'list':
      listIcons();
      break;
      
    case 'search':
      if (args.length < 2) {
        console.log('\\nError: Please provide a search term');
        console.log('Usage: npx @vivim/icons search <term>');
        return;
      }
      searchIcons(args[1]);
      break;
      
    case 'info':
      if (args.length < 2) {
        console.log('\\nError: Please provide an icon name');
        console.log('Usage: npx @vivim/icons info <icon-name>');
        return;
      }
      getIconInfo(args[1]);
      break;
      
    case 'categories':
      listCategories();
      break;
      
    case 'preview':
      if (args.length < 2) {
        console.log('\\nError: Please provide an icon name');
        console.log('Usage: npx @vivim/icons preview <icon-name>');
        return;
      }
      previewIcon(args[1]);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.log('\nUnknown command: ' + command);
      showHelp();
      break;
  }
}

// Run the CLI
main();