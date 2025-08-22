const database = require('../utils/database');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');
const { updateSubscriptionPeriodAfterPayment } = require('../utils/dateUtils');

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

module.exports = {
  createSubscription,
  processPaymentEvent,
  getSubscription,
  processPendingNotifications,
  checkUpcomingRenewals
};