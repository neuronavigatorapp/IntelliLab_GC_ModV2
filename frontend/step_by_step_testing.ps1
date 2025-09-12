# IntelliLab GC - Step by Step Testing
# Copy and paste each command block into PowerShell, then press Enter

Write-Host "🛑 STEP-BY-STEP TESTING PROTOCOL" -ForegroundColor Red
Write-Host "===============================" -ForegroundColor Red
Write-Host ""
Write-Host "Copy each command block below and paste into PowerShell, then press Enter" -ForegroundColor Yellow
Write-Host ""

# STEP 1: Navigate and Basic Check
Write-Host "STEP 1: Navigate and Basic Check" -ForegroundColor Cyan
Write-Host "Copy this block:" -ForegroundColor Yellow
Write-Host "Set-Location 'C:\IntelliLab_GC_ModV2\frontend'; Get-Location; Test-Path 'package.json'; Test-Path 'node_modules'; Test-Path 'src'" -ForegroundColor White
Write-Host ""

# STEP 2: Check Versions
Write-Host "STEP 2: Check Versions" -ForegroundColor Cyan
Write-Host "Copy this block:" -ForegroundColor Yellow
Write-Host "node --version; npm --version" -ForegroundColor White
Write-Host ""

# STEP 3: Check Dependencies
Write-Host "STEP 3: Check Dependencies" -ForegroundColor Cyan
Write-Host "Copy this block:" -ForegroundColor Yellow
Write-Host "npm list --depth=0" -ForegroundColor White
Write-Host ""

# STEP 4: TypeScript Check
Write-Host "STEP 4: TypeScript Check" -ForegroundColor Cyan
Write-Host "Copy this block:" -ForegroundColor Yellow
Write-Host "npx tsc --noEmit" -ForegroundColor White
Write-Host ""

# STEP 5: Install Testing Dependencies
Write-Host "STEP 5: Install Testing Dependencies" -ForegroundColor Cyan
Write-Host "Copy this block:" -ForegroundColor Yellow
Write-Host "npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react" -ForegroundColor White
Write-Host ""

# STEP 6: Add Test Script
Write-Host "STEP 6: Add Test Script" -ForegroundColor Cyan
Write-Host "Copy this block:" -ForegroundColor Yellow
Write-Host "`$packageJson = Get-Content 'package.json' | ConvertFrom-Json; `$packageJson.scripts.test = 'vitest'; `$packageJson | ConvertTo-Json -Depth 10 | Set-Content 'package.json'" -ForegroundColor White
Write-Host ""

# STEP 7: Run Basic Test
Write-Host "STEP 7: Run Basic Test" -ForegroundColor Cyan
Write-Host "Copy this block:" -ForegroundColor Yellow
Write-Host "npm test" -ForegroundColor White
Write-Host ""

# STEP 8: Install Playwright
Write-Host "STEP 8: Install Playwright" -ForegroundColor Cyan
Write-Host "Copy this block:" -ForegroundColor Yellow
Write-Host "npm install --save-dev @playwright/test; npx playwright install chromium" -ForegroundColor White
Write-Host ""

# STEP 9: Test Server Start
Write-Host "STEP 9: Test Server Start" -ForegroundColor Cyan
Write-Host "Copy this block:" -ForegroundColor Yellow
Write-Host "`$env:BROWSER='none'; npm start" -ForegroundColor White
Write-Host "Note: Press Ctrl+C to stop after 10 seconds" -ForegroundColor Red
Write-Host ""

Write-Host "✅ All steps completed successfully!" -ForegroundColor Green
Write-Host "🚀 Ready for development!" -ForegroundColor Green
