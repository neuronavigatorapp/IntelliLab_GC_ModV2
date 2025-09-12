@echo off
echo Starting IntelliLab GC - Basic Mode
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    pause
    exit /b 1
)

echo Initializing database with Phase 6 sample data...
cd backend
python init_sample_data.py

echo Starting Backend Server...
start "Backend Server" cmd /k "python main.py"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend (Basic Mode)...
cd ..\frontend

REM Try to install dependencies first
echo Installing dependencies...
call npm install

REM Try to start with basic React scripts
echo Starting React development server...
start "Frontend Server" cmd /k "npm run start"

echo.
echo ========================================
echo IntelliLab GC is starting up!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo If the frontend doesn't start, try:
echo 1. cd frontend
echo 2. npm install
echo 3. npm start
echo.
echo Press any key to close this window...
pause >nul
