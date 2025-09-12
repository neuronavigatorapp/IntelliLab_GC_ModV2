@echo off
echo 🔬 IntelliLab GC Comprehensive Testing Suite
echo ==========================================

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if backend is running
echo 🔍 Checking if backend is running...
curl -s http://localhost:8000/api/v1/health/status >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Backend is not running on http://localhost:8000
    echo Please start the backend server first:
    echo    cd backend
    echo    python main.py
    echo.
    set /p choice="Start backend automatically? (y/n): "
    if /i "!choice!"=="y" (
        echo Starting backend...
        start /b python backend/main.py
        timeout /t 10 /nobreak >nul
    ) else (
        echo Please start the backend manually and run this script again
        pause
        exit /b 1
    )
)

REM Install testing dependencies if needed
echo 📦 Checking testing dependencies...
pip show pytest >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing testing dependencies...
    pip install -r testing_requirements.txt
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Create test reports directory
if not exist "test_reports" mkdir test_reports

REM Run the comprehensive test suite
echo 🚀 Starting comprehensive test suite...
echo.
python run_all_tests.py

REM Check exit code
if %errorlevel% equ 0 (
    echo.
    echo 🎉 All tests completed successfully!
    echo 📊 Check the HTML report in test_reports/ folder
) else if %errorlevel% equ 1 (
    echo.
    echo ⚠️ Some tests failed - review the results
    echo 📊 Check the HTML report for details
) else if %errorlevel% equ 2 (
    echo.
    echo 🚨 Many tests failed - immediate attention required
    echo 📊 Check the HTML report for critical issues
) else (
    echo.
    echo ❌ Test execution encountered errors
    echo 📋 Check the logs for details
)

REM Open the latest report
echo.
set /p choice="Open test report in browser? (y/n): "
if /i "!choice!"=="y" (
    for /f "delims=" %%i in ('dir /b /o-d test_reports\test_report_*.html 2^>nul') do (
        start "" "test_reports\%%i"
        goto :report_opened
    )
    echo No HTML report found
    :report_opened
)

echo.
echo Press any key to exit...
pause >nul
