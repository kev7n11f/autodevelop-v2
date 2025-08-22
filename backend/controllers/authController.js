const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const database = require('../utils/database');
const logger = require('../utils/logger');

// JWT secret from environment or generate a random one
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token for user
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      googleId: user.google_id 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  return { accessToken, refreshToken };
};

// Google OAuth callback handler
exports.googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      logger.warn('Google OAuth callback without user data', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }

    const user = req.user;
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Calculate token expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Create user session
    await database.createUserSession({
      userId: user.id,
      sessionToken: accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update last login
    await database.updateUserLastLogin(user.id);

    // Set secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    logger.info('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    // Redirect to dashboard or home page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?auth=success`);
  } catch (error) {
    logger.error('Error in Google OAuth callback:', {
      error: error.message,
      stack: error.stack
    });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`);
  }
};

// Get current user info
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatarUrl: req.user.avatar_url,
      locale: req.user.locale,
      verifiedEmail: req.user.verified_email,
      createdAt: req.user.created_at,
      lastLoginAt: req.user.last_login_at
    };

    res.json({ user });
  } catch (error) {
    logger.error('Error getting current user:', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    
    if (accessToken) {
      // Delete session from database
      await database.deleteUserSession(accessToken);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    logger.info('User logged out', {
      userId: req.user?.id,
      ip: req.ip
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Error during logout:', {
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Refresh token endpoint
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Get session by refresh token
    const session = await database.getUserSession(refreshToken);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      google_id: session.google_id
    };
    
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    // Update session
    await database.createUserSession({
      userId: user.id,
      sessionToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Delete old session
    await database.deleteUserSession(refreshToken);

    // Set new cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    };

    res.cookie('accessToken', newAccessToken, cookieOptions);
    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    logger.error('Error refreshing token:', {
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Clean up expired sessions (can be called by a cron job)
exports.cleanupExpiredSessions = async (req, res) => {
  try {
    const deletedCount = await database.deleteExpiredSessions();
    
    logger.info('Expired sessions cleanup completed', { deletedCount });
    
    res.json({ 
      message: 'Cleanup completed successfully',
      deletedSessions: deletedCount 
    });
  } catch (error) {
    logger.error('Error during session cleanup:', {
      error: error.message
    });
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = exports;