-- =============================================================================
-- VIVIM Digital Twin - Seed Data for Compliance & KYC (Module 12)
-- =============================================================================

INSERT INTO verification_tiers (tier_name, tier_level, kyc_required, max_daily_limit, max_transaction_limit, requires_id, requires_selfie, requires_address_proof, requires_sanctions_check, benefits_description) VALUES
('Unverified', 0, FALSE, 0, 0, FALSE, FALSE, FALSE, FALSE, 'Basic platform access'),
('Basic', 1, FALSE, 1000, 5000, FALSE, FALSE, FALSE, FALSE, 'Basic trading, community access'),
('Verified', 2, TRUE, 10000, 50000, TRUE, TRUE, FALSE, TRUE, 'Full trading, governance participation'),
('Premium', 3, TRUE, 100000, 500000, TRUE, TRUE, TRUE, TRUE, 'Unlimited, priority support'),
('Enterprise', 4, TRUE, NULL, NULL, TRUE, TRUE, TRUE, TRUE, 'Custom solutions, dedicated support');

INSERT INTO compliance_frameworks (framework_name, framework_code, jurisdiction, description, audit_frequency, is_active) VALUES
('GDPR', 'GDPR-EU', 'European Union', 'General Data Protection Regulation', 'annual', TRUE),
('SOC2', 'SOC2-US', 'United States', 'Service Organization Control 2', 'annual', TRUE),
('AI Act', 'AIACT-EU', 'European Union', 'EU AI Act Compliance', 'quarterly', TRUE),
('MiCA', 'MICA-EU', 'European Union', 'Markets in Crypto-Assets Regulation', 'quarterly', TRUE),
('AML/KYC', 'AML-KYC-INT', 'International', 'Anti-Money Laundering Standards', 'continuous', TRUE);

INSERT INTO compliance_requirements (framework_id, requirement_code, requirement_name, description, category, implementation_status) VALUES
(1, 'GDPR-ART-5', 'Data Minimization', 'Collect only necessary personal data', 'Principles', 'implemented'),
(1, 'GDPR-ART-6', 'Lawful Basis', 'Establish lawful basis for processing', 'Principles', 'implemented'),
(1, 'GDPR-ART-15', 'Right to Access', 'Users can access their data', 'Rights', 'implemented'),
(1, 'GDPR-ART-17', 'Right to Erasure', 'Users can request deletion', 'Rights', 'implemented'),
(2, 'SOC2-CC1', 'Control Environment', 'Security policies and procedures', 'Common Criteria', 'implemented'),
(2, 'SOC2-CC6', 'Logical Access', 'Logical and physical access controls', 'Common Criteria', 'in_progress'),
(2, 'SOC2-CC7', 'System Operations', 'System monitoring and operations', 'Common Criteria', 'in_progress'),
(3, 'AIACT-HIGH', 'High-Risk AI Systems', 'Compliance for high-risk AI systems', 'Requirements', 'implemented'),
(3, 'AIACT-TRANSPARENCY', 'Transparency Requirements', 'AI system disclosure requirements', 'Requirements', 'implemented'),
(4, 'MICA-WHITE', 'White Paper', 'Token white paper requirements', 'Requirements', 'implemented'),
(4, 'MICA-CUSTODY', 'Custody Rules', 'Asset custody and segregation', 'Requirements', 'in_progress'),
(5, 'AML-SCREEN', 'Sanctions Screening', 'Screen against sanctions lists', 'Screening', 'implemented'),
(5, 'AML-CDDR', 'Customer Due Diligence', 'Verify customer identity', 'Due Diligence', 'implemented');

INSERT INTO data_retention_policies (data_category, retention_period_days, legal_basis) VALUES
('Authentication Logs', 730, 'Security and fraud prevention'),
('Transaction Records', 2555, 'Tax and legal compliance'),
('KYC Documents', 1825, 'Regulatory requirements'),
('User Personal Data', 730, 'Contract fulfillment'),
('Audit Logs', 2555, 'Compliance and legal'),
('Marketing Preferences', 540, 'Consent basis');

INSERT INTO sanctions_lists (list_name, list_source, list_url, is_active) VALUES
('OFAC SDN', 'US Treasury', 'https://www.treasury.gov/ofac', TRUE),
('EU Sanctions', 'European Union', 'https://eeas.europa.eu', TRUE),
('UN Sanctions', 'United Nations', 'https://www.un.org', TRUE);
