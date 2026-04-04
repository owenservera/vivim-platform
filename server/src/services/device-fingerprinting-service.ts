/**
 * Device Fingerprinting Service
 * 
 * Generates unique device fingerprints using multiple browser signals:
 * - Canvas fingerprinting
 * - WebGL fingerprinting
 * - Audio context fingerprinting
 * - Font detection
 * - Screen characteristics
 * - Battery status
 * - Touch support
 * - Hardware concurrency
 * - Device memory
 * - User agent
 * - Timezone
 * - Language
 * - IP address (server-side)
 * 
 * @module services/device-fingerprinting-service
 */

import { createHash } from 'crypto';

export interface FingerprintSignals {
  // Canvas
  canvas?: string;
  canvasWinding?: string;
  
  // WebGL
  webglVendor?: string;
  webglRenderer?: string;
  webglVersion?: string;
  webglShadingLanguageVersion?: string;
  webglExtensions?: string;
  webglUnmaskedVendor?: string;
  webglUnmaskedRenderer?: string;
  
  // Audio
  audio?: string;
  
  // Fonts
  fonts?: string[];
  
  // Screen
  screenResolution?: string;
  screenColorDepth?: number;
  screenPixelRatio?: number;
  screenOrientation?: string;
  
  // Battery
  batteryLevel?: number;
  batteryCharging?: boolean;
  
  // Touch
  touchPoints?: number;
  
  // Hardware
  hardwareConcurrency?: number;
  deviceMemory?: number;
  
  // Browser
  userAgent?: string;
  language?: string;
  languages?: string[];
  timezone?: string;
  timezoneOffset?: number;
  platform?: string;
  
  // Cookies
  cookiesEnabled?: boolean;
  doNotTrack?: string;
  
  // Misc
  maxTouchPoints?: number;
  pdfViewerEnabled?: boolean;
}

export interface FingerprintResult {
  hash: string;
  signals: FingerprintSignals;
  confidence: number;
  components: string[];
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

/**
 * List of fonts to detect
 */
const FONTS_TO_DETECT = [
  'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia',
  'Impact', 'Times New Roman', 'Trebuchet MS', 'Verdana',
  'Helvetica', 'Calibri', 'Cambria', 'Candara', 'Consolas',
  'Constantia', 'Corbel', 'Franklin Gothic', 'Futura', 'Garamond',
  'Geneva', 'Gill Sans', 'Lucida', 'Lucida Console', 'Lucida Sans Unicode',
  'Palatino', 'Tahoma', 'Trebuchet MS', 'Univers',
  // Chinese fonts
  'Microsoft YaHei', 'SimSun', 'SimHei', 'FangSong', 'KaiTi',
  'STHeiti', 'STSong', 'STFangsong', 'STKaiti',
  // Japanese fonts
  'MS Mincho', 'MS Gothic', 'MS PGothic', 'Hiragino Sans', 'Hiragino Mincho',
  // Korean fonts
  'Malgun Gothic', 'Batang', 'Dotum',
  // Arabic fonts
  'Arial', 'Traditional Arabic', 'Simplified Arabic',
  // Hebrew fonts
  'Arial', 'David', 'Frank Ruehl',
  // Thai fonts
  'Angsana New', 'Cordia New', 'Leelawadee',
  // Indian fonts
  'Mangal', 'Raavi', 'Shruti', 'Tunga',
  // Other common fonts
  'Andale Mono', 'Apple Chancery', 'Bradley Hand', 'Brush Script MT',
  'Chicago', 'Cochin', 'Copperplate', 'Didot', 'Fantasy', 'Fresco',
  'Garuda', 'Gurmukhi', 'Kailasa', 'Kartika', 'Lao UI', 'Loma',
  'Mshtakan', 'Narkisim', 'Noteworthy', 'Onyx', 'Optima', 'Oswald',
  'Papyrus', 'Plantagenet Cherokee', 'Rockwell', 'SignPainter',
  'Skia', 'Snell Roundhand', 'Source Han Sans', 'Source Han Serif',
  'Suranna', 'Symbol', 'Teko', 'Trirong', 'Zapf Dingbats', 'Zapf Chancery'
];

/**
 * Device Fingerprinting Service
 */
export class DeviceFingerprintingService {
  private static instance: DeviceFingerprintingService;
  
  private constructor() {}
  
  static getInstance(): DeviceFingerprintingService {
    if (!DeviceFingerprintingService.instance) {
      DeviceFingerprintingService.instance = new DeviceFingerprintingService();
    }
    return DeviceFingerprintingService.instance;
  }
  
  /**
   * Generate a composite fingerprint from multiple signals
   */
  async generateFingerprint(signals: FingerprintSignals): Promise<FingerprintResult> {
    const components: string[] = [];
    
    // Add each signal component to the fingerprint
    if (signals.canvas) {
      components.push(`canvas:${signals.canvas}`);
    }
    if (signals.webglVendor && signals.webglRenderer) {
      components.push(`webgl:${signals.webglVendor}|${signals.webglRenderer}`);
    }
    if (signals.audio) {
      components.push(`audio:${signals.audio}`);
    }
    if (signals.fonts && signals.fonts.length > 0) {
      components.push(`fonts:${signals.fonts.sort().join(',')}`);
    }
    if (signals.screenResolution) {
      components.push(`screen:${signals.screenResolution}`);
    }
    if (signals.screenColorDepth) {
      components.push(`colorDepth:${signals.screenColorDepth}`);
    }
    if (signals.hardwareConcurrency) {
      components.push(`cpu:${signals.hardwareConcurrency}`);
    }
    if (signals.deviceMemory) {
      components.push(`memory:${signals.deviceMemory}`);
    }
    if (signals.userAgent) {
      components.push(`ua:${signals.userAgent}`);
    }
    if (signals.language) {
      components.push(`lang:${signals.language}`);
    }
    if (signals.timezone) {
      components.push(`tz:${signals.timezone}`);
    }
    if (signals.platform) {
      components.push(`platform:${signals.platform}`);
    }
    
    // Generate hash from components
    const fingerprintData = components.join('|');
    const hash = this.generateHash(fingerprintData);
    
    // Calculate confidence based on number and quality of signals
    const confidence = this.calculateConfidence(signals, components.length);
    
    return {
      hash,
      signals,
      confidence,
      components
    };
  }
  
  /**
   * Calculate confidence score for a fingerprint
   */
  private calculateConfidence(signals: FingerprintSignals, componentCount: number): number {
    let score = 0;
    let maxScore = 0;
    
    // Canvas fingerprint (high entropy)
    if (signals.canvas) {
      score += 25;
      maxScore += 25;
    }
    
    // WebGL (high entropy)
    if (signals.webglVendor && signals.webglRenderer) {
      score += 20;
      maxScore += 20;
    }
    
    // Audio (medium entropy)
    if (signals.audio) {
      score += 15;
      maxScore += 15;
    }
    
    // Fonts (medium entropy)
    if (signals.fonts && signals.fonts.length > 0) {
      const fontScore = Math.min(15, signals.fonts.length * 0.5);
      score += fontScore;
      maxScore += 15;
    }
    
    // Screen resolution (low entropy)
    if (signals.screenResolution) {
      score += 5;
      maxScore += 5;
    }
    
    // Hardware concurrency (low entropy)
    if (signals.hardwareConcurrency) {
      score += 5;
      maxScore += 5;
    }
    
    // Device memory (low entropy)
    if (signals.deviceMemory) {
      score += 5;
      maxScore += 5;
    }
    
    // User agent (low entropy, easily spoofed)
    if (signals.userAgent) {
      score += 5;
      maxScore += 5;
    }
    
    // Timezone (low entropy)
    if (signals.timezone) {
      score += 3;
      maxScore += 3;
    }
    
    // Language (low entropy)
    if (signals.language) {
      score += 2;
      maxScore += 2;
    }
    
    // Normalize to 0-100
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }
  
  /**
   * Generate SHA-256 hash of data
   */
  private generateHash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Compare two fingerprints and calculate similarity
   */
  compareFingerprints(fp1: FingerprintResult, fp2: FingerprintResult): {
    similarity: number;
    matchingComponents: string[];
    differentComponents: string[];
  } {
    const components1 = new Set(fp1.components);
    const components2 = new Set(fp2.components);
    
    const matchingComponents: string[] = [];
    const differentComponents: string[] = [];
    
    // Find matching components
    for (const comp of components1) {
      if (components2.has(comp)) {
        matchingComponents.push(comp);
      } else {
        differentComponents.push(comp);
      }
    }
    
    // Add components only in fp2
    for (const comp of components2) {
      if (!components1.has(comp)) {
        differentComponents.push(comp);
      }
    }
    
    // Calculate similarity
    const totalComponents = components1.size + components2.size;
    const similarity = totalComponents > 0
      ? (matchingComponents.length * 2 / totalComponents) * 100
      : 0;
    
    return {
      similarity: Math.round(similarity * 100) / 100,
      matchingComponents,
      differentComponents
    };
  }
  
  /**
   * Calculate identification confidence based on multiple signals
   */
  calculateIdentificationConfidence(options: {
    fingerprintSimilarity?: number;
    cookieMatch?: boolean;
    ipMatch?: boolean;
    userAgentMatch?: boolean;
    behavioralScore?: number;
  }): IdentificationConfidence {
    const {
      fingerprintSimilarity = 0,
      cookieMatch = false,
      ipMatch = false,
      userAgentMatch = false,
      behavioralScore = 0
    } = options;
    
    // Calculate individual signal scores
    const fingerprintScore = fingerprintSimilarity;
    const cookieScore = cookieMatch ? 100 : 0;
    const ipUaScore = (ipMatch ? 50 : 0) + (userAgentMatch ? 50 : 0);
    const behavioralScoreNormalized = behavioralScore;
    
    // Weighted average
    const totalScore = (
      fingerprintScore * 0.4 +
      cookieScore * 0.3 +
      ipUaScore * 0.15 +
      behavioralScoreNormalized * 0.15
    );
    
    // Determine level
    let level: 'HIGH' | 'MEDIUM' | 'LOW';
    if (totalScore >= 75) {
      level = 'HIGH';
    } else if (totalScore >= 60) {
      level = 'MEDIUM';
    } else {
      level = 'LOW';
    }
    
    return {
      score: Math.round(totalScore * 100) / 100,
      level,
      signals: {
        fingerprint: Math.round(fingerprintScore * 100) / 100,
        cookie: cookieScore,
        ip_ua: ipUaScore,
        behavioral: behavioralScoreNormalized
      },
      threshold: {
        auto_identify: 75,
        suggest_merge: 60,
        create_new: 0
      }
    };
  }
  
  /**
   * Sanitize user agent for fingerprinting (remove version numbers for stability)
   */
  sanitizeUserAgent(userAgent: string): string {
    // Remove specific version numbers but keep browser/OS identification
    return userAgent
      .replace(/Chrome\/[\d.]+/g, 'Chrome')
      .replace(/Firefox\/[\d.]+/g, 'Firefox')
      .replace(/Safari\/[\d.]+/g, 'Safari')
      .replace(/Edge\/[\d.]+/g, 'Edge')
      .replace(/Version\/[\d.]+/g, 'Version')
      .replace(/MSIE\s[\d.]+/g, 'MSIE')
      .replace(/Trident\/[\d.]+/g, 'Trident');
  }
  
  /**
   * Normalize screen resolution for fingerprinting
   */
  normalizeScreenResolution(width: number, height: number): string {
    // Round to nearest 100 to reduce noise from small changes
    const roundedWidth = Math.round(width / 100) * 100;
    const roundedHeight = Math.round(height / 100) * 100;
    return `${roundedWidth}x${roundedHeight}`;
  }
  
  /**
   * Check if fingerprint is strong enough for identification
   */
  isFingerprintStrongEnough(fingerprint: FingerprintResult, threshold: number = 60): boolean {
    return fingerprint.confidence >= threshold;
  }
}

// Export singleton instance
export const deviceFingerprintingService = DeviceFingerprintingService.getInstance();

// Export types
export type { FingerprintSignals, FingerprintResult, IdentificationConfidence };
