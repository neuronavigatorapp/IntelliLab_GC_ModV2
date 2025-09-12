# PowerShell dev bootstrap for IntelliLab GC

param(
  [switch]$Migrate,
  [string]$CompoundCsv = "backend/ai/compound_library.csv",
  [string]$FaultJson = "backend/ai/fault_library.json"
)

Write-Host "Setting up Python venv..."
if (-not (Test-Path "venv")) {
  python -m venv venv | Out-Null
}
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

if ($Migrate) {
  Write-Host "Migrating DB and loading libraries..."
  python scripts/setup_environment.py --migrate --load-compounds $CompoundCsv --load-faults $FaultJson
}

Write-Host "Starting backend..."
set ITEM APPDIR backend
python -m uvicorn app.main:app --reload

param(
  [switch]$Frontend,
  [switch]$Backend
)

if (-not $Frontend -and -not $Backend) { $Frontend = $true; $Backend = $true }

if ($Backend) {
  Write-Host "Starting backend..." -ForegroundColor Cyan
  Start-Process -NoNewWindow powershell -ArgumentList "-NoProfile -Command cd backend; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
}
if ($Frontend) {
  Write-Host "Starting frontend..." -ForegroundColor Cyan
  Start-Process -NoNewWindow powershell -ArgumentList "-NoProfile -Command cd frontend; npm run dev"
}


