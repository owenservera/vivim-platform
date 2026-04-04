-- VIVIM Digital Twin Cost Database
-- Seed Data: Milestones, Legal Services, and Governance
-- Source: VIVIM-10-Phase-Milestones-Combined.md & VIVIM-Detailed-Cost-Breakdown-By-Milestone.md
-- Version: 1.0.0

-- ============================================================================
-- MILESTONES
-- ============================================================================

INSERT INTO milestones (
    id, code, name, tagline, description,
    start_month, duration_months, end_month,
    phase_type,
    key_deliverables,
    success_criteria,
    target_user_count, target_contributor_count, target_retention_rate,
    required_engineers_fte, required_ml_engineers_fte, required_designers_fte, required_legal_hours,
    depends_on_milestone_id
) VALUES
(1, 'M1', 'Foundation: The Sovereign Chat Layer', 'Multi-provider BYOK chat + Core Infrastructure',
 'The core multi-provider chat interface with BYOK integration and foundational technical infrastructure.',
 1, 3, 4,
 'foundation',
 ARRAY['User Authentication System', 'Database Architecture', 'API Gateway', 'Security Framework', 'CI/CD Pipeline', 'Monitoring Stack', 'Unified Chat UI', 'BYOK Key Management', 'Provider Adapter Framework', 'Initial Provider Integrations'],
 ARRAY['Functional BYOK connections across all target providers', 'Sub-200ms routing overhead', '500+ alpha testers', '>60% weekly return rate'],
 500, 0, 0.60,
 7.0, 0, 1, 30,
 NULL),

(2, 'M2', 'Atomic Chat Units: Ownership as a Primitive', 'Owned, portable, composable conversation objects',
 'The foundational data architecture making every conversation an owned, portable, composable object.',
 3, 2, 5,
 'foundation',
 ARRAY['ACU Data Schema', 'ACU Generation Pipeline', 'Ownership Model', 'Provenance Hash', 'Permission System', 'ACU Relationships', 'Verifiable Provenance Ledger', 'ACU Export', 'Import Pipeline'],
 ARRAY['ACU schema finalized across all conversations', 'Provenance verification functional', '100K+ ACUs created', 'Users can export entire library'],
 2500, 0, 0.55,
 5.0, 0, 0, 15,
 1),

(3, 'M3', 'Fork / Mux / Remux: Composable Intelligence', 'Composable conversation operations',
 'The conversation operations layer - branch, merge, splice, and recompose conversations across providers.',
 5, 2, 7,
 'growth',
 ARRAY['Fork functionality', 'Mux functionality', 'Remux functionality', 'Cross-Model Forking', 'Visual Thread Editor', 'Version History', 'Full Attribution Chain', 'Template Creation'],
 ARRAY['Fork, mux, and remux operations functional', '>30% weekly adoption of compose features', 'Attribution chain 100% preserved'],
 10000, 0, 0.50,
 5.0, 0, 3, 0,
 2),

(4, 'M4', 'The Context Engine: Your Second Brain, v1', 'Dynamic second brain with cross-provider memory',
 'The persistent memory layer transforming stored conversations into active, retrievable intelligence.',
 6, 3, 9,
 'growth',
 ARRAY['Memory Graph', 'Dynamic Context Injection', 'Vector Embedding Pipeline', 'Context Retrieval System', 'Entity Extraction', 'Encrypted Storage', 'User-Controlled Encryption Keys', 'Full Data Export'],
 ARRAY['Memory graph operational', '>2x retention for context users', 'All data encrypted at rest', 'Full export functional'],
 25000, 0, 0.65,
 7.0, 3.0, 1, 40,
 3),

(5, 'M5', 'The Social Layer: Instagram for AI Conversations', 'Publishing, following, remixing, discovery',
 'The social network layer - profiles, publishing, following, discovery of AI conversations.',
 8, 3, 11,
 'growth',
 ARRAY['User Profiles', 'Publishing', 'Following', 'Discovery Feed', 'Remix (Social Fork)', 'Reactions + Commentary', 'Privacy Controls', 'Trending'],
 ARRAY['>15% monthly publish rate', 'Viral coefficient >0.3', '50+ users with >1K followers'],
 50000, 0, 0.55,
 6.0, 0, 2, 0,
 4),

(6, 'M6', 'Consent & Contribution Framework: The Trust Architecture', 'Trust architecture for opt-in data contribution',
 'The complete consent, privacy, and data contribution infrastructure.',
 10, 3, 13,
 'trust',
 ARRAY['Consent UX', 'Granularity Controls', 'Automated PII Pipeline', 'Anonymization Layer', 'User-Side Review', 'Audit Trail', 'Revocation Mechanism', 'Legal Framework', 'Contribution Quality Scoring'],
 ARRAY['>20% initial opt-in rate', '>70% trust rating', 'PII detection >99% recall', 'Revocation working within 24 hours'],
 75000, 15000, 0.60,
 5.0, 2.0, 1, 60,
 5),

(7, 'M7', 'Scale: 100K Active Users & Critical Mass', 'Growth to scale with 30K+ contributors',
 'Growth milestone - reach 100K MAU with meaningful contribution percentage.',
 12, 3, 15,
 'scale',
 ARRAY['Organic/Social-First Growth', 'Creator Partnerships', 'Community-Led Growth', 'Referral Incentives', 'Content Marketing', 'Strategic Integrations'],
 ARRAY['100K monthly active users', '30K+ opted-in contributors', '2M+ contributed ACUs', '>30% opt-in rate'],
 100000, 30000, 0.55,
 6.0, 0, 2, 10,
 6),

(8, 'M8', 'First Model Training: The Dataset Comes Alive', 'VIVIM-trained model with full provenance',
 'Model training infrastructure and the first VIVIM-trained proprietary model.',
 14, 3, 17,
 'training',
 ARRAY['Training Data Pipeline', 'Quality Filtering Layer', 'Provenance Tagging', 'First Model Training Run', 'Evaluation Framework', 'Model Card and Documentation'],
 ARRAY['Training pipeline operational', '>55% human preference vs base model', '100% provenance coverage'],
 100000, 30000, 0.60,
 4.0, 6.0, 0, 70,
 7),

(9, 'M9', 'First Model Revenue: The Flywheel Begins to Turn', 'API + enterprise licensing live',
 'Commercialization infrastructure and first paying customers for VIVIM-trained models.',
 17, 3, 20,
 'revenue',
 ARRAY['API Platform', 'Enterprise Licensing Pipeline', 'Vertical Model Pilots', 'Research Partnership Agreements', 'Revenue Attribution System'],
 ARRAY['First 10+ paying API customers', 'First 3+ enterprise licensing deals', '$500K+ ARR'],
 100000, 30000, 0.65,
 4.0, 0, 0, 10,
 8),

(10, 'M10', 'First User Dividend Distribution: The Flywheel Proves Itself', 'Contributors get paid',
 'Dividend calculation, accounting, and distribution infrastructure. First-ever user dividend payout.',
 20, 2, 22,
 'distribution',
 ARRAY['Dividend Calculation Engine', 'Payout Infrastructure', 'Dividend Dashboard (v1)', 'First Distribution Event', 'Communications Campaign', 'Feedback Loop'],
 ARRAY['First dividend distributed', '$100K+ distributed in first cycle', '>10 point opt-in rate increase', '>25% referral rate increase'],
 100000, 35000, 0.70,
 3.0, 0, 1, 30,
 9);

-- ============================================================================
-- MILESTONE COSTS
-- ============================================================================

INSERT INTO milestone_costs (
    milestone_id,
    labor_cost_low, labor_cost_mid, labor_cost_high,
    infrastructure_cost_low, infrastructure_cost_mid, infrastructure_cost_high,
    third_party_cost_low, third_party_cost_mid, third_party_cost_high,
    legal_cost_low, legal_cost_mid, legal_cost_high,
    marketing_cost_low, marketing_cost_mid, marketing_cost_high,
    total_cost_low, total_cost_mid, total_cost_high,
    cost_per_user
) VALUES
-- M1: Foundation
(1, 40000, 85200, 150000, 500, 2000, 8000, 200, 900, 3000, 500, 2500, 8000, 0, 0, 0, 41200, 90600, 169000, 0.08),
-- M2: ACU
(2, 50000, 71280, 120000, 0, 275, 1000, 0, 0, 500, 1000, 3000, 8000, 0, 0, 0, 51000, 74555, 129500, 0.028),
-- M3: Compose
(3, 80000, 111600, 180000, 100, 230, 800, 0, 0, 0, 0, 0, 0, 5000, 10000, 20000, 85100, 121830, 200800, 0.019),
-- M4: Context
(4, 120000, 172800, 280000, 1500, 3500, 12000, 0, 0, 0, 5000, 12000, 35000, 0, 0, 0, 126500, 188300, 327000, 0.022),
-- M5: Social
(5, 150000, 209200, 350000, 1000, 2200, 8000, 200, 600, 2000, 0, 0, 0, 5000, 20000, 60000, 156200, 232000, 420000, 0.023),
-- M6: Consent
(6, 100000, 135600, 220000, 800, 1600, 5000, 0, 0, 0, 30000, 55000, 100000, 0, 0, 0, 130800, 192200, 325000, 0.005),
-- M7: Scale
(7, 200000, 256000, 420000, 4000, 8000, 20000, 0, 0, 0, 0, 0, 0, 20000, 50000, 120000, 224000, 314000, 560000, 0.075),
-- M8: Training
(8, 200000, 276000, 420000, 25000, 50000, 120000, 2000, 5000, 15000, 10000, 25000, 50000, 0, 0, 0, 237000, 356000, 605000, 0.12),
-- M9: Revenue
(9, 80000, 100800, 180000, 15000, 25000, 50000, 1000, 3000, 8000, 0, 0, 0, 10000, 30000, 80000, 106000, 158800, 318000, -0.31),
-- M10: Dividend
(10, 80000, 86400, 144000, 8000, 12000, 25000, 10000, 18000, 35000, 10000, 25000, 50000, 10000, 25000, 60000, 116000, 166400, 314000, -0.26);

-- ============================================================================
-- LEGAL SERVICE CATEGORIES
-- ============================================================================

INSERT INTO legal_service_categories (
    code, name, description, typical_deliverables,
    avg_hours_low, avg_hours_mid, avg_hours_high,
    typical_trigger, can_be_templated, requires_specialist
) VALUES
('contract-tos', 'Terms of Service', 'Draft and review Terms of Service agreements', ARRAY['ToS document', 'User acceptance flow', 'Version tracking'], 10, 20, 40, 'Product launch', true, false),
('contract-privacy', 'Privacy Policy', 'Draft and review Privacy Policy', ARRAY['Privacy Policy document', 'Cookie policy', 'Data processing agreements'], 8, 15, 30, 'Product launch', true, false),
('contract-contribution', 'Contribution Agreement', 'Data contribution terms and conditions', ARRAY['Contribution Agreement', 'Revenue sharing terms', 'Consent language'], 15, 30, 60, 'M6: Consent Framework', true, true),
('compliance-gdpr', 'GDPR Compliance Review', 'GDPR compliance assessment and remediation', ARRAY['Compliance assessment', 'Remediation plan', 'Documentation'], 20, 40, 80, 'M4: Context Engine', false, true),
('compliance-soc2', 'SOC 2 Audit Preparation', 'SOC 2 Type II audit preparation', ARRAY['Controls documentation', 'Evidence collection', 'Audit support'], 40, 80, 200, 'Enterprise readiness', false, true),
('ip-patent', 'Patent Filing', 'Patent application and prosecution', ARRAY['Patent application', 'Office action responses', 'Freedom to operate analysis'], 40, 100, 300, 'Novel technology', false, true),
('ip-trademark', 'Trademark Registration', 'Trademark filing and protection', ARRAY['Trademark search', 'Application filing', 'Monitoring'], 5, 15, 40, 'Brand protection', false, false),
('litigation-defense', 'Litigation Defense', 'Defense against legal claims', ARRAY['Defense strategy', 'Motion practice', 'Settlement negotiation'], 50, 200, 1000, 'Legal claim received', false, true),
('corporate-funding', 'Funding Documentation', 'Investment and funding round documentation', ARRAY['Term sheets', 'SPA', 'Amendments'], 20, 50, 150, 'Fundraising', false, true);

-- ============================================================================
-- LEGAL COUNSEL RATES
-- ============================================================================

INSERT INTO legal_counsel_rates (
    category_id, engagement_type,
    hourly_rate_junior, hourly_rate_mid, hourly_rate_senior, hourly_rate_partner,
    currency_code, data_source, data_date, geography, is_active
)
SELECT 
    lsc.id, 'hourly',
    150, 300, 450, 600,
    'USD', 'ContractsCounsel 2025', '2025-02-01', 'US', true
FROM legal_service_categories lsc;

INSERT INTO legal_counsel_rates (
    category_id, engagement_type,
    fixed_fee_low, fixed_fee_mid, fixed_fee_high,
    currency_code, data_source, data_date, geography, is_active
)
SELECT 
    lsc.id, 'fixed_fee',
    500, 1500, 3000,
    'USD', 'Industry estimate', '2025-02-01', 'US', true
FROM legal_service_categories lsc
WHERE lsc.can_be_templated = true;

-- ============================================================================
-- LEGAL PROJECTS BY MILESTONE
-- ============================================================================

INSERT INTO legal_projects (
    project_code, name, description, category_id, milestone_id, priority,
    deliverables, estimated_hours_low, estimated_hours_mid, estimated_hours_high,
    budget_low, budget_mid, budget_high, engagement_type, status
)
SELECT 
    'M1-TOS', 'M1 Terms of Service Draft', 'Initial Terms of Service for alpha',
    lsc.id, 1, 'high',
    ARRAY['ToS v1.0', 'Acceptance flow'], 10, 15, 25,
    3000, 4500, 7500, 'fixed_fee', 'planned'
FROM legal_service_categories lsc
WHERE lsc.code = 'contract-tos';

INSERT INTO legal_projects (
    project_code, name, description, category_id, milestone_id, priority,
    deliverables, estimated_hours_low, estimated_hours_mid, estimated_hours_high,
    budget_low, budget_mid, budget_high, engagement_type, status
)
SELECT 
    'M1-PRIVACY', 'M1 Privacy Policy Draft', 'Initial Privacy Policy',
    lsc.id, 1, 'high',
    ARRAY['Privacy Policy v1.0', 'Cookie policy'], 8, 12, 20,
    2400, 3600, 6000, 'fixed_fee', 'planned'
FROM legal_service_categories lsc
WHERE lsc.code = 'contract-privacy';

INSERT INTO legal_projects (
    project_code, name, description, category_id, milestone_id, priority,
    deliverables, estimated_hours_low, estimated_hours_mid, estimated_hours_high,
    budget_low, budget_mid, budget_high, engagement_type, status
)
SELECT 
    'M6-CONTRIBUTION', 'Contribution Agreement Framework', 'Data contribution terms',
    lsc.id, 6, 'critical',
    ARRAY['Contribution Agreement', 'Revenue sharing terms', 'Consent framework'], 30, 50, 80,
    15000, 25000, 40000, 'hourly', 'planned'
FROM legal_service_categories lsc
WHERE lsc.code = 'contract-contribution';

INSERT INTO legal_projects (
    project_code, name, description, category_id, milestone_id, priority,
    deliverables, estimated_hours_low, estimated_hours_mid, estimated_hours_high,
    budget_low, budget_mid, budget_high, engagement_type, status
)
SELECT 
    'M4-GDPR', 'GDPR Compliance Assessment', 'Full GDPR compliance review',
    lsc.id, 4, 'high',
    ARRAY['Compliance report', 'Remediation plan', 'Documentation'], 40, 60, 100,
    12000, 18000, 30000, 'hourly', 'planned'
FROM legal_service_categories lsc
WHERE lsc.code = 'compliance-gdpr';

-- ============================================================================
-- COMPLIANCE FRAMEWORKS
-- ============================================================================

INSERT INTO compliance_frameworks (
    code, name, description, framework_type, jurisdiction, authority,
    applies_to_data, applies_to_ai, applies_to_privacy, applies_to_security,
    key_requirements, mandatory_controls, documentation_required, audit_frequency,
    max_fine_amount, max_fine_currency, fine_basis,
    effective_date, priority_level
) VALUES
('gdpr', 'General Data Protection Regulation', 'EU data protection regulation', 'regulation', 'EU', 'European Commission',
 true, false, true, false,
 ARRAY['Lawful basis for processing', 'Data subject rights', 'Data protection by design', 'Breach notification'],
 ARRAY['Privacy policy', 'Consent management', 'Data retention policy', 'Data processing agreements'],
 ARRAY['Records of processing', 'Privacy impact assessments', 'Breach register'],
 'annual',
 20000000, 'EUR', '4% of global annual turnover or EUR 20M, whichever is higher',
 '2018-05-25', 10),

('soc2', 'SOC 2 Type II', 'Service Organization Control 2', 'certification', 'Global', 'AICPA',
 true, false, false, true,
 ARRAY['Security', 'Availability', 'Processing integrity', 'Confidentiality', 'Privacy'],
 ARRAY['Access controls', 'Change management', 'System monitoring', 'Incident response'],
 ARRAY['Policies', 'Procedures', 'Evidence'],
 'annual',
 0, NULL, 'N/A - certification loss',
 '2020-01-01', 8),

('iso27001', 'ISO/IEC 27001', 'Information Security Management', 'certification', 'Global', 'ISO',
 false, false, false, true,
 ARRAY['Information security management system', 'Risk assessment', 'Security controls'],
 ARRAY['Security policy', 'Access control', 'Cryptography', 'Physical security'],
 ARRAY['ISMS documentation', 'Risk register', 'Audit reports'],
 'annual',
 0, NULL, 'N/A - certification loss',
 '2020-01-01', 7),

('ai-act', 'EU AI Act', 'Artificial Intelligence Regulation', 'regulation', 'EU', 'European Commission',
 false, true, false, false,
 ARRAY['Risk classification', 'Transparency requirements', 'Human oversight', 'Conformity assessment'],
 ARRAY['Risk management system', 'Data governance', 'Technical documentation', 'Record keeping'],
 ARRAY['Technical documentation', 'Quality management system', 'Post-market monitoring'],
 'continuous',
 35000000, 'EUR', '7% of global annual turnover or EUR 35M, whichever is higher',
 '2025-08-01', 9);

-- ============================================================================
-- COMPLIANCE MILESTONES
-- ============================================================================

INSERT INTO compliance_milestones (
    framework_id, milestone_id, compliance_target, description,
    required_deliverables, required_evidence, estimated_effort_hours,
    internal_cost_estimate, external_cost_estimate, audit_cost_estimate
)
SELECT 
    cf.id, 1, 'awareness', 'GDPR awareness and initial compliance',
    ARRAY['Privacy policy v1', 'Data processing register'],
    ARRAY['Policy documents', 'Training records'],
    40, 5000, 5000, 0
FROM compliance_frameworks cf
WHERE cf.code = 'gdpr';

INSERT INTO compliance_milestones (
    framework_id, milestone_id, compliance_target, description,
    required_deliverables, required_evidence, estimated_effort_hours,
    internal_cost_estimate, external_cost_estimate, audit_cost_estimate
)
SELECT 
    cf.id, 4, 'full', 'Full GDPR compliance with documentation',
    ARRAY['Complete GDPR documentation', 'DPIA processes', 'Breach response plan'],
    ARRAY['Documentation', 'Process records', 'Audit trail'],
    120, 5000, 10000, 5000
FROM compliance_frameworks cf
WHERE cf.code = 'gdpr';

INSERT INTO compliance_milestones (
    framework_id, milestone_id, compliance_target, description,
    required_deliverables, required_evidence, estimated_effort_hours,
    internal_cost_estimate, external_cost_estimate, audit_cost_estimate
)
SELECT 
    cf.id, 8, 'certification', 'SOC 2 Type II certification',
    ARRAY['SOC 2 report', 'Controls documentation'],
    ARRAY['Audit evidence', 'Penetration test reports'],
    200, 10000, 20000, 15000
FROM compliance_frameworks cf
WHERE cf.code = 'soc2';

-- ============================================================================
-- RISK CATEGORIES
-- ============================================================================

INSERT INTO risk_categories (
    code, name, description, risk_domain,
    inherent_likelihood, inherent_impact
) VALUES
('data-breach', 'Data Breach', 'Unauthorized access to user data', 'technical', 3, 5),
('gdpr-fine', 'GDPR Non-Compliance', 'Regulatory fines for GDPR violations', 'regulatory', 2, 5),
('ai-bias', 'AI Model Bias', 'Biased or harmful model outputs', 'technical', 3, 4),
('revenue-shortfall', 'Revenue Shortfall', 'Failure to achieve revenue targets', 'financial', 3, 4),
('talent-loss', 'Key Talent Loss', 'Loss of critical team members', 'operational', 3, 4),
('competition', 'Competitive Pressure', 'New competitor or feature parity loss', 'reputational', 4, 3),
('funding-risk', 'Funding Risk', 'Inability to raise future funding', 'financial', 2, 5),
('consent-low', 'Low Opt-In Rate', 'Users do not opt into contribution', 'operational', 3, 4);

-- ============================================================================
-- CONTRACT TEMPLATES
-- ============================================================================

INSERT INTO contract_templates (
    code, name, contract_type, description, purpose,
    jurisdiction, applicable_law,
    sections, key_clauses,
    template_cost_low, template_cost_mid, template_cost_high, customization_hours_estimate,
    first_milestone_needed, review_frequency_months, is_active
) VALUES
('tos-v1', 'Terms of Service v1', 'tos', 'Standard Terms of Service', 'Define user rights and obligations',
 'EU', 'German Law',
 '[{"title": "Definitions", "required": true}, {"title": "Acceptable Use", "required": true}, {"title": "Intellectual Property", "required": true}, {"title": "Limitation of Liability", "required": true}]',
 ARRAY['Service description', 'User obligations', 'IP ownership', 'Liability cap', 'Governing law'],
 500, 1500, 3000, 10,
 1, 12, true),

('privacy-v1', 'Privacy Policy v1', 'privacy_policy', 'Standard Privacy Policy', 'Inform users about data practices',
 'EU', 'GDPR',
 '[{"title": "Data Controller", "required": true}, {"title": "Data Collection", "required": true}, {"title": "User Rights", "required": true}, {"title": "International Transfers", "required": true}]',
 ARRAY['Data collected', 'Purposes of processing', 'User rights', 'Retention periods', 'Contact information'],
 500, 1200, 2500, 8,
 1, 12, true),

('contribution-v1', 'Data Contribution Agreement', 'contribution_agreement', 'Terms for data contribution', 'Define contribution terms and revenue sharing',
 'EU', 'German Law',
 '[{"title": "Contribution Terms", "required": true}, {"title": "Revenue Sharing", "required": true}, {"title": "IP Assignment", "required": true}, {"title": "Revocation Rights", "required": true}]',
 ARRAY['Scope of contribution', 'Revenue share percentage', 'IP license grant', 'Revocation process', 'Payment terms'],
 2000, 5000, 10000, 30,
 6, 6, true);
