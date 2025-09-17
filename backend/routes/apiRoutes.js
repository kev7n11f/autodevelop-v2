const router = require('express').Router();
const express = require('express');
const emailRoute = require('./emailRoute');
const authRoutes = require('./authRoutes');

const { chat } = require('../controllers/botController');
const {
  getSuspiciousActivity,
  getSystemStatus,
  resetUserUsageAdmin,
  getUsageStatsAdmin,
  getUserDiagnosticAdmin,
  unblockUser
} = require('../controllers/adminController');

const {
  subscribe,
  confirmSubscription,
  unsubscribe,
  deleteUserData,
  getStats
} = require('../controllers/mailingListController');

const {
  createSubscription,
  processPaymentEvent,
  getSubscription,
  processPendingNotifications,
  checkUpcomingRenewals,
  createStripeCheckoutSession,
  createStripeCheckoutSessionWithTier,
  createBillingPortalSession,
  getPricingTiers,
  getPricingTierDetails
} = require('../controllers/paymentController');

// Authentication routes
router.use('/auth', authRoutes);

// Chat endpoint (OpenAI API)
router.post('/chat', chat);

// Mailing list endpoints
router.post('/mailing-list/subscribe', subscribe);
router.get('/mailing-list/confirm/:token', confirmSubscription);
router.get('/mailing-list/unsubscribe/:token', unsubscribe);
router.delete('/mailing-list/delete-data', deleteUserData);
router.get('/mailing-list/stats', getStats);

// Payment endpoints
router.post('/payments/subscription', createSubscription);
router.post('/payments/webhook', processPaymentEvent);
router.get('/payments/subscription/:userId', getSubscription);
router.post('/payments/process-notifications', processPendingNotifications);
router.post('/payments/check-renewals', checkUpcomingRenewals);

// Stripe payment endpoints
router.post('/payments/stripe/checkout', createStripeCheckoutSession);
router.post('/payments/stripe/checkout-tier', createStripeCheckoutSessionWithTier);
router.post('/payments/stripe/portal', createBillingPortalSession);
router.post('/payments/stripe/webhook', express.raw({ type: 'application/json' }), require('../controllers/paymentController').stripeWebhook);

// Pricing endpoints
router.get('/pricing/tiers', getPricingTiers);
router.get('/pricing/tiers/:tierId', getPricingTierDetails);

// Admin endpoints
router.get('/admin/suspicious-activity', getSuspiciousActivity);
router.post('/admin/unblock-user', unblockUser);
router.get('/admin/status', getSystemStatus);
router.post('/admin/usage/reset', resetUserUsageAdmin);
router.get('/admin/usage/stats', getUsageStatsAdmin);
router.get('/admin/diagnostic/:userId', getUserDiagnosticAdmin);

// Health check endpoint (public)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: {
      hasStripe: !!process.env.STRIPE_SECRET_KEY,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSendGrid: !!process.env.SENDGRID_API_KEY
    },
    services: {
      database: 'healthy' // We know DB is working if we get here
    }
  });
});

// Email endpoints
router.use('/email', emailRoute);

module.exports = router;
