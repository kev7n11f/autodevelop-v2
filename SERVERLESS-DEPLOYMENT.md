# 🚀 Serverless Deployment Guide

This guide will help you deploy the autodevelop-v2 serverless authentication and billing system to AWS Lambda.

## 📋 Pre-Deployment Checklist

### ✅ Required Accounts & Services

- [ ] AWS Account with CLI configured
- [ ] Stripe Account with products and prices configured
- [ ] OpenAI API Key for chat functionality
- [ ] Domain/subdomain for production deployment

### ✅ Environment Configuration

Create a `.env` file with the following required variables:

```env
# Authentication (Required)
JWT_SECRET=your-secure-64-character-jwt-secret-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# AWS Configuration (Required for AWS deployment)
AWS_REGION=us-east-1
DYNAMODB_TABLE_USERS=autodevelop-v2-prod-users
DYNAMODB_TABLE_SESSIONS=autodevelop-v2-prod-sessions
DYNAMODB_TABLE_SUBSCRIPTIONS=autodevelop-v2-prod-subscriptions

# Stripe Configuration (Required)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# OpenAI (Required for chat)
OPENAI_API_KEY=sk-...

# Frontend URL (Required)
FRONTEND_URL=https://yourdomain.com
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure AWS CLI

```bash
aws configure
# OR set environment variables:
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

### 3. Set Up Stripe Products

1. **Create Products in Stripe Dashboard:**
   - Starter Plan ($9.99/month)
   - Pro Plan ($19.99/month)
   - Enterprise Plan ($49.99/month)

2. **Copy Price IDs** to your environment variables

3. **Create Webhook Endpoint:**
   - URL: `https://your-api-gateway-url/payments/stripe/webhook`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`

### 4. Generate Secure Secrets

```bash
# Generate JWT secret (64 characters)
openssl rand -hex 32

# Generate session secret (32 characters)
openssl rand -hex 16
```

## 🚀 Deployment Steps

### Development Deployment

```bash
# Deploy to development environment
npm run deploy:dev
```

### Production Deployment

```bash
# Deploy to production environment
npm run deploy:prod
```

### Alternative: Vercel Deployment

If you prefer Vercel over AWS Lambda:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables** in Vercel Dashboard

## 🧪 Post-Deployment Testing

### 1. Health Check

```bash
curl https://your-api-gateway-url/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T12:00:00.000Z",
  "version": "2.0.0-serverless",
  "environment": {
    "nodeEnv": "production",
    "hasOpenAI": true,
    "hasStripe": true,
    "stage": "prod"
  },
  "services": {
    "database": "healthy",
    "databaseType": "DynamoDB"
  }
}
```

### 2. Authentication Flow Test

```bash
# Register new user
curl -X POST https://your-api-gateway-url/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'

# Login
curl -X POST https://your-api-gateway-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### 3. Payment Flow Test

```bash
# Get pricing tiers
curl https://your-api-gateway-url/payments/tiers

# Create checkout session (requires authentication)
curl -X POST https://your-api-gateway-url/payments/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user-id",
    "email": "test@example.com",
    "name": "Test User",
    "tierId": "pro",
    "billingCycle": "monthly"
  }'
```

### 4. Stripe Webhook Test

```bash
# Test with Stripe CLI
stripe listen --forward-to https://your-api-gateway-url/payments/stripe/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

## 📊 Monitoring & Logging

### CloudWatch Logs

Monitor your Lambda functions in AWS CloudWatch:

1. Go to AWS CloudWatch Console
2. Navigate to Log Groups
3. Look for `/aws/lambda/autodevelop-v2-{stage}-{function-name}`

### Key Metrics to Monitor

- **Function Duration**: Should be < 5 seconds for most requests
- **Error Rate**: Should be < 1%
- **Database Response Time**: Should be < 500ms
- **Memory Usage**: Monitor for potential memory leaks

### Alarms to Set Up

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "AutoDevelop-High-Error-Rate" \
  --alarm-description "Lambda function error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold

# High duration alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "AutoDevelop-High-Duration" \
  --alarm-description "Lambda function duration > 10 seconds" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 10000 \
  --comparison-operator GreaterThanThreshold
```

## 🔒 Security Checklist

### Authentication Security

- [ ] JWT secret is 64+ characters and cryptographically random
- [ ] Token expiration is set appropriately (15m for access, 7d for refresh)
- [ ] All passwords are hashed with Argon2
- [ ] Input validation is enabled on all endpoints
- [ ] Rate limiting is configured for free users

### Database Security

- [ ] DynamoDB tables have least-privilege IAM policies
- [ ] Session TTL is configured for automatic cleanup
- [ ] Sensitive data is not logged

### API Security

- [ ] CORS is configured properly for your domain
- [ ] All endpoints validate input with Joi schemas
- [ ] Error messages don't expose sensitive information
- [ ] Webhook signatures are verified

### Infrastructure Security

- [ ] AWS credentials follow least-privilege principle
- [ ] Environment variables are encrypted at rest
- [ ] API Gateway has throttling enabled
- [ ] CloudTrail is enabled for auditing

## 🔄 Rollback Procedures

### AWS Lambda Rollback

```bash
# List previous versions
aws lambda list-versions-by-function --function-name autodevelop-v2-prod-auth

# Rollback to previous version
aws lambda update-alias \
  --function-name autodevelop-v2-prod-auth \
  --name LIVE \
  --function-version 2
```

### Database Rollback

- DynamoDB tables maintain point-in-time recovery
- Enable backup policies for critical data
- Test restore procedures regularly

## 📞 Troubleshooting

### Common Issues

1. **Cold Start Latency**
   - Solution: Use provisioned concurrency for critical functions

2. **Database Connection Errors**
   - Check IAM permissions
   - Verify table names in environment variables

3. **Stripe Webhook Failures**
   - Verify webhook secret is correct
   - Check endpoint URL is publicly accessible

4. **JWT Token Issues**
   - Ensure JWT secret is consistent across deployments
   - Check token expiration settings

### Debug Commands

```bash
# Check function logs
aws logs tail /aws/lambda/autodevelop-v2-prod-auth --follow

# Test function locally
serverless invoke local --function auth --path test-events/auth-register.json

# Check DynamoDB table status
aws dynamodb describe-table --table-name autodevelop-v2-prod-users
```

## 📈 Scaling Considerations

### Performance Optimization

- **Lambda Memory**: Start with 512MB, adjust based on metrics
- **DynamoDB Capacity**: Use on-demand billing for variable workloads
- **API Gateway Caching**: Enable for read-heavy endpoints

### Cost Optimization

- **Reserved Capacity**: For predictable workloads
- **Compression**: Enable gzip compression
- **Dead Letter Queues**: For failed webhook processing

---

**🎉 Congratulations!** Your serverless authentication and billing system is now deployed and ready for production use.