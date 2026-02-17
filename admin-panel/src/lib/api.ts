import type {
  NetworkNode,
  NodeConnection,
  NetworkMetric,
  DatabaseTable,
  QueryResult,
  DataFlow,
  CRDTDocument,
  LogEntry,
  PubSubTopic,
  SystemStats,
  UserStats,
  ConversationStats,
  StorageStats
} from '../types'

// API base URL - points to the main backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Get JWT token from localStorage (if available)
function getAuthToken(): string | undefined {
  if (typeof window !== 'undefined' && localStorage.getItem('admin_token')) {
    return localStorage.getItem('admin_token') || undefined
  }
  return undefined
}

// Generic API request function with JWT support
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  // Add Authorization header if token exists
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${error}`)
  }

  return response.json()
}

// Network API
export const networkApi = {
  // Get all network nodes
  getNodes: (): Promise<NetworkNode[]> =>
    apiRequest<NetworkNode[]>('/admin/network/nodes'),

  // Get node details by ID
  getNode: (id: string): Promise<NetworkNode> =>
    apiRequest<NetworkNode>(`/admin/network/nodes/${id}`),

  // Get all connections
  getConnections: (): Promise<NodeConnection[]> =>
    apiRequest<NodeConnection[]>('/admin/network/connections'),

  // Get network metrics
  getMetrics: (limit: number = 100): Promise<NetworkMetric[]> =>
    apiRequest<NetworkMetric[]>(`/admin/network/metrics?limit=${limit}`),

  // Get latest network metrics
  getLatestMetrics: (): Promise<NetworkMetric> =>
    apiRequest<NetworkMetric>('/admin/network/metrics/latest'),

  // Get network stats summary
  getNetworkStats: (): Promise<{
    totalNodes: number
    activeNodes: number
    totalConnections: number
    activeConnections: number
    avgLatency: number
    totalBandwidth: number
  }> =>
    apiRequest('/admin/network/stats'),
}

// Database API
export const databaseApi = {
  // Get all tables
  getTables: (): Promise<DatabaseTable[]> =>
    apiRequest<DatabaseTable[]>('/admin/database/tables'),

  // Get table details
  getTable: (name: string): Promise<DatabaseTable & { columns: any[] }> =>
    apiRequest<DatabaseTable & { columns: any[] }>(`/admin/database/tables/${name}`),

  // Execute SQL query
  executeQuery: (query: string): Promise<QueryResult> =>
    apiRequest<QueryResult>('/admin/database/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // Get database stats
  getDatabaseStats: (): Promise<{
    totalTables: number
    totalRows: number
    totalSize: string
    performance: {
      avgQueryTime: number
      slowQueries: number
    }
  }> =>
    apiRequest('/admin/database/stats'),
}

// System API
export const systemApi = {
  // Get system stats
  getSystemStats: (): Promise<SystemStats> =>
    apiRequest<SystemStats>('/admin/system/stats'),

  // Get user stats
  getUserStats: (): Promise<UserStats> =>
    apiRequest<UserStats>('/admin/system/users/stats'),

  // Get conversation stats
  getConversationStats: (): Promise<ConversationStats> =>
    apiRequest<ConversationStats>('/admin/system/conversations/stats'),

  // Get storage stats
  getStorageStats: (): Promise<StorageStats> =>
    apiRequest<StorageStats>('/admin/system/storage/stats'),

  // Get system logs
  getLogs: (level?: string, source?: string, limit: number = 100): Promise<LogEntry[]> =>
    apiRequest<LogEntry[]>(`/admin/system/logs?level=${level || ''}&source=${source || ''}&limit=${limit}`),

  // Get system health
  getHealth: (): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: {
      database: 'up' | 'down' | 'degraded'
      network: 'up' | 'down' | 'degraded'
      storage: 'up' | 'down' | 'degraded'
      api: 'up' | 'down' | 'degraded'
    }
    timestamp: string
  }> =>
    apiRequest('/admin/system/health'),
}

// CRDT API
export const crdtApi = {
  // Get all CRDT documents
  getDocuments: (): Promise<CRDTDocument[]> =>
    apiRequest<CRDTDocument[]>('/admin/crdt/documents'),

  // Get document details
  getDocument: (id: string): Promise<CRDTDocument> =>
    apiRequest<CRDTDocument>(`/admin/crdt/documents/${id}`),

  // Get document sync status
  getDocumentSync: (id: string): Promise<{
    status: 'SYNCED' | 'SYNCING' | 'CONFLICT' | 'OFFLINE' | 'ERROR'
    activePeers: number
    lastSyncedAt?: string
    conflicts?: any[]
  }> =>
    apiRequest(`/admin/crdt/documents/${id}/sync`),

  // Resolve document conflicts
  resolveConflict: (documentId: string, resolution: any): Promise<void> =>
    apiRequest(`/admin/crdt/documents/${documentId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    }),
}

// PubSub API
export const pubsubApi = {
  // Get all topics
  getTopics: (): Promise<PubSubTopic[]> =>
    apiRequest<PubSubTopic[]>('/admin/pubsub/topics'),

  // Get topic details
  getTopic: (id: string): Promise<PubSubTopic> =>
    apiRequest<PubSubTopic>(`/admin/pubsub/topics/${id}`),

  // Get topic subscribers
  getTopicSubscribers: (topicId: string): Promise<any[]> =>
    apiRequest<any[]>(`/admin/pubsub/topics/${topicId}/subscribers`),
}

// Data Flow API
export const dataflowApi = {
  // Get all data flows
  getDataFlows: (): Promise<DataFlow[]> =>
    apiRequest<DataFlow[]>('/admin/dataflow/flows'),

  // Get data flow stats
  getDataFlowStats: (): Promise<{
    totalFlows: number
    activeFlows: number
    totalMessagesPerSecond: number
    totalBytesPerSecond: number
  }> =>
    apiRequest('/admin/dataflow/stats'),
}

// Real-time updates via WebSocket
export class RealTimeUpdates {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 1000
  private listeners: Map<string, Function[]> = new Map()

  constructor(private url: string) {}

  connect() {
    try {
      // Add JWT token to WebSocket URL as query parameter
      const token = getAuthToken()
      const wsUrl = token ? `${this.url}?token=${encodeURIComponent(token)}` : this.url

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('Admin WebSocket connected')
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.emit(data.type, data.payload)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('Admin WebSocket disconnected')
        this.reconnect()
      }

      this.ws.onerror = (error) => {
        console.error('Admin WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect admin WebSocket:', error)
      this.reconnect()
    }
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting admin WebSocket (attempt ${this.reconnectAttempts})`)

      setTimeout(() => {
        this.connect()
      }, this.reconnectInterval * this.reconnectAttempts)
    } else {
      console.error('Max admin WebSocket reconnect attempts reached')
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Create real-time updates instance
// Note: WebSocket endpoint not yet implemented on backend
export const realTimeUpdates = new RealTimeUpdates(
  import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws'
)