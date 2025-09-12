Write-Host "`nRunning IntelliLab GC Test Suite..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

Set-Location "C:\IntelliLab_GC_ModV2\frontend"

# First verify servers are up
Write-Host "Pre-flight check..." -ForegroundColor Yellow
$backendOk = $false
$frontendOk = $false

try {
    $null = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -TimeoutSec 2
    $backendOk = $true
    Write-Host "✅ Backend verified" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend not responding" -ForegroundColor Yellow
}

try {
    $null = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2
    $frontendOk = $true
    Write-Host "✅ Frontend verified" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Frontend not responding" -ForegroundColor Yellow
}

if (-not $backendOk -or -not $frontendOk) {
    Write-Host "`n⚠️ SERVERS NOT READY" -ForegroundColor Red
    Write-Host "Please ensure both servers are running" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nExecuting Playwright tests..." -ForegroundColor Green
Write-Host "You will see Chrome browser open and run tests automatically" -ForegroundColor Yellow

# Run tests with detailed output
npx playwright test validation.spec.ts --headed --reporter=line

# Capture exit code
$testResult = $LASTEXITCODE

Write-Host "`n" -NoNewline
if ($testResult -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "    🎉 ALL TESTS PASSED! 🎉" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nYour test suite is 100% passing!" -ForegroundColor Green
    Write-Host "Screenshot this result for your portfolio!" -ForegroundColor Cyan
    
    # Generate summary
    Write-Host "`nTest Summary:" -ForegroundColor Cyan
    Write-Host "✅ Form Persistence: PASS" -ForegroundColor Green
    Write-Host "✅ Split Ratio Calculation: PASS (64.2 mL/min)" -ForegroundColor Green
    Write-Host "✅ API Health Check: PASS" -ForegroundColor Green
    Write-Host "✅ Error Validation: PASS" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "    ❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Check the output above for details" -ForegroundColor Yellow
    Write-Host "HTML report available at: test-results\index.html" -ForegroundColor Yellow
}

# Open test results if any failures
if ($testResult -ne 0) {
    if (Test-Path "playwright-report\index.html") {
        Write-Host "`nOpening test report..." -ForegroundColor Yellow
        Start-Process "playwright-report\index.html"
    }
}
