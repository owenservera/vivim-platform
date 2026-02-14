import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('security:capabilities');

export type CapabilityRight = 'read' | 'write' | 'admin';
export type ResourceType = 'content' | 'circle' | 'profile' | 'storage';

export interface CapabilityConstraints {
  expiresAt?: number;
  maxUses?: number;
  allowedIPs?: string[];
  requires2FA?: boolean;
}

export interface Capability {
  id: string;
  subject: string;
  resource: {
    type: ResourceType;
    id: string;
  };
  rights: CapabilityRight[];
  constraints?: CapabilityConstraints;
  issuer: string;
  signature?: string;
  createdAt: number;
  usedCount: number;
}

export class CapabilityManager extends EventEmitter {
  private capabilities: Map<string, Capability> = new Map();
  private issuedBy: Map<string, Set<string>> = new Map();
  private subjects: Map<string, Set<string>> = new Map();

  async issueCapability(
    subject: string,
    resource: { type: ResourceType; id: string },
    rights: CapabilityRight[],
    issuer: string,
    constraints?: CapabilityConstraints
  ): Promise<Capability> {
    const id = randomBytes(16).toString('hex');

    const capability: Capability = {
      id,
      subject,
      resource,
      rights,
      constraints: {
        ...constraints,
        expiresAt: constraints?.expiresAt || (Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      issuer,
      createdAt: Date.now(),
      usedCount: 0,
    };

    capability.signature = await this.signCapability(capability);

    this.capabilities.set(id, capability);

    const issuerSet = this.issuedBy.get(issuer) || new Set();
    issuerSet.add(id);
    this.issuedBy.set(issuer, issuerSet);

    const subjectSet = this.subjects.get(subject) || new Set();
    subjectSet.add(id);
    this.subjects.set(subject, subjectSet);

    log.info({ id, subject, resource: resource.id }, 'Capability issued');
    this.emit('capability:issued', capability);

    return capability;
  }

  private async signCapability(capability: Capability): Promise<string> {
    const data = `${capability.subject}:${capability.resource.type}:${capability.resource.id}:${capability.rights.join(',')}:${capability.createdAt}`;
    return randomBytes(32).toString('hex') + Buffer.from(data).toString('base64');
  }

  private async verifySignature(capability: Capability): Promise<boolean> {
    return !!capability.signature;
  }

  async verifyCapability(
    capabilityId: string,
    action: CapabilityRight
  ): Promise<{ valid: boolean; capability?: Capability; reason?: string }> {
    const capability = this.capabilities.get(capabilityId);

    if (!capability) {
      return { valid: false, reason: 'Capability not found' };
    }

    const signatureValid = await this.verifySignature(capability);
    if (!signatureValid) {
      return { valid: false, reason: 'Invalid signature' };
    }

    if (capability.constraints?.expiresAt && Date.now() > capability.constraints.expiresAt) {
      return { valid: false, reason: 'Capability expired' };
    }

    if (capability.constraints?.maxUses && capability.usedCount >= capability.constraints.maxUses) {
      return { valid: false, reason: 'Max uses reached' };
    }

    if (!capability.rights.includes(action)) {
      return { valid: false, reason: 'Insufficient rights' };
    }

    capability.usedCount++;
    this.capabilities.set(capabilityId, capability);

    return { valid: true, capability };
  }

  revokeCapability(capabilityId: string): void {
    const capability = this.capabilities.get(capabilityId);
    if (!capability) return;

    this.capabilities.delete(capabilityId);

    const issuerSet = this.issuedBy.get(capability.issuer);
    issuerSet?.delete(capabilityId);

    const subjectSet = this.subjects.get(capability.subject);
    subjectSet?.delete(capabilityId);

    log.info({ id: capabilityId }, 'Capability revoked');
    this.emit('capability:revoked', { id: capabilityId });
  }

  getCapability(id: string): Capability | undefined {
    return this.capabilities.get(id);
  }

  getCapabilitiesForSubject(subject: string): Capability[] {
    const ids = this.subjects.get(subject);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.capabilities.get(id)!).filter(Boolean);
  }

  getIssuedCapabilities(issuer: string): Capability[] {
    const ids = this.issuedBy.get(issuer);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.capabilities.get(id)!).filter(Boolean);
  }

  getCapabilitiesForResource(resourceType: ResourceType, resourceId: string): Capability[] {
    return Array.from(this.capabilities.values()).filter(
      (c) => c.resource.type === resourceType && c.resource.id === resourceId
    );
  }

  revokeAllForSubject(subject: string): void {
    const ids = this.subjects.get(subject);
    if (!ids) return;

    for (const id of ids) {
      this.revokeCapability(id);
    }
  }

  revokeExpired(): number {
    const now = Date.now();
    let revoked = 0;

    for (const [id, capability] of this.capabilities) {
      if (capability.constraints?.expiresAt && now > capability.constraints.expiresAt) {
        this.revokeCapability(id);
        revoked++;
      }
    }

    if (revoked > 0) {
      log.info({ count: revoked }, 'Expired capabilities revoked');
    }

    return revoked;
  }
}
