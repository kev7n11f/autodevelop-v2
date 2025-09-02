/**
 * Minimal Test API for Vercel - No Dependencies
 * 
 * This is a basic test to see if Vercel serverless functions work at all
 */

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ 
      error: 'Method not allowed',
      method: req.method,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  try {
    // Basic pricing data inline
    const basicPricingData = {
      success: true,
      data: {
        tiers: {
          starter: {
            id: 'starter',
            name: 'Starter',
            priceMonthly: 9.99,
            priceYearly: 99.99,
            currency: 'USD'
          },
          pro: {
            id: 'pro', 
            name: 'Pro',
            priceMonthly: 19.99,
            priceYearly: 199.99,
            currency: 'USD',
            recommended: true
          },
          enterprise: {
            id: 'enterprise',
            name: 'Enterprise', 
            priceMonthly: 49.99,
            priceYearly: 499.99,
            currency: 'USD'
          }
        },
        freeTier: {
          id: 'free',
          name: 'Free',
          priceMonthly: 0,
          currency: 'USD'
        },
        hasActivePromotion: true
      },
      timestamp: new Date().toISOString(),
      version: 'minimal-test'
    };
    
    res.status(200).json(basicPricingData);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};