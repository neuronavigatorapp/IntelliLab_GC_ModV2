@echo off
echo 🚨 WINDOWS NUCLEAR CLEANUP STARTING...
echo.
echo This will perform a complete cleanup and restart of the frontend
echo.
pause

powershell -ExecutionPolicy Bypass -File "%~dp0reset.ps1"

echo.
echo ✅ Cleanup complete! Press any key to exit...
pause >nul

