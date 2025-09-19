const { Pool } = require('pg');
const crypto = require('crypto');
const logger = require('./logger');

let pool;

function initPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set for Postgres adapter');
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.PG_MAX_CLIENTS || '5', 10),
    idleTimeoutMillis: 30000
  });
  pool.on('error', (err) => logger.error('Postgres pool error', { error: err.message }));
  logger.info('Postgres pool initialized');
  return pool;
}

async function query(sql, params = []) {
  const p = initPool();
  const client = await p.connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}

// Minimal schema bootstrap (idempotent)
async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT NOT NULL,
      avatar_url TEXT,
      locale TEXT,
      verified_email BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_token TEXT UNIQUE,
      refresh_token TEXT,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS mailing_list_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      confirmed BOOLEAN DEFAULT FALSE,
      confirmation_token TEXT UNIQUE,
      unsubscribe_token TEXT UNIQUE,
      status TEXT DEFAULT 'pending',
      last_confirmation_sent TIMESTAMP,
      last_unsubscribe_request TIMESTAMP,
      last_subscribe_attempt TIMESTAMP,
      subscribe_attempts INTEGER DEFAULT 0,
      confirmed_at TIMESTAMP,
      unsubscribed_at TIMESTAMP,
      ip TEXT,
      user_agent TEXT,
      source TEXT,
      consent_version TEXT
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS payment_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      plan_type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      current_period_start TIMESTAMP NOT NULL,
      current_period_end TIMESTAMP NOT NULL,
      next_billing_date TIMESTAMP,
      amount NUMERIC(10,2) NOT NULL,
      currency TEXT DEFAULT 'USD',
      payment_method TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      stripe_price_id TEXT,
      stripe_product_id TEXT,
      plan_interval TEXT,
      cancel_at_period_end BOOLEAN
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS payment_events (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      subscription_id INTEGER,
      event_type TEXT NOT NULL,
      amount NUMERIC(10,2),
      currency TEXT DEFAULT 'USD',
      payment_method TEXT,
      transaction_id TEXT,
      failure_reason TEXT,
      metadata JSONB,
      processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notification_sent BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (subscription_id) REFERENCES payment_subscriptions(id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS usage_counters (
      user_id TEXT PRIMARY KEY,
      message_count INTEGER DEFAULT 0,
      period_start TIMESTAMP NOT NULL,
      monthly_message_count INTEGER DEFAULT 0,
      monthly_period_start TIMESTAMP NOT NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS usage_events (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      daily_count INTEGER,
      monthly_count INTEGER,
      delta INTEGER,
      ip TEXT,
      source TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      meta JSONB
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS stripe_events (
      id SERIAL PRIMARY KEY,
      stripe_event_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      payload_json JSONB NOT NULL,
      received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP,
      status TEXT DEFAULT 'received',
      error_message TEXT
    )
  `);
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  connect: async () => {
    initPool();
    await initSchema();
    logger.info('Connected to Postgres database via DATABASE_URL');
  },

  close: async () => {
    if (pool) await pool.end();
    pool = null;
  },

  // User methods
  createUserWithPassword: async (userData) => {
    const { email, password_hash, name, avatarUrl, locale = 'en', verifiedEmail = false } = userData;
    try {
      const res = await query(
        `INSERT INTO users (email, password_hash, name, avatar_url, locale, verified_email) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, email`,
        [email, password_hash, name, avatarUrl, locale, verifiedEmail]
      );
      logger.info('User created in Postgres:', { email });
      return res.rows[0];
    } catch (err) {
      if (err.code === '23505') { // unique_violation
        throw new Error('Email already registered');
      }
      throw err;
    }
  },

  getUserByEmailForAuth: async (email) => {
    const res = await query(`SELECT id, email, password_hash, name, avatar_url, locale, verified_email, created_at, last_login_at FROM users WHERE email = $1 LIMIT 1`, [email]);
    return res.rows[0] || null;
  },

  getUserByEmail: async (email) => {
    const res = await query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email]);
    return res.rows[0] || null;
  },

  updateUserLastLogin: async (userId) => {
    await query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [userId]);
  },

  // Sessions
  createUserSession: async ({ userId, sessionToken, refreshToken, expiresAt, ipAddress, userAgent }) => {
    const token = sessionToken || generateToken();
    const res = await query(`INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at, ip_address, user_agent) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, [userId, token, refreshToken, expiresAt, ipAddress, userAgent]);
    return { id: res.rows[0].id, userId, sessionToken: token, refreshToken };
  },

  getUserSession: async (sessionTokenOrRefresh) => {
    const res = await query(`SELECT us.*, u.email, u.name, u.google_id, u.avatar_url, u.locale, u.verified_email, u.created_at, u.last_login_at FROM user_sessions us JOIN users u ON us.user_id = u.id WHERE (us.session_token = $1 OR us.refresh_token = $1) AND us.expires_at > CURRENT_TIMESTAMP LIMIT 1`, [sessionTokenOrRefresh]);
    return res.rows[0] || null;
  },

  deleteUserSession: async (sessionToken) => {
    await query(`DELETE FROM user_sessions WHERE session_token = $1 OR refresh_token = $1`, [sessionToken]);
  }
};
