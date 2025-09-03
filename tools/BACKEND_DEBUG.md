# Backend debug & log capture (PowerShell)

This file contains exact PowerShell commands to reproduce and capture backend startup output (stdout/stderr) and Winston logs. Use these when the server exits immediately or when an agent needs full traces.

Run from the repository root: `C:\Users\ClickTech\Documents\autodevelop-v2`

1) (optional) install dependencies
```powershell
cd 'C:\Users\ClickTech\Documents\autodevelop-v2'
npm ci; npm --prefix backend ci; npm --prefix frontend ci
```

2) Verify common modules load (writes `tools/deps-result.json`)
```powershell
node tools/verify-deps.js
type .\tools\deps-result.json
```

3) Quick probe (already in repo) — writes `tools/server-log.txt`
```powershell
node tools/start-and-log.js
type .\tools\server-log.txt
```

4) Capture full startup output (foreground). Let it run or press Ctrl+C to stop; then inspect the captured file:
```powershell
node backend/server.js *> .\backend-server.log
type .\backend-server.log
```

5) If the server exits without stack traces, capture debug traces:
```powershell
$env:DEBUG='*'; node --trace-warnings backend/server.js *> .\backend-server-debug.log
type .\backend-server-debug.log
```

6) Alternative: start server detached and capture immediately
```powershell
Start-Process -FilePath node -ArgumentList 'backend/server.js' -NoNewWindow -RedirectStandardOutput .\backend-server.log -RedirectStandardError .\backend-server.log
Start-Sleep -Seconds 4
type .\backend-server.log
```

7) Show Winston logs (if present)
```powershell
if (Test-Path .\logs\app.log) { type .\logs\app.log } else { 'no logs/app.log' }
if (Test-Path .\logs\error.log) { type .\logs\error.log } else { 'no logs/error.log' }
```

8) Run the smoke-test (after server is up)
```powershell
node tools/smoke-test-backend.js
```

What to paste back into the issue or chat
- `tools\server-log.txt` (quick probe) — already present
- `backend-server.log` or `backend-server-debug.log` (full capture)
- `tools\deps-result.json`
- `logs\app.log` and `logs\error.log`
- smoke-test stdout/stderr

Triage hints
- "MODULE_NOT_FOUND" => report package name and `require` location; install with `npm --prefix backend install <pkg>`
- "SyntaxError" or merge markers => open file and remove conflict markers
- Missing env vars => list required names and provide safe placeholders for local testing
- DB / file errors => check DB path exists and is writable

Notes
- Do NOT commit secrets. If testing requires env values (Stripe, SendGrid, OpenAI), create a local `.env` and export values only on the local machine.
- If files are still empty after these steps, re-run with `node --trace-warnings` and `$env:DEBUG='*'` then paste the debug log.

File created: `TOOLS/BACKEND_DEBUG.md`
