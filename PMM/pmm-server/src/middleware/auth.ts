import { Context, Next } from 'hono';
import { AppError } from './error-handler';

export interface UserPayload {
  id: string;
  email: string;
  name?: string;
  role: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user?: UserPayload;
  }
}

export const authMiddleware = async (c: Context, next: Next): Promise<void> => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        'UNAUTHORIZED',
        'Missing or invalid authorization header',
        401
      );
    }

    const token = authHeader.substring(7);

    // TODO: Implement actual JWT verification
    // For now, we'll use a simple mock for development
    const user = await verifyToken(token);

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Invalid token', 401);
    }

    c.set('user', user);
    await next();
  } catch (error) {
    throw error;
  }
};

async function verifyToken(token: string): Promise<UserPayload | null> {
  // TODO: Replace with actual JWT verification
  // This is a mock implementation for development
  
  // In production, verify JWT signature and extract user data
  // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  
  // Mock user for development
  if (token === 'dev-token' || token.length > 0) {
    return {
      id: 'user_dev_123',
      email: 'dev@vivim.app',
      name: 'Developer',
      role: 'ADMIN',
    };
  }

  return null;
}

export const optionalAuth = async (c: Context, next: Next): Promise<void> => {
  try {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await verifyToken(token);
      if (user) {
        c.set('user', user);
      }
    }

    await next();
  } catch (error) {
    // Silently continue - auth is optional
    await next();
  }
};
