const router = require('express').Router();
const { chat } = require('../controllers/botController');
const { getSuspiciousActivity, unblockUser, getSystemStatus } = require('../controllers/adminController');

// Chat endpoint
router.post('/chat', chat);

// Admin endpoints for monitoring and management
router.get('/admin/suspicious-activity', getSuspiciousActivity);
router.post('/admin/unblock-user', unblockUser);
router.get('/admin/status', getSystemStatus);

module.exports = router;
