import { EventEmitter } from 'events';
import express from 'express';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('federation:server');
export class FederationServer extends EventEmitter {
    app;
    config;
    server = null;
    constructor(config) {
        super();
        this.config = config;
        this.app = express();
        this.setupRoutes();
    }
    setupRoutes() {
        this.app.use(express.json());
        this.app.get('/.well-known/vivim', this.handleWellKnown.bind(this));
        this.app.get('/actor/:did', this.handleGetActor.bind(this));
        this.app.get('/outbox', this.handleGetOutbox.bind(this));
        this.app.get('/inbox', this.handleGetInbox.bind(this));
        this.app.post('/inbox', this.handleInbox.bind(this));
        this.app.get('/circle/:id', this.handleGetCircle.bind(this));
        this.app.post('/circle/:id/members', this.handleAddMember.bind(this));
        this.app.use((err, _req, res, _next) => {
            log.error({ error: err.message }, 'Request error');
            res.status(500).json({ error: 'Internal server error' });
        });
    }
    handleWellKnown(_req, res) {
        res.json({
            domain: new URL(this.config.instanceUrl).hostname,
            did: this.config.did,
            services: {
                pds: this.config.instanceUrl,
            },
            protocols: ['vivim/v1'],
            features: ['circles', 'content', 'federation'],
            software: {
                name: 'vivim',
                version: '0.1.0',
            },
        });
    }
    handleGetActor(req, res) {
        const { did } = req.params;
        res.json({
            '@context': ['https://www.w3.org/ns/activitystreams', 'https://vivim.social/vocab'],
            id: `${this.config.instanceUrl}/actor/${did}`,
            type: 'Person',
            preferredUsername: did,
            url: `${this.config.instanceUrl}/profile/${did}`,
            inbox: `${this.config.instanceUrl}/inbox`,
            outbox: `${this.config.instanceUrl}/outbox`,
        });
    }
    handleGetOutbox(_req, res) {
        res.json({
            '@context': 'https://www.w3.org/ns/activitystreams',
            id: `${this.config.instanceUrl}/outbox`,
            type: 'OrderedCollection',
            totalItems: 0,
            orderedItems: [],
        });
    }
    handleGetInbox(_req, res) {
        res.json({
            '@context': 'https://www.w3.org/ns/activitystreams',
            id: `${this.config.instanceUrl}/inbox`,
            type: 'OrderedCollection',
            totalItems: 0,
            orderedItems: [],
        });
    }
    async handleInbox(req, res) {
        const message = req.body;
        if (!message.id || !message.type) {
            res.status(400).json({ error: 'Invalid message format' });
            return;
        }
        log.info({ type: message.type, from: message.sourceDID }, 'Received federation message');
        try {
            await this.processMessage(message);
            res.status(200).json({ status: 'accepted' });
            this.emit('message:received', message);
        }
        catch (error) {
            log.error({ error: error.message }, 'Failed to process message');
            res.status(500).json({ error: 'Processing failed' });
        }
    }
    async processMessage(message) {
        switch (message.type) {
            case 'content.push':
                await this.handleContentPush(message);
                break;
            case 'follow':
                await this.handleFollow(message);
                break;
            case 'unfollow':
                await this.handleUnfollow(message);
                break;
            case 'circle.invite':
                await this.handleCircleInvite(message);
                break;
            case 'sync.request':
                await this.handleSyncRequest(message);
                break;
            default:
                log.warn({ type: message.type }, 'Unknown message type');
        }
    }
    async handleContentPush(message) {
        log.debug({ contentId: message.payload.contentId }, 'Content push received');
        this.emit('content:received', message);
    }
    async handleFollow(message) {
        log.debug({ userDid: message.payload.userDid }, 'Follow received');
        this.emit('user:follow', message);
    }
    async handleUnfollow(message) {
        log.debug({ userDid: message.payload.userDid }, 'Unfollow received');
        this.emit('user:unfollow', message);
    }
    async handleCircleInvite(message) {
        const { circleId, userDid } = message.payload;
        log.debug({ circleId, userDid }, 'Circle invite received');
        this.emit('circle:invite', message);
    }
    async handleSyncRequest(message) {
        const { since } = message.payload;
        log.debug({ since }, 'Sync request received');
        this.emit('sync:requested', message);
    }
    handleGetCircle(req, res) {
        const { id } = req.params;
        res.json({
            id: `${this.config.instanceUrl}/circle/${id}`,
            type: 'Circle',
            name: 'Unknown',
        });
    }
    handleAddMember(req, res) {
        const { id } = req.params;
        const { userDid } = req.body;
        res.status(201).json({
            id: `${this.config.instanceUrl}/circle/${id}`,
            status: 'member added',
            userDid,
        });
    }
    async start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.config.port, () => {
                log.info({ port: this.config.port }, 'Federation server started');
                resolve();
            });
        });
    }
    async stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    log.info('Federation server stopped');
                    resolve();
                });
            });
        }
    }
}
//# sourceMappingURL=FederationServer.js.map