/**
 * Virtual User Manager Service
 * 
 * Manages the lifecycle of virtual users:
 * - Create new virtual users
 * - Identify returning users via fingerprint matching
 * - Merge duplicate virtual users
 * - Build and update user profiles over time
 * - Manage privacy and data retention
 * 
 * @module services/virtual-user-manager
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { deviceFingerprintingService, type FingerprintSignals, type IdentificationConfidence } from './device-fingerprinting-service';
import { encrypt, decrypt } from '../lib/encryption';

const prisma = new PrismaClient();

export interface VirtualUserProfile {
  id: string;
  displayName: string | null;
  topicInterests: string[];
  entityProfiles: any[];
  conversationCount: number;
  memoryCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  consentGiven: boolean;
  dataRetentionPolicy: string;
}

export interface VirtualUserSession {
  id: string;
  virtualUserId: string;
  sessionToken: string;
  expiresAt: Date;
  isActive: boolean;
}

export interface IdentifyVirtualUserRequest {
  fingerprint: string;
  signals: FingerprintSignals;
  ipAddress?: string;
  userAgent?: string;
  existingSessionToken?: string;
}

export interface IdentifyVirtualUserResponse {
  virtualUserId: string;
  sessionToken: string;
  identification: IdentificationConfidence;
  profile: VirtualUserProfile;
  consentRequired: boolean;
  isNewUser: boolean;
}

export interface CreateVirtualUserOptions {
  fingerprint: string;
  signals: FingerprintSignals;
  ipAddress?: string;
  userAgent?: string;
  displayName?: string;
}

export interface MergeVirtualUsersOptions {
  sourceVirtualUserId: string;
  targetVirtualUserId: string;
  reason: 'confidence_match' | 'manual' | 'duplicate_detection';
  sessionToken: string;
}

/**
 * Virtual User Manager Service
 */
export class VirtualUserManagerService {
  private static instance: VirtualUserManagerService;
  
  private constructor() {}
  
  static getInstance(): VirtualUserManagerService {
    if (!VirtualUserManagerService.instance) {
      VirtualUserManagerService.instance = new VirtualUserManagerService();
    }
    return VirtualUserManagerService.instance;
  }
  
  /**
   * Identify or create a virtual user based on fingerprint and signals
   */
  async identifyOrCreateVirtualUser(
    request: IdentifyVirtualUserRequest
  ): Promise<IdentifyVirtualUserResponse> {
    const { fingerprint, signals, ipAddress, userAgent, existingSessionToken } = request;
    
    // Try to identify existing user by session token first
    if (existingSessionToken) {
      const session = await this.getSessionByToken(existingSessionToken);
      if (session && session.isActive && session.expiresAt > new Date()) {
        const virtualUser = await this.getVirtualUserById(session.virtualUserId);
        if (virtualUser) {
          // Update last seen
          await this.updateLastSeen(virtualUser.id, ipAddress);
          
          return {
            virtualUserId: virtualUser.id,
            sessionToken: existingSessionToken,
            identification: deviceFingerprintingService.calculateIdentificationConfidence({
              cookieMatch: true,
              fingerprintSimilarity: 100,
              ipMatch: ipAddress === virtualUser.lastIpAddress,
              userAgentMatch: userAgent === userAgent
            }),
            profile: this.mapToProfile(virtualUser),
            consentRequired: !virtualUser.consentGiven,
            isNewUser: false
          };
        }
      }
    }
    
    // Search for matching virtual user by fingerprint
    const existingUser = await this.findVirtualUserByFingerprint(fingerprint);
    
    if (existingUser) {
      // Calculate identification confidence
      const confidence = deviceFingerprintingService.calculateIdentificationConfidence({
        fingerprintSimilarity: 100, // Exact fingerprint match
        cookieMatch: false,
        ipMatch: ipAddress === existingUser.lastIpAddress,
        userAgentMatch: userAgent === userAgent
      });
      
      // Update last seen and signals
      await this.updateLastSeen(existingUser.id, ipAddress);
      await this.updateSignals(existingUser.id, signals);
      
      // Create new session
      const session = await this.createSession(existingUser.id, fingerprint, ipAddress, userAgent);
      
      return {
        virtualUserId: existingUser.id,
        sessionToken: session.sessionToken,
        identification: confidence,
        profile: this.mapToProfile(existingUser),
        consentRequired: !existingUser.consentGiven,
        isNewUser: false
      };
    }
    
    // No matching user found - create new virtual user
    const newUser = await this.createVirtualUser({
      fingerprint,
      signals,
      ipAddress,
      userAgent,
      displayName: this.generateDisplayName()
    });
    
    // Create session
    const session = await this.createSession(newUser.id, fingerprint, ipAddress, userAgent);
    
    return {
      virtualUserId: newUser.id,
      sessionToken: session.sessionToken,
      identification: deviceFingerprintingService.calculateIdentificationConfidence({
        fingerprintSimilarity: 100,
        cookieMatch: false,
        ipMatch: false,
        userAgentMatch: false
      }),
      profile: this.mapToProfile(newUser),
      consentRequired: true,
      isNewUser: true
    };
  }
  
  /**
   * Create a new virtual user
   */
  async createVirtualUser(options: CreateVirtualUserOptions): Promise<any> {
    const { fingerprint, signals, ipAddress, userAgent, displayName } = options;
    
    // Encrypt sensitive signals
    const encryptedSignals = this.encryptSignals(signals);
    
    const virtualUser = await prisma.virtualUser.create({
      data: {
        fingerprint,
        displayName: displayName || this.generateDisplayName(),
        fingerprintSignals: encryptedSignals,
        ipHistory: ipAddress ? [this.createIpRecord(ipAddress)] : [],
        userAgentHistory: userAgent ? [userAgent] : [],
        deviceCharacteristics: this.extractDeviceCharacteristics(signals),
        lastIpAddress: ipAddress || null,
        confidenceScore: deviceFingerprintingService.generateFingerprint(signals).then(r => r.confidence).catch(() => 50)
      }
    });
    
    // Track analytics
    await this.trackAnalyticsEvent('new_virtual_user');
    
    return virtualUser;
  }
  
  /**
   * Find virtual user by fingerprint
   */
  async findVirtualUserByFingerprint(fingerprint: string): Promise<any | null> {
    return prisma.virtualUser.findUnique({
      where: { fingerprint }
    });
  }
  
  /**
   * Find virtual user by session token
   */
  async findVirtualUserBySessionToken(sessionToken: string): Promise<any | null> {
    const session = await prisma.virtualSession.findUnique({
      where: { sessionToken },
      include: { virtualUser: true }
    });
    
    return session?.virtualUser || null;
  }
  
  /**
   * Get virtual user by ID
   */
  async getVirtualUserById(id: string): Promise<any | null> {
    return prisma.virtualUser.findUnique({
      where: { id }
    });
  }
  
  /**
   * Get virtual user profile with stats
   */
  async getVirtualUserProfile(virtualUserId: string): Promise<VirtualUserProfile | null> {
    const virtualUser = await this.getVirtualUserById(virtualUserId);
    if (!virtualUser) return null;
    
    return this.mapToProfile(virtualUser);
  }
  
  /**
   * Update virtual user consent
   */
  async updateConsent(virtualUserId: string, consentGiven: boolean, dataRetentionPolicy: string): Promise<void> {
    await prisma.virtualUser.update({
      where: { id: virtualUserId },
      data: {
        consentGiven,
        consentTimestamp: consentGiven ? new Date() : null,
        dataRetentionPolicy
      }
    });
    
    if (consentGiven) {
      await this.trackAnalyticsEvent('consent_given');
    }
  }
  
  /**
   * Merge two virtual users
   */
  async mergeVirtualUsers(options: MergeVirtualUsersOptions): Promise<{ success: boolean; targetVirtualUserId: string }> {
    const { sourceVirtualUserId, targetVirtualUserId, reason, sessionToken } = options;
    
    // Verify session token
    const session = await this.getSessionByToken(sessionToken);
    if (!session || session.virtualUserId !== targetVirtualUserId) {
      throw new Error('Invalid session token');
    }
    
    // Get both users
    const sourceUser = await this.getVirtualUserById(sourceVirtualUserId);
    const targetUser = await this.getVirtualUserById(targetVirtualUserId);
    
    if (!sourceUser || !targetUser) {
      throw new Error('Virtual user not found');
    }
    
    // Perform merge in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Merge memories (deduplicate by content hash)
      const sourceMemories = await tx.virtualMemory.findMany({
        where: { virtualUserId: sourceVirtualUserId }
      });
      
      const targetMemories = await tx.virtualMemory.findMany({
        where: { virtualUserId: targetVirtualUserId }
      });
      
      const targetMemoryHashes = new Set(targetMemories.map(m => m.contentHash));
      
      for (const memory of sourceMemories) {
        if (!targetMemoryHashes.has(memory.contentHash)) {
          await tx.virtualMemory.update({
            where: { id: memory.id },
            data: { virtualUserId: targetVirtualUserId }
          });
        }
      }
      
      // 2. Merge conversations
      await tx.virtualConversation.updateMany({
        where: { virtualUserId: sourceVirtualUserId },
        data: { virtualUserId: targetVirtualUserId }
      });
      
      // 3. Merge ACUs
      await tx.virtualACU.updateMany({
        where: { virtualUserId: sourceVirtualUserId },
        data: { virtualUserId: targetVirtualUserId }
      });
      
      // 4. Merge notebooks
      await tx.virtualNotebook.updateMany({
        where: { virtualUserId: sourceVirtualUserId },
        data: { virtualUserId: targetVirtualUserId }
      });
      
      // 5. Update target user profile
      const mergedTopicInterests = [
        ...new Set([
          ...(sourceUser.topicInterests as string[] || []),
          ...(targetUser.topicInterests as string[] || [])
        ])
      ];
      
      await tx.virtualUser.update({
        where: { id: targetVirtualUserId },
        data: {
          topicInterests: mergedTopicInterests,
          conversationCount: { increment: sourceUser.conversationCount },
          memoryCount: { increment: sourceUser.memoryCount }
        }
      });
      
      // 6. Mark source user as merged/deleted
      await tx.virtualUser.update({
        where: { id: sourceVirtualUserId },
        data: {
          deletedAt: new Date(),
          metadata: {
            mergedInto: targetVirtualUserId,
            mergedAt: new Date().toISOString(),
            reason
          }
        }
      });
      
      // 7. Invalidate source user sessions
      await tx.virtualSession.updateMany({
        where: { virtualUserId: sourceVirtualUserId },
        data: { isActive: false }
      });
    });
    
    await this.trackAnalyticsEvent('virtual_user_merge');
    
    return { success: true, targetVirtualUserId };
  }
  
  /**
   * Delete virtual user and all associated data
   */
  async deleteVirtualUser(virtualUserId: string): Promise<void> {
    await prisma.virtualUser.delete({
      where: { id: virtualUserId }
    });
    
    await this.trackAnalyticsEvent('virtual_user_delete');
  }
  
  /**
   * Anonymize virtual user data (GDPR compliance)
   */
  async anonymizeVirtualUser(virtualUserId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. Anonymize memories
      await tx.virtualMemory.updateMany({
        where: { virtualUserId },
        data: {
          content: '[ANONYMIZED]',
          summary: null,
          metadata: { anonymized: true }
        }
      });
      
      // 2. Clear identifying signals
      await tx.virtualUser.update({
        where: { id: virtualUserId },
        data: {
          fingerprintSignals: {},
          ipHistory: [],
          userAgentHistory: [],
          deviceCharacteristics: {},
          displayName: 'Anonymous User',
          anonymizedAt: new Date()
        }
      });
      
      // 3. Delete sessions
      await tx.virtualSession.deleteMany({
        where: { virtualUserId }
      });
    });
    
    await this.trackAnalyticsEvent('virtual_user_anonymize');
  }
  
  /**
   * Update user profile based on interactions
   */
  async updateProfile(virtualUserId: string, updates: {
    topicInterests?: string[];
    entityProfiles?: any[];
  }): Promise<void> {
    const updateData: any = {};
    
    if (updates.topicInterests) {
      // Merge with existing interests
      const existingUser = await this.getVirtualUserById(virtualUserId);
      const existingInterests = existingUser?.topicInterests as string[] || [];
      updateData.topicInterests = [...new Set([...existingInterests, ...updates.topicInterests])];
    }
    
    if (updates.entityProfiles) {
      const existingUser = await this.getVirtualUserById(virtualUserId);
      const existingEntities = existingUser?.entityProfiles as any[] || [];
      updateData.entityProfiles = [...existingEntities, ...updates.entityProfiles];
    }
    
    if (Object.keys(updateData).length > 0) {
      await prisma.virtualUser.update({
        where: { id: virtualUserId },
        data: updateData
      });
    }
  }
  
  /**
   * Increment conversation count
   */
  async incrementConversationCount(virtualUserId: string): Promise<void> {
    await prisma.virtualUser.update({
      where: { id: virtualUserId },
      data: {
        conversationCount: { increment: 1 },
        lastSeenAt: new Date()
      }
    });
  }
  
  /**
   * Increment memory count
   */
  async incrementMemoryCount(virtualUserId: string, count: number = 1): Promise<void> {
    await prisma.virtualUser.update({
      where: { id: virtualUserId },
      data: {
        memoryCount: { increment: count }
      }
    });
  }
  
  // ==================== Private Helper Methods ====================
  
  /**
   * Create a new session for a virtual user
   */
  private async createSession(
    virtualUserId: string,
    fingerprint: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<VirtualUserSession> {
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const session = await prisma.virtualSession.create({
      data: {
        virtualUserId,
        sessionToken,
        fingerprint,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt,
        isActive: true
      }
    });
    
    return {
      id: session.id,
      virtualUserId: session.virtualUserId,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      isActive: session.isActive
    };
  }
  
  /**
   * Get session by token
   */
  private async getSessionByToken(token: string): Promise<any | null> {
    return prisma.virtualSession.findUnique({
      where: { sessionToken: token }
    });
  }
  
  /**
   * Update last seen timestamp and IP
   */
  private async updateLastSeen(virtualUserId: string, ipAddress?: string): Promise<void> {
    const updateData: any = {
      lastSeenAt: new Date()
    };
    
    if (ipAddress) {
      updateData.lastIpAddress = ipAddress;
      
      // Add to IP history
      const user = await this.getVirtualUserById(virtualUserId);
      const ipHistory = user?.ipHistory as any[] || [];
      ipHistory.push(this.createIpRecord(ipAddress));
      
      // Keep last 100 IPs
      updateData.ipHistory = ipHistory.slice(-100);
    }
    
    await prisma.virtualUser.update({
      where: { id: virtualUserId },
      data: updateData
    });
  }
  
  /**
   * Update fingerprint signals
   */
  private async updateSignals(virtualUserId: string, signals: FingerprintSignals): Promise<void> {
    const user = await this.getVirtualUserById(virtualUserId);
    
    const updateData: any = {};
    
    // Update user agent history
    if (signals.userAgent) {
      const userAgentHistory = user?.userAgentHistory as string[] || [];
      if (!userAgentHistory.includes(signals.userAgent)) {
        userAgentHistory.push(signals.userAgent);
        updateData.userAgentHistory = userAgentHistory.slice(-50); // Keep last 50
      }
    }
    
    // Update device characteristics
    updateData.deviceCharacteristics = {
      ...user?.deviceCharacteristics,
      ...this.extractDeviceCharacteristics(signals)
    };
    
    await prisma.virtualUser.update({
      where: { id: virtualUserId },
      data: updateData
    });
  }
  
  /**
   * Encrypt fingerprint signals
   */
  private encryptSignals(signals: FingerprintSignals): any {
    // Encrypt sensitive fields
    const encrypted: any = {};
    
    for (const [key, value] of Object.entries(signals)) {
      if (value !== undefined) {
        try {
          encrypted[key] = encrypt(JSON.stringify(value));
        } catch (error) {
          encrypted[key] = value; // Fallback to unencrypted if encryption fails
        }
      }
    }
    
    return encrypted;
  }
  
  /**
   * Extract device characteristics from signals
   */
  private extractDeviceCharacteristics(signals: FingerprintSignals): any {
    return {
      screenResolution: signals.screenResolution,
      screenColorDepth: signals.screenColorDepth,
      hardwareConcurrency: signals.hardwareConcurrency,
      deviceMemory: signals.deviceMemory,
      touchPoints: signals.touchPoints,
      platform: signals.platform,
      maxTouchPoints: signals.maxTouchPoints
    };
  }
  
  /**
   * Create IP record with timestamp
   */
  private createIpRecord(ipAddress: string): any {
    return {
      ip: ipAddress,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Generate a friendly display name for new virtual users
   */
  private generateDisplayName(): string {
    const adjectives = ['Curious', 'Friendly', 'Smart', 'Creative', 'Thoughtful', 'Enthusiastic', 'Insightful', 'Witty'];
    const nouns = ['Explorer', 'Learner', 'Thinker', 'Creator', 'Seeker', 'Dreamer', 'Builder', 'Discoverer'];
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 10000);
    
    return `${adj} ${noun} #${num}`;
  }
  
  /**
   * Map database virtual user to profile object
   */
  private mapToProfile(virtualUser: any): VirtualUserProfile {
    return {
      id: virtualUser.id,
      displayName: virtualUser.displayName,
      topicInterests: virtualUser.topicInterests as string[] || [],
      entityProfiles: virtualUser.entityProfiles as any[] || [],
      conversationCount: virtualUser.conversationCount,
      memoryCount: virtualUser.memoryCount,
      firstSeenAt: virtualUser.firstSeenAt,
      lastSeenAt: virtualUser.lastSeenAt,
      consentGiven: virtualUser.consentGiven,
      dataRetentionPolicy: virtualUser.dataRetentionPolicy
    };
  }
  
  /**
   * Track analytics event
   */
  private async trackAnalyticsEvent(eventType: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    try {
      await prisma.virtualUserAnalytics.upsert({
        where: { date: today },
        update: this.getAnalyticsUpdate(eventType),
        create: {
          date: today,
          ...this.getAnalyticsCreate(eventType)
        }
      });
    } catch (error) {
      console.error('Failed to track virtual user analytics:', error);
    }
  }
  
  /**
   * Get analytics update data
   */
  private getAnalyticsUpdate(eventType: string): any {
    switch (eventType) {
      case 'new_virtual_user':
        return { newVirtualUsers: { increment: 1 } };
      case 'consent_given':
        return { consentsGiven: { increment: 1 } };
      case 'virtual_user_merge':
        return {}; // Could track merges separately
      case 'virtual_user_delete':
        return { deletionsRequested: { increment: 1 } };
      case 'virtual_user_anonymize':
        return {}; // Could track anonymizations separately
      default:
        return {};
    }
  }
  
  /**
   * Get analytics create data
   */
  private getAnalyticsCreate(eventType: string): any {
    const base = {
      newVirtualUsers: 0,
      activeVirtualUsers: 0,
      totalSessions: 0,
      totalConversations: 0,
      totalMessages: 0,
      memoriesCreated: 0,
      highConfidenceIdentifications: 0,
      mediumConfidenceIdentifications: 0,
      lowConfidenceIdentifications: 0,
      falsePositives: 0,
      consentsGiven: 0,
      consentsDenied: 0,
      deletionsRequested: 0,
      avgSessionDuration: 0,
      avgConversationsPerUser: 0,
      avgMemoriesPerUser: 0
    };
    
    switch (eventType) {
      case 'new_virtual_user':
        return { ...base, newVirtualUsers: 1 };
      case 'consent_given':
        return { ...base, consentsGiven: 1 };
      case 'virtual_user_delete':
        return { ...base, deletionsRequested: 1 };
      default:
        return base;
    }
  }
}

// Export singleton instance
export const virtualUserManagerService = VirtualUserManagerService.getInstance();
