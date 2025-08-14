const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const logger = require('../utils/logger');
const { trackRequest, detectAbuse } = require('../utils/abuseMonitor');

// Basic rate limiting for all endpoints
const basicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    res.status(429).json({
      error: 'Too many requests from this IP. Please try again later.',
      retryAfter: 15 * 60
    });
  }
});

// Stricter rate limiting for chat endpoint
const chatRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 chat requests per minute
  message: {
    error: 'Too many chat requests. Please slow down and try again in a minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Chat rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many chat requests. Please slow down and try again in a minute.',
      retryAfter: 60
    });
  }
});

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  skipSuccessfulRequests: true,
  validate: {
    delayMs: false // Disable deprecation warning
  }
});

// Request logging and monitoring middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length')
  });
  
  // Track response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      statusCode: res.statusCode,
      duration,
      responseSize: Buffer.byteLength(data, 'utf8')
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Abuse detection middleware for chat endpoints
const abuseDetection = (req, res, next) => {
  try {
    const message = req.body?.message;
    
    // Track the request
    trackRequest(req, message);
    
    // Check for abuse patterns
    const abuseResult = detectAbuse(req, message);
    
    if (abuseResult.blocked) {
      const timeRemaining = Math.ceil((abuseResult.expiresAt - Date.now()) / (60 * 1000));
      
      logger.warn('Request blocked by abuse detection', {
        ip: req.ip,
        reason: abuseResult.reason,
        description: abuseResult.description,
        timeRemaining
      });
      
      return res.status(429).json({
        error: 'Your request has been temporarily blocked due to suspicious activity.',
        reason: 'Please contact support if you believe this is an error.',
        timeRemaining: `${timeRemaining} minutes`,
        supportEmail: 'support@autodevelop.ai'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Error in abuse detection middleware', { error: error.message });
    next(); // Continue even if abuse detection fails
  }
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Invalid request data',
      details: isDevelopment ? err.message : 'Please check your request and try again'
    });
  }
  
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please slow down and try again later'
    });
  }
  
  // Generic error response
  res.status(500).json({
    error: 'An unexpected error occurred',
    message: isDevelopment ? err.message : 'Please try again later or contact support if the problem persists'
  });
};

module.exports = {
  basicRateLimit,
  chatRateLimit,
  speedLimiter,
  requestLogger,
  abuseDetection,
  errorHandler
};