/**
 * Google OAuth Authentication Middleware
 * 
 * Implements passport.js Google OAuth 2.0 strategy for user authentication.
 * Integrates with existing DID-based identity system.
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';

const log = logger.child({ module: 'google-auth' });

// ============================================================================
// Passport Configuration
// ============================================================================

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session - include userId for compatibility with existing routes
passport.deserializeUser(async (id, done) => {
  try {
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({ 
      where: { id } 
    });
    if (user) {
      user.userId = user.id;
    }
    done(null, user);
  } catch (error) {
    log.error({ error: error.message }, 'Failed to deserialize user');
    done(error, null);
  }
});

// ============================================================================
// Google OAuth Strategy
// ============================================================================

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const prisma = getPrismaClient();
      
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email provided by Google'), null);
      }

      // Find existing user by email
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Create new user with Google profile
        user = await prisma.user.create({
          data: {
            // Generate a DID-like identifier for Google users
            // Format: did:google:{googleProfileId}
            did: `did:google:${profile.id}`,
            email: email,
            emailVerified: true,
            displayName: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value || null,
            // Set verification level to 1 for Google-verified email
            verificationLevel: 1,
            // Generate a placeholder public key (not used for Google auth)
            publicKey: `google:${profile.id}`,
            keyType: 'GoogleOAuth',
            // Default trust score for Google users
            trustScore: 60
          }
        });

        log.info({ 
          userId: user.id, 
          email, 
          googleId: profile.id 
        }, 'New user created via Google OAuth');
      } else {
        // Update existing user with Google info if not already set
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            avatarUrl: profile.photos?.[0]?.value || user.avatarUrl,
            emailVerified: true,
            // Increase verification level if not already verified via Google
            verificationLevel: Math.max(user.verificationLevel, 1)
          }
        });

        log.info({ 
          userId: user.id, 
          email 
        }, 'User logged in via Google OAuth');
      }

      return done(null, user);
    } catch (error) {
      log.error({ 
        error: error.message,
        googleId: profile.id 
      }, 'Google OAuth authentication failed');
      return done(error, null);
    }
  }
);

// Register the strategy
passport.use(googleStrategy);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if user is authenticated via Google
 */
export function isGoogleAuthenticated(req) {
  return req.isAuthenticated() && req.user?.keyType === 'GoogleOAuth';
}

/**
 * Get current user (works with both DID and Google auth)
 */
export function getCurrentUser(req) {
  if (req.isAuthenticated()) {
    return req.user;
  }
  
  // Also check for DID-based auth
  if (req.user?.did) {
    return req.user;
  }
  
  return null;
}

// ============================================================================
// Export
// ============================================================================

export default passport;
export { googleStrategy };
