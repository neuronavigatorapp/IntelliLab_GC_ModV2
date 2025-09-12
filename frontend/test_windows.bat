@echo off
echo 🧪 WINDOWS REACT APP TEST
echo.
echo Testing minimal React application...
echo.

REM Navigate to frontend directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo ❌ node_modules not found. Running npm install...
    npm install
    if errorlevel 1 (
        echo ❌ npm install failed!
        pause
        exit /b 1
    )
)

REM Check if src directory exists
if not exist "src" (
    echo ❌ src directory not found!
    pause
    exit /b 1
)

REM Check if App.tsx exists
if not exist "src\App.tsx" (
    echo ❌ App.tsx not found!
    pause
    exit /b 1
)

echo ✅ All files present
echo ✅ Starting React development server...
echo.
echo 🚀 Application will open at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause

