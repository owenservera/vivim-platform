-- VIVIM Digital Twin Cost Database Schema
-- Module: PEOPLE (Labor, Roles, Skills, Locations)
-- Generated from VIVIM cost research documents
-- Version: 1.0.0

-- ============================================================================
-- CORE TABLES: LOCATIONS & REGIONS
-- ============================================================================

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g., 'ES-PM', 'IT-CT', 'MT'
    name VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
    country_name VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'EUR',
    cost_of_living_index DECIMAL(5,2), -- Relative to baseline (100 = baseline)
    tech_hub_status VARCHAR(50), -- 'established', 'growing', 'emerging'
    language_primary VARCHAR(50),
    language_secondary VARCHAR(50) ARRAY,
    remote_work_prevalence DECIMAL(3,2), -- 0.00 to 1.00
    tax_corporate_rate DECIMAL(5,2), -- Percentage
    tax_employer_burden DECIMAL(5,2), -- Percentage (e.g., 30-40% for Italy)
    gdpr_compliance BOOLEAN DEFAULT true,
    data_center_regions VARCHAR(100) ARRAY,
    hiring_difficulty_score INTEGER CHECK (hiring_difficulty_score BETWEEN 1 AND 10),
    quality_of_tech_talent_score INTEGER CHECK (quality_of_tech_talent_score BETWEEN 1 AND 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE location_tax_incentives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    incentive_type VARCHAR(50), -- 'tax_rate_cap', 'deduction', 'credit', 'subsidy'
    description TEXT,
    eligibility_criteria JSONB,
    benefit_value DECIMAL(10,2),
    benefit_unit VARCHAR(50), -- 'percentage', 'fixed_amount', 'per_employee'
    duration_months INTEGER,
    income_threshold_min DECIMAL(12,2),
    income_threshold_max DECIMAL(12,2),
    eligible_roles VARCHAR(100) ARRAY,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CORE TABLES: ROLES & SKILL MATRIX
-- ============================================================================

CREATE TABLE role_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    department VARCHAR(100), -- 'engineering', 'design', 'product', 'legal', 'operations'
    career_track VARCHAR(50), -- 'individual_contributor', 'management', 'hybrid'
    typical_progression JSONB, -- Array of role progression
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES role_categories(id),
    description TEXT,
    responsibilities TEXT ARRAY,
    required_skills VARCHAR(100) ARRAY,
    preferred_skills VARCHAR(100) ARRAY,
    years_experience_min INTEGER,
    years_experience_max INTEGER,
    seniority_level VARCHAR(50), -- 'junior', 'mid', 'senior', 'lead', 'staff', 'principal'
    employment_types VARCHAR(50) ARRAY, -- 'full_time', 'contractor', 'freelance', 'part_time'
    is_technical BOOLEAN DEFAULT false,
    is_ml_related BOOLEAN DEFAULT false,
    is_security_related BOOLEAN DEFAULT false,
    is_compliance_related BOOLEAN DEFAULT false,
    default_fte_percentage DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100), -- 'programming', 'infrastructure', 'ml_ai', 'design', 'soft_skills'
    subcategory VARCHAR(100),
    description TEXT,
    proficiency_levels JSONB, -- Definition of skill levels 1-5
    market_demand_score INTEGER CHECK (market_demand_score BETWEEN 1 AND 10),
    scarcity_score INTEGER CHECK (scarcity_score BETWEEN 1 AND 10),
    related_skills UUID ARRAY REFERENCES skills(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_skill_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true,
    proficiency_level_min INTEGER CHECK (proficiency_level_min BETWEEN 1 AND 5),
    proficiency_level_ideal INTEGER CHECK (proficiency_level_ideal BETWEEN 1 AND 5),
    importance_weight DECIMAL(3,2) DEFAULT 1.00,
    UNIQUE(role_id, skill_id)
);

-- ============================================================================
-- COST TABLES: SALARY BENCHMARKS
-- ============================================================================

CREATE TABLE salary_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    employment_type VARCHAR(50) NOT NULL, -- 'full_time', 'contractor', 'freelance'
    currency_code VARCHAR(3) NOT NULL DEFAULT 'EUR',
    
    -- Annual Salary Ranges (for full-time)
    salary_annual_low DECIMAL(12,2),
    salary_annual_mid DECIMAL(12,2),
    salary_annual_high DECIMAL(12,2),
    
    -- Hourly Rates (for contractors/freelance)
    hourly_rate_low DECIMAL(8,2),
    hourly_rate_mid DECIMAL(8,2),
    hourly_rate_high DECIMAL(8,2),
    
    -- Monthly equivalents
    monthly_cost_low DECIMAL(10,2),
    monthly_cost_mid DECIMAL(10,2),
    monthly_cost_high DECIMAL(10,2),
    
    -- Total compensation including benefits/burden
    total_cost_annual_low DECIMAL(12,2),
    total_cost_annual_mid DECIMAL(12,2),
    total_cost_annual_high DECIMAL(12,2),
    
    -- Metadata
    data_source VARCHAR(200), -- 'PayScale', 'Levels.fyi', 'Glassdoor', 'Industry estimate'
    data_date DATE,
    sample_size INTEGER,
    confidence_level VARCHAR(20), -- 'low', 'medium', 'high'
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(role_id, location_id, employment_type)
);

CREATE TABLE employment_cost_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id),
    employment_type VARCHAR(50) NOT NULL,
    
    -- Cost multipliers and add-ons
    base_salary_multiplier DECIMAL(4,2) DEFAULT 1.00,
    employer_tax_rate DECIMAL(5,2), -- Social security, etc.
    benefits_cost_percentage DECIMAL(5,2), -- Health insurance, etc.
    thirteenth_month BOOLEAN DEFAULT false,
    fourteenth_month BOOLEAN DEFAULT false,
    severance_days_per_year DECIMAL(5,2),
    notice_period_days_min INTEGER,
    notice_period_days_max INTEGER,
    
    -- Contractor specific
    platform_fee_percentage DECIMAL(5,2),
    contractor_insurance_min DECIMAL(8,2),
    
    -- Overhead allocations
    office_space_cost_monthly DECIMAL(8,2),
    equipment_cost_annual DECIMAL(8,2),
    software_licenses_monthly DECIMAL(8,2),
    training_budget_annual DECIMAL(8,2),
    
    effective_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROJECT TABLES: TEAM COMPOSITION & PLANNING
-- ============================================================================

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    team_type VARCHAR(50), -- 'engineering', 'product', 'design', 'ml', 'operations', 'leadership'
    parent_team_id UUID REFERENCES teams(id),
    cost_center_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    employment_type VARCHAR(50) NOT NULL DEFAULT 'full_time',
    
    -- Allocation
    fte_percentage DECIMAL(3,2) DEFAULT 1.00,
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Cost (can override benchmarks)
    actual_salary_annual DECIMAL(12,2),
    actual_hourly_rate DECIMAL(8,2),
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Milestone assignment
    milestone_start INTEGER,
    milestone_end INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE milestone_team_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id INTEGER NOT NULL,
    team_id UUID NOT NULL REFERENCES teams(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    employment_type VARCHAR(50) NOT NULL,
    
    fte_count DECIMAL(4,2) NOT NULL,
    duration_months INTEGER NOT NULL,
    hourly_rate DECIMAL(8,2),
    
    -- Calculated costs
    estimated_cost_low DECIMAL(12,2),
    estimated_cost_mid DECIMAL(12,2),
    estimated_cost_high DECIMAL(12,2),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BUDGET & FORECASTING TABLES
-- ============================================================================

CREATE TABLE labor_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    budget_type VARCHAR(50), -- 'milestone', 'phase', 'annual', 'project'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Budget amounts
    budget_amount_low DECIMAL(12,2),
    budget_amount_mid DECIMAL(12,2),
    budget_amount_high DECIMAL(12,2),
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Actuals
    actual_amount DECIMAL(12,2),
    variance_amount DECIMAL(12,2),
    variance_percentage DECIMAL(5,2),
    
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'active', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE labor_cost_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_date DATE NOT NULL,
    scenario VARCHAR(50) NOT NULL, -- 'conservative', 'baseline', 'optimistic'
    
    -- Forecast dimensions
    role_id UUID REFERENCES roles(id),
    location_id UUID REFERENCES locations(id),
    team_id UUID REFERENCES teams(id),
    milestone_id INTEGER,
    
    -- Forecast values
    headcount_fte DECIMAL(6,2),
    cost_amount DECIMAL(12,2),
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Assumptions
    assumptions JSONB,
    confidence_level VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

CREATE VIEW v_labor_costs_by_milestone AS
SELECT 
    mta.milestone_id,
    mta.team_id,
    t.name as team_name,
    mta.role_id,
    r.title as role_title,
    r.seniority_level,
    mta.location_id,
    l.name as location_name,
    l.country_code,
    mta.employment_type,
    mta.fte_count,
    mta.duration_months,
    mta.estimated_cost_low,
    mta.estimated_cost_mid,
    mta.estimated_cost_high,
    (mta.estimated_cost_mid / NULLIF(mta.fte_count * mta.duration_months, 0)) as cost_per_fte_month
FROM milestone_team_allocations mta
JOIN teams t ON mta.team_id = t.id
JOIN roles r ON mta.role_id = r.id
JOIN locations l ON mta.location_id = l.id;

CREATE VIEW v_role_cost_comparison AS
SELECT 
    r.id as role_id,
    r.title as role_title,
    r.seniority_level,
    l.country_code,
    l.name as location_name,
    sb.employment_type,
    sb.salary_annual_low,
    sb.salary_annual_mid,
    sb.salary_annual_high,
    sb.hourly_rate_low,
    sb.hourly_rate_mid,
    sb.hourly_rate_high,
    sb.data_source,
    sb.data_date
FROM salary_benchmarks sb
JOIN roles r ON sb.role_id = r.id
JOIN locations l ON sb.location_id = l.id
WHERE sb.is_active = true;

CREATE VIEW v_team_cost_summary AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.team_type,
    COUNT(tm.id) as member_count,
    SUM(tm.fte_percentage) as total_fte,
    SUM(CASE 
        WHEN tm.actual_salary_annual IS NOT NULL 
        THEN tm.actual_salary_annual * tm.fte_percentage
        ELSE sb.total_cost_annual_mid * tm.fte_percentage
    END) as annual_cost_mid
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
LEFT JOIN salary_benchmarks sb ON tm.role_id = sb.role_id 
    AND tm.location_id = sb.location_id 
    AND tm.employment_type = sb.employment_type
GROUP BY t.id, t.name, t.team_type;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_locations_country ON locations(country_code);
CREATE INDEX idx_locations_cost_of_living ON locations(cost_of_living_index);
CREATE INDEX idx_roles_category ON roles(category_id);
CREATE INDEX idx_roles_seniority ON roles(seniority_level);
CREATE INDEX idx_salary_benchmarks_role_location ON salary_benchmarks(role_id, location_id);
CREATE INDEX idx_salary_benchmarks_active ON salary_benchmarks(is_active) WHERE is_active = true;
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_active ON team_members(is_active) WHERE is_active = true;
CREATE INDEX idx_milestone_allocations_milestone ON milestone_team_allocations(milestone_id);
CREATE INDEX idx_labor_forecasts_date ON labor_cost_forecasts(forecast_date);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE locations IS 'Geographic locations with cost and regulatory data for labor planning';
COMMENT ON TABLE roles IS 'Job roles and positions with skill requirements and seniority levels';
COMMENT ON TABLE salary_benchmarks IS 'Market salary data by role and location from research sources';
COMMENT ON TABLE milestone_team_allocations IS 'Team resource allocations per milestone for cost tracking';
COMMENT ON VIEW v_labor_costs_by_milestone IS 'Consolidated view of labor costs broken down by milestone';
