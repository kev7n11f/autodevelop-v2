// Slow test to avoid rate limiting and properly test paywall
const assert = require('assert');

let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  fetch = globalThis.fetch;
}

const API_BASE = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : 'http://localhost:8080/api';
const FREE_LIMIT = 5;
const TEST_USER_ID = 'slow-test-user-' + Date.now();

async function slowPaywallTest() {
  console.log('🐌 Slow Paywall Test (avoiding rate limits)...\n');

  try {
    for (let i = 1; i <= 7; i++) {
      console.log(`\n📤 Sending request ${i}...`);
      
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Slow test message ${i}`,
          userId: TEST_USER_ID
        })
      });

      const data = await response.json();
      
      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${data.error || data.reply || 'No message'}`);
      
      if (response.status === 402) {
        console.log(`  🚫 PAYWALL TRIGGERED at request ${i}!`);
        console.log(`     Error: ${data.error}`);
        console.log(`     Upgrade: ${data.upgrade}`);
        console.log(`     Message: ${data.message}`);
        console.log(`     Checkout: ${data.checkoutEndpoint}`);
        return true;
      }
      
      // Wait 2 seconds between requests to avoid rate limiting
      console.log(`  ⏱️  Waiting 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n❌ Paywall was not triggered after 7 requests');
    return false;

  } catch (error) {
    console.error(`❌ Test failed:`, error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  slowPaywallTest().then(success => {
    console.log(`\n🎯 Result: ${success ? '✅ PAYWALL WORKING' : '❌ PAYWALL NOT WORKING'}`);
    process.exit(success ? 0 : 1);
  });
}

module.exports = { slowPaywallTest };