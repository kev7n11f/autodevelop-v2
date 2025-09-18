const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const database = require('../utils/database');
const logger = require('../utils/logger');
const { hashPassword, verifyPassword, validatePassword, validateEmail } = require('../utils/password');

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
      googleId: user.google_id,
      // Add randomness to ensure unique tokens
      jti: crypto.randomBytes(16).toString('hex'),
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Create a cryptographically-random refresh token (opaque) to allow rotation
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  return { accessToken, refreshToken };
};

// Export helper for tests
exports.generateTokens = generateTokens;

/*
 * ARCHIVED GOOGLE OAUTH CALLBACK (for future restoration)
 * To re-enable Google OAuth:
 * 1. Uncomment this handler
 * 2. Uncomment the Google OAuth routes in authRoutes.js
 * 3. Uncomment the Google OAuth strategy in passport.js
 * 4. Update frontend to include Google login option
 */

/*
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

    // Persist the refresh token (opaque) so it can be revoked/rotated if needed
    await database.createUserSession({
      userId: user.id,
      sessionToken: null, // stateless: do not store access token
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update last login
    await database.updateUserLastLogin(user.id);

    // Set secure HTTP-only cookies. Use SameSite=None for cross-origin requests
    // when frontend and backend are on different domains. Ensure HTTPS in prod.
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    // Access token is a stateless JWT; refreshToken is stored server-side for rotation
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
*/

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
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });

    // Validate refresh token exists in DB (opaque token)
    const session = await database.getUserSession(refreshToken);
    if (!session) return res.status(401).json({ error: 'Invalid refresh token' });

    // Build user payload and issue new access token and rotated refresh token
    const user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      google_id: session.google_id
    };

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Persist rotated refresh token and remove old one
    await database.createUserSession({
      userId: user.id,
      sessionToken: null,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await database.deleteUserSession(refreshToken);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

// Custom authentication - Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input presence
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Email, password, and name are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate input types and basic format
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Invalid field types',
        details: 'Email, password, and name must be strings',
        code: 'INVALID_TYPES'
      });
    }

    // Trim and validate email format
    const trimmedEmail = email.trim().toLowerCase();
    if (!validateEmail(trimmedEmail)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        details: 'Please provide a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate name length and content
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({
        error: 'Invalid name length',
        details: 'Name must be between 2 and 100 characters',
        code: 'INVALID_NAME_LENGTH'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors,
        requirements: [
          'At least 8 characters long',
          'Contains uppercase letter',
          'Contains lowercase letter', 
          'Contains number',
          'Contains special character'
        ],
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if user already exists
    const existingUser = await database.getUserByEmail(trimmedEmail);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already registered',
        details: 'An account with this email already exists. Please sign in instead.',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user
    const userData = {
      email: trimmedEmail,
      password_hash: passwordHash,
      name: trimmedName,
      avatarUrl: null,
      locale: 'en',
      verifiedEmail: false
    };

    const user = await database.createUserWithPassword(userData);
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Calculate token expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Persist the opaque refresh token for rotation/revocation
    await database.createUserSession({
      userId: user.id,
      sessionToken: null,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update last login
    await database.updateUserLastLogin(user.id);

    // Set secure HTTP-only cookies with SameSite=None in production for cross-site
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    // Return user data (without password hash)
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        verifiedEmail: user.verifiedEmail,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    logger.error('Error in user registration:', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    });
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Custom authentication - Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input presence
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        details: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Validate input types
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Invalid credential types',
        details: 'Email and password must be strings',
        code: 'INVALID_TYPES'
      });
    }

    // Trim and normalize email
    const trimmedEmail = email.trim().toLowerCase();
    if (!validateEmail(trimmedEmail)) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Please check your email and password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Get user by email
    const user = await database.getUserByEmailForAuth(trimmedEmail);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'Please check your email and password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user has password (not OAuth user)
    if (!user.password_hash) {
      return res.status(401).json({ 
        error: 'Invalid login method',
        details: 'This account uses a different login method. Please try signing in with Google.',
        code: 'OAUTH_ACCOUNT'
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'Please check your email and password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
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

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    // Return user data (without password hash)
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        verifiedEmail: user.verified_email,
        lastLoginAt: user.last_login_at
      }
    });

  } catch (error) {
    logger.error('Error in user login:', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    });
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = exports;