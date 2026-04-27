const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const schemaPath = path.join(__dirname, 'schema.sql');

async function migrate() {
  try {
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    console.log('Running database migration...');
    await pool.query(sql);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrate();
