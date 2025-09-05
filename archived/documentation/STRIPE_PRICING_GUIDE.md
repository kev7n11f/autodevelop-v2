# Stripe Pricing Tiers Management Guide

## Overview

AutoDevelop.ai v2 uses a flexible pricing tier system that supports multiple subscription plans with competitive rates. This document explains how to set up, configure, and manage pricing tiers using Stripe.

## Architecture

### Components

1. **Pricing Configuration** (`backend/config/pricing.js`)
   - Centralized pricing definitions
   - Promotional pricing management
   - Feature and limit specifications

2. **Payment Controller** (`backend/controllers/paymentController.js`)
   - Stripe integration endpoints
   - Tier-aware checkout creation
   - Webhook handling with tier detection

3. **API Routes** (`backend/routes/apiRoutes.js`)
   - RESTful pricing tier endpoints
   - Enhanced Stripe checkout endpoints

4. **Frontend Services** (`frontend/src/services/pricingService.js`)
   - Pricing data fetching
   - Checkout session creation
   - Currency formatting utilities

## Pricing Tiers

### Current Tier Structure

1. **Free Tier**
   - 5 messages per day
   - 150 messages per month
   - Community support
   - Basic templates

2. **Starter Tier** - $9.99/month
   - 500 messages per month
   - 50 messages per day
   - Community support
   - Basic project templates
   - Code generation assistance

3. **Pro Tier** - $19.99/month (Recommended)
   - Unlimited messages
   - Priority response time
   - Email support
   - Advanced project templates
   - API access
   - Early feature access

4. **Enterprise Tier** - $49.99/month
   - Everything in Pro
   - Dedicated support
   - Custom model fine-tuning
   - Advanced analytics
   - SSO integration
   - SLA guarantees

### Promotional Pricing

The system supports promotional pricing campaigns:

- **Early Bird Offer**: Active until December 31, 2025
  - Starter: $7.99/month (20% off)
  - Pro: $14.99/month (25% off)
  - Enterprise: $39.99/month (20% off)

## Setting Up Stripe Products and Prices

### 1. Create Products in Stripe Dashboard

1. Navigate to Stripe Dashboard → Products
2. Create products for each tier:
   - **AutoDevelop Starter**
   - **AutoDevelop Pro**
   - **AutoDevelop Enterprise**

### 2. Create Price IDs

For each product, create monthly and yearly pricing:

```bash
# Example Stripe CLI commands
stripe prices create \
  --product prod_starter_id \
  --unit-amount 999 \
  --currency usd \
  --recurring interval=month \
  --nickname "Starter Monthly"

stripe prices create \
  --product prod_starter_id \
  --unit-amount 9999 \
  --currency usd \
  --recurring interval=year \
  --nickname "Starter Yearly"
```

### 3. Environment Configuration

Update your `.env` file with the Stripe price IDs:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Pricing Configuration
STRIPE_STARTER_PRICE_ID=price_starter_monthly_id
STRIPE_STARTER_YEARLY_PRICE_ID=price_starter_yearly_id
STRIPE_PRO_PRICE_ID=price_pro_monthly_id
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly_id
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_monthly_id
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_enterprise_yearly_id
STRIPE_DEFAULT_PRICE_ID=price_pro_monthly_id

# Checkout URLs
STRIPE_SUCCESS_URL=https://yourdomain.com/success
STRIPE_CANCEL_URL=https://yourdomain.com/cancel
STRIPE_PORTAL_RETURN_URL=https://yourdomain.com/account
```

## API Endpoints

### Pricing Information

#### Get All Pricing Tiers
```http
GET /api/pricing/tiers?promo=true
```

Response:
```json
{
  "success": true,
  "data": {
    "tiers": {
      "starter": {
        "id": "starter",
        "name": "Starter",
        "priceMonthly": 7.99,
        "originalPriceMonthly": 9.99,
        "isPromotional": true,
        "features": [...],
        "limits": {...}
      }
    },
    "freeTier": {...},
    "hasActivePromotion": true
  }
}
```

#### Get Specific Tier Details
```http
GET /api/pricing/tiers/pro?promo=true
```

### Subscription Management

#### Create Checkout Session with Tier
```http
POST /api/payments/stripe/checkout-tier
Content-Type: application/json

{
  "userId": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "tierId": "pro",
  "billingCycle": "monthly"
}
```

Response:
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_...",
  "tier": {
    "id": "pro",
    "name": "Pro",
    "price": 14.99,
    "billingCycle": "monthly"
  }
}
```

## Updating Pricing Tiers

### 1. Modify Pricing Configuration

Edit `backend/config/pricing.js`:

```javascript
const PRICING_TIERS = {
  newTier: {
    id: 'newTier',
    name: 'New Tier',
    description: 'Description of new tier',
    priceMonthly: 29.99,
    priceYearly: 299.99,
    currency: 'USD',
    features: [
      'Feature 1',
      'Feature 2'
    ],
    limits: {
      messagesPerMonth: 1000,
      messagesPerDay: 100,
      projectsCount: 10
    },
    stripeIds: {
      monthly: process.env.STRIPE_NEWTIER_PRICE_ID,
      yearly: process.env.STRIPE_NEWTIER_YEARLY_PRICE_ID
    },
    recommended: false,
    popular: false
  }
};
```

### 2. Create Stripe Products and Prices

Use Stripe Dashboard or CLI to create corresponding products and prices.

### 3. Update Environment Variables

Add new price IDs to your environment configuration.

### 4. Update Frontend Components

Update any hardcoded references in frontend components to use the new tier.

## Promotional Campaigns

### Creating New Promotions

1. Update `PROMOTIONAL_PRICING` in `pricing.js`:

```javascript
const PROMOTIONAL_PRICING = {
  blackFriday: {
    enabled: true,
    expiryDate: new Date('2025-11-30T23:59:59Z'),
    tiers: {
      pro: {
        priceMonthly: 9.99, // 50% off
        priceYearly: 99.99
      }
    }
  }
};
```

2. Update the promotion logic in `isPromotionActive()` and `applyPromotionalPricing()`.

### Managing Active Promotions

- Promotions are automatically applied based on expiry dates
- Frontend automatically displays promotional pricing when active
- Original prices are preserved for comparison

## Error Handling

The system includes comprehensive error handling for:

- Invalid tier IDs
- Missing Stripe configuration
- Failed checkout session creation
- Webhook processing errors
- Network failures

### Common Error Scenarios

1. **Stripe Not Configured**
   ```json
   {
     "error": "Stripe not configured",
     "message": "Payment processing is not available in this environment"
   }
   ```

2. **Invalid Tier**
   ```json
   {
     "error": "Invalid tier",
     "details": "Pricing tier 'invalid-tier' not found"
   }
   ```

3. **Missing Price ID**
   ```json
   {
     "error": "Invalid billing cycle",
     "details": "Billing cycle 'yearly' not available for tier 'starter'"
   }
   ```

## Testing

### Manual Testing

1. Start the development server
2. Test pricing endpoints:
   ```bash
   curl http://localhost:8080/api/pricing/tiers
   ```

3. Test checkout creation:
   ```bash
   curl -X POST http://localhost:8080/api/payments/stripe/checkout-tier \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "test",
       "email": "test@example.com", 
       "name": "Test User",
       "tierId": "pro"
     }'
   ```

### Automated Testing

Run the paywall tests:
```bash
node test-paywall-final.js
```

## Security Considerations

1. **Environment Variables**: Store all sensitive Stripe keys in environment variables
2. **Webhook Verification**: Always verify Stripe webhook signatures in production
3. **Input Validation**: Validate all user inputs before processing
4. **Rate Limiting**: Implement rate limiting on pricing endpoints
5. **HTTPS**: Always use HTTPS in production for Stripe integration

## GitHub Environment Integration

### Setting Up Secrets

In your GitHub repository settings, add these secrets:

1. `STRIPE_SECRET_KEY` - Your Stripe secret key
2. `STRIPE_WEBHOOK_SECRET` - Your webhook endpoint secret
3. `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

### Environment-Specific Configuration

Use different Stripe accounts for different environments:
- **Development**: Test mode keys
- **Staging**: Test mode keys
- **Production**: Live mode keys

## Monitoring and Analytics

### Key Metrics to Track

1. **Conversion Rates**: Free to paid conversions by tier
2. **Revenue Per User**: Average revenue across tiers
3. **Churn Rates**: Subscription cancellation rates
4. **Feature Usage**: Feature adoption by tier

### Stripe Dashboard

Monitor these metrics in Stripe Dashboard:
- Subscription growth
- Revenue trends
- Failed payments
- Customer lifetime value

## Troubleshooting

### Common Issues

1. **Webhook Not Received**
   - Check webhook endpoint URL
   - Verify webhook secret
   - Check server logs for errors

2. **Checkout Session Creation Fails**
   - Verify Stripe keys are correct
   - Check price IDs exist in Stripe
   - Validate request payload

3. **Tier Detection Fails**
   - Ensure metadata is properly set in checkout session
   - Verify price ID mapping in configuration

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in environment variables.

## Future Enhancements

1. **Usage-Based Billing**: Implement metered billing for high-volume users
2. **Regional Pricing**: Support different pricing for different regions
3. **Custom Plans**: Allow enterprise customers to create custom plans
4. **A/B Testing**: Test different pricing strategies
5. **Analytics Dashboard**: Build internal analytics for pricing optimization

## Support

For technical support with Stripe integration:
1. Check Stripe documentation
2. Review server logs for errors
3. Test in Stripe's test mode first
4. Contact Stripe support for payment processing issues