@echo off
:: Windows CMD wrapper for PowerShell startup script
:: This ensures the PowerShell script runs even if execution policy is restricted

setlocal enabledelayedexpansion

:: Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%start_local.ps1"

:: Check if PowerShell script exists
if not exist "%PS_SCRIPT%" (
    echo ERROR: PowerShell script not found: %PS_SCRIPT%
    echo Please ensure start_local.ps1 is in the same directory as this batch file.
    pause
    exit /b 1
)

:: Try to run PowerShell script with bypass execution policy
echo Starting IntelliLab GC...
echo Running: %PS_SCRIPT%

powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%PS_SCRIPT%" %*

:: Check exit code
if !ERRORLEVEL! neq 0 (
    echo.
    echo ERROR: Failed to start IntelliLab GC ^(Exit Code: !ERRORLEVEL!^)
    echo.
    echo Common solutions:
    echo - Ensure Python 3.8+ is installed and in PATH
    echo - Ensure Node.js and npm are installed and in PATH
    echo - Run as Administrator if installation was done with admin privileges
    echo - Check that all dependencies are properly installed
    echo.
    pause
    exit /b !ERRORLEVEL!
)

echo.
echo IntelliLab GC startup script completed.
pause
