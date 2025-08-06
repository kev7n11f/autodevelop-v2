const router = require('express').Router();
const emailRoute = require('./emailRoute');
const { chat } = require('../controllers/botController');
const { 
  getSuspiciousActivity, 
  getSystemStatus, 
  resetUserUsageAdmin, 
  getUsageStatsAdmin, 
  getUserDiagnosticAdmin 
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
const authRoutes = require('./authRoutes');
router.use('/auth', authRoutes);

// Chat endpoint
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

  // Email endpoints
  router.use('/email', emailRoute);
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

=======
router.use('/email', emailRoute);
router.use('/email', emailRoute);
>>>>>>> 184e712 (Add inbound email webhook route)
module.exports = router;
