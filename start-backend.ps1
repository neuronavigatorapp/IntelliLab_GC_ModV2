Write-Host "Starting IntelliLab GC Backend..." -ForegroundColor Green
Set-Location "C:\IntelliLab_GC_ModV2\backend"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check if port 8000 is in use
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "Port 8000 already in use. Attempting to free it..." -ForegroundColor Yellow
    Stop-Process -Id $port8000.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "Starting backend server on port 8000..." -ForegroundColor Green
python -m uvicorn main:app --reload --port 8000
