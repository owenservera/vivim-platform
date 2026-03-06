import pg from 'pg';
const { Pool } = pg;

async function test() {
  const pool = new Pool({
    connectionString: "postgresql://openscroll:password@localhost:5432/openscroll"
  });
  try {
    const res = await pool.query('SELECT 1');
    console.log('SUCCESS');
  } catch (err) {
    console.error('FAILED', err.message);
  } finally {
    await pool.end();
  }
}
test();
