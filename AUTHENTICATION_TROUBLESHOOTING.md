# Authentication & Subscription Troubleshooting Guide

## Overview
This guide helps developers debug and maintain the authentication and subscription flows in AutoDevelop.ai v2.

## Common Issues and Solutions

### 1. "demo@autodevelop.ai" Used Instead of User Email

**Symptoms:**
- Stripe checkout sessions created with `demo@autodevelop.ai` instead of actual user email
- Subscription notifications sent to wrong email address

**Root Cause:**
Authentication system didn't store user data in localStorage, but subscription/upgrade components expected it there.

**Solution (Fixed):**
- `AuthContext.jsx` now automatically stores user data in localStorage after authentication
- Upgrade utilities check authentication status before proceeding
- Users are prompted to sign in if not authenticated

**Verification:**
```bash
# Run the authentication test suite
npm run test:auth

# Check localStorage after login (in browser dev tools)
localStorage.getItem('userEmail') // Should be actual user email, not demo email
```

### 2. Authentication Flows Not Working

**Symptoms:**
- Users can't register or sign in
- "Network error or server unavailable" messages
- Login attempts fail unexpectedly

**Debugging Steps:**

1. **Check Server Status:**
```bash
# Run health check
curl http://localhost:8080/api/health

# Expected response: 200 OK with server status
```

2. **Verify Environment Variables:**
```bash
# Check required auth variables are set
npm run validate:env

# Required for auth:
# JWT_SECRET, SESSION_SECRET
```

3. **Test Authentication Endpoints:**
```bash
# Test registration
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

### 3. Stripe Integration Issues

**Symptoms:**
- "Payment processing unavailable" messages
- Stripe checkout fails to create sessions
- "Network error. Please try again" on upgrade button

**Common Causes & Solutions:**

1. **Demo API Keys:**
   - **Symptom:** `Payment processor authentication failed`
   - **Cause:** Using demo Stripe keys from `.env.demo`
   - **Solution:** Replace with real Stripe keys in production

2. **Missing Price IDs:**
   - **Symptom:** `Price ID not configured`
   - **Cause:** Stripe price IDs not set for tiers
   - **Solution:** Set `STRIPE_*_PRICE_ID` environment variables

3. **Missing Redirect URLs:**
   - **Symptom:** `Stripe URLs not configured`
   - **Cause:** Success/cancel URLs not set
   - **Solution:** Set `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL`

**Verification:**
```bash
# Check Stripe configuration
curl http://localhost:8080/api/pricing/tiers

# Should return tier data with Stripe price IDs
```

### 4. User Data Not Persisting

**Symptoms:**
- User logged out after page refresh
- localStorage shows null/undefined user data
- Authentication state inconsistent

**Debugging:**

1. **Check Authentication State:**
```javascript
// In browser console after login
console.log({
  userId: localStorage.getItem('userId'),
  userEmail: localStorage.getItem('userEmail'),
  userName: localStorage.getItem('userName')
});
```

2. **Verify Auth Context:**
```javascript
// Check if AuthContext is properly initialized
// Should show user data after successful login
```

**Solution:**
The fix implemented ensures localStorage is automatically synced with authentication state.

## Development Testing

### Run Complete Test Suite
```bash
# Test authentication, subscription, and system health
npm run test:auth
```

### Manual Testing Checklist

1. **User Registration:**
   - [ ] Can register with valid email/password
   - [ ] Validation works for invalid inputs
   - [ ] Duplicate emails are rejected
   - [ ] User data stored in localStorage after registration

2. **User Login:**
   - [ ] Can login with valid credentials
   - [ ] Invalid credentials are rejected
   - [ ] User data stored in localStorage after login
   - [ ] Authentication persists across page reloads

3. **Subscription Flow:**
   - [ ] Unauthenticated users prompted to sign in
   - [ ] Authenticated users can access upgrade
   - [ ] Actual user email used (not demo email)
   - [ ] Error handling works for Stripe issues

### Environment Setup for Testing

1. **Demo Environment:**
```bash
# Copy demo environment for local testing
cp .env.demo .env
npm run dev
```

2. **Production Testing:**
   - Replace demo keys with real API keys
   - Test with actual Stripe account
   - Verify email notifications work

## Production Deployment

### Required Environment Variables
```bash
# Authentication (required)
JWT_SECRET=your-secure-jwt-secret-minimum-64-characters
SESSION_SECRET=your-secure-session-secret

# Stripe (required for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_*_PRICE_ID=price_...

# URLs (required)
FRONTEND_URL=https://yourdomain.com
STRIPE_SUCCESS_URL=https://yourdomain.com/success
STRIPE_CANCEL_URL=https://yourdomain.com/cancel
```

### Monitoring

1. **Authentication Success Rate:**
   - Monitor registration/login success rates
   - Check for unusual authentication failures

2. **Subscription Metrics:**
   - Track checkout session creation success
   - Monitor email accuracy in subscriptions
   - Check for demo email usage in production

3. **Error Monitoring:**
   - Set up alerts for authentication failures
   - Monitor Stripe webhook processing
   - Track API response times

## Support and Maintenance

### Log Analysis
```bash
# Check authentication logs
tail -f backend/logs/app.log | grep "auth"

# Check payment logs
tail -f backend/logs/app.log | grep "payment"
```

### Database Health
```bash
# Check user data
sqlite3 backend/mailing_list.db "SELECT COUNT(*) FROM users;"

# Check subscriptions
sqlite3 backend/mailing_list.db "SELECT COUNT(*) FROM payment_subscriptions;"
```

### Common Maintenance Tasks

1. **Clear Test Data:**
```sql
-- Remove test users (be careful in production!)
DELETE FROM users WHERE email LIKE '%test%@example.com';
```

2. **Verify User Data Integrity:**
```sql
-- Check for users without required fields
SELECT * FROM users WHERE email IS NULL OR name IS NULL;
```

3. **Monitor Authentication Sessions:**
```sql
-- Check active sessions
SELECT COUNT(*) FROM user_sessions WHERE expires_at > datetime('now');
```

## Contact

For issues not covered in this guide:
- Check GitHub issues for similar problems
- Review server logs for detailed error messages
- Contact the development team with specific error details and reproduction steps