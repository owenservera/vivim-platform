import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { IndexedDBObjectStore } from '../storage-v2/object-store';
import { useIdentityStore } from '../stores';

interface SyncState {
  isConnected: boolean;
  status: 'idle' | 'syncing' | 'error' | 'offline';
  lastSync: string | null;
  error: string | null;
}

interface SyncStore extends SyncState {
  setConnected: (connected: boolean) => void;
  setStatus: (status: SyncState['status']) => void;
  setError: (error: string | null) => void;
  setLastSync: (timestamp: string) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  isConnected: false,
  status: 'offline',
  lastSync: null,
  error: null,
  setConnected: (isConnected) => set({ isConnected, status: isConnected ? 'idle' : 'offline' }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: 'error' }),
  setLastSync: (lastSync) => set({ lastSync }),
}));

export class SyncEngine {
  private socket: Socket | null = null;
  private db: IndexedDBObjectStore;
  private static instance: SyncEngine;

  constructor() {
    this.db = new IndexedDBObjectStore();
  }

  static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  connect(token: string) {
    if (this.socket?.connected) return;

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    
    this.socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      useSyncStore.getState().setConnected(false);
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to Sync Server');
      useSyncStore.getState().setConnected(true);
      // Trigger a pull sync on connect
      this.pullChanges();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from Sync Server');
      useSyncStore.getState().setConnected(false);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Connection Error:', err);
      useSyncStore.getState().setError(err.message);
    });

    this.socket.on('feed:delta', async (delta) => {
      console.log('📩 Received Delta:', delta);
      await this.handleDelta(delta);
    });

    this.socket.on('sync:response', (response) => {
       console.log('📥 Sync Response:', response);
       // TODO: Process bulk changes
       useSyncStore.getState().setLastSync(new Date().toISOString());
    });
  }

  private async handleDelta(delta: any) {
    // Optimistic or authoritative update
    try {
        const { action, type, data } = delta;
        useSyncStore.getState().setStatus('syncing');

        if (action === 'create' || action === 'update') {
            // Check if it fits our ObjectStore model
            // If data is a Node (has id/type/author), save it directly
            if (data.id && data.type) {
                await this.db.put(data);
            } else {
                // Handle specific entities that might need mapping
                // e.g. Settings, Profile
            }
        } else if (action === 'delete') {
             if (data.id) {
                 await this.db.delete(data.id);
             }
        }
        
        useSyncStore.getState().setStatus('idle');
    } catch (err) {
        console.error('Error handling delta:', err);
        useSyncStore.getState().setError('Failed to process update');
    }
  }

  public pullChanges() {
     if (!this.socket?.connected) return;
     const lastSync = useSyncStore.getState().lastSync;
     this.socket.emit('sync:pull', { since: lastSync });
  }

  public pushChanges(changes: any[]) {
      if (!this.socket?.connected) return;
      this.socket.emit('sync:push', { changes });
  }
}

export const syncEngine = SyncEngine.getInstance();
