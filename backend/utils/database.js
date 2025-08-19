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
    const createTableSQL = `
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

    return new Promise((resolve, reject) => {
      this.db.run(createTableSQL, (err) => {
        if (err) {
          logger.error('Error creating mailing list table:', err);
          reject(err);
        } else {
          logger.info('Mailing list table initialized');
          resolve();
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
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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