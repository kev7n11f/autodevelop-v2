const { v4: uuidv4 } = require('uuid');
const dynamodb = require('../utils/dynamodb');
const jwtService = require('../utils/jwt');
const passwordService = require('../utils/password');
const { validate, schemas } = require('../utils/validation');
const logger = require('../../backend/utils/logger');

// Helper to create lambda response
const createResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    ...headers
  },
  body: JSON.stringify(body)
});

// User registration
const register = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const { error, value } = schemas.register.validate(body);
    if (error) {
      return createResponse(400, {
        success: false,
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const { email, password, name } = value;

    // Check if user already exists
    const existingUser = await dynamodb.getUserByEmail(email);
    if (existingUser) {
      return createResponse(409, {
        success: false,
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await passwordService.hashPassword(password);

    // Create user
    const userId = uuidv4();
    const user = await dynamodb.createUser({
      id: userId,
      email,
      name,
      passwordHash,
      isVerified: false // In production, require email verification
    });

    // Generate tokens
    const tokens = jwtService.generateTokens(user);

    // Create session
    await dynamodb.createSession({
      sessionId: uuidv4(),
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ipAddress: event.requestContext?.identity?.sourceIp,
      userAgent: event.headers?.['User-Agent']
    });

    logger.info('User registered successfully', { userId: user.id, email });

    return createResponse(201, {
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      },
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    return createResponse(500, {
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
};

// User login
const login = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const { error, value } = schemas.login.validate(body);
    if (error) {
      return createResponse(400, {
        success: false,
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const { email, password } = value;

    // Get user by email
    const user = await dynamodb.getUserByEmail(email);
    if (!user) {
      return createResponse(401, {
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isPasswordValid = await passwordService.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return createResponse(401, {
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await dynamodb.updateUserLastLogin(user.id);

    // Generate tokens
    const tokens = jwtService.generateTokens(user);

    // Create session
    await dynamodb.createSession({
      sessionId: uuidv4(),
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ipAddress: event.requestContext?.identity?.sourceIp,
      userAgent: event.headers?.['User-Agent']
    });

    logger.info('User logged in successfully', { userId: user.id, email });

    return createResponse(200, {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      },
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    return createResponse(500, {
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
};

// Token refresh
const refreshToken = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { refreshToken } = body;

    if (!refreshToken) {
      return createResponse(400, {
        success: false,
        error: 'Refresh token required'
      });
    }

    // Find session by refresh token
    const session = await dynamodb.getSession(refreshToken);
    if (!session) {
      return createResponse(401, {
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Get user
    const user = await dynamodb.getUserById(session.userId);
    if (!user) {
      return createResponse(401, {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new tokens
    const tokens = jwtService.generateTokens(user);

    // Update session with new refresh token
    await dynamodb.deleteSession(session.sessionId);
    await dynamodb.createSession({
      sessionId: uuidv4(),
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ipAddress: event.requestContext?.identity?.sourceIp,
      userAgent: event.headers?.['User-Agent']
    });

    return createResponse(200, {
      success: true,
      message: 'Token refreshed successfully',
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    return createResponse(500, {
      success: false,
      error: 'Token refresh failed',
      details: error.message
    });
  }
};

// Logout
const logout = async (event) => {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      return createResponse(400, {
        success: false,
        error: 'Access token required'
      });
    }

    const verification = jwtService.verifyAccessToken(token);
    if (verification.valid) {
      // Delete all user sessions
      await dynamodb.deleteUserSessions(verification.payload.id);
    }

    return createResponse(200, {
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    return createResponse(500, {
      success: false,
      error: 'Logout failed',
      details: error.message
    });
  }
};

// Get current user status
const status = async (event) => {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      return createResponse(401, {
        success: false,
        error: 'Access token required'
      });
    }

    const verification = jwtService.verifyAccessToken(token);
    if (!verification.valid) {
      return createResponse(401, {
        success: false,
        error: verification.error,
        expired: verification.expired
      });
    }

    const user = await dynamodb.getUserById(verification.payload.id);
    if (!user) {
      return createResponse(401, {
        success: false,
        error: 'User not found'
      });
    }

    return createResponse(200, {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      },
      tokenInfo: {
        issued: new Date(verification.payload.iat * 1000).toISOString(),
        expires: new Date(verification.payload.exp * 1000).toISOString()
      }
    });

  } catch (error) {
    logger.error('Status check error:', error);
    return createResponse(500, {
      success: false,
      error: 'Status check failed',
      details: error.message
    });
  }
};

// Main handler
exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {}, {
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });
  }

  const path = event.path || event.pathParameters?.proxy || '';
  const method = event.httpMethod;

  try {
    // Route requests
    if (method === 'POST' && path.endsWith('/register')) {
      return await register(event);
    } else if (method === 'POST' && path.endsWith('/login')) {
      return await login(event);
    } else if (method === 'POST' && path.endsWith('/refresh')) {
      return await refreshToken(event);
    } else if (method === 'POST' && path.endsWith('/logout')) {
      return await logout(event);
    } else if (method === 'GET' && path.endsWith('/status')) {
      return await status(event);
    }

    return createResponse(404, {
      success: false,
      error: 'Endpoint not found',
      path,
      method
    });

  } catch (error) {
    logger.error('Auth handler error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};