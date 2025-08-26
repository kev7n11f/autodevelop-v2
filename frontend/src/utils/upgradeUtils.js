// Shared utility for handling upgrade/checkout flow
export const handleUpgrade = async () => {
  const userId = localStorage.getItem('userId') || 'demo-user';
  const email = localStorage.getItem('userEmail') || 'demo@autodevelop.ai';
  const name = localStorage.getItem('userName') || 'Demo User';
  
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
      alert('Failed to start checkout. Please try again.');
    }
  } catch (e) {
    console.error('Upgrade error:', e);
    alert('Network error. Please try again.');
  }
};