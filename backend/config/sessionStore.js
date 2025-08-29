/**
 * Session Store Configuration Module
 * 
 * This module provides a modular way to configure different session stores.
 * Currently supports SQLite via connect-sqlite3, but can be easily extended
 * to support Redis, MongoDB, or other session stores.
 * 
 * To swap to a different session store:
 * 1. Install the appropriate package (e.g., connect-redis, connect-mongo)
 * 2. Add a new case in the switch statement below
 * 3. Update the SESSION_STORE environment variable or default configuration
 * 4. Restart the server
 * 
 * Supported stores:
 * - sqlite: Uses connect-sqlite3 with the existing SQLite database
 * - redis: (Future) Would use connect-redis
 * - mongo: (Future) Would use connect-mongo
 * - memory: Default express-session MemoryStore (development only)
 */

const session = require('express-session');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Creates and configures the session store based on the specified type
 * @param {string} storeType - The type of session store to create
 * @param {Object} options - Configuration options for the store
 * @returns {Object} Configured session store instance
 */
function createSessionStore(storeType = 'sqlite', options = {}) {
  const normalizedStoreType = storeType.toLowerCase();
  
  logger.info('Initializing session store', { 
    storeType: normalizedStoreType,
    environment: process.env.NODE_ENV || 'development'
  });

  switch (normalizedStoreType) {
    case 'sqlite': {
      const SQLiteStore = require('connect-sqlite3')(session);
      
      // Use the same database directory as the main app database
      const dbDir = path.join(__dirname, '../');
      const dbPath = path.join(dbDir, 'sessions.db');
      
      // Ensure the database directory exists
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        logger.info('Created session database directory', { dbDir });
      }
      
      const storeOptions = {
        // Database file path (relative to the process working directory)
        db: 'sessions.db',
        // Directory containing the database file
        dir: dbDir,
        // Table name for sessions
        table: 'sessions',
        // Cleanup expired sessions periodically
        ...options.sqlite
      };
      
      logger.info('Creating SQLite session store', { 
        dbPath,
        dir: dbDir,
        table: storeOptions.table
      });
      
      return new SQLiteStore(storeOptions);
    }
    
    case 'redis': {
      // Future implementation for Redis
      // const RedisStore = require('connect-redis')(session);
      // const redis = require('redis');
      // const client = redis.createClient(options.redis);
      // return new RedisStore({ client });
      
      logger.warn('Redis session store not implemented yet, falling back to memory store');
      return new session.MemoryStore();
    }
    
    case 'mongo':
    case 'mongodb': {
      // Future implementation for MongoDB
      // const MongoStore = require('connect-mongo');
      // return MongoStore.create(options.mongo);
      
      logger.warn('MongoDB session store not implemented yet, falling back to memory store');
      return new session.MemoryStore();
    }
    
    case 'memory':
    default: {
      if (process.env.NODE_ENV === 'production') {
        logger.warn('Using MemoryStore in production is not recommended. Consider using SQLite, Redis, or MongoDB.');
      }
      
      logger.info('Using default MemoryStore for sessions');
      return new session.MemoryStore();
    }
  }
}

/**
 * Gets the default session store configuration based on environment
 * @returns {Object} Session store configuration
 */
function getDefaultSessionConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Default to SQLite for better persistence, even in development
  const storeType = process.env.SESSION_STORE || 'sqlite';
  
  const config = {
    storeType,
    options: {
      // Session TTL (time to live)
      ttl: isProduction ? 24 * 60 * 60 * 1000 : 10 * 60 * 1000, // 24h in prod, 10min in dev
      
      // Store-specific options
      sqlite: {
        // Additional SQLite-specific options can be added here
      },
      redis: {
        // Future Redis configuration
        // host: process.env.REDIS_HOST || 'localhost',
        // port: process.env.REDIS_PORT || 6379,
        // password: process.env.REDIS_PASSWORD
      },
      mongo: {
        // Future MongoDB configuration
        // url: process.env.MONGODB_SESSION_URL || 'mongodb://localhost:27017/sessions'
      }
    }
  };
  
  return config;
}

/**
 * Creates a complete session configuration object
 * @param {Object} customConfig - Custom configuration to override defaults
 * @returns {Object} Complete session configuration for express-session
 */
function createSessionConfig(customConfig = {}) {
  const defaultConfig = getDefaultSessionConfig();
  const config = { ...defaultConfig, ...customConfig };
  
  // Create the session store
  const store = createSessionStore(config.storeType, config.options);
  
  // Return the complete session configuration
  return {
    store,
    secret: process.env.SESSION_SECRET || 'autodevelop-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: config.options.ttl
    },
    // Add any additional custom configuration
    ...customConfig.sessionOptions
  };
}

module.exports = {
  createSessionStore,
  getDefaultSessionConfig,
  createSessionConfig
};