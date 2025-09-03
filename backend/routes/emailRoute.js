const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Accept JSON or form-encoded bodies via express.json / express.urlencoded middleware
router.post('/inbound-email', (req, res) => {
  const emailData = req.body || {};
  // Use structured logger instead of console.log for consistent log format
  logger.info('Inbound email received', { route: '/inbound-email', emailData });

  // TODO: Add logic to store, forward, or trigger workflows
  res.status(200).send('OK');
});

module.exports = router;
