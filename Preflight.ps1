$ErrorActionPreference = "Stop"
Write-Host "=== IntelliLab GC Preflight ===" -ForegroundColor Cyan

# Ensure backend is running with PYTHONPATH so 'backend.main' imports
try {
  Invoke-RestMethod -Uri 'http://localhost:8000/api/health' -TimeoutSec 3 | Out-Null
  Write-Host "Backend already running ✅"
} catch {
  Write-Host "Starting backend…" -ForegroundColor Yellow
  $env:PYTHONPATH = "C:\IntelliLab_GC_ModV2"
  Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "-m","uvicorn","backend.main:app","--host","0.0.0.0","--port","8000" -WindowStyle Hidden
  Start-Sleep 6
}

# Run the preflight
Set-Location .\frontend
node .\scripts\preflight-report.mjs
if ($LASTEXITCODE -ne 0) { Write-Host "Preflight FAILED ❌" -ForegroundColor Red; exit 1 }
Write-Host "Preflight PASSED ✅" -ForegroundColor Green