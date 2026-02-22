-- =============================================================================
-- VIVIM Digital Twin - Seed Data for Security & Audit (Module 14)
-- =============================================================================

INSERT INTO security_policies (policy_name, policy_code, policy_type, description, status, rules, effective_from) VALUES
('Minimum Password Policy', 'SEC-POL-001', 'authentication', 'Password complexity requirements', 'active', '{"min_length": 12, "require_uppercase": true, "require_numbers": true, "require_special": true}', '2026-01-01'),
('MFA Requirement', 'SEC-POL-002', 'authentication', 'Multi-factor authentication for sensitive actions', 'active', '{"required_for": ["transactions", "governance_votes", "settings_change"], "mfa_types": ["totp", "hardware"]}', '2026-01-01'),
('Data Encryption Policy', 'SEC-POL-003', 'encryption', 'Encryption standards for data at rest and in transit', 'active', '{"algorithm": "AES-256", "tls_version": "1.3", "key_rotation_days": 90}', '2026-01-01'),
('Access Control Policy', 'SEC-POL-004', 'access', 'Role-based access control requirements', 'active', '{"principle": "least_privilege", "max_session_hours": 8, "require_approval": true}', '2026-01-01'),
('Incident Response Plan', 'SEC-POL-005', 'incident', 'Security incident response procedures', 'active', '{"response_time_slack": 15, "escalation_levels": 3, "notify_authorities": true}', '2026-01-01'),
('Data Retention Policy', 'SEC-POL-006', 'data', 'Data retention and deletion procedures', 'active', '{"default_retention_days": 730, "secure_deletion": true}', '2026-01-01');

INSERT INTO security_roles (role_name, role_code, description, permissions, is_system_role) VALUES
('Super Admin', 'ROLE-SUPER-ADMIN', 'Full system access', '{"all": true}', TRUE),
('Security Admin', 'ROLE-SEC-ADMIN', 'Security and audit access', '{"users": ["read", "write"], "audit": ["read", "write"], "security": ["all"]}', TRUE),
('Compliance Officer', 'ROLE-COMPLIANCE', 'Compliance and KYC access', '{"kyc": ["all"], "compliance": ["all"], "users": ["read"]}', TRUE),
('Treasury Manager', 'ROLE-TREASURY', 'Treasury operations', '{"treasury": ["all"], "transactions": ["read", "write"]}', TRUE),
('Community Manager', 'ROLE-COMMUNITY', 'Community moderation', '{"community": ["all"], "users": ["read", "write"]}', TRUE),
('Developer', 'ROLE-DEVELOPER', 'Development access', '{"code": ["all"], "infrastructure": ["read"], "deploy": true}', TRUE),
('Auditor', 'ROLE-AUDITOR', 'Read-only audit access', '{"all": ["read"], "audit": ["write"]}', TRUE);

INSERT INTO encryption_keys (key_name, key_type, key_algorithm, key_length, key_status, expires_at) VALUES
('Master Encryption Key', 'symmetric', 'AES', 256, 'active', '2026-06-30'),
('Signing Key Primary', 'signing', 'ECDSA', 256, 'active', '2026-12-31'),
('Backup Encryption Key', 'symmetric', 'AES', 256, 'active', '2027-01-01');

INSERT INTO backup_configurations (backup_type, target_system, schedule_cron, retention_days, encryption_enabled, storage_location) VALUES
('Database Full', 'postgresql', '0 2 * * *', 365, TRUE, 's3://vivim-backups/database'),
('Database Incremental', 'postgresql', '0 */6 * * *', 90, TRUE, 's3://vivim-backups/incremental'),
('File Storage', 's3', '0 3 * * *', 180, TRUE, 's3://vivim-backups/files'),
('Configuration', 'git', '0 */4 * * *', 730, TRUE, 's3://vivim-backups/config'),
('Audit Logs', 'logs', '0 */2 * * *', 365, TRUE, 's3://vivim-backups/audit');
