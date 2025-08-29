/**
 * Vercel Serverless API Handler - Minimal Version
 * 
 * This version uses minimal dependencies to ensure serverless function stability
 */

// Simple pricing data without external dependencies
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

// Parse URL to extract path and query parameters
function parseUrl(url) {
  const [pathname, queryString] = url.split('?');
  const query = {};
  
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      query[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }
  
  return { pathname, query };
}

// Main serverless function handler
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://autodevelop.ai');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const { pathname, query } = parseUrl(req.url);
    
    // Handle root API endpoint
    if (pathname === '/' || pathname === '') {
      res.status(200).json({
        status: 'healthy',
        message: 'AutoDevelop.ai API running ✅',
        timestamp: new Date().toISOString(),
        version: '2.0.0-minimal'
      });
      return;
    }
    
    // Handle pricing tiers endpoints
    if (pathname === '/pricing/tiers') {
      if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      
      const includePromo = query.promo === 'true';
      const tiers = getAllPricingTiers(includePromo);
      
      res.status(200).json({
        success: true,
        data: {
          tiers,
          freeTier: FREE_TIER,
          hasActivePromotion: isPromotionActive()
        }
      });
      return;
    }
    
    // Handle specific pricing tier endpoint
    const tierMatch = pathname.match(/^\/pricing\/tiers\/(.+)$/);
    if (tierMatch) {
      if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      
      const tierId = tierMatch[1];
      const includePromo = query.promo === 'true';
      
      const tier = getPricingTier(tierId, includePromo);
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
      return;
    }
    
    // For all other endpoints, return a temporary unavailable message
    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'This endpoint is being migrated to a more stable infrastructure. Pricing endpoints are functional.',
      availableEndpoints: [
        'GET /pricing/tiers',
        'GET /pricing/tiers/{tierId}'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};