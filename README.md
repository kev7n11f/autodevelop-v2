# AutoDevelop.ai v2

Transform your ideas into reality with AI-powered development.

## Overview

AutoDevelop.ai is a modern, full-stack platform that empowers developers and entrepreneurs to build software faster and smarter using artificial intelligence. Whether you're a seasoned developer or just starting, our tools and AI assistant guide you step-by-step.

## Key Features

- **AI-Powered Guidance**: Get practical advice, code examples, and best practices tailored to your project.
- **Google OAuth Authentication**: Secure user authentication with Google accounts, JWT tokens, and session management.
- **Rapid Prototyping**: Go from idea to working prototype in hours, not weeks.
- **Personalized Learning**: Learn as you build, with explanations and resources that match your skill level.
- **Full-Stack Support**: Frontend, backend, database, deployment—everything covered.
- **Enterprise-Grade Security**: Your ideas and code are protected with industry-standard measures.
- **Subscription Gating & Usage Tracking**: Free daily/monthly limits with Stripe subscription upgrade path.
- **Mailing List System (Get Updates)**: Double opt-in, rate-limited, GDPR-aligned subscriber collection distinct from paid plans.
- **Admin Observability**: Real-time usage stats, diagnostics, audit trail, and fraud safeguards.

## Subscription & Usage Gating

Free users are limited by environment-configurable daily and monthly message caps. Subscribed users (Stripe) have unlimited (or higher) limits.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| FREE_MESSAGE_LIMIT | 5 | Daily free message limit |
| FREE_MONTHLY_LIMIT | 150 | Monthly free message limit |
| USAGE_FLUSH_INTERVAL_MS | 30000 | Batch flush interval for in-memory usage deltas |
| USAGE_CACHE_MAX | 500 | Max distinct users tracked before forced flush |
| STRIPE_SECRET_KEY | *(none)* | Stripe secret key |
| STRIPE_DEFAULT_PRICE_ID | *(none)* | Default subscription price id |
| STRIPE_WEBHOOK_SECRET | *(none)* | Webhook signing secret |
| STRIPE_SUCCESS_URL | `http://localhost:5173/success` | Checkout success redirect |
| STRIPE_CANCEL_URL | `http://localhost:5173/cancel` | Checkout cancel redirect |
| STRIPE_PORTAL_RETURN_URL | `http://localhost:5173/account` | Billing portal return |
| SENDGRID_API_KEY | *(none)* | Outbound email (confirmation / welcome) |
| FROM_EMAIL | `noreply@autodevelop.ai` | Sender identity for mailing list |
| FRONTEND_URL | `http://localhost:5173` | Used for confirm/unsubscribe redirects |
| ADMIN_KEY | *(set yourself)* | Simple admin auth shared secret |

### Core Tables Added

- `usage_counters`: Daily + monthly aggregated counts (period rolling reset)
- `usage_events`: Immutable audit log of usage events (message_used, limit_block, usage_reset, diagnostic_access)
- `stripe_events`: Raw Stripe webhook payloads for idempotency & replay
- `mailing_list_subscribers`: Double opt‑in subscriber store (tokens, consent, rate limit metadata)

### Request Flow

1. Client sends `/api/chat` with optional `userId` & `x-device-id` header.
2. Backend loads subscription + usage (cached deltas not yet flushed).
3. If free tier and limits exceeded (daily or monthly) -> 402 + upgrade metadata.
4. Usage increments batched in memory and flushed periodically / size threshold.
5. Audit event persisted asynchronously.

### Upgrade Flow (Frontend Guidance)

- Display remaining daily & monthly free counts from `meta.remainingDailyFree` / `meta.remainingMonthlyFree`.
- When counts <= 1 show soft warning banner.
- On limit reached (402), show upgrade modal.
- Call `POST /api/payments/stripe/checkout` with JSON `{ userId, email, name, priceId? }` -> redirect to returned `url`.
- After success redirect page polls `/api/payments/subscription/:userId` until status active/trial.
- Add a "Manage Billing" button calling `POST /api/payments/stripe/portal` with `{ customerId }` (from subscription once stored).

## Mailing List ("Get Updates")

Separate from paid subscriptions. Provides product & feature announcements only.

### Flow

- User opens modal (auto after delay or manual button) ➜ submits name, email, consent.
- Backend `POST /api/mailing-list/subscribe` creates pending row, generates confirmation + unsubscribe tokens, rate-limits repeated attempts.
- Confirmation email (SendGrid) includes link: `/api/mailing-list/confirm/:token` (redirects to frontend with status).
- On confirmation: status → confirmed, welcome email sent (best-effort).
- User may unsubscribe anytime via `/api/mailing-list/unsubscribe/:token`.

### Rate Limiting & Resilience

- Repeated subscribe attempts tracked (`subscribe_attempts`, `last_subscribe_attempt`).
- Confirmation resend guarded by timestamp (`last_confirmation_sent`).
- Unsubscribe actions tracked (`last_unsubscribe_request`).
- Resubscribe of previously unsubscribed address resets to pending with fresh tokens.
- Duplicate pending subscription returns structured hint (`duplicatePending`) instead of error.

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mailing-list/subscribe` | POST | Begin double opt‑in subscription |
| `/api/mailing-list/confirm/:token` | GET | Confirm email (redirect) |
| `/api/mailing-list/unsubscribe/:token` | GET | Unsubscribe (redirect) |
| `/api/mailing-list/delete-data` | DELETE | GDPR deletion (email) |
| `/api/mailing-list/stats` | GET | Total confirmed count (admin header) |

### Data Stored

- Email, name, consent version, confirmation + unsubscribe tokens
- Status timeline (pending → confirmed / unsubscribed)
- Activity timestamps & limited metadata (ip, user_agent, source)

No mailing list action alters message usage limits or subscription status.

## New Admin & Diagnostic Endpoints

All require header `x-admin-key: <ADMIN_KEY>`.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/usage/reset` | POST | Reset usage (body: userId & scope) |
| `/api/admin/usage/stats` | GET | Aggregated usage + subscription metrics |
| `/api/admin/diagnostic/:userId` | GET | Per-user usage, subscription, recent events |
| `/api/admin/status` | GET | System + security + usage summary |
| `/api/admin/suspicious-activity` | GET | Abuse monitor report |
| `/api/admin/unblock-user` | POST | Remove block for clientId |
| `/api/mailing-list/stats` | GET | Mailing list confirmed subscriber count |

### Diagnostic Payload Example

```json
GET /api/admin/diagnostic/USER123
{
  "success": true,
  "diagnostic": {
    "usage": {"user_id":"USER123","message_count":12,"period_start":"...","monthly_message_count":40,"monthly_period_start":"..."},
    "subscription": { /* Stripe fields */ },
    "recentEvents": [ { "id":1, "event_type":"message_used", "daily_count":12, "monthly_count":40, "created_at":"..." } ]
  }
}
```

## Stripe Webhook Resilience

- Raw events stored in `stripe_events` with unique constraint on `stripe_event_id`.
- Duplicate deliveries short-circuit (idempotent response).
- Process status tracked (`received`, `processed`, `error`).
- Future improvement: cron to retry `error` rows.

## Audit & Fraud Safeguards

- `usage_events` records key transitions (consumption, limits, resets, diagnostics).
- Supports correlation via `user_id`, `ip`, `source`, and optional metadata like `deviceId`.
- Basic placeholder for multi-IP / device anomaly detection (extend according to needs).
- Mailing list actions are isolated & minimal (no tracking cookies added).

## Developer Operations

### Local .env Template

```dotenv
OPENAI_API_KEY=sk-...
FREE_MESSAGE_LIMIT=5
FREE_MONTHLY_LIMIT=150
USAGE_FLUSH_INTERVAL_MS=30000
USAGE_CACHE_MAX=500
ADMIN_KEY=change-me
STRIPE_SECRET_KEY=sk_test_...
STRIPE_DEFAULT_PRICE_ID=price_123
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:5173/success
STRIPE_CANCEL_URL=http://localhost:5173/cancel
STRIPE_PORTAL_RETURN_URL=http://localhost:5173/account
SENDGRID_API_KEY=SG.x...
FROM_EMAIL=noreply@autodevelop.ai
FRONTEND_URL=http://localhost:5173
```

### Deployment Order / Migration

1. Deploy code with new tables logic (app auto-creates / migrates columns).
2. Add new env vars to hosting platform.
3. Configure Stripe (Price, Webhook endpoint -> `/stripe/webhook`, secret -> env).
4. Configure SendGrid sender & API key.
5. Roll out frontend changes (upgrade & mailing list modals, counters, polling).
6. Monitor `/api/admin/usage/stats` and `/api/mailing-list/stats`.

## Authentication System

AutoDevelop.ai includes a complete Google OAuth 2.0 authentication system:

- **Secure Login**: Users can sign in with their Google accounts
- **Session Management**: JWT-based authentication with secure cookie storage
- **User Profiles**: Automatic profile creation and management
- **Security Features**: CSRF protection, rate limiting, and secure token handling

For detailed setup instructions, see [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md).

## Getting Started

### Package Manager

This project uses **Yarn** as the package manager. Please ensure you have Yarn installed before proceeding.

#### Installing Yarn

```bash
npm install -g yarn
```

#### Development Setup

```bash
git clone https://github.com/kev7n11f/autodevelop-v2.git
cd autodevelop-v2
yarn install
yarn dev
```

## License

MIT License

Copyright (c) 2025 AutoDevelop.ai

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
