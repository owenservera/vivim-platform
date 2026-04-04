# VIVIM Open Core — Roadmap

## Timeline Overview

| Phase | Timeframe | Focus |
|-------|-----------|-------|
| **Phase 1: Establish** | Q1–Q2 2025 | Ship core, establish standard |
| **Phase 2: Ecosystem** | Q3 2025 | Build integrations |
| **Phase 3: Community** | Q4 2025 – Q1 2026 | Grow adoption |

---

## Phase 1: Establish the Standard (Q1–Q2 2025)

### Goals
- Ship the core open-source release
- Establish ACU as the de facto standard
- Get VIVIM into developer hands

### Milestones

- [ ] **Publish ACU specification** as standalone versioned document at `spec.vivim.live`
- [ ] **Ship OpenAI + Claude import parsers** as headline open-source release
- [ ] **Release @vivim/sdk v1.0** on npm with full documentation
- [ ] **Publish MCP server** — get VIVIM into Claude Desktop and Cursor immediately
- [ ] **Docker Compose one-click** self-hosted deployment
- [ ] **Write developer documentation** for all 7 pillars
- [ ] **Resolve P0 documentation debt** from gap list

### Success Metrics

| Metric | Target |
|--------|--------|
| GitHub stars | 500 |
| npm installs (@vivim/sdk) | 1,000 |
| Provider parsers available | 2 |
| External contributors | 1 |

---

## Phase 2: Build the Ecosystem (Q3 2025)

### Goals
- Expand provider coverage
- Build integration ecosystem
- Enable enterprise adoption

### Milestones

- [ ] **Full provider import library** (5+ providers)
- [ ] **LangChain + LlamaIndex adapters**
- [ ] **n8n / Make / Zapier connectors**
- [ ] **Browser extension SDK**
- [ ] **Kubernetes Helm chart** for enterprise self-hosting
- [ ] **vivim-network v1 stable** (decentralized sync)
- [ ] **Resolve P1 documentation debt** from gap list

### Success Metrics

| Metric | Target |
|--------|--------|
| GitHub stars | 2,000 |
| npm installs | 5,000 |
| Provider parsers available | 8 |
| External contributors | 5 |
| Community integrations | 6 |

---

## Phase 3: Grow the Community (Q4 2025 – Q1 2026)

### Goals
- Establish VIVIM as the standard
- Enable community contributions
- Scale adoption

### Milestones

- [ ] **Obsidian + Notion + Logseq plugins**
- [ ] **Community parser framework** (external contribution guide + CI validation)
- [ ] **First external community-contributed parser** merged
- [ ] **S3-compatible storage adapter** (MinIO, Backblaze B2)
- [ ] **Key rotation and recovery tools**
- [ ] **Resolve P2 documentation debt** from gap list
- [ ] **10+ external contributors** active

### Success Metrics

| Metric | Target |
|--------|--------|
| GitHub stars | 5,000 |
| npm installs | 25,000 |
| Provider parsers available | 12+ |
| External contributors | 10+ |
| Community integrations | 10+ |
| ACU spec external adoptions | 3+ |

---

## Feature Roadmap by Pillar

### Pillar 1: ACU Specification & Context Engine

| Feature | Status | Target |
|---------|--------|--------|
| ACU specification | ✅ Live | Shipped |
| 8-layer assembly | ✅ Live | Shipped |
| Cortex system | ✅ Live | Shipped |
| Context prediction | ✅ Live | Shipped |
| Memory decay optimization | 🔄 In Progress | Q2 2025 |
| Advanced local model adapter | 🔄 In Progress | Q2 2025 |
| Context compression | 📋 Planned | Q3 2025 |

### Pillar 2: Provider Data Import

| Feature | Status | Target |
|---------|--------|--------|
| OpenAI parser | ✅ Live | Shipped |
| Claude parser | 🔄 In Progress | Q2 2025 |
| Gemini parser | 🔄 In Progress | Q2 2025 |
| Universal OpenAI-compatible | 📋 Planned | Q2 2025 |
| Ollama/LM Studio/Jan | 📋 Planned | Q3 2025 |
| Cursor/Windsurf/Continue | 📋 Planned | Q3 2025 |
| Community parser framework | 📋 Planned | Q4 2025 |

### Pillar 3: Identity & Portability

| Feature | Status | Target |
|---------|--------|--------|
| DID toolkit | ✅ Live | Shipped |
| Zero-knowledge keys | ✅ Live | Shipped |
| Trust seal components | ✅ Live | Shipped |
| Memory export (JSON/SQLite) | 🔄 In Progress | Q2 2025 |
| IPFS export | 🔄 In Progress | Q2 2025 |
| S3-compatible storage | 📋 Planned | Q2 2025 |
| Key rotation | 📋 Planned | Q3 2025 |

### Pillar 4: Network & Federation

| Feature | Status | Target |
|---------|--------|--------|
| P2P node | ✅ Live | Shipped |
| Federation | ✅ Live | Shipped |
| ActivityPub | ✅ Live | Shipped |
| Instance discovery | ✅ Live | Shipped |
| Network v1 stable | 🔄 In Progress | Q3 2025 |

### Pillar 5: SDK & Developer Toolkit

| Feature | Status | Target |
|---------|--------|--------|
| SDK v1.0 | ✅ Live | Shipped |
| MCP server | ✅ Live | Shipped |
| LangChain adapter | 📋 Planned | Q2 2025 |
| LlamaIndex adapter | 📋 Planned | Q2 2025 |
| Browser extension SDK | 📋 Planned | Q3 2025 |
| n8n/Make/Zapier | 📋 Planned | Q3 2025 |

### Pillar 6: Self-Hosted Stack

| Feature | Status | Target |
|---------|--------|--------|
| Server | ✅ Live | Shipped |
| PWA | ✅ Live | Shipped |
| Network | ✅ Live | Shipped |
| Docker Compose | ✅ Live | Shipped |
| Helm chart | 📋 Planned | Q3 2025 |

### Pillar 7: Community Integrations

| Feature | Status | Target |
|---------|--------|--------|
| MCP tools | ✅ Live | Shipped |
| ActivityPub | ✅ Live | Shipped |
| LangChain | 📋 Planned | Q2 2025 |
| n8n/Make/Zapier | 📋 Planned | Q3 2025 |
| Obsidian plugin | 📋 Planned | Q4 2025 |
| Notion plugin | 📋 Planned | Q4 2025 |
| Logseq plugin | 📋 Planned | Q4 2025 |

---

## Commercial Layer Roadmap

The commercial layer (VIVIM Cloud, Teams, Enterprise) is currently in development. The following milestones are planned:

| Feature | Target |
|---------|--------|
| VIVIM Cloud (beta) | Q3 2025 |
| VIVIM Teams | Q4 2025 |
| SOC 2 Type II | Q1 2026 |
| HIPAA BAA | Q2 2026 |
| VIVIM Enterprise | Q2 2026 |
| FedRAMP | Q4 2026 |

---

*Document version: 1.0*
*Purpose: Product roadmap for VIVIM Open Core*
*Last updated: March 2026*
