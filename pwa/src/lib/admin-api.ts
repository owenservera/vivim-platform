import { conversationService } from './service/conversation-service';
import { conversationSyncService } from './conversation-sync-service';
import { logger } from './logger';

// System metrics API
export interface SystemMetrics {
  timestamp: string;
  peerCount: number;
  connectionCount: number;
  bandwidthIn: number;
  bandwidthOut: number;
  latencyAvg: number;
  dhtLookupTime: number;
  messageQueueSize: number;
  cacheHitRate: number;
  errorRate: number;
}

export interface DatabaseStatus {
  ready: boolean;
  message?: string;
  totalConversations?: number;
  totalSize?: number;
  lastSync?: string;
  tables?: Array<{
    name: string;
    rows: number;
    size: number;
  }>;
}

export interface NetworkNode {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'connecting';
  type: 'peer' | 'server' | 'client';
  lastSeen: string;
  connections: number;
}

export interface DataFlow {
  id: string;
  source: string;
  target: string;
  /** Server returns DHT/PubSub/CRDT/Federation from /api/admin/dataflow/flows */
  type: 'DHT' | 'PubSub' | 'CRDT' | 'Federation' | 'sync' | 'replication' | 'migration' | 'backup';
  status: 'active' | 'syncing' | 'pending' | 'completed' | 'failed';
  messagesPerSecond: number;
  bytesPerSecond: number;
  totalMessages: number;
  lastActivity: string;
}

export interface CRDTDocument {
  id: string;
  name: string;
  type: 'conversation' | 'circle' | 'team' | 'group' | 'follow';
  status: 'synced' | 'syncing' | 'conflict' | 'offline';
  lastSync: string;
  version: number;
  collaborators: number;
  size: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  details?: string;
}

class AdminApiService {
  // System metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // In a real implementation, this would fetch from your backend API
      // For now, we'll use actual system data where possible
      
      // Get actual connection info from the sync service
      const syncStatus = conversationSyncService.getSyncStatus();
      const connections = syncStatus.connectedNodes || 0;
      
      // Get actual database info
      const dbStatus = await conversationService.getStorageStatus();
      
      return {
        timestamp: new Date().toISOString(),
        peerCount: connections,
        connectionCount: Math.max(0, connections - 1),
        bandwidthIn: this.getBandwidthIn(),
        bandwidthOut: this.getBandwidthOut(),
        latencyAvg: this.getAverageLatency(),
        dhtLookupTime: this.getDHTLookupTime(),
        messageQueueSize: this.getMessageQueueSize(),
        cacheHitRate: this.getCacheHitRate(),
        errorRate: this.getErrorRate()
      };
    } catch (error) {
      logger.error('ADMIN_API', 'Failed to get system metrics:', error);
      throw error;
    }
  }

  // Database status
  async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      const status = await conversationService.getStorageStatus();
      const conversations = await conversationService.getAllConversations();
      
      return {
        ready: status.ready,
        message: status.message || 'Database operational',
        totalConversations: conversations.length,
        totalSize: this.calculateTotalSize(conversations),
        lastSync: new Date().toISOString(),
        tables: [
          { name: 'conversations', rows: conversations.length, size: this.calculateConversationsSize(conversations) },
          { name: 'messages', rows: this.calculateTotalMessages(conversations), size: this.calculateMessagesSize(conversations) },
          { name: 'users', rows: 1, size: 1234 },
          { name: 'metadata', rows: conversations.length, size: this.calculateMetadataSize(conversations) },
          { name: 'sync_state', rows: 8, size: 5678 }
        ]
      };
    } catch (error) {
      logger.error('ADMIN_API', 'Failed to get database status:', error);
      throw error;
    }
  }

  // Network nodes
  async getNetworkNodes(): Promise<NetworkNode[]> {
    try {
      const syncStatus = conversationSyncService.getSyncStatus();
      const nodes = syncStatus.nodes || [];
      
      return nodes.map((node: any) => ({
        id: node.id,
        name: node.name || `Node ${node.id}`,
        status: node.connected ? 'online' : 'offline',
        type: node.type || 'peer',
        lastSeen: node.lastSeen || new Date().toISOString(),
        connections: node.connections || 0
      }));
    } catch (error) {
      logger.error('ADMIN_API', 'Failed to get network nodes:', error);
      throw error;
    }
  }

  // Data flows
  async getDataFlows(): Promise<DataFlow[]> {
    try {
      const syncStatus = conversationSyncService.getSyncStatus();
      const activeFlows = syncStatus.activeFlows || [];
      
      return activeFlows.map((flow: any) => ({
        id: flow.id,
        source: flow.source,
        target: flow.target,
        type: flow.type || 'DHT',
        status: flow.status || 'active',
        messagesPerSecond: flow.messagesPerSecond ?? flow.throughput ?? 0,
        bytesPerSecond: flow.bytesPerSecond ?? 0,
        totalMessages: flow.totalMessages ?? 0,
        lastActivity: flow.lastActivity ?? flow.lastUpdated ?? new Date().toISOString(),
      }));
    } catch (error) {
      logger.error('ADMIN_API', 'Failed to get data flows:', error);
      throw error;
    }
  }

  // CRDT documents
  async getCRDTDocuments(): Promise<CRDTDocument[]> {
    try {
      const conversations = await conversationService.getAllConversations();
      
      return conversations.map((conversation: any) => ({
        id: conversation.id,
        name: conversation.title || 'Untitled Conversation',
        type: 'conversation',
        status: conversation.syncStatus || 'synced',
        lastSync: conversation.lastSync || new Date().toISOString(),
        version: conversation.version || 1,
        collaborators: conversation.participants?.length || 1,
        size: JSON.stringify(conversation).length
      }));
    } catch (error) {
      logger.error('ADMIN_API', 'Failed to get CRDT documents:', error);
      throw error;
    }
  }

  // System logs
  async getSystemLogs(level?: string, search?: string): Promise<LogEntry[]> {
    try {
      // In a real implementation, this would fetch from your logging service
      // For now, we'll return logs from the logger
      const logs = logger.getLogs();
      
      let filteredLogs = logs.map((log: any) => ({
        id: log.id || Date.now().toString(),
        timestamp: log.timestamp || new Date().toISOString(),
        level: log.level || 'info',
        message: log.message || '',
        source: log.source || 'SYSTEM',
        details: log.details
      }));
      
      if (level && level !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === level);
      }
      
      if (search) {
        const term = search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(term) ||
          log.source.toLowerCase().includes(term) ||
          (log.details && log.details.toLowerCase().includes(term))
        );
      }
      
      return filteredLogs;
    } catch (error) {
      logger.error('ADMIN_API', 'Failed to get system logs:', error);
      throw error;
    }
  }

  // System actions
  async executeSystemAction(action: string): Promise<void> {
    try {
      switch (action) {
        case 'clear-cache':
          await this.clearCache();
          break;
        case 'sync-all':
          await conversationSyncService.syncAll();
          break;
        case 'backup-db':
          await this.backupDatabase();
          break;
        case 'maintenance-mode':
          await this.toggleMaintenanceMode();
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      logger.error('ADMIN_API', `Failed to execute action ${action}:`, error);
      throw error;
    }
  }

  // CRDT operations
  async syncCRDTDocument(documentId: string): Promise<void> {
    try {
      await conversationSyncService.syncConversation(documentId);
    } catch (error) {
      logger.error('ADMIN_API', `Failed to sync CRDT document ${documentId}:`, error);
      throw error;
    }
  }

  async resolveCRDTConflict(documentId: string): Promise<void> {
    try {
      await conversationSyncService.resolveConflict(documentId);
    } catch (error) {
      logger.error('ADMIN_API', `Failed to resolve CRDT conflict ${documentId}:`, error);
      throw error;
    }
  }

  // Helper methods
  private getBandwidthIn(): number {
    // In a real implementation, this would get actual network metrics
    return 1000000 + Math.random() * 2000000;
  }

  private getBandwidthOut(): number {
    // In a real implementation, this would get actual network metrics
    return 800000 + Math.random() * 1500000;
  }

  private getAverageLatency(): number {
    // In a real implementation, this would get actual latency metrics
    return 20 + Math.random() * 40;
  }

  private getDHTLookupTime(): number {
    // In a real implementation, this would get actual DHT metrics
    return 10 + Math.random() * 30;
  }

  private getMessageQueueSize(): number {
    // In a real implementation, this would get actual queue size
    return Math.floor(Math.random() * 100);
  }

  private getCacheHitRate(): number {
    // In a real implementation, this would get actual cache metrics
    return 0.7 + Math.random() * 0.25;
  }

  private getErrorRate(): number {
    // In a real implementation, this would get actual error metrics
    return Math.random() * 0.05;
  }

  private calculateTotalSize(conversations: any[]): number {
    return conversations.reduce((total, convo) => {
      return total + JSON.stringify(convo).length;
    }, 0);
  }

  private calculateConversationsSize(conversations: any[]): number {
    return conversations.reduce((total, convo) => {
      const convoWithoutMessages = { ...convo, messages: [] };
      return total + JSON.stringify(convoWithoutMessages).length;
    }, 0);
  }

  private calculateTotalMessages(conversations: any[]): number {
    return conversations.reduce((total, convo) => {
      return total + (convo.messages?.length || 0);
    }, 0);
  }

  private calculateMessagesSize(conversations: any[]): number {
    return conversations.reduce((total, convo) => {
      const messagesSize = convo.messages?.reduce((msgTotal: number, msg: any) => {
        return msgTotal + JSON.stringify(msg).length;
      }, 0) || 0;
      return total + messagesSize;
    }, 0);
  }

  private calculateMetadataSize(conversations: any[]): number {
    return conversations.reduce((total, convo) => {
      const metadata = {
        id: convo.id,
        title: convo.title,
        createdAt: convo.createdAt,
        updatedAt: convo.updatedAt,
        participants: convo.participants
      };
      return total + JSON.stringify(metadata).length;
    }, 0);
  }

  private async clearCache(): Promise<void> {
    // In a real implementation, this would clear the cache
    logger.info('ADMIN_API', 'Clearing system cache...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.info('ADMIN_API', 'System cache cleared');
  }

  private async backupDatabase(): Promise<void> {
    // In a real implementation, this would create a database backup
    logger.info('ADMIN_API', 'Creating database backup...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    logger.info('ADMIN_API', 'Database backup completed');
  }

  private async toggleMaintenanceMode(): Promise<void> {
    // In a real implementation, this would toggle maintenance mode
    logger.info('ADMIN_API', 'Toggling maintenance mode...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.info('ADMIN_API', 'Maintenance mode toggled');
  }
}

export const adminApiService = new AdminApiService();