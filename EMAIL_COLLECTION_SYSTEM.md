# Email Collection System Documentation

## Overview

The AutoDevelop.ai email collection system allows you to build and manage a mailing list for updates, news, and feature announcements. The system includes a responsive modal interface, secure backend API, email confirmation flow, rate limiting, resubscribe support, and GDPR compliance features. It is **fully separate** from Stripe subscription gating (paid usage unlocking) and does **not** affect free message limits or Stripe status.

## Features

- **Auto-displaying modal** for first-time visitors (after 3 seconds)
- **Manual triggers** via "Get Updates" and "Subscribe to Updates" buttons
- **Double opt-in** confirmation (pending ➜ confirmed) with resend safeguards
- **Email validation** and input sanitization
- **Opt-in consent** requirement with privacy policy link + consent version tracking
- **Duplicate & pending detection** returning actionable feedback (no hard error)
- **Resubscribe flow** for previously unsubscribed addresses (fresh tokens)
- **Rate limiting metadata** (timestamps per action + attempt counters)
- **Email confirmation** flow with SendGrid integration (or stubbed in dev)
- **GDPR compliance** including data deletion endpoint
- **SQLite database** for subscriber storage (auto-migrating columns)
- **Security measures** including input validation and admin‑key protected stats

## New Schema Columns (Enhancements)

Added automatically if missing:

- `last_confirmation_sent` (DATETIME)
- `last_unsubscribe_request` (DATETIME)
- `last_subscribe_attempt` (DATETIME)
- `subscribe_attempts` (INTEGER)
- `confirmed_at`, `unsubscribed_at`
- `ip`, `user_agent`, `source` (contextual metadata – minimal)
- `consent_version` (tracks which policy text user agreed to)

## Action Rate Limiting (Advisory)

| Action | Column Checked | Example Minimum Interval (implement in controller/business logic) |
|--------|----------------|---------------------------------------------|
| Subscribe attempt | `last_subscribe_attempt` | 5–15s user-facing debounce |
| Confirmation resend | `last_confirmation_sent` | 60s to prevent spamming |
| Unsubscribe request | `last_unsubscribe_request` | 5s safety throttle |

(Intervals enforced by controller logic / future enhancement hook — metadata now exists.)

## Separation from Stripe Subscriptions

| Aspect | Mailing List | Stripe Subscription |
|--------|--------------|---------------------|
| Purpose | Marketing / product updates | Unlock higher usage limits |
| Data | Name, email, tokens, consent metadata | Billing + plan + usage entitlements |
| Flow | Double opt-in email confirmation | Checkout + webhooks + portal |
| Impact on Usage Limits | None | Yes (removes free cap) |
| Unsubscribe | One-click token link | Manage via billing portal |

## Setup Instructions

### 1. Environment Configuration

Add the following environment variables to your `.env` file:

```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@autodevelop.ai
FRONTEND_URL=https://your-domain.com
ADMIN_KEY=your_secure_admin_key_here
```

### 2. SendGrid Setup

1. Create a SendGrid account at <https://sendgrid.com>
2. Generate an API key with mail send permission
3. Verify your sender domain or address
4. Add the API key to your environment variables

### 3. Database

The system uses SQLite. The database file (`backend/mailing_list.db`) is auto-created and migrates missing columns at startup. It is git‑ignored.

## API Endpoints

### Subscribe to Mailing List

```http
POST /api/mailing-list/subscribe
```

**Request Body:**

```json
{ "name": "John Doe", "email": "john@example.com", "optIn": true }
```

**Response (new cases):**

```json
// Fresh subscription
{ "success": true, "message": "Subscription successful! Please check your email to confirm." }
```

```json
// Duplicate pending (user asks for resend too soon)
{ "duplicatePending": true, "status": "pending", "needsConfirmation": true, "last_confirmation_sent": "2025-01-15T12:00:00Z" }
```

### Confirm Email Subscription

```http
GET /api/mailing-list/confirm/:token
```

Redirects to frontend with `?confirmed=true` or error query.

### Unsubscribe

```http
GET /api/mailing-list/unsubscribe/:token
```

Redirects with `?unsubscribed=true` or error.

### Delete User Data (GDPR)

```http
DELETE /api/mailing-list/delete-data
```

**Request Body:** `{ "email": "user@example.com" }`

### Get Statistics (Admin Only)

```http
GET /api/mailing-list/stats
```

Requires `X-Admin-Key` header. Returns total confirmed count + timestamp.

## Email Templates

Two transactional templates (adapt or replace with marketing platform):

1. **Confirmation Email** – Pending ➜ Confirm
2. **Welcome Email** – Post confirmation

Both contain:

- App branding
- CTA button + fallback link
- Unsubscribe link (after confirmation)
- Privacy / consent references
- Responsive layout

## Frontend Integration

Modal logic:

1. Auto-display after 3s (if `localStorage.hasSeenMailingModal` not set)
2. User submits → optimistic UI + server validation
3. On duplicate pending → show message with hint to check email / wait
4. On success → show confirmation instructions state

Customization points:

- Delay: adjust timeout in `App.jsx`
- Content/styling: `MailingListModal.jsx` / `MailingListModal.css`
- Trigger buttons: defined in `App.jsx`

## Security & Privacy

- Sanitizes `< >` from inputs
- Email format validated
- Minimal metadata (ip, user_agent) optional — can be disabled by not passing values
- No tracking cookies set by mailing list logic
- Tokens are 32-byte hex (cryptographically random)
- Resubscribe flow regenerates tokens & clears prior timeline markers

## Testing

```bash
curl -X POST http://localhost:8080/api/mailing-list/subscribe \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","optIn":true}'
```

Inspect DB for the new row (pending), then simulate confirmation by hitting token URL.

## Troubleshooting

| Issue | Likely Cause | Resolution |
|-------|--------------|-----------|
| No confirmation email | SENDGRID_API_KEY invalid | Verify key / sender domain |
| Always duplicatePending | Already pending + trying too soon | Inform user to check inbox / spam |
| Cannot confirm | Token expired/typo | Request new subscription to regenerate |
| Unsubscribe fails | Wrong token | Use link from latest email |

## GDPR Compliance

Included:

- Explicit consent checkbox & stored consent version
- Data deletion endpoint
- Unsubscribe link in every post-confirmation email
- Data minimization (only essential subscriber fields)

Example deletion:

```bash
curl -X DELETE http://localhost:8080/api/mailing-list/delete-data \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

## Future Enhancements (Optional)

- Confirmation resend endpoint with cooldown
- Digest preference selection (weekly / monthly)
- Soft bounce / hard bounce tracking
- Suppression list segregation
- Multi-lingual templates

---

**Last Updated:** January 2025 (enhanced with rate limiting + resubscribe documentation)
