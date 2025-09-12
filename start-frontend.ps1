Write-Host "Starting IntelliLab GC Frontend..." -ForegroundColor Green
Set-Location "C:\IntelliLab_GC_ModV2\frontend"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check if port 3000 is in use
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "Port 3000 already in use. Likely already running." -ForegroundColor Yellow
} else {
    Write-Host "Starting frontend server on port 3000..." -ForegroundColor Green
    npm start
}
