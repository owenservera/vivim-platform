-- VIVIM Digital Twin Cost Database Schema
-- Module: TOOLS (Infrastructure, Services, Cloud Providers)
-- Generated from VIVIM Infrastructure Costs research
-- Version: 1.0.0

-- ============================================================================
-- CORE TABLES: CLOUD PROVIDERS & SERVICES
-- ============================================================================

CREATE TABLE cloud_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'hetzner', 'aws', 'ovh', 'exoscale'
    name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    headquarters_location VARCHAR(100),
    tier VARCHAR(50), -- 'budget', 'mid_range', 'enterprise', 'hyperscaler'
    
    -- Compliance & Data Residency
    gdpr_compliant BOOLEAN DEFAULT true,
    data_center_regions JSONB, -- Array of regions with locations
    certifications VARCHAR(100) ARRAY, -- 'ISO27001', 'SOC2', 'BSI', etc.
    
    -- Service Coverage
    offers_compute BOOLEAN DEFAULT false,
    offers_storage BOOLEAN DEFAULT false,
    offers_database BOOLEAN DEFAULT false,
    offers_cdn BOOLEAN DEFAULT false,
    offers_managed_kubernetes BOOLEAN DEFAULT false,
    offers_serverless BOOLEAN DEFAULT false,
    offers_gpu BOOLEAN DEFAULT false,
    
    -- Pricing Characteristics
    pricing_model VARCHAR(50), -- 'pay_per_use', 'reserved', 'spot', 'hybrid'
    billing_currency VARCHAR(3) DEFAULT 'EUR',
    free_tier_available BOOLEAN DEFAULT false,
    free_tier_details JSONB,
    
    -- Support & SLA
    support_channels VARCHAR(50) ARRAY, -- 'email', 'phone', 'chat', 'ticket'
    sla_uptime_percentage DECIMAL(5,2),
    sla_compensation_policy TEXT,
    
    -- Ratings
    reliability_score INTEGER CHECK (reliability_score BETWEEN 1 AND 10),
    performance_score INTEGER CHECK (performance_score BETWEEN 1 AND 10),
    support_quality_score INTEGER CHECK (support_quality_score BETWEEN 1 AND 10),
    cost_effectiveness_score INTEGER CHECK (cost_effectiveness_score BETWEEN 1 AND 10),
    
    website_url TEXT,
    api_documentation_url TEXT,
    pricing_page_url TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    service_type VARCHAR(50), -- 'compute', 'storage', 'database', 'network', 'ml', 'monitoring', 'security'
    typical_use_cases TEXT ARRAY,
    scaling_characteristics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    provider_id UUID NOT NULL REFERENCES cloud_providers(id),
    category_id UUID NOT NULL REFERENCES service_categories(id),
    
    description TEXT,
    service_tier VARCHAR(50), -- 'starter', 'standard', 'pro', 'enterprise'
    
    -- Specifications
    specifications JSONB, -- Flexible specs based on service type
    -- For compute: {vcpus: 2, ram_gb: 4, storage_gb: 80, storage_type: 'ssd'}
    -- For database: {engine: 'postgresql', version: '15', max_connections: 100}
    -- For storage: {type: 'object', redundancy: 'triple', durability: '99.999999999%'}
    
    -- Features & Limits
    features TEXT ARRAY,
    limits JSONB, -- {storage_max_tb: 10, bandwidth_max_gbps: 1, requests_per_second: 1000}
    
    -- Region availability
    available_regions VARCHAR(50) ARRAY,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PRICING TABLES: DETAILED COST STRUCTURES
-- ============================================================================

CREATE TABLE service_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL, -- 'free', 'starter', 'standard', 'pro', 'enterprise'
    
    -- Price structure
    pricing_model VARCHAR(50) NOT NULL, -- 'flat_rate', 'usage_based', 'tiered', 'hybrid'
    base_price_monthly DECIMAL(10,2),
    base_price_hourly DECIMAL(8,4),
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Usage-based pricing components
    unit_of_measure VARCHAR(50), -- 'gb', 'hour', 'request', 'token', 'gb_second'
    unit_price DECIMAL(10,6),
    free_allowance DECIMAL(10,2), -- Free tier quantity
    
    -- Tiered pricing
    tier_thresholds JSONB, -- [{limit: 1000, price: 0.01}, {limit: 10000, price: 0.008}]
    
    -- Commitment discounts
    reserved_1_year_discount DECIMAL(5,2), -- Percentage
    reserved_3_year_discount DECIMAL(5,2),
    spot_discount DECIMAL(5,2),
    
    minimum_commitment DECIMAL(10,2),
    overage_rate DECIMAL(10,6),
    
    -- Geographic pricing variations
    region_pricing_multiplier JSONB, -- {eu_central: 1.0, eu_west: 1.1}
    
    effective_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT true,
    data_source VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE infrastructure_cost_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Scale parameters
    user_scale_min INTEGER NOT NULL,
    user_scale_max INTEGER,
    
    -- Architecture assumptions
    architecture_type VARCHAR(50), -- 'monolith', 'microservices', 'serverless', 'hybrid'
    data_residency_requirement VARCHAR(50), -- 'eu', 'gdpr', 'specific_country'
    byok_model BOOLEAN DEFAULT true, -- Users pay own LLM API keys
    
    -- Component specifications
    compute_spec JSONB, -- {instance_count: 10, instance_type: 'cx42', provider: 'hetzner'}
    database_spec JSONB, -- {primary: 'postgresql', replicas: 3, provider: 'exoscale'}
    caching_spec JSONB, -- {type: 'redis', memory_gb: 16, provider: 'exoscale'}
    storage_spec JSONB, -- {object_storage_gb: 2048, backup_storage_gb: 4096}
    cdn_spec JSONB, -- {provider: 'cloudflare', tier: 'enterprise'}
    monitoring_spec JSONB, -- {provider: 'datadog', tier: 'enterprise'}
    
    -- Cost breakdown
    compute_cost_monthly DECIMAL(10,2),
    database_cost_monthly DECIMAL(10,2),
    storage_cost_monthly DECIMAL(10,2),
    network_cost_monthly DECIMAL(10,2),
    security_cost_monthly DECIMAL(10,2),
    monitoring_cost_monthly DECIMAL(10,2),
    ml_training_cost_monthly DECIMAL(10,2),
    ml_inference_cost_monthly DECIMAL(10,2),
    support_cost_monthly DECIMAL(10,2),
    other_cost_monthly DECIMAL(10,2),
    
    total_cost_monthly DECIMAL(10,2) NOT NULL,
    cost_per_user_monthly DECIMAL(8,4),
    
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Scaling factors
    marginal_cost_per_1000_users DECIMAL(8,4),
    economies_of_scale_factor DECIMAL(4,2), -- Cost multiplier as scale increases
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USER SCALE & COST TRAJECTORY TABLES
-- ============================================================================

CREATE TABLE user_scale_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scale_name VARCHAR(50) NOT NULL, -- 'mvp', 'alpha', 'beta', 'launch', 'growth', 'pmf', 'scaling', 'enterprise'
    user_count INTEGER NOT NULL,
    
    -- Phase characteristics
    phase_description TEXT,
    typical_duration_months INTEGER,
    primary_focus VARCHAR(100), -- 'development', 'validation', 'growth', 'optimization', 'monetization'
    
    -- Infrastructure triggers
    infrastructure_trigger TEXT, -- What necessitates this scale level
    required_redundancy VARCHAR(50), -- 'none', 'single', 'multi_az', 'multi_region'
    required_monitoring_tier VARCHAR(50),
    required_support_tier VARCHAR(50),
    
    -- Cost characteristics at this scale
    fixed_costs_percentage DECIMAL(5,2), -- What % of costs are fixed vs variable
    variable_cost_per_user DECIMAL(8,4),
    
    -- Milestone mapping
    milestone_id INTEGER,
    milestone_name VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cost_per_user_trajectories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_scale_id UUID NOT NULL REFERENCES user_scale_thresholds(id),
    
    -- Cost components per user
    compute_cpu DECIMAL(8,6),
    memory_gb DECIMAL(8,6),
    storage_gb DECIMAL(8,6),
    bandwidth_gb DECIMAL(8,6),
    database_ops DECIMAL(8,6),
    api_calls INTEGER,
    
    -- Derived costs
    infrastructure_cost_per_user DECIMAL(8,4),
    database_cost_per_user DECIMAL(8,4),
    storage_cost_per_user DECIMAL(8,4),
    bandwidth_cost_per_user DECIMAL(8,4),
    
    total_cost_per_user DECIMAL(8,4) NOT NULL,
    
    -- Assumptions
    assumptions JSONB,
    -- {active_sessions_per_day: 8, storage_per_user_mb: 100, api_calls_per_day: 200}
    
    effective_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- THIRD-PARTY SERVICES & API COSTS
-- ============================================================================

CREATE TABLE third_party_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    vendor VARCHAR(100),
    service_category VARCHAR(50), -- 'auth', 'email', 'payments', 'monitoring', 'llm', 'vector_db', 'cdn'
    
    description TEXT,
    use_case VARCHAR(200),
    integration_complexity VARCHAR(20), -- 'low', 'medium', 'high'
    
    -- Pricing
    pricing_model VARCHAR(50), -- 'free_tier', 'usage_based', 'per_seat', 'hybrid'
    free_tier_limits JSONB,
    base_price_monthly DECIMAL(10,2),
    
    -- Usage-based pricing
    unit_of_measure VARCHAR(50),
    unit_price DECIMAL(10,6),
    volume_discount_tiers JSONB,
    
    -- Milestone relevance
    first_milestone_needed INTEGER,
    typical_monthly_usage JSONB, -- {mau: 10000, api_calls: 50000}
    
    is_essential BOOLEAN DEFAULT false,
    alternatives UUID ARRAY REFERENCES third_party_services(id),
    
    website_url TEXT,
    api_documentation_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE llm_api_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'google', 'mistral'
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    
    -- Model characteristics
    context_window_tokens INTEGER,
    max_output_tokens INTEGER,
    supports_vision BOOLEAN DEFAULT false,
    supports_functions BOOLEAN DEFAULT false,
    supports_json_mode BOOLEAN DEFAULT false,
    
    -- Pricing (per 1M tokens)
    input_price_per_1m DECIMAL(8,4),
    output_price_per_1m DECIMAL(8,4),
    cached_input_price_per_1m DECIMAL(8,4),
    
    -- Batch pricing (if different)
    batch_discount_percentage DECIMAL(5,2),
    
    -- Fine-tuning (if applicable)
    training_price_per_1m DECIMAL(8,4),
    inference_price_per_1m DECIMAL(8,4),
    
    currency_code VARCHAR(3) DEFAULT 'USD',
    effective_date DATE,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(provider, model_name, effective_date)
);

CREATE TABLE embedding_api_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    dimensions INTEGER,
    
    -- Pricing (per 1M tokens)
    price_per_1m_tokens DECIMAL(8,4),
    
    -- Characteristics
    max_input_tokens INTEGER,
    supports_batching BOOLEAN DEFAULT true,
    typical_latency_ms INTEGER,
    
    currency_code VARCHAR(3) DEFAULT 'USD',
    effective_date DATE,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ML/TRAINING INFRASTRUCTURE COSTS
-- ============================================================================

CREATE TABLE ml_compute_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    provider_id UUID REFERENCES cloud_providers(id),
    
    -- Hardware specs
    gpu_type VARCHAR(50), -- 'H100', 'A100', 'L4', 'T4'
    gpu_count INTEGER,
    vcpu_count INTEGER,
    memory_gb INTEGER,
    storage_type VARCHAR(50), -- 'ssd', 'nvme', 'local_ssd'
    storage_gb INTEGER,
    network_gbps DECIMAL(4,2),
    
    -- Performance
    tflops_fp32 DECIMAL(8,2),
    tflops_fp16 DECIMAL(8,2),
    tflops_bf16 DECIMAL(8,2),
    tflops_int8 DECIMAL(8,2),
    
    -- Pricing
    price_per_hour_on_demand DECIMAL(8,4),
    price_per_hour_spot DECIMAL(8,4),
    price_per_hour_reserved_1yr DECIMAL(8,4),
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Availability
    available_regions VARCHAR(50) ARRAY,
    is_available BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ml_training_cost_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_type VARCHAR(50) NOT NULL, -- 'full_fine_tuning', 'lora', 'qlora', 'pretraining'
    base_model_name VARCHAR(100) NOT NULL,
    base_model_size VARCHAR(50), -- '7b', '13b', '70b', etc.
    
    -- Dataset
    dataset_size_tokens INTEGER, -- in billions
    dataset_size_gb DECIMAL(8,2),
    
    -- Training configuration
    epochs INTEGER,
    batch_size INTEGER,
    learning_rate DECIMAL(8,6),
    
    -- Compute requirements
    gpu_instance_id UUID REFERENCES ml_compute_instances(id),
    gpu_hours_required DECIMAL(8,2),
    parallel_gpu_count INTEGER,
    
    -- Cost estimates
    compute_cost_low DECIMAL(10,2),
    compute_cost_mid DECIMAL(10,2),
    compute_cost_high DECIMAL(10,2),
    storage_cost DECIMAL(10,2),
    data_transfer_cost DECIMAL(10,2),
    total_cost_low DECIMAL(10,2),
    total_cost_mid DECIMAL(10,2),
    total_cost_high DECIMAL(10,2),
    
    -- Time estimates
    estimated_duration_hours DECIMAL(6,2),
    
    currency_code VARCHAR(3) DEFAULT 'EUR',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BUDGET & ALLOCATION TABLES
-- ============================================================================

CREATE TABLE infrastructure_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    budget_type VARCHAR(50), -- 'milestone', 'phase', 'monthly', 'annual'
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    milestone_id INTEGER,
    
    -- Budget by category
    compute_budget DECIMAL(12,2),
    storage_budget DECIMAL(12,2),
    database_budget DECIMAL(12,2),
    network_budget DECIMAL(12,2),
    security_budget DECIMAL(12,2),
    monitoring_budget DECIMAL(12,2),
    third_party_budget DECIMAL(12,2),
    ml_training_budget DECIMAL(12,2),
    ml_inference_budget DECIMAL(12,2),
    
    total_budget DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Actuals tracking
    actual_spend DECIMAL(12,2),
    forecast_spend DECIMAL(12,2),
    variance_amount DECIMAL(12,2),
    variance_percentage DECIMAL(5,2),
    
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES infrastructure_budgets(id),
    service_id UUID NOT NULL REFERENCES services(id),
    
    allocated_amount DECIMAL(12,2),
    usage_estimate JSONB, -- {instance_count: 5, hours_per_month: 720}
    
    actual_spend DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

CREATE VIEW v_infrastructure_cost_summary AS
SELECT 
    icm.id,
    icm.model_code,
    icm.name,
    icm.user_scale_min,
    icm.user_scale_max,
    icm.total_cost_monthly,
    icm.cost_per_user_monthly,
    icm.compute_cost_monthly,
    icm.database_cost_monthly,
    icm.storage_cost_monthly,
    icm.network_cost_monthly,
    icm.security_cost_monthly,
    icm.monitoring_cost_monthly,
    icm.ml_training_cost_monthly,
    icm.ml_inference_cost_monthly,
    (icm.compute_cost_monthly / NULLIF(icm.total_cost_monthly, 0) * 100) as compute_pct,
    (icm.database_cost_monthly / NULLIF(icm.total_cost_monthly, 0) * 100) as database_pct,
    (icm.storage_cost_monthly / NULLIF(icm.total_cost_monthly, 0) * 100) as storage_pct
FROM infrastructure_cost_models icm
WHERE icm.is_active = true;

CREATE VIEW v_cost_per_user_trajectory AS
SELECT 
    ust.scale_name,
    ust.user_count,
    cput.total_cost_per_user,
    cput.infrastructure_cost_per_user,
    cput.database_cost_per_user,
    cput.storage_cost_per_user,
    cput.bandwidth_cost_per_user,
    cput.assumptions,
    ust.milestone_name
FROM user_scale_thresholds ust
LEFT JOIN cost_per_user_trajectories cput ON ust.id = cput.user_scale_id
ORDER BY ust.user_count;

CREATE VIEW v_cloud_provider_comparison AS
SELECT 
    cp.name as provider_name,
    cp.tier,
    cp.gdpr_compliant,
    COUNT(DISTINCT s.id) as service_count,
    cp.cost_effectiveness_score,
    cp.reliability_score,
    cp.support_quality_score,
    cp.sla_uptime_percentage
FROM cloud_providers cp
LEFT JOIN services s ON cp.id = s.provider_id AND s.is_active = true
WHERE cp.is_active = true
GROUP BY cp.id, cp.name, cp.tier, cp.gdpr_compliant, 
         cp.cost_effectiveness_score, cp.reliability_score, 
         cp.support_quality_score, cp.sla_uptime_percentage;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_cloud_providers_tier ON cloud_providers(tier);
CREATE INDEX idx_cloud_providers_active ON cloud_providers(is_active) WHERE is_active = true;
CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_service_pricing_service ON service_pricing_tiers(service_id);
CREATE INDEX idx_service_pricing_current ON service_pricing_tiers(is_current) WHERE is_current = true;
CREATE INDEX idx_infrastructure_costs_scale ON infrastructure_cost_models(user_scale_min, user_scale_max);
CREATE INDEX idx_llm_costs_provider_model ON llm_api_costs(provider, model_name);
CREATE INDEX idx_ml_instances_provider ON ml_compute_instances(provider_id);
CREATE INDEX idx_ml_training_costs_model ON ml_training_cost_estimates(base_model_name);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE cloud_providers IS 'Cloud infrastructure providers with compliance and capability data';
COMMENT ON TABLE services IS 'Individual cloud services (compute, storage, database, etc.)';
COMMENT ON TABLE infrastructure_cost_models IS 'Complete infrastructure cost models at different user scales';
COMMENT ON TABLE user_scale_thresholds IS 'Key user count milestones with infrastructure requirements';
COMMENT ON TABLE llm_api_costs IS 'LLM API pricing from various providers (OpenAI, Anthropic, etc.)';
COMMENT ON TABLE ml_training_cost_estimates IS 'Estimated costs for training/fine-tuning ML models';
