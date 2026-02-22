import { useEffect, useCallback } from 'react'
import { useAppStore } from './store/appStore'
import { networkApi, databaseApi, systemApi, crdtApi, dataflowApi, realTimeUpdates } from './lib/api'
import Sidebar from './components/Sidebar'
import DatabasePanel from './components/panels/DatabasePanel'
import NetworkPanel from './components/panels/NetworkPanel'
import DataFlowPanel from './components/panels/DataFlowPanel'
import ActionsPanel from './components/panels/ActionsPanel'
import LogsPanel from './components/panels/LogsPanel'
import SystemOverviewPanel from './components/panels/SystemOverviewPanel'
import RealTimeLogsPanel from './components/panels/RealTimeLogsPanel'
import CRDTManagementPanel from './components/panels/CRDTManagementPanel'
import type { NetworkMetric, LogEntry } from './types'

export default function App() {
  const {
    activePanel,
    setNetworkNodes,
    setConnections,
    addMetric,
    setTables,
    setDataFlows,
    setCrdtDocuments,
    addLog,
    setIsLoading
  } = useAppStore()

  // Wrap callbacks to maintain stable references
  const handleNetworkMetric = useCallback((metric: NetworkMetric) => {
    addMetric(metric)
  }, [addMetric])

  const handleSystemLog = useCallback((log: LogEntry) => {
    addLog(log)
  }, [addLog])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch all initial data in parallel
        const [nodes, connections, tables, flows, documents] = await Promise.all([
          networkApi.getNodes().catch(() => []),
          networkApi.getConnections().catch(() => []),
          databaseApi.getTables().catch(() => []),
          dataflowApi.getDataFlows().catch(() => []),
          crdtApi.getDocuments().catch(() => []),
        ])

        setNetworkNodes(nodes)
        setConnections(connections)
        setTables(tables)
        setDataFlows(flows)
        setCrdtDocuments(documents)

        // Fetch initial logs
        try {
          const logs = await systemApi.getLogs(undefined, undefined, 50)
          logs.forEach(log => addLog(log))
        } catch (err) {
          console.warn('Failed to load logs:', err)
        }

        // Connect to real-time updates
        realTimeUpdates.connect()

        // Listen for network metrics updates
        realTimeUpdates.on('network:metric', handleNetworkMetric)

        // Listen for system logs
        realTimeUpdates.on('system:log', handleSystemLog)

      } catch (err) {
        console.error('Failed to load admin data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Cleanup: Properly remove all listeners before disconnecting
    return () => {
      realTimeUpdates.off('network:metric', handleNetworkMetric)
      realTimeUpdates.off('system:log', handleSystemLog)
      realTimeUpdates.disconnect()
    }
  }, [setNetworkNodes, setConnections, setTables, setDataFlows, setCrdtDocuments, addLog, setIsLoading, handleNetworkMetric, handleSystemLog])

  const renderPanel = () => {
    switch (activePanel) {
      case 'overview':
        return <SystemOverviewPanel />
      case 'database':
        return <DatabasePanel />
      case 'network':
        return <NetworkPanel />
      case 'dataflow':
        return <DataFlowPanel />
      case 'crdt':
        return <CRDTManagementPanel />
      case 'realtime-logs':
        return <RealTimeLogsPanel />
      case 'actions':
        return <ActionsPanel />
      case 'logs':
        return <LogsPanel />
      default:
        return <SystemOverviewPanel />
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
