# Seed database with compounds and optional presets

param(
  [string]$CompoundCsv = "backend/ai/compound_library.csv",
  [string]$FaultJson = "backend/ai/fault_library.json"
)

.\venv\Scripts\Activate.ps1
python scripts/setup_environment.py --migrate --load-compounds $CompoundCsv --load-faults $FaultJson

Write-Host "Seeding sample data..." -ForegroundColor Green
python backend/init_sample_data.py
Write-Host "Done."


