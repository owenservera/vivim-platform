# VIVIM Icon Library

The VIVIM Icon Library is a comprehensive collection of custom SVG icons designed specifically for the VIVIM application. This library includes over 400+ icons covering all aspects of the application's UI needs.

## Installation

```bash
# If using as a package
npm install @vivim/icons
```

Or copy the entire `ICONS` directory to your project.

## Usage

### React Components

Each icon is exported as a React component:

```tsx
import { HomeFeed, Search, VaultClosed, UserProfile } from '@vivim/icons/navigation';
import { AddPlus, EditPencil, DeleteTrash, CopyDuplicate } from '@vivim/icons/actions';
import { HeartLike, ForkBranch, BookmarkRibbon } from '@vivim/icons/social';

// Basic usage
<HomeFeed size={24} />
<Search size={18} color="#6366F1" />
<VaultClosed size={32} />
<UserProfile size={20} />

// With click handler
<EditPencil size={16} onClick={() => console.log('Edit clicked')} />
```

### Icon Component

The library also provides a generic `Icon` component that accepts a name prop:

```tsx
import { Icon } from '@vivim/icons';

// Using the generic Icon component
<Icon name="home-feed" size={24} />
<Icon name="heart-like" size="lg" filled={true} />
<Icon name="settings-cog" size={20} onClick={handleSettings} />
```

## Icon Categories

The library is organized into the following categories:

- **Navigation**: Core app navigation icons
- **Actions**: Common action buttons
- **Social**: Engagement and sharing icons
- **Content**: ACU type indicators
- **Providers**: AI service logos
- **Status**: State and feedback icons
- **Security**: Privacy and protection icons
- **Settings**: Configuration icons
- **Editor**: Text editing operations
- **Files**: Storage and documents
- **Backend**: Server-side operations
- **ACU**: Atomic Chat Unit specific
- **Collaboration**: Forking and collaboration
- **Knowledge Graph**: VaultSense features
- **Knowledgebase**: Personal knowledgebase
- **ACU Evolution**: ACU management
- **Sync**: Synchronization states
- **Analytics**: Metrics and analytics

## Props

### Individual Icon Components
- `size`: number - Icon size in pixels (default: 24)
- `color`: string - Icon color (default: currentColor)
- `strokeWidth`: number - Stroke width (default: 1.5)
- `className`: string - Additional CSS classes
- `style`: object - Additional inline styles
- `...rest`: All other props are spread to the SVG element

### Generic Icon Component
- `name`: string - Icon name to display
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number - Size preset or pixel value
- `filled`: boolean - Whether to use filled variant
- `color`: string - Icon color
- `strokeWidth`: number - Stroke width
- `onClick`: () => void - Click handler
- `ariaLabel`: string - Accessibility label
- `className`: string - Additional CSS classes
- `style`: object - Additional inline styles

## Size Reference

- `xs`: 12px
- `sm`: 16px
- `md`: 18px (default)
- `lg`: 20px
- `xl`: 24px
- `2xl`: 32px
- `3xl`: 48px

## Contributing

To add new icons:

1. Create the SVG component in the appropriate category directory
2. Add the export to the category's index.ts file
3. Update the main index.ts if needed
4. Follow the naming conventions outlined in the specification

## Development Tools

### Icon Viewer

A simple viewer is available to browse all icons in the library:

```bash
# Install dependencies
bun install

# Run the viewer
bun run viewer
```

Alternatively, you can open the `simple-viewer.html` file directly in your browser to view all icons with search and filtering capabilities.

The viewer provides:
- Search functionality to find specific icons
- Category filtering
- Size adjustment
- Visual display of all available icons

### Command Line Interface (CLI)

The library includes a CLI tool for automated use by AI Agentic coders and developers:

```bash
# Run the CLI directly with Bun
bun ./cli.mjs [command]

# Or run via npm script
bun run cli [command]
```

#### CLI Commands

- `list` - List all available icons
- `search <term>` - Search for icons containing the specified term
- `info <icon-name>` - Get detailed information about a specific icon
- `categories` - List all icon categories
- `preview <icon-name>` - Generate code snippet to use the icon
- `help` - Show help information

#### CLI Examples

```bash
# List all icons
bun ./cli.mjs list

# Search for home-related icons
bun ./cli.mjs search "home"

# Get information about a specific icon
bun ./cli.mjs info "home-feed"

# Preview how to use an icon in code
bun ./cli.mjs preview "settings-cog"
```

## License

MIT