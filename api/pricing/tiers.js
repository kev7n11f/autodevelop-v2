/**
 * Standalone Pricing Tiers API for Vercel Serverless
 * 
 * This endpoint provides pricing information without requiring database connections
 * or other heavy dependencies that might cause serverless function failures.
 */

// Direct import of pricing configuration without dependencies
const path = require('path');

// Inline pricing configuration to avoid import issues
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
      starter: {
        priceMonthly: 7.99,
        priceYearly: 79.99
      },
      pro: {
        priceMonthly: 14.99,
        priceYearly: 149.99
      },
      enterprise: {
        priceMonthly: 39.99,
        priceYearly: 399.99
      }
    }
  }
};

function isPromotionActive() {
  const promo = PROMOTIONAL_PRICING.earlyBird;
  if (!promo.enabled) return false;
  return new Date() < promo.expiryDate;
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

// Vercel serverless function handler
module.exports = (req, res) => {
  // Enable CORS
  if (!process.env.FRONTEND_URL) {
    res.status(500).json({
      success: false,
      error: 'FRONTEND_URL environment variable is not set. CORS policy requires this to be defined.'
    });
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
    return;
  }

  try {
    const { url } = req;
    const urlParts = url.split('/');
    const tierId = urlParts[urlParts.length - 1];
    
    // Check if requesting specific tier
    if (tierId && tierId !== 'tiers' && !tierId.includes('?')) {
      // Get specific tier
      const tier = getPricingTier(tierId, req.query?.promo === 'true');
      if (!tier) {
        res.status(404).json({
          success: false,
          error: 'Pricing tier not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: tier
      });
    } else {
      // Get all tiers
      const includePromo = req.query?.promo === 'true';
      const tiers = getAllPricingTiers(includePromo);
      
      res.status(200).json({
        success: true,
        data: {
          tiers,
          freeTier: FREE_TIER,
          hasActivePromotion: isPromotionActive()
        }
      });
    }
  } catch (error) {
    console.error('Error in pricing API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing tiers',
      details: error.message
    });
  }
};