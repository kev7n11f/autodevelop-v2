const router = require('express').Router();
const { chat } = require('../controllers/botController');
const { getSuspiciousActivity, unblockUser, getSystemStatus } = require('../controllers/adminController');
const { 
  subscribe, 
  confirmSubscription, 
  unsubscribe, 
  deleteUserData, 
  getStats 
} = require('../controllers/mailingListController');

// Chat endpoint
router.post('/chat', chat);

// Mailing list endpoints
router.post('/mailing-list/subscribe', subscribe);
router.get('/mailing-list/confirm/:token', confirmSubscription);
router.get('/mailing-list/unsubscribe/:token', unsubscribe);
router.delete('/mailing-list/delete-data', deleteUserData);
router.get('/mailing-list/stats', getStats);

// Admin endpoints for monitoring and management
router.get('/admin/suspicious-activity', getSuspiciousActivity);
router.post('/admin/unblock-user', unblockUser);
router.get('/admin/status', getSystemStatus);

module.exports = router;
