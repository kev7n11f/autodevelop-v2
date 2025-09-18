const stripeService = require('../utils/stripe');
const dynamodb = require('../utils/dynamodb');
const jwtService = require('../utils/jwt');
const { validate, schemas } = require('../utils/validation');
const logger = require('../../backend/utils/logger');

// Helper to create lambda response
const createResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    ...headers
  },
  body: JSON.stringify(body)
});

// Authenticate user from token
const authenticateUser = async (event) => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  const token = jwtService.extractTokenFromHeader(authHeader);

  if (!token) {
    throw new Error('Authentication required');
  }

  const verification = jwtService.verifyAccessToken(token);
  if (!verification.valid) {
    throw new Error(verification.error);
  }

  const user = await dynamodb.getUserById(verification.payload.id);
  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

// Create checkout session
const createCheckoutSession = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const { error, value } = schemas.stripeCheckout.validate(body);
    if (error) {
      return createResponse(400, {
        success: false,
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const { userId, email, name, tierId, billingCycle } = value;

    // Verify user exists and token is valid
    const user = await authenticateUser(event);
    if (user.id !== userId) {
      return createResponse(403, {
        success: false,
        error: 'Unauthorized access to user account'
      });
    }

    // Check if user already has active subscription
    const existingSubscription = await dynamodb.getSubscription(userId);
    if (existingSubscription && existingSubscription.status === 'active') {
      return createResponse(409, {
        success: false,
        error: 'User already has an active subscription',
        subscription: {
          planId: existingSubscription.planId,
          status: existingSubscription.status
        }
      });
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession({
      userId,
      email,
      name,
      tierId,
      billingCycle
    });

    logger.info('Checkout session created for user', { userId, tierId, sessionId: session.sessionId });

    return createResponse(200, {
      success: true,
      message: 'Checkout session created successfully',
      ...session
    });

  } catch (error) {
    logger.error('Create checkout session error:', error);
    
    if (error.message === 'Authentication required' || error.message.includes('Token')) {
      return createResponse(401, {
        success: false,
        error: 'Authentication required'
      });
    }

    return createResponse(500, {
      success: false,
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
};

// Get pricing tiers
const getPricingTiers = async (event) => {
  try {
    const tiers = stripeService.getPricingTiers();

    return createResponse(200, {
      success: true,
      tiers,
      meta: {
        timestamp: new Date().toISOString(),
        currency: 'USD',
        totalTiers: Object.keys(tiers).length
      }
    });

  } catch (error) {
    logger.error('Get pricing tiers error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to get pricing tiers',
      details: error.message
    });
  }
};

// Get specific pricing tier
const getPricingTier = async (event) => {
  try {
    const tierId = event.pathParameters?.tierId;
    
    if (!tierId) {
      return createResponse(400, {
        success: false,
        error: 'Tier ID required'
      });
    }

    const tier = stripeService.getPricingTier(tierId);
    if (!tier) {
      return createResponse(404, {
        success: false,
        error: 'Pricing tier not found',
        availableTiers: Object.keys(stripeService.getPricingTiers())
      });
    }

    return createResponse(200, {
      success: true,
      tier,
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get pricing tier error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to get pricing tier',
      details: error.message
    });
  }
};

// Get user subscription
const getUserSubscription = async (event) => {
  try {
    const user = await authenticateUser(event);
    
    const subscription = await dynamodb.getSubscription(user.id);
    if (!subscription) {
      return createResponse(404, {
        success: false,
        error: 'No subscription found'
      });
    }

    // Get additional details from Stripe if needed
    let stripeSubscription = null;
    if (subscription.stripeSubscriptionId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      } catch (stripeError) {
        logger.warn('Failed to fetch Stripe subscription details:', stripeError);
      }
    }

    return createResponse(200, {
      success: true,
      subscription: {
        ...subscription,
        nextBillingDate: stripeSubscription?.current_period_end ? 
          new Date(stripeSubscription.current_period_end * 1000).toISOString() : 
          subscription.currentPeriodEnd,
        cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end || subscription.cancelAtPeriodEnd
      }
    });

  } catch (error) {
    logger.error('Get user subscription error:', error);
    
    if (error.message === 'Authentication required' || error.message.includes('Token')) {
      return createResponse(401, {
        success: false,
        error: 'Authentication required'
      });
    }

    return createResponse(500, {
      success: false,
      error: 'Failed to get subscription',
      details: error.message
    });
  }
};

// Create billing portal session
const createBillingPortal = async (event) => {
  try {
    const user = await authenticateUser(event);
    
    const subscription = await dynamodb.getSubscription(user.id);
    if (!subscription || !subscription.stripeCustomerId) {
      return createResponse(404, {
        success: false,
        error: 'No subscription found'
      });
    }

    const body = JSON.parse(event.body || '{}');
    const returnUrl = body.returnUrl;

    const session = await stripeService.createBillingPortalSession(
      subscription.stripeCustomerId,
      returnUrl
    );

    return createResponse(200, {
      success: true,
      url: session.url
    });

  } catch (error) {
    logger.error('Create billing portal error:', error);
    
    if (error.message === 'Authentication required' || error.message.includes('Token')) {
      return createResponse(401, {
        success: false,
        error: 'Authentication required'
      });
    }

    return createResponse(500, {
      success: false,
      error: 'Failed to create billing portal session',
      details: error.message
    });
  }
};

// Main handler
exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {}, {
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });
  }

  const path = event.path || event.pathParameters?.proxy || '';
  const method = event.httpMethod;

  try {
    // Route requests
    if (method === 'POST' && path.includes('/checkout')) {
      return await createCheckoutSession(event);
    } else if (method === 'GET' && path.includes('/tiers') && event.pathParameters?.tierId) {
      return await getPricingTier(event);
    } else if (method === 'GET' && path.includes('/tiers')) {
      return await getPricingTiers(event);
    } else if (method === 'GET' && path.includes('/subscription')) {
      return await getUserSubscription(event);
    } else if (method === 'POST' && path.includes('/portal')) {
      return await createBillingPortal(event);
    }

    return createResponse(404, {
      success: false,
      error: 'Endpoint not found',
      path,
      method
    });

  } catch (error) {
    logger.error('Payments handler error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};