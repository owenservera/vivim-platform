# Docusaurus Consolidation & Upgrade Plan

## Phase 1: Clean Up (Immediate)
1. **Delete Legacy Project:** Remove `vivim-live-source/docs/`.
2. **Unify Content:** Move any unique content from root `docs/` to `vivim.docs.context/docs/`.
3. **Symlink:** Create a symlink from root `docs` to `vivim.docs.context/docs` to maintain backward compatibility with external links.

## Phase 2: Technical Upgrade
1. **Install Search:**
   ```bash
   bun add docusaurus-search-local
   ```
2. **Configure Mermaid:** Ensure all mermaid diagrams are utilizing the latest `@docusaurus/theme-mermaid` features (like interactive zooming if available).
3. **PWA Refresh:** Update `manifest.json` and icons in `static/` to match the latest VIVIM branding.

## Phase 3: Content Enrichment
1. **SDK Sync:** Run an automated script to detect all classes in `sdk/src` and ensure they have a corresponding `.md` file in `docs/sdk/`.
2. **API Generation:** Use `docusaurus-plugin-openapi-docs` to generate documentation from the server's Swagger/OpenAPI spec.
3. **PWA Component Library:** Create a visual gallery of PWA components using the `pwa/src/components` directory.
