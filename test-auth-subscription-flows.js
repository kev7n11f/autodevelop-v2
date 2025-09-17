#!/usr/bin/env node

/**
 * Authentication & Subscription Flow Test Script
 * Tests all critical functionality for AutoDevelop.ai v2
 */

const https = require('https');
const http = require('http');

// Test configuration
const CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  TEST_USER: {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!@#',
    name: 'Test User'
  }
};

// ANSI colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

/**
 * Make HTTP request
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedBody,
            rawBody: body
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: { error: 'Failed to parse JSON response' },
            rawBody: body
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(CONFIG.TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Parse URL and create request options
 */
function createRequestOptions(url, method = 'GET', headers = {}) {
  const urlObj = new URL(url);
  return {
    protocol: urlObj.protocol,
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AutoDevelop-TestScript/1.0',
      ...headers
    }
  };
}

/**
 * Log test result
 */
function logResult(testName, passed, message = '', details = null) {
  const status = passed ? 'PASS' : 'FAIL';
  const color = passed ? colors.green : colors.red;
  
  console.log(`${color}[${status}]${colors.reset} ${testName}`);
  if (message) {
    console.log(`      ${message}`);
  }
  if (details && !passed) {
    console.log(`      Details: ${JSON.stringify(details, null, 2)}`);
  }
  
  results.details.push({ testName, passed, message, details });
  if (passed) results.passed++;
  else results.failed++;
  
  console.log(''); // Empty line for readability
}

/**
 * Test API health check
 */
async function testHealthCheck() {
  try {
    const options = createRequestOptions(`${CONFIG.BASE_URL}/health`);
    const response = await makeRequest(options);
    
    const passed = response.status === 200 && response.body.status;
    logResult(
      'Health Check',
      passed,
      passed ? `Server is ${response.body.status}` : 'Server health check failed',
      !passed ? response.body : null
    );
    
    // Log environment validation if available
    if (response.body.environmentValidation) {
      const envValid = response.body.environmentValidation.isValid;
      logResult(
        'Environment Validation',
        envValid,
        envValid ? 'All required environment variables are set' : 
                  `Missing ${response.body.environmentValidation.missing} variables: ${response.body.environmentValidation.missingVariables?.join(', ')}`,
        !envValid ? response.body.environmentValidation : null
      );
    }
    
    return passed;
  } catch (error) {
    logResult('Health Check', false, 'Failed to connect to server', error.message);
    return false;
  }
}

/**
 * Test user registration
 */
async function testUserRegistration() {
  try {
    const options = createRequestOptions(`${CONFIG.BASE_URL}/api/auth/register`, 'POST');
    const response = await makeRequest(options, CONFIG.TEST_USER);
    
    const passed = response.status === 201 && response.body.success;
    logResult(
      'User Registration',
      passed,
      passed ? `User registered successfully: ${response.body.user?.email}` : 
               `Registration failed: ${response.body.error}`,
      !passed ? response.body : null
    );
    
    return passed ? response : null;
  } catch (error) {
    logResult('User Registration', false, 'Request failed', error.message);
    return null;
  }
}

/**
 * Test user login
 */
async function testUserLogin() {
  try {
    const loginData = {
      email: CONFIG.TEST_USER.email,
      password: CONFIG.TEST_USER.password
    };
    
    const options = createRequestOptions(`${CONFIG.BASE_URL}/api/auth/login`, 'POST');
    const response = await makeRequest(options, loginData);
    
    const passed = response.status === 200 && response.body.success;
    logResult(
      'User Login',
      passed,
      passed ? `Login successful: ${response.body.user?.email}` : 
               `Login failed: ${response.body.error}`,
      !passed ? response.body : null
    );
    
    return passed ? response : null;
  } catch (error) {
    logResult('User Login', false, 'Request failed', error.message);
    return null;
  }
}

/**
 * Test duplicate email registration
 */
async function testDuplicateEmailValidation() {
  try {
    const options = createRequestOptions(`${CONFIG.BASE_URL}/api/auth/register`, 'POST');
    const response = await makeRequest(options, CONFIG.TEST_USER);
    
    const passed = response.status === 409 && response.body.error?.includes('already');
    logResult(
      'Duplicate Email Validation',
      passed,
      passed ? 'Correctly rejected duplicate email' : 
               `Should reject duplicate email, got: ${response.status} - ${response.body.error}`,
      !passed ? response.body : null
    );
    
    return passed;
  } catch (error) {
    logResult('Duplicate Email Validation', false, 'Request failed', error.message);
    return false;
  }
}

/**
 * Test pricing tiers endpoint
 */
async function testPricingTiers() {
  try {
    const options = createRequestOptions(`${CONFIG.BASE_URL}/api/pricing/tiers`);
    const response = await makeRequest(options);
    
    const passed = response.status === 200 && 
                   response.body.success && 
                   response.body.data &&
                   response.body.data.tiers &&
                   Object.keys(response.body.data.tiers).length >= 3;
    
    logResult(
      'Pricing Tiers API',
      passed,
      passed ? `Found ${Object.keys(response.body.data?.tiers || {}).length} pricing tiers` : 
               'Pricing tiers API failed or returned invalid data',
      !passed ? response.body : null
    );
    
    return passed ? response.body.data.tiers : null;
  } catch (error) {
    logResult('Pricing Tiers API', false, 'Request failed', error.message);
    return null;
  }
}

/**
 * Test Stripe checkout session creation
 */
async function testStripeCheckout() {
  try {
    const checkoutData = {
      userId: 'test-user-id',
      email: CONFIG.TEST_USER.email,
      name: CONFIG.TEST_USER.name,
      tierId: 'pro',
      billingCycle: 'monthly'
    };
    
    const options = createRequestOptions(`${CONFIG.BASE_URL}/api/payments/stripe/checkout-tier`, 'POST');
    const response = await makeRequest(options, checkoutData);
    
    const passed = (response.status === 200 && response.body.success && response.body.url) ||
                   (response.status === 503 && response.body.error?.includes('Stripe not configured'));
    
    logResult(
      'Stripe Checkout Session',
      passed,
      response.status === 200 ? 'Checkout session created successfully' :
      response.status === 503 ? 'Stripe not configured (expected in dev)' :
                                `Checkout creation failed: ${response.body.error}`,
      !passed ? response.body : null
    );
    
    return passed;
  } catch (error) {
    logResult('Stripe Checkout Session', false, 'Request failed', error.message);
    return false;
  }
}

/**
 * Test chat endpoint (with and without API key)
 */
async function testChatEndpoint() {
  try {
    const chatData = {
      message: 'Hello, can you help me with a test?',
      userId: 'test-user-id'
    };
    
    const options = createRequestOptions(`${CONFIG.BASE_URL}/api/chat`, 'POST');
    const response = await makeRequest(options, chatData);
    
    const passed = (response.status === 200 && response.body.reply) ||
                   (response.status === 503 && response.body.error?.includes('not configured'));
    
    logResult(
      'Chat Endpoint',
      passed,
      response.status === 200 ? 'Chat response generated successfully' :
      response.status === 503 ? 'OpenAI not configured (expected in dev)' :
                                `Chat failed: ${response.body.error}`,
      !passed ? response.body : null
    );
    
    return passed;
  } catch (error) {
    logResult('Chat Endpoint', false, 'Request failed', error.message);
    return false;
  }
}

/**
 * Test invalid inputs and error handling
 */
async function testErrorHandling() {
  const tests = [
    {
      name: 'Invalid Email Registration',
      url: `${CONFIG.BASE_URL}/api/auth/register`,
      method: 'POST',
      data: { email: 'invalid-email', password: 'test123', name: 'Test' },
      expectedStatus: 400
    },
    {
      name: 'Weak Password Registration',
      url: `${CONFIG.BASE_URL}/api/auth/register`,
      method: 'POST',
      data: { email: 'test@example.com', password: '123', name: 'Test' },
      expectedStatus: 400
    },
    {
      name: 'Missing Login Credentials',
      url: `${CONFIG.BASE_URL}/api/auth/login`,
      method: 'POST',
      data: { email: 'test@example.com' },
      expectedStatus: 400
    },
    {
      name: 'Invalid Pricing Tier',
      url: `${CONFIG.BASE_URL}/api/pricing/tiers/invalid-tier`,
      method: 'GET',
      data: null,
      expectedStatus: 404
    }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const options = createRequestOptions(test.url, test.method);
      const response = await makeRequest(options, test.data);
      
      const passed = response.status === test.expectedStatus;
      logResult(
        test.name,
        passed,
        passed ? `Correctly returned ${response.status}` : 
                 `Expected ${test.expectedStatus}, got ${response.status}`,
        !passed ? response.body : null
      );
      
      if (passed) passedTests++;
    } catch (error) {
      logResult(test.name, false, 'Request failed', error.message);
    }
  }
  
  return passedTests === tests.length;
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(`${colors.bold}${colors.blue}AutoDevelop.ai v2 - Authentication & Subscription Test Suite${colors.reset}\n`);
  console.log(`Testing against: ${CONFIG.BASE_URL}\n`);
  
  // Test server health first
  const isHealthy = await testHealthCheck();
  if (!isHealthy) {
    console.log(`${colors.red}Server is not healthy. Aborting remaining tests.${colors.reset}\n`);
    return printSummary();
  }
  
  // Test user registration
  const registrationResult = await testUserRegistration();
  
  // Test user login (only if registration succeeded)
  if (registrationResult) {
    await testUserLogin();
  }
  
  // Test duplicate email validation
  await testDuplicateEmailValidation();
  
  // Test pricing tiers
  await testPricingTiers();
  
  // Test Stripe integration
  await testStripeCheckout();
  
  // Test chat functionality
  await testChatEndpoint();
  
  // Test error handling
  await testErrorHandling();
  
  printSummary();
}

/**
 * Print test summary
 */
function printSummary() {
  console.log(`${colors.bold}Test Summary:${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${results.skipped}${colors.reset}`);
  
  const total = results.passed + results.failed + results.skipped;
  const successRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
  
  console.log(`\n${colors.bold}Success Rate: ${successRate}%${colors.reset}`);
  
  if (results.failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    results.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`  - ${test.testName}: ${test.message}`);
      });
  }
  
  console.log(`\n${colors.blue}For deployment setup instructions, see: VERCEL_DEPLOYMENT_SETUP.md${colors.reset}`);
  
  // Exit with appropriate code
  // process.exit(results.failed > 0 ? 1 : 0);
}

// Handle script termination
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Tests interrupted by user${colors.reset}`);
  printSummary();
});

process.on('uncaughtException', (error) => {
  console.error(`${colors.red}Uncaught exception: ${error.message}${colors.reset}`);
  results.failed++;
  printSummary();
});

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runTests, testHealthCheck, testUserRegistration, testUserLogin };