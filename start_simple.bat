@echo off
title IntelliLab GC Professional Platform
echo ====================================================
echo  IntelliLab GC Professional Platform - Quick Start
echo ====================================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Check if required files exist
if not exist "backend\main.py" (
    echo ERROR: Backend files not found!
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: Frontend files not found!
    pause
    exit /b 1
)

echo Starting Backend Server...
cd backend
start /min "Backend Server" py main.py

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
cd ..\frontend
set PORT=3001
start /min "Frontend Server" npm start

echo.
echo ====================================================
echo  SERVERS STARTED SUCCESSFULLY!
echo ====================================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3001
echo.
echo Opening professional UI in 5 seconds...
timeout /t 5 /nobreak > nul

start http://localhost:3001

echo.
echo Professional IntelliLab GC Platform is now running!
echo Both servers are running in minimized windows.
echo.
pause