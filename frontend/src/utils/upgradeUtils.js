import { checkSystemStatus } from './systemStatus';

// Get user data from localStorage or return defaults for unauthenticated users
const getUserDataForUpgrade = () => {
  const userId = localStorage.getItem('userId');
  const email = localStorage.getItem('userEmail');
  const name = localStorage.getItem('userName');
  
  // If user is not authenticated (no data in localStorage), 
  // redirect to login or show authentication required message
  if (!userId || !email || !name) {
    return {
      isAuthenticated: false,
      userId: null,
      email: null,
      name: null
    };
  }
  
  return {
    isAuthenticated: true,
    userId,
    email,
    name
  };
};

// Shared utility for handling upgrade/checkout flow
export const handleUpgrade = async () => {
  const userData = getUserDataForUpgrade();
  
  // Check if user is authenticated
  if (!userData.isAuthenticated) {
    const shouldLogin = confirm(
      'You need to be signed in to upgrade your subscription.\n\n' +
      'Would you like to sign in now?'
    );
    
    if (shouldLogin) {
      // Redirect to login page
      window.location.href = '/login';
      return;
    } else {
      return; // User chose not to sign in
    }
  }
  
  // Check system status first to provide better user feedback
  const status = await checkSystemStatus();
  
  if (!status.stripe) {
    alert(`Payment Processing Unavailable\n\nOur payment system is currently being configured. Please try again later or contact support.\n\nStatus: Stripe ⚠️ Configuring...`);
    return;
  }
  
  try {
    // Use the new tier-based checkout endpoint with Pro tier
    const res = await fetch('/api/payments/stripe/checkout-tier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: userData.userId, 
        email: userData.email, 
        name: userData.name,
        tierId: 'pro',
        billingCycle: 'monthly'
      })
    });
    
    const data = await res.json();
    
    if (data.success && data.url) {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } else {
      // More informative error message
      const errorMsg = data.error || 'Failed to start checkout';
      const details = data.details || 'Stripe may not be configured properly. Please contact support.';
      
      console.error('Checkout failed:', { error: errorMsg, details });
      
      // Show a more user-friendly message
      alert(`Unable to process checkout: ${errorMsg}\n\nDetails: ${details}\n\nPlease contact support or try again later.`);
    }
  } catch (e) {
    console.error('Upgrade error:', e);
    
    // Check if it's a network error or server error
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      alert('Network connection error. Please check your internet connection and try again.');
    } else {
      alert('Service temporarily unavailable. The payment system is being configured. Please try again later.');
    }
  }
};