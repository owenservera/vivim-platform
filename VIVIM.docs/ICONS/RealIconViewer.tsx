import React, { useState, useMemo } from 'react';

// Import all icon components individually
// Navigation icons
import { default as HomeFeed } from './navigation/HomeFeed';
import { default as Search } from './navigation/Search';
import { default as VaultClosed } from './navigation/VaultClosed';
import { default as UserProfile } from './navigation/UserProfile';
import { default as ArrowBack } from './navigation/ArrowBack';
import { default as ArrowForward } from './navigation/ArrowForward';
import { default as ChevronDown } from './navigation/ChevronDown';
import { default as ChevronRight } from './navigation/ChevronRight';
import { default as ChevronUp } from './navigation/ChevronUp';
import { default as CloseX } from './navigation/CloseX';
import { default as BellNotification } from './navigation/BellNotification';
import { default as SettingsCog } from './navigation/SettingsCog';

// Action icons
import { default as AddPlus } from './actions/AddPlus';
import { default as EditPencil } from './actions/EditPencil';
import { default as DeleteTrash } from './actions/DeleteTrash';
import { default as CopyDuplicate } from './actions/CopyDuplicate';
import { default as RefreshCircular } from './actions/RefreshCircular';
import { default as CancelSlash } from './actions/CancelSlash';
import { default as ImportArrow } from './actions/ImportArrow';
import { default as ExportArrow } from './actions/ExportArrow';
import { default as DownloadArrow } from './actions/DownloadArrow';
import { default as UploadArrow } from './actions/UploadArrow';
import { default as CreateNew } from './actions/CreateNew';
import { default as SyncIndicator } from './actions/SyncIndicator';
import { default as MenuHamburger } from './actions/MenuHamburger';
import { default as ChevronLeft } from './actions/ChevronLeft';
import { default as CaptureDownload } from './actions/CaptureDownload';
import { default as SaveFloppy } from './actions/SaveFloppy';
import { default as GitBranch } from './actions/GitBranch';
import { default as GitForkBranch } from './actions/GitForkBranch';
import { default as GitMerge } from './actions/GitMerge';
import { default as ShareNetwork } from './actions/ShareNetwork';
import { default as RetryArrow } from './actions/RetryArrow';
import { default as MoveArrow } from './actions/MoveArrow';
import { default as RenameLabel } from './actions/RenameLabel';
import { default as SearchHeader } from './actions/SearchHeader';

// Social icons
import { default as HeartLike } from './social/HeartLike';
import { default as ForkBranch } from './social/ForkBranch';
import { default as BookmarkRibbon } from './social/BookmarkRibbon';

// Status icons
import { default as SuccessCheck } from './status/SuccessCheck';
import { default as ErrorX } from './status/ErrorX';
import { default as WarningExclamation } from './status/WarningExclamation';

// Security icons
import { default as LockClosed } from './security/LockClosed';
import { default as LockOpen } from './security/LockOpen';
import { default as ShieldCheck } from './security/ShieldCheck';
import { default as ShieldAlert } from './security/ShieldAlert';

// Settings icons
import { default as SettingsGear } from './settings/SettingsGear';
import { default as FilterOptions } from './settings/FilterOptions';
import { default as VisibilityOn } from './settings/VisibilityOn';
import { default as VisibilityOff } from './settings/VisibilityOff';

// Editor icons
import { default as BoldText } from './editor/BoldText';
import { default as ItalicText } from './editor/ItalicText';
import { default as UnderlineText } from './editor/UnderlineText';
import { default as ListBullets } from './editor/ListBullets';
import { default as ListNumbers } from './editor/ListNumbers';
import { default as Quote } from './editor/Quote';

// Files icons
import { default as FileDocument } from './files/FileDocument';
import { default as FileImage } from './files/FileImage';
import { default as FilePdf } from './files/FilePdf';
import { default as FolderOpen } from './files/FolderOpen';
import { default as FolderClosed } from './files/FolderClosed';
import { default as ArchiveBox } from './files/ArchiveBox';

// Define all icons with their categories
const ALL_ICONS = [
  // Navigation
  { name: 'home-feed', component: HomeFeed, category: 'navigation' },
  { name: 'search', component: Search, category: 'navigation' },
  { name: 'vault-closed', component: VaultClosed, category: 'navigation' },
  { name: 'user-profile', component: UserProfile, category: 'navigation' },
  { name: 'arrow-back', component: ArrowBack, category: 'navigation' },
  { name: 'arrow-forward', component: ArrowForward, category: 'navigation' },
  { name: 'chevron-down', component: ChevronDown, category: 'navigation' },
  { name: 'chevron-right', component: ChevronRight, category: 'navigation' },
  { name: 'chevron-up', component: ChevronUp, category: 'navigation' },
  { name: 'close-x', component: CloseX, category: 'navigation' },
  { name: 'bell-notification', component: BellNotification, category: 'navigation' },
  { name: 'settings-cog', component: SettingsCog, category: 'navigation' },

  // Actions
  { name: 'add-plus', component: AddPlus, category: 'actions' },
  { name: 'edit-pencil', component: EditPencil, category: 'actions' },
  { name: 'delete-trash', component: DeleteTrash, category: 'actions' },
  { name: 'copy-duplicate', component: CopyDuplicate, category: 'actions' },
  { name: 'refresh-circular', component: RefreshCircular, category: 'actions' },
  { name: 'cancel-slash', component: CancelSlash, category: 'actions' },
  { name: 'import-arrow', component: ImportArrow, category: 'actions' },
  { name: 'export-arrow', component: ExportArrow, category: 'actions' },
  { name: 'download-arrow', component: DownloadArrow, category: 'actions' },
  { name: 'upload-arrow', component: UploadArrow, category: 'actions' },
  { name: 'create-new', component: CreateNew, category: 'actions' },
  { name: 'sync-indicator', component: SyncIndicator, category: 'actions' },
  { name: 'menu-hamburger', component: MenuHamburger, category: 'actions' },
  { name: 'chevron-left', component: ChevronLeft, category: 'actions' },
  { name: 'capture-download', component: CaptureDownload, category: 'actions' },
  { name: 'save-floppy', component: SaveFloppy, category: 'actions' },
  { name: 'git-branch', component: GitBranch, category: 'actions' },
  { name: 'git-fork-branch', component: GitForkBranch, category: 'actions' },
  { name: 'git-merge', component: GitMerge, category: 'actions' },
  { name: 'share-network', component: ShareNetwork, category: 'actions' },
  { name: 'retry-arrow', component: RetryArrow, category: 'actions' },
  { name: 'move-arrow', component: MoveArrow, category: 'actions' },
  { name: 'rename-label', component: RenameLabel, category: 'actions' },
  { name: 'search-header', component: SearchHeader, category: 'actions' },

  // Social
  { name: 'heart-like', component: HeartLike, category: 'social' },
  { name: 'fork-branch', component: ForkBranch, category: 'social' },
  { name: 'bookmark-ribbon', component: BookmarkRibbon, category: 'social' },

  // Status
  { name: 'success-check', component: SuccessCheck, category: 'status' },
  { name: 'error-x', component: ErrorX, category: 'status' },
  { name: 'warning-exclamation', component: WarningExclamation, category: 'status' },

  // Security
  { name: 'lock-closed', component: LockClosed, category: 'security' },
  { name: 'lock-open', component: LockOpen, category: 'security' },
  { name: 'shield-check', component: ShieldCheck, category: 'security' },
  { name: 'shield-alert', component: ShieldAlert, category: 'security' },

  // Settings
  { name: 'settings-gear', component: SettingsGear, category: 'settings' },
  { name: 'filter-options', component: FilterOptions, category: 'settings' },
  { name: 'visibility-on', component: VisibilityOn, category: 'settings' },
  { name: 'visibility-off', component: VisibilityOff, category: 'settings' },

  // Editor
  { name: 'bold-text', component: BoldText, category: 'editor' },
  { name: 'italic-text', component: ItalicText, category: 'editor' },
  { name: 'underline-text', component: UnderlineText, category: 'editor' },
  { name: 'list-bullets', component: ListBullets, category: 'editor' },
  { name: 'list-numbers', component: ListNumbers, category: 'editor' },
  { name: 'quote', component: Quote, category: 'editor' },

  // Files
  { name: 'file-document', component: FileDocument, category: 'files' },
  { name: 'file-image', component: FileImage, category: 'files' },
  { name: 'file-pdf', component: FilePdf, category: 'files' },
  { name: 'folder-open', component: FolderOpen, category: 'files' },
  { name: 'folder-closed', component: FolderClosed, category: 'files' },
  { name: 'archive-box', component: ArchiveBox, category: 'files' },
];

const CATEGORIES = [
  'actions', 'navigation', 'social', 'status', 'security', 
  'settings', 'editor', 'files'
];

const IconViewer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [iconSize, setIconSize] = useState(32);
  const [activeCategoryButton, setActiveCategoryButton] = useState('all');

  // Filter icons based on search term and selected category
  const filteredIcons = useMemo(() => {
    return ALL_ICONS.filter(icon => {
      const matchesSearch = icon.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || icon.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleCategoryButtonClick = (category: string) => {
    setSelectedCategory(category);
    setActiveCategoryButton(category);
  };

  // Format icon name for display
  const formatIconName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '30px' }}>VIVIM Icon Library Viewer</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: '4px', 
            border: '1px solid #cbd5e1',
            fontSize: '16px',
            flexGrow: 1,
            minWidth: '200px'
          }}
        />
        
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setActiveCategoryButton(e.target.value);
          }}
          style={{ 
            padding: '8px 12px', 
            borderRadius: '4px', 
            border: '1px solid #cbd5e1',
            fontSize: '16px'
          }}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="size-slider" style={{ fontSize: '14px' }}>Size:</label>
          <input
            id="size-slider"
            type="range"
            min="12"
            max="64"
            value={iconSize}
            onChange={(e) => setIconSize(parseInt(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ minWidth: '30px', fontSize: '14px' }}>{iconSize}px</span>
        </div>
      </div>

      <div className="categories" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>Quick Category Access</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setActiveCategoryButton('all');
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: activeCategoryButton === 'all' ? '#3b82f6' : '#f1f5f9',
              color: activeCategoryButton === 'all' ? 'white' : '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            className={activeCategoryButton === 'all' ? 'active' : ''}
          >
            All
          </button>
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryButtonClick(category)}
              style={{
                padding: '6px 12px',
                backgroundColor: activeCategoryButton === category ? '#3b82f6' : '#f1f5f9',
                color: activeCategoryButton === category ? 'white' : '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              className={activeCategoryButton === category ? 'active' : ''}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
        gap: '20px' 
      }}>
        {filteredIcons.length > 0 ? (
          filteredIcons.map((icon, index) => {
            const IconComponent = icon.component;
            
            return (
              <div 
                key={`${icon.name}-${index}`} 
                style={{ 
                  textAlign: 'center', 
                  padding: '15px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  transition: 'box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ height: '64px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <IconComponent size={iconSize} />
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', wordBreak: 'break-word' }}>
                  {formatIconName(icon.name)}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '40px', 
            color: '#94a3b8',
            fontSize: '16px'
          }}>
            No icons found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
};

export default IconViewer;