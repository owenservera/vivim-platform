/**
 * VIVIM KYC Manager
 * 
 * Privacy-Preserving Identity Verification with Regional Compliance
 * 
 * Verification Tiers:
 * - Tier 0: Anonymous (cryptographic identity only)
 * - Tier 1: Email verified
 * - Tier 2: Human verified (phone, WorldID, or document)
 * - Tier 3: Regional compliance (GDPR, CCPA, etc.)
 * 
 * Features:
 * - Zero-knowledge proofs where possible
 * - Localized verification requirements
 * - Privacy-first design (user controls data)
 * - Credential revocation support
 */

import type { DID, Hash, ISO8601, Signature } from '../storage-v2/types';
import { asDID, asHash, asSignature, asISO8601 } from '../storage-v2/types';
import { sha3_256 } from '../storage-v2/secure-crypto';
import { identityService } from './identity-service';
import { log } from '../logger';

// ============================================================================
// Types
// ============================================================================

export type VerificationTier = 0 | 1 | 2 | 3;

export type VerificationType = 
  | 'email'
  | 'phone'
  | 'worldid'           // World ID (Proof of Personhood)
  | 'document'          // Government ID
  | 'biometric'         // Face/Fingerprint
  | 'social'            // Social account linkage
  | 'age_gate';         // Age verification only

export type RegionCode = 
  | 'EU'                // European Union (GDPR)
  | 'US'                // United States (CCPA)
  | 'UK'                // United Kingdom
  | 'IN'                // India
  | 'BR'                // Brazil (LGPD)
  | 'AU'                // Australia
  | 'CA'                // Canada
  | 'JP'                // Japan
  | 'KR'                // South Korea
  | 'GLOBAL';           // No specific region

export interface VerificationCredential {
  id: string;
  type: VerificationType;
  tier: VerificationTier;
  issuedAt: ISO8601;
  expiresAt?: ISO8601;
  region?: RegionCode;
  
  // Zero-Knowledge
  proof: string;                    // ZK proof of verification
  nullifier: string;                // Prevents double-use
  
  // Issuer
  issuerDID: DID;
  issuerName: string;
  issuerSignature: Signature;
  
  // Revocation
  revocationHash?: Hash;            // For checking revocation status
  status: 'valid' | 'expired' | 'revoked';
}

export interface VerificationRequest {
  type: VerificationType;
  region?: RegionCode;
  metadata?: Record<string, unknown>;
}

export interface VerificationResult {
  success: boolean;
  credential?: VerificationCredential;
  error?: string;
  nextStep?: string;
}

export interface RegionalRequirements {
  region: RegionCode;
  requiredVerifications: VerificationType[];
  optionalVerifications: VerificationType[];
  ageRestriction?: number;
  dataRetentionDays?: number;
  rightToErasure: boolean;
  consentRequired: boolean;
  legalBasis: string;
}

// ============================================================================
// Regional Compliance Configuration
// ============================================================================

const REGIONAL_REQUIREMENTS: Record<RegionCode, RegionalRequirements> = {
  EU: {
    region: 'EU',
    requiredVerifications: ['email'],
    optionalVerifications: ['phone', 'document', 'age_gate'],
    ageRestriction: 16,
    dataRetentionDays: 365,
    rightToErasure: true,
    consentRequired: true,
    legalBasis: 'GDPR Article 6(1)(a) - Consent'
  },
  US: {
    region: 'US',
    requiredVerifications: ['email'],
    optionalVerifications: ['phone', 'document'],
    ageRestriction: 13,
    dataRetentionDays: undefined, // No mandatory limit
    rightToErasure: true, // CCPA
    consentRequired: false,
    legalBasis: 'CCPA Compliance'
  },
  UK: {
    region: 'UK',
    requiredVerifications: ['email'],
    optionalVerifications: ['phone', 'document', 'age_gate'],
    ageRestriction: 13,
    dataRetentionDays: 365,
    rightToErasure: true,
    consentRequired: true,
    legalBasis: 'UK GDPR'
  },
  IN: {
    region: 'IN',
    requiredVerifications: ['email'],
    optionalVerifications: ['phone', 'document'], // Aadhaar optional
    ageRestriction: 18,
    dataRetentionDays: undefined,
    rightToErasure: false,
    consentRequired: true,
    legalBasis: 'Information Technology Act 2000'
  },
  BR: {
    region: 'BR',
    requiredVerifications: ['email'],
    optionalVerifications: ['phone', 'document'],
    ageRestriction: 18,
    dataRetentionDays: 365,
    rightToErasure: true,
    consentRequired: true,
    legalBasis: 'LGPD - Lei Geral de Proteção de Dados'
  },
  AU: {
    region: 'AU',
    requiredVerifications: ['email'],
    optionalVerifications: ['phone', 'document'],
    ageRestriction: 15,
    dataRetentionDays: undefined,
    rightToErasure: false,
    consentRequired: true,
    legalBasis: 'Privacy Act 1988'
  },
  CA: {
    region: 'CA',
    requiredVerifications: ['email'],
    optionalVerifications: ['phone', 'document'],
    ageRestriction: 13,
    dataRetentionDays: undefined,
    rightToErasure: true,
    consentRequired: true,
    legalBasis: 'PIPEDA'
  },
  JP: {
    region: 'JP',
    requiredVerifications: ['email'],
    optionalVerifications: ['phone', 'document'],
    ageRestriction: 15,
    dataRetentionDays: undefined,
    rightToErasure: false,
    consentRequired: true,
    legalBasis: 'APPI'
  },
  KR: {
    region: 'KR',
    requiredVerifications: ['email'],
    optionalVerifications: ['phone', 'document'],
    ageRestriction: 14,
    dataRetentionDays: undefined,
    rightToErasure: true,
    consentRequired: true,
    legalBasis: 'PIPA'
  },
  GLOBAL: {
    region: 'GLOBAL',
    requiredVerifications: [],
    optionalVerifications: ['email', 'phone', 'worldid'],
    ageRestriction: undefined,
    dataRetentionDays: undefined,
    rightToErasure: false,
    consentRequired: false,
    legalBasis: 'None'
  }
};

// ============================================================================
// KYC Manager
// ============================================================================

class KYCManager {
  private credentials: VerificationCredential[] = [];
  private region: RegionCode = 'GLOBAL';
  private consents: Map<string, boolean> = new Map();

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async initialize(): Promise<void> {
    // Load saved credentials
    const saved = localStorage.getItem('openscroll_kyc_credentials');
    if (saved) {
      this.credentials = JSON.parse(saved);
    }

    // Load region
    const savedRegion = localStorage.getItem('openscroll_kyc_region');
    if (savedRegion) {
      this.region = savedRegion as RegionCode;
    } else {
      this.region = await this.detectRegion();
    }

    // Load consents
    const savedConsents = localStorage.getItem('openscroll_kyc_consents');
    if (savedConsents) {
      this.consents = new Map(JSON.parse(savedConsents));
    }

    log.identity?.info('KYC Manager initialized', { region: this.region });
  }

  // ==========================================================================
  // Region Detection
  // ==========================================================================

  /**
   * Detect user's region from browser/timezone
   */
  private async detectRegion(): Promise<RegionCode> {
    try {
      // Try timezone-based detection
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // EU timezones
      if (timezone.startsWith('Europe/')) {
        // Check for UK specifically
        if (timezone === 'Europe/London') return 'UK';
        return 'EU';
      }
      
      // US timezones
      if (timezone.startsWith('America/') && 
          ['New_York', 'Chicago', 'Denver', 'Los_Angeles'].some(c => timezone.includes(c))) {
        return 'US';
      }
      
      // Other regions
      if (timezone.startsWith('Asia/Kolkata') || timezone.startsWith('Asia/Calcutta')) return 'IN';
      if (timezone.startsWith('America/Sao_Paulo')) return 'BR';
      if (timezone.startsWith('Australia/')) return 'AU';
      if (timezone.startsWith('America/Toronto')) return 'CA';
      if (timezone.startsWith('Asia/Tokyo')) return 'JP';
      if (timezone.startsWith('Asia/Seoul')) return 'KR';

      return 'GLOBAL';
    } catch {
      return 'GLOBAL';
    }
  }

  /**
   * Set user's region (for explicit selection)
   */
  setRegion(region: RegionCode): void {
    this.region = region;
    localStorage.setItem('openscroll_kyc_region', region);
    log.identity?.info('Region set', { region });
  }

  /**
   * Get current region
   */
  getRegion(): RegionCode {
    return this.region;
  }

  /**
   * Get requirements for current region
   */
  getRequirements(): RegionalRequirements {
    return REGIONAL_REQUIREMENTS[this.region];
  }

  // ==========================================================================
  // Verification Tier
  // ==========================================================================

  /**
   * Get current verification tier
   */
  getCurrentTier(): VerificationTier {
    const validCredentials = this.credentials.filter(c => c.status === 'valid');
    if (validCredentials.length === 0) return 0;

    // Get highest tier from valid credentials
    return Math.max(...validCredentials.map(c => c.tier)) as VerificationTier;
  }

  /**
   * Check if user meets minimum tier
   */
  meetsTier(requiredTier: VerificationTier): boolean {
    return this.getCurrentTier() >= requiredTier;
  }

  // ==========================================================================
  // Verification Methods
  // ==========================================================================

  /**
   * Start email verification
   */
  async startEmailVerification(email: string): Promise<VerificationResult> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Create verification hash (ZK - we don't store the email)
      const emailHash = await sha3_256(email.toLowerCase());
      const nullifier = await sha3_256(`email:${emailHash}:${Date.now()}`);

      // In production: Send to backend to trigger email
      // For now, simulate sending
      log.identity?.info('Email verification started', { emailHash: emailHash.slice(0, 16) });

      return {
        success: true,
        nextStep: 'Check your email for verification code'
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Complete email verification with code
   */
  async completeEmailVerification(
    email: string,
    code: string
  ): Promise<VerificationResult> {
    try {
      // In production: Verify code with backend
      // For demo: Accept any 6-digit code
      if (!/^\d{6}$/.test(code)) {
        return { success: false, error: 'Invalid verification code' };
      }

      const emailHash = await sha3_256(email.toLowerCase());
      const nullifier = await sha3_256(`email:${emailHash}:verified`);

      const credential = await this.createCredential({
        type: 'email',
        tier: 1,
        proofData: emailHash,
        nullifier
      });

      return { success: true, credential };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Start phone verification
   */
  async startPhoneVerification(
    phoneNumber: string,
    countryCode: string
  ): Promise<VerificationResult> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      const fullNumber = `+${countryCode}${normalizedPhone}`;

      // Validate
      if (normalizedPhone.length < 6 || normalizedPhone.length > 15) {
        return { success: false, error: 'Invalid phone number' };
      }

      // Create hash
      const phoneHash = await sha3_256(fullNumber);

      log.identity?.info('Phone verification started', { hash: phoneHash.slice(0, 16) });

      return {
        success: true,
        nextStep: 'Enter the SMS code sent to your phone'
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Start World ID verification (Proof of Personhood)
   */
  async startWorldIDVerification(): Promise<VerificationResult> {
    try {
      // In production: Integrate with World ID SDK
      // https://docs.worldcoin.org/
      
      log.identity?.info('World ID verification requested');

      return {
        success: true,
        nextStep: 'Complete verification in World App'
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Complete World ID verification
   */
  async completeWorldIDVerification(
    proof: string,
    nullifierHash: string
  ): Promise<VerificationResult> {
    try {
      // In production: Verify proof with World ID
      const credential = await this.createCredential({
        type: 'worldid',
        tier: 2,
        proofData: proof,
        nullifier: nullifierHash
      });

      return { success: true, credential };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Start age verification (for regions requiring it)
   */
  async verifyAge(birthDate: Date): Promise<VerificationResult> {
    try {
      const requirements = this.getRequirements();
      if (!requirements.ageRestriction) {
        return { success: true }; // No age restriction
      }

      const age = this.calculateAge(birthDate);
      if (age < requirements.ageRestriction) {
        return {
          success: false,
          error: `You must be at least ${requirements.ageRestriction} years old in ${requirements.region}`
        };
      }

      // Create age verification credential (ZK - we don't store birthdate)
      const ageProof = await sha3_256(`age:${age >= requirements.ageRestriction}:${Date.now()}`);
      const nullifier = await sha3_256(`age:${requirements.region}:verified`);

      const credential = await this.createCredential({
        type: 'age_gate',
        tier: 1, // Age gate is tier 1
        proofData: ageProof,
        nullifier
      });

      return { success: true, credential };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // ==========================================================================
  // Credential Management
  // ==========================================================================

  /**
   * Create a verification credential
   */
  private async createCredential(params: {
    type: VerificationType;
    tier: VerificationTier;
    proofData: string;
    nullifier: string;
  }): Promise<VerificationCredential> {
    const did = identityService.getDID();
    if (!did) throw new Error('No identity found');

    // Self-issued credential (in production, use trusted issuer)
    const credential: VerificationCredential = {
      id: crypto.randomUUID(),
      type: params.type,
      tier: params.tier,
      issuedAt: asISO8601(new Date().toISOString()),
      region: this.region,
      proof: params.proofData,
      nullifier: params.nullifier,
      issuerDID: did, // Self-issued
      issuerName: 'OpenScroll Self-Attestation',
      issuerSignature: identityService.isUnlocked() 
        ? identityService.sign(`credential:${params.type}:${params.nullifier}`)
        : asSignature(''),
      status: 'valid'
    };

    // Add to credentials
    this.credentials.push(credential);
    this.saveCredentials();

    // Update identity tier
    const identity = identityService.getIdentity();
    if (identity) {
      identity.verificationTier = this.getCurrentTier();
    }

    log.identity?.info('Credential created', { type: params.type, tier: params.tier });
    return credential;
  }

  /**
   * Get all credentials
   */
  getCredentials(): VerificationCredential[] {
    return this.credentials.filter(c => c.status === 'valid');
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(credentialId: string): Promise<boolean> {
    const credential = this.credentials.find(c => c.id === credentialId);
    if (!credential) return false;

    credential.status = 'revoked';
    this.saveCredentials();

    log.identity?.info('Credential revoked', { id: credentialId });
    return true;
  }

  // ==========================================================================
  // Consent Management (GDPR/Privacy Compliance)
  // ==========================================================================

  /**
   * Record user consent
   */
  recordConsent(purpose: string, granted: boolean): void {
    this.consents.set(purpose, granted);
    localStorage.setItem('openscroll_kyc_consents', 
      JSON.stringify(Array.from(this.consents.entries())));
    
    log.identity?.info('Consent recorded', { purpose, granted });
  }

  /**
   * Check if consent exists
   */
  hasConsent(purpose: string): boolean {
    return this.consents.get(purpose) === true;
  }

  /**
   * Get all consents
   */
  getAllConsents(): Record<string, boolean> {
    return Object.fromEntries(this.consents);
  }

  /**
   * Withdraw all consents (right to erasure)
   */
  async withdrawAllConsents(): Promise<void> {
    this.consents.clear();
    localStorage.removeItem('openscroll_kyc_consents');
    
    // In GDPR regions, also delete all credentials
    if (['EU', 'UK', 'BR'].includes(this.region)) {
      this.credentials = [];
      this.saveCredentials();
    }

    log.identity?.info('All consents withdrawn');
  }

  // ==========================================================================
  // Data Export (GDPR Article 20)
  // ==========================================================================

  /**
   * Export all user data (right to portability)
   */
  async exportUserData(): Promise<string> {
    const data = {
      exportedAt: new Date().toISOString(),
      region: this.region,
      identity: identityService.getIdentity(),
      devices: identityService.getDevices(),
      credentials: this.credentials.map(c => ({
        ...c,
        // Don't export sensitive proofs
        proof: '[REDACTED]',
        nullifier: '[REDACTED]'
      })),
      consents: this.getAllConsents()
    };

    return JSON.stringify(data, null, 2);
  }

  // ==========================================================================
  // Persistence
  // ==========================================================================

  private saveCredentials(): void {
    localStorage.setItem('openscroll_kyc_credentials', 
      JSON.stringify(this.credentials));
  }
}

// Export singleton
export const kycManager = new KYCManager();
export default kycManager;
