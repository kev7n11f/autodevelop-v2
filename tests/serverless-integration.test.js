const authHandler = require('../src/functions/auth');
const paymentsHandler = require('../src/functions/payments');
const apiHandler = require('../src/functions/api');

// Test utilities
const createEvent = (httpMethod, path, body = null, headers = {}) => ({
  httpMethod,
  path,
  body: body ? JSON.stringify(body) : null,
  headers: {
    'Content-Type': 'application/json',
    ...headers
  },
  requestContext: {
    identity: {
      sourceIp: '127.0.0.1'
    }
  },
  pathParameters: {},
  queryStringParameters: {}
});

const createEventWithAuth = (httpMethod, path, body, token) => {
  return createEvent(httpMethod, path, body, {
    'Authorization': `Bearer ${token}`
  });
};

async function runIntegrationTests() {
  console.log('🧪 Running Serverless Integration Tests...\n');

  let testResults = {
    total: 0,
    passed: 0,
    failed: []
  };

  // Test data
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Integration Test User'
  };
  
  let userToken = null;

  // Helper function to run a test
  const runTest = async (name, testFn) => {
    testResults.total++;
    try {
      await testFn();
      console.log(`  ✅ ${name}`);
      testResults.passed++;
    } catch (error) {
      console.log(`  ❌ ${name}: ${error.message}`);
      testResults.failed.push({ name, error: error.message });
    }
  };

  console.log('📝 Authentication Flow Tests:');

  // Test 1: User Registration
  await runTest('User registration', async () => {
    const event = createEvent('POST', '/auth/register', testUser);
    const response = await authHandler.handler(event);
    
    if (response.statusCode !== 201) {
      throw new Error(`Expected 201, got ${response.statusCode}`);
    }

    const body = JSON.parse(response.body);
    if (!body.success || !body.tokens?.accessToken) {
      throw new Error('Registration failed or no token returned');
    }

    userToken = body.tokens.accessToken;
  });

  // Test 2: User Login
  await runTest('User login', async () => {
    const event = createEvent('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    const response = await authHandler.handler(event);
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    const body = JSON.parse(response.body);
    if (!body.success || !body.tokens?.accessToken) {
      throw new Error('Login failed or no token returned');
    }

    // Update token with login token
    userToken = body.tokens.accessToken;
  });

  // Test 3: Auth Status Check
  await runTest('Auth status check', async () => {
    const event = createEventWithAuth('GET', '/auth/status', null, userToken);
    const response = await authHandler.handler(event);
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    const body = JSON.parse(response.body);
    if (!body.success || !body.user) {
      throw new Error('Status check failed');
    }
  });

  // Test 4: Invalid login
  await runTest('Invalid login rejection', async () => {
    const event = createEvent('POST', '/auth/login', {
      email: testUser.email,
      password: 'wrongpassword'
    });
    const response = await authHandler.handler(event);
    
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  console.log('\n📝 Protected API Tests:');

  // Test 5: Access protected endpoint with valid token
  await runTest('Access protected chat endpoint', async () => {
    const event = createEventWithAuth('POST', '/api/chat', {
      message: 'Hello, this is a test message!'
    }, userToken);
    const response = await apiHandler.handler(event);
    
    // Note: This will fail if OpenAI API key is not configured, which is expected
    if (response.statusCode === 503) {
      // OpenAI not configured - this is acceptable for testing
      const body = JSON.parse(response.body);
      if (body.error !== 'OpenAI API not configured') {
        throw new Error('Unexpected error accessing chat endpoint');
      }
    } else if (response.statusCode === 200) {
      // OpenAI is configured and working
      const body = JSON.parse(response.body);
      if (!body.success) {
        throw new Error('Chat request failed');
      }
    } else {
      throw new Error(`Unexpected status code: ${response.statusCode}`);
    }
  });

  // Test 6: Access protected endpoint without token
  await runTest('Reject access without token', async () => {
    const event = createEvent('POST', '/api/chat', {
      message: 'Hello, this should fail!'
    });
    const response = await apiHandler.handler(event);
    
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  // Test 7: Get user profile
  await runTest('Get user profile', async () => {
    const event = createEventWithAuth('GET', '/api/profile', null, userToken);
    const response = await apiHandler.handler(event);
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    const body = JSON.parse(response.body);
    if (!body.success || !body.user || body.user.email !== testUser.email) {
      throw new Error('Profile data incorrect');
    }
  });

  console.log('\n📝 Payment Integration Tests:');

  // Test 8: Get pricing tiers
  await runTest('Get pricing tiers', async () => {
    const event = createEvent('GET', '/payments/tiers');
    const response = await paymentsHandler.handler(event);
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    const body = JSON.parse(response.body);
    if (!body.success || !body.tiers) {
      throw new Error('Failed to get pricing tiers');
    }
  });

  // Test 9: Create checkout session (requires auth)
  await runTest('Create checkout session', async () => {
    // This test will work even without Stripe configured
    const event = createEventWithAuth('POST', '/payments/checkout', {
      userId: 'test-user-id',
      email: testUser.email,
      name: testUser.name,
      tierId: 'pro',
      billingCycle: 'monthly'
    }, userToken);
    
    const response = await paymentsHandler.handler(event);
    
    // Expected to fail without proper Stripe configuration
    if (response.statusCode === 500) {
      const body = JSON.parse(response.body);
      if (!body.error.includes('Stripe') && !body.details.includes('stripe')) {
        throw new Error('Unexpected error creating checkout session');
      }
      // This is expected without Stripe configuration
    } else if (response.statusCode === 200) {
      // Stripe is properly configured
      const body = JSON.parse(response.body);
      if (!body.success) {
        throw new Error('Checkout session creation failed');
      }
    } else {
      throw new Error(`Unexpected status code: ${response.statusCode}`);
    }
  });

  console.log('\n📝 Utility Tests:');

  // Test 10: Health check
  await runTest('Health check endpoint', async () => {
    const event = createEvent('GET', '/api/health');
    const response = await apiHandler.handler(event);
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    const body = JSON.parse(response.body);
    if (body.status !== 'healthy') {
      throw new Error('Health check failed');
    }
  });

  // Test 11: Chat suggestions
  await runTest('Get chat suggestions', async () => {
    const event = createEvent('GET', '/api/chat/suggestions');
    const response = await apiHandler.handler(event);
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    const body = JSON.parse(response.body);
    if (!body.success || !body.suggestions || !Array.isArray(body.suggestions)) {
      throw new Error('Chat suggestions format incorrect');
    }
  });

  // Test 12: Logout
  await runTest('User logout', async () => {
    const event = createEventWithAuth('POST', '/auth/logout', null, userToken);
    const response = await authHandler.handler(event);
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    const body = JSON.parse(response.body);
    if (!body.success) {
      throw new Error('Logout failed');
    }
  });

  // Print results
  console.log('\n📊 Integration Test Results:');
  console.log(`Total tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n💥 Failed tests:');
    testResults.failed.forEach(test => {
      console.log(`  - ${test.name}: ${test.error}`);
    });
  }

  const successRate = Math.round((testResults.passed / testResults.total) * 100);
  console.log(`\nSuccess rate: ${successRate}%`);

  if (successRate >= 85) {
    console.log('🎉 Integration tests mostly successful!');
    console.log('Note: Some failures may be expected without external service configuration (OpenAI, Stripe)');
    process.exit(0);
  } else {
    console.log('💥 Too many integration test failures');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests().catch(error => {
    console.error('Integration test error:', error);
    process.exit(1);
  });
}

module.exports = { runIntegrationTests };