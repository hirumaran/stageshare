require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const schemaPath = path.join(__dirname, 'schema.sql');

async function migrate() {
  try {
    // 1. Base schema + seed data
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    console.log('Running base schema migration...');
    await pool.query(schemaSql);
    console.log('Base schema applied.');

    // 2. Numbered migrations (run in order)
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`  Running migration: ${file}`);
      await pool.query(sql);
    }

    console.log(`Migration completed successfully (${migrationFiles.length + 1} scripts).`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrate();
