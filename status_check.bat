@echo off
REM IntelliLab GC - Status Check Script
title IntelliLab GC - Status Check

echo.
echo ======================================================
echo             IntelliLab GC - Status Check
echo ======================================================
echo.

echo Checking running processes...
set frontend_running=0
set backend_running=0

REM Check for Node.js processes
for /f %%i in ('tasklist /fi "imagename eq node.exe" 2^>nul ^| find /c "node.exe"') do (
    if %%i GTR 0 (
        echo ✓ Frontend: Node.js process detected
        set frontend_running=1
    ) else (
        echo ✗ Frontend: No Node.js processes found
    )
)

REM Check for Python processes
for /f %%i in ('tasklist /fi "imagename eq python.exe" 2^>nul ^| find /c "python.exe"') do (
    if %%i GTR 0 (
        echo ✓ Backend: Python process detected
        set backend_running=1
    ) else (
        echo ✗ Backend: No Python processes found
    )
)

echo.
echo Checking port connectivity...

REM Check backend port 8000
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/health' -TimeoutSec 5; Write-Host '✓ Backend API: ' -NoNewline -ForegroundColor Green; Write-Host $response.status -ForegroundColor Cyan } catch { Write-Host '✗ Backend API: Not responding on port 8000' -ForegroundColor Red }"

REM Check frontend port 5173
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 5; Write-Host '✓ Frontend: Responding on port 5173 (HTTP ' -NoNewline -ForegroundColor Green; Write-Host $response.StatusCode -NoNewline -ForegroundColor Cyan; Write-Host ')' -ForegroundColor Green } catch { Write-Host '✗ Frontend: Not responding on port 5173' -ForegroundColor Red }"

echo.
echo Current listening ports:
netstat -an | findstr ":5173\|:8000" | findstr LISTENING

if %frontend_running%==1 if %backend_running%==1 (
    echo.
    echo 🚀 Status: Both services appear to be running
    echo 🌐 Frontend: http://localhost:5173
    echo 🔧 Backend:  http://localhost:8000
    echo 📚 API Docs: http://localhost:8000/docs
) else (
    echo.
    echo ⚠️  Status: Some services may not be running
    echo Run start_intellilab.bat to start all services
)

echo.
pause