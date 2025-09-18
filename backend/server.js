require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
// Sessions are no longer required for stateless JWT auth. Keep imports for reference.
// const session = require('express-session');
const passport = require('./utils/passport');
const apiRoutes = require('./routes/apiRoutes');
const logger = require('./utils/logger');
const database = require('./utils/database');
const { runMigrations } = require('./utils/migrations');
const { validateEnvironmentVariables, logValidationResults } = require('./utils/envValidator');
const { createSessionConfig } = require('./config/sessionStore');
const { 
  basicRateLimit, 
  speedLimiter, 
  requestLogger, 
  errorHandler 
} = require('./middleware/security');
const { 
  createStripeCheckoutSession,
  createBillingPortalSession,
  stripeWebhook
} = require('./controllers/paymentController');

const app = express();
const port = process.env.PORT || 8080;

// Track service availability for health checks
const serviceHealth = {
  database: false,
  server: false,
  startupErrors: []
};

// Initialize database connection with graceful error handling
async function initializeDatabase() {
  try {
    await database.connect();
    // Run deterministic, idempotent migrations immediately after connect
    try {
      await runMigrations();
    } catch (mErr) {
      logger.warn('Migrations encountered an error; continuing startup (migration retry path still available)', { error: mErr.message });
      serviceHealth.startupErrors.push({ service: 'migrations', error: mErr.message, timestamp: new Date().toISOString() });
    }
    logger.info('Database initialized successfully');
    serviceHealth.database = true;
    return true;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    serviceHealth.database = false;
    serviceHealth.startupErrors.push({
      service: 'database',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // In production/Render environment, don't exit - allow server to start for health checks
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      logger.warn('Database initialization failed, but continuing startup for health checks in production environment');
      return false;
    } else {
      // In development, still exit for immediate feedback
      logger.error('Database initialization failed in development environment, exiting');
      process.exit(1);
    }
  }
}

// Trust proxy for accurate IP addresses when behind reverse proxies
app.set('trust proxy', 1);

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com"]
    }
  }
}));
app.use(compression());
// Configure CORS: in development allow any origin (helps with Vite using different ports),
// in production lock down to FRONTEND_URL for security.
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const corsOptions = process.env.NODE_ENV === 'production' ? {
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
} : {
  // In development allow the dev server (and other local ports) to access APIs
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
};

app.use(cors(corsOptions));

// Stripe webhook needs raw body BEFORE express.json
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Stateless JWT auth in production. If OAuth flows requiring server-side state
// are used, consider enabling a session store (Redis) or storing OAuth state
// in a short-lived persistent store. For now, we rely on JWTs and cookies.

// Initialize Passport.js
app.use(passport.initialize());

// Render health check endpoint - must be early and lightweight for deployment
// Position before rate limiting to ensure health checks are never blocked
app.get('/autodevelop.ai/health', (_, res) => {
  logger.info('Render health check accessed', { 
    endpoint: '/autodevelop.ai/health',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
  
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Logging and monitoring
app.use(requestLogger);

// Rate limiting and abuse prevention
app.use(basicRateLimit);
app.use(speedLimiter);

// API routes
app.use('/api', apiRoutes);

// Health check endpoint - basic status
app.get('/', (_, res) => {
  res.json({ 
    status: 'healthy',
    message: 'AutoDevelop.ai backend running ✅',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Health check for monitoring systems - detailed status
app.get('/health', (_, res) => {
  const isHealthy = serviceHealth.server;
  const hasErrors = serviceHealth.startupErrors.length > 0;
  
  // Always respond quickly for Render health checks
  const healthStatus = {
    status: (serviceHealth.server && serviceHealth.database) ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: serviceHealth.database ? 'healthy' : 'unavailable',
      server: serviceHealth.server ? 'healthy' : 'starting'
    }
  };
  
  // Include startup errors if any (but still return 200 for health checks)
  if (hasErrors) {
    healthStatus.startupErrors = serviceHealth.startupErrors;
  }
  
  // Add environment info for debugging
  healthStatus.environment = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 8080,
    isRender: !!process.env.RENDER
  };
  
  // Add feature availability status
  healthStatus.features = {
    authentication: 'available',
    chat: process.env.OPENAI_API_KEY ? 'available' : 'disabled (no API key)',
    payments: process.env.STRIPE_SECRET_KEY ? 'available' : 'disabled (no API key)',
    email: process.env.SENDGRID_API_KEY ? 'available' : 'disabled (no API key)'
  };
  
  // Add environment validation status
  const envValidation = validateEnvironmentVariables(process.env.NODE_ENV || 'development');
  healthStatus.environmentValidation = {
    isValid: envValidation.isValid,
    missing: envValidation.missing.length,
    warnings: envValidation.warnings.length,
    missingVariables: envValidation.missing.map(v => v.name)
  };
  
  // Add helpful setup message for development
  if (!envValidation.isValid) {
    healthStatus.setup = {
      message: 'Some required environment variables are missing',
      help: 'See VERCEL_DEPLOYMENT_SETUP.md for configuration instructions',
      missing: envValidation.missing.map(v => v.name),
      test: 'Run "node test-system.js" to see detailed status'
    };
  }
  
  res.json(healthStatus);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  database.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  database.close();
  process.exit(0);
});

// Start server with graceful error handling
async function startServer() {
  logger.info('🚀 Starting AutoDevelop.ai server...', {
    nodeEnv: process.env.NODE_ENV || 'development',
    port,
    isRender: !!process.env.RENDER,
    timestamp: new Date().toISOString()
  });
  
  // Validate environment variables
  const envValidation = validateEnvironmentVariables(process.env.NODE_ENV || 'development');
  logValidationResults(envValidation);
  
  if (!envValidation.isValid && process.env.NODE_ENV === 'production') {
    logger.error('❌ Production deployment requires all environment variables to be set');
    logger.info('📋 Missing variables:', envValidation.missing.map(v => v.name));
    logger.info('📖 See VERCEL_DEPLOYMENT_SETUP.md for configuration instructions');
    
    // In production, we should warn but not exit to allow health checks
    serviceHealth.startupErrors.push({
      service: 'environment',
      error: 'Missing required environment variables',
      missing: envValidation.missing.map(v => v.name),
      timestamp: new Date().toISOString()
    });
  }
  
  // Log environment variable status for debugging
  logger.info('Environment configuration:', {
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasSendGrid: !!process.env.SENDGRID_API_KEY,
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
    hasAdminKey: !!process.env.ADMIN_KEY,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
  
  // Initialize database (non-blocking in production)
  const dbInitialized = await initializeDatabase();
  
  // Start HTTP server regardless of database status
  const server = app.listen(port, '0.0.0.0', () => {
    serviceHealth.server = true;
    logger.info(`🌐 Server started successfully`, { 
      port, 
      nodeEnv: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      databaseHealthy: serviceHealth.database,
      bindAddress: '0.0.0.0'
    });
    
    // Log service status summary
    logger.info('Service status summary:', {
      database: serviceHealth.database ? 'OK' : 'ERROR',
      server: 'OK',
      startupErrors: serviceHealth.startupErrors.length
    });
  });
  
  // Handle server startup errors
  server.on('error', (error) => {
    logger.error('Server failed to start:', error);
    process.exit(1);
  });
  
  return server;
}

// Export the app for Vercel serverless functions
module.exports = app;

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}