import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { getPrismaClient } from '../src/lib/database.js';

async function init() {
  const prisma = getPrismaClient();
  const defaultDid = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
  
  try {
    const user = await prisma.user.upsert({
      where: { did: defaultDid },
      update: {},
      create: {
        id: 'default-user-uuid',
        did: defaultDid,
        displayName: 'Default User',
        publicKey: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK', // Mock
        settings: {}
      }
    });
    console.log('Default user initialized:', user.did);
  } catch (error) {
    console.error('Failed to init default user:', error);
  } finally {
    const { disconnectPrisma } = await import('../src/lib/database.js');
    await disconnectPrisma();
  }
}

init();
