# IntelliLab GC Comprehensive Testing Suite - PowerShell Version

Write-Host "🔬 IntelliLab GC Comprehensive Testing Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to test if a URL is accessible
function Test-Url($url) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 5 -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# Check if Python is available
Write-Host "🔍 Checking Python installation..." -ForegroundColor Yellow
if (-not (Test-Command "python")) {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ and try again" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$pythonVersion = python --version 2>&1
Write-Host "✅ Found: $pythonVersion" -ForegroundColor Green

# Check if backend is running
Write-Host "🔍 Checking if backend is running..." -ForegroundColor Yellow
$backendRunning = Test-Url "http://localhost:8000/api/v1/health/status"

if (-not $backendRunning) {
    Write-Host "⚠️ Backend is not running on http://localhost:8000" -ForegroundColor Yellow
    Write-Host "Please start the backend server first:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   python main.py" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Start backend automatically? (y/n)"
    if ($choice -eq "y" -or $choice -eq "Y") {
        Write-Host "Starting backend..." -ForegroundColor Yellow
        Start-Process -FilePath "python" -ArgumentList "backend/main.py" -NoNewWindow
        Write-Host "Waiting 10 seconds for backend to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Check again
        $backendRunning = Test-Url "http://localhost:8000/api/v1/health/status"
        if (-not $backendRunning) {
            Write-Host "❌ Backend failed to start automatically" -ForegroundColor Red
            Write-Host "Please start it manually and run this script again" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
    } else {
        Write-Host "Please start the backend manually and run this script again" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "✅ Backend is running and accessible" -ForegroundColor Green

# Check frontend (optional)
Write-Host "🔍 Checking if frontend is running..." -ForegroundColor Yellow
$frontendRunning = Test-Url "http://localhost:3000"

if ($frontendRunning) {
    Write-Host "✅ Frontend is running and accessible" -ForegroundColor Green
} else {
    Write-Host "⚠️ Frontend is not running (UI tests will be skipped)" -ForegroundColor Yellow
    Write-Host "To include UI tests, start frontend with:" -ForegroundColor Yellow
    Write-Host "   cd frontend && npm start" -ForegroundColor White
}

# Install testing dependencies if needed
Write-Host "📦 Checking testing dependencies..." -ForegroundColor Yellow
$pytestInstalled = python -c "import pytest" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing testing dependencies..." -ForegroundColor Yellow
    pip install -r testing_requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Testing dependencies are already installed" -ForegroundColor Green
}

# Create test reports directory
if (-not (Test-Path "test_reports")) {
    New-Item -ItemType Directory -Path "test_reports" | Out-Null
    Write-Host "📁 Created test_reports directory" -ForegroundColor Green
}

# Run the comprehensive test suite
Write-Host ""
Write-Host "🚀 Starting comprehensive test suite..." -ForegroundColor Cyan
Write-Host "This may take several minutes..." -ForegroundColor Yellow
Write-Host ""

$startTime = Get-Date
python run_all_tests.py
$exitCode = $LASTEXITCODE
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "⏱️ Test execution completed in $($duration.TotalSeconds.ToString('F1')) seconds" -ForegroundColor Cyan

# Interpret exit code and provide feedback
switch ($exitCode) {
    0 {
        Write-Host "🎉 All tests completed successfully!" -ForegroundColor Green
        Write-Host "📊 System is ready for production use" -ForegroundColor Green
    }
    1 {
        Write-Host "⚠️ Some tests failed - review the results" -ForegroundColor Yellow
        Write-Host "📊 Check the HTML report for details" -ForegroundColor Yellow
    }
    2 {
        Write-Host "🚨 Many tests failed - immediate attention required" -ForegroundColor Red
        Write-Host "📊 Check the HTML report for critical issues" -ForegroundColor Red
    }
    130 {
        Write-Host "⏹️ Test execution was interrupted by user" -ForegroundColor Yellow
    }
    default {
        Write-Host "❌ Test execution encountered errors (exit code: $exitCode)" -ForegroundColor Red
        Write-Host "📋 Check the logs for details" -ForegroundColor Red
    }
}

# Find and offer to open the latest report
Write-Host ""
$latestReport = Get-ChildItem -Path "test_reports" -Filter "test_report_*.html" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestReport) {
    Write-Host "📊 Test report generated: $($latestReport.Name)" -ForegroundColor Cyan
    $choice = Read-Host "Open test report in browser? (y/n)"
    if ($choice -eq "y" -or $choice -eq "Y") {
        Start-Process $latestReport.FullName
    }
} else {
    Write-Host "⚠️ No HTML report found - check for errors in test execution" -ForegroundColor Yellow
}

# Show additional files generated
Write-Host ""
Write-Host "📁 Generated files:" -ForegroundColor Cyan
Get-ChildItem -Path "." -Filter "*test_results*.json" | ForEach-Object {
    Write-Host "   $($_.Name)" -ForegroundColor White
}
Get-ChildItem -Path "test_reports" -Filter "*.html" | Sort-Object LastWriteTime -Descending | Select-Object -First 3 | ForEach-Object {
    Write-Host "   test_reports/$($_.Name)" -ForegroundColor White
}

Write-Host ""
Write-Host "🔬 Testing complete! Thank you for ensuring IntelliLab GC quality." -ForegroundColor Cyan
Read-Host "Press Enter to exit"
