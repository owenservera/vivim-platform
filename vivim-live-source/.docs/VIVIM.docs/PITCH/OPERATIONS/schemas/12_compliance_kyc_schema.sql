-- =============================================================================
-- VIVIM Digital Twin - Compliance & KYC Schema (Module 12)
-- =============================================================================
-- User verification, KYC/AML, sanctions screening, and regulatory compliance
-- Supports Legal Framework and DAO Charter requirements
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: VERIFICATION TIERS
-- -----------------------------------------------------------------------------

CREATE TABLE verification_tiers (
    tier_id SERIAL PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL,
    tier_level INTEGER NOT NULL,
    kyc_required BOOLEAN DEFAULT FALSE,
    max_daily_limit DECIMAL(15,2),
    max_transaction_limit DECIMAL(15,2),
    requires_id BOOLEAN DEFAULT FALSE,
    requires_selfie BOOLEAN DEFAULT FALSE,
    requires_address_proof BOOLEAN DEFAULT FALSE,
    requires_sanctions_check BOOLEAN DEFAULT FALSE,
    benefits_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 2: USER IDENTITIES
-- -----------------------------------------------------------------------------

CREATE TABLE user_identities (
    identity_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    identity_type VARCHAR(50) CHECK (identity_type IN ('individual', 'entity', 'wallet')),
    
    personal_info JSONB,
    
    verification_status VARCHAR(20) CHECK (verification_status IN ('unverified', 'pending', 'approved', 'rejected', 'suspended')),
    verification_tier INTEGER REFERENCES verification_tiers(tier_id),
    
    risk_score DECIMAL(5,2) DEFAULT 0,
    risk_category VARCHAR(50) CHECK (risk_category IN ('low', 'medium', 'high', 'blocked')),
    
    first_verified_at TIMESTAMP,
    last_verified_at TIMESTAMP,
    verification_expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 3: KYC APPLICATIONS
-- -----------------------------------------------------------------------------

CREATE TABLE kyc_applications (
    application_id SERIAL PRIMARY KEY,
    identity_id INTEGER REFERENCES user_identities(identity_id),
    application_type VARCHAR(50) CHECK (application_type IN ('initial', 'upgrade', 'renewal', 'appeal')),
    
    status VARCHAR(50) CHECK (status IN ('submitted', 'in_review', 'pending_docs', 'approved', 'rejected', 'expired')),
    
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    decision_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    reviewer_id INTEGER,
    rejection_reason TEXT,
    notes TEXT
);

CREATE TABLE kyc_documents (
    document_id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES kyc_applications(application_id),
    document_type VARCHAR(50) CHECK (document_type IN ('id_card', 'passport', 'drivers_license', 'utility_bill', 'bank_statement', 'selfie', 'corporate_docs')),
    document_hash VARCHAR(256),
    storage_url TEXT,
    
    verification_status VARCHAR(20) CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by INTEGER
);

-- -----------------------------------------------------------------------------
-- SECTION 4: SANCTIONS SCREENING
-- -----------------------------------------------------------------------------

CREATE TABLE sanctions_screening (
    screening_id SERIAL PRIMARY KEY,
    identity_id INTEGER REFERENCES user_identities(identity_id),
    
    screening_type VARCHAR(50) CHECK ( screening_type IN ('initial', 'periodic', 'transaction', 'manual')),
    
    wallet_address VARCHAR(100),
    
    screening_result VARCHAR(50) CHECK (screening_result IN ('clear', 'potential_match', 'review_required', 'confirmed_match')),
    risk_indicator VARCHAR(100),
    
    match_details JSONB,
    
    screened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_screening_at TIMESTAMP,
    screened_by INTEGER
);

CREATE TABLE sanctions_lists (
    list_id SERIAL PRIMARY KEY,
    list_name VARCHAR(100) NOT NULL,
    list_source VARCHAR(100),
    list_url TEXT,
    last_imported_at TIMESTAMP,
    record_count INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- SECTION 5: COMPLIANCE FRAMEWORKS
-- -----------------------------------------------------------------------------

CREATE TABLE compliance_frameworks (
    framework_id SERIAL PRIMARY KEY,
    framework_name VARCHAR(100) NOT NULL,
    framework_code VARCHAR(50) NOT NULL UNIQUE,
    jurisdiction VARCHAR(100),
    description TEXT,
    
    requirements JSONB,
    audit_frequency VARCHAR(50),
    last_audit_at TIMESTAMP,
    next_audit_at TIMESTAMP,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE compliance_requirements (
    requirement_id SERIAL PRIMARY KEY,
    framework_id INTEGER REFERENCES compliance_frameworks(framework_id),
    
    requirement_code VARCHAR(50),
    requirement_name VARCHAR(200),
    description TEXT,
    
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    is_mandatory BOOLEAN DEFAULT TRUE,
    implementation_status VARCHAR(50) CHECK (implementation_status IN ('not_started', 'in_progress', 'implemented', 'audited')),
    
    evidence_url TEXT,
    implemented_at TIMESTAMP,
    audited_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 6: TRANSACTION MONITORING
-- -----------------------------------------------------------------------------

CREATE TABLE transaction_monitoring (
    monitoring_id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL,
    wallet_address VARCHAR(100) NOT NULL,
    
    transaction_type VARCHAR(50),
    amount DECIMAL(30,2),
    currency VARCHAR(10),
    
    risk_score DECIMAL(5,2),
    risk_flags JSONB,
    
    status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'flagged', 'blocked', 'reviewed')),
    review_notes TEXT,
    
    monitored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER
);

CREATE TABLE suspicious_activity_reports (
    report_id SERIAL PRIMARY KEY,
    monitoring_id INTEGER REFERENCES transaction_monitoring(monitoring_id),
    
    report_type VARCHAR(50) CHECK (report_type IN ('suspicious_activity', 'terrorist_financing', 'money_laundering', 'fraud')),
    
    description TEXT,
    evidence JSONB,
    
    filed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filed_by INTEGER,
    reviewed_by INTEGER,
    status VARCHAR(50) CHECK (status IN ('filed', 'under_review', 'resolved', 'escalated', 'closed'))
);

-- -----------------------------------------------------------------------------
-- SECTION 7: DATA RETENTION
-- -----------------------------------------------------------------------------

CREATE TABLE data_retention_policies (
    policy_id SERIAL PRIMARY KEY,
    data_category VARCHAR(100) NOT NULL,
    retention_period_days INTEGER,
    legal_basis TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE data_deletion_requests (
    request_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    identity_id INTEGER REFERENCES user_identities(identity_id),
    
    request_type VARCHAR(50) CHECK (request_type IN ('deletion', 'access', 'portability', 'rectification')),
    
    status VARCHAR(50) CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by INTEGER,
    notes TEXT
);

-- -----------------------------------------------------------------------------
-- SECTION 8: AUDIT & LOGGING
-- -----------------------------------------------------------------------------

CREATE TABLE compliance_audit_log (
    log_id SERIAL PRIMARY KEY,
    user_id UUID,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    
    old_value JSONB,
    new_value JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    performed_by INTEGER
);

CREATE TABLE regulatory_reports (
    report_id SERIAL PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL,
    framework_id INTEGER REFERENCES compliance_frameworks(framework_id),
    
    reporting_period_start DATE,
    reporting_period_end DATE,
    
    status VARCHAR(50) CHECK (status IN ('draft', 'pending_review', 'submitted', 'accepted', 'rejected')),
    
    submitted_at TIMESTAMP,
    submitted_by INTEGER,
    
    response_received_at TIMESTAMP,
    response_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 9: REPORTS
-- -----------------------------------------------------------------------------

CREATE VIEW v_verification_status_summary AS
SELECT 
    vt.tier_name,
    vt.tier_level,
    COUNT(ui.identity_id) as total_identities,
    COUNT(CASE WHEN ui.verification_status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN ui.verification_status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN ui.verification_status = 'rejected' THEN 1 END) as rejected,
    AVG(ui.risk_score) as avg_risk_score
FROM verification_tiers vt
LEFT JOIN user_identities ui ON vt.tier_id = ui.verification_tier
GROUP BY vt.tier_id, vt.tier_name, vt.tier_level
ORDER BY vt.tier_level;

CREATE VIEW v_compliance_status AS
SELECT 
    cf.framework_name,
    cf.jurisdiction,
    COUNT(cr.requirement_id) as total_requirements,
    COUNT(CASE WHEN cr.implementation_status = 'implemented' THEN 1 END) as implemented,
    COUNT(CASE WHEN cr.implementation_status = 'audited' THEN 1 END) as audited,
    cf.last_audit_at,
    cf.next_audit_at
FROM compliance_frameworks cf
LEFT JOIN compliance_requirements cr ON cf.framework_id = cr.framework_id
WHERE cf.is_active = TRUE
GROUP BY cf.framework_id, cf.framework_name, cf.jurisdiction, cf.last_audit_at, cf.next_audit_at;

CREATE VIEW v_risk_dashboard AS
SELECT 
    risk_category,
    COUNT(*) as count,
    AVG(risk_score) as avg_score
FROM user_identities
WHERE verification_status = 'approved'
GROUP BY risk_category;

-- -----------------------------------------------------------------------------
-- SECTION 10: INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_user_identities_user ON user_identities(user_id);
CREATE INDEX idx_user_identities_status ON user_identities(verification_status);
CREATE INDEX idx_user_identities_risk ON user_identities(risk_category);
CREATE INDEX idx_kyc_applications_identity ON kyc_applications(identity_id);
CREATE INDEX idx_kyc_applications_status ON kyc_applications(status);
CREATE INDEX idx_sanctions_screening_wallet ON sanctions_screening(wallet_address);
CREATE INDEX idx_sanctions_screening_result ON sanctions_screening(screening_result);
CREATE INDEX idx_transaction_monitoring_wallet ON transaction_monitoring(wallet_address);
CREATE INDEX idx_transaction_monitoring_status ON transaction_monitoring(status);
CREATE INDEX idx_compliance_audit_user ON compliance_audit_log(user_id);
CREATE INDEX idx_compliance_audit_action ON compliance_audit_log(action_type);

-- =============================================================================
-- END OF COMPLIANCE & KYC SCHEMA (MODULE 12)
-- =============================================================================
