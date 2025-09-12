Write-Host "`nVerifying IntelliLab GC Servers..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check Backend
Write-Host "`nChecking Backend (Port 8000)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Backend is RUNNING" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend is NOT running" -ForegroundColor Red
    Write-Host "   Please check Terminal 1" -ForegroundColor Yellow
    exit 1
}

# Check Frontend
Write-Host "`nChecking Frontend (Port 3000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is RUNNING" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Frontend is NOT running" -ForegroundColor Red
    Write-Host "   Please check Terminal 2" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ ALL SERVERS OPERATIONAL!" -ForegroundColor Green
Write-Host "Ready to run tests..." -ForegroundColor Cyan
