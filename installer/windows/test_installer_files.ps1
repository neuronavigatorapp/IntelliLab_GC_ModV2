Param([switch]$Strict, [switch]$Verbose)
$ErrorActionPreference = 'Stop'

function Log($message) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $message"
}

function Fail($message) {
    Write-Host "ERROR: $message" -ForegroundColor Red
    exit 1
}

function LogOk($message) {
    if($Verbose) {
        Write-Host "+ $message" -ForegroundColor Green
    } else {
        Log "OK: $message"
    }
}

function LogWarn($message) {
    Write-Host "! $message" -ForegroundColor Yellow
}

$ScriptDir = Split-Path -Parent $PSCommandPath
$Root = Split-Path -Parent (Split-Path -Parent $ScriptDir)

Write-Host "=== IntelliLab GC Installer Verification ===" -ForegroundColor Cyan
Log "Repo root: $Root"
Log "Script directory: $ScriptDir"
Write-Host ""

# Check required paths
$mustExist = @(
    "installer/windows/IntelliLabGC.iss",
    "scripts/start_local.ps1", 
    "scripts/start_local.cmd",
    "backend",
    "frontend"
)

Write-Host "Checking required files and directories..." -ForegroundColor Yellow
foreach($relativePath in $mustExist) {
    $fullPath = Join-Path $Root $relativePath
    if(-not (Test-Path $fullPath)) {
        Fail "Missing required path: $relativePath ($fullPath)"
    } else { 
        LogOk $relativePath 
    }
}

# Check backend entry point
Write-Host ""
Write-Host "Checking backend entry points..." -ForegroundColor Yellow
$mainA = Join-Path $Root "backend/app/main.py"
$mainB = Join-Path $Root "backend/main.py"
if((-not (Test-Path $mainA)) -and (-not (Test-Path $mainB))) {
    Fail "Cannot find backend/app/main.py or backend/main.py"
} else { 
    if(Test-Path $mainA) { LogOk "backend/app/main.py found" }
    if(Test-Path $mainB) { LogOk "backend/main.py found" }
}

# Check frontend package.json
Write-Host ""
Write-Host "Checking frontend configuration..." -ForegroundColor Yellow
$frontendPackage = Join-Path $Root "frontend/package.json"
if(-not (Test-Path $frontendPackage)) {
    Fail "Missing frontend/package.json"
} else { 
    LogOk "frontend/package.json" 
}

# Check for Node.js dependencies
$nodeModules = Join-Path $Root "frontend/node_modules"
if(Test-Path $nodeModules) {
    LogOk "frontend/node_modules (dependencies installed)"
} else {
    LogWarn "frontend/node_modules not found - may need npm install"
}

# Check Python requirements
Write-Host ""
Write-Host "Checking Python requirements..." -ForegroundColor Yellow
$requirements = Join-Path $Root "requirements.txt"
$backendRequirements = Join-Path $Root "backend/requirements.txt"

if(Test-Path $requirements) { LogOk "requirements.txt" }
else { LogWarn "requirements.txt not found" }

if(Test-Path $backendRequirements) { LogOk "backend/requirements.txt" }
else { LogWarn "backend/requirements.txt not found" }

# Check optional assets
Write-Host ""
Write-Host "Checking optional assets..." -ForegroundColor Yellow
$optionalPaths = @(
    "frontend/public/favicon.ico",
    "frontend/public/IntelliLab_GC_logo.png",
    "frontend/public/IntelliLab_GC_logo.jpg",
    "tools/tray_helper",
    "README.md",
    "STARTUP_GUIDE.md"
)

foreach($relativePath in $optionalPaths) {
    $fullPath = Join-Path $Root $relativePath
    if(Test-Path $fullPath) { 
        LogOk "(optional): $relativePath" 
    } else { 
        LogWarn "(optional missing): $relativePath" 
    }
}

# Validate .iss Source paths
Write-Host ""
Write-Host "Validating Inno Setup source paths..." -ForegroundColor Yellow
$issFile = Join-Path $Root "installer/windows/IntelliLabGC.iss"
$issContent = Get-Content $issFile -Raw
$lines = $issContent -split "`r?`n"
$sourceCount = 0
$missingCount = 0

foreach($line in $lines) {
    if($line.Trim().StartsWith("Source:")) {
        $sourceCount++
        # Extract source path using simple string operations
        $quoteStart = $line.IndexOf('"')
        $quoteEnd = $line.IndexOf('"', $quoteStart + 1)
        if(($quoteStart -ge 0) -and ($quoteEnd -gt $quoteStart)) {
            $relPath = $line.Substring($quoteStart + 1, $quoteEnd - $quoteStart - 1)
            # Resolve relative to .iss file directory  
            $base = Split-Path $issFile -Parent
            try {
                $resolvedPath = Join-Path $base $relPath
                if(Test-Path $resolvedPath) {
                    if($Verbose) { LogOk "Source path: $relPath" }
                } else {
                    $missingCount++
                    LogWarn "Source path not found: $relPath"
                    if($Strict) { 
                        Fail "Strict mode: missing Source path $relPath" 
                    }
                }
            }
            catch {
                $missingCount++
                LogWarn "Could not resolve source path: $relPath"
                if($Strict) { 
                    Fail "Strict mode: could not resolve Source path $relPath" 
                }
            }
        }
    }
}

Write-Host ""
Write-Host "=== Verification Summary ===" -ForegroundColor Cyan
Log "Checked $sourceCount source paths in IntelliLabGC.iss"
if($missingCount -gt 0) {
    LogWarn "$missingCount source paths not found"
    if(-not $Strict) {
        Log "Use -Strict flag to fail on missing source paths"
    }
} else {
    LogOk "All source paths validated"
}

# Final status
Write-Host ""
if(($missingCount -eq 0) -or (-not $Strict)) {
    Write-Host "+ VERIFICATION PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to build installer!" -ForegroundColor White
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Open installer\windows\IntelliLabGC.iss in Inno Setup Compiler" -ForegroundColor Gray
    Write-Host "2. Click Build -> Compile (or press F9)" -ForegroundColor Gray
    Write-Host "3. Output: installer\windows\IntelliLabGC_Setup_1.0.0.exe" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "- VERIFICATION FAILED" -ForegroundColor Red
    Write-Host "Fix the issues above before building the installer." -ForegroundColor Red
    exit 1
}