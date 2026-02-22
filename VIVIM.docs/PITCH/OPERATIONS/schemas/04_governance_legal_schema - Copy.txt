-- VIVIM Digital Twin Cost Database Schema
-- Module: GOVERNANCE (Legal, Compliance, Contracts, Risk)
-- Generated from VIVIM Milestones & Legal Cost research
-- Version: 1.0.0

-- ============================================================================
-- CORE TABLES: LEGAL FRAMEWORK & COMPLIANCE
-- ============================================================================

CREATE TABLE compliance_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Framework characteristics
    framework_type VARCHAR(50), -- 'regulation', 'standard', 'certification', 'industry_best_practice'
    jurisdiction VARCHAR(100), -- 'EU', 'US', 'Global', 'Germany', etc.
    authority VARCHAR(100), -- 'GDPR', 'SEC', 'ISO', etc.
    
    -- Applicability
    applies_to_data BOOLEAN DEFAULT false,
    applies_to_ai BOOLEAN DEFAULT false,
    applies_to_financial BOOLEAN DEFAULT false,
    applies_to_privacy BOOLEAN DEFAULT false,
    applies_to_security BOOLEAN DEFAULT false,
    
    -- Requirements
    key_requirements TEXT ARRAY,
    mandatory_controls TEXT ARRAY,
    documentation_required TEXT ARRAY,
    audit_frequency VARCHAR(50), -- 'annual', 'bi_annual', 'continuous'
    
    -- Penalties
    max_fine_amount DECIMAL(12,2),
    max_fine_currency VARCHAR(3),
    fine_basis TEXT, -- Description of how fines are calculated
    
    -- Timeline
    effective_date DATE,
    enforcement_date DATE,
    next_review_date DATE,
    
    is_active BOOLEAN DEFAULT true,
    priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE compliance_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES compliance_frameworks(id),
    milestone_id INTEGER NOT NULL,
    
    -- Compliance target
    compliance_target VARCHAR(50), -- 'awareness', 'partial', 'full', 'certification'
    description TEXT,
    
    -- Requirements at this milestone
    required_deliverables TEXT ARRAY,
    required_evidence TEXT ARRAY,
    estimated_effort_hours INTEGER,
    
    -- Costs
    internal_cost_estimate DECIMAL(10,2),
    external_cost_estimate DECIMAL(10,2),
    audit_cost_estimate DECIMAL(10,2),
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'waived'
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LEGAL SERVICES & COUNSEL
-- ============================================================================

CREATE TABLE legal_service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Typical work products
    typical_deliverables TEXT ARRAY,
    
    -- Complexity indicators
    avg_hours_low INTEGER,
    avg_hours_mid INTEGER,
    avg_hours_high INTEGER,
    
    -- When needed
    typical_trigger VARCHAR(200),
    can_be_templated BOOLEAN DEFAULT false,
    requires_specialist BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE legal_counsel_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES legal_service_categories(id),
    
    -- Rate structure
    engagement_type VARCHAR(50), -- 'hourly', 'fixed_fee', 'retainer', 'contingency'
    
    -- Hourly rates (if applicable)
    hourly_rate_junior DECIMAL(8,2),
    hourly_rate_mid DECIMAL(8,2),
    hourly_rate_senior DECIMAL(8,2),
    hourly_rate_partner DECIMAL(8,2),
    
    -- Fixed fees (if applicable)
    fixed_fee_low DECIMAL(10,2),
    fixed_fee_mid DECIMAL(10,2),
    fixed_fee_high DECIMAL(10,2),
    
    -- Retainer (if applicable)
    monthly_retainer_low DECIMAL(10,2),
    monthly_retainer_mid DECIMAL(10,2),
    monthly_retainer_high DECIMAL(10,2),
    
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Source
    data_source VARCHAR(200), -- 'ContractsCounsel', 'LeanLaw', 'Industry estimate'
    data_date DATE,
    geography VARCHAR(100), -- 'US', 'EU', 'UK', etc.
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE legal_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Classification
    category_id UUID REFERENCES legal_service_categories(id),
    milestone_id INTEGER,
    priority VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
    
    -- Scope
    deliverables TEXT ARRAY,
    estimated_hours_low INTEGER,
    estimated_hours_mid INTEGER,
    estimated_hours_high INTEGER,
    
    -- Budget
    budget_low DECIMAL(10,2),
    budget_mid DECIMAL(10,2),
    budget_high DECIMAL(10,2),
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Engagement
    counsel_firm VARCHAR(200),
    lead_attorney VARCHAR(100),
    engagement_type VARCHAR(50),
    
    -- Timeline
    requested_start_date DATE,
    actual_start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'in_progress', 'review', 'completed', 'deferred'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONTRACTS & AGREEMENTS
-- ============================================================================

CREATE TABLE contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    contract_type VARCHAR(100), -- 'tos', 'privacy_policy', 'contribution_agreement', 'api_license', 'employment'
    
    description TEXT,
    purpose TEXT,
    
    -- Template characteristics
    jurisdiction VARCHAR(100),
    applicable_law VARCHAR(100),
    
    -- Content structure
    sections JSONB, -- [{title: 'Definitions', required: true}, ...]
    key_clauses TEXT ARRAY,
    
    -- Cost
    template_cost_low DECIMAL(8,2),
    template_cost_mid DECIMAL(8,2),
    template_cost_high DECIMAL(8,2),
    customization_hours_estimate INTEGER,
    
    -- Usage
    first_milestone_needed INTEGER,
    review_frequency_months INTEGER,
    last_reviewed_date DATE,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contract_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES contract_templates(id),
    version_number INTEGER NOT NULL,
    
    -- Content
    content_hash VARCHAR(64), -- SHA-256 hash of contract text
    effective_date DATE,
    deprecated_date DATE,
    
    -- Changes
    change_summary TEXT,
    changes_from_previous TEXT ARRAY,
    
    -- Approval
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PRIVACY & DATA GOVERNANCE
-- ============================================================================

CREATE TABLE data_governance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    policy_type VARCHAR(50), -- 'privacy', 'data_retention', 'consent', 'breach_response', 'international_transfer'
    
    description TEXT,
    scope TEXT, -- What data/subjects this applies to
    
    -- Requirements
    legal_basis_required VARCHAR(100) ARRAY, -- 'consent', 'contract', 'legitimate_interest', etc.
    retention_period_days INTEGER,
    deletion_procedure TEXT,
    
    -- User rights
    user_rights_supported VARCHAR(100) ARRAY, -- 'access', 'deletion', 'portability', 'correction'
    
    -- Technical measures
    encryption_required BOOLEAN DEFAULT false,
    pseudonymization_required BOOLEAN DEFAULT false,
    audit_logging_required BOOLEAN DEFAULT false,
    
    -- Compliance mapping
    applicable_frameworks UUID ARRAY REFERENCES compliance_frameworks(id),
    
    first_milestone_id INTEGER,
    review_frequency_months INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consent_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_type VARCHAR(100) NOT NULL, -- 'data_processing', 'marketing', 'third_party_sharing', 'model_training'
    
    -- Consent flow
    consent_mechanism VARCHAR(50), -- 'opt_in', 'opt_out', 'explicit', 'implied'
    granularity_level VARCHAR(50), -- 'binary', 'category', 'item_level'
    
    -- UI/UX
    consent_form_version INTEGER,
    consent_text_hash VARCHAR(64),
    
    -- Record keeping
    record_required_fields JSONB, -- {timestamp: true, ip_address: false, user_agent: true}
    retention_period_days INTEGER,
    
    -- Withdrawal
    withdrawal_procedure TEXT,
    withdrawal_effect TEXT, -- What happens when user withdraws consent
    
    applicable_framework_id UUID REFERENCES compliance_frameworks(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RISK MANAGEMENT
-- ============================================================================

CREATE TABLE risk_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Risk characteristics
    risk_domain VARCHAR(50), -- 'legal', 'regulatory', 'technical', 'financial', 'operational', 'reputational'
    inherent_likelihood INTEGER CHECK (inherent_likelihood BETWEEN 1 AND 5),
    inherent_impact INTEGER CHECK (inherent_impact BETWEEN 1 AND 5),
    inherent_risk_score INTEGER GENERATED ALWAYS AS (inherent_likelihood * inherent_impact) STORED,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE risk_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Categorization
    category_id UUID REFERENCES risk_categories(id),
    milestone_id INTEGER,
    
    -- Assessment
    likelihood INTEGER CHECK (likelihood BETWEEN 1 AND 5),
    impact INTEGER CHECK (impact BETWEEN 1 AND 5),
    risk_score INTEGER GENERATED ALWAYS AS (likelihood * impact) STORED,
    risk_level VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN likelihood * impact >= 15 THEN 'critical'
            WHEN likelihood * impact >= 10 THEN 'high'
            WHEN likelihood * impact >= 5 THEN 'medium'
            ELSE 'low'
        END
    ) STORED,
    
    -- Mitigation
    mitigation_measures TEXT ARRAY,
    residual_likelihood INTEGER,
    residual_impact INTEGER,
    residual_risk_score INTEGER GENERATED ALWAYS AS (COALESCE(residual_likelihood, likelihood) * COALESCE(residual_impact, impact)) STORED,
    
    -- Ownership
    risk_owner VARCHAR(100),
    review_frequency_months INTEGER,
    next_review_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'mitigated', 'accepted', 'transferred', 'closed'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INTELLECTUAL PROPERTY
-- ============================================================================

CREATE TABLE ip_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(50), -- 'software', 'model', 'data', 'trademark', 'patent', 'trade_secret'
    
    description TEXT,
    creation_date DATE,
    
    -- Ownership
    owner_entity VARCHAR(100),
    creator_ids UUID ARRAY, -- Reference to creators/contributors
    
    -- Protection
    protection_status VARCHAR(50), -- 'unprotected', 'pending', 'registered', 'trade_secret'
    registration_number VARCHAR(100),
    registration_jurisdiction VARCHAR(100),
    
    -- Value
    estimated_value DECIMAL(12,2),
    valuation_method VARCHAR(100),
    
    -- Licensing
    licensing_model VARCHAR(50), -- 'proprietary', 'open_source', 'dual', 'enterprise'
    license_terms TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BUDGET & COST TRACKING
-- ============================================================================

CREATE TABLE legal_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    budget_type VARCHAR(50), -- 'milestone', 'annual', 'project', 'retainer'
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    milestone_id INTEGER,
    
    -- Budget allocation
    contract_costs DECIMAL(10,2),
    compliance_costs DECIMAL(10,2),
    litigation_costs DECIMAL(10,2),
    ip_costs DECIMAL(10,2),
    regulatory_costs DECIMAL(10,2),
    employment_costs DECIMAL(10,2),
    other_costs DECIMAL(10,2),
    
    total_budget DECIMAL(10,2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Tracking
    actual_spend DECIMAL(10,2),
    committed_spend DECIMAL(10,2), -- Approved but not yet invoiced
    remaining_budget DECIMAL(10,2),
    variance_percentage DECIMAL(5,2),
    
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE legal_cost_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES legal_budgets(id),
    project_id UUID REFERENCES legal_projects(id),
    
    -- Cost details
    cost_category VARCHAR(50), -- 'counsel_fees', 'filing_fees', 'audit_costs', 'consulting'
    vendor VARCHAR(200),
    description TEXT,
    
    amount DECIMAL(10,2),
    currency_code VARCHAR(3) DEFAULT 'EUR',
    invoice_date DATE,
    payment_date DATE,
    
    -- Attribution
    milestone_id INTEGER,
    hours_billed DECIMAL(5,2),
    attorney_name VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

CREATE VIEW v_legal_cost_by_milestone AS
SELECT 
    m.id as milestone_id,
    m.name as milestone_name,
    lb.total_budget,
    lb.actual_spend,
    lb.remaining_budget,
    lb.variance_percentage,
    (SELECT SUM(amount) FROM legal_cost_tracking lct WHERE lct.milestone_id = m.id) as tracked_spend
FROM milestones m
LEFT JOIN legal_budgets lb ON m.id = lb.milestone_id
ORDER BY m.id;

CREATE VIEW v_compliance_status AS
SELECT 
    cf.code as framework_code,
    cf.name as framework_name,
    cf.jurisdiction,
    cf.priority_level,
    cm.milestone_id,
    m.name as milestone_name,
    cm.compliance_target,
    cm.status,
    cm.completed_at,
    (cm.internal_cost_estimate + cm.external_cost_estimate + cm.audit_cost_estimate) as total_estimated_cost
FROM compliance_frameworks cf
LEFT JOIN compliance_milestones cm ON cf.id = cm.framework_id
LEFT JOIN milestones m ON cm.milestone_id = m.id
WHERE cf.is_active = true
ORDER BY cf.priority_level DESC, cm.milestone_id;

CREATE VIEW v_risk_dashboard AS
SELECT 
    rr.risk_code,
    rr.title,
    rc.name as category,
    rc.risk_domain,
    rr.likelihood,
    rr.impact,
    rr.risk_score,
    rr.risk_level,
    rr.residual_risk_score,
    rr.risk_owner,
    rr.status,
    rr.next_review_date,
    m.name as milestone
FROM risk_register rr
LEFT JOIN risk_categories rc ON rr.category_id = rc.id
LEFT JOIN milestones m ON rr.milestone_id = m.id
WHERE rr.status != 'closed'
ORDER BY rr.risk_score DESC;

CREATE VIEW v_legal_project_status AS
SELECT 
    lp.project_code,
    lp.name,
    lsc.name as category,
    lp.priority,
    lp.counsel_firm,
    lp.engagement_type,
    lp.budget_mid,
    lp.status,
    lp.target_completion_date,
    lp.actual_completion_date,
    CASE 
        WHEN lp.actual_completion_date IS NOT NULL THEN 'completed'
        WHEN lp.target_completion_date < CURRENT_DATE THEN 'overdue'
        WHEN lp.target_completion_date < CURRENT_DATE + INTERVAL '14 days' THEN 'due_soon'
        ELSE 'on_track'
    END as timeline_status
FROM legal_projects lp
LEFT JOIN legal_service_categories lsc ON lp.category_id = lsc.id
ORDER BY lp.priority, lp.target_completion_date;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_compliance_frameworks_active ON compliance_frameworks(is_active) WHERE is_active = true;
CREATE INDEX idx_compliance_milestones_framework ON compliance_milestones(framework_id);
CREATE INDEX idx_compliance_milestones_milestone ON compliance_milestones(milestone_id);
CREATE INDEX idx_legal_projects_category ON legal_projects(category_id);
CREATE INDEX idx_legal_projects_milestone ON legal_projects(milestone_id);
CREATE INDEX idx_legal_projects_status ON legal_projects(status);
CREATE INDEX idx_contract_versions_template ON contract_versions(template_id);
CREATE INDEX idx_risk_register_category ON risk_register(category_id);
CREATE INDEX idx_risk_register_score ON risk_register(risk_score);
CREATE INDEX idx_legal_costs_budget ON legal_cost_tracking(budget_id);
CREATE INDEX idx_legal_costs_milestone ON legal_cost_tracking(milestone_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE compliance_frameworks IS 'Regulatory frameworks and standards (GDPR, SOC2, etc.)';
COMMENT ON TABLE legal_service_categories IS 'Categories of legal work with typical effort estimates';
COMMENT ON TABLE legal_projects IS 'Specific legal engagements and their budgets';
COMMENT ON TABLE contract_templates IS 'Standard contract templates with versioning';
COMMENT ON TABLE risk_register IS 'Active risks with scoring and mitigation tracking';
COMMENT ON VIEW v_risk_dashboard IS 'Consolidated view of all active risks sorted by severity';
