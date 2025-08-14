const logger = require('./logger');

// In-memory storage for tracking requests (in production, use Redis or database)
const requestTracking = new Map();
const blockedUsers = new Map();
const suspiciousPatterns = new Map();

// Configuration for abuse detection
const ABUSE_CONFIG = {
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 100,
  suspiciousKeywords: ['hack', 'exploit', 'attack', 'bypass', 'injection'],
  maxMessageLength: 2000,
  blockDurationMinutes: 30
};

// Clean up old tracking data periodically
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  // Clean request tracking
  for (const [key, data] of requestTracking.entries()) {
    data.requests = data.requests.filter(time => time > oneHourAgo);
    if (data.requests.length === 0) {
      requestTracking.delete(key);
    }
  }
  
  // Clean expired blocks
  for (const [ip, blockData] of blockedUsers.entries()) {
    if (now > blockData.expiresAt) {
      blockedUsers.delete(ip);
      logger.info('Unblocked user', { ip, reason: 'block_expired' });
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

function getClientIdentifier(req) {
  return req.ip || req.connection.remoteAddress || 'unknown';
}

function trackRequest(req, message) {
  const clientId = getClientIdentifier(req);
  const now = Date.now();
  
  if (!requestTracking.has(clientId)) {
    requestTracking.set(clientId, { requests: [], messages: [] });
  }
  
  const tracking = requestTracking.get(clientId);
  tracking.requests.push(now);
  tracking.messages.push({ text: message, timestamp: now });
  
  // Keep only last 100 messages per client
  if (tracking.messages.length > 100) {
    tracking.messages = tracking.messages.slice(-100);
  }
  
  logger.info('Request tracked', {
    clientId,
    requestCount: tracking.requests.length,
    messageLength: message ? message.length : 0
  });
}

function detectAbuse(req, message) {
  const clientId = getClientIdentifier(req);
  const now = Date.now();
  const oneMinuteAgo = now - (60 * 1000);
  const oneHourAgo = now - (60 * 60 * 1000);
  
  // Check if already blocked
  if (blockedUsers.has(clientId)) {
    const blockData = blockedUsers.get(clientId);
    if (now < blockData.expiresAt) {
      logger.warn('Blocked user attempted request', { clientId, reason: blockData.reason });
      return { blocked: true, reason: blockData.reason, expiresAt: blockData.expiresAt };
    }
  }
  
  const tracking = requestTracking.get(clientId);
  if (!tracking) return { blocked: false };
  
  // Rate limiting checks
  const recentRequests = tracking.requests.filter(time => time > oneMinuteAgo);
  const hourlyRequests = tracking.requests.filter(time => time > oneHourAgo);
  
  if (recentRequests.length > ABUSE_CONFIG.maxRequestsPerMinute) {
    return blockUser(clientId, 'rate_limit_minute', 'Too many requests per minute');
  }
  
  if (hourlyRequests.length > ABUSE_CONFIG.maxRequestsPerHour) {
    return blockUser(clientId, 'rate_limit_hour', 'Too many requests per hour');
  }
  
  // Message content checks
  if (message) {
    // Check message length
    if (message.length > ABUSE_CONFIG.maxMessageLength) {
      return blockUser(clientId, 'message_too_long', 'Message exceeds maximum length');
    }
    
    // Check for suspicious keywords
    const lowerMessage = message.toLowerCase();
    const foundSuspiciousKeywords = ABUSE_CONFIG.suspiciousKeywords.filter(keyword => 
      lowerMessage.includes(keyword)
    );
    
    if (foundSuspiciousKeywords.length > 0) {
      logger.warn('Suspicious message detected', {
        clientId,
        keywords: foundSuspiciousKeywords,
        messagePreview: message.substring(0, 100)
      });
      
      // Track suspicious patterns
      if (!suspiciousPatterns.has(clientId)) {
        suspiciousPatterns.set(clientId, []);
      }
      suspiciousPatterns.get(clientId).push({
        keywords: foundSuspiciousKeywords,
        timestamp: now,
        messagePreview: message.substring(0, 100)
      });
      
      // Block after multiple suspicious messages
      if (suspiciousPatterns.get(clientId).length >= 3) {
        return blockUser(clientId, 'suspicious_content', 'Multiple suspicious messages');
      }
    }
    
    // Check for repeated identical messages (spam)
    const recentMessages = tracking.messages.filter(m => m.timestamp > oneMinuteAgo);
    const identicalMessages = recentMessages.filter(m => m.text === message);
    if (identicalMessages.length > 3) {
      return blockUser(clientId, 'spam', 'Repeated identical messages');
    }
  }
  
  return { blocked: false };
}

function blockUser(clientId, reason, description) {
  const expiresAt = Date.now() + (ABUSE_CONFIG.blockDurationMinutes * 60 * 1000);
  
  blockedUsers.set(clientId, {
    reason,
    description,
    blockedAt: Date.now(),
    expiresAt
  });
  
  logger.warn('User blocked', {
    clientId,
    reason,
    description,
    expiresAt: new Date(expiresAt).toISOString()
  });
  
  return { blocked: true, reason, description, expiresAt };
}

function getSuspiciousActivity() {
  const activity = {
    blockedUsers: Array.from(blockedUsers.entries()).map(([ip, data]) => ({
      ip,
      ...data,
      blockedAt: new Date(data.blockedAt).toISOString(),
      expiresAt: new Date(data.expiresAt).toISOString()
    })),
    suspiciousPatterns: Array.from(suspiciousPatterns.entries()).map(([ip, patterns]) => ({
      ip,
      patterns: patterns.map(p => ({
        ...p,
        timestamp: new Date(p.timestamp).toISOString()
      }))
    })),
    activeUsers: requestTracking.size,
    totalRequests: Array.from(requestTracking.values())
      .reduce((total, data) => total + data.requests.length, 0)
  };
  
  return activity;
}

function unblockUser(clientId) {
  if (blockedUsers.has(clientId)) {
    blockedUsers.delete(clientId);
    logger.info('User manually unblocked', { clientId });
    return true;
  }
  return false;
}

module.exports = {
  trackRequest,
  detectAbuse,
  blockUser,
  unblockUser,
  getSuspiciousActivity,
  getClientIdentifier
};