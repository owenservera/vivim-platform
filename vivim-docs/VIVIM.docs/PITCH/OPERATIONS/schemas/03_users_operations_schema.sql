-- VIVIM Digital Twin Cost Database Schema
-- Module: USERS (Operations, MAU Scaling, Revenue, Dividends)
-- Generated from VIVIM Milestones & Cost Breakdown research
-- Version: 1.0.0

-- ============================================================================
-- CORE TABLES: USER BASE & GROWTH
-- ============================================================================

CREATE TABLE user_growth_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Model parameters
    starting_users INTEGER NOT NULL DEFAULT 0,
    target_users INTEGER NOT NULL,
    timeline_months INTEGER NOT NULL,
    
    -- Growth curve type
    growth_curve_type VARCHAR(50), -- 'linear', 'exponential', 'sigmoid', 'viral'
    growth_rate_monthly DECIMAL(5,4), -- Monthly growth rate (e.g., 0.15 = 15%)
    viral_coefficient DECIMAL(4,2), -- K-factor for viral growth
    churn_rate_monthly DECIMAL(5,4), -- Monthly churn rate
    
    -- Assumptions
    assumptions JSONB,
    -- {acquisition_channels: ['organic', 'social', 'partnerships'], 
    --  conversion_rate: 0.25, activation_rate: 0.60}
    
    -- Associated milestone
    target_milestone_id INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_base_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES user_growth_models(id),
    projection_date DATE NOT NULL,
    
    -- User counts
    total_users INTEGER,
    active_users INTEGER, -- MAU
    engaged_users INTEGER, -- DAU or highly active
    new_users INTEGER,
    churned_users INTEGER,
    
    -- User segments
    contributors INTEGER, -- Users opted into data contribution
    api_customers INTEGER, -- Paying API users
    enterprise_customers INTEGER, -- Enterprise accounts
    
    -- Quality metrics
    retention_rate_d1 DECIMAL(5,4),
    retention_rate_d7 DECIMAL(5,4),
    retention_rate_d30 DECIMAL(5,4),
    
    -- Milestone progress
    milestone_id INTEGER,
    milestone_progress_percentage DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USER ACTIVITY & ENGAGEMENT COSTS
-- ============================================================================

CREATE TABLE user_activity_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Activity levels
    sessions_per_day DECIMAL(4,2),
    messages_per_session INTEGER,
    api_calls_per_day INTEGER,
    
    -- Resource consumption
    storage_mb_per_user DECIMAL(8,2),
    bandwidth_mb_per_day DECIMAL(8,2),
    compute_seconds_per_day DECIMAL(8,2),
    
    -- LLM usage (for BYOK model, these are user-paid)
    llm_tokens_input_per_day INTEGER,
    llm_tokens_output_per_day INTEGER,
    embedding_tokens_per_day INTEGER,
    
    -- User tier
    user_tier VARCHAR(50), -- 'free', 'premium', 'enterprise'
    
    -- Percentage of user base
    typical_user_percentage DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_segment_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Segment definition
    user_count_min INTEGER,
    user_count_max INTEGER,
    activity_profile_id UUID REFERENCES user_activity_profiles(id),
    
    -- Infrastructure allocation
    compute_instances INTEGER,
    database_replicas INTEGER,
    cache_memory_gb INTEGER,
    vector_db_capacity VARCHAR(50),
    
    -- Per-user costs
    infrastructure_cost_per_user DECIMAL(8,4),
    database_cost_per_user DECIMAL(8,4),
    storage_cost_per_user DECIMAL(8,4),
    bandwidth_cost_per_user DECIMAL(8,4),
    support_cost_per_user DECIMAL(8,4),
    
    total_cost_per_user DECIMAL(8,4),
    
    currency_code VARCHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- REVENUE MODELS & STREAMS
-- ============================================================================

CREATE TABLE revenue_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Stream characteristics
    revenue_type VARCHAR(50), -- 'api_usage', 'enterprise_license', 'subscription', 'dividend_pool'
    pricing_model VARCHAR(50), -- 'usage_based', 'flat_fee', 'tiered', 'revenue_share'
    
    -- Pricing
    unit_price DECIMAL(10,4),
    unit_of_measure VARCHAR(50), -- 'token', 'request', 'seat', 'month'
    
    -- Milestone when this becomes available
    first_milestone_id INTEGER,
    typical_mrr_at_launch DECIMAL(12,2),
    
    -- Revenue sharing
    platform_share_percentage DECIMAL(5,2),
    user_dividend_percentage DECIMAL(5,2),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE revenue_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revenue_stream_id UUID NOT NULL REFERENCES revenue_streams(id),
    projection_date DATE NOT NULL,
    milestone_id INTEGER,
    
    -- Revenue metrics
    mrr DECIMAL(12,2), -- Monthly Recurring Revenue
    arr DECIMAL(12,2), -- Annual Recurring Revenue
    
    -- Breakdown
    api_revenue DECIMAL(12,2),
    enterprise_revenue DECIMAL(12,2),
    other_revenue DECIMAL(12,2),
    
    -- Customer metrics
    paying_customers INTEGER,
    average_revenue_per_customer DECIMAL(10,2),
    
    -- Dividend pool
    dividend_pool_amount DECIMAL(12,2),
    
    currency_code VARCHAR(3) DEFAULT 'EUR',
    scenario VARCHAR(50), -- 'conservative', 'baseline', 'optimistic'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DIVIDEND SYSTEM
-- ============================================================================

CREATE TABLE dividend_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Distribution ratios
    platform_share_percentage DECIMAL(5,2) NOT NULL, -- e.g., 30%
    user_dividend_pool_percentage DECIMAL(5,2) NOT NULL, -- e.g., 70%
    
    -- Contribution scoring weights
    volume_weight DECIMAL(4,2), -- Weight for number of ACUs contributed
    quality_weight DECIMAL(4,2), -- Weight for quality scores
    uniqueness_weight DECIMAL(4,2), -- Weight for uniqueness
    depth_weight DECIMAL(4,2), -- Weight for conversation depth
    domain_weight DECIMAL(4,2), -- Weight for expert domains
    engagement_weight DECIMAL(4,2), -- Weight for social engagement
    consistency_weight DECIMAL(4,2), -- Weight for sustained contribution
    
    -- Minimum thresholds
    min_acus_for_eligibility INTEGER DEFAULT 10,
    min_quality_score DECIMAL(3,2) DEFAULT 0.50,
    
    -- Payment settings
    payment_frequency_months INTEGER DEFAULT 3,
    min_payout_amount DECIMAL(8,2) DEFAULT 10.00,
    payout_methods VARCHAR(50) ARRAY, -- ['bank_transfer', 'paypal', 'crypto']
    
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dividend_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES dividend_policies(id),
    calculation_period_start DATE NOT NULL,
    calculation_period_end DATE NOT NULL,
    
    -- Revenue basis
    total_model_revenue DECIMAL(12,2) NOT NULL,
    platform_share_amount DECIMAL(12,2) NOT NULL,
    user_dividend_pool DECIMAL(12,2) NOT NULL,
    
    -- Contribution pool
    total_eligible_contributors INTEGER,
    total_eligible_acus INTEGER,
    total_contribution_score DECIMAL(12,4),
    
    -- Distribution metrics
    average_payout DECIMAL(8,2),
    median_payout DECIMAL(8,2),
    max_payout DECIMAL(10,2),
    min_payout DECIMAL(8,2),
    
    status VARCHAR(50) DEFAULT 'calculated', -- 'calculated', 'approved', 'processing', 'distributed'
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    distributed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE contributor_dividends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID NOT NULL REFERENCES dividend_calculations(id),
    contributor_id UUID NOT NULL, -- Reference to user
    
    -- Contribution metrics
    acus_contributed INTEGER,
    quality_score DECIMAL(4,3),
    uniqueness_score DECIMAL(4,3),
    depth_score DECIMAL(4,3),
    domain_score DECIMAL(4,3),
    engagement_score DECIMAL(4,3),
    consistency_score DECIMAL(4,3),
    
    -- Calculated share
    composite_score DECIMAL(8,4),
    contribution_share_percentage DECIMAL(7,4), -- e.g., 0.34%
    
    -- Payout
    payout_amount DECIMAL(10,2),
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Payment status
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed'
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Tax documentation
    tax_form_received BOOLEAN DEFAULT false,
    tax_form_type VARCHAR(50), -- 'w9', 'w8ben', '1099'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- COST PER USER ANALYSIS
-- ============================================================================

CREATE TABLE cost_per_user_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_date DATE NOT NULL,
    user_count INTEGER NOT NULL,
    milestone_id INTEGER,
    
    -- Operational costs
    infrastructure_cost DECIMAL(12,2),
    labor_cost DECIMAL(12,2),
    third_party_cost DECIMAL(12,2),
    legal_cost DECIMAL(12,2),
    marketing_cost DECIMAL(12,2),
    support_cost DECIMAL(12,2),
    other_cost DECIMAL(12,2),
    
    total_operational_cost DECIMAL(12,2),
    
    -- Per-user metrics
    cost_per_user DECIMAL(8,4),
    cost_per_active_user DECIMAL(8,4),
    cost_per_contributor DECIMAL(8,4),
    
    -- Revenue offset
    total_revenue DECIMAL(12,2),
    revenue_per_user DECIMAL(8,4),
    net_cost_per_user DECIMAL(8,4),
    
    -- Unit economics
    ltv_estimate DECIMAL(10,2), -- Lifetime Value
    cac_estimate DECIMAL(8,2), -- Customer Acquisition Cost
    ltv_cac_ratio DECIMAL(4,2),
    payback_period_months INTEGER,
    
    currency_code VARCHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cost_trajectory_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Scenario assumptions
    growth_rate_assumption DECIMAL(5,4),
    cost_optimization_rate DECIMAL(5,4), -- Monthly cost reduction from efficiency
    price_elasticity DECIMAL(4,2),
    
    -- Target milestones
    profitability_milestone_id INTEGER,
    break_even_user_count INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MILESTONE TRACKING & COST ALLOCATION
-- ============================================================================

CREATE TABLE milestones (
    id INTEGER PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    tagline VARCHAR(200),
    description TEXT,
    
    -- Timeline
    start_month INTEGER NOT NULL, -- Month from project start
    duration_months INTEGER NOT NULL,
    end_month INTEGER, -- Calculated: start_month + duration_months
    
    -- Phase classification
    phase_type VARCHAR(50), -- 'foundation', 'growth', 'trust', 'scale', 'training', 'revenue', 'distribution'
    
    -- Key deliverables
    key_deliverables TEXT ARRAY,
    success_criteria TEXT ARRAY,
    
    -- User targets
    target_user_count INTEGER,
    target_contributor_count INTEGER,
    target_retention_rate DECIMAL(5,4),
    
    -- Resource requirements
    required_engineers_fte DECIMAL(4,2),
    required_ml_engineers_fte DECIMAL(4,2),
    required_designers_fte DECIMAL(4,2),
    required_legal_hours INTEGER,
    
    -- Dependencies
    depends_on_milestone_id INTEGER REFERENCES milestones(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE milestone_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id INTEGER NOT NULL REFERENCES milestones(id),
    
    -- Budget ranges
    labor_cost_low DECIMAL(12,2),
    labor_cost_mid DECIMAL(12,2),
    labor_cost_high DECIMAL(12,2),
    
    infrastructure_cost_low DECIMAL(12,2),
    infrastructure_cost_mid DECIMAL(12,2),
    infrastructure_cost_high DECIMAL(12,2),
    
    third_party_cost_low DECIMAL(12,2),
    third_party_cost_mid DECIMAL(12,2),
    third_party_cost_high DECIMAL(12,2),
    
    legal_cost_low DECIMAL(12,2),
    legal_cost_mid DECIMAL(12,2),
    legal_cost_high DECIMAL(12,2),
    
    marketing_cost_low DECIMAL(12,2),
    marketing_cost_mid DECIMAL(12,2),
    marketing_cost_high DECIMAL(12,2),
    
    total_cost_low DECIMAL(12,2),
    total_cost_mid DECIMAL(12,2),
    total_cost_high DECIMAL(12,2),
    
    -- Per-user metrics at milestone end
    cost_per_user DECIMAL(8,4),
    
    currency_code VARCHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

CREATE VIEW v_milestone_cost_summary AS
SELECT 
    m.id as milestone_id,
    m.code,
    m.name,
    m.phase_type,
    m.start_month,
    m.duration_months,
    m.target_user_count,
    mc.total_cost_low,
    mc.total_cost_mid,
    mc.total_cost_high,
    mc.cost_per_user,
    mc.labor_cost_mid,
    mc.infrastructure_cost_mid,
    mc.third_party_cost_mid,
    mc.legal_cost_mid,
    mc.marketing_cost_mid,
    SUM(mc.total_cost_mid) OVER (ORDER BY m.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as cumulative_cost_mid
FROM milestones m
LEFT JOIN milestone_costs mc ON m.id = mc.milestone_id;

CREATE VIEW v_unit_economics_trajectory AS
SELECT 
    cupa.analysis_date,
    cupa.user_count,
    cupa.milestone_id,
    m.name as milestone_name,
    cupa.cost_per_user,
    cupa.revenue_per_user,
    cupa.net_cost_per_user,
    cupa.ltv_estimate,
    cupa.cac_estimate,
    cupa.ltv_cac_ratio,
    cupa.payback_period_months,
    CASE 
        WHEN cupa.net_cost_per_user < 0 THEN 'profitable'
        WHEN cupa.net_cost_per_user < cupa.cost_per_user * 0.5 THEN 'approaching_profitability'
        ELSE 'investment_phase'
    END as unit_economics_status
FROM cost_per_user_analysis cupa
LEFT JOIN milestones m ON cupa.milestone_id = m.id;

CREATE VIEW v_dividend_summary AS
SELECT 
    dc.calculation_period_start,
    dc.calculation_period_end,
    dc.total_model_revenue,
    dc.user_dividend_pool,
    dc.total_eligible_contributors,
    dc.average_payout,
    dc.median_payout,
    COUNT(CASE WHEN cd.payment_status = 'paid' THEN 1 END) as paid_count,
    SUM(CASE WHEN cd.payment_status = 'paid' THEN cd.payout_amount ELSE 0 END) as total_paid,
    dc.status
FROM dividend_calculations dc
LEFT JOIN contributor_dividends cd ON dc.id = cd.calculation_id
GROUP BY dc.id, dc.calculation_period_start, dc.calculation_period_end, 
         dc.total_model_revenue, dc.user_dividend_pool, dc.total_eligible_contributors,
         dc.average_payout, dc.median_payout, dc.status;

CREATE VIEW v_cost_driver_analysis AS
SELECT 
    cupa.milestone_id,
    m.name as milestone_name,
    cupa.user_count,
    (cupa.infrastructure_cost / NULLIF(cupa.total_operational_cost, 0) * 100) as infrastructure_pct,
    (cupa.labor_cost / NULLIF(cupa.total_operational_cost, 0) * 100) as labor_pct,
    (cupa.third_party_cost / NULLIF(cupa.total_operational_cost, 0) * 100) as third_party_pct,
    (cupa.legal_cost / NULLIF(cupa.total_operational_cost, 0) * 100) as legal_pct,
    (cupa.marketing_cost / NULLIF(cupa.total_operational_cost, 0) * 100) as marketing_pct,
    cupa.cost_per_user,
    (cupa.infrastructure_cost / NULLIF(cupa.user_count, 0)) as infrastructure_per_user,
    (cupa.labor_cost / NULLIF(cupa.user_count, 0)) as labor_per_user
FROM cost_per_user_analysis cupa
LEFT JOIN milestones m ON cupa.milestone_id = m.id;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_user_projections_model ON user_base_projections(model_id);
CREATE INDEX idx_user_projections_date ON user_base_projections(projection_date);
CREATE INDEX idx_user_segments_profile ON user_segment_costs(activity_profile_id);
CREATE INDEX idx_revenue_projections_stream ON revenue_projections(revenue_stream_id);
CREATE INDEX idx_revenue_projections_date ON revenue_projections(projection_date);
CREATE INDEX idx_dividend_calculations_policy ON dividend_calculations(policy_id);
CREATE INDEX idx_dividend_calculations_period ON dividend_calculations(calculation_period_start, calculation_period_end);
CREATE INDEX idx_contributor_dividends_calculation ON contributor_dividends(calculation_id);
CREATE INDEX idx_contributor_dividends_contributor ON contributor_dividends(contributor_id);
CREATE INDEX idx_cost_analysis_date ON cost_per_user_analysis(analysis_date);
CREATE INDEX idx_cost_analysis_milestone ON cost_per_user_analysis(milestone_id);
CREATE INDEX idx_milestone_costs_milestone ON milestone_costs(milestone_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_growth_models IS 'User growth projections with different growth curves and assumptions';
COMMENT ON TABLE revenue_streams IS 'Different revenue sources (API, enterprise, etc.) with pricing models';
COMMENT ON TABLE dividend_policies IS 'Configuration for how model revenue is distributed to contributors';
COMMENT ON TABLE dividend_calculations IS 'Periodic calculations of dividend pools and distributions';
COMMENT ON TABLE cost_per_user_analysis IS 'Unit economics analysis showing cost and revenue per user over time';
COMMENT ON TABLE milestones IS 'The 10 VIVIM development milestones with targets and requirements';
COMMENT ON VIEW v_milestone_cost_summary IS 'Consolidated view of costs across all milestones with cumulative totals';
COMMENT ON VIEW v_unit_economics_trajectory IS 'Unit economics metrics tracking path to profitability';
