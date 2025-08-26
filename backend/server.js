require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./utils/passport');
const apiRoutes = require('./routes/apiRoutes');
const logger = require('./utils/logger');
const database = require('./utils/database');
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

// Initialize database connection
async function initializeDatabase() {
  try {
    await database.connect();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));

// Stripe webhook needs raw body BEFORE express.json
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Session configuration for OAuth state management
app.use(session({
  secret: process.env.SESSION_SECRET || 'autodevelop-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 10 * 60 * 1000 // 10 minutes (just for OAuth flow)
  }
}));

// Initialize Passport.js
app.use(passport.initialize());

// Logging and monitoring
app.use(requestLogger);

// Rate limiting and abuse prevention
app.use(basicRateLimit);
app.use(speedLimiter);

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/', (_, res) => {
  res.json({ 
    status: 'healthy',
    message: 'AutoDevelop.ai backend running ✅',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Health check for monitoring systems
app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
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

// Start server after database initialization
async function startServer() {
  await initializeDatabase();
  
  app.listen(port, () => {
    logger.info(`🌐  Server started successfully`, { 
      port, 
      nodeEnv: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});