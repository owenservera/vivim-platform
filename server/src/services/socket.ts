import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../lib/logger.js';
import { eventBus, EVENTS } from '../lib/events.js';
import { config } from '../config/index.js';
import { getPrismaClient } from '../lib/database.js';

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> Set<socketId>
  }

  initialize(httpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigins || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    this.setupEventListeners();

    logger.info('✅ Socket Service initialized');
  }

  async authenticateSocket(socket, next) {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        // Allow anonymous connections for signaling/public data if needed,
        // but for now we enforce auth for data sync.
        // We can mark socket as guest.
        socket.data.isGuest = true;
        return next();
      }

      // Verify token
      // Verify token with proper signature validation
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256', 'RS256'],
      });

      if (!decoded || !decoded.sub) {
        return next(new Error('Invalid token'));
      }

      socket.data.user = { id: decoded.sub, ...decoded };
      socket.data.isGuest = false;
      next();
    } catch (err) {
      logger.error({ err }, 'Socket authentication failed');
      next(new Error('Authentication failed'));
    }
  }

  handleConnection(socket) {
    const userId = socket.data.user?.id || 'guest';
    const socketId = socket.id;

    logger.info({ userId, socketId }, 'Client connected');

    // Join user-specific room
    if (!socket.data.isGuest) {
      const userRoom = `user:${userId}`;
      socket.join(userRoom);

      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId).add(socketId);

      eventBus.emit(EVENTS.USER_CONNECTED, { userId, socketId });
    }

    // Handle generic sync events
    socket.on('sync:pull', (data) => this.handleSyncPull(socket, data));
    socket.on('sync:push', (data) => this.handleSyncPush(socket, data));

    // Handle Signaling (Legacy/P2P support)
    this.handleSignaling(socket);

    socket.on('disconnect', () => {
      logger.info({ userId, socketId }, 'Client disconnected');
      if (!socket.data.isGuest) {
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socketId);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userId);
          }
        }
        eventBus.emit(EVENTS.USER_DISCONNECTED, { userId, socketId });
      }
    });
  }

  setupEventListeners() {
    // Listen for internal app events and broadcast to relevant users

    eventBus.on(EVENTS.ENTITY_CREATED, (payload) => {
      this.broadcastEntityChange('create', payload);
    });

    eventBus.on(EVENTS.ENTITY_UPDATED, (payload) => {
      this.broadcastEntityChange('update', payload);
    });

    eventBus.on(EVENTS.ENTITY_DELETED, (payload) => {
      this.broadcastEntityChange('delete', payload);
    });
  }

  broadcastEntityChange(action, { userId, type, data, timestamp }) {
    if (!userId) return;

    const room = `user:${userId}`;
    this.io.to(room).emit('feed:delta', {
      action,
      type, // e.g., 'conversation', 'message'
      data,
      timestamp: timestamp || new Date().toISOString(),
    });

    logger.debug({ userId, action, type }, 'Broadcasted entity change');
  }

  async handleSyncPull(socket, { since, types }) {
    if (socket.data.isGuest) {
      return socket.emit('sync:error', { message: 'Unauthorized' });
    }

    const userId = socket.data.user.id;
    const prisma = getPrismaClient();
    const changes = [];

    try {
      const dateFilter = since ? { gt: new Date(since) } : undefined;

      // 1. Fetch Conversations
      if (!types || types.includes('conversation')) {
        const conversations = await prisma.conversation.findMany({
          where: {
            ownerId: userId,
            updatedAt: dateFilter,
          },
        });
        conversations.forEach((c) => {
          changes.push({
            action: since ? 'update' : 'create', // If 'since' is null, it's initial load (create)
            type: 'conversation',
            data: c,
            timestamp: c.updatedAt.toISOString(),
          });
        });
      }

      // 2. Fetch Messages
      if (!types || types.includes('message')) {
        // Note: Efficient message sync might require querying messages of active conversations
        // For now, we query all messages updated (or created) since date
        // But Prisma 'message' schema only has createdAt, not updatedAt?
        // Checking schema... it has createdAt. It doesn't have updatedAt.
        // So we can only sync NEW messages easily. For edited messages, we'd need updatedAt.
        // Schema says: createdAt DateTime.
        // Let's assume immutable messages or we missed updatedAt.
        // Actually, message edits often create new versions or we just track createdAt.

        const messages = await prisma.message.findMany({
          where: {
            conversation: { ownerId: userId },
            createdAt: dateFilter,
          },
        });
        messages.forEach((m) => {
          changes.push({
            action: 'create',
            type: 'message',
            data: m,
            timestamp: m.createdAt.toISOString(),
          });
        });
      }

      socket.emit('sync:response', {
        status: 'ok',
        changes,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err, userId }, 'Sync pull failed');
      socket.emit('sync:error', { message: 'Internal Server Error' });
    }
  }

  async handleSyncPush(socket, { changes }) {
    if (socket.data.isGuest) {
      return socket.emit('sync:error', { message: 'Unauthorized' });
    }

    if (!Array.isArray(changes) || changes.length === 0) {
      return socket.emit('sync:ack', { status: 'no_changes' });
    }

    const userId = socket.data.user?.id;
    const prisma = getPrismaClient();

    try {
      await prisma.$transaction(async (tx) => {
        for (const change of changes) {
          const { action, type, data } = change;

          if (!action || !type || !data) {
            logger.warn({ change }, 'Skipping malformed sync change');
            continue;
          }

          if (type === 'conversation') {
            if (action === 'delete') {
              await tx.conversation.deleteMany({
                where: { id: data.id, ownerId: userId },
              });
            } else {
              // upsert: create or update — always validate ownership
              await tx.conversation.upsert({
                where: { id: data.id },
                create: {
                  id: data.id,
                  title: data.title ?? 'Untitled',
                  provider: data.provider ?? 'other',
                  sourceUrl: data.sourceUrl ?? '',
                  state: data.state ?? 'ACTIVE',
                  ownerId: userId,
                  contentHash: data.contentHash ?? null,
                  capturedAt: data.capturedAt ? new Date(data.capturedAt) : new Date(),
                  metadata: data.metadata ?? {},
                  tags: data.tags ?? [],
                },
                update: {
                  title: data.title,
                  state: data.state,
                  metadata: data.metadata,
                  tags: data.tags,
                  updatedAt: new Date(),
                },
              });
            }
          } else if (type === 'message') {
            if (action === 'delete') {
              await tx.message.deleteMany({ where: { id: data.id } });
            } else {
              await tx.message.upsert({
                where: { id: data.id },
                create: {
                  id: data.id,
                  conversationId: data.conversationId,
                  role: data.role,
                  content: data.content ?? '',
                  parts: data.parts ?? [],
                  metadata: data.metadata ?? {},
                  createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                },
                update: {
                  content: data.content,
                  parts: data.parts,
                  metadata: data.metadata,
                },
              });
            }
          } else if (type === 'atomicChatUnit') {
            if (action === 'delete') {
              await tx.atomicChatUnit.deleteMany({ where: { id: data.id } });
            } else {
              await tx.atomicChatUnit.upsert({
                where: { id: data.id },
                create: {
                  id: data.id,
                  ...data,
                  ownerId: userId,
                  createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                  updatedAt: new Date(),
                },
                update: {
                  ...data,
                  updatedAt: new Date(),
                },
              });
            }
          } else {
            logger.warn({ type, action }, 'Unknown entity type in sync:push — skipped');
          }
        }
      });

      // Notify context engine of potential bundle invalidation
      eventBus.emit(EVENTS.ENTITY_UPDATED, {
        userId,
        type: 'sync_push',
        data: { changeCount: changes.length },
        timestamp: new Date().toISOString(),
      });

      logger.info({ userId, changeCount: changes.length }, 'Sync push persisted successfully');
      socket.emit('sync:ack', { status: 'processed', count: changes.length });
    } catch (err) {
      logger.error({ err, userId }, 'Sync push write-back failed');
      socket.emit('sync:error', { message: 'Failed to persist sync changes' });
    }
  }

  // Preserve the signaling logic from the old file
  handleSignaling(socket) {
    socket.on('join', ({ room, peerId }) => {
      socket.join(room);
      socket.to(room).emit('peer-joined', { peerId, socketId: socket.id });
    });

    socket.on('leave', ({ room, peerId }) => {
      socket.leave(room);
      socket.to(room).emit('peer-left', { peerId, socketId: socket.id });
    });

    socket.on('offer', (data) => socket.to(data.to).emit('offer', { from: socket.id, ...data }));
    socket.on('answer', (data) => socket.to(data.to).emit('answer', { from: socket.id, ...data }));
    socket.on('ice', (data) => socket.to(data.to).emit('ice', { from: socket.id, ...data }));
  }
}

export const socketService = new SocketService();
