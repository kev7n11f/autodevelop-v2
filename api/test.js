// Simple test API function for Vercel deployment debugging
module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Simple health check response
    res.status(200).json({
      status: 'ok',
      message: 'Vercel API function is working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      vercel: {
        region: process.env.VERCEL_REGION || 'unknown',
        deployment: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
      },
      environment: {
        node_version: process.version,
        env_vars_count: Object.keys(process.env).length
      }
    });
  } catch (error) {
    console.error('Test API Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
