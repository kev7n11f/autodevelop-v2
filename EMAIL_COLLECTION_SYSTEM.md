# Email Collection System Documentation

## Overview

The AutoDevelop.ai email collection system allows you to build and manage a mailing list for updates, news, and feature announcements. The system includes a responsive modal interface, secure backend API, email confirmation flow, and GDPR compliance features.

## Features

- **Auto-displaying modal** for first-time visitors (after 3 seconds)
- **Manual triggers** via "Get Updates" and "Subscribe to Updates" buttons
- **Email validation** and input sanitization
- **Opt-in consent** requirement with privacy policy link
- **Duplicate email prevention** with user-friendly error messages
- **Email confirmation** flow with SendGrid integration
- **GDPR compliance** including data deletion endpoint
- **SQLite database** for subscriber storage
- **Security measures** including rate limiting and input validation

## Setup Instructions

### 1. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Required for email functionality
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@autodevelop.ai

# Optional - defaults to frontend URL
FRONTEND_URL=https://your-domain.com

# Required for admin functionality  
ADMIN_KEY=your_secure_admin_key_here
```

### 2. SendGrid Setup

1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key with full access permissions
3. Verify your sender email address/domain
4. Add the API key to your environment variables

### 3. Database

The system uses SQLite for simplicity. The database file (`backend/mailing_list.db`) will be created automatically when the server starts. It's already added to `.gitignore`.

## API Endpoints

### Subscribe to Mailing List
```
POST /api/mailing-list/subscribe
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "optIn": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription successful! Please check your email to confirm.",
  "details": "A confirmation email has been sent to your email address"
}
```

### Confirm Email Subscription
```
GET /api/mailing-list/confirm/:token
```
Redirects to frontend with confirmation status.

### Unsubscribe
```
GET /api/mailing-list/unsubscribe/:token
```
Redirects to frontend with unsubscribe confirmation.

### Delete User Data (GDPR)
```
DELETE /api/mailing-list/delete-data
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### Get Statistics (Admin Only)
```
GET /api/mailing-list/stats
```
Requires `X-Admin-Key` header.

## Email Templates

The system includes two email templates:

1. **Confirmation Email** - Sent when user subscribes
2. **Welcome Email** - Sent when user confirms their email

Both emails are professionally designed and include:
- Branding with AutoDevelop.ai logo
- Clear call-to-action buttons
- Unsubscribe links
- Privacy policy links
- Mobile-responsive design

## Frontend Integration

The mailing list modal is integrated into the main App component and will:

1. **Auto-display** after 3 seconds for first-time visitors
2. **Show via buttons** in the hero section and footer
3. **Remember** if user has seen the modal (localStorage)
4. **Validate** inputs in real-time
5. **Show success/error** messages appropriately

### Customization

To modify the modal behavior:

- **Auto-display timing**: Change the timeout in `App.jsx` (currently 3000ms)
- **Modal content**: Edit `MailingListModal.jsx`
- **Styling**: Modify `MailingListModal.css`
- **Button placement**: Add/remove buttons in `App.jsx`

## Security Features

- **Input sanitization** to prevent XSS attacks
- **Email validation** using regex patterns
- **Rate limiting** via existing middleware
- **GDPR compliance** with data deletion capabilities
- **Opt-in consent** required for all subscriptions
- **Secure tokens** for confirmation and unsubscribe links

## Testing

### Manual Testing

1. Start the development server: `npm run dev`
2. Visit http://localhost:5173
3. The modal should appear after 3 seconds
4. Fill out the form and submit
5. Check backend logs for confirmation email simulation

### API Testing

```bash
# Test subscription
curl -X POST http://localhost:8080/api/mailing-list/subscribe \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "optIn": true}'

# Test validation
curl -X POST http://localhost:8080/api/mailing-list/subscribe \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "invalid-email", "optIn": true}'
```

## Production Deployment

1. Set up SendGrid API key for real email sending
2. Configure proper `FROM_EMAIL` domain
3. Set `FRONTEND_URL` to your production domain
4. Ensure database file has proper permissions
5. Monitor logs for email delivery status

## Troubleshooting

### Email Not Sending
- Check SendGrid API key is valid
- Verify sender email is verified in SendGrid
- Check logs for email service errors

### Modal Not Appearing
- Check localStorage for `hasSeenMailingModal` flag
- Clear localStorage to test first-time user experience
- Verify JavaScript console for errors

### Database Issues
- Ensure SQLite is installed
- Check file permissions for database directory
- Review logs for database connection errors

## GDPR Compliance

The system includes several GDPR compliance features:

1. **Explicit consent** required via opt-in checkbox
2. **Privacy policy** link in the modal and emails
3. **Data deletion** endpoint for user requests
4. **Clear unsubscribe** process in all emails
5. **Data minimization** - only collecting necessary information
6. **Secure storage** with proper access controls

To handle GDPR data deletion requests:

```bash
curl -X DELETE http://localhost:8080/api/mailing-list/delete-data \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```