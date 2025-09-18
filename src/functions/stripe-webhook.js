const stripeService = require('../utils/stripe');
const logger = require('../../backend/utils/logger');

// Helper to create lambda response
const createResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    ...headers
  },
  body: JSON.stringify(body)
});

// Handle webhook events
const handleWebhookEvent = async (event) => {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Only handle subscription checkouts
        if (session.mode === 'subscription') {
          await stripeService.handleCheckoutCompleted(session);
          logger.info('Checkout session completed processed', { sessionId: session.id });
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        await stripeService.handleInvoicePayment(invoice);
        logger.info('Invoice payment succeeded processed', { invoiceId: invoice.id });
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        await stripeService.handleSubscriptionUpdate(updatedSubscription);
        logger.info('Subscription updated processed', { subscriptionId: updatedSubscription.id });
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await stripeService.handleSubscriptionUpdate(deletedSubscription);
        logger.info('Subscription deleted processed', { subscriptionId: deletedSubscription.id });
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        logger.warn('Invoice payment failed', {
          invoiceId: failedInvoice.id,
          customerId: failedInvoice.customer,
          attemptCount: failedInvoice.attempt_count
        });
        // Could add logic here to notify user or update subscription status
        break;

      case 'customer.subscription.trial_will_end':
        const trialSubscription = event.data.object;
        logger.info('Trial ending soon', {
          subscriptionId: trialSubscription.id,
          customerId: trialSubscription.customer,
          trialEnd: new Date(trialSubscription.trial_end * 1000).toISOString()
        });
        // Could add logic here to notify user about trial ending
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type, id: event.id });
    }

    return { success: true, eventType: event.type };
  } catch (error) {
    logger.error('Error handling webhook event:', error);
    throw error;
  }
};

// Main webhook handler
exports.handler = async (event) => {
  try {
    // Get webhook signature
    const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      return createResponse(500, {
        error: 'Webhook secret not configured'
      });
    }

    if (!signature) {
      logger.error('Missing Stripe signature header');
      return createResponse(400, {
        error: 'Missing Stripe signature'
      });
    }

    // Get raw body
    const body = event.body;
    if (!body) {
      logger.error('Missing request body');
      return createResponse(400, {
        error: 'Missing request body'
      });
    }

    // Verify webhook signature
    const verification = stripeService.verifyWebhookSignature(
      body,
      signature,
      webhookSecret
    );

    if (!verification.valid) {
      logger.error('Invalid webhook signature', { error: verification.error });
      return createResponse(400, {
        error: 'Invalid signature'
      });
    }

    const stripeEvent = verification.event;
    
    logger.info('Processing Stripe webhook', {
      eventId: stripeEvent.id,
      eventType: stripeEvent.type,
      created: new Date(stripeEvent.created * 1000).toISOString()
    });

    // Handle the event
    const result = await handleWebhookEvent(stripeEvent);

    return createResponse(200, {
      received: true,
      eventId: stripeEvent.id,
      eventType: stripeEvent.type,
      processed: result.success
    });

  } catch (error) {
    logger.error('Webhook handler error:', error);
    
    // Return 500 to trigger Stripe retry
    return createResponse(500, {
      error: 'Webhook processing failed',
      details: error.message
    });
  }
};