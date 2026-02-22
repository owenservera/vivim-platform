import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import PptxGenJS from 'pptxgenjs';

import * as navigation from './navigation';
import * as actions from './actions';
import * as social from './social';
import * as content from './content';
import * as providers from './providers';
import * as status from './status';
import * as security from './security';
import * as settings from './settings';
import * as editor from './editor';
import * as files from './files';
import * as backend from './backend';
import * as acu from './acu';
import * as collaboration from './collaboration';
import * as knowledgeGraph from './knowledge-graph';
import * as knowledgebase from './knowledgebase';
import * as acuEvolution from './acu-evolution';
import * as sync from './sync';
import * as analytics from './analytics';

const EXPORT_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];
const EXPORT_FORMATS = ['png', 'jpeg', 'webp'];

const CATEGORIES: Record<string, { name: string; icons: Record<string, any> }> = {
  navigation: { name: 'Navigation', icons: navigation },
  actions: { name: 'Actions', icons: actions },
  social: { name: 'Social', icons: social },
  content: { name: 'Content', icons: content },
  providers: { name: 'Providers', icons: providers },
  status: { name: 'Status', icons: status },
  security: { name: 'Security', icons: security },
  settings: { name: 'Settings', icons: settings },
  editor: { name: 'Editor', icons: editor },
  files: { name: 'Files', icons: files },
  backend: { name: 'Backend', icons: backend },
  acu: { name: 'ACU', icons: acu },
  collaboration: { name: 'Collaboration', icons: collaboration },
  'knowledge-graph': { name: 'Knowledge Graph', icons: knowledgeGraph },
  knowledgebase: { name: 'Knowledgebase', icons: knowledgebase },
  'acu-evolution': { name: 'ACU Evolution', icons: acuEvolution },
  sync: { name: 'Sync', icons: sync },
  analytics: { name: 'Analytics', icons: analytics },
};

const ALL_ICONS = Object.entries(CATEGORIES).flatMap(([catKey, cat]) =>
  Object.entries(cat.icons).map(([name, component]) => ({
    name,
    component,
    category: catKey,
    categoryName: cat.name,
  }))
);

const DEFAULT_CSS = {
  width: 48,
  height: 48,
  color: '#1a1a2e',
  strokeColor: '#1a1a2e',
  fillColor: 'none',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  opacity: 1,
  rotate: 0,
  scale: 1,
  padding: 0,
  margin: 0,
  backgroundColor: 'transparent',
  borderRadius: 0,
  boxShadow: 'none',
};

const CSS_SECTIONS = [
  {
    section: 'Size',
    controls: [
      { key: 'width', label: 'Width (px)', type: 'number', min: 8, max: 200 },
      { key: 'height', label: 'Height (px)', type: 'number', min: 8, max: 200 },
      { key: 'scale', label: 'Scale', type: 'range', min: 0.1, max: 3, step: 0.1 },
    ]
  },
  {
    section: 'Colors',
    controls: [
      { key: 'color', label: 'Color', type: 'color' },
      { key: 'strokeColor', label: 'Stroke', type: 'color' },
      { key: 'fillColor', label: 'Fill', type: 'color' },
      { key: 'backgroundColor', label: 'Background', type: 'color' },
    ]
  },
  {
    section: 'Stroke',
    controls: [
      { key: 'strokeWidth', label: 'Width', type: 'range', min: 0, max: 5, step: 0.25 },
      { key: 'strokeLinecap', label: 'Cap', type: 'select', options: ['butt', 'round', 'square'] },
      { key: 'strokeLinejoin', label: 'Join', type: 'select', options: ['miter', 'round', 'bevel'] },
    ]
  },
  {
    section: 'Transform',
    controls: [
      { key: 'rotate', label: 'Rotate (deg)', type: 'range', min: -360, max: 360, step: 15 },
      { key: 'opacity', label: 'Opacity', type: 'range', min: 0, max: 1, step: 0.05 },
    ]
  },
  {
    section: 'Container',
    controls: [
      { key: 'borderRadius', label: 'Border Radius', type: 'number', min: 0, max: 50 },
      { key: 'padding', label: 'Padding', type: 'number', min: 0, max: 50 },
      { key: 'margin', label: 'Margin', type: 'number', min: 0, max: 50 },
      { key: 'boxShadow', label: 'Box Shadow', type: 'text' },
    ]
  },
];

function generateCSS(css: typeof DEFAULT_CSS): string {
  const lines: string[] = [];
  if (css.width !== DEFAULT_CSS.width) lines.push(`  width: ${css.width}px;`);
  if (css.height !== DEFAULT_CSS.height) lines.push(`  height: ${css.height}px;`);
  if (css.color !== DEFAULT_CSS.color) lines.push(`  color: ${css.color};`);
  if (css.strokeColor !== DEFAULT_CSS.strokeColor) lines.push(`  stroke: ${css.strokeColor};`);
  if (css.fillColor !== DEFAULT_CSS.fillColor && css.fillColor !== 'none') lines.push(`  fill: ${css.fillColor};`);
  if (css.strokeWidth !== DEFAULT_CSS.strokeWidth) lines.push(`  stroke-width: ${css.strokeWidth};`);
  if (css.strokeLinecap !== DEFAULT_CSS.strokeLinecap) lines.push(`  stroke-linecap: ${css.strokeLinecap};`);
  if (css.strokeLinejoin !== DEFAULT_CSS.strokeLinejoin) lines.push(`  stroke-linejoin: ${css.strokeLinejoin};`);
  if (css.opacity !== DEFAULT_CSS.opacity) lines.push(`  opacity: ${css.opacity};`);
  if (css.rotate !== DEFAULT_CSS.rotate) lines.push(`  transform: rotate(${css.rotate}deg);`);
  if (css.scale !== DEFAULT_CSS.scale) lines.push(`  transform: scale(${css.scale});`);
  if (css.backgroundColor !== DEFAULT_CSS.backgroundColor) lines.push(`  background-color: ${css.backgroundColor};`);
  if (css.borderRadius !== DEFAULT_CSS.borderRadius) lines.push(`  border-radius: ${css.borderRadius}px;`);
  if (css.padding !== DEFAULT_CSS.padding) lines.push(`  padding: ${css.padding}px;`);
  if (css.margin !== DEFAULT_CSS.margin) lines.push(`  margin: ${css.margin}px;`);
  if (css.boxShadow !== DEFAULT_CSS.boxShadow && css.boxShadow !== 'none') lines.push(`  box-shadow: ${css.boxShadow};`);
  return lines.length > 0 ? `.icon {\n${lines.join('\n')}\n}` : '/* No custom styles */';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function svgToImage(svgElement: SVGElement, size: number, format: string, bgColor: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas ctx');
  
  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
  }
  
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute('width', String(size));
  clonedSvg.setAttribute('height', String(size));
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
  const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, `image/${format}`);
    };
    img.onerror = () => reject(new Error('Failed to load SVG'));
    img.src = dataUrl;
  });
}

const ICON_PATHS: Record<string, string> = {
  'home-feed': '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>',
  'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  'vault-closed': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'user-profile': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'arrow-back': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>',
  'arrow-forward': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>',
  'chevron-down': '<polyline points="6,9 12,15 18,9"/>',
  'chevron-up': '<polyline points="18,15 12,9 6,15"/>',
  'chevron-right': '<polyline points="9,18 15,12 9,6"/>',
  'chevron-left': '<polyline points="15,18 9,12 15,6"/>',
  'close-x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  'bell-notification': '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  'settings-cog': '<circle cx="12" cy="12" r="3"/>',
  'add-plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  'edit-pencil': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  'delete-trash': '<polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  'copy-duplicate': '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  'refresh-circular': '<polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  'cancel-slash': '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  'import-arrow': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  'export-arrow': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  'download-arrow': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  'upload-arrow': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  'create-new': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>',
  'sync-indicator': '<polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  'menu-hamburger': '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  'git-branch': '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  'git-fork-branch': '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
  'git-merge': '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
  'share-network': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  'retry-arrow': '<polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  'move-arrow': '<polyline points="5,9 2,12 5,15"/><polyline points="9,5 12,2 15,5"/><polyline points="15,19 12,22 9,19"/><polyline points="19,9 22,12 19,15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>',
  'rename-label': '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  'search-header': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  'heart-like': '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  'fork-branch': '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
  'bookmark-ribbon': '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  'success-check': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>',
  'error-x': '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  'warning-exclamation': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
};

function buildSvgString(pathData: string, size: number, css: typeof DEFAULT_CSS): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${css.fillColor === 'none' ? 'none' : css.fillColor}" stroke="${css.strokeColor}" stroke-width="${css.strokeWidth}" stroke-linecap="${css.strokeLinecap}" stroke-linejoin="${css.strokeLinejoin}">${pathData}</svg>`;
}

async function svgStringToDataUrl(svgString: string, size: number, bgColor: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('No ctx')); return; }
    
    if (bgColor && bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);
    }
    
    const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error('Load failed'));
    img.src = dataUrl;
  });
}

async function renderIconToSvgDataUrl(iconComponent: any, size: number, css: typeof DEFAULT_CSS, bgColor: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = size + 'px';
    container.style.height = size + 'px';
    document.body.appendChild(container);
    
    const root = createRoot(container);
    if (!root) {
      document.body.removeChild(container);
      reject(new Error('React not available'));
      return;
    }
    
    try {
      root.render(React.createElement(iconComponent, {
        size: size,
        strokeWidth: css.strokeWidth,
        stroke: css.strokeColor,
        fill: css.fillColor,
        style: {
          color: css.color,
          strokeLinecap: css.strokeLinecap,
          strokeLinejoin: css.strokeLinejoin,
        }
      }));
      
      setTimeout(() => {
        const svgEl = container.querySelector('svg');
        if (!svgEl) {
          root.unmount();
          document.body.removeChild(container);
          reject(new Error('SVG not rendered'));
          return;
        }
        
        svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const svgData = new XMLSerializer().serializeToString(svgEl);
        
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          root.unmount();
          document.body.removeChild(container);
          reject(new Error('No canvas context'));
          return;
        }
        
        if (bgColor && bgColor !== 'transparent') {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, size, size);
        }
        
        const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
        const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
        
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
          root.unmount();
          document.body.removeChild(container);
          resolve(canvas.toDataURL('image/png'));
        };
        
        img.onerror = () => {
          root.unmount();
          document.body.removeChild(container);
          reject(new Error('Failed to load'));
        };
        
        img.src = dataUrl;
      }, 100);
    } catch (e) {
      root.unmount();
      document.body.removeChild(container);
      reject(e);
    }
  });
}

async function generatePPTX(icons: typeof ALL_ICONS, css: typeof DEFAULT_CSS, bgColor: string) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'VIVIM Icon Library';
  pptx.author = 'VIVIM';
  
  const filteredCats = Object.entries(CATEGORIES);
  const exportSize = 64;
  
  for (const [catKey, cat] of filteredCats) {
    const categoryIcons = icons.filter(icon => icon.category === catKey);
    if (categoryIcons.length === 0) continue;
    
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    
    slide.addText(cat.name, { 
      x: 0.5, y: 0.3, w: 8, h: 0.5, 
      fontSize: 24, fontFace: 'Arial', color: '1a1a2e', bold: true 
    });
    
    slide.addText(`${categoryIcons.length} icons`, { 
      x: 0.5, y: 0.8, w: 8, h: 0.3, 
      fontSize: 12, fontFace: 'Arial', color: '64748b' 
    });
    
    const iconSize = 0.5;
    const cols = 9;
    const startX = 0.3;
    const startY = 1.3;
    const gapX = 1.0;
    const gapY = 0.85;
    
    for (let i = 0; i < categoryIcons.length; i++) {
      const icon = categoryIcons[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const x = startX + col * gapX;
      const y = startY + row * gapY;
      
      if (y > 5.5) break;
      
      try {
        const dataUrl = await renderIconToSvgDataUrl(icon.component, exportSize, css, bgColor);
        slide.addImage({ path: dataUrl, x, y, w: iconSize, h: iconSize });
      } catch (e) {
        console.error('Failed:', icon.name, e);
      }
      
      slide.addText(icon.name, { 
        x, y: y + iconSize + 0.02, w: iconSize, h: 0.2,
        fontSize: 7, fontFace: 'Arial', color: '64748b', align: 'center'
      });
    }
  }
  
  pptx.writeFile({ fileName: 'vivim-icons.pptx' });
}

const IconViewer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIcon, setSelectedIcon] = useState<typeof ALL_ICONS[0] | null>(null);
  const [activeCategoryButton, setActiveCategoryButton] = useState('all');
  const [customCss, setCustomCss] = useState(DEFAULT_CSS);
  const [showPanel, setShowPanel] = useState(true);
  const [exportSizes, setExportSizes] = useState<number[]>([24, 48, 128]);
  const [exportFormat, setExportFormat] = useState('png');
  const [exportBgColor, setExportBgColor] = useState('transparent');
  const [isExporting, setIsExporting] = useState(false);

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

  const handleCssChange = (key: string, value: any) => {
    setCustomCss((prev: typeof DEFAULT_CSS) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setCustomCss(DEFAULT_CSS);
  };

  const copyCSS = () => {
    navigator.clipboard.writeText(generateCSS(customCss));
  };

  const handleExportSizeToggle = (size: number) => {
    setExportSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size].sort((a, b) => a - b)
    );
  };

  const handleExport = async () => {
    if (!selectedIcon) return;
    setIsExporting(true);
    
    try {
      for (const size of exportSizes) {
        const dataUrl = await renderIconToSvgDataUrl(
          selectedIcon.component, 
          size, 
          customCss, 
          exportBgColor
        );
        
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.src = dataUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
              resolve();
            };
            img.onerror = () => resolve();
          });
          
          const format = exportFormat === 'jpg' ? 'jpeg' : exportFormat;
          canvas.toBlob((blob) => {
            if (blob) {
              downloadBlob(blob, `${selectedIcon.name}_${size}.${exportFormat}`);
            }
          }, `image/${format}`);
        }
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
    
    setIsExporting(false);
  };

  const iconStyle = {
    transform: `rotate(${customCss.rotate}deg) scale(${customCss.scale})`,
    opacity: customCss.opacity,
  };

  const containerStyle = {
    width: customCss.width,
    height: customCss.height,
    padding: customCss.padding,
    margin: customCss.margin,
    backgroundColor: customCss.backgroundColor,
    borderRadius: customCss.borderRadius,
    boxShadow: customCss.boxShadow,
  };

  return (
    <div className="icon-viewer">
      <div className={`sidebar ${showPanel ? 'open' : 'closed'}`}>
        <button className="toggle-btn" onClick={() => setShowPanel(!showPanel)}>
          {showPanel ? '◀' : '▶'}
        </button>
        
        {showPanel && (
          <>
            <div className="preview-section">
              <h3>Preview</h3>
              <div className="preview-box" style={containerStyle}>
                {selectedIcon && (
                  <selectedIcon.component
                    size={customCss.width}
                    strokeWidth={customCss.strokeWidth}
                    stroke={customCss.strokeColor}
                    fill={customCss.fillColor}
                    style={{
                      color: customCss.color,
                      strokeLinecap: customCss.strokeLinecap,
                      strokeLinejoin: customCss.strokeLinejoin,
                      ...iconStyle,
                    }}
                  />
                )}
              </div>
              {selectedIcon && (
                <div className="preview-info">
                  <code>{selectedIcon.name}</code>
                </div>
              )}
            </div>

            <div className="export-section">
              <h3>Export</h3>
              
              <div className="control-item">
                <label>Format</label>
                <select 
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  {EXPORT_FORMATS.map(fmt => (
                    <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label>Background</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={exportBgColor === 'transparent' ? '#ffffff' : exportBgColor}
                    onChange={(e) => setExportBgColor(e.target.value)}
                  />
                  <input
                    type="text"
                    value={exportBgColor}
                    onChange={(e) => setExportBgColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="control-item">
                <label>Sizes</label>
                <div className="size-checkboxes">
                  {EXPORT_SIZES.map(size => (
                    <label key={size} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={exportSizes.includes(size)}
                        onChange={() => handleExportSizeToggle(size)}
                      />
                      {size}px
                    </label>
                  ))}
                </div>
              </div>

              <button 
                className="export-btn" 
                onClick={handleExport}
                disabled={!selectedIcon || exportSizes.length === 0 || isExporting}
              >
                {isExporting ? 'Exporting...' : `Download ${exportSizes.length} file${exportSizes.length > 1 ? 's' : ''}`}
              </button>

              <div className="export-divider">
                <span>or generate all icons</span>
              </div>

              <button 
                className="export-btn pptx-btn" 
                onClick={() => generatePPTX(ALL_ICONS, customCss, exportBgColor)}
              >
                Generate PPTX (All Icons)
              </button>
            </div>

            <div className="css-controls">
              <div className="controls-header">
                <h3>CSS Controls</h3>
                <div className="header-btns">
                  <button onClick={handleReset}>Reset</button>
                  <button onClick={copyCSS}>Copy</button>
                </div>
              </div>
              
              <div className="css-output">
                <pre>{generateCSS(customCss)}</pre>
              </div>

              {CSS_SECTIONS.map(section => (
                <div key={section.section} className="control-section">
                  <h4>{section.section}</h4>
                  {section.controls.map(control => (
                    <div key={control.key} className="control-item">
                      <label>{control.label}</label>
                      {control.type === 'color' && (
                        <div className="color-input-group">
                          <input
                            type="color"
                            value={customCss[control.key as keyof typeof customCss] as string}
                            onChange={(e) => handleCssChange(control.key, e.target.value)}
                          />
                          <input
                            type="text"
                            value={customCss[control.key as keyof typeof customCss] as string}
                            onChange={(e) => handleCssChange(control.key, e.target.value)}
                          />
                        </div>
                      )}
                      {control.type === 'number' && (
                        <input
                          type="number"
                          value={customCss[control.key as keyof typeof customCss] as number}
                          min={(control as any).min}
                          max={(control as any).max}
                          onChange={(e) => handleCssChange(control.key, parseFloat(e.target.value))}
                        />
                      )}
                      {control.type === 'range' && (
                        <div className="range-group">
                          <input
                            type="range"
                            value={customCss[control.key as keyof typeof customCss] as number}
                            min={(control as any).min}
                            max={(control as any).max}
                            step={(control as any).step}
                            onChange={(e) => handleCssChange(control.key, parseFloat(e.target.value))}
                          />
                          <span>{customCss[control.key as keyof typeof customCss] as number}</span>
                        </div>
                      )}
                      {control.type === 'select' && (
                        <select
                          value={customCss[control.key as keyof typeof customCss] as string}
                          onChange={(e) => handleCssChange(control.key, e.target.value)}
                        >
                          {(control as any).options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {control.type === 'text' && (
                        <input
                          type="text"
                          value={customCss[control.key as keyof typeof customCss] as string}
                          onChange={(e) => handleCssChange(control.key, e.target.value)}
                          placeholder="e.g., 0 4px 8px rgba(0,0,0,0.2)"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <main className="main-view">
        <header className="viewer-header">
          <h1>VIVIM Icon Library</h1>
          <p>{ALL_ICONS.length} icons across {Object.keys(CATEGORIES).length} categories</p>
        </header>

        <div className="toolbar">
          <input
            type="text"
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>

        <div className="category-tabs">
          <button
            className={`tab ${activeCategoryButton === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryButtonClick('all')}
          >
            All ({ALL_ICONS.length})
          </button>
          {Object.entries(CATEGORIES).map(([catKey, cat]) => {
            const count = Object.keys(cat.icons).length;
            return (
              <button
                key={catKey}
                className={`tab ${activeCategoryButton === catKey ? 'active' : ''}`}
                onClick={() => handleCategoryButtonClick(catKey)}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="Icons-grid">
          {filteredIcons.length > 0 ? (
            filteredIcons.map((icon, index) => {
              const IconComponent = icon.component;
              const isSelected = selectedIcon?.name === icon.name;
              
              return (
                <div 
                  key={`${icon.category}-${icon.name}-${index}`}
                  className={`icon-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedIcon(icon)}
                  style={{
                    ...containerStyle,
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  }}
                >
                  <div className="icon-wrapper" style={iconStyle}>
                    <IconComponent 
                      size={customCss.width} 
                      strokeWidth={customCss.strokeWidth}
                      stroke={customCss.strokeColor}
                      fill={customCss.fillColor}
                      style={{
                        color: customCss.color,
                        strokeLinecap: customCss.strokeLinecap,
                        strokeLinejoin: customCss.strokeLinejoin,
                      }}
                    />
                  </div>
                  <div className="icon-name">{icon.name}</div>
                </div>
              );
            })
          ) : (
            <div className="no-results">
              <p>No icons found</p>
              <button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default IconViewer;
