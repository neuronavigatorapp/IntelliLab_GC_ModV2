@echo off
REM Quick Start - IntelliLab GC (Development Mode)
title IntelliLab GC - Quick Start

echo Starting IntelliLab GC Application...

REM Kill any existing processes
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul

REM Start backend
start "Backend" cmd /k "cd /d %~dp0 && venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0"

REM Start frontend  
start "Frontend" cmd /k "cd /d %~dp0frontend && npm start"

REM Wait and open browser
timeout /t 10 >nul
start http://localhost:5174

echo.
echo Services started! Check the opened terminal windows for status.
echo Frontend: http://localhost:5174
echo Backend:  http://localhost:8000
echo.
pause