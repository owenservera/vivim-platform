import { getPrismaClient } from '../src/lib/database.js';

const prisma = getPrismaClient();

async function main() {
  console.log('Cleaning database...');

  try {
    await prisma.topicConversation.deleteMany();
    await prisma.contextBundle.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.topicProfile.deleteMany();
    await prisma.entityProfile.deleteMany();
    await prisma.memory.deleteMany();

    console.log('Database cleaned successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
