const jwtService = require('../utils/jwt');
const dynamodb = require('../utils/dynamodb');
const logger = require('../../backend/utils/logger');

// Main JWT authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader) || req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify the token
    const verification = jwtService.verifyAccessToken(token);
    
    if (!verification.valid) {
      const statusCode = verification.expired ? 401 : 401;
      const errorCode = verification.expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
      
      return res.status(statusCode).json({
        success: false,
        error: verification.error,
        code: errorCode
      });
    }

    // Get user from database to ensure they still exist
    const user = await dynamodb.getUserById(verification.payload.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      tokenPayload: verification.payload
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader) || req.cookies?.accessToken;

    if (!token) {
      req.user = null;
      return next();
    }

    const verification = jwtService.verifyAccessToken(token);
    
    if (verification.valid) {
      const user = await dynamodb.getUserById(verification.payload.id);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
          tokenPayload: verification.payload
        };
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    req.user = null;
    next();
  }
};

// Middleware to check if user is verified
const requireVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'VERIFICATION_REQUIRED'
    });
  }

  next();
};

// Middleware to check subscription status
const requireSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const subscription = await dynamodb.getSubscription(req.user.id);
    
    if (!subscription || subscription.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        details: 'This feature requires an active subscription'
      });
    }

    // Attach subscription info to request
    req.subscription = subscription;
    next();
  } catch (error) {
    logger.error('Subscription check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify subscription',
      code: 'SUBSCRIPTION_CHECK_ERROR'
    });
  }
};

// Middleware to check specific subscription tier
const requireTier = (requiredTier) => {
  const tierLevels = {
    'starter': 1,
    'pro': 2,
    'enterprise': 3
  };

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const subscription = await dynamodb.getSubscription(req.user.id);
      
      if (!subscription || subscription.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Active subscription required',
          code: 'SUBSCRIPTION_REQUIRED'
        });
      }

      const userTierLevel = tierLevels[subscription.planId] || 0;
      const requiredTierLevel = tierLevels[requiredTier] || 999;

      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({
          success: false,
          error: `${requiredTier} subscription required`,
          code: 'INSUFFICIENT_TIER',
          details: `This feature requires a ${requiredTier} subscription or higher`
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      logger.error('Tier check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify subscription tier',
        code: 'TIER_CHECK_ERROR'
      });
    }
  };
};

// Rate limiting middleware (basic implementation)
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const identifier = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(identifier)) {
      const userRequests = requests.get(identifier).filter(time => time > windowStart);
      requests.set(identifier, userRequests);
    }

    const userRequests = requests.get(identifier) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    userRequests.push(now);
    requests.set(identifier, userRequests);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - userRequests.length,
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireVerification,
  requireSubscription,
  requireTier,
  rateLimit
};