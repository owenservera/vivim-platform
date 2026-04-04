# Memory Types

## Overview

Sovereign Memory implements a comprehensive multi-type memory system inspired by cognitive science research. Each memory type serves a specific purpose in building a complete understanding of the user.

## Memory Type Taxonomy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Memory Type Hierarchy                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        MEMORY                                    │
│                         │                                       │
│    ┌──────────┬─────────┼─────────┬──────────┐                │
│    │          │         │         │          │                │
│ ┌──▼──┐   ┌──▼──┐  ┌──▼──┐  ┌──▼──┐   ┌──▼──┐              │
│ │Episo-│   │Seman-│  │Proce-│  │Factual│   │Prefer-│         │
│ │dic   │   │tic   │  │dural │  │ence  │      │   │         │
│ └──┬──┘   └──┬──┘  └──┬──┘  └──┬──┘   └──┬──┘              │
│    │         │         │         │          │                │
│    └─────────┴─────────┴─────────┴──────────┘                │
│                         │                                       │
│              ┌──────────┼──────────┐                           │
│              │          │          │                           │
│         ┌────▼───┐  ┌───▼────┐  ┌▼──────┐                   │
│         │Identity│  │Relation-│  │Goals  │                   │
│         │        │  │ship    │  │       │                   │
│         └────────┘  └────────┘  └────────┘                   │
│                              │                                 │
│                         ┌────▼────┐                           │
│                         │Projects │                            │
│                         └─────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Memory Types

### 1. EPISODIC

**Definition**: Memories of specific events, experiences, and interactions.

**Characteristics**:
- Time-bound: Associated with specific moments in time
- Context-rich: Includes details about the situation
- Subjective: Viewed from personal perspective

**Examples**:
- "Had a productive meeting with the design team about the new feature"
- "Struggled with authentication implementation for 3 hours"
- "Received positive feedback on my presentation from the manager"

**Categories**:
| Category | Description |
|----------|-------------|
| conversation_summary | Summary of important conversations |
| event | Significant events or milestones |
| experience | Personal experiences and sensations |
| interaction | Details about interactions with others |
| milestone | Important achievements or turning points |

**Extraction Triggers**:
- Meeting summaries
- Project completions
- User reflections
- Significant conversations

---

### 2. SEMANTIC

**Definition**: Knowledge, facts, and understanding about the world.

**Characteristics**:
- Time-free: Not tied to specific moments
- Objective: Factual and verifiable
- Structured: Often forms interconnected knowledge graphs

**Examples**:
- "Python uses indentation to define code blocks"
- "React hooks must be called at the top level"
- "The company uses microservices architecture with Kubernetes"

**Categories**:
| Category | Description |
|----------|-------------|
| knowledge | General knowledge and information |
| concept | Abstract concepts and their explanations |
| fact | Specific facts and details |
| understanding | Personal understanding and insights |

---

### 3. PROCEDURAL

**Definition**: Knowledge of how to do things - skills, workflows, and processes.

**Characteristics**:
- Action-oriented: Describes steps and actions
- Practical: Directly applicable to tasks
- Learnable: Can be taught and transferred

**Examples**:
- "To restart the Node.js server, run `Ctrl+C` then `npm start`"
- "The deployment process involves building, testing, and then running the deploy script"
- "When debugging React, start by checking the component hierarchy in React DevTools"

**Categories**:
| Category | Description |
|----------|-------------|
| howto | Step-by-step instructions |
| skill | Learned skills and abilities |
| workflow | Recurring processes and flows |
| process | Business or technical processes |
| method | Specific methods and techniques |

---

### 4. FACTUAL

**Definition**: Specific facts about entities, people, and the world.

**Characteristics**:
- Precise: Specific and accurate
- Verifiable: Can be confirmed or denied
- Atomic: Single, indivisible pieces of information

**Examples**:
- "Alice works as a senior engineer at TechCorp"
- "The API has a rate limit of 1000 requests per hour"
- "The database schema was last updated in January 2024"

**Categories**:
| Category | Description |
|----------|-------------|
| biography | Biographical information about people |
| fact_about_user | Facts specifically about the user |
| fact_about_world | General world facts |
| preference | User preferences (factual) |
| ability | Capabilities and skills |
| background | Background information |

---

### 5. PREFERENCE

**Definition**: User's likes, dislikes, and requirements.

**Characteristics**:
- Personal: Unique to each user
- Evaluative: Expresses judgment or desire
- Dynamic: Can change over time

**Examples**:
- "Prefers dark mode for coding"
- "Doesn't like meetings before 10 AM"
- "Prefers TypeScript over JavaScript"
- "Requires detailed comments in complex code"

**Categories**:
| Category | Description |
|----------|-------------|
| like | Things the user enjoys |
| dislike | Things the user avoids |
| style | Communication and work style preferences |
| requirement | Explicit requirements |
| frustration | Pain points and frustrations |

---

### 6. IDENTITY

**Definition**: Information about who the user is - their role, values, and self-concept.

**Characteristics**:
- Core: Fundamental to self-understanding
- Stable: Changes slowly over time
- Foundational: Influences all other memory types

**Examples**:
- "Software engineer with 10 years of experience"
- "Values transparency and open communication"
- "Primary role is leading the frontend team"
- "Strong advocate for accessibility in web development"

**Categories**:
| Category | Description |
|----------|-------------|
| role | Professional or personal roles |
| identity | Self-identification |
| bio | Brief biographical description |
| personality | Personality traits |
| values | Core values and beliefs |
| belief | Specific beliefs and opinions |

---

### 7. RELATIONSHIP

**Definition**: Information about people, teams, and organizations.

**Characteristics**:
- Relational: About connections between entities
- Contextual: Often tied to specific contexts
- Dynamic: Evolves with interactions

**Examples**:
- "Bob is the technical lead on the backend team"
- "Alice has extensive knowledge of the payment system"
- "The design team prefers Figma over Sketch"
- "John is the primary stakeholder for this project"

**Categories**:
| Category | Description |
|----------|-------------|
| person_info | Information about specific people |
| relationship | Nature of relationships |
| contact | Contact information and details |
| team | Team and organizational information |

---

### 8. GOAL

**Definition**: Goals, plans, intentions, and aspirations.

**Characteristics**:
- Future-oriented: About desired outcomes
- Motivational: Drives behavior
- Hierarchical: Can be nested (goals → subgoals)

**Examples**:
- "Wants to learn machine learning in 2024"
- "Planning to migrate to a microservices architecture"
- "Intends to improve test coverage to 80%"
- "Aspires to become a tech lead"

**Categories**:
| Category | Description |
|----------|-------------|
| goal | Specific goals and objectives |
| plan | Plans and roadmaps |
| intention | Stated intentions |
| aspiration | Long-term aspirations |

---

### 9. PROJECT

**Definition**: Information about projects, tasks, and deliverables.

**Characteristics**:
- Bounded: Has clear scope and timeline
- Deliverable-focused: Oriented toward outcomes
- Status-aware: Includes progress information

**Examples**:
- "Currently working on the user authentication feature"
- "The mobile app redesign is in the planning phase"
- "Need to deliver the API documentation by end of month"
- "The infrastructure migration project has 2 weeks remaining"

**Categories**:
| Category | Description |
|----------|-------------|
| project | Project information |
| task | Specific tasks |
| deliverable | Expected outputs |
| deadline | Time-bound commitments |

---

### 10. CUSTOM

**Definition**: User-defined memory types for specialized use cases.

**Characteristics**:
- Flexible: Completely user-defined
- Extensible: Can create any categories needed
- Domain-specific: Often tied to specific domains

**Examples**:
- "Legacy system knowledge" (for technical debt tracking)
- "Code review patterns" (for learning team standards)
- "Customer feedback" (for product development)

---

## Memory Type Comparison

| Type | Time Sensitivity | Objectivity | Stability | Extraction |
|------|------------------|-------------|-----------|------------|
| Episodic | High (time-bound) | Low | Medium | Automatic |
| Semantic | None | High | High | Manual |
| Procedural | None | High | Medium | Mixed |
| Factual | None | High | High | Automatic |
| Preference | Low | Low | Low | Automatic |
| Identity | Low | Low | High | Manual |
| Relationship | Medium | Medium | Medium | Automatic |
| Goal | High (future) | Low | Low | Automatic |
| Project | High | Medium | Medium | Automatic |

---

## Importance Scoring

Each memory has an importance score (0.0 - 1.0) that determines its priority in retrieval.

### Importance Levels

| Level | Score Range | Description | Auto-Extraction |
|-------|-------------|-------------|-----------------|
| CRITICAL | 0.9 - 1.0 | Essential, irreplaceable | Never delete |
| HIGH | 0.7 - 0.89 | Very important | High priority |
| MEDIUM | 0.4 - 0.69 | Moderately important | Normal priority |
| LOW | 0.1 - 0.39 | Minor importance | Lower priority |
| MINIMAL | 0.0 - 0.09 | Almost no importance | Candidates for archival |

### Factors Affecting Importance

```typescript
interface ImportanceFactors {
  // Explicit factors
  explicit: {
    userMarked: boolean;    // User explicitly marked important
    pinned: boolean;        // User pinned this memory
  };
  
  // Extraction factors
  extraction: {
    confidence: number;     // Extraction confidence (0-1)
    evidenceCount: number;   // Supporting evidence pieces
  };
  
  // Usage factors
  usage: {
    accessCount: number;    // Times accessed
    referenceCount: number; // Times referenced
    lastAccessed: Date;     // Last access time
  };
  
  // Content factors
  content: {
    uniqueness: number;     // How unique (0-1)
    detailLevel: number;    // Richness (0-1)
    applicability: number; // Use cases (0-1)
  };
}

// Calculate final importance
function calculateImportance(factors: ImportanceFactors): number {
  const weights = {
    explicit: 0.4,
    extraction: 0.2,
    usage: 0.2,
    content: 0.2
  };
  
  return (
    factors.explicit.userMarked ? 1.0 :
    factors.explicit.pinned ? 0.95 :
    factors.extraction.confidence * weights.extraction +
    Math.min(0.3, factors.usage.accessCount * 0.01) +
    factors.content.uniqueness * weights.content
  );
}
```

---

## Memory Relationships

Memories can be related to each other in various ways.

### Relationship Types

| Type | Description | Example |
|------|-------------|---------|
| similar | Related by content | Two memories about Python |
| contradicts | Opposing information | Preference change over time |
| supports | Provides evidence | Fact supporting a goal |
| derived_from | Logically follows | Procedural from Semantic |
| related_to | General connection | Any contextual link |
| same_topic | Same subject | Multiple project updates |
| same_event | From same event | Meeting details |
| follows | Temporal sequence | Consecutive tasks |
| precedes | Future sequence | Planning followed by execution |

---

## Memory Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      Memory Lifecycle                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐     ┌───────────┐     ┌───────────────┐          │
│   │Created  │────►│  RAW      │────►│CONSOLIDATING  │          │
│   │(New)    │     │(Unprocessed)│   │(Processing)   │          │
│   └─────────┘     └───────────┘     └───────┬───────┘          │
│                                              │                  │
│                                              ▼                  │
│   ┌─────────┐     ┌───────────┐     ┌───────────────┐          │
│   │Archived │◄────│CONSOLIDATED│◄────│  MERGED       │          │
│   │(Stored) │     │(Processed) │     │(Combined)     │          │
│   └─────────┘     └───────────┘     └───────────────┘          │
│                                                                  │
│   Transitions:                                                   │
│   - Creation → Consolidation: Automatic after 24 hours          │
│   - Consolidation → Merged: When similarity > 0.85             │
│   - Consolidation → Archived: When age > 90 days               │
│   - Any → Restored: User request or referenced context         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Lifecycle States

| State | Description | Access Frequency |
|-------|-------------|-------------------|
| RAW | Newly created, unprocessed | High |
| CONSOLIDATING | Being analyzed and indexed | Medium |
| CONSOLIDATED | Fully processed and indexed | Normal |
| MERGED | Combined with similar memories | Normal |
| ARCHIVED | Cold storage, searchable | Low |

---

## Implementation Reference

For implementation details, see the source code:

- **Memory Types**: `server/src/context/memory/memory-types.ts`
- **Memory Service**: `server/src/context/memory/memory-service.ts`
- **Extraction Engine**: `server/src/context/memory/memory-extraction-engine.ts`
- **Consolidation**: `server/src/context/memory/memory-consolidation-service.ts`
