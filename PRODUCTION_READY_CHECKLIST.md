# 🚀 Production-Ready Checklist: Stripe Subscriptions & Authentication

This comprehensive checklist guarantees working Stripe subscriptions, user sign up, and sign in flows for autodevelop-v2 on a hobbyist Vercel account.

## 📋 Pre-Deployment Checklist

### 🔑 Required Environment Variables

#### Critical Authentication Variables
```bash
# Generate strong 64-character secrets for production
JWT_SECRET=your-crypto-secure-64-character-jwt-secret-here-use-openssl-rand-hex-32
SESSION_SECRET=your-crypto-secure-64-character-session-secret-here-use-openssl-rand-hex-32

# OpenAI API (Required for AI functionality)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

#### Stripe Configuration (Required for Payments)
```bash
# Live Stripe Keys (Use Test Keys for Testing)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (Create these in Stripe Dashboard)
STRIPE_STARTER_PRICE_ID=price_starter_monthly_id
STRIPE_STARTER_YEARLY_PRICE_ID=price_starter_yearly_id
STRIPE_PRO_PRICE_ID=price_pro_monthly_id
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly_id
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_monthly_id
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_enterprise_yearly_id
STRIPE_DEFAULT_PRICE_ID=price_pro_monthly_id

# Stripe URLs (Replace with your domain)
STRIPE_SUCCESS_URL=https://yourdomain.com/success
STRIPE_CANCEL_URL=https://yourdomain.com/cancel
STRIPE_PORTAL_RETURN_URL=https://yourdomain.com/account
```

#### Additional Configuration
```bash
# Production URL Configuration
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production

# Email Service (Optional but recommended)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# Security & Admin
ADMIN_KEY=your-admin-secret-key

# Usage Limits (Optional)
FREE_MESSAGE_LIMIT=5
FREE_MONTHLY_LIMIT=150
```

## ⚙️ Environment Setup Instructions

### Step 1: Generate Secure Secrets
```bash
# Generate JWT_SECRET (64 characters)
openssl rand -hex 32

# Generate SESSION_SECRET (64 characters) 
openssl rand -hex 32
```

### Step 2: Set Variables in Vercel Dashboard
```bash
# Critical variables
vercel env add JWT_SECRET production
vercel env add SESSION_SECRET production
vercel env add OPENAI_API_KEY production

# Stripe configuration
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_DEFAULT_PRICE_ID production

# URL configuration
vercel env add FRONTEND_URL production
vercel env add STRIPE_SUCCESS_URL production
vercel env add STRIPE_CANCEL_URL production
vercel env add STRIPE_PORTAL_RETURN_URL production

# Optional services
vercel env add SENDGRID_API_KEY production
vercel env add ADMIN_KEY production
```

### Step 3: Stripe Setup in Dashboard

#### Create Products and Prices
1. **Starter Plan**
   - Monthly: $9.99/month
   - Yearly: $99.99/year (17% discount)

2. **Pro Plan**
   - Monthly: $19.99/month  
   - Yearly: $199.99/year (17% discount)

3. **Enterprise Plan**
   - Monthly: $49.99/month
   - Yearly: $499.99/year (17% discount)

#### Configure Webhooks
1. Create webhook endpoint: `https://yourdomain.com/api/payments/stripe/webhook`
2. Enable events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## 🧪 Testing Checklist

### Pre-Deployment Testing
- [ ] **Build Success**: `npm run build` completes without errors
- [ ] **Environment Check**: All required variables configured
- [ ] **Stripe Dashboard**: Products and webhooks configured

### Authentication Flow Tests
- [ ] **User Registration**: POST `/api/auth/register`
  ```bash
  curl -X POST https://yourdomain.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"TestPass123","name":"Test User"}'
  ```

- [ ] **User Login**: POST `/api/auth/login`
  ```bash
  curl -X POST https://yourdomain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"TestPass123"}'
  ```

- [ ] **Auth Status**: GET `/api/auth/status`
- [ ] **Logout**: POST `/api/auth/logout`
- [ ] **Token Refresh**: POST `/api/auth/refresh`

### Payment Flow Tests
- [ ] **Health Check**: GET `/api/health`
- [ ] **Pricing Tiers**: GET `/api/pricing/tiers`
- [ ] **Checkout Session**: POST `/api/payments/stripe/checkout-tier`
  ```bash
  curl -X POST https://yourdomain.com/api/payments/stripe/checkout-tier \
    -H "Content-Type: application/json" \
    -d '{"userId":"test-user","email":"test@example.com","name":"Test User","tierId":"pro","billingCycle":"monthly"}'
  ```

- [ ] **Webhook Processing**: Test with Stripe CLI
  ```bash
  stripe listen --forward-to https://yourdomain.com/api/payments/stripe/webhook
  ```

### End-to-End Testing
- [ ] **Complete Purchase**: Use Stripe test cards
  - Test Card: `4242424242424242`
  - Expiry: Any future date
  - CVC: Any 3 digits

- [ ] **Subscription Management**: Access billing portal
- [ ] **Webhook Verification**: Check payment processing
- [ ] **Email Notifications**: Verify SendGrid integration

## 🚀 Deployment Process

### 1. Pre-Deployment Validation
```bash
# Run the comprehensive test
node test-upgrade-complete.js

# Expected output: All tests should pass
# ✅ All core functionality is working correctly!
```

### 2. Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Monitor deployment
vercel logs --app=your-app-name
```

### 3. Post-Deployment Verification
```bash
# Run system verification
node verify-deployment.js

# Expected: All routes should return 200 status
```

### 4. Security Verification
- [ ] **HTTPS**: All pages load over HTTPS
- [ ] **Security Headers**: X-Frame-Options, CSP, etc.
- [ ] **Cookie Security**: HttpOnly, Secure flags set
- [ ] **CORS**: Proper origin restrictions

## 🔒 Security Best Practices

### Environment Security
- [ ] **Strong Secrets**: 64+ character random strings
- [ ] **Key Rotation**: Regular rotation schedule
- [ ] **Access Control**: Limited admin access
- [ ] **Monitoring**: Log analysis for suspicious activity

### Application Security
- [ ] **Input Validation**: All user inputs sanitized
- [ ] **Rate Limiting**: Protection against abuse
- [ ] **SQL Injection**: Parameterized queries
- [ ] **XSS Protection**: Content Security Policy

## 🚨 Troubleshooting Guide

### Common Issues

#### "Server configuration error - Missing required environment variables"
**Solution**: Verify JWT_SECRET and SESSION_SECRET are set in Vercel

#### "Stripe not configured"
**Solution**: Check STRIPE_SECRET_KEY is valid and set

#### "AI service is temporarily unavailable"
**Solution**: Verify OPENAI_API_KEY is valid

#### "Webhook signature verification failed"
**Solution**: Ensure STRIPE_WEBHOOK_SECRET matches Stripe dashboard

#### Database errors in production
**Solution**: SQLite uses /tmp in production (ephemeral but functional)

### Error Monitoring
- [ ] **Vercel Logs**: Monitor function execution logs
- [ ] **Error Tracking**: Set up error reporting
- [ ] **Performance**: Monitor response times
- [ ] **Uptime**: Set up status monitoring

## ✅ Production Readiness Verification

### Final Checklist
- [ ] All environment variables configured
- [ ] Stripe products and webhooks set up
- [ ] Authentication flows tested
- [ ] Payment flows tested
- [ ] Security headers implemented
- [ ] Error handling verified
- [ ] Monitoring configured
- [ ] Documentation updated

### Success Criteria
1. ✅ Users can register and login
2. ✅ JWT tokens work correctly
3. ✅ Stripe checkout creates sessions
4. ✅ Webhooks process payments
5. ✅ Subscriptions are created
6. ✅ Error handling works
7. ✅ Security measures active

## 📞 Support & Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **OpenAI API**: https://platform.openai.com/docs
- **SendGrid API**: https://docs.sendgrid.com

---

**🎉 Once all items are checked, your autodevelop-v2 application is production-ready with working Stripe subscriptions and authentication!**