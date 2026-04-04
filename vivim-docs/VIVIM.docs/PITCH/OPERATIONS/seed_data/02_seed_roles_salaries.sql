-- VIVIM Digital Twin Cost Database
-- Seed Data: Roles and Salary Benchmarks
-- Source: VIVIM-Labor-Costs-Mediterranean.md & VIVIM-Detailed-Cost-Breakdown-By-Milestone.md
-- Version: 1.0.0

-- ============================================================================
-- ROLE CATEGORIES
-- ============================================================================

INSERT INTO role_categories (code, name, description, department, career_track, typical_progression) VALUES
('eng-backend', 'Backend Engineering', 'Server-side development, APIs, databases', 'engineering', 'individual_contributor', '["Junior Backend", "Backend Engineer", "Senior Backend", "Staff Backend", "Principal Backend"]'),
('eng-frontend', 'Frontend Engineering', 'User interface development, client-side applications', 'engineering', 'individual_contributor', '["Junior Frontend", "Frontend Engineer", "Senior Frontend", "Staff Frontend", "Principal Frontend"]'),
('eng-fullstack', 'Full-Stack Engineering', 'End-to-end development across stack', 'engineering', 'individual_contributor', '["Junior Full-Stack", "Full-Stack Engineer", "Senior Full-Stack", "Staff Full-Stack"]'),
('eng-devops', 'DevOps & Infrastructure', 'Infrastructure, CI/CD, cloud operations', 'engineering', 'individual_contributor', '["DevOps Engineer", "Senior DevOps", "Platform Engineer", "SRE Lead"]'),
('eng-ml', 'Machine Learning Engineering', 'ML models, training pipelines, inference', 'engineering', 'individual_contributor', '["ML Engineer", "Senior ML Engineer", "ML Architect", "Principal ML"]'),
('eng-security', 'Security Engineering', 'Application security, compliance, audits', 'engineering', 'individual_contributor', '["Security Engineer", "Senior Security", "Security Architect", "CISO"]'),
('eng-data', 'Data Engineering', 'Data pipelines, warehousing, analytics', 'engineering', 'individual_contributor', '["Data Engineer", "Senior Data Engineer", "Data Architect"]'),
('design-ux', 'UX/UI Design', 'User experience and interface design', 'design', 'individual_contributor', '["Junior Designer", "Designer", "Senior Designer", "Design Lead", "Head of Design"]'),
('product-pm', 'Product Management', 'Product strategy, roadmap, prioritization', 'product', 'hybrid', '["Associate PM", "Product Manager", "Senior PM", "Product Lead", "CPO"]'),
('legal-counsel', 'Legal Counsel', 'Contract review, compliance, IP', 'legal', 'individual_contributor', '["Associate Counsel", "Counsel", "Senior Counsel", "General Counsel"]'),
('ops-community', 'Community Management', 'User community, support, engagement', 'operations', 'individual_contributor', '["Community Manager", "Senior Community", "Head of Community"]'),
('ops-growth', 'Growth & Business Development', 'User acquisition, partnerships, sales', 'operations', 'hybrid', '["Growth Associate", "Growth Manager", "BD Lead", "VP Growth"]'),
('ops-finance', 'Finance & Operations', 'Accounting, FP&A, operations', 'operations', 'hybrid', '["Finance Analyst", "Finance Manager", "Director of Finance", "CFO"]'),
('ops-support', 'Customer Support', 'User support, troubleshooting', 'operations', 'individual_contributor', '["Support Agent", "Senior Support", "Support Lead"]');

-- ============================================================================
-- ROLES
-- ============================================================================

INSERT INTO roles (code, title, category_id, description, responsibilities, required_skills, preferred_skills, years_experience_min, years_experience_max, seniority_level, employment_types, is_technical, is_ml_related, is_security_related, default_fte_percentage) VALUES
-- JUNIOR DEVELOPER ROLES
('junior-backend', 'Junior Backend Developer', (SELECT id FROM role_categories WHERE code = 'eng-backend'), 'Entry-level backend development', ARRAY['Develop API endpoints', 'Write database queries', 'Fix bugs'], ARRAY['Python', 'SQL', 'Git'], ARRAY['Docker', 'AWS'], 0, 2, 'junior', ARRAY['full_time', 'contractor'], true, false, false, 1.00),
('junior-frontend', 'Junior Frontend Developer', (SELECT id FROM role_categories WHERE code = 'eng-frontend'), 'Entry-level frontend development', ARRAY['Build UI components', 'Implement designs', 'Client-side logic'], ARRAY['JavaScript', 'React', 'CSS'], ARRAY['TypeScript', 'Next.js'], 0, 2, 'junior', ARRAY['full_time', 'contractor'], true, false, false, 1.00),

-- MID-LEVEL DEVELOPER ROLES
('mid-backend', 'Backend Developer', (SELECT id FROM role_categories WHERE code = 'eng-backend'), 'Mid-level backend development', ARRAY['Design APIs', 'Database optimization', 'System architecture'], ARRAY['Python', 'PostgreSQL', 'Docker', 'AWS'], ARRAY['Kubernetes', 'Redis', 'GraphQL'], 2, 5, 'mid', ARRAY['full_time', 'contractor'], true, false, false, 1.00),
('mid-frontend', 'Frontend Developer', (SELECT id FROM role_categories WHERE code = 'eng-frontend'), 'Mid-level frontend development', ARRAY['Architect frontend apps', 'Performance optimization', 'State management'], ARRAY['TypeScript', 'React', 'Next.js', 'Tailwind'], ARRAY['GraphQL', 'WebGL', 'Testing'], 2, 5, 'mid', ARRAY['full_time', 'contractor'], true, false, false, 1.00),
('mid-fullstack', 'Full-Stack Developer', (SELECT id FROM role_categories WHERE code = 'eng-fullstack'), 'End-to-end development', ARRAY['Full feature development', 'Database design', 'API integration'], ARRAY['JavaScript/TypeScript', 'Node.js', 'React', 'PostgreSQL'], ARRAY['Docker', 'AWS', 'GraphQL'], 2, 5, 'mid', ARRAY['full_time', 'contractor'], true, false, false, 1.00),

-- SENIOR DEVELOPER ROLES
('senior-backend', 'Senior Backend Engineer', (SELECT id FROM role_categories WHERE code = 'eng-backend'), 'Senior backend architecture and development', ARRAY['System architecture', 'Technical leadership', 'Code review', 'Mentoring'], ARRAY['Python/Go/Rust', 'PostgreSQL', 'Redis', 'Kubernetes', 'AWS'], ARRAY['Kafka', 'Elasticsearch', 'Terraform'], 5, 10, 'senior', ARRAY['full_time', 'contractor'], true, false, false, 1.00),
('senior-frontend', 'Senior Frontend Engineer', (SELECT id FROM role_categories WHERE code = 'eng-frontend'), 'Senior frontend architecture and development', ARRAY['Frontend architecture', 'Performance optimization', 'Technical leadership'], ARRAY['TypeScript', 'React', 'Next.js', 'GraphQL', 'Testing'], ARRAY['WebAssembly', 'WebGPU', 'Canvas API'], 5, 10, 'senior', ARRAY['full_time', 'contractor'], true, false, false, 1.00),
('senior-devops', 'DevOps Engineer', (SELECT id FROM role_categories WHERE code = 'eng-devops'), 'Infrastructure and operations', ARRAY['CI/CD pipelines', 'Infrastructure as code', 'Monitoring', 'Security'], ARRAY['Kubernetes', 'Terraform', 'AWS', 'Docker', 'GitHub Actions'], ARRAY['Prometheus', 'Grafana', 'Python'], 5, 10, 'senior', ARRAY['full_time', 'contractor'], true, false, false, 0.50),

-- ML ROLES
('ml-engineer', 'ML Engineer', (SELECT id FROM role_categories WHERE code = 'eng-ml'), 'Machine learning model development', ARRAY['Model development', 'Training pipelines', 'Inference optimization'], ARRAY['Python', 'PyTorch', 'TensorFlow', 'HuggingFace', 'Docker'], ARRAY['CUDA', 'Ray', 'Kubernetes'], 2, 5, 'mid', ARRAY['full_time', 'contractor'], true, true, false, 1.00),
('senior-ml', 'Senior ML Engineer', (SELECT id FROM role_categories WHERE code = 'eng-ml'), 'Senior ML architecture and training', ARRAY['ML system design', 'Training at scale', 'Model evaluation', 'Research'], ARRAY['Python', 'PyTorch', 'Distributed Training', 'MLOps', 'Kubernetes'], ARRAY['CUDA', 'DeepSpeed', 'vLLM'], 5, 10, 'senior', ARRAY['full_time', 'contractor'], true, true, false, 1.00),
('mlops-engineer', 'MLOps Engineer', (SELECT id FROM role_categories WHERE code = 'eng-ml'), 'ML infrastructure and operations', ARRAY['ML pipelines', 'Model deployment', 'Monitoring', 'Feature stores'], ARRAY['Python', 'Kubernetes', 'MLflow', 'Kubeflow', 'AWS'], ARRAY['Ray', ' Feast', 'Terraform'], 3, 7, 'senior', ARRAY['full_time', 'contractor'], true, true, false, 1.00),

-- SECURITY ROLES
('security-engineer', 'Security Engineer', (SELECT id FROM role_categories WHERE code = 'eng-security'), 'Application and infrastructure security', ARRAY['Security audits', 'Penetration testing', 'Secure coding', 'Compliance'], ARRAY['Security frameworks', 'Penetration testing', 'Cryptography', 'AWS Security'], ARRAY['Go', 'Rust', 'Compliance frameworks'], 3, 8, 'senior', ARRAY['full_time', 'contractor'], true, false, true, 0.30),

-- DESIGN ROLES
('designer', 'UX/UI Designer', (SELECT id FROM role_categories WHERE code = 'design-ux'), 'User experience and interface design', ARRAY['UI design', 'Prototyping', 'User research', 'Design systems'], ARRAY['Figma', 'UI Design', 'Prototyping', 'User Research'], ARRAY['Framer', 'Motion Design', 'Design Systems'], 2, 5, 'mid', ARRAY['full_time', 'contractor'], false, false, false, 0.50),

-- PRODUCT ROLES
('product-manager', 'Product Manager', (SELECT id FROM role_categories WHERE code = 'product-pm'), 'Product strategy and execution', ARRAY['Roadmap', 'Prioritization', 'User research', 'Analytics'], ARRAY['Product Strategy', 'Agile', 'Data Analysis', 'User Research'], ARRAY['SQL', 'A/B Testing', 'Figma'], 3, 7, 'senior', ARRAY['full_time', 'contractor'], false, false, false, 1.00),

-- LEGAL ROLES
('legal-counsel', 'Legal Counsel', (SELECT id FROM role_categories WHERE code = 'legal-counsel'), 'Legal advisory and contract review', ARRAY['Contract review', 'Compliance', 'IP protection', 'Risk assessment'], ARRAY['Contract Law', 'IP Law', 'GDPR', 'Tech Law'], ARRAY['AI Regulation', 'International Law'], 5, 15, 'senior', ARRAY['contractor'], false, false, false, 0.20),

-- OPERATIONS ROLES
('community-manager', 'Community Manager', (SELECT id FROM role_categories WHERE code = 'ops-community'), 'Community building and engagement', ARRAY['Community engagement', 'Content moderation', 'Event organization', 'Support'], ARRAY['Community Building', 'Social Media', 'Support', 'Communication'], ARRAY['Analytics', 'Growth Marketing'], 2, 5, 'mid', ARRAY['full_time', 'contractor'], false, false, false, 0.50),
('growth-lead', 'Growth Lead', (SELECT id FROM role_categories WHERE code = 'ops-growth'), 'User acquisition and growth', ARRAY['Growth strategy', 'Partnerships', 'Analytics', 'Campaigns'], ARRAY['Growth Marketing', 'Analytics', 'Partnerships', 'SEO/SEM'], ARRAY['SQL', 'Python', 'Data Analysis'], 3, 7, 'senior', ARRAY['full_time', 'contractor'], false, false, false, 1.00),
('support-agent', 'Support Agent', (SELECT id FROM role_categories WHERE code = 'ops-support'), 'Customer support', ARRAY['Ticket resolution', 'User onboarding', 'Documentation', 'Escalation'], ARRAY['Customer Support', 'Communication', 'Problem Solving'], ARRAY['Technical Writing', 'SQL'], 0, 3, 'junior', ARRAY['full_time', 'contractor'], false, false, false, 1.00);

-- ============================================================================
-- SALARY BENCHMARKS - MALLORCA, SPAIN
-- ============================================================================

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'EUR',
    22000, 27000, 32000, NULL, NULL, NULL,
    2200, 2700, 3200,
    29040, 35640, 42240,
    'PayScale', '2025-02-01', 'high', 'Junior Developer range'
FROM roles r, locations l
WHERE r.code = 'junior-backend' AND l.code = 'ES-PM';

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'EUR',
    30000, 37500, 45000, NULL, NULL, NULL,
    3000, 3750, 4500,
    39600, 49500, 59400,
    'Levels.fyi', '2025-02-01', 'high', 'Mid-Level Developer range'
FROM roles r, locations l
WHERE r.code = 'mid-backend' AND l.code = 'ES-PM';

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'EUR',
    45000, 55000, 65000, NULL, NULL, NULL,
    4500, 5500, 6500,
    59400, 72600, 85800,
    'ERI SalaryExpert', '2025-02-01', 'high', 'Senior Developer range'
FROM roles r, locations l
WHERE r.code = 'senior-backend' AND l.code = 'ES-PM';

-- Contractor rates for Mallorca
INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'contractor', 'EUR',
    30, 40, 50,
    4800, 6400, 8000,
    57600, 76800, 96000,
    'Industry estimate', '2025-02-01', 'medium', 'Contractor full-stack rate'
FROM roles r, locations l
WHERE r.code = 'mid-fullstack' AND l.code = 'ES-PM';

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'contractor', 'EUR',
    35, 45, 55,
    5600, 7200, 8800,
    67200, 86400, 105600,
    'Industry estimate', '2025-02-01', 'medium', 'Senior contractor rate'
FROM roles r, locations l
WHERE r.code = 'senior-backend' AND l.code = 'ES-PM';

-- ============================================================================
-- SALARY BENCHMARKS - SICILY, ITALY
-- ============================================================================

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'EUR',
    18000, 22000, 28000, NULL, NULL, NULL,
    1800, 2200, 2800,
    27000, 33000, 42000,
    'PayScale', '2025-02-01', 'high', 'Junior Developer - Lowest cost location'
FROM roles r, locations l
WHERE r.code = 'junior-backend' AND l.code = 'IT-CT';

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'EUR',
    26000, 32000, 40000, NULL, NULL, NULL,
    2600, 3200, 4000,
    39000, 48000, 60000,
    'Levels.fyi', '2025-02-01', 'high', 'Mid-Level Developer'
FROM roles r, locations l
WHERE r.code = 'mid-backend' AND l.code = 'IT-CT';

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'EUR',
    38000, 48000, 55000, NULL, NULL, NULL,
    3800, 4800, 5500,
    57000, 72000, 82500,
    'Jobicy', '2025-02-01', 'high', 'Senior Developer with Bonus Sud eligibility'
FROM roles r, locations l
WHERE r.code = 'senior-backend' AND l.code = 'IT-CT';

-- ML Engineer - Sicily (higher demand)
INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'EUR',
    26000, 40000, 60000, NULL, NULL, NULL,
    2600, 4000, 6000,
    39000, 60000, 90000,
    'Industry estimate', '2025-02-01', 'medium', 'AI/ML premium in Sicily'
FROM roles r, locations l
WHERE r.code = 'ml-engineer' AND l.code = 'IT-CT';

-- Contractor rates - Sicily
INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'contractor', 'EUR',
    25, 32, 40,
    4000, 5120, 6400,
    48000, 61440, 76800,
    'Industry estimate', '2025-02-01', 'medium', 'Sicily contractor rates'
FROM roles r, locations l
WHERE r.code = 'mid-fullstack' AND l.code = 'IT-CT';

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'contractor', 'EUR',
    30, 40, 50,
    4800, 6400, 8000,
    57600, 76800, 96000,
    'Industry estimate', '2025-02-01', 'medium', 'Senior contractor Sicily'
FROM roles r, locations l
WHERE r.code = 'senior-backend' AND l.code = 'IT-CT';

-- ============================================================================
-- SALARY BENCHMARKS - MALTA
-- ============================================================================

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'EUR',
    20000, 24000, 28000, NULL, NULL, NULL,
    2000, 2400, 2800,
    26000, 31200, 36400,
    'PayScale', '2025-02-01', 'high', 'Junior Developer'
FROM roles r, locations l
WHERE r.code = 'junior-backend' AND l.code = 'MT-VA';

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'EUR',
    28000, 33000, 38000, NULL, NULL, NULL,
    2800, 3300, 3800,
    36400, 42900, 49400,
    'Plane', '2025-02-01', 'high', 'Mid-Level Developer'
FROM roles r, locations l
WHERE r.code = 'mid-backend' AND l.code = 'MT-VA';

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'EUR',
    38000, 45000, 52000, NULL, NULL, NULL,
    3800, 4500, 5200,
    49400, 58500, 67600,
    'TalentUp', '2025-02-01', 'high', 'Senior Developer - HQP eligible at 45k+'
FROM roles r, locations l
WHERE r.code = 'senior-backend' AND l.code = 'MT-VA';

-- Fintech Developer - Malta specialty
INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'EUR',
    28000, 42000, 60000, NULL, NULL, NULL,
    2800, 4200, 6000,
    36400, 54600, 78000,
    'Archer IT Malta', '2025-02-01', 'high', 'Fintech specialist - Malta strength'
FROM roles r, locations l
WHERE r.code = 'senior-backend' AND l.code = 'MT-VA';

-- Contractor rates - Malta
INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'contractor', 'EUR',
    25, 32, 40,
    4000, 5120, 6400,
    48000, 61440, 76800,
    'Industry estimate', '2025-02-01', 'medium', 'Malta contractor rates'
FROM roles r, locations l
WHERE r.code = 'mid-fullstack' AND l.code = 'MT-VA';

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'contractor', 'EUR',
    30, 37, 45,
    4800, 5920, 7200,
    57600, 71040, 86400,
    'Industry estimate', '2025-02-01', 'medium', 'Senior contractor Malta'
FROM roles r, locations l
WHERE r.code = 'senior-backend' AND l.code = 'MT-VA';

-- ============================================================================
-- SALARY BENCHMARKS - US REFERENCE
-- ============================================================================

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'USD',
    75000, 85000, 95000, NULL, NULL, NULL,
    7500, 8500, 9500,
    86250, 97750, 109250,
    'ZipRecruiter', '2025-02-01', 'high', 'US Junior Developer - Baseline'
FROM roles r, locations l
WHERE r.code = 'junior-backend' AND l.code = 'US-SF';

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    salary_annual_low, salary_annual_mid, salary_annual_high,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'full_time', 'USD',
    140000, 160000, 180000, NULL, NULL, NULL,
    14000, 16000, 18000,
    161000, 184000, 207000,
    'ZipRecruiter', '2025-02-01', 'high', 'US Senior Developer - Baseline'
FROM roles r, locations l
WHERE r.code = 'senior-backend' AND l.code = 'US-SF';

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'contractor', 'USD',
    75, 95, 120,
    12000, 15200, 19200,
    144000, 182400, 230400,
    'Glassdoor', '2025-02-01', 'high', 'US Senior Contractor rate'
FROM roles r, locations l
WHERE r.code = 'senior-backend' AND l.code = 'US-SF';

-- ============================================================================
-- SPECIALIZED ROLES - LEGAL
-- ============================================================================

INSERT INTO salary_benchmarks (
    role_id, location_id, employment_type, currency_code,
    hourly_rate_low, hourly_rate_mid, hourly_rate_high,
    monthly_cost_low, monthly_cost_mid, monthly_cost_high,
    total_cost_annual_low, total_cost_annual_mid, total_cost_annual_high,
    data_source, data_date, confidence_level, notes
)
SELECT 
    r.id, l.id, 'contractor', 'USD',
    250, 400, 600,
    10000, 16000, 24000,
    120000, 192000, 288000,
    'ContractsCounsel', '2025-02-01', 'medium', 'Legal Counsel - US rates'
FROM roles r, locations l
WHERE r.code = 'legal-counsel' AND l.code = 'US-SF';
