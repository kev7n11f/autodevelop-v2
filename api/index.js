// Vercel serverless function that proxies all requests to the main backend server
// This acts as a single entry point that routes to the full Express.js backend

const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');

// Import the main backend server
let app = null;

// Initialize the app lazily
async function getApp() {
  if (!app) {
    try {
      // Import the Express app from backend
      app = require('../backend/server.js');
    } catch (error) {
      console.error('Failed to import backend server:', error);
      throw error;
    }
  }
  return app;
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    console.log(`[Vercel Proxy] ${req.method} ${req.url}`);
    
    // Get the Express app
    const expressApp = await getApp();
    
    // Handle the request using Express
    expressApp(req, res);
  } catch (error) {
    console.error('Error in Vercel proxy function:', error);
    
    // Ensure response is properly handled
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method
      });
    }
  }
};