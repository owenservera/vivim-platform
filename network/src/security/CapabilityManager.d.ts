import { EventEmitter } from 'events';
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
export declare class CapabilityManager extends EventEmitter {
    private capabilities;
    private issuedBy;
    private subjects;
    issueCapability(subject: string, resource: {
        type: ResourceType;
        id: string;
    }, rights: CapabilityRight[], issuer: string, constraints?: CapabilityConstraints): Promise<Capability>;
    private signCapability;
    private verifySignature;
    verifyCapability(capabilityId: string, action: CapabilityRight): Promise<{
        valid: boolean;
        capability?: Capability;
        reason?: string;
    }>;
    revokeCapability(capabilityId: string): void;
    getCapability(id: string): Capability | undefined;
    getCapabilitiesForSubject(subject: string): Capability[];
    getIssuedCapabilities(issuer: string): Capability[];
    getCapabilitiesForResource(resourceType: ResourceType, resourceId: string): Capability[];
    revokeAllForSubject(subject: string): void;
    revokeExpired(): number;
}
//# sourceMappingURL=CapabilityManager.d.ts.map