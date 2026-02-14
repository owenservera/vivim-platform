import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncEngine } from './sync-engine';
import { useSyncStore } from './sync-engine';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
  auth: {},
};

vi.mock('socket.io-client', () => ({
  io: () => mockSocket,
}));

// Mock IndexedDBObjectStore
vi.mock('../storage-v2/object-store', () => {
  return {
    IndexedDBObjectStore: vi.fn().mockImplementation(() => ({
      put: vi.fn().mockResolvedValue('hash'),
      delete: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

describe('SyncEngine', () => {
  let engine: SyncEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    useSyncStore.setState({
      isConnected: false,
      status: 'offline',
      lastSync: null,
      error: null,
    });
    // Reset singleton if possible, or just get instance
    engine = SyncEngine.getInstance();
    // Reset private socket property if needed for isolation (TS hack)
    (engine as any).socket = null;
  });

  it('should initialize and connect', () => {
    engine.connect('fake-token');
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('feed:delta', expect.any(Function));
  });

  it('should handle connect event', () => {
    engine.connect('fake-token');
    const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    
    connectCallback();
    
    expect(useSyncStore.getState().isConnected).toBe(true);
    // Should trigger pull
    expect(mockSocket.emit).toHaveBeenCalledWith('sync:pull', expect.any(Object));
  });

  it('should handle disconnect event', () => {
    engine.connect('fake-token');
    const disconnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
    
    disconnectCallback();
    
    expect(useSyncStore.getState().isConnected).toBe(false);
  });
});
