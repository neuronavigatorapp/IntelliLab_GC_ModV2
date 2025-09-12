@echo off
echo Starting IntelliLab GC Calculator Suite
echo =====================================

echo.
echo Installing Backend Dependencies...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "python -m uvicorn main:app --reload --port 8000"

echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Installing Frontend Dependencies...
cd /d "%~dp0frontend"
npm install

echo.
echo Starting Frontend Development Server...
start "Frontend Server" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo Health Check: http://localhost:8000/api/health
echo.
echo Available Calculators:
echo - Split Ratio Calculator
echo - Detection Limit Calculator
echo.
echo Press any key to close this window...
pause >nul
