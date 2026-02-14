import { create } from 'zustand'
import type { NetworkNode, NodeConnection, NetworkMetric, DatabaseTable, QueryResult, DataFlow, CRDTDocument, LogEntry } from '../types'

interface AppState {
  activePanel: 'database' | 'network' | 'dataflow' | 'actions' | 'logs'
  setActivePanel: (panel: AppState['activePanel']) => void
  
  networkNodes: NetworkNode[]
  setNetworkNodes: (nodes: NetworkNode[]) => void
  
  connections: NodeConnection[]
  setConnections: (connections: NodeConnection[]) => void
  
  metrics: NetworkMetric[]
  addMetric: (metric: NetworkMetric) => void
  
  tables: DatabaseTable[]
  setTables: (tables: DatabaseTable[]) => void
  
  queryResult: QueryResult | null
  setQueryResult: (result: QueryResult | null) => void
  
  dataFlows: DataFlow[]
  setDataFlows: (flows: DataFlow[]) => void
  
  crdtDocuments: CRDTDocument[]
  setCrdtDocuments: (docs: CRDTDocument[]) => void
  
  logs: LogEntry[]
  addLog: (log: LogEntry) => void
  clearLogs: () => void
  
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activePanel: 'database',
  setActivePanel: (panel) => set({ activePanel: panel }),
  
  networkNodes: [],
  setNetworkNodes: (nodes) => set({ networkNodes: nodes }),
  
  connections: [],
  setConnections: (connections) => set({ connections }),
  
  metrics: [],
  addMetric: (metric) => set((state) => ({
    metrics: [...state.metrics.slice(-99), metric]
  })),
  
  tables: [],
  setTables: (tables) => set({ tables }),
  
  queryResult: null,
  setQueryResult: (result) => set({ queryResult: result }),
  
  dataFlows: [],
  setDataFlows: (flows) => set({ dataFlows: flows }),
  
  crdtDocuments: [],
  setCrdtDocuments: (docs) => set({ crdtDocuments: docs }),
  
  logs: [],
  addLog: (log) => set((state) => ({
    logs: [log, ...state.logs.slice(0, 999)]
  })),
  clearLogs: () => set({ logs: [] }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
