@echo off
echo Starting IntelliLab GC Frontend in Demo Mode...
echo.
echo This will start the React development server with demo data.
echo The app will work without a backend server.
echo.
echo Press Ctrl+C to stop the server.
echo.

cd /d "%~dp0"
npm start
