/**
 * WebRTC Signaling Server
 * 
 * Handles:
 * - Room management
 * - WebRTC offer/answer/ICE signaling
 * - Yjs sync fallback (when WebRTC fails)
 * - Peer presence tracking
 */

import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../lib/logger.js';

/**
 * Create and configure signaling server
 */
export function createSignalingServer(httpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Configure based on environment
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Room tracking
  const rooms = new Map();

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected to signaling server');

    // Join a room
    socket.on('join', ({ room, peerId }) => {
      socket.join(room);
      
      // Track room membership
      if (!rooms.has(room)) {
        rooms.set(room, new Set());
      }
      rooms.get(room).add({ socketId: socket.id, peerId });

      logger.info({ room, peerId, socketId: socket.id }, 'Peer joined room');

      // Notify other peers in the room
      socket.to(room).emit('peer-joined', { peerId, socketId: socket.id });

      // Send list of existing peers
      const peers = Array.from(rooms.get(room) || [])
        .filter(p => p.socketId !== socket.id)
        .map(p => ({ peerId: p.peerId, socketId: p.socketId }));
      
      socket.emit('peers-list', { peers });
    });

    // Leave a room
    socket.on('leave', ({ room, peerId }) => {
      socket.leave(room);
      
      if (rooms.has(room)) {
        const roomPeers = rooms.get(room);
        roomPeers.delete({ socketId: socket.id, peerId });
        
        if (roomPeers.size === 0) {
          rooms.delete(room);
        }
      }

      socket.to(room).emit('peer-left', { peerId, socketId: socket.id });
      logger.info({ room, peerId }, 'Peer left room');
    });

    // WebRTC signaling: offer
    socket.on('offer', ({ to, offer }) => {
      logger.debug({ from: socket.id, to }, 'Relaying offer');
      io.to(to).emit('offer', { from: socket.id, offer });
    });

    // WebRTC signaling: answer
    socket.on('answer', ({ to, answer }) => {
      logger.debug({ from: socket.id, to }, 'Relaying answer');
      io.to(to).emit('answer', { from: socket.id, answer });
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice', ({ to, candidate }) => {
      logger.debug({ from: socket.id, to }, 'Relaying ICE candidate');
      io.to(to).emit('ice', { from: socket.id, candidate });
    });

    // Yjs sync fallback (when WebRTC fails)
    socket.on('yjs-sync', ({ room, update }) => {
      logger.debug({ room, size: update.length }, 'Relaying Yjs update');
      socket.to(room).emit('yjs-sync', { from: socket.id, update });
    });

    // Awareness (presence) updates
    socket.on('awareness', ({ room, state }) => {
      socket.to(room).emit('awareness', { from: socket.id, state });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
      
      // Remove from all rooms
      for (const [room, peers] of rooms.entries()) {
        const peerData = Array.from(peers).find(p => p.socketId === socket.id);
        if (peerData) {
          peers.delete(peerData);
          socket.to(room).emit('peer-left', { peerId: peerData.peerId, socketId: socket.id });
          
          if (peers.size === 0) {
            rooms.delete(room);
          }
        }
      }
    });
  });

  // Metrics endpoint
  io.of('/').adapter.on('create-room', (room) => {
    logger.debug({ room }, 'Room created');
  });

  io.of('/').adapter.on('delete-room', (room) => {
    logger.debug({ room }, 'Room deleted');
  });

  logger.info('✅ Signaling server initialized');

  return io;
}

export default createSignalingServer;
