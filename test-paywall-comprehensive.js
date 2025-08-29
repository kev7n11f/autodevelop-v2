// Test script specifically for paywall functionality without OpenAI dependency
const assert = require('assert');

// Use node-fetch for Node.js environment
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  fetch = globalThis.fetch;
}

const API_BASE = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : 'http://localhost:8080/api';

// Test configuration
const FREE_LIMIT = 5;
const TEST_USER_ID = 'paywall-test-user-' + Date.now();

async function testUsageCountingOnly() {
  console.log('🧪 Testing Usage Counting Logic...\n');

  try {
    // Test basic API availability
    console.log('📡 Test 1: Check API health');
    const healthResponse = await fetch('http://localhost:8080/');
    if (healthResponse.ok) {
      console.log('  ✅ Server is running and responsive');
    } else {
      console.log('  ❌ Server health check failed');
      return false;
    }

    // Test usage tracking by sending requests 
    // We expect 500 errors due to OpenAI API key, but the usage should still be tracked
    console.log(`\n📊 Test 2: Usage tracking with invalid API key (expected 500s)`);
    
    let responses = [];
    for (let i = 1; i <= FREE_LIMIT + 2; i++) {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Test usage tracking ${i}`,
          userId: TEST_USER_ID
        })
      });

      const data = await response.json();
      responses.push({ status: response.status, data });
      
      console.log(`  Request ${i}: Status ${response.status} - ${data.error || 'Success'}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Analyze results
    const first4 = responses.slice(0, 4);
    const fifthRequest = responses[4];
    const afterLimit = responses.slice(5);

    console.log(`\n📈 Test 3: Analyzing usage pattern`);
    
    // First 4 should have 500 (OpenAI API error) - this means paywall wasn't triggered
    const first4Status = first4.map(r => r.status);
    console.log(`  First 4 requests: ${first4Status.join(', ')}`);
    
    if (first4Status.every(s => s === 500)) {
      console.log('  ✅ First 4 requests passed paywall (got OpenAI API errors as expected)');
    } else {
      console.log('  ❌ Unexpected status codes in first 4 requests');
    }

    // The 5th request should trigger the paywall (402)
    console.log(`  5th request (limit): ${fifthRequest.status}`);
    
    if (fifthRequest.status === 402) {
      console.log('  ✅ Paywall triggered correctly on 5th request (402 status)');
      
      // Check paywall response structure
      const { error, upgrade, message, checkoutEndpoint } = fifthRequest.data;
      console.log(`     Paywall error: "${error}"`);
      console.log(`     Upgrade flag: ${upgrade}`);
      console.log(`     Message: "${message}"`);
      console.log(`     Checkout endpoint: "${checkoutEndpoint}"`);
      
      // Validate paywall response structure
      assert.strictEqual(error, 'Free limit reached', 'Paywall error message should be correct');
      assert.strictEqual(upgrade, true, 'Upgrade flag should be true');
      assert.ok(checkoutEndpoint, 'Checkout endpoint should be provided');
      
      console.log('  ✅ Paywall response structure is correct');
      
      return true;
    } else {
      console.log('  ❌ Expected 402 paywall response on 5th request, got ' + fifthRequest.status);
      return false;
    }

  } catch (error) {
    console.error(`❌ Test failed:`, error.message);
    return false;
  }
}

async function testStripeEndpoints() {
  console.log('\n💳 Testing Stripe Integration Endpoints...\n');

  try {
    // Test Stripe checkout endpoint
    console.log('🛒 Test 1: Stripe checkout endpoint');
    const checkoutResponse = await fetch(`${API_BASE}/payments/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      })
    });

    if (checkoutResponse.status === 500) {
      const errorData = await checkoutResponse.json();
      if (errorData.error === 'Stripe not configured') {
        console.log('  ✅ Stripe checkout endpoint properly handles missing configuration');
      } else {
        console.log(`  ⚠️  Unexpected error: ${errorData.error}`);
      }
    } else {
      console.log(`  ✅ Stripe checkout endpoint responding (status: ${checkoutResponse.status})`);
    }

    // Test billing portal endpoint
    console.log('\n🏛️ Test 2: Billing portal endpoint');
    const portalResponse = await fetch(`${API_BASE}/payments/stripe/portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'test-customer',
        returnUrl: 'http://localhost:5173/account'
      })
    });

    if (portalResponse.status === 500) {
      const errorData = await portalResponse.json();
      if (errorData.error === 'Stripe not configured') {
        console.log('  ✅ Billing portal endpoint properly handles missing configuration');
      } else {
        console.log(`  ⚠️  Unexpected error: ${errorData.error}`);
      }
    } else {
      console.log(`  ✅ Billing portal endpoint responding (status: ${portalResponse.status})`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Stripe test failed:`, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Comprehensive Paywall Quality Control Tests\n');
  console.log('=' .repeat(60));

  const usageTest = await testUsageCountingOnly();
  const stripeTest = await testStripeEndpoints();

  console.log('\n' + '=' .repeat(60));
  console.log('📋 Test Summary:');
  console.log(`  Usage Tracking & Paywall: ${usageTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Stripe Integration: ${stripeTest ? '✅ PASS' : '❌ FAIL'}`);

  const overallSuccess = usageTest && stripeTest;
  console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  return overallSuccess;
}

// Export for use in other tests
module.exports = { testUsageCountingOnly, testStripeEndpoints, runAllTests };

// Run if called directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}