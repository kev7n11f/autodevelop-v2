const logger = require('../utils/logger');
const { getSuspiciousActivity, unblockUser } = require('../utils/abuseMonitor');
const crypto = require('crypto');
const database = require('../utils/database');

// Simple admin authentication (in production, use proper authentication)
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  const expectedKey = process.env.ADMIN_KEY;

  // Both keys must be present and strings
  if (typeof adminKey !== 'string' || typeof expectedKey !== 'string' || adminKey !== expectedKey) {
    logger.warn('Unauthorized admin access attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      providedKey: adminKey ? 'present' : 'missing'
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Get suspicious activity report
exports.getSuspiciousActivity = [adminAuth, (req, res) => {
  try {
    const activity = getSuspiciousActivity();
    
    logger.info('Suspicious activity report requested', {
      ip: req.ip,
      adminUser: 'admin'
    });
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: activity
    });
  } catch (error) {
    logger.error('Error generating suspicious activity report', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Failed to generate report',
      message: 'Please try again or check server logs'
    });
  }
}];

// Unblock a user
exports.unblockUser = [adminAuth, (req, res) => {
  try {
    const { clientId } = req.body;
    
    if (!clientId) {
      return res.status(400).json({
        error: 'Client ID is required',
        hint: 'Provide the IP address or client identifier to unblock'
      });
    }
    
    const unblocked = unblockUser(clientId);
    
    if (unblocked) {
      logger.info('User unblocked by admin', {
        clientId,
        adminIp: req.ip
      });
      
      res.json({
        success: true,
        message: `User ${clientId} has been unblocked`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        error: 'User not found in blocked list',
        message: `No blocked user found with ID: ${clientId}`
      });
    }
  } catch (error) {
    logger.error('Error unblocking user', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Failed to unblock user',
      message: 'Please try again or check server logs'
    });
  }
}];

// Get system status and metrics
exports.getSystemStatus = [adminAuth, async (req, res) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const usageStats = await database.getUsageStats();
    
    const status = {
      system: {
        uptime: uptime,
        uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024)
        },
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid
      },
      usage: usageStats,
      security: getSuspiciousActivity(),
      timestamp: new Date().toISOString()
    };
    
    logger.info('System status requested', {
      ip: req.ip,
      adminUser: 'admin'
    });
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error generating system status', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Failed to generate system status',
      message: 'Please try again or check server logs'
    });
  }
}];

// Reset user usage (daily / monthly / all)
exports.resetUserUsageAdmin = [adminAuth, async (req, res) => {
  try {
    const { userId, scope = 'daily' } = req.body;
    
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (!['daily','monthly','all'].includes(scope)) return res.status(400).json({ error: 'Invalid scope' });
    
    await database.resetUserUsage(userId, scope === 'all' ? 'all' : scope);
    await database.logUsageEvent({ userId, eventType: 'usage_reset', ip: req.ip, source: 'admin', meta: { scope } });
    
    res.json({ success: true, message: `Usage reset (${scope}) for ${userId}` });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reset usage', details: e.message });
  }
}];

// Admin usage stats
exports.getUsageStatsAdmin = [adminAuth, async (req, res) => {
  try {
    const stats = await database.getUsageStats();
    
    res.json({ success: true, stats });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get stats', details: e.message });
  }
}];

// Diagnostic endpoint per user
exports.getUserDiagnosticAdmin = [adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) return res.status(400).json({ error: 'userId required' });
    
    const diag = await database.getUserDiagnostic(userId);
    await database.logUsageEvent({ userId, eventType: 'diagnostic_access', ip: req.ip, source: 'admin' });
    
    res.json({ success: true, diagnostic: diag });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch diagnostic', details: e.message });
  }
}];