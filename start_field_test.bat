@echo off
echo ========================================
echo IntelliLab GC - Field Test Startup
echo ========================================
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
cd ..

echo.
echo Starting Frontend Development Server...
cd frontend
start "Frontend Server" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo Services Starting...
echo ========================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to open the application...
pause > nul
start http://localhost:3000

echo.
echo Field test ready! The application will open in your browser.
echo.
echo To stop the servers, close the command windows that opened.
pause
