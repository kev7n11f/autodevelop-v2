const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../../backend/utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

class JWTService {
  // Generate access token (short-lived)
  generateAccessToken(payload) {
    try {
      const tokenPayload = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex') // Unique token ID
      };

      return jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'autodevelop-v2',
        audience: 'autodevelop-v2-users'
      });
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  // Generate refresh token (long-lived, opaque)
  generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate both tokens
  generateTokens(user) {
    try {
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken();

      return {
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpirationTime()
      };
    } catch (error) {
      logger.error('Error generating tokens:', error);
      throw new Error('Failed to generate authentication tokens');
    }
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'autodevelop-v2',
        audience: 'autodevelop-v2-users'
      });

      return {
        valid: true,
        payload: decoded,
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          payload: null,
          expired: true,
          error: 'Token expired'
        };
      } else if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          payload: null,
          expired: false,
          error: 'Invalid token'
        };
      } else {
        logger.error('Error verifying access token:', error);
        return {
          valid: false,
          payload: null,
          expired: false,
          error: 'Token verification failed'
        };
      }
    }
  }

  // Extract token from request headers
  extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return authHeader;
  }

  // Get token expiration time in seconds
  getTokenExpirationTime() {
    const expiresIn = JWT_EXPIRES_IN;
    
    if (typeof expiresIn === 'string') {
      // Parse time strings like '15m', '1h', '7d'
      const timeValue = parseInt(expiresIn.slice(0, -1));
      const timeUnit = expiresIn.slice(-1);
      
      switch (timeUnit) {
        case 's': return timeValue;
        case 'm': return timeValue * 60;
        case 'h': return timeValue * 60 * 60;
        case 'd': return timeValue * 24 * 60 * 60;
        default: return 15 * 60; // Default 15 minutes
      }
    }
    
    return parseInt(expiresIn) || 15 * 60;
  }

  // Decode token without verification (for debugging)
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  // Check if token is expired without verification
  isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Generate password reset token
  generatePasswordResetToken(userId) {
    try {
      const payload = {
        userId,
        type: 'password_reset',
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '1h', // Password reset tokens expire in 1 hour
        issuer: 'autodevelop-v2',
        audience: 'autodevelop-v2-password-reset'
      });
    } catch (error) {
      logger.error('Error generating password reset token:', error);
      throw new Error('Failed to generate password reset token');
    }
  }

  // Verify password reset token
  verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'autodevelop-v2',
        audience: 'autodevelop-v2-password-reset'
      });

      if (decoded.type !== 'password_reset') {
        return { valid: false, error: 'Invalid token type' };
      }

      return {
        valid: true,
        userId: decoded.userId
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, error: 'Password reset token expired' };
      } else if (error.name === 'JsonWebTokenError') {
        return { valid: false, error: 'Invalid password reset token' };
      } else {
        logger.error('Error verifying password reset token:', error);
        return { valid: false, error: 'Token verification failed' };
      }
    }
  }
}

module.exports = new JWTService();