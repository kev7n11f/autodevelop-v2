const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const dynamodb = require('../utils/dynamodb');
const logger = require('../../backend/utils/logger');

// Pricing tiers configuration
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
    stripeIds: {
      monthly: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_monthly',
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly'
    }
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
    stripeIds: {
      monthly: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly'
    }
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
      'Training & onboarding'
    ],
    stripeIds: {
      monthly: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
      yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly'
    }
  }
};

class StripeService {
  constructor() {
    this.stripe = stripe;
    this.pricingTiers = PRICING_TIERS;
  }

  // Create Stripe customer
  async createCustomer(userData) {
    try {
      const customer = await this.stripe.customers.create({
        email: userData.email,
        name: userData.name,
        metadata: {
          userId: userData.userId,
          source: 'autodevelop-v2'
        }
      });

      logger.info('Stripe customer created', { 
        customerId: customer.id, 
        userId: userData.userId 
      });

      return customer;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  // Create checkout session
  async createCheckoutSession(sessionData) {
    try {
      const { userId, email, name, tierId, billingCycle = 'monthly' } = sessionData;

      // Validate pricing tier
      const tier = this.pricingTiers[tierId];
      if (!tier) {
        throw new Error(`Invalid pricing tier: ${tierId}`);
      }

      // Get Stripe price ID
      const priceId = tier.stripeIds[billingCycle];
      if (!priceId) {
        throw new Error(`Price not configured for tier ${tierId} and billing cycle ${billingCycle}`);
      }

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: email,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        success_url: `${process.env.FRONTEND_URL || 'https://autodevelop-v2.vercel.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://autodevelop-v2.vercel.app'}/cancel`,
        metadata: {
          userId,
          name,
          tierId,
          billingCycle
        },
        subscription_data: {
          metadata: {
            userId,
            name,
            tierId,
            billingCycle
          }
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_creation: 'always',
        payment_method_collection: 'always'
      });

      logger.info('Checkout session created', {
        sessionId: session.id,
        userId,
        tierId,
        billingCycle
      });

      return {
        sessionId: session.id,
        url: session.url,
        tier: {
          id: tier.id,
          name: tier.name,
          price: billingCycle === 'yearly' ? tier.priceYearly : tier.priceMonthly,
          billingCycle
        }
      };
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Handle successful checkout
  async handleCheckoutCompleted(session) {
    try {
      const { userId, tierId, billingCycle } = session.metadata;

      if (!userId || !tierId) {
        throw new Error('Missing metadata in checkout session');
      }

      // Retrieve subscription details
      const subscription = await this.stripe.subscriptions.retrieve(session.subscription);
      const customer = await this.stripe.customers.retrieve(session.customer);

      // Save subscription to database
      await dynamodb.createSubscription({
        userId,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        planId: tierId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        billingCycle: billingCycle || 'monthly',
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        metadata: {
          checkoutSessionId: session.id,
          priceId: subscription.items.data[0]?.price?.id
        }
      });

      logger.info('Subscription created successfully', {
        userId,
        subscriptionId: subscription.id,
        customerId: customer.id,
        tierId
      });

      return { success: true, subscriptionId: subscription.id };
    } catch (error) {
      logger.error('Error handling checkout completion:', error);
      throw error;
    }
  }

  // Handle subscription update
  async handleSubscriptionUpdate(subscription) {
    try {
      // Find subscription in database
      const dbSubscription = await dynamodb.getSubscriptionByCustomerId(subscription.customer);
      
      if (!dbSubscription) {
        logger.warn('Subscription not found in database', { 
          subscriptionId: subscription.id,
          customerId: subscription.customer 
        });
        return;
      }

      // Update subscription status
      await dynamodb.updateSubscription(dbSubscription.userId, {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });

      logger.info('Subscription updated', {
        userId: dbSubscription.userId,
        subscriptionId: subscription.id,
        status: subscription.status
      });

      return { success: true };
    } catch (error) {
      logger.error('Error handling subscription update:', error);
      throw error;
    }
  }

  // Handle invoice payment
  async handleInvoicePayment(invoice) {
    try {
      if (invoice.subscription) {
        const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
        await this.handleSubscriptionUpdate(subscription);
      }

      logger.info('Invoice payment processed', {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        amountPaid: invoice.amount_paid
      });

      return { success: true };
    } catch (error) {
      logger.error('Error handling invoice payment:', error);
      throw error;
    }
  }

  // Create billing portal session
  async createBillingPortalSession(customerId, returnUrl) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || `${process.env.FRONTEND_URL || 'https://autodevelop-v2.vercel.app'}/account`
      });

      return { url: session.url };
    } catch (error) {
      logger.error('Error creating billing portal session:', error);
      throw error;
    }
  }

  // Get customer subscription
  async getCustomerSubscription(customerId) {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 1
      });

      return subscriptions.data[0] || null;
    } catch (error) {
      logger.error('Error getting customer subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd
      });

      logger.info('Subscription cancellation scheduled', {
        subscriptionId,
        cancelAtPeriodEnd
      });

      return subscription;
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Get pricing tiers
  getPricingTiers() {
    return this.pricingTiers;
  }

  // Get specific pricing tier
  getPricingTier(tierId) {
    return this.pricingTiers[tierId] || null;
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature, secret) {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, secret);
      return { valid: true, event };
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      return { valid: false, error: error.message };
    }
  }
}

module.exports = new StripeService();