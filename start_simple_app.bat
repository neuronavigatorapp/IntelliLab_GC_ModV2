@echo off
echo ========================================
echo   IntelliLab GC - Professional Toolkit
echo   Portfolio Showcase Application  
echo ========================================
echo.

REM Check if Python is available
py --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing basic dependencies...
pip install fastapi uvicorn pydantic numpy

echo.
echo Starting Backend Server...
echo Backend will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.

start "IntelliLab GC Backend" cmd /k "py simple_backend.py"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Opening Frontend...
echo Frontend will open in your default browser
echo If it doesn't open automatically, open: simple_frontend.html
echo.

start simple_frontend.html

echo.
echo ========================================
echo IntelliLab GC is now running!
echo.
echo Backend API: http://localhost:8000
echo Frontend: simple_frontend.html (opened in browser)
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to close this window...
pause >nul
