import 'dotenv/config';

async function main() {
  console.log('Starting server test...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  
  try {
    // Test imports one by one
    console.log('Testing config import...');
    const { config } = await import('./src/config/index.js');
    console.log('Config loaded:', config.port);
    
    console.log('Testing database import...');
    const { prisma } = await import('./src/lib/database.js');
    console.log('Database client created');
    
    console.log('All imports successful!');
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }
}

main();
