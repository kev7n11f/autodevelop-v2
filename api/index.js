// Completely standalone pricing API - no external dependencies
// This function doesn't require any project dependencies and should work in any Node.js environment

module.exports = function(req, res) {
  // Set CORS headers
  res.setHeader('Content-Type', 'application/json');
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
      method: req.method 
    });
    return;
  }
  
  try {
    // Parse URL manually
    var url = req.url || '';
    var parts = url.split('?');
    var pathname = parts[0];
    var queryString = parts[1] || '';
    var query = {};
    
    // Parse query parameters
    if (queryString) {
      var pairs = queryString.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        var key = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1] || '');
        query[key] = value;
      }
    }
    
    // Static pricing data
    var PRICING_TIERS = {
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
        recommended: false,
        popular: false
      }
    };
    
    var FREE_TIER = {
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
    
    // Handle root endpoint
    if (pathname === '/' || pathname === '') {
      res.status(200).json({
        status: 'healthy',
        message: 'AutoDevelop.ai API running ✅',
        timestamp: new Date().toISOString(),
        version: '2.0.0-standalone'
      });
      return;
    }
    
    // Handle pricing tiers
    if (pathname === '/pricing/tiers') {
      var includePromo = query.promo === 'true';
      var tiers = PRICING_TIERS;
      
      // Apply promotional pricing if requested
      if (includePromo) {
        var promoTiers = {};
        for (var tierId in tiers) {
          promoTiers[tierId] = JSON.parse(JSON.stringify(tiers[tierId])); // Deep copy
          if (tierId === 'starter') {
            promoTiers[tierId].originalPriceMonthly = promoTiers[tierId].priceMonthly;
            promoTiers[tierId].priceMonthly = 7.99;
            promoTiers[tierId].isPromotional = true;
          } else if (tierId === 'pro') {
            promoTiers[tierId].originalPriceMonthly = promoTiers[tierId].priceMonthly;
            promoTiers[tierId].priceMonthly = 14.99;
            promoTiers[tierId].isPromotional = true;
          } else if (tierId === 'enterprise') {
            promoTiers[tierId].originalPriceMonthly = promoTiers[tierId].priceMonthly;
            promoTiers[tierId].priceMonthly = 39.99;
            promoTiers[tierId].isPromotional = true;
          }
        }
        tiers = promoTiers;
      }
      
      res.status(200).json({
        success: true,
        data: {
          tiers: tiers,
          freeTier: FREE_TIER,
          hasActivePromotion: true
        }
      });
      return;
    }
    
    // Handle specific pricing tier
    var tierMatch = pathname.match(/^\/pricing\/tiers\/(.+)$/);
    if (tierMatch) {
      var tierId = tierMatch[1].toLowerCase();
      var tier = PRICING_TIERS[tierId];
      
      if (!tier) {
        res.status(404).json({
          success: false,
          error: 'Pricing tier not found'
        });
        return;
      }
      
      // Apply promotional pricing if requested
      if (query.promo === 'true') {
        tier = JSON.parse(JSON.stringify(tier)); // Deep copy
        if (tierId === 'starter') {
          tier.originalPriceMonthly = tier.priceMonthly;
          tier.priceMonthly = 7.99;
          tier.isPromotional = true;
        } else if (tierId === 'pro') {
          tier.originalPriceMonthly = tier.priceMonthly;
          tier.priceMonthly = 14.99;
          tier.isPromotional = true;
        } else if (tierId === 'enterprise') {
          tier.originalPriceMonthly = tier.priceMonthly;
          tier.priceMonthly = 39.99;
          tier.isPromotional = true;
        }
      }
      
      res.status(200).json({
        success: true,
        data: tier
      });
      return;
    }
    
    // 404 for unknown routes
    res.status(404).json({
      error: 'API endpoint not found',
      path: pathname,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};