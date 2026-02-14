import { getPrismaClient } from '../src/lib/database.js';

const prisma = getPrismaClient();

async function main() {
  try {
    await prisma.user.create({
      data: {
        id: 'Owen',
        did: 'did:key:owen-dev',
        displayName: 'Owen',
        publicKey: 'dev-public-key-for-testing',
        email: 'owen@dev.local'
      }
    });
    console.log('Created user Owen');
  } catch (e) {
    if (e.code === 'P2002') {
      console.log('User Owen already exists');
    } else {
      throw e;
    }
  }
}

main().catch(console.error);
