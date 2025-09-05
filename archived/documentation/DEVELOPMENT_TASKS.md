# Development tasks & SEO / Flow improvements

This file lists suggested improvements discovered during a repository audit and tracks progress as tasks are completed.

High priority
- [x] Replace noisy console.log with structured `logger` (backend)
- [x] Fix merge conflict and deduplicate routes
- [x] Add sitemap generator (`tools/generate-sitemap.js`) and integrate into frontend build
- [x] Add reusable `SEO` component and update `App.jsx` to use it
- [x] Remove client-side console logs for mailing-list confirmation/unsubscribe

Medium priority
- [x] Apply `SEO` component to individual pages (`About`, `Contact`, `Privacy`, `Terms`)
- [x] Add per-route canonical URLs and per-page OG images
- [x] Programmatic sitemap generation from routes + dynamic pages (extend generator) (partial - static discovery implemented; dynamic manifest support added)
- [ ] Add server-side rendering (SSR) or prerender for critical pages for better SEO

Low priority / Nice to have
- [ ] CI: add build + lint job (frontend build + backend smoke start)
- [ ] Add ESLint rules and fix warnings in frontend
- [ ] Add automated ping to search engines on new deploy
- [ ] Add tests for core APIs (usage/paywall flows)

Notes / Remaining work
- Backend runtime verification: need `backend-server.log` from `node backend/server.js *> backend-server.log` (run locally and paste log here) to diagnose remaining runtime errors.
- Programmatic sitemap for dynamic pages: manifest support added (`tools/sitemap-manifest.json`) — populate `dynamicRoutes` with slugs or implement DB export.
- SSR/prerender: medium/large effort — recommend static prerender for marketing pages using Vite SSG or implement Next.js migration.

CI
- Added `.github/workflows/ci.yml` which builds the frontend and attempts to run a backend smoke test (allowed to fail by default).

How to help me continue
1. Run backend locally and paste `backend-server.log` as described earlier.
2. If you'd rather postpone backend debugging, tell me to continue with SSR/prerender or other frontend tasks.
