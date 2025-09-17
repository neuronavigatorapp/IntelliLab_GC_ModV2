@echo off
REM IntelliLab GC - Shutdown Script
title IntelliLab GC - Shutdown

echo.
echo ======================================================
echo            IntelliLab GC - Stopping Services
echo ======================================================
echo.

echo Stopping all IntelliLab GC processes...

REM Force stop Node.js processes (Frontend)
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Frontend server stopped
) else (
    echo - No frontend processes found
)

REM Force stop Python processes (Backend) 
taskkill /F /IM python.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Backend server stopped
) else (
    echo - No backend processes found
)

REM Also try to stop specific uvicorn processes
wmic process where "commandline like '%%uvicorn%%backend.main%%'" delete 2>nul

echo.
echo All IntelliLab GC services have been stopped.
echo.
pause