# GitHub Environments Setup for Stripe Integration

## Overview

This guide explains how to set up GitHub Environments to securely manage Stripe API keys and configuration for different deployment stages (development, staging, production).

## Why Use GitHub Environments?

- **Security**: API keys are encrypted and only accessible during workflow runs
- **Environment Isolation**: Different Stripe accounts for dev/staging/production
- **Access Control**: Restrict who can deploy to production environments
- **Audit Trail**: Track when and who modified environment variables

## Setting Up GitHub Environments

### 1. Create Environments

1. Go to your GitHub repository
2. Navigate to **Settings** → **Environments**
3. Click **New environment**
4. Create these environments:
   - `development`
   - `staging` 
   - `production`

### 2. Configure Environment Protection Rules

For the **production** environment:
- ✅ **Required reviewers**: Add team members who must approve deployments
- ✅ **Wait timer**: Optional delay before deployment
- ✅ **Deployment branches**: Restrict to `main` branch only

### 3. Add Environment Secrets

For each environment, add the following secrets:

#### Core Stripe Configuration
```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Pricing Configuration
```
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_STARTER_YEARLY_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_...
STRIPE_DEFAULT_PRICE_ID=price_... (usually the Pro monthly price)
```

#### Other Configuration
```
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG...
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-secure-session-secret
```

### 4. Environment Variables (Non-Secret)

For public configuration that varies by environment, use **Environment Variables**:

```
STRIPE_SUCCESS_URL=https://your-domain.com/success
STRIPE_CANCEL_URL=https://your-domain.com/cancel  
STRIPE_PORTAL_RETURN_URL=https://your-domain.com/account
FRONTEND_URL=https://your-domain.com
NODE_ENV=production
```

## Stripe Account Setup by Environment

### Development Environment
- Use Stripe **Test Mode**
- Create test products and prices
- Use test webhooks (ngrok for local development)
- Test payment flows with test cards

### Staging Environment  
- Use Stripe **Test Mode**
- Mirror production pricing structure
- Test complete user flows
- Validate webhook integrations

### Production Environment
- Use Stripe **Live Mode**
- Real products with real pricing
- Production webhook endpoints
- Monitor with Stripe Dashboard

## Example Stripe Setup

### 1. Create Products in Stripe Dashboard

**Development/Staging (Test Mode):**
```bash
# Create products
stripe products create --name "AutoDevelop Starter" --description "Perfect for individual developers"
stripe products create --name "AutoDevelop Pro" --description "Ideal for professional developers"  
stripe products create --name "AutoDevelop Enterprise" --description "For large teams"

# Create prices
stripe prices create --product prod_test_starter --unit-amount 999 --currency usd --recurring interval=month
stripe prices create --product prod_test_pro --unit-amount 1999 --currency usd --recurring interval=month
stripe prices create --product prod_test_enterprise --unit-amount 4999 --currency usd --recurring interval=month
```

**Production (Live Mode):**
```bash
# Switch to live mode first
stripe config --configure
# Then create live products and prices with same structure
```

### 2. Webhook Configuration

Create webhook endpoints for each environment:

**Development:**
- URL: `https://your-ngrok-url.ngrok.io/api/payments/webhook`
- Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`

**Staging:**
- URL: `https://staging.yourdomain.com/api/payments/webhook`
- Same events as development

**Production:**
- URL: `https://yourdomain.com/api/payments/webhook`
- Same events as development

## Workflow Configuration

### Example GitHub Actions Workflow

```yaml
name: Deploy to Environment

on:
  push:
    branches: [ main, staging, develop ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || github.ref == 'refs/heads/staging' && 'staging' || 'development' }}
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy with environment-specific config
      env:
        STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
        STRIPE_PRO_PRICE_ID: ${{ secrets.STRIPE_PRO_PRICE_ID }}
        STRIPE_SUCCESS_URL: ${{ vars.STRIPE_SUCCESS_URL }}
      run: |
        echo "Deploying to ${{ github.environment }}"
        # Your deployment commands here
```

## Security Best Practices

### 1. API Key Management
- ✅ Never commit API keys to code
- ✅ Use different Stripe accounts for test/live
- ✅ Rotate keys regularly
- ✅ Monitor API key usage in Stripe Dashboard

### 2. Webhook Security
- ✅ Always verify webhook signatures
- ✅ Use HTTPS endpoints only
- ✅ Implement idempotency for webhook processing
- ✅ Monitor webhook delivery success rates

### 3. Environment Isolation
- ✅ Separate databases for each environment
- ✅ Different domain names (dev.domain.com, staging.domain.com)
- ✅ Isolated logging and monitoring
- ✅ Regular security audits

## Monitoring and Maintenance

### 1. Stripe Dashboard Monitoring
- Track subscription metrics
- Monitor failed payments
- Review webhook delivery logs
- Analyze revenue trends

### 2. Application Monitoring
- Log all Stripe API interactions
- Monitor webhook processing success
- Track pricing tier conversion rates
- Alert on payment failures

### 3. Regular Maintenance
- Review and update pricing strategies
- Test payment flows regularly
- Update Stripe SDK versions
- Audit environment configurations

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Fails**
   - Check webhook secret is correct for environment
   - Ensure raw body is used for signature verification
   - Verify webhook endpoint URL is accessible

2. **Price ID Not Found**
   - Confirm price exists in correct Stripe account (test vs live)
   - Check environment variable is set correctly
   - Verify price is active in Stripe Dashboard

3. **Environment Variables Not Loading**
   - Check environment name matches GitHub Environment exactly
   - Verify secrets are set in correct environment
   - Ensure workflow has access to environment

### Debug Commands

```bash
# Test pricing endpoint
curl -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
  https://api.stripe.com/v1/prices

# Test webhook endpoint
curl -X POST localhost:8080/api/pricing/tiers \
  -H "Content-Type: application/json"

# Validate environment variables
node -e "console.log(process.env.STRIPE_SECRET_KEY ? 'Stripe configured' : 'Stripe missing')"
```

## Migration Guide

### Moving from Basic to Tier-Based Pricing

1. **Create new products/prices in Stripe**
2. **Update environment variables**
3. **Deploy tier-based pricing system**
4. **Migrate existing subscriptions** (if needed)
5. **Update frontend to show new pricing**
6. **Monitor conversion metrics**

This setup ensures secure, scalable, and maintainable Stripe integration across all your deployment environments.