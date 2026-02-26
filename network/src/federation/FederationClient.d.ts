import { EventEmitter } from 'events';
export interface FederationConfig {
    instanceUrl: string;
    did?: string;
    signKey?: Uint8Array;
    verifyKey?: Uint8Array;
}
export interface FederationMessage {
    id: string;
    type: string;
    sourcePDS: string;
    sourceDID: string;
    targetPDS?: string;
    payload: unknown;
    timestamp: number;
    signature?: string;
}
export declare class FederationClient extends EventEmitter {
    private config;
    private messageQueue;
    private processing;
    constructor(config: FederationConfig);
    sendActivity(targetInstance: string, activityType: string, payload: unknown): Promise<void>;
    requestSync(targetInstance: string, sinceTimestamp: number): Promise<void>;
    pushContent(targetInstance: string, contentId: string, content: unknown): Promise<void>;
    inviteToCircle(targetInstance: string, circleId: string, userDid: string): Promise<void>;
    followUser(targetInstance: string, userDid: string): Promise<void>;
    unfollowUser(targetInstance: string, userDid: string): Promise<void>;
    private deliverMessage;
    private queueMessage;
    private processQueue;
    private signMessage;
    verifySignature(message: FederationMessage, signature: string): Promise<boolean>;
    getQueueSize(): number;
}
//# sourceMappingURL=FederationClient.d.ts.map