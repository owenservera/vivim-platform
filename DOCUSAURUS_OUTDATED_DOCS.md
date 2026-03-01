# Outdated Documentation Registry

## 1. SDK Gap Analysis (`SDK_GAP_ANALYSIS.md`)
* **Reported Missing:** `FederationClient` node.
* **Actual State:** Implemented in `sdk/src/nodes/federation-client-node.ts` (Feb 27, 2026).
* **Action:** Update status to ✅ Complete and recalculate gap percentages.

## 2. Atomic Feature Inventory (`ATOMIC_FEATURE_INVENTORY.md`)
* **Reported Status:** 930+ Features.
* **Issue:** Several "Complete" features are actually "Minimal/Basic" (e.g., Federation).
* **Action:** Perform a cross-reference audit with `server/src/routes` and `pwa/src/features`.

## 3. Documentation Update Summary (`DOCUMENTATION_UPDATE_SUMMARY.md`)
* **Issue:** Dated Feb 26, 2026. Missed the major "Phase 2 Expansion" push on Feb 27/28.
* **Action:** Issue a new summary covering the SDK node expansion.

## 4. Root `docs/` vs `vivim.docs.context/docs/`
* **Desync:** `vivim.docs.context/docs/sdk/` contains more detailed node documentation that is missing from the root `docs/` folder.
* **Action:** Delete root `docs/` and replace with a symlink to `vivim.docs.context/docs/`.
