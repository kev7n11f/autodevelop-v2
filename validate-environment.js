#!/usr/bin/env node

/**
 * Environment Validation Script for AutoDevelop.ai v2
 * Validates all required environment variables for production deployment
 */

const crypto = require('crypto');

console.log('🔍 AutoDevelop.ai v2 - Environment Validation');
console.log('=' .repeat(60));

// Required environment variables
const REQUIRED_VARS = {
  // Critical authentication
  JWT_SECRET: {
    required: true,
    description: 'JWT secret for token signing',
    validation: (val) => val && val.length >= 32,
    suggestion: 'Use: openssl rand -hex 32'
  },
  SESSION_SECRET: {
    required: true,
    description: 'Session secret for cookie encryption',
    validation: (val) => val && val.length >= 32,
    suggestion: 'Use: openssl rand -hex 32'
  },
  
  // Stripe configuration
  STRIPE_SECRET_KEY: {
    required: true,
    description: 'Stripe secret key for payment processing',
    validation: (val) => val && val.startsWith('sk_'),
    suggestion: 'Get from Stripe Dashboard > Developers > API Keys'
  },
  STRIPE_WEBHOOK_SECRET: {
    required: true,
    description: 'Stripe webhook secret for signature verification',
    validation: (val) => val && val.startsWith('whsec_'),
    suggestion: 'Get from Stripe Dashboard > Webhooks > Endpoint'
  },
  STRIPE_DEFAULT_PRICE_ID: {
    required: true,
    description: 'Default Stripe price ID for subscriptions',
    validation: (val) => val && val.startsWith('price_'),
    suggestion: 'Create product in Stripe Dashboard'
  },
  
  // URLs
  FRONTEND_URL: {
    required: true,
    description: 'Frontend URL for CORS and redirects',
    validation: (val) => val && val.startsWith('https://'),
    suggestion: 'Use your production domain (https://yourdomain.com)'
  },
  STRIPE_SUCCESS_URL: {
    required: true,
    description: 'Stripe checkout success redirect URL',
    validation: (val) => val && val.startsWith('https://'),
    suggestion: 'Usually: https://yourdomain.com/success'
  },
  STRIPE_CANCEL_URL: {
    required: true,
    description: 'Stripe checkout cancel redirect URL',
    validation: (val) => val && val.startsWith('https://'),
    suggestion: 'Usually: https://yourdomain.com/cancel'
  }
};

// Optional but recommended variables
const OPTIONAL_VARS = {
  OPENAI_API_KEY: {
    description: 'OpenAI API key for AI chat functionality',
    validation: (val) => val && val.startsWith('sk-'),
    suggestion: 'Get from OpenAI Platform > API Keys'
  },
  SENDGRID_API_KEY: {
    description: 'SendGrid API key for email notifications',
    validation: (val) => val && val.startsWith('SG.'),
    suggestion: 'Get from SendGrid Dashboard > Settings > API Keys'
  },
  STRIPE_PUBLISHABLE_KEY: {
    description: 'Stripe publishable key for frontend',
    validation: (val) => val && val.startsWith('pk_'),
    suggestion: 'Get from Stripe Dashboard > Developers > API Keys'
  },
  ADMIN_KEY: {
    description: 'Admin access key for administrative functions',
    validation: (val) => val && val.length >= 16,
    suggestion: 'Generate secure random string'
  }
};

// Validation results
let hasErrors = false;
let hasWarnings = false;
const missing = [];
const invalid = [];
const warnings = [];

console.log('\n🔧 Required Environment Variables:');
console.log('-'.repeat(40));

// Check required variables
for (const [varName, config] of Object.entries(REQUIRED_VARS)) {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  
  console.log(`${status} ${varName}: ${config.description}`);
  
  if (!value) {
    missing.push({ name: varName, ...config });
    hasErrors = true;
  } else if (!config.validation(value)) {
    invalid.push({ name: varName, value: value.substring(0, 10) + '...', ...config });
    hasErrors = true;
  }
}

console.log('\n🔧 Optional Environment Variables:');
console.log('-'.repeat(40));

// Check optional variables
for (const [varName, config] of Object.entries(OPTIONAL_VARS)) {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  
  console.log(`${status} ${varName}: ${config.description}`);
  
  if (!value) {
    warnings.push({ name: varName, ...config });
    hasWarnings = true;
  } else if (!config.validation(value)) {
    invalid.push({ name: varName, value: value.substring(0, 10) + '...', ...config });
    hasWarnings = true;
  }
}

// Generate missing secrets
console.log('\n🔐 Secret Generation:');
console.log('-'.repeat(40));

if (missing.some(v => ['JWT_SECRET', 'SESSION_SECRET'].includes(v.name))) {
  console.log('Generate secure secrets:');
  console.log(`JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`);
  console.log(`SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}`);
}

// Report issues
if (hasErrors) {
  console.log('\n❌ ERRORS - Must be fixed:');
  console.log('-'.repeat(40));
  
  missing.forEach(item => {
    console.log(`• Missing: ${item.name}`);
    console.log(`  Description: ${item.description}`);
    console.log(`  Suggestion: ${item.suggestion}\n`);
  });
  
  invalid.forEach(item => {
    console.log(`• Invalid: ${item.name} (${item.value})`);
    console.log(`  Description: ${item.description}`);
    console.log(`  Suggestion: ${item.suggestion}\n`);
  });
}

if (hasWarnings) {
  console.log('\n⚠️  WARNINGS - Recommended:');
  console.log('-'.repeat(40));
  
  warnings.forEach(item => {
    console.log(`• Missing: ${item.name}`);
    console.log(`  Description: ${item.description}`);
    console.log(`  Suggestion: ${item.suggestion}\n`);
  });
}

// Vercel commands
if (missing.length > 0 || invalid.length > 0) {
  console.log('\n🚀 Vercel Configuration Commands:');
  console.log('-'.repeat(40));
  console.log('# Set environment variables in Vercel:');
  
  [...missing, ...invalid].forEach(item => {
    console.log(`vercel env add ${item.name} production`);
  });
}

// Final status
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ VALIDATION FAILED - Fix errors before deployment');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  VALIDATION PASSED - Some optional features disabled');
  process.exit(0);
} else {
  console.log('✅ VALIDATION PASSED - Ready for production deployment!');
  process.exit(0);
}