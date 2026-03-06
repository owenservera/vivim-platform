#!/usr/bin/env node

/**
 * Simple database connection test
 */

const { Client } = require('pg');

async function testConnection() {
  const configs = [
    // Default config from .env
    {
      name: 'Default config from .env',
      connectionString: 'postgresql://openscroll:openscroll_dev_password@localhost:5432/openscroll'
    },
    // Try connecting to postgres database
    {
      name: 'Connect to postgres database',
      connectionString: 'postgresql://postgres@localhost:5432/postgres'
    },
    // Try with no password
    {
      name: 'Try without password',
      connectionString: 'postgresql://postgres@localhost:5432/openscroll'
    }
  ];

  for (const config of configs) {
    console.log(`\n🔍 Testing: ${config.name}`);
    console.log(`   Connection: ${config.connectionString}`);

    const client = new Client({ connectionString: config.connectionString });

    try {
      await client.connect();
      console.log(`   ✅ Connected successfully!`);

      // Try to list databases
      const result = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
      console.log(`   📊 Available databases: ${result.rows.map(r => r.datname).join(', ')}`);

      await client.end();
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
}

testConnection().catch(console.error);