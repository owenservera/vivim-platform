/**
 * Virtual User Privacy & Data Retention Service
 * 
 * Handles GDPR compliance for virtual users:
 * - Data retention policies (automatic deletion)
 * - Right to access (data export)
 * - Right to erasure (complete deletion)
 * - Right to anonymization
 * - Consent management
 * - Access audit logging
 * 
 * @module services/virtual-user-privacy
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger.js';

export type DataRetentionPolicy = '7_days' | '30_days' | '90_days' | '1_year' | 'indefinite';

export interface RetentionPolicyConfig {
  policy: DataRetentionPolicy;
  durationDays: number;
  autoDelete: boolean;
}

export interface PrivacyAuditLog {
  virtualUserId: string;
  action: 'export' | 'delete' | 'anonymize' | 'consent_given' | 'consent_withdrawn';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Data retention policy configurations
 */
const RETENTION_POLICIES: Record<DataRetentionPolicy, RetentionPolicyConfig> = {
  '7_days': { policy: '7_days', durationDays: 7, autoDelete: true },
  '30_days': { policy: '30_days', durationDays: 30, autoDelete: true },
  '90_days': { policy: '90_days', durationDays: 90, autoDelete: true },
  '1_year': { policy: '1_year', durationDays: 365, autoDelete: true },
  'indefinite': { policy: 'indefinite', durationDays: Infinity, autoDelete: false }
};

/**
 * Virtual User Privacy Service
 */
export class VirtualUserPrivacyService {
  private static instance: VirtualUserPrivacyService;
  private prisma: PrismaClient;
  
  private constructor() {
    this.prisma = new PrismaClient();
  }
  
  static getInstance(): VirtualUserPrivacyService {
    if (!VirtualUserPrivacyService.instance) {
      VirtualUserPrivacyService.instance = new VirtualUserPrivacyService();
    }
    return VirtualUserPrivacyService.instance;
  }
  
  /**
   * Get retention policy configuration
   */
  getRetentionPolicy(policy: DataRetentionPolicy): RetentionPolicyConfig {
    return RETENTION_POLICIES[policy];
  }
  
  /**
   * Calculate expiration date based on policy
   */
  calculateExpirationDate(policy: DataRetentionPolicy, fromDate: Date = new Date()): Date {
    const config = RETENTION_POLICIES[policy];
    if (config.durationDays === Infinity) {
      return new Date('9999-12-31');
    }
    
    const expirationDate = new Date(fromDate);
    expirationDate.setDate(expirationDate.getDate() + config.durationDays);
    return expirationDate;
  }
  
  /**
   * Run automated data retention cleanup
   * Should be called periodically (e.g., daily cron job)
   */
  async runRetentionCleanup(): Promise<{
    deletedUsers: number;
    deletedMemories: number;
    deletedConversations: number;
    anonymizedUsers: number;
  }> {
    logger.info('Starting virtual user retention cleanup');
    
    const now = new Date();
    const result = {
      deletedUsers: 0,
      deletedMemories: 0,
      deletedConversations: 0,
      anonymizedUsers: 0
    };
    
    try {
      // Find virtual users with expired data
      const expiredUsers = await this.prisma.virtualUser.findMany({
        where: {
          consentGiven: true,
          dataRetentionPolicy: {
            in: ['7_days', '30_days', '90_days', '1_year']
          },
          lastSeenAt: {
            lt: this.calculateCutoffDate('90_days') // Default to 90 days for safety
          }
        },
        take: 1000 // Batch process
      });
      
      for (const user of expiredUsers) {
        const policy = user.dataRetentionPolicy as DataRetentionPolicy;
        const cutoffDate = this.calculateCutoffDate(policy);
        
        if (user.lastSeenAt < cutoffDate) {
          // User has expired - delete or anonymize
          if (RETENTION_POLICIES[policy].autoDelete) {
            await this.deleteVirtualUser(user.id, 'retention_policy');
            result.deletedUsers++;
          } else {
            await this.anonymizeVirtualUser(user.id);
            result.anonymizedUsers++;
          }
        }
      }
      
      logger.info({ 
        deletedUsers: result.deletedUsers,
        anonymizedUsers: result.anonymizedUsers 
      }, 'Retention cleanup completed');
      
      return result;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Retention cleanup failed');
      throw error;
    }
  }
  
  /**
   * Delete a virtual user and all associated data
   */
  async deleteVirtualUser(
    virtualUserId: string,
    reason: 'user_request' | 'retention_policy' | 'admin_request' = 'user_request'
  ): Promise<void> {
    logger.info({ virtualUserId, reason }, 'Deleting virtual user');
    
    await this.prisma.$transaction(async (tx) => {
      // 1. Delete memories
      const memoriesDeleted = await tx.virtualMemory.deleteMany({
        where: { virtualUserId }
      });
      
      // 2. Delete ACUs
      const acusDeleted = await tx.virtualACU.deleteMany({
        where: { virtualUserId }
      });
      
      // 3. Delete notebooks (entries cascade)
      const notebooksDeleted = await tx.virtualNotebook.deleteMany({
        where: { virtualUserId }
      });
      
      // 4. Delete conversations (messages cascade)
      const conversationsDeleted = await tx.virtualConversation.deleteMany({
        where: { virtualUserId }
      });
      
      // 5. Delete sessions
      const sessionsDeleted = await tx.virtualSession.deleteMany({
        where: { virtualUserId }
      });
      
      // 6. Delete virtual user
      await tx.virtualUser.delete({
        where: { id: virtualUserId }
      });
      
      // 7. Log the deletion
      await tx.virtualUserAuditLog.create({
        data: {
          virtualUserId,
          action: 'DELETE',
          reason,
          details: {
            memoriesDeleted: memoriesDeleted.count,
            acusDeleted: acusDeleted.count,
            notebooksDeleted: notebooksDeleted.count,
            conversationsDeleted: conversationsDeleted.count,
            sessionsDeleted: sessionsDeleted.count
          }
        }
      });
    });
    
    logger.info({ virtualUserId, reason }, 'Virtual user deleted successfully');
  }
  
  /**
   * Anonymize virtual user data (GDPR right to erasure alternative)
   */
  async anonymizeVirtualUser(virtualUserId: string): Promise<void> {
    logger.info({ virtualUserId }, 'Anonymizing virtual user');
    
    await this.prisma.$transaction(async (tx) => {
      // 1. Anonymize memories
      await tx.virtualMemory.updateMany({
        where: { virtualUserId },
        data: {
          content: '[ANONYMIZED]',
          summary: null,
          metadata: { anonymized: true, anonymizedAt: new Date().toISOString() }
        }
      });
      
      // 2. Anonymize conversations
      await tx.virtualConversation.updateMany({
        where: { virtualUserId },
        data: {
          title: 'Anonymous Conversation',
          metadata: { anonymized: true }
        }
      });
      
      // 3. Anonymize ACUs
      await tx.virtualACU.updateMany({
        where: { virtualUserId },
        data: {
          content: '[ANONYMIZED]',
          authorDid: null,
          metadata: { anonymized: true }
        }
      });
      
      // 4. Clear identifying signals
      await tx.virtualUser.update({
        where: { id: virtualUserId },
        data: {
          fingerprintSignals: {},
          ipHistory: [],
          userAgentHistory: [],
          deviceCharacteristics: {},
          displayName: 'Anonymous User',
          topicInterests: [],
          entityProfiles: [],
          anonymizedAt: new Date(),
          metadata: { anonymized: true }
        }
      });
      
      // 5. Delete sessions
      await tx.virtualSession.deleteMany({
        where: { virtualUserId }
      });
      
      // 6. Log the anonymization
      await tx.virtualUserAuditLog.create({
        data: {
          virtualUserId,
          action: 'ANONYMIZE',
          details: { anonymizedAt: new Date().toISOString() }
        }
      });
    });
    
    logger.info({ virtualUserId }, 'Virtual user anonymized successfully');
  }
  
  /**
   * Export all virtual user data (GDPR right to access)
   */
  async exportVirtualUserData(virtualUserId: string): Promise<{
    profile: any;
    memories: any[];
    conversations: any[];
    acus: any[];
    notebooks: any[];
    sessions: any[];
    auditLogs: any[];
    exportedAt: string;
  }> {
    logger.info({ virtualUserId }, 'Exporting virtual user data');
    
    const [profile, memories, conversations, acus, notebooks, sessions, auditLogs] = await Promise.all([
      this.prisma.virtualUser.findUnique({ where: { id: virtualUserId } }),
      this.prisma.virtualMemory.findMany({ where: { virtualUserId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.virtualConversation.findMany({ where: { virtualUserId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.virtualACU.findMany({ where: { virtualUserId }, orderBy: { createdAt: 'desc' }, take: 1000 }),
      this.prisma.virtualNotebook.findMany({ where: { virtualUserId } }),
      this.prisma.virtualSession.findMany({ where: { virtualUserId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.virtualUserAuditLog.findMany({ where: { virtualUserId }, orderBy: { createdAt: 'desc' } })
    ]);
    
    if (!profile) {
      throw new Error('Virtual user not found');
    }
    
    logger.info({ virtualUserId }, 'Virtual user data exported successfully');
    
    return {
      profile,
      memories,
      conversations,
      acus,
      notebooks,
      sessions,
      auditLogs,
      exportedAt: new Date().toISOString()
    };
  }
  
  /**
   * Update user consent
   */
  async updateConsent(
    virtualUserId: string,
    consentGiven: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      dataRetentionPolicy?: DataRetentionPolicy;
    }
  ): Promise<void> {
    const updateData: any = {
      consentGiven,
      consentTimestamp: consentGiven ? new Date() : null
    };
    
    if (options?.dataRetentionPolicy) {
      updateData.dataRetentionPolicy = options.dataRetentionPolicy;
    }
    
    await this.prisma.virtualUser.update({
      where: { id: virtualUserId },
      data: updateData
    });
    
    // Log the consent change
    await this.prisma.virtualUserAuditLog.create({
      data: {
        virtualUserId,
        action: consentGiven ? 'CONSENT_GIVEN' : 'CONSENT_WITHDRAWN',
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        details: {
          dataRetentionPolicy: options?.dataRetentionPolicy
        }
      }
    });
    
    logger.info({ virtualUserId, consentGiven }, 'Virtual user consent updated');
  }
  
  /**
   * Get audit logs for a virtual user
   */
  async getAuditLogs(virtualUserId: string, limit: number = 100): Promise<any[]> {
    return this.prisma.virtualUserAuditLog.findMany({
      where: { virtualUserId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
  
  /**
   * Get privacy statistics
   */
  async getPrivacyStats(): Promise<{
    totalVirtualUsers: number;
    usersWithConsent: number;
    usersWithoutConsent: number;
    usersByRetentionPolicy: Record<string, number>;
    anonymizedUsers: number;
    deletedUsersLast30Days: number;
  }> {
    const [
      total,
      withConsent,
      withoutConsent,
      byPolicy,
      anonymized,
      deleted
    ] = await Promise.all([
      this.prisma.virtualUser.count(),
      this.prisma.virtualUser.count({ where: { consentGiven: true } }),
      this.prisma.virtualUser.count({ where: { consentGiven: false } }),
      this.prisma.virtualUser.groupBy({
        by: ['dataRetentionPolicy'],
        _count: true
      }),
      this.prisma.virtualUser.count({ where: { anonymizedAt: { not: null } } }),
      this.prisma.virtualUserAuditLog.count({
        where: {
          action: 'DELETE',
          createdAt: { gte: this.calculateCutoffDate('30_days') }
        }
      })
    ]);
    
    const usersByRetentionPolicy: Record<string, number> = {};
    for (const item of byPolicy) {
      usersByRetentionPolicy[item.dataRetentionPolicy] = item._count;
    }
    
    return {
      totalVirtualUsers: total,
      usersWithConsent: withConsent,
      usersWithoutConsent: withoutConsent,
      usersByRetentionPolicy,
      anonymizedUsers: anonymized,
      deletedUsersLast30Days: deleted
    };
  }
  
  // ==================== Private Helper Methods ====================
  
  /**
   * Calculate cutoff date for a given policy
   */
  private calculateCutoffDate(policy: DataRetentionPolicy): Date {
    const config = RETENTION_POLICIES[policy];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.durationDays);
    return cutoffDate;
  }
  
  /**
   * Schedule expiration update for memories
   */
  private async updateMemoryExpirations(
    virtualUserId: string,
    policy: DataRetentionPolicy
  ): Promise<void> {
    const expirationDate = this.calculateExpirationDate(policy);
    
    await this.prisma.virtualMemory.updateMany({
      where: { virtualUserId },
      data: {
        expiresAt: expirationDate
      }
    });
  }
}

// Export singleton instance
export const virtualUserPrivacyService = VirtualUserPrivacyService.getInstance();
