const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                       // max connections in pool
  idleTimeoutMillis: 30000,      // close idle connections after 30s
  connectionTimeoutMillis: 2000, // fail fast if no connection available
  allowExitOnIdle: true,         // let Node process exit cleanly
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
  // Do not crash the process — log and continue
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('Database connected successfully at', res.rows[0].now);
    client.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
