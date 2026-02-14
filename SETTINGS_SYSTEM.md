# User Context Settings System

## Overview

A comprehensive settings system that gives users control over the dynamic context pipeline boundaries. Users can customize everything from simple response styles to expert-level budget allocations.

## Architecture

### Three-Tier Configuration System

```
┌─────────────────────────────────────────────────────────────────┐
│                     SETTINGS HIERARCHY                           │
├─────────────────────────────────────────────────────────────────┤
│ TIER 1: ESSENTIAL                                               │
│  • Context Window Size (4K-50K tokens)                         │
│  • Response Style (concise/balanced/detailed)                  │
│  • Memory Sensitivity (strict/moderate/permissive)             │
│  • Focus Mode (chat-first/balanced/knowledge-first)            │
├─────────────────────────────────────────────────────────────────┤
│ TIER 2: ADVANCED                                                │
│  • Layer Budget Overrides (min/max per layer)                  │
│  • Compression Strategy (auto/full/windowed/compacted)         │
│  • Prediction Aggressiveness                                     │
│  • Bundle TTL Multipliers                                        │
│  • Enable/Disable Prediction Signals                             │
├─────────────────────────────────────────────────────────────────┤
│ TIER 3: EXPERT                                                  │
│  • Similarity Thresholds (topic/entity/ACU/memory)             │
│  • Elasticity Coefficients (layer flexibility)                 │
│  • Custom Budget Formulas                                        │
│  • Exclusion Lists (topics/entities/memories)                  │
└─────────────────────────────────────────────────────────────────┘
```

## Files Created

### Core Files

| File | Purpose | Lines |
|------|---------|-------|
| `schema.prisma` | UserContextSettings model | +90 |
| `settings-types.ts` | Type definitions & validation | 305 |
| `settings-service.ts` | CRUD operations & business logic | 520 |
| `settings-integration.ts` | Integration examples | 285 |
| `context-settings.ts` | API routes | 175 |

### Modified Files

| File | Changes |
|------|---------|
| `budget-algorithm.ts` | Added user settings support |
| `index.ts` | Added settings exports |
| `schema.prisma` | Added User model relation |

## Database Schema

```prisma
model UserContextSettings {
  id                    String   @id @default(uuid())
  userId                String   @unique
  
  // Tier 1: Essential
  maxContextTokens      Int      @default(12000)
  responseStyle         String   @default("balanced")
  memoryThreshold       String   @default("moderate")
  focusMode             String   @default("balanced")
  
  // Tier 2: Advanced
  layerBudgetOverrides  Json     @default("{}")
  compressionStrategy   String   @default("auto")
  predictionAggressiveness String @default("balanced")
  ttlMultipliers        Json     @default("{}")
  enabledSignals        Json     @default("{}")
  
  // Tier 3: Expert
  topicSimilarityThreshold   Float @default(0.35)
  entitySimilarityThreshold  Float @default(0.40)
  acuSimilarityThreshold     Float @default(0.35)
  memorySimilarityThreshold  Float @default(0.40)
  elasticityOverrides        Json  @default("{}")
  customBudgetFormulas       Json  @default("{}")
  
  // Exclusions
  excludedTopicSlugs       String[] @default([])
  excludedEntityIds        String[] @default([])
  excludedMemoryIds        String[] @default([])
  excludedConversationIds  String[] @default([])
  
  // System Flags
  enablePredictions    Boolean @default(true)
  enableJitRetrieval   Boolean @default(true)
  enableCompression    Boolean @default(true)
  enableEntityContext  Boolean @default(true)
  enableTopicContext   Boolean @default(true)
  prioritizeLatency    Boolean @default(false)
  cacheAggressively    Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API Endpoints

### Settings Management

```
GET    /api/settings/context              # Get current settings + metadata
PUT    /api/settings/context              # Update settings (full)
PATCH  /api/settings/context/:path        # Update specific setting
POST   /api/settings/context/reset        # Reset to defaults
POST   /api/settings/context/preset/:name # Apply preset
GET    /api/settings/context/presets      # List available presets
GET    /api/settings/context/schema       # Get UI schema
```

### Example Requests

```bash
# Get settings
curl /api/settings/context

# Update context window
curl -X PUT /api/settings/context \
  -d '{"maxContextTokens": 16000}'

# Apply developer preset
curl -X POST /api/settings/context/preset/developer

# Disable navigation predictions
curl -X PATCH /api/settings/context/enabledSignals.navigation \
  -d '{"value": false}'

# Reset to defaults
curl -X POST /api/settings/context/reset
```

## Presets

### Built-in Presets

| Preset | Description | Use Case |
|--------|-------------|----------|
| **minimal** | Low resource, fast responses | Mobile users, slow connections |
| **balanced** | Good balance (default) | General usage |
| **knowledge** | Maximum context retention | Research, learning |
| **developer** | Optimized for coding | Technical discussions |
| **privacy** | Minimal data retention | Privacy-conscious users |

### Preset Configurations

```typescript
// Developer Preset
{
  maxContextTokens: 16000,
  compressionStrategy: 'multi_level',
  predictionAggressiveness: 'aggressive',
  enableEntityContext: true,
  enableTopicContext: true
}

// Privacy Preset
{
  maxContextTokens: 8192,
  enablePredictions: false,
  enableJitRetrieval: false,
  cacheAggressively: false
}
```

## Integration Examples

### Basic Usage

```typescript
import { ContextSettingsService } from './context';

const settingsService = new ContextSettingsService({ prisma });

// Get settings
const settings = await settingsService.getSettings(userId);

// Update
await settingsService.updateSettings(userId, {
  maxContextTokens: 16000,
  responseStyle: 'detailed'
});

// Apply preset
await settingsService.applyPreset(userId, 'developer');
```

### With Context Assembly

```typescript
// Load user settings
const settings = await settingsService.getSettings(userId);

// Apply to budget algorithm
const algorithm = new BudgetAlgorithm({ userSettings: settings });

// Use in assembly
const assembler = new DynamicContextAssembler({
  prisma,
  embeddingService,
  tokenEstimator,
  bundleCompiler
});

const result = await assembler.assemble({
  userId,
  conversationId,
  userMessage,
  settings: {
    maxContextTokens: settings.maxContextTokens,
    prioritizeConversationHistory: settings.focusMode === 'chat-first',
    knowledgeDepth: mapResponseStyle(settings.responseStyle)
  }
});
```

### UI Schema Generation

```typescript
// Get schema for dynamic form generation
const schema = settingsService.getSettingsSchema();

// Returns:
[
  {
    id: 'maxContextTokens',
    category: 'essential',
    type: 'slider',
    label: 'Context Window Size',
    description: 'Maximum tokens available for context',
    default: 12000,
    constraints: { min: 4096, max: 50000, step: 1024 }
  },
  {
    id: 'responseStyle',
    category: 'essential',
    type: 'select',
    label: 'Response Style',
    constraints: {
      options: [
        { value: 'concise', label: 'Concise responses' },
        { value: 'balanced', label: 'Balanced detail' },
        { value: 'detailed', label: 'Detailed explanations' }
      ]
    }
  }
]
```

## Settings Impact

### Budget Algorithm Integration

User settings now affect budget calculations:

```typescript
// Layer overrides apply automatically
const algorithm = new BudgetAlgorithm({ userSettings });

// User can override any layer:
// { "L2_topic": { "max": 5000 } }

// Elasticity coefficients affect compression:
// { "L3_entity": 0.9 } // Very flexible
```

### Context Assembly Integration

Settings flow through the entire pipeline:

1. **Prediction Engine**: `enabledSignals` controls which signals are active
2. **Bundle Compiler**: `memoryThreshold` affects which memories are included
3. **Budget Algorithm**: `layerBudgetOverrides` customize allocations
4. **Conversation Engine**: `compressionStrategy` selects strategy
5. **JIT Retrieval**: `enableJitRetrieval` toggles real-time fetching

## Validation

All settings are validated against constraints:

```typescript
// Constraints
{
  maxContextTokens: { min: 4096, max: 50000 },
  similarityThresholds: { min: 0.0, max: 1.0 },
  ttlMultiplier: { min: 0.1, max: 5.0 }
}

// Validation returns errors if invalid
const result = validateSettings({ maxContextTokens: 1000 });
// { valid: false, errors: ["maxContextTokens must be between 4096 and 50000"] }
```

## Migration Required

```bash
# Generate Prisma migration
npx prisma migrate dev --name add_context_settings

# Or push directly (dev only)
npx prisma db push
```

## Default Behavior

- **New users**: Start with defaults (no DB record needed)
- **Missing settings**: Use sensible defaults
- **Invalid settings**: Return validation errors
- **Reset**: Delete DB record, revert to defaults

## Frontend Integration

### React Hook Example

```typescript
function useContextSettings(userId: string) {
  const [settings, setSettings] = useState(null);
  
  useEffect(() => {
    fetch(`/api/settings/context`)
      .then(r => r.json())
      .then(setSettings);
  }, [userId]);
  
  const updateSetting = async (path: string, value: any) => {
    await fetch(`/api/settings/context/${path}`, {
      method: 'PATCH',
      body: JSON.stringify({ value })
    });
  };
  
  return { settings, updateSetting };
}
```

### Settings Panel Structure

```
Settings Panel
├── Essential (always visible)
│   ├── Context Window Slider
│   ├── Response Style Select
│   ├── Memory Sensitivity Select
│   └── Focus Mode Select
├── Advanced (expandable)
│   ├── Layer Budget Overrides
│   ├── Compression Strategy
│   ├── Prediction Settings
│   └── System Toggles
└── Expert (hidden by default)
    ├── Similarity Thresholds
    ├── Elasticity Coefficients
    └── Exclusion Lists
```

## Security Considerations

1. **Authorization**: All endpoints require authenticated user
2. **Validation**: Server-side validation prevents invalid values
3. **Isolation**: Users can only modify their own settings
4. **Sanitization**: No raw formula evaluation (security risk)

## Performance

- **Defaults**: No DB query needed (in-memory defaults)
- **Caching**: Settings cached per-request (no repeated queries)
- **Lazy Loading**: Settings fetched only when needed
- **Partial Updates**: PATCH supports granular updates

## Future Enhancements

- [ ] Settings import/export (JSON)
- [ ] A/B testing different configurations
- [ ] Machine learning for optimal settings per user
- [ ] Organization-wide default settings
- [ ] Settings templates for different use cases
- [ ] Real-time settings synchronization across devices
