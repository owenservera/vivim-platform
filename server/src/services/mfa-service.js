import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import crypto from 'crypto';
import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';

const prisma = getPrismaClient();

export const mfaService = {
  /**
   * Setup MFA for a user
   * Generates a secret and a QR code URL for them to scan
   * @param {string} email - The user's email for the authenticator app label
   * @returns {Promise<{ secret: string, qrCodeUrl: string }>}
   */
  async generateMfaSecret(email) {
    // Generate a secure base32 secret
    const secret = authenticator.generateSecret();
    const serviceName = 'VIVIM';

    // Create an otpauth:// URI
    const otpauthUrl = authenticator.keyuri(email, serviceName, secret);

    // Generate a QR code data URL
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

    return { secret, qrCodeUrl };
  },

  /**
   * Verifies the setup token and enables MFA for a user.
   * Also generates backup codes to be returned to the user ONLY ONCE.
   * @param {string} userId - The user's ID
   * @param {string} secret - The pending secret to verify
   * @param {string} token - The 6-digit code provided by the user
   * @returns {Promise<{ success: boolean, backupCodes?: string[], error?: string }>}
   */
  async enableMfa(userId, secret, token) {
    try {
      const isValid = authenticator.verify({ token, secret });

      if (!isValid) {
        return { success: false, error: 'Invalid MFA token' };
      }

      // Generate 8 random backup codes (each 8 hex characters)
      const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));

      // Hash backup codes before storing them for security
      const hashedBackupCodes = backupCodes.map((code) => this._hashString(code));

      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaSecret: secret,
          backupCodes: hashedBackupCodes,
        },
      });

      logger.info({ userId }, 'MFA enabled for user');

      return { success: true, backupCodes }; // Return plaintext backup codes just this once
    } catch (error) {
      logger.error({ userId, error: error.message }, 'Failed to enable MFA');
      return { success: false, error: 'Internal server error' };
    }
  },

  /**
   * Verify an MFA token during login or sensitive actions.
   * Handles both authenticator codes and backup codes.
   * @param {string} userId - The user's ID
   * @param {string} token - The code provided by the user (authenticator or backup code)
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async verifyMfa(userId, token) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaEnabled: true, mfaSecret: true, backupCodes: true },
      });

      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        return { success: false, error: 'MFA is not enabled for this user' };
      }

      // 1. Try checking if it's a valid authenticator token
      // authenticator tokens are typically exactly 6 (or 8) digits
      if (/^\d{6,8}$/.test(token)) {
        const isValid = authenticator.verify({ token, secret: user.mfaSecret });
        if (isValid) {
          return { success: true };
        }
      }

      // 2. Try checking if it's a backup code
      const hashedToken = this._hashString(token);
      let newBackupCodes = [...user.backupCodes];
      const initialLength = newBackupCodes.length;

      newBackupCodes = newBackupCodes.filter((c) => c !== hashedToken);

      // If length changed, a backup code was matched and removed
      if (newBackupCodes.length < initialLength) {
        // Update user to consume the backup code
        await prisma.user.update({
          where: { id: userId },
          data: { backupCodes: newBackupCodes },
        });
        logger.info({ userId }, 'User authenticated using a backup code');
        return { success: true };
      }

      return { success: false, error: 'Invalid MFA token or backup code' };
    } catch (error) {
      logger.error({ userId, error: error.message }, 'MFA verification failed');
      return { success: false, error: 'Internal server error' };
    }
  },

  /**
   * Disable MFA for a user (requires confirming with an MFA token)
   * @param {string} userId - The user's ID
   * @param {string} token - A valid MFA token
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async disableMfa(userId, token) {
    try {
      const verificationResult = await this.verifyMfa(userId, token);

      if (!verificationResult.success) {
        return verificationResult;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          backupCodes: [],
        },
      });

      logger.info({ userId }, 'MFA disabled for user');
      return { success: true };
    } catch (error) {
      logger.error({ userId, error: error.message }, 'Failed to disable MFA');
      return { success: false, error: 'Internal server error' };
    }
  },

  _hashString(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
  },
};
