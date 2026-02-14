import { clsx } from 'clsx'
import { useAppStore } from '../store/appStore'
import { 
  Database, 
  Network, 
  Workflow, 
  Zap, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Hexagon
} from 'lucide-react'

const navItems = [
  { id: 'database', label: 'Database', icon: Database },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'dataflow', label: 'Data Flows', icon: Workflow },
  { id: 'actions', label: 'Actions', icon: Zap },
  { id: 'logs', label: 'Logs', icon: FileText },
] as const

export default function Sidebar() {
  const { activePanel, setActivePanel, sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <aside 
      className={clsx(
        'h-screen bg-dark-900 border-r border-dark-700 flex flex-col transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="h-14 flex items-center justify-between px-4 border-b border-dark-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <Hexagon className="w-6 h-6 text-accent-cyan" />
            <span className="font-bold text-lg">VIVIM</span>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-dark-100 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activePanel === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-150',
                isActive 
                  ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' 
                  : 'text-dark-400 hover:bg-dark-800 hover:text-dark-100'
              )}
            >
              <Icon size={20} />
              {!sidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {!sidebarCollapsed && (
        <div className="p-4 border-t border-dark-700">
          <div className="text-xs text-dark-500">
            <div>Admin Panel v1.0</div>
            <div className="mt-1">P2P Network Engine</div>
          </div>
        </div>
      )}
    </aside>
  )
}
