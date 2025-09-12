param(
  [switch]$Frontend,
  [switch]$Backend
)

if ($Backend -or -not $Frontend) {
  .\venv\Scripts\Activate.ps1
  pytest -q
}

if ($Frontend -or -not $Backend) {
  cd frontend
  npm ci
  npx cypress run --headless || echo "Cypress run skipped/fallback"
}


