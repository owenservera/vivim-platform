import { EventEmitter } from 'events';
import express, { Express, Request, Response } from 'express';
import { createModuleLogger } from '../utils/logger.js';
import type { FederationMessage } from './FederationClient.js';

const log = createModuleLogger('federation:server');

export interface FederationServerConfig {
  port: number;
  did: string;
  instanceUrl: string;
}

export class FederationServer extends EventEmitter {
  private app: Express;
  private config: FederationServerConfig;
  private server: any = null;

  constructor(config: FederationServerConfig) {
    super();
    this.config = config;
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    this.app.get('/.well-known/vivim', this.handleWellKnown.bind(this));
    this.app.get('/actor/:did', this.handleGetActor.bind(this));
    this.app.get('/outbox', this.handleGetOutbox.bind(this));
    this.app.get('/inbox', this.handleGetInbox.bind(this));
    this.app.post('/inbox', this.handleInbox.bind(this));
    this.app.get('/circle/:id', this.handleGetCircle.bind(this));
    this.app.post('/circle/:id/members', this.handleAddMember.bind(this));

    this.app.use((err: Error, _req: Request, res: Response, _next: Function) => {
      log.error({ error: err.message }, 'Request error');
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  private handleWellKnown(_req: Request, res: Response): void {
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

  private handleGetActor(req: Request, res: Response): void {
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

  private handleGetOutbox(_req: Request, res: Response): void {
    res.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${this.config.instanceUrl}/outbox`,
      type: 'OrderedCollection',
      totalItems: 0,
      orderedItems: [],
    });
  }

  private handleGetInbox(_req: Request, res: Response): void {
    res.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${this.config.instanceUrl}/inbox`,
      type: 'OrderedCollection',
      totalItems: 0,
      orderedItems: [],
    });
  }

  private async handleInbox(req: Request, res: Response): Promise<void> {
    const message = req.body as FederationMessage;

    if (!message.id || !message.type) {
      res.status(400).json({ error: 'Invalid message format' });
      return;
    }

    log.info({ type: message.type, from: message.sourceDID }, 'Received federation message');

    try {
      await this.processMessage(message);
      res.status(200).json({ status: 'accepted' });
      this.emit('message:received', message);
    } catch (error) {
      log.error({ error: (error as Error).message }, 'Failed to process message');
      res.status(500).json({ error: 'Processing failed' });
    }
  }

  private async processMessage(message: FederationMessage): Promise<void> {
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

  private async handleContentPush(message: FederationMessage): Promise<void> {
    log.debug({ contentId: (message.payload as any).contentId }, 'Content push received');
    this.emit('content:received', message);
  }

  private async handleFollow(message: FederationMessage): Promise<void> {
    log.debug({ userDid: (message.payload as any).userDid }, 'Follow received');
    this.emit('user:follow', message);
  }

  private async handleUnfollow(message: FederationMessage): Promise<void> {
    log.debug({ userDid: (message.payload as any).userDid }, 'Unfollow received');
    this.emit('user:unfollow', message);
  }

  private async handleCircleInvite(message: FederationMessage): Promise<void> {
    const { circleId, userDid } = message.payload as any;
    log.debug({ circleId, userDid }, 'Circle invite received');
    this.emit('circle:invite', message);
  }

  private async handleSyncRequest(message: FederationMessage): Promise<void> {
    const { since } = message.payload as any;
    log.debug({ since }, 'Sync request received');
    this.emit('sync:requested', message);
  }

  private handleGetCircle(req: Request, res: Response): void {
    const { id } = req.params;
    res.json({
      id: `${this.config.instanceUrl}/circle/${id}`,
      type: 'Circle',
      name: 'Unknown',
    });
  }

  private handleAddMember(req: Request, res: Response): void {
    const { id } = req.params;
    const { userDid } = req.body;

    res.status(201).json({
      id: `${this.config.instanceUrl}/circle/${id}`,
      status: 'member added',
      userDid,
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        log.info({ port: this.config.port }, 'Federation server started');
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
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
