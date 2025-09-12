@echo off
setlocal enabledelayedexpansion

:: IntelliLab GC - Professional Gas Chromatography Platform
:: Startup Script for Windows
:: Version: 4.0.0 - Enhanced with better error handling and diagnostics

echo.
echo ========================================
echo    IntelliLab GC - Startup Script
echo ========================================
echo.

:: Set error handling
set "ERROR_COUNT=0"

:: Check if Python is installed
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again.
    echo Download from: https://www.python.org/downloads/
    set /a ERROR_COUNT+=1
    goto :check_errors
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set "PYTHON_VERSION=%%i"
    echo ✅ Python found: !PYTHON_VERSION!
)

:: Check if Node.js is installed
echo [2/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again.
    echo Download from: https://nodejs.org/
    set /a ERROR_COUNT+=1
    goto :check_errors
) else (
    for /f "tokens=1" %%i in ('node --version 2^>^&1') do set "NODE_VERSION=%%i"
    echo ✅ Node.js found: !NODE_VERSION!
)

:: Check if npm is available
echo [3/6] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm is not installed or not in PATH
    echo Please install npm and try again.
    set /a ERROR_COUNT+=1
    goto :check_errors
) else (
    for /f "tokens=1" %%i in ('npm --version 2^>^&1') do set "NPM_VERSION=%%i"
    echo ✅ npm found: !NPM_VERSION!
)

:: Check if Git is available (optional)
echo [4/6] Checking Git installation...
git --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WARNING: Git not found. Some features may be limited.
    set "GIT_AVAILABLE=false"
) else (
    for /f "tokens=3" %%i in ('git --version 2^>^&1') do set "GIT_VERSION=%%i"
    echo ✅ Git found: !GIT_VERSION!
    set "GIT_AVAILABLE=true"
)

:: Check if Docker is available (optional)
echo [5/6] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WARNING: Docker not found. Docker deployment option will be disabled.
    set "DOCKER_AVAILABLE=false"
) else (
    for /f "tokens=3" %%i in ('docker --version 2^>^&1') do set "DOCKER_VERSION=%%i"
    echo ✅ Docker found: !DOCKER_VERSION!
    set "DOCKER_AVAILABLE=true"
)

:: Check disk space
echo [6/6] Checking disk space...
for /f "tokens=3" %%i in ('dir /-c 2^>nul ^| find "bytes free"') do set "FREE_SPACE=%%i"
if !FREE_SPACE! LSS 1000000000 (
    echo ⚠️  WARNING: Low disk space detected. Consider freeing up space.
) else (
    echo ✅ Sufficient disk space available
)

:check_errors
if %ERROR_COUNT% GTR 0 (
    echo.
    echo ❌ Environment check failed with %ERROR_COUNT% error(s)
    echo Please fix the issues above and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Environment check passed successfully!
echo.

:: Display startup options
echo Choose startup mode:
echo.
echo 1. 🚀 Development Mode (Backend + Frontend) - RECOMMENDED
echo 2. 🔧 Backend Only (API Server)
echo 3. 🎨 Frontend Only (React App)
echo 4. 🐳 Docker Development (if available)
echo 5. 🏭 Docker Production (if available)
echo 6. 📊 Status Check (Check all services)
echo 7. 🧹 Clean Install (Fresh dependencies)
echo 8. 🔍 Diagnostics (Run system diagnostics)
echo 9. ❌ Exit
echo.

set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto dev_mode
if "%choice%"=="2" goto backend_only
if "%choice%"=="3" goto frontend_only
if "%choice%"=="4" goto docker_dev
if "%choice%"=="5" goto docker_prod
if "%choice%"=="6" goto status_check
if "%choice%"=="7" goto clean_install
if "%choice%"=="8" goto diagnostics
if "%choice%"=="9" goto exit_script
goto invalid_choice

:dev_mode
echo.
echo 🚀 Starting Development Mode...
echo.
echo This will start both backend and frontend in development mode.
echo.

:: Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

:: Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ Failed to activate virtual environment
    pause
    exit /b 1
)

:: Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
python -m pip install --upgrade pip setuptools wheel
if errorlevel 1 (
    echo ❌ Failed to upgrade pip
    pause
    exit /b 1
)

python -m pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

:: Start backend server
echo 🚀 Starting backend server...
start "IntelliLab GC Backend" cmd /k "cd backend & call ..\venv\Scripts\activate.bat & python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
npm install
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

:: Start frontend server
echo 🚀 Starting frontend server...
start "IntelliLab GC Frontend" cmd /k "cd frontend & npm start"

:: Return to root directory
cd ..

echo.
echo ✅ Development mode started successfully!
echo.
echo 🌐 Services:
echo    Backend: http://localhost:8000
echo    Frontend: http://localhost:3000
echo    API Docs: http://localhost:8000/docs
echo.
echo 📝 Notes:
echo    - Backend will auto-reload on file changes
echo    - Frontend will auto-reload on file changes
echo    - Check the opened command windows for any errors
echo.
echo Press any key to close this window...
pause > nul
goto exit_script

:backend_only
echo.
echo 🔧 Starting Backend Only...
echo.

:: Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

:: Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

:: Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt

:: Start backend server
echo 🚀 Starting backend server...
start "IntelliLab GC Backend" cmd /k "cd backend & call ..\venv\Scripts\activate.bat & python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

cd ..

echo.
echo ✅ Backend started successfully!
echo.
echo 🌐 Services:
echo    Backend: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo Press any key to close this window...
pause > nul
goto exit_script

:frontend_only
echo.
echo 🎨 Starting Frontend Only...
echo.

:: Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
npm install

:: Start frontend server
echo 🚀 Starting frontend server...
start "IntelliLab GC Frontend" cmd /k "cd frontend & npm start"

cd ..

echo.
echo ✅ Frontend started successfully!
echo.
echo 🌐 Services:
echo    Frontend: http://localhost:3000
echo.
echo ⚠️  Note: Backend API will not be available
echo.
echo Press any key to close this window...
pause > nul
goto exit_script

:docker_dev
if "%DOCKER_AVAILABLE%"=="false" (
    echo ❌ ERROR: Docker is not available
    echo Please install Docker Desktop and try again.
    pause
    goto exit_script
)

echo.
echo 🐳 Starting Docker Development Mode...
echo.

:: Check if docker-compose.yml exists
if not exist "docker-compose.dev.yml" (
    echo ❌ ERROR: docker-compose.dev.yml not found
    pause
    goto exit_script
)

:: Start Docker development environment
echo 🚀 Starting Docker development environment...
docker-compose -f docker-compose.dev.yml up --build

echo.
echo ✅ Docker development mode started!
echo.
echo Press any key to close this window...
pause > nul
goto exit_script

:docker_prod
if "%DOCKER_AVAILABLE%"=="false" (
    echo ❌ ERROR: Docker is not available
    echo Please install Docker Desktop and try again.
    pause
    goto exit_script
)

echo.
echo 🏭 Starting Docker Production Mode...
echo.

:: Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo ❌ ERROR: docker-compose.yml not found
    pause
    goto exit_script
)

:: Start Docker production environment
echo 🚀 Starting Docker production environment...
docker-compose up --build -d

echo.
echo ✅ Docker production mode started!
echo.
echo Press any key to close this window...
pause > nul
goto exit_script

:status_check
echo.
echo 📊 Checking IntelliLab GC Services Status...
echo.

:: Check backend
echo 🔧 Checking Backend...
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend not running
) else (
    echo ✅ Backend running on http://localhost:8000
)

:: Check frontend
echo 🎨 Checking Frontend...
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend not running
) else (
    echo ✅ Frontend running on http://localhost:3000
)

:: Check Docker containers
if "%DOCKER_AVAILABLE%"=="true" (
    echo 🐳 Checking Docker containers...
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "intellilab" >nul 2>&1
    if errorlevel 1 (
        echo No IntelliLab containers running
    ) else (
        echo ✅ Docker containers running
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "intellilab"
    )
)

:: Check virtual environment
if exist "venv" (
    echo ✅ Virtual environment exists
) else (
    echo ❌ Virtual environment not found
)

:: Check node_modules
if exist "frontend\node_modules" (
    echo ✅ Frontend dependencies installed
) else (
    echo ❌ Frontend dependencies not installed
)

echo.
echo Press any key to close this window...
pause > nul
goto exit_script

:clean_install
echo.
echo 🧹 Starting Clean Install...
echo This will remove all dependencies and reinstall them.
echo.

set /p confirm="Are you sure you want to continue? (y/N): "
if /i not "%confirm%"=="y" goto exit_script

echo 🗑️  Cleaning up...

:: Remove virtual environment
if exist "venv" (
    echo Removing virtual environment...
    rmdir /s /q venv
)

:: Remove node_modules
if exist "frontend\node_modules" (
    echo Removing frontend node_modules...
    rmdir /s /q frontend\node_modules
)

:: Remove package-lock.json
if exist "frontend\package-lock.json" (
    echo Removing package-lock.json...
    del frontend\package-lock.json
)

:: Remove Python cache
if exist "__pycache__" (
    echo Removing Python cache...
    rmdir /s /q __pycache__
)

:: Remove backend cache
if exist "backend\__pycache__" (
    echo Removing backend cache...
    rmdir /s /q backend\__pycache__
)

:: Remove database files
if exist "backend\intellilab_gc.db" (
    echo Removing database file...
    del backend\intellilab_gc.db
)

echo.
echo ✅ Clean install completed!
echo Run the script again to start fresh.
echo.
echo Press any key to close this window...
pause > nul
goto exit_script

:diagnostics
echo.
echo 🔍 Running System Diagnostics...
echo.

echo 📋 System Information:
echo    OS: %OS%
echo    Architecture: %PROCESSOR_ARCHITECTURE%
echo    Python: !PYTHON_VERSION!
echo    Node.js: !NODE_VERSION!
echo    npm: !NPM_VERSION!

if "%GIT_AVAILABLE%"=="true" (
    echo    Git: !GIT_VERSION!
) else (
    echo    Git: Not available
)

if "%DOCKER_AVAILABLE%"=="true" (
    echo    Docker: !DOCKER_VERSION!
) else (
    echo    Docker: Not available
)

echo.
echo 📁 Directory Structure Check:
if exist "backend" echo ✅ Backend directory exists
if exist "frontend" echo ✅ Frontend directory exists
if exist "venv" echo ✅ Virtual environment exists
if exist "backend\requirements.txt" echo ✅ Backend requirements.txt exists
if exist "frontend\package.json" echo ✅ Frontend package.json exists

echo.
echo 🔧 Dependency Check:
if exist "backend\requirements.txt" (
    echo ✅ Backend requirements file found
) else (
    echo ❌ Backend requirements file missing
)

if exist "frontend\package.json" (
    echo ✅ Frontend package.json found
) else (
    echo ❌ Frontend package.json missing
)

echo.
echo 🌐 Network Check:
ping -n 1 127.0.0.1 >nul 2>&1
if errorlevel 1 (
    echo ❌ Localhost not responding
) else (
    echo ✅ Localhost responding
)

echo.
echo Press any key to close this window...
pause > nul
goto exit_script

:invalid_choice
echo.
echo ❌ Invalid choice. Please enter a number between 1 and 9.
echo.
echo Press any key to continue...
pause > nul
goto exit_script

:exit_script
echo.
echo Thank you for using IntelliLab GC!
echo.
exit /b 0
