@echo off
echo ====================================================
echo  IntelliLab GC Professional Platform - Startup
echo ====================================================
echo.

REM Check if we're in the correct directory
if not exist "backend\main.py" (
    echo ERROR: backend\main.py not found. Please run this script from the IntelliLab_GC_ModV2 directory.
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: frontend\package.json not found. Please run this script from the IntelliLab_GC_ModV2 directory.
    pause
    exit /b 1
)

echo Starting IntelliLab GC Professional Platform...
echo.

REM Start Backend Server (FastAPI with rigorous calculations)
echo [1/2] Starting Backend Server (FastAPI)...
echo Running on: http://localhost:8000
start "IntelliLab GC Backend" cmd /k "cd /d %~dp0backend && py main.py"
timeout /t 3 /nobreak > nul

REM Start Frontend Server (React with professional UI)
echo [2/2] Starting Frontend Server (React)...
echo Running on: http://localhost:3001
start "IntelliLab GC Frontend" cmd /k "cd /d %~dp0frontend && set PORT=3001 && npm start"

echo.
echo ====================================================
echo  IntelliLab GC Professional Platform - STARTED
echo ====================================================
echo.
echo Backend Server:  http://localhost:8000
echo Frontend Server: http://localhost:3001
echo.
echo Professional Features Available:
echo  - Beautiful Blue Gradient UI Design
echo  - NIST-Traceable Rigorous Calculations  
echo  - Detection Limit Calculator
echo  - Oven Ramp Calculator
echo  - Inlet Simulator
echo  - AI Troubleshooting Dashboard
echo  - Fleet Manager
echo  - And more...
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak > nul

REM Open browser to the professional UI
start http://localhost:3001

echo.
echo Both servers are now running!
echo Close this window or press Ctrl+C to stop the servers.
echo.
pause



