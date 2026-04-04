# VIVIM SDK AI Agent Documentation System

**Version:** 1.0.0  
**Date:** February 27, 2026  
**Status:** Design Document

---

## Overview

This document describes the AI Agent Documentation System for the VIVIM SDK. It provides a structured approach for AI agents to understand, navigate, and contribute to the SDK development.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Knowledge Architecture](#knowledge-architecture)
3. [Documentation Layers](#documentation-layers)
4. [Agent Workflow Templates](#agent-workflow [Context-templates)
5. Files](#context-files)
6. [Research Protocol](#research-protocol)
7. [Implementation Protocol](#implementation-protocol)
8. [Quality Gates](#quality-gates)

---

## Philosophy

### Core Principles

1. **Self-Documenting Code**: Code should be readable by AI agents
2. **Layered Context**: Provide appropriate detail at each stage
3. **Traceability**: Every decision should be traceable to research
4. **Executable Knowledge**: Documentation should be actionable by agents

### Agent Communication Contract

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AGENT COMMUNICATION CONTRACT                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Input → Context → Task → Output → Validation → Commit              │
│                                                                      │
│  ALWAYS provide:                                                     │
│  - Source of truth (which document/file)                            │
│  - Reasoning chain (why this approach)                              │
│  - Verification criteria (how to confirm success)                    │
│  - Fallback plan (what if this fails)                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Knowledge Architecture

### Hierarchical Knowledge Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE HIERARCHY                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LEVEL 0: META                                                      │
│  └── AGENTS.md          (This file - system overview)              │
│  └── FLOW.md            (Research→Implementation process)          │
│                                                                      │
│  LEVEL 1: STRATEGIC                                                 │
│  └── research/         (Analysis and findings)                      │
│  └── architecture/     (High-level decisions)                       │
│  └── roadmap/          (Milestones and timelines)                   │
│                                                                      │
│  LEVEL 2: TACTICAL                                                  │
│  └── design/           (Detailed specifications)                    │
│  └── patterns/         (Code patterns and conventions)             │
│  └── api/              (API contracts)                              │
│                                                                      │
│  LEVEL 3: EXECUTION                                                 │
│  └── implementation/   (Code and tests)                            │
│  └── reference/       (Code snippets and examples)                 │
│  └── troubleshooting/  (Known issues and solutions)                 │
│                                                                      │
│  LEVEL 0: OPERATIONAL                                               │
│  └── context/          (Current session context)                    │
│  └── session/          (Active work sessions)                       │
│  └── history/          (Past decisions and outcomes)               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Documentation Layers

### Layer 1: System Overview (AGENTS.md)

**Purpose:** Give agents the "big picture"

**Contents:**
- Project mission and vision
- Core architectural principles
- Technology stack overview
- Key files and their purposes
- Common workflows

**Example Structure:**
```markdown
# VIVIM SDK - AI Agent Guide

## Mission
Build a decentralized AI memory platform where users own and can tokenize their data.

## Architecture
- Core: SDK orchestration, identity, storage
- Nodes: 16 built-in nodes for specific tasks
- Services: Encryption, access grants, audit
- Protocols: P2P networking, sync

## Key Files
- `src/core/sdk.ts` - Main entry point
- `src/nodes/sharing-policy-node.ts` - Access control
- `src/services/sharing-encryption-service.ts` - Encryption

## Common Tasks
1. Adding a new node
2. Creating a new service
3. Modifying the permission system
```

### Layer 2: Component Guides

**Purpose:** Deep dive into specific components

**Contents:**
- Component architecture
- Public API surface
- Internal workings
- Integration points
- Example usage

**Template:**
```markdown
# [Component Name] - Agent Guide

## Purpose
[Brief description of what this component does]

## Architecture
[Diagrams and explanations]

## Public API
### Core Methods
| Method | Input | Output | Description |
|--------|-------|--------|-------------|

### Events
| Event | Payload | Description |

## Internal Structure
[How it works internally]

## Integration Points
- Uses: [Dependencies]
- Used By: [Consumers]

## Patterns
[Common patterns for working with this component]

## Examples
```typescript
// Example 1: Basic usage
```
```

### Layer 3: Task Templates

**Purpose:** Standardize common development tasks

**Available Templates:**
- `template-new-node.md` - Adding a new node
- `template-new-service.md` - Adding a new service
- `template-new-feature.md` - Feature development
- `template-bugfix.md` - Bug fixing process
- `template-review.md` - Code review process
- `template-research.md` - Research process

---

## Agent Workflow Templates

### Template 1: Research Task

```markdown
# Research: [Topic]

## Objective
[What we need to understand]

## Scope
- In scope: [Items]
- Out of scope: [Items]

## Approach
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Deliverables
- [ ] Finding 1
- [ ] Finding 2
- [ ] Recommendation

## Success Criteria
- [Criteria 1]
- [Criteria 2]

## Output Format
[How to present findings]
```

### Template 2: Design Task

```markdown
# Design: [Feature Name]

## Problem Statement
[What problem are we solving?]

## Requirements
### Functional
- [Requirement 1]
- [Requirement 2]

### Non-Functional
- Performance: [Criteria]
- Security: [Criteria]

## Proposed Solution

### Architecture
[Diagram and explanation]

### API Design
```typescript
interface FeatureAPI {
  method(): Promise<Result>;
}
```

### Data Model
[Schema changes]

### Security Considerations
[Security analysis]

## Alternatives Considered
### Option A
Pros: [List]
Cons: [List]

### Option B
[Same format]

## Recommendation
[Chosen option and rationale]

## Implementation Plan
1. [Step 1]
2. [Step 2]

## Success Criteria
[How to verify]
```

### Template 3: Implementation Task

```markdown
# Implementation: [Feature Name]

## References
- Research: [Link]
- Design: [Link]
- Design Review: [Link]

## Code Changes

### Files to Modify
- `src/path/file1.ts`
- `src/path/file2.ts`

### Files to Create
- `src/new/file.ts`

### Implementation Details

#### Step 1: [Description]
```typescript
// Code here
```

#### Step 2: [Description]
```typescript
// Code here
```

## Testing Strategy
- Unit tests: [Coverage]
- Integration tests: [Coverage]
- Manual tests: [Checklist]

## Verification
- [ ] Build passes
- [ ] Tests pass
- [ ] Type checking passes
- [ ] Linting passes

## Rollout Plan
[How to deploy]
```

### Template 4: Code Review

```markdown
# Code Review: [PR/Change Title]

## Summary
[Brief description of changes]

## Changes

### Files Changed
| File | Lines | Description |
|------|-------|-------------|

### Code Additions
```typescript
[new code]
```

### Code Removals
```typescript
[removed code]
```

## Review Checklist

### Correctness
- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Error handling complete

### Security
- [ ] No sensitive data exposure
- [ ] Input validation
- [ ] Authentication/Authorization

### Performance
- [ ] No obvious performance issues
- [ ] Proper indexing
- [ ] Efficient algorithms

### Code Quality
- [ ] Follows style guide
- [ ] Proper documentation
- [ ] Tests included

## Findings
### Must Fix
- [ ] Issue 1

### Should Fix
- [ ] Issue 2

### Suggestions
- [ ] Idea 1

## Verdict
- [ ] Approve
- [ ] Approve with comments
- [ ] Request changes
- [ ] Reject

## Notes
[Any additional context]
```

---

## Context Files

### Session Context Template

Create at `docs/context/session-{date}.md`:

```markdown
# Session Context: {Date}

## Active Work
- Feature: [Name]
- Branch: `feature/...`
- Status: [In Progress/Review/Blocked]

## Current Context
### What we're working on
[Description]

### Last changes
- Commit: [hash]
- Files: [list]

### Blockers
- [Blocker 1]
- [Blocker 2]

### Questions for human
- [Question 1]
- [Question 2]

## Next Steps
1. [Step 1]
2. [Step 2]

## Relevant Links
- Design doc: [Link]
- Issue: [Link]
- PR: [Link]
```

### Decision Log Template

Create at `docs/history/decisions/{YYYY-MM-DD}-{slug}.md`:

```markdown
# ADR: {Decision Title}

## Status
- Proposed | Accepted | Deprecated | Superseded

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
### Considered and rejected
- [Option]: [Reason]

### Deferred
- [Option]: [Reason for deferral]

## Related
- Research: [Link]
- Design: [Link]
- Implementation: [Link]
```

---

## Research Protocol

### Phase 1: Discovery

1. **Explore codebase**
   - Use explore agents for pattern discovery
   - Search for existing implementations
   - Map dependencies

2. **Gather external context**
   - Use librarian agents for documentation
   - Search for best practices
   - Find comparable implementations

3. **Analyze requirements**
   - Clarify ambiguous points
   - Identify constraints
   - Define success criteria

### Phase 2: Analysis

4. **Synthesize findings**
   - Document current state
   - Identify gaps
   - Propose approaches

5. **Evaluate options**
   - Compare alternatives
   - Consider tradeoffs
   - Make recommendation

### Phase 3: Documentation

6. **Document decision**
   - Use research template
   - Include all context
   - Provide code examples

---

## Implementation Protocol

### Pre-Implementation

1. **Verify design approved**
   - Check design document exists
   - Confirm review completed
   - Note any constraints

2. **Setup environment**
   - Create feature branch
   - Install dependencies
   - Verify build passes

### Implementation

3. **Implement in phases**
   - Break into atomic changes
   - Each commit should be complete
   - Include tests

4. **Verify continuously**
   - Run type checker
   - Run tests
   - Run linter

### Post-Implementation

5. **Create PR**
   - Link to design document
   - Include test results
   - Request reviewers

6. **Address feedback**
   - Respond to comments
   - Make requested changes
   - Re-verify

---

## Quality Gates

### Research Quality Gate

- [ ] Clear objective stated
- [ ] Scope defined (in/out)
- [ ] Multiple sources consulted
- [ ] Alternatives considered
- [ ] Recommendation with rationale
- [ ] Success criteria defined

### Design Quality Gate

- [ ] Problem clearly stated
- [ ] Requirements traced to research
- [ ] Architecture diagram included
- [ ] API design provided
- [ ] Security analysis complete
- [ ] Implementation plan realistic

### Implementation Quality Gate

- [ ] TypeScript compilation passes
- [ ] All tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Examples included
- [ ] Edge cases handled

### Review Quality Gate

- [ ] Code follows style guide
- [ ] Tests are comprehensive
- [ ] No security issues
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Two approvals received

---

## File Locations

```
docs/
├── AGENTS.md                    # This file - system overview
├── FLOW.md                      # Research→Implementation process
│
├── research/                     # Level 1: Strategic
│   ├── tokenization-platform.md # Our tokenization research
│   ├── [topic]/
│   │   └── index.md
│   └── archive/
│
├── architecture/                 # Level 1: Strategic
│   ├── index.md
│   ├── decisions/
│   │   └── {YYYY-MM-DD}-{slug}.md
│   └── patterns.md
│
├── design/                     # Level 2: Tactical
│   ├── template.md
│   ├── [feature]/
│   │   ├── index.md
│   │   └── api.md
│   └── reviews/
│
├── api/                       # Level 2: Tactical
│   ├── nodes.md
│   ├── services.md
│   └── protocols.md
│
├── implementation/             # Level 3: Execution
│   ├── reference/
│   │   ├── snippets/
│   │   └── examples/
│   └── troubleshooting/
│
├── context/                   # Level 0: Operational
│   ├── session-{date}.md
│   └── active.md
│
├── history/                   # Level 0: Operational
│   ├── decisions/
│   └── retro/
│
└── templates/                 # Reusable templates
    ├── research.md
    ├── design.md
    ├── implementation.md
    └── review.md
```

---

## Quick Reference

### For New Agents

1. Start with `docs/AGENTS.md`
2. Check `docs/FLOW.md` for process
3. Look in `docs/templates/` for templates
4. Check `docs/context/active.md` for current work

### Common Tasks

| Task | Template | Location |
|------|----------|----------|
| Research | research.md | docs/templates/ |
| Design | design.md | docs/templates/ |
| Implement | implementation.md | docs/templates/ |
| Review | review.md | docs/templates/ |

### Getting Help

1. Check `docs/api/` for API details
2. Check `docs/troubleshooting/` for known issues
3. Check `docs/history/decisions/` for past decisions

---

*Last updated: February 27, 2026*
*Version: 1.0.0*
