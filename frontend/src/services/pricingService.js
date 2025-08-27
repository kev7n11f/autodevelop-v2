/**
 * Pricing Service for AutoDevelop.ai v2 Frontend
 * 
 * Handles fetching pricing tiers and managing subscription checkout
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch all available pricing tiers
 * @param {boolean} includePromo - Whether to include promotional pricing
 * @returns {Promise<Object>} Pricing tiers response
 */
export async function fetchPricingTiers(includePromo = true) {
  try {
    const response = await fetch(`${API_BASE}/pricing/tiers?promo=${includePromo}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    throw error;
  }
}

/**
 * Fetch specific pricing tier details
 * @param {string} tierId - The tier ID (starter, pro, enterprise)
 * @param {boolean} includePromo - Whether to include promotional pricing
 * @returns {Promise<Object>} Pricing tier details
 */
export async function fetchPricingTier(tierId, includePromo = true) {
  try {
    const response = await fetch(`${API_BASE}/pricing/tiers/${tierId}?promo=${includePromo}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching pricing tier ${tierId}:`, error);
    throw error;
  }
}

/**
 * Create Stripe checkout session for a specific tier
 * @param {Object} params - Checkout parameters
 * @param {string} params.userId - User ID
 * @param {string} params.email - User email
 * @param {string} params.name - User name
 * @param {string} params.tierId - Pricing tier ID
 * @param {string} params.billingCycle - 'monthly' or 'yearly'
 * @returns {Promise<Object>} Checkout session response
 */
export async function createCheckoutSession({
  userId,
  email,
  name,
  tierId,
  billingCycle = 'monthly'
}) {
  try {
    const response = await fetch(`${API_BASE}/payments/stripe/checkout-tier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
        name,
        tierId,
        billingCycle
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create billing portal session for managing existing subscription
 * @param {string} customerId - Stripe customer ID
 * @param {string} returnUrl - URL to return to after managing billing
 * @returns {Promise<Object>} Billing portal session response
 */
export async function createBillingPortalSession(customerId, returnUrl) {
  try {
    const response = await fetch(`${API_BASE}/payments/stripe/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw error;
  }
}

/**
 * Format currency for display
 * @param {number} amount - Amount in currency units
 * @param {string} currency - Currency code (e.g., 'USD')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate yearly savings
 * @param {number} monthlyPrice - Monthly price
 * @param {number} yearlyPrice - Yearly price
 * @returns {Object} Savings information
 */
export function calculateYearlySavings(monthlyPrice, yearlyPrice) {
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - yearlyPrice;
  const savingsPercentage = Math.round((savings / monthlyTotal) * 100);
  
  return {
    savingsAmount: savings,
    savingsPercentage,
    monthlyEquivalent: yearlyPrice / 12
  };
}

/**
 * Check if user should see promotional pricing
 * @returns {boolean} True if promotional pricing should be shown
 */
export function shouldShowPromotionalPricing() {
  // Check if user is new or returning user
  const lastVisit = localStorage.getItem('lastVisit');
  const isNewUser = !lastVisit || (Date.now() - parseInt(lastVisit)) > 30 * 24 * 60 * 60 * 1000; // 30 days
  
  localStorage.setItem('lastVisit', Date.now().toString());
  return isNewUser;
}