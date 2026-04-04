# VIVIM SDK Research-to-Implementation Flow

**Version:** 1.0.0  
**Date:** February 27, 2026  
**Status:** Process Definition

---

## Overview

This document defines the complete workflow for transforming research findings into production-ready code. It provides a structured, traceable process that ensures quality and maintainability.

---

## Table of Contents

1. [The Flow](#the-flow)
2. [Phase 1: Research](#phase-1-research)
3. [Phase 2: Design](#phase-2-design)
4. [Phase 3: Code](#phase-3-code)
5. [Phase 4: Implementation](#phase-4-implementation)
6. [Phase 5: Verification](#phase-5-verification)
7. [Phase 6: Deployment](#phase-6-deployment)
8. [Tracking & Governance](#tracking--governance)

---

## The Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        RESEARCH → IMPLEMENTATION FLOW                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│    │RESEARCH │───▶│ DESIGN  │───▶│  CODE   │───▶│IMPLEMENT│───▶│VERIFY   │  │
│    │         │    │         │    │GENERATE │    │         │    │         │  │
│    └─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┬────┘  │
│         │              │              │              │                  │       │
│         ▼              ▼              ▼              ▼                  ▼       │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│    │Analyze  │    │Spec     │    │Scaffold│    │Complete │    │Test     │  │
│    │Existing │    │API      │    │Code    │    │Logic    │    │& Fix    │  │
│    └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                               │
│    ════════════════════════════════════════════════════════════════════════  │
│                                                                               │
│    GATES:                                                                    │
│    ───────                                                                    │
│    Research Gate   → Design Gate   → Code Gate   → Implementation Gate      │
│         │                │               │                │                   │
│         ▼                ▼               ▼                ▼                   │
│    [Approved]       [Reviewed]      [Complete]       [Verified]              │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Research

### Objectives

- Understand the problem space
- Analyze existing solutions
- Identify gaps and opportunities
- Gather requirements

### Activities

#### 1.1 Initial Discovery

| Activity | Tools | Output |
|----------|-------|--------|
| Explore codebase | explore agents, grep, lsp | Code patterns |
| Find similar features | grep, ast-grep | Implementations |
| Check documentation | librarian agents | External context |
| Review tests | read, glob | Usage patterns |

#### 1.2 Gap Analysis

| Activity | Tools | Output |
|----------|-------|--------|
| Compare requirements | analysis | Gap list |
| Identify dependencies | dependency analysis | Dependency graph |
| Assess complexity | estimation | Effort estimate |

#### 1.3 Requirements Gathering

| Activity | Tools | Output |
|----------|-------|--------|
| Define functional requirements | synthesis | Feature list |
| Define non-functional requirements | synthesis | Constraints |
| Clarify ambiguities | question tool | Clarifications |

### Deliverables

```
docs/research/
└── {topic}/
    ├── index.md              # Executive summary
    ├── analysis.md            # Detailed findings
    ├── gaps.md               # Gap analysis
    ├── requirements.md       # Requirements document
    └── alternatives.md       # Options considered
```

### Gate Criteria

- [ ] Problem clearly stated
- [ ] Scope defined
- [ ] At least 3 sources analyzed
- [ ] Gap list complete
- [ ] Requirements documented
- [ ] Risks identified

---

## Phase 2: Design

### Objectives

- Define the solution architecture
- Design the API surface
- Plan implementation approach
- Identify risks and mitigations

### Activities

#### 2.1 Architecture Design

| Activity | Tools | Output |
|----------|-------|--------|
| Design component structure | synthesis | Architecture diagram |
| Define module boundaries | analysis | Module contracts |
| Design data flows | synthesis | Data flow diagram |
| Identify integration points | analysis | Interface definitions |

#### 2.2 API Design

| Activity | Tools | Output |
|----------|-------|--------|
| Define public API | synthesis | API specification |
| Design type system | synthesis | Type definitions |
| Define error handling | synthesis | Error codes |
| Design events | synthesis | Event definitions |

#### 2.3 Security Design

| Activity | Tools | Output |
|----------|-------|--------|
| Threat modeling | analysis | Threat list |
| Security requirements | synthesis | Security spec |
| Input validation | synthesis | Validation rules |

### Deliverables

```
docs/design/
└── {feature}/
    ├── index.md              # Overview
    ├── architecture.md        # Architecture decisions
    ├── api.md                # API specification
    ├── types.md              # Type definitions
    ├── security.md           # Security considerations
    └── implementation.md      # Implementation plan
```

### Gate Criteria

- [ ] Architecture reviewed
- [ ] API design complete
- [ ] Types defined
- [ ] Security reviewed
- [ ] Implementation plan realistic
- [ ] Risks documented with mitigations

---

## Phase 3: Code Generation

### Objectives

- Generate code scaffolding
- Implement type definitions
- Create basic structure
- Establish patterns

### Activities

#### 3.1 Scaffold Code

| Activity | Tools | Output |
|----------|-------|--------|
| Create directory structure | bash, write | Files |
| Generate type definitions | synthesis | TypeScript types |
| Create interface definitions | synthesis | Interfaces |
| Generate basic implementation | synthesis | Skeleton code |

#### 3.2 Establish Patterns

| Activity | Tools | Output |
|----------|-------|--------|
| Follow existing patterns | analysis | Pattern application |
| Apply naming conventions | style guide | Consistent naming |
| Setup exports | synthesis | Public API |

### Deliverables

```
src/{module}/
├── index.ts                  # Main exports
├── types.ts                  # Type definitions
├── interfaces.ts            # Interface definitions
├── class.ts                 # Main class (skeleton)
├── test/
│   ├── class.test.ts       # Basic tests
│   └── integration.test.ts # Integration tests
└── README.md               # Module documentation
```

### Gate Criteria

- [ ] Directory structure created
- [ ] Types defined
- [ ] Basic scaffolding complete
- [ ] Follows existing patterns
- [ ] Exports properly configured

---

## Phase 4: Implementation

### Objectives

- Implement full functionality
- Write comprehensive tests
- Document the code
- Ensure quality

### Activities

#### 4.1 Core Implementation

| Activity | Tools | Output |
|----------|-------|--------|
| Implement core logic | edit, write | Working code |
| Handle edge cases | analysis | Robust code |
| Add error handling | synthesis | Error cases |
| Implement logging | integration | Debug support |

#### 4.2 Testing

| Activity | Tools | Output |
|----------|-------|--------|
| Write unit tests | write | Test files |
| Write integration tests | write | Integration tests |
| Run existing tests | bash | Test results |
| Fix failures | edit | Passing tests |

#### 4.3 Documentation

| Activity | Tools | Output |
|----------|-------|--------|
| Document public API | write | JSDoc comments |
| Add examples | write | README updates |
| Update index docs | edit | Navigation |

### Deliverables

- Complete implementation
- Passing tests (>80% coverage)
- Updated documentation
- Working examples

### Gate Criteria

- [ ] All functionality implemented
- [ ] Tests passing
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Documentation complete

---

## Phase 5: Verification

### Objectives

- Verify correctness
- Ensure security
- Validate performance
- Confirm quality

### Activities

#### 5.1 Quality Checks

| Activity | Tools | Output |
|----------|-------|--------|
| Run type checker | lsp_diagnostics | Type errors |
| Run linter | lint command | Style issues |
| Run tests | bash | Test results |
| Check coverage | bash | Coverage report |

#### 5.2 Security Review

| Activity | Tools | Output |
|----------|-------|--------|
| Scan for vulnerabilities | analysis | Security issues |
| Check dependencies | audit | Vulnerability report |
| Review auth/authz | manual | Security findings |

#### 5.3 Performance Review

| Activity | Tools | Output |
|----------|-------|--------|
| Benchmark | performance tools | Performance metrics |
| Check complexity | analysis | Algorithmic issues |
| Review memory | profiling | Memory issues |

### Gate Criteria

- [ ] Zero type errors
- [ ] Zero security vulnerabilities
- [ ] Tests >80% coverage
- [ ] Performance acceptable
- [ ] Two approvals received

---

## Phase 6: Deployment

### Objectives

- Merge changes
- Release to production
- Monitor for issues

### Activities

#### 6.1 Release Prep

| Activity | Tools | Output |
|----------|-------|--------|
| Create PR | git | Pull request |
| Resolve conflicts | git | Clean merge |
| Get approvals | review | Approved PR |

#### 6.2 Release

| Activity | Tools | Output |
|----------|-------|--------|
| Merge to main | git | Merged code |
| Tag release | git | Version tag |
| Build | bash | Distribution |
| Publish | npm | Published package |

### Gate Criteria

- [ ] PR merged
- [ ] Version tagged
- [ ] Build passes
- [ ] Package published

---

## Tracking & Governance

### Decision Log

Every significant decision must be documented:

```markdown
# ADR: {Decision Title}

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Date
{YYYY-MM-DD}

## Context
[What prompted this decision?]

## Decision
[What was decided?]

## Consequences
### Positive
- [List]

### Negative
- [List]

## Alternatives
### Rejected
- [Option]: [Reason]

### Deferred
- [Option]: [Reason]

## Related
- Research: [Link]
- Design: [Link]
```

### Progress Tracking

Use this template for tracking:

```markdown
# Project: {Name}

## Status: {In Progress | Blocked | Complete}

## Phase Progress

| Phase | Status | Notes |
|-------|--------|-------|
| Research | ████████░░ 80% | Gap analysis complete |
| Design | ████░░░░░░ 40% | API design in progress |
| Code | ░░░░░░░░░░ 0% | Not started |
| Implementation | ░░░░░░░░░░ 0% | Not started |
| Verification | ░░░░░░░░░░ 0% | Not started |
| Deployment | ░░░░░░░░░░ 0% | Not started |

## Blockers
- [Blocker 1]
- [Blocker 2]

## Next Steps
- [ ] Next action 1
- [ ] Next action 2
```

### Quality Metrics

Track these metrics:

| Metric | Target | Current |
|--------|--------|---------|
| Type Errors | 0 | - |
| Test Coverage | >80% | - |
| Lint Issues | 0 | - |
| Security Vulns | 0 | - |
| PRs Approved | 2+ | - |

---

## Quick Reference

### Flow Checklist

```
☐ Research
  ☐ Explore codebase
  ☐ Analyze gaps
  ☐ Define requirements
  ☐ Document findings

☐ Design
  ☐ Architecture complete
  ☐ API defined
  ☐ Types specified
  ☐ Security reviewed

☐ Code
  ☐ Scaffold created
  ☐ Types implemented
  ☐ Basic structure

☐ Implementation
  ☐ Core logic complete
  ☐ Tests passing
  ☐ Documentation updated

☐ Verification
  ☐ Type checking passes
  ☐ Linting passes
  ☐ Security review complete

☐ Deployment
  ☐ PR created
  ☐ PR approved
  ☐ Merged
  ☐ Published
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Unclear requirements | Go back to research |
| Design gaps | Return to design |
| Test failures | Fix implementation |
| Type errors | Update types |
| Security issues | Address in implementation |

---

## Integration with AI Agents

### Agent Prompts

#### Research Phase
```
You are a research agent. Your task is to:
1. Explore the codebase to understand [topic]
2. Identify gaps in current implementation
3. Define requirements for [feature]
4. Document findings in docs/research/[topic]/
```

#### Design Phase
```
You are a design agent. Your task is to:
1. Create architecture for [feature]
2. Design the API surface
3. Define types and interfaces
4. Document in docs/design/[feature]/
```

#### Implementation Phase
```
You are an implementation agent. Your task is to:
1. Implement the code as specified in docs/design/[feature]/
2. Write tests
3. Ensure type safety
4. Update documentation
```

### Session Continuity

Always use session_id when continuing work:
```typescript
// Continue from previous session
task(session_id="ses_abc123", prompt="Continue implementation...")
```

---

## Templates Reference

| Template | Location | Use For |
|----------|----------|---------|
| Research | docs/templates/research.md | Research phase |
| Design | docs/templates/design.md | Design phase |
| Implementation | docs/templates/implementation.md | Code phase |
| Review | docs/templates/review.md | Review phase |
| Session | docs/context/session-{date}.md | Active work |
| Decision | docs/history/decisions/YYYY-MM-DD-{slug}.md | Decisions |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-27 | Initial document |

---

*Last updated: February 27, 2026*
*Version: 1.0.0*
