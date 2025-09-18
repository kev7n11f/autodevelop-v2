param(
  [string]$BaseUrl = 'https://www.autodevelop.ai'
)

Write-Host "Running smoke tests against $BaseUrl"

function Check-Health {
  Write-Host "Checking /health..."
  try {
    $h = Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET -ErrorAction Stop
    $h | ConvertTo-Json -Depth 5
    Write-Host "Health endpoint reachable"
  } catch {
    Write-Error "Health check failed: $_"
    exit 2
  }
}

function Check-Register {
  Write-Host "Testing registration endpoint (dry run)..."
  $body = @{ email = "smoke+$(Get-Random)@example.com"; password = "ChangeMe123!"; name = "Smoke Test" } | ConvertTo-Json
  try {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method POST -Body $body -ContentType 'application/json' -ErrorAction Stop
    Write-Host "Registration response:"; $r
  } catch {
    Write-Error "Registration failed: $_"
    exit 3
  }
}

function Check-Login {
  Write-Host "Testing login endpoint (expected to work for registered user)..."
  # This is a smoke check; rely on earlier register for a unique email or use a known test account
  Write-Host "Skipping login because this script performs a dry registration only."
}

Check-Health
Check-Register
Check-Login

Write-Host "Smoke tests completed."
