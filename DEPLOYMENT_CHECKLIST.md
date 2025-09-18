# Deployment Checklist for AutoDevelop.ai

This checklist helps you deploy to Vercel (recommended) or any hosting platform while ensuring authentication, Stripe, and webhooks work correctly.

1) Required environment variables (Production)
- `NODE_ENV=production`
- `FRONTEND_URL=https://www.autodevelop.ai`
- `JWT_SECRET=<<long-random-string>>`
- `SESSION_SECRET=<<optional-if-legacy-used>>`
- `STRIPE_SECRET_KEY=sk_live_...` (live key)
- `STRIPE_WEBHOOK_SECRET=whsec_...` (if using webhooks)
- `STRIPE_SUCCESS_URL=https://www.autodevelop.ai/success`
- `STRIPE_CANCEL_URL=https://www.autodevelop.ai/cancel`
- `SENDGRID_API_KEY=...` (if email enabled)
- `OPENAI_API_KEY=...` (if chat enabled)
- `ADMIN_KEY=...` (admin operations)

2) Vercel specific
- In Vercel Dashboard > Project > Settings > Environment Variables, add the variables above for the Production environment.
- Confirm the project `build` command uses `npm run vercel-build` or your desired build script.
- If you rely on serverless functions in `api/`, confirm the functions map to the expected routes (e.g., `/api/payments/stripe/webhook`).

3) Cookie and CORS
- In `backend/server.js` ensure `FRONTEND_URL` is set and CORS in production uses that origin.
- Cookies: the server sets `accessToken` and `refreshToken` as httpOnly cookies. For cross-origin cookies:
  - Cookies must be `SameSite=None` and `Secure=true` (production only).
  - Frontend requests must include credentials: `fetch(url, { credentials: 'include' })`.

4) Sessions & Stateless JWTs
- The backend now uses stateless JWTs for the access token and opaque refresh tokens stored in DB for rotation.
- Ensure `JWT_SECRET` is configured in production and kept secret.

5) Stripe
- Configure Stripe Dashboard webhook to point to `https://www.autodevelop.ai/api/payments/stripe/webhook`.
- Use the live `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for production.

6) Post-deploy smoke tests
- Run the `DEPLOYMENT_SMOKE_TEST.ps1` script from the repo root (PowerShell):
  ```powershell
  .\DEPLOYMENT_SMOKE_TEST.ps1 -BaseUrl 'https://www.autodevelop.ai'
  ```
- Alternatively use `curl` to check health:
  ```bash
  curl -sSf https://www.autodevelop.ai/health | jq .
  ```

7) Troubleshooting
- If CORS errors occur, verify `FRONTEND_URL` exactly matches the origin header and that requests include credentials.
- If cookies are not set, ensure the site is using HTTPS and that cookies are not blocked by browser privacy settings.
- If sessions are missing, confirm `SESSION_STORE` (if used) or move to Redis for persistence.

8) Rollback plan
- Keep previous working commit available. If the deploy fails, roll back via Vercel dashboard or Git revert and re-deploy.

Contact & support: keep the logs from `backend/logs/app.log` for debugging.
