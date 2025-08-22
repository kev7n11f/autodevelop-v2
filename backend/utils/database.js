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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    try {
      await this.runQuery(createUsersTableSQL);
      logger.info('Users table initialized');
      
      await this.runQuery(createUserSessionsTableSQL);
      logger.info('User sessions table initialized');
      
      await this.runQuery(createMailingListTableSQL);
      logger.info('Mailing list table initialized');
      
      await this.runQuery(createPaymentSubscriptionsTableSQL);
      logger.info('Payment subscriptions table initialized');
      
      await this.runQuery(createPaymentEventsTableSQL);
      logger.info('Payment events table initialized');
      
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

  async addSubscriber(email, name) {
    const confirmationToken = this.generateToken();
    const unsubscribeToken = this.generateToken();

    const insertSQL = `
      INSERT INTO mailing_list_subscribers (email, name, confirmation_token, unsubscribe_token)
      VALUES (?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [email, name, confirmationToken, unsubscribeToken], function(err) {
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
            unsubscribeToken
          });
        }
      });
    });
  }

  async confirmSubscriber(token) {
    const updateSQL = `
      UPDATE mailing_list_subscribers 
      SET confirmed = TRUE, status = 'confirmed'
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
      SET status = 'unsubscribed'
      WHERE unsubscribe_token = ?
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
          logger.info(`User session created with ID: ${this.lastID}`);
          resolve({ id: this.lastID, ...sessionData });
        }
      });
    });
  }

  async getUserSession(sessionToken) {
    const selectSQL = `
      SELECT us.*, u.* 
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
          logger.info(`User session deleted: ${sessionToken.substring(0, 8)}...`);
          resolve();
        }
      });
    });
  }

  async deleteExpiredSessions() {
    const deleteSQL = `DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP`;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [], function(err) {
        if (err) {
          logger.error('Error deleting expired sessions:', err);
          reject(err);
        } else {
          if (this.changes > 0) {
            logger.info(`Deleted ${this.changes} expired sessions`);
          }
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
}

module.exports = new Database();