const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const logger = require('./logger');

class Database {
  constructor() {
    this.db = null;
    // Use environment-appropriate database path
    // In production/Render, use /tmp or writable directory
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      // Render and other container platforms provide /tmp as writable
      this.dbPath = process.env.DATABASE_PATH || '/tmp/mailing_list.db';
    } else {
      // Development - use local directory
      this.dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'mailing_list.db');
    }
    
    logger.info('Database path configured:', { dbPath: this.dbPath, nodeEnv: process.env.NODE_ENV });
  }

  async connect() {
    return new Promise((resolve, reject) => {
      // Ensure directory exists for database file
      const dbDir = path.dirname(this.dbPath);
      
      try {
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
          logger.info('Created database directory:', { dbDir });
        }
      } catch (dirError) {
        logger.warn('Could not create database directory:', { dbDir, error: dirError.message });
      }
      
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Error connecting to database:', { error: err.message, dbPath: this.dbPath });
          reject(err);
        } else {
          logger.info('Connected to SQLite database for mailing list', { dbPath: this.dbPath });
          this.initTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async initTables() {
    const createMailingListTableSQL = `
      CREATE TABLE IF NOT EXISTS mailing_list_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        confirmed BOOLEAN DEFAULT FALSE,
        confirmation_token TEXT UNIQUE,
        unsubscribe_token TEXT UNIQUE,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'unsubscribed'))
      )
    `;

    const createPaymentSubscriptionsTableSQL = `
      CREATE TABLE IF NOT EXISTS payment_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        plan_type TEXT NOT NULL CHECK(plan_type IN ('starter', 'pro', 'enterprise')),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'expired', 'trial')),
        current_period_start DATETIME NOT NULL,
        current_period_end DATETIME NOT NULL,
        next_billing_date DATETIME,
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        stripe_price_id TEXT,
        stripe_product_id TEXT,
        plan_interval TEXT,
        cancel_at_period_end BOOLEAN
      )
    `;

    const createUsersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT NOT NULL,
        avatar_url TEXT,
        locale TEXT,
        verified_email BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createUserSessionsTableSQL = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        refresh_token TEXT,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    const createPaymentEventsTableSQL = `
      CREATE TABLE IF NOT EXISTS payment_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        subscription_id INTEGER,
        event_type TEXT NOT NULL CHECK(event_type IN ('payment_success', 'payment_failed', 'renewal_upcoming', 'subscription_cancelled', 'trial_ending')),
        amount DECIMAL(10,2),
        currency TEXT DEFAULT 'USD',
        payment_method TEXT,
        transaction_id TEXT,
        failure_reason TEXT,
        metadata TEXT,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notification_sent BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (subscription_id) REFERENCES payment_subscriptions(id)
      )
    `;

    // usage counters now include monthly tracking
    const createUsageCountersTableSQL = `
      CREATE TABLE IF NOT EXISTS usage_counters (
        user_id TEXT PRIMARY KEY,
        message_count INTEGER DEFAULT 0,
        period_start DATETIME NOT NULL,
        monthly_message_count INTEGER DEFAULT 0,
        monthly_period_start DATETIME NOT NULL
      )
    `;

    // audit log of individual usage events (compressed later if needed)
    const createUsageEventsTableSQL = `
      CREATE TABLE IF NOT EXISTS usage_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        event_type TEXT NOT NULL CHECK(event_type IN ('message_used','usage_reset','limit_block','diagnostic_access')),
        daily_count INTEGER,
        monthly_count INTEGER,
        delta INTEGER,
        ip TEXT,
        source TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        meta TEXT
      )
    `;

    // raw Stripe events for idempotency + replay
    const createStripeEventsTableSQL = `
      CREATE TABLE IF NOT EXISTS stripe_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stripe_event_id TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME,
        status TEXT DEFAULT 'received' CHECK(status IN ('received','processed','error')),
        error_message TEXT
      )
    `;

    try {
      await this.runQuery(createUsersTableSQL);
      logger.info('Users table initialized');
      
      await this.runQuery(createUserSessionsTableSQL);
      logger.info('User sessions table initialized');
      
      await this.runQuery(createMailingListTableSQL);
      logger.info('Mailing list table initialized');
      // NEW: ensure optional improvement columns & index
      await this.ensureMailingListExtendedColumns();
      await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_mailing_list_email ON mailing_list_subscribers(email)`);
      await this.runQuery(createPaymentSubscriptionsTableSQL);
      logger.info('Payment subscriptions table initialized');
      await this.ensureStripeColumns();
      await this.runQuery(createPaymentEventsTableSQL);
      logger.info('Payment events table initialized');
      await this.runQuery(createUsageCountersTableSQL);
      logger.info('Usage counters table initialized');
      await this.runQuery(createUsageEventsTableSQL);
      logger.info('Usage events audit table initialized');
      await this.runQuery(createStripeEventsTableSQL);
      logger.info('Stripe events table initialized');
      // ensure columns on existing usage_counters
      await this.ensureUsageExtendedColumns();
      // ensure custom authentication support
      await this.ensureCustomAuthColumns();
      return Promise.resolve();
    } catch (err) {
      logger.error('Error creating tables:', err);
      return Promise.reject(err);
    }
  }

  async runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async ensureMailingListExtendedColumns() {
    const needed = {
      last_confirmation_sent: 'DATETIME',
      last_unsubscribe_request: 'DATETIME',
      last_subscribe_attempt: 'DATETIME',
      subscribe_attempts: 'INTEGER DEFAULT 0',
      confirmed_at: 'DATETIME',
      unsubscribed_at: 'DATETIME',
      ip: 'TEXT',
      user_agent: 'TEXT',
      source: 'TEXT',
      consent_version: 'TEXT'
    };
    const info = await new Promise((resolve) => {
      this.db.all(`PRAGMA table_info(mailing_list_subscribers)`, [], (err, rows) => resolve(rows || []));
    });
    const existingCols = new Set(info.map(r => r.name));
    for (const [col, ddl] of Object.entries(needed)) {
      if (!existingCols.has(col)) {
        await this.runQuery(`ALTER TABLE mailing_list_subscribers ADD COLUMN ${col} ${ddl}`);
      }
    }
  }

  async ensureStripeColumns() {
    // Add missing Stripe columns defensively
    const columns = [
      'stripe_customer_id','stripe_subscription_id','stripe_price_id','stripe_product_id','plan_interval','cancel_at_period_end'
    ];
    for (const col of columns) {
      await new Promise((resolve) => {
        this.db.all(`PRAGMA table_info(payment_subscriptions)`, [], (err, rows) => {
          if (err) return resolve();
          const exists = Array.isArray(rows) && rows.some(r => r.name === col);
            if (!exists) {
              this.db.run(`ALTER TABLE payment_subscriptions ADD COLUMN ${col} TEXT`, [], () => resolve());
            } else resolve();
        });
      });
    }
  }

  async ensureUsageExtendedColumns() {
    // monthly_message_count & monthly_period_start might be missing
    const needed = ['monthly_message_count','monthly_period_start'];
    const info = await new Promise((resolve) => {
      this.db.all(`PRAGMA table_info(usage_counters)`, [], (err, rows) => resolve(rows));
    });
    for (const c of needed) {
      const exists = (Array.isArray(info) ? info : []).some(r => r.name === c);
      if (!exists) {
        const ddl = c === 'monthly_message_count' ? 'INTEGER DEFAULT 0' : 'DATETIME';
        await this.runQuery(`ALTER TABLE usage_counters ADD COLUMN ${c} ${ddl}`);
        if (c === 'monthly_period_start') {
          await this.runQuery(`UPDATE usage_counters SET monthly_period_start = COALESCE(period_start, CURRENT_TIMESTAMP)`);
        }
      }
    }
  }

  // Ensure users table supports custom authentication
  async ensureCustomAuthColumns() {
    const info = await new Promise((resolve) => {
      this.db.all(`PRAGMA table_info(users)`, [], (err, rows) => resolve(rows || []));
    });
    const existingCols = new Set(info.map(r => r.name));
    
    // Check if google_id has NOT NULL constraint by trying to insert a null value
    try {
      // Test if we can insert null values for google_id
      await this.runQuery(`INSERT INTO users (google_id, email, name, verified_email) VALUES (?, ?, ?, ?)`, 
        [null, 'test_constraint_check@example.com', 'Test', false]);
      // If successful, delete the test record
      await this.runQuery(`DELETE FROM users WHERE email = ?`, ['test_constraint_check@example.com']);
      logger.info('google_id column allows NULL values - no migration needed');
    } catch (error) {
      if (error.message.includes('NOT NULL constraint failed: users.google_id')) {
        logger.info('google_id has NOT NULL constraint, migrating users table...');
        await this.migrateUsersTableForCustomAuth();
      }
    }
    
    // Make sure password_hash column exists
    if (!existingCols.has('password_hash')) {
      await this.runQuery(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
      logger.info('Added password_hash column to users table');
    }

    logger.info('Custom authentication columns ensured in users table');
  }

  async migrateUsersTableForCustomAuth() {
    try {
      // Create backup of existing users
      await this.runQuery(`CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users`);
      
      // Drop the old users table
      await this.runQuery(`DROP TABLE users`);
      
      // Create new users table with correct schema (google_id can be NULL)
      const createUsersTableSQL = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          google_id TEXT UNIQUE,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          name TEXT NOT NULL,
          avatar_url TEXT,
          locale TEXT,
          verified_email BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await this.runQuery(createUsersTableSQL);
      
      // Migrate data back from backup
      await this.runQuery(`
        INSERT INTO users (id, google_id, email, password_hash, name, avatar_url, locale, verified_email, created_at, updated_at, last_login_at)
        SELECT id, google_id, email, password_hash, name, avatar_url, locale, verified_email, created_at, updated_at, last_login_at 
        FROM users_backup
      `);
      
      // Drop backup table
      await this.runQuery(`DROP TABLE users_backup`);
      
      logger.info('Successfully migrated users table to allow NULL google_id');
    } catch (error) {
      logger.error('Error migrating users table:', error);
      // Try to restore from backup if it exists
      try {
        await this.runQuery(`DROP TABLE IF EXISTS users`);
        await this.runQuery(`ALTER TABLE users_backup RENAME TO users`);
        logger.info('Restored users table from backup');
      } catch (restoreError) {
        logger.error('Failed to restore from backup:', restoreError);
      }
      throw error;
    }
  }

  async getSubscriberByEmail(email) {
    const sql = `SELECT * FROM mailing_list_subscribers WHERE email = ?`;
    return new Promise((resolve, reject) => {
      this.db.get(sql, [email], (err, row) => err ? reject(err) : resolve(row));
    });
  }

  async updateSubscriberTokens(email) {
    const newConfirmation = this.generateToken();
    const newUnsub = this.generateToken();
    const sql = `UPDATE mailing_list_subscribers SET confirmation_token = ?, unsubscribe_token = ?, last_confirmation_sent = CURRENT_TIMESTAMP WHERE email = ?`;
    await this.runQuery(sql, [newConfirmation, newUnsub, email]);
    return { confirmationToken: newConfirmation, unsubscribeToken: newUnsub };
  }

  async recordConfirmationEmailSent(email) {
    const sql = `UPDATE mailing_list_subscribers SET last_confirmation_sent = CURRENT_TIMESTAMP WHERE email = ?`;
    await this.runQuery(sql, [email]);
  }

  async recordUnsubscribeRequest(email) {
    const sql = `UPDATE mailing_list_subscribers SET last_unsubscribe_request = CURRENT_TIMESTAMP WHERE email = ?`;
    await this.runQuery(sql, [email]);
  }

  async recordSubscribeAttempt(email) {
    const sql = `UPDATE mailing_list_subscribers SET last_subscribe_attempt = CURRENT_TIMESTAMP, subscribe_attempts = COALESCE(subscribe_attempts,0) + 1 WHERE email = ?`;
    await this.runQuery(sql, [email]);
  }

  async recordSubscriberMeta(email, { ip, userAgent, source, consentVersion } = {}) {
    const fields = [];
    const values = [];
    if (ip) { fields.push('ip = ?'); values.push(ip); }
    if (userAgent) { fields.push('user_agent = ?'); values.push(userAgent); }
    if (source) { fields.push('source = ?'); values.push(source); }
    if (consentVersion) { fields.push('consent_version = ?'); values.push(consentVersion); }
    if (!fields.length) return;
    const sql = `UPDATE mailing_list_subscribers SET ${fields.join(', ')} WHERE email = ?`;
    values.push(email);
    await this.runQuery(sql, values);
  }

  isActionRateLimited(subscriber, action, minIntervalMs) {
    if (!subscriber) return false;
    const column = action === 'confirmation' ? 'last_confirmation_sent' : action === 'unsubscribe' ? 'last_unsubscribe_request' : action === 'subscribe' ? 'last_subscribe_attempt' : null;
    if (!column || !subscriber[column]) return false;
    const last = new Date(subscriber[column]);
    return (Date.now() - last.getTime()) < minIntervalMs;
  }

  async addSubscriber(email, name, { ip, userAgent, source = 'ui', consentVersion } = {}) {
    const existing = await this.getSubscriberByEmail(email).catch(() => null);
    const confirmationToken = this.generateToken();
    const unsubscribeToken = this.generateToken();

    // Resubscribe flow for previously unsubscribed users
    if (existing && existing.status === 'unsubscribed') {
      const sql = `UPDATE mailing_list_subscribers SET name = ?, status = 'pending', confirmed = FALSE, confirmation_token = ?, unsubscribe_token = ?, subscribed_at = CURRENT_TIMESTAMP, confirmed_at = NULL, unsubscribed_at = NULL, last_subscribe_attempt = CURRENT_TIMESTAMP, subscribe_attempts = COALESCE(subscribe_attempts,0) + 1, ip = COALESCE(?, ip), user_agent = COALESCE(?, user_agent), source = COALESCE(?, source), consent_version = COALESCE(?, consent_version) WHERE email = ?`;
      await this.runQuery(sql, [name, confirmationToken, unsubscribeToken, ip, userAgent, source, consentVersion, email]);
      logger.info(`Resubscribe initiated for: ${email}`);
      return { id: existing.id, email, name, confirmationToken, unsubscribeToken, status: 'pending', resubscribed: true };
    }

    // Duplicate pending subscription -> return hint instead of hard error
    if (existing && existing.status === 'pending') {
      await this.recordSubscribeAttempt(existing.email);
      return { duplicatePending: true, email, name: existing.name, status: 'pending', needsConfirmation: true, last_confirmation_sent: existing.last_confirmation_sent };
    }

    // Already confirmed
    if (existing && existing.status === 'confirmed') {
      await this.recordSubscribeAttempt(existing.email);
      throw new Error('Email already subscribed');
    }

    const insertSQL = `
      INSERT INTO mailing_list_subscribers (email, name, confirmation_token, unsubscribe_token, last_subscribe_attempt, subscribe_attempts, ip, user_agent, source, consent_version)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 1, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [email, name, confirmationToken, unsubscribeToken, ip, userAgent, source, consentVersion], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE constraint')) {
            reject(new Error('Email already subscribed'));
          } else {
            logger.error('Error adding subscriber:', err);
            reject(err);
          }
        } else {
          logger.info(`New subscriber added: ${email}`);
          resolve({
            id: this.lastID,
            email,
            name,
            confirmationToken,
            unsubscribeToken,
            status: 'pending'
          });
        }
      });
    });
  }

  async confirmSubscriber(token) {
    const updateSQL = `
      UPDATE mailing_list_subscribers 
      SET confirmed = TRUE, status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
      WHERE confirmation_token = ? AND status = 'pending'
    `;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, [token], function(err) {
        if (err) {
          logger.error('Error confirming subscriber:', err);
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Invalid or expired confirmation token'));
        } else {
          logger.info(`Subscriber confirmed with token: ${token.substring(0, 8)}...`);
          resolve();
        }
      });
    });
  }

  async unsubscribeUser(token) {
    const updateSQL = `
      UPDATE mailing_list_subscribers 
      SET status = 'unsubscribed', unsubscribed_at = CURRENT_TIMESTAMP
      WHERE unsubscribe_token = ? AND status != 'unsubscribed'
    `;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, [token], function(err) {
        if (err) {
          logger.error('Error unsubscribing user:', err);
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Invalid unsubscribe token'));
        } else {
          logger.info(`User unsubscribed with token: ${token.substring(0, 8)}...`);
          resolve();
        }
      });
    });
  }

  async deleteUserData(email) {
    const deleteSQL = `DELETE FROM mailing_list_subscribers WHERE email = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [email], function(err) {
        if (err) {
          logger.error('Error deleting user data:', err);
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Email not found'));
        } else {
          logger.info(`User data deleted for: ${email}`);
          resolve();
        }
      });
    });
  }

  async getSubscriberByToken(token, tokenType = 'confirmation') {
    const column = tokenType === 'confirmation' ? 'confirmation_token' : 'unsubscribe_token';
    const selectSQL = `SELECT * FROM mailing_list_subscribers WHERE ${column} = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, [token], (err, row) => {
        if (err) {
          logger.error('Error getting subscriber by token:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getAllConfirmedSubscribers() {
    const selectSQL = `SELECT email, name FROM mailing_list_subscribers WHERE status = 'confirmed'`;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [], (err, rows) => {
        if (err) {
          logger.error('Error getting confirmed subscribers:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Payment subscription methods
  async addPaymentSubscription(subscriptionData) {
    const {
      userId, email, name, planType, status = 'active',
      currentPeriodStart, currentPeriodEnd, nextBillingDate,
      amount, currency = 'USD', paymentMethod
    } = subscriptionData;

    const insertSQL = `
      INSERT INTO payment_subscriptions 
      (user_id, email, name, plan_type, status, current_period_start, 
       current_period_end, next_billing_date, amount, currency, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [
        userId, email, name, planType, status, currentPeriodStart,
        currentPeriodEnd, nextBillingDate, amount, currency, paymentMethod
      ], function(err) {
        if (err) {
          logger.error('Error adding payment subscription:', err);
          reject(err);
        } else {
          logger.info(`Payment subscription added for user: ${userId}`);
          resolve({ id: this.lastID, ...subscriptionData });
        }
      });
    });
  }

  async updatePaymentSubscription(subscriptionId, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    if (fields.length === 0) {
      return Promise.resolve();
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(subscriptionId);

    const updateSQL = `UPDATE payment_subscriptions SET ${fields.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, values, function(err) {
        if (err) {
          logger.error('Error updating payment subscription:', err);
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Subscription not found'));
        } else {
          logger.info(`Payment subscription updated: ${subscriptionId}`);
          resolve();
        }
      });
    });
  }

  async updatePaymentSubscriptionByUserId(userId, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    if (fields.length === 0) {
      return Promise.resolve();
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const updateSQL = `UPDATE payment_subscriptions SET ${fields.join(', ')} WHERE user_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, values, function(err) {
        if (err) {
          logger.error('Error updating payment subscription by user ID:', err);
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Subscription not found for user'));
        } else {
          logger.info(`Payment subscription updated for user: ${userId}`);
          resolve();
        }
      });
    });
  }

  async getPaymentSubscription(userId) {
    const selectSQL = `SELECT * FROM payment_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`;

    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, [userId], (err, row) => {
        if (err) {
          logger.error('Error getting payment subscription:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getUpcomingRenewals(daysAhead = 3) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const selectSQL = `
      SELECT * FROM payment_subscriptions 
      WHERE status = 'active' 
      AND next_billing_date <= ? 
      AND next_billing_date > CURRENT_TIMESTAMP
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [futureDate.toISOString()], (err, rows) => {
        if (err) {
          logger.error('Error getting upcoming renewals:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Payment events methods
  async addPaymentEvent(eventData) {
    const {
      userId, subscriptionId, eventType, amount, currency = 'USD',
      paymentMethod, transactionId, failureReason, metadata
    } = eventData;

    const insertSQL = `
      INSERT INTO payment_events 
      (user_id, subscription_id, event_type, amount, currency, payment_method, 
       transaction_id, failure_reason, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [
        userId, subscriptionId, eventType, amount, currency,
        paymentMethod, transactionId, failureReason, JSON.stringify(metadata)
      ], function(err) {
        if (err) {
          logger.error('Error adding payment event:', err);
          reject(err);
        } else {
          logger.info(`Payment event added: ${eventType} for user ${userId}`);
          resolve({ id: this.lastID, ...eventData });
        }
      });
    });
  }

  async markNotificationSent(eventId) {
    const updateSQL = `UPDATE payment_events SET notification_sent = TRUE WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, [eventId], function(err) {
        if (err) {
          logger.error('Error marking notification as sent:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getPendingNotifications() {
    const selectSQL = `
      SELECT pe.*, ps.email, ps.name, ps.plan_type 
      FROM payment_events pe
      LEFT JOIN payment_subscriptions ps ON pe.subscription_id = ps.id
      WHERE pe.notification_sent = FALSE
      ORDER BY pe.processed_at ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [], (err, rows) => {
        if (err) {
          logger.error('Error getting pending notifications:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // User management methods for OAuth authentication
  async createUser(userData) {
    const { googleId, email, name, avatarUrl, locale, verifiedEmail } = userData;
    const insertSQL = `
      INSERT INTO users (google_id, email, name, avatar_url, locale, verified_email)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [googleId, email, name, avatarUrl, locale, verifiedEmail], function(err) {
        if (err) {
          logger.error('Error creating user:', err);
          reject(err);
        } else {
          logger.info(`User created with ID: ${this.lastID}`);
          resolve({ id: this.lastID, ...userData });
        }
      });
    });
  }

  async getUserByGoogleId(googleId) {
    const selectSQL = `SELECT * FROM users WHERE google_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, [googleId], (err, row) => {
        if (err) {
          logger.error('Error getting user by Google ID:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Persistent usage tracking methods
  async getUserUsage(userId) {
    const sql = `SELECT user_id, message_count, period_start, monthly_message_count, monthly_period_start FROM usage_counters WHERE user_id = ?`;
    return new Promise((resolve, reject) => {
      this.db.get(sql, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  async resetUserUsage(userId, scope = 'daily') {
    const now = new Date().toISOString();
    if (scope === 'all') {
      const sql = `REPLACE INTO usage_counters (user_id, message_count, period_start, monthly_message_count, monthly_period_start) VALUES (?, 0, ?, 0, ?)`;
      return new Promise((resolve, reject) => {
        this.db.run(sql, [userId, now, now], function(err) {
          if (err) return reject(err);
          resolve({ userId, message_count: 0, period_start: now, monthly_message_count: 0, monthly_period_start: now });
        });
      });
    }
    // For other scopes (daily only), reset just daily counters  
    const sql = `REPLACE INTO usage_counters (user_id, message_count, period_start, monthly_message_count, monthly_period_start) VALUES (?, 0, ?, COALESCE((SELECT monthly_message_count FROM usage_counters WHERE user_id = ?), 0), COALESCE((SELECT monthly_period_start FROM usage_counters WHERE user_id = ?), ?))`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [userId, now, userId, userId, now], function(err) {
        if (err) return reject(err);
        resolve({ userId, message_count: 0, period_start: now });
      });
    });
  }

  async getUserByEmail(email) {
    const selectSQL = `SELECT * FROM users WHERE email = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, [email], (err, row) => {
        if (err) {
          logger.error('Error getting user by email:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getUserById(id) {
    const selectSQL = `SELECT * FROM users WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, [id], (err, row) => {
        if (err) {
          logger.error('Error getting user by ID:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateUser(id, userData) {
    const { email, name, avatarUrl, locale, verifiedEmail } = userData;
    const updateSQL = `
      UPDATE users 
      SET email = ?, name = ?, avatar_url = ?, locale = ?, verified_email = ?
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, [email, name, avatarUrl, locale, verifiedEmail, id], function(err) {
        if (err) {
          logger.error('Error updating user:', err);
          reject(err);
        } else {
          logger.info(`User updated: ${id}`);
          resolve(this.changes);
        }
      });
    });
  }

  // Add missing usage increment method
  async incrementUserUsage(userId) {
    const now = new Date().toISOString();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthStr = today.toISOString().substring(0, 7);

    // First, check if user has existing usage record
    let existing = await this.getUserUsage(userId);
    
    if (!existing) {
      // Create new usage record
      const sql = `INSERT INTO usage_counters (user_id, message_count, period_start, monthly_message_count, monthly_period_start) VALUES (?, 1, ?, 1, ?)`;
      return new Promise((resolve, reject) => {
        this.db.run(sql, [userId, now, now], function(err) {
          if (err) return reject(err);
          resolve({ userId, message_count: 1, period_start: now, monthly_message_count: 1, monthly_period_start: now });
        });
      });
    }

    // Check if we need to reset daily counter
    const existingDay = existing.period_start ? existing.period_start.split('T')[0] : null;
    const existingMonth = existing.monthly_period_start ? existing.monthly_period_start.substring(0, 7) : null;
    
    let dailyCount = existing.message_count || 0;
    let monthlyCount = existing.monthly_message_count || 0;
    
    if (existingDay !== todayStr) {
      // Reset daily counter
      dailyCount = 0;
    }
    
    if (existingMonth !== monthStr) {
      // Reset monthly counter
      monthlyCount = 0;
    }

    // Increment counters
    dailyCount += 1;
    monthlyCount += 1;

    const sql = `UPDATE usage_counters SET message_count = ?, period_start = ?, monthly_message_count = ?, monthly_period_start = ? WHERE user_id = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [dailyCount, now, monthlyCount, now, userId], function(err) {
        if (err) return reject(err);
        resolve({ userId, message_count: dailyCount, period_start: now, monthly_message_count: monthlyCount, monthly_period_start: now });
      });
    });
  }

  // Add missing batch usage deltas method
  async applyUsageDeltas(deltas) {
    const now = new Date().toISOString();
    
    for (const delta of deltas) {
      try {
        // Get current usage
        let existing = await this.getUserUsage(delta.userId);
        
        if (!existing) {
          // Create new record with deltas
          const sql = `INSERT INTO usage_counters (user_id, message_count, period_start, monthly_message_count, monthly_period_start) VALUES (?, ?, ?, ?, ?)`;
          await new Promise((resolve, reject) => {
            this.db.run(sql, [delta.userId, delta.dailyDelta || 0, now, delta.monthlyDelta || 0, now], function(err) {
              if (err) return reject(err);
              resolve();
            });
          });
        } else {
          // Update existing record with deltas
          const newDaily = (existing.message_count || 0) + (delta.dailyDelta || 0);
          const newMonthly = (existing.monthly_message_count || 0) + (delta.monthlyDelta || 0);
          
          const sql = `UPDATE usage_counters SET message_count = ?, monthly_message_count = ? WHERE user_id = ?`;
          await new Promise((resolve, reject) => {
            this.db.run(sql, [newDaily, newMonthly, delta.userId], function(err) {
              if (err) return reject(err);
              resolve();
            });
          });
        }
      } catch (error) {
        logger.error(`Error applying usage delta for user ${delta.userId}:`, error);
        // Continue with other deltas even if one fails
      }
    }
  }

  // Add missing audit logging method
  async logUsageEvent(eventData) {
    const { userId, eventType, dailyCount, monthlyCount, ip, source, meta, delta } = eventData;
    const now = new Date().toISOString();
    
    const sql = `INSERT INTO usage_events (user_id, event_type, daily_count, monthly_count, ip, source, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        userId, 
        eventType, 
        dailyCount || null, 
        monthlyCount || null, 
        ip || null, 
        source || 'unknown',
        JSON.stringify(meta || {}),
        now
      ], function(err) {
        if (err) {
          logger.error('Error logging usage event:', err);
          return reject(err);
        }
        resolve({ id: this.lastID, ...eventData, created_at: now });
      });
    });
  }

  // Custom authentication methods for email/password
  async createUserWithPassword(userData) {
    const { email, password_hash, name, avatarUrl, locale, verifiedEmail } = userData;
    const insertSQL = `
      INSERT INTO users (google_id, email, password_hash, name, avatar_url, locale, verified_email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [null, email, password_hash, name, avatarUrl, locale, verifiedEmail], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE constraint')) {
            reject(new Error('Email already registered'));
          } else {
            logger.error('Error creating user with password:', err);
            reject(err);
          }
        } else {
          logger.info(`User created with password authentication: ${email}`);
          resolve({ id: this.lastID, ...userData });
        }
      });
    });
  }

  async getUserByEmailForAuth(email) {
    const selectSQL = `SELECT id, email, password_hash, name, avatar_url, locale, verified_email, created_at, last_login_at FROM users WHERE email = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, [email], (err, row) => {
        if (err) {
          logger.error('Error getting user by email for auth:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateUserLastLogin(userId) {
    const updateSQL = `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, [userId], function(err) {
        if (err) {
          logger.error('Error updating user last login:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Update session methods to work with new auth
  async createUserSession(sessionData) {
    const { userId, sessionToken, refreshToken, expiresAt, ipAddress, userAgent } = sessionData;
    const insertSQL = `
      INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [userId, sessionToken, refreshToken, expiresAt, ipAddress, userAgent], function(err) {
        if (err) {
          logger.error('Error creating user session:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, ...sessionData });
        }
      });
    });
  }

  async getUserSession(sessionToken) {
    const selectSQL = `
      SELECT us.*, u.email, u.name, u.google_id, u.avatar_url, u.locale, u.verified_email, u.created_at, u.last_login_at
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.session_token = ? AND us.expires_at > CURRENT_TIMESTAMP
    `;

    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, [sessionToken], (err, row) => {
        if (err) {
          logger.error('Error getting user session:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateSessionLastAccessed(sessionToken) {
    const updateSQL = `UPDATE user_sessions SET last_accessed_at = CURRENT_TIMESTAMP WHERE session_token = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, [sessionToken], function(err) {
        if (err) {
          logger.error('Error updating session last accessed:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async deleteUserSession(sessionToken) {
    const deleteSQL = `DELETE FROM user_sessions WHERE session_token = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [sessionToken], function(err) {
        if (err) {
          logger.error('Error deleting user session:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async deleteAllUserSessions(userId) {
    const deleteSQL = `DELETE FROM user_sessions WHERE user_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [userId], function(err) {
        if (err) {
          logger.error('Error deleting all user sessions:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
        } else {
          logger.info('Database connection closed');
        }
      });
    }

  }
}

module.exports = new Database();