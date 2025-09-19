# SQLite -> Postgres Migration (GitHub Actions)

This repository includes a one-time migration workflow that copies data from the local SQLite database (`backend/data/mailing_list.db`) into a Postgres database (e.g., Supabase). The migration runs in GitHub Actions and uses the `DATABASE_URL` secret so your credentials aren't exposed in the repo.

How it works
- You add the `DATABASE_URL` secret to your GitHub repository secrets (Settings → Secrets and variables → Actions).
- You trigger the workflow manually via the GitHub Actions UI (Run workflow button).
- The workflow checks out the repo, installs dependencies, runs `scripts/migrate/sqlite_to_postgres.js`, and validates connection.

Steps
1. Add `DATABASE_URL` secret in GitHub repo settings. Use the full connection string from Supabase (Project → Settings → Database → Connection string). Example:

   `postgres://postgres:MySecret@db.xxxxx.supabase.co:5432/postgres`

2. Confirm the SQLite file exists in the repository at `backend/data/mailing_list.db` (this will be included in the workflow runner via checkout). If your SQLite file is local only, commit it temporarily or upload it to a secure location and modify the migration script to pull from there.

3. In GitHub, open Actions → Migrate SQLite to Postgres → Run workflow → choose `main` and click `Run workflow`.

4. Monitor the run logs. If anything errors, inspect the log lines and address network/permission issues.

Notes & warnings
- The migration performs upserts by `id` and is not transactional across all tables — it’s intended for small-to-midsize datasets and a one-time migration. For large or critical production data, use a robust migration tool (pgloader or a transactional ETL) and perform backups first.
- Do not expose the `DATABASE_URL` secret in PRs or logs. Keep the secret in GitHub Secrets only.
- After successful migration, confirm app behavior in a staging environment before cutting production traffic to the new DB.

If you want, I can also:
- Add a controlled rollback plan (export of Postgres tables before migrating).
- Add a CI job that runs data validation checks post-migration.
