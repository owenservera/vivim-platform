-- =============================================================================
-- VIVIM Digital Twin - Operations Management Schema (Module 10)
-- =============================================================================
-- Cost allocation, operational expenses, resource capacity, and budget tracking
-- Integrates with: People, Tools, Work, DAO, Milestones, Community
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: COST ALLOCATION POOLS
-- -----------------------------------------------------------------------------

-- Cost allocation pool types
CREATE TABLE cost_pool_types (
    pool_type_id SERIAL PRIMARY KEY,
    pool_type_name VARCHAR(100) NOT NULL UNIQUE,
    pool_type_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    allocation_method VARCHAR(50) CHECK (allocation_method IN ('percentage', 'fixed', 'usage_based', 'headcount', 'revenue_share')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost allocation pools
CREATE TABLE cost_allocation_pools (
    pool_id SERIAL PRIMARY KEY,
    pool_name VARCHAR(200) NOT NULL,
    pool_code VARCHAR(30) NOT NULL UNIQUE,
    pool_type_id INTEGER REFERENCES cost_pool_types(pool_type_id),
    description TEXT,
    total_budget DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    fiscal_year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter IN (1,2,3,4)),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost categories for granular tracking
CREATE TABLE cost_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    category_code VARCHAR(20) NOT NULL UNIQUE,
    parent_category_id INTEGER REFERENCES cost_categories(category_id),
    description TEXT,
    cost_type VARCHAR(50) CHECK (cost_type IN ('labor', 'infrastructure', 'operations', 'legal', 'marketing', 'governance', 'community')),
    is_operational BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost allocation rules
CREATE TABLE cost_allocation_rules (
    rule_id SERIAL PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    pool_id INTEGER REFERENCES cost_allocation_pools(pool_id),
    source_module VARCHAR(50) CHECK (source_module IN ('people', 'tools', 'work', 'dao', 'milestones', 'community', 'governance')),
    target_module VARCHAR(50) CHECK (target_module IN ('people', 'tools', 'work', 'dao', 'milestones', 'community', 'governance', 'operations')),
    allocation_percentage DECIMAL(5,2) CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_until DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 2: OPERATIONAL EXPENSES
-- -----------------------------------------------------------------------------

-- Operational expense types
CREATE TABLE operational_expense_types (
    expense_type_id SERIAL PRIMARY KEY,
    expense_type_name VARCHAR(100) NOT NULL,
    expense_type_code VARCHAR(20) NOT NULL UNIQUE,
    category_id INTEGER REFERENCES cost_categories(category_id),
    description TEXT,
    payment_frequency VARCHAR(20) CHECK (payment_frequency IN ('one_time', 'monthly', 'quarterly', 'annual')),
    is_recurring BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Facilities and physical infrastructure
CREATE TABLE facility_expenses (
    facility_id SERIAL PRIMARY KEY,
    facility_name VARCHAR(200) NOT NULL,
    facility_type VARCHAR(50) CHECK (facility_type IN ('office', 'warehouse', 'datacenter', 'co-working', 'virtual')),
    location_id INTEGER, -- References people module if available
    address TEXT,
    monthly_rent DECIMAL(12,2),
    utilities_monthly DECIMAL(10,2),
    maintenance_monthly DECIMAL(10,2),
    insurance_monthly DECIMAL(10,2),
    total_monthly DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(monthly_rent,0) + COALESCE(utilities_monthly,0) + COALESCE(maintenance_monthly,0) + COALESCE(insurance_monthly,0)) STORED,
    lease_start_date DATE,
    lease_end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- General operational expenses
CREATE TABLE operational_expenses (
    expense_id SERIAL PRIMARY KEY,
    expense_name VARCHAR(300) NOT NULL,
    expense_type_id INTEGER REFERENCES operational_expense_types(expense_type_id),
    facility_id INTEGER REFERENCES facility_expenses(facility_id),
    vendor_name VARCHAR(200),
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    expense_date DATE NOT NULL,
    billing_period_start DATE,
    billing_period_end DATE,
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'approved', 'paid', 'cancelled', 'refunded')),
    pool_id INTEGER REFERENCES cost_allocation_pools(pool_id),
    project_id INTEGER, -- References work module if available
    milestone_id INTEGER, -- References milestones
    receipt_url TEXT,
    approved_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance policies
CREATE TABLE insurance_policies (
    policy_id SERIAL PRIMARY KEY,
    policy_name VARCHAR(200) NOT NULL,
    policy_type VARCHAR(50) CHECK (policy_type IN ('liability', 'property', 'cyber', 'directors', 'health', 'workers_comp')),
    provider VARCHAR(200),
    policy_number VARCHAR(100),
    coverage_amount DECIMAL(15,2),
    premium_monthly DECIMAL(10,2),
    deductible DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 3: RESOURCE CAPACITY PLANNING
-- -----------------------------------------------------------------------------

-- Resource pools (people, compute, storage, etc.)
CREATE TABLE resource_pools (
    pool_resource_id SERIAL PRIMARY KEY,
    pool_name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(50) CHECK (resource_type IN ('human', 'compute', 'storage', 'network', 'license', 'budget')),
    department_id INTEGER, -- References teams
    capacity_total DECIMAL(15,2),
    capacity_unit VARCHAR(50),
    utilization_target DECIMAL(5,2) DEFAULT 80.00,
    cost_per_unit DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    fiscal_year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource utilization tracking
CREATE TABLE resource_utilization (
    utilization_id SERIAL PRIMARY KEY,
    pool_resource_id INTEGER REFERENCES resource_pools(pool_resource_id),
    team_id INTEGER, -- References teams
    project_id INTEGER, -- References work
    milestone_id INTEGER,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    capacity_allocated DECIMAL(15,2),
    capacity_used DECIMAL(15,2),
    utilization_percentage DECIMAL(5,2),
    cost_allocated DECIMAL(12,2),
    cost_actual DECIMAL(12,2),
    efficiency_score DECIMAL(5,2),
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Capacity forecasts
CREATE TABLE capacity_forecasts (
    forecast_id SERIAL PRIMARY KEY,
    pool_resource_id INTEGER REFERENCES resource_pools(pool_resource_id),
    forecast_period VARCHAR(20) CHECK (forecast_period IN ('monthly', 'quarterly', 'annual')),
    forecast_date DATE NOT NULL,
    projected_demand DECIMAL(15,2),
    projected_capacity DECIMAL(15,2),
    projected_utilization DECIMAL(5,2),
    confidence_level DECIMAL(5,2),
    assumptions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 4: BUDGET VS ACTUAL TRACKING
-- -----------------------------------------------------------------------------

-- Budget periods
CREATE TABLE budget_periods (
    period_id SERIAL PRIMARY KEY,
    period_name VARCHAR(100) NOT NULL,
    period_type VARCHAR(20) CHECK (period_type IN ('monthly', 'quarterly', 'annual', 'milestone')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter IN (1,2,3,4)),
    total_budget DECIMAL(15,2),
    status VARCHAR(20) CHECK (status IN ('draft', 'approved', 'active', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget line items
CREATE TABLE budget_line_items (
    line_item_id SERIAL PRIMARY KEY,
    period_id INTEGER REFERENCES budget_periods(period_id),
    pool_id INTEGER REFERENCES cost_allocation_pools(pool_id),
    category_id INTEGER REFERENCES cost_categories(category_id),
    milestone_id INTEGER,
    line_item_name VARCHAR(300) NOT NULL,
    description TEXT,
    budgeted_amount DECIMAL(12,2) NOT NULL,
    committed_amount DECIMAL(12,2) DEFAULT 0,
    actual_spent DECIMAL(12,2) DEFAULT 0,
    variance_amount DECIMAL(12,2) GENERATED ALWAYS AS (budgeted_amount - actual_spent) STORED,
    variance_percentage DECIMAL(5,2) GENERATED ALWAYS AS (CASE WHEN budgeted_amount > 0 THEN ((budgeted_amount - actual_spent) / budgeted_amount) * 100 ELSE 0 END) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget amendments
CREATE TABLE budget_amendments (
    amendment_id SERIAL PRIMARY KEY,
    line_item_id INTEGER REFERENCES budget_line_items(line_item_id),
    amendment_type VARCHAR(20) CHECK (amendment_type IN ('increase', 'decrease', 'reallocation')),
    original_amount DECIMAL(12,2) NOT NULL,
    amended_amount DECIMAL(12,2) NOT NULL,
    variance DECIMAL(12,2) NOT NULL,
    justification TEXT,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget approvals workflow
CREATE TABLE budget_approvals (
    approval_id SERIAL PRIMARY KEY,
    line_item_id INTEGER REFERENCES budget_line_items(line_item_id),
    approval_level VARCHAR(50),
    approver_role VARCHAR(100),
    approver_id INTEGER,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
    comments TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 5: CROSS-MODULE COST ATTRIBUTION
-- -----------------------------------------------------------------------------

-- Cost attribution links to other modules
CREATE TABLE cost_attributions (
    attribution_id SERIAL PRIMARY KEY,
    expense_id INTEGER REFERENCES operational_expenses(expense_id),
    source_module VARCHAR(50) NOT NULL,
    source_id INTEGER NOT NULL,
    attribution_percentage DECIMAL(5,2) CHECK (attribution_percentage >= 0 AND attribution_percentage <= 100),
    attributed_amount DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Labor cost integration (from People module)
CREATE TABLE labor_cost_allocations (
    allocation_id SERIAL PRIMARY KEY,
    pool_id INTEGER REFERENCES cost_allocation_pools(pool_id),
    team_id INTEGER,
    role_id INTEGER,
    milestone_id INTEGER,
    period_id INTEGER REFERENCES budget_periods(period_id),
    gross_salary DECIMAL(12,2),
    employer_taxes DECIMAL(10,2),
    benefits DECIMAL(10,2),
    total_labor_cost DECIMAL(15,2) GENERATED ALWAYS AS (COALESCE(gross_salary,0) + COALESCE(employer_taxes,0) + COALESCE(benefits,0)) STORED,
    allocation_percentage DECIMAL(5,2),
    attributed_cost DECIMAL(15,2),
    fiscal_year INTEGER NOT NULL,
    month INTEGER CHECK (month >= 1 AND month <= 12),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Infrastructure cost integration (from Tools module)
CREATE TABLE infrastructure_cost_allocations (
    allocation_id SERIAL PRIMARY KEY,
    pool_id INTEGER REFERENCES cost_allocation_pools(pool_id),
    cloud_provider_id INTEGER,
    service_id INTEGER,
    milestone_id INTEGER,
    period_id INTEGER REFERENCES budget_periods(period_id),
    compute_cost DECIMAL(12,2),
    storage_cost DECIMAL(10,2),
    network_cost DECIMAL(10,2),
    api_calls_cost DECIMAL(10,2),
    total_infrastructure_cost DECIMAL(15,2),
    allocation_percentage DECIMAL(5,2),
    attributed_cost DECIMAL(15,2),
    fiscal_year INTEGER NOT NULL,
    month INTEGER CHECK (month >= 1 AND month <= 12),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work/Bounty cost integration (from Work module)
CREATE TABLE work_cost_allocations (
    allocation_id SERIAL PRIMARY KEY,
    pool_id INTEGER REFERENCES cost_allocation_pools(pool_id),
    project_id INTEGER,
    bounty_id INTEGER,
    milestone_id INTEGER,
    period_id INTEGER REFERENCES budget_periods(period_id),
    bounty_amount DECIMAL(12,2),
    platform_fee DECIMAL(10,2),
    total_work_cost DECIMAL(12,2) GENERATED ALWAYS AS (bounty_amount + COALESCE(platform_fee,0)) STORED,
    allocation_percentage DECIMAL(5,2),
    attributed_cost DECIMAL(15,2),
    fiscal_year INTEGER NOT NULL,
    month INTEGER CHECK (month >= 1 AND month <= 12),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DAO Treasury integration
CREATE TABLE treasury_allocations (
    allocation_id SERIAL PRIMARY KEY,
    pool_id INTEGER REFERENCES cost_allocation_pools(pool_id),
    dao_proposal_id INTEGER,
    milestone_id INTEGER,
    allocation_type VARCHAR(50) CHECK (allocation_type IN ('treasury_fund', ' grants', 'infrastructure', 'operations', 'rewards')),
    allocated_amount DECIMAL(15,2),
    spent_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (allocated_amount - spent_amount) STORED,
    fiscal_year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter IN (1,2,3,4)),
    status VARCHAR(20) CHECK (status IN ('allocated', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community operations costs
CREATE TABLE community_cost_allocations (
    allocation_id SERIAL PRIMARY KEY,
    pool_id INTEGER REFERENCES cost_allocation_pools(pool_id),
    community_activity_id INTEGER,
    milestone_id INTEGER,
    period_id INTEGER REFERENCES budget_periods(period_id),
    event_cost DECIMAL(10,2),
    marketing_cost DECIMAL(10,2),
    moderator_costs DECIMAL(10,2),
    platform_costs DECIMAL(10,2),
    total_community_cost DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(event_cost,0) + COALESCE(marketing_cost,0) + COALESCE(moderator_costs,0) + COALESCE(platform_costs,0)) STORED,
    allocation_percentage DECIMAL(5,2),
    attributed_cost DECIMAL(15,2),
    fiscal_year INTEGER NOT NULL,
    month INTEGER CHECK (month >= 1 AND month <= 12),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 6: REPORTING VIEWS
-- -----------------------------------------------------------------------------

-- Operations cost summary by category
CREATE VIEW v_operations_cost_summary AS
SELECT 
    cc.category_name,
    cc.category_code,
    cc.cost_type,
    SUM(oe.amount) AS total_spent,
    COUNT(oe.expense_id) AS expense_count,
    AVG(oe.amount) AS avg_expense
FROM operational_expenses oe
JOIN operational_expense_types oet ON oe.expense_type_id = oet.expense_type_id
JOIN cost_categories cc ON oet.category_id = cc.category_id
WHERE oe.payment_status = 'paid'
GROUP BY cc.category_id, cc.category_name, cc.category_code, cc.cost_type;

-- Budget vs Actual by period
CREATE VIEW v_budget_vs_actual AS
SELECT 
    bp.period_name,
    bp.fiscal_year,
    bp.quarter,
    SUM(bli.budgeted_amount) AS total_budgeted,
    SUM(bli.actual_spent) AS total_spent,
    SUM(bli.variance_amount) AS total_variance,
    AVG(bli.variance_percentage) AS avg_variance_pct
FROM budget_periods bp
JOIN budget_line_items bli ON bp.period_id = bli.period_id
GROUP BY bp.period_id, bp.period_name, bp.fiscal_year, bp.quarter
ORDER BY bp.fiscal_year, bp.quarter;

-- Cost pool utilization
CREATE VIEW v_cost_pool_utilization AS
SELECT 
    cap.pool_name,
    cap.pool_code,
    cpt.pool_type_name,
    cap.total_budget,
    cap.current_balance,
    (cap.total_budget - cap.current_balance) AS allocated,
    CASE WHEN cap.total_budget > 0 
         THEN ((cap.total_budget - cap.current_balance) / cap.total_budget) * 100 
         ELSE 0 END AS utilization_pct,
    cap.fiscal_year,
    cap.quarter
FROM cost_allocation_pools cap
JOIN cost_pool_types cpt ON cap.pool_type_id = cpt.pool_type_id
WHERE cap.is_active = TRUE;

-- Resource utilization by team
CREATE VIEW v_resource_utilization_by_team AS
SELECT 
    rp.pool_name,
    rp.resource_type,
    t.team_name,
    ru.period_start,
    ru.period_end,
    ru.capacity_allocated,
    ru.capacity_used,
    ru.utilization_percentage,
    ru.efficiency_score
FROM resource_utilization ru
JOIN resource_pools rp ON ru.pool_resource_id = rp.pool_resource_id
LEFT JOIN teams t ON ru.team_id = t.team_id
ORDER BY ru.period_start DESC;

-- Cross-module cost attribution summary
CREATE VIEW v_cross_module_cost_summary AS
SELECT 
    source_module,
    COUNT(*) AS attribution_count,
    SUM(attribution_percentage) AS total_percentage,
    SUM(attributed_amount) AS total_attributed
FROM cost_attributions
GROUP BY source_module;

-- Labor cost attribution summary
CREATE VIEW v_labor_cost_attribution AS
SELECT 
    cap.pool_name,
    t.team_name,
    r.role_name,
    SUM(lca.total_labor_cost) AS total_labor_cost,
    SUM(lca.attributed_cost) AS attributed_cost,
    lca.fiscal_year,
    lca.month
FROM labor_cost_allocations lca
JOIN cost_allocation_pools cap ON lca.pool_id = cap.pool_id
LEFT JOIN teams t ON lca.team_id = t.team_id
LEFT JOIN roles r ON lca.role_id = r.role_id
GROUP BY cap.pool_name, t.team_name, r.role_name, lca.fiscal_year, lca.month;

-- Infrastructure cost attribution summary
CREATE VIEW v_infrastructure_cost_attribution AS
SELECT 
    cap.pool_name,
    cp.provider_name,
    SUM(ica.total_infrastructure_cost) AS total_infrastructure_cost,
    SUM(ica.attributed_cost) AS attributed_cost,
    ica.fiscal_year,
    ica.month
FROM infrastructure_cost_allocations ica
JOIN cost_allocation_pools cap ON ica.pool_id = cap.pool_id
LEFT JOIN cloud_providers cp ON ica.cloud_provider_id = cp.provider_id
GROUP BY cap.pool_name, cp.provider_name, ica.fiscal_year, ica.month;

-- Operations KPI dashboard
CREATE VIEW v_operations_kpi_dashboard AS
SELECT 
    bp.fiscal_year,
    bp.quarter,
    -- Budget metrics
    SUM(bli.budgeted_amount) AS total_budget,
    SUM(bli.actual_spent) AS total_spent,
    -- Labor metrics
    (SELECT SUM(total_labor_cost) FROM labor_cost_allocations lca WHERE lca.fiscal_year = bp.fiscal_year AND lca.quarter = bp.quarter) AS labor_cost,
    -- Infrastructure metrics
    (SELECT SUM(total_infrastructure_cost) FROM infrastructure_cost_allocations ica WHERE ica.fiscal_year = bp.fiscal_year AND ica.quarter = bp.quarter) AS infrastructure_cost,
    -- Operational metrics
    (SELECT SUM(amount) FROM operational_expenses oe WHERE oe.fiscal_year = bp.fiscal_year AND oe.quarter = bp.quarter AND oe.payment_status = 'paid') AS operational_expenses,
    -- Resource utilization
    (SELECT AVG(utilization_percentage) FROM resource_utilization ru WHERE ru.fiscal_year = bp.fiscal_year AND ru.quarter = bp.quarter) AS avg_resource_utilization
FROM budget_periods bp
JOIN budget_line_items bli ON bp.period_id = bli.period_id
WHERE bp.status = 'active'
GROUP BY bp.fiscal_year, bp.quarter;

-- -----------------------------------------------------------------------------
-- SECTION 7: INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------

CREATE INDEX idx_operational_expenses_date ON operational_expenses(expense_date);
CREATE INDEX idx_operational_expenses_pool ON operational_expenses(pool_id);
CREATE INDEX idx_operational_expenses_status ON operational_expenses(payment_status);
CREATE INDEX idx_budget_line_items_period ON budget_line_items(period_id);
CREATE INDEX idx_budget_line_items_pool ON budget_line_items(pool_id);
CREATE INDEX idx_resource_utilization_pool ON resource_utilization(pool_resource_id);
CREATE INDEX idx_resource_utilization_period ON resource_utilization(period_start, period_end);
CREATE INDEX idx_labor_cost_allocations_period ON labor_cost_allocations(fiscal_year, month);
CREATE INDEX idx_infrastructure_cost_allocations_period ON infrastructure_cost_allocations(fiscal_year, month);
CREATE INDEX idx_cost_attributions_source ON cost_attributions(source_module, source_id);

-- -----------------------------------------------------------------------------
-- SECTION 8: COMMENTS
-- -----------------------------------------------------------------------------

COMMENT ON TABLE cost_pool_types IS 'Types of cost allocation pools (e.g., operational, capital, project-based)';
COMMENT ON TABLE cost_allocation_pools IS 'Central cost pools for budget allocation across the organization';
COMMENT ON TABLE cost_categories IS 'Granular cost categories for expense tracking and reporting';
COMMENT ON TABLE cost_allocation_rules IS 'Rules defining how costs are allocated across modules';
COMMENT ON TABLE operational_expense_types IS 'Classification of operational expenses';
COMMENT ON TABLE facility_expenses IS 'Physical facility costs (rent, utilities, maintenance, insurance)';
COMMENT ON TABLE operational_expenses IS 'General operational expense transactions';
COMMENT ON TABLE insurance_policies IS 'Insurance coverage tracking';
COMMENT ON TABLE resource_pools IS 'Resource capacity pools (human, compute, storage, etc.)';
COMMENT ON TABLE resource_utilization IS 'Tracking resource utilization against capacity';
COMMENT ON TABLE capacity_forecasts IS 'Future capacity planning projections';
COMMENT ON TABLE budget_periods IS 'Budget tracking periods (monthly, quarterly, annual, milestone)';
COMMENT ON TABLE budget_line_items IS 'Individual budget line items with planned vs actual';
COMMENT ON TABLE budget_amendments IS 'Budget changes and reallocations';
COMMENT ON TABLE budget_approvals IS 'Budget approval workflow tracking';
COMMENT ON TABLE cost_attributions IS 'Links expenses to source modules for attribution';
COMMENT ON TABLE labor_cost_allocations IS 'Integration with People module for labor cost allocation';
COMMENT ON TABLE infrastructure_cost_allocations IS 'Integration with Tools module for infra cost allocation';
COMMENT ON TABLE work_cost_allocations IS 'Integration with Work module for bounty/project costs';
COMMENT ON TABLE treasury_allocations IS 'Integration with DAO treasury allocations';
COMMENT ON TABLE community_cost_allocations IS 'Integration with Community module for community operations';

-- =============================================================================
-- END OF OPERATIONS MANAGEMENT SCHEMA (MODULE 10)
-- =============================================================================
