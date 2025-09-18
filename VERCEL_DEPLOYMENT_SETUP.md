# 🚀 Vercel Deployment Setup Guide

This guide provides step-by-step instructions for deploying AutoDevelop.ai v2 to Vercel with guaranteed working subscriptions, sign up, and sign in functionality.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Vercel Account** (Hobby tier is sufficient)
2. **Stripe Account** with API keys
3. **OpenAI Account** with API key
4. **SendGrid Account** with API key (optional, for email notifications)

## 🔑 Required Environment Variables

### Step 1: Set up Stripe

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers > API Keys**
3. Copy your **Publishable Key** and **Secret Key**
4. Go to **Developers > Webhooks** and create a new webhook endpoint
5. Set the endpoint URL to: `https://yourdomain.vercel.app/api/payments/stripe/webhook`
6. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
7. Copy the **Webhook Secret**

### Step 2: Create Stripe Products and Prices

1. In Stripe Dashboard, go to **Products**
2. Create three products:
   - **Starter Plan** ($9.99/month)
   - **Pro Plan** ($19.99/month) 
   - **Enterprise Plan** ($49.99/month)
3. For each product, note the **Price ID** (starts with `price_`)

### Step 3: Configure Vercel Environment Variables

In your Vercel dashboard, go to **Settings > Environment Variables** and add:

#### 🔐 Required Stripe Configuration
```
STRIPE_SECRET_KEY=sk_live_... (your Stripe secret key)
STRIPE_PUBLISHABLE_KEY=pk_live_... (your Stripe publishable key)
STRIPE_WEBHOOK_SECRET=whsec_... (your webhook secret)
```

#### 🏷️ Required Stripe Price IDs
```
STRIPE_STARTER_PRICE_ID=price_... (your starter plan price ID)
STRIPE_PRO_PRICE_ID=price_... (your pro plan price ID)
STRIPE_ENTERPRISE_PRICE_ID=price_... (your enterprise plan price ID)
```

#### 🔗 Required URLs
```
FRONTEND_URL=https://yourdomain.vercel.app
STRIPE_SUCCESS_URL=https://yourdomain.vercel.app/success
STRIPE_CANCEL_URL=https://yourdomain.vercel.app/cancel
STRIPE_PORTAL_RETURN_URL=https://yourdomain.vercel.app/account
```

#### 🔒 Required Authentication
```
JWT_SECRET=your-secure-jwt-secret-minimum-64-characters-recommended
SESSION_SECRET=your-secure-session-secret-change-in-production
```

#### 🤖 Required AI Configuration
```
OPENAI_API_KEY=sk-... (your OpenAI API key)
```

#### 📧 Optional Email Configuration
```
SENDGRID_API_KEY=SG... (optional, for email notifications)
FROM_EMAIL=noreply@yourdomain.com
```

#### ⚙️ Optional Configuration
```
NODE_ENV=production
LOG_LEVEL=info
FREE_MESSAGE_LIMIT=20
FREE_MONTHLY_LIMIT=150
```

## 🚀 Deployment Steps

### 1. Fork or Clone Repository
```bash
git clone https://github.com/kev7n11f/autodevelop-v2.git
cd autodevelop-v2
```

### 2. Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your repository
4. Choose **"Framework Preset: Other"**
5. Set these build settings:
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install`

### 3. Add Environment Variables
1. In Vercel project settings, go to **Environment Variables**
2. Add all the environment variables listed above
3. Make sure to set them for **Production**, **Preview**, and **Development**

### 4. Deploy
1. Click **"Deploy"**
2. Wait for the build to complete
3. Your app will be available at `https://your-project.vercel.app`

## ✅ Testing Your Deployment

### 1. Test Authentication
1. Visit your deployed app
2. Click **"Sign Up"** or use the login modal
3. Create a new account with a valid email
4. Verify you can sign in and out

### 2. Test Subscription Flow
1. While signed in, try to use the chat feature extensively
2. You should be prompted to upgrade after hitting the free limit
3. Click on a subscription plan
4. Complete the Stripe checkout process
5. Verify your subscription is active

### 3. Test API Endpoints
Visit these URLs to test your API:
- `https://yourdomain.vercel.app/api/health` - Should show healthy status
- `https://yourdomain.vercel.app/api/pricing/tiers` - Should show pricing tiers

## 🔧 Troubleshooting

### Common Issues

#### 1. "Stripe not configured" Error
- **Solution**: Ensure `STRIPE_SECRET_KEY` is set in Vercel environment variables
- **Check**: Go to Vercel project settings > Environment Variables

#### 2. "OpenAI API not configured" Error  
- **Solution**: Ensure `OPENAI_API_KEY` is set in Vercel environment variables
- **Check**: Verify your OpenAI API key is valid and has credits

#### 3. Subscription Flow Not Working
- **Solution**: Check that all Stripe price IDs are correct
- **Check**: Ensure webhook endpoint is configured in Stripe dashboard

#### 4. Authentication Issues
- **Solution**: Verify `JWT_SECRET` and `SESSION_SECRET` are set
- **Check**: Ensure secrets are at least 32 characters long

### Debug Steps

1. **Check Vercel Function Logs**:
   - Go to Vercel dashboard > Functions
   - Click on function to see logs

2. **Test API Endpoints**:
   - Use curl or Postman to test endpoints
   - Check response status and error messages

3. **Verify Environment Variables**:
   - In Vercel dashboard, ensure all required vars are set
   - Check for typos in variable names

## 📞 Support

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/kev7n11f/autodevelop-v2/issues)
2. Review Vercel function logs for error details
3. Ensure all environment variables are correctly set
4. Verify your Stripe webhook is receiving events

## 🎉 Success!

Once deployed successfully, your AutoDevelop.ai v2 application will have:

- ✅ Working user registration and authentication
- ✅ Functional subscription system with Stripe
- ✅ AI chat functionality with usage limits
- ✅ Secure payment processing
- ✅ Email notifications (if SendGrid configured)
- ✅ Mobile-responsive interface

Your users can now sign up, subscribe, and enjoy the full AutoDevelop.ai experience!