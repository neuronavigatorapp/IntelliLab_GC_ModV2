# Windows Emergency Reset Script for IntelliLab GC Frontend
# This script performs a nuclear cleanup and restart

Write-Host "🚨 WINDOWS EMERGENCY CLEANUP STARTING..." -ForegroundColor Red

# Stop any running processes
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process | Where-Object {$_.ProcessName -eq "npm"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Navigate to frontend directory
Set-Location "C:\IntelliLab_GC_ModV2\frontend"

# Clean install (Windows syntax)
Write-Host "Removing node_modules and package-lock.json..." -ForegroundColor Yellow
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Starting development server..." -ForegroundColor Green
npm start

Write-Host "✅ WINDOWS CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "The application should now be running at http://localhost:3000" -ForegroundColor Cyan

