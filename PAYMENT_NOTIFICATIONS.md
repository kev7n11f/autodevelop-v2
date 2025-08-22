# Payment Notification System Documentation

## Overview

The Payment Notification System provides comprehensive email notifications for payment-related events, including successful payments, failed charges, and upcoming renewals. The system integrates seamlessly with the existing AutoDevelop.ai infrastructure and provides both backend processing and frontend user alerts.

## Features

### 📧 Email Notifications
- **Payment Success**: Confirmation emails with transaction details
- **Payment Failed**: Action-required emails with retry information
- **Renewal Reminders**: Proactive notifications before subscription renewals
- **Professional Templates**: Branded, mobile-responsive email designs

### 🖥️ Frontend Integration
- **Notification Bar**: Non-intrusive top-of-page notifications
- **Real-time Alerts**: Immediate display of payment status changes
- **User Controls**: Individual and bulk notification dismissal
- **Responsive Design**: Optimized for desktop and mobile devices

### 🔧 Backend Logic
- **Event Processing**: Webhook-compatible payment event handling
- **Database Integration**: Persistent storage of subscriptions and events
- **Notification Queue**: Reliable delivery with retry mechanisms
- **Admin Controls**: Manual notification processing and monitoring

## Database Schema

### Payment Subscriptions Table
```sql
CREATE TABLE payment_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK(plan_type IN ('basic', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start DATETIME NOT NULL,
  current_period_end DATETIME NOT NULL,
  next_billing_date DATETIME,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Payment Events Table
```sql
CREATE TABLE payment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  subscription_id INTEGER,
  event_type TEXT NOT NULL CHECK(event_type IN ('payment_success', 'payment_failed', 'renewal_upcoming', 'subscription_cancelled', 'trial_ending')),
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  transaction_id TEXT,
  failure_reason TEXT,
  metadata TEXT,
  processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notification_sent BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (subscription_id) REFERENCES payment_subscriptions(id)
);
```

## API Endpoints

### Subscription Management
```http
POST /api/payments/subscription
```
Create a new payment subscription.

**Request Body:**
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "planType": "pro",
  "amount": 29.99,
  "currency": "USD",
  "currentPeriodStart": "2025-01-15T00:00:00Z",
  "currentPeriodEnd": "2025-02-15T00:00:00Z",
  "nextBillingDate": "2025-02-15T00:00:00Z",
  "paymentMethod": "visa_ending_1234"
}
```

```http
GET /api/payments/subscription/:userId
```
Retrieve subscription details for a user.

### Payment Event Processing
```http
POST /api/payments/webhook
```
Process payment events (typically called by payment providers).

**Request Body:**
```json
{
  "userId": "user_123",
  "eventType": "payment_success",
  "amount": 29.99,
  "currency": "USD",
  "transactionId": "txn_abc123",
  "paymentMethod": "visa_ending_1234"
}
```

### Notification Management
```http
POST /api/payments/process-notifications
```
Process pending email notifications.

```http
POST /api/payments/check-renewals
```
Check for upcoming renewals and create reminder events.

## Email Templates

### Payment Success Email
- **Subject**: "Payment Successful - AutoDevelop.ai"
- **Content**: Transaction confirmation with details
- **CTA**: Access Dashboard

### Payment Failed Email
- **Subject**: "Payment Failed - Action Required - AutoDevelop.ai"
- **Content**: Failure reason and next steps
- **CTA**: Update Payment Method, Contact Support

### Renewal Reminder Email
- **Subject**: "Your AutoDevelop.ai subscription renews in X days"
- **Content**: Upcoming renewal details
- **CTA**: Manage Subscription, Cancel Subscription

## Frontend Components

### NotificationBar Component
Location: `frontend/src/components/NotificationBar.jsx`

**Features:**
- Auto-displays payment notifications
- Dismissible notifications
- Multiple notification types with different styling
- Mobile-responsive design
- Persistent dismissal state

**Usage:**
```jsx
import NotificationBar from './components/NotificationBar';

function App() {
  return (
    <div className="app">
      <NotificationBar />
      {/* Rest of app */}
    </div>
  );
}
```

### NotificationService
Location: `frontend/src/services/NotificationService.js`

**Features:**
- API integration for subscription management
- Mock notification generation for demos
- Persistent notification preferences
- Dismissal state management

## Integration Guide

### Setting Up Webhooks
Configure your payment provider to send webhooks to:
```
POST https://yourdomain.com/api/payments/webhook
```

### Environment Variables
```env
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Frontend Integration
1. Add NotificationBar to your main App component
2. Configure API base URL in NotificationService
3. Customize notification styles in NotificationBar.css

## Demo and Testing

### Running the Demo
```bash
# Start the development server
npm run dev

# In another terminal, run the demo script
node demo-payment-notifications.js
```

The demo script will:
1. Create sample subscriptions
2. Simulate payment events
3. Send email notifications
4. Show frontend integration

### Manual Testing
```bash
# Create a subscription
curl -X POST http://localhost:8080/api/payments/subscription \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "email": "test@example.com",
    "name": "Test User",
    "planType": "pro",
    "amount": 29.99,
    "currentPeriodStart": "2025-01-15T00:00:00Z",
    "currentPeriodEnd": "2025-02-15T00:00:00Z",
    "nextBillingDate": "2025-02-15T00:00:00Z"
  }'

# Simulate a payment success
curl -X POST http://localhost:8080/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "eventType": "payment_success",
    "amount": 29.99,
    "transactionId": "txn_test123"
  }'
```

## Security Considerations

- **Input Validation**: All payment data is validated before processing
- **Rate Limiting**: Uses existing security middleware
- **Data Sanitization**: Email content is sanitized to prevent XSS
- **Webhook Verification**: Implement signature verification for production webhooks

## Production Deployment

### Email Configuration
1. Set up SendGrid account and API key
2. Configure sender domain and authentication
3. Set up webhook endpoints with proper SSL

### Database Migration
The system automatically creates the required tables on startup. For production:
1. Review database migration scripts
2. Ensure proper backup procedures
3. Monitor database performance

### Monitoring
- Monitor email delivery rates
- Track notification processing times
- Set up alerts for failed payments
- Log payment event processing

## Troubleshooting

### Common Issues

**Emails not sending:**
- Check SENDGRID_API_KEY environment variable
- Verify sender email is authenticated in SendGrid
- Check logs for email service errors

**Notifications not appearing:**
- Verify NotificationBar is properly integrated
- Check browser console for JavaScript errors
- Ensure NotificationService API calls are successful

**Database errors:**
- Check database file permissions
- Verify table creation logs
- Ensure SQLite is properly installed

### Debug Commands
```bash
# Check database tables
sqlite3 backend/mailing_list.db ".tables"

# View recent payment events
sqlite3 backend/mailing_list.db "SELECT * FROM payment_events ORDER BY processed_at DESC LIMIT 10;"

# Check pending notifications
curl http://localhost:8080/api/payments/process-notifications -X POST
```

## Future Enhancements

- **Real-time WebSocket notifications**
- **Mobile push notifications**
- **Advanced email personalization**
- **Multi-language support**
- **Analytics and reporting dashboard**
- **Integration with additional payment providers**