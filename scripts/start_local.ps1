# PowerShell startup script for IntelliLab GC local installation
# This script sets up the environment, starts backend/frontend, and opens browser

param(
    [switch]$Preview,           # Build frontend for production preview
    [switch]$SkipBrowser,       # Don't open browser automatically
    [switch]$DevMode,           # Start in development mode with hot reload
    [string]$DataDir = "C:\IntelliLab_GC\Data",
    [string]$BackendPort = "8000",
    [string]$FrontendPort = "5173"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppRoot = Split-Path -Parent $ScriptDir

# Set up logging
$LogsDir = Join-Path $AppRoot "logs"
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}
$LogFile = Join-Path $LogsDir "start.log"
Start-Transcript -Path $LogFile -Append

try {
    Write-Host "=== IntelliLab GC Startup ===" -ForegroundColor Cyan
    Write-Host "Script Version: 1.0.2" -ForegroundColor Gray
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host "App Root: $AppRoot" -ForegroundColor Gray
    Write-Host "Data Dir: $DataDir" -ForegroundColor Gray
    Write-Host "Log File: $LogFile" -ForegroundColor Gray

    # Pre-flight checks
    Write-Host "=== Pre-flight Checks ===" -ForegroundColor Yellow
    
    # Check Python version
    try {
        $PythonVersion = & python --version 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Python not found" }
        $VersionMatch = $PythonVersion -match "Python (\d+)\.(\d+)"
        if ($VersionMatch) {
            $MajorVersion = [int]$Matches[1]
            $MinorVersion = [int]$Matches[2]
            if ($MajorVersion -lt 3 -or ($MajorVersion -eq 3 -and $MinorVersion -lt 10)) {
                throw "Python version $($Matches[1]).$($Matches[2]) is too old. Requires Python 3.10+"
            }
            Write-Host "✓ Python version check passed: $PythonVersion" -ForegroundColor Green
        } else {
            throw "Could not parse Python version"
        }
    } catch {
        Write-Error "FAIL: Python ≥3.10 required but not found or version too old. Please install Python 3.10+ and ensure it's in PATH."
        exit 1
    }

    # Check Node.js version
    try {
        $NodeVersion = & node --version 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Node.js not found" }
        $VersionMatch = $NodeVersion -match "v(\d+)\.(\d+)"
        if ($VersionMatch) {
            $MajorVersion = [int]$Matches[1]
            if ($MajorVersion -lt 18) {
                throw "Node.js version v$($Matches[1]).$($Matches[2]) is too old. Requires Node.js 18+"
            }
            Write-Host "✓ Node.js version check passed: $NodeVersion" -ForegroundColor Green
        } else {
            throw "Could not parse Node.js version"
        }
    } catch {
        Write-Error "FAIL: Node.js ≥18 required but not found or version too old. Please install Node.js 18+ and ensure it's in PATH."
        exit 1
    }

    # Check disk space
    $AppRootDrive = Split-Path -Qualifier $AppRoot
    $DataDirDrive = Split-Path -Qualifier $DataDir
    $AppSpace = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='$AppRootDrive'" | Select-Object -ExpandProperty FreeSpace
    $DataSpace = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='$DataDirDrive'" | Select-Object -ExpandProperty FreeSpace
    
    $AppSpaceGB = [math]::Round($AppSpace / 1GB, 2)
    $DataSpaceGB = [math]::Round($DataSpace / 1GB, 2)
    
    Write-Host "✓ Free space - App drive ($AppRootDrive): $AppSpaceGB GB" -ForegroundColor Green
    Write-Host "✓ Free space - Data drive ($DataDirDrive): $DataSpaceGB GB" -ForegroundColor Green
    
    if ($AppSpaceGB -lt 1) {
        Write-Warning "Low disk space on app drive: $AppSpaceGB GB. Consider freeing up space."
    }
    if ($DataSpaceGB -lt 2) {
        Write-Warning "Low disk space on data drive: $DataSpaceGB GB. Consider freeing up space."
    }

    # Kill stale processes on ports
    Write-Host "=== Cleaning up stale processes ===" -ForegroundColor Yellow
    $PortsToKill = @($BackendPort, $FrontendPort)
    foreach ($Port in $PortsToKill) {
        try {
            $Process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($Process) {
                $ProcessId = $Process.OwningProcess
                $ProcessName = (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue).ProcessName
                Write-Host "Killing process $ProcessName (PID: $ProcessId) on port $Port" -ForegroundColor Yellow
                Stop-Process -Id $ProcessId -Force
                Start-Sleep -Seconds 2
                Write-Host "✓ Port $Port cleared" -ForegroundColor Green
            } else {
                Write-Host "✓ Port $Port is free" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠ Could not check/clear port $Port" -ForegroundColor Yellow
        }
    }

    # Set time-boxed install environment variables
    $env:PIP_DEFAULT_TIMEOUT = "120"
    $env:npm_config_fetch_retries = "3"
    $env:npm_config_fetch_retry_maxtimeout = "120000"

    # Ensure data directory exists
    if (-not (Test-Path $DataDir)) {
        Write-Host "Creating data directory: $DataDir" -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
    }

    # Set up Python virtual environment
    Write-Host "=== Python Environment Setup ===" -ForegroundColor Green
    $VenvPath = Join-Path $AppRoot "venv"

    if (-not (Test-Path $VenvPath)) {
        Write-Host "Creating virtual environment..." -ForegroundColor Yellow
        Set-Location $AppRoot
        try {
            python -m venv venv
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to create virtual environment"
            }
            Write-Host "✓ Virtual environment created successfully" -ForegroundColor Green
        } catch {
            Write-Error "FAIL: Failed to create virtual environment. Python installation may be corrupted."
            exit 1
        }
    } else {
        Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
    }

    # Activate virtual environment
    $ActivateScript = Join-Path $VenvPath "Scripts\Activate.ps1"
    if (Test-Path $ActivateScript) {
        Write-Host "Activating virtual environment..." -ForegroundColor Yellow
        try {
            & $ActivateScript
            Write-Host "✓ Virtual environment activated" -ForegroundColor Green
        } catch {
            Write-Error "FAIL: Could not activate virtual environment"
            exit 1
        }
    } else {
        Write-Error "FAIL: Could not find virtual environment activation script at: $ActivateScript"
        exit 1
    }

    # Install Python dependencies with fallback paths
    Write-Host "=== Python Dependencies ===" -ForegroundColor Green
    $RequirementsPath = Join-Path $AppRoot "backend\requirements.txt"
    
    # Check for bundled wheels (offline installation)
    $WheelsDir = Join-Path $AppRoot "installer\wheels"
    $InstalledWheelsDir = Join-Path $AppRoot "..\installer\wheels"  # When installed
    
    if (Test-Path $WheelsDir) {
        Write-Host "Found bundled wheels directory: $WheelsDir" -ForegroundColor Cyan
        $UseWheels = $WheelsDir
    } elseif (Test-Path $InstalledWheelsDir) {
        Write-Host "Found installed wheels directory: $InstalledWheelsDir" -ForegroundColor Cyan
        $UseWheels = $InstalledWheelsDir
    } else {
        $UseWheels = $null
    }

    if (Test-Path $RequirementsPath) {
        Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
        try {
            if ($UseWheels) {
                Write-Host "Using offline wheels from: $UseWheels" -ForegroundColor Cyan
                pip install --no-index --find-links "$UseWheels" -r $RequirementsPath --default-timeout 120
            } else {
                Write-Host "Installing from PyPI..." -ForegroundColor Yellow
                pip install -r $RequirementsPath --default-timeout 120 --retries 3
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Python dependencies installed successfully" -ForegroundColor Green
            } else {
                Write-Warning "Some Python dependencies may have failed to install. Attempting to continue..."
            }
        } catch {
            Write-Warning "Python dependency installation encountered errors. Attempting to continue..."
        }
    } else {
        Write-Warning "WARN: Requirements file not found at: $RequirementsPath. Continuing without additional dependencies."
    }

    # Run database migration and setup
    Write-Host "=== Database Setup ===" -ForegroundColor Green
    Set-Location $AppRoot
    $SetupScript = Join-Path $AppRoot "scripts\setup_environment.py"
    if (Test-Path $SetupScript) {
        try {
            Write-Host "Running database migration and setup..." -ForegroundColor Yellow
            python $SetupScript --migrate --load-compounds "backend/ai/compound_library.csv" --load-faults "backend/ai/fault_library.json"
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Database setup completed successfully" -ForegroundColor Green
            } else {
                Write-Warning "Database setup completed with warnings. Continuing..."
            }
        } catch {
            Write-Warning "Database setup encountered errors. Continuing..."
        }
    } else {
        Write-Warning "WARN: Setup script not found. Database may not be properly initialized."
    }

    # Prepare frontend with fallback paths
    Write-Host "=== Frontend Setup ===" -ForegroundColor Green
    $FrontendDir = Join-Path $AppRoot "frontend"
    Set-Location $FrontendDir

    # Check for prebuilt frontend (Preview mode optimization)
    $DistDir = Join-Path $FrontendDir "dist"
    $BuildDir = Join-Path $FrontendDir "build"
    $NodeModulesDir = Join-Path $FrontendDir "node_modules"

    if ($Preview -and (Test-Path $DistDir)) {
        Write-Host "✓ Found prebuilt frontend in dist/, skipping npm install" -ForegroundColor Cyan
        $SkipNpmInstall = $true
    } elseif ($Preview -and (Test-Path $BuildDir)) {
        Write-Host "✓ Found prebuilt frontend in build/, skipping npm install" -ForegroundColor Cyan
        $SkipNpmInstall = $true
    } elseif (Test-Path $NodeModulesDir) {
        Write-Host "✓ Found existing node_modules, skipping npm install" -ForegroundColor Cyan
        $SkipNpmInstall = $true
    } else {
        $SkipNpmInstall = $false
    }

    # Install Node.js dependencies if needed
    if (-not $SkipNpmInstall) {
        Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
        try {
            npm install --silent --fetch-retries 3 --fetch-retry-maxtimeout 120000
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Node.js dependencies installed successfully" -ForegroundColor Green
            } else {
                Write-Warning "npm install completed with warnings. Attempting to continue..."
            }
        } catch {
            Write-Error "FAIL: Failed to install Node.js dependencies. Please check your Node.js installation and internet connection."
            exit 1
        }
    }

    # Start backend
    Write-Host "=== Starting Backend Server ===" -ForegroundColor Green
    $BackendDir = Join-Path $AppRoot "backend"
    Set-Location $BackendDir

    $BackendCmd = if ($DevMode) {
        "python -m uvicorn app.main:app --host 127.0.0.1 --port $BackendPort --reload"
    } else {
        "python -m uvicorn app.main:app --host 127.0.0.1 --port $BackendPort"
    }

    Write-Host "Backend command: $BackendCmd" -ForegroundColor Gray
    $BackendJob = Start-Job -ScriptBlock {
        param($Dir, $Cmd, $VenvActivate)
        Set-Location $Dir
        & $VenvActivate
        Invoke-Expression $Cmd
    } -ArgumentList $BackendDir, $BackendCmd, $ActivateScript

    if ($BackendJob) {
        Write-Host "✓ Backend started (Job ID: $($BackendJob.Id))" -ForegroundColor Green
    } else {
        Write-Error "FAIL: Failed to start backend server"
        exit 1
    }

    # Build or start frontend
    Write-Host "=== Starting Frontend Server ===" -ForegroundColor Green
    Set-Location $FrontendDir
    
    if ($Preview) {
        # Check if we can use prebuilt version
        if (Test-Path $DistDir) {
            Write-Host "Using prebuilt frontend from dist/" -ForegroundColor Cyan
            $FrontendJob = Start-Job -ScriptBlock {
                param($Dir, $Port)
                Set-Location $Dir
                npx serve -s dist -l $Port --single
            } -ArgumentList $FrontendDir, $FrontendPort
        } elseif (Test-Path $BuildDir) {
            Write-Host "Using prebuilt frontend from build/" -ForegroundColor Cyan
            $FrontendJob = Start-Job -ScriptBlock {
                param($Dir, $Port)
                Set-Location $Dir
                npx serve -s build -l $Port --single
            } -ArgumentList $FrontendDir, $FrontendPort
        } else {
            Write-Host "Building frontend for preview..." -ForegroundColor Yellow
            try {
                npm run build
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✓ Frontend built successfully" -ForegroundColor Green
                    $FrontendJob = Start-Job -ScriptBlock {
                        param($Dir, $Port)
                        Set-Location $Dir
                        if (Test-Path "dist") {
                            npx serve -s dist -l $Port --single
                        } else {
                            npx serve -s build -l $Port --single
                        }
                    } -ArgumentList $FrontendDir, $FrontendPort
                } else {
                    throw "Frontend build failed"
                }
            } catch {
                Write-Error "FAIL: Frontend build failed. Check Node.js installation and project configuration."
                Stop-Job $BackendJob -PassThru | Remove-Job
                exit 1
            }
        }
    } else {
        Write-Host "Starting frontend development server..." -ForegroundColor Yellow
        $FrontendJob = Start-Job -ScriptBlock {
            param($Dir, $Port)
            Set-Location $Dir
            npm run dev -- --host --port $Port
        } -ArgumentList $FrontendDir, $FrontendPort
    }

    if ($FrontendJob) {
        Write-Host "✓ Frontend started (Job ID: $($FrontendJob.Id))" -ForegroundColor Green
    } else {
        Write-Error "FAIL: Failed to start frontend server"
        Stop-Job $BackendJob -PassThru | Remove-Job
        exit 1
    }

    # Wait for services to start
    Write-Host "=== Service Health Checks ===" -ForegroundColor Yellow
    Write-Host "Waiting for services to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 5

    # Health check URLs
    $BackendHealthUrl = "http://localhost:$BackendPort/health"
    $BackendDocsUrl = "http://localhost:$BackendPort/docs"
    $BackendApiUrl = "http://localhost:$BackendPort/api/v1/run-history/summary"
    $FrontendUrl = "http://localhost:$FrontendPort"

    # Check backend health
    $BackendHealthy = $false
    for ($i = 1; $i -le 6; $i++) {
        try {
            $null = Invoke-WebRequest -Uri $BackendHealthUrl -TimeoutSec 5 -UseBasicParsing
            $BackendHealthy = $true
            Write-Host "✓ Backend health check passed (attempt $i/6)" -ForegroundColor Green
            break
        } catch {
            Write-Host "⚠ Backend health check failed (attempt $i/6) - retrying..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }

    # Check frontend accessibility
    $FrontendHealthy = $false
    for ($i = 1; $i -le 6; $i++) {
        try {
            $null = Invoke-WebRequest -Uri $FrontendUrl -TimeoutSec 5 -UseBasicParsing
            $FrontendHealthy = $true
            Write-Host "✓ Frontend accessibility check passed (attempt $i/6)" -ForegroundColor Green
            break
        } catch {
            Write-Host "⚠ Frontend accessibility check failed (attempt $i/6) - retrying..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }

    # Log final status
    Write-Host "=== Startup Summary ===" -ForegroundColor Cyan
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host "Backend Job ID: $($BackendJob.Id)" -ForegroundColor Gray
    Write-Host "Frontend Job ID: $($FrontendJob.Id)" -ForegroundColor Gray
    Write-Host "Backend Port: $BackendPort" -ForegroundColor Gray
    Write-Host "Frontend Port: $FrontendPort" -ForegroundColor Gray
    
    if ($BackendHealthy) {
        Write-Host "✓ Backend: http://localhost:$BackendPort" -ForegroundColor Green
        Write-Host "✓ API Docs: http://localhost:$BackendPort/docs" -ForegroundColor Green
    } else {
        Write-Warning "⚠ Backend may not be responding at http://localhost:$BackendPort"
    }
    
    if ($FrontendHealthy) {
        Write-Host "✓ Frontend: $FrontendUrl" -ForegroundColor Green
    } else {
        Write-Warning "⚠ Frontend may not be responding at $FrontendUrl"
    }

    # Open browser
    if (-not $SkipBrowser -and $FrontendHealthy) {
        Write-Host "Opening browser..." -ForegroundColor Cyan
        Start-Sleep -Seconds 2
        try {
            Start-Process $FrontendUrl
            Write-Host "✓ Browser opened" -ForegroundColor Green
        } catch {
            Write-Warning "Could not open browser automatically. Please navigate to: $FrontendUrl"
        }
    }

    Write-Host "" -ForegroundColor White
    Write-Host "=== IntelliLab GC Started Successfully ===" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor White

    # Keep script running and monitor jobs
    try {
        $LastStatusCheck = Get-Date
        while ($true) {
            Start-Sleep -Seconds 1
            
            # Check job status every 30 seconds
            if ((Get-Date) - $LastStatusCheck -gt [TimeSpan]::FromSeconds(30)) {
                if ($BackendJob.State -eq "Failed") {
                    Write-Error "Backend job failed unexpectedly"
                    break
                }
                if ($FrontendJob.State -eq "Failed") {
                    Write-Error "Frontend job failed unexpectedly"
                    break
                }
                $LastStatusCheck = Get-Date
            }
        }
    } catch {
        Write-Host "Shutting down services..." -ForegroundColor Yellow
    } finally {
        # Cleanup jobs
        Write-Host "Cleaning up background jobs..." -ForegroundColor Gray
        if ($BackendJob) {
            Stop-Job $BackendJob -PassThru | Remove-Job
            Write-Host "✓ Backend job stopped" -ForegroundColor Gray
        }
        if ($FrontendJob) {
            Stop-Job $FrontendJob -PassThru | Remove-Job
            Write-Host "✓ Frontend job stopped" -ForegroundColor Gray
        }
        Write-Host "=== Services stopped ===" -ForegroundColor Red
        Write-Host "Final timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    }

} catch {
    Write-Error "CRITICAL ERROR during startup: $($_.Exception.Message)"
    Write-Host "Cleaning up any started jobs..." -ForegroundColor Red
    if ($BackendJob) { Stop-Job $BackendJob -PassThru | Remove-Job }
    if ($FrontendJob) { Stop-Job $FrontendJob -PassThru | Remove-Job }
    exit 1
} finally {
    Stop-Transcript
}
