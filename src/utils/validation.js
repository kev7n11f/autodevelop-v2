const Joi = require('joi');

// Common validation schemas
const schemas = {
  // User registration
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must be less than 50 characters',
        'any.required': 'Name is required'
      })
  }),

  // User login
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Token refresh
  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required'
      })
  }),

  // Stripe checkout
  stripeCheckout: Joi.object({
    userId: Joi.string()
      .required()
      .messages({
        'any.required': 'User ID is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must be less than 50 characters',
        'any.required': 'Name is required'
      }),
    tierId: Joi.string()
      .valid('starter', 'pro', 'enterprise')
      .required()
      .messages({
        'any.only': 'Tier ID must be one of: starter, pro, enterprise',
        'any.required': 'Tier ID is required'
      }),
    billingCycle: Joi.string()
      .valid('monthly', 'yearly')
      .default('monthly')
      .messages({
        'any.only': 'Billing cycle must be monthly or yearly'
      })
  }),

  // Chat message
  chatMessage: Joi.object({
    message: Joi.string()
      .min(1)
      .max(2000)
      .trim()
      .required()
      .messages({
        'string.min': 'Message cannot be empty',
        'string.max': 'Message must be less than 2000 characters',
        'any.required': 'Message is required'
      })
  }),

  // User ID parameter
  userId: Joi.string()
    .required()
    .messages({
      'any.required': 'User ID is required'
    })
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = property === 'params' ? req.params : 
                 property === 'query' ? req.query : 
                 req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorDetails,
        code: 'VALIDATION_ERROR'
      });
    }

    // Replace the original data with validated/sanitized data
    if (property === 'params') {
      req.params = value;
    } else if (property === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};

// Custom validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
  return password.length >= 8 && passwordRegex.test(password);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input.trim()
    .replace(/[<>\"'%;&\(\)]/g, ''); // Basic XSS prevention
};

const validateStripeWebhookSignature = (payload, signature, secret) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return { valid: true, event };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

module.exports = {
  schemas,
  validate,
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateStripeWebhookSignature
};