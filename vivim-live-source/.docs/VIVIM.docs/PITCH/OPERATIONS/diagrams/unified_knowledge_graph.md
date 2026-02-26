# VIVIM Digital Twin - Unified Knowledge Graph

This document describes the complete knowledge graph connecting all modules of the VIVIM Digital Twin system. The system represents a fully transparent, AI-assisted, DAO-governed company operating in the open.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VIVIM DIGITAL TWIN KNOWLEDGE GRAPH                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐│
│  │   PEOPLE    │◄──►│   WORK      │◄──►│    DAO      │◄──►│ COMMUNITY   ││
│  │  (Module 1) │    │  (Module 7) │    │  (Module 5) │    │  (Module 9) ││
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘│
│         │                  │                  │                  │        │
│         │            ┌─────┴─────┐            │                  │        │
│         └───────────►│ MILESTONE │◄───────────┘                  │        │
│                      │  (Hub)    │◄──────────────────────────────┘        │
│  ┌─────────────┐     └─────┬─────┘     ┌─────────────┐                     │
│  │   TOOLS     │           │           │  AI_AGENTS  │                     │
│  │  (Module 2) │◄──────────┘           │  (Module 8) │                     │
│  └──────┬──────┘                       └──────┬──────┘                     │
│         │                                     │                            │
│         │         ┌───────────────────────────┘                            │
│         │         │                                                        │
│  ┌──────┴──────┐  │  ┌─────────────┐                                       │
│  │    USERS    │◄─┘  │  AI_WIKI    │                                       │
│  │  (Module 3) │     │  (Module 6) │                                       │
│  └─────────────┘     └──────┬──────┘                                       │
│                             │                                              │
│  ┌─────────────┐           │                                               │
│  │  GOVERNANCE │◄──────────┘                                               │
│  │  (Module 4) │                                                            │
│  └─────────────┘                                                            │
│                                                                             │
│         ┌───────────────────────────────────────────────────┐               │
│         │              OPERATIONS (Module 10)               │               │
│         │  Cost Allocation • Budget Tracking • Resources  │               │
│         └───────────────────┬───────────────────────────────┘               │
│                             │                                              │
└─────────────────────────────┼──────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼────┐   ┌─────▼────┐  ┌─────▼─────┐
         │  PEOPLE │   │  TOOLS   │  │   WORK    │
         │  Labor  │   │ Infra    │  │  Bounties │
         │  Costs  │   │  Costs   │  │   Costs   │
         └─────────┘   └──────────┘  └───────────┘
              │              │              │
         ┌────▼──────────────▼──────────────▼─────┐
         │       CROSS-MODULE COST ATTRIBUTION     │
         └─────────────────────────────────────────┘
```

## Module Connections

### 1. PEOPLE Module Connections
**Core entities:** locations, roles, teams, team_members, salary_benchmarks

**Connects to:**
- **WORK**: Team members assigned to projects and tasks
- **DAO**: Employees become DAO members with voting power
- **COMMUNITY**: Employee profiles linked to community presence
- **MILESTONES**: Team allocations per milestone

**Knowledge Graph Edges:**
```
(Employee)-[:WORKS_ON]->(Task)
(Employee)-[:MEMBER_OF]->(Team)
(Employee)-[:HAS_ROLE]->(Role)
(Employee)-[:LOCATED_IN]->(Location)
(Team)-[:ALLOCATED_TO]->(Milestone)
```

### 2. TOOLS Module Connections
**Core entities:** cloud_providers, services, infrastructure_cost_models, ml_compute_instances

**Connects to:**
- **WORK**: Projects use cloud services
- **MILESTONES**: Infrastructure scales with milestone targets
- **USERS**: Cost per user calculations

**Knowledge Graph Edges:**
```
(Project)-[:USES]->(CloudService)
(InfrastructureModel)-[:SUPPORTS]->(UserScale)
(Milestone)-[:REQUIRES]->(Infrastructure)
```

### 3. USERS Module Connections
**Core entities:** user_growth_models, revenue_streams, dividend_policies, milestones

**Connects to:**
- **COMMUNITY**: Users become community members
- **DAO**: Token holders participate in governance
- **MILESTONES**: Growth targets per milestone

**Knowledge Graph Edges:**
```
(User)-[:EARNS]->(Dividend)
(User)-[:PARTICIPATES_IN]->(DAO)
(Milestone)-[:TARGETS]->(UserCount)
```

### 4. GOVERNANCE Module Connections
**Core entities:** compliance_frameworks, legal_projects, risk_register, contract_templates

**Connects to:**
- **DAO**: Proposals require legal review
- **MILESTONES**: Compliance requirements per phase
- **WORK**: Legal tasks linked to projects

**Knowledge Graph Edges:**
```
(Proposal)-[:REQUIRES_LEGAL_REVIEW]->(LegalProject)
(Milestone)-[:MUST_COMPLY_WITH]->(ComplianceFramework)
(Risk)-[:AFFECTS]->(Milestone)
```

### 5. DAO Module Connections (NEW)
**Core entities:** dao_organizations, dao_members, dao_proposals, dao_workstreams

**Connects to:**
- **PEOPLE**: Employees are DAO members
- **WORK**: Workstreams execute proposals
- **GOVERNANCE**: Proposals create legal work
- **COMMUNITY**: Reputation affects voting power
- **MILESTONES**: Proposals aligned with milestones

**Knowledge Graph Edges:**
```
(Member)-[:VOTES_ON]->(Proposal)
(Proposal)-[:CREATES]->(Workstream)
(Proposal)-[:FUNDS]->(Project)
(Workstream)-[:DELIVERS]->(Milestone)
(Member)-[:HAS_REPUTATION]->(ReputationScore)
```

### 6. AI_WIKI Module Connections (NEW)
**Core entities:** wiki_spaces, wiki_articles, knowledge_topics, knowledge_connections

**Connects to:**
- **WORK**: Projects have documentation spaces
- **DAO**: Proposals documented in wiki
- **MILESTONES**: Milestones documented
- **AI_AGENTS**: Agents read/write wiki
- **COMMUNITY**: Community-contributed knowledge

**Knowledge Graph Edges:**
```
(Article)-[:DOCUMENTS]->(Project)
(Article)-[:DOCUMENTS]->(Milestone)
(Article)-[:RELATES_TO]->(Topic)
(Topic)-[:CONNECTS_TO]->(Topic)
(Agent)-[:READS]->(Article)
(Agent)-[:WRITES]->(Article)
```

### 7. WORK Module Connections (NEW)
**Core entities:** work_projects, work_sprints, work_tasks, work_bounties

**Connects to:**
- **PEOPLE**: Tasks assigned to team members
- **MILESTONES**: Projects deliver milestones
- **DAO**: Projects approved by proposals
- **AI_WIKI**: Tasks linked to documentation
- **COMMUNITY**: Bounties open to community

**Knowledge Graph Edges:**
```
(Task)-[:ASSIGNED_TO]->(Employee)
(Project)-[:DELIVERS]->(Milestone)
(Task)-[:REQUIRES]->(WikiArticle)
(Bounty)-[:CLAIMED_BY]->(CommunityMember)
(Project)-[:FUNDED_BY]->(DAOBudget)
```

### 8. AI_AGENTS Module Connections (NEW)
**Core entities:** ai_agents, ai_sessions, ai_workflows, ai_monitors

**Connects to:**
- **ALL MODULES**: Agents assist across all areas
- **WORK**: Agents automate tasks
- **DAO**: Agents monitor governance
- **AI_WIKI**: Agents maintain knowledge base
- **COMMUNITY**: Agents moderate discussions

**Knowledge Graph Edges:**
```
(Agent)-[:ASSISTS_WITH]->(Task)
(Agent)-[:MONITORS]->(Proposal)
(Agent)-[:MAINTAINS]->(WikiArticle)
(Agent)-[:MODERATES]->(Discussion)
(Agent)-[:GENERATES]->(Summary)
```

### 9. COMMUNITY Module Connections (NEW)
**Core entities:** community_profiles, community_contributions, reputation_scores, discussion_forums

**Connects to:**
- **DAO**: Contributors become DAO members
- **WORK**: Community completes bounties
- **USERS**: Users engage in community
- **AI_WIKI**: Community improves documentation

**Knowledge Graph Edges:**
```
(Profile)-[:CONTRIBUTES_TO]->(Project)
(Profile)-[:PARTICIPATES_IN]->(Discussion)
(Profile)-[:EARNS]->(Reputation)
(Contribution)-[:REWARDS]->(Dividend)
```

### 10. OPERATIONS Module Connections (NEW)
**Core entities:** cost_allocation_pools, operational_expenses, resource_pools, budget_line_items

**Connects to:**
- **PEOPLE**: Labor costs allocated to projects/milestones
- **TOOLS**: Infrastructure costs tracked and attributed
- **WORK**: Bounty and project costs allocation
- **DAO**: Treasury allocations and governance costs
- **MILESTONES**: Phase-based budget tracking
- **COMMUNITY**: Community operations cost attribution

**Knowledge Graph Edges:**
```
(Pool)-[:ALLOCATES_TO]->(Milestone)
(Expense)-[:ATTRIBUTED_TO]->(Project)
(LaborCost)-[:ORIGINATES_FROM]->(Team)
(InfrastructureCost)-[:ORIGINATES_FROM]->(CloudProvider)
(BountyCost)-[:ORIGINATES_FROM]->(Workstream)
(TreasuryAllocation)-[:FUNDS]->(Pool)
(Budget)-[:TRACKS]->(Actual)
(ResourcePool)-[:UTILIZED_BY]->(Team)
```

## Central Hub: MILESTONES

Milestones serve as the central coordinating entity, connecting all modules:

```
MILESTONE (10 phases)
├── PEOPLE: Team allocations
├── TOOLS: Infrastructure requirements  
├── USERS: Growth targets
├── GOVERNANCE: Compliance requirements
├── DAO: Governance proposals
├── AI_WIKI: Documentation deliverables
├── WORK: Projects and tasks
├── AI_AGENTS: Automation targets
├── COMMUNITY: Engagement goals
└── OPERATIONS: Budget tracking & cost attribution
```

## Knowledge Graph Query Examples

### Find all work related to a milestone
```cypher
MATCH (m:Milestone {id: 1})
OPTIONAL MATCH (m)<-[:DELIVERS]-(p:Project)
OPTIONAL MATCH (p)-[:HAS]->(t:Task)
OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(e:Employee)
OPTIONAL MATCH (m)<-[:ALLOCATED_TO]-(team:Team)
RETURN m, collect(DISTINCT p) as projects, 
       collect(DISTINCT t) as tasks,
       collect(DISTINCT e) as team_members
```

### Trace decision lineage
```cypher
MATCH (prop:Proposal)-[:CREATES]->(w:Workstream)
MATCH (w)-[:DELIVERS]->(m:Milestone)
MATCH (m)-[:DOCUMENTED_IN]->(a:Article)
RETURN prop, w, m, a
```

### Community impact analysis
```cypher
MATCH (profile:Profile)-[:CONTRIBUTES_TO]->(c:Contribution)
MATCH (c)-[:LINKED_TO]->(t:Task)
MATCH (t)-[:PART_OF]->(p:Project)
MATCH (p)-[:DELIVERS]->(m:Milestone)
RETURN profile.name, count(DISTINCT c) as contributions,
       collect(DISTINCT m.name) as impacted_milestones
```

## Entity Relationship Summary

| Entity Type | Count (approx) | Primary Connections |
|-------------|----------------|---------------------|
| People | 50+ tables | Teams, Roles, Locations, Skills |
| Tools | 30+ tables | Services, Providers, Costs |
| Users | 25+ tables | Growth, Revenue, Dividends |
| Governance | 25+ tables | Compliance, Legal, Risk |
| DAO | 20+ tables | Members, Proposals, Treasury |
| AI_Wiki | 20+ tables | Articles, Topics, Knowledge |
| Work | 25+ tables | Projects, Tasks, Sprints |
| AI_Agents | 15+ tables | Agents, Workflows, Monitors |
| Community | 20+ tables | Profiles, Contributions, Forums |
| Operations | 25+ tables | Pools, Budgets, Resources |
| **Total** | **~255+ tables** | **Unified knowledge graph** |

## Data Flow Patterns

### 1. Work-to-Governance Flow
```
Task Completed → Contribution Logged → Reputation Updated → 
DAO Voting Power Adjusted → Future Proposal Weight Changed
```

### 2. Proposal-to-Execution Flow
```
Proposal Created → Community Discussion → Vote Held → 
Workstream Created → Tasks Assigned → Milestone Delivered → 
Wiki Updated → Community Notified
```

### 3. AI-Assisted Knowledge Flow
```
Meeting/Work → AI Extraction → Knowledge Topics Created → 
Wiki Articles Updated → Connections Established → 
Agents Notified → Related Work Suggested
```

### 4. Open Collaboration Flow
```
Public Bounty Posted → Community Application → 
Work Assigned → Contribution Tracked → 
Reputation Earned → Dividend Eligible
```

### 5. Operations Cost Flow
```
Milestone Planned → Budget Allocated → 
Labor/Infrastructure Costs Tracked → 
Attribution Applied → Variance Calculated → 
Forecast Updated → Next Budget Adjusted
```

## Query Interface Design

### Natural Language Queries
- "What is the status of Milestone 5?"
- "Who is working on the Context Engine?"
- "What proposals passed this week?"
- "Show me community contributions to documentation"

### Graph Traversal Queries
- Find shortest path between any two entities
- Discover hidden connections through AI analysis
- Identify knowledge gaps
- Recommend collaborators based on shared interests

### Analytics Dashboard Queries
- Team velocity trends
- Community health metrics
- DAO participation rates
- Knowledge base completeness

## Implementation Notes

### Cross-Module Foreign Keys
Most modules reference:
- `milestone_id` → Milestones table
- `created_by`, `updated_by` → Users/Profiles
- `dao_id` → DAO organization (for multi-DAO support)

### Polymorphic Relationships
Some tables use type+id pairs:
- `source_type`, `source_id` (for flexible referencing)
- `target_type`, `target_id`
- `context_type`, `context_id`

### AI Integration Points
- Auto-generated summaries stored in `_summary` fields
- AI confidence scores for recommendations
- Embeddings for semantic search
- Automated maintenance task creation

This unified knowledge graph enables:
- **Full transparency**: Anyone can trace work from proposal to delivery
- **AI assistance**: Agents understand context across all modules
- **Community participation**: Open bounties, discussions, contributions
- **DAO governance**: Democratic decision-making with reputation-weighted voting
- **Knowledge preservation**: All decisions, discussions, and work captured
