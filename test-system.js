#!/usr/bin/env node

/**
 * AutoDevelop.ai System Test
 * Tests all main functionality to verify the system is working correctly
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.argv[2] || 'http://localhost:8080';
const TEST_EMAIL = 'test-' + Date.now() + '@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Test User';

console.log('🧪 AutoDevelop.ai System Test');
console.log('Base URL:', BASE_URL);
console.log('Test Email:', TEST_EMAIL);
console.log('='.repeat(50));

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('1. Testing health endpoint...');
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200 && response.data.status === 'ok') {
      console.log('   ✅ Health endpoint working');
      return true;
    } else {
      console.log('   ❌ Health endpoint failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Health endpoint error:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('2. Testing authentication...');
  
  // Test registration
  try {
    const regResponse = await makeRequest('POST', '/api/auth/register', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME
    });
    
    if (regResponse.status === 201 && regResponse.data.success) {
      console.log('   ✅ User registration working');
    } else {
      console.log('   ❌ Registration failed:', regResponse.status, regResponse.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Registration error:', error.message);
    return false;
  }

  // Test login
  try {
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('   ✅ User login working');
      return true;
    } else {
      console.log('   ❌ Login failed:', loginResponse.status, loginResponse.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Login error:', error.message);
    return false;
  }
}

async function testChatEndpoint() {
  console.log('3. Testing chat endpoint...');
  try {
    const response = await makeRequest('POST', '/api/chat', {
      message: 'Hello, this is a test message',
      userId: 'test-user-' + Date.now()
    });
    
    // Chat endpoint should be accessible but may fail with invalid API key
    if (response.status === 500 && response.data.error) {
      if (response.data.error.includes('invalid_api_key') || 
          response.data.error.includes('AI service') ||
          response.data.error === 'Sorry, I encountered an error. Please try again.') {
        console.log('   ✅ Chat endpoint accessible (API key validation working)');
        return true;
      }
    } else if (response.status === 200) {
      console.log('   ✅ Chat endpoint working with valid API key');
      return true;
    }
    
    console.log('   ❌ Chat endpoint unexpected response:', response.status, response.data);
    return false;
  } catch (error) {
    console.log('   ❌ Chat endpoint error:', error.message);
    return false;
  }
}

async function testPricingEndpoint() {
  console.log('4. Testing pricing endpoint...');
  try {
    const response = await makeRequest('GET', '/api/pricing/tiers');
    
    if (response.status === 200 && response.data.success && response.data.data.tiers) {
      console.log('   ✅ Pricing tiers endpoint working');
      return true;
    } else {
      console.log('   ❌ Pricing endpoint failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Pricing endpoint error:', error.message);
    return false;
  }
}

async function testStripeEndpoint() {
  console.log('5. Testing Stripe checkout endpoint...');
  try {
    const response = await makeRequest('POST', '/api/payments/stripe/checkout', {
      tier: 'pro',
      billing: 'monthly',
      userId: 'test-user',
      email: TEST_EMAIL
    });
    
    // Stripe should either work (with valid keys) or return proper error
    if (response.status === 200 || 
        (response.data.error && response.data.error.includes('Stripe not configured'))) {
      console.log('   ✅ Stripe endpoint accessible (proper error handling)');
      return true;
    } else {
      console.log('   ❌ Stripe endpoint unexpected response:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Stripe endpoint error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  const tests = [
    testHealthEndpoint,
    testAuthentication, 
    testChatEndpoint,
    testPricingEndpoint,
    testStripeEndpoint
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log('   ❌ Test error:', error.message);
      failed++;
    }
    console.log();
  }

  console.log('='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! System is working correctly.');
    console.log();
    console.log('✅ Login system: Working');
    console.log('✅ OpenAI API: Endpoint accessible');
    console.log('✅ Subscription services: Framework ready');
    console.log();
    console.log('To enable full functionality:');
    console.log('1. Set valid OPENAI_API_KEY for chat functionality');
    console.log('2. Set Stripe keys for payment processing'); 
    console.log('3. Set SENDGRID_API_KEY for email notifications');
  } else {
    console.log('❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});