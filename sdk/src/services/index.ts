/**
 * VIVIM SDK Services Module Exports
 */

// Sharing Encryption Service
export {
  SharingEncryptionService,
  type SharingEncryptionAPI,
  type EncryptedContent,
  type EncryptedAccessGrant,
  type KeyShare,
  type CircleKeyRing,
  type SharingEncryptionEvents,
  type EncryptOptions,
  createSharingEncryptionService,
} from './sharing-encryption-service.js';

// Access Grant Manager
export {
  AccessGrantManager,
  type AccessGrantManagerAPI,
  type EnhancedAccessGrant,
  type GrantType,
  type GrantStatus,
  type GrantAuditEntry,
  type GrantTemplate,
  type GrantRequest,
  type GrantAnalytics,
  type CreateGrantOptions,
  type UpdateGrantOptions,
  type RequestAccessOptions,
  createAccessGrantManager,
} from './access-grant-manager.js';

// Error Reporting Service
export {
  ErrorReportingService,
  type ErrorReportingAPI,
  type ErrorReport,
  type ErrorSeverity,
  type ErrorCategory,
  type ErrorSource,
  type ErrorComponent,
  type ErrorFingerprint,
  type ErrorGroup,
  type ErrorTrend,
  type ErrorSummary,
  type ErrorAlertConfig,
  type ErrorReportingEvents,
  type GetErrorsOptions,
  createErrorReportingService,
} from './error-reporting-service.js';

// Audit Logging Service
export {
  AuditLoggingService,
  type AuditLoggingAPI,
  type AuditEvent,
  type AuditEventType,
  type AuditSeverity,
  type AuditQueryOptions,
  type AuditReport,
  type AuditAnomaly,
  type ComplianceStatus,
  type AuditRetentionPolicy,
  createAuditLoggingService,
} from './audit-logging-service.js';

// SSO Service
export {
  SSOService,
  type SSOServiceAPI,
  type SSOProviderConfig,
  type SSOProviderType,
  type SSOSession,
  type AuthorizationUrlOptions,
  type TokenResponse,
  type UserInfo,
  type SAMLResponse,
  type AttributeMapping,
  createSSOService,
} from './sso-service.js';
