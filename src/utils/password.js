const argon2 = require('argon2');
const crypto = require('crypto');
const logger = require('../../backend/utils/logger');

class PasswordService {
  constructor() {
    // Argon2 configuration for optimal security
    this.hashConfig = {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,         // 3 iterations
      parallelism: 1,      // 1 thread
      hashLength: 32       // 32 bytes output
    };
  }

  // Hash password using Argon2
  async hashPassword(password) {
    try {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const hash = await argon2.hash(password, this.hashConfig);
      return hash;
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  // Verify password against hash
  async verifyPassword(password, hash) {
    try {
      if (!password || !hash) {
        return false;
      }

      const isValid = await argon2.verify(hash, password);
      return isValid;
    } catch (error) {
      logger.error('Error verifying password:', error);
      return false;
    }
  }

  // Validate password strength
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return {
        valid: false,
        errors: ['Password must be a string']
      };
    }

    const errors = [];
    
    // Check minimum length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // Check maximum length (prevent DoS)
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common patterns
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain more than 2 consecutive identical characters');
    }

    return {
      valid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  // Calculate password strength score
  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety bonus
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    // Advanced patterns bonus
    if (/[^\w\s]/.test(password)) score += 1; // Non-alphanumeric
    if (password.length >= 20) score += 1;

    // Return strength level
    if (score >= 8) return 'very_strong';
    if (score >= 6) return 'strong';
    if (score >= 4) return 'medium';
    if (score >= 2) return 'weak';
    return 'very_weak';
  }

  // Generate secure random password
  generateSecurePassword(length = 16) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*(),.?":{}|<>';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';

    // Ensure at least one character from each category
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += symbols[crypto.randomInt(symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[crypto.randomInt(allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
  }

  // Generate password reset token
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash password reset token
  async hashResetToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = new PasswordService();