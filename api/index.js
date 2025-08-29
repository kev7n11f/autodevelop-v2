/**
 * Vercel Serverless API Handler
 * 
 * This file provides a comprehensive API handler for Vercel deployment
 * that supports all backend API routes including pricing, payments, etc.
 */

// Initialize environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Create Express app for serverless function
const app = express();

// Configure CORS for production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://autodevelop.ai',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));

// Parse JSON requests
app.use(express.json({ limit: '10mb' }));

// Handle OPTIONS requests for CORS
app.options('*', cors());

// Lazy-load backend routes to avoid database initialization issues
// Import routes only when needed to prevent serverless function failures
let backendApiRoutes = null;

function getBackendRoutes() {
  if (!backendApiRoutes) {
    try {
      backendApiRoutes = require('../backend/routes/apiRoutes');
    } catch (error) {
      console.error('Failed to load backend routes:', error.message);
      // Return a minimal router with error responses
      const router = require('express').Router();
      router.use('*', (req, res) => {
        res.status(500).json({
          error: 'Backend services temporarily unavailable',
          message: 'The API is experiencing initialization issues. Please try again later.',
          timestamp: new Date().toISOString()
        });
      });
      return router;
    }
  }
  return backendApiRoutes;
}

// Mount backend API routes with lazy loading
app.use('/', (req, res, next) => {
  const routes = getBackendRoutes();
  routes(req, res, next);
});

// Health check endpoint for root /api calls
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'AutoDevelop.ai API running ✅',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Handle 404 for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Export as Vercel serverless function
module.exports = app;