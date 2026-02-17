import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import {
  GitBranch,
  Users,
  RefreshCw,
  AlertTriangle,
  Edit,
  Download,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { crdtApi, realTimeUpdates } from '../../lib/api'
import type { CRDTDocument } from '../../types'

const SyncStatusColors = {
  SYNCED: 'text-accent-green',
  SYNCING: 'text-accent-cyan',
  CONFLICT: 'text-accent-orange',
  OFFLINE: 'text-dark-400',
  ERROR: 'text-accent-red',
}

const SyncStatusBadgeColors = {
  SYNCED: 'bg-accent-green/20 text-accent-green',
  SYNCING: 'bg-accent-cyan/20 text-accent-cyan',
  CONFLICT: 'bg-accent-orange/20 text-accent-orange',
  OFFLINE: 'bg-dark-700 text-dark-300',
  ERROR: 'bg-accent-red/20 text-accent-red',
}

const DocTypeIcons = {
  conversation: GitBranch,
  circle: Users,
  profile: Users,
  message: GitBranch,
}

const DocTypeColors = {
  conversation: 'text-accent-cyan',
  circle: 'text-accent-purple',
  profile: 'text-accent-green',
  message: 'text-accent-orange',
}

export default function CRDTManagementPanel() {
  const [documents, setDocuments] = useState<CRDTDocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<CRDTDocument | null>(null)
  const [documentDetails, setDocumentDetails] = useState<any>(null)
  const [conflicts, setConflicts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([])
  const [selectedSyncStatuses] = useState<string[]>([])

  // Fetch all CRDT documents
  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const docs = await crdtApi.getDocuments()
      setDocuments(docs)
      
      // Extract unique document types
      const docTypes = Array.from(new Set(docs.map(doc => doc.docType)))
      if (selectedDocTypes.length === 0) {
        setSelectedDocTypes(docTypes)
      }
    } catch (error) {
      console.error('Failed to fetch CRDT documents:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch document details
  const fetchDocumentDetails = async (docId: string) => {
    try {
      const [details, syncInfo] = await Promise.all([
        crdtApi.getDocument(docId),
        crdtApi.getDocumentSync(docId)
      ])
      
      setDocumentDetails(details)
      if (syncInfo.conflicts) {
        setConflicts(syncInfo.conflicts)
      }
    } catch (error) {
      console.error('Failed to fetch document details:', error)
    }
  }

  // Resolve document conflicts
  const resolveConflict = async (documentId: string, resolution: any) => {
    try {
      await crdtApi.resolveConflict(documentId, resolution)
      // Refresh document details
      await fetchDocumentDetails(documentId)
      // Refresh documents list
      await fetchDocuments()
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
    }
  }

  useEffect(() => {
    fetchDocuments()

    // Set up real-time CRDT updates
    const handleUpdate = (data: CRDTDocument) => {
      setDocuments(prev => {
        const index = prev.findIndex(doc => doc.id === data.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = data
          return updated
        }
        return [...prev, data]
      })

      // Update selected document if it's the one being updated
      if (selectedDocument && selectedDocument.id === data.id) {
        setSelectedDocument(data)
        fetchDocumentDetails(data.id)
      }
    }

    realTimeUpdates.on('crdt_document_updated', handleUpdate)

    return () => {
      realTimeUpdates.off('crdt_document_updated', handleUpdate)
    }
  }, [selectedDocument])

  // Filter documents based on search term and selected filters
  const filteredDocuments = documents.filter(doc => {
    // Apply search term
    if (searchTerm && !doc.docId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    // Apply document type filter
    if (selectedDocTypes.length > 0 && !selectedDocTypes.includes(doc.docType)) {
      return false
    }
    
    // Apply sync status filter
    if (selectedSyncStatuses.length > 0 && !selectedSyncStatuses.includes(doc.syncStatus)) {
      return false
    }
    
    return true
  })

  // Group documents by type for stats
  const documentsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.docType]) {
      acc[doc.docType] = { total: 0, synced: 0, syncing: 0, conflict: 0, offline: 0, error: 0 }
    }
    acc[doc.docType].total++
    acc[doc.docType][doc.syncStatus.toLowerCase()]++
    return acc
  }, {} as Record<string, any>)

  // Prepare data for charts
  const syncStatusData = [
    { status: 'Synced', count: documents.filter(d => d.syncStatus === 'SYNCED').length, color: '#10b981' },
    { status: 'Syncing', count: documents.filter(d => d.syncStatus === 'SYNCING').length, color: '#00d4ff' },
    { status: 'Conflict', count: documents.filter(d => d.syncStatus === 'CONFLICT').length, color: '#f97316' },
    { status: 'Offline', count: documents.filter(d => d.syncStatus === 'OFFLINE').length, color: '#6e6e80' },
    { status: 'Error', count: documents.filter(d => d.syncStatus === 'ERROR').length, color: '#ef4444' },
  ]

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 border-b border-dark-700 flex items-center justify-between px-6 bg-dark-900">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-accent-cyan" />
          <h1 className="text-lg font-semibold">CRDT Management</h1>
          <span className="text-sm text-dark-500">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus size={14} />
            New Document
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Documents List */}
        <div className="w-96 border-r border-dark-700 bg-dark-900/50 flex flex-col">
          <div className="p-4 border-b border-dark-700">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} />
              <h3 className="text-sm font-medium">Filters</h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="input w-full pl-10 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Sync Status Summary */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-dark-400 mb-2">Sync Status</h4>
              <div className="space-y-2">
                {syncStatusData.map(item => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.status}</span>
                    </div>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Types */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-dark-400 mb-2">Document Types</h4>
              <div className="space-y-2">
                {Object.entries(documentsByType).map(([type, stats]) => {
                  const Icon = DocTypeIcons[type as keyof typeof DocTypeIcons] || GitBranch
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={DocTypeColors[type as keyof typeof DocTypeColors]} />
                        <span className="text-sm capitalize">{type}</span>
                      </div>
                      <span className="text-xs text-dark-500">{stats.total}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Document List */}
            <div>
              <h4 className="text-sm font-medium text-dark-400 mb-2">Documents</h4>
              <div className="space-y-1">
                {filteredDocuments.map(doc => {
                  const Icon = DocTypeIcons[doc.docType as keyof typeof DocTypeIcons] || GitBranch
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocument(doc)
                        fetchDocumentDetails(doc.id)
                      }}
                      className={clsx(
                        'w-full p-3 rounded-lg border transition-all text-left',
                        selectedDocument?.id === doc.id
                          ? 'border-accent-cyan bg-accent-cyan/10'
                          : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={14} className={DocTypeColors[doc.docType as keyof typeof DocTypeColors]} />
                            <span className="text-sm font-medium truncate">{doc.docId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={clsx(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              SyncStatusBadgeColors[doc.syncStatus]
                            )}>
                              {doc.syncStatus}
                            </span>
                            <span className="text-xs text-dark-500">
                              v{doc.version}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.activePeers > 0 && (
                            <span className="text-xs text-accent-green flex items-center gap-1">
                              <Users size={10} />
                              {doc.activePeers}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Document Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedDocument ? (
            <>
              <div className="p-4 border-b border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedDocument.docId}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={clsx(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        SyncStatusBadgeColors[selectedDocument.syncStatus]
                      )}>
                        {selectedDocument.syncStatus}
                      </span>
                      <span className="text-xs text-dark-500">
                        Version {selectedDocument.version}
                      </span>
                      <span className="text-xs text-dark-500">
                        {selectedDocument.activePeers} active peers
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-secondary flex items-center gap-1 text-xs">
                      <Download size={12} />
                      Export
                    </button>
                    <button className="btn btn-secondary flex items-center gap-1 text-xs">
                      <Edit size={12} />
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Sync Status Chart */}
                <div className="panel mb-6">
                  <div className="panel-header">
                    <h3 className="font-medium">Sync Status Distribution</h3>
                  </div>
                  <div className="panel-content h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={syncStatusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#343541" />
                        <XAxis dataKey="status" stroke="#6e6e80" fontSize={12} />
                        <YAxis stroke="#6e6e80" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid #343541', borderRadius: '8px' }}
                        />
                        <Bar dataKey="count" fill="#00d4ff" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Document Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="panel">
                    <div className="panel-header">
                      <h3 className="font-medium">Document Information</h3>
                    </div>
                    <div className="panel-content space-y-3">
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Document Type</div>
                        <div className="text-sm capitalize">{selectedDocument.docType}</div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Entity Type</div>
                        <div className="text-sm capitalize">{selectedDocument.entityType}</div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Entity ID</div>
                        <div className="text-sm font-mono">{selectedDocument.entityId}</div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Last Synced</div>
                        <div className="text-sm">{formatTimestamp(selectedDocument.lastSyncedAt)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-header">
                      <h3 className="font-medium">Sync Information</h3>
                    </div>
                    <div className="panel-content space-y-3">
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Current Status</div>
                        <div className={clsx('text-sm font-medium', SyncStatusColors[selectedDocument.syncStatus])}>
                          {selectedDocument.syncStatus}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Active Peers</div>
                        <div className="text-sm">{selectedDocument.activePeers}</div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Version</div>
                        <div className="text-sm">{selectedDocument.version}</div>
                      </div>
                      {documentDetails?.conflicts && documentDetails.conflicts.length > 0 && (
                        <div>
                          <div className="text-xs text-dark-500 mb-1">Conflicts</div>
                          <div className="text-sm text-accent-orange">
                            {documentDetails.conflicts.length} unresolved
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Conflicts Section */}
                {conflicts.length > 0 && (
                  <div className="panel">
                    <div className="panel-header">
                      <h3 className="font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-accent-orange" />
                        Conflicts ({conflicts.length})
                      </h3>
                    </div>
                    <div className="panel-content">
                      <div className="space-y-3">
                        {conflicts.map((conflict, index) => (
                          <div key={index} className="p-3 bg-dark-800/50 rounded-lg border border-accent-orange/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Conflict #{index + 1}</span>
                              <button
                                onClick={() => resolveConflict(selectedDocument.id, {
                                  conflictId: conflict.id,
                                  resolution: 'use_local' // or 'use_remote' or 'merge'
                                })}
                                className="btn btn-primary text-xs"
                              >
                                Resolve
                              </button>
                            </div>
                            <div className="text-xs text-dark-400 space-y-1">
                              <div>Property: {conflict.property}</div>
                              <div>Local value: {JSON.stringify(conflict.localValue)}</div>
                              <div>Remote value: {JSON.stringify(conflict.remoteValue)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-dark-500">
              <div className="text-center">
                <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a document to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}