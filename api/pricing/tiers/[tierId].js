/**
 * Dynamic Pricing Tier API for Vercel Serverless
 * 
 * This endpoint handles requests for specific pricing tiers (e.g., /api/pricing/tiers/pro)
 * by using Vercel's dynamic routing with [tierId].js
 */

// Use the same logic as the main tiers endpoint but for specific tiers
const tiersHandler = require('../tiers.js');

// Vercel serverless function handler for [tierId].js
module.exports = (req, res) => {
  // Extract tierId from the URL
  const tierId = req.query.tierId;
  
  if (!tierId) {
    res.status(400).json({
      success: false,
      error: 'Tier ID is required'
    });
    return;
  }

  // Modify the request URL to include the tierId for processing
  req.url = `/api/pricing/tiers/${tierId}${req.url.includes('?') ? '&' + req.url.split('?')[1] : ''}`;
  
  // Use the same handler as the main tiers endpoint
  tiersHandler(req, res);
};