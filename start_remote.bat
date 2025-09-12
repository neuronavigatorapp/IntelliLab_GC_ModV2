@echo off
echo Starting IntelliLab GC for Remote Access
echo.

echo Starting Backend Server (Remote Access)...
cd backend
start "IntelliLab GC Backend" cmd /k "python main.py"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend (Mobile Access)...
cd ../frontend
start "IntelliLab GC Frontend" cmd /k "npm run start-mobile"

echo.
echo ========================================
echo IntelliLab GC is starting up for remote access!
echo.
echo Backend: http://0.0.0.0:8000
echo Frontend: http://0.0.0.0:3000
echo.
echo Tailscale Access:
echo Backend: http://[your-tailscale-ip]:8000
echo Frontend: http://[your-tailscale-ip]:3000
echo.
echo ========================================
pause

