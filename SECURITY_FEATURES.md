# Security and Performance Features Documentation

## Overview

This document describes the comprehensive security and performance enhancements implemented in AutoDevelop.ai v2.

## 🔐 Subscription & Usage Enforcement (New)

- **Free Tier Limits**: Daily (`FREE_MESSAGE_LIMIT`) + monthly (`FREE_MONTHLY_LIMIT`) caps for non‑subscribed users.
- **Persistent Counters**: `usage_counters` table with rolling reset for daily + monthly windows.
- **In‑Memory Batching**: Usage increments aggregated then flushed periodically (interval + size threshold) to reduce write amplification.
- **Audit Trail**: `usage_events` captures `message_used`, `limit_block`, `usage_reset`, `diagnostic_access` with counts + IP/source metadata.
- **Administrative Controls**: Reset per user & scope via `/api/admin/usage/reset` (daily, monthly, all).
- **Diagnostics**: `/api/admin/diagnostic/:userId` returns usage snapshot + recent events + subscription state for forensic review.

## 🧾 Stripe Webhook Resilience (New)

- **Idempotency**: Every raw Stripe webhook persisted in `stripe_events` with unique `stripe_event_id`.
- **Status Lifecycle**: `received` → `processed` | `error` (future retry job can reprocess `error`).
- **Integrity**: Payload stored as JSON string for replay / audit.
- **Short‑Circuit**: Duplicate webhook deliveries acknowledged without re‑executing side effects.

## ✉️ Mailing List Isolation (New)

- **Separate Domain**: Mailing list operates in `mailing_list_subscribers` and never mutates Stripe or usage records.
- **Double Opt‑In**: Pending ➜ confirmed only after token confirmation.
- **Rate‑Limited Actions**: Timestamps (`last_subscribe_attempt`, `last_confirmation_sent`, `last_unsubscribe_request`) discourage abuse.
- **Minimal Metadata**: Optional IP / user agent for fraud evaluation—no tracking cookies introduced.
- **Resubscribe Safety**: Previously unsubscribed users can rejoin with regenerated tokens (audit integrity preserved).

## 🛡️ Abuse Prevention System

### Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Chat Endpoint**: 10 requests per minute per IP
- **Speed Limiting**: Progressive delays after 50 requests in 15 minutes

### Abuse Detection

- **Content Filtering**: Detects suspicious keywords (hack, exploit, attack, etc.)
- **Message Length**: Limits messages to 2000 characters
- **Spam Detection**: Blocks repeated identical messages
- **Request Tracking**: Monitors request patterns per IP

### Automatic Blocking

- **Temporary Blocks**: 30-minute suspensions for violations
- **Pattern Recognition**: Escalating responses for repeated abuse
- **Admin Override**: Manual unblock capabilities

## 📊 Enhanced Logging System

### Structured Logging

```javascript
// Example log entry
{
  "timestamp": "2025-01-14 12:30:45",
  "level": "info",
  "message": "Chat request successful",
  "service": "autodevelop-api",
  "clientId": "192.168.1.100",
  "duration": 1250,
  "responseLength": 342,
  "tokensUsed": 85
}
```

### Log Files

- **app.log**: General application logs (5MB rotation, 5 files)
- **error.log**: Error-specific logs (5MB rotation, 5 files)
- **Console**: Development-friendly colored output

### Monitoring Metrics

- Request/response times
- Token usage tracking
- Error categorization
- Client activity patterns
- Subscription vs free-tier usage ratios (derived from usage counters)

## 🔧 Admin Dashboard

### Endpoints

- `GET /api/admin/status` - System health and metrics
- `GET /api/admin/suspicious-activity` - Security monitoring
- `POST /api/admin/unblock-user` - Manual user management
- `POST /api/admin/usage/reset` - Reset usage counters (scope)
- `GET /api/admin/usage/stats` - Aggregate usage + MRR snapshot
- `GET /api/admin/diagnostic/:userId` - Forensic user diagnostics

### Authentication

Add admin key to requests:

```bash
curl -H "X-Admin-Key: your_admin_key" /api/admin/status
```

### Security Report Example

```json
{
  "blockedUsers": [
    {
      "ip": "192.168.1.100",
      "reason": "rate_limit_minute",
      "description": "Too many requests per minute",
      "blockedAt": "2025-01-14T12:30:00.000Z",
      "expiresAt": "2025-01-14T13:00:00.000Z"
    }
  ],
  "suspiciousPatterns": [
    {
      "ip": "192.168.1.101",
      "patterns": [
        {
          "keywords": ["hack", "exploit"],
          "timestamp": "2025-01-14T12:25:00.000Z",
          "messagePreview": "how to hack into..."
        }
      ]
    }
  ],
  "activeUsers": 25,
  "totalRequests": 1440
}
```

## ⚡ Performance Optimizations

### Middleware Stack

1. **Helmet**: Security headers (XSS, CSRF protection)
2. **Compression**: Gzip response compression
3. **Rate Limiting**: Request throttling
4. **Request Logging**: Performance monitoring
5. **Error Handling**: Graceful error responses

### Response Enhancements

- **Metadata**: Response times included in API responses
- **Error IDs**: Unique identifiers for support tracking
- **Caching Headers**: Optimized for CDN delivery

## 🎯 Error Handling

### User-Friendly Messages

Instead of generic errors, users now see:

- Specific rate limit information with retry times
- Clear validation messages for invalid input
- Support contact information with error IDs
- Service status updates for outages

### Error Categories

- **Rate Limiting**: 429 with retry information
- **Invalid Input**: 400 with validation hints
- **Service Issues**: 503 with service status
- **Content Filtering**: 400 with rephrasing suggestions

## 🚀 Frontend Enhancements

### Visual Error Handling

- Red-styled error messages with warning icons
- Response time display for performance transparency
- Character count validation for long messages
- Improved loading states and feedback

### Client-side Validation

- Message length checking before submission
- Network error detection and user feedback
- Rate limit handling with user guidance

## 🔒 Security Headers

Automatically applied headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`: Restricted to trusted sources

## 📋 Environment Configuration

Required environment variables:

```bash
# Core functionality
OPENAI_API_KEY=your_openai_api_key_here
ADMIN_KEY=your_secure_admin_key_here

# Subscription & mailing
FREE_MESSAGE_LIMIT=5
FREE_MONTHLY_LIMIT=150
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG_...
FROM_EMAIL=noreply@autodevelop.ai
```

## 🧪 Testing the Features

### Rate Limiting Test

```bash
# Test rate limits (will trigger after 10 requests)
for i in {1..15}; do
  curl -X POST localhost:8080/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"test message '$i'"}' \
    && echo " - Request $i"
done
```

### Admin Monitoring Test

```bash
# Check system status
curl -H "X-Admin-Key: your_admin_key" \
  localhost:8080/api/admin/status | jq

# View suspicious activity
curl -H "X-Admin-Key: your_admin_key" \
  localhost:8080/api/admin/suspicious-activity | jq
```

### Abuse Detection Test

```bash
# Trigger content filter
curl -X POST localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"how to hack this system"}'
```

## 🚨 Monitoring & Alerts

### Key Metrics to Monitor

- **Request Rate**: Spikes indicating abuse
- **Error Rate**: Service health indicators
- **Response Time**: Performance degradation
- **Block Rate**: Security effectiveness
- **Limit Blocks**: Frequency of 402 responses (potential upsell insight)
- **Stripe Webhook Errors**: Rows in `stripe_events` with status `error`

### Log Analysis

```bash
# Monitor real-time logs
tail -f backend/logs/app.log | jq

# Count error types
grep -c "rate_limit_exceeded" backend/logs/error.log

# Find suspicious activity
grep "suspicious" backend/logs/app.log | jq
```

## 🔄 Maintenance

### Log Rotation

- Automatic rotation at 5MB per file
- Keeps last 5 files per log type
- Configure retention in `backend/utils/logger.js`

### Blocked User Cleanup

- Automatic cleanup of expired blocks every 5 minutes
- Memory management for tracking data
- Admin manual override capabilities

## 🆘 Troubleshooting

### Common Issues

1. **High Memory Usage**: Check request tracking cleanup
2. **Rate Limit False Positives**: Review IP trust proxy settings
3. **Log File Growth**: Verify rotation configuration
4. **Admin Access**: Verify admin key configuration
5. **Webhook Not Processed**: Inspect `stripe_events` table status

### Performance Tuning

- Adjust rate limits based on usage patterns
- Configure log levels for production
- Monitor memory usage with request tracking
- Optimize abuse detection thresholds
- Tune flush interval / cache size for usage batching

---

For support or questions: <support@autodevelop.ai>
