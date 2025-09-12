# IntelliLab GC Post-Installation Smoke Test
# Tests all critical endpoints and services to verify proper installation

param(
    [string]$BackendPort = "8000",
    [string]$FrontendPort = "5173",
    [int]$TimeoutSec = 10,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppRoot = Split-Path -Parent $ScriptDir
$TestResults = @()
$OverallResult = "PASS"

function Write-TestResult {
    param($TestName, $Result, $Details = "", $Url = "")
    
    $TestResults += @{
        Test = $TestName
        Result = $Result
        Details = $Details
        Url = $Url
        Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    }
    
    $Color = if ($Result -eq "PASS") { "Green" } else { "Red" }
    $Symbol = if ($Result -eq "PASS") { "✓" } else { "✗" }
    
    Write-Host "[$Symbol] $TestName : $Result" -ForegroundColor $Color
    if ($Details -and ($Verbose -or $Result -eq "FAIL")) {
        Write-Host "    Details: $Details" -ForegroundColor Gray
    }
    if ($Url -and $Verbose) {
        Write-Host "    URL: $Url" -ForegroundColor Gray
    }
    
    if ($Result -eq "FAIL") {
        $script:OverallResult = "FAIL"
    }
}

function Test-Endpoint {
    param($Url, $TestName, $ExpectedContent = $null)
    
    try {
        $Response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -UseBasicParsing
        
        if ($Response.StatusCode -eq 200) {
            if ($ExpectedContent -and $Response.Content -notlike "*$ExpectedContent*") {
                Write-TestResult $TestName "FAIL" "Unexpected content received" $Url
                return $false
            } else {
                Write-TestResult $TestName "PASS" "HTTP 200 OK" $Url
                return $true
            }
        } else {
            Write-TestResult $TestName "FAIL" "HTTP $($Response.StatusCode)" $Url
            return $false
        }
    } catch {
        Write-TestResult $TestName "FAIL" $_.Exception.Message $Url
        return $false
    }
}

Write-Host "=== IntelliLab GC Smoke Test ===" -ForegroundColor Cyan
Write-Host "Test Start: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "Backend Port: $BackendPort" -ForegroundColor Gray
Write-Host "Frontend Port: $FrontendPort" -ForegroundColor Gray
Write-Host "Timeout: $TimeoutSec seconds" -ForegroundColor Gray
Write-Host ""

# Test 1: Backend Health Check
Write-Host "Testing Backend Health..." -ForegroundColor Yellow
$BackendHealthUrl = "http://localhost:$BackendPort/health"
Test-Endpoint $BackendHealthUrl "Backend Health Check" "healthy"

# Test 2: Backend API Documentation
Write-Host "Testing Backend API Documentation..." -ForegroundColor Yellow
$BackendDocsUrl = "http://localhost:$BackendPort/docs"
Test-Endpoint $BackendDocsUrl "Backend API Docs" "swagger"

# Test 3: Backend System Health
Write-Host "Testing Backend System Health..." -ForegroundColor Yellow
$BackendSystemHealthUrl = "http://localhost:$BackendPort/api/v1/system/health"
Test-Endpoint $BackendSystemHealthUrl "Backend System Health"

# Test 4: Backend Run History Summary
Write-Host "Testing Backend Run History..." -ForegroundColor Yellow
$BackendRunHistoryUrl = "http://localhost:$BackendPort/api/v1/run-history/summary"
Test-Endpoint $BackendRunHistoryUrl "Backend Run History Summary"

# Test 5: Backend Self-Test (if available)
Write-Host "Testing Backend Self-Test..." -ForegroundColor Yellow
$BackendSelfTestUrl = "http://localhost:$BackendPort/api/v1/system/selftest"
Test-Endpoint $BackendSelfTestUrl "Backend Self-Test"

# Test 6: Frontend Accessibility
Write-Host "Testing Frontend Accessibility..." -ForegroundColor Yellow
$FrontendUrl = "http://localhost:$FrontendPort"
Test-Endpoint $FrontendUrl "Frontend Accessibility"

# Test 7: Frontend Assets (if available)
Write-Host "Testing Frontend Static Assets..." -ForegroundColor Yellow
$FrontendAssetsUrl = "http://localhost:$FrontendPort/static/"
try {
    $Response = Invoke-WebRequest -Uri $FrontendAssetsUrl -TimeoutSec $TimeoutSec -UseBasicParsing
    if ($Response.StatusCode -eq 200 -or $Response.StatusCode -eq 403) {
        Write-TestResult "Frontend Static Assets" "PASS" "Assets directory accessible"
    } else {
        Write-TestResult "Frontend Static Assets" "WARN" "Assets may not be available"
    }
} catch {
    Write-TestResult "Frontend Static Assets" "WARN" "Assets directory check skipped"
}

# Additional Tests: File System Checks
Write-Host "Testing File System..." -ForegroundColor Yellow

# Test 8: Data Directory
$DataDir = "C:\IntelliLab_GC\Data"
if (Test-Path $DataDir) {
    Write-TestResult "Data Directory" "PASS" "Directory exists: $DataDir"
} else {
    Write-TestResult "Data Directory" "FAIL" "Directory missing: $DataDir"
}

# Test 9: Logs Directory
$LogsDir = Join-Path $AppRoot "logs"
if (Test-Path $LogsDir) {
    Write-TestResult "Logs Directory" "PASS" "Directory exists: $LogsDir"
} else {
    Write-TestResult "Logs Directory" "FAIL" "Directory missing: $LogsDir"
}

# Test 10: Virtual Environment
$VenvPath = Join-Path $AppRoot "venv"
if (Test-Path $VenvPath) {
    Write-TestResult "Python Virtual Environment" "PASS" "Virtual environment exists"
} else {
    Write-TestResult "Python Virtual Environment" "FAIL" "Virtual environment missing"
}

# Test 11: Node Modules
$NodeModulesPath = Join-Path $AppRoot "frontend\node_modules"
if (Test-Path $NodeModulesPath) {
    Write-TestResult "Node.js Dependencies" "PASS" "node_modules directory exists"
} else {
    Write-TestResult "Node.js Dependencies" "WARN" "node_modules directory missing (may use prebuilt)"
}

# Summary
Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Test End: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

$PassCount = ($TestResults | Where-Object { $_.Result -eq "PASS" }).Count
$FailCount = ($TestResults | Where-Object { $_.Result -eq "FAIL" }).Count
$WarnCount = ($TestResults | Where-Object { $_.Result -eq "WARN" }).Count
$TotalCount = $TestResults.Count

Write-Host "Total Tests: $TotalCount" -ForegroundColor White
Write-Host "Passed: $PassCount" -ForegroundColor Green
Write-Host "Failed: $FailCount" -ForegroundColor Red
Write-Host "Warnings: $WarnCount" -ForegroundColor Yellow

Write-Host ""
if ($OverallResult -eq "PASS") {
    Write-Host "🎉 OVERALL RESULT: PASS - IntelliLab GC is ready for use!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ OVERALL RESULT: FAIL - Issues detected, please check the logs" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed Tests:" -ForegroundColor Red
    $TestResults | Where-Object { $_.Result -eq "FAIL" } | ForEach-Object {
        Write-Host "  • $($_.Test): $($_.Details)" -ForegroundColor Red
    }
    exit 1
}

