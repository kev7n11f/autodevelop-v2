const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const database = require('../utils/database');
const logger = require('../utils/logger');

// JWT secret from environment or generate a random one
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Middleware to verify JWT token and authenticate user
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user session from database
    const session = await database.getUserSession(token);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Update last accessed time
    await database.updateSessionLastAccessed(token);
    
    // Attach user to request
    req.user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      google_id: session.google_id,
      avatar_url: session.avatar_url,
      locale: session.locale,
      verified_email: session.verified_email,
      created_at: session.created_at,
      last_login_at: session.last_login_at
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else {
      logger.error('Error in authentication middleware:', {
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({ error: 'Authentication error' });
    }
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user session from database
    const session = await database.getUserSession(token);
    
    if (session) {
      // Update last accessed time
      await database.updateSessionLastAccessed(token);
      
      // Attach user to request
      req.user = {
        id: session.user_id,
        email: session.email,
        name: session.name,
        google_id: session.google_id,
        avatar_url: session.avatar_url,
        locale: session.locale,
        verified_email: session.verified_email,
        created_at: session.created_at,
        last_login_at: session.last_login_at
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

// Middleware to require authentication for protected routes
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      redirectTo: '/login'
    });
  }
  next();
};

// CSRF protection for OAuth flow
const csrfProtection = (req, res, next) => {
  const state = req.query.state || req.body.state;
  const sessionState = req.session?.oauthState;

  if (!state || !sessionState || state !== sessionState) {
    logger.warn('CSRF attack detected in OAuth flow', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      providedState: state,
      sessionState: sessionState
    });
    return res.status(403).json({ error: 'Invalid request state' });
  }

  next();
};

// Generate and store CSRF state for OAuth
const generateOAuthState = (req, res, next) => {
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;
  req.oauthState = state;
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAuth,
  csrfProtection,
  generateOAuthState
};