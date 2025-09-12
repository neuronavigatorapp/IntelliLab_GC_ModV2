Write-Host "IntelliLab GC - Complete Test Suite Execution" -ForegroundColor Cyan
Write-Host "=============================================`n" -ForegroundColor Cyan

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "1. Start the backend server" -ForegroundColor White
Write-Host "2. Start the frontend server" -ForegroundColor White
Write-Host "3. Verify both are running" -ForegroundColor White
Write-Host "4. Run all Playwright tests" -ForegroundColor White
Write-Host "5. Capture results for portfolio`n" -ForegroundColor White

Write-Host "NOTE: You need 3 PowerShell windows open" -ForegroundColor Red
Write-Host "Terminal 1: Backend server" -ForegroundColor Yellow
Write-Host "Terminal 2: Frontend server" -ForegroundColor Yellow
Write-Host "Terminal 3: This script`n" -ForegroundColor Yellow

Read-Host "Press Enter when you have 3 terminals ready"

Write-Host "`n📋 INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. In Terminal 1, run: .\start-backend.ps1" -ForegroundColor Yellow
Write-Host "2. Wait for 'Application startup complete'" -ForegroundColor Gray
Write-Host "3. In Terminal 2, run: .\start-frontend.ps1" -ForegroundColor Yellow
Write-Host "4. Wait for 'Compiled successfully'" -ForegroundColor Gray
Write-Host "5. Come back here and press Enter`n" -ForegroundColor Yellow

Read-Host "Press Enter after both servers are running"

# Now run verification and tests
Write-Host "`nVerifying servers..." -ForegroundColor Green
.\verify-servers.ps1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nRunning tests..." -ForegroundColor Green
    .\run-tests.ps1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nCapturing results..." -ForegroundColor Green
        .\capture-results.ps1
    }
}
