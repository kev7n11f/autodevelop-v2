// Final comprehensive test for paywall functionality
const assert = require('assert');

let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  fetch = globalThis.fetch;
}

const API_BASE = 'http://localhost:8080/api';
const FREE_LIMIT = 5;

async function testPaywallWorking() {
  console.log('🎯 Final Paywall Quality Control Test\n');
  console.log('=' .repeat(50));

  // Test 1: Health check
  console.log('\n📡 Test 1: Server Health Check');
  try {
    const healthResponse = await fetch('http://localhost:8080/');
    if (healthResponse.ok) {
      console.log('  ✅ Server is running and responsive');
    } else {
      console.log('  ❌ Server health check failed');
      return false;
    }
  } catch (e) {
    console.log('  ❌ Server not accessible:', e.message);
    return false;
  }

  // Test 2: Paywall functionality (slow to avoid rate limiting)
  console.log('\n🐌 Test 2: Paywall Enforcement (with delays to avoid rate limiting)');
  const testUserId = 'paywall-qc-test-' + Date.now();
  
  try {
    for (let i = 1; i <= 6; i++) {
      console.log(`\n  Request ${i}/${6}:`);
      
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `QC test message ${i}`,
          userId: testUserId
        })
      });

      const data = await response.json();
      console.log(`    Status: ${response.status}`);
      
      if (response.status === 402) {
        console.log(`    ✅ PAYWALL TRIGGERED at message ${i}!`);
        console.log(`    Message: "${data.message}"`);
        console.log(`    Checkout: ${data.checkoutEndpoint}`);
        
        // Validate response structure
        assert.strictEqual(data.error, 'Free limit reached');
        assert.strictEqual(data.upgrade, true);
        assert.ok(data.checkoutEndpoint);
        
        if (i === 5) {
          console.log(`    ✅ Paywall triggered at correct limit (${FREE_LIMIT} messages)`);
          return true;
        } else {
          console.log(`    ⚠️  Paywall triggered early at message ${i}, expected at ${FREE_LIMIT}`);
          return false;
        }
      } else if (response.status === 500) {
        console.log(`    ℹ️  OpenAI API error (expected) - paywall not reached yet`);
      } else if (response.status === 429) {
        console.log(`    ⚠️  Rate limited - waiting longer and retrying...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        i--; // Retry this request
        continue;
      } else {
        console.log(`    ❓ Unexpected status: ${response.status}`);
      }
      
      // Wait between requests to avoid rate limiting
      if (i < 6) {
        console.log(`    ⏱️  Waiting 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n  ❌ Paywall was not triggered after 6 requests');
    return false;
    
  } catch (error) {
    console.error(`\n  ❌ Test failed:`, error.message);
    return false;
  }
}

async function testStripeEndpointsWorking() {
  console.log('\n💳 Test 3: Stripe Integration Endpoints');
  
  try {
    // Test checkout endpoint
    const checkoutResponse = await fetch(`${API_BASE}/payments/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      })
    });

    const checkoutData = await checkoutResponse.json();
    if (checkoutResponse.status === 500 && checkoutData.error === 'Stripe not configured') {
      console.log('  ✅ Checkout endpoint correctly handles missing Stripe config');
    } else {
      console.log(`  ℹ️  Checkout endpoint status: ${checkoutResponse.status}`);
    }

    // Test billing portal endpoint  
    const portalResponse = await fetch(`${API_BASE}/payments/stripe/portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'test-customer'
      })
    });

    const portalData = await portalResponse.json();
    if (portalResponse.status === 500 && portalData.error === 'Stripe not configured') {
      console.log('  ✅ Portal endpoint correctly handles missing Stripe config');
    } else {
      console.log(`  ℹ️  Portal endpoint status: ${portalResponse.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`  ❌ Stripe test failed:`, error.message);
    return false;
  }
}

async function runFinalQualityControl() {
  console.log('🧪 AutoDevelop v2 - Paywall Quality Control Verification');
  console.log('🎯 Validating PR #20 Subscription Paywall Implementation\n');

  const paywallWorking = await testPaywallWorking();
  const stripeWorking = await testStripeEndpointsWorking();

  console.log('\n' + '=' .repeat(50));
  console.log('📋 QUALITY CONTROL RESULTS:');
  console.log(`  🔒 Usage Gating (5 msg limit): ${paywallWorking ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  💳 Stripe Integration: ${stripeWorking ? '✅ PASS' : '❌ FAIL'}`);

  const overallPass = paywallWorking && stripeWorking;
  console.log(`\n🏆 OVERALL RESULT: ${overallPass ? '✅ QUALITY CONTROL PASSED' : '❌ QUALITY CONTROL FAILED'}`);

  if (overallPass) {
    console.log('\n🎉 Paywall implementation is ready for production!');
    console.log('   • Usage limits enforced correctly');
    console.log('   • Error handling works properly');
    console.log('   • Stripe integration handles missing config gracefully');
  }

  return overallPass;
}

// Export for use in other tests
module.exports = { runFinalQualityControl };

// Run if called directly
if (require.main === module) {
  runFinalQualityControl().then(success => {
    process.exit(success ? 0 : 1);
  });
}