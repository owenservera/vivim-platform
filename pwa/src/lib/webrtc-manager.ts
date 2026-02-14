/**
 * WebRTC P2P Manager
 * 
 * Direct peer-to-peer connections using WebRTC DataChannels:
 * - Low latency (10-50ms vs 50-100ms WebSocket)
 * - High throughput
 * - No relay after connection
 * - Automatic fallback to WebSocket
 */

import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { syncManager } from './sync-manager';
import { useSettingsStore } from './stores';

// ============================================================================
// Types
// ============================================================================

interface PeerConnection {
  peerId: string;
  pc: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  connected: boolean;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice';
  from: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

// ============================================================================
// WebRTC Manager
// ============================================================================

class WebRTCManager {
  private socket: Socket | null = null;
  private peers: Map<string, PeerConnection> = new Map();
  private localPeerId: string = '';
  private room: string = '';
  
  // ICE servers (STUN/TURN)
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];
  
  /**
   * Connect to signaling server and join room
   */
  async connect(signalingUrl: string, room: string, peerId: string): Promise<void> {
    this.localPeerId = peerId;
    this.room = room;
    
    // Connect to signaling server
    this.socket = io(signalingUrl, {
      transports: ['websocket'],
      reconnection: true,
    });
    
    // Setup signaling handlers
    this.socket.on('connect', () => {
      console.log('🔌 Connected to signaling server');
      this.socket!.emit('join', { room, peerId });
    });
    
    this.socket.on('peer-joined', ({ peerId: remotePeerId }: { peerId: string }) => {
      console.log('👤 Peer joined:', remotePeerId);
      this.createPeerConnection(remotePeerId, true); // We initiate
    });
    
    this.socket.on('peer-left', ({ peerId: remotePeerId }: { peerId: string }) => {
      console.log('👋 Peer left:', remotePeerId);
      this.closePeerConnection(remotePeerId);
    });
    
    this.socket.on('offer', ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log('📨 Received offer from:', from);
      this.handleOffer(from, offer);
    });
    
    this.socket.on('answer', ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      console.log('📨 Received answer from:', from);
      this.handleAnswer(from, answer);
    });
    
    this.socket.on('ice', ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      this.handleIceCandidate(from, candidate);
    });
    
    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from signaling server');
      this.closeAllConnections();
    });
  }
  
  /**
   * Disconnect from all peers
   */
  disconnect(): void {
    this.closeAllConnections();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  /**
   * Create a peer connection
   */
  private async createPeerConnection(remotePeerId: string, initiator: boolean): Promise<void> {
    if (this.peers.has(remotePeerId)) {
      console.warn('Peer connection already exists:', remotePeerId);
      return;
    }
    
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    
    const peerConn: PeerConnection = {
      peerId: remotePeerId,
      pc,
      dataChannel: null,
      connected: false,
    };
    
    this.peers.set(remotePeerId, peerConn);
    
    // ICE candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice', {
          to: remotePeerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };
    
    // Connection state
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        peerConn.connected = true;
        console.log('✅ P2P connection established with:', remotePeerId);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeerConnection(remotePeerId);
      }
    };
    
    if (initiator) {
      // Create data channel
      const dc = pc.createDataChannel('sync', {
        ordered: true,
        maxRetransmits: 3,
      });
      
      this.setupDataChannel(dc, remotePeerId);
      peerConn.dataChannel = dc;
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (this.socket) {
        this.socket.emit('offer', {
          to: remotePeerId,
          offer: pc.localDescription!.toJSON(),
        });
      }
    } else {
      // Wait for data channel from remote
      pc.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, remotePeerId);
        peerConn.dataChannel = event.channel;
      };
    }
  }
  
  /**
   * Setup data channel handlers
   */
  private setupDataChannel(dc: RTCDataChannel, remotePeerId: string): void {
    dc.binaryType = 'arraybuffer';
    
    dc.onopen = () => {
      console.log('📡 DataChannel open with:', remotePeerId);
      
      // Send current state
      const doc = syncManager.getDocument();
      if (doc) {
        const update = Y.encodeStateAsUpdate(doc);
        dc.send(update);
        console.log('📤 Sent state:', update.length, 'bytes');
      }
    };
    
    dc.onmessage = (event) => {
      const update = new Uint8Array(event.data);
      console.log('📥 Received update:', update.length, 'bytes');
      
      // Apply update to Yjs document
      syncManager.importBinary(update);
    };
    
    dc.onerror = (error) => {
      console.error('❌ DataChannel error:', error);
    };
    
    dc.onclose = () => {
      console.log('❌ DataChannel closed with:', remotePeerId);
    };
    
    // Listen for local Yjs updates and broadcast
    const doc = syncManager.getDocument();
    if (doc) {
      const updateHandler = (update: Uint8Array, origin: unknown) => {
        if (origin !== 'remote' && dc.readyState === 'open') {
          dc.send(update);
          console.log('📤 Broadcasted update:', update.length, 'bytes');
        }
      };
      
      doc.on('update', updateHandler);
      
      // Cleanup on close
      dc.addEventListener('close', () => {
        doc.off('update', updateHandler);
      });
    }
  }
  
  /**
   * Handle incoming offer
   */
  private async handleOffer(remotePeerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    await this.createPeerConnection(remotePeerId, false);
    
    const peerConn = this.peers.get(remotePeerId);
    if (!peerConn) return;
    
    await peerConn.pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await peerConn.pc.createAnswer();
    await peerConn.pc.setLocalDescription(answer);
    
    if (this.socket) {
      this.socket.emit('answer', {
        to: remotePeerId,
        answer: peerConn.pc.localDescription!.toJSON(),
      });
    }
  }
  
  /**
   * Handle incoming answer
   */
  private async handleAnswer(remotePeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConn = this.peers.get(remotePeerId);
    if (!peerConn) return;
    
    await peerConn.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }
  
  /**
   * Handle ICE candidate
   */
  private async handleIceCandidate(remotePeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConn = this.peers.get(remotePeerId);
    if (!peerConn) return;
    
    await peerConn.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
  
  /**
   * Close a peer connection
   */
  private closePeerConnection(remotePeerId: string): void {
    const peerConn = this.peers.get(remotePeerId);
    if (!peerConn) return;
    
    if (peerConn.dataChannel) {
      peerConn.dataChannel.close();
    }
    
    peerConn.pc.close();
    this.peers.delete(remotePeerId);
    
    console.log('🔌 Closed connection with:', remotePeerId);
  }
  
  /**
   * Close all connections
   */
  private closeAllConnections(): void {
    for (const [peerId] of this.peers) {
      this.closePeerConnection(peerId);
    }
  }
  
  /**
   * Get connected peers
   */
  getConnectedPeers(): string[] {
    return Array.from(this.peers.values())
      .filter(p => p.connected)
      .map(p => p.peerId);
  }
}

// Export singleton
export const webrtcManager = new WebRTCManager();
export default webrtcManager;
