import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('security:capabilities');
export class CapabilityManager extends EventEmitter {
    capabilities = new Map();
    issuedBy = new Map();
    subjects = new Map();
    async issueCapability(subject, resource, rights, issuer, constraints) {
        const id = randomBytes(16).toString('hex');
        const capability = {
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
    async signCapability(capability) {
        const data = `${capability.subject}:${capability.resource.type}:${capability.resource.id}:${capability.rights.join(',')}:${capability.createdAt}`;
        return randomBytes(32).toString('hex') + Buffer.from(data).toString('base64');
    }
    async verifySignature(capability) {
        return !!capability.signature;
    }
    async verifyCapability(capabilityId, action) {
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
    revokeCapability(capabilityId) {
        const capability = this.capabilities.get(capabilityId);
        if (!capability)
            return;
        this.capabilities.delete(capabilityId);
        const issuerSet = this.issuedBy.get(capability.issuer);
        issuerSet?.delete(capabilityId);
        const subjectSet = this.subjects.get(capability.subject);
        subjectSet?.delete(capabilityId);
        log.info({ id: capabilityId }, 'Capability revoked');
        this.emit('capability:revoked', { id: capabilityId });
    }
    getCapability(id) {
        return this.capabilities.get(id);
    }
    getCapabilitiesForSubject(subject) {
        const ids = this.subjects.get(subject);
        if (!ids)
            return [];
        return Array.from(ids).map((id) => this.capabilities.get(id)).filter(Boolean);
    }
    getIssuedCapabilities(issuer) {
        const ids = this.issuedBy.get(issuer);
        if (!ids)
            return [];
        return Array.from(ids).map((id) => this.capabilities.get(id)).filter(Boolean);
    }
    getCapabilitiesForResource(resourceType, resourceId) {
        return Array.from(this.capabilities.values()).filter((c) => c.resource.type === resourceType && c.resource.id === resourceId);
    }
    revokeAllForSubject(subject) {
        const ids = this.subjects.get(subject);
        if (!ids)
            return;
        for (const id of ids) {
            this.revokeCapability(id);
        }
    }
    revokeExpired() {
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
//# sourceMappingURL=CapabilityManager.js.map