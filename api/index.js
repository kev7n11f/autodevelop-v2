// Vercel serverless function that proxies all requests to the main backend server
// This acts as a single entry point that routes to the full Express.js backend

const logger = require('../backend/utils/logger');

// Import the main backend server lazily
let app = null;
async function getApp() {
  if (!app) {
    try {
      app = require('../backend/server.js');
    } catch (error) {
      logger.error('Failed to import backend server', { error: error.message });
      throw error;
    }
  }
  return app;
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    logger.info('Vercel proxy accessed', { method: req.method, url: req.url });

    // Check for common configuration issues before trying to load the app
    const missingRequiredEnvVars = [];

    if (!process.env.JWT_SECRET) {
      missingRequiredEnvVars.push('JWT_SECRET');
    }

    if (!process.env.SESSION_SECRET) {
      missingRequiredEnvVars.push('SESSION_SECRET');
    }

    if (!process.env.OPENAI_API_KEY) {
      missingRequiredEnvVars.push('OPENAI_API_KEY');
    }

    // If critical environment variables are missing, return a helpful error
    if (missingRequiredEnvVars.length > 0) {
      logger.error('Missing required environment variables', { missing: missingRequiredEnvVars });

      if (!res.headersSent) {
        return res.status(500).json({
          error: 'Server configuration error',
          message: 'Missing required environment variables',
          missingVariables: missingRequiredEnvVars,
          timestamp: new Date().toISOString(),
          url: req.url,
          method: req.method,
          suggestions: [
            'Ensure all required environment variables are set in your deployment platform',
            'Check your .env file or deployment configuration',
            'Required variables: JWT_SECRET, SESSION_SECRET, OPENAI_API_KEY'
          ]
        });
      }
    }

    // Get the Express app
    const expressApp = await getApp();

    // Handle the request using Express
    expressApp(req, res);
  } catch (error) {
    logger.error('Error in Vercel proxy function', { error: error.message });

    // Provide more specific error information
    let errorDetails = {
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method
    };

    // Check for common error patterns
    if (error.message.includes('MODULE_NOT_FOUND')) {
      errorDetails.category = 'dependency_error';
      errorDetails.suggestions = [
        'Check if all dependencies are properly installed',
        'Verify the build process completed successfully',
        'Ensure package.json is configured correctly'
      ];
    } else if (error.message.includes('Cannot find module')) {
      errorDetails.category = 'module_error';
      errorDetails.suggestions = [
        'Check if the backend server file exists',
        'Verify the file path is correct',
        'Ensure the build process included all necessary files'
      ];
    } else if (error.message.includes('SQLITE') || error.message.includes('database')) {
      errorDetails.category = 'database_error';
      errorDetails.suggestions = [
        'Check database configuration',
        'Verify database file permissions',
        'Ensure the database directory exists'
      ];
    } else {
      errorDetails.category = 'unknown_error';
      errorDetails.suggestions = [
        'Check server logs for more details',
        'Verify all environment variables are set',
        'Contact support if the issue persists'
      ];
    }

    // Ensure response is properly handled
    if (!res.headersSent) {
      res.status(500).json(errorDetails);
    }
  }
};