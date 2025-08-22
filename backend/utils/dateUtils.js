/**
 * Date utility functions for payment processing
 */

/**
 * Calculate the next billing date based on plan type
 * @param {string} planType - The subscription plan type (basic, pro, enterprise)
 * @param {Date|string} currentBillingDate - The current billing date
 * @returns {Date} The next billing date
 */
function calculateNextBillingDate(planType, currentBillingDate) {
  const current = new Date(currentBillingDate);
  
  // Ensure we have a valid date
  if (isNaN(current.getTime())) {
    throw new Error('Invalid current billing date');
  }
  
  // For all plan types, we use monthly billing (30 days)
  // In a real system, this could be configurable per plan
  const nextBilling = new Date(current);
  nextBilling.setDate(nextBilling.getDate() + 30);
  
  return nextBilling;
}

/**
 * Calculate the next billing date for a successful payment
 * If the payment was due today or in the past, calculate from today
 * If the payment was paid early, calculate from the original due date
 * @param {string} planType - The subscription plan type
 * @param {Date|string} originalBillingDate - The original next billing date
 * @returns {Date} The next billing date
 */
function calculateNextBillingDateAfterPayment(planType, originalBillingDate) {
  const original = new Date(originalBillingDate);
  const today = new Date();
  
  // Ensure we have a valid date
  if (isNaN(original.getTime())) {
    throw new Error('Invalid original billing date');
  }
  
  // If the payment was due today or in the past, calculate from today
  if (original <= today) {
    return calculateNextBillingDate(planType, today);
  }
  
  // If the payment was paid early, calculate from the original due date
  return calculateNextBillingDate(planType, original);
}

/**
 * Update subscription period dates after successful payment
 * @param {Object} subscription - The subscription object
 * @returns {Object} Updated subscription dates
 */
function updateSubscriptionPeriodAfterPayment(subscription) {
  const { plan_type: planType, next_billing_date } = subscription;
  
  const today = new Date();
  const nextBillingDate = calculateNextBillingDateAfterPayment(planType, next_billing_date);
  
  // Update the current period to start from today (or the original billing date if paid early)
  const currentPeriodStart = new Date(next_billing_date) <= today ? today : new Date(next_billing_date);
  const currentPeriodEnd = new Date(nextBillingDate);
  
  return {
    current_period_start: currentPeriodStart.toISOString(),
    current_period_end: currentPeriodEnd.toISOString(),
    next_billing_date: nextBillingDate.toISOString(),
    updated_at: today.toISOString()
  };
}

module.exports = {
  calculateNextBillingDate,
  calculateNextBillingDateAfterPayment,
  updateSubscriptionPeriodAfterPayment
};