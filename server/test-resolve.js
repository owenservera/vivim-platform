import { getPrismaClient } from './src/lib/database.js';
console.log('Successfully imported database.js');
const prisma = getPrismaClient();
console.log('Prisma client obtained');
process.exit(0);
