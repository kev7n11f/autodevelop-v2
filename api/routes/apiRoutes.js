const express = require('express');
const router = express.Router();

// Import routes from backend
const backendApiRoutes = require('../../backend/routes/apiRoutes');

// Mount all API routes
router.use('/', backendApiRoutes);

module.exports = router;
