-- =============================================================================
-- VIVIM Digital Twin - Operations Management Seed Data (Module 10)
-- =============================================================================
-- Cost allocation pools, operational expenses, resource capacity, budgets
-- =============================================================================

-- -----------------------------------------------------------------------------
-- COST ALLOCATION POOL TYPES
-- -----------------------------------------------------------------------------

INSERT INTO cost_pool_types (pool_type_name, pool_type_code, description, allocation_method) VALUES
('Operational', 'OPS', 'Day-to-day operational expenses', 'percentage'),
('Capital', 'CAP', 'Capital expenditures and investments', 'fixed'),
('Project-Based', 'PRJ', 'Project-specific cost pools', 'usage_based'),
('Milestone', 'MST', 'Milestone-specific allocations', 'headcount'),
('Treasury', 'TRS', 'DAO treasury allocations', 'revenue_share'),
('Emergency', 'EMG', 'Emergency reserves and contingencies', 'fixed');

-- -----------------------------------------------------------------------------
-- COST ALLOCATION POOLS (2026-2027)
-- -----------------------------------------------------------------------------

INSERT INTO cost_allocation_pools (pool_name, pool_code, pool_type_id, description, total_budget, current_balance, fiscal_year, quarter) VALUES
('Q1 2026 Operations', 'OPS-2026-Q1', 1, 'Q1 2026 operational expenses', 180000.00, 180000.00, 2026, 1),
('Q2 2026 Operations', 'OPS-2026-Q2', 1, 'Q2 2026 operational expenses', 195000.00, 195000.00, 2026, 2),
('Q3 2026 Operations', 'OPS-2026-Q3', 1, 'Q3 2026 operational expenses', 210000.00, 210000.00, 2026, 3),
('Q4 2026 Operations', 'OPS-2026-Q4', 1, 'Q4 2026 operational expenses', 225000.00, 225000.00, 2026, 4),
('M1 Foundation Pool', 'PRJ-M1', 4, 'Milestone 1 Foundation costs', 90000.00, 90000.00, 2026, 1),
('M2 ACU Pool', 'PRJ-M2', 4, 'Milestone 2 ACU costs', 75000.00, 75000.00, 2026, 2),
('M3 Compose Pool', 'PRJ-M3', 4, 'Milestone 3 Compose costs', 122000.00, 122000.00, 2026, 2),
('M4 Context Pool', 'PRJ-M4', 4, 'Milestone 4 Context costs', 188000.00, 188000.00, 2026, 3),
('Treasury Pool 2026', 'TRS-2026', 5, 'DAO Treasury allocation 2026', 500000.00, 500000.00, 2026, NULL),
('Emergency Reserve', 'EMG-RES', 6, 'Emergency contingency reserve', 100000.00, 100000.00, 2026, NULL);

-- -----------------------------------------------------------------------------
-- COST CATEGORIES
-- -----------------------------------------------------------------------------

INSERT INTO cost_categories (category_name, category_code, parent_category_id, cost_type, description) VALUES
('Labor Costs', 'LAB', NULL, 'labor', 'All personnel-related costs'),
('  Engineering Labor', 'LAB-ENG', 1, 'labor', 'Engineering team salaries and benefits'),
('  Design Labor', 'LAB-DES', 1, 'labor', 'Design team salaries and benefits'),
('  Operations Labor', 'LAB-OPS', 1, 'labor', 'Operations team salaries and benefits'),
('Infrastructure', 'INF', NULL, 'infrastructure', 'Technology infrastructure costs'),
('  Cloud Services', 'INF-CLD', 6, 'infrastructure', 'Cloud provider services'),
('  Compute Resources', 'INF-CMP', 6, 'infrastructure', 'Compute and GPU resources'),
('  Storage', 'INF-STR', 6, 'infrastructure', 'Data storage services'),
('Facilities', 'FAC', NULL, 'operations', 'Physical facility costs'),
('  Office Rent', 'FAC-RNT', 10, 'operations', 'Office space rental'),
('  Utilities', 'FAC-UTL', 10, 'operations', 'Electricity, water, internet'),
('  Maintenance', 'FAC-MNT', 10, 'operations', 'Facility maintenance'),
('Legal & Governance', 'LEG', NULL, 'legal', 'Legal and compliance costs'),
('  Compliance', 'LEG-CMP', 14, 'legal', 'Compliance framework costs'),
('  Contracts', 'LEG-CON', 14, 'legal', 'Contract management'),
('Community Operations', 'CMO', NULL, 'community', 'Community engagement costs'),
('  Events', 'CMO-EVT', 17, 'community', 'Community events and meetups'),
('  Marketing', 'CMO-MKT', 17, 'community', 'Marketing campaigns'),
('Bounties & Work', 'WRK', NULL, 'governance', 'Bounty and work payments'),
('  Bounty Payments', 'WRK-BTY', 19, 'governance', 'Bounty program payouts'),
('Insurance', 'INS', NULL, 'operations', 'Insurance premiums'),
('  Cyber Insurance', 'INS-CYB', 21, 'operations', 'Cybersecurity insurance'),
('  Liability Insurance', 'INS-LIA', 21, 'operations', 'General liability');

-- -----------------------------------------------------------------------------
-- COST ALLOCATION RULES
-- -----------------------------------------------------------------------------

INSERT INTO cost_allocation_rules (rule_name, pool_id, source_module, target_module, allocation_percentage, priority, valid_from, valid_until) VALUES
('Labor to Milestone Allocation', 5, 'people', 'milestones', 100.00, 1, '2026-01-01', '2026-03-31'),
('Infrastructure to Milestone', 5, 'tools', 'milestones', 100.00, 1, '2026-01-01', '2026-03-31'),
('Community to Operations', 1, 'community', 'operations', 15.00, 2, '2026-01-01', NULL),
('DAO Treasury Split', 9, 'dao', 'operations', 10.00, 3, '2026-01-01', NULL),
('Work Bounty Attribution', 1, 'work', 'operations', 20.00, 2, '2026-01-01', NULL);

-- -----------------------------------------------------------------------------
-- OPERATIONAL EXPENSE TYPES
-- -----------------------------------------------------------------------------

INSERT INTO operational_expense_types (expense_type_name, expense_type_code, category_id, payment_frequency, is_recurring) VALUES
('Office Rent', 'FAC-RNT-001', 11, 'monthly', TRUE),
('Virtual Office', 'FAC-VIR-001', 11, 'monthly', TRUE),
('Internet Service', 'NET-INT-001', 12, 'monthly', TRUE),
('Cloud Services', 'INF-CLD-001', 7, 'monthly', TRUE),
('LLM API Services', 'INF-LLM-001', 8, 'monthly', TRUE),
('Vector Database', 'INF-VEC-001', 9, 'monthly', TRUE),
('Domain & SSL', 'INF-DOM-001', 7, 'annual', TRUE),
('Software Licenses', 'INF-LIC-001', 7, 'monthly', TRUE),
('Cyber Insurance', 'INS-CYB-001', 22, 'annual', TRUE),
('Directors Insurance', 'INS-DIR-001', 23, 'annual', TRUE),
('Legal Consultation', 'LEG-CON-001', 16, 'quarterly', TRUE),
('Compliance Audit', 'LEG-CMP-001', 15, 'annual', TRUE),
('Community Event', 'CMO-EVT-001', 18, 'quarterly', FALSE),
('Marketing Campaign', 'CMO-MKT-001', 19, 'monthly', TRUE),
('Remote Work Stipend', 'WRK-REM-001', 1, 'monthly', TRUE);

-- -----------------------------------------------------------------------------
-- FACILITY EXPENSES (Virtual-First Model)
-- -----------------------------------------------------------------------------

INSERT INTO facility_expenses (facility_name, facility_type, location_id, address, monthly_rent, utilities_monthly, maintenance_monthly, insurance_monthly, lease_start_date, lease_end_date) VALUES
('Virtual Office - Global', 'virtual', NULL, 'Remote distributed team', 0.00, 0.00, 0.00, 0.00, '2026-01-01', NULL),
('Co-working Space - Mallorca', 'co-working', 1, 'Palma de Mallorca, Spain', 1500.00, 200.00, 100.00, 0.00, '2026-01-01', '2027-12-31'),
('Co-working Space - Malta', 'co-working', 3, 'Sliema, Malta', 1200.00, 150.00, 80.00, 0.00, '2026-01-01', '2027-12-31');

-- -----------------------------------------------------------------------------
-- OPERATIONAL EXPENSES (Sample Monthly)
-- -----------------------------------------------------------------------------

INSERT INTO operational_expenses (expense_name, expense_type_id, facility_id, vendor_name, amount, expense_date, billing_period_start, billing_period_end, payment_status, pool_id) VALUES
('Q1 2026 Cloud Services - January', 4, 1, 'Hetzner Cloud', 2500.00, '2026-01-31', '2026-01-01', '2026-01-31', 'paid', 1),
('Q1 2026 Cloud Services - February', 4, 1, 'Hetzner Cloud', 2800.00, '2026-02-28', '2026-02-01', '2026-02-28', 'paid', 1),
('Q1 2026 Cloud Services - March', 4, 1, 'Hetzner Cloud', 3200.00, '2026-03-31', '2026-03-01', '2026-03-31', 'paid', 1),
('Q1 2026 LLM API - January', 5, 1, 'OpenAI', 1500.00, '2026-01-31', '2026-01-01', '2026-01-31', 'paid', 1),
('Q1 2026 LLM API - February', 5, 1, 'OpenAI', 1800.00, '2026-02-28', '2026-02-01', '2026-02-28', 'paid', 1),
('Q1 2026 LLM API - March', 5, 1, 'OpenAI', 2200.00, '2026-03-31', '2026-03-01', '2026-03-31', 'paid', 1),
('Q1 2026 Vector Database', 6, 1, 'Pinecone', 800.00, '2026-01-31', '2026-01-01', '2026-01-31', 'paid', 1),
('Q1 2026 Software Licenses', 8, 1, 'GitHub/Notion/Figma', 1200.00, '2026-01-31', '2026-01-01', '2026-01-31', 'paid', 1),
('Mallorca Co-working January', 1, 2, 'Campus Palma', 1800.00, '2026-01-31', '2026-01-01', '2026-01-31', 'paid', 1),
('Malta Co-working January', 1, 3, 'The Grid', 1430.00, '2026-01-31', '2026-01-01', '2026-01-31', 'paid', 1),
('Internet Services January', 3, 1, 'Various', 150.00, '2026-01-31', '2026-01-01', '2026-01-31', 'paid', 1),
('Remote Work Stipends January', 15, 1, 'Team Stipends', 3000.00, '2026-01-31', '2026-01-01', '2026-01-31', 'paid', 1);

-- -----------------------------------------------------------------------------
-- INSURANCE POLICIES
-- -----------------------------------------------------------------------------

INSERT INTO insurance_policies (policy_name, policy_type, provider, policy_number, coverage_amount, premium_monthly, deductible, start_date, end_date) VALUES
('Cyber Liability Insurance', 'cyber', 'CyberShield Ltd', 'CYB-2026-001', 5000000.00, 450.00, 10000.00, '2026-01-01', '2026-12-31'),
('Directors & Officers Insurance', 'directors', 'E&O Partners', 'D&O-2026-001', 2000000.00, 300.00, 5000.00, '2026-01-01', '2026-12-31'),
('Professional Liability', 'liability', 'Professional Risks Inc', 'PL-2026-001', 1000000.00, 200.00, 2500.00, '2026-01-01', '2026-12-31');

-- -----------------------------------------------------------------------------
-- RESOURCE POOLS
-- -----------------------------------------------------------------------------

INSERT INTO resource_pools (pool_name, resource_type, department_id, capacity_total, capacity_unit, utilization_target, cost_per_unit, fiscal_year) VALUES
('Engineering Team Pool', 'human', 1, 10, 'FTE', 85.00, 6500.00, 2026),
('Design Team Pool', 'human', 2, 3, 'FTE', 80.00, 5500.00, 2026),
('Operations Team Pool', 'human', 3, 4, 'FTE', 80.00, 5000.00, 2026),
('Community Team Pool', 'human', 4, 2, 'FTE', 75.00, 4500.00, 2026),
('Compute Cluster Alpha', 'compute', NULL, 1000, 'GPU-hours/month', 90.00, 2.50, 2026),
('Compute Cluster Beta', 'compute', NULL, 500, 'GPU-hours/month', 85.00, 3.00, 2026),
('Storage Pool Primary', 'storage', NULL, 10000, 'GB', 70.00, 0.02, 2026),
('Storage Pool Backup', 'storage', NULL, 5000, 'GB', 50.00, 0.01, 2026),
('API Rate Limits', 'license', NULL, 1000000, 'API calls/month', 90.00, 0.001, 2026);

-- -----------------------------------------------------------------------------
-- RESOURCE UTILIZATION
-- -----------------------------------------------------------------------------

INSERT INTO resource_utilization (pool_resource_id, team_id, project_id, milestone_id, period_start, period_end, capacity_allocated, capacity_used, utilization_percentage, cost_allocated, cost_actual, efficiency_score) VALUES
(1, 1, 1, 1, '2026-01-01', '2026-01-31', 10, 8.5, 85.00, 65000.00, 55250.00, 92.00),
(1, 1, 2, 2, '2026-02-01', '2026-02-28', 10, 9.2, 92.00, 65000.00, 59800.00, 95.00),
(1, 1, 3, 3, '2026-03-01', '2026-03-31', 10, 8.8, 88.00, 65000.00, 57200.00, 93.00),
(2, 2, 1, 1, '2026-01-01', '2026-01-31', 3, 2.4, 80.00, 16500.00, 13200.00, 88.00),
(2, 2, 2, 2, '2026-02-01', '2026-02-28', 3, 2.7, 90.00, 16500.00, 14850.00, 92.00),
(3, 3, 1, 1, '2026-01-01', '2026-01-31', 4, 3.2, 80.00, 20000.00, 16000.00, 85.00),
(5, NULL, 1, 1, '2026-01-01', '2026-01-31', 1000, 850, 85.00, 2500.00, 2125.00, 90.00),
(5, NULL, 2, 2, '2026-02-01', '2026-02-28', 1000, 920, 92.00, 2500.00, 2300.00, 94.00),
(5, NULL, 3, 3, '2026-03-01', '2026-03-31', 1000, 880, 88.00, 2500.00, 2200.00, 91.00);

-- -----------------------------------------------------------------------------
-- CAPACITY FORECASTS
-- -----------------------------------------------------------------------------

INSERT INTO capacity_forecasts (pool_resource_id, forecast_period, forecast_date, projected_demand, projected_capacity, projected_utilization, confidence_level, assumptions) VALUES
(1, 'monthly', '2026-04-01', 12, 12, 95.00, 85.00, 'M4 Context phase requires additional engineering'),
(1, 'monthly', '2026-07-01', 15, 15, 92.00, 80.00, 'M5 Social phase scaling'),
(1, 'monthly', '2026-10-01', 18, 18, 88.00, 75.00, 'M6-M7 scale phase'),
(5, 'monthly', '2026-04-01', 1500, 1500, 95.00, 80.00, 'Increased ML inference demand'),
(5, 'monthly', '2026-07-01', 2500, 2500, 92.00, 75.00, 'Training phase begins M8'),
(7, 'monthly', '2026-04-01', 15000, 15000, 85.00, 85.00, 'User data growth');

-- -----------------------------------------------------------------------------
-- BUDGET PERIODS
-- -----------------------------------------------------------------------------

INSERT INTO budget_periods (period_name, period_type, start_date, end_date, fiscal_year, quarter, total_budget, status) VALUES
('January 2026', 'monthly', '2026-01-01', '2026-01-31', 2026, 1, 60000, 'approved'),
('February 2026', 'monthly', '2026-02-01', '2026-02-28', 2026, 1, 65000, 'approved'),
('March 2026', 'monthly', '2026-03-01', '2026-03-31', 2026, 1, 70000, 'approved'),
('Q1 2026', 'quarterly', '2026-01-01', '2026-03-31', 2026, 1, 195000, 'approved'),
('Q2 2026', 'quarterly', '2026-04-01', '2026-06-30', 2026, 2, 210000, 'approved'),
('Q3 2026', 'quarterly', '2026-07-01', '2026-09-30', 2026, 3, 225000, 'approved'),
('Q4 2026', 'quarterly', '2026-10-01', '2026-12-31', 2026, 4, 240000, 'approved'),
('FY 2026', 'annual', '2026-01-01', '2026-12-31', 2026, NULL, 870000, 'approved'),
('M1 Foundation', 'milestone', '2026-01-01', '2026-03-31', 2026, 1, 90600, 'active'),
('M2 ACU', 'milestone', '2026-03-01', '2026-05-31', 2026, 2, 74555, 'active'),
('M3 Compose', 'milestone', '2026-05-01', '2026-07-31', 2026, 2, 121830, 'active');

-- -----------------------------------------------------------------------------
-- BUDGET LINE ITEMS
-- -----------------------------------------------------------------------------

INSERT INTO budget_line_items (period_id, pool_id, category_id, milestone_id, line_item_name, description, budgeted_amount, committed_amount, actual_spent) VALUES
(1, 1, 7, 1, 'Cloud Services M1', 'Hetzner/OVH cloud costs for M1', 7500.00, 7500.00, 2500.00),
(1, 1, 8, 1, 'LLM API Costs', 'OpenAI/Anthropic API for M1', 4500.00, 4500.00, 1500.00),
(1, 1, 11, 1, 'Co-working Spaces', 'Mallorca/Malta office rent', 5000.00, 5000.00, 3230.00),
(1, 1, 1, 1, 'Engineering Salaries', 'Engineering team January', 50000.00, 50000.00, 45000.00),
(1, 1, 22, 1, 'Insurance Premiums', 'Cyber/D&O insurance', 1500.00, 1500.00, 950.00),
(2, 1, 7, 2, 'Cloud Services M1/M2', 'Hetzner/OVH cloud costs for M1/M2', 8500.00, 8500.00, 2800.00),
(2, 1, 8, 2, 'LLM API Costs', 'OpenAI/Anthropic API for M1/M2', 5500.00, 5500.00, 1800.00),
(2, 1, 11, 2, 'Co-working Spaces', 'Mallorca/Malta office rent', 5000.00, 5000.00, 3230.00),
(2, 1, 1, 2, 'Engineering Salaries', 'Engineering team February', 52000.00, 52000.00, 46800.00),
(2, 1, 22, 2, 'Insurance Premiums', 'Cyber/D&O insurance', 1500.00, 1500.00, 950.00),
(3, 1, 7, 3, 'Cloud Services M2/M3', 'Hetzner/OVH cloud costs for M2/M3', 10000.00, 10000.00, 3200.00),
(3, 1, 8, 3, 'LLM API Costs', 'OpenAI/Anthropic API for M2/M3', 6500.00, 6500.00, 2200.00),
(3, 1, 11, 3, 'Co-working Spaces', 'Mallorca/Malta office rent', 5000.00, 5000.00, 3230.00),
(3, 1, 1, 3, 'Engineering Salaries', 'Engineering team March', 54000.00, 54000.00, 48600.00),
(3, 1, 22, 3, 'Insurance Premiums', 'Cyber/D&O insurance', 1500.00, 1500.00, 950.00);

-- -----------------------------------------------------------------------------
-- LABOR COST ALLOCATIONS (from People module)
-- -----------------------------------------------------------------------------

INSERT INTO labor_cost_allocations (pool_id, team_id, role_id, milestone_id, period_id, gross_salary, employer_taxes, benefits, allocation_percentage, attributed_cost, fiscal_year, month) VALUES
(5, 1, 1, 1, 1, 45000.00, 13500.00, 4500.00, 100.00, 63000.00, 2026, 1),
(5, 1, 2, 1, 1, 35000.00, 10500.00, 3500.00, 100.00, 49000.00, 2026, 1),
(5, 1, 3, 1, 1, 28000.00, 8400.00, 2800.00, 100.00, 39200.00, 2026, 1),
(5, 2, 4, 1, 1, 30000.00, 9000.00, 3000.00, 100.00, 42000.00, 2026, 1),
(5, 3, 5, 1, 1, 25000.00, 7500.00, 2500.00, 100.00, 35000.00, 2026, 1),
(6, 1, 1, 2, 2, 45000.00, 13500.00, 4500.00, 100.00, 63000.00, 2026, 2),
(6, 1, 2, 2, 2, 35000.00, 10500.00, 3500.00, 100.00, 49000.00, 2026, 2),
(6, 1, 3, 2, 2, 30000.00, 9000.00, 3000.00, 100.00, 42000.00, 2026, 2),
(6, 2, 4, 2, 2, 32000.00, 9600.00, 3200.00, 100.00, 44800.00, 2026, 2),
(6, 3, 5, 2, 2, 26000.00, 7800.00, 2600.00, 100.00, 36400.00, 2026, 2);

-- -----------------------------------------------------------------------------
-- INFRASTRUCTURE COST ALLOCATIONS (from Tools module)
-- -----------------------------------------------------------------------------

INSERT INTO infrastructure_cost_allocations (pool_id, cloud_provider_id, service_id, milestone_id, period_id, compute_cost, storage_cost, network_cost, api_calls_cost, total_infrastructure_cost, allocation_percentage, attributed_cost, fiscal_year, month) VALUES
(5, 1, 1, 1, 1, 1500.00, 300.00, 100.00, 600.00, 2500.00, 100.00, 2500.00, 2026, 1),
(5, 1, 2, 1, 1, 0.00, 0.00, 0.00, 1500.00, 1500.00, 100.00, 1500.00, 2026, 1),
(5, 4, 3, 1, 1, 800.00, 0.00, 0.00, 0.00, 800.00, 100.00, 800.00, 2026, 1),
(6, 1, 1, 2, 2, 1800.00, 350.00, 120.00, 530.00, 2800.00, 100.00, 2800.00, 2026, 2),
(6, 1, 2, 2, 2, 0.00, 0.00, 0.00, 1800.00, 1800.00, 100.00, 1800.00, 2026, 2),
(6, 4, 3, 2, 2, 900.00, 100.00, 0.00, 0.00, 1000.00, 100.00, 1000.00, 2026, 2);

-- -----------------------------------------------------------------------------
-- WORK COST ALLOCATIONS (from Work module)
-- -----------------------------------------------------------------------------

INSERT INTO work_cost_allocations (pool_id, project_id, bounty_id, milestone_id, period_id, bounty_amount, platform_fee, allocation_percentage, attributed_cost, fiscal_year, month) VALUES
(5, 1, 1, 1, 1, 5000.00, 500.00, 100.00, 5500.00, 2026, 1),
(5, 1, 2, 1, 1, 3000.00, 300.00, 100.00, 3300.00, 2026, 1),
(6, 2, 3, 2, 2, 4000.00, 400.00, 100.00, 4400.00, 2026, 2),
(6, 2, 4, 2, 2, 6000.00, 600.00, 100.00, 6600.00, 2026, 2);

-- -----------------------------------------------------------------------------
-- TREASURY ALLOCATIONS (from DAO module)
-- -----------------------------------------------------------------------------

INSERT INTO treasury_allocations (pool_id, dao_proposal_id, milestone_id, allocation_type, allocated_amount, spent_amount, fiscal_year, quarter, status) VALUES
(9, 1, 1, 'operations', 50000.00, 25000.00, 2026, 1, 'in_progress'),
(9, 2, 2, 'infrastructure', 75000.00, 37500.00, 2026, 2, 'in_progress'),
(9, 3, 3, 'grants', 100000.00, 20000.00, 2026, 2, 'in_progress'),
(9, 4, 4, 'operations', 125000.00, 0.00, 2026, 3, 'allocated');

-- -----------------------------------------------------------------------------
-- COMMUNITY COST ALLOCATIONS (from Community module)
-- -----------------------------------------------------------------------------

INSERT INTO community_cost_allocations (pool_id, community_activity_id, milestone_id, period_id, event_cost, marketing_cost, moderator_costs, platform_costs, allocation_percentage, attributed_cost, fiscal_year, month) VALUES
(1, 1, 1, 1, 2000.00, 1500.00, 1000.00, 500.00, 15.00, 750.00, 2026, 1),
(1, 2, 2, 2, 0.00, 2000.00, 1200.00, 500.00, 15.00, 555.00, 2026, 2),
(1, 3, 3, 3, 3000.00, 2500.00, 1200.00, 500.00, 15.00, 1080.00, 2026, 3);

-- =============================================================================
-- END OF OPERATIONS SEED DATA
-- =============================================================================
