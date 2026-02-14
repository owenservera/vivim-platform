import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import { mockNetworkNodes, mockConnections, mockMetrics, mockDatabaseTables, mockDataFlows, mockCrdtDocuments, mockLogs } from './lib/mockData'
import Sidebar from './components/Sidebar'
import DatabasePanel from './components/panels/DatabasePanel'
import NetworkPanel from './components/panels/NetworkPanel'
import DataFlowPanel from './components/panels/DataFlowPanel'
import ActionsPanel from './components/panels/ActionsPanel'
import LogsPanel from './components/panels/LogsPanel'

export default function App() {
  const { 
    activePanel, 
    setNetworkNodes, 
    setConnections, 
    addMetric, 
    setTables, 
    setDataFlows, 
    setCrdtDocuments,
    addLog 
  } = useAppStore()

  useEffect(() => {
    setNetworkNodes(mockNetworkNodes)
    setConnections(mockConnections)
    setTables(mockDatabaseTables)
    setDataFlows(mockDataFlows)
    setCrdtDocuments(mockCrdtDocuments)
    mockLogs.forEach(log => addLog(log))

    const interval = setInterval(() => {
      addMetric({
        timestamp: new Date().toISOString(),
        peerCount: 7 + Math.floor(Math.random() * 3),
        connectionCount: 4 + Math.floor(Math.random() * 3),
        bandwidthIn: 1000000 + Math.random() * 2000000,
        bandwidthOut: 800000 + Math.random() * 1500000,
        latencyAvg: 20 + Math.random() * 40,
        dhtLookupTime: 10 + Math.random() * 30,
        messageQueueSize: Math.floor(Math.random() * 100),
        cacheHitRate: 0.7 + Math.random() * 0.25,
        errorRate: Math.random() * 0.05,
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const renderPanel = () => {
    switch (activePanel) {
      case 'database':
        return <DatabasePanel />
      case 'network':
        return <NetworkPanel />
      case 'dataflow':
        return <DataFlowPanel />
      case 'actions':
        return <ActionsPanel />
      case 'logs':
        return <LogsPanel />
      default:
        return <DatabasePanel />
    }
  }

  return (
    <div className="flex h-screen bg-dark-950">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {renderPanel()}
      </main>
    </div>
  )
}
