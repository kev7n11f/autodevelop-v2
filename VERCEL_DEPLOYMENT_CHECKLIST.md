# 🚀 Vercel Deployment Checklist

## Critical Issues Fixed ✅

### 1. Missing Chat Route (CRITICAL)
- **Issue**: OpenAI API endpoint was returning 404
- **Root Cause**: Chat controller was imported but route wasn't defined
- **Fix Applied**: Added `router.post('/chat', chat);` to `/backend/routes/apiRoutes.js`
- **Status**: ✅ FIXED - Chat endpoint now accessible at `/api/chat`

## Required Environment Variables for Production

### 🔑 Essential for Basic Functionality
```bash
# Authentication (REQUIRED)
JWT_SECRET=your-secure-jwt-secret-minimum-64-characters-recommended
SESSION_SECRET=your-secure-session-secret-change-in-production

# OpenAI API (REQUIRED for AI chat functionality)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 💳 Payment Integration (Stripe)
```bash
# Stripe Configuration (REQUIRED for subscriptions)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Pricing Configuration
STRIPE_STARTER_PRICE_ID=price_starter_monthly_id
STRIPE_STARTER_YEARLY_PRICE_ID=price_starter_yearly_id
STRIPE_PRO_PRICE_ID=price_pro_monthly_id
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly_id
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_monthly_id
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_enterprise_yearly_id
STRIPE_DEFAULT_PRICE_ID=price_pro_monthly_id

# Stripe URLs
STRIPE_SUCCESS_URL=https://yourdomain.com/success
STRIPE_CANCEL_URL=https://yourdomain.com/cancel
STRIPE_PORTAL_RETURN_URL=https://yourdomain.com/account
```

### 📧 Email Service (SendGrid)
```bash
# SendGrid Email Service (OPTIONAL but recommended)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

### 🌐 CORS and URLs
```bash
# Frontend URL (for CORS and redirects)
FRONTEND_URL=https://yourdomain.com
```

### ⚙️ Optional Configuration
```bash
# Usage Limits
FREE_MESSAGE_LIMIT=20
FREE_MONTHLY_LIMIT=150

# Admin Access
ADMIN_KEY=your-admin-secret

# Environment
NODE_ENV=production
```

## Vercel Configuration Commands

### Set Environment Variables in Vercel
```bash
# Essential
vercel env add JWT_SECRET production
vercel env add SESSION_SECRET production
vercel env add OPENAI_API_KEY production

# Stripe (for payments)
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production

# Other optional
vercel env add SENDGRID_API_KEY production
vercel env add FRONTEND_URL production
```

## Testing Checklist

### ✅ Currently Working
- [x] **Authentication**: Register/Login endpoints functional
- [x] **Health Check**: Server health endpoints responding
- [x] **Database**: SQLite initialization working locally
- [x] **OpenAI API**: Chat endpoint accessible (proper error for invalid key)
- [x] **Pricing**: Pricing tiers endpoint working
- [x] **Error Handling**: Proper error responses when services not configured

### 🔄 Needs Valid API Keys
- [ ] **OpenAI Chat**: Needs valid `OPENAI_API_KEY`
- [ ] **Stripe Payments**: Needs valid Stripe keys
- [ ] **Email Notifications**: Needs valid `SENDGRID_API_KEY`

### 🚀 Production Deployment
- [ ] Set all required environment variables in Vercel
- [ ] Test with real API keys
- [ ] Verify Stripe webhook endpoint
- [ ] Test email functionality
- [ ] Monitor database in production

## Quick Deployment Steps

1. **Set Environment Variables**:
   ```bash
   vercel env add JWT_SECRET production
   vercel env add SESSION_SECRET production  
   vercel env add OPENAI_API_KEY production
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Test Endpoints**:
   - `/health` - Should return server status
   - `/api/auth/register` - User registration
   - `/api/chat` - AI chat (with valid OpenAI key)
   - `/api/pricing/tiers` - Pricing information

## Common Issues & Solutions

### Issue: "Server configuration error - Missing required environment variables"
**Solution**: Set JWT_SECRET, SESSION_SECRET, and OPENAI_API_KEY in Vercel dashboard

### Issue: "AI service is temporarily unavailable"
**Solution**: Set valid OPENAI_API_KEY in environment variables

### Issue: "Stripe not configured"
**Solution**: Set STRIPE_SECRET_KEY and related Stripe environment variables

### Issue: Database errors in production
**Solution**: SQLite uses /tmp in production - data is ephemeral but functional

## Security Recommendations

1. **Use strong secrets**: Generate cryptographically secure JWT_SECRET and SESSION_SECRET
2. **Rotate keys**: Regularly rotate API keys and secrets
3. **Environment separation**: Use different keys for development/staging/production
4. **Monitor logs**: Check Vercel function logs for errors
5. **Rate limiting**: Built-in rate limiting is configured

## Support

If deployment fails:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Test endpoints individually
4. Check this checklist for missing configuration

The core application architecture is solid - the main requirement is proper environment variable configuration for production deployment.