# 📋 Quick Start Guide: Production-Ready Deployment

This guide gets you from zero to production-ready deployment with working Stripe subscriptions and authentication.

## 🚀 One-Command Setup

```bash
# 1. Set up for production deployment
node setup-production-deployment.js

# 2. Validate your environment variables
node validate-environment.js

# 3. Test your deployment
node test-production-ready.js https://your-domain.vercel.app
```

## 🔧 Environment Variables Required

### Generate Secrets First
```bash
# Generate secure JWT and session secrets
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for SESSION_SECRET
```

### Set in Vercel Dashboard
```bash
# Essential for authentication
vercel env add JWT_SECRET production
vercel env add SESSION_SECRET production

# Required for payments
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_DEFAULT_PRICE_ID production

# URLs
vercel env add FRONTEND_URL production
vercel env add STRIPE_SUCCESS_URL production
vercel env add STRIPE_CANCEL_URL production

# Optional but recommended
vercel env add OPENAI_API_KEY production
vercel env add SENDGRID_API_KEY production
```

## 💳 Stripe Setup

1. **Create Products** in Stripe Dashboard:
   - Starter: $9.99/month, $99.99/year
   - Pro: $19.99/month, $199.99/year  
   - Enterprise: $49.99/month, $499.99/year

2. **Set up Webhook**:
   - URL: `https://yourdomain.com/api/payments/stripe/webhook`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`

3. **Copy Price IDs** to environment variables

## 🧪 Testing

### Test Cards
- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **3D Secure**: `4000002500003155`

### Run Tests
```bash
# Test everything
node test-production-ready.js

# Expected: 90%+ success rate
# Authentication requires full backend deployment
```

## 🎯 Deployment Types

### Simple API (Current)
- ✅ Payments working
- ✅ Chat working
- ❌ No authentication
- Best for: Payment processing only

### Full Backend (Recommended)
- ✅ Complete authentication
- ✅ User management
- ✅ Payments working
- ✅ Session management
- Best for: Complete application

**Upgrade to full backend**: Run `node setup-production-deployment.js`

## 📚 Complete Documentation

- **PRODUCTION_READY_CHECKLIST.md** - Comprehensive guide
- **validate-environment.js** - Environment validation
- **test-production-ready.js** - Deployment testing
- **setup-production-deployment.js** - Automated setup

## ✅ Success Checklist

- [ ] Environment variables set
- [ ] Stripe products created
- [ ] Webhook configured
- [ ] Tests passing (90%+)
- [ ] Deploy: `vercel --prod`

**🎉 You're production-ready when all tests pass!**