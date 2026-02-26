import { EventEmitter } from 'events';
export interface FederationServerConfig {
    port: number;
    did: string;
    instanceUrl: string;
}
export declare class FederationServer extends EventEmitter {
    private app;
    private config;
    private server;
    constructor(config: FederationServerConfig);
    private setupRoutes;
    private handleWellKnown;
    private handleGetActor;
    private handleGetOutbox;
    private handleGetInbox;
    private handleInbox;
    private processMessage;
    private handleContentPush;
    private handleFollow;
    private handleUnfollow;
    private handleCircleInvite;
    private handleSyncRequest;
    private handleGetCircle;
    private handleAddMember;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=FederationServer.d.ts.map