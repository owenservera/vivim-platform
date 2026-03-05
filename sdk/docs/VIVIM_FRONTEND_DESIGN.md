# VIVIM Frontend Design Document

## User Sovereignty by Design

This document defines the frontend architecture that unifies VIVIM's blockchain, distributed storage, and AI interaction layer into a cohesive user experience where users have **maximal control** over their data, identity, and digital life.

---

# PART 1: DESIGN PHILOSOPHY

## 1.1 Core Principles

### User Sovereignty
```
┌─────────────────────────────────────────────────────────────────┐
│                    USER SOVEREIGNTY LAYERS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  IDENTITY SOVEREIGNTY                                    │   │
│  │  • You own your DID - no one can take it away            │   │
│  │  • You control your keys - stored locally, never shared  │   │
│  │  • You choose your identity providers (optional)         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DATA SOVEREIGNTY                                        │   │
│  │  • Your data lives where you choose                      │   │
│  │  • You control who can see each piece of content         │   │
│  │  • You can export, migrate, or delete everything         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AI SOVEREIGNTY                                          │   │
│  │  • Your AI memory belongs to you, not the provider       │   │
│  │  • You control what the AI remembers and forgets         │   │
│  │  • You can run AI locally or choose providers            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  NETWORK SOVEREIGNTY                                     │   │
│  │  • You choose your peers and storage providers           │   │
│  │  • You control your bandwidth and storage allocation     │   │
│  │  • You can go fully offline without losing functionality │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Design Tenets

| Tenet | Description | Implementation |
|-------|-------------|----------------|
| **Local-First** | All data available offline | IndexedDB + DWN sync |
| **Transparent** | Users see where data goes | Storage dashboard, data flow visualizer |
| **Granular Control** | Fine-grained permissions | Per-item visibility, per-circle sharing |
| **Reversible** | All actions can be undone | Soft deletes, version history, undo stack |
| **Exportable** | Data portability guaranteed | Full export in open formats |
| **Consent-Driven** | No dark patterns | Explicit opt-in for all sharing |

---

# PART 2: FRONTEND ARCHITECTURE

## 2.1 Application Structure

```
pwa/src/
├── app/                          # Application shell
│   ├── App.tsx                   # Root component
│   ├── Router.tsx                # Route definitions
│   └── Providers.tsx             # Context providers
│
├── features/                     # Feature-based modules
│   │
│   ├── identity/                 # Identity & Auth
│   │   ├── components/
│   │   │   ├── IdentitySetup.tsx
│   │   │   ├── KeyManager.tsx
│   │   │   ├── DIDDisplay.tsx
│   │   │   └── RecoveryFlow.tsx
│   │   ├── hooks/
│   │   │   ├── useIdentity.ts
│   │   │   └── useKeyBackup.ts
│   │   └── store/
│   │       └── identityStore.ts
│   │
│   ├── home/                     # Home/Feed
│   │   ├── components/
│   │   │   ├── Feed.tsx
│   │   │   ├── FeedItem.tsx
│   │   │   ├── StoriesBar.tsx
│   │   │   └── TrendingTopics.tsx
│   │   └── hooks/
│   │       └── useFeed.ts
│   │
│   ├── content/                  # Content Creation & Viewing
│   │   ├── components/
│   │   │   ├── ContentComposer.tsx
│   │   │   ├── MediaUploader.tsx
│   │   │   ├── ContentViewer.tsx
│   │   │   ├── Gallery.tsx
│   │   │   └── VisibilitySelector.tsx
│   │   ├── hooks/
│   │   │   ├── useContent.ts
│   │   │   └── useMediaUpload.ts
│   │   └── store/
│   │       └── contentDraftStore.ts
│   │
│   ├── storage/                  # Storage Management
│   │   ├── components/
│   │   │   ├── StorageDashboard.tsx
│   │   │   ├── StorageDeals.tsx
│   │   │   ├── PinManager.tsx
│   │   │   ├── ProviderBrowser.tsx
│   │   │   └── DataFlowVisualizer.tsx
│   │   └── hooks/
│   │       └── useStorageStatus.ts
│   │
│   ├── memory/                   # AI Memory
│   │   ├── components/
│   │   │   ├── MemoryExplorer.tsx
│   │   │   ├── MemoryCard.tsx
│   │   │   ├── MemoryEditor.tsx
│   │   │   ├── KnowledgeGraph.tsx
│   │   │   └── MemorySettings.tsx
│   │   └── hooks/
│   │       └── useMemory.ts
│   │
│   ├── ai-chat/                  # AI Chat Interface
│   │   ├── components/
│   │   │   ├── ChatThread.tsx
│   │   │   ├── ChatComposer.tsx
│   │   │   ├── MessageRenderer.tsx
│   │   │   ├── ToolCallDisplay.tsx
│   │   │   └── ModelSelector.tsx
│   │   └── hooks/
│   │       └── useChat.ts
│   │
│   ├── social/                   # Social Features
│   │   ├── components/
│   │   │   ├── Profile.tsx
│   │   │   ├── FollowGraph.tsx
│   │   │   ├── CircleManager.tsx
│   │   │   ├── CircleFeed.tsx
│   │   │   └── MemberList.tsx
│   │   └── hooks/
│   │       ├── useFollow.ts
│   │       └── useCircle.ts
│   │
│   ├── settings/                 # Settings & Control
│   │   ├── components/
│   │   │   ├── SettingsHub.tsx
│   │   │   ├── PrivacyControls.tsx
│   │   │   ├── StorageSettings.tsx
│   │   │   ├── NetworkSettings.tsx
│   │   │   ├── AIProviderSettings.tsx
│   │   │   ├── DataExport.tsx
│   │   │   └── DangerZone.tsx
│   │   └── hooks/
│   │       └── useSettings.ts
│   │
│   └── capture/                  # Content Capture
│       ├── components/
│       │   ├── CaptureQueue.tsx
│       │   ├── CaptureResult.tsx
│       │   └── CaptureSettings.tsx
│       └── hooks/
│           └── useCapture.ts
│
├── components/                   # Shared components
│   ├── ui/                       # Base UI (shadcn/radix)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MobileNav.tsx
│   │   └── CommandPalette.tsx
│   │
│   ├── content/
│   │   ├── MediaPreview.tsx
│   │   ├── ContentCard.tsx
│   │   ├── CIDLink.tsx
│   │   └── EncryptionBadge.tsx
│   │
│   ├── feedback/
│   │   ├── Toast.tsx
│   │   ├── OfflineIndicator.tsx
│   │   ├── SyncStatus.tsx
│   │   └── StorageWarning.tsx
│   │
│   └── sovereignty/              # User control components
│       ├── DataLocationPicker.tsx
│       ├── VisibilityToggle.tsx
│       ├── ConsentGate.tsx
│       ├── ExportButton.tsx
│       ├── DeleteWithConfirmation.tsx
│       └── KeyRecoveryFlow.tsx
│
├── lib/                          # Core libraries
│   ├── chain-client.ts           # VivimChainClient instance
│   ├── content-client.ts         # DistributedContentClient
│   ├── chat-runtime.ts           # VivimChatRuntime
│   ├── tool-registry.ts          # Tool registry
│   ├── stores/                   # Zustand stores
│   │   ├── appStore.ts
│   │   ├── settingsStore.ts
│   │   └── syncStore.ts
│   └── utils/
│       ├── cid.ts
│       ├── encryption.ts
│       └── storage.ts
│
└── workers/                      # Web Workers
    ├── sync-worker.ts            # Background sync
    ├── ipfs-worker.ts            # IPFS operations
    └── ai-worker.ts              # Local AI inference
```

## 2.2 State Architecture

```typescript
// lib/stores/appStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  // ============================================
  // IDENTITY STATE
  // ============================================
  identity: {
    did: string | null;
    publicKey: string | null;
    displayName: string | null;
    avatar: string | null;           // CID
    verified: boolean;
    createdAt: number | null;
  };
  
  // ============================================
  // NETWORK STATE
  // ============================================
  network: {
    status: 'connected' | 'connecting' | 'offline' | 'error';
    peerCount: number;
    lastSync: number | null;
    pendingOperations: number;
    bootstrapNodes: string[];
  };
  
  // ============================================
  // STORAGE STATE
  // ============================================
  storage: {
    // Local storage
    localUsed: number;               // Bytes
    localCapacity: number;
    
    // IPFS
    ipfsPinned: number;
    ipfsPins: string[];              // CIDs
    
    // Filecoin deals
    activeDeals: number;
    totalDealStorage: number;
    
    // Preferences
    defaultVisibility: 'public' | 'circle' | 'friends' | 'private';
    autoPinThreshold: number;        // Auto-pin items with > N likes
    preferredProviders: string[];
  };
  
  // ============================================
  // AI STATE
  // ============================================
  ai: {
    activeProvider: string;
    availableProviders: AIProvider[];
    memoryEnabled: boolean;
    memoryCategories: string[];
    contextWindowUsed: number;
    totalMemoryCount: number;
  };
  
  // ============================================
  // UI STATE
  // ============================================
  ui: {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    commandPaletteOpen: boolean;
    activeConversation: string | null;
    activeCircle: string | null;
    notifications: Notification[];
  };
  
  // ============================================
  // SOVEREIGNTY CONTROLS
  // ============================================
  sovereignty: {
    // Data location preferences
    defaultStorageLocation: 'local' | 'ipfs' | 'filecoin';
    requireExplicitConsent: boolean;
    
    // Privacy
    encryptByDefault: boolean;
    allowAnalytics: boolean;
    allowIndexing: boolean;
    
    // Export
    lastExport: number | null;
    autoExportEnabled: boolean;
    autoExportInterval: number;      // Days
  };
  
  // ============================================
  // ACTIONS
  // ============================================
  actions: {
    // Identity
    setIdentity: (identity: Partial<AppState['identity']>) => void;
    clearIdentity: () => void;
    
    // Network
    setNetworkStatus: (status: AppState['network']['status']) => void;
    updatePeerCount: (count: number) => void;
    
    // Storage
    updateStorageStats: (stats: Partial<AppState['storage']>) => void;
    addPin: (cid: string) => void;
    removePin: (cid: string) => void;
    
    // AI
    setAIProvider: (provider: string) => void;
    toggleMemory: (enabled: boolean) => void;
    
    // UI
    setTheme: (theme: AppState['ui']['theme']) => void;
    toggleSidebar: () => void;
    setActiveConversation: (id: string | null) => void;
    
    // Sovereignty
    setDefaultStorageLocation: (location: string) => void;
    setDefaultVisibility: (visibility: string) => void;
    toggleEncryptByDefault: () => void;
    
    // Export
    exportAllData: () => Promise<void>;
    importData: (file: File) => Promise<void>;
  };
}

export const useAppStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      identity: {
        did: null,
        publicKey: null,
        displayName: null,
        avatar: null,
        verified: false,
        createdAt: null,
      },
      
      network: {
        status: 'offline',
        peerCount: 0,
        lastSync: null,
        pendingOperations: 0,
        bootstrapNodes: [],
      },
      
      storage: {
        localUsed: 0,
        localCapacity: 50 * 1024 * 1024 * 1024, // 50GB
        ipfsPinned: 0,
        ipfsPins: [],
        activeDeals: 0,
        totalDealStorage: 0,
        defaultVisibility: 'friends',
        autoPinThreshold: 10,
        preferredProviders: [],
      },
      
      ai: {
        activeProvider: 'openai',
        availableProviders: [],
        memoryEnabled: true,
        memoryCategories: ['preference', 'identity', 'goal'],
        contextWindowUsed: 0,
        totalMemoryCount: 0,
      },
      
      ui: {
        theme: 'system',
        sidebarCollapsed: false,
        commandPaletteOpen: false,
        activeConversation: null,
        activeCircle: null,
        notifications: [],
      },
      
      sovereignty: {
        defaultStorageLocation: 'ipfs',
        requireExplicitConsent: true,
        encryptByDefault: true,
        allowAnalytics: false,
        allowIndexing: true,
        lastExport: null,
        autoExportEnabled: false,
        autoExportInterval: 30,
      },
      
      actions: {
        setIdentity: (identity) => set((state) => {
          Object.assign(state.identity, identity);
        }),
        
        clearIdentity: () => set((state) => {
          state.identity = {
            did: null,
            publicKey: null,
            displayName: null,
            avatar: null,
            verified: false,
            createdAt: null,
          };
        }),
        
        setNetworkStatus: (status) => set((state) => {
          state.network.status = status;
        }),
        
        updatePeerCount: (count) => set((state) => {
          state.network.peerCount = count;
        }),
        
        updateStorageStats: (stats) => set((state) => {
          Object.assign(state.storage, stats);
        }),
        
        addPin: (cid) => set((state) => {
          if (!state.storage.ipfsPins.includes(cid)) {
            state.storage.ipfsPins.push(cid);
          }
        }),
        
        removePin: (cid) => set((state) => {
          state.storage.ipfsPins = state.storage.ipfsPins.filter(c => c !== cid);
        }),
        
        setAIProvider: (provider) => set((state) => {
          state.ai.activeProvider = provider;
        }),
        
        toggleMemory: (enabled) => set((state) => {
          state.ai.memoryEnabled = enabled;
        }),
        
        setTheme: (theme) => set((state) => {
          state.ui.theme = theme;
        }),
        
        toggleSidebar: () => set((state) => {
          state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
        }),
        
        setActiveConversation: (id) => set((state) => {
          state.ui.activeConversation = id;
        }),
        
        setDefaultStorageLocation: (location) => set((state) => {
          state.sovereignty.defaultStorageLocation = location as any;
        }),
        
        setDefaultVisibility: (visibility) => set((state) => {
          state.storage.defaultVisibility = visibility as any;
        }),
        
        toggleEncryptByDefault: () => set((state) => {
          state.sovereignty.encryptByDefault = !state.sovereignty.encryptByDefault;
        }),
        
        exportAllData: async () => {
          const chainClient = getChainClient();
          const data = await chainClient.exportAllData();
          downloadJSON(data, `vivim-export-${Date.now()}.json`);
          set((state) => {
            state.sovereignty.lastExport = Date.now();
          });
        },
        
        importData: async (file) => {
          const data = await readJSONFile(file);
          const chainClient = getChainClient();
          await chainClient.importData(data);
        },
      },
    })),
    {
      name: 'vivim-app-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        identity: state.identity,
        storage: state.storage,
        ai: state.ai,
        ui: state.ui,
        sovereignty: state.sovereignty,
      }),
    }
  )
);
```

---

# PART 3: USER CONTROL INTERFACE

## 3.1 Sovereignty Dashboard

The central hub for user control:

```typescript
// features/settings/components/SettingsHub.tsx

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SettingsHub() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Your Digital Sovereignty</h1>
        <p className="text-muted-foreground">
          Complete control over your identity, data, and digital presence
        </p>
      </header>
      
      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>
        
        <TabsContent value="identity">
          <IdentitySettings />
        </TabsContent>
        
        <TabsContent value="data">
          <DataControlPanel />
        </TabsContent>
        
        <TabsContent value="storage">
          <StorageDashboard />
        </TabsContent>
        
        <TabsContent value="privacy">
          <PrivacyControls />
        </TabsContent>
        
        <TabsContent value="ai">
          <AIProviderSettings />
        </TabsContent>
        
        <TabsContent value="network">
          <NetworkSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 3.2 Identity Control Panel

```typescript
// features/identity/components/IdentitySettings.tsx

export function IdentitySettings() {
  const { identity, actions } = useAppStore();
  const [showRecovery, setShowRecovery] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* DID Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Your Decentralized Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={identity.avatar ? `ipfs://${identity.avatar}` : undefined} />
              <AvatarFallback>{identity.displayName?.[0] || '?'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Input
                value={identity.displayName || ''}
                onChange={(e) => actions.setIdentity({ displayName: e.target.value })}
                placeholder="Display Name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Your DID</label>
            <div className="flex gap-2">
              <code className="flex-1 p-3 bg-muted rounded-md text-sm break-all">
                {identity.did || 'No DID generated'}
              </code>
              <Button variant="outline" size="icon">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {identity.verified ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unverified
              </Badge>
            )}
            <span className="text-muted-foreground">
              Created {identity.createdAt ? new Date(identity.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Key Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Key Management
          </CardTitle>
          <CardDescription>
            Your keys are stored locally and never leave your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              If you lose your keys and don't have a backup, your identity will be permanently lost.
              There is no "forgot password" option.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto py-4">
              <div className="text-center">
                <Download className="w-6 h-6 mx-auto mb-2" />
                <span className="font-medium">Backup Keys</span>
                <p className="text-xs text-muted-foreground">Download encrypted backup</p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto py-4">
              <div className="text-center">
                <Upload className="w-6 h-6 mx-auto mb-2" />
                <span className="font-medium">Restore Keys</span>
                <p className="text-xs text-muted-foreground">Import from backup</p>
              </div>
            </Button>
          </div>
          
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={() => setShowRecovery(true)}
          >
            <ShieldAlert className="w-4 h-4 mr-2" />
            Generate Recovery Phrase
          </Button>
        </CardContent>
      </Card>
      
      {/* Identity Providers (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification (Optional)</CardTitle>
          <CardDescription>
            Link external identities to enhance trust (completely optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <IdentityLinkButton 
              provider="github"
              linked={false}
              onLink={() => {}}
            />
            <IdentityLinkButton 
              provider="twitter"
              linked={false}
              onLink={() => {}}
            />
            <IdentityLinkButton 
              provider="ethereum"
              linked={false}
              onLink={() => {}}
            />
          </div>
        </CardContent>
      </Card>
      
      {showRecovery && <RecoveryFlow onClose={() => setShowRecovery(false)} />}
    </div>
  );
}
```

## 3.3 Data Control Panel

```typescript
// features/settings/components/DataControlPanel.tsx

export function DataControlPanel() {
  const { sovereignty, storage, actions } = useAppStore();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Data Location Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Where Your Data Lives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataLocationVisualizer />
          
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Storage Location</label>
              <Select 
                value={sovereignty.defaultStorageLocation}
                onValueChange={actions.setDefaultStorageLocation}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      <span>Local Only (Offline-First)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ipfs">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>IPFS Network (Public/Shared)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="filecoin">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span>Filecoin (Permanent Storage)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Data Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Your Data Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DataInventoryCard
              icon={<MessageSquare className="w-5 h-5" />}
              label="Conversations"
              count={247}
              size="12.4 MB"
              onClick={() => {}}
            />
            <DataInventoryCard
              icon={<Lightbulb className="w-5 h-5" />}
              label="Knowledge Units"
              count={1834}
              size="4.2 MB"
              onClick={() => {}}
            />
            <DataInventoryCard
              icon={<ImageIcon className="w-5 h-5" />}
              label="Media Files"
              count={89}
              size="1.2 GB"
              onClick={() => {}}
            />
            <DataInventoryCard
              icon={<Brain className="w-5 h-5" />}
              label="AI Memories"
              count={456}
              size="2.1 MB"
              onClick={() => {}}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Data Portability
          </CardTitle>
          <CardDescription>
            Your data belongs to you. Export it anytime in open formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-6"
              disabled={exporting}
              onClick={async () => {
                setExporting(true);
                try {
                  await actions.exportAllData();
                } finally {
                  setExporting(false);
                }
              }}
            >
              <div className="text-center">
                {exporting ? (
                  <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                ) : (
                  <Download className="w-6 h-6 mx-auto mb-2" />
                )}
                <span className="font-medium">Export Everything</span>
                <p className="text-xs text-muted-foreground">
                  JSON + IPFS CIDs
                </p>
              </div>
            </Button>
            
            <div>
              <Input
                type="file"
                accept=".json"
                className="hidden"
                id="import-file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImporting(true);
                    try {
                      await actions.importData(file);
                    } finally {
                      setImporting(false);
                    }
                  }
                }}
                disabled={importing}
              />
              <Button 
                variant="outline" 
                className="h-auto py-6 w-full"
                disabled={importing}
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <div className="text-center">
                  {importing ? (
                    <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 mx-auto mb-2" />
                  )}
                  <span className="font-medium">Import Data</span>
                  <p className="text-xs text-muted-foreground">
                    Restore from backup
                  </p>
                </div>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox id="auto-export" />
            <label htmlFor="auto-export" className="text-sm">
              Auto-export every {sovereignty.autoExportInterval} days
            </label>
          </div>
          
          {sovereignty.lastExport && (
            <p className="text-sm text-muted-foreground">
              Last export: {new Date(sovereignty.lastExport).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Data Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Data Flow
          </CardTitle>
          <CardDescription>
            See exactly where your data goes when you interact with the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataFlowVisualizer />
        </CardContent>
      </Card>
      
      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
            <div>
              <p className="font-medium">Delete All Data</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete all your data. This cannot be undone.
              </p>
            </div>
            <DeleteWithConfirmation
              title="Delete Everything?"
              description="This will permanently delete all your content, memories, and conversations from this device and request deletion from all storage providers."
              onConfirm={async () => {
                // Delete all data
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 3.4 Privacy Controls

```typescript
// features/settings/components/PrivacyControls.tsx

export function PrivacyControls() {
  const { sovereignty, storage, actions } = useAppStore();
  
  return (
    <div className="space-y-6">
      {/* Default Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Default Visibility
          </CardTitle>
          <CardDescription>
            Control who sees your new content by default
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={storage.defaultVisibility}
            onValueChange={actions.setDefaultVisibility}
            className="space-y-3"
          >
            <VisibilityOption
              value="private"
              icon={<Lock className="w-5 h-5" />}
              title="Private"
              description="Only you can see this content"
            />
            <VisibilityOption
              value="friends"
              icon={<Users className="w-5 h-5" />}
              title="Friends"
              description="Only your confirmed friends can see"
            />
            <VisibilityOption
              value="circle"
              icon={<Circle className="w-5 h-5" />}
              title="Selected Circles"
              description="Choose specific circles for each post"
            />
            <VisibilityOption
              value="public"
              icon={<Globe className="w-5 h-5" />}
              title="Public"
              description="Anyone on the network can see"
            />
          </RadioGroup>
        </CardContent>
      </Card>
      
      {/* Encryption Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Encryption
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Encrypt by Default</p>
              <p className="text-sm text-muted-foreground">
                Encrypt all content before storing on network
              </p>
            </div>
            <Switch
              checked={sovereignty.encryptByDefault}
              onCheckedChange={actions.toggleEncryptByDefault}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">End-to-End Encryption</p>
              <p className="text-sm text-muted-foreground">
                Only intended recipients can decrypt your messages
              </p>
            </div>
            <Badge variant="default" className="bg-green-500">
              Always On
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Consent Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hand className="w-5 h-5" />
            Consent & Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Require Explicit Consent</p>
              <p className="text-sm text-muted-foreground">
                Ask before any data leaves your device
              </p>
            </div>
            <Switch
              checked={sovereignty.requireExplicitConsent}
              onCheckedChange={(v) => {/* update */}}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Allow Analytics</p>
              <p className="text-sm text-muted-foreground">
                Help improve VIVIM (fully anonymized)
              </p>
            </div>
            <Switch
              checked={sovereignty.allowAnalytics}
              onCheckedChange={(v) => {/* update */}}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Allow Content Indexing</p>
              <p className="text-sm text-muted-foreground">
                Let others discover your public content
              </p>
            </div>
            <Switch
              checked={sovereignty.allowIndexing}
              onCheckedChange={(v) => {/* update */}}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Per-Content Privacy Audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Privacy Audit
          </CardTitle>
          <CardDescription>
            Review visibility settings for all your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PrivacyAuditList />
        </CardContent>
      </Card>
    </div>
  );
}
```

## 3.5 Storage Dashboard

```typescript
// features/storage/components/StorageDashboard.tsx

export function StorageDashboard() {
  const { storage, network } = useAppStore();
  
  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StorageOverviewCard
          title="Local Storage"
          icon={<HardDrive className="w-5 h-5" />}
          used={storage.localUsed}
          capacity={storage.localCapacity}
          color="blue"
        />
        <StorageOverviewCard
          title="IPFS Network"
          icon={<Globe className="w-5 h-5" />}
          used={storage.ipfsPinned}
          capacity={null}
          items={storage.ipfsPins.length}
          color="purple"
        />
        <StorageOverviewCard
          title="Permanent Storage"
          icon={<Database className="w-5 h-5" />}
          used={storage.totalDealStorage}
          deals={storage.activeDeals}
          color="green"
        />
      </div>
      
      {/* Storage Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <StorageDistributionChart />
        </CardContent>
      </Card>
      
      {/* Pin Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>IPFS Pins</span>
            <Badge variant="secondary">{storage.ipfsPins.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PinManager pins={storage.ipfsPins} />
        </CardContent>
      </Card>
      
      {/* Storage Deals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Storage Deals</span>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Deal
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StorageDealsList />
        </CardContent>
      </Card>
      
      {/* Provider Browser */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Providers</CardTitle>
          <CardDescription>
            Choose providers for permanent storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderBrowser />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

# PART 4: CONTENT CREATION & SHARING

## 4.1 Content Composer with Full Control

```typescript
// features/content/components/ContentComposer.tsx

export function ContentComposer() {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [visibility, setVisibility] = useState<VisibilitySettings>({
    level: 'friends',
    circles: [],
    expiresAt: null,
    location: null,
  });
  const [storageOptions, setStorageOptions] = useState<StorageOptions>({
    location: 'ipfs',
    createDeal: false,
    encryption: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { sovereignty, storage } = useAppStore();
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-6">
          {/* Main Composer */}
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] text-lg border-none resize-none focus-visible:ring-0 p-0"
          />
          
          {/* Media Preview */}
          {media.length > 0 && (
            <div className="mt-4">
              <MediaPreviewGrid media={media} onRemove={setMedia} />
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <MediaUploadButton onChange={setMedia} />
              <LocationButton onChange={(loc) => visibility.location = loc} />
              <ExpirationButton onChange={(exp) => visibility.expiresAt = exp} />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Advanced
              </Button>
            </div>
            
            <VisibilitySelector
              value={visibility}
              onChange={setVisibility}
              defaultVisibility={storage.defaultVisibility}
            />
          </div>
          
          {/* Advanced Options */}
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <StorageOptionsPanel
                value={storageOptions}
                onChange={setStorageOptions}
                defaultLocation={sovereignty.defaultStorageLocation}
              />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Encrypt Content</p>
                  <p className="text-sm text-muted-foreground">
                    End-to-end encryption for maximum privacy
                  </p>
                </div>
                <Switch
                  checked={storageOptions.encryption}
                  onCheckedChange={(v) => setStorageOptions(s => ({ ...s, encryption: v }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Create Storage Deal</p>
                  <p className="text-sm text-muted-foreground">
                    Store permanently on Filecoin
                  </p>
                </div>
                <Switch
                  checked={storageOptions.createDeal}
                  onCheckedChange={(v) => setStorageOptions(s => ({ ...s, createDeal: v }))}
                />
              </div>
            </div>
          )}
          
          {/* Data Flow Preview */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <ArrowRight className="w-4 h-4" />
              <span>
                This content will be stored on <strong>{storageOptions.location}</strong>
                {storageOptions.encryption && ' with encryption'}
                {' '}and visible to <strong>{visibility.level}</strong>
              </span>
            </div>
          </div>
          
          {/* Submit */}
          <div className="mt-4 flex justify-end">
            <Button size="lg" className="px-8">
              <Send className="w-4 h-4 mr-2" />
              Post
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 4.2 Visibility Selector

```typescript
// components/sovereignty/VisibilitySelector.tsx

interface VisibilitySelectorProps {
  value: VisibilitySettings;
  onChange: (settings: VisibilitySettings) => void;
  defaultVisibility: string;
}

export function VisibilitySelector({ value, onChange, defaultVisibility }: VisibilitySelectorProps) {
  const [open, setOpen] = useState(false);
  const circles = useAppStore(s => s.circles);
  
  const visibilityIcons = {
    private: <Lock className="w-4 h-4" />,
    friends: <Users className="w-4 h-4" />,
    circle: <Circle className="w-4 h-4" />,
    public: <Globe className="w-4 h-4" />,
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          {visibilityIcons[value.level]}
          <span className="ml-2 capitalize">{value.level}</span>
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h4 className="font-medium">Who can see this?</h4>
          
          <RadioGroup 
            value={value.level}
            onValueChange={(level) => onChange({ ...value, level })}
          >
            <VisibilityOption
              value="private"
              icon={<Lock className="w-4 h-4" />}
              title="Only Me"
              description="Only you can view this"
            />
            <VisibilityOption
              value="friends"
              icon={<Users className="w-4 h-4" />}
              title="Friends"
              description="Your confirmed friends"
            />
            <VisibilityOption
              value="circle"
              icon={<Circle className="w-4 h-4" />}
              title="Selected Circles"
              description="Choose specific circles"
            />
            <VisibilityOption
              value="public"
              icon={<Globe className="w-4 h-4" />}
              title="Public"
              description="Anyone on the network"
            />
          </RadioGroup>
          
          {value.level === 'circle' && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Select Circles</p>
              <div className="space-y-2">
                {circles.map(circle => (
                  <label 
                    key={circle.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={value.circles.includes(circle.id)}
                      onCheckedChange={(checked) => {
                        onChange({
                          ...value,
                          circles: checked
                            ? [...value.circles, circle.id]
                            : value.circles.filter(c => c !== circle.id),
                        });
                      }}
                    />
                    <span>{circle.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {circle.memberCount} members
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {value.level === 'public' && (
            <Alert className="mt-4">
              <Globe className="w-4 h-4" />
              <AlertTitle>Public Content</AlertTitle>
              <AlertDescription>
                Public content will be indexed and discoverable by anyone on the network.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

---

# PART 5: AI CHAT INTERFACE

## 5.1 AI Chat with User Control

```typescript
// features/ai-chat/components/ChatThread.tsx

export function ChatThread() {
  const { chatRuntime, ai } = useAppStore();
  const messages = useMessages(chatRuntime);
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header with Controls */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModelSelector 
              value={ai.activeProvider}
              onChange={(provider) => {/* update */}}
            />
            <Badge variant="outline">
              {ai.memoryEnabled ? 'Memory On' : 'Memory Off'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <MemoryToggle />
            <ContextViewer />
            <ChatSettings />
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>
      
      {/* Composer */}
      <ChatComposer />
      
      {/* Data Notice */}
      <div className="border-t p-2 text-xs text-center text-muted-foreground">
        <Lock className="w-3 h-3 inline mr-1" />
        Conversations stored locally and encrypted. AI provider receives only current context.
      </div>
    </div>
  );
}
```

## 5.2 Memory Control Panel

```typescript
// features/memory/components/MemoryExplorer.tsx

export function MemoryExplorer() {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [filter, setFilter] = useState<MemoryFilter>({
    types: [],
    search: '',
    dateRange: null,
  });
  
  const memories = useMemories(filter);
  
  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Memory List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <Input
            placeholder="Search memories..."
            value={filter.search}
            onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
          />
          
          <div className="flex gap-2 mt-2">
            <MemoryTypeFilter value={filter.types} onChange={(types) => setFilter(f => ({ ...f, types }))} />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {memories.map(memory => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                selected={selectedMemory?.id === memory.id}
                onClick={() => setSelectedMemory(memory)}
              />
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Export Memories
          </Button>
        </div>
      </div>
      
      {/* Memory Detail */}
      <div className="flex-1 flex flex-col">
        {selectedMemory ? (
          <>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <Badge>{selectedMemory.type}</Badge>
                  <span className="text-sm text-muted-foreground ml-2">
                    Created {new Date(selectedMemory.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="prose max-w-none">
                {selectedMemory.content}
              </div>
              
              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedMemory.tags.map(tag => (
                  <Badge key={tag} variant="secondary">#{tag}</Badge>
                ))}
              </div>
              
              {/* Storage Info */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Storage Information</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">CID:</dt>
                  <dd className="font-mono truncate">{selectedMemory.cid}</dd>
                  
                  <dt className="text-muted-foreground">Visibility:</dt>
                  <dd>{selectedMemory.visibility}</dd>
                  
                  <dt className="text-muted-foreground">Encrypted:</dt>
                  <dd>{selectedMemory.encrypted ? 'Yes' : 'No'}</dd>
                  
                  <dt className="text-muted-foreground">Storage:</dt>
                  <dd>{selectedMemory.storageLocation}</dd>
                </dl>
              </div>
              
              {/* Related Memories */}
              <div className="mt-6">
                <h4 className="font-medium mb-2">Related Memories</h4>
                <RelatedMemoriesGraph memoryId={selectedMemory.id} />
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a memory to view details
          </div>
        )}
      </div>
    </div>
  );
}
```

---

# PART 6: NETWORK VISIBILITY

## 6.1 Network Status Dashboard

```typescript
// features/network/components/NetworkDashboard.tsx

export function NetworkDashboard() {
  const { network } = useAppStore();
  const peers = usePeers();
  
  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-4">
        <StatusCard
          title="Status"
          value={network.status}
          icon={<Wifi className="w-5 h-5" />}
          status={network.status === 'connected' ? 'success' : 'warning'}
        />
        <StatusCard
          title="Peers"
          value={network.peerCount.toString()}
          icon={<Users className="w-5 h-5" />}
        />
        <StatusCard
          title="Pending Ops"
          value={network.pendingOperations.toString()}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatusCard
          title="Last Sync"
          value={network.lastSync ? formatRelative(network.lastSync) : 'Never'}
          icon={<RefreshCw className="w-5 h-5" />}
        />
      </div>
      
      {/* Peer Map */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Peers</CardTitle>
        </CardHeader>
        <CardContent>
          <PeerMap peers={peers} />
        </CardContent>
      </Card>
      
      {/* Connection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-connect to Bootstrap Nodes</p>
              <p className="text-sm text-muted-foreground">
                Automatically connect to trusted relay nodes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Accept Incoming Connections</p>
              <p className="text-sm text-muted-foreground">
                Allow other peers to connect to you
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Bandwidth Limit</p>
              <p className="text-sm text-muted-foreground">
                Maximum bandwidth for P2P traffic
              </p>
            </div>
            <Select defaultValue="unlimited">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">Unlimited</SelectItem>
                <SelectItem value="1mbps">1 Mbps</SelectItem>
                <SelectItem value="5mbps">5 Mbps</SelectItem>
                <SelectItem value="10mbps">10 Mbps</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Bootstrap Nodes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bootstrap Nodes</span>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Node
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BootstrapNodesList nodes={network.bootstrapNodes} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

# PART 7: OFFLINE-FIRST DESIGN

## 7.1 Offline Detection & Queue

```typescript
// lib/offline-manager.ts

class OfflineManager {
  private queue: QueuedOperation[] = [];
  private syncWorker: Worker | null = null;
  
  constructor() {
    this.setupListeners();
    this.initSyncWorker();
  }
  
  private setupListeners() {
    // Detect online/offline
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());
    
    // Handle beforeunload
    window.addEventListener('beforeunload', (e) => {
      if (this.queue.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have pending operations. Are you sure?';
      }
    });
  }
  
  private initSyncWorker() {
    this.syncWorker = new Worker('/workers/sync-worker.js');
    
    this.syncWorker.onmessage = (e) => {
      if (e.data.type === 'sync-complete') {
        this.processQueue();
      }
    };
  }
  
  async queueOperation(op: QueuedOperation): Promise<void> {
    // Store in IndexedDB immediately
    await this.storeOperation(op);
    
    this.queue.push(op);
    
    if (navigator.onLine) {
      this.processQueue();
    } else {
      this.showOfflineNotice();
    }
  }
  
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && navigator.onLine) {
      const op = this.queue[0];
      
      try {
        await this.executeOperation(op);
        this.queue.shift();
        await this.removeOperation(op.id);
      } catch (error) {
        // Retry logic
        op.attempts++;
        if (op.attempts >= op.maxAttempts) {
          this.queue.shift();
          this.showFailedNotice(op, error);
        }
        break;
      }
    }
  }
  
  private showOfflineNotice() {
    toast({
      title: 'You are offline',
      description: `${this.queue.length} operations will sync when you reconnect`,
      duration: Infinity,
    });
  }
}

export const offlineManager = new OfflineManager();
```

## 7.2 Offline Indicator Component

```typescript
// components/feedback/OfflineIndicator.tsx

export function OfflineIndicator() {
  const { network } = useAppStore();
  const pendingCount = useOfflineQueue(s => s.pendingCount);
  
  if (network.status === 'connected' && pendingCount === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {network.status !== 'connected' ? (
        <Alert className="w-80 border-yellow-500 bg-yellow-50">
          <WifiOff className="w-4 h-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Offline Mode</AlertTitle>
          <AlertDescription className="text-yellow-700">
            You're currently offline. {pendingCount} operations pending.
          </AlertDescription>
        </Alert>
      ) : pendingCount > 0 ? (
        <Alert className="w-80 border-blue-500 bg-blue-50">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          <AlertTitle className="text-blue-800">Syncing</AlertTitle>
          <AlertDescription className="text-blue-700">
            Syncing {pendingCount} operations...
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
```

---

# PART 8: COMPONENT LIBRARY INTEGRATION

## 8.1 assistant-ui Integration

```typescript
// app/Providers.tsx

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { VivimChatRuntime } from '@/lib/chat-runtime';

export function Providers({ children }: { children: React.ReactNode }) {
  const chainClient = useChainClient();
  const contentClient = useContentClient();
  
  const chatRuntime = useMemo(() => new VivimChatRuntime({
    chainClient,
    contentClient,
    modelProvider: createModelProvider(),
  }), [chainClient, contentClient]);
  
  return (
    <AssistantRuntimeProvider runtime={chatRuntime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
```

## 8.2 tool-ui Integration

```typescript
// features/ai-chat/components/ToolCallDisplay.tsx

import { makeAssistantToolUI } from '@assistant-ui/react';
import { toolUIRegistry } from '@/lib/tool-registry';

// Dynamic tool UI component
export const ToolCallDisplay = makeAssistantToolUI({
  toolName: '*', // Match all tools
  
  render: ({ toolName, args, result }) => {
    const toolUI = toolUIRegistry[toolName];
    
    if (!toolUI) {
      return <DefaultToolFallback toolName={toolName} args={args} />;
    }
    
    const Component = toolUIComponents[toolUI.component];
    const props = toolUI.props(result || args);
    
    return <Component {...props} />;
  },
});
```

---

# PART 9: IMPLEMENTATION CHECKLIST

## Phase 1: Core Infrastructure
- [ ] Set up Zustand stores with persistence
- [ ] Initialize VivimChainClient in app
- [ ] Create offline manager
- [ ] Build sync worker

## Phase 2: Identity & Auth
- [ ] Identity setup flow
- [ ] DID display component
- [ ] Key backup/restore
- [ ] Recovery phrase generation

## Phase 3: Content & Storage
- [ ] Content composer with visibility controls
- [ ] Media uploader with progress
- [ ] Storage dashboard
- [ ] Pin manager
- [ ] Storage deals UI

## Phase 4: AI Integration
- [ ] Chat thread with assistant-ui
- [ ] Tool registry setup
- [ ] Tool UI components
- [ ] Memory explorer
- [ ] Model selector

## Phase 5: Social Features
- [ ] Profile page
- [ ] Follow graph
- [ ] Circle manager
- [ ] Feed with visibility filtering

## Phase 6: Settings & Control
- [ ] Settings hub
- [ ] Privacy controls
- [ ] Network settings
- [ ] Data export/import
- [ ] Delete functionality

## Phase 7: Offline & Sync
- [ ] Offline detection
- [ ] Operation queue
- [ ] Sync status indicators
- [ ] Background sync worker

---

*This document defines the complete frontend architecture that gives users maximal control over their digital presence while integrating blockchain, distributed storage, and AI capabilities.*
