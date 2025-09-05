import { checkSystemStatus } from './systemStatus';

// Shared utility for handling upgrade/checkout flow
export const handleUpgrade = async () => {
  const userId = localStorage.getItem('userId') || 'demo-user';
  const email = localStorage.getItem('userEmail') || 'demo@autodevelop.ai';
  const name = localStorage.getItem('userName') || 'Demo User';
  
  // Check system status first to provide better user feedback
  const status = await checkSystemStatus();
  
  if (!status.stripe) {
    alert(`Payment Processing Unavailable\n\nOur payment system is currently being configured. Please try again later or contact support.\n\nStatus: Stripe ${status.stripe ? '✅ Available' : '⚠️ Configuring...'}`);
    return;
  }
  
  try {
    const res = await fetch('/api/payments/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, name })
    });
    
    const data = await res.json();
    
    if (data.url) {
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