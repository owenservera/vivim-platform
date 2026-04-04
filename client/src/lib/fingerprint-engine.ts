/**
 * Advanced Fingerprint Engine
 * 
 * Comprehensive browser fingerprint collector with 15+ signal types:
 * - Canvas, WebGL, Audio fingerprinting
 * - Font detection (50+ fonts)
 * - CSS preferences (dark mode, reduced motion, etc.)
 * - Speech voices, WebRTC IPs
 * - API availability fingerprinting
 * - Performance timing signals
 * 
 * @module lib/fingerprint-engine
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FingerprintSignals {
  // Hardware Signals
  screen: ScreenSignals;
  hardware: HardwareSignals;
  gpu: GPUSignals;
  audio: AudioSignals;

  // Software Signals
  navigator: NavigatorSignals;
  timezone: TimezoneSignals;
  fonts: FontSignals;
  plugins: string[];
  cssPreferences: CSSPreferenceSignals;
  speechVoices: string[];

  // Rendered Signals
  canvasHash: string;
  webglHash: string;
  webglParams: WebGLParams;

  // Network Signals
  connection: ConnectionSignals;
  webrtcIPs: string[];

  // Storage Capabilities
  storageCapabilities: StorageCapabilities;

  // API Availability
  apiFingerprint: APIAvailability;

  // Performance
  performanceTiming: PerformanceSignals;

  // Composite
  signalHash: string;
  signalVersion: string;
  collectedAt: number;
  entropy: number;
}

export interface ScreenSignals {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  devicePixelRatio: number;
  orientation: string;
  isExtended: boolean;
}

export interface HardwareSignals {
  cores: number;
  deviceMemory: number;
  maxTouchPoints: number;
  platform: string;
  architecture: string;
}

export interface GPUSignals {
  renderer: string;
  vendor: string;
  maxTextureSize: number;
  maxViewportDims: number[];
  extensions: string[];
  shadingLanguageVersion: string;
  maxAnisotropy: number;
}

export interface AudioSignals {
  sampleRate: number;
  channelCount: number;
  baseLatency: number;
  outputLatency: number;
  hash: string;
}

export interface NavigatorSignals {
  userAgent: string;
  language: string;
  languages: string[];
  cookieEnabled: boolean;
  doNotTrack: string | null;
  pdfViewerEnabled: boolean;
  webdriver: boolean;
  vendor: string;
  vendorSub: string;
  productSub: string;
  buildID: string;
  oscpu: string;
}

export interface TimezoneSignals {
  timezone: string;
  timezoneOffset: number;
  dstOffset: number;
  locale: string;
  dateFormat: string;
  numberFormat: string;
}

export interface FontSignals {
  available: string[];
  hash: string;
  count: number;
}

export interface CSSPreferenceSignals {
  colorScheme: 'light' | 'dark' | 'no-preference';
  reducedMotion: boolean;
  reducedTransparency: boolean;
  contrast: 'more' | 'less' | 'no-preference';
  forcedColors: boolean;
  colorGamut: 'srgb' | 'p3' | 'rec2020';
  invertedColors: boolean;
  monochrome: boolean;
  hover: 'hover' | 'none';
  pointer: 'fine' | 'coarse' | 'none';
}

export interface ConnectionSignals {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface StorageCapabilities {
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  cookies: boolean;
  cacheAPI: boolean;
  serviceWorker: boolean;
  webSQL: boolean;
  estimate: { quota: number; usage: number } | null;
}

export interface APIAvailability {
  webGL: boolean;
  webGL2: boolean;
  webGPU: boolean;
  webRTC: boolean;
  webAudio: boolean;
  webSpeech: boolean;
  webBluetooth: boolean;
  webUSB: boolean;
  webNFC: boolean;
  webXR: boolean;
  webShare: boolean;
  webPayment: boolean;
  notifications: boolean;
  geolocation: boolean;
  mediaDevices: boolean;
  credentials: boolean;
  clipboard: boolean;
  batteryAPI: boolean;
  gamepads: boolean;
  midi: boolean;
  serial: boolean;
  hid: boolean;
}

export interface WebGLParams {
  maxTextureSize: number;
  maxCubeMapTextureSize: number;
  maxRenderBufferSize: number;
  maxVertexAttribs: number;
  maxVertexUniformVectors: number;
  maxFragmentUniformVectors: number;
  maxVaryingVectors: number;
  aliasedLineWidthRange: number[];
  aliasedPointSizeRange: number[];
  maxViewportDims: number[];
  stencilBits: number;
  depthBits: number;
}

export interface PerformanceSignals {
  navigationTiming: number[];
  paintTiming: { firstPaint: number; firstContentfulPaint: number };
  memoryInfo: { jsHeapSizeLimit: number; totalJSHeapSize: number } | null;
}

// ============================================================================
// FINGERPRINT ENGINE
// ============================================================================

export class FingerprintEngine {
  private signals: Partial<FingerprintSignals> = {};
  private entropyBits = 0;

  /**
   * Collect all fingerprint signals
   */
  async collect(): Promise<FingerprintSignals> {
    const collectors = [
      this.collectScreen(),
      this.collectHardware(),
      this.collectNavigator(),
      this.collectTimezone(),
      this.collectCanvas(),
      this.collectWebGL(),
      this.collectAudio(),
      this.collectFonts(),
      this.collectCSSPreferences(),
      this.collectConnection(),
      this.collectStorageCapabilities(),
      this.collectAPIAvailability(),
      this.collectSpeechVoices(),
      this.collectWebRTC(),
      this.collectPerformance(),
    ];

    await Promise.allSettled(collectors);

    this.signals.signalVersion = '2.0.0';
    this.signals.collectedAt = Date.now();
    this.signals.entropy = this.entropyBits;
    this.signals.signalHash = await this.computeCompositeHash();

    return this.signals as FingerprintSignals;
  }

  // ── Screen Signals ──────────────────────────────────────────────────────

  private async collectScreen(): Promise<void> {
    const s = window.screen;
    this.signals.screen = {
      width: s.width,
      height: s.height,
      availWidth: s.availWidth,
      availHeight: s.availHeight,
      colorDepth: s.colorDepth,
      pixelDepth: s.pixelDepth,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: screen.orientation?.type || 'unknown',
      isExtended: (screen as any).isExtended || false,
    };
    this.entropyBits += 8;
  }

  // ── Hardware Signals ────────────────────────────────────────────────────

  private async collectHardware(): Promise<void> {
    this.signals.hardware = {
      cores: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      platform: navigator.platform || 'unknown',
      architecture: this.inferArchitecture(),
    };
    this.entropyBits += 6;
  }

  private inferArchitecture(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('arm') || ua.includes('aarch64')) return 'ARM';
    if (ua.includes('x86_64') || ua.includes('x64') || ua.includes('win64')) return 'x86_64';
    if (ua.includes('x86') || ua.includes('i686')) return 'x86';
    if (ua.includes('ppc')) return 'PPC';
    if (navigator.platform?.includes('Mac') && (navigator as any).deviceMemory) return 'ARM';
    return 'unknown';
  }

  // ── Navigator Signals ───────────────────────────────────────────────────

  private async collectNavigator(): Promise<void> {
    this.signals.navigator = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: [...(navigator.languages || [])],
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      pdfViewerEnabled: (navigator as any).pdfViewerEnabled ?? false,
      webdriver: (navigator as any).webdriver || false,
      vendor: navigator.vendor || '',
      vendorSub: (navigator as any).vendorSub || '',
      productSub: (navigator as any).productSub || '',
      buildID: (navigator as any).buildID || '',
      oscpu: (navigator as any).oscpu || '',
    };
    this.entropyBits += 10;
  }

  // ── Timezone Signals ────────────────────────────────────────────────────

  private async collectTimezone(): Promise<void> {
    const now = new Date();
    const jan = new Date(now.getFullYear(), 0, 1);
    const jul = new Date(now.getFullYear(), 6, 1);

    const numberFormat = new Intl.NumberFormat();
    const resolvedNumber = numberFormat.resolvedOptions();

    this.signals.timezone = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: now.getTimezoneOffset(),
      dstOffset: Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset())
        - Math.min(jan.getTimezoneOffset(), jul.getTimezoneOffset()),
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      dateFormat: new Intl.DateTimeFormat().format(new Date(2024, 0, 15)),
      numberFormat: numberFormat.format(1234567.89),
    };
    this.entropyBits += 5;
  }

  // ── Canvas Fingerprint ──────────────────────────────────────────────────

  private async collectCanvas(): Promise<void> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (!ctx) { this.signals.canvasHash = 'unsupported'; return; }

      ctx.textBaseline = 'top';

      // Gradient
      const gradient = ctx.createLinearGradient(0, 0, 300, 150);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(0.5, '#4ecdc4');
      gradient.addColorStop(1, '#45b7d1');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 300, 150);

      // Text
      ctx.fillStyle = '#2d3436';
      ctx.font = '18px Arial';
      ctx.fillText('Cwm fjord bank glyphs vext quiz 🏛️', 2, 2);

      ctx.font = 'bold 14px "Times New Roman"';
      ctx.fillStyle = '#6c5ce7';
      ctx.fillText('The quick brown fox 0Oo1Il!@#$', 4, 30);

      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(255, 107, 107, 0.7)';
      ctx.fillText('AaBbCcDdEeFfGgHh', 4, 55);

      // Shapes
      ctx.beginPath();
      ctx.arc(200, 100, 40, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(108, 92, 231, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#00b894';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bezier
      ctx.beginPath();
      ctx.moveTo(10, 100);
      ctx.bezierCurveTo(50, 50, 150, 130, 250, 80);
      ctx.strokeStyle = '#fd79a8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = '#fdcb6e';
      ctx.fillRect(240, 10, 50, 50);

      const dataUrl = canvas.toDataURL('image/png');
      this.signals.canvasHash = await this.sha256(dataUrl);
      this.entropyBits += 12;
    } catch {
      this.signals.canvasHash = 'error';
    }
  }

  // ── WebGL Fingerprint ───────────────────────────────────────────────────

  private async collectWebGL(): Promise<void> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl || !(gl instanceof WebGLRenderingContext)) {
        this.signals.webglHash = 'unsupported';
        return;
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

      this.signals.gpu = {
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        extensions: gl.getSupportedExtensions() || [],
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || '',
        maxAnisotropy: this.getMaxAnisotropy(gl),
      };

      this.signals.webglParams = {
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
        maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
        maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
        aliasedLineWidthRange: Array.from(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)),
        aliasedPointSizeRange: Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)),
        maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
        stencilBits: gl.getParameter(gl.STENCIL_BITS),
        depthBits: gl.getParameter(gl.DEPTH_BITS),
      };

      // Render scene and hash
      this.renderWebGLScene(gl);
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      this.signals.webglHash = await this.sha256(pixels.toString());

      this.entropyBits += 15;
    } catch {
      this.signals.webglHash = 'error';
    }
  }

  private getMaxAnisotropy(gl: WebGLRenderingContext): number {
    const ext = gl.getExtension('EXT_texture_filter_anisotropic')
      || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
      || gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
    return ext ? gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
  }

  private renderWebGLScene(gl: WebGLRenderingContext): void {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(
          sin(gl_FragCoord.x * 0.05) * 0.5 + 0.5,
          cos(gl_FragCoord.y * 0.07) * 0.5 + 0.5,
          sin(gl_FragCoord.x * gl_FragCoord.y * 0.001) * 0.5 + 0.5,
          1.0
        );
      }
    `);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // ── Audio Fingerprint ───────────────────────────────────────────────────

  private async collectAudio(): Promise<void> {
    try {
      const AudioCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
      if (!AudioCtx) {
        this.signals.audio = { sampleRate: 0, channelCount: 0, baseLatency: 0, outputLatency: 0, hash: 'unsupported' };
        return;
      }

      const ctx = new AudioCtx(1, 44100, 44100);
      const oscillator = ctx.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, ctx.currentTime);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, ctx.currentTime);
      compressor.knee.setValueAtTime(40, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);

      oscillator.connect(compressor);
      compressor.connect(ctx.destination);
      oscillator.start(0);

      const renderedBuffer = await ctx.startRendering();
      const audioData = renderedBuffer.getChannelData(0).slice(4500, 5000);
      const audioSum = audioData.reduce((sum, val) => sum + Math.abs(val), 0);

      // Get real-time context info
      let baseLatency = 0;
      let outputLatency = 0;
      let sampleRate = 44100;
      try {
        const realCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        baseLatency = (realCtx as any).baseLatency || 0;
        outputLatency = (realCtx as any).outputLatency || 0;
        sampleRate = realCtx.sampleRate;
        realCtx.close();
      } catch {}

      this.signals.audio = {
        sampleRate,
        channelCount: renderedBuffer.numberOfChannels,
        baseLatency,
        outputLatency,
        hash: await this.sha256(audioSum.toString()),
      };
      this.entropyBits += 10;
    } catch {
      this.signals.audio = { sampleRate: 0, channelCount: 0, baseLatency: 0, outputLatency: 0, hash: 'error' };
    }
  }

  // ── Font Detection ──────────────────────────────────────────────────────

  private async collectFonts(): Promise<void> {
    const testFonts = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Bookman Old Style',
      'Calibri', 'Cambria', 'Century', 'Century Gothic',
      'Comic Sans MS', 'Consolas', 'Constantia', 'Corbel',
      'Courier', 'Courier New', 'Ebrima', 'Franklin Gothic',
      'Gabriola', 'Gadugi', 'Georgia', 'Gill Sans',
      'Helvetica', 'Impact', 'Ink Free', 'Javanese Text',
      'Lucida Console', 'Lucida Sans', 'Malgun Gothic',
      'Marlett', 'Microsoft Sans Serif', 'Mongolian Baiti',
      'MS Gothic', 'MS PGothic', 'MS Sans Serif', 'MS Serif',
      'MV Boli', 'Myanmar Text', 'Nirmala UI', 'Palatino',
      'Palatino Linotype', 'San Francisco', 'Segoe Print',
      'Segoe Script', 'Segoe UI', 'SimSun', 'Sitka',
      'Sylfaen', 'Tahoma', 'Times', 'Times New Roman',
      'Trebuchet MS', 'Verdana', 'Yu Gothic', 'Menlo',
      'Monaco', 'Roboto', 'Ubuntu', 'DejaVu Sans',
      'Liberation Mono', 'Cantarell', 'Fira Sans', 'Droid Sans',
      'Noto Sans', 'Source Code Pro', 'SF Pro', 'Inter',
    ];

    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmMwWLli1I0OQ@#$%&';
    const testSize = '72px';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.signals.fonts = { available: [], hash: 'unsupported', count: 0 };
      return;
    }

    const baselines: Record<string, number> = {};
    for (const base of baseFonts) {
      ctx.font = `${testSize} ${base}`;
      baselines[base] = ctx.measureText(testString).width;
    }

    const detectedFonts: string[] = [];
    for (const font of testFonts) {
      let detected = false;
      for (const base of baseFonts) {
        ctx.font = `${testSize} '${font}', ${base}`;
        const width = ctx.measureText(testString).width;
        if (width !== baselines[base]) {
          detected = true;
          break;
        }
      }
      if (detected) detectedFonts.push(font);
    }

    this.signals.fonts = {
      available: detectedFonts,
      hash: await this.sha256(detectedFonts.join(',')),
      count: detectedFonts.length,
    };
    this.entropyBits += 8;
  }

  // ── CSS Preference Detection ────────────────────────────────────────────

  private async collectCSSPreferences(): Promise<void> {
    const match = (query: string) => window.matchMedia(query).matches;

    this.signals.cssPreferences = {
      colorScheme: match('(prefers-color-scheme: dark)') ? 'dark'
        : match('(prefers-color-scheme: light)') ? 'light' : 'no-preference',
      reducedMotion: match('(prefers-reduced-motion: reduce)'),
      reducedTransparency: match('(prefers-reduced-transparency: reduce)'),
      contrast: match('(prefers-contrast: more)') ? 'more'
        : match('(prefers-contrast: less)') ? 'less' : 'no-preference',
      forcedColors: match('(forced-colors: active)'),
      colorGamut: match('(color-gamut: rec2020)') ? 'rec2020'
        : match('(color-gamut: p3)') ? 'p3' : 'srgb',
      invertedColors: match('(inverted-colors: inverted)'),
      monochrome: match('(monochrome)'),
      hover: match('(hover: hover)') ? 'hover' : 'none',
      pointer: match('(pointer: fine)') ? 'fine'
        : match('(pointer: coarse)') ? 'coarse' : 'none',
    };
    this.entropyBits += 5;
  }

  // ── Connection Signals ──────────────────────────────────────────────────

  private async collectConnection(): Promise<void> {
    const conn = (navigator as any).connection
      || (navigator as any).mozConnection
      || (navigator as any).webkitConnection;

    this.signals.connection = {
      effectiveType: conn?.effectiveType || 'unknown',
      downlink: conn?.downlink || 0,
      rtt: conn?.rtt || 0,
      saveData: conn?.saveData || false,
    };
    this.entropyBits += 3;
  }

  // ── Storage Capabilities ────────────────────────────────────────────────

  private async collectStorageCapabilities(): Promise<void> {
    let storageEstimate: { quota: number; usage: number } | null = null;
    try {
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        storageEstimate = { quota: est.quota || 0, usage: est.usage || 0 };
      }
    } catch {}

    this.signals.storageCapabilities = {
      localStorage: this.testStorage('localStorage'),
      sessionStorage: this.testStorage('sessionStorage'),
      indexedDB: !!window.indexedDB,
      cookies: navigator.cookieEnabled,
      cacheAPI: 'caches' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webSQL: !!(window as any).openDatabase,
      estimate: storageEstimate,
    };
    this.entropyBits += 3;
  }

  private testStorage(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const key = '__fp_test__';
      storage.setItem(key, '1');
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  // ── API Availability ────────────────────────────────────────────────────

  private async collectAPIAvailability(): Promise<void> {
    this.signals.apiFingerprint = {
      webGL: !!document.createElement('canvas').getContext('webgl'),
      webGL2: !!document.createElement('canvas').getContext('webgl2'),
      webGPU: 'gpu' in navigator,
      webRTC: !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection),
      webAudio: !!(window.AudioContext || (window as any).webkitAudioContext),
      webSpeech: 'speechSynthesis' in window,
      webBluetooth: 'bluetooth' in navigator,
      webUSB: 'usb' in navigator,
      webNFC: 'NDEFReader' in window,
      webXR: 'xr' in navigator,
      webShare: 'share' in navigator,
      webPayment: 'PaymentRequest' in window,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      mediaDevices: !!(navigator.mediaDevices?.enumerateDevices),
      credentials: 'credentials' in navigator,
      clipboard: !!(navigator.clipboard),
      batteryAPI: 'getBattery' in navigator,
      gamepads: 'getGamepads' in navigator,
      midi: 'requestMIDIAccess' in navigator,
      serial: 'serial' in navigator,
      hid: 'hid' in navigator,
    };
    this.entropyBits += 6;
  }

  // ── Speech Voices ──────────────────────────────────────────────────────

  private async collectSpeechVoices(): Promise<void> {
    try {
      const getVoices = (): Promise<string[]> => {
        return new Promise((resolve) => {
          const voices = speechSynthesis.getVoices();
          if (voices.length) {
            resolve(voices.map(v => `${v.name}|${v.lang}|${v.localService}`));
            return;
          }
          speechSynthesis.onvoiceschanged = () => {
            resolve(speechSynthesis.getVoices().map(v => `${v.name}|${v.lang}|${v.localService}`));
          };
          setTimeout(() => resolve([]), 500);
        });
      };

      this.signals.speechVoices = await getVoices();
      this.entropyBits += 6;
    } catch {
      this.signals.speechVoices = [];
    }
  }

  // ── WebRTC IP Detection ─────────────────────────────────────────────────

  private async collectWebRTC(): Promise<void> {
    try {
      const ips: string[] = [];
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');

      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const match = e.candidate.candidate.match(
          /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
        );
        if (match && !ips.includes(match[1])) {
          ips.push(match[1]);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise(resolve => setTimeout(resolve, 1000));
      pc.close();

      this.signals.webrtcIPs = ips;
      this.entropyBits += ips.length > 0 ? 8 : 0;
    } catch {
      this.signals.webrtcIPs = [];
    }
  }

  // ── Performance Signals ─────────────────────────────────────────────────

  private async collectPerformance(): Promise<void> {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      const fpEntry = paint.find(e => e.name === 'first-paint');
      const fcpEntry = paint.find(e => e.name === 'first-contentful-paint');

      this.signals.performanceTiming = {
        navigationTiming: nav ? [
          nav.domainLookupEnd - nav.domainLookupStart,
          nav.connectEnd - nav.connectStart,
          nav.responseStart - nav.requestStart,
          nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          nav.loadEventEnd - nav.loadEventStart,
        ] : [],
        paintTiming: {
          firstPaint: fpEntry?.startTime || 0,
          firstContentfulPaint: fcpEntry?.startTime || 0,
        },
        memoryInfo: (performance as any).memory ? {
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        } : null,
      };
      this.entropyBits += 3;
    } catch {
      this.signals.performanceTiming = {
        navigationTiming: [],
        paintTiming: { firstPaint: 0, firstContentfulPaint: 0 },
        memoryInfo: null,
      };
    }
  }

  // ── Hash Utilities ──────────────────────────────────────────────────────

  private async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async computeCompositeHash(): Promise<string> {
    const stableSignals = {
      screen: this.signals.screen,
      hardware: this.signals.hardware,
      gpu: this.signals.gpu,
      canvasHash: this.signals.canvasHash,
      webglHash: this.signals.webglHash,
      webglParams: this.signals.webglParams,
      audioHash: this.signals.audio?.hash,
      fontsHash: this.signals.fonts?.hash,
      timezone: this.signals.timezone?.timezone,
      navigatorCore: {
        language: this.signals.navigator?.language,
        languages: this.signals.navigator?.languages,
        platform: this.signals.navigator?.platform,
        vendor: this.signals.navigator?.vendor,
      },
      cssPreferences: this.signals.cssPreferences,
      apiFingerprint: this.signals.apiFingerprint,
      speechVoices: this.signals.speechVoices,
    };

    return this.sha256(JSON.stringify(stableSignals));
  }
}
