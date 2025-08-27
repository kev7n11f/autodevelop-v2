const database = require('../utils/database');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');
const { updateSubscriptionPeriodAfterPayment } = require('../utils/dateUtils');
const { 
  getAllPricingTiers, 
  getPricingTier, 
  getStripePriceId, 
  getTierByStripePriceId,
  isPromotionActive,
  FREE_TIER
} = require('../config/pricing');

// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  logger.info('Stripe client initialized successfully');
} else {
  logger.warn('Stripe API key not configured. Payment functionality will be limited.');
}

// Input validation helpers
const validatePaymentData = (data) => {
  const { userId, email, amount, planType } = data;
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email address');
  }
  
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount');
  }
  
  if (!planType || !['basic', 'pro', 'enterprise'].includes(planType)) {
    throw new Error('Invalid plan type');
  }
};

// Create or update subscription
const createSubscription = async (req, res) => {
  try {
    const subscriptionData = req.body;
    validatePaymentData(subscriptionData);
    
    // Add subscription to database
    const subscription = await database.addPaymentSubscription(subscriptionData);
    
    logger.info(`Subscription created for user: ${subscriptionData.userId}`);
    
    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status
      }
    });
  } catch (error) {
    logger.error('Error creating subscription:', error);
    
    res.status(400).json({
      error: 'Failed to create subscription',
      details: error.message
    });
  }
};

// Process payment webhook/event
const processPaymentEvent = async (req, res) => {
  try {
    const { 
      userId, 
      subscriptionId, 
      eventType, 
      amount, 
      currency = 'USD',
      paymentMethod,
      transactionId,
      failureReason,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!userId || !eventType) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'userId and eventType are required'
      });
    }

    if (!['payment_success', 'payment_failed', 'renewal_upcoming', 'subscription_cancelled', 'trial_ending'].includes(eventType)) {
      return res.status(400).json({
        error: 'Invalid event type',
        details: 'eventType must be one of: payment_success, payment_failed, renewal_upcoming, subscription_cancelled, trial_ending'
      });
    }

    // Add event to database
    const event = await database.addPaymentEvent({
      userId,
      subscriptionId,
      eventType,
      amount,
      currency,
      paymentMethod,
      transactionId,
      failureReason,
      metadata
    });

    // Get subscription and user info for email
    const subscription = await database.getPaymentSubscription(userId);
    
    // For successful payments, update the subscription billing dates
    if (subscription && eventType === 'payment_success') {
      logger.info(`Updating subscription billing dates for user: ${userId}`);
      const updatedDates = updateSubscriptionPeriodAfterPayment(subscription);
      logger.info(`New billing dates calculated:`, updatedDates);
      
      await database.updatePaymentSubscriptionByUserId(userId, updatedDates);
      
      // Get the updated subscription for email notification
      const updatedSubscription = await database.getPaymentSubscription(userId);
      logger.info(`Updated subscription next billing date: ${updatedSubscription.next_billing_date}`);
      
      // Send appropriate notification email with updated subscription data
      if (updatedSubscription && updatedSubscription.email) {
        await sendPaymentNotification(event, updatedSubscription);
        await database.markNotificationSent(event.id);
      }
    } else {
      // Send appropriate notification email for non-payment-success events
      if (subscription && subscription.email) {
        await sendPaymentNotification(event, subscription);
        await database.markNotificationSent(event.id);
      }
    }

    logger.info(`Payment event processed: ${eventType} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Payment event processed successfully',
      eventId: event.id
    });
  } catch (error) {
    logger.error('Error processing payment event:', error);
    
    res.status(500).json({
      error: 'Failed to process payment event',
      details: error.message
    });
  }
};

// Helper function to send payment notifications
const sendPaymentNotification = async (event, subscription) => {
  const { email, name, plan_type: planType } = subscription;
  
  try {
    switch (event.eventType) {
      case 'payment_success':
        await emailService.sendPaymentSuccessEmail(email, name, {
          amount: event.amount,
          currency: event.currency,
          planType: planType,
          transactionId: event.transactionId,
          nextBillingDate: subscription.next_billing_date
        });
        break;
        
      case 'payment_failed':
        await emailService.sendPaymentFailedEmail(email, name, {
          amount: event.amount,
          currency: event.currency,
          planType: planType,
          failureReason: event.failureReason
        });
        break;
        
      case 'renewal_upcoming':
        const renewalDate = new Date(subscription.next_billing_date);
        const today = new Date();
        const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
        
        await emailService.sendRenewalReminderEmail(email, name, {
          amount: subscription.amount,
          currency: subscription.currency,
          planType: planType,
          renewalDate: subscription.next_billing_date,
          daysUntilRenewal: daysUntilRenewal
        });
        break;
        
      default:
        logger.warn(`No email template for event type: ${event.eventType}`);
    }
  } catch (error) {
    logger.error('Error sending payment notification email:', error);
    throw error;
  }
};

// Get user subscription details
const getSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }
    
    const subscription = await database.getPaymentSubscription(userId);
    
    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        details: 'No active subscription found for this user'
      });
    }
    
    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        planType: subscription.plan_type,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        nextBillingDate: subscription.next_billing_date,
        amount: subscription.amount,
        currency: subscription.currency
      }
    });
  } catch (error) {
    logger.error('Error getting subscription:', error);
    
    res.status(500).json({
      error: 'Failed to get subscription',
      details: error.message
    });
  }
};

// Process pending notifications (for scheduled jobs)
const processPendingNotifications = async (req, res) => {
  try {
    const pendingNotifications = await database.getPendingNotifications();
    
    let processed = 0;
    let failed = 0;
    
    for (const notification of pendingNotifications) {
      try {
        await sendPaymentNotification(notification, {
          email: notification.email,
          name: notification.name,
          plan_type: notification.plan_type
        });
        
        await database.markNotificationSent(notification.id);
        processed++;
      } catch (error) {
        logger.error(`Failed to send notification ${notification.id}:`, error);
        failed++;
      }
    }
    
    logger.info(`Processed pending notifications: ${processed} sent, ${failed} failed`);
    
    res.json({
      success: true,
      message: `Processed ${processed} notifications, ${failed} failed`,
      processed,
      failed
    });
  } catch (error) {
    logger.error('Error processing pending notifications:', error);
    
    res.status(500).json({
      error: 'Failed to process pending notifications',
      details: error.message
    });
  }
};

// Check for upcoming renewals and send reminders
const checkUpcomingRenewals = async (req, res) => {
  try {
    const upcomingRenewals = await database.getUpcomingRenewals(3); // 3 days ahead
    
    let remindersSent = 0;
    
    for (const subscription of upcomingRenewals) {
      try {
        // Create renewal reminder event
        await database.addPaymentEvent({
          userId: subscription.user_id,
          subscriptionId: subscription.id,
          eventType: 'renewal_upcoming',
          amount: subscription.amount,
          currency: subscription.currency
        });
        
        remindersSent++;
      } catch (error) {
        logger.error(`Failed to create renewal reminder for subscription ${subscription.id}:`, error);
      }
    }
    
    logger.info(`Created ${remindersSent} renewal reminder events`);
    
    res.json({
      success: true,
      message: `Created ${remindersSent} renewal reminders`,
      remindersSent
    });
  } catch (error) {
    logger.error('Error checking upcoming renewals:', error);
    
    res.status(500).json({
      error: 'Failed to check upcoming renewals',
      details: error.message
    });
  }
};

// Create Stripe Checkout Session for subscription
const createStripeCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe not configured',
        message: 'Payment processing is not available in this environment' 
      });
    }

    const { userId, email, name, priceId } = req.body;
    if (!userId || !email || !name) {
      return res.status(400).json({ error: 'userId, email, name required' });
    }
    if (!priceId && !process.env.STRIPE_DEFAULT_PRICE_ID) {
      return res.status(400).json({ error: 'priceId or STRIPE_DEFAULT_PRICE_ID required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId || process.env.STRIPE_DEFAULT_PRICE_ID,
          quantity: 1
        }
      ],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId, planType: 'pro' }
      },
      metadata: { userId },
      success_url: (process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/success') + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/cancel'
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    logger.error('Error creating Stripe Checkout session', { error: err.message });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

// Customer portal session
const createBillingPortalSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe not configured',
        message: 'Billing portal is not available in this environment' 
      });
    }

    const { customerId, returnUrl } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId required' });

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || process.env.STRIPE_PORTAL_RETURN_URL || 'http://localhost:5173/account'
    });
    res.json({ url: portal.url });
  } catch (err) {
    logger.error('Error creating billing portal session', { error: err.message });
    res.status(500).json({ error: 'Failed to create portal session' });
  }
};

// Stripe webhook handler (raw body route) with idempotency persistence
const stripeWebhook = async (req, res) => {
  if (!stripe) {
    logger.warn('Stripe webhook received but Stripe not configured');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body); // insecure fallback only for local dev
    }
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const stripeEventId = event.id;

  try {
    // Persist raw event for idempotency / replay
    await database.saveStripeEvent(stripeEventId, event.type, event);
    const existing = await database.getStripeEventById(stripeEventId);
    if (existing && existing.status === 'processed') {
      logger.info('Stripe event already processed (idempotent)', { stripeEventId, type: event.type });
      return res.json({ received: true, idempotent: true });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const line = subscription.items.data[0];
          const price = line.price;
          const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
          const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          
          // Determine plan type from tier metadata or price ID
          let planType = 'pro'; // default fallback
          const tierInfo = getTierByStripePriceId(price.id);
          if (tierInfo) {
            planType = tierInfo.tierId;
          } else if (session.metadata?.tierId) {
            planType = session.metadata.tierId;
          }
          
          await database.addPaymentSubscription({
            userId: session.metadata.userId,
            email: session.customer_details?.email || session.customer_email,
            name: session.metadata.name || 'Subscriber',
            planType: planType,
            status: subscription.cancel_at_period_end ? 'active' : 'active',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            nextBillingDate: periodEnd,
            amount: (price.unit_amount || 0) / 100,
            currency: price.currency?.toUpperCase() || 'USD',
            paymentMethod: subscription.default_payment_method || null,
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
            stripe_price_id: price.id,
            stripe_product_id: price.product,
            plan_interval: price.recurring?.interval,
            cancel_at_period_end: subscription.cancel_at_period_end
          });
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        await database.updatePaymentSubscriptionByUserId(subscription.metadata.userId || 'unknown', {
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: periodEnd,
          next_billing_date: periodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end
        });
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const statusMap = { active: 'active', trialing: 'trial', past_due: 'active', canceled: 'cancelled', unpaid: 'expired' };
        await database.updatePaymentSubscriptionByUserId(sub.metadata.userId || 'unknown', {
          status: statusMap[sub.status] || 'active',
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            next_billing_date: new Date(sub.current_period_end * 1000).toISOString()
        });
        break;
      }
      default:
        logger.debug(`Unhandled Stripe event type ${event.type}`);
    }

    await database.markStripeEventProcessed(stripeEventId, 'processed');
    res.json({ received: true });
  } catch (err) {
    logger.error('Error handling Stripe webhook event', { error: err.message, type: event.type, id: stripeEventId });
    await database.markStripeEventProcessed(stripeEventId, 'error', err.message);
    res.status(500).send('Webhook handler failed');
  }
};

// Get all available pricing tiers
const getPricingTiers = async (req, res) => {
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
    logger.error('Error fetching pricing tiers', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing tiers',
      details: error.message
    });
  }
};

// Get specific pricing tier details
const getPricingTierDetails = async (req, res) => {
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
    logger.error('Error fetching pricing tier details', { error: error.message, tierId: req.params.tierId });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing tier details',
      details: error.message
    });
  }
};

// Enhanced Stripe Checkout Session creation with tier support
const createStripeCheckoutSessionWithTier = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe not configured',
        message: 'Payment processing is not available in this environment' 
      });
    }

    const { userId, email, name, tierId, billingCycle = 'monthly', priceId } = req.body;
    
    // Validate required fields
    if (!userId || !email || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'userId, email, and name are required' 
      });
    }

    let finalPriceId = priceId;
    let selectedTier = null;

    // If tierId is provided, get the corresponding Stripe price ID
    if (tierId) {
      selectedTier = getPricingTier(tierId, true); // Include promotional pricing
      if (!selectedTier) {
        return res.status(400).json({ 
          error: 'Invalid tier',
          details: `Pricing tier '${tierId}' not found` 
        });
      }
      
      finalPriceId = getStripePriceId(tierId, billingCycle);
      if (!finalPriceId) {
        return res.status(400).json({ 
          error: 'Invalid billing cycle',
          details: `Billing cycle '${billingCycle}' not available for tier '${tierId}'` 
        });
      }
    }

    // Fallback to default price ID if none provided
    if (!finalPriceId) {
      finalPriceId = process.env.STRIPE_DEFAULT_PRICE_ID;
      if (!finalPriceId) {
        return res.status(400).json({ 
          error: 'No price ID available',
          details: 'No priceId, tierId, or STRIPE_DEFAULT_PRICE_ID configured' 
        });
      }
    }

    // Create Stripe checkout session
    const sessionParams = {
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: finalPriceId,
          quantity: 1
        }
      ],
      success_url: (process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/success') + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/cancel',
      metadata: {
        userId,
        name,
        tierId: tierId || 'default',
        billingCycle: billingCycle || 'monthly'
      },
      subscription_data: {
        metadata: {
          userId,
          name,
          tierId: tierId || 'default',
          billingCycle: billingCycle || 'monthly'
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required'
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    
    logger.info('Stripe checkout session created', { 
      sessionId: session.id, 
      userId, 
      tierId: tierId || 'default',
      billingCycle,
      priceId: finalPriceId 
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      tier: selectedTier ? {
        id: selectedTier.id,
        name: selectedTier.name,
        price: billingCycle === 'yearly' ? selectedTier.priceYearly : selectedTier.priceMonthly,
        billingCycle
      } : null
    });
  } catch (error) {
    logger.error('Error creating Stripe checkout session', { 
      error: error.message, 
      userId: req.body.userId,
      tierId: req.body.tierId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
};

module.exports = {
  createSubscription,
  processPaymentEvent,
  getSubscription,
  processPendingNotifications,
  checkUpcomingRenewals,
  createStripeCheckoutSession,
  createStripeCheckoutSessionWithTier,
  createBillingPortalSession,
  stripeWebhook,
  getPricingTiers,
  getPricingTierDetails
};