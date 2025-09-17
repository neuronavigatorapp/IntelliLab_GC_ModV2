#!/usr/bin/env pwsh
<#
.SYNOPSIS
    IntelliLab GC Single Startup Script - Enterprise Production Launch
    
.DESCRIPTION
    Bulletproof startup script that launches all IntelliLab GC services:
    - Backend API (FastAPI with Uvicorn)
    - Frontend React Development Server 
    - AI Analytics Server
    
    Includes comprehensive error handling, dependency validation, 
    and graceful shutdown capabilities for production environments.

.PARAMETER Mode
    Startup mode: 'dev' for development, 'prod' for production
    
.PARAMETER Port
    Override default backend port (8000)
    
.PARAMETER AIPort  
    Override default AI server port (8001)
    
.PARAMETER FrontendPort
    Override default frontend port (3000)
    
.EXAMPLE
    .\start_intellilab_gc.ps1
    
.EXAMPLE
    .\start_intellilab_gc.ps1 -Mode prod -Port 80 -AIPort 8001
#>

param(
    [ValidateSet('dev', 'prod')]
    [string]$Mode = 'dev',
    
    [ValidateRange(1024, 65535)]
    [int]$Port = 8000,
    
    [ValidateRange(1024, 65535)]  
    [int]$AIPort = 8001,
    
    [ValidateRange(1024, 65535)]
    [int]$FrontendPort = 3000,
    
    [switch]$SkipDependencyCheck,
    [switch]$Verbose
)

# ========================= BULLETPROOF ENTERPRISE CONFIGURATION =========================

$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"

# Global configuration
$Script:Config = @{
    WorkspaceRoot = $PSScriptRoot
    PythonVenv = Join-Path $PSScriptRoot "venv\Scripts\python.exe" 
    BackendDir = Join-Path $PSScriptRoot "backend"
    FrontendDir = Join-Path $PSScriptRoot "frontend"
    LogDir = Join-Path $PSScriptRoot "logs"
    Mode = $Mode
    Ports = @{
        Backend = $Port
        AI = $AIPort
        Frontend = $FrontendPort
    }
    ProcessIds = @()
    StartTime = Get-Date
}

# Logging configuration
$Script:LogFile = Join-Path $Script:Config.LogDir "startup_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# ========================= BULLETPROOF LOGGING INFRASTRUCTURE =========================

function Write-Log {
    param(
        [Parameter(Mandatory)]
        [string]$Message,
        
        [ValidateSet('INFO', 'WARN', 'ERROR', 'SUCCESS')]
        [string]$Level = 'INFO',
        
        [switch]$Console
    )
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Ensure log directory exists
    if (!(Test-Path $Script:Config.LogDir)) {
        New-Item -ItemType Directory -Path $Script:Config.LogDir -Force | Out-Null
    }
    
    # Write to log file
    Add-Content -Path $Script:LogFile -Value $logEntry -Encoding UTF8
    
    # Console output with colors
    if ($Console -or $Verbose) {
        switch ($Level) {
            'SUCCESS' { Write-Host $logEntry -ForegroundColor Green }
            'WARN'    { Write-Host $logEntry -ForegroundColor Yellow }
            'ERROR'   { Write-Host $logEntry -ForegroundColor Red }
            default   { Write-Host $logEntry -ForegroundColor White }
        }
    }
}

function Write-Banner {
    param([string]$Title)
    
    $banner = @"
===============================================================================
    $Title
===============================================================================
"@
    Write-Log $banner -Level INFO -Console
}

# ========================= DEPENDENCY VALIDATION SYSTEM =========================

function Test-Prerequisites {
    Write-Log "Validating system prerequisites..." -Level INFO -Console
    
    $prerequisites = @(
        @{ Name = "Python Virtual Environment"; Path = $Script:Config.PythonVenv; Type = "File" },
        @{ Name = "Backend Directory"; Path = $Script:Config.BackendDir; Type = "Directory" },
        @{ Name = "Frontend Directory"; Path = $Script:Config.FrontendDir; Type = "Directory" },
        @{ Name = "Backend Main Module"; Path = Join-Path $Script:Config.BackendDir "main.py"; Type = "File" }
    )
    
    $missing = @()
    foreach ($prereq in $prerequisites) {
        if ($prereq.Type -eq "File" -and !(Test-Path $prereq.Path -PathType Leaf)) {
            $missing += $prereq.Name
        } elseif ($prereq.Type -eq "Directory" -and !(Test-Path $prereq.Path -PathType Container)) {
            $missing += $prereq.Name  
        } else {
            Write-Log "✓ $($prereq.Name)" -Level SUCCESS -Console
        }
    }
    
    if ($missing) {
        throw "Missing prerequisites: $($missing -join ', ')"
    }
}

function Test-PortAvailability {
    Write-Log "Checking port availability..." -Level INFO -Console
    
    $ports = @($Script:Config.Ports.Backend, $Script:Config.Ports.AI, $Script:Config.Ports.Frontend)
    $busyPorts = @()
    
    foreach ($port in $ports) {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            $busyPorts += $port
        } else {
            Write-Log "✓ Port $port available" -Level SUCCESS -Console
        }
    }
    
    if ($busyPorts) {
        Write-Log "Ports in use: $($busyPorts -join ', ')" -Level WARN -Console
        $response = Read-Host "Continue anyway? Processes may fail to start (y/N)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            throw "Startup cancelled due to port conflicts"
        }
    }
}

function Test-PythonEnvironment {
    Write-Log "Validating Python environment..." -Level INFO -Console
    
    try {
        $pythonVersion = & $Script:Config.PythonVenv --version 2>&1
        Write-Log "✓ Python version: $pythonVersion" -Level SUCCESS -Console
        
        # Test critical Python packages
        $packages = @("fastapi", "uvicorn", "pydantic", "numpy", "pandas")
        foreach ($package in $packages) {
            $result = & $Script:Config.PythonVenv -c "import $package; print('$package: ' + ${package}.__version__)" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✓ $result" -Level SUCCESS -Console
            } else {
                throw "Missing Python package: $package"
            }
        }
    } catch {
        throw "Python environment validation failed: $($_.Exception.Message)"
    }
}

function Test-NodeEnvironment {
    Write-Log "Validating Node.js environment..." -Level INFO -Console
    
    try {
        $nodeVersion = node --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ Node.js version: $nodeVersion" -Level SUCCESS -Console
        } else {
            Write-Log "Node.js not found - frontend may not be available" -Level WARN -Console
        }
        
        # Check for package.json in frontend
        $packageJson = Join-Path $Script:Config.FrontendDir "package.json"
        if (Test-Path $packageJson) {
            Write-Log "✓ Frontend package.json found" -Level SUCCESS -Console
        } else {
            Write-Log "Frontend package.json missing - frontend will not start" -Level WARN -Console
        }
    } catch {
        Write-Log "Node.js validation failed: $($_.Exception.Message)" -Level WARN -Console
    }
}

# ========================= SERVICE STARTUP ORCHESTRATION =========================

function Start-BackendService {
    Write-Log "Starting IntelliLab GC Backend API..." -Level INFO -Console
    
    try {
        $env:PYTHONPATH = $Script:Config.BackendDir
        
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = $Script:Config.PythonVenv
        $startInfo.Arguments = "-m uvicorn main:app --host 0.0.0.0 --port $($Script:Config.Ports.Backend) --reload"
        $startInfo.WorkingDirectory = $Script:Config.BackendDir
        $startInfo.UseShellExecute = $false
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true
        $startInfo.CreateNoWindow = $true
        
        $process = [System.Diagnostics.Process]::Start($startInfo)
        $Script:Config.ProcessIds += @{ Name = "Backend"; Process = $process; Port = $Script:Config.Ports.Backend }
        
        Write-Log "Backend API started (PID: $($process.Id)) on port $($Script:Config.Ports.Backend)" -Level SUCCESS -Console
        
        # Wait for backend to be ready
        Start-Sleep -Seconds 3
        return $process
        
    } catch {
        Write-Log "Failed to start backend service: $($_.Exception.Message)" -Level ERROR -Console
        throw
    }
}

function Start-AIService {
    Write-Log "Starting AI Analytics Server..." -Level INFO -Console
    
    try {
        # Check if AI analytics server exists
        $aiServerPath = Join-Path $PSScriptRoot "ai_analytics_flask.py"
        if (!(Test-Path $aiServerPath)) {
            Write-Log "AI server script not found - skipping AI service" -Level WARN -Console
            return $null
        }
        
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = $Script:Config.PythonVenv
        $startInfo.Arguments = "$aiServerPath --port $($Script:Config.Ports.AI)"
        $startInfo.WorkingDirectory = $PSScriptRoot
        $startInfo.UseShellExecute = $false
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true  
        $startInfo.CreateNoWindow = $true
        
        $process = [System.Diagnostics.Process]::Start($startInfo)
        $Script:Config.ProcessIds += @{ Name = "AI Server"; Process = $process; Port = $Script:Config.Ports.AI }
        
        Write-Log "AI Analytics Server started (PID: $($process.Id)) on port $($Script:Config.Ports.AI)" -Level SUCCESS -Console
        return $process
        
    } catch {
        Write-Log "Failed to start AI service: $($_.Exception.Message)" -Level ERROR -Console
        throw
    }
}

function Start-FrontendService {
    Write-Log "Starting React Frontend Development Server..." -Level INFO -Console
    
    try {
        # Check if Node.js and package.json exist
        $nodeAvailable = Get-Command node -ErrorAction SilentlyContinue
        $packageJson = Join-Path $Script:Config.FrontendDir "package.json"
        
        if (!$nodeAvailable -or !(Test-Path $packageJson)) {
            Write-Log "Node.js or package.json not available - skipping frontend" -Level WARN -Console
            return $null
        }
        
        # Install dependencies if node_modules doesn't exist
        $nodeModules = Join-Path $Script:Config.FrontendDir "node_modules"
        if (!(Test-Path $nodeModules)) {
            Write-Log "Installing frontend dependencies..." -Level INFO -Console
            Push-Location $Script:Config.FrontendDir
            npm install
            Pop-Location
        }
        
        $env:PORT = $Script:Config.Ports.Frontend
        
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "npm"
        $startInfo.Arguments = "start"
        $startInfo.WorkingDirectory = $Script:Config.FrontendDir
        $startInfo.UseShellExecute = $false
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true
        $startInfo.CreateNoWindow = $true
        
        $process = [System.Diagnostics.Process]::Start($startInfo)
        $Script:Config.ProcessIds += @{ Name = "Frontend"; Process = $process; Port = $Script:Config.Ports.Frontend }
        
        Write-Log "Frontend server started (PID: $($process.Id)) on port $($Script:Config.Ports.Frontend)" -Level SUCCESS -Console
        return $process
        
    } catch {
        Write-Log "Failed to start frontend service: $($_.Exception.Message)" -Level ERROR -Console
        throw
    }
}

# ========================= SERVICE HEALTH MONITORING =========================

function Test-ServiceHealth {
    param([int]$TimeoutSeconds = 30)
    
    Write-Log "Performing health checks..." -Level INFO -Console
    
    $healthChecks = @()
    
    # Backend health check
    for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($Script:Config.Ports.Backend)/health" -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                Write-Log "✓ Backend API health check passed" -Level SUCCESS -Console
                $healthChecks += "Backend"
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    
    # AI Server health check
    for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($Script:Config.Ports.AI)/health" -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                Write-Log "✓ AI Server health check passed" -Level SUCCESS -Console
                $healthChecks += "AI Server"
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    
    # Frontend health check (if running)
    $frontendProcess = $Script:Config.ProcessIds | Where-Object { $_.Name -eq "Frontend" }
    if ($frontendProcess) {
        for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$($Script:Config.Ports.Frontend)" -TimeoutSec 2
                if ($response.StatusCode -eq 200) {
                    Write-Log "✓ Frontend health check passed" -Level SUCCESS -Console
                    $healthChecks += "Frontend"
                    break
                }
            } catch {
                Start-Sleep -Seconds 1
            }
        }
    }
    
    return $healthChecks
}

# ========================= GRACEFUL SHUTDOWN SYSTEM =========================

function Stop-AllServices {
    Write-Log "Initiating graceful shutdown..." -Level INFO -Console
    
    foreach ($service in $Script:Config.ProcessIds) {
        if ($service.Process -and !$service.Process.HasExited) {
            try {
                Write-Log "Stopping $($service.Name) (PID: $($service.Process.Id))..." -Level INFO -Console
                $service.Process.Kill()
                $service.Process.WaitForExit(5000)
                Write-Log "✓ $($service.Name) stopped" -Level SUCCESS -Console
            } catch {
                Write-Log "Failed to stop $($service.Name): $($_.Exception.Message)" -Level WARN -Console
            }
        }
    }
}

function Register-ShutdownHandler {
    # Register Ctrl+C handler
    $null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
        Stop-AllServices
    }
    
    # Capture Ctrl+C
    [Console]::CancelKeyPress += {
        param($eventSender, $eventArgs)
        $eventArgs.Cancel = $true
        Write-Log "Shutdown signal received..." -Level INFO -Console  
        Stop-AllServices
        exit 0
    }
}

# ========================= MAIN ORCHESTRATION LOGIC =========================

function Start-IntelliLabGC {
    try {
        Write-Banner "IntelliLab GC Enterprise Startup - v1.0"
        Write-Log "Starting IntelliLab GC in $($Script:Config.Mode) mode..." -Level INFO -Console
        Write-Log "Workspace: $($Script:Config.WorkspaceRoot)" -Level INFO -Console
        Write-Log "Log file: $Script:LogFile" -Level INFO -Console
        
        # Register cleanup handlers
        Register-ShutdownHandler
        
        # Dependency validation (unless skipped)
        if (!$SkipDependencyCheck) {
            Test-Prerequisites
            Test-PortAvailability
            Test-PythonEnvironment
            Test-NodeEnvironment
        } else {
            Write-Log "Skipping dependency checks as requested" -Level WARN -Console
        }
        
        # Start all services
        Write-Log "Starting services..." -Level INFO -Console
        
        Start-BackendService | Out-Null
        Start-Sleep -Seconds 2
        
        Start-AIService | Out-Null
        Start-Sleep -Seconds 2
        
        Start-FrontendService | Out-Null
        Start-Sleep -Seconds 3
        
        # Perform health checks
        $healthyServices = Test-ServiceHealth -TimeoutSeconds 30
        
        # Display startup summary
        Write-Banner "IntelliLab GC Startup Complete"
        Write-Log "Services started: $($healthyServices -join ', ')" -Level SUCCESS -Console
        Write-Log "Backend API: http://localhost:$($Script:Config.Ports.Backend)" -Level INFO -Console
        Write-Log "API Documentation: http://localhost:$($Script:Config.Ports.Backend)/docs" -Level INFO -Console
        
        if ($Script:Config.ProcessIds | Where-Object { $_.Name -eq "AI Server" }) {
            Write-Log "AI Analytics: http://localhost:$($Script:Config.Ports.AI)" -Level INFO -Console
        }
        
        if ($Script:Config.ProcessIds | Where-Object { $_.Name -eq "Frontend" }) {
            Write-Log "Frontend App: http://localhost:$($Script:Config.Ports.Frontend)" -Level INFO -Console
        }
        
        Write-Log "Press Ctrl+C to stop all services" -Level INFO -Console
        Write-Log "Log file: $Script:LogFile" -Level INFO -Console
        
        # Keep script running until Ctrl+C
        try {
            while ($true) {
                Start-Sleep -Seconds 5
                
                # Check if any processes have died
                $deadServices = @()
                foreach ($service in $Script:Config.ProcessIds) {
                    if ($service.Process.HasExited) {
                        $deadServices += $service.Name
                    }
                }
                
                if ($deadServices) {
                    Write-Log "Services died: $($deadServices -join ', ')" -Level ERROR -Console
                    break
                }
            }
        } catch {
            Write-Log "Monitoring loop interrupted" -Level INFO -Console
        }
        
    } catch {
        Write-Log "Startup failed: $($_.Exception.Message)" -Level ERROR -Console
        Write-Log "Stack trace: $($_.ScriptStackTrace)" -Level ERROR -Console
        exit 1
    } finally {
        Stop-AllServices
        Write-Log "IntelliLab GC shutdown complete" -Level INFO -Console
    }
}

# ========================= SCRIPT ENTRY POINT =========================

if ($MyInvocation.InvocationName -ne '.') {
    Start-IntelliLabGC
}