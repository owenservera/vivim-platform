import { useState, useEffect } from 'react';
import { 
  Activity, Globe, GitBranch, Terminal, ShieldAlert,
  Server, Zap, CheckCircle2, CloudLightning, Fingerprint, Database, GitCommit
} from 'lucide-react';

type FeedEventType = 'commit' | 'content' | 'network';

interface NetworkEvent {
  id: string;
  type: FeedEventType;
  title: string;
  description: string;
  timestamp: Date;
  meta: {
    authorDid?: string;
    cid?: string;
    nodeId?: string;
  };
}

interface NodeStatus {
  id: string;
  name: string;
  status: 'online' | 'offline';
  uptime: string;
}

const INITIAL_NODES: NodeStatus[] = [
  { id: 'node-genesis', name: 'Genesis Validator', status: 'online', uptime: '99.9%' },
  { id: 'node-edge-1', name: 'Edge Relay (EU)', status: 'online', uptime: '100%' },
  { id: 'node-edge-2', name: 'Edge Relay (US)', status: 'offline', uptime: '87.2%' },
  { id: 'node-publish', name: 'AI Publisher Daemon', status: 'online', uptime: '100%' },
  { id: 'node-storage', name: 'Distributed Storage DB', status: 'online', uptime: '99.5%' },
];

const TopologyGraph = () => (
  <div className="topology-container">
    <div className="graph-center">
      <Globe size={32} />
    </div>
    <div className="graph-node-orbit">
      <div className="orbit-node" />
      <div className="orbit-node" />
      <div className="orbit-node" />
      <div className="orbit-node" />
    </div>
  </div>
);

const ContextLayers = ({ activeLayer }: { activeLayer: number }) => {
  const layers = [
    'Physical', 'Identity', 'Network', 'Ledger', 'Memory', 'AI Agent', 'Self-Design'
  ];
  return (
    <div className="context-layers-grid">
      {layers.map((layer, i) => (
        <div 
          key={layer} 
          className={`context-layer-node ${activeLayer === i + 1 ? 'active' : ''}`}
          title={`Layer ${i + 1}: ${layer}`}
        >
          <span>L{i + 1}</span>
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const [nodes, setNodes] = useState<NodeStatus[]>(INITIAL_NODES);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [activeLayer, setActiveLayer] = useState(1);

  // Simulation of live network polling
  useEffect(() => {
    // Rotation of active layer for visual effect
    const layerInterval = setInterval(() => {
      setActiveLayer(prev => (prev % 7) + 1);
    }, 3000);

    // Initial feed
    const initCid = 'bafyrei...abcd';
    setEvents([
      {
        id: '1',
        type: 'commit',
        title: 'Semantic Commit: refactor(core)',
        description: 'Optimized state transitions and decentralized integration. Local Git state aligned with On-Chain Ledger via AI.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        meta: { authorDid: 'did:key:z123...', cid: initCid, nodeId: 'node-publish' }
      },
      {
        id: '2',
        type: 'network',
        title: 'New Edge Relay Connected',
        description: 'Peer establishing topology in US-East region.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        meta: { nodeId: 'node-edge-2' }
      }
    ]);

    const interval = setInterval(() => {
      const isCommit = Math.random() > 0.5;
      
      const newEvent: NetworkEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: isCommit ? 'commit' : 'content',
        title: isCommit ? 'Automated Code Publication' : 'Encrypted Blob Anchored',
        description: isCommit 
          ? 'AI Publishing Agent analyzed git diff, generated semantic context, and anchored to graph.' 
          : 'Immutable DHT storage received a new Article blob entry from network participant.',
        timestamp: new Date(),
        meta: {
          authorDid: `did:key:z${Math.random().toString(36).substr(2, 8)}`,
          cid: `bafyrei${Math.random().toString(36).substr(2, 8)}`,
          nodeId: INITIAL_NODES[Math.floor(Math.random() * INITIAL_NODES.length)].id
        }
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 15));
    }, 8000);

    return () => {
      clearInterval(interval);
      clearInterval(layerInterval);
    };
  }, []);

  return (
    <div className="dashboard-container">
      {/* Sidebar: Diagnostics & Topology */}
      <aside className="sidebar">
        <div className="glass-panel">
          <div className="brand">
            <Globe color="var(--accent)" />
            VIVIM Network Tracker
          </div>
          
          <h3 className="section-title">
            <Server size={14} /> P2P Topology
          </h3>
          
          <TopologyGraph />

          <h3 className="section-title">
            <Activity size={14} /> Connected Nodes
          </h3>
          
          <div className="node-list">
            {nodes.map(node => (
              <div key={node.id} className="node-card">
                <div className="node-info">
                  <div className="node-icon">
                    {node.id.includes('publish') ? <Terminal size={16} /> : 
                     node.id.includes('storage') ? <Database size={16} /> :
                     node.id.includes('genesis') ? <Activity size={16} /> : 
                     <CloudLightning size={16} />}
                  </div>
                  <div className="node-details">
                    <div className="node-name">{node.name}</div>
                    <div className="node-id">{node.id}</div>
                  </div>
                </div>
                <div title={node.status} className={`node-status-indicator ${node.status}`} />
              </div>
            ))}
          </div>

          <div className="mini-stat-group">
            <div className="mini-stat">
              <span className="mini-stat-label">Inbound</span>
              <span className="mini-stat-value">12.4 MB/s</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-label">Outbound</span>
              <span className="mini-stat-value">8.2 MB/s</span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ marginTop: 'auto' }}>
          <h3 className="section-title">
            <ShieldAlert size={14} /> Network Health
          </h3>
          <div className="health-stats">
            <div className="health-stat-row">
              <span className="health-label">P2P Mesh Integrity</span>
              <span className="health-value-success">100%</span>
            </div>
            <div className="health-stat-row">
              <span className="health-label">Consensus Status</span>
              <span className="health-value-accent">
                <CheckCircle2 size={12} /> Synced
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content: Deep Visibility */}
      <main className="main-content">
        <div className="glass-panel header-stats">
          <div className="stat-card">
            <span className="stat-title">Global DAG Height</span>
            <span className="stat-value text-gradient-accent">
              1,492,024
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Anchored Objects</span>
            <span className="stat-value">{(249301 + events.length).toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Active Peers</span>
            <span className="stat-value text-gradient-success">
              {nodes.filter(n => n.status === 'online').length}
            </span>
          </div>
        </div>

        <div className="glass-panel feed-container">
          <div className="feed-header" style={{ marginBottom: '0.5rem' }}>
            <h2 className="text-primary-header">
              <Activity size={20} />
              Real-time Global Ledger
            </h2>
            <div className="live-badge">Live Network Feed</div>
          </div>

          <div className="section-card">
            <h4 className="section-title" style={{ fontSize: '0.7rem', marginBottom: '0.5rem' }}>
              <Zap size={10} /> 7-Layer Context Intelligence
            </h4>
            <ContextLayers activeLayer={activeLayer} />
          </div>

          <div className="feed-list" style={{ marginTop: '1rem' }}>
            {events.map((evt) => (
              <div key={evt.id} className="feed-item" data-type={evt.type}>
                <div className="feed-item-icon">
                  {evt.type === 'commit' && <GitCommit size={20} />}
                  {evt.type === 'content' && <Fingerprint size={20} />}
                  {evt.type === 'network' && <GitBranch size={20} />}
                </div>
                
                <div className="feed-item-content">
                  <div className="feed-item-header">
                    <div className="feed-item-title">{evt.title}</div>
                    <div className="feed-item-time">
                      {evt.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="feed-item-desc">{evt.description}</div>
                  
                  <div className="feed-item-meta">
                    {evt.meta.authorDid && (
                      <span title="Author Identity">
                        <Fingerprint size={12} /> <code>{evt.meta.authorDid}</code>
                      </span>
                    )}
                    {evt.meta.cid && (
                      <span title="Cryptographic Hash (CID)">
                        <Zap size={12} /> <code>{evt.meta.cid}</code>
                      </span>
                    )}
                    {evt.meta.nodeId && (
                      <span title="Propagating Node">
                        <Server size={12} /> {evt.meta.nodeId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {events.length === 0 && (
              <div className="empty-state">
                <Activity size={32} />
                Awaiting P2P Network Events...
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
