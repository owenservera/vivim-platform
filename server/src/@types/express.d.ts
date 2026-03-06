/**
 * Request type extensions for authenticated user
 */
import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        did?: string;
        [key: string]: any;
      };
    }
  }
}

export {};
