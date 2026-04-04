import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import { getPrismaClient } from '../lib/database.js';

const log = logger.child({ module: 'dev-auth' });

let devUserCache = null;

/**
 * Get the user for dev bypass:
 * 1. If DEMO_USER_EMAIL is set and that user exists in DB → use that (rich demo data)
 * 2. Otherwise fall back to dev@localhost
 */
async function getDevBypassUser() {
  if (devUserCache) {
    return devUserCache;
  }

  const prisma = getPrismaClient();
  const targetEmail = config.demoUserEmail || 'dev@localhost';

  let user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    // Fall back to dev@localhost
    user = await prisma.user.findUnique({
      where: { email: 'dev@localhost' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          did: 'did:dev:local-development-user',
          email: 'dev@localhost',
          emailVerified: true,
          displayName: 'Development User',
          avatarUrl: null,
          verificationLevel: 1,
          publicKey: 'dev:local-key',
          keyType: 'Development',
          trustScore: 100,
          status: 'ACTIVE',
        },
      });
      log.info({ userId: user.id, email: user.email }, 'Created development user');
    } else {
      log.info({ userId: user.id, email: user.email }, 'Using dev@localhost user (demo user not found)');
    }
  } else {
    log.info({ userId: user.id, email: user.email }, 'Using demo user for dev bypass');
  }

  user.userId = user.id;
  devUserCache = user;

  return user;
}

export async function devAuthBypass(req, res, next) {
  // Allow bypass in development OR test environments
  const isDevOrTest = config.isDevelopment || config.isTest;

  if (!isDevOrTest || !config.skipAuthForDevelopment) {
    return next();
  }

  try {
    const user = await getDevBypassUser();

    req.user = user;
    req.userId = user.id;
    req.isAuthenticated = () => true;
    req.auth = {
      isAuthenticated: true,
      isDevBypass: true,
      permissions: ['*'],
    };

    next();
  } catch (error) {
    log.error({ error: error.message }, 'Dev auth bypass failed');
    next(error);
  }
}

export function logDevAuthStatus(req, res, next) {
  if (config.isDevelopment && config.skipAuthForDevelopment) {
    const email = config.demoUserEmail || 'dev@localhost';
    log.warn('⚠️  DEVELOPMENT MODE: Authentication is bypassed for all requests');
    log.warn(`   All requests will be authenticated as: ${email}`);
  }
  next();
}
