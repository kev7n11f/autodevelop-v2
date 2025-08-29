/**
 * Vercel Serverless API Handler
 * 
 * This file provides a comprehensive API handler for Vercel deployment
 * that supports all backend API routes including pricing, payments, etc.
 */

// Initialize environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Create Express app for serverless function
const app = express();

// Configure CORS for production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://autodevelop.ai',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));

// Parse JSON requests
app.use(express.json({ limit: '10mb' }));

// Handle OPTIONS requests for CORS
app.options('*', cors());

// Inline pricing configuration for direct handling
const PRICING_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individual developers and small projects',
    priceMonthly: 9.99,
    priceYearly: 99.99,
    currency: 'USD',
    features: [
      'Up to 500 AI messages per month',
      'Standard response time',
      'Community support',
      'Basic project templates',
      'Code generation assistance'
    ],
    limits: {
      messagesPerMonth: 500,
      messagesPerDay: 50,
      projectsCount: 3
    },
    stripeIds: {
      monthly: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_monthly',
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly'
    },
    recommended: false,
    popular: false
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Ideal for professional developers and growing teams',
    priceMonthly: 19.99,
    priceYearly: 199.99,
    currency: 'USD',
    features: [
      'Unlimited AI messages',
      'Priority response time',
      'Email support',
      'Advanced project templates',
      'Code generation & refactoring',
      'API access',
      'Custom integrations',
      'Early feature access'
    ],
    limits: {
      messagesPerMonth: -1,
      messagesPerDay: -1,
      projectsCount: 25
    },
    stripeIds: {
      monthly: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly'
    },
    recommended: true,
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large teams and organizations with advanced needs',
    priceMonthly: 49.99,
    priceYearly: 499.99,
    currency: 'USD',
    features: [
      'Everything in Pro',
      'Priority dedicated support',
      'Custom model fine-tuning',
      'Advanced analytics & reporting',
      'SSO integration',
      'Custom deployment options',
      'SLA guarantees',
      'Training & onboarding',
      'Custom contract terms'
    ],
    limits: {
      messagesPerMonth: -1,
      messagesPerDay: -1,
      projectsCount: -1
    },
    stripeIds: {
      monthly: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
      yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly'
    },
    recommended: false,
    popular: false
  }
};

const FREE_TIER = {
  id: 'free',
  name: 'Free',
  description: 'Get started with AutoDevelop.ai at no cost',
  priceMonthly: 0,
  currency: 'USD',
  features: [
    'Up to 5 AI messages per day',
    'Up to 150 messages per month',
    'Community support',
    'Basic templates'
  ],
  limits: {
    messagesPerMonth: 150,
    messagesPerDay: 5,
    projectsCount: 1
  }
};

const PROMOTIONAL_PRICING = {
  earlyBird: {
    enabled: true,
    expiryDate: new Date('2025-12-31T23:59:59Z'),
    tiers: {
      starter: { priceMonthly: 7.99, priceYearly: 79.99 },
      pro: { priceMonthly: 14.99, priceYearly: 149.99 },
      enterprise: { priceMonthly: 39.99, priceYearly: 399.99 }
    }
  }
};

function isPromotionActive() {
  const promo = PROMOTIONAL_PRICING.earlyBird;
  return promo.enabled && new Date() < promo.expiryDate;
}

function applyPromotionalPricing(tiers) {
  if (!isPromotionActive()) return tiers;
  
  const promo = PROMOTIONAL_PRICING.earlyBird;
  const modifiedTiers = { ...tiers };
  
  Object.keys(promo.tiers).forEach(tierId => {
    if (modifiedTiers[tierId]) {
      modifiedTiers[tierId] = {
        ...modifiedTiers[tierId],
        originalPriceMonthly: modifiedTiers[tierId].priceMonthly,
        originalPriceYearly: modifiedTiers[tierId].priceYearly,
        priceMonthly: promo.tiers[tierId].priceMonthly,
        priceYearly: promo.tiers[tierId].priceYearly,
        isPromotional: true,
        promotionExpiry: promo.expiryDate
      };
    }
  });
  
  return modifiedTiers;
}

function getAllPricingTiers(includePromo = false) {
  if (includePromo && isPromotionActive()) {
    return applyPromotionalPricing(PRICING_TIERS);
  }
  return { ...PRICING_TIERS };
}

function getPricingTier(tierId, includePromo = false) {
  if (!tierId || typeof tierId !== 'string') {
    return null;
  }
  
  const tiers = getAllPricingTiers(includePromo);
  return tiers[tierId.toLowerCase()] || null;
}

// Handle pricing endpoints directly without database dependencies
app.get('/pricing/tiers/:tierId', (req, res) => {
  try {
    const { tierId } = req.params;
    const includePromo = req.query.promo === 'true';
    
    const tier = getPricingTier(tierId, includePromo);
    if (!tier) {
      return res.status(404).json({
        success: false,
        error: 'Pricing tier not found'
      });
    }

    res.json({
      success: true,
      data: tier
    });
  } catch (error) {
    console.error('Error fetching pricing tier details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing tier details',
      details: error.message
    });
  }
});

app.get('/pricing/tiers', (req, res) => {
  try {
    const includePromo = req.query.promo === 'true';
    const tiers = getAllPricingTiers(includePromo);
    
    res.json({
      success: true,
      data: {
        tiers,
        freeTier: FREE_TIER,
        hasActivePromotion: isPromotionActive()
      }
    });
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing tiers',
      details: error.message
    });
  }
});

// Lazy-load backend routes for other endpoints (with error handling)
let backendApiRoutes = null;

function getBackendRoutes() {
  if (!backendApiRoutes) {
    try {
      backendApiRoutes = require('../backend/routes/apiRoutes');
    } catch (error) {
      console.error('Failed to load backend routes:', error.message);
      // Return a minimal router with error responses
      const router = require('express').Router();
      router.use('*', (req, res) => {
        res.status(500).json({
          error: 'Backend services temporarily unavailable',
          message: 'The API is experiencing initialization issues. Please try again later.',
          timestamp: new Date().toISOString()
        });
      });
      return router;
    }
  }
  return backendApiRoutes;
}

// Mount backend API routes with lazy loading for non-pricing endpoints
app.use('/', (req, res, next) => {
  // Skip pricing endpoints as they're handled above
  if (req.path.startsWith('/pricing/')) {
    return next();
  }
  
  const routes = getBackendRoutes();
  routes(req, res, next);
});

// Health check endpoint for root /api calls
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'AutoDevelop.ai API running ✅',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Handle 404 for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Export as Vercel serverless function
module.exports = app;