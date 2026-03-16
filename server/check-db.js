import { getPrismaClient } from './src/lib/database.js';

const prisma = getPrismaClient();

console.log('Checking import jobs table...');
const jobs = await prisma.importJob.findMany();
console.log(`Found ${jobs.length} jobs`);

if (jobs.length > 0) {
  console.log('First job:', jobs[0]);
}

process.exit(0);
