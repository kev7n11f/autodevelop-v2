// Simple test script to verify paywall functionality
const assert = require('assert');
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8080/api';

// Test configuration
const FREE_LIMIT = 5;
const TEST_USER_ID = 'test-user-paywall-' + Date.now();

async function testPaywallFlow() {
  console.log('🧪 Starting Paywall Flow Test...\n');

  try {
    // Test 1: Send messages up to the free limit
    console.log(`📝 Test 1: Sending ${FREE_LIMIT} messages (should all succeed)`);
    for (let i = 1; i <= FREE_LIMIT; i++) {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Test message ${i}`,
          userId: TEST_USER_ID
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Message ${i}: Success (${data.meta?.remainingDailyFree} remaining)`);
      } else {
        console.log(`  ❌ Message ${i}: Unexpected error - ${response.status}`);
      }
    }

    // Test 2: Send one more message (should hit paywall)
    console.log(`\n🚫 Test 2: Sending message ${FREE_LIMIT + 1} (should hit paywall)`);
    const paywallResponse = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Paywall test message`,
        userId: TEST_USER_ID
      })
    });

    if (paywallResponse.status === 402) {
      const paywallData = await paywallResponse.json();
      console.log(`  ✅ Paywall triggered correctly!`);
      console.log(`     Error: ${paywallData.error}`);
      console.log(`     Message: ${paywallData.message}`);
      console.log(`     Upgrade: ${paywallData.upgrade}`);
      console.log(`     Checkout endpoint: ${paywallData.checkoutEndpoint}`);
      
      // Validate the response structure
      assert.strictEqual(paywallData.error, 'Free limit reached', 'Error message should be correct');
      assert.strictEqual(paywallData.remaining, 0, 'Remaining should be 0');
      assert.strictEqual(paywallData.upgrade, true, 'Upgrade flag should be true');
      assert.ok(paywallData.checkoutEndpoint, 'Checkout endpoint should be provided');
      
    } else {
      console.log(`  ❌ Expected 402 paywall response, got ${paywallResponse.status}`);
      return false;
    }

    // Test 3: Test Stripe checkout endpoint availability
    console.log(`\n💳 Test 3: Testing Stripe checkout endpoint`);
    const checkoutResponse = await fetch(`${API_BASE}/payments/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      })
    });

    if (checkoutResponse.status === 500 && checkoutResponse.statusText.includes('Stripe')) {
      console.log(`  ⚠️  Stripe not configured (expected in test environment)`);
    } else if (checkoutResponse.status === 400) {
      const errorData = await checkoutResponse.json();
      console.log(`  ⚠️  Stripe validation error: ${errorData.error} (expected without proper config)`);
    } else {
      console.log(`  ✅ Checkout endpoint responding (status: ${checkoutResponse.status})`);
    }

    console.log(`\n🎉 Paywall flow test completed successfully!`);
    return true;

  } catch (error) {
    console.error(`❌ Test failed:`, error.message);
    return false;
  }
}

// Export for use in other tests
module.exports = { testPaywallFlow };

// Run if called directly
if (require.main === module) {
  testPaywallFlow().then(success => {
    process.exit(success ? 0 : 1);
  });
}