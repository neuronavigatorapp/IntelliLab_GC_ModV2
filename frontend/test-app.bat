@echo off
echo Starting IntelliLab GC Navigation Test...
echo.

echo Checking if development server is running...
netstat -ano | findstr :3000
if %errorlevel% neq 0 (
    echo ❌ Development server is not running on port 3000
    echo Starting development server...
    start "IntelliLab GC Dev Server" cmd /k "npm start"
    timeout /t 10 /nobreak >nul
) else (
    echo ✅ Development server is running on port 3000
)

echo.
echo Opening application in browser...
start http://localhost:3000

echo.
echo Opening test page...
start test-navigation.html

echo.
echo ✅ Test setup complete!
echo.
echo Instructions:
echo 1. Check the main application at http://localhost:3000
echo 2. Test navigation using the sidebar links
echo 3. Use the test buttons on the Dashboard
echo 4. Check browser console (F12) for any errors
echo 5. Verify all routes are working: /dashboard, /instruments, /methods, /analytics
echo.
pause 