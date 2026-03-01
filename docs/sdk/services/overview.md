# Services

The SDK provides a set of high-level services that simplify complex operations like encryption, access control, and identity management.

## Available Services

### 1. Access Grant Manager (`sdk/src/services/access-grant-manager.ts`)
Manages sovereign permissions and capability-based access control (CapBAC).

### 2. Sharing Encryption Service (`sdk/src/services/sharing-encryption-service.ts`)
Handles E2EE for shared content, ensuring that only intended recipients can decrypt data.

### 3. Audit Logging (`sdk/src/services/audit-logging-service.ts`)
Provides a verifiable record of all sensitive operations performed on a user's knowledge graph.

### 4. SSO & Auth (`sdk/src/services/sso-service.ts`)
Decentralized Single Sign-On using DIDs and verifiable credentials.

### 5. Error Reporting (`sdk/src/services/error-reporting-service.ts`)
A centralized service for tracking and aggregating errors across the VIVIM ecosystem.

## Integration

Services are typically initialized during the SDK startup process and are available on the `Vivim` instance.
