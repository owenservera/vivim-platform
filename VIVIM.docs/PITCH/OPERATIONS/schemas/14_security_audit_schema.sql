-- =============================================================================
-- VIVIM Digital Twin - Security & Audit Schema (Module 14)
-- =============================================================================
-- Security operations, access control, audit logging, and incident management
-- Comprehensive security tracking for the VIVIM platform
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: SECURITY POLICIES
-- -----------------------------------------------------------------------------

CREATE TABLE security_policies (
    policy_id SERIAL PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL,
    policy_code VARCHAR(50) NOT NULL UNIQUE,
    policy_type VARCHAR(50) CHECK (policy_type IN ('access', 'authentication', 'encryption', 'network', 'data', 'incident')),
    description TEXT,
    version VARCHAR(20),
    status VARCHAR(20) CHECK (status IN ('draft', 'active', 'deprecated', 'superseded')),
    rules JSONB,
    exceptions JSONB,
    effective_from DATE,
    effective_until DATE,
    approved_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE security_roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB,
    inherits_from INTEGER REFERENCES security_roles(role_id),
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 2: ACCESS CONTROL
-- -----------------------------------------------------------------------------

CREATE TABLE user_access (
    access_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    role_id INTEGER REFERENCES security_roles(role_id),
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    access_level VARCHAR(20) CHECK (access_level IN ('none', 'read', 'write', 'admin')),
    granted_by INTEGER,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role_id, resource_type, resource_id)
);

CREATE TABLE access_requests (
    request_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    role_id INTEGER REFERENCES security_roles(role_id),
    resource_type VARCHAR(50),
    resource_id INTEGER,
    request_reason TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    review_notes TEXT
);

-- -----------------------------------------------------------------------------
-- SECTION 3: AUTHENTICATION
-- -----------------------------------------------------------------------------

CREATE TABLE authentication_log (
    log_id SERIAL PRIMARY KEY,
    user_id UUID,
    wallet_address VARCHAR(100),
    authentication_method VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    failure_reason VARCHAR(200),
    location VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mfa_devices (
    device_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    device_type VARCHAR(50),
    device_name VARCHAR(100),
    public_key TEXT,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE session_management (
    session_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    session_token VARCHAR(256),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- SECTION 4: SECURITY MONITORING
-- -----------------------------------------------------------------------------

CREATE TABLE security_events (
    event_id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    source VARCHAR(100),
    user_id UUID,
    wallet_address VARCHAR(100),
    ip_address INET,
    description TEXT,
    raw_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE intrusion_detection (
    detection_id SERIAL PRIMARY KEY,
    alert_type VARCHAR(100),
    source_ip INET,
    target_resource VARCHAR(100),
    attack_type VARCHAR(100),
    threat_level VARCHAR(20),
    description TEXT,
    raw_log TEXT,
    status VARCHAR(20) CHECK (status IN ('detected', 'investigating', 'mitigated', 'resolved', 'false_positive')),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mitigated_at TIMESTAMP,
    mitigated_by INTEGER
);

CREATE TABLE vulnerability_scans (
    scan_id SERIAL PRIMARY KEY,
    scan_type VARCHAR(50),
    target VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('scheduled', 'running', 'completed', 'failed')),
    vulnerabilities_found INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    scan_results JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    scan_by INTEGER
);

-- -----------------------------------------------------------------------------
-- SECTION 5: INCIDENT MANAGEMENT
-- -----------------------------------------------------------------------------

CREATE TABLE security_incidents (
    incident_id SERIAL PRIMARY KEY,
    incident_title VARCHAR(200) NOT NULL,
    incident_type VARCHAR(100),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) CHECK (status IN ('identified', 'contained', 'eradicated', 'recovered', 'closed')),
    description TEXT,
    affected_systems JSONB,
    affected_users JSONB,
    estimated_impact VARCHAR(200),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contained_at TIMESTAMP,
    eradicated_at TIMESTAMP,
    recovered_at TIMESTAMP,
    closed_at TIMESTAMP,
    incident_lead INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incident_actions (
    action_id SERIAL PRIMARY KEY,
    incident_id INTEGER REFERENCES security_incidents(incident_id),
    action_type VARCHAR(100),
    description TEXT,
    performed_by INTEGER,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result JSONB
);

CREATE TABLE incident_notifications (
    notification_id SERIAL PRIMARY KEY,
    incident_id INTEGER REFERENCES security_incidents(incident_id),
    notification_type VARCHAR(50),
    recipient VARCHAR(100),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'failed'))
);

-- -----------------------------------------------------------------------------
-- SECTION 6: AUDIT LOGGING
-- -----------------------------------------------------------------------------

CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id UUID,
    wallet_address VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) CHECK (status IN ('success', 'failure', 'pending')),
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE data_access_log (
    log_id SERIAL PRIMARY KEY,
    user_id UUID,
    data_type VARCHAR(50),
    data_id INTEGER,
    access_type VARCHAR(20) CHECK (access_type IN ('read', 'write', 'delete', 'export')),
    purpose VARCHAR(200),
    ip_address INET,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 7: ENCRYPTION & KEYS
-- -----------------------------------------------------------------------------

CREATE TABLE encryption_keys (
    key_id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL,
    key_type VARCHAR(50) CHECK (key_type IN ('symmetric', 'asymmetric', 'hashing', 'signing')),
    key_algorithm VARCHAR(50),
    key_length INTEGER,
    public_key TEXT,
    key_status VARCHAR(20) CHECK (key_status IN ('active', 'rotating', 'expired', 'revoked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    rotated_at TIMESTAMP,
    created_by INTEGER,
    notes TEXT
);

CREATE TABLE key_rotation_log (
    log_id SERIAL PRIMARY KEY,
    key_id INTEGER REFERENCES encryption_keys(key_id),
    rotation_type VARCHAR(50),
    old_key_fingerprint VARCHAR(100),
    new_key_fingerprint VARCHAR(100),
    rotated_by INTEGER,
    rotated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('initiated', 'completed', 'failed')),
    notes TEXT
);

-- -----------------------------------------------------------------------------
-- SECTION 8: BACKUP & RECOVERY
-- -----------------------------------------------------------------------------

CREATE TABLE backup_configurations (
    config_id SERIAL PRIMARY KEY,
    backup_type VARCHAR(50),
    target_system VARCHAR(100),
    schedule_cron VARCHAR(50),
    retention_days INTEGER,
    encryption_enabled BOOLEAN DEFAULT TRUE,
    storage_location VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE backup_records (
    record_id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES backup_configurations(config_id),
    backup_name VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('in_progress', 'completed', 'failed', 'verified')),
    size_bytes BIGINT,
    checksum VARCHAR(100),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    verified_at TIMESTAMP,
    storage_location VARCHAR(200),
    error_message TEXT
);

CREATE TABLE disaster_recovery_tests (
    test_id SERIAL PRIMARY KEY,
    test_type VARCHAR(50),
    test_name VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('planned', 'in_progress', 'passed', 'failed')),
    test_results JSONB,
    tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tested_by INTEGER,
    notes TEXT
);

-- -----------------------------------------------------------------------------
-- SECTION 9: SECURITY REPORTS
-- -----------------------------------------------------------------------------

CREATE TABLE security_reports (
    report_id SERIAL PRIMARY KEY,
    report_type VARCHAR(50),
    report_name VARCHAR(100),
    period_start DATE,
    period_end DATE,
    report_data JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by INTEGER,
    status VARCHAR(20) DEFAULT 'generated'
);

CREATE VIEW v_security_incidents_summary AS
SELECT 
    incident_type,
    severity,
    status,
    COUNT(*) as incident_count,
    COUNT(CASE WHEN closed_at IS NOT NULL THEN 1 END) as resolved_count,
    AVG(EXTRACT(EPOCH FROM (COALESCE(closed_at, CURRENT_TIMESTAMP) - detected_at)) / 3600) as avg_resolution_hours
FROM security_incidents
GROUP BY incident_type, severity, status;

CREATE VIEW v_audit_activity_summary AS
SELECT 
    action,
    resource_type,
    COUNT(*) as action_count,
    COUNT(CASE WHEN status = 'failure' THEN 1 END) as failure_count,
    COUNT(DISTINCT user_id) as unique_users
FROM audit_logs
WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY action, resource_type;

CREATE VIEW v_access_review_dashboard AS
SELECT 
    sr.role_name,
    COUNT(DISTINCT ua.user_id) as assigned_users,
    COUNT(DISTINCT ua.expires_at < CURRENT_TIMESTAMP AND ua.is_active) as expired_access,
    COUNT(DISTINCT ar.request_id) as pending_requests
FROM security_roles sr
LEFT JOIN user_access ua ON sr.role_id = ua.role_id
LEFT JOIN access_requests ar ON sr.role_id = ar.role_id AND ar.status = 'pending'
WHERE sr.is_active = TRUE
GROUP BY sr.role_id, sr.role_name;

-- -----------------------------------------------------------------------------
-- SECTION 10: INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_authentication_log_user ON authentication_log(user_id);
CREATE INDEX idx_authentication_log_timestamp ON authentication_log(timestamp);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_data_access_log_user ON data_access_log(user_id);
CREATE INDEX idx_data_access_log_timestamp ON data_access_log(timestamp);
CREATE INDEX idx_incidents_status ON security_incidents(status);
CREATE INDEX idx_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_encryption_keys_status ON encryption_keys(key_status);
CREATE INDEX idx_backup_records_status ON backup_records(status);

-- =============================================================================
-- END OF SECURITY & AUDIT SCHEMA (MODULE 14)
-- =============================================================================
