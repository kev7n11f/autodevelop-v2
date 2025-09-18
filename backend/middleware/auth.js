const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');

// JWT secret from environment or generated fallback
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Stateless JWT authentication - no server-side session lookup
const authenticateToken = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access token required' });

    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach token payload to req.user (stateless)
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      google_id: decoded.googleId
    };

    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    logger.error('Error in authentication middleware:', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Optional authentication middleware that doesn't fail if token missing/invalid
const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      google_id: decoded.googleId
    };
    return next();
  } catch (_) {
    req.user = null;
    return next();
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