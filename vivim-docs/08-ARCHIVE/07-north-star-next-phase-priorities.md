# DOCUMENT 7: NORTH STAR & NEXT PHASE PRIORITIES

---

## North Star

### 1-Sentence North Star

**"VIVIM is the default place where people interact with AI content socially — where users own their intelligence, can import from any provider, and share, fork, and build on each other's AI conversations."**

---

## Success Metrics

### 6 Months

**What Success Looks Like**:
- **Users**: 10,000-50,000 monthly active users
- **Conversations**: 100,000+ imported conversations
- **ACUs**: 1M+ atomic chat units created
- **Sharing**: 1,000+ active shared conversations/ACUs
- **Providers**: Support for top 5 providers stable

**Revenue**: Pre-revenue (still validating product)

**Product Maturity**:
- Capture pipeline reliable for top providers
- Context engine working end-to-end
- Basic sharing functionality live
- Mobile PWA functional

---

### 12 Months

**What Success Looks Like**:
- **Users**: 100,000-500,000 monthly active users
- **Conversations**: 1M+ imported
- **ACUs**: 10M+ created
- **Social**: 10,000+ shared threads/forks
- **Revenue**: First revenue (freemium or marketplace pilot)

**Product Maturity**:
- Per-user database isolation (or clear roadmap)
- E2E encryption for sensitive data
- Feed/discovery system live
- Mobile apps (native or improved PWA)

---

## Highest Leverage Things to Build/Resolve RIGHT NOW

### Priority 1: Capture Reliability

**Why**: Core value proposition depends on it.

**What**:
- Fix capture to attach userId during import
- Add retry logic with exponential backoff
- Add circuit breakers
- Create fallback extraction strategies
- Consider API integrations where available

**Impact**: Without this, nothing else matters.

---

### Priority 2: Context Engine End-to-End

**Why**: Key differentiator, makes AI interactions better.

**What**:
- Complete bundle compilation pipeline
- JIT retrieval from ACUs and memories
- User-facing context settings UI
- ContextCockpit visualization

**Impact**: Demonstrates unique value.

---

### Priority 3: Basic Sharing Live

**Why**: Enables network effects.

**What**:
- Share link creation and viewing
- Basic permissions (view only to start)
- Fork functionality UI
- Share notification

**Impact**: First step toward social graph.

---

### Priority 4: User Data Isolation

**Why**: Trust requirement for sensitive users.

**What**:
- Architecture decision locked
- Migration path designed
- Start with isolation for new users
- Migrate existing users over time

**Impact**: Major trust differentiator.

---

### Priority 5: Mobile Experience

**Why**: Miss mobile users.

**What**:
- Improve PWA to feel native
- Add to app stores (even as PWA wrapper)
- OR build React Native app

**Impact**: Broader addressable market.

---

## Prerequisites for Default Social Platform

### What Would Need to Be True

1. **Users can import from anywhere**
   - Capture works reliably for top providers
   - User can export their data anytime

2. **Sharing is frictionless**
   - One-tap share from any ACU
   - Link works without login for viewers
   - Fork is intuitive

3. **Content is discoverable**
   - Feed shows relevant shared ACUs
   - Search works across public content
   - Topic/entity clustering works

4. **It gets smarter**
   - Context engine demonstrably improves responses
   - User sees personalization working

5. **Trust is earned**
   - Security audited
   - Encryption working
   - No major breaches

6. **Network effects kick in**
   - Users invite others
   - Shared content drives engagement
   - Creator economy emerges

---

## Emerging AI Capabilities

### Capabilities Architecture is Positioned to Leverage

#### 1. Agent Orchestration

**Current State**: Architecture can support agent coordination.

**How**:
- Context engine can provide agent context
- Memory system for agent state
- P2P for multi-agent communication

**Action**: Monitor and integrate as agents become mainstream.

---

#### 2. Memory Systems

**Current State**: Comprehensive memory model exists.

**Capabilities**:
- EPISODIC, SEMANTIC, PROCEDURAL memory types
- Consolidation and merging
- Importance scoring
- Relationship graph

**Uniqueness**: More sophisticated than most AI memory implementations.

**Action**: Complete memory extraction and consolidation pipeline.

---

#### 3. Multimodal

**Current State**: Some support in UI (code, tables, images mentioned).

**Gaps**:
- ACUs support code, tables, images
- But multimodal extraction not visible
- Embeddings support exists

**Action**: Add multimodal ACU extraction.

---

#### 4. Long Context

**Current State**: Context engine handles token budgets.

**Capabilities**:
- Token budget allocation across layers
- Compaction/summarization (ConversationCompaction)
- Multi-level compression strategies

**Action**: Validate budget allocation with user testing.

---

### Capabilities Currently Failing to Leverage

#### 1. Real-time Collaboration

**Gap**: P2P infrastructure exists but not integrated.

**What Should Happen**: Enable real-time co-editing of ACUs via CRDT.

---

#### 2. Function Calling / Tools

**Gap**: Limited tool-use visibility in schema.

**What Should Happen**: Expose tool definitions in ACUs, enable tool sharing.

---

#### 3. Model Routing

**Gap**: BYOK exists but smart routing not visible.

**What Should Happen**: Context-aware model selection based on query type.

---

## Strategic Recommendations

### Do Now (0-3 months)

1. **Fix capture** - Make it reliable
2. **Ship sharing** - Get network effects started
3. **Complete context engine** - Differentiate

### Do Soon (3-6 months)

4. **Data isolation** - Build trust
5. **Mobile** - Expand reach
6. **Discovery** - Enable network effects

### Do Later (6-12 months)

7. **E2E encryption** - Maximum trust
8. **P2P integration** - Offline-first
9. **Marketplace** - Economy

---

## Key Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Capture gets blocked | High | High | API negotiations, multiple strategies |
| Too complex for users | Medium | High | Simplify, defaults |
| No network effects | Medium | High | Seed content, incentives |
| Incumbents add features | Medium | Medium | Move fast, stay unique |
| Security breach | Low | High | Audit, encryption |

---

## Summary

**North Star**: Default social platform for AI content.

**6-month goal**: 10K-50K users, working capture, basic sharing, functional context engine.

**12-month goal**: 100K-500K users, first revenue, trust features, discoverable content.

**Now**: Focus on reliability (capture), differentiation (context), growth (sharing).
