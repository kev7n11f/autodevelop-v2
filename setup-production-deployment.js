#!/usr/bin/env node

/**
 * AutoDevelop.ai v2 Deployment Setup Script
 * Configures the project for production deployment with authentication
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 AutoDevelop.ai v2 - Deployment Setup');
console.log('Configuring for production with full authentication');
console.log('=' .repeat(60));

// Check current deployment configuration
function checkCurrentSetup() {
  console.log('\n🔍 Analyzing Current Setup...');
  
  const vercelJsonPath = 'vercel.json';
  const apiIndexPath = 'api/index.js';
  const backendServerPath = 'backend/server.js';
  
  const results = {
    hasVercelJson: fs.existsSync(vercelJsonPath),
    hasSimpleApi: fs.existsSync(apiIndexPath),
    hasFullBackend: fs.existsSync(backendServerPath),
    vercelConfig: null,
    deployment: 'unknown'
  };
  
  if (results.hasVercelJson) {
    try {
      results.vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    } catch (error) {
      console.log('❌ Error reading vercel.json:', error.message);
    }
  }
  
  // Determine deployment type
  if (results.hasSimpleApi && !results.vercelConfig?.rewrites?.some(r => r.source.includes('/api/(.*)'))) {
    results.deployment = 'simple-api';
  } else if (results.hasFullBackend) {
    results.deployment = 'full-backend';
  }
  
  return results;
}

// Create optimized vercel.json for full backend
function createFullBackendVercelConfig() {
  const config = {
    "version": 2,
    "buildCommand": "cd frontend && npm install && npm run build",
    "outputDirectory": "frontend/dist",
    "functions": {
      "api/index.js": {
        "runtime": "nodejs18.x",
        "memory": 512,
        "maxDuration": 30
      }
    },
    "rewrites": [
      {
        "source": "/api/(.*)",
        "destination": "/api/index.js"
      },
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/api/(.*)",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "*"
          },
          {
            "key": "Access-Control-Allow-Methods",
            "value": "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            "key": "Access-Control-Allow-Headers",
            "value": "Content-Type, Authorization"
          }
        ]
      }
    ]
  };
  
  return config;
}

// Create full backend API that includes authentication
function createFullBackendApi() {
  const apiContent = `// AutoDevelop.ai v2 - Full Backend API with Authentication
// This is the production-ready version with all features

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Import the full backend server
const backendApp = require('../backend/server');

// Create the API handler for Vercel
const app = express();

// Enhanced middleware for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.stripe.com"]
    }
  }
}));

app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Use the backend app for all API routes
app.use('/', backendApp);

// Health check specific to Vercel deployment
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    deployment: 'full-backend',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: {
      nodeEnv: process.env.NODE_ENV || 'production',
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSendGrid: !!process.env.SENDGRID_API_KEY,
      hasStripe: !!process.env.STRIPE_SECRET_KEY,
      hasJWT: !!process.env.JWT_SECRET,
      hasSession: !!process.env.SESSION_SECRET
    },
    features: {
      authentication: 'available',
      chat: process.env.OPENAI_API_KEY ? 'available' : 'disabled (no API key)',
      payments: process.env.STRIPE_SECRET_KEY ? 'available' : 'disabled (no API key)',
      email: process.env.SENDGRID_API_KEY ? 'available' : 'disabled (no API key)'
    }
  });
});

// Export for Vercel
module.exports = app;
`;
  
  return apiContent;
}

// Main setup function
function setupDeployment() {
  const setup = checkCurrentSetup();
  
  console.log('\n📊 Current Configuration:');
  console.log(`  • vercel.json: ${setup.hasVercelJson ? '✅' : '❌'}`);
  console.log(`  • Simple API: ${setup.hasSimpleApi ? '✅' : '❌'}`);
  console.log(`  • Full Backend: ${setup.hasFullBackend ? '✅' : '❌'}`);
  console.log(`  • Deployment Type: ${setup.deployment}`);
  
  if (setup.deployment === 'simple-api') {
    console.log('\n⚠️  Currently using simplified API without authentication');
    console.log('📝 Upgrading to full backend with authentication...');
    
    // Backup current API
    if (setup.hasSimpleApi) {
      const backupPath = 'api/index.simple.js';
      fs.copyFileSync('api/index.js', backupPath);
      console.log(`✅ Backed up simple API to ${backupPath}`);
    }
    
    // Create full backend API
    const fullApiContent = createFullBackendApi();
    fs.writeFileSync('api/index.js', fullApiContent);
    console.log('✅ Created full backend API');
    
    // Update vercel.json
    const vercelConfig = createFullBackendVercelConfig();
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    console.log('✅ Updated vercel.json configuration');
    
  } else if (setup.deployment === 'full-backend') {
    console.log('\n✅ Already configured for full backend deployment');
    
    // Verify vercel.json is optimal
    if (setup.vercelConfig) {
      const hasOptimalConfig = setup.vercelConfig.functions && 
                              setup.vercelConfig.headers;
      
      if (!hasOptimalConfig) {
        console.log('📝 Optimizing vercel.json configuration...');
        const vercelConfig = createFullBackendVercelConfig();
        fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
        console.log('✅ Updated vercel.json with optimal configuration');
      }
    }
  }
  
  // Ensure package.json scripts are optimized
  console.log('\n📦 Checking package.json scripts...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    let updated = false;
    
    // Ensure proper build command
    if (packageJson.scripts['vercel-build'] !== 'npm install && cd frontend && npm install && npm run build') {
      packageJson.scripts['vercel-build'] = 'npm install && cd frontend && npm install && npm run build';
      updated = true;
    }
    
    // Ensure proper start command for Vercel
    if (packageJson.scripts['start'] !== 'node api/index.js') {
      packageJson.scripts['start'] = 'node api/index.js';
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
      console.log('✅ Updated package.json scripts');
    } else {
      console.log('✅ package.json scripts are already optimal');
    }
  } catch (error) {
    console.log('❌ Error updating package.json:', error.message);
  }
  
  // Create .env.example if it doesn't exist or is incomplete
  console.log('\n📄 Checking .env.example...');
  
  const envExampleContent = `# ===================================
# AutoDevelop.ai v2 - Environment Variables
# ===================================

# ===== REQUIRED FOR PRODUCTION =====

# Authentication Secrets (REQUIRED)
JWT_SECRET=your-secure-jwt-secret-minimum-64-characters-recommended
SESSION_SECRET=your-secure-session-secret-change-in-production

# OpenAI API Key (required for AI chat functionality)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Stripe Configuration (required for payments)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_DEFAULT_PRICE_ID=price_your_default_price_id_here

# Production URLs (required)
FRONTEND_URL=https://yourdomain.com
STRIPE_SUCCESS_URL=https://yourdomain.com/success
STRIPE_CANCEL_URL=https://yourdomain.com/cancel
STRIPE_PORTAL_RETURN_URL=https://yourdomain.com/account

# ===== OPTIONAL CONFIGURATION =====

# Stripe Pricing Tiers (optional)
STRIPE_STARTER_PRICE_ID=price_starter_monthly_id
STRIPE_STARTER_YEARLY_PRICE_ID=price_starter_yearly_id
STRIPE_PRO_PRICE_ID=price_pro_monthly_id
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly_id
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_monthly_id
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_enterprise_yearly_id

# Email Service (optional but recommended)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# Admin Access (optional)
ADMIN_KEY=your-admin-secret-key

# Usage Limits (optional)
FREE_MESSAGE_LIMIT=5
FREE_MONTHLY_LIMIT=150

# Environment
NODE_ENV=production
PORT=8080`;

  fs.writeFileSync('.env.example', envExampleContent);
  console.log('✅ Created/updated .env.example');
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 DEPLOYMENT SETUP COMPLETE');
  console.log('-'.repeat(60));
  
  console.log('\n📋 Next Steps:');
  console.log('1. Set environment variables:');
  console.log('   node validate-environment.js');
  console.log('');
  console.log('2. Configure Vercel environment variables:');
  console.log('   vercel env add JWT_SECRET production');
  console.log('   vercel env add SESSION_SECRET production');
  console.log('   vercel env add STRIPE_SECRET_KEY production');
  console.log('   vercel env add STRIPE_WEBHOOK_SECRET production');
  console.log('   (see PRODUCTION_READY_CHECKLIST.md for complete list)');
  console.log('');
  console.log('3. Deploy to Vercel:');
  console.log('   vercel --prod');
  console.log('');
  console.log('4. Test the deployment:');
  console.log('   node test-production-ready.js https://your-domain.vercel.app');
  
  if (setup.deployment === 'simple-api') {
    console.log('\n✨ Upgrade Summary:');
    console.log('  • Upgraded from simple API to full backend');
    console.log('  • Authentication endpoints now available');
    console.log('  • Full user management functionality');
    console.log('  • Enhanced security and error handling');
    console.log('  • Previous simple API backed up as api/index.simple.js');
  }
  
  console.log('\n📚 Documentation:');
  console.log('  • PRODUCTION_READY_CHECKLIST.md - Complete deployment guide');
  console.log('  • validate-environment.js - Validate your configuration');
  console.log('  • test-production-ready.js - Test your deployment');
}

// Run the setup
setupDeployment();