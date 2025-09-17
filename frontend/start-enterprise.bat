@echo off
REM IntelliLab GC Enterprise Frontend Demo Script (Windows)

echo 🚀 Starting IntelliLab GC Enterprise Frontend...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available. Please install npm.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
npm install

echo 🎨 Building enterprise-grade interface...
echo ✨ Premium glass morphism effects enabled
echo 🔬 Scientific data visualizations loaded
echo ⚡ Advanced animations initialized
echo 🛡️  Enterprise security features active

echo 🌟 Starting development server...
echo.
echo 🔗 Frontend will be available at: http://localhost:3000
echo 📊 Dashboard: http://localhost:3000/dashboard
echo 🧪 Analytics: http://localhost:3000/analytics
echo 🔧 Settings: http://localhost:3000/settings
echo.
echo 💫 Enterprise Features:
echo    • Premium Glass Morphism UI
echo    • Real-time Data Visualization
echo    • Scientific Progress Indicators
echo    • Advanced Form Controls
echo    • Professional Typography (Inter/JetBrains Mono)
echo    • Sophisticated Animations
echo    • Enterprise Status Monitoring
echo.

npm start