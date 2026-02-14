#!/usr/bin/env node
// @bun

// cli.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __filename2 = fileURLToPath(import.meta.url);
var __dirname2 = path.dirname(__filename2);
var CATEGORIES = [
  "actions",
  "acu",
  "acu-evolution",
  "analytics",
  "backend",
  "collaboration",
  "content",
  "editor",
  "files",
  "knowledge-graph",
  "knowledgebase",
  "navigation",
  "providers",
  "security",
  "settings",
  "social",
  "status",
  "sync"
];
function getAllIcons() {
  const icons = [];
  CATEGORIES.forEach((category) => {
    const categoryPath = path.join(__dirname2, category);
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath);
      files.forEach((file) => {
        if (file.endsWith(".tsx") && file !== "index.tsx" && file !== "index.ts") {
          const iconName = file.replace(".tsx", "");
          const kebabCaseName = iconName.replace(/([A-Z])/g, "-$1").substring(1).toLowerCase();
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
function showHelp() {
  console.log(`VIVIM Icon Library CLI

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
  `);
}
function listIcons() {
  const icons = getAllIcons();
  console.log(`
Found ` + icons.length + ` icons:
`);
  const groupedIcons = {};
  icons.forEach((icon) => {
    if (!groupedIcons[icon.category]) {
      groupedIcons[icon.category] = [];
    }
    groupedIcons[icon.category].push(icon);
  });
  Object.keys(groupedIcons).sort().forEach((category) => {
    console.log(`
` + category.toUpperCase() + ":");
    groupedIcons[category].forEach((icon) => {
      console.log("  - " + icon.name);
    });
  });
}
function searchIcons(term) {
  const icons = getAllIcons();
  const matchedIcons = icons.filter((icon) => icon.name.toLowerCase().includes(term.toLowerCase()) || icon.category.toLowerCase().includes(term.toLowerCase()));
  if (matchedIcons.length === 0) {
    console.log(`
No icons found matching "` + term + '"');
    return;
  }
  console.log(`
Found ` + matchedIcons.length + ' icons matching "' + term + `":
`);
  const groupedIcons = {};
  matchedIcons.forEach((icon) => {
    if (!groupedIcons[icon.category]) {
      groupedIcons[icon.category] = [];
    }
    groupedIcons[icon.category].push(icon);
  });
  Object.keys(groupedIcons).sort().forEach((category) => {
    console.log(`
` + category.toUpperCase() + ":");
    groupedIcons[category].forEach((icon) => {
      console.log("  - " + icon.name);
    });
  });
}
function getIconInfo(iconName) {
  const icons = getAllIcons();
  const icon = icons.find((i) => i.name === iconName);
  if (!icon) {
    console.log(`
Icon "` + iconName + '" not found.');
    return;
  }
  const fileContent = fs.readFileSync(icon.filePath, "utf-8");
  const sizeMatch = fileContent.match(/size\\s*=\\s*(\\d+)/);
  const defaultSize = sizeMatch ? sizeMatch[1] : "24";
  const hasFill = fileContent.includes("fill=");
  console.log(`
Icon Information for "` + icon.name + '":');
  console.log("  Category: " + icon.category);
  console.log("  File: " + icon.filePath);
  console.log("  Default Size: " + defaultSize + "px");
  console.log("  Has Fill Option: " + (hasFill ? "Yes" : "No"));
  console.log("  Available Props: size, color, strokeWidth, className, style, ...rest");
}
function listCategories() {
  console.log(`
Available icon categories:`);
  CATEGORIES.forEach((category) => {
    console.log("  - " + category);
  });
}
function previewIcon(iconName) {
  const icons = getAllIcons();
  const icon = icons.find((i) => i.name === iconName);
  if (!icon) {
    console.log(`
Icon "` + iconName + '" not found.');
    return;
  }
  console.log(`
Code snippet for "` + icon.name + `":
`);
  console.log("import { Icon } from '@vivim/icons';");
  console.log(`
// Usage in JSX:`);
  console.log('<Icon name="' + icon.name + '" size={24} />');
  console.log(`
// Or with additional props:`);
  console.log('<Icon name="' + icon.name + `" size={32} color="#3b82f6" onClick={() => console.log('Clicked!')} />`);
}
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    showHelp();
    return;
  }
  const command = args[0].toLowerCase();
  switch (command) {
    case "list":
      listIcons();
      break;
    case "search":
      if (args.length < 2) {
        console.log("\\nError: Please provide a search term");
        console.log("Usage: npx @vivim/icons search <term>");
        return;
      }
      searchIcons(args[1]);
      break;
    case "info":
      if (args.length < 2) {
        console.log("\\nError: Please provide an icon name");
        console.log("Usage: npx @vivim/icons info <icon-name>");
        return;
      }
      getIconInfo(args[1]);
      break;
    case "categories":
      listCategories();
      break;
    case "preview":
      if (args.length < 2) {
        console.log("\\nError: Please provide an icon name");
        console.log("Usage: npx @vivim/icons preview <icon-name>");
        return;
      }
      previewIcon(args[1]);
      break;
    case "help":
    case "--help":
    case "-h":
      showHelp();
      break;
    default:
      console.log(`
Unknown command: ` + command);
      showHelp();
      break;
  }
}
main();
