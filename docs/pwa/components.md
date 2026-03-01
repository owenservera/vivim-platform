# UI Components

VIVIM PWA uses a rich library of React components, divided into core primitives, feature-specific modules, and advanced visualizations.

## Core Primitives (`pwa/src/components/ui/`)
Standard building blocks for the user interface.
- **Button** - Multi-variant action button.
- **Input / Textarea** - Standard form controls.
- **Card** - Container for grouped content.
- **Badge** - Status and label indicator.
- **Modal / Dropdown Menu** - Overlay components.
- **Skeleton** - Loading states.
- **Toast** - Notification system.

## AI & Context Components (`pwa/src/components/`)
Components specifically designed for VIVIM's AI memory features.
- **ACUViewer / ACUGraph** - Visualizing Atomic Context Units.
- **ContextCockpit** - The main dashboard for managing active context.
- **AIChat / BlockchainAIChat** - Chat interfaces with context integration.
- **OmniComposer** - Advanced message drafting with AI assistance.
- **SuggestionMenu** - Real-time AI suggestions during drafting.

## Knowledge Graph & Visualization
- **KnowledgeGraph** - Interactive visualization of the user's memory graph.
- **DAGMaterializer** - Visualizing Directed Acyclic Graphs of conversation flows.
- **ContextVisualizer** - Real-time 3D/2D visualization of context allocation.

## Network & System
- **SyncIndicator** - Real-time feedback on P2P synchronization status.
- **ConnectionIndicator** - Shows status of connection to the VIVIM network.
- **DebugPanel** - Advanced diagnostics for developers.
- **DataFlowPanel** - Visualizing data movement through the local pipeline.

## Social & Sharing
- **ShareMenu / ShareSheet** - Controls for sharing memories via ActivityPub or DID.
- **CircleManager** - Managing social trust circles.
- **Stories / Reels** - Short-form content visualization for shared memories.

## Implementation Details

Most components are built with **TypeScript** and **Tailwind CSS**, following a consistent design system defined in `pwa/src/styles/`.
