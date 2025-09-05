Merge notes

Action performed: requested "merge main into main" — this is a no-op when local `main` already matches `origin/main`.

Suggested stopping point for tonight:
- All planned frontend SEO and sitemap changes have been applied.
- Merge conflict in `backend/routes/apiRoutes.js` was fixed.
- Created debugging helpers in `tools/` and `TOOLS/BACKEND_DEBUG.md` to capture logs for backend verification.

Next steps (next session):
1. Paste full backend logs from `backend-server.log` (or run `node tools/start-and-log.js`) and attach here.
2. If errors exist, apply small patches and re-run helper scripts.
3. Optionally harden `backend/server.js` with process-wide uncaught exception handlers and better startup guards.

If you want me to push/merge branches on GitHub directly, give me the source branch name and confirm.
