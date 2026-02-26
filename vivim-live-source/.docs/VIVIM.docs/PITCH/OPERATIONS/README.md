# VIVIM Digital Twin Cost Database

A comprehensive cost structure database schema for the VIVIM company digital twin knowledgebase. This database captures all cost inputs, variations, and connections across People, Tools, and Users dimensions.

## Overview

This database serves as the core knowledge graph for a fully digitally managed company, tracking:

- **People**: Labor costs by role, location, seniority, and employment type
- **Tools**: Infrastructure costs, cloud providers, services, and ML training
- **Users**: Operations costs, MAU scaling models, revenue, and dividends
- **Governance**: Legal, compliance, contracts, and risk management
- **DAO**: Decentralized governance, proposals, voting, treasury
- **AI Wiki**: Intelligent knowledge base with documentation
- **Work**: Open work management, projects, bounties
- **AI Agents**: Automation, workflows, monitoring
- **Community**: Social, reputation, forums, contributions
- **Operations**: Cost allocation, budgeting, resource capacity planning

## Schema Modules

### 1. People Module (`01_people_labor_schema.sql`)

Core tables for labor cost management:
- `locations` - Geographic locations with cost/regulatory data
- `role_categories` - Job role classifications
- `roles` - Specific job roles with requirements
- `skills` - Technical and soft skills matrix
- `salary_benchmarks` - Market salary data by role/location
- `teams` - Organizational structure
- `team_members` - Resource assignments
- `milestone_team_allocations` - Team allocations per milestone

### 2. Tools Module (`02_tools_infrastructure_schema.sql`)

Infrastructure and service cost tracking:
- `cloud_providers` - Cloud infrastructure providers
- `services` - Cloud services catalog
- `service_pricing_tiers` - Detailed pricing structures
- `infrastructure_cost_models` - Cost models at different user scales
- `user_scale_thresholds` - Key scaling milestones
- `llm_api_costs` - LLM provider pricing
- `ml_compute_instances` - GPU/ML training hardware
- `ml_training_cost_estimates` - Model training cost projections

### 3. Users Module (`03_users_operations_schema.sql`)

User operations and revenue tracking:
- `user_growth_models` - User acquisition projections
- `user_base_projections` - MAU/DAU forecasts
- `revenue_streams` - Revenue sources and pricing
- `revenue_projections` - Revenue forecasts
- `dividend_policies` - Revenue sharing configuration
- `dividend_calculations` - Dividend pool calculations
- `milestones` - The 10 VIVIM development milestones
- `milestone_costs` - Cost breakdowns by milestone

### 4. Governance Module (`04_governance_legal_schema.sql`)

Legal and compliance management:
- `compliance_frameworks` - GDPR, SOC2, AI Act, etc.
- `legal_service_categories` - Legal work classifications
- `legal_projects` - Legal engagements
- `contract_templates` - Standard contract documents
- `risk_register` - Risk tracking and mitigation
- `legal_budgets` - Legal spend tracking

### 5-9. Extended Modules

- **DAO Module** (`05_dao_governance_schema.sql`) - Decentralized governance, proposals, voting
- **AI Wiki Module** (`06_ai_wiki_schema.sql`) - Intelligent knowledge base
- **Work Module** (`07_work_management_schema.sql`) - Open work management, bounties
- **AI Agents Module** (`08_ai_agents_schema.sql`) - Automation, monitoring
- **Community Module** (`09_community_schema.sql`) - Social, reputation, forums

### 10. Operations Module (`10_operations_management_schema.sql`)

Cost allocation and operational management:
- `cost_pool_types` - Allocation pool classifications
- `cost_allocation_pools` - Budget pools for tracking
- `cost_categories` - Granular cost categorization
- `cost_allocation_rules` - Cross-module attribution rules
- `operational_expense_types` - Expense classifications
- `facility_expenses` - Physical/virtual facility costs
- `operational_expenses` - Transaction-level expense tracking
- `insurance_policies` - Insurance coverage management
- `resource_pools` - Capacity pools (human, compute, storage)
- `resource_utilization` - Resource usage tracking
- `capacity_forecasts` - Future capacity projections
- `budget_periods` - Budget tracking periods
- `budget_line_items` - Budget vs actual tracking
- `budget_amendments` - Budget changes
- `budget_approvals` - Approval workflow
- `labor_cost_allocations` - Integration with People module
- `infrastructure_cost_allocations` - Integration with Tools module
- `work_cost_allocations` - Integration with Work module
- `treasury_allocations` - Integration with DAO treasury
- `community_cost_allocations` - Integration with Community module

### 11. Token & Vesting Module (`11_token_vesting_schema.sql`)

Token management and vesting:
- `token_registry` - Token definitions (VGT, VWT)
- `vesting_schedules` - Vesting configurations
- `vesting_agreements` - Individual vesting grants
- `vesting_events` - Vesting unlock/claim events
- `token_holdings` - Wallet token balances
- `token_transfers` - Transfer history
- `staking_pools` - Staking pool configurations
- `staking_positions` - Active staking positions
- `staking_rewards` - Staking reward tracking
- `delegation_records` - Voting/delegation tracking
- `token_snapshots` - Snapshot for dividends/governance
- `dividend_claims` - Dividend distribution claims

### 12. Compliance & KYC Module (`12_compliance_kyc_schema.sql`)

Regulatory compliance and verification:
- `verification_tiers` - KYC tier definitions
- `user_identities` - User identity records
- `kyc_applications` - KYC application tracking
- `kyc_documents` - Identity document verification
- `sanctions_screening` - Sanctions list screening
- `compliance_frameworks` - GDPR, SOC2, AI Act, MiCA
- `compliance_requirements` - Requirement tracking
- `transaction_monitoring` - AML monitoring
- `suspicious_activity_reports` - SAR filing
- `data_retention_policies` - Retention rules
- `data_deletion_requests` - GDPR deletion requests
- `compliance_audit_log` - Audit trail
- `regulatory_reports` - Regulatory submissions

### 13. Analytics & Reporting Module (`13_analytics_reporting_schema.sql`)

Business intelligence and metrics:
- `metric_definitions` - KPI definitions
- `daily_metrics` - Daily aggregated metrics
- `user_metrics_daily` - User growth/engagement
- `user_cohorts` - Cohort analysis
- `revenue_metrics_daily` - Revenue tracking (MRR, ARR)
- `operations_metrics_daily` - Infrastructure metrics
- `community_metrics_daily` - Community health
- `governance_metrics_daily` - DAO governance stats
- `ai_agent_metrics_daily` - AI agent performance
- `report_schedules` - Automated reports
- `dashboard_configs` - Dashboard definitions
- `metric_trends` - Trend analysis
- `metric_alerts` - Threshold alerts

### 14. Security & Audit Module (`14_security_audit_schema.sql`)

Security operations and monitoring:
- `security_policies` - Security policy definitions
- `security_roles` - Role-based access roles
- `user_access` - Access control assignments
- `authentication_log` - Login history
- `mfa_devices` - MFA device management
- `session_management` - Session tracking
- `security_events` - Security event log
- `intrusion_detection` - IDS alerts
- `vulnerability_scans` - Vulnerability scan results
- `security_incidents` - Incident management
- `incident_actions` - Incident response actions
- `audit_logs` - Comprehensive audit trail
- `data_access_log` - Data access tracking
- `encryption_keys` - Key management
- `backup_configurations` - Backup policies
- `backup_records` - Backup execution logs

## Data Relationships

### Core Entity Relationships

```
Locations
├── Salary Benchmarks (by role)
├── Employment Cost Factors
├── Tax Incentives
└── Team Members (based in)

Roles
├── Role Categories
├── Skills (required)
├── Salary Benchmarks
├── Team Members
└── Milestone Allocations

Milestones (Central Hub)
├── Team Allocations
├── Infrastructure Costs
├── Legal Projects
├── Compliance Milestones
├── Revenue Projections
└── Cost Per User Analysis

Cloud Providers
├── Services
├── ML Compute Instances
└── Service Pricing Tiers

Users (Growth)
├── User Base Projections
├── Revenue Streams
└── Dividend Calculations
```

## Seed Data

The seed data files populate the database with real VIVIM project data:

1. **Locations** (`01_seed_locations.sql`)
   - Mallorca, Spain
   - Sicily, Italy (Catania, Palermo)
   - Malta (Valletta, Sliema)
   - US reference (San Francisco)
   - Western Europe reference (Berlin, London)

2. **Roles & Salaries** (`02_seed_roles_salaries.sql`)
   - Junior/Mid/Senior developers
   - ML Engineers, DevOps, Security
   - Designers, Product Managers
   - Legal Counsel, Community Managers
   - Salary benchmarks by location (EUR/USD)

3. **Infrastructure** (`03_seed_infrastructure.sql`)
   - Hetzner, OVH, Exoscale, AWS EU
   - Service pricing tiers
   - Infrastructure cost models (0 to 1M users)
   - User scale thresholds

4. **Milestones & Governance** (`04_seed_milestones_governance.sql`)
   - All 10 VIVIM milestones
   - Milestone cost breakdowns
   - Legal service categories
   - Compliance frameworks (GDPR, SOC2, AI Act)
   - Risk categories
   - Contract templates

5. **DAO, Wiki & Work** (`05_seed_dao_wiki_work.sql`)
   - DAO proposals and voting
   - Wiki spaces and articles
   - Work projects and bounties
   - Community structures

6. **Operations** (`06_seed_operations.sql`)
   - Cost allocation pools (Q1-Q4 2026)
   - Cost categories and rules
   - Operational expenses (cloud, facilities)
   - Resource pools and utilization
   - Budget periods and line items
   - Cross-module cost attributions

## Usage

### Database Setup

```sql
-- Create database
createdb vivim_costs_db

-- Run schema files in order
psql -d vivim_costs_db -f schemas/01_people_labor_schema.sql
psql -d vivim_costs_db -f schemas/02_tools_infrastructure_schema.sql
psql -d vivim_costs_db -f schemas/03_users_operations_schema.sql
psql -d vivim_costs_db -f schemas/04_governance_legal_schema.sql
psql -d vivim_costs_db -f schemas/05_dao_governance_schema.sql
psql -d vivim_costs_db -f schemas/06_ai_wiki_schema.sql
psql -d vivim_costs_db -f schemas/07_work_management_schema.sql
psql -d vivim_costs_db -f schemas/08_ai_agents_schema.sql
psql -d vivim_costs_db -f schemas/09_community_schema.sql
psql -d vivim_costs_db -f schemas/10_operations_management_schema.sql

-- Load seed data
psql -d vivim_costs_db -f seed_data/01_seed_locations.sql
psql -d vivim_costs_db -f seed_data/02_seed_roles_salaries.sql
psql -d vivim_costs_db -f seed_data/03_seed_infrastructure.sql
psql -d vivim_costs_db -f seed_data/04_seed_milestones_governance.sql
psql -d vivim_costs_db -f seed_data/05_seed_dao_wiki_work.sql
psql -d vivim_costs_db -f seed_data/06_seed_operations.sql
```

### Key Queries

```sql
-- Total labor cost by milestone
SELECT * FROM v_labor_costs_by_milestone;

-- Infrastructure cost summary
SELECT * FROM v_infrastructure_cost_summary;

-- Milestone cost summary with cumulative totals
SELECT * FROM v_milestone_cost_summary;

-- Unit economics trajectory
SELECT * FROM v_unit_economics_trajectory;

-- Cost per user by scale
SELECT * FROM v_cost_per_user_trajectory;

-- Active risks dashboard
SELECT * FROM v_risk_dashboard;

-- Operations: Cost pool utilization
SELECT * FROM v_cost_pool_utilization;

-- Operations: Budget vs Actual
SELECT * FROM v_budget_vs_actual;

-- Operations: Resource utilization by team
SELECT * FROM v_resource_utilization_by_team;

-- Operations: Labor cost attribution
SELECT * FROM v_labor_cost_attribution;

-- Operations: Infrastructure cost attribution
SELECT * FROM v_infrastructure_cost_attribution;

-- Operations: KPI Dashboard
SELECT * FROM v_operations_kpi_dashboard;
```

## Cost Model Summary

| Milestone | Timeline | Users | Total Cost (Mid) | Cost/User |
|-----------|----------|-------|------------------|-----------|
| M1: Foundation | Months 1-3 | 500 | €90,600 | €0.08 |
| M2: ACU | Months 3-5 | 2,500 | €74,555 | €0.028 |
| M3: Compose | Months 5-7 | 10,000 | €121,830 | €0.019 |
| M4: Context | Months 6-9 | 25,000 | €188,300 | €0.022 |
| M5: Social | Months 8-11 | 50,000 | €232,000 | €0.023 |
| M6: Consent | Months 10-13 | 75,000 | €192,200 | €0.005 |
| M7: Scale | Months 12-15 | 100,000 | €314,000 | €0.075 |
| M8: Training | Months 14-17 | 100,000 | €356,000 | €0.12 |
| M9: Revenue | Months 17-20 | 100,000 | €158,800 | -€0.31 |
| M10: Dividend | Months 20-22 | 100,000+ | €166,400 | -€0.26 |

**Total 22-Month Cost**: €1,894,685 (mid estimate)

## Key Features

### 1. Multi-Dimensional Cost Tracking
- Labor by role, seniority, location, employment type
- Infrastructure by user scale, provider, service tier
- Revenue by stream, milestone, scenario

### 2. Flexible Scaling Models
- Cost models from 0 to 1,000,000 users
- Economies of scale tracking
- Marginal cost analysis

### 3. Compliance Integration
- GDPR, SOC2, AI Act frameworks
- Milestone-based compliance tracking
- Risk register with scoring

### 4. Revenue & Dividend System
- Revenue stream modeling
- Dividend policy configuration
- Contributor payout calculations

### 5. Knowledge Graph Structure
- Entity relationships across all dimensions
- Queryable cost drivers
- Audit trail support

### 6. Operations & Cost Allocation
- Centralized cost allocation pools
- Cross-module cost attribution (People, Tools, Work, DAO, Community)
- Budget vs actual tracking by period/milestone
- Resource capacity planning and utilization
- Operational expense management
- Treasury integration with DAO governance

## Files Structure

```
OPERATIONS/
├── schemas/
│   ├── 01_people_labor_schema.sql
│   ├── 02_tools_infrastructure_schema.sql
│   ├── 03_users_operations_schema.sql
│   ├── 04_governance_legal_schema.sql
│   ├── 05_dao_governance_schema.sql
│   ├── 06_ai_wiki_schema.sql
│   ├── 07_work_management_schema.sql
│   ├── 08_ai_agents_schema.sql
│   ├── 09_community_schema.sql
│   ├── 10_operations_management_schema.sql
│   ├── 11_token_vesting_schema.sql
│   ├── 12_compliance_kyc_schema.sql
│   ├── 13_analytics_reporting_schema.sql
│   └── 14_security_audit_schema.sql
├── seed_data/
│   ├── 01_seed_locations.sql
│   ├── 02_seed_roles_salaries.sql
│   ├── 03_seed_infrastructure.sql
│   ├── 04_seed_milestones_governance.sql
│   ├── 05_seed_dao_wiki_work.sql
│   ├── 06_seed_operations.sql
│   ├── 07_seed_token_vesting.sql
│   ├── 08_seed_compliance_kyc.sql
│   ├── 09_seed_analytics.sql
│   └── 10_seed_security_audit.sql
├── diagrams/
│   ├── entity_relationship_diagram.md
│   └── unified_knowledge_graph.md
├── config/
│   └── database_config.sql
└── README.md
```

## Data Sources

- **Labor Costs**: PayScale, Levels.fyi, Glassdoor, ERI SalaryExpert, Jobicy, Plane, TalentUp
- **Infrastructure**: Hetzner, OVHcloud, Exoscale, AWS EU, Cloudflare, Pinecone
- **Milestones**: VIVIM-10-Phase-Milestones-Combined.md
- **Cost Breakdowns**: VIVIM-Detailed-Cost-Breakdown-By-Milestone.md
- **Legal Rates**: ContractsCounsel, LeanLaw

## Notes

- All monetary values stored in EUR (or USD where specified)
- Cost models assume BYOK (Bring Your Own Key) for LLM APIs
- Infrastructure costs assume GDPR-compliant EU providers
- Dividend model assumes 70% user / 30% platform split

## License

Internal VIVIM documentation and database schema.
