@echo off
setlocal enableextensions
title IntelliLab GC - Shutdown Script

echo ==============================================
echo   IntelliLab GC - Shutdown Script
echo ==============================================

for %%P in (8000 5173) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr /r /c:":%%P .*LISTENING"') do (
    echo [INFO] Stopping PID %%I on port %%P...
    taskkill /PID %%I /T /F >nul 2>&1
  )
)

echo.
echo [OK] Ports 8000 and 5173 should now be free.
endlocal