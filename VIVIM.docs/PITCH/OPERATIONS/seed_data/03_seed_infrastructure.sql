-- VIVIM Digital Twin Cost Database
-- Seed Data: Infrastructure Costs & Cloud Providers
-- Source: VIVIM-Infrastructure-Costs-EU-User-Scale.md
-- Version: 1.0.0

-- ============================================================================
-- CLOUD PROVIDERS
-- ============================================================================

INSERT INTO cloud_providers (
    code, name, company, headquarters_location, tier,
    gdpr_compliant, data_center_regions, certifications,
    offers_compute, offers_storage, offers_database, offers_cdn, 
    offers_managed_kubernetes, offers_serverless, offers_gpu,
    pricing_model, billing_currency, free_tier_available,
    support_channels, sla_uptime_percentage,
    reliability_score, performance_score, support_quality_score, cost_effectiveness_score,
    website_url, is_active
) VALUES
('hetzner', 'Hetzner Cloud', 'Hetzner Online GmbH', 'Germany', 'budget',
 true, '{"regions": [{"name": "Nuremberg", "country": "DE"}, {"name": "Falkenstein", "country": "DE"}, {"name": "Helsinki", "country": "FI"}]}',
 ARRAY['ISO27001'],
 true, true, true, false, true, false, false,
 'pay_per_use', 'EUR', false,
 ARRAY['email', 'ticket'], 99.95,
 9, 8, 7, 10,
 'https://www.hetzner.com/cloud', true),

('ovh', 'OVHcloud', 'OVH Group', 'France', 'budget',
 true, '{"regions": [{"name": "Roubaix", "country": "FR"}, {"name": "Paris", "country": "FR"}, {"name": "Strasbourg", "country": "FR"}, {"name": "Frankfurt", "country": "DE"}, {"name": "London", "country": "UK"}]}',
 ARRAY['ISO27001', 'HIPAA'],
 true, true, true, true, true, true, true,
 'pay_per_use', 'EUR', true,
 ARRAY['email', 'phone', 'ticket'], 99.95,
 8, 8, 8, 9,
 'https://www.ovhcloud.com', true),

('exoscale', 'Exoscale', 'A1 Digital', 'Switzerland', 'mid_range',
 true, '{"regions": [{"name": "Zurich", "country": "CH"}, {"name": "Vienna", "country": "AT"}]}',
 ARRAY['ISO27001', 'GDPR'],
 true, true, true, true, true, false, false,
 'pay_per_use', 'EUR', false,
 ARRAY['email', 'phone', 'ticket'], 99.99,
 9, 9, 9, 8,
 'https://www.exoscale.com', true),

('aws-eu', 'AWS EU (Frankfurt)', 'Amazon Web Services', 'USA', 'hyperscaler',
 true, '{"regions": [{"name": "Frankfurt", "country": "DE", "code": "eu-central-1"}, {"name": "Ireland", "country": "IE", "code": "eu-west-1"}, {"name": "London", "country": "UK", "code": "eu-west-2"}, {"name": "Paris", "country": "FR", "code": "eu-west-3"}, {"name": "Stockholm", "country": "SE", "code": "eu-north-1"}]}',
 ARRAY['ISO27001', 'SOC2', 'PCI DSS', 'HIPAA'],
 true, true, true, true, true, true, true,
 'hybrid', 'EUR', true,
 ARRAY['email', 'phone', 'chat', 'ticket'], 99.99,
 10, 10, 9, 6,
 'https://aws.amazon.com', true),

('cloudflare', 'Cloudflare', 'Cloudflare, Inc.', 'USA', 'enterprise',
 true, '{"regions": [{"name": "Global", "network": "200+ cities"}]}',
 ARRAY['ISO27001', 'SOC2', 'PCI DSS'],
 false, false, false, true, false, true, false,
 'usage_based', 'EUR', true,
 ARRAY['email', 'ticket'], 100.00,
 10, 10, 9, 8,
 'https://www.cloudflare.com', true),

('pinecone', 'Pinecone', 'Pinecone Systems, Inc.', 'USA', 'specialized',
 true, '{"regions": [{"name": "AWS", "provider": "aws"}, {"name": "GCP", "provider": "gcp"}]}',
 ARRAY['SOC2'],
 false, true, false, false, false, true, false,
 'usage_based', 'USD', true,
 ARRAY['email', 'ticket'], 99.90,
 9, 10, 8, 7,
 'https://www.pinecone.io', true);

-- ============================================================================
-- SERVICE CATEGORIES
-- ============================================================================

INSERT INTO service_categories (code, name, description, service_type, typical_use_cases) VALUES
('compute-vm', 'Virtual Machines', 'Virtual server instances', 'compute', ARRAY['Application hosting', 'Development environments', 'Background workers']),
('compute-k8s', 'Kubernetes', 'Managed Kubernetes clusters', 'compute', ARRAY['Container orchestration', 'Microservices', 'Auto-scaling']),
('database-sql', 'SQL Databases', 'Managed relational databases', 'database', ARRAY['Application data', 'User data', 'Transactional data']),
('database-vector', 'Vector Databases', 'Vector search and embeddings', 'database', ARRAY['Semantic search', 'RAG systems', 'Similarity matching']),
('database-cache', 'Caching', 'In-memory data stores', 'database', ARRAY['Session storage', 'Rate limiting', 'Query caching']),
('storage-object', 'Object Storage', 'S3-compatible object storage', 'storage', ARRAY['File storage', 'Backups', 'Static assets']),
('storage-block', 'Block Storage', 'Persistent block volumes', 'storage', ARRAY['Database storage', 'Application storage']),
('network-cdn', 'CDN', 'Content delivery network', 'network', ARRAY['Static asset delivery', 'DDoS protection', 'Global acceleration']),
('network-waf', 'WAF', 'Web application firewall', 'security', ARRAY['Attack protection', 'Bot management', 'Rate limiting']),
('ml-gpu', 'GPU Instances', 'GPU compute for ML', 'ml', ARRAY['Model training', 'Fine-tuning', 'Inference']),
('monitoring-metrics', 'Monitoring', 'Metrics and observability', 'monitoring', ARRAY['Performance monitoring', 'Alerting', 'Dashboards']),
('monitoring-logs', 'Log Management', 'Log aggregation and analysis', 'monitoring', ARRAY['Application logs', 'Audit logs', 'Debugging']),
('email-service', 'Email', 'Transactional email service', 'communication', ARRAY['User notifications', 'Password resets', 'Marketing']);

-- ============================================================================
-- SERVICES
-- ============================================================================

-- Hetzner Compute
INSERT INTO services (code, name, provider_id, category_id, description, service_tier, specifications, features, available_regions)
SELECT 
    'hetzner-cx22', 'Cloud VPS CX22',
    cp.id, sc.id,
    'Entry-level VPS: 2 vCPU, 4GB RAM, 40GB SSD',
    'starter',
    '{"vcpus": 2, "ram_gb": 4, "storage_gb": 40, "storage_type": "ssd"}',
    ARRAY['IPv4', 'IPv6', 'VNC Console', 'Rescue System'],
    ARRAY['de-nbg', 'de-fsn', 'fi-hel']
FROM cloud_providers cp, service_categories sc
WHERE cp.code = 'hetzner' AND sc.code = 'compute-vm';

INSERT INTO services (code, name, provider_id, category_id, description, service_tier, specifications, features, available_regions)
SELECT 
    'hetzner-cx32', 'Cloud VPS CX32',
    cp.id, sc.id,
    'Mid-tier VPS: 4 vCPU, 8GB RAM, 80GB SSD',
    'standard',
    '{"vcpus": 4, "ram_gb": 8, "storage_gb": 80, "storage_type": "ssd"}',
    ARRAY['IPv4', 'IPv6', 'VNC Console', 'Rescue System'],
    ARRAY['de-nbg', 'de-fsn', 'fi-hel']
FROM cloud_providers cp, service_categories sc
WHERE cp.code = 'hetzner' AND sc.code = 'compute-vm';

INSERT INTO services (code, name, provider_id, category_id, description, service_tier, specifications, features, available_regions)
SELECT 
    'hetzner-cx42', 'Cloud VPS CX42',
    cp.id, sc.id,
    'High-tier VPS: 8 vCPU, 16GB RAM, 160GB SSD',
    'pro',
    '{"vcpus": 8, "ram_gb": 16, "storage_gb": 160, "storage_type": "ssd"}',
    ARRAY['IPv4', 'IPv6', 'VNC Console', 'Rescue System'],
    ARRAY['de-nbg', 'de-fsn', 'fi-hel']
FROM cloud_providers cp, service_categories sc
WHERE cp.code = 'hetzner' AND sc.code = 'compute-vm';

-- Hetzner Managed Database
INSERT INTO services (code, name, provider_id, category_id, description, service_tier, specifications, features, available_regions)
SELECT 
    'hetzner-db-small', 'Managed PostgreSQL Small',
    cp.id, sc.id,
    'Managed PostgreSQL: 2 vCPU, 4GB RAM',
    'starter',
    '{"engine": "postgresql", "version": "15", "vcpus": 2, "ram_gb": 4, "max_connections": 100}',
    ARRAY['Automated backups', 'Monitoring', 'High availability'],
    ARRAY['de-nbg', 'de-fsn']
FROM cloud_providers cp, service_categories sc
WHERE cp.code = 'hetzner' AND sc.code = 'database-sql';

-- ============================================================================
-- SERVICE PRICING TIERS
-- ============================================================================

INSERT INTO service_pricing_tiers (
    service_id, tier_name, pricing_model, base_price_monthly, base_price_hourly,
    unit_of_measure, unit_price, free_allowance, currency_code,
    effective_date, is_current, data_source
)
SELECT 
    s.id, 'standard', 'flat_rate', 3.79, 0.0052,
    'hour', 0.0052, 0, 'EUR',
    '2025-01-01', true, 'Hetzner Pricing 2025'
FROM services s
WHERE s.code = 'hetzner-cx22';

INSERT INTO service_pricing_tiers (
    service_id, tier_name, pricing_model, base_price_monthly, base_price_hourly,
    unit_of_measure, unit_price, free_allowance, currency_code,
    effective_date, is_current, data_source
)
SELECT 
    s.id, 'standard', 'flat_rate', 7.58, 0.0104,
    'hour', 0.0104, 0, 'EUR',
    '2025-01-01', true, 'Hetzner Pricing 2025'
FROM services s
WHERE s.code = 'hetzner-cx32';

INSERT INTO service_pricing_tiers (
    service_id, tier_name, pricing_model, base_price_monthly, base_price_hourly,
    unit_of_measure, unit_price, free_allowance, currency_code,
    effective_date, is_current, data_source
)
SELECT 
    s.id, 'standard', 'flat_rate', 15.17, 0.0208,
    'hour', 0.0208, 0, 'EUR',
    '2025-01-01', true, 'Hetzner Pricing 2025'
FROM services s
WHERE s.code = 'hetzner-cx42';

-- ============================================================================
-- INFRASTRUCTURE COST MODELS BY USER SCALE
-- ============================================================================

INSERT INTO infrastructure_cost_models (
    model_code, name, description, user_scale_min, user_scale_max,
    architecture_type, data_residency_requirement, byok_model,
    compute_spec, database_spec, caching_spec, storage_spec, cdn_spec, monitoring_spec,
    compute_cost_monthly, database_cost_monthly, storage_cost_monthly,
    network_cost_monthly, security_cost_monthly, monitoring_cost_monthly,
    ml_training_cost_monthly, ml_inference_cost_monthly, support_cost_monthly,
    total_cost_monthly, cost_per_user_monthly,
    marginal_cost_per_1000_users, economies_of_scale_factor,
    is_active
) VALUES
-- 0 Users (Development/Staging)
('scale-0-dev', 'Development/Staging', 'Dev and staging environments', 0, 0,
 'monolith', 'eu', true,
 '{"instance_count": 2, "instance_type": "cx22", "provider": "hetzner"}',
 '{"engine": "postgresql", "tier": "managed", "provider": "hetzner"}',
 NULL,
 '{"object_storage_gb": 50}',
 NULL,
 '{"provider": "grafana", "tier": "free"}',
 7.58, 15.00, 2.00, 0, 0, 0, 0, 0, 12.00, 36.58, NULL, 0.00, 1.00, true),

-- 100 Users (Private Alpha)
('scale-100-alpha', 'Private Alpha', 'Production-ready private alpha', 100, 100,
 'monolith', 'eu', true,
 '{"instance_count": 2, "instance_type": "cx32", "provider": "hetzner"}',
 '{"engine": "postgresql", "tier": "managed", "provider": "hetzner"}',
 '{"type": "redis", "memory_gb": 2, "provider": "upcloud"}',
 '{"object_storage_gb": 20}',
 '{"provider": "cloudflare", "tier": "free"}',
 '{"provider": "grafana", "tier": "free"}',
 15.16, 15.00, 4.80, 0, 0, 0, 0, 0, 12.00, 46.96, 0.47, 0.00, 1.00, true),

-- 1,000 Users (Public Beta)
('scale-1k-beta', 'Public Beta', 'Public beta with redundancy', 1000, 1000,
 'microservices', 'eu', true,
 '{"instance_count": 3, "instance_type": "cx42", "provider": "hetzner"}',
 '{"engine": "postgresql", "tier": "managed", "provider": "hetzner", "read_replicas": 1}',
 '{"type": "redis", "memory_gb": 4, "provider": "upcloud"}',
 '{"object_storage_gb": 100}',
 '{"provider": "cloudflare", "tier": "pro"}',
 '{"provider": "grafana", "tier": "pro"}',
 45.51, 45.00, 25.00, 20.00, 0, 8.00, 0, 0, 3.00, 146.51, 0.15, 0.05, 0.98, true),

-- 10,000 Users (Launch)
('scale-10k-launch', 'Launch', 'Product launch with auto-scaling', 10000, 10000,
 'microservices', 'eu', true,
 '{"instance_count": 5, "instance_type": "cx42", "provider": "hetzner", "auto_scale": true}',
 '{"engine": "postgresql", "tier": "ha", "provider": "hetzner", "read_replicas": 2}',
 '{"type": "redis", "memory_gb": 8, "provider": "upcloud"}',
 '{"object_storage_gb": 500}',
 '{"provider": "cloudflare", "tier": "pro"}',
 '{"provider": "datadog", "tier": "pro"}',
 75.85, 50.00, 25.00, 220.00, 200.00, 55.00, 0, 0, 55.00, 680.85, 0.07, 0.02, 0.95, true),

-- 50,000 Users (Growth)
('scale-50k-growth', 'Growth Phase', 'Multi-region growth phase', 50000, 50000,
 'microservices', 'eu', true,
 '{"instance_count": 10, "instance_type": "cx42", "provider": "hetzner"}',
 '{"engine": "postgresql", "tier": "ha", "provider": "ovh", "read_replicas": 3}',
 '{"type": "redis", "memory_gb": 16, "provider": "exoscale"}',
 '{"object_storage_gb": 2048}',
 '{"provider": "cloudflare", "tier": "business"}',
 '{"provider": "datadog", "tier": "enterprise"}',
 151.70, 240.00, 40.00, 200.00, 600.00, 175.00, 0, 0, 280.00, 1686.70, 0.034, 0.005, 0.92, true),

-- 100,000 Users (Product-Market Fit)
('scale-100k-pmf', 'Product-Market Fit', 'Enterprise-grade infrastructure', 100000, 100000,
 'microservices', 'eu', true,
 '{"instance_count": 20, "instance_type": "cx42", "provider": "hetzner"}',
 '{"engine": "postgresql", "tier": "cluster", "provider": "exoscale", "read_replicas": 3}',
 '{"type": "redis", "memory_gb": 32, "provider": "exoscale"}',
 '{"object_storage_gb": 5120}',
 '{"provider": "cloudflare", "tier": "enterprise"}',
 '{"provider": "datadog", "tier": "enterprise"}',
 303.40, 500.00, 100.00, 600.00, 600.00, 350.00, 200.00, 500.00, 1051.60, 4205.00, 0.042, 0.003, 0.90, true),

-- 300,000 Users (Scaling)
('scale-300k-scaling', 'Scaling Phase', 'ML pipeline introduction', 300000, 300000,
 'microservices', 'eu', true,
 '{"instance_count": 30, "instance_type": "cx42", "provider": "hetzner"}',
 '{"engine": "postgresql", "tier": "cluster", "provider": "exoscale", "read_replicas": 5}',
 '{"type": "redis", "memory_gb": 64, "provider": "exoscale"}',
 '{"object_storage_gb": 15360}',
 '{"provider": "cloudflare", "tier": "enterprise"}',
 '{"provider": "datadog", "tier": "enterprise"}',
 800.00, 1100.00, 250.00, 2000.00, 1000.00, 700.00, 200.00, 500.00, 1260.00, 6810.00, 0.023, 0.002, 0.88, true),

-- 500,000 Users (Maturation)
('scale-500k-maturation', 'Maturation', 'GPU training infrastructure', 500000, 500000,
 'microservices', 'eu', true,
 '{"instance_count": 50, "instance_type": "cx42", "provider": "multi"}',
 '{"engine": "postgresql", "tier": "cluster", "provider": "exoscale", "read_replicas": 8}',
 '{"type": "redis", "memory_gb": 128, "provider": "exoscale"}',
 '{"object_storage_gb": 30720}',
 '{"provider": "cloudflare", "tier": "enterprise"}',
 '{"provider": "datadog", "tier": "enterprise"}',
 1500.00, 2100.00, 600.00, 3000.00, 1500.00, 1100.00, 2500.00, 2000.00, 2000.00, 14300.00, 0.029, 0.001, 0.85, true),

-- 1,000,000 Users (Revenue Scale)
('scale-1m-revenue', 'Revenue Scale', 'Full production at scale', 1000000, 1000000,
 'microservices', 'eu', true,
 '{"instance_count": 100, "instance_type": "cx42", "provider": "multi"}',
 '{"engine": "postgresql", "tier": "enterprise", "provider": "exoscale", "read_replicas": 15}',
 '{"type": "redis", "memory_gb": 512, "provider": "exoscale"}',
 '{"object_storage_gb": 102400}',
 '{"provider": "cloudflare", "tier": "enterprise"}',
 '{"provider": "datadog", "tier": "enterprise"}',
 3000.00, 4200.00, 2000.00, 6000.00, 3000.00, 2400.00, 5000.00, 7000.00, 11400.00, 43000.00, 0.043, 0.0005, 0.82, true);

-- ============================================================================
-- USER SCALE THRESHOLDS
-- ============================================================================

INSERT INTO user_scale_thresholds (
    scale_name, user_count, phase_description, typical_duration_months, primary_focus,
    infrastructure_trigger, required_redundancy, required_monitoring_tier, required_support_tier,
    fixed_costs_percentage, variable_cost_per_user, milestone_id, milestone_name
) VALUES
('mvp', 0, 'Development and staging environments', 3, 'development', 'Initial setup', 'none', 'free', 'none', 100.00, 0.00, NULL, 'Pre-Milestone'),
('alpha', 100, 'Private alpha testing', 2, 'validation', 'First production deployment', 'single', 'basic', 'email', 95.00, 0.47, 1, 'M1: Foundation'),
('beta', 1000, 'Public beta launch', 3, 'validation', 'Need for read replicas', 'single', 'pro', 'email', 85.00, 0.15, 2, 'M2: ACU'),
('launch', 10000, 'Product launch', 4, 'growth', 'WAF/DDoS protection needed', 'multi_az', 'pro', 'basic', 70.00, 0.05, 3, 'M3: Compose'),
('growth', 50000, 'Growth phase', 4, 'growth', 'Multi-region deployment', 'multi_az', 'enterprise', 'standard', 60.00, 0.034, 5, 'M5: Social'),
('pmf', 100000, 'Product-market fit', 3, 'optimization', 'Enterprise features', 'multi_az', 'enterprise', 'premium', 55.00, 0.032, 7, 'M7: Scale'),
('scaling', 300000, 'Rapid scaling', 6, 'scale', 'ML pipeline infrastructure', 'multi_region', 'enterprise', '24/7', 50.00, 0.023, 8, 'M8: Training'),
('enterprise', 500000, 'Enterprise scale', 6, 'monetization', 'GPU training cluster', 'multi_region', 'enterprise', '24/7_sla', 45.00, 0.029, 9, 'M9: Revenue'),
('massive', 1000000, 'Massive scale', 6, 'monetization', 'Global infrastructure', 'global', 'enterprise_plus', '24/7_sla', 40.00, 0.043, 10, 'M10: Dividend');
