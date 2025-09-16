/**
 * Environment Variable Validation Utility
 * Ensures all required environment variables are set for production deployment
 */

const logger = require('./logger');

// Define required environment variables for different environments
const REQUIRED_ENV_VARS = {
  // Always required
  CORE: [
    'JWT_SECRET',
    'SESSION_SECRET'
  ],
  
  // Required for Stripe payments
  STRIPE: [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_STARTER_PRICE_ID',
    'STRIPE_PRO_PRICE_ID',
    'STRIPE_ENTERPRISE_PRICE_ID',
    'STRIPE_SUCCESS_URL',
    'STRIPE_CANCEL_URL',
    'STRIPE_PORTAL_RETURN_URL'
  ],
  
  // Required for AI functionality
  AI: [
    'OPENAI_API_KEY'
  ],
  
  // Required for frontend integration
  FRONTEND: [
    'FRONTEND_URL'
  ],
  
  // Optional but recommended
  OPTIONAL: [
    'SENDGRID_API_KEY',
    'FROM_EMAIL',
    'ADMIN_KEY'
  ]
};

/**
 * Check if environment variable value appears to be a demo/placeholder value
 */
function isDemoValue(value) {
  if (!value) return true;
  
  const demoIndicators = [
    'demo',
    'test',
    'placeholder',
    'replace-with',
    'your-key-here',
    'example',
    'change-me',
    'set-your'
  ];
  
  const lowerValue = value.toLowerCase();
  return demoIndicators.some(indicator => lowerValue.includes(indicator));
}

/**
 * Validate environment variables
 * @param {string} environment - Environment type ('development', 'production', etc.)
 * @param {boolean} strict - Whether to fail on missing optional variables
 * @returns {Object} Validation result
 */
function validateEnvironmentVariables(environment = 'production', strict = false) {
  const missing = [];
  const warnings = [];
  const present = [];
  const demoValues = [];
  
  // Check core variables (always required)
  REQUIRED_ENV_VARS.CORE.forEach(varName => {
    if (!process.env[varName]) {
      missing.push({ name: varName, category: 'CORE', required: true });
    } else if (environment === 'production' && isDemoValue(process.env[varName])) {
      demoValues.push({ name: varName, category: 'CORE', value: 'appears to be demo/placeholder value' });
    } else {
      present.push({ name: varName, category: 'CORE' });
    }
  });
  
  // Check Stripe variables (required for payments)
  REQUIRED_ENV_VARS.STRIPE.forEach(varName => {
    if (!process.env[varName]) {
      missing.push({ name: varName, category: 'STRIPE', required: true });
    } else if (environment === 'production' && isDemoValue(process.env[varName])) {
      demoValues.push({ name: varName, category: 'STRIPE', value: 'appears to be demo/placeholder value' });
    } else {
      present.push({ name: varName, category: 'STRIPE' });
    }
  });
  
  // Check AI variables (required for chat functionality)
  REQUIRED_ENV_VARS.AI.forEach(varName => {
    if (!process.env[varName]) {
      missing.push({ name: varName, category: 'AI', required: true });
    } else if (environment === 'production' && isDemoValue(process.env[varName])) {
      demoValues.push({ name: varName, category: 'AI', value: 'appears to be demo/placeholder value' });
    } else {
      present.push({ name: varName, category: 'AI' });
    }
  });
  
  // Check frontend variables (required for proper redirects)
  REQUIRED_ENV_VARS.FRONTEND.forEach(varName => {
    if (!process.env[varName]) {
      missing.push({ name: varName, category: 'FRONTEND', required: true });
    } else if (environment === 'production' && isDemoValue(process.env[varName])) {
      demoValues.push({ name: varName, category: 'FRONTEND', value: 'appears to be demo/placeholder value' });
    } else {
      present.push({ name: varName, category: 'FRONTEND' });
    }
  });
  
  // Check optional variables
  REQUIRED_ENV_VARS.OPTIONAL.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push({ name: varName, category: 'OPTIONAL', required: false });
    } else {
      present.push({ name: varName, category: 'OPTIONAL' });
    }
  });
  
  // Validate JWT and Session secrets have minimum length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push({
      name: 'JWT_SECRET',
      category: 'SECURITY',
      message: 'JWT_SECRET should be at least 32 characters long for security'
    });
  }
  
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    warnings.push({
      name: 'SESSION_SECRET',
      category: 'SECURITY',
      message: 'SESSION_SECRET should be at least 32 characters long for security'
    });
  }
  
  // Validate URL formats
  const urlVars = ['FRONTEND_URL', 'STRIPE_SUCCESS_URL', 'STRIPE_CANCEL_URL', 'STRIPE_PORTAL_RETURN_URL'];
  urlVars.forEach(varName => {
    if (process.env[varName] && !isDemoValue(process.env[varName])) {
      try {
        new URL(process.env[varName]);
      } catch (error) {
        warnings.push({
          name: varName,
          category: 'URL_FORMAT',
          message: `${varName} is not a valid URL format`
        });
      }
    }
  });
  
  // In development, treat demo values as valid
  const effectiveMissing = environment === 'development' ? missing : [...missing, ...demoValues];
  
  return {
    isValid: effectiveMissing.length === 0,
    missing: effectiveMissing,
    warnings,
    present,
    demoValues,
    environment,
    summary: {
      total: Object.values(REQUIRED_ENV_VARS).flat().length,
      present: present.length,
      missing: effectiveMissing.length,
      warnings: warnings.length,
      demoValues: demoValues.length
    }
  };
}

/**
 * Log environment validation results
 * @param {Object} validation - Validation result from validateEnvironmentVariables
 */
function logValidationResults(validation) {
  const { isValid, missing, warnings, present, summary } = validation;
  
  if (isValid) {
    logger.info('✅ Environment validation passed', {
      summary,
      environment: validation.environment
    });
  } else {
    logger.error('❌ Environment validation failed', {
      summary,
      missing: missing.map(v => v.name),
      environment: validation.environment
    });
  }
  
  // Log missing variables by category
  if (missing.length > 0) {
    const byCategory = {};
    missing.forEach(item => {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push(item.name);
    });
    
    logger.error('Missing required environment variables:', byCategory);
  }
  
  // Log warnings
  if (warnings.length > 0) {
    const warningMessages = warnings.map(w => w.message || `${w.name} is missing (optional)`);
    logger.warn('Environment warnings:', warningMessages);
  }
  
  return validation;
}

/**
 * Get setup instructions for missing variables
 * @param {Array} missing - Array of missing variables
 * @returns {Object} Setup instructions
 */
function getSetupInstructions(missing) {
  const instructions = {
    stripe: [],
    auth: [],
    ai: [],
    frontend: [],
    general: []
  };
  
  missing.forEach(item => {
    switch (item.category) {
      case 'STRIPE':
        if (item.name.includes('PRICE_ID')) {
          instructions.stripe.push(
            `${item.name}: Create a product in Stripe Dashboard and copy the Price ID`
          );
        } else if (item.name.includes('URL')) {
          instructions.stripe.push(
            `${item.name}: Set to your domain (e.g., https://yourdomain.vercel.app${item.name.includes('SUCCESS') ? '/success' : item.name.includes('CANCEL') ? '/cancel' : '/account'})`
          );
        } else {
          instructions.stripe.push(
            `${item.name}: Copy from Stripe Dashboard > Developers > API Keys`
          );
        }
        break;
        
      case 'CORE':
        instructions.auth.push(
          `${item.name}: Generate a secure random string (minimum 32 characters)`
        );
        break;
        
      case 'AI':
        instructions.ai.push(
          `${item.name}: Copy from OpenAI Dashboard > API Keys`
        );
        break;
        
      case 'FRONTEND':
        instructions.frontend.push(
          `${item.name}: Set to your deployed domain (e.g., https://yourdomain.vercel.app)`
        );
        break;
        
      default:
        instructions.general.push(
          `${item.name}: See documentation for setup instructions`
        );
    }
  });
  
  return instructions;
}

/**
 * Check if application is ready for production
 * @returns {Object} Readiness check result
 */
function checkProductionReadiness() {
  const validation = validateEnvironmentVariables('production', true);
  const instructions = validation.missing.length > 0 ? getSetupInstructions(validation.missing) : null;
  
  return {
    ...validation,
    ready: validation.isValid && validation.warnings.length === 0,
    instructions
  };
}

module.exports = {
  validateEnvironmentVariables,
  logValidationResults,
  getSetupInstructions,
  checkProductionReadiness,
  REQUIRED_ENV_VARS
};