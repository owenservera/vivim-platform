# VIVIM Corpus-Chatbot Integration

**Documentation Readiness Package**

This folder contains the complete integration plan for adding the dual-engine corpus chatbot system to the existing VIVIM memory and context infrastructure.

---

## Quick Navigation

| Document | Purpose | Status |
|----------|---------|--------|
| [01-schema-integration-mapping.md](./01-schema-integration-mapping.md) | Schema comparison and integration mapping | ✅ Complete |
| [02-implementation-plan.md](./02-implementation-plan.md) | 8-week detailed implementation roadmap | ✅ Complete |
| [03-migration-strategy.md](./03-migration-strategy.md) | Progressive migration with zero downtime | ✅ Complete |

---

## Executive Summary

### What We're Building

A **company chatbot system** that:

1. **Answers from company documentation** using a Corpus Context Engine (C0-C4 layers)
2. **Remembers every visitor** without requiring login via Virtual User Identification
3. **Blends both intelligently** using a Dual-Engine Orchestrator
4. **Makes users feel recognized** with Intelligent User Memory and conversation awareness

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPANY CHATBOT WIDGET                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              DUAL-ENGINE ORCHESTRATOR                            │
│                                                                  │
│  Intent Classifier → Weight Calculator → Budget Allocator       │
│                                                                  │
│         ┌──────────────────┐    ┌──────────────────┐            │
│         │  USER CONTEXT    │    │  CORPUS CONTEXT  │            │
│         │  (L0-L7)         │    │  (C0-C4)         │            │
│         │  Existing VIVIM  │    │  New System      │            │
│         └────────┬─────────┘    └────────┬─────────┘            │
│                  └──────────┬─────────────┘                     │
│                             ▼                                   │
│                  ┌──────────────────┐                          │
│                  │  CONTEXT MERGER  │                          │
│                  └────────┬─────────┘                          │
│                           ▼                                     │
│                  ┌──────────────────┐                          │
│                  │  MERGED PROMPT   │                          │
│                  └────────┬─────────┘                          │
│                           ▼                                     │
│                  ┌──────────────────┐                          │
│                  │  LLM INFERENCE   │                          │
│                  └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Corpus Engine** | 5-layer context system (C0-C4) for company knowledge | Ready to implement |
| **Dual-Engine Orchestration** | Dynamic blending of corpus + user context | Ready to implement |
| **Intent Classification** | Rule-based + LLM classification for engine weighting | Ready to implement |
| **Conversation Awareness** | Full conversation indexing for recall | Ready to implement |
| **Progressive Memory** | Real-time + session-end + consolidation extraction | Ready to implement |
| **User Profile Evolution** | Avatar-based maturity tracking (STRANGER → KNOWN) | Ready to implement |
| **Proactive Awareness** | Doc update detection, feature release matching | Ready to implement |
| **Multi-Tenant** | Company-specific deployments with isolation | Ready to implement |

---

## Schema Integration Summary

### New Models (9)

| Model | Purpose | Integration Risk |
|-------|---------|------------------|
| `Tenant` | Multi-tenant company deployment | ✅ None (new) |
| `CorpusDocument` | Company document storage | ✅ None (new) |
| `CorpusDocumentVersion` | Document versioning | ✅ None (new) |
| `CorpusChunk` | Chunked content with embeddings | ✅ None (new) |
| `CorpusTopic` | Topic taxonomy | ✅ None (new) |
| `CorpusFAQ` | FAQ pairs | ✅ None (new) |
| `ConversationIndex` | Conversation summary index | ✅ None (new) |
| `UserProfileSnapshot` | Evolving user profile | ✅ None (new) |
| `OrchestrationLog` | Telemetry | ✅ None (new) |

### Extended Models (2)

| Model | Extension | Backward Compatible |
|-------|-----------|---------------------|
| `VirtualUser` | Add `tenantId`, `currentAvatar`, `profileVersion` | ✅ Yes (nullable fields) |
| `Conversation` | Optional tenant link (via metadata) | ✅ Yes (optional) |

### New Enums (7)

- `UserAvatar` - STRANGER, ACQUAINTANCE, FAMILIAR, KNOWN
- `TopicScope` - USER, CORPUS
- `ChunkContentType` - prose, code, table, list, mixed
- `DocumentChangeType` - major, minor, patch
- `OrchestrationIntent` - 13 intent types
- `ConversationSentiment` - positive, neutral, negative, mixed
- `ResolutionStatus` - resolved, pending, escalated, unknown

**Schema Compatibility:** ✅ EXCELLENT - Zero breaking changes

---

## Implementation Timeline

### 8-Week Roadmap

```
Week 1-2:  Corpus Engine Foundation     [████████░░░░░░░░] 25%
Week 3-4:  Dual-Engine Orchestrator     [████████████████] 50%
Week 5-6:  Intelligent User Memory      [████████████████] 75%
Week 7-8:  Polish + Multi-Tenant        [████████████████] 100%
```

### Phase Deliverables

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Week 1-2** | Corpus Foundation | Schema, parsers, chunker, embedding, retrieval, caching |
| **Week 3-4** | Orchestrator | Intent classifier, weight calculator, budget allocator, context merger |
| **Week 5-6** | User Memory | Conversation index, recall, progressive extraction, profile evolution |
| **Week 7-8** | Production | Multi-tenant, analytics, rate limiting, load testing, docs |

**Total Effort:** ~320 engineering hours

---

## Migration Strategy

### 4-Phase Progressive Migration

| Phase | Migration | Duration | Risk |
|-------|-----------|----------|------|
| 1 | `add_corpus_core_models` | 2-4 hours | Low |
| 2 | `add_virtual_user_chatbot_fields` | 1-2 hours | Low |
| 3 | `add_conversation_awareness_models` | 2-3 hours | Low |
| 4 | `add_orchestration_telemetry` | 1 hour | Minimal |

**Total Migration Time:** 6-10 hours (can be spread across days)  
**Rollback Time:** ~2 hours (worst case)  
**Downtime:** ZERO (progressive, backward compatible)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Assembly Time** | < 800ms | P95 latency |
| **Corpus Confidence** | > 0.6 avg | Avg confidence score |
| **Identification Rate** | > 85% | Returning users identified |
| **Memory Density** | > 5/week | Memories created per user |
| **Cache Hit Rate** | > 70% | Corpus cache hits |
| **User Satisfaction** | > 4.0/5.0 | Thumbs up rate |

---

## Getting Started

### Prerequisites

- [ ] PostgreSQL 14+ with pgvector extension
- [ ] Prisma CLI installed
- [ ] Node.js 20+
- [ ] OpenAI API key (for embeddings + LLM)
- [ ] Redis (optional, for L2 cache)

### Quick Start

```bash
# 1. Clone repository
cd server

# 2. Install dependencies
bun install

# 3. Set environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Run first migration
npx prisma migrate dev --name add_corpus_core_models

# 5. Generate Prisma Client
npx prisma generate

# 6. Start development server
bun run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/vivim

# Corpus
CORPUS_DEFAULT_MODEL=gpt-4o
CORPUS_EMBEDDING_MODEL=text-embedding-3-small
CORPUS_MAX_CONTEXT_TOKENS=12000

# Virtual User
VIRTUAL_USER_ENABLED=true
VIRTUAL_USER_CONSENT_REQUIRED=true
VIRTUAL_USER_DEFAULT_RETENTION_POLICY=90_days

# OpenAI
OPENAI_API_KEY=sk-...

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

---

## Document History

| Date | Change | Author |
|------|--------|--------|
| 2026-03-27 | Initial documentation package created | AI Assistant |
| | - Schema integration mapping | |
| | - 8-week implementation plan | |
| | - 4-phase migration strategy | |

---

## Next Steps

1. **Review documents** - Ensure all stakeholders understand the architecture
2. **Approve implementation plan** - Get sign-off on 8-week timeline
3. **Set up development environment** - Install dependencies, configure database
4. **Begin Week 1 implementation** - Start with corpus core models

---

## Support & Questions

For questions about this integration:

1. Review the [Schema Integration Mapping](./01-schema-integration-mapping.md) for database details
2. Check the [Implementation Plan](./02-implementation-plan.md) for week-by-week tasks
3. Read the [Migration Strategy](./03-migration-strategy.md) for deployment details

**Original Design Document:** `CHAT BOT context and memory opus 4.6.md` (3601 lines)  
**Existing VIVIM Schema:** `prisma/schema.prisma` (2787 lines)

---

**Status:** ✅ READY FOR IMPLEMENTATION  
**Last Updated:** March 27, 2026
