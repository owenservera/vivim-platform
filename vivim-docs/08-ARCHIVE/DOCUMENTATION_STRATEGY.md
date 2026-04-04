# VIVIM Documentation Strategy

## Executive Summary

This document outlines a comprehensive strategy for organizing, maintaining, and governing the VIVIM project documentation. The project currently has **100+ markdown files** spread across multiple locations with varying levels of freshness and relevance.

---

## Phase 1: Documentation Inventory & Classification

### 1.1 Current Documentation Locations

| Location | Type | Count | Status |
|----------|------|-------|--------|
| `vivim.docs.context/docs/` | Docusaurus (Primary) | ~100 files | Active |
| `*.md` (root) | Project docs | 11 files | Mixed |
| `.archive/.old/` | Legacy archive | ~30 files | Stale |
| `vivim.docs.context/docs/_legacy/` | Legacy Docusaurus | ~100 files | Stale |
| `vivim.docs.context/docs/.current/` | Working docs | 8 files | Active |

### 1.2 Documentation Categories

```
📚 VIVIM Documentation
├── 🏠 Primary (Docusaurus)
│   ├── 👤 User Docs (15 files) - End-user guides
│   ├── 🔧 SDK Docs (20+ files) - Developer toolkit
│   ├── 🏗️ Architecture (10 files) - Technical design
│   ├── 🔌 API Reference (.mdx) - REST API docs
│   ├── 📱 PWA Docs - Frontend technical
│   ├── 🌐 Network Docs - P2P/CRDT
│   └── 🔐 Security Docs
│
├── 📋 Root Level (11 files)
│   ├── README.md - Project entry point
│   ├── CONVERSATION_IMPORT_DESIGN.md - Feature spec
│   ├── IMPORT_IMPLEMENTATION_SUMMARY.md - Recent work
│   ├── REDIS_SETUP.md - Infrastructure
│   ├── SYSTEM_FIXES_SUMMARY.md - Fixes log
│   ├── quick-fix.md, TRY_THIS_FIRST.md - Dev helpers
│   └── CLEANUP_GUIDE.md, SOTA_IMPLEMENTATION_PLAN.md
│
├── 🗄️ Legacy (Stale)
│   ├── _legacy/ (~100 files) - Outdated Docusaurus docs
│   └── .archive/.old/ (~30 files) - Very old project iterations
│
└── 🔄 Working
    └── .current/ (8 files) - Current audit/gap analysis docs
```

---

## Phase 2: Issues Identified

### 2.1 Broken Links (Silently Ignored)

```typescript
// docusaurus.config.ts line 16
onBrokenLinks: 'ignore',  // ❌ Hides problems!
```

**Impact:** The sidebar references many docs that don't exist:
- `sdk/architecture/data-flow` - Missing
- `sdk/core/overview` - Missing
- `sdk/cli/overview` - Missing
- `sdk/extension/overview` - Missing
- `sdk/bun/integration` - Missing
- `sdk/api-nodes/overview` - Missing
- `sdk/apps/overview` - Missing
- `sdk/guides/getting-started` - Missing
- `sdk/examples/basic` - Missing
- `getting-started/introduction` - EXISTS
- `pwa/overview`, `pwa/byok`, `pwa/storage-v2`, etc. - Need verification

### 2.2 Duplicate/Outdated Content

| Original | Duplicate | Recommendation |
|----------|-----------|----------------|
| `docs/ARCHITECTURE/` | `docs/_legacy/ARCHITECTURE/` | Archive `_legacy` |
| `docs/user/` (current) | `_legacy/user/` | Archive `_legacy` |
| Root `README.md` | `docs/_legacy/README.md` | Archive legacy |
| `SDK_GAP_ANALYSIS.md` | `docs/SDK_GAP_ANALYSIS.md` | Keep in root |

### 2.3 Unclear Document Purpose

Many root-level .md files are implementation notes that should either:
- Be integrated into the Docusaurus docs
- Be moved to a `/docs/internal/` folder
- Be deleted if obsolete

---

## Phase 3: Recommended Documentation Strategy

### 3.1 Documentation Governance Model

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCUMENTATION TIERS                       │
├─────────────────────────────────────────────────────────────┤
│  TIER 1: User-Facing (Docusaurus /docs/user/)              │
│  - Written for non-technical users                          │
│  - Maintained with each feature release                     │
│  - Tested by "mom test" (non-technical)                     │
├─────────────────────────────────────────────────────────────┤
│  TIER 2: Developer Docs (Docusaurus /docs/)                 │
│  - API references, architecture, SDK guides                │
│  - Updated with code changes                                │
│  - Includes code examples from source                       │
├─────────────────────────────────────────────────────────────┤
│  TIER 3: Internal/Implementation (Root /docs-internal/)    │
│  - Design docs, RFCs, implementation notes                 │
│  - Not published to public docs                             │
│  - Version-controlled but not maintained                    │
├─────────────────────────────────────────────────────────────┤
│  TIER 4: Archive (/archive/)                                │
│  - Historical documents no longer relevant                  │
│  - Read-only, not maintained                                │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Proposed Folder Structure

```
vivim-app/
├── README.md                          # ✅ Keep - Project entry
├── docs-internal/                     # 🆕 NEW - Internal docs
│   ├── design/
│   │   ├── CONVERSATION_IMPORT_DESIGN.md
│   │   └── SOTA_IMPLEMENTATION_PLAN.md
│   ├── implementation/
│   │   ├── IMPORT_IMPLEMENTATION_SUMMARY.md
│   │   ├── SYSTEM_FIXES_SUMMARY.md
│   │   └── REDIS_SETUP.md
│   └── guides/
│       ├── quick-fix.md
│       ├── TRY_THIS_FIRST.md
│       ├── CLEANUP_GUIDE.md
│       └── QUICK_FIX_NO_REBUILD.md
│
├── vivim.docs.context/               # ✅ Keep - Public docs
│   ├── docs/
│   │   ├── user/                     # ✅ Keep - User guides
│   │   ├── getting-started/         # ✅ Keep
│   │   ├── sdk/                      # ✅ Keep
│   │   ├── architecture/            # ✅ Keep
│   │   ├── api/                      # ✅ Keep
│   │   ├── pwa/                      # ✅ Keep
│   │   ├── network/                  # ✅ Keep
│   │   ├── security/                 # ✅ Keep
│   │   └── _legacy/                  # 🚧 ARCHIVE this
│   ├── .current/                     # ✅ Keep - Working docs
│   └── .archive/                     # ✅ Keep - Existing archive
│
└── archive-legacy/                   # 🆕 NEW - Consolidated legacy
    └── (moved from vivim.docs.context/docs/_legacy/)
```

### 3.3 Action Items by Priority

#### 🔴 HIGH PRIORITY - Fix Broken Docs Build

1. **Enable broken link detection**
   ```typescript
   // Change in docusaurus.config.ts
   onBrokenLinks: 'throw',  // Was: 'ignore'
   ```

2. **Create missing docs OR fix sidebar references**
   - Audit each sidebar reference
   - Create stub docs for planned features
   - Remove references to non-existent content

#### 🟡 MEDIUM PRIORITY - Organize Structure

1. **Move internal docs out of root**
   - Create `docs-internal/` folder
   - Move implementation notes, guides, design docs
   - Update README to reference both locations

2. **Consolidate legacy content**
   - Move `vivim.docs.context/docs/_legacy/` to `archive-legacy/`
   - Keep `.archive/.old/` as-is (already archived)

3. **Update Docusaurus navigation**
   - Add "Internal Docs" link in footer (optional)
   - Consider adding "Contributing" section

#### 🟢 LOW PRIORITY - Improve Documentation

1. **Create documentation contribution guide**
   - Standard templates for new docs
   - Frontmatter requirements
   - Review process

2. **Set up docs CI/CD**
   - Build docs on PR
   - Link checker in CI

3. **Audit user docs for freshness**
   - Verify each user doc matches current UI
   - Update screenshots if needed

---

## Phase 4: Implementation Roadmap

### Step 1: Fix Build (Day 1)
- [ ] Change `onBrokenLinks` to `'throw'`
- [ ] Run `npm run build` to find broken references
- [ ] Fix each broken link (create stub or remove reference)

### Step 2: Organize (Day 2-3)
- [ ] Create `docs-internal/` folder
- [ ] Move root .md files to appropriate subfolders
- [ ] Move `_legacy/` to `archive-legacy/`
- [ ] Update README.md references

### Step 3: Governance (Day 4)
- [ ] Update DOCUMENTATION_GUIDE.md with new structure
- [ ] Document contribution process
- [ ] Set up build check in CI

---

## Appendix A: Document Classification Matrix

| File | Current Location | Proposed Location | Action |
|------|------------------|-------------------|--------|
| README.md | Root | Root | ✅ Keep |
| CONVERSATION_IMPORT_DESIGN.md | Root | docs-internal/design/ | 📦 Move |
| IMPORT_IMPLEMENTATION_SUMMARY.md | Root | docs-internal/implementation/ | 📦 Move |
| REDIS_SETUP.md | Root | docs-internal/implementation/ | 📦 Move |
| SYSTEM_FIXES_SUMMARY.md | Root | docs-internal/implementation/ | 📦 Move |
| SOTA_IMPLEMENTATION_PLAN.md | Root | docs-internal/design/ | 📦 Move |
| quick-fix.md | Root | docs-internal/guides/ | 📦 Move |
| TRY_THIS_FIRST.md | Root | docs-internal/guides/ | 📦 Move |
| CLEANUP_GUIDE.md | Root | docs-internal/guides/ | 📦 Move |
| QUICK_FIX_NO_REBUILD.md | Root | docs-internal/guides/ | 📦 Move |
| index-minimal.md | Root | Delete or archive | 🗑️ Evaluate |
| vivim.docs.context/docs/_legacy/ | Docusaurus | archive-legacy/ | 📦 Archive |

---

## Appendix B: Sidebar References to Verify

The following sidebar references need verification:

```typescript
// From sidebars.ts - NEEDS AUDIT
'sdk/architecture/data-flow',      // ❓ Check
'sdk/core/overview',               // ❓ Check  
'sdk/core/communication',          // ❓ Check
'sdk/core/utilities',              // ❓ Check
'sdk/core/self-design',            // ❓ Check
'sdk/cli/overview',                // ❓ Check
'sdk/extension/overview',         // ❓ Check
'sdk/bun/integration',             // ❓ Check
'sdk/api-nodes/overview',         // ❓ Check
'sdk/api-nodes/additional-nodes',  // ❓ Check
'sdk/apps/overview',              // ❓ Check
'sdk/apps/additional-apps',       // ❓ Check
'sdk/guides/getting-started',     // ❓ Check
'sdk/guides/migration',           // ❓ Check
'sdk/guides/performance',          // ❓ Check
'sdk/examples/basic',              // ❓ Check
'sdk/examples/intermediate',       // ❓ Check
'sdk/examples/advanced',          // ❓ Check
```

---

*Document Version: 1.0*
*Created: 2026-03-09*
*Last Updated: 2026-03-09*
