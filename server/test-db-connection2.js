#!/usr/bin/env node

/**
 * Test different PostgreSQL connection configurations
 */

const { Client } = require('pg');

async function testConnection() {
  const configs = [
    // Try with postgres user and common password
    {
      name: 'Postgres user with empty password',
      user: 'postgres',
      password: '',
      database: 'postgres',
      host: 'localhost',
      port: 5432
    },
    {
      name: 'Postgres user with "postgres" password',
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
      host: 'localhost',
      port: 5432
    },
    {
      name: 'Postgres user with "password" password',
      user: 'postgres',
      password: 'password',
      database: 'postgres',
      host: 'localhost',
      port: 5432
    },
    {
      name: 'Postgres user with "root" password',
      user: 'postgres',
      password: 'root',
      database: 'postgres',
      host: 'localhost',
      port: 5432
    }
  ];

  for (const config of configs) {
    console.log(`\n🔍 Testing: ${config.name}`);
    console.log(`   User: ${config.user}, Password: ${config.password ? '***' : '(empty)'}`);

    const client = new Client({
      user: config.user,
      password: config.password,
      database: config.database,
      host: config.host,
      port: config.port
    });

    try {
      await client.connect();
      console.log(`   ✅ Connected successfully!`);

      // Try to list databases
      const result = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
      console.log(`   📊 Available databases: ${result.rows.map(r => r.datname).join(', ')}`);

      // Try to list users
      const users = await client.query("SELECT usename FROM pg_user");
      console.log(`   👥 Available users: ${users.rows.map(r => r.usename).join(', ')}`);

      await client.end();
      console.log('   ✓ This configuration works!');
      return config; // Return the working config
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n❌ No working configuration found!');
  console.log('You may need to create the database and user manually.');
}

testConnection().catch(console.error);