#!/usr/bin/env node

/**
 * Test Script for Stripe Pricing Tiers Implementation
 * 
 * Tests the new pricing tier functionality without requiring full Stripe setup
 */

const fetch = require('node-fetch');

const API_BASE = process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : 'http://localhost:8080/api';

async function testPricingTiers() {
  console.log('🎯 Testing Stripe Pricing Tiers Implementation\n');
  console.log(`🌐 Testing against API: ${API_BASE}\n`);
  
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Get all pricing tiers
  console.log('📊 Test 1: Get All Pricing Tiers');
  totalTests++;
  try {
    const response = await fetch(`${API_BASE}/pricing/tiers`);
    const data = await response.json();
    
    if (response.ok && data.success && data.data.tiers) {
      const tierCount = Object.keys(data.data.tiers).length;
      console.log(`  ✅ Retrieved ${tierCount} pricing tiers`);
      console.log(`  ✅ Free tier included: ${data.data.freeTier ? 'Yes' : 'No'}`);
      console.log(`  ✅ Active promotion: ${data.data.hasActivePromotion ? 'Yes' : 'No'}`);
      passedTests++;
    } else {
      console.log(`  ❌ Failed to retrieve pricing tiers`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  // Test 2: Get promotional pricing
  console.log('\n🎉 Test 2: Get Promotional Pricing');
  totalTests++;
  try {
    const response = await fetch(`${API_BASE}/pricing/tiers?promo=true`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      const proTier = data.data.tiers.pro;
      if (proTier && proTier.isPromotional) {
        console.log(`  ✅ Pro tier promotional price: $${proTier.priceMonthly}/month`);
        console.log(`  ✅ Original price: $${proTier.originalPriceMonthly}/month`);
        console.log(`  ✅ Promotion expires: ${new Date(proTier.promotionExpiry).toDateString()}`);
        passedTests++;
      } else {
        console.log(`  ⚠️  No promotional pricing active`);
      }
    } else {
      console.log(`  ❌ Failed to retrieve promotional pricing`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  // Test 3: Get specific tier details
  console.log('\n🚀 Test 3: Get Specific Tier Details (Pro)');
  totalTests++;
  try {
    const response = await fetch(`${API_BASE}/pricing/tiers/pro`);
    const data = await response.json();
    
    if (response.ok && data.success && data.data.id === 'pro') {
      console.log(`  ✅ Retrieved Pro tier details`);
      console.log(`  ✅ Monthly price: $${data.data.priceMonthly}`);
      console.log(`  ✅ Yearly price: $${data.data.priceYearly}`);
      console.log(`  ✅ Features count: ${data.data.features.length}`);
      console.log(`  ✅ Recommended: ${data.data.recommended ? 'Yes' : 'No'}`);
      passedTests++;
    } else {
      console.log(`  ❌ Failed to retrieve Pro tier details`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  // Test 4: Test invalid tier
  console.log('\n❓ Test 4: Test Invalid Tier Handling');
  totalTests++;
  try {
    const response = await fetch(`${API_BASE}/pricing/tiers/invalid-tier`);
    const data = await response.json();
    
    if (response.status === 404 && !data.success) {
      console.log(`  ✅ Correctly handles invalid tier with 404 status`);
      passedTests++;
    } else {
      console.log(`  ❌ Did not handle invalid tier correctly`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  // Test 5: Test tier-specific checkout (should fail gracefully without Stripe)
  console.log('\n💳 Test 5: Test Tier-Specific Checkout (No Stripe Config)');
  totalTests++;
  try {
    const response = await fetch(`${API_BASE}/payments/stripe/checkout-tier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        tierId: 'pro',
        billingCycle: 'monthly'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 500 && data.error === 'Stripe not configured') {
      console.log(`  ✅ Correctly handles missing Stripe configuration`);
      passedTests++;
    } else {
      console.log(`  ❌ Did not handle missing Stripe config correctly`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  // Test 6: Test competitive pricing validation
  console.log('\n💰 Test 6: Validate Competitive Pricing');
  totalTests++;
  try {
    const response = await fetch(`${API_BASE}/pricing/tiers?promo=true`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      const { starter, pro, enterprise } = data.data.tiers;
      
      // Check that pricing is competitive and tiered
      const isCompetitive = (
        starter.priceMonthly < 10 &&     // Under $10 for starter
        pro.priceMonthly < 20 &&         // Under $20 for pro  
        enterprise.priceMonthly < 60 &&  // Under $60 for enterprise
        starter.priceMonthly < pro.priceMonthly && 
        pro.priceMonthly < enterprise.priceMonthly
      );
      
      if (isCompetitive) {
        console.log(`  ✅ Pricing is competitive and properly tiered`);
        console.log(`  ✅ Starter: $${starter.priceMonthly}/month`);
        console.log(`  ✅ Pro: $${pro.priceMonthly}/month`);
        console.log(`  ✅ Enterprise: $${enterprise.priceMonthly}/month`);
        passedTests++;
      } else {
        console.log(`  ⚠️  Pricing may not be competitive`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 PRICING TIERS TEST RESULTS:');
  console.log(`  ✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`  🎯 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🏆 ALL PRICING TIER TESTS PASSED!');
    console.log('   • Multiple competitive pricing tiers implemented');
    console.log('   • Promotional pricing system working');
    console.log('   • Error handling in place');
    console.log('   • API endpoints functional');
    return true;
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  testPricingTiers().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
}

module.exports = { testPricingTiers };