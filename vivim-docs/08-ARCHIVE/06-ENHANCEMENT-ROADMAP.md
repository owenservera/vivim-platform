# Prioritized Enhancement Roadmap

## 🔴 TIER 1 — Foundation
*Required for robust, correct operation and system integrity.*

1. **Implement Missing Admin Metrics (Backend)**
   - **Description**: Replace hardcoded "up" strings and mock arrays in the Admin API (`admin/system.js`, `admin/database.js`, `admin/network.js`) with actual OS, Prisma introspection, and libp2p queries.
   - **Effort**: M
   - **Impact**: HIGH
   - **Dependencies**: None.

2. **Fix Real-time WebSocket Write-Back (Backend)**
   - **Description**: The socket listener (`services/socket.ts`) receives CRDT sync payloads but fails to persist them to the PostgreSQL database because `applyOperationToDomain` is stubbed.
   - **Effort**: M
   - **Impact**: HIGH
   - **Dependencies**: None.

3. **Resolve PWA Home Panel Bugs (Frontend)**
   - **Description**: Fix the model name extraction bug (`convo.model || convo.metadata?.model`) causing UI failures, and fix the CSS opacity issue where archived cards fade out their interactive action buttons.
   - **Effort**: XS
   - **Impact**: HIGH
   - **Dependencies**: None.

4. **Wire CRDT Conflict Resolution (Backend/Network)**
   - **Description**: The `/api/admin/crdt/sync` endpoint is currently a stub. It must be connected to the actual `CRDTSyncService.resolveConflict()` to handle edge cases in P2P offline edits.
   - **Effort**: S
   - **Impact**: HIGH
   - **Dependencies**: None.

---

## 🟡 TIER 2 — Experience
*Significant UX/DX improvements, fixing broken patterns and consistency.*

1. **Design System Consolidation (Frontend)**
   - **Description**: Strip all hardcoded hex colors (especially provider gradients in `Home.css`) and replace them with standard CSS variables. Add explicit dark mode media query fallbacks for these custom elements.
   - **Effort**: S
   - **Impact**: MEDIUM
   - **Dependencies**: None.

2. **Differentiate Error States (Frontend)**
   - **Description**: The `ErrorState` component currently uses a generic `WifiOff` icon for everything. Map specific error categories (Database, Timeout, Network, Validation) to specific Lucide icons and provide actionable user messages.
   - **Effort**: XS
   - **Impact**: MEDIUM
   - **Dependencies**: None.

3. **Accessibility Overhaul (Frontend)**
   - **Description**: Add comprehensive keyboard navigation (`Space` key support) to Conversation Cards, include `sr-only` labels for stats pills, and ensure proper focus management across route transitions.
   - **Effort**: M
   - **Impact**: MEDIUM
   - **Dependencies**: None.

4. **Federation Client Implementation (SDK)**
   - **Description**: Implement the missing `ActivityPub` protocol adapters in the SDK to allow the already-working `FederationClient` to actually communicate with other Fediverse instances.
   - **Effort**: L
   - **Impact**: MEDIUM
   - **Dependencies**: None.

---

## 🟢 TIER 3 — Excellence
*Polish, performance, and delight.*

1. **Implement Post-Quantum Crypto Modules (SDK)**
   - **Description**: The secure storage layer has stubs for CRYSTALS-Kyber and Dilithium. Integrate the actual WASM modules to replace the current standard curve fallback, fulfilling the strict security specs.
   - **Effort**: L
   - **Impact**: LOW
   - **Dependencies**: None.

2. **Blockchain Anchoring Verification (SDK/Network)**
   - **Description**: Complete the `privacy-manager.ts` stubs to actively query the VIVIM chain client and verify Merkle roots for public privacy states, ensuring verifiable state commitments.
   - **Effort**: M
   - **Impact**: LOW
   - **Dependencies**: None.

3. **Analytics Telemetry Sync (Frontend/Backend)**
   - **Description**: The client-side recommendation engine logs impressions but does not sync them. Implement the `POST /api/v2/feed/analytics` endpoint and wire the PWA to batch-send telemetry for the For You feed.
   - **Effort**: S
   - **Impact**: LOW
   - **Dependencies**: None.