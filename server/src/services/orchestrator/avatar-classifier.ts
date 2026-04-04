/**
 * Avatar Classifier
 * 
 * Classifies user avatar based on conversation count, memory count, and profile maturity.
 * 
 * Avatar Levels:
 * - STRANGER: First visit, 0 memories, 0 conversations
 * - ACQUAINTANCE: 2-5 visits, 1-10 memories, 1-5 conversations
 * - FAMILIAR: 6-20 visits, 11-50 memories, 6-20 conversations
 * - KNOWN: 20+ visits, 50+ memories, 20+ conversations
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import { UserAvatar } from '../../types/corpus';
import { logger } from '../../../lib/logger';

export class AvatarClassifier {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Classify user avatar
   */
  async classify(virtualUserId: string): Promise<UserAvatar> {
    try {
      // Get user with existing avatar if set
      const user = await this.prisma.virtualUser.findUnique({
        where: { id: virtualUserId },
        select: {
          currentAvatar: true,
          conversationCount: true,
          memoryCount: true,
        },
      });

      if (!user) {
        return 'STRANGER';
      }

      // If avatar already set and recent, use it
      if (user.currentAvatar && user.currentAvatar !== 'STRANGER') {
        // Could add timestamp check here for re-classification
        return user.currentAvatar as UserAvatar;
      }

      // Classify based on counts
      const avatar = this.classifyFromCounts(
        user.conversationCount,
        user.memoryCount
      );

      // Update user record if different
      if (user.currentAvatar !== avatar) {
        await this.prisma.virtualUser.update({
          where: { id: virtualUserId },
          data: { currentAvatar: avatar },
        });
      }

      return avatar;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Avatar classification failed');
      return 'STRANGER';
    }
  }

  /**
   * Classify avatar from conversation and memory counts
   */
  private classifyFromCounts(
    conversationCount: number,
    memoryCount: number
  ): UserAvatar {
    // STRANGER: First visit, 0 memories, 0 conversations
    if (conversationCount === 0 || memoryCount === 0) {
      return 'STRANGER';
    }

    // ACQUAINTANCE: 2-5 visits, 1-10 memories, 1-5 conversations
    if (conversationCount <= 5 && memoryCount <= 10) {
      return 'ACQUAINTANCE';
    }

    // FAMILIAR: 6-20 visits, 11-50 memories, 6-20 conversations
    if (conversationCount <= 20 && memoryCount <= 50) {
      return 'FAMILIAR';
    }

    // KNOWN: 20+ visits, 50+ memories, 20+ conversations
    return 'KNOWN';
  }

  /**
   * Force re-classification of avatar
   */
  async reclassify(virtualUserId: string): Promise<UserAvatar> {
    try {
      const [conversationCount, memoryCount] = await Promise.all([
        this.prisma.virtualConversation.count({
          where: { virtualUserId },
        }),
        this.prisma.virtualMemory.count({
          where: { virtualUserId, isActive: true },
        }),
      ]);

      const avatar = this.classifyFromCounts(conversationCount, memoryCount);

      await this.prisma.virtualUser.update({
        where: { id: virtualUserId },
        data: {
          currentAvatar: avatar,
          profileVersion: { increment: 1 },
        },
      });

      logger.info({ virtualUserId, avatar, conversationCount, memoryCount }, 'Avatar reclassified');

      return avatar;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Avatar reclassification failed');
      return 'STRANGER';
    }
  }
}
