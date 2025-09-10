import React, { useState, useEffect } from 'react';
import { fetchPricingTiers, createCheckoutSession } from '../services/pricingService';
import './Pricing.css';

const PricingPage = () => {
  const [tiers, setTiers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingCheckout, setProcessingCheckout] = useState(null);

  useEffect(() => {
    const loadPricingTiers = async () => {
      try {
        const response = await fetchPricingTiers();
        setTiers(response.tiers);
        setLoading(false);
      } catch {
        setError('Failed to load pricing information');
        setLoading(false);
      }
    };

    loadPricingTiers();
  }, []);

  const handleSelectPlan = async (tierId, billingCycle = 'monthly') => {
    setProcessingCheckout(tierId);
    
    try {
      const userId = localStorage.getItem('userId') || 'demo-user';
      const email = localStorage.getItem('userEmail') || 'demo@autodevelop.ai';
      const name = localStorage.getItem('userName') || 'Demo User';

      const checkoutData = await createCheckoutSession({
        userId,
        email,
        name,
        tierId,
        billingCycle
      });

      if (checkoutData.success && checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        throw new Error(checkoutData.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(`Checkout Error: ${err.message}`);
    } finally {
      setProcessingCheckout(null);
    }
  };

  if (loading) {
    return (
      <div className="pricing-page">
        <div className="container">
          <div className="pricing-loading">
            <div className="spinner"></div>
            <p>Loading pricing information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pricing-page">
        <div className="container">
          <div className="pricing-error">
            <h2>Pricing Unavailable</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-page">
      <div className="container">
        <div className="pricing-header">
          <h1>Choose Your Plan</h1>
          <p>Select the perfect plan for your development needs. Upgrade or downgrade anytime.</p>
        </div>

        <div className="pricing-tiers">
          {Object.values(tiers).map((tier) => (
            <div 
              key={tier.id} 
              className={`pricing-tier ${tier.popular ? 'popular' : ''} ${tier.recommended ? 'recommended' : ''}`}
            >
              {tier.popular && <div className="tier-badge">Most Popular</div>}
              {tier.recommended && <div className="tier-badge recommended-badge">Recommended</div>}
              
              <div className="tier-header">
                <h3>{tier.name}</h3>
                <p className="tier-description">{tier.description}</p>
              </div>

              <div className="tier-pricing">
                <div className="price-monthly">
                  <span className="price">${tier.priceMonthly}</span>
                  <span className="period">/month</span>
                </div>
                <div className="price-yearly">
                  <span className="price-yearly-label">
                    ${tier.priceYearly}/year 
                    <span className="savings">(Save ${(tier.priceMonthly * 12 - tier.priceYearly).toFixed(2)})</span>
                  </span>
                </div>
              </div>

              <div className="tier-features">
                <ul>
                  {tier.features.map((feature, index) => (
                    <li key={index}>
                      <span className="feature-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tier-actions">
                <button
                  className={`btn ${tier.popular ? 'btn-primary' : 'btn-secondary'} btn-full`}
                  onClick={() => handleSelectPlan(tier.id, 'monthly')}
                  disabled={processingCheckout === tier.id}
                >
                  {processingCheckout === tier.id ? (
                    <span>
                      <div className="btn-spinner"></div>
                      Processing...
                    </span>
                  ) : (
                    `Start with ${tier.name}`
                  )}
                </button>
                
                <button
                  className="btn btn-outline btn-full tier-yearly-btn"
                  onClick={() => handleSelectPlan(tier.id, 'yearly')}
                  disabled={processingCheckout === tier.id}
                >
                  Choose Yearly Plan
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pricing-footer">
          <div className="pricing-guarantee">
            <h4>🔒 30-Day Money-Back Guarantee</h4>
            <p>Try any plan risk-free. If you're not satisfied, we'll refund your money within 30 days.</p>
          </div>
          
          <div className="pricing-faq">
            <h4>❓ Frequently Asked Questions</h4>
            <div className="faq-item">
              <strong>Can I change plans anytime?</strong>
              <p>Yes! You can upgrade, downgrade, or cancel your subscription at any time through your account settings.</p>
            </div>
            <div className="faq-item">
              <strong>What payment methods do you accept?</strong>
              <p>We accept all major credit cards, debit cards, and PayPal through our secure Stripe payment processor.</p>
            </div>
            <div className="faq-item">
              <strong>Is my data secure?</strong>
              <p>Absolutely! We use industry-standard encryption and never store your payment information on our servers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
