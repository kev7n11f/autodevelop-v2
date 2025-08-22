#!/usr/bin/env node

/**
 * Payment Notification System Demo Script
 * 
 * This script demonstrates the payment notification system by:
 * 1. Creating sample subscriptions
 * 2. Simulating payment events
 * 3. Sending email notifications
 * 4. Showing integration between backend and frontend
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8080/api';

// Sample data for testing
const sampleUsers = [
  {
    userId: 'user_001',
    email: 'john.doe@example.com',
    name: 'John Doe',
    planType: 'pro',
    amount: 29.99,
    currency: 'USD'
  },
  {
    userId: 'user_002',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    planType: 'basic',
    amount: 9.99,
    currency: 'USD'
  }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error(`API call failed [${method} ${endpoint}]:`, error.message);
    return null;
  }
}

async function createSampleSubscriptions() {
  console.log('\n📋 Creating sample subscriptions...\n');
  
  for (const user of sampleUsers) {
    const subscriptionData = {
      ...user,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      nextBillingDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(), // 27 days from now
      paymentMethod: 'visa_ending_1234'
    };
    
    const result = await apiCall('/payments/subscription', 'POST', subscriptionData);
    
    if (result) {
      console.log(`✅ Created subscription for ${user.name} (${user.planType} plan)`);
    } else {
      console.log(`❌ Failed to create subscription for ${user.name}`);
    }
    
    await sleep(500); // Small delay between requests
  }
}

async function simulatePaymentEvents() {
  console.log('\n💳 Simulating payment events...\n');
  
  const events = [
    {
      userId: 'user_001',
      eventType: 'payment_success',
      amount: 29.99,
      currency: 'USD',
      transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
      paymentMethod: 'visa_ending_1234'
    },
    {
      userId: 'user_002',
      eventType: 'payment_failed',
      amount: 9.99,
      currency: 'USD',
      failureReason: 'Insufficient funds',
      paymentMethod: 'visa_ending_5678'
    },
    {
      userId: 'user_001',
      eventType: 'renewal_upcoming',
      amount: 29.99,
      currency: 'USD'
    }
  ];
  
  for (const event of events) {
    const result = await apiCall('/payments/webhook', 'POST', event);
    
    if (result) {
      console.log(`✅ Processed ${event.eventType} event for ${event.userId}`);
    } else {
      console.log(`❌ Failed to process ${event.eventType} event for ${event.userId}`);
    }
    
    await sleep(1000); // Delay to see email processing
  }
}

async function checkPendingNotifications() {
  console.log('\n📧 Processing pending notifications...\n');
  
  const result = await apiCall('/payments/process-notifications', 'POST');
  
  if (result) {
    console.log(`✅ Processed notifications: ${result.processed} sent, ${result.failed} failed`);
  } else {
    console.log('❌ Failed to process pending notifications');
  }
}

async function checkUpcomingRenewals() {
  console.log('\n📅 Checking upcoming renewals...\n');
  
  const result = await apiCall('/payments/check-renewals', 'POST');
  
  if (result) {
    console.log(`✅ Created ${result.remindersSent} renewal reminders`);
  } else {
    console.log('❌ Failed to check upcoming renewals');
  }
}

async function displayInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Payment Notification System Demo');
  console.log('='.repeat(60));
  
  console.log('\nThis demo will showcase:');
  console.log('• Creating payment subscriptions');
  console.log('• Processing payment events (success, failure, renewals)');
  console.log('• Sending email notifications');
  console.log('• Frontend integration with notification bars');
  
  console.log('\n📝 Note: Make sure the backend server is running on port 8080');
  console.log('   Start with: npm run dev\n');
  
  // Check if server is running
  const healthCheck = await apiCall('/health');
  if (!healthCheck) {
    console.log('❌ Backend server is not running. Please start it first.');
    process.exit(1);
  }
  
  console.log('✅ Backend server is running');
}

async function runDemo() {
  await displayInstructions();
  
  await sleep(2000);
  
  await createSampleSubscriptions();
  await sleep(1000);
  
  await simulatePaymentEvents();
  await sleep(1000);
  
  await checkPendingNotifications();
  await sleep(1000);
  
  await checkUpcomingRenewals();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Demo completed successfully!');
  console.log('='.repeat(60));
  
  console.log('\n📱 Frontend Integration:');
  console.log('• Visit http://localhost:5173 to see the frontend');
  console.log('• Notifications will appear at the top of the page');
  console.log('• Users can dismiss individual notifications or all at once');
  
  console.log('\n📧 Email Notifications:');
  console.log('• Check the backend logs for simulated email sends');
  console.log('• In production, these would be sent via SendGrid');
  console.log('• Templates include payment success, failure, and renewal reminders');
  
  console.log('\n🔧 API Endpoints Available:');
  console.log('• POST /api/payments/subscription - Create subscription');
  console.log('• POST /api/payments/webhook - Process payment events');
  console.log('• GET /api/payments/subscription/:userId - Get subscription');
  console.log('• POST /api/payments/process-notifications - Send pending emails');
  console.log('• POST /api/payments/check-renewals - Check upcoming renewals');
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = {
  createSampleSubscriptions,
  simulatePaymentEvents,
  checkPendingNotifications,
  checkUpcomingRenewals
};