import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import { getPrismaClient } from '../lib/database.js';

const log = logger.child({ module: 'dev-auth' });

let devUserCache = null;

async function getOrCreateDevUser() {
  if (devUserCache) {
    return devUserCache;
  }

  const prisma = getPrismaClient();
  
  let user = await prisma.user.findUnique({
    where: { email: 'dev@localhost' }
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
        status: 'ACTIVE'
      }
    });
    log.info({ userId: user.id }, 'Created development user');
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
    const user = await getOrCreateDevUser();
    
    req.user = user;
    req.userId = user.id;
    req.isAuthenticated = () => true;
    req.auth = {
      isAuthenticated: true,
      isDevBypass: true,
      permissions: ['*']
    };

    next();
  } catch (error) {
    log.error({ error: error.message }, 'Dev auth bypass failed');
    next(error);
  }
}

export function logDevAuthStatus(req, res, next) {
  if (config.isDevelopment && config.skipAuthForDevelopment) {
    log.warn('⚠️  DEVELOPMENT MODE: Authentication is bypassed for all requests');
    log.warn('   All requests will be authenticated as dev@localhost');
  }
  next();
}
