#!/usr/bin/env node
/**
 * One-off migration: make users.google_id nullable in Postgres
 * Usage: DATABASE_URL=... node make_google_id_nullable_postgres.js
 */
const { Client } = require('pg');
const logger = require('../../backend/utils/logger');

async function run() {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL is not set. Aborting.');
    process.exit(2);
  }

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    logger.info('Connected to Postgres for migration');

    // Check current constraint
    const res = await client.query(`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='users' AND column_name='google_id'`);
    if (res.rows.length === 0) {
      console.log('No users.google_id column found in Postgres - nothing to do');
      return;
    }

    const isNullable = res.rows[0].is_nullable === 'YES';
    if (isNullable) {
      console.log('users.google_id is already nullable - nothing to do');
      return;
    }

    console.log('Altering users.google_id to drop NOT NULL...');
    await client.query(`ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL`);
    console.log('Altered users.google_id to be nullable');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    logger.error('Migration failed to drop NOT NULL on users.google_id', { error: err.message, stack: err.stack });
    process.exit(1);
  } finally {
    try { await client.end(); } catch (e) {}
  }
}

run().catch(err => {
  console.error('Unexpected error', err);
  process.exit(1);
});
