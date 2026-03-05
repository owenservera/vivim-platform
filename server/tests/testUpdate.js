import { getPrismaClient } from './src/lib/database.js';
import dotenv from 'dotenv';
dotenv.config();

const prisma = getPrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found');
    return;
  }
  
  const updated = await prisma.conversation.updateMany({
    where: { ownerId: null },
    data: { ownerId: user.id }
  });
  
  console.log('Updated ' + updated.count + ' conversations to user ' + user.id);
  
  const count = await prisma.conversation.count();
  console.log('Total conversations: ' + count);
  
}

main().catch(console.error).finally(() => prisma.$disconnect());
