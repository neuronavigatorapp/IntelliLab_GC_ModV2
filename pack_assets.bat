@echo off
REM IntelliLab GC Asset Packing Batch Script
REM This script provides a simple interface to pack project assets

echo.
echo ===============================================
echo    IntelliLab GC Asset Packing Tool
echo ===============================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is required but not found.
    echo Please ensure PowerShell is installed and accessible.
    pause
    exit /b 1
)

REM Get destination path from user
set /p DEST_PATH="Enter destination folder path (or press Enter for 'assets_backup'): "

REM Use default if no input provided
if "%DEST_PATH%"=="" set DEST_PATH=assets_backup

echo.
echo Destination: %DEST_PATH%
echo.

REM Confirm with user
set /p CONFIRM="Proceed with asset packing? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Starting asset packing...
echo.

REM Execute PowerShell script
powershell -ExecutionPolicy Bypass -File "pack_assets.ps1" -DestinationPath "%DEST_PATH%"

if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo    Asset packing completed successfully!
    echo ===============================================
    echo.
    echo Assets have been copied to: %DEST_PATH%
    echo Check ASSET_INVENTORY.md for detailed information.
    echo.
) else (
    echo.
    echo ===============================================
    echo    Asset packing encountered errors!
    echo ===============================================
    echo.
    echo Please check the output above for details.
    echo.
)

echo Press any key to exit...
pause >nul

