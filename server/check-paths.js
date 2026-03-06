import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
  console.log('--- RESOLUTION CHECK ---');
  console.log('Current CWD:', process.cwd());
  
  const prismaPath = require.resolve('@prisma/client');
  console.log('@prisma/client resolved from:', prismaPath);
  
  try {
    const generatedPath = require.resolve('.prisma/client');
    console.log('.prisma/client resolved from:', generatedPath);
  } catch (e) {
    console.log('.prisma/client NOT FOUND');
  }

  try {
    const utilsPath = require.resolve('@prisma/client-runtime-utils');
    console.log('@prisma/client-runtime-utils resolved from:', utilsPath);
  } catch (e) {
    console.log('@prisma/client-runtime-utils NOT FOUND');
  }
  
} catch (e) {
  console.error('Error during resolution check:', e.message);
}
