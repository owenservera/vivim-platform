#!/usr/bin/env node

/**
 * Find existing PostgreSQL databases and users
 * Try to connect with various common configurations
 */

const { Client } = require('pg');

async function findExistingSetup() {
  console.log('🔍 Searching for existing PostgreSQL databases...\n');

  // Try common PostgreSQL connection patterns
  const connectionAttempts = [
    // Standard postgres user with no password (common in dev)
    { name: 'postgres user (no password)', connectionString: 'postgresql://postgres@localhost:5432/postgres' },
    // Try connecting to existing databases
    { name: 'postgres@postgres', connectionString: 'postgresql://postgres@localhost:5432/postgres' },
    { name: 'postgres@template1', connectionString: 'postgresql://postgres@localhost:5432/template1' },
    { name: 'postgres@template0', connectionString: 'postgresql://postgres@localhost:5432/template0' },

    // Try your expected credentials
    { name: 'openscroll user', connectionString: 'postgresql://openscroll:openscroll_dev_password@localhost:5432/postgres' },
    { name: 'openscroll user (no db)', connectionString: 'postgresql://openscroll:openscroll_dev_password@localhost:5432' },

    // Try without password
    { name: 'openscroll (no password)', connectionString: 'postgresql://openscroll@localhost:5432/postgres' },
  ];

  for (const attempt of connectionAttempts) {
    const client = new Client({ connectionString: attempt.connectionString });

    try {
      await client.connect();
      console.log(`✅ Connected: ${attempt.name}`);
      console.log(`   Connection string: ${attempt.connectionString}`);

      // List all databases
      const dbResult = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname");
      console.log(`   📊 Databases found: ${dbResult.rows.map(r => r.datname).join(', ')}`);

      // List all users
      const userResult = await client.query("SELECT usename FROM pg_user ORDER BY usename");
      console.log(`   👥 Users found: ${userResult.rows.map(r => r.usename).join(', ')}`);

      // Check if openscroll database exists
      const openscrollDb = dbResult.rows.find(r => r.datname === 'openscroll');
      if (openscrollDb) {
        console.log(`   ✓ Found 'openscroll' database!`);

        // Check if openscroll user exists
        const openscrollUser = userResult.rows.find(r => r.usename === 'openscroll');
        if (openscrollUser) {
          console.log(`   ✓ Found 'openscroll' user!`);
          console.log(`   ℹ️  Your database and user exist, but the password might be wrong.`);
        } else {
          console.log(`   ✗ 'openscroll' database exists but 'openscroll' user doesn't exist.`);
        }
      }

      // Try to connect to openscroll database directly
      try {
        await client.query('SELECT 1');
        const currentDb = await client.query('SELECT current_database()');
        console.log(`   ✓ Connected to database: ${currentDb.rows[0].current_database}`);
      } catch (err) {
        console.log(`   ℹ️  Connected but can't query: ${err.message}`);
      }

      await client.end();
      console.log('\n✓ This configuration works!\n');
      return attempt; // Return the working config
    } catch (error) {
      console.log(`❌ Failed: ${attempt.name} - ${error.message}`);
    }
  }

  console.log('\n❌ Could not find a working database connection.');
  console.log('Suggestions:');
  console.log('1. Check if PostgreSQL service is running');
  console.log('2. Verify your postgres superuser password');
  console.log('3. Check pg_hba.conf for authentication settings');
  console.log('4. Try connecting with pgAdmin or other tool to verify setup');
}

findExistingSetup().catch(console.error);