/**
 * Pricing Configuration for AutoDevelop.ai v2
 * 
 * This file defines competitive pricing tiers and options for the subscription service.
 * Update these configurations to modify pricing without changing core application logic.
 */

// Competitive pricing tiers based on market research
const PRICING_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individual developers and small projects',
    priceMonthly: 9.99,
    priceYearly: 99.99, // ~17% discount
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
    priceYearly: 199.99, // ~17% discount
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
      messagesPerMonth: -1, // unlimited
      messagesPerDay: -1,   // unlimited
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
    priceYearly: 499.99, // ~17% discount
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
      messagesPerMonth: -1, // unlimited
      messagesPerDay: -1,   // unlimited
      projectsCount: -1     // unlimited
    },
    stripeIds: {
      monthly: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
      yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly'
    },
    recommended: false,
    popular: false
  }
};

// Special promotional pricing (early bird, seasonal offers, etc.)
const PROMOTIONAL_PRICING = {
  earlyBird: {
    enabled: true,
    expiryDate: new Date('2025-12-31T23:59:59Z'),
    tiers: {
      starter: {
        priceMonthly: 7.99, // 20% off
        priceYearly: 79.99  // Additional savings
      },
      pro: {
        priceMonthly: 14.99, // 25% off
        priceYearly: 149.99  // Additional savings
      },
      enterprise: {
        priceMonthly: 39.99, // 20% off
        priceYearly: 399.99  // Additional savings
      }
    }
  }
};

// Free tier configuration
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

/**
 * Get all available pricing tiers
 * @param {boolean} includePromo - Whether to include promotional pricing
 * @returns {Object} All pricing tiers
 */
function getAllPricingTiers(includePromo = false) {
  if (includePromo && isPromotionActive()) {
    return applyPromotionalPricing(PRICING_TIERS);
  }
  return { ...PRICING_TIERS };
}

/**
 * Get a specific pricing tier by ID
 * @param {string} tierId - The tier ID (starter, pro, enterprise)
 * @param {boolean} includePromo - Whether to include promotional pricing
 * @returns {Object|null} The pricing tier or null if not found
 */
function getPricingTier(tierId, includePromo = false) {
  if (!tierId || typeof tierId !== 'string') {
    return null;
  }
  
  const tiers = getAllPricingTiers(includePromo);
  return tiers[tierId.toLowerCase()] || null;
}

/**
 * Get Stripe price ID for a specific tier and billing cycle
 * @param {string} tierId - The tier ID
 * @param {string} cycle - 'monthly' or 'yearly'
 * @returns {string|null} Stripe price ID or null if not found
 */
function getStripePriceId(tierId, cycle = 'monthly') {
  if (!tierId || typeof tierId !== 'string') {
    return null;
  }
  
  if (!['monthly', 'yearly'].includes(cycle)) {
    return null;
  }
  
  const tier = getPricingTier(tierId);
  if (!tier || !tier.stripeIds) return null;
  return tier.stripeIds[cycle] || null;
}

/**
 * Check if promotional pricing is currently active
 * @returns {boolean} True if promotion is active
 */
function isPromotionActive() {
  const promo = PROMOTIONAL_PRICING.earlyBird;
  if (!promo.enabled) return false;
  return new Date() < promo.expiryDate;
}

/**
 * Apply promotional pricing to tiers
 * @param {Object} tiers - Original pricing tiers
 * @returns {Object} Tiers with promotional pricing applied
 */
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

/**
 * Get tier by Stripe price ID
 * @param {string} stripePriceId - Stripe price ID
 * @returns {Object|null} Tier information or null if not found
 */
function getTierByStripePriceId(stripePriceId) {
  const tiers = getAllPricingTiers(true);
  
  for (const [tierId, tier] of Object.entries(tiers)) {
    if (tier.stripeIds) {
      for (const [cycle, priceId] of Object.entries(tier.stripeIds)) {
        if (priceId === stripePriceId) {
          return {
            ...tier,
            billingCycle: cycle,
            tierId
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Calculate savings for yearly billing
 * @param {Object} tier - Pricing tier
 * @returns {Object} Savings information
 */
function calculateYearlySavings(tier) {
  const monthlyTotal = tier.priceMonthly * 12;
  const yearlySavings = monthlyTotal - tier.priceYearly;
  const savingsPercentage = Math.round((yearlySavings / monthlyTotal) * 100);
  
  return {
    savingsAmount: yearlySavings,
    savingsPercentage,
    monthlyEquivalent: tier.priceYearly / 12
  };
}

module.exports = {
  PRICING_TIERS,
  PROMOTIONAL_PRICING,
  FREE_TIER,
  getAllPricingTiers,
  getPricingTier,
  getStripePriceId,
  isPromotionActive,
  applyPromotionalPricing,
  getTierByStripePriceId,
  calculateYearlySavings
};