/**
 * Virtual User SDK - Frontend Library
 * 
 * Client-side SDK for virtual user identification and session management.
 * Provides device fingerprinting, session handling, and API integration.
 * 
 * @module @vivim/virtual-user-sdk
 */

// ============================================================================
// TYPES
// ============================================================================

export interface FingerprintSignals {
  canvas?: string;
  canvasWinding?: string;
  webglVendor?: string;
  webglRenderer?: string;
  webglVersion?: string;
  webglShadingLanguageVersion?: string;
  webglExtensions?: string;
  webglUnmaskedVendor?: string;
  webglUnmaskedRenderer?: string;
  audio?: string;
  fonts?: string[];
  screenResolution?: string;
  screenColorDepth?: number;
  screenPixelRatio?: number;
  screenOrientation?: string;
  batteryLevel?: number;
  batteryCharging?: boolean;
  touchPoints?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  userAgent?: string;
  language?: string;
  languages?: string[];
  timezone?: string;
  timezoneOffset?: number;
  platform?: string;
  cookiesEnabled?: boolean;
  doNotTrack?: string;
  maxTouchPoints?: number;
  pdfViewerEnabled?: boolean;
}

export interface IdentificationConfidence {
  score: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: {
    fingerprint: number;
    cookie: number;
    ip_ua: number;
    behavioral: number;
  };
  threshold: {
    auto_identify: number;
    suggest_merge: number;
    create_new: number;
  };
}

export interface VirtualUserProfile {
  id: string;
  displayName: string | null;
  topicInterests: string[];
  entityProfiles: any[];
  conversationCount: number;
  memoryCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  consentGiven: boolean;
  dataRetentionPolicy: string;
}

export interface IdentifyResult {
  virtualUserId: string;
  sessionToken: string;
  identification: IdentificationConfidence;
  profile: VirtualUserProfile;
  consentRequired: boolean;
  isNewUser: boolean;
}

export interface VirtualUserSDKOptions {
  apiUrl: string;
  consentRequired?: boolean;
  autoIdentify?: boolean;
  dataRetentionPolicy?: '7_days' | '30_days' | '90_days' | '1_year' | 'indefinite';
  debug?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  messageId: string;
  model: string;
}

// ============================================================================
// FINGERPRINT GENERATOR
// ============================================================================

export class FingerprintGenerator {
  private static instance: FingerprintGenerator;
  
  private constructor() {}
  
  static getInstance(): FingerprintGenerator {
    if (!FingerprintGenerator.instance) {
      FingerprintGenerator.instance = new FingerprintGenerator();
    }
    return FingerprintGenerator.instance;
  }
  
  /**
   * Generate comprehensive device fingerprint
   */
  async generate(options: {
    includeCanvas?: boolean;
    includeWebGL?: boolean;
    includeAudio?: boolean;
    includeFonts?: boolean;
    includeScreen?: boolean;
    includeBattery?: boolean;
    includeTouch?: boolean;
  } = {}): Promise<{ hash: string; signals: FingerprintSignals }> {
    const {
      includeCanvas = true,
      includeWebGL = true,
      includeAudio = true,
      includeFonts = true,
      includeScreen = true,
      includeBattery = true,
      includeTouch = true
    } = options;
    
    const signals: FingerprintSignals = {};
    
    // Canvas fingerprint
    if (includeCanvas) {
      signals.canvas = await this.getCanvasFingerprint();
      signals.canvasWinding = this.getCanvasWinding();
    }
    
    // WebGL fingerprint
    if (includeWebGL) {
      const webgl = this.getWebGLFingerprint();
      signals.webglVendor = webgl.vendor;
      signals.webglRenderer = webgl.renderer;
      signals.webglVersion = webgl.version;
      signals.webglShadingLanguageVersion = webgl.shadingLanguageVersion;
      signals.webglExtensions = webgl.extensions;
      signals.webglUnmaskedVendor = webgl.unmaskedVendor;
      signals.webglUnmaskedRenderer = webgl.unmaskedRenderer;
    }
    
    // Audio fingerprint
    if (includeAudio) {
      signals.audio = await this.getAudioFingerprint();
    }
    
    // Font detection
    if (includeFonts) {
      signals.fonts = this.getDetectedFonts();
    }
    
    // Screen characteristics
    if (includeScreen) {
      signals.screenResolution = `${screen.width}x${screen.height}`;
      signals.screenColorDepth = screen.colorDepth;
      signals.screenPixelRatio = window.devicePixelRatio;
      signals.screenOrientation = screen.orientation?.type;
    }
    
    // Battery status
    if (includeBattery && 'getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        signals.batteryLevel = battery.level;
        signals.batteryCharging = battery.charging;
      } catch (e) {
        // Battery API not available or blocked
      }
    }
    
    // Touch support
    if (includeTouch) {
      signals.touchPoints = 'ontouchstart' in window ? (navigator as any).maxTouchPoints || 1 : 0;
      signals.maxTouchPoints = (navigator as any).maxTouchPoints || 0;
    }
    
    // Hardware info
    signals.hardwareConcurrency = navigator.hardwareConcurrency;
    signals.deviceMemory = (navigator as any).deviceMemory;
    
    // Browser info
    signals.userAgent = navigator.userAgent;
    signals.language = navigator.language;
    signals.languages = navigator.languages;
    signals.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    signals.timezoneOffset = new Date().getTimezoneOffset();
    signals.platform = navigator.platform;
    signals.cookiesEnabled = navigator.cookieEnabled;
    signals.doNotTrack = navigator.doNotTrack;
    signals.pdfViewerEnabled = navigator.pdfViewerEnabled;
    
    // Generate hash
    const hash = await this.hashSignals(signals);
    
    return { hash, signals };
  }
  
  /**
   * Canvas fingerprinting
   */
  private async getCanvasFingerprint(): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }
      
      // Draw text with specific styling
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 100, 50);
      ctx.fillStyle = '#069';
      ctx.fillText('Virtual User Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Canvas Fingerprinting', 4, 30);
      
      // Get data URL and extract hash
      const dataUrl = canvas.toDataURL();
      resolve(dataUrl.substring(dataUrl.indexOf(',') + 1));
    });
  }
  
  /**
   * Canvas winding order detection
   */
  private getCanvasWinding(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unknown';
    
    ctx.rect(0, 0, 10, 10);
    ctx.rect(2, 2, 6, 6);
    
    return ctx.isPointInPath(5, 5, 'evenodd') ? 'evenodd' : 'nonzero';
  }
  
  /**
   * WebGL fingerprinting
   */
  private getWebGLFingerprint(): {
    vendor?: string;
    renderer?: string;
    version?: string;
    shadingLanguageVersion?: string;
    extensions?: string;
    unmaskedVendor?: string;
    unmaskedRenderer?: string;
  } {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return {};
    
    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return {};
    
    return {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      extensions: gl.getSupportedExtensions()?.join(',') || '',
      unmaskedVendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      unmaskedRenderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    };
  }
  
  /**
   * Audio context fingerprinting
   */
  private async getAudioFingerprint(): Promise<string> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gain = audioContext.createGain();
      const compressor = audioContext.createDynamicsCompressor();
      
      oscillator.type = 'triangle';
      oscillator.frequency.value = 10000;
      
      analyser.fftSize = 2048;
      gain.gain.value = 0.5;
      
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.001;
      compressor.release.value = 0.25;
      
      oscillator.connect(analyser);
      analyser.connect(compressor);
      compressor.connect(gain);
      gain.connect(audioContext.destination);
      
      oscillator.start(0);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const buffer = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(buffer);
      
      oscillator.stop();
      audioContext.close();
      
      return buffer.slice(0, 100).join(',');
    } catch (e) {
      return '';
    }
  }
  
  /**
   * Font detection
   */
  private getDetectedFonts(): string[] {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
      'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia',
      'Impact', 'Times New Roman', 'Trebuchet MS', 'Verdana',
      'Microsoft YaHei', 'SimSun', 'SimHei', 'MS Mincho', 'MS Gothic',
      'Malgun Gothic', 'Batang', 'Andale Mono', 'Apple Chancery'
    ];
    
    const detectedFonts: string[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    
    ctx.font = '72px monospace';
    const baseWidth = ctx.measureText('mmmmmmmmmmlli').width;
    
    for (const font of testFonts) {
      ctx.font = `72px "${font}", ${baseFonts[0]}`;
      const width = ctx.measureText('mmmmmmmmmmlli').width;
      
      if (width !== baseWidth) {
        detectedFonts.push(font);
      }
    }
    
    return detectedFonts;
  }
  
  /**
   * Hash signals using SHA-256
   */
  private async hashSignals(signals: FingerprintSignals): Promise<string> {
    const data = JSON.stringify(signals, Object.keys(signals).sort());
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `sha256:${hashHex}`;
  }
}

// ============================================================================
// VIRTUAL USER SDK
// ============================================================================

export class VirtualUserSDK {
  private options: VirtualUserSDKOptions;
  private fingerprintGenerator: FingerprintGenerator;
  private virtualUserId?: string;
  private sessionToken?: string;
  private profile?: VirtualUserProfile;
  private eventListeners: Map<string, Function[]> = new Map();
  private initialized: boolean = false;
  
  constructor(options: VirtualUserSDKOptions) {
    this.options = {
      consentRequired: true,
      autoIdentify: true,
      dataRetentionPolicy: '90_days',
      debug: false,
      ...options
    };
    
    this.fingerprintGenerator = FingerprintGenerator.getInstance();
    
    // Load existing session from localStorage
    this.loadSession();
  }
  
  /**
   * Initialize SDK and identify user
   */
  async initialize(): Promise<IdentifyResult | null> {
    if (this.initialized) {
      this.log('SDK already initialized');
      return this.buildIdentifyResult();
    }
    
    try {
      // Generate fingerprint
      this.log('Generating device fingerprint...');
      const { hash: fingerprint, signals } = await this.fingerprintGenerator.generate();
      
      this.log('Fingerprint generated:', fingerprint.substring(0, 16) + '...');
      
      // Identify or create virtual user
      const result = await this.identify(fingerprint, signals);
      
      this.initialized = true;
      
      if (result.isNewUser) {
        this.emit('newUser', { virtualUserId: result.virtualUserId });
      } else {
        this.emit('identified', result);
      }
      
      if (result.consentRequired && this.options.consentRequired) {
        this.emit('consentRequired', { virtualUserId: result.virtualUserId });
      }
      
      return result;
    } catch (error) {
      this.error('Initialization failed:', error);
      this.emit('error', { error, type: 'initialization' });
      return null;
    }
  }
  
  /**
   * Identify or create virtual user
   */
  async identify(fingerprint: string, signals: FingerprintSignals): Promise<IdentifyResult> {
    const existingSessionToken = this.sessionToken;
    
    const response = await fetch(`${this.options.apiUrl}/api/v1/virtual/identify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        fingerprint,
        signals,
        existingSessionToken
      })
    });
    
    if (!response.ok) {
      throw new Error(`Identification failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Store session
    this.virtualUserId = data.virtualUserId;
    this.sessionToken = data.sessionToken;
    this.profile = data.profile;
    
    // Save to localStorage
    this.saveSession();
    
    return data;
  }
  
  /**
   * Give consent for data storage
   */
  async giveConsent(options?: { dataRetentionPolicy?: string }): Promise<boolean> {
    if (!this.virtualUserId || !this.sessionToken) {
      throw new Error('Must identify user before giving consent');
    }
    
    const response = await fetch(`${this.options.apiUrl}/api/v1/virtual/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        virtualUserId: this.virtualUserId,
        sessionToken: this.sessionToken,
        consentGiven: true,
        dataRetentionPolicy: options?.dataRetentionPolicy || this.options.dataRetentionPolicy
      })
    });
    
    if (!response.ok) {
      throw new Error(`Consent failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Update profile
    if (this.profile) {
      this.profile.consentGiven = true;
      this.profile.dataRetentionPolicy = data.dataRetentionPolicy;
    }
    
    this.emit('consentGiven', { virtualUserId: this.virtualUserId });
    
    return true;
  }
  
  /**
   * Get virtual user profile
   */
  async getProfile(): Promise<VirtualUserProfile | null> {
    if (!this.sessionToken) {
      return null;
    }
    
    const response = await fetch(
      `${this.options.apiUrl}/api/v1/virtual/profile?sessionToken=${this.sessionToken}`,
      {
        credentials: 'include'
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    this.profile = data.profile;
    return this.profile;
  }
  
  /**
   * Send a chat message
   */
  async chat(message: string, options?: {
    conversationId?: string;
    model?: string;
    stream?: boolean;
  }): Promise<ChatResponse> {
    if (!this.sessionToken) {
      throw new Error('Must identify user before chatting');
    }
    
    if (!this.profile?.consentGiven) {
      throw new Error('User consent required before chatting');
    }
    
    const response = await fetch(`${this.options.apiUrl}/api/v1/virtual/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        sessionToken: this.sessionToken,
        message,
        ...options
      })
    });
    
    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Export all user data (GDPR)
   */
  async exportData(): Promise<any> {
    if (!this.sessionToken) {
      throw new Error('Must identify user before exporting data');
    }
    
    const response = await fetch(
      `${this.options.apiUrl}/api/v1/virtual/export?sessionToken=${this.sessionToken}`,
      {
        credentials: 'include'
      }
    );
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  }
  
  /**
   * Delete virtual user account
   */
  async deleteAccount(): Promise<boolean> {
    if (!this.sessionToken) {
      throw new Error('Must identify user before deleting account');
    }
    
    const response = await fetch(`${this.options.apiUrl}/api/v1/virtual/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        sessionToken: this.sessionToken
      })
    });
    
    if (!response.ok) {
      throw new Error(`Deletion failed: ${response.statusText}`);
    }
    
    // Clear local session
    this.clearSession();
    this.virtualUserId = undefined;
    this.sessionToken = undefined;
    this.profile = undefined;
    this.initialized = false;
    
    this.emit('accountDeleted', {});
    
    return true;
  }
  
  /**
   * Event listeners
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Get current state
   */
  getState(): {
    virtualUserId?: string;
    sessionToken?: string;
    profile?: VirtualUserProfile;
    initialized: boolean;
  } {
    return {
      virtualUserId: this.virtualUserId,
      sessionToken: this.sessionToken,
      profile: this.profile,
      initialized: this.initialized
    };
  }
  
  // ==================== Private Methods ====================
  
  private buildIdentifyResult(): IdentifyResult | null {
    if (!this.virtualUserId || !this.sessionToken || !this.profile) {
      return null;
    }
    
    return {
      virtualUserId: this.virtualUserId,
      sessionToken: this.sessionToken,
      identification: {
        score: 100,
        level: 'HIGH',
        signals: { fingerprint: 100, cookie: 100, ip_ua: 100, behavioral: 100 },
        threshold: { auto_identify: 75, suggest_merge: 60, create_new: 0 }
      },
      profile: this.profile,
      consentRequired: !this.profile.consentGiven,
      isNewUser: false
    };
  }
  
  private saveSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('virtual_user_id', this.virtualUserId || '');
      localStorage.setItem('virtual_session_token', this.sessionToken || '');
    }
  }
  
  private loadSession(): void {
    if (typeof localStorage !== 'undefined') {
      this.virtualUserId = localStorage.getItem('virtual_user_id') || undefined;
      this.sessionToken = localStorage.getItem('virtual_session_token') || undefined;
    }
  }
  
  private clearSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('virtual_user_id');
      localStorage.removeItem('virtual_session_token');
    }
  }
  
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[VirtualUserSDK]', ...args);
    }
  }
  
  private error(...args: any[]): void {
    if (this.options.debug) {
      console.error('[VirtualUserSDK]', ...args);
    }
  }
  
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        this.error(`Event listener error for ${event}:`, error);
      }
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export function createVirtualUserSDK(options: VirtualUserSDKOptions): VirtualUserSDK {
  return new VirtualUserSDK(options);
}

export const fingerprintGenerator = FingerprintGenerator.getInstance();

export default VirtualUserSDK;
