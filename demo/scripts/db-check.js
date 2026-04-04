'use strict';
  const { PrismaClient } = require('../server/node_modules/@prisma/client');
  const { PrismaPg } = require('../server/node_modules/@prisma/adapter-pg');
  const pg = require('../server/node_modules/pg');
async function main() {
  const pool = new pg.Pool({ connectionString: 'postgresql://openscroll:openscroll_dev_password@localhost:5432/openscroll' });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const users = await prisma.user.findMany({ take: 3, select: { id: true, email: true, did: true } });
  console.log('USERS:', JSON.stringify(users, null, 2));
  const convs = await prisma.conversation.findMany({ take: 5, select: { id: true, title: true, provider: true, ownerId: true } });
  console.log('CONVS count:', convs.length);
  if (convs.length > 0) console.log('FIRST CONV:', JSON.stringify(convs[0]));
  const countAcu = await prisma.aCU.count();
  console.log('ACU COUNT:', countAcu);
  const countMem = await prisma.memory.count();
  console.log('MEMORY COUNT:', countMem);
  const countTopics = await prisma.topicProfile.count();
  console.log('TOPIC COUNT:', countTopics);
  const countEntities = await prisma.entityProfile.count();
  console.log('ENTITY COUNT:', countEntities);
  const countCircles = await prisma.circle.count();
  console.log('CIRCLE COUNT:', countCircles);
  await prisma.$disconnect();
  await pool.end();
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
