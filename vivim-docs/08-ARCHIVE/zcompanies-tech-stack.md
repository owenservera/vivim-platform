# Z-Companies: Tech Stack Gap Analysis

## Document Context

This file accompanies `01-tech-stack.md` and identifies gaps in the technology stack choices.

---

## Framework & Runtime Gaps

### React 19 Usage

| Gap ID     | Issue                                           | Impact                                        | Recommendation                         |
| ---------- | ----------------------------------------------- | --------------------------------------------- | -------------------------------------- |
| TS-RCT-001 | React 19 is very new, limited ecosystem support | Potential compatibility issues with libraries | Monitor React ecosystem for stability  |
| TS-RCT-002 | Concurrent features not fully utilized          | Not taking full advantage of React 19         | Implement useTransition, useOptimistic |

### Bun Runtime

| Gap ID     | Issue                                  | Impact                          | Recommendation                  |
| ---------- | -------------------------------------- | ------------------------------- | ------------------------------- |
| TS-BUN-001 | Bun is not as battle-tested as Node.js | Production reliability concerns | Keep Node.js as fallback option |
| TS-BUN-002 | Limited hosting platform support       | Deployment limitations          | Ensure Node.js compatibility    |

---

## Dependency Gaps

### Critical Dependencies Without Updates

| Dependency | Current | Latest | Risk                       |
| ---------- | ------- | ------ | -------------------------- |
| TweetNaCl  | 1.0.3   | 1.0.3  | Low - no updates available |
| Socket.io  | 4.8.3   | 4.8.x  | OK                         |

### Potential Security Concerns

| Dependency                     | Concern                   | Severity | Mitigation                          |
| ------------------------------ | ------------------------- | -------- | ----------------------------------- |
| puppeteer-extra-plugin-stealth | Anti-detection techniques | Medium   | Review usage, consider alternatives |
| cheerio                        | HTML parsing              | Low      | Keep updated                        |

---

## Missing Dependencies

### Infrastructure Gaps

| Gap            | Why Needed            | Priority |
| -------------- | --------------------- | -------- |
| Redis          | Caching layer         | High     |
| Sentry/Datadog | Error tracking        | High     |
| CDN            | Static asset delivery | Medium   |

### Development Gaps

| Gap                    | Why Needed                  | Priority |
| ---------------------- | --------------------------- | -------- |
| Prettier config        | Code formatting consistency | Low      |
| TypeScript strict mode | Type safety                 | Medium   |

---

## Recommendation Matrix

| Category       | Current | Recommended  | Effort |
| -------------- | ------- | ------------ | ------ |
| Error Tracking | None    | Sentry       | Medium |
| Caching        | None    | Redis        | High   |
| Monitoring     | Pino    | Pino + APM   | Medium |
| Testing        | Vitest  | + Playwright | High   |

---

_Last Updated: February 2026_
