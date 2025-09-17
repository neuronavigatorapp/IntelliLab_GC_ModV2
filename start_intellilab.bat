@echo off
REM IntelliLab GC - Complete Application Startup Script
REM This script starts both frontend (Vite) and backend (FastAPI) services

title IntelliLab GC - Application Startup

echo.
echo ======================================================
echo             IntelliLab GC Application Startup
echo ======================================================
echo.

REM Check if we're in the correct directory
if not exist "frontend\package.json" (
    echo ERROR: Cannot find frontend\package.json
    echo Please run this script from the IntelliLab_GC_ModV2 directory
    pause
    exit /b 1
)

if not exist "backend\main.py" (
    echo ERROR: Cannot find backend\main.py
    echo Please run this script from the IntelliLab_GC_ModV2 directory
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv\Scripts\python.exe" (
    echo ERROR: Python virtual environment not found at venv\Scripts\python.exe
    echo Please ensure the virtual environment is set up correctly
    pause
    exit /b 1
)

echo [1/4] Stopping any existing processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul
timeout /t 2 >nul

echo [2/4] Starting Backend Server (FastAPI on port 8000)...
echo.
start "IntelliLab GC Backend" cmd /k "echo Starting Backend Server... && cd /d %~dp0 && venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0"

REM Wait for backend to initialize
echo Waiting for backend to start...
timeout /t 5 >nul

echo [3/4] Starting Frontend Server (Vite on port 5173)...
echo.
start "IntelliLab GC Frontend" cmd /k "echo Starting Frontend Server... && cd /d %~dp0frontend && npm start"

REM Wait for frontend to initialize
echo Waiting for frontend to start...
timeout /t 8 >nul

echo [4/4] Performing health checks...
echo.

REM Check backend health
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/health' -TimeoutSec 10; Write-Host '✓ Backend: ' -NoNewline -ForegroundColor Green; Write-Host $response.status -ForegroundColor Cyan } catch { Write-Host '✗ Backend: Not responding' -ForegroundColor Red }"

REM Check frontend (simple connectivity test)
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 10; Write-Host '✓ Frontend: HTTP ' -NoNewline -ForegroundColor Green; Write-Host $response.StatusCode -ForegroundColor Cyan } catch { Write-Host '✗ Frontend: Not responding' -ForegroundColor Red }"

echo.
echo ======================================================
echo                   🚀 SERVICES READY 🚀
echo ======================================================
echo.
echo 🌐 Frontend (React + Vite):  http://localhost:5174
echo 🔧 Backend API (FastAPI):    http://localhost:8000
echo 📚 API Documentation:        http://localhost:8000/docs
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open the application in default browser
start http://localhost:5174

echo.
echo Application opened! Keep this window open to see startup status.
echo Close this window or press Ctrl+C to stop all services.
echo.
pause