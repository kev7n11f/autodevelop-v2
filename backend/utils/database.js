const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '..', 'mailing_list.db');
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Error connecting to database:', err);
          reject(err);
        } else {
          logger.info('Connected to SQLite database for mailing list');
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
        plan_type TEXT NOT NULL CHECK(plan_type IN ('basic', 'pro', 'enterprise')),
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
        google_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
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
        this.db.get(`PRAGMA table_info(payment_subscriptions)`, [], (err, rows) => {
          if (err) return resolve();
          const exists = rows.some(r => r.name === col);
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
      this.db.get(`PRAGMA table_info(usage_counters)`, [], (err, rows) => resolve(rows));
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

  // User management methods for OAuth authentication
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

  async resetUserUsage(userId, scope = 'daily') {
    const now = new Date().toISOString();
    if (scope === 'all') {
      const sql = `REPLACE INTO usage_counters (user_id, message_count, period_start, monthly_message_count, monthly_period_start) VALUES (?, 0, ?, 0, ?)`;
      return new Promise((resolve, reject) => {
        this.db.run(sql, [userId, now, now], function(err) {
          if (err) return reject(err);
          resolve({ userId, message_count: 0, period_start: now, monthly_message_count: 0, monthly_period_start: now });
        });      });
    }
    if (scope === 'monthly') {
      const sql = `UPDATE usage_counters SET monthly_message_count = 0, monthly_period_start = ? WHERE user_id = ?`;
      return new Promise((resolve, reject) => {
        this.db.run(sql, [now, userId], function(err) {
          if (err) return reject(err);
          resolve();
        });
      });
    }
    // daily
    const sql = `UPDATE usage_counters SET message_count = 0, period_start = ? WHERE user_id = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [now, userId], function(err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async incrementUserUsage(userId, period = 'day') {
    const existing = await this.getUserUsage(userId);
    const now = new Date();
    if (existing) {
      const periodStart = new Date(existing.period_start);
      const monthStart = new Date(existing.monthly_period_start || existing.period_start);
      if (this._isPeriodExpired(periodStart, now, 'day')) {
        await this.resetUserUsage(userId, 'daily');
      }
      if (this._isPeriodExpired(monthStart, now, 'month')) {
        await this.resetUserUsage(userId, 'monthly');
      }
    } else {
      // create baseline row
      const baseline = `INSERT OR REPLACE INTO usage_counters (user_id, message_count, period_start, monthly_message_count, monthly_period_start) VALUES (?, 0, ?, 0, ?)`;
      const iso = new Date().toISOString();
      await this.runQuery(baseline, [userId, iso, iso]);
    }
    const updateSQL = `UPDATE usage_counters SET message_count = message_count + 1, monthly_message_count = monthly_message_count + 1 WHERE user_id = ?`;
    await new Promise((resolve, reject) => {
      this.db.run(updateSQL, [userId], function(err) { if (err) return reject(err); resolve(); });
    });
    const updated = await this.getUserUsage(userId);
    return { messageCount: updated.message_count, periodStart: updated.period_start, monthlyCount: updated.monthly_message_count };
  }

  async applyUsageDeltas(deltas) {
    // deltas: [{ userId, dailyDelta, monthlyDelta }]
    if (!deltas.length) return;
    await this.runQuery('BEGIN TRANSACTION');
    try {
      for (const d of deltas) {
        const ensure = `INSERT OR IGNORE INTO usage_counters (user_id, message_count, period_start, monthly_message_count, monthly_period_start) VALUES (?,0, CURRENT_TIMESTAMP,0,CURRENT_TIMESTAMP)`;
        await this.runQuery(ensure, [d.userId]);
        const update = `UPDATE usage_counters SET message_count = message_count + ?, monthly_message_count = monthly_message_count + ? WHERE user_id = ?`;
        await this.runQuery(update, [d.dailyDelta || 0, d.monthlyDelta || 0, d.userId]);
      }
      await this.runQuery('COMMIT');
    } catch (e) {
      await this.runQuery('ROLLBACK');
      throw e;
    }
  }

  async logUsageEvent({ userId, eventType, delta = 0, dailyCount, monthlyCount, ip, source = 'chat', meta = {} }) {
    const sql = `INSERT INTO usage_events (user_id, event_type, daily_count, monthly_count, delta, ip, source, meta) VALUES (?,?,?,?,?,?,?,?)`;
    try {
      await this.runQuery(sql, [userId, eventType, dailyCount, monthlyCount, delta, ip, source, JSON.stringify(meta)]);
    } catch (e) {
      logger.warn('Failed to log usage event', { userId, eventType, error: e.message });
    }
  }

  async getRecentUsageEvents(limit = 50, userId) {
    let sql = `SELECT * FROM usage_events`;
    const params = [];
    if (userId) { sql += ' WHERE user_id = ?'; params.push(userId); }
    sql += ' ORDER BY id DESC LIMIT ?'; params.push(limit);
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
  }

  async getUsageStats() {
    const totals = await new Promise((resolve) => {
      this.db.get(`SELECT COUNT(*) as users, SUM(message_count) as daily_messages, SUM(monthly_message_count) as monthly_messages FROM usage_counters`, [], (err, row) => {
        if (err) return resolve({ users:0,daily_messages:0,monthly_messages:0 });
        resolve(row);
      });
    });
    const subs = await new Promise((resolve) => {
      this.db.get(`SELECT COUNT(*) as active_subscriptions, SUM(amount) as mrr FROM payment_subscriptions WHERE status IN ('active','trial')`, [], (err, row) => {
        if (err) return resolve({ active_subscriptions: 0, mrr: 0 });
        resolve(row);
      });
    });
    return {
      users: totals.users || 0,
      daily_messages: totals.daily_messages || 0,
      monthly_messages: totals.monthly_messages || 0,
      active_subscriptions: subs.active_subscriptions || 0,
      mrr: subs.mrr || 0,
      timestamp: new Date().toISOString()
    };
  }

  async getUserDiagnostic(userId) {
    const usage = await this.getUserUsage(userId).catch(() => null);
    const subscription = await this.getPaymentSubscription(userId).catch(() => null);
    const recentEvents = await this.getRecentUsageEvents(25, userId).catch(() => []);
    return {
      userId,
      usage: usage ? {
        daily: usage.message_count,
        daily_period_start: usage.period_start,
        monthly: usage.monthly_message_count,
        monthly_period_start: usage.monthly_period_start
      } : null,
      subscription: subscription ? {
        plan: subscription.plan_type,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        next_billing_date: subscription.next_billing_date,
        amount: subscription.amount,
        currency: subscription.currency
      } : null,
      recentUsageEvents: recentEvents,
      generated_at: new Date().toISOString()
    };
  }
}

module.exports = new Database();