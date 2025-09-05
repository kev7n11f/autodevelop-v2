#!/usr/bin/env node

/**
 * AutoDevelop.ai Environment Setup Helper
 * Helps users configure their development environment
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = '.env';
const ENV_DEV_FILE = '.env.dev';
const ENV_EXAMPLE_FILE = '.env.example';

console.log('🔧 AutoDevelop.ai Environment Setup Helper');
console.log('==========================================\n');

// Check if .env already exists
if (fs.existsSync(ENV_FILE)) {
  console.log('✅ Environment file (.env) already exists.');
  console.log('   If you want to reset it, delete .env and run this script again.\n');
} else {
  // Copy .env.dev to .env as starting point
  if (fs.existsSync(ENV_DEV_FILE)) {
    fs.copyFileSync(ENV_DEV_FILE, ENV_FILE);
    console.log('✅ Created .env file with development defaults from .env.dev\n');
  } else if (fs.existsSync(ENV_EXAMPLE_FILE)) {
    fs.copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE);
    console.log('✅ Created .env file from .env.example\n');
  } else {
    console.log('❌ No template file found (.env.dev or .env.example)');
    process.exit(1);
  }
}

// Check current environment status
console.log('🔍 Current Environment Status:');
console.log('==============================');

require('dotenv').config();

const services = [
  {
    name: 'Authentication',
    key: 'JWT_SECRET',
    status: process.env.JWT_SECRET ? '✅ Configured' : '⚠️  Using development default',
    required: false,
    note: 'Development default is fine for local testing'
  },
  {
    name: 'OpenAI Chat',
    key: 'OPENAI_API_KEY',
    status: process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured',
    required: true,
    note: 'Required for AI chat functionality',
    help: 'Get your key from https://platform.openai.com/api-keys'
  },
  {
    name: 'Stripe Payments',
    key: 'STRIPE_SECRET_KEY',
    status: process.env.STRIPE_SECRET_KEY ? '✅ Configured' : '❌ Not configured',
    required: false,
    note: 'Required for payment processing',
    help: 'Get your key from https://dashboard.stripe.com/apikeys'
  },
  {
    name: 'SendGrid Email',
    key: 'SENDGRID_API_KEY',
    status: process.env.SENDGRID_API_KEY ? '✅ Configured' : '❌ Not configured',
    required: false,
    note: 'Required for email notifications',
    help: 'Get your key from https://app.sendgrid.com/settings/api_keys'
  }
];

services.forEach(service => {
  console.log(`${service.status} ${service.name}`);
  console.log(`   ${service.note}`);
  if (service.help && !process.env[service.key]) {
    console.log(`   ${service.help}`);
  }
  console.log();
});

// Check what's working
const workingFeatures = services.filter(s => process.env[s.key] || !s.required).length;
const totalFeatures = services.length;

console.log('📊 Feature Status:');
console.log('==================');
console.log(`${workingFeatures}/${totalFeatures} features are available`);

if (workingFeatures === totalFeatures) {
  console.log('🎉 All features are configured and ready to use!');
} else {
  console.log('ℹ️  The system works without the missing API keys.');
  console.log('   Configure them to enable additional features.');
}

console.log('\n🚀 Next Steps:');
console.log('===============');
console.log('1. Start the backend server:');
console.log('   node backend/server.js');
console.log();
console.log('2. In another terminal, start the frontend:');
console.log('   cd frontend && npm run dev');
console.log();
console.log('3. Test the system:');
console.log('   node test-system.js');
console.log();
console.log('4. Visit http://localhost:5173 to use the app');
console.log();

if (workingFeatures < totalFeatures) {
  console.log('5. To configure missing services:');
  console.log('   - Edit .env file with your API keys');
  console.log('   - See GETTING_STARTED.md for detailed instructions');
  console.log();
}

console.log('📖 For more help, see:');
console.log('- GETTING_STARTED.md - Quick setup guide');
console.log('- ISSUE_RESOLUTION_SUMMARY.md - Previous fixes');
console.log('- .env.dev - Development defaults reference');