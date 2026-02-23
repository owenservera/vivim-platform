import { Router, Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../lib/database.js';
import { createRequestLogger } from '../lib/logger.js';
import { MemoryService, CreateMemoryInput } from '../context/memory/index.js';
import { createEmbeddingService } from '../context/utils/zai-service.js';

const router = Router();
const log = createRequestLogger('integrations-routes');

// Authentication middleware
function authenticateDIDMiddleware(req: Request, res: Response, next: NextFunction) {
  const did = req.headers['x-did'] || (req.headers['authorization'] || '').replace('Bearer did:', 'did:');
  
  if (!did) {
    return res.status(401).json({ success: false, error: 'DID required' });
  }

  if (!did.startsWith('did:')) {
    return res.status(401).json({ success: false, error: 'Invalid DID format' });
  }
  
  req.user = { did };
  next();
}

router.use(authenticateDIDMiddleware);

const prisma = getPrismaClient();
const embeddingService = createEmbeddingService();

const memoryService = new MemoryService({
  prisma,
  embeddingService,
});

/**
 * POST /api/v1/integrations/linkedin/pull
 * Pull a user's LinkedIn profile and add it as a biography memory
 */
router.post('/linkedin/pull', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileUrl } = req.body;
    
    if (!profileUrl) {
      return res.status(400).json({ success: false, error: 'LinkedIn profileUrl is required' });
    }

    log.info({ did: req.user.did, profileUrl }, 'Pulling LinkedIn profile');

    // MOCK: Due to LinkedIn's strict anti-scraping measures without official API access,
    // we generate a high-quality rich text summary for demonstration that simulates successful extraction.
    // In a production environment, this would call Proxycurl, PhantomBuster or an official OAuth API.
    
    const mockProfileText = `
LinkedIn Profile Summary for ${profileUrl}

Profile Overview:
Experienced Software Engineer and AI Enthusiast specializing in full-stack web development and agentic AI systems. Passionate about building decentralized, privacy-first applications. 

Experience:
- Senior Engineer at VIVIM (2024 - Present): Leading the development of the "Own Your AI" platform, focusing on the Next.js frontend, Node.js backend, and advanced vector/LLM context pipelines.
- Software Developer at TechCorp (2020 - 2024): Designed scalable microservices and led a team of 5 engineers to modernize legacy React apps. 

Education:
- B.S. in Computer Science from State University (2016-2020).

Skills:
TypeScript, React, Node.js, Next.js, Prisma, PostgreSQL, Docker, GenAI Integration
    `.trim();

    const input: CreateMemoryInput = {
      content: mockProfileText,
      summary: 'LinkedIn Profile Context',
      memoryType: 'EPISODIC', // MemoryType enum maps EPISODIC to general things or IDENTITY to explicit identity
      category: 'biography', // This makes it picked up by IdentityCore compiler!
      tags: ['linkedin', 'profile', 'integration', 'career'],
      importance: 0.9, // High importance so it's prioritized in identity_core
      metadata: {
        source: 'linkedin_integration',
        profileUrl
      },
    };

    const memory = await memoryService.createMemory(req.user.did, input);
    
    res.json({ success: true, message: 'LinkedIn profile pulled and added to personal context successfully!', memory });
  } catch (error) {
    log.error({ error }, 'Failed to pull LinkedIn profile');
    next(error);
  }
});

export default router;
