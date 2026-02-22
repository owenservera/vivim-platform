import { useState } from 'react'
import { clsx } from 'clsx'
import { useAppStore } from '../../store/appStore'
import { databaseApi } from '../../lib/api'
import {
  Search,
  Play,
  RefreshCw,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  Database,
  Rows3,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function DatabasePanel() {
  const { tables, queryResult, setQueryResult, isLoading, setIsLoading } = useAppStore()
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showTables, setShowTables] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleRunQuery = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await databaseApi.executeQuery(query)
      setQueryResult(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Query execution failed'
      setError(errorMessage)
      console.error('Query error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName)
    setQuery(`SELECT * FROM ${tableName} LIMIT 100`)
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 border-b border-dark-700 flex items-center justify-between px-6 bg-dark-900">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-accent-cyan" />
          <h1 className="text-lg font-semibold">Database Explorer</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary flex items-center gap-2">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <Upload size={14} />
            Import
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <Download size={14} />
            Export
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-dark-700 bg-dark-900/50 flex flex-col">
          <button 
            onClick={() => setShowTables(!showTables)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-dark-400 hover:text-dark-100 border-b border-dark-700"
          >
            {showTables ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Tables ({tables.length})
          </button>
          
          {showTables && (
            <div className="flex-1 overflow-y-auto py-2">
              {tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => handleTableClick(table.name)}
                  className={clsx(
                    'w-full px-4 py-2 flex items-center justify-between text-sm hover:bg-dark-800 transition-colors',
                    selectedTable === table.name ? 'bg-dark-800 text-accent-cyan' : 'text-dark-300'
                  )}
                >
                  <span className="truncate">{table.name}</span>
                  <span className="text-xs text-dark-500">{table.rowCount.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-dark-700">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SELECT * FROM table_name LIMIT 100"
                  className="input w-full pl-10 font-mono text-sm"
                />
              </div>
              <button 
                onClick={handleRunQuery}
                disabled={isLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                <Play size={14} />
                Run
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {error && (
              <div className="m-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertCircle size={16} />
                  <span className="font-medium">Query Error</span>
                </div>
                <p className="text-red-300 text-sm font-mono">{error}</p>
              </div>
            )}
            {queryResult ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-dark-800/50 border-b border-dark-700">
                  <div className="flex items-center gap-4 text-sm text-dark-400">
                    <span className="flex items-center gap-1">
                      <Rows3 size={14} />
                      {queryResult.rowCount} rows
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {queryResult.executionTime}ms
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-dark-800">
                      <tr>
                        {queryResult.columns.map((col) => (
                          <th 
                            key={col} 
                            className="px-4 py-2 text-left font-medium text-dark-400 border-b border-dark-700 whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} className="table-row">
                          {queryResult.columns.map((col) => (
                            <td 
                              key={col} 
                              className="px-4 py-2 text-dark-200 font-mono text-xs border-r border-dark-800 last:border-r-0"
                            >
                              {row[col] !== null ? String(row[col]) : <span className="text-dark-500">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-dark-500">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Run a query to see results</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-72 border-l border-dark-700 bg-dark-900/50 overflow-y-auto">
          <div className="p-4 border-b border-dark-700">
            <h3 className="text-sm font-medium text-dark-400 mb-3">Table Info</h3>
            {selectedTable ? (
              <div className="space-y-3">
                {tables.filter(t => t.name === selectedTable).map(table => (
                  <>
                    <div>
                      <div className="text-xs text-dark-500 mb-1">Name</div>
                      <div className="text-sm font-mono text-dark-200">{table.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-dark-500 mb-1">Schema</div>
                      <div className="text-sm font-mono text-dark-200">{table.schema}</div>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Rows</div>
                        <div className="text-sm text-dark-200">{table.rowCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Size</div>
                        <div className="text-sm text-dark-200">{table.size}</div>
                      </div>
                    </div>
                  </>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-500">Select a table to view details</p>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-sm font-medium text-dark-400 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full btn btn-secondary text-xs justify-start">
                Analyze Table
              </button>
              <button className="w-full btn btn-secondary text-xs justify-start">
                Vacuum Table
              </button>
              <button className="w-full btn btn-secondary text-xs justify-start">
                Reset Sequences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
