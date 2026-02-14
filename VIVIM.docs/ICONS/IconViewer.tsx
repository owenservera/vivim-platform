import React, { useState, useMemo } from 'react';
import { Icon } from './index';

// Import all icons from different categories
// Note: In a real implementation, we would dynamically import or have a registry
// For this viewer, we'll create a sample list of known icon names
const ALL_ICON_NAMES = [
  // Navigation
  'home-feed', 'search', 'vault-closed', 'user-profile', 'arrow-back', 
  'arrow-forward', 'chevron-down', 'chevron-right', 'chevron-up', 
  'close-x', 'bell-notification', 'settings-cog',
  
  // Actions
  'add-plus', 'edit-pencil', 'delete-trash', 'copy-duplicate', 
  'refresh-circular', 'cancel-slash', 'import-arrow', 'export-arrow',
  'download-arrow', 'upload-arrow', 'create-new', 'sync-indicator',
  'menu-hamburger', 'chevron-left', 'capture-download', 'save-floppy',
  'git-branch', 'git-fork-branch', 'git-merge', 'share-network',
  'retry-arrow', 'move-arrow', 'rename-label', 'search-header',
  
  // Social
  'heart-like', 'fork-branch', 'bookmark-ribbon',
  
  // Status
  'success-check', 'error-x', 'warning-exclamation',
  
  // More could be added based on actual available icons
];

const ICON_CATEGORIES = [
  { name: 'Navigation', prefix: 'navigation/' },
  { name: 'Actions', prefix: 'actions/' },
  { name: 'Social', prefix: 'social/' },
  { name: 'Content', prefix: 'content/' },
  { name: 'Providers', prefix: 'providers/' },
  { name: 'Status', prefix: 'status/' },
  { name: 'Security', prefix: 'security/' },
  { name: 'Settings', prefix: 'settings/' },
  { name: 'Editor', prefix: 'editor/' },
  { name: 'Files', prefix: 'files/' },
  { name: 'Backend', prefix: 'backend/' },
  { name: 'ACU', prefix: 'acu/' },
  { name: 'Collaboration', prefix: 'collaboration/' },
  { name: 'Knowledge Graph', prefix: 'knowledge-graph/' },
  { name: 'Knowledgebase', prefix: 'knowledgebase/' },
  { name: 'ACU Evolution', prefix: 'acu-evolution/' },
  { name: 'Sync', prefix: 'sync/' },
  { name: 'Analytics', prefix: 'analytics/' },
];

const IconViewer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [iconSize, setIconSize] = useState(32);

  // Filter icons based on search term and selected category
  const filteredIcons = useMemo(() => {
    return ALL_ICON_NAMES.filter(iconName => {
      const matchesSearch = iconName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
        iconName.startsWith(selectedCategory.toLowerCase().replace(/\s+/g, '-'));
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>VIVIM Icon Library Viewer</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="all">All Categories</option>
          {ICON_CATEGORIES.map(category => (
            <option key={category.name} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label htmlFor="size-slider" style={{ marginRight: '8px' }}>Size:</label>
          <input
            id="size-slider"
            type="range"
            min="12"
            max="64"
            value={iconSize}
            onChange={(e) => setIconSize(parseInt(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ marginLeft: '8px', minWidth: '20px' }}>{iconSize}px</span>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
        gap: '20px' 
      }}>
        {filteredIcons.length > 0 ? (
          filteredIcons.map((iconName, index) => (
            <div 
              key={`${iconName}-${index}`} 
              style={{ 
                textAlign: 'center', 
                padding: '10px', 
                border: '1px solid #eee', 
                borderRadius: '4px',
                transition: 'box-shadow 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ height: '64px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name={iconName} size={iconSize} />
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                {iconName}
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#999' }}>
            No icons found matching your criteria
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <h3>Icon Categories</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {ICON_CATEGORIES.map(category => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              style={{
                padding: '6px 12px',
                backgroundColor: selectedCategory === category.name ? '#007acc' : '#f0f0f0',
                color: selectedCategory === category.name ? 'white' : '#333',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IconViewer;