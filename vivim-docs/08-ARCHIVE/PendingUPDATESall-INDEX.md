# VIVIM — Pending Updates Master Index

**Generated**: 2026-03-05  
**Source**: `.archive/.dev/` audit documents (excluding `compare-to-gap-VIVIM_UPGRADE_PLAN.md`)  
**Status**: Pending Implementation  

---

## Document Set

This comprehensive task list is split into **3 documents** by priority tier:

| Document | Priority Tier | Task Count | Est. Effort |
|----------|--------------|------------|-------------|
| [`PendingUPDATESall-01-critical.md`](./PendingUPDATESall-01-critical.md) | 🔴 CRITICAL | 11 tasks | ~12-14 days |
| [`PendingUPDATESall-02-high.md`](./PendingUPDATESall-02-high.md) | 🟡 HIGH | 14 tasks | ~10-12 days |
| [`PendingUPDATESall-03-medium-low.md`](./PendingUPDATESall-03-medium-low.md) | 🟢 MEDIUM/LOW | 16 tasks | ~14-18 days |
| **TOTAL** | **All Tiers** | **41 tasks** | **~36-44 days** |

---

## Quick Reference: Top 10 Priority Tasks

1. **VIVIM-GAP-014** — WebSocket write-back (data loss prevention)
2. **VIVIM-GAP-015** — SQL injection patch (security vulnerability)
3. **VIVIM-GAP-019** — JWT expiration (security hardening)
4. **VIVIM-GAP-021** — CSRF protection (security compliance)
5. **VIVIM-GAP-016** — Data export implementation (GDPR compliance)
6. **VIVIM-GAP-020** — Rate limiting (system stability)
7. **VIVIM-GAP-026** — Desktop sidebar navigation (desktop UX)
8. **VIVIM-GAP-038** — Email notification service (user engagement)
9. **VIVIM-GAP-022** — E2E encryption (privacy enforcement)
10. **VIVIM-GAP-017** — Admin network telemetry (admin visibility)

---

## Task Status Legend

| Symbol | Meaning |
|--------|---------|
| ⚠️ OPEN | Not yet started |
| 🟡 IN_PROGRESS | Currently being implemented |
| ✅ DONE | Completed |
| 🔴 BLOCKED | Blocked by dependency |

---

## Effort Estimation Scale

| Label | Duration | Description |
|-------|----------|-------------|
| XS | < 0.5 days | Trivial fix, single file |
| S | 0.5-1 days | Small change, 1-2 files |
| M | 1-3 days | Moderate change, multiple files |
| L | 3-5 days | Large change, coordinated effort |
| XL | 5+ days | Major refactor or new feature |

---

## Impact Categories

| Category | Description |
|----------|-------------|
| DATA LOSS | Prevents data loss or corruption |
| SECURITY | Addresses security vulnerabilities |
| GDPR | Required for regulatory compliance |
| STABILITY | Prevents system crashes or overload |
| PRIVACY | Enforces user privacy guarantees |
| ADMIN | Improves operational visibility |
| PERFORMANCE | Improves query/load performance |
| OPERATIONS | Improves monitoring/debugging |
| INTEGRITY | Ensures data consistency |
| DESKTOP UX | Improves desktop user experience |
| UX POLISH | Visual/refinement improvements |
| UX CLARITY | Makes error states clearer |
| DESIGN SYSTEM | Consolidates design tokens |
| ACCESSIBILITY | Improves a11y compliance |
| MOBILE PERF | Improves mobile performance |
| ARCHITECTURE | Cleans up architectural patterns |
| RECOMMENDATIONS | Enables feed/recommendation system |
| DATABASE | Improves database hygiene |
| ENGAGEMENT | Increases user engagement |
| FUTURE-PROOF | Long-term security/tech debt |
| USER CONTROL | Gives users more configuration |
| NETWORK EFFECTS | Enables social discovery |
| CAPTURE UX | Improves capture experience |
| FEDERATION | Enables ActivityPub federation |
| MOBILE REACH | Expands mobile presence |
| REVENUE | Creates monetization path |
| DATA SOVEREIGNTY | Enables per-user isolation |
| UX SMOOTHNESS | Makes UI more responsive |
| LOAD PERF | Improves initial load time |
| QUALITY | Adds test coverage |
| SCALABILITY | Improves scale handling |
| CODE QUALITY | Reduces duplication |
| OPERATIONS | Enables monitoring/alerting |

---

## Source Documents

These tasks were extracted from the following audit documents:

- `00-MASTER-TASK-LIST.md`
- `01-PROJECT-OVERVIEW.md`
- `02-SYSTEM-ARCHITECTURE.md`
- `03-FEATURE-INVENTORY.md`
- `04-DATA-MODELS-SCHEMA.md`
- `05-API-ROUTE-INVENTORY.md`
- `06-FRONTEND-INVENTORY.md`
- `07-IMPLEMENTATION-GAPS.md`
- `08-SECURITY-AUTH-AUDIT.md`
- `09-BACKGROUND-JOBS-PIPELINE.md`
- `10-DEPENDENCY-HEALTH.md`
- `11-ENVIRONMENT-DEVOPS.md`
- `12-DESIGN-SYSTEM.md`
- `13-USER-FLOWS.md`
- `14-OPEN-QUESTIONS-STRATEGY.md`
- `15-ROADMAP-COMPETITIVE.md`
- `16-ASSISTANT-UI-GUIDELINES.md`
- `ARCHITECTURE_AUDIT.md`
- `VIVIM_COMPLETE_BLUEPRINT_todo.md`

---

## Implementation Guidelines

### Session Planning
1. **Start with CRITICAL tier** — These are blocking for production
2. **Batch by file/domain** — Minimize context switching
3. **Test after each task** — Verify acceptance criteria met
4. **Update this document** — Mark tasks as ✅ DONE when complete

### Git Workflow
1. Create feature branch per task: `fix/VIVIM-GAP-XXX`
2. Commit with clear message: `fix: implement WebSocket write-back (VIVIM-GAP-014)`
3. PR with task ID in title
4. Link PR to this document in comments

### Testing Requirements
- **CRITICAL tasks**: Require unit tests + integration tests
- **HIGH tasks**: Require manual testing checklist
- **MEDIUM/LOW tasks**: Require smoke testing

---

## Production Gate

**Before deploying to production, ensure:**

### Must-Have (CRITICAL Tier Complete)
- [ ] VIVIM-GAP-014 (WebSocket write-back)
- [ ] VIVIM-GAP-015 (SQL injection)
- [ ] VIVIM-GAP-019 (JWT expiration)
- [ ] VIVIM-GAP-021 (CSRF protection)
- [ ] VIVIM-GAP-016 (Data export)

### Should-Have (HIGH Tier Partial)
- [ ] VIVIM-GAP-026 (Desktop sidebar)
- [ ] VIVIM-GAP-038 (Email service)
- [ ] VIVIM-GAP-020 (Rate limiting)
- [ ] VIVIM-GAP-022 (E2E encryption)

### Nice-to-Have (Post-Launch)
- MEDIUM and LOW tier tasks can be implemented post-launch

---

## Contact & Questions

For questions about specific tasks, refer to the source audit documents in `.archive/.dev/`.

**Last Updated**: 2026-03-05  
**Next Review**: After each implementation session
