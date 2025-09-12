@echo off
echo ========================================
echo INTELLILAB GC VETERAN TOOLS LAUNCHER
echo ========================================
echo.
echo Starting REAL chromatography tools with:
echo - Ghost Peak Identifier (Arrhenius equation)
echo - Void Volume Calculator (James-Martin factor)
echo - Peak Capacity Calculator (Davis-Giddings model)
echo - Backflush Calculator (retention physics)
echo.
echo These tools solve problems veterans face DAILY!
echo.
pause
echo.

echo Starting Backend Server...
cd backend
start "IntelliLab Backend" cmd /c "python main.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend...
cd ../frontend
start "IntelliLab Frontend" cmd /c "npm start"

echo.
echo Both servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Click "Veteran Tools" tab to access the new features!
echo.
pause
